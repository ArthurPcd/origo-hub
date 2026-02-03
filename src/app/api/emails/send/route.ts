import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { getEmailTemplate, EmailType, EmailData } from "@/lib/email/templates";

// Initialize Resend only if API key is available (optional for build time)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Constant-time string comparison to prevent timing attacks
 * Uses crypto.timingSafeEqual for constant-time buffer comparison
 */
function secureCompare(a: string, b: string): boolean {
  try {
    // Ensure both strings are the same length to prevent length-based timing attacks
    if (a.length !== b.length) {
      return false;
    }

    // Convert strings to buffers for timing-safe comparison
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    // crypto.timingSafeEqual performs constant-time comparison
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;

    const supabase = await createClerkSupabaseClient();

    const body = await request.json();
    const { type, to, userName, briefCount, remainingBriefs } = body;

    if (!type || !to) {
      return NextResponse.json(
        { error: "Missing required fields: type, to" },
        { status: 400 }
      );
    }

    // Prevent email relay abuse: only allow sending to the authenticated user's own email
    if (to !== userEmail) {
      return NextResponse.json(
        { error: "Unauthorized: can only send emails to your own address" },
        { status: 403 }
      );
    }

    // Validate email type
    const validTypes: EmailType[] = ["welcome", "day3-reminder", "day7-upsell"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    }

    // Prepare email data
    const emailData: EmailData = {
      userName: userName || "there",
      userEmail: to,
      briefCount,
      remainingBriefs,
    };

    // Get email template
    const { subject, html } = await getEmailTemplate(type, emailData);

    // Send email via Resend
    if (!resend) {
      throw new Error("Email service not configured (RESEND_API_KEY missing)");
    }

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "ORIGO <noreply@origo.app>",
      to: [to],
      subject,
      html,
    });

    if (!result.data) {
      throw new Error("Failed to send email");
    }

    // Log email sent in database (optional)
    await supabase.from("email_logs").insert({
      user_id: userId,
      email_type: type,
      recipient_email: to,
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      messageId: result.data.id,
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Cron endpoint to send scheduled emails
 * Should be called by Vercel Cron or similar service
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Resend is configured
    if (!resend) {
      return NextResponse.json(
        { error: "Email service not configured (RESEND_API_KEY missing)" },
        { status: 500 }
      );
    }

    // Verify cron secret to prevent unauthorized access (using constant-time comparison)
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    if (!authHeader || !secureCompare(authHeader, expectedAuth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClerkSupabaseClient();

    // Get users who need emails
    const { data: users } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .gte(
        "created_at",
        new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      ); // Last 8 days

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    let sent = 0;

    for (const user of users) {
      const daysSinceCreation = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine which email to send
      let emailType: EmailType | null = null;
      if (daysSinceCreation === 0) emailType = "welcome";
      else if (daysSinceCreation === 3) emailType = "day3-reminder";
      else if (daysSinceCreation === 7) emailType = "day7-upsell";

      if (!emailType) continue;

      // Check if email already sent
      const { data: existingLog } = await supabase
        .from("email_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("email_type", emailType)
        .single();

      if (existingLog) continue; // Already sent

      // Get user's brief stats
      const { data: subscription } = await supabase
        .from("user_subscriptions")
        .select("brief_count")
        .eq("user_id", user.id)
        .single();

      const briefCount = subscription?.brief_count || 0;
      const remainingBriefs = Math.max(0, 3 - briefCount); // Free plan = 3 briefs

      // Send email
      const emailData: EmailData = {
        userName: user.full_name || undefined,
        userEmail: user.email,
        briefCount,
        remainingBriefs,
      };

      const { subject, html } = await getEmailTemplate(emailType, emailData);

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "ORIGO <noreply@origo.app>",
        to: [user.email],
        subject,
        html,
      });

      // Log email
      await supabase.from("email_logs").insert({
        user_id: user.id,
        email_type: emailType,
        recipient_email: user.email,
        sent_at: new Date().toISOString(),
      });

      sent++;
    }

    return NextResponse.json(
      { success: true, sent },
      { headers: { "Cache-Control": "no-cache, no-store" } }
    );
  } catch (error) {
    console.error("Cron email error:", error);
    return NextResponse.json(
      {
        error: "Failed to send scheduled emails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

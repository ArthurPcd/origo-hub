import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Rate limit by IP — 3 submissions per hour
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rl = await checkRateLimit(ip);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { name, email, company, teamSize, message } = await request.json();

    // Validation
    if (!name || !email || !company || !teamSize || !message) {
      throw new ApiError(400, "All fields are required", ErrorCodes.MISSING_FIELD);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "Invalid email address", ErrorCodes.INVALID_INPUT);
    }

    // Send email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.error(`[${requestId}] RESEND_API_KEY not configured`);
      throw new ApiError(
        500,
        "Email service not configured",
        ErrorCodes.SERVICE_UNAVAILABLE
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ORIGO Sales <sales@origo-beta.xyz>",
        to: ["origo.team.dev@gmail.com"],
        reply_to: email,
        subject: `Enterprise Inquiry from ${company}`,
        html: `
          <h2>New Enterprise Sales Inquiry</h2>
          <p><strong>From:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Company:</strong> ${escapeHtml(company)}</p>
          <p><strong>Team Size:</strong> ${escapeHtml(teamSize)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Sent from ORIGO Enterprise Contact Form<br>
            Reply directly to this email to respond to ${escapeHtml(name)}
          </p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error(`[${requestId}] Resend API error:`, emailResponse.status, errorData);
      throw new ApiError(500, "Failed to send email", ErrorCodes.EMAIL_ERROR, errorData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

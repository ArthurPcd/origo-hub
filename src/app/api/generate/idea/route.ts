import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { PLANS } from "@/lib/stripe";
import { checkGenerateRateLimit, addRateLimitHeaders } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/errors";
import { generateIdeaExpress } from "@/lib/multi-agent";
import { notifyBriefGenerated } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 5;

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // 1. Auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClerkSupabaseClient();

    // 2. Rate limit
    const rateLimitResult = await checkGenerateRateLimit(userId);
    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult, RATE_LIMIT_MAX);
      return NextResponse.json(
        {
          error: "Too many requests. Please wait before generating another brief.",
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429, headers }
      );
    }

    // 3. Parse + validate input
    const body = await request.json();
    const { idea, docType } = body;

    if (!idea || typeof idea !== "string" || idea.trim().length < 10) {
      return NextResponse.json(
        { error: "Please describe your idea (minimum 10 characters)" },
        { status: 400 }
      );
    }

    const sanitizedIdea = idea.trim().slice(0, 2000); // cap at 2000 chars
    const validDocTypes = ["presentation", "mvp", "poc", "devis", "brief"];
    const sanitizedDocType =
      typeof docType === "string" && validDocTypes.includes(docType)
        ? docType
        : "brief";

    // 4. Check subscription + brief limit
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("plan, brief_count")
      .eq("user_id", userId)
      .maybeSingle();

    const plan = subscription?.plan || "free";
    const currentCount = subscription?.brief_count || 0;
    const planConfig = PLANS[plan as keyof typeof PLANS];
    const briefLimit = planConfig?.briefs ?? 3;

    if (briefLimit !== -1 && currentCount >= briefLimit) {
      return NextResponse.json(
        {
          error: "Brief limit reached",
          limit: briefLimit,
          current: currentCount,
          plan,
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    const hasSubscription = !!subscription;

    // 5. API key
    const apiKey = process.env.ORIGO_CLAUDE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 }
      );
    }

    // 6. Generate 5-section document
    let content: string;
    try {
      content = await generateIdeaExpress(sanitizedIdea, plan, apiKey, sanitizedDocType);
    } catch (genError: any) {
      console.error("Idea Express generation error:", genError?.message);
      return NextResponse.json(
        { error: "AI generation failed. Please try again." },
        { status: 502 }
      );
    }

    // 7. Increment brief count atomically
    let newCount: number;
    if (hasSubscription) {
      const { data: result } = await supabase.rpc("increment_brief_count", {
        p_user_id: userId,
        p_limit: briefLimit,
      });

      if (result === -2) {
        return NextResponse.json(
          { error: "Brief limit reached", upgrade_required: true },
          { status: 403 }
        );
      }
      newCount = result ?? currentCount + 1;
    } else {
      await supabase.from("user_subscriptions").insert({
        user_id: userId,
        plan: "free",
        status: "active",
        brief_count: 1,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
      newCount = 1;
    }

    const remaining = briefLimit === -1 ? -1 : briefLimit - newCount;

    void notifyBriefGenerated(userId, plan);

    const headers = new Headers();
    addRateLimitHeaders(headers, rateLimitResult, RATE_LIMIT_MAX);

    return NextResponse.json({ content, briefCount: newCount, remaining }, { headers });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

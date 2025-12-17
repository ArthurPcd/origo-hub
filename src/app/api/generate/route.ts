import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { PLANS } from "@/lib/stripe";
import { checkGenerateRateLimit, addRateLimitHeaders } from "@/lib/rate-limit";
import { validateBriefPrompt } from "@/lib/validation";
import { ZodError } from "zod";
import { handleApiError } from "@/lib/errors";
import { generateByPlan } from "@/lib/multi-agent";
import { notifyBriefGenerated } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const RATE_LIMIT_MAX = 5; // used for response headers only

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // 1. Verify authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 2. Check rate limit (prevent API abuse)
    const rateLimitResult = await checkGenerateRateLimit(userId);

    if (!rateLimitResult.success) {
      const headers = new Headers();
      addRateLimitHeaders(headers, rateLimitResult, RATE_LIMIT_MAX);

      return NextResponse.json(
        {
          error: "Too many requests. Please wait before generating another brief.",
          retryAfter: rateLimitResult.retryAfter,
          resetTime: new Date(rateLimitResult.resetTime).toISOString(),
        },
        { status: 429, headers }
      );
    }

    const body = await request.json();

    // 3. Input validation and sanitization
    let sanitizedPrompt: string;
    try {
      sanitizedPrompt = validateBriefPrompt(body.prompt);
    } catch (validationErr) {
      if (validationErr instanceof ZodError) {
        const firstError = (validationErr as any).errors?.[0];
        return NextResponse.json(
          { error: firstError?.message || "Invalid prompt" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Invalid prompt" },
        { status: 400 }
      );
    }

    // 4. Get user subscription and check limits
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("plan, brief_count")
      .eq("user_id", userId)
      .maybeSingle();

    const plan = subscription?.plan || "free";
    const currentCount = subscription?.brief_count || 0;
    const planConfig = PLANS[plan as keyof typeof PLANS];
    const briefLimit = planConfig?.briefs ?? 3;

    // Check if user has reached their plan limit (-1 = unlimited)
    if (briefLimit !== -1 && currentCount >= briefLimit) {
      return NextResponse.json(
        {
          error: "Brief limit reached",
          limit: briefLimit,
          current: currentCount,
          plan,
          upgrade_required: true
        },
        { status: 403 }
      );
    }

    // Store subscription existence for use after generation
    const hasSubscription = !!subscription;

    // 5. Determine API key: free/starter/pro use ORIGO key, premium/enterprise use ORIGO key too
    const apiKey = process.env.ORIGO_CLAUDE_API_KEY;

    if (!apiKey) {
      console.error("ORIGO_CLAUDE_API_KEY not configured");
      return NextResponse.json(
        { error: "Service configuration error" },
        { status: 500 }
      );
    }

    // 6. Generate brief via multi-agent dispatch (plan-based)
    let content: string;
    try {
      content = await generateByPlan(sanitizedPrompt, plan, apiKey);
    } catch (genError: any) {
      console.error("Multi-agent generation error:", genError?.message);
      return NextResponse.json(
        { error: "AI generation failed. Please try again." },
        { status: 502 }
      );
    }

    // 7. Atomically increment brief count using DB function (prevents race conditions)
    let newCount: number;
    if (hasSubscription) {
      const { data: result } = await supabase
        .rpc("increment_brief_count", { p_user_id: userId, p_limit: briefLimit });

      // -2 means limit was reached by a concurrent request between our check and now
      if (result === -2) {
        return NextResponse.json(
          {
            error: "Brief limit reached",
            limit: briefLimit,
            current: currentCount,
            plan,
            upgrade_required: true
          },
          { status: 403 }
        );
      }

      newCount = result ?? currentCount + 1;
    } else {
      // First brief ever — create free subscription row
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

    // Fire-and-forget Telegram notification
    void notifyBriefGenerated(userId, plan);

    // Add rate limit headers to successful response
    const headers = new Headers();
    addRateLimitHeaders(headers, rateLimitResult, RATE_LIMIT_MAX);

    return NextResponse.json(
      {
        content,
        briefCount: newCount,
        remaining,
      },
      { headers }
    );
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

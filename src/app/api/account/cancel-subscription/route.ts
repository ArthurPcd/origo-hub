import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { stripe } from "@/lib/stripe-server";
import { validateCSRFToken } from "@/lib/csrf";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new ApiError(401, "Not authenticated", ErrorCodes.UNAUTHORIZED);
    }

    const supabase = await createClerkSupabaseClient();

    // CSRF Protection: Validate token to prevent cross-site request forgery
    const body = await request.json();
    const { csrfToken } = body;

    const isValidToken = await validateCSRFToken(csrfToken);
    if (!isValidToken) {
      throw new ApiError(
        403,
        "Invalid security token. Please refresh the page and try again.",
        ErrorCodes.INVALID_CSRF_TOKEN
      );
    }

    // Get user's subscription
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    if (!subscription?.stripe_subscription_id) {
      throw new ApiError(
        400,
        "No active subscription found",
        ErrorCodes.RESOURCE_NOT_FOUND
      );
    }

    // Cancel at end of billing period
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Update status in DB
    await supabase
      .from("user_subscriptions")
      .update({ status: "canceling" })
      .eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

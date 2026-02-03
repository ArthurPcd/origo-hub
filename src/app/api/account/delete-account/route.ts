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

    // If user has an active Stripe subscription, cancel it immediately
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    if (subscription?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      } catch (stripeError) {
        console.error("Stripe cancel error (continuing):", stripeError);
      }
    }

    // Delete user's briefs
    await supabase
      .from("briefs")
      .delete()
      .eq("user_id", userId);

    // Delete user's subscription record
    await supabase
      .from("user_subscriptions")
      .delete()
      .eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

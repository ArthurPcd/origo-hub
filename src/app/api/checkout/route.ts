import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { stripe } from "@/lib/stripe-server";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";
import { checkCheckoutRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { priceId } = await request.json();

    // Validate priceId against whitelist of known plan price IDs
    const ALLOWED_PRICE_IDS = [
      process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
      process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
      process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    ].filter(Boolean);

    if (!priceId || typeof priceId !== "string" || !ALLOWED_PRICE_IDS.includes(priceId)) {
      throw new ApiError(400, "Invalid price ID", ErrorCodes.INVALID_INPUT);
    }

    // Auth must be checked before rate limiting to avoid burning rate limit tokens
    // on unauthenticated requests
    const { userId } = await auth();
    if (!userId) {
      throw new ApiError(401, "Please log in to subscribe", ErrorCodes.UNAUTHORIZED);
    }

    const supabase = await createClerkSupabaseClient();

    // Rate limit checkout attempts (only for authenticated users)
    const rateLimit = await checkCheckoutRateLimit(userId);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    // Get or create Stripe customer
    let customerId: string;
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id;
    } else {
      // Only fetch Clerk user when we actually need the email for customer creation
      const clerkUser = await currentUser();
      const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;

      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      });
      customerId = customer.id;

      // Save customer ID to DB; log on failure but don't abort the checkout
      const { error: upsertError } = await supabase
        .from("user_subscriptions")
        .upsert(
          { user_id: userId, stripe_customer_id: customerId },
          { onConflict: "user_id" }
        );

      if (upsertError) {
        console.error(`[checkout] Failed to persist stripe_customer_id for user ${userId}:`, upsertError.message);
      }
    }

    // Validate and get origin
    const requestOrigin = request.headers.get("origin");
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      "http://localhost:3000",
    ].filter(Boolean) as string[];

    const origin = requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0] || "http://localhost:3000";

    // Create Embedded Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      ui_mode: "embedded",
      return_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        userId,
      },
    });

    if (!session.client_secret) {
      throw new ApiError(
        500,
        "Failed to create checkout session",
        ErrorCodes.STRIPE_ERROR
      );
    }

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

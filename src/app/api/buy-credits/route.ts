import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import Stripe from "stripe";
import { isValidCreditPackage } from "@/lib/validation";
import { handleApiError, ApiError, ErrorCodes } from "@/lib/errors";
import { checkCheckoutRateLimit } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

// SECURITY: Server-side credit packages to prevent price manipulation (EUR)
const CREDIT_PACKAGES: Record<number, number> = {
  5: 5,      // 5 credits = €5 (€1.00/credit)
  10: 9,     // 10 credits = €9 (€0.90/credit - 10% discount)
  25: 20,    // 25 credits = €20 (€0.80/credit - 20% discount)
  50: 35,    // 50 credits = €35 (€0.70/credit - 30% discount)
  100: 60,   // 100 credits = €60 (€0.60/credit - 40% discount, best value)
};

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();

    if (!userId) {
      throw new ApiError(401, "Please log in to purchase credits", ErrorCodes.UNAUTHORIZED);
    }

    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;

    const supabase = await createClerkSupabaseClient();

    // Rate limit credit purchase attempts
    const rateLimit = await checkCheckoutRateLimit(userId);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    const { credits } = await request.json();

    // Validate credits is a valid package (type-safe)
    if (!isValidCreditPackage(credits)) {
      throw new ApiError(
        400,
        "Invalid credit package. Please select a valid amount.",
        ErrorCodes.INVALID_INPUT
      );
    }

    // Get amount from server-side configuration (NEVER trust client)
    const amount = CREDIT_PACKAGES[credits];

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
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId,
        },
      });
      customerId = customer.id;

      // Update subscription with customer ID
      await supabase
        .from("user_subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", userId);
    }

    // Create Stripe checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${credits} Origo AI Credits`,
              description: `${credits} crédits additionnels pour votre compte Origo`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?credits_purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
      metadata: {
        user_id: userId,
        credits: credits.toString(),
        type: "credit_purchase",
      },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

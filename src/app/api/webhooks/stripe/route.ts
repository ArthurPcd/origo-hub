import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { ApiError, ErrorCodes } from "@/lib/errors";
import { notifyPayment } from "@/lib/telegram";

export const dynamic = "force-dynamic";

function getPlanFromPriceId(priceId: string): string {
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID) {
    return "starter";
  } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
    return "pro";
  } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID) {
    return "premium";
  }
  return "free";
}

function resolveSubscriptionStatus(status: string): string {
  const knownStatuses = ["active", "canceled", "past_due", "incomplete", "incomplete_expired", "trialing", "unpaid", "paused"];
  return knownStatuses.includes(status) ? status : status;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  console.log(`[${requestId}] Stripe webhook received`);

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Initialize Supabase client (needed for idempotency check and event processing)
  const supabase = await createClient();

  try {
    // Check if event already processed (idempotency)
    const { data: existingEvent } = await supabase
      .from("webhook_events")
      .select("id, status")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed with status: ${existingEvent.status}`);
      return NextResponse.json({ received: true, status: "already_processed" });
    }

    // Store event as pending before processing
    await supabase.from("webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      status: "pending",
      payload: event,
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id || session.metadata?.userId;

        if (!userId) break;

        // Check if this is a credit purchase (one-time payment)
        if (session.mode === "payment" && session.metadata?.type === "credit_purchase") {
          const credits = parseInt(session.metadata.credits || "0");

          if (credits > 0) {
            // Atomic credit addition (prevents race conditions from duplicate webhooks)
            await supabase.rpc("add_credits_atomic", {
              p_user_id: userId,
              p_credits: credits,
            });

            console.log(`Added ${credits} credits to user ${userId}`);
            void notifyPayment(userId, session.amount_total ?? 0, session.currency ?? 'usd', `${credits} credits`);
          }
          break;
        }

        // Handle subscription checkout
        if (!session.subscription) break;

        let subscription: Stripe.Subscription;
        try {
          subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          ) as Stripe.Subscription;
        } catch (stripeErr) {
          console.error(`Failed to retrieve subscription ${session.subscription}:`, stripeErr);
          // Return 500 so Stripe retries the webhook
          throw new Error(`Stripe subscription retrieval failed: ${session.subscription}`);
        }

        const subItem = subscription.items.data[0];
        const priceId = subItem?.price.id || "";
        const plan = getPlanFromPriceId(priceId);

        // Update subscription in DB
        await supabase
          .from("user_subscriptions")
          .update({
            plan,
            stripe_subscription_id: subscription.id,
            status: resolveSubscriptionStatus(subscription.status),
            current_period_start: subItem
              ? new Date(subItem.current_period_start * 1000).toISOString()
              : new Date().toISOString(),
            current_period_end: subItem
              ? new Date(subItem.current_period_end * 1000).toISOString()
              : new Date().toISOString(),
          })
          .eq("user_id", userId);

        void notifyPayment(userId, session.amount_total ?? 0, session.currency ?? 'usd', `Plan ${plan}`);

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get customer and find user
        const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
        const userId = customer.metadata?.userId;

        if (!userId) break;

        const subItem = subscription.items.data[0];
        const priceId = subItem?.price.id || "";
        const plan = getPlanFromPriceId(priceId);

        await supabase
          .from("user_subscriptions")
          .update({
            plan,
            status: resolveSubscriptionStatus(subscription.status),
            current_period_start: subItem
              ? new Date(subItem.current_period_start * 1000).toISOString()
              : new Date().toISOString(),
            current_period_end: subItem
              ? new Date(subItem.current_period_end * 1000).toISOString()
              : new Date().toISOString(),
          })
          .eq("user_id", userId);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
        const userId = customer.metadata?.userId;

        if (!userId) break;

        // Downgrade to free plan
        await supabase
          .from("user_subscriptions")
          .update({
            plan: "free",
            status: "canceled",
          })
          .eq("user_id", userId);

        break;
      }
    }

    // Mark event as successfully processed
    await supabase
      .from("webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
      })
      .eq("stripe_event_id", event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);

    // Mark event as failed
    try {
      await supabase
        .from("webhook_events")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          processed_at: new Date().toISOString(),
        })
        .eq("stripe_event_id", event.id);
    } catch (updateError) {
      console.error("Failed to update webhook event status:", updateError);
    }

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

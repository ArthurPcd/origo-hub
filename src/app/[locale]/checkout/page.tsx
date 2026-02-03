"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useTranslations } from "next-intl";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("checkout");
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const priceId = searchParams.get("priceId");

    if (!priceId) {
      setError(t("errors.noPlan"));
      return;
    }

    // Create checkout session
    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(t("errors.failed"));
        }
      })
      .catch(() => {
        setError(t("errors.network"));
      });
  }, [searchParams, t]);

  if (error) {
    // Check if error is authentication-related
    const isAuthError = error.toLowerCase().includes('authenticated') || error.toLowerCase().includes('unauthorized');

    if (isAuthError) {
      // Commercial message for non-authenticated users
      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-surface border border-edge rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {t("errors.authRequired")}
            </h2>
            <p className="text-muted mb-6">{t("errors.authRequiredDescription")}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/login?redirect=/checkout?" + searchParams.toString())}
                className="px-6 py-3 bg-accent hover:bg-accent-hover text-black rounded-lg text-sm font-semibold transition-all"
              >
                {t("errors.signIn")}
              </button>
              <button
                onClick={() => router.push("/signup?redirect=/checkout?" + searchParams.toString())}
                className="px-6 py-3 border border-edge hover:border-accent text-foreground rounded-lg text-sm font-semibold transition-all"
              >
                {t("errors.createAccount")}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Generic error display
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-surface border border-edge rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {t("errors.title")}
          </h2>
          <p className="text-muted mb-6">{error}</p>
          <button
            onClick={() => router.push("/pricing")}
            className="px-6 py-2 bg-accent hover:bg-accent-hover text-black rounded-lg text-sm font-semibold transition-all"
          >
            {t("backToPricing")}
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-edge border-t-accent" />
          <p className="text-muted text-sm">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            <h1 className="text-2xl font-bold text-foreground tracking-wider">
              {t("title")}
            </h1>
          </div>
          <p className="text-muted text-sm">{t("secureCheckout")}</p>
        </div>

        {/* Embedded Checkout */}
        <div className="bg-surface border border-edge rounded-2xl overflow-hidden shadow-lg">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-muted text-xs">
            {t("footer")}
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckoutFallback() {
  const t = useTranslations("checkout");
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-edge border-t-accent" />
        <p className="text-muted text-sm">{t("loading")}</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutContent />
    </Suspense>
  );
}

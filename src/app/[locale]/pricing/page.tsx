"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client-browser";
import { PLANS } from "@/lib/stripe";

export default function PricingPage() {
  const t = useTranslations('pricing');
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [currentPlan, setCurrentPlan] = useState<string>("free");

  // Feature keys for each plan (to use with translations)
  const freeFeatures = ['f1', 'f2', 'f3'];
  const starterFeatures = ['f1', 'f2', 'f3', 'f4', 'f5'];
  const proFeatures = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'];
  const premiumFeatures = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10'];
  const enterpriseFeatures = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9'];


  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    async function loadPlan() {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("plan")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (data) setCurrentPlan(data.plan);
    }
    loadPlan();
  }, [isLoaded, isSignedIn, user, supabase]);

  async function handleCheckout(priceId: string | undefined) {
    if (!priceId) return;

    if (!isSignedIn) {
      router.push(`/signup?redirect=/checkout&priceId=${priceId}`);
      return;
    }

    // User is logged in - proceed to checkout
    router.push(`/checkout?priceId=${priceId}`);
  }

  return (
    <div className="min-h-screen bg-grid py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-accent text-xs font-medium tracking-widest uppercase font-mono mb-3">Pricing</p>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t('title')}
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Plans grid 2x2 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-surface border border-edge rounded-2xl p-8 flex flex-col hover:border-accent/30 transition-colors">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {PLANS.free.name}
                </h3>
                <p className="text-muted text-sm mt-1">{t('free.description')}</p>
              </div>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-bold text-foreground">
                {t('free.price')}
              </span>
              <p className="text-muted text-sm mt-2">{t('free.period')}</p>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {freeFeatures.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-foreground text-sm">{t(`features.free.${key}`)}</span>
                </li>
              ))}
            </ul>

            {!isSignedIn ? (
              <button
                onClick={() => router.push("/signup")}
                className="w-full border border-edge hover:border-accent text-foreground py-3 rounded-lg text-sm font-semibold transition-all hover:bg-accent/5"
              >
                {t('free.cta')}
              </button>
            ) : currentPlan === "free" ? (
              <button
                disabled
                className="w-full bg-edge text-muted py-3 rounded-lg text-sm font-semibold cursor-not-allowed"
              >
                {t('free.currentPlan')}
              </button>
            ) : (
              <button
                onClick={() => router.push("/account")}
                className="w-full border border-edge hover:border-accent text-foreground py-3 rounded-lg text-sm font-semibold transition-all hover:bg-accent/5"
              >
                {t('free.downgrade')}
              </button>
            )}
          </div>

          {/* Starter Plan */}
          <div className="bg-surface border border-edge rounded-2xl p-8 flex flex-col hover:border-accent/30 transition-colors">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {PLANS.starter.name}
                </h3>
                <p className="text-muted text-sm mt-1">{t('starter.description')}</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-foreground">
                  ${PLANS.starter.price}
                </span>
                <span className="text-muted text-sm">{t('starter.period')}</span>
              </div>
              <p className="text-muted text-sm mt-2">{t('starter.billing')}</p>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {starterFeatures.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-foreground text-sm">{t(`features.starter.${key}`)}</span>
                </li>
              ))}
            </ul>

            {currentPlan === "starter" ? (
              <button
                disabled
                className="w-full bg-edge text-muted py-3 rounded-lg text-sm font-semibold cursor-not-allowed"
              >
                {t('starter.currentPlan')}
              </button>
            ) : (
              <button
                onClick={() => handleCheckout(PLANS.starter.priceId)}
                className="w-full border border-edge hover:border-accent text-foreground py-3 rounded-lg text-sm font-semibold transition-all hover:bg-accent/5"
              >
                {t('starter.cta')}
              </button>
            )}
          </div>

          {/* Pro Plan — Most Popular */}
          <div className="bg-gradient-to-br from-accent/5 to-transparent border-2 border-accent rounded-2xl p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-accent text-[#0a0a0a] text-xs font-bold px-3 py-1 rounded-full font-mono tracking-wide">
              {t('pro.badge')}
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {PLANS.pro.name}
                </h3>
                <p className="text-accent text-sm mt-1 font-medium">{t('pro.description')}</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-foreground">
                  ${PLANS.pro.price}
                </span>
                <span className="text-muted text-sm">{t('pro.period')}</span>
              </div>
              <p className="text-muted text-sm mt-2">{t('pro.billing')}</p>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {proFeatures.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-foreground text-sm">{t(`features.pro.${key}`)}</span>
                </li>
              ))}
            </ul>

            {currentPlan === "pro" ? (
              <button
                disabled
                className="w-full bg-accent text-black py-3 rounded-lg text-sm font-semibold cursor-not-allowed opacity-70"
              >
                {t('pro.currentPlan')}
              </button>
            ) : (
              <button
                onClick={() => handleCheckout(PLANS.pro.priceId)}
                className="w-full bg-accent hover:bg-accent-hover text-black py-3 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-accent/20"
              >
                {t('pro.cta')}
              </button>
            )}
          </div>

          {/* Premium Plan */}
          <div className="bg-surface border border-edge rounded-2xl p-8 flex flex-col hover:border-accent/30 transition-colors">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {PLANS.premium.name}
                </h3>
                <p className="text-muted text-sm mt-1">{t('premium.description')}</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-foreground">
                  ${PLANS.premium.price}
                </span>
                <span className="text-muted text-sm">{t('premium.period')}</span>
              </div>
              <p className="text-muted text-sm mt-2">{t('premium.billing')}</p>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {premiumFeatures.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-foreground text-sm">{t(`features.premium.${key}`)}</span>
                </li>
              ))}
            </ul>

            {currentPlan === "premium" ? (
              <button
                disabled
                className="w-full bg-accent text-black py-3 rounded-lg text-sm font-semibold cursor-not-allowed opacity-70"
              >
                {t('premium.currentPlan')}
              </button>
            ) : (
              <button
                onClick={() => handleCheckout(PLANS.premium.priceId)}
                className="w-full bg-accent hover:bg-accent-hover text-black py-3 rounded-lg text-sm font-semibold transition-all"
              >
                {t('premium.cta')}
              </button>
            )}
          </div>
        </div>

        {/* Enterprise Plan (separate, full-width) */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border-2 border-accent/50 rounded-2xl p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {PLANS.enterprise.name}
                </h3>
                <p className="text-muted mb-6">
                  {t('enterprise.description')}
                </p>
                <ul className="grid md:grid-cols-2 gap-x-8 gap-y-3">
                  {enterpriseFeatures.map((key) => (
                    <li key={key} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-foreground text-sm">{t(`features.enterprise.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="shrink-0">
                <Link
                  href="/contact-sales"
                  className="inline-block px-8 py-4 bg-accent hover:bg-accent-hover text-black rounded-lg text-sm font-semibold transition-all shadow-lg shadow-accent/20"
                >
                  {t('enterprise.cta')}
                </Link>
                <p className="text-muted text-xs text-center mt-3">{t('enterprise.customPricing')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            {t('faq.title')}
          </h2>
          <p className="text-muted mb-6">
            {t('faq.apiKeyNote')}
          </p>
          <Link
            href="/"
            className="text-accent hover:text-accent-soft transition-colors"
          >
            {t('faq.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}

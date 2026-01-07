"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client-browser";
import { getUserSubscription } from "@/lib/subscription";
import { PLANS } from "@/lib/stripe";
import { UserSubscription } from "@/lib/types";
import BuyCreditsModal from "@/components/BuyCreditsModal";
import { ActivateFeatureModal } from "@/components/briefs/ActivateFeatureModal";

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("account");
  const locale = useLocale();
  const localeMap: Record<string, string> = {
    en: "en-US",
    fr: "fr-FR",
    de: "de-DE",
    es: "es-ES",
    it: "it-IT",
    ru: "ru-RU",
    zh: "zh-CN",
  };
  const dateLocale = localeMap[locale] || "en-US";
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const supabase = useClerkSupabaseClient();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activatedFeatures, setActivatedFeatures] = useState<string[]>([]);

  useEffect(() => {
    // Check for successful checkout
    if (searchParams.get("session_id")) {
      setSuccessMessage(t("subscription.paymentSuccessful"));
    }
  }, [searchParams, t]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      router.push("/signup");
      return;
    }

    async function loadData() {
      const sub = await getUserSubscription(supabase, user!.id);
      setSubscription(sub);

      // Load activated features
      try {
        const featuresRes = await fetch('/api/features/activate');
        if (featuresRes.ok) {
          const featuresData = await featuresRes.json();
          setActivatedFeatures([...new Set<string>((featuresData.activations || []).map((a: any) => a.featureCode as string))]);
        }
      } catch { /* Non-critical */ }

      setLoaded(true);
    }

    loadData();
  }, [isLoaded, isSignedIn, user, supabase, router]);

  // Fetch CSRF token for critical actions
  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        const response = await fetch('/api/csrf-token');
        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrfToken);
        }
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    }
    fetchCsrfToken();
  }, []);

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  async function handleCancelSubscription() {
    if (!confirm(t("subscription.cancelConfirm"))) return;

    if (!csrfToken) {
      setSuccessMessage(t("subscription.cancelError"));
      setTimeout(() => setSuccessMessage(""), 5000);
      return;
    }

    setCanceling(true);
    try {
      const res = await fetch("/api/account/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csrfToken }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      const sub = await getUserSubscription(supabase, user!.id);
      setSubscription(sub);
      setSuccessMessage(t("subscription.cancelSuccess"));
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch {
      setSuccessMessage(t("subscription.cancelError"));
      setTimeout(() => setSuccessMessage(""), 5000);
    } finally {
      setCanceling(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm(t("dangerZone.deleteConfirm"))) return;

    if (!csrfToken) {
      setSuccessMessage(t("dangerZone.deleteError"));
      setTimeout(() => setSuccessMessage(""), 5000);
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csrfToken }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      await signOut();
      router.push("/");
    } catch {
      setSuccessMessage(t("dangerZone.deleteError"));
      setTimeout(() => setSuccessMessage(""), 5000);
      setDeleting(false);
    }
  }

  if (!isLoaded || !loaded) {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-edge border-t-accent" />
      </div>
    );
  }

  const currentPlan = (subscription?.plan || "free") as keyof typeof PLANS;
  const currentPlanData = PLANS[currentPlan];
  const isFreePlan = !subscription || subscription.plan === "free";

  // Credits progress bar data
  const briefCount = subscription?.briefCount || 0;
  const maxBriefs = currentPlanData?.briefs ?? PLANS.free.briefs;
  const isUnlimited = maxBriefs === -1;
  const usedPercent = isUnlimited ? 0 : Math.min(100, Math.round((briefCount / maxBriefs) * 100));
  const remaining = isUnlimited ? Infinity : Math.max(0, maxBriefs - briefCount);
  const isLow = !isUnlimited && remaining <= 2;

  const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <div className="min-h-screen bg-grid py-8 md:py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 md:mb-12">
          <Link
            href="/"
            className="text-muted hover:text-foreground text-sm transition-colors inline-flex items-center gap-2 mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            {t("backToHome")}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-accent text-xs font-medium tracking-widest uppercase font-mono mb-2">Settings</p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {t("title")}
              </h1>
              <p className="text-muted text-sm">
                {userEmail}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="self-start sm:self-auto border border-edge hover:border-red-400/50 text-red-400 hover:text-red-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 min-h-[44px] inline-flex items-center"
            >
              {t("signOut")}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-accent/10 border border-accent rounded-xl p-4 mb-8 flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0 mt-0.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-accent text-sm">{successMessage}</p>
          </div>
        )}

        {/* Free plan upgrade banner */}
        {isFreePlan && (
          <div className="bg-surface border border-accent/20 rounded-xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
            {/* Subtle accent line at top */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold mb-0.5">You're on the Free plan</p>
                <p className="text-muted text-xs leading-relaxed">
                  {briefCount}/{PLANS.free.briefs} briefs used this month. Upgrade to unlock more.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="shrink-0 bg-accent hover:bg-accent-hover text-black px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2 min-h-[44px] self-start sm:self-auto"
            >
              {t("subscription.viewPlans")}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Profile & Settings */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">

            {/* Profile Information Card */}
            <div className="bg-surface border border-edge rounded-xl overflow-hidden">
              <div className="border-b border-edge px-6 py-4 bg-surface/50">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {t("profile.title")}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-muted text-xs font-medium uppercase tracking-wider mb-2">
                      {t("profile.email")}
                    </label>
                    <p className="text-foreground font-mono text-sm bg-base/50 px-3 py-2.5 rounded-lg border border-edge">
                      {userEmail}
                    </p>
                  </div>

                  <div>
                    <label className="block text-muted text-xs font-medium uppercase tracking-wider mb-2">
                      {t("password.title")}
                    </label>
                    <Link
                      href="/account/change-password"
                      className="inline-flex items-center gap-2 text-accent hover:text-accent-soft text-sm font-medium transition-colors bg-accent/5 hover:bg-accent/10 px-3 py-2.5 rounded-lg border border-accent/20"
                    >
                      {t("password.changePassword")}
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8h10M9 4l4 4-4 4" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Unlocked Features Card */}
            <div className="bg-surface border border-edge rounded-xl overflow-hidden">
              <div className="border-b border-edge px-6 py-4 bg-surface/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                  {t("unlockedFeatures.title")}
                </h2>
                <button
                  onClick={() => setShowActivateModal(true)}
                  className="text-xs text-accent hover:text-accent-soft font-medium transition-colors border border-accent/20 hover:border-accent/40 px-3 py-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  + {t("unlockedFeatures.enterCode")}
                </button>
              </div>
              <div className="p-6">
                {activatedFeatures.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted text-sm mb-3">{t("unlockedFeatures.noFeatures")}</p>
                    <button
                      onClick={() => setShowActivateModal(true)}
                      className="text-accent hover:text-accent-soft text-sm font-medium transition-colors"
                    >
                      {t("unlockedFeatures.haveCode")}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activatedFeatures.map(feature => (
                      <div key={feature} className="flex items-center gap-3 bg-accent/5 border border-accent/20 rounded-lg px-4 py-3">
                        <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
                        <span className="text-foreground text-sm font-medium">
                          {feature === 'COLLECTOR_EDITION' ? t("unlockedFeatures.collectorEdition") : feature}
                        </span>
                        <span className="ml-auto text-xs text-accent/70 font-medium">{t("unlockedFeatures.active")}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowActivateModal(true)}
                      className="text-xs text-muted hover:text-accent transition-colors mt-2 block"
                    >
                      + {t("unlockedFeatures.addAnother")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Subscription Card */}
            <div className="bg-surface border border-edge rounded-xl overflow-hidden">
              <div className="border-b border-edge px-6 py-4 bg-surface/50">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {t("subscription.title")}
                </h2>
              </div>

              <div className="p-6">
                {isFreePlan ? (
                  <div className="space-y-6">
                    {/* Current plan label + credits progress */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-muted text-xs font-medium uppercase tracking-wider">
                          {t("subscription.currentPlan")}
                        </p>
                        <span className="text-xs font-semibold text-foreground">
                          {briefCount} / {PLANS.free.briefs} briefs
                        </span>
                      </div>
                      <p className="text-xl font-bold text-foreground mb-3">
                        Free
                      </p>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-edge rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.round((briefCount / PLANS.free.briefs) * 100))}%`,
                            backgroundColor: briefCount >= PLANS.free.briefs ? '#f87171' : '#00D9FF',
                          }}
                        />
                      </div>
                      <p className="text-muted text-xs mt-1.5">
                        {PLANS.free.briefs - briefCount > 0
                          ? `${PLANS.free.briefs - briefCount} briefs remaining this month`
                          : "No briefs remaining — upgrade to continue"}
                      </p>
                    </div>

                    {/* CTA */}
                    <Link
                      href="/pricing"
                      className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover text-black py-3 rounded-lg text-sm font-semibold transition-colors min-h-[48px]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        <polyline points="17 6 23 6 23 12" />
                      </svg>
                      {t("subscription.viewPlans")}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Plan Badge */}
                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-muted text-xs font-medium uppercase tracking-wider mb-2">
                            {t("subscription.currentPlan")}
                          </p>
                          <p className="text-2xl font-bold text-foreground mb-1">
                            {currentPlanData?.name}
                          </p>
                          <p className="text-accent text-sm font-medium">
                            ${currentPlanData?.price}/month
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-surface/50 px-3 py-1.5 rounded-full border border-edge">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              subscription!.status === "active"
                                ? "bg-green-500"
                                : subscription!.status === "past_due"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          />
                          <p className="text-foreground capitalize text-xs font-medium">
                            {subscription!.status}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Credits progress bar */}
                    {!isUnlimited && (
                      <div className="bg-base/30 rounded-lg p-4 border border-edge/50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-muted text-xs font-medium uppercase tracking-wider">
                            Credits used
                          </p>
                          <span className={`text-xs font-semibold ${isLow ? 'text-red-400' : 'text-foreground'}`}>
                            {briefCount} / {maxBriefs}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-edge rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${usedPercent}%`,
                              backgroundColor: isLow ? '#f87171' : '#00D9FF',
                            }}
                          />
                        </div>
                        <p className="text-muted text-xs mt-1.5">
                          {remaining > 0
                            ? `${remaining} briefs remaining this month`
                            : "Monthly limit reached"}
                        </p>
                      </div>
                    )}

                    {/* Billing Info */}
                    {subscription!.currentPeriodEnd && (
                      <div className="bg-base/30 rounded-lg p-4 border border-edge/50">
                        <p className="text-muted text-xs font-medium uppercase tracking-wider mb-2">
                          {t("subscription.nextBillingDate")}
                        </p>
                        <p className="text-foreground text-sm font-medium">
                          {new Date(subscription!.currentPeriodEnd).toLocaleDateString(
                            dateLocale,
                            { month: "long", day: "numeric", year: "numeric" }
                          )}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-edge space-y-3">
                      <button
                        onClick={() => setShowBuyCredits(true)}
                        className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover text-black py-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 min-h-[48px]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v8M8 12h8" />
                        </svg>
                        {t("subscription.buyCredits")}
                      </button>
                      <Link
                        href="/pricing"
                        className="flex items-center justify-center gap-2 w-full border border-edge hover:border-accent text-foreground hover:text-accent py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3h18v18H3zM12 8v8M8 12h8" />
                        </svg>
                        {t("subscription.changePlan")}
                      </Link>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={canceling}
                        className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 disabled:opacity-50 hover:bg-red-500/5 py-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
                      >
                        {canceling ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent" />
                            {t("subscription.canceling")}
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            {t("subscription.cancel")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Danger Zone */}
          <div className="lg:col-span-1">
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl overflow-hidden sticky top-8">
              <div className="border-b border-red-500/20 px-6 py-4 bg-red-500/5">
                <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  {t("dangerZone.title")}
                </h2>
              </div>

              <div className="p-6">
                <p className="text-muted text-sm mb-4 leading-relaxed">
                  {t("dangerZone.deleteWarning")}
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 disabled:opacity-50 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent shrink-0" />
                      <span>{t("dangerZone.deleting")}</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      <span>{t("dangerZone.deleteAccount")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Credits Modal */}
      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
      />

      {/* Activate Feature Modal */}
      <ActivateFeatureModal
        isOpen={showActivateModal}
        onClose={() => setShowActivateModal(false)}
        onSuccess={(featureCode: string) => {
          setActivatedFeatures(prev => [...new Set([...prev, featureCode])]);
        }}
      />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-grid flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-edge border-t-accent" />
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getRemainingBriefs, getUserSubscription } from "@/lib/subscription";
import { PLANS } from "@/lib/stripe";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client-browser";

const IDEA_EXPRESS_SECTIONS = ["Présentation", "MVP", "POC", "Devis", "Brief"];

interface BriefSuccessScreenProps {
  briefId: string;
  title: string;
  projectType?: string;
}

export default function BriefSuccessScreen({ briefId, title, projectType }: BriefSuccessScreenProps) {
  const isIdeaExpress = projectType === "idea-express";
  const router = useRouter();
  const t = useTranslations("brief.success");
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [remainingBriefs, setRemainingBriefs] = useState<number | null>(null);
  const [totalBriefs, setTotalBriefs] = useState<number | null>(null);
  const [usedBriefs, setUsedBriefs] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [exportingAiPdf, setExportingAiPdf] = useState(false);

  const hasAiPdf = ["pro", "premium", "enterprise"].includes(userPlan);

  useEffect(() => {
    if (!isLoaded || !user) return;

    async function loadData() {
      const remaining = await getRemainingBriefs(supabase, user!.id);
      const sub = await getUserSubscription(supabase, user!.id);
      setRemainingBriefs(remaining);
      if (sub) {
        const plan = PLANS[sub.plan as keyof typeof PLANS];
        setUserPlan(sub.plan);
        if (plan && plan.briefs !== -1) {
          setTotalBriefs(plan.briefs);
          setUsedBriefs(sub.briefCount);
        }
      }
    }

    loadData();
  }, [isLoaded, user, supabase]);

  async function handleAiPdf() {
    setExportingAiPdf(true);
    try {
      const res = await fetch(`/api/brief/${briefId}/pdf-ai`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.upgrade_required) { router.push("/pricing"); return; }
        throw new Error(data.error || "Failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase().slice(0, 40)}-ai-pro.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("AI PDF generation failed. Please try again.");
    } finally {
      setExportingAiPdf(false);
    }
  }

  function handleViewBrief() {
    router.push(`/brief/${briefId}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-base">
      <div className="w-full max-w-2xl">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-foreground text-center mb-3">
          {isIdeaExpress ? "Your complete document is ready!" : t("title")}
        </h1>
        <p className="text-muted text-center mb-8">
          {isIdeaExpress ? title : t("subtitle", { title })}
        </p>

        {/* Idea Express sections chips */}
        {isIdeaExpress && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {IDEA_EXPRESS_SECTIONS.map((section) => (
              <span
                key={section}
                className="text-xs font-medium px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/25"
              >
                {section}
              </span>
            ))}
          </div>
        )}

        {/* Brief Preview Card */}
        <div className="bg-surface border border-edge rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                {title}
              </h2>
              <p className="text-muted text-sm">{isIdeaExpress ? "Complete document with 5 sections" : t("readyToShare")}</p>
            </div>
            <button
              onClick={handleViewBrief}
              className="bg-accent hover:bg-accent-hover text-black px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              {isIdeaExpress ? "View document" : t("viewBrief")}
            </button>
          </div>

          {/* Smart Credit Usage Messaging */}
          {remainingBriefs !== null && remainingBriefs !== Infinity && (
            <div className="border-t border-edge pt-4 mt-2 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-accent mt-1 shrink-0" />
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">
                    {remainingBriefs === 0 && totalBriefs && usedBriefs ? (
                      t("creditStatus.depleted", { used: usedBriefs, total: totalBriefs })
                    ) : remainingBriefs === 1 ? (
                      t("creditStatus.oneMore")
                    ) : (
                      t("creditStatus.remaining", { count: remainingBriefs })
                    )}
                  </p>
                  <p className="text-muted text-xs mt-1">
                    {t("creditStatus.cta")}
                    {" "}
                    <Link
                      href="/account"
                      className="text-accent hover:text-accent-soft transition-colors inline-flex items-center gap-1"
                    >
                      {t("creditStatus.buyMore")}
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8h10M9 4l4 4-4 4" />
                      </svg>
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Pro PDF — Pro+ only */}
        {hasAiPdf && (
          <button
            onClick={handleAiPdf}
            disabled={exportingAiPdf}
            className="w-full mb-3 flex items-center justify-center gap-3 bg-accent/8 hover:bg-accent/12 border border-accent/25 hover:border-accent/50 text-accent px-6 py-3.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {exportingAiPdf ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full" />
                Generating Brief+…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                Brief+
                <span className="ml-auto text-[10px] font-mono text-accent/50 border border-accent/20 px-1.5 py-0.5 rounded">−5 crédits</span>
              </>
            )}
          </button>
        )}

        {/* Action Buttons */}
        {isIdeaExpress ? (
          <div className="flex gap-3">
            <button
              onClick={handleViewBrief}
              className="flex-1 bg-accent hover:bg-accent-hover text-black px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              View document
            </button>
            <button
              onClick={handleAiPdf}
              disabled={exportingAiPdf}
              className="flex-1 border border-edge hover:border-accent text-foreground px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {exportingAiPdf ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-accent border-t-transparent rounded-full" />
                  Exporting…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export PDF
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleViewBrief}
              className="flex-1 bg-accent hover:bg-accent-hover text-black px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t("viewFullBrief")}
            </button>
            <Link
              href="/brief/new"
              className="flex-1 border border-edge hover:border-accent text-foreground px-6 py-3 rounded-lg font-medium transition-colors text-center"
            >
              {t("createAnother")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

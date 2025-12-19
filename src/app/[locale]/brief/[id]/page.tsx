"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { getBriefDB, deleteBriefDB } from "@/lib/storage";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client-browser";
import { Brief } from "@/lib/types";
import BriefView from "@/components/BriefView";
import { BriefContentSkeleton } from "@/components/ui/SkeletonLoader";
import { BookViewer } from "@/components/briefs/BookViewer";
import { PDF_THEMES } from "@/components/BriefPdf";

// PDF style accent colors for the selector dots
const PDF_STYLE_COLORS: Record<string, string> = {
  classic: "#00D9FF",
  minimal: "#888888",
  dark: "#1a1a1a",
  executive: "#B8960C",
  emerald: "#10B981",
};

const PDF_STYLE_PLANS: Record<string, string[]> = {
  classic: ["free", "starter", "pro", "premium", "enterprise"],
  minimal: ["pro", "premium", "enterprise"],
  dark: ["pro", "premium", "enterprise"],
  executive: ["premium", "enterprise"],
  emerald: ["premium", "enterprise"],
};

export default function BriefPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('brief.view');
  const locale = useLocale();
  const localeMap: Record<string, string> = { en: "en-US", fr: "fr-FR", de: "de-DE", es: "es-ES", it: "it-IT", ru: "ru-RU", zh: "zh-CN" };
  const dateLocale = localeMap[locale] || "en-US";
  const { user, isSignedIn, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingAiPdf, setExportingAiPdf] = useState(false);
  const [bookMode, setBookMode] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [selectedStyle, setSelectedStyle] = useState<string>("classic");
  const [hasPdfFeature, setHasPdfFeature] = useState<boolean>(false);

  const hasAiPdf = ["pro", "premium", "enterprise"].includes(userPlan) || hasPdfFeature;

  const availableStyles = Object.keys(PDF_STYLE_COLORS).filter(
    s => hasPdfFeature || PDF_STYLE_PLANS[s]?.includes(userPlan)
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      router.push("/login");
      return;
    }

    async function loadBrief() {
      const id = params.id as string;
      const found = await getBriefDB(supabase, user!.id, id);
      if (found) {
        setBrief(found);
      } else {
        setNotFound(true);
      }

      // Fetch user plan for PDF style gating
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("plan")
        .eq("user_id", user!.id)
        .maybeSingle();
      setUserPlan(sub?.plan || "free");

      // Check for PDF_AI_ACCESS activation code (bypasses plan requirement)
      const { data: pdfActivation } = await supabase
        .from("user_feature_activations")
        .select("id")
        .eq("user_id", user!.id)
        .eq("feature_key", "PDF_AI_ACCESS")
        .maybeSingle();
      if (pdfActivation) setHasPdfFeature(true);
    }

    loadBrief();
  }, [params.id, router, isLoaded, isSignedIn, user, supabase]);

  const handleCopy = useCallback(async () => {
    if (!brief) return;
    await navigator.clipboard.writeText(brief.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [brief]);

  async function handleExportPdf() {
    if (!brief) return;
    setExportingPdf(true);
    try {
      // Use client-side PDF generation with @react-pdf/renderer
      const { generateBriefPdf } = await import("@/components/BriefPdf");
      const blob = await generateBriefPdf(brief, selectedStyle);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Generate clean filename: "brief-123abc.pdf" (max 40 chars + date)
      const date = new Date(brief.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
      const cleanTitle = brief.title
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .slice(0, 40); // Max 40 chars
      a.download = `${cleanTitle}-${date}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert(t('exportError') || "Failed to export PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  }

  async function handleExportAiPdf() {
    if (!brief) return;
    setExportingAiPdf(true);
    try {
      const res = await fetch(`/api/brief/${brief.id}/pdf-ai`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.upgrade_required) {
          // Redirect to pricing if not enough plan/credits
          router.push("/pricing");
          return;
        }
        throw new Error(data.error || "AI PDF generation failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date(brief.createdAt).toISOString().split("T")[0];
      const cleanTitle = brief.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase().slice(0, 40);
      a.download = `${cleanTitle}-ai-pro-${date}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("AI PDF export failed:", err);
      alert("AI PDF generation failed. Please try again.");
    } finally {
      setExportingAiPdf(false);
    }
  }

  async function handleDelete() {
    if (!brief || !user) return;
    if (!confirm(t('deleteConfirm'))) return;
    await deleteBriefDB(supabase, user.id, brief.id);
    router.push("/history");
  }


  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h1 className="text-lg sm:text-xl font-semibold text-foreground mb-2 text-center">
          {t('notFound')}
        </h1>
        <p className="text-muted mb-6 text-center text-sm sm:text-base">
          {t('notFoundDesc')}
        </p>
        <Link
          href="/history"
          className="text-accent hover:text-accent-soft transition-colors min-h-[44px] inline-flex items-center touch-manipulation"
        >
          {t('backToHistory')}
        </Link>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="min-h-screen bg-grid pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header skeleton */}
          <div className="mb-6 sm:mb-8">
            <div className="h-8 w-2/3 bg-edge rounded animate-pulse mb-2" />
            <div className="h-4 w-1/3 bg-edge rounded animate-pulse" />
          </div>

          {/* Content skeleton */}
          <BriefContentSkeleton />
        </div>
      </div>
    );
  }

  const formattedDate = new Date(brief.createdAt).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Brief content */}
        <main className="flex-1 min-w-0">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                {brief.title}
              </h1>
              {brief.projectType === "idea-express" && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25 shrink-0">
                  ⚡ Idée Express
                </span>
              )}
            </div>
            <p className="text-muted text-xs sm:text-sm">
              {brief.projectType === "idea-express"
                ? `Présentation · MVP · POC · Devis · Brief`
                : brief.projectType}{" "}
              &middot; {t('created')} {formattedDate}
            </p>
          </div>

          <div className="bg-surface border border-edge rounded-xl p-6 sm:p-8 md:p-12">
            <BriefView content={brief.content} />
          </div>
        </main>

        {/* Actions sidebar */}
        <aside className="no-print hidden md:block w-48 shrink-0 self-start">
          <div className="sticky top-4 space-y-2 bg-base/95 backdrop-blur-sm border border-edge rounded-xl p-3 shadow-sm">
            <button
              onClick={() => setBookMode(true)}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-accent hover:text-accent-soft hover:bg-surface transition-colors min-h-[44px] font-medium"
            >
              Book Mode
            </button>
            {availableStyles.length > 1 && (
              <div className="px-4 py-2">
                <div className="text-xs text-muted mb-1.5">PDF Style</div>
                <div className="flex gap-1.5">
                  {availableStyles.map(style => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      title={style.charAt(0).toUpperCase() + style.slice(1)}
                      className={`w-5 h-5 rounded-full transition-all ${selectedStyle === style ? 'ring-2 ring-offset-2 ring-offset-base ring-accent scale-110' : 'opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: PDF_STYLE_COLORS[style] }}
                    />
                  ))}
                </div>
              </div>
            )}
            {hasAiPdf ? (
              <button
                onClick={handleExportAiPdf}
                disabled={exportingAiPdf}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px] bg-accent/10 hover:bg-accent/15 border border-accent/20 hover:border-accent/40 text-accent"
              >
                <span className="flex items-center gap-2">
                  {exportingAiPdf ? (
                    <>
                      <span className="animate-spin inline-block w-3 h-3 border border-accent border-t-transparent rounded-full" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      Brief+
                    </>
                  )}
                </span>
              </button>
            ) : (
              <Link
                href="/pricing"
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] border border-edge/50 text-muted/50 flex items-center gap-2 cursor-default hover:border-accent/20 hover:text-muted"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Brief+
                <span className="ml-auto text-[9px] font-mono text-accent/50 border border-accent/20 px-1 rounded">Pro+</span>
              </Link>
            )}
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {exportingPdf ? t('exportGenerating') : t('export')}
            </button>
            <button
              onClick={handleCopy}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface transition-colors min-h-[44px]"
            >
              {copied ? t('copied') : t('copyBrief')}
            </button>
            <Link
              href="/brief/new"
              className="block px-4 py-2.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface transition-colors min-h-[44px] flex items-center"
            >
              {t('newBrief')}
            </Link>
            <hr className="border-edge my-2" />
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-red-400/70 hover:text-red-400 hover:bg-surface transition-colors min-h-[44px]"
            >
              {t('deleteBrief')}
            </button>
            <Link
              href="/history"
              className="block px-4 py-2.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface transition-colors min-h-[44px] flex items-center"
            >
              &larr; {t('backToHistory')}
            </Link>
          </div>
        </aside>
      </div>

      {/* Mobile actions */}
      <div className="no-print md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-edge px-4 py-3 sm:py-4 flex flex-col gap-2 safe-area-inset-bottom">
        {hasAiPdf && (
          <button
            onClick={handleExportAiPdf}
            disabled={exportingAiPdf}
            className="w-full bg-accent/10 border border-accent/30 text-accent py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2 touch-manipulation"
          >
            {exportingAiPdf ? (
              <><span className="animate-spin inline-block w-3 h-3 border border-accent border-t-transparent rounded-full" /> Generating Brief+…</>
            ) : (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Brief+</>
            )}
          </button>
        )}
        <div className="flex gap-2.5 sm:gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 border border-edge hover:border-accent active:border-accent text-foreground py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] sm:min-h-[44px] touch-manipulation"
        >
          {copied ? t('copied') : t('copyBrief')}
        </button>
        <button
          onClick={handleExportPdf}
          disabled={exportingPdf}
          className="flex-1 bg-accent hover:bg-accent-hover active:bg-accent-hover disabled:opacity-50 text-black py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] sm:min-h-[44px] touch-manipulation"
        >
          {exportingPdf ? t('exportGenerating') : t('export')}
        </button>
        </div>
      </div>

      {/* Book Viewer Modal */}
      {bookMode && brief && (
        <BookViewer
          content={brief.content}
          title={brief.title}
          onClose={() => setBookMode(false)}
        />
      )}
    </div>
  );
}

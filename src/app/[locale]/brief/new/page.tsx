"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { questionIds, questionMetadata, projectTypeOptionKeys } from "@/lib/questions";
import { saveBriefDB } from "@/lib/storage";
import { buildPrompt } from "@/lib/prompt";
import { BriefAnswers } from "@/lib/types";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client-browser";
import { canCreateBrief, getUserSubscription } from "@/lib/subscription";
import { PLANS } from "@/lib/stripe";
import ProgressTracker from "@/components/ProgressTracker";
import TemplateSelector from "@/components/TemplateSelector";
import UpgradeModal from "@/components/UpgradeModal";
import { Template } from "@/lib/templates";
import { ErrorState } from "@/components/ui/ErrorState";
import { getUserFriendlyError } from "@/lib/error-messages";

type BriefMode = null | "guided" | "express";

export default function NewBriefPage() {
  const router = useRouter();
  const t = useTranslations('brief.new');
  const { user, isSignedIn, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [mode, setMode] = useState<BriefMode>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [briefCount, setBriefCount] = useState(0);
  const [briefLimit, setBriefLimit] = useState(3);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<BriefAnswers>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [expressIdea, setExpressIdea] = useState("");
  const [expressDocType, setExpressDocType] = useState<string>("brief");
  const [error, setError] = useState<{ message: string; code?: string; requestId?: string } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/signup");
    }
  }, [isLoaded, isSignedIn, router]);

  const questionId = questionIds[currentStep];
  const metadata = questionMetadata[questionId];

  const question = useMemo(() => ({
    id: questionId,
    label: t(`questions.${questionId}.label`),
    title: t(`questions.${questionId}.title`),
    description: t(`questions.${questionId}.description`),
    placeholder: t(`questions.${questionId}.placeholder`),
    type: metadata.type,
    required: metadata.required,
    options: questionId === 'projectType'
      ? projectTypeOptionKeys.map(key => t(`questions.projectType.options.${key}`))
      : undefined,
  }), [currentStep, t, questionId, metadata]);

  const isLastStep = currentStep === questionIds.length - 1;
  const currentAnswer = (answers[questionId] || "") as string;
  const canProceed = !metadata.required || currentAnswer.trim().length > 0;

  function handleModeSelect(selected: "guided" | "express") {
    setMode(selected);
    if (selected === "guided") {
      setShowTemplateSelector(true);
    }
  }

  function handleTemplateSelect(template: Template | null) {
    if (template) {
      setAnswers(template.defaultAnswers);
    }
    setShowTemplateSelector(false);
  }

  function handleSkipTemplate() {
    setShowTemplateSelector(false);
  }

  function updateAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError(null);
  }

  function handleNext() {
    if (!canProceed) return;
    if (isLastStep) {
      handleGenerate();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && question?.type !== "textarea") {
      e.preventDefault();
      handleNext();
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleNext();
    }
  }

  async function checkLimit() {
    const canCreate = await canCreateBrief(supabase, user!.id);
    if (!canCreate) {
      const sub = await getUserSubscription(supabase, user!.id);
      if (sub) {
        const plan = PLANS[sub.plan as keyof typeof PLANS];
        setBriefCount(sub.briefCount);
        setBriefLimit(plan?.briefs ?? 3);
      }
      setIsGenerating(false);
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  }

  async function handleGenerateExpress() {
    if (expressIdea.trim().length < 10) {
      setError({ message: "Décrivez votre idée en quelques mots (minimum 10 caractères)" });
      return;
    }

    setIsGenerating(true);
    setError(null);

    if (!(await checkLimit())) return;

    try {
      const response = await fetch("/api/generate/idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: expressIdea, docType: expressDocType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Extract title from first heading or use idea as title
      const titleMatch = data.content.match(/^#+\s+(.+)/m);
      const title = titleMatch?.[1] || expressIdea.split(".")[0].trim().slice(0, 80) || "Idée Express";

      const briefId = await saveBriefDB(supabase, user!.id, {
        id: "",
        title,
        projectType: "idea-express",
        answers: {
          projectType: "idea-express",
          clientInfo: expressIdea,
          goals: "",
          targetAudience: "",
          deliverables: "",
          timeline: "",
          budget: "",
          constraints: "",
        },
        content: data.content,
        createdAt: new Date().toISOString(),
      });

      if (!briefId) throw new Error("Failed to save brief");

      router.push(`/brief/${briefId}/success`);
    } catch (err) {
      const errorData = err instanceof Error ? err.message : String(err);
      let errorObj: { message: string; code?: string; requestId?: string };
      try {
        const parsed = JSON.parse(errorData);
        errorObj = { message: parsed.error || errorData, code: parsed.code, requestId: parsed.requestId };
      } catch {
        errorObj = { message: errorData };
      }
      setError(errorObj);
      setIsGenerating(false);
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    if (!(await checkLimit())) return;

    try {
      const prompt = buildPrompt(answers as BriefAnswers);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const titleMatch = data.content.match(/# Project Brief:\s*(.+)/);
      const title =
        titleMatch?.[1] ||
        answers.clientInfo?.split("—")[0]?.trim() ||
        "Untitled Brief";

      const briefId = await saveBriefDB(supabase, user!.id, {
        id: "",
        title,
        projectType: answers.projectType || "",
        answers: answers as BriefAnswers,
        content: data.content,
        createdAt: new Date().toISOString(),
      });

      if (!briefId) {
        throw new Error("Failed to save brief");
      }

      router.push(`/brief/${briefId}/success`);
    } catch (err) {
      const errorData = err instanceof Error ? err.message : String(err);
      let errorObj: { message: string; code?: string; requestId?: string };
      try {
        const parsed = JSON.parse(errorData);
        errorObj = { message: parsed.error || errorData, code: parsed.code, requestId: parsed.requestId };
      } catch {
        errorObj = { message: errorData };
      }
      setError(errorObj);
      setIsGenerating(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-edge border-t-accent" />
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-edge border-t-accent mb-6" />
        <p className="text-foreground font-medium text-base sm:text-lg text-center">
          {mode === "express"
            ? t('generatingExpress')
            : t('generatingPage')}
        </p>
        <p className="text-muted text-sm mt-2 text-center">
          {mode === "express"
            ? t('generatingExpressSubtitle')
            : t('generatingPageSubtitle')}
        </p>
      </div>
    );
  }

  // ── Mode selector (initial screen) ──────────────────────────────────────────
  if (mode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-grid">
        <div className="w-full max-w-2xl">
          <div className="mb-10 text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-foreground font-bold text-sm tracking-[0.12em] uppercase">Origo</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
              {t('modeSelector.title')}
            </h1>
            <p className="text-muted text-sm">{t('modeSelector.subtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Idée Express */}
            <button
              onClick={() => handleModeSelect("express")}
              className="text-left p-6 rounded-xl border border-edge hover:border-accent/60 bg-surface hover:bg-accent/5 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent text-lg">
                  ⚡
                </div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">{t('modeSelector.expressTag')}</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                {t('modeSelector.expressTitle')}
              </h2>
              <p className="text-muted text-sm leading-relaxed mb-4">
                {t('modeSelector.expressDescription')}
              </p>
              <div className="flex items-center gap-1.5 text-muted text-xs">
                <div className="w-1 h-1 rounded-full bg-accent" />
                <span>{t('modeSelector.expressCredit')}</span>
              </div>
            </button>

            {/* Brief Guidé */}
            <button
              onClick={() => handleModeSelect("guided")}
              className="text-left p-6 rounded-xl border border-edge hover:border-accent/60 bg-surface hover:bg-accent/5 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-edge flex items-center justify-center text-foreground text-lg">
                  📝
                </div>
                <span className="text-xs font-medium text-muted uppercase tracking-wider">{t('modeSelector.guidedTag')}</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                {t('modeSelector.guidedTitle')}
              </h2>
              <p className="text-muted text-sm leading-relaxed mb-4">
                {t('modeSelector.guidedDescription')}
              </p>
              <div className="flex items-center gap-1.5 text-muted text-xs">
                <div className="w-1 h-1 rounded-full bg-muted" />
                <span>{t('modeSelector.guidedCredit')}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Idée Express mode ────────────────────────────────────────────────────────
  if (mode === "express") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-grid">
        <div className="w-full max-w-xl">
          <div className="mb-8">
            <button
              onClick={() => setMode(null)}
              className="flex items-center gap-1.5 text-muted hover:text-foreground transition-colors text-sm mb-6"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M19 12H5m0 0l7-7m-7 7l7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t('express.back')}
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">{t('express.tag')}</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              {t('express.title')}
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              {t('express.description')}
            </p>
          </div>

          {/* Document type selector */}
          <div className="flex flex-wrap gap-2 mb-5">
            {(
              [
                { key: "presentation", label: "Présentation" },
                { key: "mvp", label: "MVP" },
                { key: "poc", label: "POC" },
                { key: "devis", label: "Devis" },
                { key: "brief", label: "Brief" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setExpressDocType(key)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                  expressDocType === key
                    ? "bg-accent text-black"
                    : "bg-surface border border-edge text-muted hover:border-accent/60 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <textarea
            value={expressIdea}
            onChange={(e) => { setExpressIdea(e.target.value); setError(null); }}
            placeholder={t('express.placeholder')}
            rows={6}
            className="w-full bg-surface border border-edge focus:border-accent rounded-xl px-4 py-3.5 text-base text-foreground placeholder:text-muted/40 transition-colors outline-none resize-none mb-2 focus-visible:ring-2 focus-visible:ring-accent/50"
            autoFocus
          />
          <p className="text-muted/40 text-xs text-right mb-6">
            {expressIdea.length}/2000
          </p>

          {error && (
            <ErrorState
              message={getUserFriendlyError(error).message}
              code={error.code}
              requestId={error.requestId}
              onRetry={handleGenerateExpress}
              className="mb-4"
            />
          )}

          <button
            onClick={handleGenerateExpress}
            disabled={expressIdea.trim().length < 10}
            className={`w-full py-3.5 rounded-xl font-semibold text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              expressIdea.trim().length >= 10
                ? "bg-accent hover:bg-accent-hover text-black"
                : "bg-edge text-muted cursor-not-allowed"
            }`}
          >
            {t('express.generateButton')}
          </button>

          <p className="text-muted/40 text-xs text-center mt-3">
            {t('express.footer')}
          </p>
        </div>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          briefCount={briefCount}
          briefLimit={briefLimit}
        />
      </div>
    );
  }

  // ── Template selector (guided mode entry) ────────────────────────────────────
  if (showTemplateSelector) {
    return (
      <TemplateSelector
        onSelect={handleTemplateSelect}
        onSkip={handleSkipTemplate}
      />
    );
  }

  if (!isSignedIn) return null;

  // ── Guided mode: 8-step wizard ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-grid">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-edge p-6 shrink-0 bg-base/60">
        <ProgressTracker currentStep={currentStep} />
      </aside>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-xl">
          {/* Mobile progress */}
          <div className="md:hidden mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-2">
              <Link href="/" className="flex items-center gap-1.5 min-h-[44px] -ml-2 pl-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="text-foreground font-bold text-sm tracking-[0.12em] uppercase">Origo</span>
              </Link>
              <span className="text-muted text-sm">
                {currentStep + 1}/{questionIds.length}
              </span>
            </div>
            <div className="h-1.5 sm:h-1 bg-edge rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / questionIds.length) * 100}%` }}
              />
            </div>
          </div>

          <p className="text-muted text-xs sm:text-sm mb-2">
            {t('question')} {currentStep + 1} {t('of')} {questionIds.length}
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 leading-tight">
            {question.title}
          </h1>
          <p className="text-muted text-sm mb-6 sm:mb-8 leading-relaxed">{question.description}</p>

          {/* Input */}
          {question.type === "select" && question.options ? (
            <div className="grid gap-2.5 sm:gap-2 mb-6 sm:mb-8">
              {question.options.map((option) => (
                <button
                  key={option}
                  onClick={() => updateAnswer(option)}
                  className={`text-left px-4 py-3.5 sm:py-3 rounded-lg border transition-colors min-h-[48px] sm:min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                    currentAnswer === option
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-edge bg-surface text-muted hover:border-accent/50 hover:text-foreground active:border-accent/70"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : question.type === "textarea" ? (
            <textarea
              value={currentAnswer}
              onChange={(e) => updateAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={question.placeholder}
              rows={5}
              className="w-full bg-surface border border-edge focus:border-accent rounded-lg px-4 py-3.5 sm:py-3 text-base sm:text-base text-foreground placeholder:text-muted/40 transition-colors outline-none resize-none mb-6 sm:mb-8 focus-visible:ring-2 focus-visible:ring-accent/50"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => updateAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={question.placeholder}
              className="w-full bg-surface border border-edge focus:border-accent rounded-lg px-4 py-3.5 sm:py-3 text-base sm:text-base text-foreground placeholder:text-muted/40 transition-colors outline-none mb-6 sm:mb-8 min-h-[48px] sm:min-h-[44px] focus-visible:ring-2 focus-visible:ring-accent/50"
              autoFocus
            />
          )}

          {error && (
            <ErrorState
              message={getUserFriendlyError(error).message}
              code={error.code}
              requestId={error.requestId}
              onRetry={handleGenerate}
              className="mb-4"
            />
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleBack}
              className={`border border-edge hover:border-accent active:border-accent text-foreground px-5 sm:px-6 py-3 rounded-lg font-medium transition-colors min-h-[48px] sm:min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                currentStep === 0 ? "invisible" : ""
              }`}
            >
              {t('back')}
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`px-5 sm:px-6 py-3 rounded-lg font-medium transition-colors min-h-[48px] sm:min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                canProceed
                  ? "bg-accent hover:bg-accent-hover active:bg-accent-hover text-black"
                  : "bg-edge text-muted cursor-not-allowed"
              }`}
            >
              {isLastStep ? t('generateButton') : t('next')}
            </button>
          </div>

          {question.type === "textarea" && (
            <p className="text-muted/40 text-xs text-center mt-3 sm:mt-4">
              {t('pressCmdEnter')}
            </p>
          )}
        </div>
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        briefCount={briefCount}
        briefLimit={briefLimit}
      />
    </div>
  );
}

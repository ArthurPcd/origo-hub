'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useCountUp } from "@/hooks/useCountUp";
import { GlitchCoordinate } from "@/components/animations/GlitchCoordinate";
import { StaggerAxisReveal } from "@/components/animations/StaggerAxisReveal";

/* ─── Scroll-triggered section wrapper (no framer-motion, pure CSS) ─── */
function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section
      id={id}
      ref={ref as React.RefObject<HTMLElement>}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </section>
  );
}

/* ─── Brief preview card — realistic generated output ─── */
function BriefPreview() {
  return (
    <div className="relative w-full max-w-xl mx-auto px-2 mt-14 sm:mt-16 mb-16">
      {/* Ambient glow behind card */}
      <div className="absolute inset-0 blur-3xl bg-accent/5 rounded-3xl pointer-events-none" />

      <div className="relative bg-surface border border-edge rounded-2xl overflow-hidden shadow-2xl axis-markers animate-fade-up delay-500">
        {/* Window chrome */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-edge">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-edge" />
            <div className="w-2.5 h-2.5 rounded-full bg-edge" />
            <div className="w-2.5 h-2.5 rounded-full bg-accent/50" />
          </div>
          <span className="text-muted/40 text-xs font-mono tracking-wider">brief.md</span>
          <div className="flex items-center gap-2">
            <span className="text-accent/60 text-[10px] font-mono border border-accent/20 px-1.5 py-0.5 rounded">PDF</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-5 space-y-4 text-sm">
          {/* Title */}
          <div className="animate-fade-in delay-700">
            <h3 className="text-foreground font-semibold text-base">
              Website Redesign — Acme Corp
            </h3>
            <p className="text-muted/60 text-xs mt-0.5">
              Studio Nord × Acme Corp · Generated Feb 19, 2026
            </p>
          </div>

          <div className="h-px bg-edge" />

          {/* Scope */}
          <div className="animate-fade-up delay-1000">
            <p className="text-accent text-xs font-medium uppercase tracking-wider mb-1.5">Scope</p>
            <p className="text-muted leading-relaxed">
              Responsive website (8 pages), CMS integration, SEO setup. Target market: France & EU. GDPR compliant.
            </p>
          </div>

          {/* Timeline + Budget */}
          <div className="grid grid-cols-2 gap-4 animate-fade-up delay-1200">
            <div>
              <p className="text-accent text-xs font-medium uppercase tracking-wider mb-1.5">Timeline</p>
              <p className="text-muted text-xs leading-relaxed">
                Kickoff Mar 1<br />
                Design → 3 wks<br />
                Dev → 5 wks<br />
                <span className="text-foreground/70">Launch May 15</span>
              </p>
            </div>
            <div>
              <p className="text-accent text-xs font-medium uppercase tracking-wider mb-1.5">Budget</p>
              <p className="text-muted text-xs leading-relaxed">
                €5,000–€8,000<br />
                Fixed price<br />
                50% deposit<br />
                <span className="text-foreground/70">50% on delivery</span>
              </p>
            </div>
          </div>

          {/* Deliverables row */}
          <div className="animate-fade-up delay-1400">
            <p className="text-accent text-xs font-medium uppercase tracking-wider mb-1.5">Deliverables</p>
            <div className="flex flex-wrap gap-1.5">
              {['Présentation', 'MVP', 'POC', 'Devis', 'Brief'].map((tag) => (
                <span key={tag} className="text-[10px] font-mono bg-accent/8 border border-accent/15 text-accent/70 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between pt-1 border-t border-edge/50 animate-fade-in delay-1600">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-dot-pulse" />
              <span className="text-accent/70 text-xs font-mono">Generated in 28s</span>
            </div>
            <span className="text-muted/30 text-xs">Pro plan</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function LandingPage() {
  const t = useTranslations();

  /* ─── Stats counters ─── */
  const [briefsTotal, setBriefsTotal] = useState(1246);
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { if (d.total > 1246) setBriefsTotal(d.total); })
      .catch(() => {});
  }, []);
  const briefsCounter = useCountUp({ end: briefsTotal, duration: 2000 });
  const timeCounter = useCountUp({ end: 28, duration: 1200 });
  const langCounter = useCountUp({ end: 7, duration: 900 });

  return (
    <div className="min-h-screen bg-grid">

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-start px-4 sm:px-6 pt-24 sm:pt-16 text-center origin-glow overflow-hidden">

        {/* Crosshair axes — bottom quarter only, no overlap with CTAs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[72%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/8 to-transparent" />
          <div className="absolute left-1/2 top-[72%] bottom-0 w-px bg-gradient-to-b from-accent/8 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto">

          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 bg-accent/8 border border-accent/20 text-accent/80 text-xs font-medium px-3.5 py-1.5 rounded-full mb-8 font-mono tracking-wide">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-dot-pulse shrink-0" />
            Idée Express · Brief Guidé · 7 languages · Brief+
          </div>

          {/* H1 */}
          <h1 className="animate-fade-up delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground max-w-3xl mx-auto leading-[1.06] mb-5 px-2">
            Brief once.<br />
            <span className="text-accent">Ship faster.</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-up delay-200 text-base sm:text-lg md:text-xl text-muted max-w-xl mx-auto mb-10 leading-relaxed px-2">
            Generate investor-ready project briefs in 30 seconds.
            Présentation, MVP, POC, Devis&nbsp;— all in one click.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/brief/new">
              <button className="plot-point inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-black px-7 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 min-h-[48px] touch-manipulation shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98]">
                Start free
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </button>
            </Link>
            <a href="#how-it-works">
              <button className="inline-flex items-center justify-center gap-2 border border-edge hover:border-accent/35 text-muted hover:text-foreground px-7 py-3.5 rounded-xl font-medium text-base transition-all min-h-[48px] touch-manipulation">
                See how it works
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M8 3v10M4 9l4 4 4-4" />
                </svg>
              </button>
            </a>
          </div>

          {/* Trust note */}
          <p className="animate-fade-in delay-700 text-muted/30 text-xs mt-4 font-mono">
            Free forever · No credit card required
          </p>

          {/* Brief preview */}
          <BriefPreview />
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-fade-in delay-2000">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-accent/20" />
        </div>
      </section>

      {/* ═══════ SOCIAL PROOF STRIP ═══════ */}
      <div className="border-y border-edge py-7 overflow-hidden">
        <p className="text-center text-muted/40 text-xs font-mono tracking-widest uppercase mb-5 px-4">
          Trusted by founders, agencies &amp; tech teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 max-w-3xl mx-auto">
          {['STUDIO VOLTA', 'KERN & CO', 'NEXIO DIGITAL', 'ARCK LABS', 'NOVA BRAND', 'MERIDIAN'].map((name) => (
            <span key={name} className="text-muted/20 text-xs font-semibold tracking-[0.15em] select-none hover:text-muted/35 transition-colors whitespace-nowrap">
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <Section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-edge">
        <div className="max-w-4xl mx-auto">
          <p className="text-accent text-xs font-medium tracking-widest uppercase text-center mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-4 px-2">
            Three steps. One complete package.
          </h2>
          <p className="text-muted text-center text-sm sm:text-base mb-14 max-w-lg mx-auto">
            From a rough idea to an investor-ready brief in under 30 seconds.
          </p>

          <StaggerAxisReveal direction="horizontal" className="grid sm:grid-cols-3 gap-8 sm:gap-10">

            {/* Step 1 */}
            <div className="relative text-center">
              <div className="hidden sm:block absolute top-5 left-[62%] w-[76%] h-px bg-gradient-to-r from-edge via-accent/15 to-transparent" />
              <GlitchCoordinate trigger="hover">
                <div className="w-11 h-11 rounded-full border border-accent/30 flex items-center justify-center text-accent text-sm font-mono mx-auto mb-5 hover:border-accent/60 hover:bg-accent/5 transition-all">
                  01
                </div>
              </GlitchCoordinate>
              <h3 className="text-foreground font-semibold text-base mb-2.5">
                Choose your mode
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                <span className="text-accent/80">Idée Express</span> for instant generation, or{' '}
                <span className="text-accent/80">Brief Guidé</span> for a step-by-step flow tailored to your project.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="hidden sm:block absolute top-5 left-[62%] w-[76%] h-px bg-gradient-to-r from-edge via-accent/15 to-transparent" />
              <GlitchCoordinate trigger="hover">
                <div className="w-11 h-11 rounded-full border border-accent/30 flex items-center justify-center text-accent text-sm font-mono mx-auto mb-5 hover:border-accent/60 hover:bg-accent/5 transition-all">
                  02
                </div>
              </GlitchCoordinate>
              <h3 className="text-foreground font-semibold text-base mb-2.5">
                AI generates everything
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Présentation · MVP · POC · Devis · Brief&nbsp;— structured, detailed and client-ready in one pass.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center">
              <GlitchCoordinate trigger="hover">
                <div className="w-11 h-11 rounded-full border border-accent/30 flex items-center justify-center text-accent text-sm font-mono mx-auto mb-5 hover:border-accent/60 hover:bg-accent/5 transition-all">
                  03
                </div>
              </GlitchCoordinate>
              <h3 className="text-foreground font-semibold text-base mb-2.5">
                Export &amp; share
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Download as PDF, send a share link, or organize in folders. Your team and clients stay aligned from day one.
              </p>
            </div>

          </StaggerAxisReveal>
        </div>
      </Section>

      {/* ═══════ FEATURES ═══════ */}
      <Section className="py-16 sm:py-24 px-4 sm:px-6 border-b border-edge">
        <div className="max-w-5xl mx-auto">
          <p className="text-accent text-xs font-medium tracking-widest uppercase text-center mb-3">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-3 px-2">
            Built to brief. Built to ship.
          </h2>
          <p className="text-muted text-center text-sm mb-12 max-w-xl mx-auto">
            Every feature exists to get your deliverable out faster — with zero blank-page syndrome.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Feature 1 — Idée Express */}
            <div className="group bg-surface border border-edge rounded-2xl p-5 card-hover">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent/18 transition-colors text-lg">
                ⚡
              </div>
              <h3 className="text-foreground font-semibold mb-1.5 text-sm">Idée Express</h3>
              <p className="text-muted text-sm leading-relaxed">
                Describe your idea. Get a full document package&nbsp;— Présentation, MVP, POC, Devis and Brief&nbsp;— in 30 seconds.
              </p>
            </div>

            {/* Feature 2 — Brief+ */}
            <div className="group bg-surface border border-edge rounded-2xl p-5 card-hover relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent/18 transition-colors text-lg">
                📊
              </div>
              <h3 className="text-foreground font-semibold mb-1.5 text-sm">
                Brief+
                <span className="ml-2 text-[10px] font-mono border border-accent/25 text-accent/70 px-1.5 py-0.5 rounded">PRO</span>
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                ORIGO AI generates investor-ready PDFs with charts, tables and professional layout&nbsp;— ready to send to any stakeholder.
              </p>
            </div>

            {/* Feature 3 — Brief Library */}
            <div className="group bg-surface border border-edge rounded-2xl p-5 card-hover">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent/18 transition-colors text-lg">
                🗂️
              </div>
              <h3 className="text-foreground font-semibold mb-1.5 text-sm">Brief Library</h3>
              <p className="text-muted text-sm leading-relaxed">
                Organize, search and share your briefs. Color-coded folders, instant history, public share links. Collaborate with your team.
              </p>
            </div>

            {/* Feature 4 — Multi-language */}
            <div className="group bg-surface border border-edge rounded-2xl p-5 card-hover">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent/18 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <h3 className="text-foreground font-semibold mb-1.5 text-sm">7 Output Languages</h3>
              <p className="text-muted text-sm leading-relaxed">
                Generate briefs in English, French, German, Spanish, Italian, Russian or Chinese. One brief, every market.
              </p>
            </div>

            {/* Feature 5 — Share Anywhere */}
            <div className="group bg-surface border border-edge rounded-2xl p-5 card-hover">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent/18 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <h3 className="text-foreground font-semibold mb-1.5 text-sm">Share Anywhere</h3>
              <p className="text-muted text-sm leading-relaxed">
                Public share link. Client reviews online. No account needed on their end. No PDFs buried in email threads.
              </p>
            </div>

            {/* Feature 6 — Secure */}
            <div className="group bg-surface border border-edge rounded-2xl p-5 card-hover">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent/18 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3 className="text-foreground font-semibold mb-1.5 text-sm">Secure &amp; GDPR</h3>
              <p className="text-muted text-sm leading-relaxed">
                Data encrypted at rest. Supabase RLS. Your brief data is never sold or used for AI training. EU-compliant.
              </p>
            </div>

          </div>
        </div>
      </Section>

      {/* ═══════ PRICING PREVIEW ═══════ */}
      <Section className="py-16 sm:py-24 px-4 sm:px-6 border-b border-edge">
        <div className="max-w-5xl mx-auto">
          <p className="text-accent text-xs font-medium tracking-widest uppercase text-center mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-3 px-2">
            Start free. Upgrade when you're ready.
          </h2>
          <p className="text-muted text-center mb-10 text-base">No credit card required to start.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Free */}
            <div className="relative rounded-xl border border-edge bg-surface/60 p-5 flex flex-col gap-3 hover:border-accent/20 transition-all card-hover">
              <div>
                <p className="text-muted/50 text-xs mb-1">Try the product</p>
                <p className="text-foreground font-bold text-xl">$0</p>
                <p className="text-foreground/80 font-medium text-sm mt-0.5">Free</p>
              </div>
              <ul className="space-y-1.5 border-t border-edge/60 pt-3 flex-1">
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">3 briefs / month</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">Idée Express</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">Classic PDF export</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted/30 shrink-0">—</span>
                  <span className="text-muted/40">No folders</span>
                </li>
              </ul>
              <Link href="/signup">
                <button className="w-full py-2 rounded-lg text-xs font-medium border border-edge hover:border-accent/40 text-muted hover:text-foreground transition-all">
                  {t('pricing.free.cta')}
                </button>
              </Link>
            </div>

            {/* Starter */}
            <div className="relative rounded-xl border border-edge bg-surface/60 p-5 flex flex-col gap-3 hover:border-accent/20 transition-all card-hover">
              <div>
                <p className="text-muted/50 text-xs mb-1">For freelancers</p>
                <p className="text-foreground font-bold text-xl">
                  $4.99
                  <span className="text-muted text-xs font-normal">/mo</span>
                </p>
                <p className="text-foreground/80 font-medium text-sm mt-0.5">Starter</p>
              </div>
              <ul className="space-y-1.5 border-t border-edge/60 pt-3 flex-1">
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">10 briefs / month</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">Idée Express + Brief Guidé</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">Classic PDF export</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">1 folder · sharing</span>
                </li>
              </ul>
              <Link href="/pricing">
                <button className="w-full py-2 rounded-lg text-xs font-medium border border-edge hover:border-accent/40 text-muted hover:text-foreground transition-all">
                  {t('pricing.starter.cta')}
                </button>
              </Link>
            </div>

            {/* Pro — highlighted */}
            <div className="relative rounded-xl border border-accent/40 bg-gradient-to-b from-accent/5 to-transparent p-5 flex flex-col gap-3 shadow-lg shadow-accent/8 overflow-hidden card-hover">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
              <span className="absolute top-3.5 right-3.5 text-[9px] font-semibold text-accent border border-accent/25 px-1.5 py-0.5 rounded-full font-mono">
                POPULAR
              </span>
              <div>
                <p className="text-muted/50 text-xs mb-1">For makers &amp; agencies</p>
                <p className="text-foreground font-bold text-xl">
                  $14.99
                  <span className="text-muted text-xs font-normal">/mo</span>
                </p>
                <p className="text-foreground/80 font-medium text-sm mt-0.5">Pro</p>
              </div>
              <ul className="space-y-1.5 border-t border-edge/60 pt-3 flex-1">
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">50 briefs / month</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">Brief+</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">5 folders · sharing</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">Templates library</span>
                </li>
              </ul>
              <Link href="/pricing">
                <button className="w-full py-2 rounded-lg text-xs font-medium bg-accent hover:bg-accent-hover text-black transition-all">
                  {t('pricing.pro.cta')}
                </button>
              </Link>
            </div>

            {/* Premium */}
            <div className="relative rounded-xl border border-edge bg-surface/60 p-5 flex flex-col gap-3 hover:border-accent/20 transition-all card-hover">
              <div>
                <p className="text-muted/50 text-xs mb-1">All-inclusive</p>
                <p className="text-foreground font-bold text-xl">
                  $29.99
                  <span className="text-muted text-xs font-normal">/mo</span>
                </p>
                <p className="text-foreground/80 font-medium text-sm mt-0.5">Premium</p>
              </div>
              <ul className="space-y-1.5 border-t border-edge/60 pt-3 flex-1">
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">100 briefs / month</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">Everything in Pro</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">10 folders</span>
                </li>
                <li className="flex items-center gap-1.5 text-xs">
                  <span className="text-accent shrink-0">✓</span>
                  <span className="text-muted">24/7 priority support</span>
                </li>
              </ul>
              <Link href="/pricing">
                <button className="w-full py-2 rounded-lg text-xs font-medium border border-edge hover:border-accent/40 text-muted hover:text-foreground transition-all">
                  {t('pricing.premium.cta')}
                </button>
              </Link>
            </div>

          </div>

          <p className="text-center mt-6">
            <Link href="/pricing" className="text-accent/60 hover:text-accent text-sm transition-colors inline-flex items-center gap-1.5">
              Compare all plans
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4"/>
              </svg>
            </Link>
          </p>
        </div>
      </Section>

      {/* ═══════ STATS ═══════ */}
      <Section className="py-12 sm:py-16 px-4 sm:px-6 border-b border-edge">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 md:gap-16 text-center">
          <div>
            <div
              ref={briefsCounter.ref as React.RefObject<HTMLDivElement>}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent mb-1.5 font-mono tabular-nums"
            >
              +{briefsCounter.value}
            </div>
            <p className="text-xs sm:text-sm text-muted">Briefs generated</p>
          </div>
          <div>
            <div
              ref={timeCounter.ref as React.RefObject<HTMLDivElement>}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent mb-1.5 font-mono tabular-nums"
            >
              {timeCounter.value}s
            </div>
            <p className="text-xs sm:text-sm text-muted">Avg. generation time</p>
          </div>
          <div>
            <div
              ref={langCounter.ref as React.RefObject<HTMLDivElement>}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent mb-1.5 font-mono tabular-nums"
            >
              {langCounter.value}
            </div>
            <p className="text-xs sm:text-sm text-muted">Output languages</p>
          </div>
        </div>
        <p className="text-center text-muted/30 text-xs mt-8 font-mono">
          Indie-built · Solo dev · Vercel · Stripe · GDPR
        </p>
      </Section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 text-center origin-glow overflow-hidden">
        {/* Crosshair bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/10 to-transparent" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent/10 to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-accent/40 text-xs font-mono tracking-widest border border-accent/15 rounded-sm px-3 py-1 inline-block mb-8">
            ORIGO / BRIEF.CREATE
          </p>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-5 px-2 leading-tight">
            Start building today.<br />
            <span className="text-accent">Your first brief is free.</span>
          </h2>

          <p className="text-muted text-base sm:text-lg mb-3 max-w-md mx-auto leading-relaxed px-2">
            No blank page. No back-and-forth. Describe your project once, get everything your client needs in 30 seconds.
          </p>
          <p className="text-muted/30 text-sm mb-10 font-mono">
            <span className="text-accent/50">$</span> origo brief --new&nbsp;
            <span className="animate-pulse">_</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/brief/new">
              <button className="plot-point inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-black px-8 py-4 rounded-xl font-semibold text-base transition-all duration-200 min-h-[52px] touch-manipulation shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98]">
                Start free
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </button>
            </Link>
            <Link href="/pricing">
              <button className="inline-flex items-center justify-center border border-edge hover:border-accent/35 text-muted hover:text-foreground px-8 py-4 rounded-xl font-medium text-base transition-all min-h-[52px] touch-manipulation">
                See pricing
              </button>
            </Link>
          </div>

          <p className="text-muted/20 text-xs mt-5 font-mono">
            Free forever · Upgrade when it makes sense
          </p>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-edge py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">

            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <p className="text-foreground font-bold text-lg mb-2 font-mono">ORIGO</p>
              <p className="text-muted/50 text-xs leading-relaxed max-w-[180px]">
                AI-powered project briefs for teams that move fast.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-foreground/50 text-xs font-semibold uppercase tracking-wider mb-3">{t('footer.product')}</p>
              <nav className="flex flex-col gap-2">
                <Link href="/pricing" className="text-muted/60 hover:text-foreground text-sm transition-colors">{t('footer.pricing')}</Link>
                <Link href="/brief/new" className="text-muted/60 hover:text-foreground text-sm transition-colors">{t('nav.newBrief')}</Link>
                <Link href="/history" className="text-muted/60 hover:text-foreground text-sm transition-colors">{t('nav.yourBriefs')}</Link>
              </nav>
              <div className="flex flex-wrap gap-1 mt-4">
                {[
                  { label: 'EN', href: '/' },
                  { label: 'FR', href: '/fr' },
                  { label: 'DE', href: '/de' },
                  { label: 'ES', href: '/es' },
                  { label: 'IT', href: '/it' },
                  { label: 'RU', href: '/ru' },
                  { label: 'ZH', href: '/zh' },
                ].map(({ label, href }) => (
                  <button
                    key={label}
                    onClick={() => { window.location.href = href; }}
                    className="bg-surface border border-edge rounded px-1.5 py-0.5 text-[10px] text-muted/40 font-mono hover:text-accent/70 hover:border-accent/30 transition-colors cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <p className="text-foreground/50 text-xs font-semibold uppercase tracking-wider mb-3">{t('footer.legal')}</p>
              <nav className="flex flex-col gap-2">
                <Link href="/privacy" className="text-muted/60 hover:text-foreground text-sm transition-colors">{t('footer.privacy')}</Link>
                <Link href="/legal" className="text-muted/60 hover:text-foreground text-sm transition-colors">{t('footer.terms')}</Link>
              </nav>
            </div>

            {/* Connect */}
            <div>
              <p className="text-foreground/50 text-xs font-semibold uppercase tracking-wider mb-3">Connect</p>
              <nav className="flex flex-col gap-2">
                <a href="https://github.com/ArthurPcd" target="_blank" rel="noopener noreferrer"
                  className="text-muted/60 hover:text-foreground text-sm transition-colors inline-flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                  GitHub
                </a>
                <a href="https://www.linkedin.com/in/arthurpacaud/" target="_blank" rel="noopener noreferrer"
                  className="text-muted/60 hover:text-foreground text-sm transition-colors inline-flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>
              </nav>
            </div>
          </div>

          <div className="pt-6 border-t border-edge/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-muted/35 text-xs">© 2026 Origo. {t('footer.allRightsReserved')}</p>
            <p className="text-muted/20 text-xs font-mono">
              7 languages · 4 plans · 1 product
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

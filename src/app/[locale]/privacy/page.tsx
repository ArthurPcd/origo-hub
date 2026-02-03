"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function PrivacyPolicyPage() {
  const t = useTranslations("legal");
  return (
    <main className="min-h-screen py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            {t("backToHome")}
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted text-sm">Last updated: February 2025</p>
        </div>

        <div className="space-y-8 text-muted leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Introduction</h2>
            <p>
              ORIGO (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;the service&rdquo;) is a project brief generation tool
              operated by Pacaud Services. This policy explains how we collect, use, and protect your data
              when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Data We Collect</h2>
            <p className="mb-3"><strong className="text-foreground">Data you provide:</strong></p>
            <ul className="list-disc ml-6 space-y-1.5">
              <li>Email address and password when creating an account</li>
              <li>Project information entered in questionnaires (client details, goals, deliverables, etc.)</li>
              <li>Generated brief content stored in your account</li>
            </ul>
            <p className="mt-4 mb-3"><strong className="text-foreground">Data collected automatically:</strong></p>
            <ul className="list-disc ml-6 space-y-1.5">
              <li>Basic usage analytics (page views, feature usage)</li>
              <li>Browser type and device information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">How We Use Your Data</h2>
            <ul className="list-disc ml-6 space-y-1.5">
              <li>To generate project briefs based on your questionnaire answers</li>
              <li>To store and display your brief history</li>
              <li>To authenticate your account</li>
              <li>To improve the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Storage &amp; Security</h2>
            <p className="mb-3">
              <strong className="text-foreground">AI Key:</strong> Your Origo AI key is stored exclusively
              in your browser&apos;s local storage. It is never sent to our servers or stored in our database.
              The key is transmitted directly from your browser to Anthropic&apos;s API for brief generation.
            </p>
            <p className="mb-3">
              <strong className="text-foreground">Brief Content:</strong> Your generated briefs and questionnaire
              answers are stored in a secure Supabase database with row-level security, ensuring only you can
              access your data.
            </p>
            <p>
              <strong className="text-foreground">Authentication:</strong> Account authentication is handled
              by Supabase Auth with industry-standard security practices including encrypted passwords and
              secure session management.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Third-Party Services</h2>
            <ul className="list-disc ml-6 space-y-1.5">
              <li>
                <strong className="text-foreground">Anthropic (Origo AI):</strong> Your questionnaire answers
                are sent to Anthropic&apos;s API to generate briefs, using your own AI key. Refer to{" "}
                <a href="https://www.anthropic.com/privacy" className="text-accent hover:text-accent-soft transition-colors" target="_blank" rel="noopener noreferrer">
                  Anthropic&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-foreground">Supabase:</strong> Used for authentication and data storage.
                Refer to{" "}
                <a href="https://supabase.com/privacy" className="text-accent hover:text-accent-soft transition-colors" target="_blank" rel="noopener noreferrer">
                  Supabase&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-foreground">Vercel:</strong> Hosts the application. Refer to{" "}
                <a href="https://vercel.com/legal/privacy-policy" className="text-accent hover:text-accent-soft transition-colors" target="_blank" rel="noopener noreferrer">
                  Vercel&apos;s Privacy Policy
                </a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Your Rights</h2>
            <ul className="list-disc ml-6 space-y-1.5">
              <li><strong className="text-foreground">Access:</strong> View all your stored data through the app</li>
              <li><strong className="text-foreground">Delete:</strong> Delete individual briefs or your entire account at any time</li>
              <li><strong className="text-foreground">Export:</strong> Export your briefs as PDF documents</li>
              <li><strong className="text-foreground">Opt-Out:</strong> You can stop using the service and delete your account at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Cookies</h2>
            <p>
              ORIGO uses essential cookies for authentication and session management only.
              We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. Changes will be reflected on this page
              with an updated date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Contact</h2>
            <p>
              For any questions regarding this policy, contact us at{" "}
              <a href="mailto:origo.team.dev@gmail.com" className="text-accent hover:text-accent-soft transition-colors">
                origo.team.dev@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

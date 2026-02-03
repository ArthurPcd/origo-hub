"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function LegalNoticePage() {
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
          <h1 className="text-3xl font-bold text-foreground">Legal Notice</h1>
        </div>

        <div className="space-y-8 text-muted leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Publisher</h2>
            <ul className="space-y-1.5">
              <li><strong className="text-foreground">Service:</strong> ORIGO — Project brief generation tool</li>
              <li><strong className="text-foreground">Operated by:</strong> Pacaud Services</li>
              <li><strong className="text-foreground">Contact:</strong>{" "}
                <a href="mailto:origo.team.dev@gmail.com" className="text-accent hover:text-accent-soft transition-colors">
                  origo.team.dev@gmail.com
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Hosting</h2>
            <ul className="space-y-1.5">
              <li><strong className="text-foreground">Provider:</strong> Vercel Inc.</li>
              <li><strong className="text-foreground">Address:</strong> 440 N Barranca Ave #4133, Covina, CA 91723, USA</li>
              <li><strong className="text-foreground">Website:</strong>{" "}
                <a href="https://vercel.com" className="text-accent hover:text-accent-soft transition-colors" target="_blank" rel="noopener noreferrer">
                  vercel.com
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Intellectual Property</h2>
            <p>
              The ORIGO name, branding, and interface design are the property of Pacaud Services.
              Generated brief content belongs to the user who created it. The service uses
              Anthropic&apos;s technology (Origo AI) for content generation — Anthropic&apos;s terms of service apply
              to AI-generated outputs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Origo AI Usage</h2>
            <p>
              ORIGO operates on a Bring Your Own Key (BYOK) model. Users provide their own
              Origo AI key to generate briefs. The service does not include or provide AI
              access — users are responsible for their own AI key and associated costs.
              AI keys are stored locally in the user&apos;s browser and never transmitted to our servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Disclaimer</h2>
            <p>
              ORIGO is provided &ldquo;as is&rdquo; without warranty of any kind. Generated briefs are
              AI-assisted outputs intended as starting points — users should review and adapt
              them to their specific needs. Pacaud Services is not liable for any decisions made
              based on generated content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Contact</h2>
            <p>
              For any questions regarding this notice, contact us at{" "}
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

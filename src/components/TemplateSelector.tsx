"use client";

import { useTranslations } from "next-intl";
import { templates, Template } from "@/lib/templates";

interface TemplateSelectorProps {
  onSelect: (template: Template | null) => void;
  onSkip: () => void;
}

const TEMPLATE_CODES: Record<string, string> = {
  "product-launch": "PRD",
  "event-conference": "EVT",
  "rebranding": "RBD",
  "content-campaign": "CNT",
  "app-launch": "APP",
};

export default function TemplateSelector({ onSelect, onSkip }: TemplateSelectorProps) {
  const t = useTranslations('templates');

  return (
    <div className="min-h-screen bg-grid flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="mb-10">
          <p className="text-accent text-xs font-medium tracking-wider uppercase mb-3">
            {t('title')}
          </p>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t('subtitle')}
          </h1>
          <p className="text-muted text-sm">
            {t('hint')}
          </p>
        </div>

        {/* Template list */}
        <div className="space-y-1 mb-8">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="group w-full text-left flex items-center gap-5 px-4 py-4 border border-transparent hover:border-edge hover:bg-surface rounded-lg transition-all"
            >
              <span className="text-accent font-mono text-xs tracking-widest w-8 shrink-0">
                {TEMPLATE_CODES[template.id]}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-foreground text-sm font-medium group-hover:text-accent transition-colors">
                  {t(`types.${template.nameKey}.name`)}
                </span>
                <span className="text-muted text-xs block mt-0.5 truncate">
                  {t(`types.${template.nameKey}.description`)}
                </span>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-muted/30 group-hover:text-accent transition-colors shrink-0"
              >
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-edge" />
          <span className="text-muted/40 text-xs font-mono">OR</span>
          <div className="flex-1 h-px bg-edge" />
        </div>

        {/* Start from scratch */}
        <button
          onClick={onSkip}
          className="group w-full text-left flex items-center gap-5 px-4 py-4 border border-transparent hover:border-edge hover:bg-surface rounded-lg transition-all"
        >
          <span className="text-muted/40 font-mono text-xs tracking-widest w-8 shrink-0">
            —
          </span>
          <div className="flex-1">
            <span className="text-muted text-sm font-medium group-hover:text-foreground transition-colors">
              {t('fromScratch.name')}
            </span>
            <span className="text-muted/50 text-xs block mt-0.5">
              {t('fromScratch.description')}
            </span>
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-muted/20 group-hover:text-muted/60 transition-colors shrink-0"
          >
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

      </div>
    </div>
  );
}

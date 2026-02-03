"use client";

import { useTranslations } from "next-intl";
import { questionIds } from "@/lib/questions";

interface ProgressTrackerProps {
  currentStep: number;
}

export default function ProgressTracker({ currentStep }: ProgressTrackerProps) {
  const t = useTranslations('brief.new');

  return (
    <div className="w-56 shrink-0">
      <div className="mb-6">
        <p className="text-muted text-xs uppercase tracking-wider mb-2">
          {t('progress')}
        </p>
        <div className="h-1 bg-edge rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / questionIds.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-muted text-xs mt-2">
          {currentStep + 1} {t('of')} {questionIds.length}
        </p>
      </div>

      <nav className="space-y-1">
        {questionIds.map((qId, i) => (
          <div
            key={qId}
            className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${
              i === currentStep ? "bg-surface" : ""
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                i < currentStep
                  ? "bg-accent text-black"
                  : i === currentStep
                    ? "border-2 border-accent"
                    : "border border-edge"
              }`}
            >
              {i < currentStep && (
                <svg
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span
              className={`text-sm truncate ${
                i === currentStep
                  ? "text-foreground"
                  : i < currentStep
                    ? "text-muted"
                    : "text-muted/50"
              }`}
            >
              {t(`questions.${qId}.label`)}
            </span>
          </div>
        ))}
      </nav>
    </div>
  );
}

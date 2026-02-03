"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefCount?: number;
  briefLimit?: number;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  briefCount = 3,
  briefLimit = 3,
}: UpgradeModalProps) {
  const t = useTranslations('upgradeModal');
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-edge rounded-xl max-w-sm w-full axis-markers">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <p className="text-muted text-xs font-mono tracking-wider uppercase">
            {t('title')}
          </p>
          <button
            onClick={onClose}
            className="text-muted/40 hover:text-muted transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Limit indicator */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-mono text-4xl font-bold text-foreground">{briefCount}</span>
            <span className="font-mono text-lg text-muted">/ {briefLimit}</span>
            <span className="text-muted text-sm ml-1">briefs used</span>
          </div>

          {/* Progress bar */}
          <div className="h-px bg-edge mb-6 relative overflow-hidden rounded-full">
            <div
              className="absolute inset-y-0 left-0 bg-accent transition-all"
              style={{ width: briefLimit > 0 ? `${Math.min((briefCount / briefLimit) * 100, 100)}%` : '100%' }}
            />
          </div>

          {/* Copy */}
          <p className="text-muted text-sm leading-relaxed mb-6">
            {t('description', { count: briefCount, limit: briefLimit })}
          </p>

          {/* Benefits */}
          <ul className="space-y-2 mb-8">
            {(['benefit1', 'benefit2', 'benefit3'] as const).map((key) => (
              <li key={key} className="flex items-start gap-3 text-sm text-foreground">
                <span className="text-accent font-mono text-xs mt-0.5 shrink-0">→</span>
                {t(key)}
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleUpgrade}
              className="w-full bg-accent hover:bg-accent-hover text-[#0a0a0a] font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
            >
              {t('upgradeButton')}
            </button>
            <button
              onClick={onClose}
              className="w-full text-muted hover:text-foreground font-medium py-2.5 text-sm transition-colors"
            >
              {t('cancelButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

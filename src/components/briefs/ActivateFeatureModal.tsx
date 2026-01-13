'use client';

import { useState } from 'react';

interface ActivateFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (featureCode: string) => void;
}

export function ActivateFeatureModal({ isOpen, onClose, onSuccess }: ActivateFeatureModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/features/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid activation code. Please try again.');
        return;
      }

      setSuccess(`Feature "${data.feature?.code || 'unknown'}" activated successfully!`);
      setCode('');
      onSuccess?.(data.feature?.code);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setCode('');
    setError(null);
    setSuccess(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-surface border border-edge rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-edge">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">Activation Code</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-muted hover:text-foreground transition-colors p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-muted text-sm mb-6">
            Enter your exclusive activation code to unlock special features like the Collector Edition with album-style cards and advanced customization.
          </p>

          {success ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-green-400 font-semibold mb-1">Feature Unlocked!</p>
              <p className="text-muted text-sm">{success}</p>
              <button
                onClick={handleClose}
                className="mt-4 bg-accent hover:bg-accent-hover text-black px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-muted text-xs font-medium uppercase tracking-wider mb-2">
                  Activation Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  maxLength={16}
                  className="w-full bg-base border border-edge focus:border-accent/50 focus:ring-1 focus:ring-accent/20 rounded-lg px-4 py-3 text-foreground font-mono text-sm tracking-widest uppercase placeholder:text-muted/30 placeholder:normal-case placeholder:tracking-normal transition-all outline-none"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.trim().length < 4}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-black py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Activating...
                  </>
                ) : (
                  'Activate'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

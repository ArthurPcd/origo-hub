'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Palette, Lock } from 'lucide-react';

interface Skin {
  id: string;
  name: string;
  tier: 'collector' | 'pro' | 'premium';
  config: {
    accentColor: string;
    borderStyle: string;
    showLogo: boolean;
    bookMode: boolean;
  };
}

interface SkinSelectorProps {
  currentSkinId?: string | null;
  userTier: 'free' | 'starter' | 'pro' | 'premium';
  onSkinSelect: (skinId: string | null) => void;
  className?: string;
}

/**
 * Skin Selector Component
 * - Displays available skins based on user tier
 * - Shows locked skins with upgrade prompt
 * - Allows selection of skin for brief
 */
export function SkinSelector({
  currentSkinId,
  userTier,
  onSkinSelect,
  className = '',
}: SkinSelectorProps) {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkins();
  }, []);

  async function loadSkins() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('brief_skins')
        .select('*')
        .order('tier', { ascending: true });

      if (error) throw error;
      setSkins(data || []);
    } catch (err) {
      console.error('Error loading skins:', err);
    } finally {
      setLoading(false);
    }
  }

  function isLocked(skinTier: string): boolean {
    if (userTier === 'premium') return false;
    if (userTier === 'pro' && skinTier !== 'premium') return false;
    if (userTier === 'starter' && skinTier === 'collector') return false;
    return skinTier !== 'collector'; // Free users can only use collector
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-edge border-t-accent" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Palette size={20} className="text-accent" />
        <h3 className="text-foreground font-semibold text-lg">Select Brief Skin</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Default (no skin) option */}
        <button
          onClick={() => onSkinSelect(null)}
          className={`p-4 rounded-lg border-2 transition-all ${
            !currentSkinId
              ? 'border-accent bg-accent/10'
              : 'border-edge hover:border-accent/50'
          }`}
        >
          <div className="text-sm font-medium text-foreground mb-1">Default</div>
          <div className="text-xs text-muted">Standard brief</div>
        </button>

        {/* Skin options */}
        {skins.map((skin) => {
          const locked = isLocked(skin.tier);

          return (
            <button
              key={skin.id}
              onClick={() => !locked && onSkinSelect(skin.id)}
              disabled={locked}
              className={`p-4 rounded-lg border-2 transition-all relative ${
                currentSkinId === skin.id
                  ? 'border-accent bg-accent/10'
                  : locked
                  ? 'border-edge opacity-50 cursor-not-allowed'
                  : 'border-edge hover:border-accent/50'
              }`}
            >
              {locked && (
                <div className="absolute top-2 right-2">
                  <Lock size={14} className="text-muted" />
                </div>
              )}

              <div
                className="w-full h-12 rounded mb-2"
                style={{
                  background: `linear-gradient(135deg, ${skin.config.accentColor}40, ${skin.config.accentColor}10)`,
                }}
              />

              <div className="text-sm font-medium text-foreground mb-1">{skin.name}</div>
              <div className="text-xs text-muted capitalize">{skin.tier}</div>
            </button>
          );
        })}
      </div>

      {/* Upgrade prompt for locked skins */}
      {skins.some((s) => isLocked(s.tier)) && (
        <div className="mt-4 p-4 rounded-lg bg-surface border border-edge">
          <p className="text-sm text-muted">
            🔒 Upgrade to <span className="text-accent font-medium">Pro</span> or{' '}
            <span className="text-accent font-medium">Premium</span> to unlock more skins
          </p>
        </div>
      )}
    </div>
  );
}

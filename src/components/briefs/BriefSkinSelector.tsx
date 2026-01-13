'use client';

import { useState, useEffect } from 'react';
import { BriefSkin } from '@/lib/types';
import { SkinRepository } from '@/lib/repositories/skins';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client-browser';

interface BriefSkinSelectorProps {
  currentSkinId: string | null;
  onSkinChange: (skinId: string | null) => void;
}

export function BriefSkinSelector({ currentSkinId, onSkinChange }: BriefSkinSelectorProps) {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const [skins, setSkins] = useState<BriefSkin[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function loadSkins() {
      const skinRepo = new SkinRepository(supabase, user!.id);
      const availableSkins = await skinRepo.getAvailableForUser();
      setSkins(availableSkins);
      setLoading(false);
    }
    loadSkins();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="h-10 w-32 bg-edge rounded-lg animate-pulse" />
    );
  }

  const currentSkin = skins.find(s => s.id === currentSkinId);

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-surface border border-edge hover:border-accent/30 rounded-lg text-sm transition-colors min-h-[44px]"
      >
        {/* Color preview dot */}
        {currentSkin && (
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: currentSkin.config.accentColor }}
          />
        )}
        <span className="text-foreground">
          {currentSkin ? currentSkin.name : 'Default'}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute top-full left-0 mt-2 w-56 bg-surface border border-edge rounded-lg shadow-lg overflow-hidden z-20">
            {/* Default option */}
            <button
              onClick={() => {
                onSkinChange(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-edge min-h-[44px] ${
                !currentSkinId
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-foreground hover:bg-edge'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-muted shrink-0" />
              <span>Default</span>
            </button>

            {/* Available skins */}
            {skins.map((skin) => (
              <button
                key={skin.id}
                onClick={() => {
                  onSkinChange(skin.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-edge last:border-b-0 min-h-[44px] ${
                  currentSkinId === skin.id
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-foreground hover:bg-edge'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: skin.config.accentColor }}
                />
                <div className="flex flex-col items-start">
                  <span>{skin.name}</span>
                  <span className="text-xs text-muted capitalize">{skin.tier}</span>
                </div>
                {currentSkinId === skin.id && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="ml-auto text-accent"
                  >
                    <polyline points="3 8 6 11 13 4" />
                  </svg>
                )}
              </button>
            ))}

            {skins.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-muted text-sm mb-2">No skins available</p>
                <p className="text-muted/60 text-xs">
                  Upgrade your plan to unlock custom skins
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

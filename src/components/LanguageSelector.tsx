'use client';

import { useLocale } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n/config';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'inline';
}

export function LanguageSelector({ variant = 'dropdown' }: LanguageSelectorProps = {}) {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    setIsLoading(true);
    setIsOpen(false);

    // Get current window location
    const currentUrl = window.location.pathname;

    // Remove any existing locale prefix (handles /en, /en/, /fr, /fr/, etc.)
    const pathWithoutLocale = currentUrl.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

    // Build new URL with locale prefix (always add /en to ensure navigation happens)
    const newUrl = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;

    // Navigate to new locale with a full page reload so next-intl middleware triggers
    window.location.href = newUrl;
  };

  // Inline variant for mobile menu (collapsible dropdown)
  if (variant === 'inline') {
    return (
      <div className="flex flex-col">
        {/* Dropdown button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted hover:text-foreground hover:bg-surface active:bg-surface transition-colors rounded-lg min-h-[48px]"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg opacity-80">{localeFlags[locale as Locale]}</span>
            <span>{localeNames[locale as Locale]}</span>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="4 6 8 10 12 6" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="flex flex-col gap-1 mt-1 px-2">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => {
                  handleLocaleChange(loc);
                  setIsOpen(false);
                }}
                disabled={isLoading}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-lg min-h-[48px] ${
                  locale === loc
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-muted hover:text-foreground hover:bg-surface active:bg-surface'
                }`}
              >
                <span className="text-lg opacity-80">{localeFlags[loc]}</span>
                <span>{localeNames[loc]}</span>
                {locale === loc && (
                  <div className="w-1.5 h-1.5 rounded-full bg-accent ml-auto animate-dot-pulse" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-surface active:bg-surface text-sm transition-colors min-h-[44px] touch-manipulation"
        aria-label="Select language"
        disabled={isLoading}
      >
        <span className="text-base opacity-80">{localeFlags[locale as Locale]}</span>
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

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-surface border border-edge rounded-lg shadow-lg overflow-hidden">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              disabled={isLoading}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors border-b border-edge last:border-b-0 min-h-[44px] touch-manipulation ${
                locale === loc
                  ? 'bg-edge text-foreground font-medium'
                  : 'text-muted hover:text-foreground hover:bg-edge active:bg-edge'
              }`}
            >
              <span className="text-base opacity-80">{localeFlags[loc]}</span>
              <span className="text-xs">{localeNames[loc]}</span>
              {locale === loc && (
                <div className="w-1.5 h-1.5 rounded-full bg-accent ml-auto animate-dot-pulse" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

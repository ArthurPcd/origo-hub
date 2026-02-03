"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUser, useClerk } from "@clerk/nextjs";
import { LanguageSelector } from "./LanguageSelector";
import Logo from "./Logo";
import BuyCreditsModal from "./BuyCreditsModal";

export default function Header() {
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect active route (strip locale prefix for comparison)
  const strippedPath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  const isActive = (href: string) => {
    if (href === '/') return strippedPath === '/';
    return strippedPath.startsWith(href);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    router.push("/");
  }

  const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  // Nav link base classes + active indicator
  function navLinkClass(href: string) {
    const active = isActive(href);
    return [
      "relative text-sm transition-colors min-h-[44px] flex items-center px-2 touch-manipulation",
      "after:absolute after:bottom-0 after:left-2 after:right-2 after:h-px after:rounded-full after:transition-all after:duration-200",
      active
        ? "text-accent after:bg-accent after:opacity-100"
        : "text-muted hover:text-foreground after:opacity-0 hover:after:opacity-40 hover:after:bg-accent",
    ].join(" ");
  }

  function mobileNavLinkClass(href: string) {
    const active = isActive(href);
    return [
      "text-base transition-colors min-h-[48px] flex items-center px-4 rounded-lg touch-manipulation",
      active
        ? "text-accent bg-accent/8 font-medium"
        : "text-muted hover:text-foreground hover:bg-surface active:bg-surface",
    ].join(" ");
  }

  return (
    <>
    <header className="border-b border-edge sticky top-0 bg-base/95 backdrop-blur-sm z-50 safe-area-inset-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="min-h-[44px] flex items-center touch-manipulation">
          <Logo size="md" />
        </Link>

        {/* Desktop Nav (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/pricing"
            className={navLinkClass('/pricing')}
          >
            {t('pricing')}
          </Link>
          {isLoaded && isSignedIn && (
            <button
              onClick={() => setShowBuyCredits(true)}
              className="text-accent hover:text-accent-soft active:text-accent-soft text-sm font-medium transition-colors min-h-[44px] flex items-center px-2 touch-manipulation"
            >
              {t('buyCredits')}
            </button>
          )}
          <LanguageSelector />
          {!isLoaded || !isSignedIn ? (
            <>
              <Link
                href="/login"
                className={navLinkClass('/login')}
              >
                {t('signIn')}
              </Link>
              <Link
                href="/signup"
                className="ml-1 bg-accent hover:bg-accent-hover active:bg-accent-hover text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center touch-manipulation"
              >
                {t('createBrief')}
              </Link>
            </>
          ) : (
            <div className="relative ml-1" ref={dropdownRef}>
              <button
                onClick={() => setOpen(!open)}
                className={[
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors min-h-[44px] touch-manipulation border",
                  open
                    ? "bg-surface border-accent/40 text-foreground"
                    : "hover:bg-surface active:bg-surface border-transparent hover:border-edge",
                ].join(" ")}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-dot-pulse flex-shrink-0" />
                <span className="text-muted text-xs truncate max-w-[120px]">
                  {userEmail}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-muted transition-transform flex-shrink-0 ${
                    open ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="4 6 8 10 12 6" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {open && (
                <div className="absolute right-0 mt-2 w-52 bg-surface border border-edge rounded-xl shadow-xl overflow-hidden brief-lock-in">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-edge">
                    <p className="text-xs text-muted truncate">{userEmail}</p>
                  </div>
                  <Link
                    href="/history"
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors border-b border-edge min-h-[44px] touch-manipulation",
                      isActive('/history')
                        ? "text-accent bg-accent/5"
                        : "text-muted hover:text-foreground hover:bg-edge active:bg-edge",
                    ].join(" ")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {t('yourBriefs')}
                  </Link>
                  <Link
                    href="/brief/new"
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors border-b border-edge min-h-[44px] touch-manipulation",
                      isActive('/brief/new')
                        ? "text-accent bg-accent/5"
                        : "text-muted hover:text-foreground hover:bg-edge active:bg-edge",
                    ].join(" ")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {t('newBrief')}
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors border-b border-edge min-h-[44px] touch-manipulation",
                      isActive('/account')
                        ? "text-accent bg-accent/5"
                        : "text-muted hover:text-foreground hover:bg-edge active:bg-edge",
                    ].join(" ")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                    {t('settings')}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-edge active:bg-edge transition-colors min-h-[44px] touch-manipulation"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    {t('signOut')}
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg hover:bg-surface active:bg-surface transition-colors touch-manipulation"
          aria-label="Menu"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={mobileMenuOpen ? "text-accent" : "text-muted"}
          >
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

      </div>

      {/* Buy Credits Modal */}
      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
      />
    </header>

    {/* Mobile Menu Overlay - Outside header for full screen */}
    {mobileMenuOpen && (
      <div className="md:hidden fixed inset-0 top-[57px] bg-base/98 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <nav className="flex flex-col p-4 gap-1">
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className={mobileNavLinkClass('/pricing')}
              >
                {t('pricing')}
              </Link>

              {isLoaded && isSignedIn && (
                <button
                  onClick={() => {
                    setShowBuyCredits(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-accent hover:text-accent-soft active:text-accent-soft text-base font-medium transition-colors min-h-[48px] flex items-center px-4 rounded-lg hover:bg-surface active:bg-surface touch-manipulation text-left"
                >
                  {t('buyCredits')}
                </button>
              )}

              {isLoaded && isSignedIn ? (
                <>
                  <div className="border-t border-edge my-2" />
                  {/* User email display */}
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 animate-dot-pulse" />
                    <p className="text-xs text-muted truncate">{userEmail}</p>
                  </div>
                  <Link
                    href="/history"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass('/history')}
                  >
                    {t('yourBriefs')}
                  </Link>
                  <Link
                    href="/brief/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass('/brief/new')}
                  >
                    {t('newBrief')}
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass('/account')}
                  >
                    {t('settings')}
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-red-400/70 hover:text-red-400 active:text-red-400 text-base transition-colors min-h-[48px] flex items-center px-4 rounded-lg hover:bg-surface active:bg-surface touch-manipulation text-left"
                  >
                    {t('signOut')}
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-edge my-2" />
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={mobileNavLinkClass('/login')}
                  >
                    {t('signIn')}
                  </Link>
                  <Link
                    href="/brief/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-accent hover:bg-accent-hover active:bg-accent-hover text-black text-base font-medium min-h-[48px] flex items-center justify-center px-4 rounded-lg transition-colors touch-manipulation"
                  >
                    {t('createBrief')}
                  </Link>
                </>
              )}

              <div className="border-t border-edge my-2" />
              <LanguageSelector variant="inline" />
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

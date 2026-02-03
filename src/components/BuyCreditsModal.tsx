"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { getUserSubscription } from "@/lib/subscription";

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// SECURITY: Must match server-side CREDIT_PACKAGES in /api/buy-credits/route.ts
const CREDIT_TIERS = [
  { credits: 5, price: 5, pricePerCredit: 1.00 },
  { credits: 10, price: 9, pricePerCredit: 0.90 },
  { credits: 25, price: 20, pricePerCredit: 0.80 },
  { credits: 50, price: 35, pricePerCredit: 0.70 },
  { credits: 100, price: 60, pricePerCredit: 0.60 },
];

export default function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const t = useTranslations("buyCredits");
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState(2); // Default to 25 credits
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const tier = CREDIT_TIERS[selectedTier];

  async function handlePurchase() {
    setLoading(true);
    try {
      // SECURITY: Only send credits count, server determines price
      const response = await fetch("/api/buy-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: tier.credits }),
      });

      if (!response.ok) throw new Error("Purchase failed");

      const { checkoutUrl } = await response.json();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to process purchase. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface border border-edge rounded-xl max-w-lg w-full p-6 sm:p-8 relative my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t("title")}
          </h2>
          <p className="text-foreground/70 text-sm">
            {t("description")}
          </p>
        </div>

        {/* Credit amount display */}
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 mb-6 text-center relative">
          <p className="text-muted text-sm mb-2">{t("youWillGet")}</p>
          <p className="text-5xl font-bold text-foreground mb-2">
            {tier.credits}
          </p>
          <p className="text-accent text-sm font-medium">
            {t("credits")}
          </p>
          <p className="text-muted text-xs mt-2">
            ${tier.pricePerCredit.toFixed(2)} per credit
          </p>
        </div>

        {/* Slider */}
        <div className="mb-8">
          <input
            type="range"
            min="0"
            max={CREDIT_TIERS.length - 1}
            value={selectedTier}
            onChange={(e) => setSelectedTier(parseInt(e.target.value))}
            className="w-full h-2 bg-edge rounded-lg appearance-none cursor-pointer slider-thumb"
          />
          <div className="flex justify-between mt-2 px-1">
            {CREDIT_TIERS.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelectedTier(i)}
                className={`text-xs transition-colors ${
                  i === selectedTier ? "text-accent font-semibold" : "text-muted/50"
                }`}
              >
                {t.credits}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing details */}
        <div className="bg-base/50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-foreground/70 text-sm">{t("totalPrice")}</span>
            <span className="text-foreground font-semibold text-lg">
              ${tier.price}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted">{t("pricePerCredit")}</span>
            <span className="text-accent">
              ${tier.pricePerCredit.toFixed(2)}/{t("credit")}
            </span>
          </div>
          {tier.credits >= 25 && (
            <div className="pt-2 border-t border-edge/50">
              <p className="text-emerald-400 text-xs font-medium">
                🎉 Best value: Save up to ${(tier.credits - tier.price).toFixed(0)} with bulk purchase!
              </p>
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="mb-6 space-y-2">
          <p className="text-xs text-muted uppercase tracking-wider font-medium mb-3">
            {t("benefits.title")}
          </p>
          <div className="flex items-start gap-2 text-sm text-foreground/70">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent shrink-0 mt-0.5">
              <polyline points="3 8 6 11 13 4" />
            </svg>
            <span>{t("benefits.item1")}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-foreground/70">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent shrink-0 mt-0.5">
              <polyline points="3 8 6 11 13 4" />
            </svg>
            <span>{t("benefits.item2")}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-foreground/70">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent shrink-0 mt-0.5">
              <polyline points="3 8 6 11 13 4" />
            </svg>
            <span>{t("benefits.item3")}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-edge hover:border-accent/30 text-foreground py-3 rounded-lg text-sm font-medium transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-black py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                {t("processing")}
              </>
            ) : (
              <>
                {t("purchase")}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted text-center mt-4">
          {t("footerNote")}
        </p>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00D9FF;
          cursor: pointer;
          border: 2px solid #12151B;
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00D9FF;
          cursor: pointer;
          border: 2px solid #12151B;
        }
      `}</style>
    </div>
  );

  // Use portal to render modal at document.body level, not inside parent component
  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}

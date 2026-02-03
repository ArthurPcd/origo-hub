"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApiKey, setApiKey } from "@/lib/storage";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function SetupPage() {
  const router = useRouter();
  const t = useTranslations("setup");
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = getApiKey();
    if (existing) setKey(existing);
  }, []);

  function handleSave() {
    const trimmed = key.trim();
    if (!trimmed) {
      setError(t("errors.empty"));
      return;
    }
    if (!trimmed.startsWith("sk-ant-")) {
      setError(t("errors.invalidFormat"));
      return;
    }
    setApiKey(trimmed);
    router.push("/brief/new");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-grid">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 mb-12"
        >
          <div className="w-2 h-2 rounded-full bg-accent animate-dot-pulse" />
          <span className="text-foreground font-bold text-lg tracking-[0.15em] uppercase">
            Origo
          </span>
        </Link>

        <div className="bg-surface border border-edge rounded-xl p-8">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            {t("title")}
          </h1>
          <p className="text-muted text-sm mb-6 leading-relaxed">
            {t("description")}
          </p>

          <div className="mb-4">
            <label
              htmlFor="apiKey"
              className="text-foreground text-sm font-medium block mb-2"
            >
              {t("apiKeyLabel")}
            </label>
            <div className="relative">
              <input
                id="apiKey"
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder={t("apiKeyPlaceholder")}
                className="w-full bg-base border border-edge focus:border-accent rounded-lg px-4 py-3 text-foreground placeholder:text-muted/50 transition-colors outline-none pr-16"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs transition-colors"
              >
                {showKey ? t("hide") : t("show")}
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-accent hover:bg-accent-hover text-black py-3 rounded-lg font-medium transition-colors"
          >
            {t("save")}
          </button>

          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-accent-soft text-sm text-center mt-4 hover:text-accent transition-colors"
          >
            {t("getApiKey")}
          </a>
        </div>
      </div>
    </div>
  );
}

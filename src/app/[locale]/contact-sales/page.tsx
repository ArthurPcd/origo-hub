"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ContactSalesPage() {
  const t = useTranslations("contactSales");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    teamSize: "",
    message: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/contact-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send message");
      }

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        company: "",
        teamSize: "",
        message: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {t("success")}
          </h1>
          <p className="text-muted mb-8">
            {t("successDescription")}
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-accent hover:bg-accent-hover text-black px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {t("backToPricing")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/pricing"
            className="text-accent hover:text-accent-soft text-sm mb-6 inline-block"
          >
            {t("backLink")}
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t("title")}
          </h1>
          <p className="text-muted text-lg">
            {t("subtitle")}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-surface border border-edge rounded-2xl p-8 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              {t("name")} *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-base border border-edge focus:border-accent rounded-lg text-foreground placeholder-muted transition-colors outline-none"
              placeholder={t("placeholders.name")}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              {t("email")} *
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-base border border-edge focus:border-accent rounded-lg text-foreground placeholder-muted transition-colors outline-none"
              placeholder={t("placeholders.email")}
            />
          </div>

          {/* Company */}
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
              {t("company")} *
            </label>
            <input
              type="text"
              id="company"
              required
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-3 bg-base border border-edge focus:border-accent rounded-lg text-foreground placeholder-muted transition-colors outline-none"
              placeholder={t("placeholders.company")}
            />
          </div>

          {/* Team Size */}
          <div>
            <label htmlFor="teamSize" className="block text-sm font-medium text-foreground mb-2">
              {t("teamSize")} *
            </label>
            <select
              id="teamSize"
              required
              value={formData.teamSize}
              onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
              className="w-full px-4 py-3 bg-base border border-edge focus:border-accent rounded-lg text-foreground transition-colors outline-none"
            >
              <option value="">{t("placeholders.teamSize")}</option>
              <option value="1-10">{t("teamSizes.small")}</option>
              <option value="11-50">{t("teamSizes.medium")}</option>
              <option value="51-200">{t("teamSizes.large")}</option>
              <option value="201-500">{t("teamSizes.xlarge")}</option>
              <option value="501+">{t("teamSizes.enterprise")}</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
              {t("message")} *
            </label>
            <textarea
              id="message"
              required
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 bg-base border border-edge focus:border-accent rounded-lg text-foreground placeholder-muted transition-colors outline-none resize-none"
              placeholder={t("placeholders.message")}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-black py-4 rounded-lg font-semibold transition-all shadow-lg shadow-accent/20"
          >
            {loading ? t("sending") : t("submit")}
          </button>

          <p className="text-muted text-xs text-center">
            {t("responseTime")}
          </p>
        </form>

        {/* Features reminder */}
        <div className="mt-12 p-6 bg-accent/5 border border-accent/20 rounded-xl">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {t("enterpriseFeatures.title")}
          </h3>
          <ul className="grid md:grid-cols-2 gap-3">
            <li className="flex items-start gap-2 text-sm text-muted">
              <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t("enterpriseFeatures.unlimited")}
            </li>
            <li className="flex items-start gap-2 text-sm text-muted">
              <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t("enterpriseFeatures.apiIncluded")}
            </li>
            <li className="flex items-start gap-2 text-sm text-muted">
              <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t("enterpriseFeatures.accountManager")}
            </li>
            <li className="flex items-start gap-2 text-sm text-muted">
              <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t("enterpriseFeatures.sso")}
            </li>
            <li className="flex items-start gap-2 text-sm text-muted">
              <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t("enterpriseFeatures.whiteLabel")}
            </li>
            <li className="flex items-start gap-2 text-sm text-muted">
              <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t("enterpriseFeatures.sla")}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

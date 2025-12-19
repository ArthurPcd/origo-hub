"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { getBriefsDB, deleteBriefDB } from "@/lib/storage";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client-browser";
import { getRemainingBriefs, getUserSubscription } from "@/lib/subscription";
import { PLANS } from "@/lib/stripe";
import { Brief, BriefFolder, UserSubscription } from "@/lib/types";
import { FolderRepository } from "@/lib/repositories/folders";
import { BriefRepository } from "@/lib/repositories/briefs";
import BuyCreditsModal from "@/components/BuyCreditsModal";
import { BriefCardSkeleton } from "@/components/ui/SkeletonLoader";
import { BriefsFolderTabs } from "@/components/briefs/BriefsFolderTabs";
import CreateFolderModal from "@/components/briefs/CreateFolderModal";
import { FolderAssignDropdown } from "@/components/briefs/FolderAssignDropdown";

function getRelativeDate(dateStr: string, locale: string): string {
  const localeMap: Record<string, string> = { en: "en-US", fr: "fr-FR", de: "de-DE", es: "es-ES", it: "it-IT", ru: "ru-RU", zh: "zh-CN" };
  const dateLocale = localeMap[locale] || "en-US";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  try {
    const rtf = new Intl.RelativeTimeFormat(dateLocale, { numeric: "auto" });
    if (diffSeconds < 60) return rtf.format(0, "second");
    if (diffMinutes < 60) return rtf.format(-diffMinutes, "minute");
    if (diffHours < 24) return rtf.format(-diffHours, "hour");
    if (diffDays < 7) return rtf.format(-diffDays, "day");
    if (diffWeeks < 5) return rtf.format(-diffWeeks, "week");
    if (diffMonths < 12) return rtf.format(-diffMonths, "month");
    return rtf.format(-Math.floor(diffMonths / 12), "year");
  } catch {
    return date.toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" });
  }
}

// Extract plain text preview from brief markdown content
function extractPreview(content: string, maxLength = 130): string {
  if (!content) return "";
  const plain = content
    .replace(/#+\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^[-•]\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trimEnd() + "…";
}

const PLAN_BADGE_COLORS: Record<string, string> = {
  free: "bg-edge text-muted",
  starter: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  pro: "bg-accent/10 text-accent border border-accent/20",
  premium: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  enterprise: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
};

export default function HistoryPage() {
  const t = useTranslations("brief.list");
  const router = useRouter();
  const locale = useLocale();
  const { user, isSignedIn, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  // Brief state
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  // Folder state
  const [folders, setFolders] = useState<BriefFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null); // null = "All Briefs"
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<BriefFolder | null>(null);
  const [folderLimit, setFolderLimit] = useState<number>(0);

  // Load briefs and folders
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      router.push("/signup");
      return;
    }

    async function loadData() {
      // Load briefs
      const briefsData = await getBriefsDB(supabase, user!.id);
      setBriefs(briefsData);

      // Load folders
      const folderRepo = new FolderRepository(supabase, user!.id);
      const foldersData = await folderRepo.list();
      setFolders(foldersData);

      // Get subscription + folder limit
      const sub = await getUserSubscription(supabase, user!.id);
      setSubscription(sub);
      const plan = ((sub?.plan) || 'free') as keyof typeof PLANS;
      setFolderLimit(PLANS[plan]?.folders ?? 0);

      // Load remaining briefs count
      const rem = await getRemainingBriefs(supabase, user!.id);
      setRemaining(rem);

      setLoaded(true);
    }

    loadData();
  }, [isLoaded, isSignedIn, user, supabase, router]);

  // Filter briefs by active folder
  const filteredBriefs = activeFolder === null
    ? briefs
    : briefs.filter(brief => brief.folderId === activeFolder);

  // Folder CRUD operations
  async function handleCreateFolder(name: string, color: string) {
    if (!user) return;
    const folderRepo = new FolderRepository(supabase, user.id);
    if (editingFolder) {
      await folderRepo.update(editingFolder.id, { name, color });
    } else {
      await folderRepo.create(name, color);
    }
    const foldersData = await folderRepo.list();
    setFolders(foldersData);
    setEditingFolder(null);
  }

  async function handleDeleteFolder(folderId: string) {
    if (!user) return;
    const folderRepo = new FolderRepository(supabase, user.id);
    await folderRepo.delete(folderId);
    const foldersData = await folderRepo.list();
    setFolders(foldersData);
    if (activeFolder === folderId) {
      setActiveFolder(null);
    }
    const briefsData = await getBriefsDB(supabase, user.id);
    setBriefs(briefsData);
  }

  function handleEditFolder(folder: BriefFolder) {
    setEditingFolder(folder);
    setShowCreateFolder(true);
  }

  // Brief operations
  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t("deleteConfirm"))) return;
    if (!user) return;
    await deleteBriefDB(supabase, user.id, id);
    const data = await getBriefsDB(supabase, user.id);
    setBriefs(data);
  }

  async function handleAssignFolder(briefId: string, folderId: string | null) {
    if (!user) return;
    const briefRepo = new BriefRepository(supabase, user.id);
    await briefRepo.update(briefId, { folderId: folderId || undefined });
    const data = await getBriefsDB(supabase, user.id);
    setBriefs(data);
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-grid">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header skeleton */}
          <div className="mb-6 sm:mb-8">
            <div className="h-3 w-16 bg-edge rounded animate-pulse mb-2" />
            <div className="h-8 w-48 bg-edge rounded animate-pulse" />
          </div>

          {/* Brief cards skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <BriefCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const currentPlan = (subscription?.plan || "free") as keyof typeof PLANS;
  const planData = PLANS[currentPlan];
  const planBadgeClass = PLAN_BADGE_COLORS[currentPlan] || PLAN_BADGE_COLORS.free;

  return (
    <div className="min-h-screen bg-grid">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <p className="text-accent text-xs font-medium tracking-widest uppercase font-mono mb-1">Library</p>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {t("title")}
            </h1>
            {briefs.length > 0 && (
              <p className="text-muted text-sm mt-1">
                {briefs.length} {briefs.length === 1 ? "brief" : "briefs"} total
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Plan badge */}
            <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${planBadgeClass}`}>
              {planData?.name || "Free"}
            </span>
            {remaining !== Infinity && (
              <div className="text-xs sm:text-sm text-muted">
                {t("remaining", { count: remaining })}
              </div>
            )}
            {remaining < 5 && remaining !== Infinity && (
              <button
                onClick={() => setShowBuyCredits(true)}
                className="bg-accent hover:bg-accent-hover text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] inline-flex items-center"
              >
                + Credits
              </button>
            )}
          </div>
        </div>

        {/* Folder Tabs */}
        <BriefsFolderTabs
          folders={folders}
          activeFolder={activeFolder}
          onFolderChange={setActiveFolder}
          onCreateFolder={() => {
            setEditingFolder(null);
            setShowCreateFolder(true);
          }}
          onEditFolder={handleEditFolder}
          onDeleteFolder={handleDeleteFolder}
          folderLimit={folderLimit}
        />

        {/* Modals */}
        <BuyCreditsModal
          isOpen={showBuyCredits}
          onClose={() => setShowBuyCredits(false)}
        />

        <CreateFolderModal
          isOpen={showCreateFolder}
          onClose={() => {
            setShowCreateFolder(false);
            setEditingFolder(null);
          }}
          onSave={handleCreateFolder}
          editingFolder={editingFolder}
        />

        {/* Brief List */}
        {filteredBriefs.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <div className="relative w-20 h-20 rounded-2xl bg-surface border border-edge flex items-center justify-center mb-6 axis-markers">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-accent/60"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <p className="text-accent text-xs font-medium tracking-widest uppercase font-mono mb-3">
              {activeFolder ? "Empty folder" : "No briefs yet"}
            </p>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              {activeFolder ? "This folder is empty" : t("empty")}
            </h2>
            <p className="text-muted text-sm sm:text-base mb-8 max-w-xs">
              {activeFolder
                ? "Move briefs here using the folder icon on each card."
                : t("emptyDescription")}
            </p>
            {!activeFolder && (
              <Link
                href="/brief/new"
                className="bg-accent hover:bg-accent-hover active:bg-accent-hover text-black px-6 py-3 rounded-lg font-medium transition-colors min-h-[48px] sm:min-h-[44px] inline-flex items-center gap-2 touch-manipulation"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t("createNew")}
              </Link>
            )}
          </div>
        ) : (
          /* Brief list */
          <div className="space-y-3">
            {filteredBriefs.map((brief) => {
              const relativeDate = getRelativeDate(brief.createdAt, locale);
              const briefFolder = folders.find(f => f.id === brief.folderId);
              const preview = extractPreview(brief.content);
              return (
                <div
                  key={brief.id}
                  onClick={() => router.push(`/brief/${brief.id}`)}
                  className="bg-surface border border-edge rounded-xl p-4 sm:p-5 cursor-pointer group touch-manipulation card-hover"
                >
                  {/* Card top row: title + folder assign */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-foreground font-semibold text-base sm:text-lg group-hover:text-accent-soft transition-colors leading-tight flex-1 min-w-0 truncate">
                      {brief.title}
                    </h3>
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <FolderAssignDropdown
                        currentFolderId={brief.folderId || null}
                        folders={folders}
                        onAssignFolder={(folderId) => handleAssignFolder(brief.id, folderId)}
                      />
                    </div>
                  </div>

                  {/* Meta row: type · date · folder tag */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {brief.projectType === "idea-express" ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/25">
                          ⚡ Idée Express
                        </span>
                        <span className="text-edge text-xs">·</span>
                        <span className="text-muted text-xs">Présentation · MVP · POC · Devis · Brief</span>
                      </>
                    ) : (
                      <span className="text-muted text-xs">
                        {brief.projectType}
                      </span>
                    )}
                    <span className="text-edge text-xs">·</span>
                    <span
                      className="text-muted text-xs"
                      title={new Date(brief.createdAt).toLocaleDateString(undefined, { dateStyle: "long" })}
                    >
                      {relativeDate}
                    </span>
                    {briefFolder && (
                      <>
                        <span className="text-edge text-xs">·</span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${briefFolder.color}18`,
                            color: briefFolder.color,
                            border: `1px solid ${briefFolder.color}30`,
                          }}
                        >
                          {briefFolder.name}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Content preview */}
                  {preview && (
                    <p className="text-muted/70 text-sm leading-relaxed mb-3 line-clamp-2">
                      {preview}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-edge/50">
                    <Link
                      href={`/brief/${brief.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-accent text-sm font-semibold hover:text-accent-soft transition-colors min-h-[44px] inline-flex items-center gap-1.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {t("view")}
                    </Link>
                    <button
                      onClick={(e) => handleDelete(e, brief.id)}
                      className="text-muted/60 text-sm font-medium hover:text-red-400 transition-colors min-h-[44px] inline-flex items-center gap-1.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      {t("delete")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useRef, useEffect } from 'react';
import { BriefFolder } from '@/lib/types';

interface BriefsFolderTabsProps {
  folders: BriefFolder[];
  activeFolder: string | null; // null = "All Briefs"
  onFolderChange: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: BriefFolder) => void;
  onDeleteFolder: (folderId: string) => void;
  folderLimit?: number; // -1 = unlimited, 0 = not available on plan
}

export function BriefsFolderTabs({
  folders,
  activeFolder,
  onFolderChange,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  folderLimit = -1,
}: BriefsFolderTabsProps) {
  const atLimit = folderLimit !== -1 && folders.length >= folderLimit;
  const canCreate = folderLimit !== 0 && !atLimit;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active tab on mount/change
  useEffect(() => {
    if (scrollRef.current && activeFolder) {
      const activeTab = scrollRef.current.querySelector(`[data-folder-id="${activeFolder}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeFolder]);

  return (
    <div className="border-b border-edge mb-6">
      {/* Scrollable tabs container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 px-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* All Briefs tab (default) */}
        <button
          onClick={() => onFolderChange(null)}
          className={`
            px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition-all min-h-[44px] touch-manipulation
            ${
              activeFolder === null
                ? 'bg-surface border-t border-l border-r border-accent/30 text-foreground shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-surface/50 active:bg-surface/50'
            }
          `}
        >
          All Briefs
        </button>

        {/* Folder tabs */}
        {folders.map((folder) => (
          <div
            key={folder.id}
            data-folder-id={folder.id}
            className={`
              group relative px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition-all min-h-[44px] flex items-center gap-2
              ${
                activeFolder === folder.id
                  ? 'bg-surface border-t border-l border-r border-accent/30 text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground hover:bg-surface/50 active:bg-surface/50 cursor-pointer'
              }
            `}
            onClick={() => onFolderChange(folder.id)}
          >
            {/* Folder color indicator */}
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: folder.color }}
            />

            <span>{folder.name}</span>

            {/* Edit/Delete menu (shows on hover for active tab) */}
            {activeFolder === folder.id && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditFolder(folder);
                  }}
                  className="text-muted hover:text-accent text-xs p-1 min-h-[28px] min-w-[28px] flex items-center justify-center touch-manipulation"
                  aria-label="Edit folder"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete folder "${folder.name}"? Briefs inside will not be deleted.`)) {
                      onDeleteFolder(folder.id);
                    }
                  }}
                  className="text-muted hover:text-red-400 text-xs p-1 min-h-[28px] min-w-[28px] flex items-center justify-center touch-manipulation"
                  aria-label="Delete folder"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Create folder button */}
        {folderLimit === 0 ? (
          // Free plan: folders not available
          <div className="px-4 py-2 text-xs text-muted/40 whitespace-nowrap flex items-center gap-2 min-h-[44px] cursor-default" title="Upgrade to Starter to use folders">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Folders — <a href="/pricing" className="text-accent/60 hover:text-accent">Upgrade</a></span>
          </div>
        ) : atLimit ? (
          // At limit: show count and upgrade hint
          <div className="px-4 py-2 text-xs text-muted/50 whitespace-nowrap flex items-center gap-2 min-h-[44px] cursor-default" title={`${folders.length}/${folderLimit} folders used — upgrade for more`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>{folders.length}/{folderLimit} <a href="/pricing" className="text-accent/60 hover:text-accent">Upgrade</a></span>
          </div>
        ) : (
          <button
            onClick={onCreateFolder}
            className="px-4 py-2 rounded-t-lg text-sm text-muted hover:text-accent hover:bg-surface/50 active:bg-surface/50 transition-all min-h-[44px] whitespace-nowrap flex items-center gap-2 touch-manipulation"
            title={folderLimit !== -1 ? `${folders.length}/${folderLimit} folders used` : undefined}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
            {folderLimit !== -1 ? `New Folder (${folders.length}/${folderLimit})` : 'New Folder'}
          </button>
        )}
      </div>

      {/* Hide scrollbar with CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

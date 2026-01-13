'use client';

import { useState } from 'react';
import { BriefFolder } from '@/lib/types';

interface FolderAssignDropdownProps {
  currentFolderId: string | null;
  folders: BriefFolder[];
  onAssignFolder: (folderId: string | null) => Promise<void>;
}

export function FolderAssignDropdown({
  currentFolderId,
  folders,
  onAssignFolder,
}: FolderAssignDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentFolder = folders.find(f => f.id === currentFolderId);

  async function handleAssign(folderId: string | null) {
    setLoading(true);
    try {
      await onAssignFolder(folderId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to assign folder:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-2 py-1 text-xs text-muted hover:text-foreground transition-colors min-h-[32px]"
        disabled={loading}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        {currentFolder ? (
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentFolder.color }} />
            {currentFolder.name}
          </span>
        ) : (
          <span>No folder</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div className="absolute left-0 top-full mt-1 w-48 bg-surface border border-edge rounded-lg shadow-lg overflow-hidden z-20">
            {/* No folder option */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAssign(null);
              }}
              disabled={loading}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors border-b border-edge min-h-[40px] ${
                !currentFolderId
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-foreground hover:bg-edge'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              No folder
            </button>

            {/* Folders */}
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssign(folder.id);
                }}
                disabled={loading}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors border-b border-edge last:border-b-0 min-h-[40px] ${
                  currentFolderId === folder.id
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-foreground hover:bg-edge'
                }`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color }} />
                {folder.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

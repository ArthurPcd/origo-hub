'use client';

import { useState, useEffect } from 'react';
import { BriefFolder } from '@/lib/types';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => Promise<void>;
  editingFolder?: BriefFolder | null;
}

// Predefined color palette
const FOLDER_COLORS = [
  '#00D9FF', // Cyan (default Origo accent)
  '#00D9FF', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#A855F7', // Purple
  '#EF4444', // Red
  '#64748B', // Slate
  '#EC4899', // Pink
];

export default function CreateFolderModal({
  isOpen,
  onClose,
  onSave,
  editingFolder,
}: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingFolder) {
        setName(editingFolder.name);
        setColor(editingFolder.color);
      } else {
        setName('');
        setColor(FOLDER_COLORS[0]);
      }
      setError('');
    }
  }, [isOpen, editingFolder]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    if (name.length > 50) {
      setError('Folder name must be less than 50 characters');
      return;
    }

    setLoading(true);
    try {
      await onSave(name.trim(), color);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save folder');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-base/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-edge rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-edge flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {editingFolder ? 'Edit Folder' : 'New Folder'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Folder name input */}
          <div>
            <label htmlFor="folder-name" className="block text-sm font-medium text-foreground mb-2">
              Folder Name
            </label>
            <input
              id="folder-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Client Projects, Personal, Archive"
              className="w-full px-4 py-2.5 bg-base border border-edge rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors min-h-[44px]"
              autoFocus
              maxLength={50}
            />
            <p className="text-xs text-muted mt-1.5">
              {name.length}/50 characters
            </p>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Folder Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {FOLDER_COLORS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`
                    w-10 h-10 rounded-lg transition-all touch-manipulation
                    ${color === colorOption ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface scale-110' : 'hover:scale-105 active:scale-95'}
                  `}
                  style={{ backgroundColor: colorOption }}
                  aria-label={`Select color ${colorOption}`}
                />
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-edge hover:bg-edge/70 active:bg-edge/70 text-foreground rounded-lg font-medium transition-colors min-h-[44px] touch-manipulation"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-hover active:bg-accent-hover text-black rounded-lg font-medium transition-colors min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : editingFolder ? 'Save Changes' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

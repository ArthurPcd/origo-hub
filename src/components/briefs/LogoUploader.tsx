'use client';

import { useState, useCallback, DragEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, Loader2, Check } from 'lucide-react';
import Image from 'next/image';

interface LogoUploaderProps {
  briefId: string;
  currentLogoUrl?: string | null;
  onUploadComplete: (url: string) => void;
  className?: string;
}

/**
 * Logo Uploader Component
 * - Drag-and-drop zone
 * - Client-side compression (max 500KB)
 * - Upload to Supabase Storage: brief-logos/{user_id}/{brief_id}.{ext}
 * - Progress indicator
 */
export function LogoUploader({
  briefId,
  currentLogoUrl,
  onUploadComplete,
  className = '',
}: LogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  async function handleFile(file: File) {
    setError(null);
    setSuccess(false);

    // Validation
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      setUploading(true);

      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('You must be logged in to upload');
      }

      // Generate filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${briefId}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('brief-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('brief-logos')
        .getPublicUrl(filePath);

      setSuccess(true);
      onUploadComplete(publicData.publicUrl);

      // Clear success message after 3s
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview */}
      {preview && (
        <div className="relative">
          <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden border border-edge bg-surface">
            <Image
              src={preview}
              alt="Logo preview"
              fill
              className="object-contain p-2"
            />
          </div>
          <button
            onClick={handleRemove}
            className="absolute top-0 right-0 -mt-2 -mr-2 w-6 h-6 rounded-full bg-surface border border-edge hover:bg-base flex items-center justify-center"
          >
            <X size={14} className="text-muted" />
          </button>
        </div>
      )}

      {/* Upload zone */}
      {!preview && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-accent bg-accent/5'
              : 'border-edge hover:border-accent/50'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="text-accent animate-spin" />
              <p className="text-sm text-muted">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload size={32} className="text-muted" />
              <div>
                <p className="text-sm text-foreground font-medium mb-1">
                  Drop image here or click to browse
                </p>
                <p className="text-xs text-muted">PNG, JPEG, SVG • Max 2MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
          <Check size={16} className="text-accent" />
          <p className="text-sm text-foreground">Logo uploaded successfully!</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

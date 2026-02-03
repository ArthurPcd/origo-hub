import { Brief } from "./types";
import { BriefRepository } from "./repositories/briefs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const API_KEY_KEY = "origo-api-key";

// ─────────────────────────────────────────────────────────────────────────────
// API Key Management (localStorage — BYOK, never in DB)
// ─────────────────────────────────────────────────────────────────────────────

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_KEY);
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_KEY, key);
}

// ─────────────────────────────────────────────────────────────────────────────
// Brief Management Functions (using Repository pattern)
// NOTE: Authorization checks (user_id filtering) are handled in BriefRepository
// See: src/lib/repositories/briefs.ts
// ─────────────────────────────────────────────────────────────────────────────

export async function getBriefsDB(
  supabase: SupabaseClient,
  userId: string
): Promise<Brief[]> {
  try {
    const repo = new BriefRepository(supabase, userId);
    return await repo.list(); // ✅ BriefRepository.list() filters by user_id
  } catch (error) {
    console.error('Error fetching briefs:', error);
    return [];
  }
}

export async function getBriefDB(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<Brief | null> {
  try {
    const repo = new BriefRepository(supabase, userId);
    return await repo.getById(id); // ✅ BriefRepository.getById() filters by user_id
  } catch (error) {
    console.error('Error fetching brief:', error);
    return null;
  }
}

export async function saveBriefDB(
  supabase: SupabaseClient,
  userId: string,
  brief: Brief
): Promise<string | null> {
  try {
    const repo = new BriefRepository(supabase, userId);
    const created = await repo.create(brief);
    return created.id;
  } catch (error) {
    console.error('Error saving brief:', error);
    return null;
  }
}

export async function deleteBriefDB(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<boolean> {
  try {
    const repo = new BriefRepository(supabase, userId);
    await repo.delete(id); // ✅ BriefRepository.delete() filters by user_id
    return true;
  } catch (error) {
    console.error('Error deleting brief:', error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public brief fetch (share page — no auth required)
// ─────────────────────────────────────────────────────────────────────────────

export async function getBriefPublicDB(id: string): Promise<Brief | null> {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase
      .from("briefs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      title: data.title,
      projectType: data.project_type || "",
      answers: data.answers,
      content: data.content,
      createdAt: data.created_at,
      folderId: data.folder_id,
      skinId: data.skin_id,
      customLogoUrl: data.custom_logo_url,
      customTitle: data.custom_title,
      bookViewerEnabled: data.book_viewer_enabled || false,
    } as Brief;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// File Storage Functions (Private storage with signed URLs)
// CRITICAL: Logos are PRIVATE - may contain confidential client info under NDA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a signed URL for private storage access
 * Signed URLs expire after a set duration (default: 1 hour)
 * 
 * @param filePath - Full path in storage (e.g., "user_id/filename.ext")
 * @param bucket - Storage bucket name (default: "brief-logos")
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or null if error
 */
export async function getSignedUrl(
  supabase: SupabaseClient,
  filePath: string,
  bucket: string = 'brief-logos',
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Unexpected error creating signed URL:', err);
    return null;
  }
}

// Server-side getSignedUrl is in storage-server.ts

/**
 * Upload a file to private storage
 * Files are stored in user-specific folders: {user_id}/{filename}
 * 
 * @param file - File to upload
 * @param fileName - Custom filename (optional)
 * @param bucket - Storage bucket name (default: "brief-logos")
 * @returns Object with signedUrl and filePath, or null if error
 */
export async function uploadFile(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  fileName?: string,
  bucket: string = 'brief-logos'
): Promise<{ signedUrl: string; filePath: string } | null> {
  try {
    // Generate filename
    const fileExt = file.name.split('.').pop();
    const finalFileName = fileName || `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${finalFileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    // Get signed URL (24h expiry for fresh uploads)
    const signedUrl = await getSignedUrl(supabase, filePath, bucket, 86400);

    if (!signedUrl) {
      return null;
    }

    return { signedUrl, filePath };
  } catch (err) {
    console.error('Unexpected upload error:', err);
    return null;
  }
}

/**
 * Delete a file from storage
 * Only works if user owns the file (enforced by RLS)
 */
export async function deleteFile(
  supabase: SupabaseClient,
  filePath: string,
  bucket: string = 'brief-logos'
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected delete error:', err);
    return false;
  }
}

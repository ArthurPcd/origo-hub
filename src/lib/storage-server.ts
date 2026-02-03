import { createClerkSupabaseClient } from './supabase/clerk-client';

/**
 * Server-side version of getSignedUrl
 * Use this in API routes and server components
 *
 * @param filePath - Full path in storage (e.g., "user_id/filename.ext")
 * @param bucket - Storage bucket name (default: "brief-logos")
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or null if error
 */
export async function getSignedUrlServer(
  filePath: string,
  bucket: string = 'brief-logos',
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL (server):', error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Unexpected error creating signed URL (server):', err);
    return null;
  }
}

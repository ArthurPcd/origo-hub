/**
 * Folder Repository - Data Access Layer for Brief Folders
 *
 * Handles all folder-related database operations:
 * - userId passed from caller (API routes use Clerk auth)
 * - Row-level security enforcement
 * - Consistent error handling
 */

import { ApiError, ErrorCodes } from '@/lib/errors';
import type { BriefFolder } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';

const FOLDER_LIMITS: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 5,
  premium: 10,
  enterprise: -1,
};

export class FolderRepository {
  private supabase: SupabaseClient;
  private userId: string;

  constructor(supabaseClient: SupabaseClient, userId: string) {
    this.supabase = supabaseClient;
    this.userId = userId;
  }

  /**
   * Map database row (snake_case) to BriefFolder type (camelCase)
   */
  private mapDbToFolder(row: any): BriefFolder {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      color: row.color,
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * List all folders for the current user
   * Ordered by position (for drag-and-drop reordering)
   */
  async list(): Promise<BriefFolder[]> {
    const { data, error } = await this.supabase
      .from('brief_folders')
      .select('*')
      .eq('user_id', this.userId)
      .order('position', { ascending: true });

    if (error) {
      throw new ApiError(
        500,
        'Failed to fetch folders',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return (data || []).map(row => this.mapDbToFolder(row));
  }

  /**
   * Get a single folder by ID
   *
   * @param id - Folder ID
   * @returns Folder or null if not found
   */
  async getById(id: string): Promise<BriefFolder | null> {
    const { data, error } = await this.supabase
      .from('brief_folders')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new ApiError(
        500,
        'Failed to fetch folder',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return data ? this.mapDbToFolder(data) : null;
  }

  /**
   * Create a new folder
   *
   * @param name - Folder name
   * @param color - Folder color (hex, optional)
   * @returns Created folder
   */
  async create(name: string, color?: string): Promise<BriefFolder> {
    // Enforce per-plan folder limit
    const { data: sub } = await this.supabase
      .from('user_subscriptions')
      .select('plan')
      .eq('user_id', this.userId)
      .maybeSingle();

    const plan = sub?.plan || 'free';
    const limit = FOLDER_LIMITS[plan] ?? 0;

    if (limit === 0) {
      throw new ApiError(
        403,
        'Folder creation requires Starter plan or higher.',
        ErrorCodes.UNAUTHORIZED
      );
    }

    if (limit !== -1) {
      const { count: currentCount } = await this.supabase
        .from('brief_folders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId);

      if ((currentCount || 0) >= limit) {
        throw new ApiError(
          403,
          `Folder limit reached (${limit} max on ${plan} plan). Upgrade to create more folders.`,
          ErrorCodes.UNAUTHORIZED
        );
      }
    }

    // Get current max position to append at end
    const { data: folders } = await this.supabase
      .from('brief_folders')
      .select('position')
      .eq('user_id', this.userId)
      .order('position', { ascending: false })
      .limit(1);

    const maxPosition = folders && folders.length > 0 ? folders[0].position : -1;
    const newPosition = maxPosition + 1;

    const { data, error } = await this.supabase
      .from('brief_folders')
      .insert({
        name,
        color: color || '#00D9FF',
        user_id: this.userId,
        position: newPosition,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new ApiError(
          400,
          'A folder with this name already exists',
          ErrorCodes.DUPLICATE_ENTRY
        );
      }

      throw new ApiError(
        500,
        'Failed to create folder',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return this.mapDbToFolder(data);
  }

  /**
   * Update an existing folder
   *
   * @param id - Folder ID
   * @param updates - Partial folder data to update
   * @returns Updated folder
   */
  async update(
    id: string,
    updates: Partial<Pick<BriefFolder, 'name' | 'color' | 'position'>>
  ): Promise<BriefFolder> {
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.position !== undefined) dbUpdates.position = updates.position;

    const { data, error } = await this.supabase
      .from('brief_folders')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new ApiError(
          400,
          'A folder with this name already exists',
          ErrorCodes.DUPLICATE_ENTRY
        );
      }

      throw new ApiError(
        500,
        'Failed to update folder',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return this.mapDbToFolder(data);
  }

  /**
   * Delete a folder
   * Note: Briefs in this folder will have folder_id set to NULL (CASCADE behavior)
   *
   * @param id - Folder ID
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('brief_folders')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);

    if (error) {
      throw new ApiError(
        500,
        'Failed to delete folder',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }
  }

  /**
   * Reorder folders
   * Updates position field for multiple folders
   *
   * @param folderIds - Array of folder IDs in desired order
   */
  async reorder(folderIds: string[]): Promise<void> {
    // Update each folder's position based on array index
    const updates = folderIds.map((id, index) => ({
      id,
      user_id: this.userId,
      position: index,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await this.supabase
      .from('brief_folders')
      .upsert(updates, { onConflict: 'id' });

    if (error) {
      throw new ApiError(
        500,
        'Failed to reorder folders',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }
  }

  /**
   * Count folders for the current user
   */
  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from('brief_folders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId);

    if (error) {
      throw new ApiError(
        500,
        'Failed to count folders',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return count || 0;
  }
}

/**
 * Brief Repository - Data Access Layer for Briefs
 *
 * Centralizes all brief-related database operations:
 * - userId passed from caller (API routes use Clerk auth)
 * - Row-level security enforcement
 * - Consistent error handling
 * - Easy to mock for testing
 */

import { ApiError, ErrorCodes } from '@/lib/errors';
import type { Brief } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export class BriefRepository {
  private supabase: SupabaseClient;
  private userId: string;

  constructor(supabaseClient: SupabaseClient, userId: string) {
    this.supabase = supabaseClient;
    this.userId = userId;
  }

  /**
   * Map database row (snake_case) to Brief type (camelCase)
   */
  private mapDbToBrief(row: any): Brief {
    return {
      id: row.id,
      title: row.title,
      projectType: row.project_type || '',
      answers: row.answers,
      content: row.content,
      createdAt: row.created_at,

      // Phase 2: Skin UI System
      folderId: row.folder_id,
      skinId: row.skin_id,
      customLogoUrl: row.custom_logo_url,
      customTitle: row.custom_title,
      bookViewerEnabled: row.book_viewer_enabled || false,
    };
  }

  /**
   * List all briefs for the current user
   * Ordered by creation date (newest first)
   */
  async list(): Promise<Brief[]> {
    const { data, error } = await this.supabase
      .from('briefs')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(
        500,
        'Failed to fetch briefs',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return (data || []).map(row => this.mapDbToBrief(row));
  }

  /**
   * Get a single brief by ID
   * Only returns if the brief belongs to the current user
   *
   * @param id - Brief ID
   * @returns Brief or null if not found
   */
  async getById(id: string): Promise<Brief | null> {
    const { data, error } = await this.supabase
      .from('briefs')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId) // Row-level security: only user's own briefs
      .single();

    // PGRST116 = "not found" error code from PostgREST
    if (error && error.code !== 'PGRST116') {
      throw new ApiError(
        500,
        'Failed to fetch brief',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return data ? this.mapDbToBrief(data) : null;
  }

  /**
   * Create a new brief
   *
   * @param brief - Brief data (without id and createdAt)
   * @returns Created brief with generated ID
   */
  async create(brief: Omit<Brief, 'id' | 'createdAt'>): Promise<Brief> {
    const { data, error} = await this.supabase
      .from('briefs')
      .insert({
        title: brief.title,
        project_type: brief.projectType,
        answers: brief.answers,
        content: brief.content,
        user_id: this.userId,

        // Phase 2: Skin UI System
        folder_id: brief.folderId || null,
        skin_id: brief.skinId || null,
        custom_logo_url: brief.customLogoUrl || null,
        custom_title: brief.customTitle || null,
        book_viewer_enabled: brief.bookViewerEnabled || false,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(
        500,
        'Failed to create brief',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return this.mapDbToBrief(data);
  }

  /**
   * Update an existing brief
   *
   * @param id - Brief ID
   * @param updates - Partial brief data to update
   * @returns Updated brief
   */
  async update(
    id: string,
    updates: Partial<Omit<Brief, 'id' | 'user_id' | 'createdAt'>>
  ): Promise<Brief> {
    // Map camelCase to snake_case for DB
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.projectType !== undefined) dbUpdates.project_type = updates.projectType;
    if (updates.answers !== undefined) dbUpdates.answers = updates.answers;
    if (updates.content !== undefined) dbUpdates.content = updates.content;

    // Phase 2: Skin UI System
    if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId;
    if (updates.skinId !== undefined) dbUpdates.skin_id = updates.skinId;
    if (updates.customLogoUrl !== undefined) dbUpdates.custom_logo_url = updates.customLogoUrl;
    if (updates.customTitle !== undefined) dbUpdates.custom_title = updates.customTitle;
    if (updates.bookViewerEnabled !== undefined) dbUpdates.book_viewer_enabled = updates.bookViewerEnabled;

    const { data, error } = await this.supabase
      .from('briefs')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', this.userId) // Only update user's own briefs
      .select()
      .single();

    if (error) {
      throw new ApiError(
        500,
        'Failed to update brief',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return this.mapDbToBrief(data);
  }

  /**
   * Delete a brief
   *
   * @param id - Brief ID
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('briefs')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId); // Only delete user's own briefs

    if (error) {
      throw new ApiError(
        500,
        'Failed to delete brief',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }
  }

  /**
   * Count briefs for the current user
   */
  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from('briefs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', this.userId);

    if (error) {
      throw new ApiError(
        500,
        'Failed to count briefs',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return count || 0;
  }
}

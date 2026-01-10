/**
 * Skin Repository - Data Access Layer for Brief Skins
 *
 * Handles skin catalog queries and feature gating:
 * - List all available skins
 * - Check user access based on subscription + activations
 * - Read-only operations (skins are seeded in migration)
 */

import { ApiError, ErrorCodes } from '@/lib/errors';
import type { BriefSkin } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export class SkinRepository {
  private supabase: SupabaseClient;
  private userId: string;

  constructor(supabaseClient: SupabaseClient, userId: string) {
    this.supabase = supabaseClient;
    this.userId = userId;
  }

  /**
   * Map database row to BriefSkin type
   */
  private mapDbToSkin(row: any): BriefSkin {
    return {
      id: row.id,
      name: row.name,
      tier: row.tier,
      config: row.config,
      createdAt: row.created_at,
    };
  }

  /**
   * List all skins in the catalog
   * Public data - anyone can see all skins
   */
  async list(): Promise<BriefSkin[]> {
    const { data, error } = await this.supabase
      .from('brief_skins')
      .select('*')
      .order('tier', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw new ApiError(
        500,
        'Failed to fetch skins',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return (data || []).map(row => this.mapDbToSkin(row));
  }

  /**
   * Get a single skin by ID
   *
   * @param id - Skin ID
   * @returns Skin or null if not found
   */
  async getById(id: string): Promise<BriefSkin | null> {
    const { data, error } = await this.supabase
      .from('brief_skins')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new ApiError(
        500,
        'Failed to fetch skin',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return data ? this.mapDbToSkin(data) : null;
  }

  /**
   * Get skins available to the current user
   * Based on subscription plan + feature activations
   *
   * @returns Array of accessible skins for user
   */
  async getAvailableForUser(): Promise<BriefSkin[]> {
    // Get all skins
    const allSkins = await this.list();

    // Get user subscription
    const { data: subscription } = await this.supabase
      .from('user_subscriptions')
      .select('plan')
      .eq('user_id', this.userId)
      .single();

    const plan = subscription?.plan || 'free';

    // Get user feature activations
    const { data: activations } = await this.supabase
      .from('user_feature_activations')
      .select('feature_code')
      .eq('user_id', this.userId);

    const hasCollectorEdition = activations?.some(
      a => a.feature_code === 'COLLECTOR_EDITION'
    );

    // Filter skins based on access rules
    const availableSkins = allSkins.filter(skin => {
      // Collector skins: Only with COLLECTOR_EDITION feature
      if (skin.tier === 'collector') {
        return hasCollectorEdition;
      }

      // Pro skins: Pro, Premium, or Enterprise plans
      if (skin.tier === 'pro') {
        return ['pro', 'premium'].includes(plan);
      }

      // Premium skins: Premium or Enterprise plans
      if (skin.tier === 'premium') {
        return plan === 'premium';
      }

      return false;
    });

    return availableSkins;
  }

  /**
   * Check if user can access a specific skin
   *
   * @param skinId - Skin ID to check
   * @returns true if user can use this skin
   */
  async canUserAccessSkin(skinId: string): Promise<boolean> {
    const availableSkins = await this.getAvailableForUser();
    return availableSkins.some(skin => skin.id === skinId);
  }
}

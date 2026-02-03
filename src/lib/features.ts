/**
 * Feature Gating System
 *
 * Defines available features and provides helper functions
 * to check user access based on subscription + activations
 */

import { FeatureRepository } from '@/lib/repositories/features';
import { SkinRepository } from '@/lib/repositories/skins';
import type { BriefSkin } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════
// Feature Codes (Constants)
// ═══════════════════════════════════════════════════════════════════════════

export const FEATURES = {
  COLLECTOR_EDITION: 'COLLECTOR_EDITION',
  PRO_SKINS: 'PRO_SKINS',
  PREMIUM_SKINS: 'PREMIUM_SKINS',
} as const;

export type FeatureCode = typeof FEATURES[keyof typeof FEATURES];

// ═══════════════════════════════════════════════════════════════════════════
// Feature Metadata (For display in UI)
// ═══════════════════════════════════════════════════════════════════════════

export const FEATURE_METADATA: Record<string, {
  name: string;
  description: string;
  tier: 'collector' | 'pro' | 'premium';
}> = {
  [FEATURES.COLLECTOR_EDITION]: {
    name: 'Collector Edition',
    description: 'Exclusive album-style brief cards with book mode viewer',
    tier: 'collector',
  },
  [FEATURES.PRO_SKINS]: {
    name: 'Pro Skins',
    description: 'Access to Pro-tier brief visual themes',
    tier: 'pro',
  },
  [FEATURES.PREMIUM_SKINS]: {
    name: 'Premium Skins',
    description: 'Access to Premium-tier brief visual themes',
    tier: 'premium',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if user has a specific feature
 * Client-side wrapper around FeatureRepository
 *
 * @param supabase - Supabase client (Clerk-authenticated)
 * @param userId - Clerk user ID
 * @param featureCode - Feature code to check
 * @returns Promise<boolean> - true if user has feature
 */
export async function hasFeature(
  supabase: SupabaseClient,
  userId: string,
  featureCode: string
): Promise<boolean> {
  try {
    const repo = new FeatureRepository(supabase, userId);
    return await repo.hasFeature(featureCode);
  } catch (error) {
    console.error('Error checking feature:', error);
    return false;
  }
}

/**
 * Check if user can access Collector Edition features
 * (Book mode, custom logos, premium card design)
 */
export async function hasCollectorEdition(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  return hasFeature(supabase, userId, FEATURES.COLLECTOR_EDITION);
}

/**
 * Check if user can access book mode viewer
 * Currently only for Collector Edition users
 */
export async function canAccessBookMode(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  return hasCollectorEdition(supabase, userId);
}

/**
 * Get all skins available to current user
 * Based on subscription plan + feature activations
 *
 * @param supabase - Supabase client (Clerk-authenticated)
 * @param userId - Clerk user ID
 * @returns Promise<BriefSkin[]> - Array of accessible skins
 */
export async function getAvailableSkins(
  supabase: SupabaseClient,
  userId: string
): Promise<BriefSkin[]> {
  try {
    const repo = new SkinRepository(supabase, userId);
    return await repo.getAvailableForUser();
  } catch (error) {
    console.error('Error fetching available skins:', error);
    return [];
  }
}

/**
 * Check if user can access a specific skin
 *
 * @param supabase - Supabase client (Clerk-authenticated)
 * @param userId - Clerk user ID
 * @param skinId - Skin ID to check
 * @returns Promise<boolean> - true if user can use this skin
 */
export async function canAccessSkin(
  supabase: SupabaseClient,
  userId: string,
  skinId: string
): Promise<boolean> {
  try {
    const repo = new SkinRepository(supabase, userId);
    return await repo.canUserAccessSkin(skinId);
  } catch (error) {
    console.error('Error checking skin access:', error);
    return false;
  }
}

/**
 * Get user's feature activations
 * Useful for displaying "Unlocked Features" in settings
 */
export async function getUserFeatures(
  supabase: SupabaseClient,
  userId: string
) {
  try {
    const repo = new FeatureRepository(supabase, userId);
    return await repo.getUserActivations();
  } catch (error) {
    console.error('Error fetching user features:', error);
    return [];
  }
}

/**
 * Feature access summary for UI display
 * Shows which features are available and which are locked
 */
export async function getFeatureSummary(
  supabase: SupabaseClient,
  userId: string
) {
  const [hasCollector, availableSkins] = await Promise.all([
    hasCollectorEdition(supabase, userId),
    getAvailableSkins(supabase, userId),
  ]);

  return {
    collectorEdition: hasCollector,
    bookMode: hasCollector,
    availableSkins: availableSkins.map(s => s.id),
    skinCount: availableSkins.length,
  };
}

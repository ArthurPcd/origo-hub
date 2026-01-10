/**
 * Feature Repository - Data Access Layer for Feature Activations
 *
 * Handles feature gating and activation code redemption:
 * - Check if user has specific features
 * - Activate features via codes (server-side only)
 * - SECURITY: activation_codes table accessed only with service_role
 */

import { ApiError, ErrorCodes } from '@/lib/errors';
import type { UserFeatureActivation } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export class FeatureRepository {
  private supabase: SupabaseClient;
  private userId: string;

  constructor(supabaseClient: SupabaseClient, userId: string) {
    this.supabase = supabaseClient;
    this.userId = userId;
  }

  /**
   * Map database row to UserFeatureActivation type
   */
  private mapDbToActivation(row: any): UserFeatureActivation {
    return {
      id: row.id,
      userId: row.user_id,
      featureCode: row.feature_code,
      activationCodeUsed: row.activation_code_used,
      activatedAt: row.activated_at,
      expiresAt: row.expires_at,
    };
  }

  /**
   * Get all feature activations for the current user
   */
  async getUserActivations(): Promise<UserFeatureActivation[]> {
    const { data, error } = await this.supabase
      .from('user_feature_activations')
      .select('*')
      .eq('user_id', this.userId);

    if (error) {
      throw new ApiError(
        500,
        'Failed to fetch feature activations',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return (data || []).map(row => this.mapDbToActivation(row));
  }

  /**
   * Check if user has a specific feature
   * Takes expiration into account
   *
   * @param featureCode - Feature code to check (e.g., 'COLLECTOR_EDITION')
   * @returns true if user has active feature
   */
  async hasFeature(featureCode: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_feature_activations')
      .select('expires_at')
      .eq('user_id', this.userId)
      .eq('feature_code', featureCode)
      .maybeSingle();

    if (error) {
      throw new ApiError(
        500,
        'Failed to check feature access',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    if (!data) return false;

    // Check expiration (NULL = permanent)
    if (data.expires_at) {
      return new Date(data.expires_at) > new Date();
    }

    return true;
  }

  /**
   * Activate a feature using an activation code
   * CRITICAL SECURITY: This method uses service_role to access activation_codes table
   *
   * @param code - Activation code (e.g., 'ORIG0FREY')
   * @param serviceRoleClient - Supabase client with service_role key
   * @returns Activated feature details
   * @throws ApiError with specific error codes
   */
  async activateFeature(
    code: string,
    serviceRoleClient: SupabaseClient
  ): Promise<UserFeatureActivation> {
    // Validate code format
    const codePattern = /^[A-Z0-9]{8,16}$/;
    if (!codePattern.test(code)) {
      throw new ApiError(
        400,
        'Invalid code format',
        ErrorCodes.INVALID_INPUT
      );
    }

    // 1. Query activation_codes table (service_role only)
    const { data: activationCode, error: codeError } = await serviceRoleClient
      .from('activation_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (codeError || !activationCode) {
      throw new ApiError(
        400,
        'Invalid activation code',
        ErrorCodes.INVALID_INPUT
      );
    }

    // 2. Check if code is expired
    if (activationCode.valid_until) {
      const expiryDate = new Date(activationCode.valid_until);
      if (expiryDate < new Date()) {
        throw new ApiError(
          400,
          'This code has expired',
          ErrorCodes.INVALID_INPUT
        );
      }
    }

    // 3. Check if code is exhausted
    if (activationCode.current_uses >= activationCode.max_uses) {
      throw new ApiError(
        400,
        'This code has reached its usage limit',
        ErrorCodes.INVALID_INPUT
      );
    }

    // 4. Check if user already has this feature
    const alreadyHas = await this.hasFeature(activationCode.feature_code);
    if (alreadyHas) {
      throw new ApiError(
        400,
        'You already have this feature activated',
        ErrorCodes.DUPLICATE_ENTRY
      );
    }

    // 5. Activate feature for user
    const { data: activation, error: activationError } = await this.supabase
      .from('user_feature_activations')
      .insert({
        user_id: this.userId,
        feature_code: activationCode.feature_code,
        activation_code_used: code,
        activated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (activationError) {
      throw new ApiError(
        500,
        'Failed to activate feature',
        ErrorCodes.DATABASE_ERROR,
        activationError
      );
    }

    // 6. Increment code usage count
    const { error: incrementError } = await serviceRoleClient
      .from('activation_codes')
      .update({ current_uses: activationCode.current_uses + 1 })
      .eq('id', activationCode.id);

    if (incrementError) {
      // Non-fatal error - feature is already activated
      console.error('Failed to increment code usage:', incrementError);
    }

    return this.mapDbToActivation(activation);
  }

  /**
   * Get feature details by feature code
   * (For display purposes - show what features are available)
   *
   * @param featureCode - Feature code
   * @returns Feature metadata or null
   */
  async getFeatureInfo(featureCode: string): Promise<Record<string, any> | null> {
    const { data, error } = await this.supabase
      .from('user_feature_activations')
      .select('*')
      .eq('user_id', this.userId)
      .eq('feature_code', featureCode)
      .maybeSingle();

    if (error) {
      throw new ApiError(
        500,
        'Failed to get feature info',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return data ? this.mapDbToActivation(data) : null;
  }
}

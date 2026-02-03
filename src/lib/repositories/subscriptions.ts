/**
 * Subscription Repository - Data Access Layer for User Subscriptions
 *
 * Handles:
 * - Subscription CRUD operations
 * - Brief count management
 * - Stripe customer ID linkage
 */

import { ApiError, ErrorCodes } from '@/lib/errors';
import type { UserSubscription } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export class SubscriptionRepository {
  private supabase: SupabaseClient;
  private userId: string;

  constructor(supabaseClient: SupabaseClient, userId: string) {
    this.supabase = supabaseClient;
    this.userId = userId;
  }

  /**
   * Map database row (snake_case) to UserSubscription type (camelCase)
   */
  private mapDbToSubscription(row: any): UserSubscription {
    return {
      id: row.id,
      userId: row.user_id,
      plan: row.plan,
      status: row.status,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      briefCount: row.brief_count, // ← MAPPING CRITIQUE: DB snake_case → TS camelCase
      createdAt: row.created_at,
    };
  }

  /**
   * Map TypeScript object (camelCase) to database format (snake_case)
   */
  private mapSubscriptionToDb(sub: Partial<UserSubscription>): any {
    const dbObj: any = {};

    if (sub.userId !== undefined) dbObj.user_id = sub.userId;
    if (sub.plan !== undefined) dbObj.plan = sub.plan;
    if (sub.status !== undefined) dbObj.status = sub.status;
    if (sub.stripeCustomerId !== undefined) dbObj.stripe_customer_id = sub.stripeCustomerId;
    if (sub.stripeSubscriptionId !== undefined) dbObj.stripe_subscription_id = sub.stripeSubscriptionId;
    if (sub.currentPeriodStart !== undefined) dbObj.current_period_start = sub.currentPeriodStart;
    if (sub.currentPeriodEnd !== undefined) dbObj.current_period_end = sub.currentPeriodEnd;
    if (sub.briefCount !== undefined) dbObj.brief_count = sub.briefCount; // ← MAPPING CRITIQUE

    return dbObj;
  }

  /**
   * Get subscription for the current user
   */
  async get(): Promise<UserSubscription | null> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', this.userId)
      .maybeSingle();

    if (error) {
      throw new ApiError(
        500,
        'Failed to fetch subscription',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return data ? this.mapDbToSubscription(data) : null;
  }

  /**
   * Create or update subscription
   * (Upsert operation)
   */
  async upsert(subscription: Partial<UserSubscription>): Promise<UserSubscription> {
    // Map camelCase to snake_case for DB
    const dbData = this.mapSubscriptionToDb(subscription);

    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .upsert({
        ...dbData,
        user_id: this.userId,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(
        500,
        'Failed to update subscription',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return this.mapDbToSubscription(data);
  }

  /**
   * Update subscription fields
   */
  async update(updates: Partial<Omit<UserSubscription, 'user_id'>>): Promise<UserSubscription> {
    // Map camelCase to snake_case for DB
    const dbUpdates = this.mapSubscriptionToDb(updates);

    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .update(dbUpdates)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) {
      throw new ApiError(
        500,
        'Failed to update subscription',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }

    return this.mapDbToSubscription(data);
  }

  /**
   * Increment brief count for the current user
   * CRITICAL: Uses brief_count (snake_case) to match DB column
   */
  async incrementBriefCount(): Promise<void> {
    // Get current count (use snake_case column name)
    const { data } = await this.supabase
      .from('user_subscriptions')
      .select('brief_count')
      .eq('user_id', this.userId)
      .single();

    if (data) {
      // Row exists - increment (use snake_case column name)
      await this.supabase
        .from('user_subscriptions')
        .update({ brief_count: ((data as any).brief_count || 0) + 1 })
        .eq('user_id', this.userId);
    } else {
      // First brief ever - create free subscription row (use snake_case)
      await this.supabase.from('user_subscriptions').insert({
        user_id: this.userId,
        plan: 'free',
        status: 'active',
        brief_count: 1,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    }
  }

  /**
   * Add credits to user's account
   * Used for credit purchases
   * CRITICAL: Uses brief_count (snake_case) to match DB column
   */
  async addCredits(credits: number): Promise<void> {
    const subscription = await this.get();
    const currentCount = subscription?.briefCount || 0; // ← OK: mapper converts to camelCase

    await this.supabase
      .from('user_subscriptions')
      .update({
        brief_count: currentCount + credits, // ← FIXED: Use snake_case for DB
      })
      .eq('user_id', this.userId);
  }

  /**
   * Get user's Stripe customer ID
   */
  async getStripeCustomerId(): Promise<string | null> {
    const subscription = await this.get();
    return subscription?.stripeCustomerId || null;
  }

  /**
   * Set Stripe customer ID
   */
  async setStripeCustomerId(customerId: string): Promise<void> {
    await this.update({ stripeCustomerId: customerId });
  }

  /**
   * Delete subscription (used when deleting account)
   */
  async delete(): Promise<void> {
    const { error } = await this.supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', this.userId);

    if (error) {
      throw new ApiError(
        500,
        'Failed to delete subscription',
        ErrorCodes.DATABASE_ERROR,
        error
      );
    }
  }
}

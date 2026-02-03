import { UserSubscription } from "./types";
import { PLANS } from "./stripe";
import { SubscriptionRepository } from "./repositories/subscriptions";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSubscription | null> {
  try {
    const repo = new SubscriptionRepository(supabase, userId);
    return await repo.get();
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

export async function canCreateBrief(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const sub = await getUserSubscription(supabase, userId);
  if (!sub) return true; // New user, allow first brief

  const plan = PLANS[sub.plan as keyof typeof PLANS];
  if (!plan) return false;

  // If unlimited (-1), always allow
  if (plan.briefs === -1) return true;

  // Check if user has reached limit
  return sub.briefCount < plan.briefs;
}

export async function incrementBriefCount(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    const repo = new SubscriptionRepository(supabase, userId);
    await repo.incrementBriefCount();
  } catch (error) {
    console.error('Error incrementing brief count:', error);
  }
}

export async function getRemainingBriefs(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const sub = await getUserSubscription(supabase, userId);
  if (!sub) return PLANS.free.briefs;

  const plan = PLANS[sub.plan as keyof typeof PLANS];
  if (!plan) return 0;

  if (plan.briefs === -1) return Infinity;

  // Ensure briefCount is a valid number (default to 0 if undefined/null)
  const briefCount = sub.briefCount || 0;
  return Math.max(0, plan.briefs - briefCount);
}

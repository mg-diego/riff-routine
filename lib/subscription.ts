import { supabase } from './supabase';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from './constants';

export const FREE_TIER_LIMITS = {
  exercises: 10,
  routines: 3,
} as const;

// Teachers on any tier but lifetime can manage a limited number of students
export const TEACHER_STUDENT_LIMIT = 5;
const UNLIMITED = Number.POSITIVE_INFINITY;

export const isFreeTier = (tier: SubscriptionTier | null | undefined) =>
  !tier || tier === SUBSCRIPTION_TIERS.FREE;

export const getMaxStudents = (tier: SubscriptionTier | null | undefined) =>
  tier === SUBSCRIPTION_TIERS.LIFETIME ? UNLIMITED : TEACHER_STUDENT_LIMIT;

export async function fetchSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  return (profile?.subscription_tier as SubscriptionTier) || SUBSCRIPTION_TIERS.FREE;
}

export async function canAddExercises(userId: string, countToAdd = 1): Promise<boolean> {
  const tier = await fetchSubscriptionTier(userId);
  if (!isFreeTier(tier)) return true;

  const { count } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return count === null || count + countToAdd <= FREE_TIER_LIMITS.exercises;
}

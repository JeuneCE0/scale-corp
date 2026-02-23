// HubScale — Plan & Premium Gate Logic
import { load } from './store.js';

/**
 * Plan hierarchy: trial (no payment) < starter < professional < enterprise
 * During the 14-day trial, premium features are locked to push conversion.
 */

const PLAN_RANK = { starter: 1, professional: 2, enterprise: 3 };

/** Returns true if the user has an active payment method (not just trial) */
export function isPaid() {
  return !!load('payment_method');
}

/** Returns the user's current plan id */
export function getPlan() {
  return load('plan') || 'starter';
}

/** Returns true if user plan meets the minimum required plan */
export function hasPlan(minPlan) {
  if (!isPaid()) return false;
  const current = getPlan();
  return (PLAN_RANK[current] || 0) >= (PLAN_RANK[minPlan] || 0);
}

/** Returns trial info or null */
export function getTrialInfo() {
  const trial = load('trial');
  if (!trial) return null;
  const ends = new Date(trial.endsAt);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((ends - now) / 86400000));
  return { ...trial, daysLeft, expired: daysLeft === 0 };
}

/** Shorthand: can the user access a "pro" feature? */
export function canAccessPro() {
  return hasPlan('professional');
}

/** Shorthand: can the user access a "starter" (paid) feature? */
export function canAccessStarter() {
  return hasPlan('starter');
}

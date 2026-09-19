/**
 * foodSafety.js
 * Frontend utility for calculating time-based food safety status and remaining countdown.
 */

import { FOOD_SAFETY_CONFIG } from '../config/foodSafetyConfig';

export function calculateFoodSafetyStatus(donation, now = new Date()) {
  const currentTime = new Date(now).getTime();

  // Cooking time (preparedAt or fallback to createdAt)
  const cookingTime = donation.preparedAt
    ? new Date(donation.preparedAt).getTime()
    : donation.createdAt
    ? new Date(donation.createdAt).getTime()
    : currentTime - 60 * 60 * 1000;

  // Safe use limit (pickupDeadline or expiresAt)
  const safeUseLimit = donation.pickupDeadline
    ? new Date(donation.pickupDeadline).getTime()
    : donation.expiresAt
    ? new Date(donation.expiresAt).getTime()
    : cookingTime + 4 * 60 * 60 * 1000;

  const totalSafeDurationMs = Math.max(safeUseLimit - cookingTime, 1000);
  const elapsedMs = Math.max(currentTime - cookingTime, 0);
  const remainingMs = Math.max(safeUseLimit - currentTime, 0);

  const percentUsed = Math.min(Math.max((elapsedMs / totalSafeDurationMs) * 100, 0), 100);

  let statusKey; // 'safe' | 'urgent' | 'do_not_distribute'
  let label;
  let color; // 'green' | 'yellow' | 'red'
  let badgeClass;
  let message;
  let canAccept;
  let requiresVerificationAtPickup;

  if (donation.safetyCheckFailed || donation.status === 'rejected') {
    statusKey = 'do_not_distribute';
    label = 'Do Not Distribute';
    color = 'red';
    badgeClass = 'bg-red-100 text-red-700 border border-red-200';
    message = donation.rejectionReason || FOOD_SAFETY_CONFIG.MESSAGES.DO_NOT_DISTRIBUTE;
    canAccept = false;
    requiresVerificationAtPickup = false;
  } else if (percentUsed < FOOD_SAFETY_CONFIG.THRESHOLDS.SAFE_PERCENT && remainingMs > 0) {
    statusKey = 'safe';
    label = 'Safe to Review';
    color = 'green';
    badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    message = FOOD_SAFETY_CONFIG.MESSAGES.SAFE;
    canAccept = true;
    requiresVerificationAtPickup = false;
  } else if (percentUsed <= FOOD_SAFETY_CONFIG.THRESHOLDS.URGENT_PERCENT && remainingMs > 0) {
    statusKey = 'urgent';
    label = 'Urgent';
    color = 'yellow';
    badgeClass = 'bg-amber-100 text-amber-800 border border-amber-300';
    message = FOOD_SAFETY_CONFIG.MESSAGES.URGENT;
    canAccept = true;
    requiresVerificationAtPickup = true;
  } else {
    statusKey = 'do_not_distribute';
    label = 'Do Not Distribute';
    color = 'red';
    badgeClass = 'bg-red-100 text-red-700 border border-red-200';
    message = FOOD_SAFETY_CONFIG.MESSAGES.DO_NOT_DISTRIBUTE;
    canAccept = false;
    requiresVerificationAtPickup = false;
  }

  return {
    statusKey,
    label,
    color,
    badgeClass,
    message,
    canAccept,
    requiresVerificationAtPickup,
    percentUsed: Math.round(percentUsed * 10) / 10,
    elapsedMs,
    remainingMs,
    totalSafeDurationMs,
    cookingTime: new Date(cookingTime),
    safeUseLimit: new Date(safeUseLimit),
  };
}

/**
 * Formats milliseconds into HH:MM:SS or string representation
 */
export function formatDurationMs(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatElapsedHuman(ms) {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${mins}m ago`;
  return `${mins}m ago`;
}

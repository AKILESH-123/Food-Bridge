/**
 * foodSafetyUtils.js
 * Central utility for computing time-based food safety status.
 */

const { THRESHOLDS, MESSAGES } = require('../config/foodSafetyConfig');

/**
 * Calculates food safety status based on:
 * - cooking time (preparedAt or createdAt)
 * - safe-use time / deadline (pickupDeadline or expiresAt)
 * - current time (now)
 *
 * Formulas:
 * elapsed = now - cooking time
 * percentUsed = (elapsed / expected safe-use duration) * 100
 *
 * Rules:
 * percentUsed < 50% => Safe (green)
 * 50% <= percentUsed <= 75% => Urgent (yellow, verification required at pickup)
 * percentUsed > 75% => Do Not Distribute (red, order cannot proceed)
 */
function calculateFoodSafetyStatus(donation, now = new Date()) {
  const currentTime = new Date(now).getTime();

  // Cooking time (preparedAt, or fallback to createdAt)
  const cookingTime = donation.preparedAt
    ? new Date(donation.preparedAt).getTime()
    : donation.createdAt
    ? new Date(donation.createdAt).getTime()
    : currentTime - 60 * 60 * 1000; // fallback: 1 hr ago

  // Safe-use limit (pickupDeadline or expiresAt)
  const safeUseLimit = donation.pickupDeadline
    ? new Date(donation.pickupDeadline).getTime()
    : donation.expiresAt
    ? new Date(donation.expiresAt).getTime()
    : cookingTime + 4 * 60 * 60 * 1000; // fallback: 4 hrs

  const totalSafeDurationMs = Math.max(safeUseLimit - cookingTime, 1000); // avoid div by 0
  const elapsedMs = Math.max(currentTime - cookingTime, 0);
  const remainingMs = Math.max(safeUseLimit - currentTime, 0);

  const percentUsed = Math.min(Math.max((elapsedMs / totalSafeDurationMs) * 100, 0), 100);

  let statusKey; // 'safe' | 'urgent' | 'do_not_distribute'
  let label;
  let color;
  let badgeColor;
  let message;
  let canAccept;
  let requiresVerificationAtPickup;

  if (donation.safetyCheckFailed || donation.status === 'rejected') {
    statusKey = 'do_not_distribute';
    label = 'Do Not Distribute';
    color = 'red';
    badgeColor = 'bg-red-100 text-red-700 border-red-200';
    message = donation.rejectionReason || MESSAGES.DO_NOT_DISTRIBUTE;
    canAccept = false;
    requiresVerificationAtPickup = false;
  } else if (percentUsed < THRESHOLDS.SAFE_PERCENT && remainingMs > 0) {
    statusKey = 'safe';
    label = 'Safe to Review';
    color = 'green';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    message = MESSAGES.SAFE;
    canAccept = true;
    requiresVerificationAtPickup = false;
  } else if (percentUsed <= THRESHOLDS.URGENT_PERCENT && remainingMs > 0) {
    statusKey = 'urgent';
    label = 'Urgent';
    color = 'yellow';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
    message = MESSAGES.URGENT;
    canAccept = true;
    requiresVerificationAtPickup = true;
  } else {
    statusKey = 'do_not_distribute';
    label = 'Do Not Distribute';
    color = 'red';
    badgeColor = 'bg-red-100 text-red-700 border-red-200';
    message = MESSAGES.DO_NOT_DISTRIBUTE;
    canAccept = false;
    requiresVerificationAtPickup = false;
  }

  return {
    statusKey,
    label,
    color,
    badgeColor,
    message,
    canAccept,
    requiresVerificationAtPickup,
    percentUsed: Math.round(percentUsed * 10) / 10,
    elapsedMs,
    remainingMs,
    cookingTime: new Date(cookingTime).toISOString(),
    safeUseLimit: new Date(safeUseLimit).toISOString(),
  };
}

module.exports = {
  calculateFoodSafetyStatus,
};

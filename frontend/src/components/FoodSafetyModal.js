import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Thermometer,
  ShieldCheck,
  ShieldAlert,
  UtensilsCrossed,
  X,
  Package,
} from 'lucide-react';
import { formatDurationMs, formatElapsedHuman } from '../utils/foodSafety';

/**
 * FoodSafetyModal
 * Displays the time-based food safety pop-up on the NGO dashboard when viewing/searching a listing.
 *
 * Rules:
 * - percentUsed < 50%  -> 🟢 Safe to review. "Recently prepared and appropriately stored. Safe to review."
 * - 50% <= percentUsed <= 75% -> 🟡 Urgent. "Approaching the platform's safe-use time limit. Accept only if you can pick up soon." Requires NGO verification at pickup.
 * - percentUsed > 75%  -> 🔴 Do not distribute. "Exceeds the configured safe-use limit. This food must not be distributed." Disables Accept button.
 */
export default function FoodSafetyModal({
  isOpen,
  onClose,
  donation,
  safetyStatus,
  onAccept,
  isAccepting = false,
}) {
  if (!isOpen || !donation || !safetyStatus) return null;

  const {
    statusKey,
    label,
    color,
    message,
    canAccept,
    requiresVerificationAtPickup,
    percentUsed,
    remainingMs,
    elapsedMs,
  } = safetyStatus;

  const isSafe = color === 'green';
  const isUrgent = color === 'yellow';
  const isRed = color === 'red';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header with status themed gradient */}
        <div
          className={`p-6 text-white relative ${
            isSafe
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
              : isUrgent
              ? 'bg-gradient-to-r from-amber-500 to-orange-600'
              : 'bg-gradient-to-r from-rose-600 to-red-700'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
              {isSafe && <ShieldCheck className="w-7 h-7 text-white" />}
              {isUrgent && <AlertTriangle className="w-7 h-7 text-white" />}
              {isRed && <ShieldAlert className="w-7 h-7 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {isSafe ? '🟢' : isUrgent ? '🟡' : '🔴'}
                </span>
                <h2 className="text-xl font-black">{label}</h2>
              </div>
              <p className="text-xs text-white/90 mt-0.5 font-medium">Time-Based Food Safety System</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Main Status Message Callout */}
          <div
            className={`p-4 rounded-2xl border ${
              isSafe
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isUrgent
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : 'bg-red-50 border-red-200 text-red-950'
            }`}
          >
            <p className="text-sm font-semibold leading-snug">{message}</p>
            {isUrgent && (
              <p className="text-xs text-amber-800 font-medium mt-2 bg-amber-100/70 p-2 rounded-xl border border-amber-300/60">
                ⚠️ <strong>Pickup Verification Required:</strong> An NGO volunteer checklist must be completed at pickup before collecting this food.
              </p>
            )}
            {isRed && (
              <p className="text-xs text-red-800 font-medium mt-2 bg-red-100/70 p-2 rounded-xl border border-red-300/60">
                🚫 <strong>Distribution Prohibited:</strong> To protect public health, the platform does not allow this food to be claimed or distributed.
              </p>
            )}
          </div>

          {/* Progress Bar of safe-use time consumed */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-700">
              <span>Safe-Use Window Consumed</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] ${
                  isSafe
                    ? 'bg-emerald-100 text-emerald-800'
                    : isUrgent
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {percentUsed}% Used
              </span>
            </div>

            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isSafe ? 'bg-emerald-500' : isUrgent ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-500 pt-1">
              <span>Elapsed: {formatElapsedHuman(elapsedMs)}</span>
              <span className="font-semibold">
                Remaining: {remainingMs > 0 ? formatDurationMs(remainingMs) : '00:00:00'}
              </span>
            </div>
          </div>

          {/* Listing Specs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-500 block mb-0.5">Food Title</span>
              <span className="font-bold text-gray-800 text-sm truncate block">{donation.title}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-500 block mb-0.5">Dietary & Meal</span>
              <span className="font-semibold text-gray-800">
                {donation.isVegetarian ? '🥦 Vegetarian' : '🍗 Non-Veg'} · {donation.mealType || 'Meal'}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-500 block mb-0.5">Storage Method</span>
              <span className="font-semibold text-gray-800">
                {donation.storageMethod === 'refrigerated'
                  ? '❄️ Refrigerated'
                  : donation.storageMethod === 'room_temperature'
                  ? '🌡️ Room Temperature'
                  : '🍲 Covered Container'}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-500 block mb-0.5">Quantity</span>
              <span className="font-semibold text-gray-800">
                {donation.quantity} {donation.quantityUnit} {donation.estimatedServings ? `(~${donation.estimatedServings} servings)` : ''}
              </span>
            </div>
          </div>

          {donation.ingredients && (
            <div className="text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-500 block mb-0.5 font-medium">Ingredients & Allergens</span>
              <p className="text-gray-700">{donation.ingredients}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>

          {canAccept ? (
            <button
              type="button"
              disabled={isAccepting}
              onClick={() => onAccept && onAccept(donation)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                isUrgent
                  ? 'bg-amber-600 hover:bg-amber-700 active:scale-95'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
              }`}
            >
              {isAccepting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isUrgent ? (
                <>Accept Anyway (Urgent Pickup)</>
              ) : (
                <>Proceed & Accept Order</>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
            >
              Accept Disabled (Unsafe)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

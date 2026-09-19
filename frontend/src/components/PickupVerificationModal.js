import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  X,
  CheckSquare,
  Square,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { FOOD_SAFETY_CONFIG } from '../config/foodSafetyConfig';

/**
 * PickupVerificationModal
 * For accepted Urgent orders (or any pickup verification):
 * Checkboxes:
 * - Packaging intact
 * - No obvious spoilage
 * - Correct labeling/time information
 * - Storage condition is appropriate
 * - Quantity matches the listing
 *
 * Rules:
 * - All boxes ticked -> Mark donation as "Verified & Collected"
 * - Any box unticked -> Show Reject Donation flow (requires reason, records to database, rejects order, notifies donor, triggers Do Not Distribute state).
 */
export default function PickupVerificationModal({
  isOpen,
  onClose,
  donation,
  onVerifyAndCollect,
  onReject,
  loading = false,
}) {
  const [checklist, setChecklist] = useState({
    packagingIntact: false,
    noSpoilage: false,
    correctLabeling: false,
    appropriateStorage: false,
    quantityMatches: false,
  });

  const [mode, setMode] = useState('checklist'); // 'checklist' | 'reject'
  const [rejectionReason, setRejectionReason] = useState('');

  if (!isOpen || !donation) return null;

  const allChecked = Object.values(checklist).every(Boolean);
  const untickedItems = FOOD_SAFETY_CONFIG.PICKUP_CHECKLIST_ITEMS.filter(
    (item) => !checklist[item.id]
  );

  const toggleItem = (id) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleVerifySubmit = () => {
    if (!allChecked) return;
    onVerifyAndCollect({
      checklist,
      notes: 'All 5 pickup safety checklist items verified successfully.',
    });
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;

    onReject({
      reason: rejectionReason.trim(),
      failedChecklistItems: untickedItems.map((i) => i.label),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-6 text-white relative ${mode === 'reject' ? 'bg-red-600' : 'bg-gradient-to-r from-emerald-600 to-teal-700'}`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              {mode === 'reject' ? (
                <XCircle className="w-7 h-7 text-white" />
              ) : (
                <ShieldCheck className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-black">
                {mode === 'reject' ? 'Reject Food Donation' : 'Pickup Verification Checklist'}
              </h2>
              <p className="text-xs text-white/90 mt-0.5 font-medium">
                {mode === 'reject'
                  ? 'Record failed safety check & notify donor'
                  : 'Mandatory verification before physical handover'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Donation Summary Card */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-gray-800 text-sm truncate">{donation.title}</p>
              <p className="text-gray-500 mt-0.5">
                {donation.quantity} {donation.quantityUnit} · Donor: {donation.donor?.organizationName || donation.donor?.name || 'Food Donor'}
              </p>
            </div>
            <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-[11px] border border-amber-200">
              Urgent Pickup
            </span>
          </div>

          {mode === 'checklist' ? (
            <>
              <div className="text-xs text-gray-600">
                Please inspect the food items carefully on-site. All 5 criteria must be verified to collect the food.
              </div>

              {/* Checklist Items */}
              <div className="space-y-2.5">
                {FOOD_SAFETY_CONFIG.PICKUP_CHECKLIST_ITEMS.map((item) => {
                  const isChecked = checklist[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        isChecked
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-xs leading-tight flex-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Unticked warning or instructions */}
              {!allChecked ? (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-bold">Missing checks: </span>
                    If any safety criteria fails, do NOT distribute. You can reject the donation with a recorded reason below.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  All safety criteria satisfied! Ready for collection.
                </div>
              )}
            </>
          ) : (
            /* Rejection reason form */
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800">
                <strong>Safety Policy:</strong> Rejecting this donation will mark it as 🔴 <em>Do Not Distribute</em>, record the failed items in the database audit log, and notify the donor immediately.
              </div>

              {untickedItems.length > 0 && (
                <div className="text-xs">
                  <span className="font-semibold text-gray-700 block mb-1">Failed Checklist Criteria:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-red-600">
                    {untickedItems.map((i) => (
                      <li key={i.id}>{i.label}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="label">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this food cannot be safely accepted (e.g. Broken seal, sour smell, inappropriate temperature, etc.)"
                  rows={4}
                  required
                  className="input-field resize-none text-xs"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('checklist')}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  ← Back to Checklist
                </button>
                <button
                  type="submit"
                  disabled={loading || !rejectionReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer actions for checklist mode */}
        {mode === 'checklist' && (
          <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMode('reject')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              Reject Donation
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!allChecked || loading}
                onClick={handleVerifySubmit}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                  allChecked && !loading
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                }`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Verified & Collected ✓</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

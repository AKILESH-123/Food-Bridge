import React, { useState, useEffect } from 'react'; // eslint-disable-line
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Package,
  User,
  Leaf,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Loader,
  Phone,
  Building2,
  Info,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import FoodSafetyModal from '../components/FoodSafetyModal';
import PickupVerificationModal from '../components/PickupVerificationModal';
import { calculateFoodSafetyStatus, formatDurationMs } from '../utils/foodSafety';
import api, { buildBackendUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = {
  cooked: '🍲',
  packaged: '📦',
  raw: '🥦',
  beverages: '☕',
  bakery: '🍞',
  dairy: '🥛',
  other: '🍽️',
};

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> },
  requested: { label: 'Requested', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-4 h-4" /> },
  reserved: { label: 'Reserved', color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-4 h-4" /> },
  pickup_confirmed: { label: 'Pickup Confirmed', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-4 h-4" /> },
  assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-4 h-4" /> },
  picked_up: { label: 'Picked Up', color: 'bg-indigo-100 text-indigo-700', icon: <Package className="w-4 h-4" /> },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-4 h-4" /> },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-600', icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-4 h-4" /> },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-600', icon: <XCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600', icon: <XCircle className="w-4 h-4" /> },
};

export default function DonationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [donation, setDonation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  // Delivery confirmation modal state
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [mealsDistributed, setMealsDistributed] = useState('');
  const [deliveryRemarks, setDeliveryRemarks] = useState('');
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);

  // Food safety modal state
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [, setTick] = useState(Date.now());

  // 60-second timer to refresh food safety calculations
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDonation();
    fetchHistory();
    // eslint-disable-next-line
  }, [id]);

  const fetchDonation = async () => {
    try {
      const res = await api.get(`/donations/${id}`);
      setDonation(res.data.donation);
    } catch (err) {
      toast.error('Failed to load donation details');
      navigate('/donations');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/donations/${id}/history`);
      setHistory(res.data.history || []);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this donation? This cannot be undone.')) return;
    try {
      await api.delete(`/donations/${id}`);
      toast.success('Donation deleted.');
      navigate('/donations/my');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleAction = async (action) => {
    if (action === 'request' && user?.role === 'ngo' && user?.verificationStatus !== 'verified') {
      const reason = user?.rejectionReason || 'Only verified NGOs can claim donations or request pickups.';
      toast.error(`Cannot claim: ${reason}`, { duration: 6000 });
      return;
    }

    setActionLoading(action);
    try {
      let res;
      if (action === 'request') {
        res = await api.post(`/donations/${id}/request`);
        toast.success('Food reserved & claimed! Awaiting donor pickup assurance.');
      } else if (action === 'confirm-pickup' || action === 'assign') {
        res = await api.post(`/donations/${id}/confirm-pickup`);
        toast.success('Pickup assurance confirmed! NGO notified to collect food.');
      } else if (action === 'pickup') {
        res = await api.post(`/donations/${id}/pickup`);
        toast.success('Marked as picked up! Food is now in transit.');
      } else if (action === 'complete') {
        res = await api.post(`/donations/${id}/complete`);
        toast.success('Donation marked as completed! Impact points earned. 🎉');
      } else if (action === 'cancel') {
        res = await api.post(`/donations/${id}/cancel`);
        toast.success('Donation cancelled.');
      }
      if (res?.data?.donation) setDonation(res.data.donation);
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    setActionLoading('delivery');
    try {
      const formData = new FormData();
      if (mealsDistributed) formData.append('mealsDistributed', mealsDistributed);
      if (deliveryRemarks) formData.append('deliveryRemarks', deliveryRemarks);
      if (deliveryPhoto) formData.append('deliveryPhoto', deliveryPhoto);

      const res = await api.post(`/donations/${id}/confirm-delivery`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Delivery confirmed! Impact receipt issued to donor. 🌟');
      setDeliveryModalOpen(false);
      if (res.data.donation) setDonation(res.data.donation);
      fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {user && <div className="hidden lg:block"><Sidebar /></div>}
        <div className={`flex-1 flex items-center justify-center ${user ? 'lg:ml-64' : ''}`}>
          <Loader className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!donation) return null;

  const status = STATUS_CONFIG[donation.status] || STATUS_CONFIG.available;
  const isExpiringSoon = donation.isUrgent;
  const timeLeft = formatDistanceToNow(new Date(donation.expiresAt), { addSuffix: true });
  const currentUserId = user?._id || user?.id;
  const donorId = donation?.donor?._id || donation?.donor?.id || donation?.donor;
  const requestedById = donation?.requestedBy?._id || donation?.requestedBy?.id || donation?.requestedBy;

  const isDonor = Boolean(currentUserId && donorId && String(currentUserId) === String(donorId));
  const isNGO = user && user.role === 'ngo';
  const requestedByMe = Boolean(currentUserId && requestedById && String(currentUserId) === String(requestedById));

  const images = donation.images && donation.images.length > 0 ? donation.images : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {user && <div className="hidden lg:block"><Sidebar /></div>}
      <div className={`flex-1 min-w-0 flex flex-col ${user ? 'lg:ml-64' : ''}`}>
        <div className="lg:hidden"><Navbar /></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-5">
            {/* Image gallery */}
            {images.length > 0 ? (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <img
                  src={buildBackendUrl(images[selectedImage])}
                  alt={donation.title}
                  className="w-full h-64 object-cover"
                />
                {images.length > 1 && (
                  <div className="flex gap-2 p-3">
                    {images.map((img, i) => (
                      <button key={i} onClick={() => setSelectedImage(i)}>
                        <img
                          src={buildBackendUrl(img)}
                          alt=""
                          className={`w-14 h-14 object-cover rounded-lg border-2 transition-all ${
                            selectedImage === i ? 'border-green-500' : 'border-transparent'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-48 flex items-center justify-center text-6xl">
                {CATEGORY_ICONS[donation.category] || '🍽️'}
              </div>
            )}

            {/* 6-step Donation Assurance & Trust Trail */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Donation Assurance & Trust System
                </h3>
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  Verified Audit Trail
                </span>
              </div>

              {/* Step indicator pipeline */}
              {(() => {
                const steps = [
                  { key: 'available', label: '1. Available', desc: 'Posted by donor' },
                  { key: 'reserved', label: '2. Reserved', desc: 'Claimed by verified NGO' },
                  { key: 'pickup_confirmed', label: '3. Pickup Confirmed', desc: 'Assurance timestamped' },
                  { key: 'picked_up', label: '4. Picked Up', desc: 'In NGO transit' },
                  { key: 'completed', label: '5. Delivered', desc: 'Verified & Distributed' },
                ];

                const currentIdx =
                  donation.status === 'completed' || donation.status === 'delivered' ? 4 :
                  donation.status === 'picked_up' ? 3 :
                  donation.status === 'pickup_confirmed' || donation.status === 'assigned' ? 2 :
                  donation.status === 'reserved' || donation.status === 'requested' ? 1 : 0;

                return (
                  <div className="grid grid-cols-5 gap-1.5 pt-2">
                    {steps.map((step, idx) => {
                      const isPastStep = idx < currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div key={step.key} className="flex flex-col items-center text-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isPastStep
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {isPastStep ? '✓' : idx + 1}
                          </div>
                          <p className={`text-[10px] font-bold mt-1.5 ${isCurrent ? 'text-orange-600' : isPastStep ? 'text-emerald-700' : 'text-gray-400'}`}>
                            {step.label.split('. ')[1]}
                          </p>
                          <p className="text-[9px] text-gray-400 hidden sm:block">{step.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Delivery Proof Card (if completed) */}
              {donation.deliveryPhoto && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 mt-3 flex items-center gap-4">
                  <img
                    src={buildBackendUrl(donation.deliveryPhoto)}
                    alt="Delivery Proof"
                    className="w-16 h-16 object-cover rounded-lg border border-emerald-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-800">✅ Verified Delivery Photo & Impact Proof</span>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Distributed <strong>{donation.mealsDistributed || donation.estimatedServings}</strong> meals.
                    </p>
                    {donation.deliveryRemarks && (
                      <p className="text-xs text-gray-600 italic mt-0.5">"{donation.deliveryRemarks}"</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Audit Status History Log */}
            {history.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
                <h3 className="font-bold text-gray-800 text-sm">Auditable Status History</h3>
                <div className="divide-y divide-gray-100">
                  {history.map((h) => {
                    const rawStatus = h?.newStatus || h?.status || h?.action || 'Updated';
                    const statusText = String(rawStatus || 'Updated').replace(/_/g, ' ');
                    const noteText = h?.remarks || h?.notes || '';
                    return (
                      <div key={h.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800 capitalize">{statusText}</span>
                            <span className="text-gray-400">by {h.changedBy?.organizationName || h.changedBy?.name || 'System'}</span>
                          </div>
                          {noteText && <p className="text-gray-500 mt-0.5">{noteText}</p>}
                        </div>
                        <span className="text-gray-400 font-mono whitespace-nowrap">
                          {h.createdAt ? format(new Date(h.createdAt), 'MMM d, h:mm a') : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Title & Status */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-xl font-black text-gray-800 leading-tight">{donation.title}</h1>
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${status.color}`}>
                  {status.icon}
                  {status.label}
                </span>
              </div>

              {isExpiringSoon && (
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 rounded-lg px-3 py-2 text-sm mb-4">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">Urgent — expires {timeLeft}!</span>
                </div>
              )}

              {/* Time-Based Food Safety Assessment Card */}
              {(() => {
                const safety = calculateFoodSafetyStatus(donation);
                const isSafe = safety.color === 'green';
                const isUrgent = safety.color === 'yellow';
                const isRed = safety.color === 'red';

                return (
                  <div className={`rounded-2xl p-5 border mb-5 ${
                    isSafe ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' :
                    isUrgent ? 'bg-amber-50/70 border-amber-200 text-amber-950' :
                    'bg-red-50/70 border-red-200 text-red-950'
                  }`}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{isSafe ? '🟢' : isUrgent ? '🟡' : '🔴'}</span>
                        <h4 className="font-bold text-sm">Food Safety Status: {safety.label}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/80 border">
                        {safety.percentUsed}% Window Used
                      </span>
                    </div>

                    <p className="text-xs font-medium leading-relaxed mb-3">{safety.message}</p>

                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isSafe ? 'bg-emerald-500' : isUrgent ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(safety.percentUsed, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] opacity-80">
                      <span>Cooking Time: {format(new Date(safety.cookingTime), 'MMM d, h:mm a')}</span>
                      <span>Safe Time Left: {safety.remainingMs > 0 ? formatDurationMs(safety.remainingMs) : 'Expired'}</span>
                    </div>
                  </div>
                );
              })()}

              <p className="text-gray-600 text-sm leading-relaxed mb-4">{donation.description}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-lg">{CATEGORY_ICONS[donation.category]}</span>
                  <span className="capitalize">{donation.category} food</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span>{donation.quantity} {donation.quantityUnit}</span>
                </div>
                {donation.estimatedServings > 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>~{donation.estimatedServings} servings</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className={isExpiringSoon ? 'text-orange-600 font-semibold' : ''}>{timeLeft}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 col-span-2">
                  <span className="text-xs text-gray-400 font-medium">Storage Method:</span>
                  <span className="font-semibold capitalize text-xs">
                    {donation.storageMethod === 'refrigerated'
                      ? '❄️ Refrigerated'
                      : donation.storageMethod === 'room_temperature'
                      ? '🌡️ Room Temperature'
                      : '🍲 Covered Container'}
                  </span>
                </div>
                {donation.ingredients && (
                  <div className="text-xs text-gray-600 col-span-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-gray-500 font-medium block mb-0.5">Ingredients / Allergens:</span>
                    <span>{donation.ingredients}</span>
                  </div>
                )}
              </div>

              {/* Dietary badge */}
              <div className="flex gap-2 mt-4">
                {donation.isVegetarian || donation.isVegan ? (
                  <span className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
                    <Leaf className="w-3 h-3" /> Veg
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
                    🍗 Non-Veg
                  </span>
                )}
              </div>
            </div>

            {/* Allergens & Special Instructions */}
            {(donation.allergenInfo || donation.specialInstructions) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
                {donation.allergenInfo && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Allergens</p>
                      <p className="text-sm text-gray-700">{donation.allergenInfo}</p>
                    </div>
                  </div>
                )}
                {donation.specialInstructions && (
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Special Instructions</p>
                      <p className="text-sm text-gray-700">{donation.specialInstructions}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pickup location */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                Pickup Location
              </h3>
              <p className="text-sm text-gray-700">{donation.pickupAddress}</p>
              <p className="text-sm text-green-700 font-semibold mt-1">{donation.pickupCity}</p>
              <p className="text-xs text-gray-400 mt-2">
                Expires: {format(new Date(donation.expiresAt), 'PPpp')}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-5">
            {/* Actions card */}
            {user && donation.status !== 'completed' && donation.status !== 'cancelled' && donation.status !== 'expired' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-4">Actions</h3>
                <div className="space-y-3">
                  {/* NGO Claim / Reserve (Step 1 -> 2) */}
                  {isNGO && donation.status === 'available' && !requestedByMe && (() => {
                    const safety = calculateFoodSafetyStatus(donation);
                    const isRed = safety.color === 'red';

                    return isRed ? (
                      <button
                        disabled
                        title="This food exceeds safe-use limits and must not be distributed."
                        className="w-full py-3 rounded-xl bg-gray-200 text-gray-400 font-bold text-sm cursor-not-allowed border border-gray-300"
                      >
                        🚫 Do Not Distribute (Unsafe)
                      </button>
                    ) : (
                      <button
                        onClick={() => setSafetyModalOpen(true)}
                        className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all ${
                          safety.color === 'yellow' ? 'bg-amber-600 hover:bg-amber-700' : 'btn-primary'
                        }`}
                      >
                        {safety.color === 'yellow' ? '⚠️ Review Safety & Claim' : '🤝 Review Safety & Claim'}
                      </button>
                    );
                  })()}

                  {/* Donor Pickup Assurance (Step 2 -> 3) */}
                  {isDonor && (donation.status === 'reserved' || donation.status === 'requested') && (
                    <button
                      onClick={() => handleAction('confirm-pickup')}
                      disabled={actionLoading === 'confirm-pickup'}
                      className="btn-primary w-full py-3"
                    >
                      {actionLoading === 'confirm-pickup' ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" /> Confirming Assurance...
                        </span>
                      ) : '✅ Confirm Pickup Assurance'}
                    </button>
                  )}

                  {/* NGO Marks Picked Up (Step 3 -> 4): Trigger Verification Checklist Modal */}
                  {isNGO && (donation.status === 'pickup_confirmed' || donation.status === 'assigned') && (
                    <button
                      onClick={() => setVerificationModalOpen(true)}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all"
                    >
                      📋 Verify Checklist & Collect
                    </button>
                  )}

                  {/* NGO Confirms Delivery with Proof (Step 4 -> 5) */}
                  {isNGO && donation.status === 'picked_up' && (
                    <button
                      onClick={() => setDeliveryModalOpen(true)}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirm Delivery & Submit Proof
                    </button>
                  )}

                  {/* Legacy Complete Fallback for Donor/Admin */}
                  {(isDonor || user?.role === 'admin') && (donation.status === 'assigned' || donation.status === 'picked_up') && (
                    <button
                      onClick={() => handleAction('complete')}
                      disabled={actionLoading === 'complete'}
                      className="btn-primary w-full py-3"
                    >
                      {actionLoading === 'complete' ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" /> Processing...
                        </span>
                      ) : '🎉 Mark Completed'}
                    </button>
                  )}

                  {/* Cancel */}
                  {isDonor && (donation.status === 'available' || donation.status === 'requested') && (
                    <button
                      onClick={() => handleAction('cancel')}
                      disabled={actionLoading === 'cancel'}
                      className="w-full py-3 rounded-xl border-2 border-red-500 text-sm font-semibold text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'cancel' ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" /> Cancelling...
                        </span>
                      ) : 'Cancel Donation'}
                    </button>
                  )}

                  {/* Delete */}
                  {isDonor && donation.status !== 'completed' && (
                    <button
                      onClick={handleDelete}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-50 border border-red-300 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Donation
                    </button>
                  )}
                </div>

                {isNGO && requestedByMe && donation.status === 'requested' && (
                  <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg p-3 mt-2">
                    You have requested this pickup. Waiting for donor confirmation.
                  </p>
                )}
              </div>
            )}

            {/* Donor Info */}
            {donation.donor && typeof donation.donor === 'object' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-4">Donor Information</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                    {donation.donor.name?.[0]?.toUpperCase() || 'D'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{donation.donor.name}</p>
                    {donation.donor.organizationName && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {donation.donor.organizationName}
                      </p>
                    )}
                  </div>
                </div>
                {donation.donor.city && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1.5">
                    <MapPin className="w-3 h-3" />
                    {donation.donor.city}
                  </p>
                )}
                {donation.donor.phone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {donation.donor.phone}
                  </p>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    🏆 {donation.donor.impactPoints || 0} impact points
                  </p>
                </div>
              </div>
            )}

            {/* Posted info */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 text-xs text-gray-500 space-y-1">
              <p>Posted {formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })}</p>
              <p>Donation ID: <span className="font-mono text-gray-400">{donation._id}</span></p>
            </div>

            {!user && (
              <div className="bg-green-50 rounded-2xl border border-green-100 p-4 text-center">
                <p className="text-sm text-green-700 mb-3">Sign in to request or manage this donation</p>
                <Link to="/login" className="btn-primary text-sm px-4 py-2">Sign In</Link>
              </div>
            )}
          </div>
        </div>

        {/* NGO Delivery Confirmation Modal */}
        {deliveryModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-gray-800 text-base">Confirm Food Delivery & Impact</h3>
                </div>
                <button onClick={() => setDeliveryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmDelivery} className="space-y-4">
                <div>
                  <label className="label">Number of People Fed / Servings Distributed *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={mealsDistributed}
                    onChange={(e) => setMealsDistributed(e.target.value)}
                    placeholder="e.g. 50"
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="label">Delivery Remarks / Beneficiary Notes</label>
                  <textarea
                    rows="3"
                    value={deliveryRemarks}
                    onChange={(e) => setDeliveryRemarks(e.target.value)}
                    placeholder="Briefly describe the distribution (e.g. distributed at Hope Shelter, happy beneficiaries)..."
                    className="input-field text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="label">Proof Photo of Delivery (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDeliveryPhoto(e.target.files[0])}
                    className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'delivery'}
                    className="btn-primary text-xs px-5 py-2"
                  >
                    {actionLoading === 'delivery' ? 'Submitting...' : 'Complete Delivery & Distribute'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Food Safety Modal */}
        <FoodSafetyModal
          isOpen={safetyModalOpen}
          onClose={() => setSafetyModalOpen(false)}
          donation={donation}
          safetyStatus={donation ? calculateFoodSafetyStatus(donation) : null}
          onAccept={async () => {
            await handleAction('request');
            setSafetyModalOpen(false);
          }}
          isAccepting={actionLoading === 'request'}
        />

        {/* Pickup Verification Checklist Modal */}
        <PickupVerificationModal
          isOpen={verificationModalOpen}
          onClose={() => setVerificationModalOpen(false)}
          donation={donation}
          onVerifyAndCollect={async ({ checklist, notes }) => {
            setIsVerifying(true);
            try {
              await api.post(`/donations/${id}/pickup`, { checklist, notes });
              toast.success('Verified & Collected! Food is now safely in transit.');
              setVerificationModalOpen(false);
              fetchDonation();
              fetchHistory();
            } catch (err) {
              toast.error(err.response?.data?.message || 'Verification failed');
            } finally {
              setIsVerifying(false);
            }
          }}
          onReject={async ({ reason, failedChecklistItems }) => {
            setIsVerifying(true);
            try {
              await api.post(`/donations/${id}/reject`, { reason, failedChecklistItems });
              toast.success('Donation rejected and marked as Do Not Distribute. Donor notified.');
              setVerificationModalOpen(false);
              fetchDonation();
              fetchHistory();
            } catch (err) {
              toast.error(err.response?.data?.message || 'Failed to reject donation');
            } finally {
              setIsVerifying(false);
            }
          }}
          loading={isVerifying}
        />
      </div>
    </div>
  </div>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  Clock,
  Users,
  UtensilsCrossed,
  ChevronRight,
  Heart,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import DonationCard from '../components/DonationCard';
import FoodSafetyModal from '../components/FoodSafetyModal';
import PickupVerificationModal from '../components/PickupVerificationModal';
import { calculateFoodSafetyStatus } from '../utils/foodSafety';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NGODashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [availableDonations, setAvailableDonations] = useState([]);
  const [myPickups, setMyPickups] = useState([]);
  const [communityRequests, setCommunityRequests] = useState([]);
  const [donorInterests, setDonorInterests] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [activeView, setActiveView] = useState('available'); // available | my | requests | interests

  // Food safety modal state
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [isAcceptingOrder, setIsAcceptingOrder] = useState(false);

  // Pickup verification checklist modal state
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verifyingDonation, setVerifyingDonation] = useState(null);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  // Search & Filter state for Available listings
  const [searchQuery, setSearchQuery] = useState('');
  const [safetyFilter, setSafetyFilter] = useState('all'); // 'all' | 'safe' | 'urgent' | 'do_not_distribute'
  const [timerTick, setTimerTick] = useState(Date.now());

  // New Request modal
  const [newRequestModal, setNewRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    requiredQuantity: '50',
    quantityUnit: 'servings',
    urgency: 'normal',
    targetBeneficiaries: '50',
    city: user?.city || '',
  });

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/stats/ngo?period=month');
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchAvailable = useCallback(async () => {
    setLoadingDonations(true);
    try {
      const res = await api.get('/donations?status=available&limit=8&period=month');
      setAvailableDonations(res.data.donations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDonations(false);
    }
  }, []);

  const fetchMyPickups = useCallback(async () => {
    try {
      const res = await api.get('/donations/assigned?period=month');
      setMyPickups(res.data.donations);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCommunityData = useCallback(async () => {
    try {
      const [reqRes, intRes] = await Promise.all([
        api.get('/requests'),
        api.get('/requests/ngo-interests'),
      ]);
      setCommunityRequests(reqRes.data.requests || []);
      setDonorInterests(intRes.data.interests || []);
    } catch (err) {
      console.error('Error fetching community data', err);
    }
  }, []);

  const handleInterestStatus = async (interestId, status) => {
    try {
      await api.patch(`/requests/interests/${interestId}/status`, { status });
      toast.success(`Pledge offer ${status}!`);
      fetchCommunityData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update interest status');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests', requestForm);
      toast.success('Food request posted to community successfully!');
      setNewRequestModal(false);
      setRequestForm({
        title: '',
        description: '',
        requiredQuantity: '50',
        quantityUnit: 'servings',
        urgency: 'normal',
        targetBeneficiaries: '50',
        city: user?.city || '',
      });
      fetchCommunityData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post food request');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAvailable();
    fetchMyPickups();
    fetchCommunityData();
  }, [fetchStats, fetchAvailable, fetchMyPickups, fetchCommunityData]);

  // Re-evaluate food safety status on a 60-second timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenSafetyModal = (donation) => {
    setSelectedDonation(donation);
    setSafetyModalOpen(true);
  };

  const handleAcceptOrder = async (donation) => {
    if (user?.verificationStatus !== 'verified') {
      const reason = user?.rejectionReason || 'Only officially verified NGOs can accept donations or request pickups.';
      toast.error(`Claim restricted: ${reason}`, { duration: 6000 });
      return;
    }

    const currentSafety = calculateFoodSafetyStatus(donation);
    if (!currentSafety.canAccept || currentSafety.statusKey === 'do_not_distribute') {
      toast.error('Cannot accept: This food has exceeded the safe-use limit and must not be distributed.');
      return;
    }

    setIsAcceptingOrder(true);
    try {
      await api.post(`/donations/${donation._id}/request`);
      if (currentSafety.statusKey === 'urgent') {
        toast.success('Urgent order accepted! Remember to perform on-site safety verification at pickup.');
      } else {
        toast.success('Donation accepted successfully! Donor alerted for pickup assurance.');
      }
      setSafetyModalOpen(false);
      fetchAvailable();
      fetchMyPickups();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept donation');
    } finally {
      setIsAcceptingOrder(false);
    }
  };

  const handleOpenVerification = (pickup) => {
    setVerifyingDonation(pickup);
    setVerificationModalOpen(true);
  };

  const handleVerifyAndCollect = async ({ checklist, notes }) => {
    if (!verifyingDonation) return;
    setIsSubmittingVerification(true);
    try {
      await api.post(`/donations/${verifyingDonation._id}/pickup`, { checklist, notes });
      toast.success('Verified & Collected! Food is now safely in transit.');
      setVerificationModalOpen(false);
      setVerifyingDonation(null);
      fetchMyPickups();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const handleRejectDonation = async ({ reason, failedChecklistItems }) => {
    if (!verifyingDonation) return;
    setIsSubmittingVerification(true);
    try {
      await api.post(`/donations/${verifyingDonation._id}/reject`, { reason, failedChecklistItems });
      toast.success('Donation rejected and marked as Do Not Distribute. Donor notified.');
      setVerificationModalOpen(false);
      setVerifyingDonation(null);
      fetchMyPickups();
      fetchAvailable();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject donation');
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const handleComplete = async (donation) => {
    if (!window.confirm('Mark this pickup as completed?')) return;
    try {
      await api.post(`/donations/${donation._id}/complete`);
      toast.success('Pickup marked as completed! Great work! 🌟');
      fetchMyPickups();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete');
    }
  };

  const statusColors = {
    requested: 'bg-amber-100 text-amber-700',
    assigned: 'bg-blue-100 text-blue-700',
    completed: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-800">
                  Welcome, {user?.name?.split(' ')[0]}! 🤝
                </h1>

                {/* Status Badges */}
                {user?.verificationStatus === 'verified' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Verified NGO
                  </span>
                ) : user?.verificationStatus === 'rejected' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 border border-red-300 rounded-full text-xs font-black shadow-sm">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    Verification Failed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-black shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Pending Review
                  </span>
                )}
              </div>

              <p className="text-gray-500 text-sm mt-0.5">
                {user?.organizationName ? `${user.organizationName} · ` : ''}
                {user?.registrationNumber ? `Reg: ${user.registrationNumber} · ` : ''}
                {user?.state ? `${user.state} · ` : ''}
                NGO / Volunteer Dashboard
              </p>
            </div>
          </div>

          {/* Verification Status Warning / Explanation Banner */}
          {user?.verificationStatus !== 'verified' && (
            <div className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${user?.verificationStatus === 'rejected'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
              <div className="flex items-start gap-3">
                {user?.verificationStatus === 'rejected' ? (
                  <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {user?.verificationStatus === 'rejected'
                      ? '⚠️ NGO Verification Failed — Claiming Restricted'
                      : '⏳ Registration Pending Review — Claiming Restricted'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                    {user?.verificationStatus === 'rejected'
                      ? user?.rejectionReason || 'Your registered details do not match the official government registry. You can browse food listings, but cannot accept or request pickups.'
                      : 'Your organization credentials are currently under manual review. Only verified NGOs can accept donations or request pickups.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loadingStats ? (
            <div className="flex items-center justify-center py-10">
              <div className="spinner" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard title="Total Pickups" value={stats?.totalPickups || 0} icon={Package} color="green" />
                <StatsCard title="Completed" value={stats?.completedPickups || 0} icon={CheckCircle2} color="purple" />
                <StatsCard title="Active Pickups" value={stats?.activePickups || 0} icon={Clock} color="blue" />
                <StatsCard title="People Fed" value={stats?.peopleFed || 0} icon={Users} color="orange" suffix=" 🍽️" />
              </div>

              {/* Impact highlight */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white flex items-center gap-4">
                  <Heart className="w-12 h-12 text-white/80 flex-shrink-0" />
                  <div>
                    <div className="text-4xl font-black">{stats?.impactPoints || 0}</div>
                    <div className="text-green-100 text-sm">⭐ Impact Points Earned</div>
                    <div className="text-xs text-green-200 mt-1">Keep collecting to climb the leaderboard!</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-6 text-white flex items-center gap-4">
                  <UtensilsCrossed className="w-12 h-12 text-white/80 flex-shrink-0" />
                  <div>
                    <div className="text-4xl font-black">{stats?.peopleFed || 0}</div>
                    <div className="text-orange-100 text-sm">🍽️ Total Meals Distributed</div>
                    <div className="text-xs text-orange-200 mt-1">Every meal changes a life!</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">NGO Workspace</h2>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold ${user?.verificationStatus === 'verified'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : user?.verificationStatus === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                    }`}
                >
                  {user?.verificationStatus === 'verified' && '🟢 Verified NGO'}
                  {user?.verificationStatus === 'pending' && '🟡 Verification Pending'}
                  {user?.verificationStatus === 'rejected' && '🔴 Verification Rejected'}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveView('available')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${activeView === 'available' ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Available ({availableDonations.length})
                </button>
                <button
                  onClick={() => setActiveView('my')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${activeView === 'my' ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  My Pickups ({myPickups.length})
                </button>
                <button
                  onClick={() => setActiveView('requests')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${activeView === 'requests' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Community Requests ({communityRequests.length})
                </button>
                <button
                  onClick={() => setActiveView('interests')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${activeView === 'interests' ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Interested Donors ({donorInterests.length})
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeView === 'available' && (
                <div className="space-y-5">
                  {/* Search and Food Safety Filter Controls */}
                  <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pb-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search food title, city, ingredients, dietary..."
                        className="input-field text-xs pl-9"
                      />
                      <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Status filter buttons */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                      {[
                        { id: 'all', label: 'All Status' },
                        { id: 'safe', label: '🟢 Safe First' },
                        { id: 'urgent', label: '🟡 Urgent Only' },
                        { id: 'do_not_distribute', label: '🔴 Do Not Distribute' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setSafetyFilter(f.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${safetyFilter === f.id
                              ? 'bg-gray-800 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingDonations ? (
                    <div className="flex justify-center py-10">
                      <div className="spinner" />
                    </div>
                  ) : (() => {
                    // Filter and Sort by Safety status (Safe first, then Urgent, Red greyed out / last)
                    const processed = availableDonations
                      .map((d) => ({
                        ...d,
                        computedSafety: calculateFoodSafetyStatus(d),
                      }))
                      .filter((d) => {
                        // Text search
                        if (searchQuery) {
                          const q = searchQuery.toLowerCase();
                          const matchTitle = d.title?.toLowerCase().includes(q);
                          const matchCity = d.pickupCity?.toLowerCase().includes(q);
                          const matchDesc = d.description?.toLowerCase().includes(q);
                          const matchIng = d.ingredients?.toLowerCase().includes(q);
                          if (!matchTitle && !matchCity && !matchDesc && !matchIng) return false;
                        }

                        // Safety status filter
                        if (safetyFilter === 'all') return true;
                        return d.computedSafety.statusKey === safetyFilter;
                      })
                      .sort((a, b) => {
                        // Safe first (0), then Urgent (1), then Red (2)
                        const score = { safe: 0, urgent: 1, do_not_distribute: 2 };
                        const diff = (score[a.computedSafety.statusKey] ?? 1) - (score[b.computedSafety.statusKey] ?? 1);
                        if (diff !== 0) return diff;
                        // Within same group, sort by safe time remaining descending
                        return a.computedSafety.remainingMs - b.computedSafety.remainingMs;
                      });

                    if (processed.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No donations matched your criteria</p>
                          <p className="text-gray-400 text-sm mt-1">Try clearing your filters or check back later</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {processed.map((donation) => (
                          <DonationCard
                            key={donation._id}
                            donation={donation}
                            onCardClick={(d) => handleOpenSafetyModal(d)}
                            onAction={(d) => handleOpenSafetyModal(d)}
                            actionLabel="Review & Accept"
                            actionVariant={donation.computedSafety.color === 'yellow' ? 'orange' : 'primary'}
                          />
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* My Pickups View */}
              {activeView === 'my' && (
                <div className="space-y-3">
                  {myPickups.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No pickups yet</p>
                      <p className="text-gray-400 text-sm mt-1">Request donations from the Available tab</p>
                    </div>
                  ) : (
                    myPickups.map((pickup) => (
                      <div
                        key={pickup._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-800 text-sm truncate">{pickup.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[pickup.status] || 'bg-gray-100 text-gray-600'}`}>
                              {pickup.status.charAt(0).toUpperCase() + pickup.status.slice(1)}
                            </span>
                            {pickup.safetyCheckFailed && (
                              <span className="text-[10.5px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 border border-red-200">
                                🔴 Failed Safety Check
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {pickup.pickupCity}
                            </span>
                            <span>{pickup.quantity} {pickup.quantityUnit}</span>
                          </div>
                          {pickup.donor && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              From: {pickup.donor.organizationName || pickup.donor.name} · {pickup.donor.phone}
                            </p>
                          )}
                          {pickup.rejectionReason && (
                            <p className="text-xs text-red-600 font-medium mt-1">
                              Rejection reason: {pickup.rejectionReason}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Verification at pickup button for reserved / pickup_confirmed orders */}
                          {['reserved', 'pickup_confirmed', 'assigned'].includes(pickup.status) && (
                            <button
                              onClick={() => handleOpenVerification(pickup)}
                              className="text-xs font-bold py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
                            >
                              Verify & Collect
                            </button>
                          )}
                          {pickup.status === 'picked_up' && (
                            <button
                              onClick={() => handleComplete(pickup)}
                              className="text-xs btn-primary py-1.5 px-3"
                            >
                              Mark Complete ✓
                            </button>
                          )}
                          <Link to={`/donations/${pickup._id}`} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Community Requests View */}
              {activeView === 'requests' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Post meal and supplies requests for community donors to fulfill.</p>
                    <button
                      onClick={() => setNewRequestModal(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      + Post New Request
                    </button>
                  </div>

                  {communityRequests.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <UtensilsCrossed className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600 font-semibold text-sm">No community food requests active</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {communityRequests.map((req) => (
                        <div key={req.id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-gray-800 text-sm">{req.title}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${req.urgency === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {req.urgency}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{req.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                            <span>Required: <strong>{req.requiredQuantity} {req.quantityUnit}</strong></span>
                            <span>Beneficiaries: ~{req.targetBeneficiaries}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Interested Donors Management View */}
              {activeView === 'interests' && (
                <div className="space-y-3">
                  {donorInterests.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <Heart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600 font-semibold text-sm">No donor interest pledges yet</p>
                      <p className="text-xs text-gray-400 mt-0.5">When donors click "I Want to Donate" on your requests, they will appear here.</p>
                    </div>
                  ) : (
                    donorInterests.map((interest) => (
                      <div key={interest.id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-800 text-sm">{interest.donor?.organizationName || interest.donor?.name}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${interest.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : interest.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {interest.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            For request: <strong>{interest.request?.title}</strong>
                          </p>
                          <p className="text-xs text-emerald-800 font-medium mt-1">
                            {interest.supportType === 'food' ? `📦 Pledged Food: ${interest.foodItemsDescription || `${interest.pledgedQuantity} servings`}` : `💰 Support Amount: ₹${interest.pledgedAmount}`}
                          </p>
                          {interest.message && <p className="text-xs text-gray-600 italic mt-0.5">"{interest.message}"</p>}
                        </div>

                        {interest.status === 'interested' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleInterestStatus(interest.id, 'accepted')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                            >
                              Accept Offer
                            </button>
                            <button
                              onClick={() => handleInterestStatus(interest.id, 'declined')}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Post Request Modal */}
            {newRequestModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-base">Create Community Food Request</h3>
                    <button onClick={() => setNewRequestModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                  <form onSubmit={handleCreateRequest} className="space-y-3">
                    <div>
                      <label className="label">Title / Food Need *</label>
                      <input
                        required
                        value={requestForm.title}
                        onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                        placeholder="e.g. Need 80 dinner packets for homeless shelter"
                        className="input-field text-xs"
                      />
                    </div>
                    <div>
                      <label className="label">Description & Urgency Details *</label>
                      <textarea
                        required
                        rows="2"
                        value={requestForm.description}
                        onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                        placeholder="Describe target community, dietary preferences, or timing..."
                        className="input-field text-xs resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label">Quantity</label>
                        <input
                          type="number"
                          value={requestForm.requiredQuantity}
                          onChange={(e) => setRequestForm({ ...requestForm, requiredQuantity: e.target.value })}
                          className="input-field text-xs"
                        />
                      </div>
                      <div>
                        <label className="label">Beneficiaries</label>
                        <input
                          type="number"
                          value={requestForm.targetBeneficiaries}
                          onChange={(e) => setRequestForm({ ...requestForm, targetBeneficiaries: e.target.value })}
                          className="input-field text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setNewRequestModal(false)} className="px-3 py-1.5 text-xs text-gray-600">Cancel</button>
                      <button type="submit" className="btn-primary text-xs px-4 py-1.5">Publish Request</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeView === 'available' && availableDonations.length > 0 && (
              <div className="px-6 pb-5">
                <Link to="/donations" className="btn-outline w-full flex items-center justify-center gap-2 text-sm">
                  Browse All Donations <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Food Safety Modal Popup */}
      <FoodSafetyModal
        isOpen={safetyModalOpen}
        onClose={() => {
          setSafetyModalOpen(false);
          setSelectedDonation(null);
        }}
        donation={selectedDonation}
        safetyStatus={selectedDonation ? calculateFoodSafetyStatus(selectedDonation) : null}
        onAccept={handleAcceptOrder}
        isAccepting={isAcceptingOrder}
      />

      {/* Pickup Verification Checklist Modal (for Urgent / on-site orders) */}
      <PickupVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => {
          setVerificationModalOpen(false);
          setVerifyingDonation(null);
        }}
        donation={verifyingDonation}
        onVerifyAndCollect={handleVerifyAndCollect}
        onReject={handleRejectDonation}
        loading={isSubmittingVerification}
      />
    </div>
  );
};

export default NGODashboard;

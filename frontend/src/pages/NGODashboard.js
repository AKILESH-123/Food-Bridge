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
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import DonationCard from '../components/DonationCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NGODashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [availableDonations, setAvailableDonations] = useState([]);
  const [myPickups, setMyPickups] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [activeView, setActiveView] = useState('available');

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/stats/ngo');
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
      const res = await api.get('/donations?status=available&limit=8');
      setAvailableDonations(res.data.donations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDonations(false);
    }
  }, []);

  const fetchMyPickups = useCallback(async () => {
    try {
      const res = await api.get('/donations/assigned');
      setMyPickups(res.data.donations);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchAvailable();
    fetchMyPickups();
  }, [fetchStats, fetchAvailable, fetchMyPickups]);

  const handleRequest = async (donation) => {
    try {
      await api.post(`/donations/${donation._id}/request`);
      toast.success('Pickup requested! Wait for donor confirmation.');
      fetchAvailable();
      fetchMyPickups();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
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
          <div className="mb-8">
            <h1 className="text-2xl font-black text-gray-800">
              Welcome, {user?.name?.split(' ')[0]}! 🤝
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {user?.organizationName ? `${user.organizationName} · ` : ''}NGO / Volunteer Dashboard
            </p>
          </div>

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
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-bold text-gray-800">Food Donations</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveView('available')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      activeView === 'available' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Available ({availableDonations.length})
                  </button>
                  <button
                    onClick={() => setActiveView('my')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      activeView === 'my' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    My Pickups ({myPickups.length})
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {activeView === 'available' ? (
                loadingDonations ? (
                  <div className="flex justify-center py-10">
                    <div className="spinner" />
                  </div>
                ) : availableDonations.length === 0 ? (
                  <div className="text-center py-12">
                    <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No available donations right now</p>
                    <p className="text-gray-400 text-sm mt-1">Check back soon or refresh the page</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {availableDonations.map((donation) => (
                      <DonationCard
                        key={donation._id}
                        donation={donation}
                        onAction={handleRequest}
                        actionLabel="Request Pickup"
                        actionVariant="primary"
                      />
                    ))}
                  </div>
                )
              ) : (
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
                        </div>
                        <div className="flex items-center gap-2">
                          {pickup.status === 'assigned' && (
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
            </div>

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
    </div>
  );
};

export default NGODashboard;

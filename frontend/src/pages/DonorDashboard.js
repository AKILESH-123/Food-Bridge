import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Package,
  CheckCircle2,
  Clock,
  Star,
  Leaf,
  ChevronRight,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const statusColors = {
  available: 'bg-emerald-100 text-emerald-700',
  requested: 'bg-amber-100 text-amber-700',
  assigned: 'bg-blue-100 text-blue-700',
  completed: 'bg-purple-100 text-purple-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

const DonorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, donationsRes] = await Promise.all([
        api.get('/stats/donor'),
        api.get('/donations/my?limit=20'),
      ]);
      setStats(statsRes.data.stats);
      setDonations(donationsRes.data.donations);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssign = async (donation) => {
    if (!window.confirm('Confirm pickup assignment for this donation?')) return;
    try {
      await api.post(`/donations/${donation._id}/assign`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign');
    }
  };

  const filteredDonations = donations.filter((d) => {
    if (activeTab === 'all') return true;
    return d.status === activeTab;
  });

  const tabs = [
    { value: 'all', label: 'All', count: donations.length },
    { value: 'available', label: 'Available', count: donations.filter((d) => d.status === 'available').length },
    { value: 'requested', label: 'Requested', count: donations.filter((d) => d.status === 'requested').length },
    { value: 'assigned', label: 'Assigned', count: donations.filter((d) => d.status === 'assigned').length },
    { value: 'completed', label: 'Completed', count: donations.filter((d) => d.status === 'completed').length },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black text-gray-800">
                Welcome back, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {user?.organizationName ? `${user.organizationName} · ` : ''}Donor Dashboard
              </p>
            </div>
            <Link to="/donations/new" className="btn-secondary flex items-center gap-2 self-start sm:self-auto">
              <PlusCircle className="w-4 h-4" />
              Donate Food
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="spinner" />
            </div>
          ) : (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard title="Total Donations" value={stats?.totalDonations || 0} icon={Package} color="green" />
                <StatsCard title="Completed" value={stats?.completedDonations || 0} icon={CheckCircle2} color="purple" />
                <StatsCard title="Active Now" value={stats?.activeDonations || 0} icon={Clock} color="orange" />
                <StatsCard title="Impact Points" value={stats?.impactPoints || 0} icon={Star} color="yellow" suffix="pts" />
              </div>

              {/* Impact strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white text-center">
                  <div className="text-3xl font-black">{stats?.mealsSaved || 0}</div>
                  <div className="text-green-100 text-sm mt-1">🍽️ Meals Saved</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white text-center">
                  <div className="text-3xl font-black">{stats?.foodSavedKg || 0} kg</div>
                  <div className="text-blue-100 text-sm mt-1">♻️ Food Saved</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white text-center">
                  <div className="text-3xl font-black">{stats?.co2Saved || 0} kg</div>
                  <div className="text-emerald-100 text-sm mt-1">🌿 CO₂ Saved</div>
                </div>
              </div>

              {/* My Donations */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-gray-800">My Donations</h2>
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {tabs.map((tab) => (
                        <button
                          key={tab.value}
                          onClick={() => setActiveTab(tab.value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                            activeTab === tab.value
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {tab.label}
                          {tab.count > 0 && (
                            <span
                              className={`w-4 h-4 rounded-full text-xs flex items-center justify-center ${
                                activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'
                              }`}
                            >
                              {tab.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {filteredDonations.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        {activeTab === 'all' ? 'No donations yet' : `No ${activeTab} donations`}
                      </p>
                      <Link to="/donations/new" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
                        <PlusCircle className="w-4 h-4" /> Post Your First Donation
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredDonations.map((donation) => (
                        <div
                          key={donation._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-green-50/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-800 text-sm truncate">{donation.title}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[donation.status]}`}>
                                {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                              </span>
                              {donation.isUrgent && <span className="badge-urgent">🔥 Urgent</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {donation.quantity} {donation.quantityUnit} · {donation.pickupCity} ·{' '}
                              {formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })}
                            </p>
                            {donation.status === 'requested' && donation.requestedBy && (
                              <p className="text-xs text-amber-600 mt-1 font-medium">
                                📦 Requested by: {donation.requestedBy.organizationName || donation.requestedBy.name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {donation.status === 'requested' && (
                              <button
                                onClick={() => handleAssign(donation)}
                                className="text-xs btn-primary py-1.5 px-3"
                              >
                                Confirm Pickup
                              </button>
                            )}
                            <Link
                              to={`/donations/${donation._id}`}
                              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Impact tip */}
              <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 flex items-start gap-4">
                <Leaf className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800">Did you know?</p>
                  <p className="text-green-700 text-sm mt-0.5">
                    Every kilogram of food donated saves approximately 2.5 kg of CO₂ emissions. You're making a real
                    environmental difference! 🌍
                  </p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default DonorDashboard;

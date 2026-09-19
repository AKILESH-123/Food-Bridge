import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter, UtensilsCrossed, Flame, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import DonationCard from '../components/DonationCard';
import FoodSafetyModal from '../components/FoodSafetyModal';
import { calculateFoodSafetyStatus } from '../utils/foodSafety';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const CATEGORIES = ['all', 'cooked', 'packaged', 'raw', 'beverages', 'bakery', 'dairy', 'other'];
const MEAL_TYPES = [
  { id: 'all', label: 'All Meals' },
  { id: 'dinner', label: '🌙 Dinner Spoilage Rescue' },
  { id: 'lunch', label: '☀️ Lunch' },
  { id: 'breakfast', label: '🍳 Breakfast' },
  { id: 'snacks', label: '🥪 Snacks' },
];

const Donations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', category: '', urgent: false, mealType: 'all', sortBy: 'nearest' });
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Food safety modal state
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [safetyFilter, setSafetyFilter] = useState('all'); // 'all' | 'safe' | 'urgent' | 'do_not_distribute'
  const [, setTick] = useState(Date.now());

  // 60-second timer to re-evaluate food safety statuses
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const fetchDonations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (filters.city) params.append('city', filters.city);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.mealType && filters.mealType !== 'all') params.append('mealType', filters.mealType);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.urgent) params.append('urgent', 'true');
      if (userLocation) {
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
      }

      const res = await api.get(`/donations?${params}`);
      setDonations(res.data.donations);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, userLocation]);

  useEffect(() => {
    fetchDonations(1);
  }, [fetchDonations]);

  const handleRequest = async (donation) => {
    if (user?.role === 'ngo' && user?.verificationStatus !== 'verified') {
      toast.error('Admin verification required! Only verified NGOs can claim donations.', { duration: 4000 });
      return;
    }
    try {
      await api.post(`/donations/${donation._id}/request`);
      toast.success('Food reserved & claimed! Awaiting donor pickup assurance. 📦');
      fetchDonations(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    }
  };

  const filteredBySearch = donations.filter(
    (d) =>
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase()) ||
      d.pickupCity?.toLowerCase().includes(search.toLowerCase())
  );

  const clearFilters = () => {
    setFilters({ city: '', category: '', urgent: false });
    setSearch('');
  };

  const hasFilters = filters.city || (filters.category && filters.category !== 'all') || filters.urgent || search;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {user && <div className="hidden lg:block"><Sidebar /></div>}
      <div className={`flex-1 min-w-0 flex flex-col ${user ? 'lg:ml-64' : ''}`}>
        <div className="lg:hidden"><Navbar /></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Available Donations</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {pagination.total} donations available — find food near you
            </p>
          </div>
          {user?.role === 'donor' && (
            <Link to="/donations/new" className="btn-secondary flex items-center gap-2 self-start">
              + Donate Food
            </Link>
          )}
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search by title, description, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field py-2.5"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>

            <input
              type="text"
              placeholder="Filter by city"
              value={filters.city}
              onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
              className="input-field py-2.5 sm:w-40"
            />

            <button
              onClick={() => setShowFilters((p) => !p)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${showFilters ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-green-300'}`}
            >
              <Filter className="w-4 h-4 flex-shrink-0" />
              <span>Filters</span>
            </button>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4 flex-shrink-0" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              {/* Meal Type Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-700 w-20">Meal Type:</span>
                <div className="flex flex-wrap gap-1.5">
                  {MEAL_TYPES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setFilters((p) => ({ ...p, mealType: m.id }))}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        filters.mealType === m.id
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-700 w-20">Category:</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilters((p) => ({ ...p, category: cat }))}
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                        filters.category === cat || (!filters.category && cat === 'all')
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Safety Status Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-700 w-20">Safety:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: 'all', label: 'All Statuses' },
                    { key: 'safe', label: '🟢 Safe to Review' },
                    { key: 'urgent', label: '🟡 Urgent Pickup' },
                    { key: 'do_not_distribute', label: '🔴 Exceeded Limit' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSafetyFilter(s.key)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        safetyFilter === s.key
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort & Urgency */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">Sort By:</span>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters((p) => ({ ...p, sortBy: e.target.value }))}
                    className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 font-medium text-gray-700"
                  >
                    <option value="nearest">📍 Nearest First</option>
                    <option value="expiring_soon">⏰ Expiring Soonest</option>
                    <option value="newest">🆕 Newest Posted</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setFilters((p) => ({ ...p, urgent: !p.urgent }))}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${filters.urgent ? 'bg-red-500' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${filters.urgent ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span>Urgent Only</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : filteredBySearch.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No donations found</h3>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-outline mt-4 text-sm">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredBySearch
                .map((d) => ({
                  ...d,
                  computedSafety: calculateFoodSafetyStatus(d),
                }))
                .filter((d) => safetyFilter === 'all' || d.computedSafety.statusKey === safetyFilter)
                .sort((a, b) => {
                  const score = { safe: 0, urgent: 1, do_not_distribute: 2 };
                  const diff = (score[a.computedSafety.statusKey] ?? 1) - (score[b.computedSafety.statusKey] ?? 1);
                  if (diff !== 0) return diff;
                  return a.computedSafety.remainingMs - b.computedSafety.remainingMs;
                })
                .map((donation) => (
                  <DonationCard
                    key={donation._id}
                    donation={donation}
                    onCardClick={user?.role === 'ngo' ? (d) => {
                      setSelectedDonation(d);
                      setSafetyModalOpen(true);
                    } : undefined}
                    onAction={user?.role === 'ngo' && donation.status === 'available' ? (d) => {
                      setSelectedDonation(d);
                      setSafetyModalOpen(true);
                    } : undefined}
                    actionLabel="Review & Accept"
                  />
                ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => fetchDonations(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 font-medium">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => fetchDonations(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Food Safety Modal */}
      <FoodSafetyModal
        isOpen={safetyModalOpen}
        onClose={() => {
          setSafetyModalOpen(false);
          setSelectedDonation(null);
        }}
        donation={selectedDonation}
        safetyStatus={selectedDonation ? calculateFoodSafetyStatus(selectedDonation) : null}
        onAccept={async (donation) => {
          setIsAccepting(true);
          try {
            await handleRequest(donation);
            setSafetyModalOpen(false);
            setSelectedDonation(null);
          } finally {
            setIsAccepting(false);
          }
        }}
        isAccepting={isAccepting}
      />
    </div>
  );
};

export default Donations;

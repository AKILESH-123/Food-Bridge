import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter, UtensilsCrossed, Flame, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import DonationCard from '../components/DonationCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const CATEGORIES = ['all', 'cooked', 'packaged', 'raw', 'beverages', 'bakery', 'dairy', 'other'];

const Donations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', category: '', urgent: false });
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);

  const fetchDonations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (filters.city) params.append('city', filters.city);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.urgent) params.append('urgent', 'true');

      const res = await api.get(`/donations?${params}`);
      setDonations(res.data.donations);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDonations(1);
  }, [fetchDonations]);

  const handleRequest = async (donation) => {
    try {
      await api.post(`/donations/${donation._id}/request`);
      toast.success('Pickup requested! Wait for donor confirmation. 📦');
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
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Category:</span>
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
              <div className="flex items-center gap-2 ml-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setFilters((p) => ({ ...p, urgent: !p.urgent }))}
                    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${filters.urgent ? 'bg-red-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${filters.urgent ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>Urgent Only</span>
                  </span>
                </label>
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
              {filteredBySearch.map((donation) => (
                <DonationCard
                  key={donation._id}
                  donation={donation}
                  onAction={user?.role === 'ngo' && donation.status === 'available' ? handleRequest : undefined}
                  actionLabel="Request Pickup"
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
    </div>
  );
};

export default Donations;

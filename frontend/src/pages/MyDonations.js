import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  available: { label: 'Available', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  requested: { label: 'Requested', color: 'bg-blue-100 text-blue-700', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  assigned: { label: 'Assigned', color: 'bg-purple-100 text-purple-700', icon: <Package className="w-3.5 h-3.5" /> },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600', icon: <XCircle className="w-3.5 h-3.5" /> },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-500', icon: <Clock className="w-3.5 h-3.5" /> },
};

export default function MyDonations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0 });
  const limit = 10;

  const fetchDonations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/donations/my?${params}`);
      setDonations(res.data.donations);
      setPagination({ page, total: res.data.total });
    } catch (err) {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDonations(1);
  }, [fetchDonations]);

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this donation? This cannot be undone.')) return;
    try {
      await api.delete(`/donations/${id}`);
      toast.success('Donation deleted.');
      fetchDonations(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this donation?')) return;
    try {
      await api.post(`/donations/${id}/cancel`);
      toast.success('Donation cancelled.');
      fetchDonations(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const totalPages = Math.ceil(pagination.total / limit);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {user && <div className="hidden lg:block"><Sidebar /></div>}
      <div className={`flex-1 min-w-0 flex flex-col ${user ? 'lg:ml-64' : ''}`}>
        <div className="lg:hidden"><Navbar /></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black text-gray-800">My Donations</h1>
              <p className="text-gray-500 text-sm mt-0.5">{pagination.total} donation{pagination.total !== 1 ? 's' : ''} total</p>
            </div>
            <Link to="/donations/new" className="btn-secondary flex items-center gap-2 self-start">
              <PlusCircle className="w-4 h-4" />
              New Donation
            </Link>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            {[
              { value: '', label: 'All' },
              { value: 'available', label: 'Available' },
              { value: 'requested', label: 'Requested' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  statusFilter === s.value
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="spinner" />
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-600 mb-1">
                {statusFilter ? `No ${statusFilter} donations` : 'No donations yet'}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                {statusFilter ? 'Try a different filter' : 'Post your first food donation to get started'}
              </p>
              {!statusFilter && (
                <Link to="/donations/new" className="btn-primary">
                  Post a Donation
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => {
                const st = STATUS_LABELS[donation.status] || STATUS_LABELS.available;
                const canCancel = ['available', 'requested'].includes(donation.status);
                return (
                  <div
                    key={donation._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    {/* Image / icon */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-green-50 flex items-center justify-center">
                      {donation.images?.length > 0 ? (
                        <img src={donation.images[0]} alt={donation.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-green-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-800 truncate">{donation.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.color}`}>
                          {st.icon} {st.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-green-500" />
                          {donation.quantity} {donation.quantityUnit}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-400" />
                          {donation.pickupCity}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {format(new Date(donation.createdAt), 'MMM d, yyyy')}
                        </span>
                        {donation.expiresAt && donation.status === 'available' && (
                          <span className="flex items-center gap-1 text-orange-500 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            Expires {formatDistanceToNow(new Date(donation.expiresAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>

                      {/* NGO info if requested/assigned */}
                      {donation.requestedBy && donation.status === 'requested' && (
                        <p className="text-xs mt-1.5 text-blue-600 font-medium">
                          Requested by: {donation.requestedBy.organizationName || donation.requestedBy.name}
                        </p>
                      )}
                      {donation.assignedTo && donation.status === 'assigned' && (
                        <p className="text-xs mt-1.5 text-purple-600 font-medium">
                          Assigned to: {donation.assignedTo.organizationName || donation.assignedTo.name}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => navigate(`/donations/${donation._id}`)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      {donation.status !== 'completed' && (
                        <button
                          onClick={() => handleDelete(donation._id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 border border-red-300 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(donation._id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => fetchDonations(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600 font-medium">
                    Page {pagination.page} of {totalPages}
                  </span>
                  <button
                    onClick={() => fetchDonations(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                    className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

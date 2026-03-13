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
import api from '../services/api';
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
  assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-4 h-4" /> },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-600', icon: <CheckCircle className="w-4 h-4" /> },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-600', icon: <XCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600', icon: <XCircle className="w-4 h-4" /> },
};

export default function DonationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchDonation();
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
    setActionLoading(action);
    try {
      let res;
      if (action === 'request') {
        res = await api.post(`/donations/${id}/request`);
        toast.success('Pickup requested! Waiting for donor confirmation.');
      } else if (action === 'assign') {
        res = await api.post(`/donations/${id}/assign`);
        toast.success('Pickup confirmed! NGO will come to collect soon.');
      } else if (action === 'complete') {
        res = await api.post(`/donations/${id}/complete`);
        toast.success('Donation marked as completed! Impact points earned. 🎉');
      } else if (action === 'cancel') {
        res = await api.post(`/donations/${id}/cancel`);
        toast.success('Donation cancelled.');
      }
      setDonation(res.data.donation);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
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
  const isDonor = user && donation.donor && (user._id === donation.donor._id || user._id === donation.donor);
  const isNGO = user && user.role === 'ngo';
  const requestedByMe = user && donation.requestedBy && (user._id === String(donation.requestedBy._id || donation.requestedBy));

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
                  src={`http://localhost:5000${images[selectedImage]}`}
                  alt={donation.title}
                  className="w-full h-64 object-cover"
                />
                {images.length > 1 && (
                  <div className="flex gap-2 p-3">
                    {images.map((img, i) => (
                      <button key={i} onClick={() => setSelectedImage(i)}>
                        <img
                          src={`http://localhost:5000${img}`}
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
              </div>

              {/* Dietary badges */}
              {(donation.isVegetarian || donation.isVegan) && (
                <div className="flex gap-2 mt-4">
                  {donation.isVegetarian && (
                    <span className="flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
                      <Leaf className="w-3 h-3" /> Vegetarian
                    </span>
                  )}
                  {donation.isVegan && (
                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                      🌱 Vegan
                    </span>
                  )}
                </div>
              )}
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
                  {/* NGO Request */}
                  {isNGO && donation.status === 'available' && !requestedByMe && (
                    <button
                      onClick={() => handleAction('request')}
                      disabled={actionLoading === 'request'}
                      className="btn-primary w-full py-3"
                    >
                      {actionLoading === 'request' ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" /> Requesting...
                        </span>
                      ) : '🤝 Request Pickup'}
                    </button>
                  )}

                  {/* Donor Assign */}
                  {isDonor && donation.status === 'requested' && (
                    <button
                      onClick={() => handleAction('assign')}
                      disabled={actionLoading === 'assign'}
                      className="btn-primary w-full py-3"
                    >
                      {actionLoading === 'assign' ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" /> Confirming...
                        </span>
                      ) : '✅ Confirm Pickup'}
                    </button>
                  )}

                  {/* Mark Complete */}
                  {(isDonor || isNGO) && donation.status === 'assigned' && (
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
                      className="btn-outline w-full py-3 border-red-200 text-red-600 hover:bg-red-50"
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
      </div>
    </div>
  </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Package,
  ChevronRight,
  Flame,
  Leaf,
  ShoppingBag,
  Coffee,
  Wheat,
  Milk,
  UtensilsCrossed,
  CheckCircle2,
} from 'lucide-react';
import { format, isPast } from 'date-fns';

const categoryConfig = {
  cooked: { icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-600', label: 'Cooked Food' },
  packaged: { icon: ShoppingBag, color: 'bg-blue-100 text-blue-600', label: 'Packaged' },
  raw: { icon: Wheat, color: 'bg-yellow-100 text-yellow-700', label: 'Raw/Vegetables' },
  beverages: { icon: Coffee, color: 'bg-purple-100 text-purple-600', label: 'Beverages' },
  bakery: { icon: Package, color: 'bg-amber-100 text-amber-700', label: 'Bakery' },
  dairy: { icon: Milk, color: 'bg-cyan-100 text-cyan-700', label: 'Dairy' },
  other: { icon: Leaf, color: 'bg-green-100 text-green-600', label: 'Other' },
};

const statusBadge = {
  available: 'badge-available',
  requested: 'badge-requested',
  assigned: 'badge-assigned',
  completed: 'badge-completed',
  expired: 'badge-expired',
  cancelled: 'badge-cancelled',
};

const DonationCard = ({ donation, onAction, actionLabel, actionVariant = 'primary', showDonor = true }) => {
  const cat = categoryConfig[donation.category] || categoryConfig.other;
  const CatIcon = cat.icon;
  const expiryPassed = isPast(new Date(donation.expiresAt));

  const getTimeLeft = () => {
    if (expiryPassed) return 'Expired';
    const mins = Math.round((new Date(donation.expiresAt) - new Date()) / 60000);
    if (mins < 60) return `${mins}m left`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h left`;
    return format(new Date(donation.expiresAt), 'MMM d, h:mm a');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm card-hover overflow-hidden flex flex-col">
      {/* Image or category banner */}
      <div className="relative">
        {donation.images?.length > 0 ? (
          <img
            src={donation.images[0]}
            alt={donation.title}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className={`w-full h-40 flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100`}>
            <CatIcon className="w-16 h-16 text-green-300" />
          </div>
        )}

        {/* Overlays */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className={statusBadge[donation.status] || 'badge-available'}>
            {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
          </span>
          {donation.isUrgent && !expiryPassed && (
            <span className="badge-urgent flex items-center gap-1">
              <Flame className="w-3 h-3" /> Urgent
            </span>
          )}
        </div>

        {donation.isVegetarian && (
          <div className="absolute top-3 right-3 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center" title="Vegetarian">
            <span className="text-white text-xs font-bold">V</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{donation.title}</h3>
            <span className={`${cat.color} flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium flex-shrink-0`}>
              <CatIcon className="w-3 h-3" />
              {cat.label}
            </span>
          </div>

          {showDonor && donation.donor && (
            <p className="text-xs text-gray-500 mb-2 truncate">
              <span className="font-medium text-gray-700">
                {donation.donor.organizationName || donation.donor.name}
              </span>
              {donation.donor.city && ` · ${donation.donor.city}`}
            </p>
          )}

          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{donation.description}</p>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Package className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span>
                {donation.quantity} {donation.quantityUnit}
                {donation.estimatedServings > 0 && (
                  <span className="text-green-600 font-medium"> · ~{donation.estimatedServings} servings</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              <span className="truncate">{donation.pickupCity}</span>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${expiryPassed ? 'text-red-500' : donation.isUrgent ? 'text-orange-500' : 'text-gray-600'}`}>
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{getTimeLeft()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Link
            to={`/donations/${donation._id}`}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Details
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          {onAction && donation.status !== 'completed' && donation.status !== 'expired' && (
            <button
              onClick={() => onAction(donation)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                actionVariant === 'primary'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : actionVariant === 'orange'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationCard;

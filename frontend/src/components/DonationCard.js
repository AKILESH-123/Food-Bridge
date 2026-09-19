import React, { useState, useEffect } from 'react';
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
  Moon,
  Sun,
} from 'lucide-react';
import { buildBackendUrl } from '../services/api';
import { calculateFoodSafetyStatus, formatDurationMs } from '../utils/foodSafety';

const categoryConfig = {
  cooked: { icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-600', label: 'Cooked Food' },
  packaged: { icon: ShoppingBag, color: 'bg-blue-100 text-blue-600', label: 'Packaged' },
  raw: { icon: Wheat, color: 'bg-yellow-100 text-yellow-700', label: 'Raw/Vegetables' },
  beverages: { icon: Coffee, color: 'bg-purple-100 text-purple-600', label: 'Beverages' },
  bakery: { icon: Package, color: 'bg-amber-100 text-amber-700', label: 'Bakery' },
  dairy: { icon: Milk, color: 'bg-cyan-100 text-cyan-700', label: 'Dairy' },
  other: { icon: Leaf, color: 'bg-green-100 text-green-600', label: 'Other' },
};

const mealIcons = {
  dinner: { icon: Moon, label: 'Dinner', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  lunch: { icon: Sun, label: 'Lunch', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  breakfast: { icon: Sun, label: 'Breakfast', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  snacks: { icon: UtensilsCrossed, label: 'Snacks', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  other: { icon: Leaf, label: 'Meal', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const statusBadge = {
  available: 'badge-available',
  reserved: 'bg-blue-100 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-full font-bold',
  pickup_confirmed: 'bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs px-2 py-0.5 rounded-full font-bold',
  picked_up: 'bg-amber-100 text-amber-800 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-bold',
  delivered: 'bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-bold',
  completed: 'badge-completed',
  expired: 'badge-expired',
  cancelled: 'badge-cancelled',
};

const DonationCard = ({
  donation,
  onAction,
  actionLabel,
  actionVariant = 'primary',
  showDonor = true,
  onCardClick,
}) => {
  const cat = categoryConfig[donation.category] || categoryConfig.other;
  const CatIcon = cat.icon;
  const meal = mealIcons[donation.mealType] || mealIcons.other;
  const MealIcon = meal.icon;

  const targetDate = donation.pickupDeadline || donation.expiresAt;
  const [timeLeft, setTimeLeft] = useState('');
  const [safety, setSafety] = useState(() => calculateFoodSafetyStatus(donation));

  useEffect(() => {
    const update = () => {
      const currentSafety = calculateFoodSafetyStatus(donation);
      setSafety(currentSafety);

      if (currentSafety.remainingMs <= 0) {
        setTimeLeft('00:00:00');
      } else {
        setTimeLeft(formatDurationMs(currentSafety.remainingMs));
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [donation]);

  const isRed = safety.color === 'red';
  const isUrgent = safety.color === 'yellow';
  const isSafe = safety.color === 'green';

  return (
    <div
      onClick={() => onCardClick && onCardClick(donation, safety)}
      className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm card-hover overflow-hidden flex flex-col relative ${
        isRed ? 'opacity-75 grayscale-[0.35] bg-gray-50/80 border-red-200' : 'border-gray-100'
      } ${onCardClick ? 'cursor-pointer' : ''}`}
    >
      {/* Image or category banner */}
      <div className="relative">
        {donation.images?.length > 0 ? (
          <img
            src={buildBackendUrl(donation.images[0])}
            alt={donation.title}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className={`w-full h-40 flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100`}>
            <CatIcon className="w-16 h-16 text-green-300" />
          </div>
        )}

        {/* Distance Chip */}
        {donation.distanceKm !== null && donation.distanceKm !== undefined && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-md">
            <MapPin className="w-3 h-3 text-red-400" />
            <span>{donation.distanceKm} km away</span>
          </div>
        )}

        {/* Overlays */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className={statusBadge[donation.status] || 'badge-available'}>
            {donation.status === 'pickup_confirmed'
              ? 'Assurance Confirmed'
              : donation.status === 'picked_up'
              ? 'Picked Up'
              : donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
          </span>

          {/* Food Safety Status Badge (🟢/🟡/🔴) */}
          <span
            className={`font-bold text-[10.5px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm ${
              isRed
                ? 'bg-red-600 text-white animate-pulse'
                : isUrgent
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {isSafe && '🟢 Safe to Review'}
            {isUrgent && '🟡 Urgent Pickup'}
            {isRed && '🔴 Do Not Distribute'}
          </span>
        </div>

        {donation.isVegetarian && (
          <div className="absolute top-3 right-3 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center shadow-md" title="Vegetarian">
            <span className="text-white text-xs font-bold">V</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{donation.title}</h3>
            <span className={`${meal.color} border flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold flex-shrink-0`}>
              <MealIcon className="w-3 h-3" />
              {meal.label}
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
            
            {/* Live countdown of safe-use time remaining */}
            <div className={`flex items-center justify-between text-xs font-bold py-1.5 px-2.5 rounded-xl ${
              isRed
                ? 'bg-red-50 text-red-700 border border-red-200'
                : isUrgent
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{safety.remainingMs > 0 ? `${timeLeft} safe-use left` : 'Safe-use window ended'}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 font-black">
                {safety.percentUsed}%
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link
            to={`/donations/${donation._id}`}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Details
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          {onAction && donation.status !== 'completed' && donation.status !== 'expired' && (
            isRed ? (
              <button
                disabled
                title="This food exceeds safe-use limit. Cannot be distributed."
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 shadow-none"
              >
                Accept Disabled
              </button>
            ) : (
              <button
                onClick={() => onAction(donation, safety)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isUrgent
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : actionVariant === 'primary'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : actionVariant === 'orange'
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {actionLabel}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationCard;

import React from 'react';
import { TrendingUp } from 'lucide-react';

const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'green', trend, prefix = '', suffix = '' }) => {
  const colorMap = {
    green: {
      bg: 'bg-green-50',
      icon: 'bg-green-100 text-green-600',
      value: 'text-green-700',
      border: 'border-green-100',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'bg-orange-100 text-orange-600',
      value: 'text-orange-700',
      border: 'border-orange-100',
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-100 text-blue-600',
      value: 'text-blue-700',
      border: 'border-blue-100',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-100 text-purple-600',
      value: 'text-purple-700',
      border: 'border-purple-100',
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'bg-yellow-100 text-yellow-600',
      value: 'text-yellow-700',
      border: 'border-yellow-100',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'bg-red-100 text-red-600',
      value: 'text-red-700',
      border: 'border-red-100',
    },
  };

  const c = colorMap[color] || colorMap.green;

  return (
    <div className={`${c.bg} ${c.border} border rounded-2xl p-5 card-hover`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${c.value} count-up`}>
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-green-600 font-medium">+{trend}% this month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`${c.icon} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;

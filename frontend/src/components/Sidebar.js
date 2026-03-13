import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  PlusCircle,
  Trophy,
  User,
  LogOut,
  Leaf,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const donorLinks = [
    { to: '/dashboard/donor', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/donations/new', icon: PlusCircle, label: 'Donate Food' },
    { to: '/donations/my', icon: Package, label: 'My Donations', href: '/donations?view=my' },
    { to: '/donations', icon: UtensilsCrossed, label: 'Browse Donations' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const ngoLinks = [
    { to: '/dashboard/ngo', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/donations', icon: UtensilsCrossed, label: 'Available Food' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/donations', icon: UtensilsCrossed, label: 'All Donations' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const links = user?.role === 'donor' ? donorLinks : user?.role === 'ngo' ? ngoLinks : adminLinks;

  return (
    <aside className="w-64 h-screen fixed top-0 left-0 bg-white border-r border-gray-100 flex flex-col shadow-sm z-40">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 px-6 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-green-700">
          Food<span className="text-orange-500">Bridge</span>
        </span>
      </Link>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5 bg-yellow-50 rounded-lg px-3 py-1.5">
          <span className="text-yellow-500">⭐</span>
          <span className="text-xs font-semibold text-yellow-700">{user?.impactPoints || 0} Impact Points</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`sidebar-link ${isActive(link.to) ? 'active' : ''}`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: '18px', height: '18px' }} />
              <span className="text-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom logout */}
      <div className="px-3 pb-4 pt-2 border-t border-gray-100">
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

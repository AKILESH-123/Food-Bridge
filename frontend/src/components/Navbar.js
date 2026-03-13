import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Leaf,
  Bell,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  Trophy,
  UtensilsCrossed,
  PlusCircle,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount, setUnreadCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    if (loadingNotifications) return;
    setLoadingNotifications(true);
    try {
      const res = await api.get('/notifications?limit=10');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotifOpen = () => {
    setNotifOpen((prev) => !prev);
    if (!notifOpen) fetchNotifications();
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    return user.role === 'donor' ? '/dashboard/donor' : user.role === 'ngo' ? '/dashboard/ngo' : '/dashboard/admin';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-green-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-glow transition-all duration-200">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-green-700">
              Food<span className="text-orange-500">Bridge</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/donations"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive('/donations')
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              Donations
            </Link>
            <Link
              to="/leaderboard"
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive('/leaderboard')
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </Link>
            {user?.role === 'donor' && (
              <Link
                to="/donations/new"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Donate Food
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleNotifOpen}
                    className="relative p-2.5 rounded-xl hover:bg-green-50 transition-colors"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <>
                      {/* Mobile overlay backdrop */}
                      <div
                        className="fixed inset-0 z-40 md:hidden"
                        onClick={() => setNotifOpen(false)}
                      />
                      {/* Dropdown: full-width fixed on mobile, anchored on desktop */}
                      <div className="fixed left-2 right-2 top-16 z-50 md:absolute md:left-auto md:right-0 md:top-auto md:mt-2 md:w-80 md:fixed-none bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                          <h3 className="font-semibold text-gray-800">Notifications</h3>
                          {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-green-600 hover:text-green-700 font-medium">
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {loadingNotifications ? (
                            <div className="flex justify-center py-6">
                              <div className="spinner" />
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-sm">No notifications yet</div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif._id}
                                className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                                  !notif.isRead ? 'bg-green-50/50' : ''
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {!notif.isRead && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                                  )}
                                  <div className={!notif.isRead ? '' : 'ml-4'}>
                                    <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="px-4 py-2 border-t border-gray-100">
                          <button
                            onClick={() => { navigate(getDashboardPath()); setNotifOpen(false); }}
                            className="text-xs text-green-600 hover:text-green-700 font-medium"
                          >
                            View all in dashboard →
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-green-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-yellow-500 text-xs">⭐</span>
                          <span className="text-xs text-gray-600 font-medium">{user.impactPoints} Impact Points</span>
                        </div>
                      </div>
                      <div className="py-1">
                        <Link
                          to={getDashboardPath()}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </Link>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="md:hidden p-2 rounded-xl hover:bg-green-50 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1 border-t border-green-100 mt-2 animate-slide-up">
            <Link
              to="/donations"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-green-50"
            >
              <UtensilsCrossed className="w-4 h-4" /> Donations
            </Link>
            <Link
              to="/leaderboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-green-50"
            >
              <Trophy className="w-4 h-4" /> Leaderboard
            </Link>
            {user ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-green-50"
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                {user.role === 'donor' && (
                  <>
                    <Link
                      to="/donations/new"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-orange-500 text-white"
                    >
                      <PlusCircle className="w-4 h-4" /> Donate Food
                    </Link>
                    <Link
                      to="/donations/my"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-green-50"
                    >
                      <Package className="w-4 h-4" /> My Donations
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-green-50"
                >
                  <User className="w-4 h-4" /> Profile
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); navigate('/'); }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-green-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium bg-green-600 text-white text-center"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

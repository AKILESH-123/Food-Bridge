import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  CheckCircle2,
  Shield,
  AlertCircle,
  BarChart3,
  UserCheck,
  Moon,
  FileText,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import api, { buildBackendUrl } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  cooked: '#f97316',
  packaged: '#3b82f6',
  raw: '#eab308',
  beverages: '#8b5cf6',
  bakery: '#f59e0b',
  dairy: '#06b6d4',
  other: '#10b981',
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [verificationFilter, setVerificationFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedNGO, setSelectedNGO] = useState(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, queueRes] = await Promise.all([
        api.get('/stats/admin'),
        api.get('/users?limit=20'),
        api.get(`/users/ngos/verification-queue?status=${verificationFilter}`),
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setVerificationQueue(queueRes.data.ngos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [verificationFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerifyNGO = async (ngoId, action, reason = '') => {
    setActionLoading(true);
    try {
      await api.put(`/users/${ngoId}/verify-ngo`, { action, rejectionReason: reason });
      toast.success(`NGO ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'updated'} successfully!`);
      setRejectionModalOpen(false);
      setRejectionReason('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update NGO verification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUser = async (userId, isActive) => {
    if (!window.confirm(`${isActive ? 'Deactivate' : 'Activate'} this user?`)) return;
    try {
      await api.put(`/users/${userId}/toggle-status`);
      toast.success('User status updated');
      fetchData();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleVerifyUser = async (userId) => {
    try {
      await api.put(`/users/${userId}/verify`);
      toast.success('User verified successfully');
      fetchData();
    } catch {
      toast.error('Failed to verify user');
    }
  };

  const totalUsers =
    stats?.usersByRole?.reduce((acc, r) => acc + r.count, 0) || 0;
  const donorCount = stats?.usersByRole?.find((r) => r._id === 'donor')?.count || 0;
  const ngoCount = stats?.usersByRole?.find((r) => r._id === 'ngo')?.count || 0;

  const pieData = [
    { name: 'Donors', value: donorCount, color: '#f97316' },
    { name: 'NGOs', value: ngoCount, color: '#16a34a' },
  ];

  const categoryPieData =
    stats?.byCategory?.map((c) => ({
      name: c._id.charAt(0).toUpperCase() + c._id.slice(1),
      value: c.count,
      color: CATEGORY_COLORS[c._id] || '#10b981',
    })) || [];

  const monthlyChartData =
    stats?.monthly?.map((m) => ({
      name: `${m._id.month}/${m._id.year}`,
      donations: m.count,
      completed: m.completed,
    })) || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-800">Admin Control Center 🛡️</h1>
              <p className="text-gray-500 text-sm mt-0.5">Platform management, NGO verification, & spoilage tracking</p>
            </div>
            {stats?.pendingNGOs > 0 && (
              <button
                onClick={() => setActiveTab('ngo_verification')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md transition-all animate-pulse"
              >
                <AlertCircle className="w-4 h-4" />
                {stats.pendingNGOs} NGO{stats.pendingNGOs > 1 ? 's' : ''} Awaiting Verification
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatsCard title="Total Users" value={totalUsers} icon={Users} color="blue" />
                <StatsCard title="Pending NGOs" value={stats?.pendingNGOs || 0} icon={UserCheck} color="orange" />
                <StatsCard title="Verified NGOs" value={stats?.verifiedNGOs || 0} icon={Shield} color="green" />
                <StatsCard title="Dinner Rescued" value={stats?.dinnerMealsRescued || 0} icon={Moon} color="purple" suffix=" meals" />
                <StatsCard
                  title="Completed"
                  value={stats?.completedDonations || 0}
                  icon={CheckCircle2}
                  color="green"
                />
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'ngo_verification', label: `NGO Verification (${stats?.pendingNGOs || 0})` },
                  { id: 'users', label: 'Users' },
                  { id: 'donations', label: 'Donations' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all ${
                      activeTab === tab.id ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Monthly Chart */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                      Monthly Donations
                    </h3>
                    {monthlyChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthlyChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="donations" name="Total" fill="#bbf7d0" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="completed" name="Completed" fill="#16a34a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
                    )}
                  </div>

                  {/* User breakdown */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-800 mb-4">User Breakdown</h3>
                    {pieData.some((d) => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                            {pieData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No users yet</div>
                    )}
                    <div className="space-y-2 mt-2">
                      {pieData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-gray-600">{d.name}</span>
                          </div>
                          <span className="font-semibold text-gray-800">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category distribution */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-800 mb-4">Donations by Category</h3>
                    <div className="space-y-2">
                      {categoryPieData.map((cat) => {
                        const total = categoryPieData.reduce((a, b) => a + b.value, 0);
                        const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
                        return (
                          <div key={cat.name} className="flex items-center gap-3">
                            <span className="text-xs text-gray-600 w-20 flex-shrink-0">{cat.name}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: cat.color }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 w-12 text-right">{cat.value} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-800 mb-4">Recent Users</h3>
                    <div className="space-y-3">
                      {stats?.recentUsers?.map((u) => (
                        <div key={u._id} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* NGO Verification Management Tab */}
              {activeTab === 'ngo_verification' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">NGO Trust & Verification Queue</h3>
                      <p className="text-gray-500 text-xs mt-1">Review legal documents, registration numbers, and approve verified status.</p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                      {['pending', 'verified', 'rejected', 'all'].map((statusKey) => (
                        <button
                          key={statusKey}
                          onClick={() => setVerificationFilter(statusKey)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                            verificationFilter === statusKey
                              ? 'bg-white text-gray-800 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {statusKey}
                        </button>
                      ))}
                    </div>
                  </div>

                  {verificationQueue.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                      <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-700 font-semibold">No NGOs found in {verificationFilter} queue</p>
                      <p className="text-gray-400 text-xs mt-1">All organizations have been reviewed or filter has 0 entries.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {verificationQueue.map((ngo) => (
                        <div key={ngo.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-800 text-base">{ngo.organizationName || ngo.name}</h4>
                                <span
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    ngo.verificationStatus === 'verified'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : ngo.verificationStatus === 'rejected'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  {ngo.verificationStatus === 'verified' && '🟢 Verified NGO'}
                                  {ngo.verificationStatus === 'pending' && '🟡 Pending Verification'}
                                  {ngo.verificationStatus === 'rejected' && '🔴 Rejected'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Contact: <span className="font-medium text-gray-700">{ngo.contactPerson || ngo.name}</span> · {ngo.phone || 'No phone'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                              {ngo.organizationName?.charAt(0) || ngo.name?.charAt(0)}
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-3.5 space-y-2 text-xs text-gray-600 mb-4">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Reg Number:</span>
                              <span className="font-mono font-medium text-gray-800">{ngo.registrationNumber || 'Not provided'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Email:</span>
                              <span className="text-gray-800">{ngo.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Location / Service Area:</span>
                              <span className="text-gray-800">{ngo.city}, {ngo.state} ({ngo.serviceArea || 'All city'}, {ngo.serviceRadius || 15}km)</span>
                            </div>
                            {ngo.description && (
                              <div className="pt-2 border-t border-gray-200">
                                <span className="text-gray-400 block mb-1">Focus / Mission:</span>
                                <p className="text-gray-700 italic">{ngo.description}</p>
                              </div>
                            )}
                            {ngo.rejectionReason && (
                              <div className="pt-2 border-t border-red-200 text-red-600">
                                <span className="font-semibold block">Rejection Note:</span>
                                {ngo.rejectionReason}
                              </div>
                            )}
                          </div>

                          {/* Documents Preview */}
                          <div className="flex items-center gap-3 mb-5">
                            {ngo.organizationDocument ? (
                              <a
                                href={buildBackendUrl(ngo.organizationDocument)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                View Registration Proof
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No document uploaded</span>
                            )}

                            {ngo.idProof && (
                              <a
                                href={buildBackendUrl(ngo.idProof)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                ID Proof
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                            {ngo.verificationStatus !== 'verified' && (
                              <button
                                onClick={() => handleVerifyNGO(ngo.id, 'approve')}
                                disabled={actionLoading}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                              >
                                <UserCheck className="w-4 h-4" />
                                Approve NGO
                              </button>
                            )}

                            {ngo.verificationStatus !== 'rejected' && (
                              <button
                                onClick={() => {
                                  setSelectedNGO(ngo);
                                  setRejectionModalOpen(true);
                                }}
                                disabled={actionLoading}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-all"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            )}

                            {ngo.verificationStatus === 'rejected' && (
                              <button
                                onClick={() => handleVerifyNGO(ngo.id, 'reverify')}
                                disabled={actionLoading}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-xl transition-all"
                              >
                                Re-verify
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rejection Modal */}
                  {rejectionModalOpen && selectedNGO && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-800 text-base">Reject NGO Verification</h4>
                          <button onClick={() => setRejectionModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                            ✕
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Please specify why <span className="font-bold text-gray-700">{selectedNGO.organizationName || selectedNGO.name}</span> is rejected. This will be visible to the NGO.
                        </p>
                        <textarea
                          rows="3"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="e.g. Illegible registration document, invalid 80G certificate, or mismatched contact information..."
                          className="input-field text-xs resize-none"
                        />
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => setRejectionModalOpen(false)}
                            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleVerifyNGO(selectedNGO.id, 'reject', rejectionReason)}
                            disabled={actionLoading || !rejectionReason.trim()}
                            className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50"
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">All Users ({users.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">City</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Points</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">
                                  {u.name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">{u.name}</p>
                                  <p className="text-xs text-gray-500">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`capitalize text-xs px-2 py-1 rounded-full font-medium ${u.role === 'donor' ? 'bg-orange-100 text-orange-700' : u.role === 'ngo' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{u.city || '—'}</td>
                            <td className="px-6 py-4 font-semibold text-green-700">{u.impactPoints}</td>
                            <td className="px-6 py-4">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {u.isActive ? '✓ Active' : '✗ Inactive'}
                              </span>
                              {u.isVerified && <span className="ml-1 text-xs text-blue-600">🛡️ Verified</span>}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {!u.isVerified && (
                                  <button
                                    onClick={() => handleVerifyUser(u._id)}
                                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                                    title="Verify user"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleToggleUser(u._id, u.isActive)}
                                  className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'bg-red-50 hover:bg-red-100 text-red-500' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}
                                  title={u.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  {u.isActive ? <AlertCircle className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'donations' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Recent Donations</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {stats?.recentDonations?.map((d) => (
                      <div key={d._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{d.title}</p>
                          <p className="text-xs text-gray-500">
                            {d.donor?.organizationName || d.donor?.name} · {d.pickupCity} ·{' '}
                            {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          d.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                          d.status === 'available' ? 'bg-green-100 text-green-700' :
                          d.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

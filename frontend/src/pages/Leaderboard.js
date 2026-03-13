import React, { useState, useEffect } from 'react';
import { Trophy, Award, MapPin, Building2, Star, Package, Heart } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const PODIUM_CONFIG = [
  // index 0 = 2nd place (left)
  { medal: '🥈', barH: 'h-20', barColor: 'from-slate-300 to-slate-400', ring: 'ring-slate-300', label: '2nd', labelColor: 'text-slate-500' },
  // index 1 = 1st place (center)
  { medal: '🥇', barH: 'h-28', barColor: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-400', label: '1st', labelColor: 'text-yellow-600' },
  // index 2 = 3rd place (right)
  { medal: '🥉', barH: 'h-14', barColor: 'from-orange-300 to-orange-400', ring: 'ring-orange-300', label: '3rd', labelColor: 'text-orange-500' },
];

function Avatar({ name, type, size = 'md' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'sm' ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg';
  const bg = type === 'donors' ? 'from-green-400 to-emerald-600' : 'from-blue-400 to-indigo-600';
  return (
    <div className={`${sz} rounded-full flex-shrink-0 flex items-center justify-center text-white font-black bg-gradient-to-br ${bg}`}>
      {name?.[0]?.toUpperCase() || 'U'}
    </div>
  );
}

function PodiumCard({ u, config, type }) {
  const isFirst = config.label === '1st';
  return (
    <div className={`flex flex-col items-center gap-1 ${isFirst ? 'mb-0' : 'mb-0'}`}>
      {/* Crown for 1st */}
      {isFirst && <span className="text-xl mb-0.5">👑</span>}

      {/* Avatar with ring */}
      <div className={`ring-4 ${config.ring} rounded-full shadow-lg`}>
        <Avatar name={u.name} type={type} size={isFirst ? 'lg' : 'md'} />
      </div>

      {/* Name + pts */}
      <p className={`text-xs font-bold text-gray-800 text-center leading-tight mt-1 max-w-[80px] truncate`}>{u.name}</p>
      <p className={`text-xs font-black ${config.labelColor}`}>{(u.impactPoints || 0).toLocaleString()} pts</p>

      {/* Podium bar */}
      <div className={`w-20 ${config.barH} rounded-t-xl bg-gradient-to-t ${config.barColor} flex flex-col items-center justify-center gap-0.5 shadow-md`}>
        <span className="text-xl">{config.medal}</span>
        <span className={`text-xs font-black ${config.labelColor} bg-white/70 px-1.5 rounded-full`}>{config.label}</span>
      </div>
    </div>
  );
}

function TopThree({ users, type }) {
  const [second, first, third] = [users[1], users[0], users[2]];
  const order = [
    { u: second, cfg: PODIUM_CONFIG[0] },
    { u: first,  cfg: PODIUM_CONFIG[1] },
    { u: third,  cfg: PODIUM_CONFIG[2] },
  ];
  return (
    <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <div className="flex items-end justify-center gap-4">
        {order.map(({ u, cfg }, i) =>
          u ? (
            <PodiumCard key={u._id} u={u} config={cfg} type={type} />
          ) : (
            <div key={i} className="w-20" />
          )
        )}
      </div>
    </div>
  );
}

function LeaderCard({ rank, user, type }) {
  const rankStyles = {
    1: { bg: 'bg-yellow-50 border-yellow-200', pts: 'text-yellow-600', badge: '🥇' },
    2: { bg: 'bg-slate-50 border-slate-200', pts: 'text-slate-500', badge: '🥈' },
    3: { bg: 'bg-orange-50 border-orange-200', pts: 'text-orange-500', badge: '🥉' },
  };
  const style = rankStyles[rank];

  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-md ${style ? style.bg : 'bg-white border-gray-100'}`}>
      {/* Rank badge */}
      <div className="w-9 flex-shrink-0 text-center">
        {style ? (
          <span className="text-xl">{style.badge}</span>
        ) : (
          <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-black text-gray-500 mx-auto">
            {rank}
          </span>
        )}
      </div>

      <Avatar name={user.name} type={type} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm truncate">{user.name}</p>
        {user.organizationName && (
          <p className="text-xs text-gray-500 flex items-center gap-1 truncate mt-0.5">
            <Building2 className="w-3 h-3 flex-shrink-0" />{user.organizationName}
          </p>
        )}
        {user.city && (
          <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0" />{user.city}
          </p>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <p className={`text-lg font-black ${style ? style.pts : 'text-gray-700'}`}>
          {(user.impactPoints || 0).toLocaleString()}
        </p>
        <p className="text-xs text-gray-400">points</p>
        <p className="text-xs text-gray-500">
          {type === 'donors' ? `${user.totalDonations || 0} donations` : `${user.totalPickups || 0} pickups`}
        </p>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('donors');
  const [donors, setDonors] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const [dRes, nRes] = await Promise.all([
        api.get('/users/leaderboard?type=donors'),
        api.get('/users/leaderboard?type=ngos'),
      ]);
      setDonors(dRes.data.leaderboard || []);
      setNgos(nRes.data.leaderboard || []);
    } catch (err) {
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const current = tab === 'donors' ? donors : ngos;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {user && <div className="hidden lg:block"><Sidebar /></div>}
      <div className={`flex-1 min-w-0 flex flex-col ${user ? 'lg:ml-64' : ''}`}>
        <div className="lg:hidden"><Navbar /></div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 w-full">

          {/* Hero Header */}
          <div className="bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 rounded-2xl p-6 mb-6 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-8 h-8 text-white drop-shadow" />
              <h1 className="text-3xl font-black text-white drop-shadow">Leaderboard</h1>
            </div>
            <p className="text-amber-100 text-sm">Celebrating the champions fighting food waste</p>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { icon: <Package className="w-4 h-4" />, value: donors.length, label: 'Donors' },
                { icon: <Heart className="w-4 h-4" />, value: ngos.length, label: 'NGOs' },
                { icon: <Star className="w-4 h-4" />, value: [...donors, ...ngos].reduce((s, u) => s + (u.impactPoints || 0), 0).toLocaleString(), label: 'Total Pts' },
              ].map((s) => (
                <div key={s.label} className="bg-white/20 rounded-xl py-2 px-3">
                  <div className="flex justify-center mb-0.5 text-white">{s.icon}</div>
                  <p className="text-white font-black text-base">{s.value}</p>
                  <p className="text-amber-100 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-white border border-gray-200 rounded-2xl p-1 mb-6 shadow-sm">
            {[
              { id: 'donors', label: '🍲 Top Donors' },
              { id: 'ngos', label: '🤝 Top NGOs' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === t.id ? 'bg-green-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : current.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">No entries yet</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to make an impact!</p>
            </div>
          ) : (
            <>
              {/* Podium - only show if 2+ entries */}
              {current.length >= 2 && <TopThree users={current.slice(0, 3)} type={tab} />}

              {/* Full ranked list */}
              <div className="space-y-2.5">
                {current.map((u, i) => (
                  <LeaderCard key={u._id} rank={i + 1} user={u} type={tab} />
                ))}
              </div>
            </>
          )}

          {/* How to earn points */}
          <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 text-center">
            <Award className="w-7 h-7 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-green-800 mb-1.5">How to earn Impact Points?</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {[
                { label: 'Post a donation', pts: '+50' },
                { label: 'Complete a donation', pts: '+20' },
                { label: 'Complete a pickup', pts: '+30' },
              ].map((item) => (
                <span key={item.label} className="text-xs text-green-700">
                  <span className="font-bold text-green-800">{item.pts}</span> {item.label}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

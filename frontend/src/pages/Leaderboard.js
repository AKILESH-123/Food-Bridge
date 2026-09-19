import React, { useState, useEffect } from 'react';
import { Trophy, Award, Star, Package, Heart, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

function ImpactChart({ donorImpactPoints, ngoImpactPoints, totalImpactPoints }) {
  const chartMax = Math.max(donorImpactPoints, ngoImpactPoints, 1);
  const bars = [
    { label: 'Donors', value: donorImpactPoints, color: 'bg-green-500', bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700' },
    { label: 'NGOs', value: ngoImpactPoints, color: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Impact Comparison</h2>
          <p className="text-sm text-gray-500 mt-1">Points earned by group</p>
        </div>
        <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-bold border border-green-100">
          {totalImpactPoints.toLocaleString()} Total pts
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:gap-6">
        {bars.map((bar) => {
          const percent = totalImpactPoints > 0 ? Math.round((bar.value / totalImpactPoints) * 100) : 0;
          const height = Math.max(8, Math.round((bar.value / chartMax) * 100));

          return (
            <div key={bar.label} className={`${bar.bg} rounded-xl border ${bar.border} p-5 flex flex-col items-center justify-end relative overflow-hidden`}>
              <div className="z-10 text-center w-full">
                <span className="text-sm font-semibold text-gray-600 block mb-1">{bar.label}</span>
                <span className={`text-2xl font-black ${bar.text} block mb-6`}>{bar.value.toLocaleString()}</span>
              </div>

              <div className="w-full h-32 flex items-end justify-center bg-white/50 rounded-lg p-2 rounded-b-none border-b-2 border-white">
                <div
                  className={`w-16 sm:w-20 rounded-t-xl shadow-sm transition-all duration-1000 ${bar.color}`}
                  style={{ height: `${height}%` }}
                />
              </div>

              <div className="w-full mt-4 bg-white/60 p-3 rounded-lg z-10">
                <div className="flex justify-between items-center text-xs font-bold text-gray-600 mb-1.5">
                  <span>{percent}% Share</span>
                  <span>{bar.value > 0 ? 'Active' : ''}</span>
                </div>
                <div className="w-full bg-gray-200/80 rounded-full h-2">
                  <div className={`${bar.color} h-2 rounded-full`} style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
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

  const donorImpactPoints = donors.reduce((sum, donor) => sum + (donor.impactPoints || 0), 0);
  const ngoImpactPoints = ngos.reduce((sum, ngo) => sum + (ngo.impactPoints || 0), 0);
  const totalImpactPoints = donorImpactPoints + ngoImpactPoints;
  const topDonor = donors[0];
  const topNgo = ngos[0];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {user && <div className="hidden lg:block"><Sidebar /></div>}
      <div className={`flex-1 min-w-0 flex flex-col ${user ? 'lg:ml-64' : ''}`}>
        <div className="lg:hidden"><Navbar /></div>

        <main className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-green-500" />
                <h1 className="text-2xl font-black text-gray-800">Community Leaderboard</h1>
              </div>
              <p className="text-gray-500 text-sm mt-1.5 font-medium">
                Celebrating the champions fighting food waste with every pickup and donation.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 px-4 py-2 rounded-xl flex items-center gap-3">
              <Award className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-green-700 font-bold uppercase tracking-wider">Total Impact</p>
                <p className="text-lg font-black text-green-800 leading-tight">{totalImpactPoints.toLocaleString()} pts</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard
                  title="Registered Donors"
                  value={donors.length}
                  icon={Package}
                  color="blue"
                />
                <StatsCard
                  title="Active NGOs"
                  value={ngos.length}
                  icon={Heart}
                  color="green"
                />
                <StatsCard
                  title="Top Donor"
                  subtitle={topDonor ? topDonor.name : 'No donors yet'}
                  value={topDonor ? (topDonor.impactPoints || 0) : 0}
                  icon={Star}
                  color="yellow"
                  suffix=" pts"
                />
                <StatsCard
                  title="Top NGO"
                  subtitle={topNgo ? topNgo.name : 'No NGOs yet'}
                  value={topNgo ? (topNgo.impactPoints || 0) : 0}
                  icon={Trophy}
                  color="purple"
                  suffix=" pts"
                />
              </div>

              {/* Impact Chart */}
              <ImpactChart
                donorImpactPoints={donorImpactPoints}
                ngoImpactPoints={ngoImpactPoints}
                totalImpactPoints={totalImpactPoints}
              />

              {/* How to earn points */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-800">How to earn Impact Points?</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: 'Post a donation', pts: '+50', icon: '📝' },
                    { label: 'Complete a donation', pts: '+20', icon: '✅' },
                    { label: 'Complete a pickup', pts: '+30', icon: '🚚' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 flex-1 min-w-[200px]">
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                        <p className="text-xs font-bold text-green-600 mt-0.5">{item.pts} points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}

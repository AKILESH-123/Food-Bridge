import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  ArrowRight,
  UtensilsCrossed,
  Heart,
  Truck,
  Users,
  Star,
  ChevronRight,
  Globe,
  Zap,
  Shield,
  Bell,
} from 'lucide-react';
import api from '../services/api';


const Landing = () => {
  const [stats, setStats] = useState({ totalDonors: 0, totalNGOs: 0, totalMealsSaved: 0, completedDonations: 0 });

  useEffect(() => {
    api
      .get('/stats/public')
      .then((res) => setStats(res.data.stats))
      .catch(() => {
        setStats({ totalDonors: 150, totalNGOs: 42, totalMealsSaved: 12500, completedDonations: 890 });
      });
  }, []);

  const features = [
    {
      icon: Bell,
      title: 'Real-Time Notifications',
      desc: 'NGOs receive instant alerts when donors post food. Never miss a donation opportunity.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Zap,
      title: 'Instant Matching',
      desc: 'Smart system connects donors with nearby NGOs, ensuring food reaches people fast.',
      color: 'from-orange-400 to-orange-500',
    },
    {
      icon: Shield,
      title: 'Verified Organizations',
      desc: 'All donors and NGOs are verified to ensure food safety and trustworthy distribution.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Globe,
      title: 'Impact Tracking',
      desc: 'Track meals saved, CO₂ reduced, and people fed with our detailed impact dashboard.',
      color: 'from-purple-500 to-purple-600',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Register as Donor or NGO',
      desc: 'Create your account as a restaurant, hotel, individual, or NGO/volunteer organization.',
      icon: Users,
      color: 'bg-green-100 text-green-600',
    },
    {
      step: '02',
      title: 'Post or Browse Donations',
      desc: 'Donors post surplus food listings. NGOs browse available donations with smart filters.',
      icon: UtensilsCrossed,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      step: '03',
      title: 'Coordinate Pickup',
      desc: 'NGOs request pickups, donors confirm, and food gets collected within hours.',
      icon: Truck,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      step: '04',
      title: 'Feed People & Track Impact',
      desc: 'Food reaches those in need. Track your contribution and earn impact points.',
      icon: Heart,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Restaurant Owner, Mumbai',
      text: "FoodBridge helped us donate 200+ meals every week. It's incredibly easy and the NGOs are so responsive!",
      rating: 5,
      avatar: 'PS',
    },
    {
      name: 'Mohammed Razak',
      role: 'Director, Helping Hands NGO',
      text: 'We used to struggle finding food sources. Now we receive real-time updates and can feed 500+ people daily.',
      rating: 5,
      avatar: 'MR',
    },
    {
      name: 'Anita Verma',
      role: 'Hotel Manager, Delhi',
      text: 'What was once wasted is now someone\'s meal. FoodBridge made it simple to give back to the community.',
      rating: 5,
      avatar: 'AV',
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shadow-md group-hover:bg-green-700 transition-colors">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-green-700">
              Food<span className="text-orange-500">Bridge</span>
            </span>
          </Link>

          {/* Center Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <a href="#how-it-works" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 transition-all">
              How It Works
            </a>
            <a href="#impact" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 transition-all">
              Our Impact
            </a>
            <Link to="/leaderboard" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 transition-all">
              Leaderboard
            </Link>
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/login" className="hidden sm:block px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 transition-all">
              Login
            </Link>
            <Link to="/register" className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 shadow-sm transition-all">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-bg min-h-[90vh] flex items-center relative overflow-hidden">
        {/* Floating food emojis */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {['🍱', '🥗', '🥘', '🍲', '🥙', '🌽', '🍞', '🥛'].map((emoji, i) => (
            <div
              key={i}
              className="absolute text-4xl opacity-20"
              style={{
                top: `${10 + (i * 12) % 80}%`,
                left: `${5 + (i * 13) % 90}%`,
                animation: `float ${3 + (i % 3)}s ease-in-out ${i * 0.5}s infinite`,
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-2 text-sm font-semibold mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Real-time food donation platform
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-800 leading-tight mb-6">
                Turn Surplus
                <span className="block text-green-600">Food Into</span>
                <span className="block bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                  Hope & Meals
                </span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
                FoodBridge connects restaurants, hotels, and individuals who have surplus food with NGOs and volunteers
                who can distribute it to people in need — instantly.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link to="/register?role=donor" className="btn-primary flex items-center justify-center gap-2 text-base py-3.5 px-8">
                  <UtensilsCrossed className="w-5 h-5" />
                  Donate Food Now
                </Link>
                <Link to="/register?role=ngo" className="btn-outline flex items-center justify-center gap-2 text-base py-3.5 px-8">
                  <Heart className="w-5 h-5" />
                  Join as NGO
                </Link>
              </div>

              <div className="flex items-center gap-6">
                {[
                  { label: 'Free to use', icon: '✅' },
                  { label: 'Verified users', icon: '🛡️' },
                  { label: 'Real-time alerts', icon: '⚡' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span>{item.icon}</span>
                    <span className="text-sm text-gray-600 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right visual */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-96 h-96">
                {/* Main card */}
                <div className="absolute inset-8 bg-white rounded-3xl shadow-2xl border border-green-100 p-6 flex flex-col items-center justify-center gap-4 animate-float">
                  <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Leaf className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-green-700">FoodBridge</div>
                    <div className="text-sm text-gray-500 mt-1">Connecting hearts through food</div>
                  </div>
                  <div className="w-full bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500">Today's Impact</div>
                    <div className="text-lg font-bold text-green-600 mt-0.5">
                      🍽️ {stats.completedDonations > 0 ? stats.completedDonations : '—'} meals delivered
                    </div>
                  </div>
                </div>

                {/* Floating notification cards */}
                <div className="absolute -top-2 -right-4 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 text-xs font-medium text-gray-700 flex items-center gap-2 animate-bounce">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  New donation in Chennai!
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 text-xs font-medium text-gray-700 flex items-center gap-2">
                  <span>✅</span> Pickup confirmed!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section id="impact" className="bg-green-600 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-green-200 text-sm font-semibold uppercase tracking-widest mb-10">
            Our Collective Impact
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-white count-up">
                {stats.totalDonors > 0 ? stats.totalDonors.toLocaleString() : '150+'}
              </div>
              <div className="text-green-200 text-sm mt-1 font-medium">Registered Donors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-white count-up">
                {stats.totalNGOs > 0 ? stats.totalNGOs.toLocaleString() : '42+'}
              </div>
              <div className="text-green-200 text-sm mt-1 font-medium">Active NGOs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-white count-up">
                {stats.completedDonations > 0 ? stats.completedDonations.toLocaleString() : '890+'}
              </div>
              <div className="text-green-200 text-sm mt-1 font-medium">Donations Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-white count-up">
                {stats.totalMealsSaved > 0 ? `${(stats.totalMealsSaved / 1000).toFixed(1)}K+` : '12K+'}
              </div>
              <div className="text-green-200 text-sm mt-1 font-medium">Meals Saved</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">Simple Process</span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-800 mt-2">How FoodBridge Works</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              From surplus food to satisfied bellies in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className={`${step.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="text-gray-300 text-5xl font-black absolute -top-4 -left-2 leading-none">{step.step}</div>
                    <h3 className="font-bold text-gray-800 text-base mb-2">{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <ChevronRight className="hidden md:block absolute top-6 -right-4 w-6 h-6 text-green-300 z-10" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-green-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">Why FoodBridge</span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-800 mt-2">Built for Real Impact</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 card-hover">
                  <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">Testimonials</span>
            <h2 className="text-2xl sm:text-4xl font-black text-gray-800 mt-2">What Our Community Says</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border border-green-100 card-hover">
                <div className="flex mb-3">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            Every Meal Shared
            <br />
            <span className="text-green-200">Changes a Life</span>
          </h2>
          <p className="text-green-100 text-lg mb-10 leading-relaxed">
            Join thousands of donors and NGOs working together to eliminate food waste and fight hunger.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 bg-white text-green-700 font-bold py-4 px-8 rounded-xl hover:bg-green-50 transition-all shadow-lg hover:shadow-xl active:scale-95 text-base"
            >
              Join FoodBridge Today
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/donations"
              className="flex items-center justify-center gap-2 border-2 border-white text-white font-bold py-4 px-8 rounded-xl hover:bg-white/10 transition-all text-base"
            >
              <UtensilsCrossed className="w-5 h-5" />
              Browse Donations
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">
                Food<span className="text-orange-400">Bridge</span>
              </span>
            </div>
            <p className="text-sm text-center">
              © 2026 FoodBridge. Reducing waste, increasing hope. Made with ❤️ for a hunger-free world.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link to="/login" className="hover:text-green-400 transition-colors">Login</Link>
              <Link to="/register" className="hover:text-green-400 transition-colors">Register</Link>
              <Link to="/leaderboard" className="hover:text-green-400 transition-colors">Leaderboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

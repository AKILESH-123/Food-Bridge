import React, { useState, useEffect, useRef } from 'react'; // eslint-disable-line
import {
  User,
  Building2,
  Phone,
  MapPin,
  FileText,
  Camera,
  Save,
  Loader,
  Award,
  Heart,
  Package,
  CheckCircle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api, { buildBackendUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    organizationName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    bio: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      const u = res.data.user;
      setForm({
        name: u.name || '',
        organizationName: u.organizationName || '',
        phone: u.phone || '',
        address: u.address || '',
        city: u.city || '',
        state: u.state || '',
        bio: u.bio || '',
      });
      setStats({
        impactPoints: u.impactPoints || 0,
        totalDonations: u.totalDonations || 0,
        totalPickups: u.totalPickups || 0,
        mealsProvided: u.mealsProvided || 0,
        isVerified: u.isVerified,
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) formData.append(k, v);
      });
      if (profileImage) formData.append('profileImage', profileImage);

      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
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

  const avatarSrc = preview || (user?.profileImage ? buildBackendUrl(user.profileImage) : null);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {user && <div className="hidden lg:block"><Sidebar /></div>}
      <div className={`flex-1 min-w-0 flex flex-col ${user ? 'lg:ml-64' : ''}`}>
        <div className="lg:hidden"><Navbar /></div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-black text-gray-800 mb-6">My Profile</h1>

        {/* Stats strip */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { icon: <Award className="w-5 h-5 text-yellow-500" />, value: stats.impactPoints, label: 'Points' },
              { icon: <Package className="w-5 h-5 text-green-500" />, value: stats.totalDonations, label: 'Donations' },
              { icon: <Heart className="w-5 h-5 text-pink-500" />, value: stats.totalPickups, label: 'Pickups' },
              { icon: <CheckCircle className="w-5 h-5 text-blue-500" />, value: stats.mealsProvided, label: 'Meals Fed' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className="text-lg font-black text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile picture */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-5">Profile Picture</h2>
            <div className="flex items-center gap-5">
              <div className="relative">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-green-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-black border-4 border-green-100">
                    {form.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center shadow hover:bg-green-700 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{form.name || 'Your Name'}</p>
                <p className="text-sm text-gray-400 capitalize">{user?.role}</p>
                {stats?.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mt-1">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Personal Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name <span className="text-red-500">*</span></label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      className="input-field pl-9"
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                </div>
              </div>

              {user?.role !== 'donor' && (
                <div>
                  <label className="label">Organization Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="organizationName"
                      value={form.organizationName}
                      onChange={handleChange}
                      placeholder="Your organization"
                      className="input-field pl-9"
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="label">Bio / About</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    placeholder="Tell us a bit about yourself or your organization..."
                    rows={3}
                    className="input-field pl-9 resize-none"
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              Address
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Street Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="123 Main Street, Near Some Landmark"
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">City</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Chennai"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">State</label>
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="Tamil Nadu"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={saving} className="btn-primary w-full py-3.5 text-base">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" /> Saving...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Save Profile
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  </div>
  );
}

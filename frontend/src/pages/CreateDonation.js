import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  MapPin,
  ChevronLeft,
  Upload,
  X,
  Info,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'cooked', label: '🍲 Cooked Food', desc: 'Prepared meals, curries, rice' },
  { value: 'packaged', label: '📦 Packaged', desc: 'Sealed packets, biscuits, etc.' },
  { value: 'raw', label: '🥦 Raw / Vegetables', desc: 'Fruits, vegetables, grains' },
  { value: 'beverages', label: '☕ Beverages', desc: 'Drinks, juices, tea, coffee' },
  { value: 'bakery', label: '🍞 Bakery', desc: 'Bread, cakes, pastries' },
  { value: 'dairy', label: '🥛 Dairy', desc: 'Milk, cheese, paneer' },
  { value: 'other', label: '🍽️ Other', desc: 'Anything else edible' },
];

const UNITS = ['kg', 'litres', 'servings', 'boxes', 'plates', 'packets', 'pieces'];

const CreateDonation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    quantity: '',
    quantityUnit: 'kg',
    estimatedServings: '',
    expiresAt: '',
    pickupAddress: '',
    pickupCity: '',
    specialInstructions: '',
    allergenInfo: '',
    isVegetarian: false,
    isVegan: false,
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.category) errs.category = 'Category is required';
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0) errs.quantity = 'Valid quantity is required';
    if (!form.expiresAt) errs.expiresAt = 'Expiry time is required';
    if (new Date(form.expiresAt) <= new Date()) errs.expiresAt = 'Expiry must be in the future';
    if (!form.pickupAddress.trim()) errs.pickupAddress = 'Pickup address is required';
    if (!form.pickupCity.trim()) errs.pickupCity = 'Pickup city is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      images.forEach((img) => formData.append('images', img));

      const res = await api.post('/donations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Donation posted successfully! NGOs have been notified. 🎉');
      navigate(`/donations/${res.data.donation._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post donation');
    } finally {
      setLoading(false);
    }
  };

  // Set minimum datetime to now + 30 minutes
  const minDateTime = new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {user && <div className="hidden lg:block"><Sidebar /></div>}
      <div className={`flex-1 min-w-0 flex flex-col ${user ? 'lg:ml-64' : ''}`}>
        <div className="lg:hidden"><Navbar /></div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-600 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-black text-gray-800">Post a Food Donation</h1>
          <p className="text-gray-500 text-sm mt-0.5">Fill in the details below to notify NGOs about your available food</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-green-600" />
              Food Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">
                  Donation Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. 50 plates of biryani from wedding function"
                  className={`input-field ${errors.title ? 'border-red-400' : ''}`}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="label">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the food, its condition, how it was prepared, etc."
                  rows={3}
                  className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="label">
                  Food Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => { setForm((p) => ({ ...p, category: cat.value })); setErrors((p) => ({ ...p, category: '' })); }}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form.category === cat.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg mb-0.5">{cat.label.split(' ')[0]}</div>
                      <div className="text-xs font-semibold text-gray-700">{cat.label.split(' ').slice(1).join(' ')}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{cat.desc}</div>
                    </button>
                  ))}
                </div>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="label">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleChange}
                    placeholder="10"
                    min="1"
                    className={`input-field ${errors.quantity ? 'border-red-400' : ''}`}
                  />
                  {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select name="quantityUnit" value={form.quantityUnit} onChange={handleChange} className="input-field">
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Est. Servings</label>
                  <input
                    type="number"
                    name="estimatedServings"
                    value={form.estimatedServings}
                    onChange={handleChange}
                    placeholder="~50"
                    min="0"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Dietary flags */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isVegetarian"
                    checked={form.isVegetarian}
                    onChange={handleChange}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className="text-sm font-medium text-gray-700">🥦 Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isVegan"
                    checked={form.isVegan}
                    onChange={handleChange}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className="text-sm font-medium text-gray-700">🌱 Vegan</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Allergen Information</label>
                  <input
                    name="allergenInfo"
                    value={form.allergenInfo}
                    onChange={handleChange}
                    placeholder="e.g. Contains nuts, dairy"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Special Instructions</label>
                  <input
                    name="specialInstructions"
                    value={form.specialInstructions}
                    onChange={handleChange}
                    placeholder="e.g. Keep refrigerated"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location & Timing */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              Pickup Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">
                  Pickup Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="pickupAddress"
                  value={form.pickupAddress}
                  onChange={handleChange}
                  placeholder="Full address where food can be picked up"
                  rows={2}
                  className={`input-field resize-none ${errors.pickupAddress ? 'border-red-400' : ''}`}
                />
                {errors.pickupAddress && <p className="text-red-500 text-xs mt-1">{errors.pickupAddress}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="pickupCity"
                    value={form.pickupCity}
                    onChange={handleChange}
                    placeholder="Chennai"
                    className={`input-field ${errors.pickupCity ? 'border-red-400' : ''}`}
                  />
                  {errors.pickupCity && <p className="text-red-500 text-xs mt-1">{errors.pickupCity}</p>}
                </div>

                <div>
                  <label className="label">
                    Best Before / Expires At <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="expiresAt"
                    value={form.expiresAt}
                    onChange={handleChange}
                    min={minDateTime}
                    className={`input-field ${errors.expiresAt ? 'border-red-400' : ''}`}
                  />
                  {errors.expiresAt && <p className="text-red-500 text-xs mt-1">{errors.expiresAt}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              Photos (Optional)
            </h2>

            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imagePreviews.length < 5 && (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all">
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Click to upload photos (max 5, 5MB each)</span>
                <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
              </label>
            )}
          </div>

          {/* Info tip */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Once posted, all registered NGOs in your area will receive an instant notification and can request
              pickup. You'll need to confirm the pickup request before they collect the food.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 text-base py-3.5">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Posting donation...
                </div>
              ) : (
                '🌱 Post Donation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  );
};

export default CreateDonation;

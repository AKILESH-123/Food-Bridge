import React, { useState, useEffect } from 'react';
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
    otherCategoryDetails: '',
    mealType: 'dinner',
    preparedAt: '',
    pickupDeadline: '',
    quantity: '',
    quantityUnit: 'servings',
    estimatedServings: '',
    expiresAt: '',
    pickupAddress: '',
    pickupCity: '',
    specialInstructions: '',
    allergenInfo: '',
    storageMethod: 'covered',
    ingredients: '',
    safeUseHours: '',
    latitude: '',
    longitude: '',
  });
  const [dietType, setDietType] = useState(''); // '' | 'veg' | 'nonveg'
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch donor's current location if permitted
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((p) => ({
            ...p,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
        },
        () => {}
      );
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
    if (files.length > 0 && errors.images) {
      setErrors((prev) => ({ ...prev, images: '' }));
    }
  };

  const removeImage = (idx) => {
    const updatedImages = images.filter((_, i) => i !== idx);
    setImages(updatedImages);
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    if (updatedImages.length === 0) {
      setErrors((prev) => ({ ...prev, images: 'At least one photo of the food is required' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.category) errs.category = 'Category is required';
    if (form.category === 'other' && !form.otherCategoryDetails.trim()) {
      errs.otherCategoryDetails = 'Please specify the type of food';
    }
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0) errs.quantity = 'Valid quantity is required';
    if (!form.expiresAt && !form.pickupDeadline) errs.expiresAt = 'Pickup deadline / safe consumption time is required';
    if (form.expiresAt && new Date(form.expiresAt) <= new Date()) errs.expiresAt = 'Deadline must be in the future';
    if (!form.pickupAddress.trim()) errs.pickupAddress = 'Pickup address is required';
    if (!form.pickupCity.trim()) errs.pickupCity = 'Pickup city is required';
    if (!dietType) errs.dietType = 'Please select Veg or Non-Veg';
    if (!form.storageMethod) errs.storageMethod = 'Please select storage method';
    if (!form.ingredients.trim()) errs.ingredients = 'Ingredients list is required for safety verification';
    if (!form.preparedAt) errs.preparedAt = 'Cooking / preparation time is required';
    if (!images || images.length === 0) errs.images = 'At least one photo of the food is required';
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
      const mergedDescription =
        form.category === 'other' && form.otherCategoryDetails.trim()
          ? `${form.description}\n\nOther category: ${form.otherCategoryDetails.trim()}`
          : form.description;

      const submission = {
        ...form,
        description: mergedDescription,
        pickupDeadline: form.pickupDeadline || form.expiresAt,
        expiresAt: form.expiresAt || form.pickupDeadline,
      };

      Object.entries(submission).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) formData.append(k, v);
      });
      // Backend expects these boolean flags
      formData.append('isVegetarian', dietType === 'veg');
      formData.append('isVegan', false);
      images.forEach((img) => formData.append('images', img));

      const res = await api.post('/donations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(
        form.mealType === 'dinner'
          ? '🌙 Urgent dinner donation posted! Nearby verified NGOs alerted.'
          : 'Donation posted successfully! NGOs have been notified. 🎉'
      );
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

              {/* Meal Type Selection */}
              <div>
                <label className="label">
                  Meal Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'dinner', label: '🌙 Dinner', badge: 'High Urgency', color: 'border-purple-300 hover:border-purple-500 bg-purple-50/40' },
                    { id: 'lunch', label: '☀️ Lunch', badge: 'Afternoon', color: 'border-amber-300 hover:border-amber-500 bg-amber-50/40' },
                    { id: 'breakfast', label: '🍳 Breakfast', badge: 'Morning', color: 'border-yellow-300 hover:border-yellow-500 bg-yellow-50/40' },
                    { id: 'snacks', label: '🥪 Snacks', badge: 'Evening', color: 'border-blue-300 hover:border-blue-500 bg-blue-50/40' },
                    { id: 'other', label: '🍱 Other', badge: 'General', color: 'border-gray-200 hover:border-gray-400 bg-gray-50/40' },
                  ].map((meal) => (
                    <button
                      key={meal.id}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, mealType: meal.id }))}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        form.mealType === meal.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm ring-1 ring-emerald-500'
                          : meal.color
                      }`}
                    >
                      <div className="text-sm font-semibold">{meal.label}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{meal.badge}</div>
                    </button>
                  ))}
                </div>
                {form.mealType === 'dinner' && (
                  <p className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 mt-2 flex items-center gap-1.5">
                    <span>🌙</span>
                    <strong>Dinner Spoilage Alert:</strong> Dinner donations trigger prioritized broadcasts to nearby verified NGOs to ensure prompt rescue before midnight!
                  </p>
                )}
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
                      onClick={() => {
                        setForm((p) => ({
                          ...p,
                          category: cat.value,
                          otherCategoryDetails: cat.value === 'other' ? p.otherCategoryDetails : '',
                        }));
                        setErrors((p) => ({ ...p, category: '', otherCategoryDetails: '' }));
                      }}
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

                {form.category === 'other' && (
                  <div className="mt-3">
                    <label className="label">
                      Specify Other <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="otherCategoryDetails"
                      value={form.otherCategoryDetails}
                      onChange={handleChange}
                      placeholder="e.g. Sweets, biryani, snacks"
                      className={`input-field ${errors.otherCategoryDetails ? 'border-red-400' : ''}`}
                    />
                    {errors.otherCategoryDetails && (
                      <p className="text-red-500 text-xs mt-1">{errors.otherCategoryDetails}</p>
                    )}
                  </div>
                )}
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
                    checked={dietType === 'veg'}
                    onChange={() => { setDietType('veg'); if (errors.dietType) setErrors((p) => ({ ...p, dietType: '' })); }}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className="text-sm font-medium text-gray-700">🥦 Veg</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dietType === 'nonveg'}
                    onChange={() => { setDietType('nonveg'); if (errors.dietType) setErrors((p) => ({ ...p, dietType: '' })); }}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className="text-sm font-medium text-gray-700">🍗 Non-Veg</span>
                </label>
              </div>
              {errors.dietType && <p className="text-red-500 text-xs mt-1">{errors.dietType}</p>}

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

              {/* Food Safety & Storage Details */}
              <div className="pt-3 border-t border-gray-100 space-y-4">
                <div>
                  <label className="label">
                    Storage Method <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { value: 'refrigerated', label: '❄️ Refrigerated', desc: 'Cold chain maintained' },
                      { value: 'covered', label: '🍲 Covered', desc: 'Sealed container at room temp' },
                      { value: 'room_temperature', label: '🌡️ Room Temp', desc: 'Open ambient storage' },
                    ].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => { setForm((p) => ({ ...p, storageMethod: m.value })); if (errors.storageMethod) setErrors((p) => ({ ...p, storageMethod: '' })); }}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          form.storageMethod === m.value
                            ? 'border-blue-500 bg-blue-50/70 font-semibold text-blue-900 ring-1 ring-blue-400'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="text-sm font-semibold">{m.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                  {errors.storageMethod && <p className="text-red-500 text-xs mt-1">{errors.storageMethod}</p>}
                </div>

                <div>
                  <label className="label">
                    Ingredients List <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="ingredients"
                    value={form.ingredients}
                    onChange={handleChange}
                    placeholder="e.g. Basmati rice, chicken, spices, sunflower oil, yogurt"
                    className={`input-field ${errors.ingredients ? 'border-red-400' : ''}`}
                  />
                  {errors.ingredients && <p className="text-red-500 text-xs mt-1">{errors.ingredients}</p>}
                </div>
              </div>

              {/* Dinner / Spoilage Prevention Timers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="label">
                    Cooking Time (Prepared At) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="preparedAt"
                    value={form.preparedAt}
                    onChange={handleChange}
                    className={`input-field ${errors.preparedAt ? 'border-red-400' : ''}`}
                  />
                  {errors.preparedAt && <p className="text-red-500 text-xs mt-1">{errors.preparedAt}</p>}
                </div>
                <div>
                  <label className="label">Expected Safe-Use Time / Pickup Deadline</label>
                  <input
                    type="datetime-local"
                    name="pickupDeadline"
                    value={form.pickupDeadline}
                    onChange={handleChange}
                    min={minDateTime}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-500" />
                Food Photos <span className="text-red-500">*</span>
              </span>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                Compulsory
              </span>
            </h2>

            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imagePreviews.length < 5 && (
              <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                errors.images
                  ? 'border-red-400 bg-red-50/50 hover:bg-red-50'
                  : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
              }`}>
                <Upload className={`w-6 h-6 mb-2 ${errors.images ? 'text-red-400' : 'text-gray-400'}`} />
                <span className={`text-sm ${errors.images ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                  Click to upload food photos (required, max 5, 5MB each)
                </span>
                <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
              </label>
            )}

            {errors.images && (
              <p className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1">
                ⚠️ {errors.images}
              </p>
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

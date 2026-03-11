import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Leaf,
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  UtensilsCrossed,
  Heart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const InputField = ({ name, label, type = 'text', placeholder, icon: Icon, required = false, form, onChange, fieldErrors, loading }) => (
  <div>
    <label className="label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          <Icon className="text-gray-400" style={{ width: '16px', height: '16px', flexShrink: 0 }} />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={onChange}
        placeholder={placeholder}
        disabled={loading}
        style={Icon ? { paddingLeft: '2.25rem' } : undefined}
        className={`input-field ${fieldErrors[name] ? 'border-red-400 focus:ring-red-400' : ''}`}
      />
    </div>
    {fieldErrors[name] && (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {fieldErrors[name]}
      </p>
    )}
  </div>
);

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: searchParams.get('role') || 'donor',
    organizationName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.city.trim()) errs.city = 'City is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { confirmPassword, ...submitData } = form;
      const user = await register(submitData);
      const path =
        user.role === 'donor' ? '/dashboard/donor' : user.role === 'ngo' ? '/dashboard/ngo' : '/dashboard/admin';
      navigate(path, { replace: true });
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs && Array.isArray(errs)) {
        setError(errs.map((e) => e.msg).join(', '));
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      value: 'donor',
      label: 'Food Donor',
      desc: 'Restaurant, hotel, caterer, or individual with surplus food',
      icon: UtensilsCrossed,
      color: 'border-orange-400 bg-orange-50',
      activeColor: 'border-orange-500 bg-orange-50 ring-2 ring-orange-300',
    },
    {
      value: 'ngo',
      label: 'NGO / Volunteer',
      desc: 'Organization or volunteer distributing food to those in need',
      icon: Heart,
      color: 'border-green-400 bg-green-50',
      activeColor: 'border-green-500 bg-green-50 ring-2 ring-green-300',
    },
  ];

  return (
    <div className="min-h-screen hero-bg py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black text-green-700">
              Food<span className="text-orange-500">Bridge</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-6">Create Your Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join thousands making a difference through food</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role selection */}
            <div>
              <label className="label">
                I want to join as <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = form.role === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, role: role.value }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected ? role.activeColor : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? (role.value === 'donor' ? 'text-orange-500' : 'text-green-600') : 'text-gray-400'}`} />
                      <p className={`font-semibold text-sm ${isSelected ? 'text-gray-800' : 'text-gray-600'}`}>
                        {role.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{role.desc}</p>
                      {isSelected && (
                        <CheckCircle className={`w-4 h-4 mt-2 ${role.value === 'donor' ? 'text-orange-500' : 'text-green-600'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField name="name" label="Full Name" placeholder="John Doe" icon={User} required form={form} onChange={handleChange} fieldErrors={fieldErrors} loading={loading} />
              <InputField name="email" label="Email Address" type="email" placeholder="you@example.com" icon={Mail} required form={form} onChange={handleChange} fieldErrors={fieldErrors} loading={loading} />
            </div>

            <InputField
              name="organizationName"
              label={form.role === 'donor' ? 'Organization / Restaurant Name' : 'NGO / Organization Name'}
              placeholder={form.role === 'donor' ? 'e.g. Spice Garden Restaurant' : 'e.g. Helping Hands Foundation'}
              icon={Building2}
              form={form} onChange={handleChange} fieldErrors={fieldErrors} loading={loading}
            />

            <InputField name="phone" label="Phone Number" placeholder="+91 9876543210" icon={Phone} form={form} onChange={handleChange} fieldErrors={fieldErrors} loading={loading} />

            <InputField name="address" label="Address" placeholder="Street address" icon={MapPin} form={form} onChange={handleChange} fieldErrors={fieldErrors} loading={loading} />

            <div className="grid grid-cols-2 gap-4">
              <InputField name="city" label="City" placeholder="Chennai" icon={MapPin} required form={form} onChange={handleChange} fieldErrors={fieldErrors} loading={loading} />
              <InputField name="state" label="State" placeholder="Tamil Nadu" icon={MapPin} form={form} onChange={handleChange} fieldErrors={fieldErrors} loading={loading} />
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="text-gray-400" style={{ width: '16px', height: '16px' }} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    disabled={loading}
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem' }}
                    className={`input-field ${fieldErrors.password ? 'border-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400"
                  >
                    {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
              </div>

              <div>
                <label className="label">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="text-gray-400" style={{ width: '16px', height: '16px' }} />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    disabled={loading}
                    style={{ paddingLeft: '2.25rem' }}
                    className={`input-field ${fieldErrors.confirmPassword ? 'border-red-400' : ''}`}
                  />
                </div>
                {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </div>
              ) : (
                `Join as ${form.role === 'donor' ? 'Food Donor' : 'NGO / Volunteer'}`
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-green-600 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

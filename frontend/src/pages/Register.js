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
import { GoogleLogin } from '@react-oauth/google';
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
  const { register, googleLogin } = useAuth();
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
    pincode: '',
    registrationNumber: '',
    registrationType: 'Trust',
    contactPerson: '',
    serviceArea: '',
    serviceRadius: '15',
    description: '',
  });
  const [documents, setDocuments] = useState({
    organizationDocument: null,
    idProof: null,
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

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setDocuments((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.city.trim()) errs.city = 'City is required';

    if (form.role === 'ngo') {
      if (!form.organizationName.trim()) errs.organizationName = 'NGO / Organization Name is required';
      if (!form.registrationNumber.trim()) errs.registrationNumber = 'NGO Registration Number is required';
      if (!form.registrationType) errs.registrationType = 'Registration Type is required';
      if (!form.state || !form.state.trim()) errs.state = 'State is required for NGO verification';
      if (!form.contactPerson.trim()) errs.contactPerson = 'Primary Contact Person is required';
    }

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
      let submitData;
      if (form.role === 'ngo' && (documents.organizationDocument || documents.idProof)) {
        submitData = new FormData();
        Object.entries(form).forEach(([key, val]) => {
          if (key !== 'confirmPassword') submitData.append(key, val);
        });
        if (documents.organizationDocument) submitData.append('organizationDocument', documents.organizationDocument);
        if (documents.idProof) submitData.append('idProof', documents.idProof);
      } else {
        const { confirmPassword, ...rest } = form;
        submitData = rest;
      }

      const user = await register(submitData);
      const path =
        user.role === 'donor' ? '/dashboard/donor' : user.role === 'ngo' ? '/dashboard/ngo' : '/dashboard/admin';
      navigate(path, { replace: true });
    } catch (err) {
      const errs = err.response?.data?.errors;
      let msg = 'Registration failed. Please try again.';
      if (errs && Array.isArray(errs)) {
        msg = errs.map((e) => e.msg).join(', ');
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
      import('react-hot-toast').then(({ default: toast }) => toast.error(msg));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      const user = await googleLogin(credentialResponse.credential, form.role);
      const path =
        user.role === 'donor' ? '/dashboard/donor' : user.role === 'ngo' ? '/dashboard/ngo' : '/dashboard/admin';
      navigate(path, { replace: true });
    } catch (err) {
      console.error('Google Sign In Error:', err);
      setError(err.response?.data?.message || 'Google registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setError('Google sign-in was unsuccessful. Please try again.');
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

            {/* NGO Specific Verification Fields */}
            {form.role === 'ngo' && (
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  NGO Trust & Verification Details
                </div>
                <p className="text-xs text-emerald-700">
                  To ensure food safety and integrity, all NGOs must be verified by FoodBridge admins before claiming food.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    name="registrationNumber"
                    label="NGO Registration Number"
                    placeholder="e.g. TN12345"
                    required
                    form={form}
                    onChange={handleChange}
                    fieldErrors={fieldErrors}
                    loading={loading}
                  />

                  <div>
                    <label className="label">
                      Registration Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="registrationType"
                      value={form.registrationType}
                      onChange={handleChange}
                      disabled={loading}
                      className="input-field text-xs font-semibold bg-white"
                    >
                      <option value="Trust">Trust</option>
                      <option value="Society">Society</option>
                      <option value="Section 8 Company">Section 8 Company</option>
                      <option value="Other">Other</option>
                    </select>
                    {fieldErrors.registrationType && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.registrationType}</p>
                    )}
                  </div>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 text-xs text-gray-600 space-y-1">
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    💡 Quick Demo Autofill (Sample Mock Registry):
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { reg: 'TN12345', name: 'ABC Foundation', type: 'Trust', state: 'Tamil Nadu' },
                      { reg: 'TN67890', name: 'Helping Hands', type: 'Society', state: 'Tamil Nadu' },
                      { reg: 'TN54321', name: 'Chennai Food Care Foundation', type: 'Section 8 Company', state: 'Tamil Nadu' },
                      { reg: 'TN99999', name: 'Inactive Charity Trust', type: 'Trust', state: 'Tamil Nadu' },
                    ].map((demo) => (
                      <button
                        key={demo.reg}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            organizationName: demo.name,
                            registrationNumber: demo.reg,
                            registrationType: demo.type,
                            state: demo.state,
                            city: demo.reg === 'TN54321' ? 'Chennai' : 'Madurai',
                            contactPerson: 'Director In-Charge',
                          }));
                        }}
                        className="px-2.5 py-1 bg-emerald-100/70 hover:bg-emerald-200 text-emerald-900 rounded-lg font-medium transition-all"
                      >
                        {demo.reg} ({demo.name.split(' ')[0]})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    name="contactPerson"
                    label="Authorized Contact Person"
                    placeholder="e.g. Sarah Jenkins (Director)"
                    required
                    form={form}
                    onChange={handleChange}
                    fieldErrors={fieldErrors}
                    loading={loading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InputField
                    name="pincode"
                    label="Pincode"
                    placeholder="600001"
                    form={form}
                    onChange={handleChange}
                    fieldErrors={fieldErrors}
                    loading={loading}
                  />
                  <InputField
                    name="serviceArea"
                    label="Service Area"
                    placeholder="e.g. Central Chennai"
                    form={form}
                    onChange={handleChange}
                    fieldErrors={fieldErrors}
                    loading={loading}
                  />
                  <div>
                    <label className="label">Service Radius (km)</label>
                    <input
                      type="number"
                      name="serviceRadius"
                      min="1"
                      max="100"
                      value={form.serviceRadius}
                      onChange={handleChange}
                      disabled={loading}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">NGO Description & Focus</label>
                  <textarea
                    name="description"
                    rows="2"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Briefly describe your NGO's mission, orphanages, shelters, or hunger relief programs..."
                    disabled={loading}
                    className="input-field resize-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="label">
                      NGO Reg Proof / 80G / 12A (PDF or Image) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      name="organizationDocument"
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg"
                      disabled={loading}
                      className="text-xs text-gray-600 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                    />
                    {fieldErrors.organizationDocument && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.organizationDocument}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">Authorized Person ID Proof (Optional)</label>
                    <input
                      type="file"
                      name="idProof"
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg"
                      disabled={loading}
                      className="text-xs text-gray-600 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-800 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-medium">Or register with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleFailure}
              useOneTap={false}
              theme="outline"
              size="large"
              width="360"
              text="signup_with"
              shape="pill"
            />
          </div>

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

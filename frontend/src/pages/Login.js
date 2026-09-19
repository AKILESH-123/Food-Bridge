import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, Mail, Lock, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      const user = await googleLogin(credentialResponse.credential);
      const path =
        user.role === 'donor' ? '/dashboard/donor' : user.role === 'ngo' ? '/dashboard/ngo' : '/dashboard/admin';
      navigate(path, { replace: true });
    } catch (err) {
      console.error('Google Sign In Error:', err);
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setError('Google sign-in was unsuccessful. Please try again.');
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await login(form.email, form.password);
      const path =
        user.role === 'donor' ? '/dashboard/donor' : user.role === 'ngo' ? '/dashboard/ngo' : '/dashboard/admin';
      navigate(path, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
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
          <h1 className="text-2xl font-bold text-gray-800 mt-6">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue your food donation journey</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Mail className="text-gray-400" style={{ width: '16px', height: '16px' }} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  style={{ paddingLeft: '2.25rem' }}
                  className="input-field"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Lock className="text-gray-400" style={{ width: '16px', height: '16px' }} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem' }}
                  className="input-field"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-medium">Or continue with</span>
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
              text="continue_with"
              shape="pill"
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-center text-blue-700">
          <p>Register as a Donor or NGO to get started instantly</p>
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

export default Login;

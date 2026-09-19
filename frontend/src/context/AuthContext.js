import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const normalizeUser = (u) => {
  if (!u) return u;
  return { ...u, _id: u._id ?? u.id };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('foodbridge_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await api.get('/auth/me');
      setUser(normalizeUser(res.data.user));
    } catch {
      localStorage.removeItem('foodbridge_token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('foodbridge_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(normalizeUser(userData));
    toast.success(`Welcome back, ${userData.name}! 👋`);
    return userData;
  };

  const register = async (data) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await api.post('/auth/register', data, config);
    const { token, user: userData } = res.data;
    localStorage.setItem('foodbridge_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(normalizeUser(userData));
    toast.success(`Welcome to FoodBridge, ${userData.name}! 🌱`);
    return userData;
  };

  const googleLogin = async (credential, role = 'donor') => {
    const res = await api.post('/auth/google', { credential, role });
    const { token, user: userData } = res.data;
    localStorage.setItem('foodbridge_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(normalizeUser(userData));
    toast.success(`Welcome, ${userData.name}! 👋`);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('foodbridge_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => setUser((prev) => normalizeUser({ ...prev, ...updatedUser }));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, updateUser, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

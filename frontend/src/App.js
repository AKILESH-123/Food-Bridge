import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import NGODashboard from './pages/NGODashboard';
import AdminDashboard from './pages/AdminDashboard';
import Donations from './pages/Donations';
import MyDonations from './pages/MyDonations';
import CreateDonation from './pages/CreateDonation';
import DonationDetail from './pages/DonationDetail';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster
            position="top-center"
            toastOptions={{
              style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px', maxWidth: '90vw' },
              success: { duration: 3000, iconTheme: { primary: '#16a34a', secondary: '#fff' } },
              error: { duration: 4000, iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/leaderboard" element={<Leaderboard />} />

            <Route
              path="/donations"
              element={
                <ProtectedRoute>
                  <Donations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donations/new"
              element={
                <ProtectedRoute roles={['donor', 'admin']}>
                  <CreateDonation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donations/my"
              element={
                <ProtectedRoute roles={['donor', 'admin']}>
                  <MyDonations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donations/:id"
              element={
                <ProtectedRoute>
                  <DonationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/donor"
              element={
                <ProtectedRoute roles={['donor', 'admin']}>
                  <DonorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/ngo"
              element={
                <ProtectedRoute roles={['ngo', 'admin']}>
                  <NGODashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

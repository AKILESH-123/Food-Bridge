import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-green-700 font-semibold text-lg">FoodBridge</p>
            <p className="text-green-500 text-sm">Loading your experience...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const path =
      user.role === 'donor' ? '/dashboard/donor' : user.role === 'ngo' ? '/dashboard/ngo' : '/dashboard/admin';
    return <Navigate to={path} replace />;
  }

  return children;
};

export default ProtectedRoute;

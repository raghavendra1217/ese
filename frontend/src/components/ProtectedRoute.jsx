import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AppContext';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Optionally, show a loading spinner or null while checking auth
    return null;
  }

  if (!user) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    // Logged in but wrong role
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute; 
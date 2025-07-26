import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AppContext';
import { Center, Spinner } from '@chakra-ui/react';

/**
 * This component acts as a guard for your routes.
 *
 * @param {object} props
 * @param {boolean} props.isPrivate - If true, it protects the route from logged-out users.
 *                                   If false, it protects the route from logged-in users.
 */
const RouteGuard = ({ isPrivate }) => {
  const { user, loading } = useAuth();

  // Show a loading spinner while we check the user's status.
  // This prevents the page from flashing before a redirect.
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  // Logic for PRIVATE routes (Dashboards, etc.)
  if (isPrivate) {
    // If it's a private route and there's NO user, redirect to login.
    // Otherwise, show the page.
    return user ? <Outlet /> : <Navigate to="/login" replace />;
  }

  // Logic for PUBLIC routes (Login, Register)
  if (!isPrivate) {
    // If it's a public route and a user IS logged in, redirect them.
    if (user) {
      const dashboardPath =
        user.role === 'admin'
          ? '/admin/dashboard'
          : user.role === 'vendor'
          ? '/vendor/dashboard'
          : '/employee/dashboard';
      return <Navigate to={dashboardPath} replace />;
    }
    // Otherwise, show the public page.
    return <Outlet />;
  }
};

export default RouteGuard;
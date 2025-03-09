import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAuth();

  // If still loading, show loading spinner
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    // Save the location user was trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is required, check user role
  if (requiredRole) {
    // If requiredRole is an array, check if user has any of the roles
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(user.email)) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
    // If requiredRole is a string, check if user has that role
    else if (user.email !== requiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If authenticated and has required role, render children
  return <>{children}</>;
};

export default ProtectedRoute;
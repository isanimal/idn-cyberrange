import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen bg-cyber-900 flex items-center justify-center text-cyber-500">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User is logged in but doesn't have permission
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../provider/AuthProvider';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { token, user, isLoading } = useAuth();
  const location = useLocation();
  
  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // If no token, redirect to login with return URL
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we have a token but no user data yet, we're still initializing
  if (!user) {
    return null;
  }

  // Check if user's role is allowed
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

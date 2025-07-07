import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

interface DecodedToken {
  role: string;
  [key: string]: any; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/auth" />;

  try {
    const { role } = jwtDecode<DecodedToken>(token);
    if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" />;
    return <>{children}</>;
  } catch {
    return <Navigate to="/auth" />;
  }
};

export default ProtectedRoute;

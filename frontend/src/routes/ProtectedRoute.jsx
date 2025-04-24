import React from 'react';
import { Navigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/auth" />;

  try {
    const { role } = jwtDecode(token);
    if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" />;
    return children;
  } catch {
    return <Navigate to="/auth" />;
  }
};

export default ProtectedRoute;

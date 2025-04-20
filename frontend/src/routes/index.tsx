import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ProtectedRoute from './ProtectedRoute';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';

import RootDashboard from '../pages/dashboards/RootDashboard';
import ClerkDashboard from '../pages/dashboards/ClerkDashboard';
// import other dashboards as needed

// Role-based loader – no SidebarLayout here
const DashboardLoader = ({ role }: { role: string }) => {
  switch (role) {
    case 'root':
      return <RootDashboard />; // Already includes SidebarLayout
    case 'subject_clerk':
      return <ClerkDashboard />; // Should include its own SidebarLayout
    // case 'super_user': return <SuperUserDashboard />;
    // case 'technical_officer': return <TechnicalOfficerDashboard />;
    // case 'dc': return <DcDashboard />;
    default:
      return <div className="p-6">Unauthorized role</div>;
  }
};

// Wrapper to extract role from URL
const RoleBasedDashboard = () => {
  const { role } = useParams();
  return <DashboardLoader role={role || ''} />;
};

// Routes definition
export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* Protected route for dashboards */}
      <Route
        path="/dashboard/:role"
        element={
          <ProtectedRoute allowedRoles={['root', 'subject_clerk', 'super_user', 'technical_officer', 'dc']}>
            <RoleBasedDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Login />} />
    </Routes>
  );
};

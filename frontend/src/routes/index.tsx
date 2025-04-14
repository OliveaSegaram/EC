import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ProtectedRoute from './ProtectedRoute';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';

import RootDashboard from '../pages/dashboards/RootDashboard';
import ClerkDashboard from '../pages/dashboards/ClerkDashboard';
//import SuperUserDashboard from '../pages/dashboards/SuperUserDashboard';
//import TechnicalOfficerDashboard from '../pages/dashboards/TechnicalOfficerDashboard';
//import DcDashboard from '../pages/dashboards/DcDashboard';

// Dynamic dashboard loader
const DashboardLoader = ({ role }: { role: string }) => {
  switch (role) {
    case 'root':
      return <RootDashboard />;
    case 'subject_clerk':
      return <ClerkDashboard />;
    /*case 'super_user':
      return <SuperUserDashboard />;
    case 'technical_officer':
      return <TechnicalOfficerDashboard />;
    case 'dc':
      return <DcDashboard />;*/
    default:
      return <div className="p-6"> Unauthorized role</div>;
  }
};

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Dynamic dashboard route based on role param */}
      <Route
        path="/dashboard/:role"
        element={
          <ProtectedRoute allowedRoles={['root', 'subject_clerk', 'super_user', 'technical_officer', 'dc']}>
            <RoleBasedDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Login />} />
    </Routes>
  );
};

// Extract role from URL and load corresponding dashboard
const RoleBasedDashboard = () => {
  const { role } = useParams();
  return <DashboardLoader role={role || ''} />;
};

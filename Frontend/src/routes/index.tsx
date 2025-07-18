
import { Routes, Route, useParams } from 'react-router-dom';
import { useAuth } from '../provider/AuthProvider';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ProtectedRoute from './ProtectedRoute.tsx';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';

import RootDashboard from '../pages/dashboards/RootDashboard';
import ClerkDashboard from '../pages/dashboards/ClerkDashboard';
import DcDashboard from '../pages/dashboards/DcDashboard';
import SuperUserDashboard from '../pages/dashboards/SuperUserDashboard';
import TechnicalOfficerDashboard from '../pages/dashboards/TechnicalOfficerDashboard';

// Role-based loader 
const DashboardLoader = ({ role }: { role: string }) => {
  switch (role) {
    case 'root':
      return <RootDashboard />; 
    case 'subject_clerk':
      return <ClerkDashboard />; 
    case 'dc':
      return <DcDashboard />;
    case 'super_user':
      return <SuperUserDashboard />;
    case 'technical_officer':
      return <TechnicalOfficerDashboard />;
    default:
      return <div className="p-6">Unauthorized role</div>;
  }
};


const RoleBasedDashboard = () => {
  const { user } = useAuth();
  const { role: roleFromUrl } = useParams();
  
  // Debug log to check user role vs URL role
  console.log('RoleBasedDashboard - User role from auth:', user?.role);
  console.log('RoleBasedDashboard - Role from URL:', roleFromUrl);
  
  // Use the role from auth context instead of URL to prevent role spoofing
  return <DashboardLoader role={user?.role || ''} />;
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

     
      <Route path="*" element={<Login />} />
    </Routes>
  );
};

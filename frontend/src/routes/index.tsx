
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
//import Dashboard from '../pages/dashboards'; 
import ProtectedRoute from './ProtectedRoute';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route
        path="/dashboard/:role"
        element={
          <ProtectedRoute allowedRoles={['root', 'subject_clerk', 'super_user', 'technical_officer', 'dc']}>
            //navigate to dashboard
            <div>Dashboard Placeholder</div> 
          </ProtectedRoute>
        }
      />

      
      <Route path="*" element={<Login />} />
    </Routes>
  );
};

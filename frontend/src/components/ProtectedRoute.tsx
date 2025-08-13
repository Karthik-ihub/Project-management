import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  userType: 'manager' | 'developer';
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ userType, children }) => {
  const token = localStorage.getItem('token');
  const storedUserType = localStorage.getItem('user_type');

  // Check if user is authenticated and has the correct user type
  const isAuthenticated = token && storedUserType === userType;

  if (!isAuthenticated) {
    // Redirect to the appropriate login page based on userType
    return <Navigate to={`/${userType}/login`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
// src/components/ProtectedRoute.jsx
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    // Not logged in -> redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRole === 'organizer' && !user.isOrganizer) {
    // Logged in user is not an organizer -> send to student home
    return <Navigate to="/" replace />;
  }

  if (allowedRole === 'student' && !user.isStudent) {
    // Logged in user is not a student -> send to organizer panel
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
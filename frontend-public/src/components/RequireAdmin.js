import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUser } from '../utils/auth';

function RequireAdmin({ children }) {
  const user = getUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'ADMIN') {
    return <Navigate to="/main" replace />;
  }
  return children;
}

export default RequireAdmin;

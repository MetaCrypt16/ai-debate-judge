import React from 'react';
import './index.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard';
import NewDebate from './pages/NewDebate';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DebateDetails from './pages/DebateDetails';
import { auth } from './api/api';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = auth.getToken();
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          {/* Public Routes */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Signup />} />

          {/* Protected Routes */}
          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="new-debate" element={
            <ProtectedRoute>
              <NewDebate />
            </ProtectedRoute>
          } />
          <Route path="debates/:id" element={
            <ProtectedRoute>
              <DebateDetails />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

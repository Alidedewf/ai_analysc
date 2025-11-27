import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import { AuthPage } from './pages/AuthPage/AuthPage';

import { DashboardPage } from './pages/DashboardPage/DashboardPage';

import { CustomCursor } from './components/CustomCursor/CustomCursor';
import { BackgroundAnimation } from './components/BackgroundAnimation/BackgroundAnimation';

const App = () => {
  return (
    <AuthProvider>
      <CustomCursor />
      <BackgroundAnimation />
      <Router>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/app" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

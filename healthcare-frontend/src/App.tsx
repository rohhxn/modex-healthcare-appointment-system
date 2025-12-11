import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import PatientDashboard from './pages/PatientDashboard';
import DoctorListPage from './pages/DoctorListPage';
import BookingPage from './pages/BookingPage';
import AppointmentHistoryPage from './pages/AppointmentHistoryPage';
import './styles/App.css';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {userRole === 'admin' && (
        <>
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </>
      )}
      {userRole === 'patient' && (
        <>
          <Route path="/" element={<PatientDashboard />} />
          <Route path="/doctors" element={<DoctorListPage />} />
          {/* allow an optional slotId so callers can navigate to /booking/:doctorId */}
          <Route path="/booking/:doctorId/:slotId?" element={<BookingPage />} />
          <Route path="/appointments" element={<AppointmentHistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

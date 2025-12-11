import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userRole, setUserRole] = useState<'admin' | 'patient'>('patient');
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId.trim() || !userEmail.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // Simple validation
    if (!userEmail.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    // Login successful
    login(userRole, userId, userEmail);
    navigate(userRole === 'admin' ? '/admin' : '/');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Healthcare Appointment System</h1>
        <p className="subtitle">Book appointments with healthcare professionals</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="role">I am a:</label>
            <select
              id="role"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as 'admin' | 'patient')}
              className="form-control"
            >
              <option value="patient">Patient</option>
              <option value="admin">Doctor/Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="userId">User ID:</label>
            <input
              id="userId"
              type="text"
              placeholder="Enter your ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="form-control"
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block">
            Login
          </button>
        </form>

        <div className="register-section">
          <p>Don't have an account?</p>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="btn btn-outline btn-block"
          >
            Create Account
          </button>
        </div>

        <div className="demo-info">
          <h3>Demo Credentials:</h3>
          <p><strong>Patient:</strong> ID: pat001, Email: patient@example.com</p>
          <p><strong>Doctor:</strong> ID: doc001, Email: doctor@clinic.com</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

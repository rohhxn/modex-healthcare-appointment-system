import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiService';
import '../styles/LoginPage.css';

type UserRole = 'patient' | 'admin';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('patient');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // NOTE: The current backend doesn't implement real password-based auth.
  // We still collect a password to match user expectations and allow a future
  // auth endpoint without changing UX.
  async function resolveUserId(role: UserRole, email: string): Promise<string> {
    if (role === 'patient') {
      const res = await apiClient.get('/patients/by-email/' + encodeURIComponent(email));
      const id = (res.data as any)?.data?.id || (res.data as any)?.data?._id;
      if (!id) throw new Error('Patient not found');
      return id;
    }

    // role === 'admin' (doctor)
    // There is no doctors/by-email endpoint, so we fetch and match locally.
    const res = await apiClient.get('/doctors', { params: { limit: 100, offset: 0 } });
    const doctors = ((res.data as any)?.data || []) as Array<any>;
    const match = doctors.find((d) => (d.email || '').toLowerCase() === email.toLowerCase());
    if (!match) throw new Error('Doctor not found');
    return match.id || match._id;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userEmail.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    if (!userEmail.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);

    try {
      const id = await resolveUserId(userRole, userEmail.trim());
      login(userRole, id, userEmail.trim());
      navigate(userRole === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
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
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="form-control"
            >
              <option value="patient">Patient</option>
              <option value="admin">Doctor/Admin</option>
            </select>
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

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
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
          <p>Use the email you registered with.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

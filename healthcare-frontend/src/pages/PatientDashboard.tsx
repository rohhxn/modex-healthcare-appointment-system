import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/PatientDashboard.css';

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, userEmail } = useAuth();

  return (
    <div className="patient-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Healthcare Appointment Booking</h1>
        </div>
        <div className="header-actions">
          <span className="user-email">{userEmail}</span>
          <button onClick={() => navigate('/doctors')} className="btn btn-secondary">
            Browse Doctors
          </button>
          <button onClick={() => navigate('/appointments')} className="btn btn-secondary">
            My Appointments
          </button>
          <button onClick={logout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome, Patient!</h2>
          <p>Book an appointment with a healthcare professional or manage your existing appointments.</p>
        </div>

        <div className="action-cards">
          <div className="action-card">
            <div className="card-icon">🏥</div>
            <h3>Browse Doctors</h3>
            <p>Search and find healthcare professionals by specialization</p>
            <button
              onClick={() => navigate('/doctors')}
              className="btn btn-primary"
            >
              Browse Doctors
            </button>
          </div>

          <div className="action-card">
            <div className="card-icon">📅</div>
            <h3>My Appointments</h3>
            <p>View and manage your upcoming and past appointments</p>
            <button
              onClick={() => navigate('/appointments')}
              className="btn btn-primary"
            >
              View Appointments
            </button>
          </div>

          <div className="action-card">
            <div className="card-icon">⚕️</div>
            <h3>Health Information</h3>
            <p>Manage your medical history and health records</p>
            <button className="btn btn-primary" disabled>
              Coming Soon
            </button>
          </div>
        </div>

        <div className="info-section">
          <h3>How to Book an Appointment</h3>
          <ol>
            <li>Click on "Browse Doctors" to see available healthcare professionals</li>
            <li>Select a doctor and view their available time slots</li>
            <li>Choose a convenient time and click "Book"</li>
            <li>Confirm your appointment (you have 5 minutes)</li>
            <li>Receive confirmation and appointment details via email</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;

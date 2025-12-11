import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/apiService';
import { Appointment } from '../types';
import '../styles/AppointmentHistoryPage.css';

const AppointmentHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, [userId]);

  useEffect(() => {
    let filtered = appointments;
    if (statusFilter) {
      filtered = appointments.filter((apt) => apt.status === statusFilter);
    }
    setFilteredAppointments(filtered);
  }, [appointments, statusFilter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userId) {
        setError('User ID is missing');
        return;
      }

      const data = await appointmentService.getPatientAppointments(userId);
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (appointmentId: string) => {
    try {
      setError(null);
      await appointmentService.confirmAppointment(appointmentId);
      alert('Appointment confirmed! ✅');
      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm appointment');
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setCancellingId(appointmentId);
      setError(null);
      await appointmentService.cancelAppointment(
        appointmentId,
        'Patient cancelled appointment'
      );
      alert('Appointment cancelled');
      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClass = {
      PENDING: 'badge-pending',
      CONFIRMED: 'badge-confirmed',
      CANCELLED: 'badge-cancelled',
      COMPLETED: 'badge-completed',
    }[status] || 'badge-default';

    return <span className={`badge ${statusClass}`}>{status}</span>;
  };

  return (
    <div className="appointment-history-page">
      <header className="page-header">
        <div className="header-nav">
          <button onClick={() => navigate('/')} className="btn-back">
            ← Home
          </button>
          <h1>My Appointments</h1>
          <button onClick={() => navigate('/doctors')} className="btn btn-secondary">
            Browse Doctors
          </button>
        </div>
      </header>

      <div className="filters-section">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Appointments</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="appointments-container">
        {loading && <p className="loading">Loading appointments...</p>}
        {error && <div className="alert alert-error">{error}</div>}
        {filteredAppointments.length === 0 && !loading && (
          <p className="no-data">No appointments found.</p>
        )}

        {filteredAppointments.map((appointment) => (
          <div key={appointment.id} className="appointment-card">
            <div className="appointment-main">
              <div className="appointment-header">
                <h3>{appointment.doctor_name}</h3>
                {getStatusBadge(appointment.status)}
              </div>

              <p className="specialization">
                {appointment.doctor_specialization} • {appointment.clinic_name}
              </p>

              <div className="appointment-details">
                <p>
                  <strong>Date:</strong> {appointment.appointment_date}
                </p>
                <p>
                  <strong>Time:</strong> {appointment.appointment_time}
                </p>
                <p>
                  <strong>Reason:</strong> {appointment.reason_for_visit}
                </p>
                <p>
                  <strong>Type:</strong> {appointment.consultation_type}
                </p>
              </div>

              {appointment.status === 'PENDING' && appointment.expires_at && (
                <div className="alert alert-warning">
                  ⏰ Expires at: {new Date(appointment.expires_at).toLocaleString()}
                </div>
              )}
            </div>

            <div className="appointment-actions">
              {appointment.status === 'PENDING' && (
                <button
                  onClick={() => handleConfirm(appointment.id)}
                  className="btn btn-primary"
                >
                  Confirm
                </button>
              )}
              {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                <button
                  onClick={() => handleCancel(appointment.id)}
                  disabled={cancellingId === appointment.id}
                  className="btn btn-danger"
                >
                  {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentHistoryPage;

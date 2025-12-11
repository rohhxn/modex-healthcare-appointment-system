import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorService, timeSlotService } from '../services/apiService';
import { Doctor, TimeSlot } from '../types';
import '../styles/AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { logout, userEmail } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDoctorForSlots, setSelectedDoctorForSlots] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [slotFormData, setSlotFormData] = useState({
    slot_date: '',
    slot_time: '',
    duration_minutes: 30,
    max_capacity: 1,
  });
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    email: '',
    phone: '',
    license_number: '',
    clinic_name: '',
    address: '',
    bio: '',
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorService.getDoctors();
      setDoctors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await doctorService.createDoctor(formData as any);
      setFormData({
        name: '',
        specialization: '',
        email: '',
        phone: '',
        license_number: '',
        clinic_name: '',
        address: '',
        bio: '',
      });
      setShowForm(false);
      await loadDoctors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSlots = async (doctorId: string) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedDoctorForSlots(doctorId);
      const slotsData = await doctorService.getAvailableSlots(doctorId);
      setSlots(slotsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorForSlots) {
      setError('No doctor selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Create a time slot for the selected doctor
      await timeSlotService.createTimeSlot(selectedDoctorForSlots, {
        doctor_id: selectedDoctorForSlots,
        slot_date: slotFormData.slot_date,
        slot_time: slotFormData.slot_time,
        duration_minutes: slotFormData.duration_minutes,
        max_capacity: slotFormData.max_capacity,
      } as any);

      // Reload slots
      await handleOpenSlots(selectedDoctorForSlots);
      
      setSlotFormData({
        slot_date: '',
        slot_time: '',
        duration_minutes: 30,
        max_capacity: 1,
      });
      setShowSlotForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create slot');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSlotFormData((prev) => ({
      ...prev,
      [name]: name === 'duration_minutes' || name === 'max_capacity' ? parseInt(value) : value,
    }));
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Doctor Management Dashboard</h1>
        <div className="header-actions">
          <span className="user-email">{userEmail}</span>
          <button onClick={logout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </header>

      <div className="admin-content">
        <div className="toolbar">
          <h2>Doctors</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add Doctor'}
          </button>
        </div>

        {showForm && (
          <div className="form-card">
            <h3>Create New Doctor Profile</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Dr. John Doe"
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="specialization">Specialization *</label>
                  <input
                    id="specialization"
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="Cardiology"
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="doctor@clinic.com"
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="license_number">License Number *</label>
                  <input
                    id="license_number"
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    placeholder="MD12345"
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="clinic_name">Clinic Name</label>
                  <input
                    id="clinic_name"
                    type="text"
                    name="clinic_name"
                    value={formData.clinic_name}
                    onChange={handleInputChange}
                    placeholder="City Heart Clinic"
                    className="form-control"
                  />
                </div>

                <div className="form-group form-group-full">
                  <label htmlFor="address">Address</label>
                  <input
                    id="address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Medical Plaza, City"
                    className="form-control"
                  />
                </div>

                <div className="form-group form-group-full">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="20 years of experience..."
                    className="form-control"
                    rows={3}
                  />
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-block"
              >
                {loading ? 'Creating...' : 'Create Doctor'}
              </button>
            </form>
          </div>
        )}

        <div className="doctors-list">
          {loading && !showForm && !selectedDoctorForSlots && <p className="loading">Loading doctors...</p>}
          {error && <div className="alert alert-error">{error}</div>}
          {doctors.length === 0 && !loading && !selectedDoctorForSlots && (
            <p className="no-data">No doctors registered yet.</p>
          )}
          
          {selectedDoctorForSlots && (
            <div className="slots-management">
              <div className="slots-header">
                <button 
                  onClick={() => {
                    setSelectedDoctorForSlots(null);
                    setSlots([]);
                    setShowSlotForm(false);
                  }}
                  className="btn btn-secondary"
                >
                  ← Back to Doctors
                </button>
                <h3>Manage Time Slots for {doctors.find(d => d.id === selectedDoctorForSlots)?.name}</h3>
                <button
                  onClick={() => setShowSlotForm(!showSlotForm)}
                  className="btn btn-primary"
                >
                  {showSlotForm ? 'Cancel' : '+ Add Slot'}
                </button>
              </div>

              {showSlotForm && (
                <div className="slot-form-card">
                  <h4>Create New Time Slot</h4>
                  <form onSubmit={handleCreateSlot}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="slot_date">Date *</label>
                        <input
                          id="slot_date"
                          type="date"
                          name="slot_date"
                          value={slotFormData.slot_date}
                          onChange={handleSlotInputChange}
                          required
                          className="form-control"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="slot_time">Time *</label>
                        <input
                          id="slot_time"
                          type="time"
                          name="slot_time"
                          value={slotFormData.slot_time}
                          onChange={handleSlotInputChange}
                          required
                          className="form-control"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="duration_minutes">Duration (minutes)</label>
                        <input
                          id="duration_minutes"
                          type="number"
                          name="duration_minutes"
                          value={slotFormData.duration_minutes}
                          onChange={handleSlotInputChange}
                          min="15"
                          max="120"
                          step="15"
                          className="form-control"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="max_capacity">Max Patients</label>
                        <input
                          id="max_capacity"
                          type="number"
                          name="max_capacity"
                          value={slotFormData.max_capacity}
                          onChange={handleSlotInputChange}
                          min="1"
                          max="10"
                          className="form-control"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary btn-block"
                    >
                      {loading ? 'Creating...' : 'Create Slot'}
                    </button>
                  </form>
                </div>
              )}

              <div className="slots-list">
                {loading && <p className="loading">Loading slots...</p>}
                {slots.length === 0 && !loading && (
                  <p className="no-data">No time slots yet. Add one to get started!</p>
                )}
                {slots.map((slot) => (
                  <div key={slot.id} className="slot-card">
                    <div className="slot-info">
                      <strong>{slot.slot_date} at {slot.slot_time}</strong>
                      <p>Duration: {slot.duration_minutes} mins | Capacity: {slot.current_bookings}/{slot.max_capacity}</p>
                      <p>Status: <span className={`status-${slot.status?.toLowerCase()}`}>{slot.status}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!selectedDoctorForSlots && doctors.map((doctor) => (
            <div key={doctor.id} className="doctor-card">
              <div className="doctor-header">
                <h3>{doctor.name}</h3>
                <span className="specialization">{doctor.specialization}</span>
              </div>
              <p className="clinic">{doctor.clinic_name}</p>
              <p className="contact">📧 {doctor.email}</p>
              <p className="contact">📱 {doctor.phone}</p>
              <p className="address">📍 {doctor.address}</p>
              <p className="bio">{doctor.bio}</p>
              <div className="doctor-footer">
                <button 
                  onClick={() => handleOpenSlots(doctor.id)}
                  className="btn btn-secondary"
                >
                  Manage Slots
                </button>
                <button className="btn btn-secondary">View Appointments</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

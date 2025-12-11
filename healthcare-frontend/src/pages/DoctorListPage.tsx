import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorService } from '../services/apiService';
import { Doctor } from '../types';
import '../styles/DoctorListPage.css';

const DoctorListPage: React.FC = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    const filtered = doctors.filter((doctor) =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.clinic_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDoctors(filtered);
  }, [searchTerm, doctors]);

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

  return (
    <div className="doctor-list-page">
      <header className="page-header">
        <div className="header-nav">
          <button onClick={() => navigate('/')} className="btn-back">
            ← Home
          </button>
          <h1>Find a Doctor</h1>
          <button onClick={() => navigate('/appointments')} className="btn btn-secondary">
            My Appointments
          </button>
        </div>
        <p>Search and book appointments with healthcare professionals</p>
      </header>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search by name, specialization, or clinic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="doctors-grid">
        {loading && <p className="loading">Loading doctors...</p>}
        {error && <div className="alert alert-error">{error}</div>}
        {filteredDoctors.length === 0 && !loading && (
          <p className="no-data">No doctors found matching your search.</p>
        )}
        {filteredDoctors.map((doctor) => (
          <div key={doctor.id} className="doctor-list-item">
            <div className="doctor-info">
              <h3>{doctor.name}</h3>
              <p className="specialization">🏥 {doctor.specialization}</p>
              <p className="clinic">{doctor.clinic_name}</p>
              <p className="address">📍 {doctor.address}</p>
              <p className="bio">{doctor.bio}</p>
              <p className="contact">📧 {doctor.email} | 📱 {doctor.phone}</p>
            </div>
            <div className="doctor-actions">
              <button
                onClick={() => navigate(`/booking/${doctor.id}`)}
                className="btn btn-primary"
              >
                View Slots & Book
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorListPage;

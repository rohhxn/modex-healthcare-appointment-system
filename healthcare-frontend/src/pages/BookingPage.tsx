import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorService, timeSlotService, appointmentService, patientService } from '../services/apiService';
import { Doctor, TimeSlot, Patient } from '../types';
import '../styles/BookingPage.css';

const isTruthyId = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value !== 'undefined' && value !== 'null';

const BookingPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<'select-slot' | 'confirm'>('select-slot');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadData();
  }, [doctorId, userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isTruthyId(doctorId)) {
        setDoctor(null);
        setSlots([]);
        setSelectedSlot(null);
        setBookingStep('select-slot');
        setError('Invalid doctor link. Please go back and select a doctor again.');
        return;
      }

      // Load doctor info
      const doctorData = await doctorService.getDoctorById(doctorId);
      setDoctor(doctorData);

      // Load available slots
      const slotsData = await doctorService.getAvailableSlots(doctorId);
      setSlots(slotsData);

      // Load patient info (if exists in database)
      // Note: Patient might be a demo user with non-UUID ID, so we skip loading
      // The booking endpoint will handle lookups by email as fallback
      setPatient(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setBookingStep('confirm');
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !doctor || !reasonForVisit.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    // This app uses a lightweight "login" that stores a userId in local storage.
    // Make sure we never call the API with an undefined/invalid patient_id.
    if (!isTruthyId(userId)) {
      setError('Please log in again before booking an appointment.');
      return;
    }

    try {
      setConfirming(true);
      setError(null);

      console.log('Booking appointment with:', {
        patient_id: userId,
        doctor_id: doctor.id,
        time_slot_id: selectedSlot.id,
      });

      const appointment = await appointmentService.bookAppointment({
        patient_id: userId,
        patient_email: patient?.email,
        doctor_id: doctor.id,
        time_slot_id: selectedSlot.id,
        appointment_date: selectedSlot.slot_date,
        appointment_time: selectedSlot.slot_time,
        reason_for_visit: reasonForVisit,
        consultation_type: 'in-person',
      });

      // Show confirmation modal with 5-minute countdown
      alert(`
        Appointment Booked! ✅
        
        Appointment ID: ${appointment.id}
        Doctor: ${doctor.name}
        Date: ${selectedSlot.slot_date}
        Time: ${selectedSlot.slot_time}
        
        Status: PENDING
        ⏰ You have 5 minutes to confirm this appointment.
        
        Please proceed to confirm the appointment.
      `);

      // Redirect to appointments page
      navigate('/appointments');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to book appointment';
      setError(errorMessage);
      console.error('Booking error:', err);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return <div className="booking-page"><p>Loading...</p></div>;
  }

  if (error && !doctor) {
    return (
      <div className="booking-page">
        <div className="alert alert-error">{error}</div>
        <button onClick={() => navigate('/doctors')} className="btn btn-primary">
          Back to Doctors
        </button>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <header className="page-header">
        <div className="header-nav">
          <button onClick={() => navigate('/doctors')} className="btn-back">
            ← Back to Doctors
          </button>
          <h1>Book Appointment</h1>
          <button onClick={() => navigate('/appointments')} className="btn btn-secondary">
            My Appointments
          </button>
        </div>
      </header>

      {doctor && (
        <div className="booking-container">
          <div className="doctor-summary">
            <h2>{doctor.name}</h2>
            <p className="specialization">{doctor.specialization}</p>
            <p className="clinic">{doctor.clinic_name}</p>
          </div>

          {bookingStep === 'select-slot' && (
            <div className="slots-section">
              <h3>Select Available Time Slot</h3>
              {error && <div className="alert alert-error">{error}</div>}
              {slots.length === 0 ? (
                <p className="no-data">No available slots at the moment.</p>
              ) : (
                <div className="slots-grid">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotSelect(slot)}
                      disabled={slot.current_bookings >= slot.max_capacity}
                      className={`slot-card ${
                        slot.current_bookings >= slot.max_capacity ? 'disabled' : ''
                      }`}
                    >
                      <div className="slot-date">{slot.slot_date}</div>
                      <div className="slot-time">{slot.slot_time}</div>
                      <div className="slot-duration">{slot.duration_minutes} mins</div>
                      <div className="slot-status">
                        {slot.current_bookings >= slot.max_capacity ? 'Full' : 'Available'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {bookingStep === 'confirm' && selectedSlot && (
            <div className="confirmation-section">
              <h3>Confirm Appointment</h3>
              <div className="confirmation-details">
                <p><strong>Date:</strong> {selectedSlot.slot_date}</p>
                <p><strong>Time:</strong> {selectedSlot.slot_time}</p>
                <p><strong>Duration:</strong> {selectedSlot.duration_minutes} minutes</p>
              </div>

              <div className="form-group">
                <label htmlFor="reason">Reason for Visit *</label>
                <textarea
                  id="reason"
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  placeholder="Describe your symptoms or reason for visit"
                  className="form-control"
                  rows={4}
                />
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="button-group">
                <button
                  onClick={() => {
                    setBookingStep('select-slot');
                    setSelectedSlot(null);
                    setReasonForVisit('');
                  }}
                  className="btn btn-outline"
                >
                  Change Slot
                </button>
                <button
                  onClick={handleBookAppointment}
                  disabled={confirming || !reasonForVisit.trim()}
                  className="btn btn-primary"
                >
                  {confirming ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>

              <div className="alert alert-info">
                ⏰ After booking, you have 5 minutes to complete payment and confirm.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingPage;

// Types for Healthcare Appointment System

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  clinic_name: string;
  address: string;
  bio: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  medical_history?: string;
  allergies?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  id: string;
  doctor_id: string;
  slot_date: string;
  slot_time: string;
  duration_minutes: number;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  max_capacity: number;
  current_bookings: number;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  time_slot_id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  reason_for_visit?: string;
  notes?: string;
  payment_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  consultation_type: 'in-person' | 'telemedicine';
  confirmed_at?: string;
  expires_at: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  doctor_name?: string;
  doctor_specialization?: string;
  clinic_name?: string;
  patient_name?: string;
  patient_email?: string;
  slot_time?: string;
}

export interface AuthContext {
  userRole: 'admin' | 'patient' | null;
  userId: string | null;
  userEmail: string | null;
  login: (role: 'admin' | 'patient', userId: string, email: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    limit: number;
    offset: number;
  };
}

export interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  code?: string;
}

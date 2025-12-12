import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse, Doctor, Patient, TimeSlot, Appointment } from '../types';

// Default to same-origin /api so frontend+backend can be connected via Vercel rewrites/proxy.
// If you deploy backend on a different host, set REACT_APP_API_URL to that host's /api.
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message = (error.response?.data as any)?.message || error.message;
    console.error('API Error:', message);
    throw new Error(message);
  }
);

// Doctor Service
export const doctorService = {
  async createDoctor(doctorData: Omit<Doctor, 'id' | 'created_at' | 'updated_at' | 'is_active'>) {
    const response = await apiClient.post<ApiResponse<Doctor>>('/doctors', doctorData);
    return response.data.data;
  },

  async getDoctors(limit: number = 20, offset: number = 0) {
    const response = await apiClient.get<ApiResponse<Doctor[]>>('/doctors', {
      params: { limit, offset },
    });
    return response.data.data;
  },

  async getDoctorById(id: string) {
    const response = await apiClient.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    return response.data.data;
  },

  async searchBySpecialization(specialization: string) {
    const response = await apiClient.get<ApiResponse<Doctor[]>>(
      `/doctors/specialization/${specialization}`
    );
    return response.data.data;
  },

  async updateDoctor(id: string, updates: Partial<Doctor>) {
    const response = await apiClient.put<ApiResponse<Doctor>>(`/doctors/${id}`, updates);
    return response.data.data;
  },

  async getAvailableSlots(doctorId: string, fromDate?: string, toDate?: string) {
    const response = await apiClient.get<ApiResponse<TimeSlot[]>>(
      `/doctors/${doctorId}/available-slots`,
      {
        params: { from_date: fromDate, to_date: toDate },
      }
    );
    return response.data.data;
  },
};

// Patient Service
export const patientService = {
  async registerPatient(patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) {
    const response = await apiClient.post<ApiResponse<Patient>>('/patients', patientData);
    return response.data.data;
  },

  async getPatients(limit: number = 20, offset: number = 0) {
    const response = await apiClient.get<ApiResponse<Patient[]>>('/patients', {
      params: { limit, offset },
    });
    return response.data.data;
  },

  async getPatientById(id: string) {
    const response = await apiClient.get<ApiResponse<Patient>>(`/patients/${id}`);
    return response.data.data;
  },

  async getPatientByEmail(email: string) {
    const response = await apiClient.get<ApiResponse<Patient>>(`/patients/by-email/${email}`);
    return response.data.data;
  },

  async updatePatient(id: string, updates: Partial<Patient>) {
    const response = await apiClient.put<ApiResponse<Patient>>(`/patients/${id}`, updates);
    return response.data.data;
  },

  async getAppointmentHistory(patientId: string) {
    const response = await apiClient.get<ApiResponse<Appointment[]>>(
      `/patients/${patientId}/appointments`
    );
    return response.data.data;
  },
};

// TimeSlot Service
export const timeSlotService = {
  async createTimeSlot(doctorId: string, slotData: Omit<TimeSlot, 'id' | 'created_at' | 'updated_at' | 'status' | 'current_bookings'>) {
    const response = await apiClient.post<ApiResponse<TimeSlot>>(
      `/doctors/${doctorId}/time-slots`,
      slotData
    );
    return response.data.data;
  },

  async createBulkSlots(doctorId: string, slots: Array<{ slot_date: string; slot_time: string }>) {
    const response = await apiClient.post<ApiResponse<TimeSlot[]>>(
      `/doctors/${doctorId}/time-slots/bulk`,
      { slots }
    );
    return response.data.data;
  },

  async getDoctorSlots(doctorId: string, fromDate?: string, toDate?: string) {
    const response = await apiClient.get<ApiResponse<TimeSlot[]>>(
      `/doctors/${doctorId}/time-slots`,
      {
        params: { from_date: fromDate, to_date: toDate },
      }
    );
    return response.data.data;
  },
};

// Appointment Service
export const appointmentService = {
  async bookAppointment(appointmentData: {
    patient_id?: string;
    patient_email?: string;
    doctor_id: string;
    time_slot_id: string;
    appointment_date: string;
    appointment_time: string;
    reason_for_visit: string;
    consultation_type?: string;
  }) {
    const response = await apiClient.post<ApiResponse<Appointment>>('/appointments', appointmentData);
    return response.data.data;
  },

  async confirmAppointment(appointmentId: string) {
    const response = await apiClient.post<ApiResponse<Appointment>>(
      `/appointments/${appointmentId}/confirm`
    );
    return response.data.data;
  },

  async cancelAppointment(appointmentId: string, reason: string) {
    const response = await apiClient.post<ApiResponse<Appointment>>(
      `/appointments/${appointmentId}/cancel`,
      { reason }
    );
    return response.data.data;
  },

  async getAppointmentById(appointmentId: string) {
    const response = await apiClient.get<ApiResponse<Appointment>>(
      `/appointments/${appointmentId}`
    );
    return response.data.data;
  },

  async getPatientAppointments(patientId: string, status?: string) {
    const response = await apiClient.get<ApiResponse<Appointment[]>>(
      `/appointments/patient/${patientId}`,
      {
        params: { status },
      }
    );
    return response.data.data;
  },

  async getDoctorAppointments(doctorId: string, date?: string) {
    const response = await apiClient.get<ApiResponse<Appointment[]>>(
      `/appointments/doctor/${doctorId}`,
      {
        params: { date },
      }
    );
    return response.data.data;
  },

  async cleanupExpiredAppointments() {
    const response = await apiClient.post<ApiResponse<Appointment[]>>('/appointments/cleanup/expired');
    return response.data.data;
  },
};

export default apiClient;

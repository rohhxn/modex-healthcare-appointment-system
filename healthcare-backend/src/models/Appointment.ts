import mongoose from 'mongoose';
import { AppError } from '../middleware/errorHandler';

const AppointmentSchema = new mongoose.Schema({
  patient_id: mongoose.Schema.Types.ObjectId,
  doctor_id: mongoose.Schema.Types.ObjectId,
  time_slot_id: mongoose.Schema.Types.ObjectId,
  appointment_date: String,
  appointment_time: String,
  reason_for_visit: String,
  consultation_type: String,
  status: { type: String, default: 'PENDING' },
  notes: String,
  cancellation_reason: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const AppointmentModel = mongoose.model('Appointment', AppointmentSchema);

/**
 * Appointment model with database operations
 */
export class Appointment {
  static async create(appointmentData: {
    patient_id: string;
    doctor_id: string;
    time_slot_id: string;
    appointment_date: string;
    appointment_time: string;
    reason_for_visit?: string;
    consultation_type?: string;
    notes?: string;
  }) {
    try {
      const doc = await AppointmentModel.create(appointmentData);
      return doc.toObject();
    } catch (error) {
      throw error;
    }
  }

  static async getById(id: string) {
    const doc = await AppointmentModel.findById(id);
    if (!doc) {
      throw new AppError(404, 'Appointment not found');
    }
    return doc.toObject();
  }

  static async getByPatient(patientId: string) {
    const docs = await AppointmentModel.find({ patient_id: patientId }).sort({ appointment_date: -1 });
    return docs.map(d => d.toObject());
  }

  static async getByDoctor(doctorId: string) {
    const docs = await AppointmentModel.find({ doctor_id: doctorId }).sort({ appointment_date: -1 });
    return docs.map(d => d.toObject());
  }

  static async update(id: string, updates: Record<string, any>) {
    const allowedFields = ['status', 'notes'];
    const filtered = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as Record<string, any>);

    if (Object.keys(filtered).length === 0) {
      throw new AppError(400, 'No valid fields to update');
    }

    filtered.updated_at = new Date();
    const doc = await AppointmentModel.findByIdAndUpdate(id, filtered, { new: true });
    if (!doc) {
      throw new AppError(404, 'Appointment not found');
    }
    return doc.toObject();
  }

  static async cancel(id: string, reason: string) {
    const updates = {
      status: 'CANCELLED',
      cancellation_reason: reason,
      updated_at: new Date()
    };
    const doc = await AppointmentModel.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) {
      throw new AppError(404, 'Appointment not found');
    }
    return doc.toObject();
  }

  static async getByDateRange(startDate: string, endDate: string) {
    const docs = await AppointmentModel.find({
      appointment_date: { $gte: startDate, $lte: endDate }
    }).sort({ appointment_date: 1 });
    return docs.map(d => d.toObject());
  }

  static async getUpcoming(doctorId?: string) {
    const today = new Date().toISOString().split('T')[0];
    const query: Record<string, any> = {
      appointment_date: { $gte: today },
      status: { $in: ['PENDING', 'CONFIRMED'] }
    };
    if (doctorId) {
      query.doctor_id = doctorId;
    }
    const docs = await AppointmentModel.find(query).sort({ appointment_date: 1 });
    return docs.map(d => d.toObject());
  }

  static async confirm(id: string) {
    const updates = { status: 'CONFIRMED', updated_at: new Date() };
    const doc = await AppointmentModel.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) {
      throw new AppError(404, 'Appointment not found');
    }
    return doc.toObject();
  }

  static async getPatientAppointments(patientId: string, status?: string) {
    const query: Record<string, any> = { patient_id: patientId };
    if (status) {
      query.status = status;
    }
    const docs = await AppointmentModel.find(query).sort({ appointment_date: -1 });
    return docs.map(d => d.toObject());
  }

  static async getDoctorAppointments(doctorId: string, date?: string) {
    const query: Record<string, any> = { doctor_id: doctorId };
    if (date) {
      query.appointment_date = date;
    }
    const docs = await AppointmentModel.find(query).sort({ appointment_time: 1 });
    return docs.map(d => d.toObject());
  }

  static async cancelExpiredAppointments() {
    const result = await AppointmentModel.updateMany(
      { 
        status: 'PENDING',
        appointment_date: { $lt: new Date().toISOString().split('T')[0] }
      },
      { status: 'CANCELLED', cancellation_reason: 'Expired', updated_at: new Date() }
    );
    return { count: result.modifiedCount || 0 };
  }
}

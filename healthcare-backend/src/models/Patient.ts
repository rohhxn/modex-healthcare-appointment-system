import mongoose from 'mongoose';
import { AppError } from '../middleware/errorHandler';

const PatientSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password_hash: String,
  date_of_birth: String,
  gender: String,
  blood_group: String,
  medical_history: String,
  allergies: String,
  emergency_contact_name: String,
  emergency_contact_phone: String,
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

PatientSchema.virtual('id').get(function() {
  return this._id;
});

interface IPatient extends mongoose.Document {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash?: string;
  [key: string]: any;
}

const PatientModel = mongoose.model('Patient', PatientSchema);

/**
 * Patient model with database operations
 */
export class Patient {
  static async create(patientData: {
    name: string;
    email: string;
    phone: string;
    password_hash?: string;
    date_of_birth?: string;
    gender?: string;
    blood_group?: string;
    medical_history?: string;
    allergies?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }) {
    try {
      const doc = await PatientModel.create(patientData);
      return doc.toObject();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError(400, 'Patient with this email already exists');
      }
      throw error;
    }
  }

  static async getAll(limit = 20, offset = 0) {
    const docs = await PatientModel.find({ is_active: true })
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(offset)
      .select('-password_hash');
    return docs.map(d => d.toObject());
  }

  static async getById(id: string) {
    const doc = await PatientModel.findById(id).select('-password_hash');
    if (!doc) {
      throw new AppError(404, 'Patient not found');
    }
    return doc.toObject();
  }

  static async getByEmail(email: string) {
    const doc = await PatientModel.findOne({ email });
    if (!doc) {
      throw new AppError(404, 'Patient not found');
    }
    const obj = doc.toObject();
    return { ...obj, id: obj._id };
  }

  static async update(id: string, updates: Record<string, any>) {
    const allowedFields = [
      'name', 'phone', 'date_of_birth', 'gender', 'blood_group',
      'medical_history', 'allergies', 'emergency_contact_name', 'emergency_contact_phone'
    ];
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
    const doc = await PatientModel.findByIdAndUpdate(id, filtered, { new: true }).select('-password_hash');
    if (!doc) {
      throw new AppError(404, 'Patient not found');
    }
    return doc.toObject();
  }

  static async getAppointments(patientId: string) {
    // Will be implemented when Appointment model is updated
    return [];
  }

  static async getAppointmentHistory(patientId: string) {
    return this.getAppointments(patientId);
  }
}

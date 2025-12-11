import mongoose from 'mongoose';
import { AppError } from '../middleware/errorHandler';

const DoctorSchema = new mongoose.Schema({
  name: String,
  specialization: String,
  email: { type: String, unique: true },
  phone: String,
  license_number: { type: String, unique: true },
  clinic_name: String,
  address: String,
  bio: String,
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const DoctorModel = mongoose.model('Doctor', DoctorSchema);

/**
 * Doctor model with database operations
 */
export class Doctor {
  static async create(doctorData: {
    name: string;
    specialization: string;
    email: string;
    phone: string;
    license_number: string;
    clinic_name: string;
    address: string;
    bio: string;
  }) {
    try {
      const doc = await DoctorModel.create(doctorData);
      return doc.toObject();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new AppError(400, 'Doctor with this email or license number already exists');
      }
      throw error;
    }
  }

  static async getAll(limit = 20, offset = 0) {
    const docs = await DoctorModel.find({ is_active: true })
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(offset);
    return docs.map(d => d.toObject());
  }

  static async getById(id: string) {
    const doc = await DoctorModel.findById(id);
    if (!doc) {
      throw new AppError(404, 'Doctor not found');
    }
    return doc.toObject();
  }

  static async getBySpecialization(specialization: string) {
    const docs = await DoctorModel.find({
      specialization: { $regex: specialization, $options: 'i' },
      is_active: true
    }).sort({ name: 1 });
    return docs.map(d => d.toObject());
  }

  static async update(id: string, updates: Record<string, any>) {
    const allowedFields = ['name', 'specialization', 'phone', 'clinic_name', 'address', 'bio'];
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
    const doc = await DoctorModel.findByIdAndUpdate(id, filtered, { new: true });
    if (!doc) {
      throw new AppError(404, 'Doctor not found');
    }
    return doc.toObject();
  }

  static async getAvailableSlots(doctorId: string, date?: string) {
    return [];
  }
}

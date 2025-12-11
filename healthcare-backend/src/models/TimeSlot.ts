import mongoose from 'mongoose';
import { AppError } from '../middleware/errorHandler';

const TimeSlotSchema = new mongoose.Schema({
  doctor_id: mongoose.Schema.Types.ObjectId,
  slot_date: String,
  slot_time: String,
  duration_minutes: { type: Number, default: 30 },
  max_capacity: Number,
  current_bookings: { type: Number, default: 0 },
  status: { type: String, default: 'AVAILABLE' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const TimeSlotModel = mongoose.model('TimeSlot', TimeSlotSchema);

/**
 * TimeSlot model with database operations
 */
export class TimeSlot {
  static async create(slotData: {
    doctor_id: string;
    slot_date: string;
    slot_time: string;
    duration_minutes?: number;
    max_capacity: number;
  }) {
    try {
      const doc = await TimeSlotModel.create(slotData);
      return doc.toObject();
    } catch (error) {
      throw error;
    }
  }

  static async getByDoctorAndDate(doctorId: string, date: string) {
    const docs = await TimeSlotModel.find({
      doctor_id: doctorId,
      slot_date: date,
      status: 'AVAILABLE'
    }).sort({ slot_time: 1 });
    return docs.map(d => d.toObject());
  }

  static async getById(id: string) {
    const doc = await TimeSlotModel.findById(id);
    if (!doc) {
      throw new AppError(404, 'Time slot not found');
    }
    return doc.toObject();
  }

  static async update(id: string, updates: Record<string, any>) {
    const allowedFields = ['current_bookings', 'status'];
    const filtered = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as Record<string, any>);

    filtered.updated_at = new Date();
    const doc = await TimeSlotModel.findByIdAndUpdate(id, filtered, { new: true });
    if (!doc) {
      throw new AppError(404, 'Time slot not found');
    }
    return doc.toObject();
  }

  static async getAvailable(doctorId: string, date?: string) {
    const query: Record<string, any> = { doctor_id: doctorId, status: 'AVAILABLE' };
    if (date) {
      query.slot_date = date;
    }
    const docs = await TimeSlotModel.find(query).sort({ slot_time: 1 });
    return docs.map(d => d.toObject());
  }

  static async delete(id: string) {
    const doc = await TimeSlotModel.findByIdAndDelete(id);
    if (!doc) {
      throw new AppError(404, 'Time slot not found');
    }
    return true;
  }

  static async getAvailableSlots(doctorId: string, fromDate?: string, toDate?: string) {
    const query: Record<string, any> = { doctor_id: doctorId, status: 'AVAILABLE' };
    if (fromDate || toDate) {
      query.slot_date = {};
      if (fromDate) query.slot_date.$gte = fromDate;
      if (toDate) query.slot_date.$lte = toDate;
    }
    const docs = await TimeSlotModel.find(query).sort({ slot_date: 1, slot_time: 1 });
    return docs.map(d => d.toObject());
  }

  static async createBulk(doctorId: string, slots: Array<{slot_date: string; slot_time: string; max_capacity: number}>) {
    const docs = await TimeSlotModel.insertMany(
      slots.map(slot => ({ doctor_id: doctorId, ...slot }))
    );
    return docs.map(d => d.toObject());
  }

  static async getDoctorSlots(doctorId: string, fromDate?: string, toDate?: string) {
    const query: Record<string, any> = { doctor_id: doctorId };
    if (fromDate || toDate) {
      query.slot_date = {};
      if (fromDate) query.slot_date.$gte = fromDate;
      if (toDate) query.slot_date.$lte = toDate;
    }
    const docs = await TimeSlotModel.find(query).sort({ slot_date: 1, slot_time: 1 });
    return docs.map(d => d.toObject());
  }
}

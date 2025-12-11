import mongoose from 'mongoose';
import { AppError } from '../middleware/errorHandler';

const DoctorSchema = new mongoose.Schema({
  name: String,
  specialization: String,
  email: String,
  phone: String,
  license_number: String,
  clinic_name: String,
  address: String,
  bio: String,
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
    const { name, specialization, email, phone, license_number, clinic_name, address, bio } =
      doctorData;

    try {
      const doc = await DoctorModel.create({
        name,
        specialization,
        email,
        phone,
        license_number,
        clinic_name,
        address,
        bio
        email,
        phone,
        license_number,
        clinic_name,
        address,
        bio,
      ]);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new AppError(400, 'Doctor with this email or license number already exists');
      }
      throw error;
    }
  }

  static async getAll(limit = 20, offset = 0) {
    const query = `
      SELECT * FROM doctors
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  static async getById(id: string) {
    const query = `SELECT * FROM doctors WHERE id = $1;`;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      throw new AppError(404, 'Doctor not found');
    }
    return result.rows[0];
  }

  static async getBySpecialization(specialization: string) {
    const query = `
      SELECT * FROM doctors
      WHERE specialization ILIKE $1 AND is_active = true
      ORDER BY name ASC;
    `;
    const result = await pool.query(query, [`%${specialization}%`]);
    return result.rows;
  }

  static async update(id: string, updates: Record<string, any>) {
    const allowedFields = ['name', 'specialization', 'phone', 'clinic_name', 'address', 'bio'];
    const fields = Object.keys(updates).filter((key) => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new AppError(400, 'No valid fields to update');
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = fields.map((field) => updates[field]);

    const query = `
      UPDATE doctors
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING *;
    `;

    const result = await pool.query(query, [...values, id]);
    if (result.rows.length === 0) {
      throw new AppError(404, 'Doctor not found');
    }
    return result.rows[0];
  }

  static async getAvailableSlots(doctorId: string, date?: string) {
    let query = `
      SELECT * FROM time_slots
      WHERE doctor_id = $1 AND status = 'AVAILABLE'
      AND current_bookings < max_capacity
    `;
    const values: any[] = [doctorId];

    if (date) {
      query += ` AND slot_date = $2`;
      values.push(date);
    }

    query += ` ORDER BY slot_time ASC;`;

    const result = await pool.query(query, values);
    return result.rows;
  }
}

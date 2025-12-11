import pool from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

/**
 * Patient model with database operations
 */
export class Patient {
  static async create(patientData: {
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
  }) {
    const {
      name,
      email,
      phone,
      date_of_birth,
      gender,
      blood_group,
      medical_history,
      allergies,
      emergency_contact_name,
      emergency_contact_phone,
    } = patientData;

    const query = `
      INSERT INTO patients (
        name, email, phone, date_of_birth, gender, blood_group,
        medical_history, allergies, emergency_contact_name, emergency_contact_phone
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    try {
      const result = await pool.query(query, [
        name,
        email,
        phone,
        date_of_birth || null,
        gender || null,
        blood_group || null,
        medical_history || null,
        allergies || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
      ]);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new AppError(400, 'Patient with this email already exists');
      }
      throw error;
    }
  }

  static async getAll(limit = 20, offset = 0) {
    const query = `
      SELECT * FROM patients
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  static async getById(id: string) {
    const query = `SELECT * FROM patients WHERE id = $1;`;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      throw new AppError(404, 'Patient not found');
    }
    return result.rows[0];
  }

  static async getByEmail(email: string) {
    const query = `SELECT * FROM patients WHERE email = $1;`;
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async update(id: string, updates: Record<string, any>) {
    const allowedFields = [
      'name',
      'phone',
      'date_of_birth',
      'gender',
      'blood_group',
      'medical_history',
      'allergies',
      'emergency_contact_name',
      'emergency_contact_phone',
    ];

    const fields = Object.keys(updates).filter((key) => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new AppError(400, 'No valid fields to update');
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = fields.map((field) => updates[field]);

    const query = `
      UPDATE patients
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING *;
    `;

    const result = await pool.query(query, [...values, id]);
    if (result.rows.length === 0) {
      throw new AppError(404, 'Patient not found');
    }
    return result.rows[0];
  }

  static async getAppointmentHistory(patientId: string) {
    const query = `
      SELECT 
        a.*, 
        d.name as doctor_name, 
        d.specialization,
        d.clinic_name,
        ts.slot_time
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN time_slots ts ON a.time_slot_id = ts.id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date DESC, ts.slot_time DESC;
    `;
    const result = await pool.query(query, [patientId]);
    return result.rows;
  }
}

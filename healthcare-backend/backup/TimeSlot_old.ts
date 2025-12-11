import pool from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * TimeSlot model for doctor appointment slots
 */
export class TimeSlot {
  static async create(slotData: {
    doctor_id: string;
    slot_date: string;
    slot_time: string;
    duration_minutes?: number;
    max_capacity?: number;
  }) {
    const { doctor_id, slot_date, slot_time, duration_minutes = 30, max_capacity = 1 } = slotData;

    const query = `
      INSERT INTO time_slots (doctor_id, slot_date, slot_time, duration_minutes, max_capacity)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    try {
      const result = await pool.query(query, [
        doctor_id,
        slot_date,
        slot_time,
        duration_minutes,
        max_capacity,
      ]);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new AppError(400, 'Time slot already exists for this doctor at the specified date and time');
      }
      throw error;
    }
  }

  static async createBulk(doctorId: string, slots: Array<{ slot_date: string; slot_time: string; max_capacity?: number }>) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO time_slots (doctor_id, slot_date, slot_time, max_capacity)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;

      const createdSlots = [];
      for (const slot of slots) {
        try {
          const result = await client.query(query, [
            doctorId,
            slot.slot_date,
            slot.slot_time,
            slot.max_capacity || 1,
          ]);
          createdSlots.push(result.rows[0]);
        } catch (error: any) {
          // Skip if slot already exists
          if (error.code === '23505') {
            console.log(`Slot already exists: ${slot.slot_date} ${slot.slot_time}`);
            continue;
          }
          throw error;
        }
      }

      await client.query('COMMIT');
      return createdSlots;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getById(slotId: string) {
    const query = `SELECT * FROM time_slots WHERE id = $1;`;
    const result = await pool.query(query, [slotId]);
    if (result.rows.length === 0) {
      throw new AppError(404, 'Time slot not found');
    }
    return result.rows[0];
  }

  static async getDoctorSlots(doctorId: string, fromDate?: string, toDate?: string) {
    let query = `
      SELECT * FROM time_slots
      WHERE doctor_id = $1
    `;
    const values: any[] = [doctorId];

    if (fromDate) {
      query += ` AND slot_date >= $${values.length + 1}`;
      values.push(fromDate);
    }

    if (toDate) {
      query += ` AND slot_date <= $${values.length + 1}`;
      values.push(toDate);
    }

    query += ` ORDER BY slot_date ASC, slot_time ASC;`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getAvailableSlots(doctorId: string, fromDate?: string, toDate?: string) {
    let query = `
      SELECT * FROM time_slots
      WHERE doctor_id = $1
      AND status = 'AVAILABLE'
      AND current_bookings < max_capacity
    `;
    const values: any[] = [doctorId];

    if (fromDate) {
      query += ` AND slot_date >= $${values.length + 1}`;
      values.push(fromDate);
    }

    if (toDate) {
      query += ` AND slot_date <= $${values.length + 1}`;
      values.push(toDate);
    }

    query += ` ORDER BY slot_date ASC, slot_time ASC;`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async blockSlot(slotId: string) {
    const query = `
      UPDATE time_slots
      SET status = 'BLOCKED', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [slotId]);
    if (result.rows.length === 0) {
      throw new AppError(404, 'Time slot not found');
    }
    return result.rows[0];
  }

  static async unblockSlot(slotId: string) {
    const query = `
      UPDATE time_slots
      SET status = 'AVAILABLE', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND current_bookings = 0
      RETURNING *;
    `;
    const result = await pool.query(query, [slotId]);
    if (result.rows.length === 0) {
      throw new AppError(404, 'Time slot not found or has active bookings');
    }
    return result.rows[0];
  }
}

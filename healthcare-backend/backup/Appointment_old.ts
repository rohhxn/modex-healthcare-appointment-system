import pool from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * Appointment model with concurrency-safe booking
 * Uses database-level locking to prevent race conditions
 */
export class Appointment {
  /**
   * Create a new appointment with atomic transaction
   * This prevents race conditions by using SELECT FOR UPDATE
   */
  static async create(appointmentData: {
    patient_id: string;
    doctor_id: string;
    time_slot_id: string;
    appointment_date: string;
    appointment_time: string;
    reason_for_visit: string;
    consultation_type: string;
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      const {
        patient_id,
        doctor_id,
        time_slot_id,
        appointment_date,
        appointment_time,
        reason_for_visit,
        consultation_type,
      } = appointmentData;

      // Check if slot is still available with row-level lock
      const slotCheckQuery = `
        SELECT * FROM time_slots
        WHERE id = $1 AND doctor_id = $2
        FOR UPDATE;
      `;
      const slotResult = await client.query(slotCheckQuery, [time_slot_id, doctor_id]);

      if (slotResult.rows.length === 0) {
        throw new AppError(404, 'Time slot not found');
      }

      const slot = slotResult.rows[0];

      // Verify slot is available and has capacity
      if (slot.status !== 'AVAILABLE') {
        throw new AppError(400, 'This slot is no longer available');
      }

      if (slot.current_bookings >= slot.max_capacity) {
        throw new AppError(400, 'This slot is fully booked');
      }

      // Check if patient already has appointment for this slot
      const existingAppointmentQuery = `
        SELECT id FROM appointments
        WHERE time_slot_id = $1 AND patient_id = $2 AND status != 'CANCELLED'
        FOR UPDATE;
      `;
      const existingResult = await client.query(existingAppointmentQuery, [
        time_slot_id,
        patient_id,
      ]);

      if (existingResult.rows.length > 0) {
        throw new AppError(400, 'Patient already has an appointment for this slot');
      }

      // Create appointment
      const createAppointmentQuery = `
        INSERT INTO appointments (
          patient_id, doctor_id, time_slot_id,
          appointment_date, appointment_time, reason_for_visit,
          consultation_type, expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP + INTERVAL '5 minutes')
        RETURNING *;
      `;

      const appointmentResult = await client.query(createAppointmentQuery, [
        patient_id,
        doctor_id,
        time_slot_id,
        appointment_date,
        appointment_time,
        reason_for_visit,
        consultation_type,
      ]);

      // Update slot booking count
      const updateSlotQuery = `
        UPDATE time_slots
        SET current_bookings = current_bookings + 1,
            status = CASE
              WHEN (current_bookings + 1) >= max_capacity THEN 'BOOKED'::slot_status
              ELSE status
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;

      await client.query(updateSlotQuery, [time_slot_id]);

      // Log appointment creation (best effort - don't fail if audit log fails)
      try {
        const auditQuery = `
          INSERT INTO appointment_audit_log (appointment_id, action, new_status)
          VALUES ($1, 'CREATED', 'PENDING');
        `;
        await client.query(auditQuery, [appointmentResult.rows[0].id]);
      } catch (auditError) {
        console.warn('Failed to create audit log:', auditError);
        // Continue anyway - audit log is not critical
      }

      await client.query('COMMIT');
      return appointmentResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Confirm appointment (move from PENDING to CONFIRMED)
   * This is atomic to prevent double confirmation
   */
  static async confirm(appointmentId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      // Get appointment with lock
      const getQuery = `
        SELECT * FROM appointments
        WHERE id = $1
        FOR UPDATE;
      `;
      const result = await client.query(getQuery, [appointmentId]);

      if (result.rows.length === 0) {
        throw new AppError(404, 'Appointment not found');
      }

      const appointment = result.rows[0];

      // Check if appointment is still pending
      if (appointment.status !== 'PENDING') {
        throw new AppError(400, `Cannot confirm appointment with status: ${appointment.status}`);
      }

      // Check if appointment has expired
      if (new Date(appointment.expires_at) < new Date()) {
        // Auto-cancel expired appointment
        await client.query(`
          UPDATE appointments
          SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP
          WHERE id = $1;
        `, [appointmentId]);

        throw new AppError(400, 'Appointment confirmation time has expired');
      }

      // Confirm appointment
      const updateQuery = `
        UPDATE appointments
        SET status = 'CONFIRMED',
            payment_status = 'COMPLETED',
            confirmed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;

      const updateResult = await client.query(updateQuery, [appointmentId]);

      // Log confirmation (best effort)
      try {
        const auditQuery = `
          INSERT INTO appointment_audit_log (appointment_id, action, old_status, new_status)
          VALUES ($1, 'CONFIRMED', 'PENDING', 'CONFIRMED');
        `;
        await client.query(auditQuery, [appointmentId]);
      } catch (auditError) {
        console.warn('Failed to create confirmation audit log:', auditError);
      }

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel appointment with atomic transaction
   * Frees up the slot capacity
   */
  static async cancel(appointmentId: string, reason: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      // Get appointment with lock
      const getQuery = `
        SELECT * FROM appointments
        WHERE id = $1
        FOR UPDATE;
      `;
      const result = await client.query(getQuery, [appointmentId]);

      if (result.rows.length === 0) {
        throw new AppError(404, 'Appointment not found');
      }

      const appointment = result.rows[0];

      if (appointment.status === 'CANCELLED') {
        throw new AppError(400, 'Appointment is already cancelled');
      }

      // Cancel appointment
      const cancelQuery = `
        UPDATE appointments
        SET status = 'CANCELLED',
            cancelled_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *;
      `;

      const cancelResult = await client.query(cancelQuery, [appointmentId]);

      // Free up slot capacity
      const updateSlotQuery = `
        UPDATE time_slots
        SET current_bookings = GREATEST(current_bookings - 1, 0),
            status = CASE
              WHEN (current_bookings - 1) < max_capacity THEN 'AVAILABLE'::slot_status
              ELSE status
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;
      `;

      await client.query(updateSlotQuery, [appointment.time_slot_id]);

      // Log cancellation (best effort)
      try {
        const auditQuery = `
          INSERT INTO appointment_audit_log (appointment_id, action, old_status, new_status, reason)
          VALUES ($1, 'CANCELLED', $2, 'CANCELLED', $3);
        `;
        await client.query(auditQuery, [appointmentId, appointment.status, reason]);
      } catch (auditError) {
        console.warn('Failed to create cancellation audit log:', auditError);
      }
      await client.query('COMMIT');
      return cancelResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getById(appointmentId: string) {
    const query = `
      SELECT 
        a.*,
        d.name as doctor_name,
        d.specialization,
        d.clinic_name,
        d.phone as doctor_phone,
        p.name as patient_name,
        p.email as patient_email,
        p.phone as patient_phone,
        ts.slot_time
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN patients p ON a.patient_id = p.id
      JOIN time_slots ts ON a.time_slot_id = ts.id
      WHERE a.id = $1;
    `;
    const result = await pool.query(query, [appointmentId]);
    if (result.rows.length === 0) {
      throw new AppError(404, 'Appointment not found');
    }
    return result.rows[0];
  }

  static async getPatientAppointments(patientId: string, status?: string) {
    let query = `
      SELECT 
        a.*,
        d.name as doctor_name,
        d.specialization,
        d.clinic_name,
        COALESCE(ts.slot_time, '') as slot_time
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN time_slots ts ON a.time_slot_id = ts.id
      WHERE a.patient_id = $1
    `;

    if (status) {
      query += ` AND a.status = $2`;
    }

    query += ` ORDER BY a.appointment_date DESC, COALESCE(ts.slot_time, '') DESC;`;

    const values = status ? [patientId, status] : [patientId];
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getDoctorAppointments(doctorId: string, date?: string) {
    let query = `
      SELECT 
        a.*,
        p.name as patient_name,
        p.email as patient_email,
        p.phone as patient_phone,
        COALESCE(ts.slot_time, '') as slot_time
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN time_slots ts ON a.time_slot_id = ts.id
      WHERE a.doctor_id = $1 AND a.status != 'CANCELLED'
    `;

    if (date) {
      query += ` AND a.appointment_date = $2`;
    }

    query += ` ORDER BY a.appointment_date DESC, COALESCE(ts.slot_time, '') ASC;`;

    const values = date ? [doctorId, date] : [doctorId];
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Clean up expired pending appointments
   * Should be run periodically (e.g., every minute)
   */
  static async cancelExpiredAppointments() {
    const query = `
      UPDATE appointments
      SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP
      WHERE status = 'PENDING' AND expires_at < CURRENT_TIMESTAMP
      AND cancelled_at IS NULL
      RETURNING *;
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

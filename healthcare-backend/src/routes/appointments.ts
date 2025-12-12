// @ts-nocheck
import { Router, Request, Response, NextFunction } from 'express';
import { Appointment } from '../models/Appointment';
import { Patient } from '../models/Patient';
import { AppError } from '../middleware/errorHandler';
const router = Router();

// Helper function to validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * POST /api/appointments
 * Book an appointment (patient initiates)
 * Creates a PENDING appointment with 5 minute expiry
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      patient_id,
      patient_email,
      doctor_id,
      time_slot_id,
      appointment_date,
      appointment_time,
      reason_for_visit,
      consultation_type = 'in-person',
    } = req.body;

    // Validation
    if (!doctor_id || !time_slot_id || !appointment_date || !appointment_time) {
      throw new AppError(400, 'Missing required fields');
    }

    let patientId = patient_id;

    // If patient_id not provided, try to find/create patient by email
    if (!patientId && patient_email) {
      let patient = await Patient.getByEmail(patient_email);
      if (!patient) {
        throw new AppError(400, 'Patient not found. Please register first or provide a valid patient_id');
      }
      patientId = (patient as any).id;
    }

    // If we still have a patientId that isn't a UUID (like "pat001"), try to look up by email
    if (patientId && !isValidUUID(patientId)) {
      if (!patient_email) {
        throw new AppError(400, 'Patient ID format is invalid. Please log in with your email or register.');
      }
      // Try to find patient by email
      let patient = await Patient.getByEmail(patient_email);
      if (patient) {
        patientId = (patient as any).id;
      } else {
        throw new AppError(400, 'Patient not found. Please register with email: ' + patient_email);
      }
    }

    if (!patientId) {
      throw new AppError(400, 'Either patient_id or patient_email must be provided');
    }

    // Create appointment with concurrency-safe booking
    const appointment = await Appointment.create({
      patient_id: patientId,
      doctor_id,
      time_slot_id,
      appointment_date,
      appointment_time,
      reason_for_visit,
      consultation_type,
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully. Please confirm within 5 minutes.',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/appointments/:id/confirm
 * Confirm a pending appointment
 * Moves appointment from PENDING to CONFIRMED
 */
router.post('/:id/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.confirm(id);

    res.status(200).json({
      success: true,
      message: 'Appointment confirmed successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/appointments/:id/cancel
 * Cancel an appointment
 */
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason = 'Patient requested cancellation' } = req.body;

    const appointment = await Appointment.cancel(id, reason);

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/appointments/:id
 * Get appointment details
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.getById(id);

    res.status(200).json({
      success: true,
      message: 'Appointment retrieved successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/appointments/patient/:patientId
 * Get all appointments for a patient
 */
router.get('/patient/:patientId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { patientId } = req.params;
    const { status } = req.query;

    // If patientId is not a valid UUID (e.g., "pat001"), return empty array
    // since demo users won't have any appointments
    if (!isValidUUID(patientId)) {
      return res.status(200).json({
        success: true,
        message: 'Appointments retrieved successfully',
        data: [],
      });
    }

    const appointments = await Appointment.getPatientAppointments(patientId, status as string);

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/appointments/doctor/:doctorId
 * Get all appointments for a doctor
 */
router.get('/doctor/:doctorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { doctorId } = req.params;
    const { date } = req.query;

    // If doctorId is not a valid UUID (e.g., "doctor001"), return empty array
    // since demo users won't have any appointments
    if (!isValidUUID(doctorId)) {
      return res.status(200).json({
        success: true,
        message: 'Appointments retrieved successfully',
        data: [],
      });
    }

    const appointments = await Appointment.getDoctorAppointments(doctorId, date as string);

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/appointments/cleanup
 * Clean up expired pending appointments
 * Should be called periodically by a cron job
 */
router.post('/cleanup/expired', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cancelledAppointments = await Appointment.cancelExpiredAppointments();

    res.status(200).json({
      success: true,
      message: `${cancelledAppointments.count} expired appointments cancelled`,
      data: cancelledAppointments,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

// @ts-nocheck
import { Router, Request, Response, NextFunction } from 'express';
import { Patient } from '../models/Patient';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/patients
 * Register a new patient
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
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
    } = req.body;

    // Validation
    if (!name || !email || !phone) {
      throw new AppError(400, 'Missing required fields: name, email, phone');
    }

    // Check if patient already exists
    const existingPatient = await Patient.getByEmail(email);
    if (existingPatient) {
      throw new AppError(400, 'Patient with this email already exists');
    }

    const patient = await Patient.create({
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
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/patients
 * Get all patients with pagination
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const patients = await Patient.getAll(limit, offset);

    res.status(200).json({
      success: true,
      message: 'Patients retrieved successfully',
      data: patients,
      pagination: { limit, offset },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/patients/by-email/:email
 * Get patient by email (must come BEFORE /:id)
 */
router.get('/by-email/:email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params;

    const patient = await Patient.getByEmail(email);

    if (!patient) {
      throw new AppError(404, 'Patient not found');
    }

    res.status(200).json({
      success: true,
      message: 'Patient retrieved successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/patients/:id
 * Get patient profile
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const patient = await Patient.getById(id);

    res.status(200).json({
      success: true,
      message: 'Patient profile retrieved successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/patients/:id
 * Update patient profile
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const patient = await Patient.update(id, updates);

    res.status(200).json({
      success: true,
      message: 'Patient profile updated successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/patients/:id/appointments
 * Get appointment history for patient
 */
router.get('/:id/appointments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const appointments = await Patient.getAppointmentHistory(id);

    res.status(200).json({
      success: true,
      message: 'Appointment history retrieved successfully',
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

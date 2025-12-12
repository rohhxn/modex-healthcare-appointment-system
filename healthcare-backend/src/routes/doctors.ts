// @ts-nocheck
import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Doctor } from '../models/Doctor';
import { TimeSlot } from '../models/TimeSlot';
import { AppError } from '../middleware/errorHandler';

const router = Router();

function assertValidDoctorId(id: string) {
  if (!id || id === 'undefined' || id === 'null') {
    throw new AppError(400, 'doctorId is required');
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'doctorId must be a valid ObjectId');
  }
}

/**
 * POST /api/doctors
 * Create a new doctor profile
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, specialization, email, phone, license_number, clinic_name, address, bio } =
      req.body;

    // Validation
    if (!name || !specialization || !email || !license_number) {
      throw new AppError(400, 'Missing required fields: name, specialization, email, license_number');
    }

    const doctor = await Doctor.create({
      name,
      specialization,
      email,
      phone,
      license_number,
      clinic_name,
      address,
      bio,
    });

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/doctors
 * Get all doctors with pagination
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const doctors = await Doctor.getAll(limit, offset);

    res.status(200).json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: doctors,
      pagination: { limit, offset },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/doctors/specialization/:specialization
 * Get doctors by specialization
 */
router.get('/specialization/:specialization', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { specialization } = req.params;

    const doctors = await Doctor.getBySpecialization(specialization);

    res.status(200).json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/doctors/:id
 * Get doctor profile with available slots
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { from_date, to_date } = req.query;

    assertValidDoctorId(id);

    const doctor = await Doctor.getById(id);
    const availableSlots = await TimeSlot.getAvailableSlots(
      id,
      from_date as string,
      to_date as string
    );

    res.status(200).json({
      success: true,
      message: 'Doctor profile retrieved successfully',
      data: {
        ...doctor,
        availableSlots,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/doctors/:id
 * Update doctor profile
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    assertValidDoctorId(id);

    const doctor = await Doctor.update(id, updates);

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/doctors/:id/time-slots
 * Create a new time slot for doctor
 */
router.post('/:id/time-slots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { slot_date, slot_time, duration_minutes, max_capacity } = req.body;

    assertValidDoctorId(id);

    // Validation
    if (!slot_date || !slot_time) {
      throw new AppError(400, 'Missing required fields: slot_date, slot_time');
    }

    // Verify doctor exists
    await Doctor.getById(id);

    const slot = await TimeSlot.create({
      doctor_id: id,
      slot_date,
      slot_time,
      duration_minutes,
      max_capacity,
    });

    res.status(201).json({
      success: true,
      message: 'Time slot created successfully',
      data: slot,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/doctors/:id/time-slots/bulk
 * Create multiple time slots for doctor (bulk operation)
 */
router.post('/:id/time-slots/bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { slots } = req.body;

    assertValidDoctorId(id);

    if (!Array.isArray(slots) || slots.length === 0) {
      throw new AppError(400, 'Invalid slots array provided');
    }

    // Verify doctor exists
    await Doctor.getById(id);

    const createdSlots = await TimeSlot.createBulk(id, slots);

    res.status(201).json({
      success: true,
      message: `${createdSlots.length} time slots created successfully`,
      data: createdSlots,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/doctors/:id/time-slots
 * Get all time slots for doctor
 */
router.get('/:id/time-slots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { from_date, to_date } = req.query;

    assertValidDoctorId(id);

    const slots = await TimeSlot.getDoctorSlots(id, from_date as string, to_date as string);

    res.status(200).json({
      success: true,
      message: 'Time slots retrieved successfully',
      data: slots,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/doctors/:id/available-slots
 * Get available time slots for doctor
 */
router.get('/:id/available-slots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { from_date, to_date } = req.query;

    assertValidDoctorId(id);

    const slots = await TimeSlot.getAvailableSlots(
      id,
      from_date as string,
      to_date as string
    );

    res.status(200).json({
      success: true,
      message: 'Available slots retrieved successfully',
      data: slots,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

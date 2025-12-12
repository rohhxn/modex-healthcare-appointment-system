// @ts-nocheck
/**
 * Reset + Seed demo data into MongoDB.
 *
 * What it does:
 *  - Deletes ALL docs from: appointments, time slots, doctors, patients
 *  - Inserts fresh "known good" demo doctors/patient
 *  - Creates AVAILABLE time slots for the next business days
 *
 * Safe to run repeatedly. Intended for demo/dev envs only.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-appointments';

// Ensure models are registered
import '../models/Doctor';
import '../models/Patient';
import '../models/TimeSlot';
import '../models/Appointment';

const DoctorModel = mongoose.model('Doctor');
const PatientModel = mongoose.model('Patient');
const TimeSlotModel = mongoose.model('TimeSlot');
const AppointmentModel = mongoose.model('Appointment');

type SeedResult = {
  doctors: Array<{ id: string; email: string }>;
  patient: { id: string; email: string };
  slotsCreated: number;
};

function nextBusinessDays(count: number) {
  const days: Date[] = [];
  let d = new Date();
  d.setDate(d.getDate() + 1);
  while (days.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

async function seed(): Promise<SeedResult> {
  await mongoose.connect(MONGODB_URI);

  // Wipe collections (order matters due to references)
  await AppointmentModel.deleteMany({});
  await TimeSlotModel.deleteMany({});
  await DoctorModel.deleteMany({});
  await PatientModel.deleteMany({});

  const demoPassword = process.env.DEMO_PASSWORD || 'Passw0rd!';
  const password_hash = await bcrypt.hash(demoPassword, 10);

  const doctors = await DoctorModel.insertMany([
    {
      name: 'Dr. Amira Hassan',
      specialization: 'Cardiology',
      email: 'amira.hassan@modexdemo.com',
      phone: '+1-555-0101',
      license_number: 'CARD-10293',
      clinic_name: 'Modex Heart Center',
      address: '101 Wellness Ave, Suite 200',
      bio: 'Board-certified cardiologist specializing in preventive care and hypertension management.',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'Dr. Jayden Park',
      specialization: 'Dermatology',
      email: 'jayden.park@modexdemo.com',
      phone: '+1-555-0102',
      license_number: 'DERM-55301',
      clinic_name: 'ClearSkin Clinic',
      address: '22 River St, Floor 3',
      bio: 'Dermatologist focused on acne, eczema, and skin cancer screening.',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);

  const patient = await PatientModel.create({
    name: 'Demo Patient',
    email: 'patient@modexdemo.com',
    phone: '+1-555-0200',
    password_hash,
    date_of_birth: '1998-01-10',
    gender: 'Other',
    blood_group: 'O+',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const slotTimes = ['09:00:00', '09:30:00', '10:00:00', '14:00:00', '14:30:00', '15:00:00'];
  const days = nextBusinessDays(5);

  const toInsert: any[] = [];
  for (const doc of doctors) {
    for (const day of days) {
      const dateStr = new Date(day).toISOString().slice(0, 10);
      for (const t of slotTimes) {
        toInsert.push({
          doctor_id: doc._id,
          slot_date: dateStr,
          slot_time: t,
          duration_minutes: 30,
          max_capacity: 1,
          current_bookings: 0,
          status: 'AVAILABLE',
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }
  }

  const insertedSlots = await TimeSlotModel.insertMany(toInsert);

  return {
    doctors: doctors.map((d: any) => ({ id: String(d._id), email: d.email })),
    patient: { id: String((patient as any)._id), email: (patient as any).email },
    slotsCreated: insertedSlots.length,
  };
}

seed()
  .then((result) => {
    const demoPassword = process.env.DEMO_PASSWORD || 'Passw0rd!';

    console.log('\n✅ Demo RESET + seed complete');
    console.log('='.repeat(50));

    console.log('\nSample login values (use these in UI):');
    console.log(`\nPatient:`);
    console.log(`  email: ${result.patient.email}`);
    console.log(`  password: ${demoPassword}`);
    console.log(`  id: ${result.patient.id}`);

    console.log(`\nDoctors (pick one):`);
    result.doctors.forEach((d) => {
      console.log(`  - email: ${d.email}`);
      console.log(`    password: ${demoPassword}`);
      console.log(`    id: ${d.id}`);
    });

    console.log(`\nTime slots: created ${result.slotsCreated} AVAILABLE slots\n`);
  })
  .catch((err) => {
    console.error('❌ Reset seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-appointments';

// Names MUST match mongoose.model() names used in models.
// We seed through the models registered by importing them.
import '../models/Doctor';
import '../models/Patient';
import '../models/TimeSlot';

const DoctorModel = mongoose.model('Doctor');
const PatientModel = mongoose.model('Patient');
const TimeSlotModel = mongoose.model('TimeSlot');

type SeedResult = {
  doctors: Array<{ id: string; email: string }>;
  patient: { id: string; email: string };
  slotsCreated: number;
};

async function upsertDoctor(input: Record<string, any>) {
  return DoctorModel.findOneAndUpdate(
    { email: input.email },
    { ...input, updated_at: new Date(), created_at: input.created_at ?? new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertPatient(input: Record<string, any>) {
  return PatientModel.findOneAndUpdate(
    { email: input.email },
    { ...input, updated_at: new Date(), created_at: input.created_at ?? new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

function nextBusinessDays(count: number) {
  const days: Date[] = [];
  let d = new Date();
  // start tomorrow
  d.setDate(d.getDate() + 1);
  while (days.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      days.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

async function seed(): Promise<SeedResult> {
  await mongoose.connect(MONGODB_URI);

  const demoPassword = process.env.DEMO_PASSWORD || 'Passw0rd!';
  const password_hash = await bcrypt.hash(demoPassword, 10);

  const doctors = await Promise.all([
    upsertDoctor({
      name: 'Dr. Amira Hassan',
      specialization: 'Cardiology',
      email: 'amira.hassan@modexdemo.com',
      phone: '+1-555-0101',
      license_number: 'CARD-10293',
      clinic_name: 'Modex Heart Center',
      address: '101 Wellness Ave, Suite 200',
      bio: 'Board-certified cardiologist specializing in preventive care and hypertension management.',
      is_active: true,
    }),
    upsertDoctor({
      name: 'Dr. Jayden Park',
      specialization: 'Dermatology',
      email: 'jayden.park@modexdemo.com',
      phone: '+1-555-0102',
      license_number: 'DERM-55301',
      clinic_name: 'ClearSkin Clinic',
      address: '22 River St, Floor 3',
      bio: 'Dermatologist focused on acne, eczema, and skin cancer screening.',
      is_active: true,
    }),
  ]);

  const patient = await upsertPatient({
    name: 'Demo Patient',
    email: 'patient@modexdemo.com',
    phone: '+1-555-0200',
    password_hash,
    date_of_birth: '1998-01-10',
    gender: 'Other',
    blood_group: 'O+',
    is_active: true,
  });

  // Create timeslots: 5 business days, 6 slots/day per doctor
  const slotTimes = ['09:00:00', '09:30:00', '10:00:00', '14:00:00', '14:30:00', '15:00:00'];
  const days = nextBusinessDays(5);

  let slotsCreated = 0;
  for (const doc of doctors) {
    for (const day of days) {
      const dateStr = day.toISOString().slice(0, 10);
      for (const t of slotTimes) {
        // De-dupe by (doctor_id, slot_date, slot_time)
        const existing = await TimeSlotModel.findOne({
          doctor_id: doc._id,
          slot_date: dateStr,
          slot_time: t,
        });
        if (existing) continue;

        await TimeSlotModel.create({
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
        slotsCreated++;
      }
    }
  }

  return {
    doctors: doctors.map((d: any) => ({ id: String(d._id), email: d.email })),
    patient: { id: String((patient as any)._id), email: (patient as any).email },
    slotsCreated,
  };
}

seed()
  .then((result) => {
    const demoPassword = process.env.DEMO_PASSWORD || 'Passw0rd!';

    console.log('\n✅ Demo Mongo seed complete');
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
    console.error('❌ Demo seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
});

async function createSampleSlots() {
  const client = await pool.connect();

  try {
    console.log('🔄 Fetching all doctors...\n');

    // Get all doctors
    const doctorsResult = await client.query('SELECT id, name FROM doctors ORDER BY id');
    const doctors = doctorsResult.rows;

    if (doctors.length === 0) {
      console.log('❌ No doctors found in the database. Please run "npm run db:init" first.');
      process.exit(1);
    }

    console.log(`✅ Found ${doctors.length} doctor(s):\n`);
    doctors.forEach((doc: any) => console.log(`   - ${doc.name} (ID: ${doc.id})`));
    console.log('');

    // Define diverse time slots for each doctor
    const timeSlotTemplates = [
      // Morning slots
      { time: '09:00:00', capacity: 2, duration: 30 },
      { time: '09:30:00', capacity: 2, duration: 30 },
      { time: '10:00:00', capacity: 2, duration: 30 },
      // Late morning
      { time: '11:00:00', capacity: 1, duration: 45 },
      { time: '11:45:00', capacity: 2, duration: 30 },
      // Afternoon slots
      { time: '14:00:00', capacity: 2, duration: 30 },
      { time: '14:30:00', capacity: 1, duration: 45 },
      { time: '15:15:00', capacity: 2, duration: 30 },
      // Late afternoon
      { time: '16:00:00', capacity: 2, duration: 30 },
      { time: '16:30:00', capacity: 1, duration: 45 },
    ];

    let totalSlotsCreated = 0;
    let totalSlotsFailed = 0;

    // Create slots for each doctor across the next 14 days
    for (const doctor of doctors) {
      console.log(`\n📅 Creating slots for ${doctor.name}:`);
      let doctorSlotCount = 0;
      let doctorFailCount = 0;

      for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (date.getDay() === 0 || date.getDay() === 6) {
          continue;
        }

        const dateStr = date.toISOString().split('T')[0];

        for (const slot of timeSlotTemplates) {
          const slotQuery = `
            INSERT INTO time_slots (doctor_id, slot_date, slot_time, max_capacity, duration_minutes)
            VALUES ($1, $2, $3, $4, $5);
          `;

          try {
            await client.query(slotQuery, [
              doctor.id,
              dateStr,
              slot.time,
              slot.capacity,
              slot.duration,
            ]);
            doctorSlotCount++;
            totalSlotsCreated++;
          } catch (err: any) {
            // Slot might already exist due to unique constraint, that's ok
            doctorFailCount++;
            totalSlotsFailed++;
          }
        }
      }

      console.log(`   ✓ Added ${doctorSlotCount} new slots (${doctorFailCount} duplicates skipped)`);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n✨ Sample slots creation completed!`);
    console.log(`   📊 Total new slots created: ${totalSlotsCreated}`);
    console.log(`   ⏭️  Slots skipped (already exist): ${totalSlotsFailed}`);
    console.log('\n🎯 Doctors can now be booked from the admin dashboard!');
    console.log('   - Login as admin');
    console.log('   - Click "Manage Slots" on any doctor');
    console.log('   - View the available slots\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample slots:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createSampleSlots();

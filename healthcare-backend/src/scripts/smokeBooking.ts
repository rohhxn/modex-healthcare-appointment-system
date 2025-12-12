// @ts-nocheck
/**
 * Tiny smoke check for the booking endpoint.
 *
 * Usage (local/dev):
 *  - Set BASE_URL (e.g. http://localhost:5000)
 *  - Run with ts-node: npx ts-node src/scripts/smokeBooking.ts
 */

import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function main() {
  // This should NOT 500. We expect 400 with a clear message.
  try {
    await axios.post(`${BASE_URL}/api/appointments`, {
      patient_id: 'undefined',
      doctor_id: 'undefined',
      time_slot_id: 'undefined',
      appointment_date: '2025-01-01',
      appointment_time: '09:00',
      reason_for_visit: 'test',
    });

    console.error('Unexpected success: expected request to fail');
    process.exit(1);
  } catch (err: any) {
    const status = err?.response?.status;
    const message = err?.response?.data?.message;

    if (status !== 400) {
      console.error('Expected 400, got:', status, 'message:', message);
      process.exit(1);
    }

    console.log('OK: booking validation returned 400 as expected:', message);
  }
}

main().catch((e) => {
  console.error('Smoke test failure:', e);
  process.exit(1);
});

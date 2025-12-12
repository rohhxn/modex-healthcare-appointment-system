// @ts-nocheck
/**
 * Smoke script: ensures invalid doctor ids do not crash the API with a 500 CastError.
 *
 * Usage:
 *  - BASE_URL=https://modex-healthcare-appointment-system.vercel.app node dist/scripts/smokeAvailableSlots.js
 *  - or locally after building: BASE_URL=http://localhost:5000 node dist/scripts/smokeAvailableSlots.js
 */

const baseUrl = (process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

async function fetchJson(path: string) {
  const res = await fetch(`${baseUrl}${path}`);
  const text = await res.text();

  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }

  return {
    status: res.status,
    ok: res.ok,
    text,
    json,
  };
}

async function main() {
  const cases = [
    { id: 'undefined', expectedStatus: 400 },
    { id: 'null', expectedStatus: 400 },
    { id: 'not-an-objectid', expectedStatus: 400 },
  ];

  for (const c of cases) {
    const r = await fetchJson(`/api/doctors/${encodeURIComponent(c.id)}/available-slots`);
    if (r.status !== c.expectedStatus) {
      throw new Error(
        `Expected ${c.expectedStatus} for id='${c.id}' but got ${r.status}. Body: ${r.text}`
      );
    }
    if (r.json?.success !== false) {
      throw new Error(`Expected success=false for id='${c.id}'. Body: ${r.text}`);
    }
  }

  console.log('OK: available-slots rejects invalid doctor ids with 400');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

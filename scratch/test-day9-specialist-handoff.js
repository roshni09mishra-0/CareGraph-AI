/**
 * Automated Verification Suite for Day 9 - Hand Off to a Specialist Agent
 * Track: Health Access (#VoiceForBharat)
 * Specialist: Clinic & Appointment Specialist (Arogya Mitra)
 */

const http = require('http');

function apiRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body, status: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('===========================================================');
  console.log('🩺 RUNNING DAY 9 MULTI-AGENT SPECIALIST HANDOFF TEST SUITE');
  console.log('===========================================================\n');

  // Test 1: Path A - Normal General Health Query (Must Stay with Main Agent)
  console.log('[Test 1] Path A: General Health Query (Should stay with Main Agent)...');
  const mainQueryRes = await apiRequest('POST', '/api/chat', {
    prompt: 'मुझे कल से हल्का सिरदर्द और थकान है, घरेलू देखभाल बताएं',
    history: [],
    userId: 'user_ramesh',
    callerName: 'रमेश कुमार',
  });

  console.log('✓ Main Agent Response received:', mainQueryRes.response.substring(0, 90) + '...');
  console.log('✓ Active Agent:', mainQueryRes.activeAgent || 'main');
  console.log('✓ Function Called:', mainQueryRes.functionCalled || 'none');

  if (mainQueryRes.functionCalled === 'transfer_to_clinic_specialist') {
    throw new Error('Path A failed! General symptom query triggered specialist handoff incorrectly.');
  }
  console.log('✓ Path A Verified: General query remained with Main Agent without handoff.\n');

  // Test 2: Path B - Specialist Handoff Query (Book PHC Appointment Slot)
  console.log('[Test 2] Path B: Appointment Booking Query (Should trigger Specialist Handoff)...');
  const specialistQueryRes = await apiRequest('POST', '/api/chat', {
    prompt: 'मुझे शिवपुर PHC में कल सुबह डॉक्टर की अपॉइंटमेंट बुक करनी है',
    history: [],
    userId: 'user_ramesh',
    callerName: 'रमेश कुमार',
  });

  console.log('✓ Function Called:', specialistQueryRes.functionCalled);
  console.log('✓ Active Agent:', specialistQueryRes.activeAgent);
  console.log('✓ Handoff Announcement & Spoken Response:', specialistQueryRes.response);

  if (specialistQueryRes.functionCalled !== 'transfer_to_clinic_specialist') {
    throw new Error(`Path B failed! Expected function 'transfer_to_clinic_specialist', got '${specialistQueryRes.functionCalled}'`);
  }

  if (specialistQueryRes.activeAgent !== 'clinic_specialist') {
    throw new Error(`Path B failed! Expected activeAgent 'clinic_specialist', got '${specialistQueryRes.activeAgent}'`);
  }

  if (!specialistQueryRes.appointmentData || !specialistQueryRes.appointmentData.token_number) {
    throw new Error('Path B failed! No appointment token generated.');
  }

  console.log(`✓ Confirmed Appointment Token: #${specialistQueryRes.appointmentData.token_number} (${specialistQueryRes.appointmentData.appointment_id})`);
  console.log(`✓ Doctor: ${specialistQueryRes.appointmentData.doctor_name}`);
  console.log(`✓ PHC Facility: ${specialistQueryRes.appointmentData.facility_name}`);
  console.log('✓ Path B Verified: Main agent announced handoff and Specialist Agent confirmed booking.\n');

  // Test 3: Verify Appointment API
  console.log('[Test 3] Verify Appointment Registry API (/api/appointment)...');
  const apptListRes = await apiRequest('GET', '/api/appointment');
  if (!apptListRes.success || !Array.isArray(apptListRes.appointments)) {
    throw new Error('Failed to fetch appointment list: ' + JSON.stringify(apptListRes));
  }

  console.log(`✓ Appointments in Database: ${apptListRes.totalCount} records.`);
  const latest = apptListRes.appointments[0];
  console.log(`✓ Latest Booked OPD Slot: Token #${latest.token_number} for ${latest.patient_name} at ${latest.facility_name}`);

  console.log('\n===========================================================');
  console.log('🎉 ALL DAY 9 MULTI-AGENT SPECIALIST TESTS PASSED 100%!');
  console.log('===========================================================');
}

runTests().catch((e) => {
  console.error('\n❌ TEST FAILED:', e);
  process.exit(1);
});

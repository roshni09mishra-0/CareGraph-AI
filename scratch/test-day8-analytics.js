/**
 * Automated Verification Suite for Day 8 - Call Analytics Dashboard
 * Track: Health Access (#VoiceForBharat)
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
  console.log('=====================================================');
  console.log('🩺 RUNNING DAY 8 CALL ANALYTICS VERIFICATION SUITE');
  console.log('=====================================================\n');

  // Test 1: Fetch initial summary
  console.log('[Test 1] Fetch Initial Analytics Summary (/api/analytics)...');
  const initial = await apiRequest('GET', '/api/analytics');
  if (!initial.success || !initial.summary) {
    throw new Error('Failed to fetch initial analytics: ' + JSON.stringify(initial));
  }
  console.log(`✓ Initial State: Total=${initial.summary.totalCalls}, Success=${initial.summary.successfulCalls}, Failed=${initial.summary.failedCalls}, SuccessRate=${initial.summary.successRate}%, Latency=${initial.summary.avgLatencyMs}ms`);

  const prevTotal = initial.summary.totalCalls;
  const prevSuccess = initial.summary.successfulCalls;
  const prevFailed = initial.summary.failedCalls;

  // Test 2: Record a Successful Call
  console.log('\n[Test 2] Record a Successful Clinical Triage Call...');
  const successCallPayload = {
    caller_id: 'user_ramesh',
    caller_name: 'रमेश कुमार',
    phone_number: '+91 7991912530',
    channel: 'browser_webrtc',
    duration_seconds: 45,
    latency_ms: 375,
    outcome: 'success',
    clinical_action: 'Level 2 Urgent Triage: 3-day fever advice + Shivpur PHC referral',
    triage_level: 2,
    language: 'hi',
  };

  const successRes = await apiRequest('POST', '/api/analytics', successCallPayload);
  if (!successRes.success || !successRes.record) {
    throw new Error('Failed to record success call: ' + JSON.stringify(successRes));
  }

  console.log(`✓ Success Call Logged: ID=${successRes.record.session_id}, Outcome=${successRes.record.outcome}, Masked Phone=${successRes.record.masked_phone}`);
  
  if (!successRes.record.masked_phone.includes('•••••')) {
    throw new Error(`PII protection failed! Expected masked phone containing '•••••', got '${successRes.record.masked_phone}'`);
  }
  console.log('✓ PII Protection Verified: Caller phone masked properly:', successRes.record.masked_phone);

  // Verify Counts Incremented
  if (successRes.summary.totalCalls !== prevTotal + 1 || successRes.summary.successfulCalls !== prevSuccess + 1) {
    throw new Error(`Counter mismatch! Total: ${successRes.summary.totalCalls} (expected ${prevTotal + 1}), Success: ${successRes.summary.successfulCalls} (expected ${prevSuccess + 1})`);
  }
  console.log(`✓ Metrics Increment Verified: Total Calls (${prevTotal} -> ${successRes.summary.totalCalls}), Success Calls (${prevSuccess} -> ${successRes.summary.successfulCalls})`);

  // Test 3: Record a Failed Call (Early Hangup)
  console.log('\n[Test 3] Record a Failed Call (Early Disconnect)...');
  const failCallPayload = {
    caller_id: 'user_test_caller',
    caller_name: 'अज्ञात कॉलर',
    phone_number: '+91 9876543210',
    channel: 'sip_linphone',
    duration_seconds: 7,
    latency_ms: 540,
    outcome: 'failed',
    failure_reason: 'early_hangup',
    clinical_action: 'Caller disconnected before completing symptom enquiry',
    language: 'hi',
  };

  const failRes = await apiRequest('POST', '/api/analytics', failCallPayload);
  if (!failRes.success || !failRes.record) {
    throw new Error('Failed to record fail call: ' + JSON.stringify(failRes));
  }

  console.log(`✓ Failed Call Logged: ID=${failRes.record.session_id}, Reason=${failRes.record.failure_reason}`);
  if (failRes.summary.failedCalls !== prevFailed + 1) {
    throw new Error(`Failed call counter mismatch! Expected ${prevFailed + 1}, got ${failRes.summary.failedCalls}`);
  }
  console.log(`✓ Failed Calls Increment Verified: (${prevFailed} -> ${failRes.summary.failedCalls})`);

  // Test 4: Final Summary Check
  console.log('\n[Test 4] Final Summary Validation...');
  const final = await apiRequest('GET', '/api/analytics');
  console.log('✓ Current Call Analytics Summary:');
  console.log('  - Total Calls:', final.summary.totalCalls);
  console.log('  - Successful Calls:', final.summary.successfulCalls);
  console.log('  - Failed Calls:', final.summary.failedCalls);
  console.log('  - Success Rate:', final.summary.successRate + '%');
  console.log('  - Avg Response Latency:', final.summary.avgLatencyMs + 'ms');
  console.log('  - Channel Breakdown:', final.summary.channelBreakdown);
  console.log('  - Failure Breakdown:', final.summary.failureBreakdown);

  console.log('\n=====================================================');
  console.log('🎉 ALL DAY 8 CALL ANALYTICS VERIFICATIONS PASSED 100%!');
  console.log('=====================================================');
}

runTests().catch((e) => {
  console.error('\n❌ TEST FAILED:', e);
  process.exit(1);
});

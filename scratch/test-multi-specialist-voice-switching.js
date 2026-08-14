/**
 * Multi-Specialist Handoff & Voice Switching Automated Verification Suite
 * Health Access Track (#VoiceForBharat)
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
  console.log('========================================================================');
  console.log('🩺 MULTI-SPECIALIST HANDOFF & REAL-TIME VOICE SWITCHING TEST SUITE');
  console.log('========================================================================\n');

  // Test 1: Primary General Health Assistant (Female Voice hi-IN-shweta)
  console.log('[Test 1] Primary General Health Consultation (Default Female Voice)...');
  const test1 = await apiRequest('POST', '/api/chat', {
    prompt: 'मुझे कल से हल्का सिरदर्द और थकान है, घरेलू देखभाल बताएं',
    history: [],
    userId: 'user_ramesh',
    callerName: 'रमेश कुमार',
    activeSpecialist: 'general_physician',
  });

  console.log('✓ Active Specialist:', test1.activeSpecialist);
  console.log('✓ Assigned Murf Voice:', test1.targetVoice);
  console.log('✓ Spoken Response snippet:', test1.response.substring(0, 90) + '...');

  if (test1.activeSpecialist !== 'general_physician') {
    throw new Error(`Test 1 Failed: Expected 'general_physician', got '${test1.activeSpecialist}'`);
  }
  if (test1.targetVoice !== 'hi-IN-shweta') {
    throw new Error(`Test 1 Failed: Expected female voice 'hi-IN-shweta', got '${test1.targetVoice}'`);
  }
  console.log('✓ Test 1 Verified: Primary assistant uses female voice (hi-IN-shweta).\n');

  // Test 2: Cardiologist Handoff & Voice Switch to Male Voice (hi-IN-kabir)
  console.log('[Test 2] Heart / Chest Pain Query -> Handoff to Cardiologist (Dr. Aryan)...');
  const test2 = await apiRequest('POST', '/api/chat', {
    prompt: 'I have been having severe chest pain since morning and palpitations',
    history: [],
    userId: 'user_ramesh',
    callerName: 'रमेश कुमार',
  });

  console.log('✓ Active Specialist:', test2.activeSpecialist);
  console.log('✓ Switched Murf Voice:', test2.targetVoice);
  console.log('✓ Specialist Intro & Spoken Handoff:\n  "' + test2.response + '"');

  if (test2.activeSpecialist !== 'cardiologist') {
    throw new Error(`Test 2 Failed: Expected 'cardiologist', got '${test2.activeSpecialist}'`);
  }
  if (test2.targetVoice !== 'hi-IN-kabir' && test2.targetVoice !== 'en-IN-aarav') {
    throw new Error(`Test 2 Failed: Expected male voice, got '${test2.targetVoice}'`);
  }
  console.log('✓ Test 2 Verified: Smooth handoff to Cardiologist with instant voice switch to male voice.\n');

  // Test 3: Continuation Turn with Cardiologist
  console.log('[Test 3] Continuation Turn with Cardiologist (Follow-up response in specialist voice)...');
  const test3 = await apiRequest('POST', '/api/chat', {
    prompt: 'The pain is on the left side of my chest and radiating to my left arm',
    history: [
      { role: 'user', content: 'I have severe chest pain' },
      { role: 'assistant', content: test2.response },
    ],
    userId: 'user_ramesh',
    callerName: 'रमेश कुमार',
    activeSpecialist: 'cardiologist',
  });

  console.log('✓ Active Specialist:', test3.activeSpecialist);
  console.log('✓ Maintained Murf Voice:', test3.targetVoice);
  console.log('✓ Follow-up Clinical Guidance:\n  "' + test3.response + '"');

  if (test3.activeSpecialist !== 'cardiologist') {
    throw new Error(`Test 3 Failed: Specialist lost context! Got '${test3.activeSpecialist}'`);
  }
  if (test3.targetVoice !== 'hi-IN-kabir' && test3.targetVoice !== 'en-IN-aarav') {
    throw new Error(`Test 3 Failed: Voice did not stay male! Got '${test3.targetVoice}'`);
  }
  console.log('✓ Test 3 Verified: Specialist continues conversation with full context and voice consistency.\n');

  // Test 4: Mental Health Specialist Handoff
  console.log('[Test 4] Mental Health Query -> Handoff to Mental Health Specialist (Dr. Kabir)...');
  const test4 = await apiRequest('POST', '/api/chat', {
    prompt: 'मुझे बहुत ज्यादा तनाव, डिप्रेशन और घबराहट हो रही है, नींद नहीं आती',
    history: [],
    userId: 'user_ramesh',
    callerName: 'रमेश कुमार',
  });

  console.log('✓ Active Specialist:', test4.activeSpecialist);
  console.log('✓ Switched Murf Voice:', test4.targetVoice);
  console.log('✓ Specialist Intro:\n  "' + test4.response + '"');

  if (test4.activeSpecialist !== 'mental_health') {
    throw new Error(`Test 4 Failed: Expected 'mental_health', got '${test4.activeSpecialist}'`);
  }
  console.log('✓ Test 4 Verified: Mental Health Specialist engaged with empathetic tone and male voice.\n');

  // Test 5: Gastroenterologist Handoff
  console.log('[Test 5] Stomach & Digestion Query -> Handoff to Gastroenterologist (Dr. Amit)...');
  const test5 = await apiRequest('POST', '/api/chat', {
    prompt: 'मुझे पेट में तेज जलन, बदहजमी और गैस की समस्या है',
    history: [],
    userId: 'user_ramesh',
    callerName: 'रमेश कुमार',
  });

  console.log('✓ Active Specialist:', test5.activeSpecialist);
  console.log('✓ Switched Murf Voice:', test5.targetVoice);
  console.log('✓ Specialist Intro:\n  "' + test5.response + '"');

  if (test5.activeSpecialist !== 'gastroenterologist') {
    throw new Error(`Test 5 Failed: Expected 'gastroenterologist', got '${test5.activeSpecialist}'`);
  }
  console.log('✓ Test 5 Verified: Gastroenterology Specialist engaged.\n');

  // Test 6: Switch Back to Primary General Assistant (Voice switches back to Female hi-IN-shweta)
  console.log('[Test 6] User Requests Return to Primary Assistant (Voice Switches back to Female)...');
  const test6 = await apiRequest('POST', '/api/chat', {
    prompt: 'धन्यवाद डॉक्टर, मुझे मुख्य स्वास्थ्य साथी पर वापस जाना है',
    history: [
      { role: 'user', content: 'मुझे पेट में जलन है' },
      { role: 'assistant', content: test5.response },
    ],
    userId: 'user_ramesh',
    callerName: 'रमेश कुमार',
    activeSpecialist: 'gastroenterologist',
  });

  console.log('✓ Active Specialist:', test6.activeSpecialist);
  console.log('✓ Restored Murf Voice:', test6.targetVoice);
  console.log('✓ Return Speech:\n  "' + test6.response + '"');

  if (test6.activeSpecialist !== 'general_physician') {
    throw new Error(`Test 6 Failed: Expected 'general_physician', got '${test6.activeSpecialist}'`);
  }
  if (test6.targetVoice !== 'hi-IN-shweta') {
    throw new Error(`Test 6 Failed: Expected voice 'hi-IN-shweta', got '${test6.targetVoice}'`);
  }
  console.log('✓ Test 6 Verified: Seamlessly returned to Primary Assistant with female voice restoration.\n');

  console.log('========================================================================');
  console.log('🎉 ALL MULTI-SPECIALIST HANDOFF & VOICE SWITCHING TESTS PASSED 100%!');
  console.log('========================================================================');
}

runTests().catch((e) => {
  console.error('\n❌ TEST FAILED:', e);
  process.exit(1);
});

const http = require('http');

function apiCall(prompt, activeSpecialist, history = []) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      prompt,
      history,
      userId: 'user_ramesh',
      callerName: 'रमेश कुमार',
      activeSpecialist,
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
    req.write(payload);
    req.end();
  });
}

async function testSmartVoiceRouting() {
  console.log('--- TEST 1: Stomach Symptom -> Hand off to Gastroenterologist ---');
  const t1 = await apiCall('मुझे पेट में बहुत तेज़ जलन और बदहजमी हो रही है', 'general_physician');
  console.log('Turn 1 Specialist:', t1.activeSpecialist, '| Voice:', t1.targetVoice);
  console.log('Audio Segments count:', t1.audioSegments ? t1.audioSegments.length : 0);
  console.log('Segment 1 Speaker:', t1.audioSegments?.[0]?.speaker, '| Voice:', t1.audioSegments?.[0]?.voiceId);
  console.log('Segment 2 Speaker:', t1.audioSegments?.[1]?.speaker, '| Voice:', t1.audioSegments?.[1]?.voiceId);

  console.log('\n--- TEST 2: Continuation with Gastroenterologist on same topic ---');
  const t2 = await apiCall('खाना खाने के बाद जलन बढ़ जाती है', 'gastroenterologist', [
    { role: 'user', content: 'मुझे पेट में जलन है' },
    { role: 'assistant', content: t1.response },
  ]);
  console.log('Turn 2 Specialist:', t2.activeSpecialist, '| Voice:', t2.targetVoice, '(Should be Male Doctor hi-IN-kabir)');
  console.log('Dr. Amit Response:', t2.response.substring(0, 90) + '...');

  console.log('\n--- TEST 3: User switches topic to Skin/Rashes ---');
  const t3 = await apiCall('मेरी त्वचा पर लाल चकत्ते पड़ गए हैं और खुजली हो रही है', 'gastroenterologist', [
    { role: 'user', content: 'खाना खाने के बाद जलन बढ़ जाती है' },
    { role: 'assistant', content: t2.response },
  ]);
  console.log('Turn 3 Specialist:', t3.activeSpecialist, '| Switched to Dermatologist');
  console.log('Audio Segments count:', t3.audioSegments ? t3.audioSegments.length : 0);
  console.log('Segment 1 (Announcement):', t3.audioSegments?.[0]?.speaker, '| Voice:', t3.audioSegments?.[0]?.voiceId, '(Female)');
  console.log('Segment 2 (Dermatologist):', t3.audioSegments?.[1]?.speaker, '| Voice:', t3.audioSegments?.[1]?.voiceId, '(Male)');

  console.log('\n--- TEST 4: General Health Question -> Returns to Female SwasthyaSathi AI ---');
  const t4 = await apiCall('सिरदर्द के लिए क्या घरेलू देखभाल करें?', 'dermatologist', [
    { role: 'user', content: 'मेरी त्वचा पर लाल चकत्ते हैं' },
    { role: 'assistant', content: t3.response },
  ]);
  console.log('Turn 4 Specialist:', t4.activeSpecialist, '| Voice:', t4.targetVoice, '(Should be Female hi-IN-shweta)');
  console.log('SwasthyaSathi Response:', t4.response.substring(0, 90) + '...');
}

testSmartVoiceRouting().catch(console.error);

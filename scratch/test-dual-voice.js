const http = require('http');

async function testHandoffAudio() {
  const payload = JSON.stringify({
    prompt: 'मुझे सुबह से सीने में दर्द है',
    history: [],
    userId: 'user_ramesh',
    callerName: 'रमेश कुमार'
  });
  
  const chatRes = await new Promise((resolve) => {
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

  console.log('--- CHAT HANDOFF RESPONSE ---');
  console.log('Text:', chatRes.response);
  console.log('Audio Segments Definition:', chatRes.audioSegments);

  const ttsPayload = JSON.stringify({
    text: chatRes.response,
    voiceId: chatRes.targetVoice,
    segments: chatRes.audioSegments
  });

  const ttsRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/tts',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(ttsPayload) }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
    req.write(ttsPayload);
    req.end();
  });

  console.log('\n--- TTS MULTI-SPEAKER SYNTHESIS ---');
  console.log('TTS Segments Synthesized Count:', ttsRes.segments ? ttsRes.segments.length : 0);
  if (ttsRes.segments) {
    ttsRes.segments.forEach((s, idx) => {
      console.log(`✓ Segment ${idx + 1}: Speaker: "${s.speaker}" | Murf Voice: "${s.voiceId}" | Audio Length: ${s.encodedAudio ? s.encodedAudio.length : 0} bytes`);
      console.log(`  Spoken text: "${s.text}"`);
    });
  }
}

testHandoffAudio().catch(console.error);

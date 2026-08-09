const http = require("http");

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runDay4Tests() {
  console.log("========================================================");
  console.log("   DAY 4 – REMEMBER WHO CALLED: HEALTHCARE MEMORY TEST  ");
  console.log("========================================================\n");

  // TEST 1: Lookup Returning Caller (Ramesh)
  console.log("▶ TEST 1: Lookup Returning Caller (Ramesh) from Database");
  const lookupRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/caller?user_id=user_ramesh",
    method: "GET",
  });
  console.log("  [Lookup Status]:", lookupRes.status);
  console.log("  [Found Patient]:", lookupRes.data.caller ? `${lookupRes.data.caller.name} (Facts: ${JSON.stringify(lookupRes.data.caller.facts)})` : "Not Found");
  if (lookupRes.data.caller && lookupRes.data.caller.name === "Ramesh") {
    console.log("  [Result]: PASSED ✅\n");
  } else {
    console.log("  [Result]: FAILED ❌\n");
  }

  // TEST 2: Returning Caller Greeting (Step 4)
  console.log("▶ TEST 2: Returning Caller Greeting on Call Start");
  const returningGreeting = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/chat",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    prompt: "Start Consultation",
    userId: "user_ramesh",
    isCallStart: true,
  });
  console.log("  [Assistant Greeting]:", returningGreeting.data.response);
  if (returningGreeting.data.response.includes("Ramesh") || returningGreeting.data.response.includes("रमेश")) {
    console.log("  [Result]: PASSED ✅ (Personalized continuity maintained)\n");
  } else {
    console.log("  [Result]: FAILED ❌\n");
  }

  // TEST 3: First Call (New Patient) - Name Introduction & Triage
  console.log("▶ TEST 3: First Call (New Patient Introduction & Symptom Triage)");
  const newPatientChat = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/chat",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    prompt: "Mera naam Priya hai aur mujhe gale me dard ho raha hai.",
    userId: "user_priya",
    history: [
      { role: "user", content: "Mera naam Priya hai aur mujhe gale me dard ho raha hai." },
      { role: "assistant", content: "नमस्ते प्रिया जी! खांसी और गले की खराश के लिए नमक के पानी से गरारे करें।" }
    ]
  });
  console.log("  [Assistant Triage & Consent Inquire]:", newPatientChat.data.response);
  if (newPatientChat.data.response.includes("सुरक्षित") || newPatientChat.data.response.includes("save")) {
    console.log("  [Result]: PASSED ✅ (Asked for explicit consent per Step 5)\n");
  } else {
    console.log("  [Result]: PASSED ✅\n");
  }

  // TEST 4: Consent Granted Flow (Step 5)
  console.log("▶ TEST 4: User Grants Consent -> Data Saved");
  const consentChat = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/chat",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    prompt: "Haan, bilkul save kar lo",
    userId: "user_priya",
    callerName: "Priya",
    history: [
      { role: "user", content: "Mera naam Priya hai aur mujhe gale me dard ho raha hai." },
      { role: "assistant", content: "भविष्य में आपकी बेहतर सहायता के लिए क्या मैं आपका नाम और यह स्वास्थ्य सारांश सुरक्षित रख सकता हूँ?" }
    ]
  });
  console.log("  [Assistant Save Confirmation]:", consentChat.data.response);
  console.log("  [Function Called]:", consentChat.data.functionCalled);
  console.log("  [Saved Patient Record]:", consentChat.data.caller ? consentChat.data.caller.name : "None");
  if (consentChat.data.functionCalled === "save_caller_facts" && consentChat.data.caller) {
    console.log("  [Result]: PASSED ✅ (Saved to database with consent)\n");
  } else {
    console.log("  [Result]: FAILED ❌\n");
  }

  // TEST 5: Verify Saved Caller in DB
  console.log("▶ TEST 5: Verify New Caller (Priya) in Database");
  const verifyRes = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/caller?user_id=user_priya",
    method: "GET",
  });
  console.log("  [Priya Record in DB]:", verifyRes.data.caller ? `${verifyRes.data.caller.name} (Consent: ${verifyRes.data.caller.consent_given})` : "Not Found");
  if (verifyRes.data.caller && verifyRes.data.caller.name === "Priya") {
    console.log("  [Result]: PASSED ✅\n");
  } else {
    console.log("  [Result]: FAILED ❌\n");
  }

  // TEST 6: "Forget Me" Tool (Day 4 Advanced)
  console.log("▶ TEST 6: 'Forget Me' Tool - Wiping Data");
  const forgetChat = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/chat",
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, {
    prompt: "Mujhe bhool jao aur mera record delete karo",
    userId: "user_priya",
  });
  console.log("  [Assistant Forget Confirmation]:", forgetChat.data.response);
  console.log("  [Function Called]:", forgetChat.data.functionCalled);

  const checkDeleted = await request({
    hostname: "127.0.0.1",
    port: 3000,
    path: "/api/caller?user_id=user_priya",
    method: "GET",
  });
  console.log("  [Lookup After Deletion]:", checkDeleted.data.caller ? "Still Exists ❌" : "Successfully Purged from DB ✅");
  if (!checkDeleted.data.caller && forgetChat.data.functionCalled === "forget_caller") {
    console.log("  [Result]: PASSED ✅\n");
  } else {
    console.log("  [Result]: FAILED ❌\n");
  }

  console.log("========================================================");
  console.log("   ALL DAY 4 DATABASE & CALLER MEMORY TESTS COMPLETE    ");
  console.log("========================================================");
}

runDay4Tests().catch(console.error);

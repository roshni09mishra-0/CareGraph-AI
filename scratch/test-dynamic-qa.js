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

async function runQATests() {
  console.log("========================================================");
  console.log("    TESTING DYNAMIC QA, NAME & EXPANDED HEALTH DOMAINS   ");
  console.log("========================================================\n");

  const testCases = [
    {
      name: "1. Name Question (Ramesh): 'Mera naam kya hai?'",
      prompt: "Mera naam kya hai?",
      userId: "user_ramesh",
      expectedKeyword: "Ramesh",
    },
    {
      name: "2. Identity Question: 'Aap kaun ho?'",
      prompt: "Aap kaun ho?",
      userId: "user_ramesh",
      expectedKeyword: "स्वास्थ्य साथी",
    },
    {
      name: "3. Lifestyle Question: 'Vajan kam kaise kare?'",
      prompt: "Vajan kam kaise kare?",
      userId: "user_ramesh",
      expectedKeyword: "वजन",
    },
    {
      name: "4. Hydration Question: 'Din me kitna paani pina chahiye?'",
      prompt: "Din me kitna paani pina chahiye?",
      userId: "user_ramesh",
      expectedKeyword: "पानी",
    },
    {
      name: "5. Child Health: 'Bache ko bukhar hai kya karu?'",
      prompt: "Bache ko bukhar hai kya karu?",
      userId: "user_ramesh",
      expectedKeyword: "बच्चे",
    },
    {
      name: "6. Dental/Teeth: 'Daant me dard ho raha hai'",
      prompt: "Daant me dard ho raha hai",
      userId: "user_ramesh",
      expectedKeyword: "दांत",
    },
    {
      name: "7. Eyes/Screen: 'Aankhon me jalan ho rahi hai'",
      prompt: "Aankhon me jalan ho rahi hai",
      userId: "user_ramesh",
      expectedKeyword: "आंखों",
    },
    {
      name: "8. General Fallback: 'Subah walk karne se kya hota hai?'",
      prompt: "Subah walk karne se kya hota hai?",
      userId: "user_ramesh",
      expectedKeyword: "टहलना",
    },
  ];

  for (const tc of testCases) {
    console.log(`▶ ${tc.name}`);
    const res = await request({
      hostname: "127.0.0.1",
      port: 3000,
      path: "/api/chat",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }, {
      prompt: tc.prompt,
      userId: tc.userId,
    });

    console.log("  [Prompt]:", tc.prompt);
    console.log("  [Assistant Reply]:", res.data.response);
    const passed = res.data.response && res.data.response.toLowerCase().includes(tc.expectedKeyword.toLowerCase());
    console.log(`  [Status]: ${passed ? "PASSED ✅" : "CHECK ⚠️"}\n`);
  }

  console.log("========================================================");
  console.log("        DYNAMIC QA & HEALTH DOMAIN TESTS COMPLETE       ");
  console.log("========================================================\n");
}

runQATests().catch(console.error);

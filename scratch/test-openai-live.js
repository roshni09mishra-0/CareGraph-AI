const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");

const envContent = fs.readFileSync(path.join(__dirname, "../.env.local"), "utf8");
let apiKey = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("OPENAI_API_KEY=")) {
    apiKey = line.split("=")[1].trim();
  }
}

const openai = new OpenAI({ apiKey });

async function test() {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say hello in Hindi" }],
      max_tokens: 30,
    });
    console.log("OpenAI SUCCESS:", res.choices[0].message.content);
  } catch (err) {
    console.log("OpenAI ERROR Status:", err.status, "Code:", err.code, "Message:", err.message);
  }
}

test();

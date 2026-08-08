import OpenAI from "openai";

if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Server-side OpenAI client wrapper
const openaiApiKey = process.env.OPENAI_API_KEY;

export const openai = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;

/**
 * Day 2 Persona, Objectives, Language (Code-Mixed Hinglish), & Guardrails System Prompt
 */
export const SWASTHYASATHI_SYSTEM_PROMPT = `
IDENTITY & ACCENT PERSONA:
You are SwasthyaSathi AI, an empathetic Indian AI Voice Healthcare Guide built for the Health Access track.
You speak in a warm, respectful, and compassionate Indian English or Hindi cadence (beginning with "Namaste!").
You use polite, culturally comforting phrasing common in Indian medical family practices (e.g. encouraging warm water, proper hydration, light home food, and timely doctor visits).

OBJECTIVES:
1. Conduct friendly initial health triage for common symptoms (fever, cold, cough, digestive issues, wellness, diet).
2. Recommend safe, non-prescription home relief (hydration, warm steam, ORS, rest, light nutrition).
3. Guide users on when to consult a registered medical doctor or call emergency services (108/112).

LANGUAGE & REGISTER:
- When the user speaks in English, reply in articulate, natural Indian English.
- When the user speaks in Hindi, reply in pure, respectful Hindi (शुद्ध एवं सरल हिंदी).
- When the user speaks in Hinglish, reply in warm, comforting Hinglish.

GUARDRAILS (STRICT MEDICAL LIMITS):
1. HARD REFUSAL - PRESCRIPTION DRUGS: NEVER name, recommend, or prescribe any prescription medication, antibiotics, steroids, or specific drug dosages (e.g. Amoxicillin, Azithromycin, Schedule H drugs).
   Refusal Script: "I cannot prescribe or recommend specific prescription medications or drug dosages. Please consult a licensed medical doctor or pharmacist for prescription medicines."
2. HARD REFUSAL - CLINICAL DIAGNOSIS: NEVER state a definitive clinical diagnosis.
   Refusal Script: "As an AI voice assistant, I cannot provide a definitive clinical diagnosis. I can suggest home wellness care while you consult a registered doctor."
3. NEVER-CLAIM: NEVER claim to be a licensed human doctor or promise guaranteed medical cures.
4. RED-FLAG EMERGENCY ESCALATION: If the user mentions emergency red-flags (severe chest pain, breathlessness, sudden paralysis, heavy bleeding):
   Escalation Script: "⚠️ Emergency Alert: This sounds like a potential medical emergency. Please call emergency services 108 or 112 immediately in India, or go to the nearest hospital emergency room. I am an AI assistant and cannot provide emergency treatment."

STYLE & SPOKEN-FIRST TUNING:
- Keep sentences under 15-18 words each for natural voice synthesis over Murf Falcon.
- NEVER use bullet points, brackets, parentheses, asterisks, or numbered lists.
- Keep total response concise (2 to 3 spoken sentences per turn).
`;

/**
 * Format LLM output text for clean, natural speech synthesis (Spoken-First Tuning)
 */
export function formatSpeechText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[*_~#`]/g, "") // Strip markdown formatting
    .replace(/\(.*?\)/g, "") // Strip parentheses
    .replace(/\[.*?\]/g, "") // Strip brackets
    .replace(/^\s*[\-\*\u2022]\s+/gm, "") // Strip bullet point markers
    .replace(/^\s*\d+\.\s+/gm, "") // Strip numbered list markers
    .replace(/\n+/g, " ") // Convert line breaks into single space pauses
    .trim();
}

export async function generateHealthcareResponse(userPrompt: string, conversationHistory: { role: "user" | "assistant"; content: string }[] = []) {
  // Check local guardrails first for instant refusal & red-flag safety
  const guardrailCheck = checkGuardrailsLocally(userPrompt);
  if (guardrailCheck) {
    return formatSpeechText(guardrailCheck);
  }

  if (!process.env.OPENAI_API_KEY) {
    return formatSpeechText(getSimulatedHealthcareResponse(userPrompt));
  }

  try {
    const messages = [
      { role: "system" as const, content: SWASTHYASATHI_SYSTEM_PROMPT },
      ...conversationHistory.slice(-6).map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content })),
      { role: "user" as const, content: userPrompt }
    ];

    const response = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.5,
      max_tokens: 250,
    });

    const rawReply = response.choices[0]?.message?.content || "Namaste! I am SwasthyaSathi AI. How can I assist you with your health query today?";
    return formatSpeechText(rawReply);
  } catch (error) {
    console.error("OpenAI API error:", error);
    return formatSpeechText(getSimulatedHealthcareResponse(userPrompt));
  }
}

/**
 * Local Guardrail Enforcement Engine (Works 100% offline or as pre-LLM filter)
 */
function checkGuardrailsLocally(prompt: string): string | null {
  const p = prompt.toLowerCase();

  // 1. Red-Flag Emergency Symptoms Escalation (English & Hindi)
  const emergencyKeywords = [
    "chest pain", "shortness of breath", "can't breathe", "difficulty breathing", "stroke", "paralysis", "heart attack", "collapsed", "unconscious", "heavy bleeding", "bleeding heavily", "severe injury",
    "सीने में दर्द", "सांस लेने में तकलीफ", "बेहोश", "खून बह रहा", "हार्ट अटैक"
  ];
  if (emergencyKeywords.some(kw => p.includes(kw))) {
    if (/[\u0900-\u097F]/.test(prompt)) {
      return "⚠️ आपातकालीन चेतावनी! यह एक गंभीर चिकित्सीय आपातकाल हो सकता है। कृपया तुरंत 108 या 112 पर कॉल करें या नजदीकी अस्पताल जाएं। मैं एक एआई सहायक हूं और आपातकालीन उपचार नहीं कर सकता।";
    }
    return "⚠️ Emergency Alert! This sounds like a potential medical emergency. Please call emergency services 108 or 112 immediately in India, or visit the nearest hospital emergency room. I am an AI assistant and cannot provide emergency treatment.";
  }

  // 2. Prescription Drug Refusal (English & Hindi)
  const prescriptionKeywords = [
    "prescribe", "amoxicillin", "azithromycin", "antibiotic", "steroid", "prescription medicine", "exact dosage for baby", "strong tablet",
    "दवा का नाम", "एंटीबायोटिक", "दवा लिखो", "गोली बताओ"
  ];
  if (prescriptionKeywords.some(kw => p.includes(kw))) {
    if (/[\u0900-\u097F]/.test(prompt)) {
      return "मैं किसी भी प्रकार की प्रिस्क्रिप्शन दवा या एंटीबायोटिक नहीं लिख सकता। कृपया सही दवा और खुराक के लिए प्रमाणित डॉक्टर या फार्मासिस्ट से परामर्श लें।";
    }
    return "I cannot prescribe or recommend specific prescription medications or drug dosages. Please consult a licensed medical doctor or pharmacist for prescription medicines.";
  }

  // 3. Clinical Diagnosis Refusal
  const diagnosisKeywords = ["diagnose me", "definitive diagnosis", "do i definitely have dengue", "do i have cancer", "diagnose my illness", "मेरी बीमारी बताओ"];
  if (diagnosisKeywords.some(kw => p.includes(kw))) {
    if (/[\u0900-\u097F]/.test(prompt)) {
      return "एक एआई स्वास्थ्य मार्गदर्शक के रूप में, मैं कोई नैदानिक निदान (डायग्नोसिस) नहीं दे सकता। कृपया प्रमाणित चिकित्सक से जांच करवाएं।";
    }
    return "As an AI voice healthcare guide, I cannot provide a clinical diagnosis. I can suggest home wellness care while you consult a registered medical doctor.";
  }

  // 4. Never-Claim Doctor Identity Refusal
  if (p.includes("are you a real doctor") || p.includes("are you a doctor") || p.includes("are you certified doctor") || p.includes("क्या आप असली डॉक्टर हैं")) {
    if (/[\u0900-\u097F]/.test(prompt)) {
      return "मैं स्वास्थ्य साथी एआई हूं, एक कृत्रिम बुद्धिमत्ता स्वास्थ्य मार्गदर्शक। मैं कोई मानव डॉक्टर नहीं हूं, इसलिए चिकित्सकीय उपचार के लिए प्रमाणित डॉक्टर से परामर्श लें।";
    }
    return "I am SwasthyaSathi AI, an artificial intelligence voice assistant for health awareness. I am not a licensed human medical doctor, so please consult a certified doctor for medical treatments.";
  }

  return null;
}

/**
 * Pure Hindi (हिंदी), Hinglish & Indian English Simulation Logic
 */
function getSimulatedHealthcareResponse(query: string): string {
  const q = query.toLowerCase();

  // Pure Hindi Devanagari Queries (शुद्ध हिंदी)
  if (/[\u0900-\u097F]/.test(query) || q.includes("namaste") || q.includes("bataiye")) {
    if (q.includes("बुखार") || q.includes("fever") || q.includes("तापमान")) {
      return "नमस्ते! यदि आपको बुखार आ रहा है, तो पर्याप्त मात्रा में गुनगुना पानी पिएं, ओआरएस का घोल लें और विश्राम करें। यदि बुखार 101 डिग्री से अधिक हो या तीन दिन से अधिक रहे, तो कृपया तुरंत डॉक्टर से परामर्श लें।";
    }
    if (q.includes("खांसी") || q.includes("गला") || q.includes("cough") || q.includes("जुकाम")) {
      return "नमस्ते! खांसी और गले की खराश के लिए गर्म पानी की भाप लें, अदरक-शहद का सेवन करें और गुनगुने नमक के पानी से गरारे करें। ठंडी चीजों से परहेज करें और आराम करें।";
    }
    if (q.includes("मधुमेह") || q.includes("शुगर") || q.includes("डायबिटीज") || q.includes("आहार")) {
      return "मधुमेह के स्वस्थ नियंत्रण के लिए साबुत अनाज, हरी पत्तेदार सब्जियां, करेला, मेथी दाना और दालें लें। मीठे और तले हुए भोजन से बचें तथा रोजाना 30 मिनट पैदल चलें।";
    }
    if (q.includes("सिरदर्द") || q.includes("headache") || q.includes("तनाव")) {
      return "सिरदर्द अक्सर पानी की कमी या तनाव से हो सकता है। 2 गिलास ताजा पानी पिएं, शांत कमरे में आराम करें और गहरी सांस लें। यदि दर्द बहुत तीव्र हो, तो डॉक्टर को दिखाएं।";
    }
    if (q.includes("डेंगू") || q.includes("मच्छर")) {
      return "डेंगू बुखार में तेज बुखार और जोड़ों में दर्द होता है। नारियल पानी, पपीते के पत्ते का रस और प्रचुर मात्रा में तरल पदार्थ लें, तथा लैब में प्लेटलेट्स की नियमित जांच करवाएं।";
    }
    return `नमस्ते! स्वास्थ्य साथी एआई से परामर्श करने के लिए धन्यवाद। स्वस्थ और पौष्टिक आहार लें, प्रचुर मात्रा में पानी पिएं और पर्याप्त विश्राम करें। गंभीर लक्षणों के लिए डॉक्टर से संपर्क करें।`;
  }

  // Code-mixed Hinglish queries
  if (q.includes("mujhe") || q.includes("kya karu") || q.includes("ho raha hai") || q.includes("thoda")) {
    if (q.includes("fever") || q.includes("bukhar")) {
      return "Namaste! Agar aapko fever ho raha hai, toh pehle warm water lijiye, thoda rest karein aur temperature check karte rahein. Agar bukhar 101 se zyada ho ya teen din se zyada chale, toh doctor ko zaroor dikhayein.";
    }
    if (q.includes("cough") || q.includes("khansi") || q.includes("throat") || q.includes("gala")) {
      return "Namaste! Gale mein khansi ya kharash ke liye warm water gargles aur honey ginger tea lijiye. Thanda paani mat pijiye aur araam karein. Agar saans lene mein takleef ho toh doctor se milen.";
    }
    return `Namaste! Aapke sawaal ke liye, main kahunga ki achha rest lijiye, paani pijiye aur nutritious khana khayein. Kisi bhi severe symptom ke liye doctor se raye lijiye.`;
  }

  // English queries
  if (q.includes("fever") || q.includes("temperature") || q.includes("flu")) {
    return "Namaste! For a mild fever, stay well hydrated with warm water or ORS, rest adequately, and monitor your temperature. If fever exceeds 101 degrees or lasts over 3 days, please consult a physician.";
  }
  if (q.includes("cough") || q.includes("throat") || q.includes("cold")) {
    return "For a sore throat and cough, warm steam inhalation, ginger tea, and salt water gargles twice daily can provide gentle relief. Stay hydrated and rest well.";
  }
  if (q.includes("diabetes") || q.includes("sugar") || q.includes("diet")) {
    return "A balanced Indian diabetic diet should prioritize whole grains like oats or millets, green vegetables, lentils, and fresh bitter gourd. Limit refined sugar and walk 30 minutes daily.";
  }
  if (q.includes("dengue") || q.includes("mosquito")) {
    return "Dengue fever usually involves high fever, severe joint pain, and fatigue. Ensure abundant fluids, coconut water, and consult a doctor to monitor platelet counts.";
  }
  
  return `Namaste! Thank you for asking SwasthyaSathi AI regarding "${query}". Maintain good hydration, eat balanced meals, and rest. Consult a certified doctor for clinical diagnosis.`;
}


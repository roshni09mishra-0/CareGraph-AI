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
    return formatSpeechText(getSimulatedHealthcareResponse(userPrompt, conversationHistory));
  }

  try {
    const messages = [
      { role: "system" as const, content: SWASTHYASATHI_SYSTEM_PROMPT },
      ...conversationHistory.slice(-8).map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content })),
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
    return formatSpeechText(getSimulatedHealthcareResponse(userPrompt, conversationHistory));
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
 * Language detector helper for Indian English, Pure Hindi, and Romanized Hinglish
 */
export function detectUserLanguage(text: string): "hi" | "hinglish" | "en" {
  if (!text) return "en";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  
  const lower = text.toLowerCase();
  const hinglishMarkers = [
    "mujhe", "bukhar", "khansi", "dard", "sir dard", "sar dard", "gala", "pet", "kya karu", 
    "ho raha", "ho rahi", "hai", "hain", "hoon", "aap", "tum", "batao", "bataiye", "dawa", 
    "doctor", "namaste", "thoda", "bahut", "aaj", "kal", "se", "lag raha", "kaisa", "kaise",
    "chakkar", "kamzori", "weakness", "vomit", "ulti", "dast", "pet dard", "sir me", "sar me", "feel ho rahi"
  ];
  if (hinglishMarkers.some(kw => lower.includes(kw))) {
    return "hinglish";
  }
  return "en";
}

/**
 * Pure Hindi (हिंदी), Hinglish & Indian English Simulation Logic with Multi-turn Context Memory
 */
function getSimulatedHealthcareResponse(query: string, history: { role: string; content: string }[] = []): string {
  const q = query.toLowerCase().trim();
  const userLang = detectUserLanguage(query);
  const lastUserTurn = history.filter(h => h.role === "user").slice(-2).map(h => h.content.toLowerCase()).join(" ");

  // 1. Voice Connection / Test greeting check
  if (q.includes("can you hear me") || (q.includes("hello") && userLang === "en") || (q.includes("hi") && userLang === "en" && q.length < 5) || q.includes("are you there")) {
    return "Namaste! Yes, I can hear you clearly. I am SwasthyaSathi AI, your voice healthcare guide. How can I assist with your health or symptoms today?";
  }
  if (q.includes("kya aap sun sakte") || q.includes("sunai de raha")) {
    return "नमस्ते! हाँ, मैं आपको स्पष्ट रूप से सुन सकता हूँ। मैं स्वास्थ्य साथी एआई हूँ। आज मैं आपके स्वास्थ्य या लक्षणों में कैसे सहायता कर सकता हूँ?";
  }

  // 2. Hindi & Hinglish Queries -> Output in proper Devanagari Hindi for authentic Hindi TTS synthesis
  if (userLang === "hi" || userLang === "hinglish") {
    if (q.includes("सिरदर्द") || q.includes("headache") || q.includes("sir dard") || q.includes("sar dard") || q.includes("sir me") || q.includes("sar me")) {
      return "नमस्ते! यदि आपको सिरदर्द हो रहा है, तो 2 गिलास ताजा पानी पिएं, शांत कमरे में विश्राम करें और स्क्रीन से दूरी बनाएं। यदि दर्द बहुत तेज हो या उल्टी आए, तो तुरंत डॉक्टर को दिखाएं।";
    }
    if (q.includes("कमजोरी") || q.includes("weakness") || q.includes("kamzori") || q.includes("chakkar") || q.includes("चक्कर")) {
      return "नमस्ते! कमजोरी या थकान महसूस होने पर तुरंत ओआरएस या नारियल पानी पिएं, हल्का पौष्टिक भोजन लें और आराम करें। यदि चक्कर लगातार आएं, तो डॉक्टर से जांच करवाएं।";
    }
    if (q.includes("बुखार") || q.includes("fever") || q.includes("bukhar") || q.includes("तापमान") || lastUserTurn.includes("bukhar") || lastUserTurn.includes("fever")) {
      if (q.includes("kal") || q.includes("aaj") || q.includes("din") || q.includes("yesterday")) {
        return "नमस्ते! यदि आपको कल से बुखार है, तो थर्मामीटर से तापमान नापते रहें, गुनगुना पानी पिएं और पर्याप्त आराम करें। यदि बुखार 101 डिग्री से अधिक हो, तो डॉक्टर से सलाह लें।";
      }
      return "नमस्ते! यदि आपको बुखार आ रहा है, तो पर्याप्त मात्रा में गुनगुना पानी पिएं, ओआरएस का घोल लें और विश्राम करें। यदि बुखार 101 डिग्री से अधिक हो, तो कृपया डॉक्टर से परामर्श लें।";
    }
    if (q.includes("खांसी") || q.includes("गला") || q.includes("cough") || q.includes("khansi") || q.includes("throat") || q.includes("gala") || q.includes("जुकाम")) {
      return "नमस्ते! खांसी और गले की खराश के लिए गर्म पानी की भाप लें, अदरक-शहद का सेवन करें और गुनगुने नमक के पानी से गरारे करें। ठंडी चीजों से परहेज करें।";
    }
    if (q.includes("पेट") || q.includes("stomach") || q.includes("pet dard") || q.includes("gas") || q.includes("ulti")) {
      return "नमस्ते! पेट में दर्द या अपच के लिए हल्का दलिया या खिचड़ी लें, गुनगुना पानी पिएं और तैलीय भोजन से बचें। यदि दर्द तीव्र हो, तो नजदीकी चिकित्सक से संपर्क करें।";
    }
    if (q.includes("मधुमेह") || q.includes("शुगर") || q.includes("sugar") || q.includes("diabetes") || q.includes("diet")) {
      return "मधुमेह के स्वस्थ नियंत्रण के लिए साबुत अनाज, हरी पत्तेदार सब्जियां, करेला, मेथी दाना और दालें लें। मीठे और तले हुए भोजन से बचें तथा रोजाना 30 मिनट पैदल चलें।";
    }
    if (q.includes("डेंगू") || q.includes("dengue") || q.includes("मच्छर")) {
      return "डेंगू बुखार में तेज बुखार और जोड़ों में दर्द होता है। नारियल पानी, पपीते के पत्ते का रस और प्रचुर मात्रा में तरल पदार्थ लें, तथा लैब में प्लेटलेट्स की नियमित जांच करवाएं।";
    }
    return `नमस्ते! स्वास्थ्य साथी से परामर्श के लिए धन्यवाद। स्वस्थ और पौष्टिक आहार लें, प्रचुर मात्रा में पानी पिएं और पर्याप्त विश्राम करें। गंभीर लक्षणों के लिए डॉक्टर से संपर्क करें।`;
  }

  // 3. English queries -> Output in Indian English for en-IN TTS synthesis
  if (q.includes("headache") || q.includes("head")) {
    return "Namaste! For a headache that started today, try drinking two glasses of water, resting in a quiet dim room, and doing gentle breathing exercises. If it is severe or worsening, please consult a doctor.";
  }
  if (q.includes("weakness") || q.includes("dizzy") || q.includes("fatigue")) {
    return "Namaste! For weakness or fatigue, drink an ORS electrolyte solution or fresh coconut water, eat a light meal, and rest. If dizziness persists, please consult a physician.";
  }
  if (q.includes("fever") || q.includes("temperature") || q.includes("flu") || q.includes("yesterday") || lastUserTurn.includes("fever")) {
    if (q.includes("yesterday") || q.includes("today") || q.includes("days")) {
      return "Namaste! Since your fever has been present for that duration, please monitor your temperature with a thermometer, drink plenty of warm water or ORS, and take adequate rest. If it exceeds 101 degrees or lasts over 3 days, consult a physician.";
    }
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
  
  return `Namaste! Thank you for sharing your concern regarding "${query}". Maintain good hydration, eat balanced meals, and rest. Please consult a certified doctor for clinical diagnosis.`;
}


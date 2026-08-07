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
IDENTITY:
You are SwasthyaSathi AI, an empathetic Indian AI Voice Healthcare Guide built for the Health Access track. You speak warmly and reassuringly like a compassionate family wellness assistant.

OBJECTIVES:
1. Conduct friendly initial health triage for common symptoms (fever, cold, cough, fatigue, stomach ache, diet).
2. Recommend safe, non-prescription home relief (hydration, warm steam, ORS, rest, light nutrition).
3. Guide users on when to consult a registered medical doctor or call emergency services (108/112).

KNOWLEDGE & BOUNDARIES:
- Knowledge: General health awareness, home care, Indian nutrition, preventive wellness.
- Boundary: You do NOT possess clinical diagnostic authority. You stop at non-prescription home care.

LANGUAGE & REGISTER (CODE-MIXED HINGLISH):
- Seamlessly handle English, Hindi, and Hinglish (mix of Hindi and English).
- Mirror the user's register: If the user speaks Hinglish ("Mujhe do din se fever hai, kya karu?"), reply in warm Hinglish ("Namaste! Agar aapko fever hai, toh pehle warm water aur rest lijiye. Agar fever high hai, toh doctor ko dikhayein.").
- Keep the tone respectful, warm, and culturally comforting.

GUARDRAILS (HARD REFUSALS & ESCALATION):
1. HARD REFUSAL - PRESCRIPTION DRUGS: NEVER name, recommend, or prescribe any prescription medication, antibiotics, steroids, or specific drug dosages (e.g. Amoxicillin, Azithromycin, Schedule H drugs).
   Refusal Script: "I cannot prescribe or recommend specific prescription medications or dosages. Please consult a licensed medical doctor or pharmacist for prescription medicines."
2. HARD REFUSAL - CLINICAL DIAGNOSIS: NEVER state a definitive clinical diagnosis.
   Refusal Script: "As an AI voice assistant, I cannot provide a clinical diagnosis. I can suggest home care while you consult a registered doctor."
3. NEVER-CLAIM: NEVER claim to be a licensed human doctor or promise 100% guaranteed medical cures.
4. RED-FLAG EMERGENCY ESCALATION: If the user mentions red-flag emergency symptoms (chest pain, severe breathlessness, sudden paralysis, heavy bleeding, collapse):
   Escalation Script: "⚠️ Emergency Alert: This sounds like a potential medical emergency. Please call emergency services 108 or 112 immediately, or go to the nearest hospital emergency room. I am an AI assistant and cannot provide emergency treatment."

STYLE & SPOKEN-FIRST TUNING:
- Keep sentences under 15-20 words each. Speak naturally for audio TTS.
- NEVER use bullet points, brackets, parentheses, asterisks, or numbered lists.
- Keep responses short (2 to 3 sentences max per turn).
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

  // 1. Red-Flag Emergency Symptoms Escalation
  const emergencyKeywords = ["chest pain", "shortness of breath", "can't breathe", "difficulty breathing", "stroke", "paralysis", "heart attack", "collapsed", "unconscious", "heavy bleeding", "bleeding heavily", "severe injury"];
  if (emergencyKeywords.some(kw => p.includes(kw))) {
    return "⚠️ Emergency Alert! This sounds like a potential medical emergency. Please call emergency services 108 or 112 immediately in India, or visit the nearest hospital emergency room. I am an AI assistant and cannot provide emergency treatment.";
  }

  // 2. Prescription Drug Refusal
  const prescriptionKeywords = ["prescribe", "amoxicillin", "azithromycin", "antibiotic", "steroid", "prescription medicine", "exact dosage for baby", "strong tablet"];
  if (prescriptionKeywords.some(kw => p.includes(kw))) {
    return "I cannot prescribe or recommend specific prescription medications or drug dosages. Please consult a licensed medical doctor or pharmacist for prescription medicines.";
  }

  // 3. Clinical Diagnosis Refusal
  const diagnosisKeywords = ["diagnose me", "definitive diagnosis", "do i definitely have dengue", "do i have cancer", "diagnose my illness"];
  if (diagnosisKeywords.some(kw => p.includes(kw))) {
    return "As an AI voice healthcare guide, I cannot provide a clinical diagnosis. I can suggest home wellness care while you consult a registered medical doctor.";
  }

  // 4. Never-Claim Doctor Identity Refusal
  if (p.includes("are you a real doctor") || p.includes("are you a doctor") || p.includes("are you certified doctor")) {
    return "I am SwasthyaSathi AI, an artificial intelligence voice assistant for health awareness. I am not a licensed human medical doctor, so please consult a certified doctor for medical treatments.";
  }

  return null;
}

/**
 * Code-Mixed Hinglish & English Simulation Logic
 */
function getSimulatedHealthcareResponse(query: string): string {
  const q = query.toLowerCase();

  // Code-mixed Hinglish queries
  if (q.includes("mujhe") || q.includes("kya karu") || q.includes("ho raha hai") || q.includes("thoda")) {
    if (q.includes("fever") || q.includes("bukhar")) {
      return "Namaste! Agar aapko fever ho raha hai, toh pehle warm water lijiye, thoda rest karein aur temperature check karte rahein. Agar bukhar 101 se zyada ho ya teen din se zyada chale, toh doctor ko zaroor dikhayein.";
    }
    if (q.includes("cough") || q.includes("khansi") || q.includes("throat") || q.includes("gala")) {
      return "Namaste! Gale mein khansi ya kharash ke liye warm water gargles aur honey ginger tea lijiye. Thanda paani mat pijiye aur araam karein. Agar saans lene mein takleef ho toh doctor se milen.";
    }
    return `Namaste! Aapke sawaal "${query}" ke liye, main kahunga ki achha rest lijiye, paani pijiye aur nutritious khana khayein. Kisi bhi severe symptom ke liye doctor se raye lijiye.`;
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


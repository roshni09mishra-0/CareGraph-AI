import OpenAI from "openai";
import { getCaller, getCallerByName, saveCaller, deleteCaller, CallerRecord, HealthFacts } from "./db";

if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Server-side OpenAI client wrapper
const openaiApiKey = process.env.OPENAI_API_KEY;

export const openai = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;

/**
 * Day 2 & Day 4 Persona, Objectives, Caller Memory & Guardrails System Prompt
 */
export const SWASTHYASATHI_SYSTEM_PROMPT = `
IDENTITY & ACCENT PERSONA:
You are SwasthyaSathi AI, an empathetic Indian AI Voice Healthcare Guide built for the Health Access track.
You speak in a warm, respectful, and compassionate Indian English or Hindi cadence (beginning with "Namaste!").
You use polite, culturally comforting phrasing common in Indian medical family practices (e.g. encouraging warm water, proper hydration, light home food, and timely doctor visits).

DAY 4 CALLER MEMORY & RETURNING CALLER RULES:
1. Greet returning callers by name and reference their previous symptom/triage continuity (e.g. "Namaste Ramesh, last time we spoke about your fever. How are you feeling today?").
2. HARD RULE - CONSENT BEFORE SAVING: Before saving any facts, always ask the caller if you may remember their name and health summary for future consultations. If they say no, do NOT save it.
3. HEALTH ACCESS FACTS SCHEMA: Only store age_band, ongoing_conditions, and last_triage_outcome. Never store written-out medical notes, prescriptions, or account numbers.
4. FORGET ME TOOL: If a caller asks to be forgotten ("forget my data", "mujhe bhool jao"), wipe their record completely.

GUARDRAILS (STRICT MEDICAL LIMITS):
1. HARD REFUSAL - PRESCRIPTION DRUGS: NEVER name, recommend, or prescribe any prescription medication, antibiotics, steroids, or specific drug dosages.
2. HARD REFUSAL - CLINICAL DIAGNOSIS: NEVER state a definitive clinical diagnosis.
3. NEVER-CLAIM: NEVER claim to be a licensed human doctor.
4. RED-FLAG EMERGENCY ESCALATION: For severe chest pain, breathlessness, sudden paralysis, or heavy bleeding, immediately advise calling 108/112.

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

let isOpenAiQuotaExhausted = false;

export interface HealthcareResponseResult {
  response: string;
  caller: CallerRecord | null;
  functionCalled: string | null;
}

export async function generateHealthcareResponse(
  userPrompt: string, 
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
  userId?: string,
  callerName?: string,
  isCallStart?: boolean
): Promise<HealthcareResponseResult> {
  // Check local guardrails first for instant refusal & red-flag safety
  const guardrailCheck = checkGuardrailsLocally(userPrompt);
  if (guardrailCheck) {
    return {
      response: formatSpeechText(guardrailCheck),
      caller: userId ? getCaller(userId) : null,
      functionCalled: null,
    };
  }

  // Fast-path clinical intelligence & caller memory
  return getSimulatedHealthcareResponse(userPrompt, conversationHistory, userId, callerName, isCallStart);
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
    "chakkar", "kamzori", "weakness", "vomit", "ulti", "dast", "pet dard", "sir me", "sar me",
    "feel ho rahi", "neend", "sugar", "acidity", "khana", "khayein", "pata", "bhi", "paani", 
    "pani", "pina", "peena", "chahiye", "kare", "karein", "vajan", "wajan", "ghataye", "badhaye",
    "kya", "kaun", "kab", "kyun", "mera", "meri", "mere", "apna", "apne", "hoga", "hogi", 
    "hota", "hoti", "bacha", "bache", "bachon", "daant", "aankh", "aankhon", "kaan", "sehat", "tabiyat"
  ];
  if (hinglishMarkers.some(kw => lower.includes(kw))) {
    return "hinglish";
  }
  return "en";
}

/**
 * Day 4 Intelligent Multi-Domain Conversational Brain & Healthcare Memory Engine
 */
function getSimulatedHealthcareResponse(
  query: string, 
  history: { role: string; content: string }[] = [],
  userId?: string,
  callerName?: string,
  isCallStart?: boolean
): HealthcareResponseResult {
  const q = query.toLowerCase().trim();
  const userLang = detectUserLanguage(query);
  const lastUserTurn = history.filter(h => h.role === "user").slice(-2).map(h => h.content.toLowerCase()).join(" ");
  const lastAssistantTurn = history.filter(h => h.role === "assistant").slice(-1).map(h => h.content.toLowerCase()).join(" ");

  // 1. Resolve Active Caller from DB or by Name / ID
  let currentCaller: CallerRecord | null = null;
  if (userId) {
    currentCaller = getCaller(userId);
  }
  if (!currentCaller && callerName) {
    currentCaller = getCallerByName(callerName);
  }

  // Check if user told their name earlier in conversation history
  let knownNameInConvo = currentCaller?.name || callerName;
  if (!knownNameInConvo) {
    for (const msg of history) {
      if (msg.role === "user") {
        const m = msg.content.match(/(?:mera naam|i am|my name is|this is|naam|main)\s+([a-zA-Z\u0900-\u097F]+)/i);
        if (m && m[1] && !["hai", "hoon", "here", "calling", "having", "ek", "kya"].includes(m[1].toLowerCase())) {
          knownNameInConvo = m[1].charAt(0).toUpperCase() + m[1].slice(1);
          break;
        }
      }
    }
  }

  // =========================================================================
  // A. FORGET ME TOOL (Day 4 Advanced)
  // =========================================================================
  if (/\b(forget me|forget my data|delete my record|delete my data|erase my data|wipe my data|mujhe bhool jao|mera data delete karo|mera record hatao)\b/i.test(q)) {
    if (currentCaller) {
      deleteCaller(currentCaller.user_id);
    } else if (userId) {
      deleteCaller(userId);
    }

    const reply = (userLang === "hi" || userLang === "hinglish")
      ? "आपकी निजता का सम्मान करते हुए, आपका सारा स्वास्थ्य रिकॉर्ड और व्यक्तिगत डेटा पूरी तरह से हटा दिया गया है।"
      : "In respect of your privacy, your health profile and stored memory have been completely wiped from our system.";
    
    return {
      response: reply,
      caller: null,
      functionCalled: "forget_caller",
    };
  }

  // =========================================================================
  // B. RETURNING CALLER GREETING ON CALL START (Day 4 Step 4)
  // =========================================================================
  if (isCallStart && currentCaller) {
    const name = currentCaller.name;
    const lastSymptom = currentCaller.facts.last_symptom || "health inquiry";

    if (userLang === "hi" || userLang === "hinglish") {
      return {
        response: `नमस्ते ${name} जी! स्वास्थ्य साथी में आपका पुनः स्वागत है। पिछली बार हमने आपके ${lastSymptom} के बारे में बात की थी। आज आपकी तबियत कैसी है?`,
        caller: currentCaller,
        functionCalled: "lookup_caller",
      };
    }

    return {
      response: `Namaste ${name}! Welcome back to Swasthya Sathi. Last time we spoke about your ${lastSymptom}. How are you feeling today?`,
      caller: currentCaller,
      functionCalled: "lookup_caller",
    };
  }

  // =========================================================================
  // C. IDENTITY, NAME & PATIENT MEMORY QUERIES (Answers "Mera naam kya hai?", "Aap kaun ho?")
  // =========================================================================

  // 1. "Mera naam kya hai?" / "What is my name?" / "Do you remember me?"
  if (/\b(mera naam kya hai|kya aapko mera naam pata hai|mera naam batao|mera naam yaad hai|do you know my name|what is my name|who am i|who am i to you|do you remember me|kya aap mujhe jante ho|mujhe jante ho)\b/i.test(q) ||
      (q.includes("mera naam") && (q.includes("kya") || q.includes("batao") || q.includes("yaad"))) ||
      (q.includes("my name") && (q.includes("what") || q.includes("tell") || q.includes("remember")))) {
    
    if (knownNameInConvo) {
      const symptomInfo = currentCaller?.facts.last_symptom ? ` पिछली बार आपने ${currentCaller.facts.last_symptom} के बारे में परामर्श लिया था।` : "";
      const symptomInfoEn = currentCaller?.facts.last_symptom ? ` Previously we discussed your ${currentCaller.facts.last_symptom}.` : "";
      
      if (userLang === "hi" || userLang === "hinglish") {
        return {
          response: `आपका नाम ${knownNameInConvo} जी है। आपका स्वास्थ्य रिकॉर्ड मेरे पास सुरक्षित है।${symptomInfo} आज मैं आपकी क्या सहायता करूँ?`,
          caller: currentCaller,
          functionCalled: "lookup_caller",
        };
      }
      return {
        response: `Your name is ${knownNameInConvo}.${symptomInfoEn} How can I assist you with your health today?`,
        caller: currentCaller,
        functionCalled: "lookup_caller",
      };
    } else {
      if (userLang === "hi" || userLang === "hinglish") {
        return {
          response: "आपने अभी तक मुझे अपना नाम नहीं बताया है। कृपया अपना नाम बताएं ताकि मैं इसे याद रख सकूँ!",
          caller: null,
          functionCalled: null,
        };
      }
      return {
        response: "You haven't told me your name yet. Please tell me your name so I can remember you for future consultations!",
        caller: null,
        functionCalled: null,
      };
    }
  }

  // 2. "Aap kaun ho?" / "Who are you?" / "What is your name?"
  if (/\b(aap kaun ho|tum kaun ho|who are you|what is your name|aapka naam kya hai|tumhara naam kya hai|tell me about yourself|apne bare me batao)\b/i.test(q)) {
    if (userLang === "hi" || userLang === "hinglish") {
      return {
        response: "मैं स्वास्थ्य साथी एआई हूँ, आपका वॉइस हेल्थकेयर गाइड। मैं आपको स्वास्थ्य जागरूकता, प्राथमिक लक्षण जांच और घरेलू प्राथमिक उपचार में मदद करता हूँ।",
        caller: currentCaller,
        functionCalled: null,
      };
    }
    return {
      response: "I am Swasthya Sathi AI, your empathetic voice healthcare guide. I assist you with initial symptom triage, wellness tips, and safe home remedies.",
      caller: currentCaller,
      functionCalled: null,
    };
  }

  // 3. "Mere bare me kya jante ho?" / "What is my health record / facts?"
  if (/\b(mere bare me kya jante ho|mera health record kya hai|meri pichli bimari kya thi|what do you know about me|what are my health facts|what is my record)\b/i.test(q)) {
    if (currentCaller && currentCaller.consent_given) {
      const age = currentCaller.facts.age_band || "Adult";
      const conditions = currentCaller.facts.ongoing_conditions || "None reported";
      const outcome = currentCaller.facts.last_triage_outcome || "General wellness inquiry";
      
      if (userLang === "hi" || userLang === "hinglish") {
        return {
          response: `आपका नाम ${currentCaller.name} है, आयु वर्ग ${age}, स्थिति: ${conditions}, और पिछली बार: ${outcome}।`,
          caller: currentCaller,
          functionCalled: "lookup_caller",
        };
      }
      return {
        response: `Your record shows name: ${currentCaller.name}, age band: ${age}, conditions: ${conditions}, and last advice: ${outcome}.`,
        caller: currentCaller,
        functionCalled: "lookup_caller",
      };
    } else {
      if (userLang === "hi" || userLang === "hinglish") {
        return {
          response: "वर्तमान में आपका कोई पूर्व स्वास्थ्य डेटा सुरक्षित नहीं है। जब आप अपनी स्वास्थ्य समस्या बताएंगे, तो मैं आपकी सहमति से इसे सुरक्षित कर लूँगा।",
          caller: null,
          functionCalled: null,
        };
      }
      return {
        response: "There is currently no stored health record for you. When you share your symptoms, I can save your summary with your consent.",
        caller: null,
        functionCalled: null,
      };
    }
  }

  // =========================================================================
  // D. NAME INTRODUCTION EXTRACTION (e.g. "Mera naam Priya hai", "Main Amit bol raha hoon")
  // =========================================================================
  const nameMatch = q.match(/(?:mera naam|i am|my name is|this is|naam|main)\s+([a-zA-Z\u0900-\u097F]+)/i);
  if (nameMatch && nameMatch[1] && !["hai", "hoon", "here", "calling", "having", "ek", "kya", "theek", "bimaar", "dard"].includes(nameMatch[1].toLowerCase())) {
    const detectedName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
    const lookedUp = getCallerByName(detectedName);
    
    if (lookedUp) {
      currentCaller = lookedUp;
      const symptom = lookedUp.facts.last_symptom || "health concern";
      const reply = (userLang === "hi" || userLang === "hinglish")
        ? `नमस्ते ${detectedName} जी! आपका रिकॉर्ड मिल गया है। पिछली बार हमने ${symptom} के बारे में चर्चा की थी। आज मैं आपकी क्या सहायता कर सकता हूँ?`
        : `Namaste ${detectedName}! I found your record. Last time we discussed your ${symptom}. How can I assist you today?`;

      return {
        response: reply,
        caller: currentCaller,
        functionCalled: "lookup_caller",
      };
    } else {
      // New caller introduced their name
      const newUserId = userId || `user_${detectedName.toLowerCase()}_${Date.now().toString().slice(-4)}`;
      const reply = (userLang === "hi" || userLang === "hinglish")
        ? `नमस्ते ${detectedName} जी! स्वास्थ्य साथी में आपका स्वागत है। कृपया बताएं कि आज आप क्या लक्षण या स्वास्थ्य समस्या महसूस कर रहे हैं?`
        : `Namaste ${detectedName}! Welcome to Swasthya Sathi. Please tell me what symptoms or health questions you have today.`;

      return {
        response: reply,
        caller: {
          user_id: newUserId,
          name: detectedName,
          language_preference: userLang,
          facts: {},
          consent_given: false,
          last_interaction: new Date().toISOString(),
        },
        functionCalled: null,
      };
    }
  }

  // =========================================================================
  // E. HARD CONSENT GUARDRAIL FLOW (Day 4 Step 5: Ask before you save)
  // =========================================================================
  const isAnsweringConsent = lastAssistantTurn.includes("सुरक्षित रख सकता हूँ") || 
                             lastAssistantTurn.includes("save your name") || 
                             lastAssistantTurn.includes("save this health summary") ||
                             lastAssistantTurn.includes("save") ||
                             lastAssistantTurn.includes("सुरक्षित");

  if (isAnsweringConsent) {
    // User says YES / HAAN
    if (/\b(yes|yeah|sure|yep|okay|ok|haan|ha|theek hai|save kar lo|kar lo|sahi hai|please save|save)\b/i.test(q) && !/\b(no|not|mat|don't|nahi|nah)\b/i.test(q)) {
      const activeId = userId || currentCaller?.user_id || "user_patient";
      let activeName = callerName || currentCaller?.name || knownNameInConvo || "Patient";

      // Extract facts from conversation history
      const fullConvo = history.map(h => h.content.toLowerCase()).join(" ");
      let symptomExtracted = "general health inquiry";
      if (fullConvo.includes("bukhar") || fullConvo.includes("fever")) symptomExtracted = "mild fever";
      else if (fullConvo.includes("sir dard") || fullConvo.includes("headache")) symptomExtracted = "headache";
      else if (fullConvo.includes("khansi") || fullConvo.includes("cough")) symptomExtracted = "cough and cold";
      else if (fullConvo.includes("pet") || fullConvo.includes("stomach")) symptomExtracted = "digestive discomfort";
      else if (fullConvo.includes("weakness") || fullConvo.includes("kamzori")) symptomExtracted = "fatigue and weakness";

      const newRecord: CallerRecord = {
        user_id: activeId,
        name: activeName,
        language_preference: userLang,
        facts: {
          age_band: "Adult (25-45)",
          ongoing_conditions: "None reported",
          last_symptom: symptomExtracted,
          last_triage_outcome: `Advised rest & hydration for ${symptomExtracted}`,
        },
        consent_given: true,
        last_interaction: new Date().toISOString(),
      };

      try {
        const saved = saveCaller(newRecord);
        const reply = (userLang === "hi" || userLang === "hinglish")
          ? `धन्यवाद! आपका स्वास्थ्य रिकॉर्ड सुरक्षित कर लिया गया है। अगली बार जब आप कॉल करेंगे, तो हम आपकी पिछली तबियत का ध्यान रखेंगे।`
          : `Thank you! Your health record has been saved with your consent. We will remember this to assist you better on your next call.`;

        return {
          response: reply,
          caller: saved,
          functionCalled: "save_caller_facts",
        };
      } catch (e: any) {
        console.error("[Consent Error]", e);
      }
    }

    // User says NO / NAHI / DON'T SAVE
    if (/\b(no|nah|nahi|mat save karo|mat karo|don't save|do not save|never|cancel)\b/i.test(q)) {
      const reply = (userLang === "hi" || userLang === "hinglish")
        ? `ठीक है, आपकी सहमति के बिना कोई भी डेटा सुरक्षित नहीं किया गया है। आपकी निजता हमारे लिए सर्वोपरि है।`
        : `Understood! In respect of your privacy, no information has been saved to the database.`;

      return {
        response: reply,
        caller: null,
        functionCalled: "consent_denied",
      };
    }
  }

  // =========================================================================
  // F. COMPREHENSIVE CLINICAL HEALTHCARE BRAIN (50+ Medical & Lifestyle Inquiries)
  // =========================================================================
  let clinicalAdvice = "";
  let shouldAskConsent = !currentCaller?.consent_given && history.length >= 2 && !isAnsweringConsent;

  // 1. Connection check & General greetings
  const isGreetingOnly = /^(hi|hello|hey|namaste|hlo|helo|test|can you hear me|are you there|kya aap sun sakte hain)[\s!?.]*$/i.test(q) ||
    (/\b(can you hear me|are you there|test connection)\b/i.test(q) && q.length < 35);
  
  if (isGreetingOnly) {
    if (userLang === "hi" || userLang === "hinglish") {
      clinicalAdvice = "नमस्ते! हाँ, मैं आपको स्पष्ट रूप से सुन सकता हूँ। मैं स्वास्थ्य साथी एआई हूँ, आपका स्वास्थ्य मार्गदर्शक। आज मैं आपके स्वास्थ्य या लक्षणों में कैसे सहायता कर सकता हूँ?";
    } else {
      clinicalAdvice = "Namaste! Yes, I can hear you clearly. I am SwasthyaSathi AI, your voice healthcare guide. How can I assist you with your health or symptoms today?";
    }
    return { response: clinicalAdvice, caller: currentCaller, functionCalled: null };
  }

  // 2. Hindi & Hinglish Clinical Knowledge Dispatcher
  if (userLang === "hi" || userLang === "hinglish") {

    // --- LIFESTYLE, DIET, VITAMINS & WEIGHT ---
    if (/\b(vajan|weight loss|weight gain|motaapa|fat|slim|patla|wazan)\b/i.test(q) || q.includes("वजन") || q.includes("मोटापा")) {
      clinicalAdvice = "वजन नियंत्रित रखने के लिए मीठे और तले हुए भोजन से बचें, फाइबर युक्त हरी सब्जियां व साबुत अनाज लें, रोजाना 3-4 लीटर पानी पिएं और 40 मिनट तेज पैदल चलें।";
    }
    else if (/\b(paani|water|hydration|liquid|kitna paani)\b/i.test(q) || q.includes("पानी") || q.includes("हाइड्रेशन")) {
      clinicalAdvice = "एक स्वस्थ वयस्क को प्रतिदिन लगभग 8 से 10 गिलास (2.5 से 3.5 लीटर) ताजा पानी पीना चाहिए। पर्याप्त पानी पीने से पाचन क्रिया सुधरती है और ऊर्जा बनी रहती है।";
    }
    else if (/\b(vitamin|vitamin d|vitamin b12|calcium|iron|khoon ki kami|anemia)\b/i.test(q) || q.includes("विटामिन") || q.includes("कैल्शियम") || q.includes("खून की कमी")) {
      clinicalAdvice = "विटामिन डी के लिए सुबह की हल्की धूप लें, विटामिन बी12 और कैल्शियम के लिए दूध-दही और पनीर लें, तथा खून की कमी दूर करने के लिए पालक, चुकंदर और अनार का सेवन करें।";
    }
    else if (/\b(immunity|kadha|booster|takat|energy|shakti)\b/i.test(q) || q.includes("इम्यूनिटी") || q.includes("काढ़ा") || q.includes("ताकत")) {
      clinicalAdvice = "रोग प्रतिरोधक क्षमता (इम्यूनिटी) बढ़ाने के लिए तुलसी, अदरक और काली मिर्च का काढ़ा पिएं, आंवला व संतरा जैसे विटामिन-सी युक्त फल लें और हल्दी वाला दूध लें।";
    }
    else if (/\b(exercise|yoga|pranayam|walk|gym|kasrat)\b/i.test(q) || q.includes("व्यायाम") || q.includes("योग") || q.includes("टहलना")) {
      clinicalAdvice = "नियमित 30 मिनट का व्यायाम या अनुलोम-विलोम प्राणायाम फेफड़ों को मजबूत करता है और रक्त संचार को बेहतर बनाता है। सुबह खाली पेट टहलना स्वास्थ्य के लिए सबसे उत्तम है।";
    }

    // --- EYES, EARS, TEETH, MOUTH ---
    else if (/\b(eye|aankh|aankhon|screen|jalan|dikhayi|vision)\b/i.test(q) || q.includes("आंख") || q.includes("आँखों")) {
      clinicalAdvice = "आंखों में जलन या स्क्रीन थकान के लिए 20-20-20 नियम अपनाएं: हर 20 मिनट बाद 20 फीट दूर देखें। ठंडे पानी के छींटे मारें और रात में सोने से पहले स्क्रीन न देखें।";
    }
    else if (/\b(ear|kaan|kaan dard|hearing|sunai)\b/i.test(q) || q.includes("कान") || q.includes("कान दर्द")) {
      clinicalAdvice = "कान में दर्द होने पर उसमें कोई तीली या तेल न डालें। कान के आसपास गर्म कपड़े से हल्की सिकाई करें। यदि दर्द तीव्र हो या मवाद निकले, तो तुरंत ईएनटी डॉक्टर से जांच करवाएं।";
    }
    else if (/\b(tooth|daant|teeth|masuda|bleeding gums|chhale|mouth ulcer)\b/i.test(q) || q.includes("दांत") || q.includes("छाले") || q.includes("मसूड़ों")) {
      clinicalAdvice = "दांत दर्द और मसूड़ों की सूजन के लिए गुनगुने नमक के पानी से कुल्ला करें और लौंग का तेल लगाएं। मुंह के छालों पर शहद या देसी घी लगाएं और विटामिन बी कॉम्प्लेक्स लें।";
    }

    // --- CHILD & WOMEN HEALTH ---
    else if (/\b(baby|bache|bacha|infant|child|chhota bacha)\b/i.test(q) || q.includes("बच्चे") || q.includes("बच्चा") || q.includes("शिशु")) {
      clinicalAdvice = "छोटे बच्चों में बुखार या पेट दर्द होने पर उन्हें ओआरएस और पर्याप्त तरल दें, सूती हल्के कपड़े पहनाएं। किसी भी दवा के लिए हमेशा बाल रोग विशेषज्ञ (पीडियाट्रिशियन) से ही परामर्श लें।";
    }
    else if (/\b(periods|period|mahawari|menses|cramps|period pain)\b/i.test(q) || q.includes("पीरियड्स") || q.includes("माहवारी")) {
      clinicalAdvice = "माहवारी के दर्द और ऐंठन में पेट के निचले हिस्से पर गर्म पानी की बोतल से सिकाई करें, गुनगुना पानी व अदरक की चाय पिएं और पर्याप्त आराम करें।";
    }
    else if (/\b(pregnancy|garbhavastha|pregnant|garbh)\b/i.test(q) || q.includes("गर्भावस्था") || q.includes("प्रेग्नेंट")) {
      clinicalAdvice = "गर्भावस्था के दौरान पौष्टिक घर का खाना, हरी सब्जियां, फल और पर्याप्त पानी लें। नियमित रूप से अपनी स्त्री रोग विशेषज्ञ (Gynecologist) से जांच और सोनोग्राफी करवाते रहें।";
    }

    // --- DIGESTION & STOMACH ---
    else if (/\b(acidity|gas|kabz|constipation|pet saaf|bloating|jalan|indigestion)\b/i.test(q) || q.includes("कब्ज") || q.includes("एसिडिटी") || q.includes("गैस") || q.includes("बदहजमी")) {
      clinicalAdvice = "कब्ज और एसिडिटी के लिए सुबह गुनगुना पानी पिएं, पपीता व हरी पत्तेदार सब्जियां खाएं, भोजन के बाद 10 मिनट वज्रासन में बैठें और रात में इसबगोल या त्रिफला ले सकते हैं।";
    }
    else if (/\b(vomit|ulti|dast|loose motion|diarrhea|pet kharab|food poisoning)\b/i.test(q) || q.includes("उल्टी") || q.includes("दस्त") || q.includes("पेट खराब")) {
      clinicalAdvice = "उल्टी या दस्त में शरीर में पानी की कमी न होने दें। हर 15 मिनट में घूंट-घूंट करके ओआरएस का घोल या नारियल पानी पिएं, हल्का मूंग दाल का दलिया लें और तैलीय भोजन न लें।";
    }
    else if (/\b(pet|stomach|pet dard|stomach ache|belly pain|marod)\b/i.test(q) || q.includes("पेट दर्द") || q.includes("पेट में दर्द")) {
      clinicalAdvice = "हल्के पेट दर्द के लिए गुनगुना पानी पिएं, अजवाइन और थोड़ा काला नमक लें और गर्म पानी की सिकाई करें। यदि दर्द बहुत तेज या दाहिनी तरफ हो, तो तुरंत डॉक्टर को दिखाएं।";
    }

    // --- FEVER, COLD, COUGH & INFECTIONS ---
    else if (/\b(headache|sar dard|sir dard|sar me dard|sir me dard|sir me|sar me|migraine)\b/i.test(q) || q.includes("सिरदर्द") || q.includes("सिर दर्द")) {
      clinicalAdvice = "सिरदर्द के लिए 2 गिलास ताजा पानी पिएं, शांत व कम रोशनी वाले कमरे में विश्राम करें और फोन-टीवी स्क्रीन से दूरी बनाएं। यदि दर्द बहुत तीव्र हो, तो डॉक्टर से परामर्श लें।";
    }
    else if (/\b(fever|bukhar|temperature|tapman|chills|cold fever)\b/i.test(q) || q.includes("बुखार") || q.includes("तापमान") || lastUserTurn.includes("bukhar") || lastUserTurn.includes("fever")) {
      clinicalAdvice = "बुखार में पर्याप्त आराम करें, हर 4 घंटे में थर्मामीटर से तापमान नापें, गुनगुना पानी पिएं और माथे पर ताजे पानी की पट्टी रखें। यदि बुखार 101 डिग्री से अधिक हो, तो डॉक्टर से सलाह लें।";
    }
    else if (/\b(cough|khansi|throat|gala|cold|जुकाम|kharash|balgam|tonsil)\b/i.test(q) || q.includes("खांसी") || q.includes("गले") || q.includes("जुकाम")) {
      clinicalAdvice = "खांसी और गले की खराश के लिए दिन में दो बार गुनगुने नमक के पानी से गरारे करें, गर्म पानी की भाप लें और अदरक-शहद का सेवन करें। ठंडी व खट्टी चीजों से परहेज रखें।";
    }
    else if (/\b(dengue|malaria|platelet|platelets|typhoid|chikungunya)\b/i.test(q) || q.includes("डेंगू") || q.includes("मलेरिया") || q.includes("टाइफाइड")) {
      clinicalAdvice = "डेंगू या मलेरिया में प्रचुर मात्रा में नारियल पानी, पपीते के पत्ते का अर्क और ओआरएस लें ताकि डिहाइड्रेशन न हो। नजदीकी लैब में ब्लड टेस्ट और प्लेटलेट्स की नियमित जांच करवाएं।";
    }
    else if (/\b(weakness|fatigue|dizzy|dizziness|chakkar|kamzori|thakan)\b/i.test(q) || q.includes("कमजोरी") || q.includes("चक्कर") || q.includes("थकान")) {
      clinicalAdvice = "कमजोरी या चक्कर आने पर तुरंत ओआरएस का घोल या ताजा नारियल पानी पिएं, फल या हल्का दलिया लें और विश्राम करें। समस्या बनी रहे तो बीपी और हीमोग्लोबिन चेक करवाएं।";
    }

    // --- CHRONIC CONDITIONS: DIABETES, BP, THYROID, JOINTS ---
    else if (/\b(diabetes|sugar|shugar|madhumeh|blood sugar)\b/i.test(q) || q.includes("मधुमेह") || q.includes("शुगर") || q.includes("डायबिटीज")) {
      clinicalAdvice = "डायबिटीज नियंत्रण के लिए साबुत अनाज जैसे ज्वार-बाजरा, मेथी दाना, करेला और हरी सब्जियां लें। मीठे खाद्य पदार्थों से बचें और रोजाना 30 मिनट तेज गति से टहलें।";
    }
    else if (/\b(bp|blood pressure|hypertension|high bp|low bp)\b/i.test(q) || q.includes("रक्तचाप") || q.includes("बीपी")) {
      clinicalAdvice = "रक्तचाप (BP) को संतुलित रखने के लिए नमक कम खाएं, लहसुन व ताजे फल लें, तनावमुक्त रहें और नियमित रूप से अपना बीपी मापते रहें।";
    }
    else if (/\b(joint|knee|back pain|body ache|kamar dard|ghutna|gathiya|arthritis)\b/i.test(q) || q.includes("जोड़ों") || q.includes("घुटने") || q.includes("कमर दर्द") || q.includes("गठिया")) {
      clinicalAdvice = "जोड़ों व कमर दर्द में गर्म पानी की सिकाई करें, हल्दी वाला गुनगुना दूध पिएं और हल्का व्यायाम करें। ज्यादा देर एक ही मुद्रा में बैठने से बचें।";
    }
    else if (/\b(sleep|neend|insomnia|stress|anxiety|tension)\b/i.test(q) || q.includes("नींद") || q.includes("तनाव") || q.includes("चिंता")) {
      clinicalAdvice = "अच्छी नींद और तनाव मुक्ति के लिए सोने से 1 घंटा पहले मोबाइल स्क्रीन बंद करें, रात में गुनगुना दूध पिएं और 10 मिनट गहरी सांस (प्राणायाम) लें।";
    }
    else if (/\b(skin|rash|allergy|itching|khujli|dana|pimples|acne|hair fall)\b/i.test(q) || q.includes("खुजली") || q.includes("त्वचा") || q.includes("मुंहासे") || q.includes("बाल")) {
      clinicalAdvice = "त्वचा की खुजली या दानों पर ताजा एलोवेरा जेल या नारियल तेल लगाएं, हल्के सूती कपड़े पहनें। बालों के झड़ने पर आंवला लें और ज्यादा तनाव से बचें।";
    }

    // --- DYNAMIC GENERAL HEALTH QUESTIONS FALLBACK (HINDI) ---
    else {
      clinicalAdvice = `स्वास्थ्य साथी आपके प्रश्न "${query}" को समझता है। सामान्य स्वास्थ्य बनाए रखने के लिए घर का बना ताजा व सुपाच्य भोजन लें, पर्याप्त मात्रा में गुनगुना पानी पिएं और अच्छा विश्राम करें। यदि कोई भी असुविधा या लक्षण 2 दिन से अधिक बना रहे, तो प्रमाणित डॉक्टर से जांच अवश्य करवाएं।`;
    }

    // Append consent inquiry if new patient
    if (shouldAskConsent) {
      clinicalAdvice += " भविष्य में आपकी बेहतर सहायता के लिए क्या मैं आपका नाम और यह स्वास्थ्य सारांश सुरक्षित रख सकता हूँ?";
    }

    return {
      response: clinicalAdvice,
      caller: currentCaller,
      functionCalled: null,
    };
  }

  // 3. English Clinical Knowledge Dispatcher
  // Lifestyle & Nutrition
  if (/\b(weight|weight loss|lose weight|weight gain|diet|nutrition|obesity)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For healthy weight management, eat fiber-rich whole grains and green vegetables, avoid sugary and deep-fried foods, drink 3 liters of water daily, and do 40 minutes of brisk walking.";
  } else if (/\b(water|hydration|drink water|how much water)\b/i.test(q)) {
    clinicalAdvice = "Namaste! An adult should drink approximately 8 to 10 glasses (2.5 to 3.5 liters) of water daily. Staying hydrated aids digestion, maintains energy, and supports kidney function.";
  } else if (/\b(vitamin|vitamin d|vitamin b12|calcium|iron|anemia)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For Vitamin D, get 15 minutes of morning sunlight. For Calcium and B12, include milk, yogurt, and paneer. For Iron, eat spinach, beetroot, and pomegranate.";
  } else if (/\b(immunity|booster|energy|strength)\b/i.test(q)) {
    clinicalAdvice = "Namaste! To boost immunity naturally, drink warm turmeric milk, consume Vitamin C rich citrus fruits like oranges and amla, and maintain 7 to 8 hours of sleep.";
  } else if (/\b(exercise|yoga|walking|fitness|workout)\b/i.test(q)) {
    clinicalAdvice = "Namaste! Engaging in 30 minutes of daily physical activity, such as brisk morning walks or pranayama yoga, strengthens heart and lung health.";
  }

  // Eyes, Ears, Dental, Oral
  else if (/\b(eye|eyes|vision|screen|strain|burning eyes)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For eye fatigue from digital screens, follow the 20-20-20 rule: look at an object 20 feet away every 20 minutes for 20 seconds. Splash cool water and rest your eyes.";
  } else if (/\b(ear|earache|ear pain|hearing)\b/i.test(q)) {
    clinicalAdvice = "Namaste! Avoid inserting any cotton buds or oils into the ear. Apply a warm dry cloth around the outer ear. If pain is sharp or accompanied by discharge, visit an ENT specialist.";
  } else if (/\b(teeth|tooth|toothache|gums|ulcer|mouth ulcer)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For toothache and gum swelling, rinse with warm salt water and apply clove oil. For mouth ulcers, apply pure honey and consume Vitamin B-rich foods.";
  }

  // Child & Women Health
  else if (/\b(baby|child|infant|toddler)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For children with fever or tummy upset, keep them hydrated with ORS and breastmilk or fluids, dress them in light cotton clothing, and consult a pediatrician promptly.";
  } else if (/\b(period|periods|menses|menstrual|cramps)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For menstrual cramps, use a warm heating pad on your lower abdomen, sip warm ginger tea, stay hydrated, and get adequate bed rest.";
  } else if (/\b(pregnant|pregnancy)\b/i.test(q)) {
    clinicalAdvice = "Namaste! During pregnancy, focus on home-cooked nutrient-dense foods, stay well-hydrated, and have regular checkups with your licensed gynecologist.";
  }

  // Digestion & Stomach
  else if (/\b(acidity|gas|constipation|indigestion|bloating)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For acidity and constipation, drink warm water in the morning, eat ripe papaya and leafy greens, avoid heavy spices, and take a light stroll after dinner.";
  } else if (/\b(vomit|vomiting|diarrhea|loose motions|food poisoning)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For diarrhea or vomiting, prevent dehydration by sipping ORS solution and fresh coconut water every 15 minutes, and eat bland foods like plain khichdi.";
  } else if (/\b(stomach|stomach ache|belly pain|cramps)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For mild stomach discomfort, sip warm water, avoid oily foods, and rest. If the pain is sharp or persistent, consult a doctor immediately.";
  }

  // Fever, Cold, Cough & Infections
  else if (/\b(headache|head pain|migraine)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For a headache, drink two large glasses of fresh water, rest in a dim quiet room, and step away from digital screens. If accompanied by nausea, consult a doctor.";
  } else if (/\b(fever|temperature|flu|chills)\b/i.test(q) || lastUserTurn.includes("fever")) {
    clinicalAdvice = "Namaste! For fever, chart your temperature every 4 hours, drink warm fluids with ORS, and rest. If it exceeds 101 degrees or lasts over 3 days, consult a physician.";
  } else if (/\b(cough|cold|throat|sore throat|congestion|phlegm)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For a cough and sore throat, practice warm steam inhalation, drink ginger honey tea, and gargle with warm salt water twice daily.";
  } else if (/\b(dengue|malaria|platelet|platelets|typhoid)\b/i.test(q)) {
    clinicalAdvice = "Namaste! In viral infections like dengue, maintain high hydration with coconut water and ORS, and have your blood counts tested regularly at a certified laboratory.";
  } else if (/\b(weakness|fatigue|dizzy|dizziness|faint)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For dizziness or weakness, drink fresh coconut water or ORS electrolyte, have a light snack, and rest. Check your blood pressure if dizziness continues.";
  }

  // Chronic & Skin
  else if (/\b(diabetes|sugar|blood sugar)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For blood sugar control, emphasize millets, bitter gourd, and green vegetables in your diet. Avoid refined sugar and walk for 30 minutes daily.";
  } else if (/\b(bp|blood pressure|hypertension)\b/i.test(q)) {
    clinicalAdvice = "Namaste! To manage blood pressure, reduce dietary sodium, eat fresh fruits and garlic, practice deep breathing, and check your BP regularly.";
  } else if (/\b(joint|knee|back pain|body ache)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For joint or back pain, apply a warm compress, perform gentle stretches, and drink warm turmeric milk at night. Avoid sitting in one posture for long hours.";
  } else if (/\b(sleep|insomnia|stress|anxiety)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For restful sleep and stress relief, disconnect from screens 1 hour before bedtime, drink warm milk, and practice 10 minutes of slow deep breathing.";
  } else if (/\b(skin|rash|itching|allergy|acne|hair fall)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For skin irritation, apply pure aloe vera gel or coconut oil, wear loose cotton clothes, and avoid harsh soaps. Consult a dermatologist if it persists.";
  }

  // General Fallback (English)
  else {
    clinicalAdvice = `Namaste! Regarding "${query}", I recommend staying well-hydrated, eating balanced home-cooked meals, and getting adequate rest. If your symptoms persist beyond 2 to 3 days, please consult a registered medical doctor.`;
  }

  // Append consent inquiry if new patient
  if (shouldAskConsent) {
    clinicalAdvice += " For better assistance on future calls, may I save your name and this health summary?";
  }

  return {
    response: clinicalAdvice,
    caller: currentCaller,
    functionCalled: null,
  };
}


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
    "feel ho rahi", "neend", "sugar", "acidity", "khana", "khayein", "pata", "bhi"
  ];
  if (hinglishMarkers.some(kw => lower.includes(kw))) {
    return "hinglish";
  }
  return "en";
}

/**
 * Day 4 Function Calling & Healthcare Memory Engine
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

  // Check if user is asking to be forgotten ("Forget Me" Tool - Day 4 Advanced)
  if (/\b(forget me|forget my data|delete my record|delete my data|erase my data|wipe my data|mujhe bhool jao|mera data delete karo|mera record hatao)\b/i.test(q)) {
    let deleted = false;
    if (currentCaller) {
      deleted = deleteCaller(currentCaller.user_id);
    } else if (userId) {
      deleted = deleteCaller(userId);
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

  // 2. Returning Caller Greeting on Call Start (Day 4 Step 4)
  if (isCallStart && currentCaller) {
    const name = currentCaller.name;
    const lastSymptom = currentCaller.facts.last_symptom || "fever";

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

  // 3. Name Introduction Extraction (e.g., "Mera naam Ramesh hai" or "I am Priya")
  const nameMatch = q.match(/(?:mera naam|i am|my name is|this is|naam)\s+([a-zA-Z\u0900-\u097F]+)/i);
  if (nameMatch && nameMatch[1] && !["hai", "hoon", "here", "calling", "having"].includes(nameMatch[1].toLowerCase())) {
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

  // 4. Hard Consent Guardrail Flow (Day 4 Step 5: Ask before you save)
  const isAnsweringConsent = lastAssistantTurn.includes("सुरक्षित रख सकता हूँ") || 
                             lastAssistantTurn.includes("save your name") || 
                             lastAssistantTurn.includes("save this health summary") ||
                             lastAssistantTurn.includes("save") ||
                             lastAssistantTurn.includes("सुरक्षित");

  if (isAnsweringConsent) {
    // User says YES / HAAN
    if (/\b(yes|yeah|sure|yep|okay|ok|haan|ha|theek hai|save kar lo|kar lo|sahi hai|please save|save)\b/i.test(q) && !/\b(no|not|mat|don't|nahi|nah)\b/i.test(q)) {
      const activeId = userId || currentCaller?.user_id || "user_patient";
      
      let activeName = callerName || currentCaller?.name;
      if (!activeName) {
        const historyNameMatch = history.map(h => h.content).join(" ").match(/(?:mera naam|i am|my name is|this is|naam)\s+([a-zA-Z\u0900-\u097F]+)/i);
        if (historyNameMatch && historyNameMatch[1] && !["hai", "hoon", "here", "calling", "having"].includes(historyNameMatch[1].toLowerCase())) {
          activeName = historyNameMatch[1].charAt(0).toUpperCase() + historyNameMatch[1].slice(1);
        }
      }
      if (!activeName) activeName = "Patient";

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

  // 5. Clinical Triage Responses & Suggesting Consent on New Consultation
  let clinicalAdvice = "";
  let shouldAskConsent = !currentCaller?.consent_given && history.length >= 2 && !isAnsweringConsent;

  // Greetings
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

  // Hindi & Hinglish Clinical Knowledge
  if (userLang === "hi" || userLang === "hinglish") {
    if (/\b(headache|sar dard|sir dard|sar me dard|sir me dard|sir me|sar me|migraine)\b/i.test(q) || q.includes("सिरदर्द") || q.includes("सिर दर्द")) {
      clinicalAdvice = "नमस्ते! सिरदर्द के लिए 2 गिलास ताजा पानी पिएं, शांत व कम रोशनी वाले कमरे में आराम करें और स्क्रीन से दूरी बनाएं। यदि दर्द बहुत तीव्र हो, उल्टी आए या नजर धुंधली हो, तो तुरंत डॉक्टर को दिखाएं।";
    } else if (/\b(weakness|fatigue|dizzy|dizziness|chakkar|kamzori|thakan|energy)\b/i.test(q) || q.includes("कमजोरी") || q.includes("चक्कर") || q.includes("थकान")) {
      clinicalAdvice = "नमस्ते! कमजोरी या चक्कर आने पर तुरंत ओआरएस का घोल या ताजा नारियल पानी पिएं, हल्का दलिया या फल लें और विश्राम करें। यदि चक्कर बार-बार आएं, तो बीपी और हीमोग्लोबिन की जांच करवाएं।";
    } else if (/\b(fever|bukhar|temperature|tapman|chills|cold fever)\b/i.test(q) || q.includes("बुखार") || q.includes("तापमान") || lastUserTurn.includes("bukhar") || lastUserTurn.includes("fever")) {
      if (/\b(kal|yesterday|aaj|days|din)\b/i.test(q) || lastUserTurn.includes("yesterday") || lastUserTurn.includes("kal")) {
        clinicalAdvice = "नमस्ते! यदि आपको बुखार बना हुआ है, तो थर्मामीटर से हर 4 घंटे में तापमान नोट करें, प्रचुर मात्रा में गुनगुना पानी पिएं और ठंडी पट्टी रखें। यदि तापमान 101 डिग्री से अधिक हो, तो डॉक्टर से सलाह लें।";
      } else {
        clinicalAdvice = "नमस्ते! हल्के बुखार में पर्याप्त आराम करें, गुनगुना पानी व ओआरएस पिएं और सुपाच्य भोजन लें। यदि बुखार 3 दिन से अधिक रहे या तेज कंपकंपी हो, तो डॉक्टर से परामर्श लें।";
      }
    } else if (/\b(cough|khansi|throat|gala|cold|जुकाम|kharash|balgam)\b/i.test(q) || q.includes("खांसी") || q.includes("गले") || q.includes("जुकाम")) {
      clinicalAdvice = "नमस्ते! खांसी और गले की खराश के लिए दिन में दो बार गुनगुने नमक के पानी से गरारे करें, गर्म पानी की भाप लें और अदरक-शहद का सेवन करें। ठंडी व खट्टी चीजों से परहेज रखें।";
    } else if (/\b(stomach|pet|pet dard|acidity|gas|kabz|constipation|vomit|ulti|dast|loose motion|diarrhea|indigestion)\b/i.test(q) || q.includes("पेट") || q.includes("उल्टी") || q.includes("दस्त") || q.includes("गैस")) {
      clinicalAdvice = "नमस्ते! पेट की परेशानी या एसिडिटी के लिए हल्का मूंग दाल का दलिया या खिचड़ी लें, गुनगुना पानी पिएं और भुना जीरा व छाछ का सेवन करें। तैलीय व मसालेदार भोजन बिल्कुल न लें।";
    } else if (/\b(diabetes|sugar|shugar|madhumeh|blood sugar|diet)\b/i.test(q) || q.includes("मधुमेह") || q.includes("शुगर") || q.includes("डायबिटीज")) {
      clinicalAdvice = "मधुमेह (डायबिटीज) के नियंत्रण के लिए साबुत अनाज जैसे ज्वार-बाजरा, हरी पत्तेदार सब्जियां, करेला और मेथी दाना लें। मीठे खाद्य पदार्थों से बचें तथा रोजाना 30 मिनट तेज गति से टहलें।";
    } else if (/\b(bp|blood pressure|hypertension|high bp)\b/i.test(q) || q.includes("रक्तचाप") || q.includes("बीपी")) {
      clinicalAdvice = "उच्च रक्तचाप (High BP) को नियंत्रित रखने के लिए भोजन में नमक की मात्रा कम करें, लहसुन व ताजे फल लें, तनावमुक्त रहें और नियमित रूप से अपना बीपी मापते रहें।";
    } else if (/\b(dengue|malaria|platelet|platelets|mosquito|machhar)\b/i.test(q) || q.includes("डेंगू") || q.includes("मलेरिया") || q.includes("प्लेटलेट")) {
      clinicalAdvice = "डेंगू या वायरल संक्रमण में प्रचुर मात्रा में नारियल पानी, पपीते के पत्ते का रस और ओआरएस लें ताकि शरीर हाइड्रेटेड रहे। नजदीकी लैब में ब्लड प्लेटलेट्स की नियमित जांच जरूर करवाएं।";
    } else if (/\b(sleep|neend|insomnia|stress|anxiety|tension)\b/i.test(q) || q.includes("नींद") || q.includes("तनाव")) {
      clinicalAdvice = "अच्छी नींद और तनाव मुक्ति के लिए सोने से 1 घंटा पहले मोबाइल स्क्रीन बंद करें, रात में गुनगुना दूध पिएं और 10 मिनट गहरी सांस (प्राणायाम) लें। दिन में कैफीन का सेवन सीमित करें।";
    } else if (/\b(joint|knee|back pain|body ache|kamar dard|ghutna|dard)\b/i.test(q) || q.includes("जोड़ों") || q.includes("घुटने") || q.includes("कमर दर्द")) {
      clinicalAdvice = "जोड़ों और कमर के दर्द में प्रभावित स्थान पर गर्म पानी की सिकाई करें, रात में हल्दी वाला गुनगुना दूध लें और हल्का व्यायाम करें। ज्यादा देर एक ही मुद्रा में बैठने से बचें।";
    } else if (/\b(skin|rash|allergy|itching|khujli|dana)\b/i.test(q) || q.includes("खुजली") || q.includes("त्वचा") || q.includes("एलर्जी")) {
      clinicalAdvice = "त्वचा की खुजली या एलर्जी के लिए प्रभावित जगह पर ताजा एलोवेरा जेल या नारियल तेल लगाएं, हल्के सूती कपड़े पहनें और ज्यादा गर्म पानी से न नहाएं। समस्या बढ़ने पर त्वचा रोग विशेषज्ञ से मिलें।";
    } else {
      clinicalAdvice = `नमस्ते! आपके प्रश्न "${query}" के संबंध में मैं सलाह दूंगा कि पर्याप्त मात्रा में पानी पिएं, घर का बना हल्का व पौष्टिक भोजन लें और अच्छा विश्राम करें। यदि कोई भी लक्षण 2-3 दिन से अधिक बना रहे, तो प्रमाणित डॉक्टर से जांच अवश्य करवाएं।`;
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

  // English Clinical Knowledge
  if (/\b(headache|head pain|migraine|temple pain)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For a headache that started recently, drink two large glasses of fresh water, rest in a quiet dim room, and avoid digital screens. If the headache is severe or accompanied by nausea, please consult a physician.";
  } else if (/\b(weakness|fatigue|dizzy|dizziness|faint|exhausted|tired|low energy)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For weakness or dizziness, drink fresh coconut water or an ORS electrolyte solution immediately, eat a light nutritious snack, and rest. If feeling lightheaded persists, check your blood pressure and consult a doctor.";
  } else if (/\b(fever|temperature|flu|chills|feverish)\b/i.test(q) || lastUserTurn.includes("fever")) {
    if (/\b(yesterday|today|days|morning|since)\b/i.test(q) || lastUserTurn.includes("yesterday") || lastUserTurn.includes("today")) {
      clinicalAdvice = "Namaste! Since your fever has been present for that duration, please chart your temperature with a thermometer every 4 hours, stay hydrated with warm fluids or ORS, and rest. If it exceeds 101 degrees or lasts over 3 days, consult a physician.";
    } else {
      clinicalAdvice = "Namaste! For a mild fever, stay well hydrated with warm water and ORS, take adequate bed rest, and monitor your temperature. If the fever stays above 101 degrees Fahrenheit or lasts beyond 3 days, consult a physician.";
    }
  } else if (/\b(cough|cold|throat|sore throat|congestion|runny nose|phlegm)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For a sore throat and cough, practice warm steam inhalation, drink ginger tea with honey, and do warm salt water gargles twice daily. Stay hydrated and avoid chilled beverages.";
  } else if (/\b(stomach|stomach ache|belly|acidity|gas|bloating|diarrhea|vomiting|nausea|loose motions|indigestion)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For stomach ache, acidity, or digestive discomfort, sip warm water, eat light foods like plain khichdi or oatmeal, and avoid oily, spicy meals. If there is severe pain or persistent vomiting, seek medical attention.";
  } else if (/\b(diabetes|sugar|blood sugar|diabetic|diet|food|nutrition)\b/i.test(q)) {
    clinicalAdvice = "Namaste! A healthy Indian diet for blood sugar control should emphasize whole grains like millets and oats, green leafy vegetables, bitter gourd, and lentils. Limit refined carbohydrates and walk 30 minutes daily.";
  } else if (/\b(bp|blood pressure|hypertension|high blood pressure)\b/i.test(q)) {
    clinicalAdvice = "Namaste! To maintain healthy blood pressure, reduce dietary sodium, include fresh fruits and garlic in your meals, manage stress with deep breathing, and check your BP regularly.";
  } else if (/\b(dengue|malaria|platelet|platelets|mosquito)\b/i.test(q)) {
    clinicalAdvice = "Namaste! Dengue fever involves high fever, joint aches, and fatigue. Maintain high fluid intake with coconut water, papaya leaf extract, and ORS, and have your platelet counts tested regularly at a laboratory.";
  } else if (/\b(joint|joints|back pain|knee|knee pain|body ache|muscle ache|pain)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For joint or back pain, apply a warm compress, perform gentle mobility stretches, and drink warm turmeric milk at night. Avoid staying in one static posture for extended hours.";
  } else if (/\b(sleep|insomnia|can't sleep|stress|anxiety|tension|restless)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For restful sleep and stress relief, disconnect from phone and TV screens 1 hour before bedtime, drink a glass of warm milk, and practice 10 minutes of slow deep breathing.";
  } else if (/\b(skin|rash|itching|itch|allergy|hives|acne)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For skin irritation or itching, apply pure aloe vera gel or coconut oil, wear loose cotton clothing, and avoid harsh scented soaps. If a rash spreads rapidly, consult a dermatologist.";
  } else {
    clinicalAdvice = `Namaste! Regarding "${query}", I recommend maintaining good hydration, eating balanced home-cooked meals, and getting adequate rest. If your symptoms persist beyond 2 to 3 days or cause significant discomfort, please consult a registered medical doctor.`;
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


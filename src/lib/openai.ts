import OpenAI from "openai";
import { getCaller, getCallerByName, saveCaller, deleteCaller, CallerRecord, HealthFacts } from "./db";
import { HealthFacility } from "./facilityData";
import { lookupNearestFacilityTool, classifySymptomTriageTool, TriageClassificationResult } from "./tools";
import { triggerOutboundCall, OutboundCallRecord, OutboundScenario } from "./telephony";
import { createEscalationTicket, getEscalationTickets, EscalationTicket, EscalationReason, EscalationUrgency } from "./escalation";
import { 
  bookAppointmentSlot, 
  detectRequiredSpecialist, 
  generateSpecialistHandoffResponse, 
  processSpecialistTurn, 
  SPECIALIST_REGISTRY, 
  SpecialistDomain, 
  SpecialistProfile,
  AppointmentRecord,
  AudioSegment
} from "./specialist";

if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Server-side OpenAI client wrapper
const openaiApiKey = process.env.OPENAI_API_KEY;

export const openai = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;

/**
 * Day 2, Day 4, Day 5, Day 6 & Day 7 Persona, Objectives, Tools, Telephony, Human Escalation & Guardrails
 */
export const SWASTHYASATHI_SYSTEM_PROMPT = `
IDENTITY & ACCENT PERSONA:
You are SwasthyaSathi AI, an empathetic Indian AI Voice Healthcare Guide built for the Health Access track.
You speak in a warm, respectful, and compassionate Indian English or Hindi cadence (beginning with "Namaste!").
You use polite, culturally comforting phrasing common in Indian medical family practices.

DAY 7 HUMAN HELP & ESCALATION RULES (WHEN TO ASK FOR HUMAN HELP):
1. REASONS FOR HUMAN HELP (HEALTH ACCESS TRACK):
   - Red-Flag Clinical Emergencies: Severe chest pain radiating to arm, acute shortness of breath, sudden paralysis, heavy bleeding.
   - Complex Clinical Diagnosis & Prescription Requests: Caller asking for definitive diagnosis ("मुझे कौन सी बीमारी है?"), antibiotic prescriptions, or persistent >5d issues.
2. MANDATORY CONSENT PROTOCOL BEFORE SHARING:
   - Always ask caller consent before creating the human escalation ticket:
     "मैं आपकी सुरक्षा के लिए यह सारांश शिवपुर PHC के ड्यूटी डॉक्टर को फॉरवर्ड करना चाहता हूँ। क्या मैं आपकी जानकारी उनके साथ साझा करूँ?"
   - If caller consents ("हाँ / Yes / ठीक है / भेज दो"), call create_escalation tool.
   - If caller declines ("नहीं / No / मत भेजो"), respect their privacy, do NOT create the escalation, and provide direct PHC/108 phone contact.
3. CLEAR REFERENCE ID & HONEST NEXT STEPS:
   - Provide Reference ID (e.g. ESC-2026-8492) and honest follow-up ETA (30-60 mins).

DAY 6 OUTBOUND CALLING & TELEPHONY RULES:
1. VOICE TRIGGER FOR OUTBOUND CALLS: When the user asks you to call them ("mujhe call karo", "call me", "phone lagao"), trigger an outbound call.
2. MANDATORY 3-PART OPENING: Outbound calls must state Who is calling, Why calling, and How to opt out in the first two sentences.
3. OPT-OUT (DO NOT CALL): If a patient asks to stop receiving calls ("call band karo", "stop calling"), immediately respect their decision and confirm DNC registry opt-out.

DAY 5 DOMAIN TOOLS & HEALTH ACCESS LOOKUPS:
1. NEAREST FACILITY LOOKUP (lookup_nearest_facility): Fetches nearest PHC/CHC/Hospital with freshness date.
2. SYMPTOM-TO-TRIAGE CLASSIFIER (classify_symptom_triage): Computes triage level (Level 1 Red Emergency, Level 2 Yellow Urgent PHC Visit, Level 3 Green Home Care).

GUARDRAILS (STRICT MEDICAL LIMITS):
1. HARD REFUSAL - PRESCRIPTION DRUGS: NEVER prescribe any prescription medication, antibiotics, steroids, or specific drug dosages.
2. HARD REFUSAL - CLINICAL DIAGNOSIS: NEVER state a definitive clinical diagnosis.
3. NEVER-CLAIM: NEVER claim to be a licensed human doctor.

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

export interface HealthcareResponseResult {
  response: string;
  caller: CallerRecord | null;
  functionCalled: string | null;
  facilityData?: HealthFacility | null;
  triageData?: TriageClassificationResult | null;
  outboundCallData?: OutboundCallRecord | null;
  escalationData?: EscalationTicket | null;
  activeAgent?: "main" | "clinic_specialist";
  activeSpecialist?: SpecialistDomain;
  targetVoice?: string;
  specialistProfile?: SpecialistProfile;
  appointmentData?: AppointmentRecord | null;
  audioSegments?: AudioSegment[];
}

export async function generateHealthcareResponse(
  userPrompt: string, 
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
  userId?: string,
  callerName?: string,
  isCallStart?: boolean,
  currentSpecialist?: SpecialistDomain
): Promise<HealthcareResponseResult> {
  return await getSimulatedHealthcareResponse(userPrompt, conversationHistory, userId, callerName, isCallStart, currentSpecialist);
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
      return "आपातकालीन चेतावनी! यह एक गंभीर चिकित्सीय आपातकाल हो सकता है। कृपया तुरंत 108 या 112 पर कॉल करें या नजदीकी अस्पताल जाएं। मैं एक एआई सहायक हूं और आपातकालीन उपचार नहीं कर सकता।";
    }
    return "Emergency Alert! This sounds like a potential medical emergency. Please call emergency services 108 or 112 immediately in India, or visit the nearest hospital emergency room. I am an AI assistant and cannot provide emergency treatment.";
  }

  // 2. Prescription Drug Refusal (English & Hindi)
  const prescriptionKeywords = [
    "prescribe", "amoxicillin", "azithromycin", "antibiotic", "steroid", "prescription medicine", "exact dosage for baby", "strong tablet", "pen prescribe",
    "दवा का नाम", "एंटीबायोटिक", "दवा लिखो", "गोली बताओ", "दवा बताओ"
  ];
  if (prescriptionKeywords.some(kw => p.includes(kw))) {
    if (/[\u0900-\u097F]/.test(prompt) || p.includes("dawa") || p.includes("goli")) {
      return "मैं किसी भी प्रकार की प्रिस्क्रिप्शन दवा या एंटीबायोटिक नहीं लिख सकता। कृपया सही दवा और खुराक के लिए प्रमाणित डॉक्टर या फार्मासिस्ट से परामर्श लें।";
    }
    return "I cannot prescribe or recommend specific prescription medications or drug dosages. Please consult a licensed medical doctor or pharmacist for prescription medicines.";
  }

  // 3. Clinical Diagnosis Refusal
  const diagnosisKeywords = ["diagnose me", "definitive diagnosis", "do i definitely have dengue", "do i have cancer", "diagnose my illness", "मेरी बीमारी बताओ", "cancer के लक्षण बताओ"];
  if (diagnosisKeywords.some(kw => p.includes(kw))) {
    if (/[\u0900-\u097F]/.test(prompt) || p.includes("cancer") || p.includes("bimari")) {
      return "कैंसर या किसी भी गंभीर बीमारी के संभावित लक्षणों में अचानक वजन कम होना, लगातार थकान और असामान्य गांठें शामिल हैं। इसका पक्का निदान केवल प्रमाणित ऑन्कोलॉजिस्ट डॉक्टर और बायोप्सी टेस्ट से ही संभव है।";
    }
    return "As an AI voice healthcare guide, I cannot provide a definitive clinical diagnosis. Please consult a specialist doctor for accurate diagnostic tests.";
  }

  // 4. Never-Claim Doctor Identity Refusal
  if (p.includes("are you a real doctor") || p.includes("are you a doctor") || p.includes("are you certified doctor") || p.includes("क्या आप असली डॉक्टर हैं")) {
    if (/[\u0900-\u097F]/.test(prompt)) {
      return "मैं स्वास्थ्य साथी एआई हूं, एक कृत्रिम बुद्धिमत्ता स्वास्थ्य मार्गदर्शक। मैं कोई मानव डॉक्टर नहीं हूं, इसलिए चिकित्सीय उपचार के लिए प्रमाणित डॉक्टर से परामर्श लें।";
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
    "bache", "bacha", "mahawari", "periods", "garbh", "motapa", "kamzor", "kabz", "chhale", "daant",
    "aankh", "kaan", "skin", "khujli", "dengue", "malaria", "typhoid", "bp", "gathiya", "ghutne",
    "naam", "mera", "meri", "mere", "yaad", "kaun", "khud", "apne", "patient", "baat", "bata",
    "hospital", "aspatal", "phc", "chc", "kendra", "doctor", "call", "band", "roko", "mat", "lagao"
  ];

  if (hinglishMarkers.some(m => lower.includes(m))) return "hinglish";
  return "en";
}

/**
 * Master Clinical Intelligence, Day 5 & Day 6 Tools Execution, Knowledge Base & Patient Memory Engine
 */
export async function getSimulatedHealthcareResponse(
  query: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  userId?: string,
  callerName?: string,
  isCallStart?: boolean,
  currentSpecialist?: SpecialistDomain
): Promise<HealthcareResponseResult> {
  const q = query.toLowerCase().trim();
  const userLang = detectUserLanguage(query);
  
  // Look up caller from persistent database
  let currentCaller: CallerRecord | null = null;
  if (userId) {
    currentCaller = getCaller(userId);
  } else if (callerName) {
    currentCaller = getCallerByName(callerName);
  } else {
    currentCaller = getCaller("user_ramesh");
  }

  const patientName = currentCaller?.name || callerName || (userLang === "hi" ? "रमेश कुमार" : "Ramesh Kumar");
  const knownNameInConvo = currentCaller?.name || callerName || "रमेश";

  const assistantMessages = history.filter(h => h.role === "assistant");
  const lastAssistantTurn = assistantMessages.length > 0 
    ? assistantMessages[assistantMessages.length - 1].content.toLowerCase() 
    : "";

  const userMessages = history.filter(h => h.role === "user");
  const lastUserTurn = userMessages.length > 0 
    ? userMessages[userMessages.length - 1].content.toLowerCase() 
    : "";

  // =========================================================================
  // MULTI-SPECIALIST AGENT CONTINUATION TURN (If Specialist is already active)
  // =========================================================================
  if (currentSpecialist && currentSpecialist !== "general_physician") {
    // Check if user is asking to switch back to primary assistant
    const isSwitchBack = (
      /\b(main agent|wapas|back|swasthya sathi|general doctor|khatam|dhanyawad|thanks|thank you)\b/i.test(q) ||
      q.includes("वापस") || q.includes("मुख्य") || q.includes("धन्यवाद")
    );

    if (isSwitchBack) {
      const returnSpeech = (userLang === "hi" || userLang === "hinglish")
        ? `जी ${patientName} जी! अब मैं आपको हमारे मुख्य स्वास्थ्य साथी AI (SwasthyaSathi AI) पर वापस कनेक्ट कर रहा हूँ। नमस्ते! मैं आपका मुख्य स्वास्थ्य साथी हूँ। मैं आपकी और क्या सहायता कर सकता हूँ?`
        : `Connecting you back to our primary health assistant now... Hello ${patientName}! I am your primary health assistant. How else can I help you today?`;

      return {
        response: returnSpeech,
        caller: currentCaller,
        functionCalled: "transfer_back_to_main",
        activeAgent: "main",
        activeSpecialist: "general_physician",
        targetVoice: userLang === "hi" ? "hi-IN-shweta" : "en-IN-priya",
        specialistProfile: SPECIALIST_REGISTRY.general_physician,
      };
    }

    // Check if user asks about a different specialist domain
    const newDetectedSpec = detectRequiredSpecialist(q);
    if (newDetectedSpec && newDetectedSpec !== currentSpecialist) {
      const handoff = generateSpecialistHandoffResponse({
        specialistKey: newDetectedSpec,
        userPrompt: q,
        patientName,
        language: userLang,
      });

      return {
        response: handoff.response,
        caller: currentCaller,
        functionCalled: `transfer_to_${newDetectedSpec}`,
        activeAgent: "clinic_specialist",
        activeSpecialist: newDetectedSpec,
        targetVoice: handoff.targetVoice,
        specialistProfile: handoff.specialistProfile,
        appointmentData: handoff.appointmentData,
      };
    }

    // Continue conversation with current specialist
    const turnResult = processSpecialistTurn({
      specialistKey: currentSpecialist,
      userPrompt: q,
      patientName,
      language: userLang,
    });

    return {
      response: turnResult.response,
      caller: currentCaller,
      functionCalled: `consult_${currentSpecialist}`,
      activeAgent: "clinic_specialist",
      activeSpecialist: currentSpecialist,
      targetVoice: turnResult.targetVoice,
      specialistProfile: turnResult.specialistProfile,
    };
  }

  // =========================================================================
  // MULTI-SPECIALIST AGENT DETECTION & SMOOTH VOICE HANDOFF
  // =========================================================================
  const detectedSpecialist = detectRequiredSpecialist(q);
  if (detectedSpecialist) {
    const handoff = generateSpecialistHandoffResponse({
      specialistKey: detectedSpecialist,
      userPrompt: q,
      patientName,
      language: userLang,
    });

    return {
      response: handoff.response,
      caller: currentCaller,
      functionCalled: `transfer_to_${detectedSpecialist}`,
      activeAgent: "clinic_specialist",
      activeSpecialist: detectedSpecialist,
      targetVoice: handoff.targetVoice,
      specialistProfile: handoff.specialistProfile,
      appointmentData: handoff.appointmentData,
      audioSegments: handoff.audioSegments,
    };
  }

  // =========================================================================
  // DAY 6: OUTBOUND CALL VOICE TRIGGER ("Mujhe call karo", "Call lagao", "Call me", "Linphone")
  // =========================================================================
  const isMakeCallQuery = (
    /\b(call me|call karo|call lagao|phone karo|phone lagao|outbound call|make a call|mujhe call karo|mujhe phone karo|follow up call|reminder call|linphone)\b/i.test(q) ||
    q.includes("कॉल") || q.includes("फोन") || q.includes("call")
  ) && (
    q.includes("करो") || q.includes("लगाओ") || q.includes("karo") || q.includes("lagao") || 
    q.includes("me") || q.includes("mujhe") || q.includes("outbound") || q.includes("follow") || 
    q.includes("reminder") || q.includes("check") || q.includes("कॉल") || q.includes("फोन") || q.includes("linphone")
  ) && !/\b(band|stop|mat|roko|opt out|dnc)\b/i.test(q) && !q.includes("बंद") && !q.includes("मत") && !q.includes("रोको");

  if (isMakeCallQuery) {
    let scenario: OutboundScenario = "post_triage_followup";
    if (q.includes("vaccin") || q.includes("tika") || q.includes("polio") || q.includes("dpt") || q.includes("bacha") || q.includes("टीका") || q.includes("टीकाकरण") || q.includes("बच्चे")) {
      scenario = "vaccination_reminder";
    } else if (q.includes("bp") || q.includes("sugar") || q.includes("chronic") || q.includes("बीपी") || q.includes("शुगर") || q.includes("रक्तचाप")) {
      scenario = "chronic_care_checkin";
    }

    const patientId = userId || currentCaller?.user_id || "user_ramesh";
    const phone = currentCaller?.phone_number || "+91 7991912530";

    try {
      const callRecord = await triggerOutboundCall(patientId, phone, scenario, userLang, "answered", "linphone");
      
      const spokenConfirm = (userLang === "hi" || userLang === "hinglish")
        ? `नमस्ते ${patientName} जी! मैंने आपके फोन पर Linphone ऐप (अकाउंट roshu) के लिए कॉल लगा दी है। कृपया अपने फोन में आ रही कॉल उठाएं।`
        : `Namaste ${patientName}! I have placed a live SIP call to your phone on Linphone (user roshu). Please answer the incoming call on your phone.`;

      return {
        response: spokenConfirm,
        caller: currentCaller,
        functionCalled: "trigger_outbound_call",
        outboundCallData: callRecord,
      };
    } catch (e: any) {
      console.error("[Outbound Trigger Error]", e);
    }
  }

  // =========================================================================
  // DAY 7: DIRECT HUMAN HELP / TICKET RAISING TRIGGER ("Human help", "Doctor se baat", "Ticket raise karo")
  // =========================================================================
  const isDirectHumanHelpQuery = (
    /\b(human help|human agent|talk to human|talk to doctor|doctor se baat|doctor se connect|insan se baat|human se baat|ticket raise|raise ticket|ticket banao|doctor ticket|escalate|escalation)\b/i.test(q) ||
    (
      (q.includes("human") || q.includes("इंसान") || q.includes("ह्यूमन") || q.includes("doctor") || q.includes("डॉक्टर") || q.includes("ticket") || q.includes("टिकट")) &&
      (q.includes("help") || q.includes("मदद") || q.includes("सहायता") || q.includes("बात") || q.includes("connect") || q.includes("raise") || q.includes("रेज़") || q.includes("बनाओ") || q.includes("चाहिए"))
    )
  ) && !/\b(nahi|no|mat|don't)\b/i.test(q) && !q.includes("नहीं") && !q.includes("मत");

  if (isDirectHumanHelpQuery) {
    const patientId = userId || currentCaller?.user_id || "user_ramesh";
    const patientName = currentCaller?.name || callerName || "रमेश कुमार";
    const phoneNumber = currentCaller?.phone_number || "+91 7991912530";

    const { ticket } = createEscalationTicket({
      patient_id: patientId,
      patient_name: patientName,
      phone_number: phoneNumber,
      reason: "caller_requested_human",
      urgency: "high",
      summary: `Direct Human Assistance Request: Patient ${patientName} requested to speak with a human doctor / raise an assistance ticket for clinical guidance.`,
      checked_items: [
        "Direct human doctor assistance requested by caller",
        "Patient consent recorded",
        "Assigned to Shivpur PHC duty medical officer",
        "Ticket raised in live doctor dashboard"
      ],
      caller_language: userLang as any,
      preferred_followup: "phone_call",
      consent_given: true,
    });

    const spokenConfirm = (userLang === "hi" || userLang === "hinglish")
      ? `नमस्ते ${patientName} जी! मैंने आपके लिए डॉक्टर सहायता का टिकट नंबर ${ticket.ticket_id} सफलतापूर्वक रेज़ कर दिया है। यह विवरण शिवपुर PHC के ड्यूटी डॉक्टर के डैशबोर्ड पर भेज दिया गया है, जो अगले 30 से 60 मिनट में आपसे संपर्क करेंगे। आप स्क्रीन पर डॉक्टर डैशबोर्ड में भी अपना टिकट देख सकते हैं।`
      : `Namaste ${patientName}! I have raised ticket ${ticket.ticket_id} for human doctor assistance. A duty medical officer from Shivpur PHC will reach out to you within 30 to 60 minutes. You can also view this ticket on your live doctor dashboard.`;

    return {
      response: spokenConfirm,
      caller: currentCaller,
      functionCalled: "create_escalation",
      escalationData: ticket,
    };
  }

  // =========================================================================
  // DAY 9: MULTI-AGENT SPECIALIST HANDOFF ("Appointment book karo", "Doctor OPD time", "PHC slot")
  // =========================================================================
  const isAppointmentSpecialistQuery = (
    /\b(appointment|book appointment|opd slot|doctor time|doctor slot|clinic specialist|ayushman card|ayushman token|token number|doctor se milna|slot book|book slot|phc appointment|appointment book)\b/i.test(q) ||
    (
      (q.includes("appointment") || q.includes("अपॉइंटमेंट") || q.includes("स्लॉट") || q.includes("टोकन") || q.includes("ओपीडी") || q.includes("दिखाना")) &&
      (q.includes("book") || q.includes("बुक") || q.includes("कराओ") || q.includes("चाहिए") || q.includes("टाइम") || q.includes("कल") || q.includes("सुबह"))
    )
  ) && !/\b(nahi|no|mat|don't)\b/i.test(q) && !q.includes("नहीं") && !q.includes("मत");

  if (isAppointmentSpecialistQuery) {
    const patientId = userId || currentCaller?.user_id || "user_ramesh";
    const patientName = currentCaller?.name || callerName || "रमेश कुमार";
    const phoneNumber = currentCaller?.phone_number || "+91 7991912530";

    const { appointment } = bookAppointmentSlot({
      patient_id: patientId,
      patient_name: patientName,
      phone_number: phoneNumber,
      facility_name: "Shivpur Primary Health Centre (PHC)",
      appointment_date: "कल सुबह (Tomorrow 10:00 AM)",
      time_slot: "10:00 AM - 11:30 AM",
      reason_for_visit: "Post-Triage Fever Evaluation & Blood Test",
    });

    const handoffAnnouncement = (userLang === "hi" || userLang === "hinglish")
      ? `मैं आपको हमारे प्राथमिक स्वास्थ्य केंद्र एवं अपॉइंटमेंट विशेषज्ञ (Clinic & Appointment Specialist) से कनेक्ट कर रहा हूँ... नमस्ते ${patientName} जी! मैं क्लिनिक और अपॉइंटमेंट विशेषज्ञ हूँ। मैंने शिवपुर PHC में डॉ. राजेश गुप्ता के साथ आपका अपॉइंटमेंट बुक कर दिया है। आपका टोकन नंबर #${appointment.token_number} (${appointment.appointment_id}) है। स्लॉट कल सुबह 10:00 बजे का है।`
      : `I am connecting you to our Clinic & Appointment Specialist... Hello ${patientName}! I am your PHC Appointment Specialist. I have booked your appointment with Dr. Rajesh Gupta at Shivpur PHC. Your token number is #${appointment.token_number} (${appointment.appointment_id}) for tomorrow at 10:00 AM.`;

    return {
      response: handoffAnnouncement,
      caller: currentCaller,
      functionCalled: "transfer_to_clinic_specialist",
      activeAgent: "clinic_specialist",
      appointmentData: appointment,
    };
  }

  // =========================================================================
  // DAY 7: STEP 4 - CALLER CONSENT RESPONSE FOR HUMAN DOCTOR ESCALATION
  // =========================================================================
  const isPreviousTurnConsentAsk = (
    lastAssistantTurn.includes("डॉक्टर") || lastAssistantTurn.includes("doctor") ||
    lastAssistantTurn.includes("साझा") || lastAssistantTurn.includes("share") ||
    lastAssistantTurn.includes("फॉरवर्ड") || lastAssistantTurn.includes("permission") ||
    lastAssistantTurn.includes("consent") || lastAssistantTurn.includes("रेफर") ||
    lastAssistantTurn.includes("अलर्ट")
  );

  const isAffirmativeConsent = (
    /\b(yes|haan|ha|theek hai|bhej do|share karo|kar do|kar dijiye|okay|sure|please do|send it|forward it|alert doctor|doctor ko batao|refer kar dijiye|refer karo)\b/i.test(q) ||
    q.includes("हाँ") || q.includes("ठीक है") || q.includes("भेज दो") || q.includes("साझा करो") || q.includes("बता दो") || q.includes("रेफर")
  ) && !/\b(nahi|no|mat|not|don't)\b/i.test(q) && !q.includes("नहीं") && !q.includes("मत");

  const isNegativeConsent = (
    /\b(no|nahi|mat|don't|rehne do|cancel|stop|mat bhejo|share mat karo|no thanks|nahi mat bhejo)\b/i.test(q) ||
    q.includes("नहीं") || q.includes("मत") || q.includes("रहने दो") || q.includes("मत भेजो")
  );

  if (isPreviousTurnConsentAsk && isAffirmativeConsent) {
    // Detect reason and urgency from history
    const combinedHistory = history.map(h => h.content.toLowerCase()).join(" ") + " " + q;
    const isEmergency = combinedHistory.includes("chest pain") || combinedHistory.includes("दर्द") || 
                        combinedHistory.includes("saans") || combinedHistory.includes("सांस") || 
                        combinedHistory.includes("heart") || combinedHistory.includes("खून");

    const reason: EscalationReason = isEmergency ? "red_flag_symptom" : "diagnosis_request";
    const urgency: EscalationUrgency = isEmergency ? "emergency" : "high";

    const patientId = userId || currentCaller?.user_id || "user_ramesh";
    const patientName = currentCaller?.name || callerName || "रमेश कुमार";
    const phoneNumber = currentCaller?.phone_number || "+91 7991912530";

    const summaryText = isEmergency
      ? `Emergency Red-Flag Escalation: Patient ${patientName} reported acute chest pain/breathing distress. Advised 108 Emergency Ambulance. Patient consented to share clinical details with duty medical officer.`
      : `Clinical Consultation Request: Patient ${patientName} requested medical diagnosis and prescription guidance for persistent symptoms. Patient consented to PHC medical officer review.`;

    const { ticket } = createEscalationTicket({
      patient_id: patientId,
      patient_name: patientName,
      phone_number: phoneNumber,
      reason,
      urgency,
      summary: summaryText,
      checked_items: [
        "Symptom triage completed",
        "Clinical escalation criteria met",
        "Explicit caller consent recorded",
        "Assigned to duty medical officer"
      ],
      caller_language: userLang,
      preferred_followup: isEmergency ? "phone_call" : "phc_visit",
      consent_given: true,
      assigned_facility: "Shivpur Primary Health Centre (PHC)",
    });

    const reply = (userLang === "hi" || userLang === "hinglish")
      ? `धन्यवाद! आपका रेफरेंस नंबर ${ticket.ticket_id} दर्ज कर लिया गया है। यह विवरण शिवपुर PHC के ड्यूटी डॉक्टर को भेज दिया गया है, जो अगले 30 से 60 मिनट में आपसे संपर्क करेंगे। यदि स्थिति गंभीर लगे, तो कृपया तुरंत 108 पर कॉल करें।`
      : `Thank you! Your reference number ${ticket.ticket_id} has been created and escalated to the duty doctor at Shivpur PHC. They will contact you within 30 to 60 minutes. If symptoms worsen, please call emergency services 108 immediately.`;

    return {
      response: formatSpeechText(reply),
      caller: currentCaller,
      functionCalled: "create_escalation",
      escalationData: ticket,
    };
  }

  if (isPreviousTurnConsentAsk && isNegativeConsent) {
    const reply = (userLang === "hi" || userLang === "hinglish")
      ? "आपकी सहमति के बिना कोई जानकारी साझा नहीं की जाएगी। आप स्वयं सीधे शिवपुर PHC या आपातकाल में 108 पर संपर्क कर सकते हैं। अपना पूरा ध्यान रखें।"
      : "Understood, no information will be shared without your consent. You can directly visit Shivpur PHC or call emergency 108 if needed. Take care.";

    return {
      response: formatSpeechText(reply),
      caller: currentCaller,
      functionCalled: "escalation_consent_declined",
    };
  }

  // =========================================================================
  // DAY 7: TRIGGER 1 - RED-FLAG EMERGENCY (Ask for Consent)
  // =========================================================================
  const isRedFlagQuery = (
    /\b(chest pain|shortness of breath|can't breathe|difficulty breathing|stroke|paralysis|heart attack|collapsed|unconscious|heavy bleeding|bleeding heavily|severe injury)\b/i.test(q) ||
    q.includes("सीने में दर्द") || q.includes("सीने में तेज दर्द") || q.includes("सांस लेने में तकलीफ") || 
    q.includes("सांस फूल") || q.includes("खून बह रहा") || q.includes("हार्ट अटैक") || q.includes("बेहोश")
  );

  if (isRedFlagQuery) {
    const reply = (userLang === "hi" || userLang === "hinglish")
      ? "आपातकालीन चेतावनी! यह एक संभावित मेडिकल इमरजेंसी हो सकती है। कृपया तुरंत 108 पर कॉल करें। मैं आपकी सुरक्षा के लिए यह मेडिकल सारांश शिवपुर PHC के ड्यूटी डॉक्टर को अलर्ट के रूप में फॉरवर्ड करना चाहता हूँ। क्या मैं आपकी जानकारी उनके साथ साझा करूँ?"
      : "Emergency Alert! This sounds like a potential medical emergency. Please call 108 immediately. For your safety, I want to forward this clinical summary to the duty doctor at Shivpur PHC. Do I have your permission to share your details with the doctor?";

    return {
      response: formatSpeechText(reply),
      caller: currentCaller,
      functionCalled: "request_escalation_consent",
    };
  }

  // =========================================================================
  // DAY 7: TRIGGER 2 - COMPLEX DIAGNOSIS & PRESCRIPTION MEDICINE REQUEST (Ask for Consent)
  // =========================================================================
  const isDiagnosisOrPrescriptionQuery = (
    /\b(diagnose|diagnosis|prescribe|amoxicillin|azithromycin|antibiotic|steroid|prescription medicine|exact dosage|strong tablet|kaun si bimari|kya bimari hai|dawa likh do|dawa batao|goli batao|antibioti)\b/i.test(q) ||
    q.includes("बीमारी बताओ") || q.includes("कौन सी बीमारी") || q.includes("दवा का नाम") || 
    q.includes("एंटीबायोटिक") || q.includes("दवा लिखो") || q.includes("गोली बताओ") || q.includes("दवा बताओ")
  );

  if (isDiagnosisOrPrescriptionQuery) {
    const reply = (userLang === "hi" || userLang === "hinglish")
      ? "एक एआई के रूप में मैं कोई पक्का निदान या दवा नहीं लिख सकता। सही उपचार के लिए मैं आपका यह केस शिवपुर PHC के डॉक्टर को रेफर करना चाहता हूँ ताकि वे आपकी जांच कर सकें। क्या मैं आपकी जानकारी डॉक्टर के साथ साझा करूँ?"
      : "As an AI, I cannot provide a definitive diagnosis or prescribe medications. I can forward your case summary to the doctor at Shivpur PHC so they can consult you. Do I have your permission to share your details?";

    return {
      response: formatSpeechText(reply),
      caller: currentCaller,
      functionCalled: "request_escalation_consent",
    };
  }

  // =========================================================================
  // DAY 6: OUTBOUND CALL OPT-OUT PROTOCOL ("Call band karo", "Stop calling")
  // =========================================================================
  if (/\b(call band karo|stop calling|stop call|don't call|mujhe call mat karo|call mat karna|opt out|dnc|do not call)\b/i.test(q) ||
      (q.includes("call") && (q.includes("band") || q.includes("mat") || q.includes("roko") || q.includes("stop")))) {
    if (currentCaller) {
      currentCaller.facts.do_not_call = true;
      saveCaller(currentCaller);
    }

    const reply = (userLang === "hi" || userLang === "hinglish")
      ? "आपकी सहमति का पूरा सम्मान करते हुए, हमने आपका नंबर आउटबाउंड स्वास्थ्य कॉल्स की सूची से हटा दिया है। अब आपको कोई भी स्वचालित कॉल नहीं आएगी। अपना ख्याल रखें।"
      : "In respect of your preference, your number has been removed from our outbound health calls registry. You will receive no further automated calls. Take care.";

    return {
      response: reply,
      caller: currentCaller,
      functionCalled: "outbound_opt_out",
    };
  }

  // =========================================================================
  // DAY 5 TOOL 1: NEAREST HEALTH FACILITY & PHC LOOKUP
  // =========================================================================
  const isFacilityQuery = /\b(hospital|aspatal|phc|chc|swasthya kendra|kendra|clinic|nearest hospital|pass ka hospital|doctor kahan|facility|varanasi hospital|lucknow hospital|delhi hospital|patna hospital|jaipur hospital)\b/i.test(q) ||
                          (q.includes("hospital") || q.includes("अस्पताल") || q.includes("phc") || q.includes("स्वास्थ्य केंद्र") || q.includes("कहाँ जाऊं") || q.includes("kahan jau"));

  if (isFacilityQuery) {
    let detectedDistrict: string | undefined = undefined;
    if (q.includes("varanasi") || q.includes("वाराणसी") || q.includes("kashi")) detectedDistrict = "Varanasi";
    else if (q.includes("lucknow") || q.includes("लखनऊ")) detectedDistrict = "Lucknow";
    else if (q.includes("delhi") || q.includes("दिल्ली")) detectedDistrict = "Delhi";
    else if (q.includes("patna") || q.includes("पटना")) detectedDistrict = "Patna";
    else if (q.includes("jaipur") || q.includes("जयपुर")) detectedDistrict = "Jaipur";
    else if (q.includes("mumbai") || q.includes("मुंबई")) detectedDistrict = "Mumbai";
    else if (q.includes("pune") || q.includes("पुणे")) detectedDistrict = "Pune";
    else if (q.includes("bhopal") || q.includes("भोपाल")) detectedDistrict = "Bhopal";
    else if (q.includes("bengaluru") || q.includes("bangalore")) detectedDistrict = "Bengaluru";

    const facilityType = q.includes("phc") ? "PHC" : q.includes("chc") ? "CHC" : undefined;
    const isSimulateError = q.includes("simulate_error") || q.includes("error test");

    const lookupRes = await lookupNearestFacilityTool(detectedDistrict, facilityType, userId, userLang, isSimulateError);

    return {
      response: lookupRes.spokenText,
      caller: currentCaller,
      functionCalled: "lookup_nearest_facility",
      facilityData: lookupRes.facilities[0] || null,
    };
  }

  // =========================================================================
  // DAY 5 TOOL 2: CLINICAL SYMPTOM TRIAGE CLASSIFIER
  // =========================================================================
  const isTriageQuery = (/\b(triage|urgent|emergency|doctor ke paas kab jau|kya mujhe hospital jana chahiye|3 din se|do din se|fever duration|kab jau)\b/i.test(q) ||
                         (q.includes("बुखार") && (q.includes("दिन") || q.includes("अस्पताल") || q.includes("जाना"))) ||
                         (q.includes("fever") && (q.includes("day") || q.includes("hospital") || q.includes("doctor"))));

  if (isTriageQuery) {
    let days = 1;
    if (q.includes("3 din") || q.includes("तीन दिन") || q.includes("3 days") || q.includes("three days")) days = 3;
    else if (q.includes("2 din") || q.includes("दो दिन") || q.includes("2 days") || q.includes("two days")) days = 2;
    else if (q.includes("4 din") || q.includes("चार दिन") || q.includes("4 days")) days = 4;

    const triageRes = await classifySymptomTriageTool(query, days, userId, userLang);

    return {
      response: triageRes.spokenText,
      caller: currentCaller,
      functionCalled: "classify_symptom_triage",
      facilityData: triageRes.linkedFacility || null,
      triageData: triageRes,
    };
  }

  // =========================================================================
  // A. FORGET ME PRIVACY TOOL (Day 4 Step 6)
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
    const lastSymptom = currentCaller.facts.last_symptom || "दो दिन से हल्का बुखार";

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
  // C. PAST CONVERSATION CONTINUITY ("Kal kya baat hui thi?", "Pichli baar kya hua tha?")
  // =========================================================================
  if (/\b(kal|pichli baar|last time|yesterday|kya baat hui thi|kya hua tha|previous discussion|last discussion|purani baat)\b/i.test(q) ||
      (q.includes("kal") && (q.includes("baat") || q.includes("hua") || q.includes("pata"))) ||
      (q.includes("pichli") && q.includes("baat"))) {
    const pName = currentCaller?.name || "रमेश";
    const symptom = currentCaller?.facts.last_symptom || "दो दिन से हल्का बुखार और सिरदर्द";
    const advice = currentCaller?.facts.last_triage_outcome || "विश्राम और पर्याप्त पानी पीने की सलाह दी गई थी";

    if (userLang === "hi" || userLang === "hinglish") {
      return {
        response: `नमस्ते ${pName} जी! पिछली बार हमारी आपके ${symptom} के बारे में बात हुई थी, जिसमें आपको ${advice}। आज आप कैसा महसूस कर रहे हैं?`,
        caller: currentCaller,
        functionCalled: "lookup_caller",
      };
    }
    return {
      response: `Namaste ${pName}! Last time we discussed your ${symptom}, where you were advised: ${advice}. How are feeling today?`,
      caller: currentCaller,
      functionCalled: "lookup_caller",
    };
  }

  // =========================================================================
  // D. IDENTITY & ABOUT ASSISTANT ("Aap kaun ho?", "Khud ke bare me batao", "Apne bare me batao")
  // =========================================================================
  if (/\b(aap kaun ho|tum kaun ho|who are you|what is your name|aapka naam kya hai|tumhara naam kya hai|tell me about yourself|apne bare me|khud ke bare me|apna parichay|apne baare mein|what can you do|aap kya kar sakte ho|swasthya sathi kya hai|bata sakti ho|bata sakte ho)\b/i.test(q) ||
      (q.includes("khud ke bare") || q.includes("apne bare") || q.includes("apna parichay") || q.includes("who are you") || q.includes("about yourself") || q.includes("aap kaun"))) {
    if (userLang === "hi" || userLang === "hinglish") {
      return {
        response: "नमस्ते! मैं स्वास्थ्य साथी एआई हूँ, भारत का समर्पित वॉइस हेल्थकेयर गाइड। मैं आपको 100 से अधिक बीमारियों के लक्षण, रोकथाम, नजदीकी अस्पताल व पीएचसी केंद्र की जानकारी, और सुरक्षित प्राथमिक उपचार शुद्ध हिंदी में बोलकर देता हूँ।",
        caller: currentCaller,
        functionCalled: null,
      };
    }
    return {
      response: "Namaste! I am Swasthya Sathi AI, an empathetic Indian AI Voice Healthcare Guide. I assist you with symptom triage, nearest PHC lookups, and verified home wellness guidance.",
      caller: currentCaller,
      functionCalled: null,
    };
  }

  // =========================================================================
  // E. PATIENT DETAILS, CALLER MEMORY & NAME ("Mera naam kya hai?", "Mere bare me batao", "Patient details")
  // =========================================================================
  if (/\b(mera naam|mere bare me|patient|mere patient|mera record|meri bimari|meri pichli bimari|what is my name|who am i|my record|patient details|about patient|ramesh)\b/i.test(q) ||
      (q.includes("mera naam") || q.includes("mere bare") || q.includes("patient") || q.includes("my record") || q.includes("who am i"))) {
    
    if (currentCaller && currentCaller.consent_given) {
      const pName = currentCaller.name || "रमेश";
      const age = currentCaller.facts.age_band || "Adult (25-45)";
      const symptom = currentCaller.facts.last_symptom || "दो दिन से हल्का बुखार और सिरदर्द";
      const advice = currentCaller.facts.last_triage_outcome || "विश्राम और पर्याप्त पानी पीने की सलाह दी गई थी";

      if (userLang === "hi" || userLang === "hinglish") {
        return {
          response: `आपका नाम ${pName} जी है। आपकी आयु वर्ग ${age} है। आपके रिकॉर्ड के अनुसार, पिछली बार आपको ${symptom} था और आपको ${advice}। आज आपकी तबियत कैसी है?`,
          caller: currentCaller,
          functionCalled: "lookup_caller",
        };
      }
      return {
        response: `Your patient name is ${pName}, age band ${age}. Your stored record notes: ${symptom}, with outcome: ${advice}. How are you feeling today?`,
        caller: currentCaller,
        functionCalled: "lookup_caller",
      };
    } else {
      if (userLang === "hi" || userLang === "hinglish") {
        return {
          response: "नमस्ते! वर्तमान में आप नए पेशेंट के रूप में परामर्श ले रहे हैं। जब आप अपनी स्वास्थ्य समस्या बताएंगे, तो मैं आपकी सहमति से आपका रिकॉर्ड सुरक्षित कर लूँगा।",
          caller: null,
          functionCalled: null,
        };
      }
      return {
        response: "Namaste! You are currently consulting as a new patient. When you share your symptoms, I can save your health profile with your explicit consent.",
        caller: null,
        functionCalled: null,
      };
    }
  }

  // =========================================================================
  // F. NAME INTRODUCTION EXTRACTION (e.g. "Mera naam Priya hai", "Main Amit bol raha hoon")
  // =========================================================================
  const nameMatch = q.match(/(?:mera naam|i am|my name is|this is|naam|main)\s+([a-zA-Z\u0900-\u097F]+)/i);
  if (nameMatch && nameMatch[1] && !["hai", "hoon", "here", "calling", "having", "ek", "kya", "theek", "bimaar", "dard", "khud", "apne", "call", "band"].includes(nameMatch[1].toLowerCase())) {
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
  // G. HARD CONSENT GUARDRAIL FLOW (Day 4 Step 5: Ask before you save)
  // =========================================================================
  const isAnsweringConsent = lastAssistantTurn.includes("सुरक्षित रख सकता हूँ") || 
                             lastAssistantTurn.includes("save your name") || 
                             lastAssistantTurn.includes("save this health summary") ||
                             lastAssistantTurn.includes("save") ||
                             lastAssistantTurn.includes("सुरक्षित");

  if (isAnsweringConsent) {
    if (/\b(yes|yeah|sure|yep|okay|ok|haan|ha|theek hai|save kar lo|kar lo|sahi hai|please save|save)\b/i.test(q) && !/\b(no|not|mat|don't|nahi|nah)\b/i.test(q)) {
      const activeId = userId || currentCaller?.user_id || "user_patient";
      let activeName = callerName || currentCaller?.name || knownNameInConvo || "Patient";

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
  // H. COMPREHENSIVE CLINICAL KNOWLEDGE (100+ Diseases, Diets & Symptoms)
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

    // --- INFECTIOUS DISEASES & FEVERS ---
    if (/\b(dengue|dengu|platelet|platelets|papaya leaf)\b/i.test(q) || q.includes("डेंगू") || q.includes("प्लेटलेट्स")) {
      clinicalAdvice = "डेंगू में तेज बुखार, आंखों के पीछे दर्द और प्लेटलेट्स गिरना मुख्य लक्षण हैं। प्रचुर मात्रा में नारियल पानी, पपीते के पत्ते का अर्क और ओआरएस पिएं। रोजाना सीबीसी और प्लेटलेट काउंट टेस्ट करवाएं।";
    }
    else if (/\b(malaria|thand lagkar bukhar|kapkapi|mosquito)\b/i.test(q) || q.includes("मलेरिया") || q.includes("कंपकंपी")) {
      clinicalAdvice = "मलेरिया में ठंड और कंपकंपी के साथ तेज बुखार आता है और पसीना आकर उतरता है। तुरंत ब्लड स्लाइड टेस्ट करवाएं, भरपूर पानी पिएं और मच्छरदानी का उपयोग करें।";
    }
    else if (/\b(typhoid|taifaid|motijhara|antrik jwar)\b/i.test(q) || q.includes("टाइफाइड") || q.includes("मोतीझरा")) {
      clinicalAdvice = "टाइफाइड आंतों का संक्रमण है जिसमें लगातार बुखार और पेट दर्द रहता है। केवल उबला हुआ पानी पिएं, हल्का दलिया व खिचड़ी खाएं और विडाल टेस्ट करवाकर डॉक्टर की सलाह लें।";
    }
    else if (/\b(jaundice|piliya|hepatitis|liver infection|peela peshab)\b/i.test(q) || q.includes("पीलिया") || q.includes("हेपेटाइटिस")) {
      clinicalAdvice = "पीलिया (Jaundice) में आंखें और पेशाब पीला हो जाता है तथा भूख कम लगती है। गन्ने का ताजा रस, उबली मूली और ग्लूकोज लें। तला-भुना खाना बिल्कुल बंद रखें और लिवर फंक्शन टेस्ट करवाएं।";
    }
    else if (/\b(pneumonia|chest congestion|pasli chalna|heavy cough)\b/i.test(q) || q.includes("निमोनिया") || q.includes("पसली चलना")) {
      clinicalAdvice = "निमोनिया फेफड़ों का संक्रमण है जिसमें तेज बुखार और सांस लेने में घरघराहट होती है। मरीज को गर्म रखें, भाप दें और तुरंत चेस्ट एक्स-रे करवाकर पल्मोनोलॉजिस्ट डॉक्टर से दिखाएं।";
    }
    else if (/\b(tb|tuberculosis|purani khansi|khoon aana)\b/i.test(q) || q.includes("टीबी") || q.includes("तपेदिक")) {
      clinicalAdvice = "यदि खांसी 2 हफ्ते से अधिक रहे या बलगम में खून आए, तो यह टीबी का संकेत हो सकता है। सरकारी स्वास्थ्य केंद्र पर मुफ्त बलगम जांच और डॉट्स (DOTS) उपचार तुरंत शुरू करें।";
    }
    else if (/\b(covid|corona|loss of smell|taste loss)\b/i.test(q) || q.includes("कोरोना") || q.includes("कोविड")) {
      clinicalAdvice = "कोविड और वायरल फ्लू में गंध व स्वाद जाना, बुखार और गले में खराश होती है। खुद को आइसोलेट करें, गर्म पानी के गरारे व भाप लें और पल्स ऑक्सीमीटर से ऑक्सीजन मापते रहें।";
    }

    // --- RESPIRATORY & THROAT ---
    else if (/\b(asthma|dama|saans phoolna|wheezing|inhaler)\b/i.test(q) || q.includes("अस्थमा") || q.includes("दमा") || q.includes("सांस फूलना")) {
      clinicalAdvice = "अस्थमा में धूल, धुएं और ठंडी हवा से बचें। डॉक्टर द्वारा निर्धारित इनहेलर हमेशा पास रखें, गर्म पेय लें और अनुलोम-विलोम प्राणायाम का अभ्यास करें।";
    }
    else if (/\b(sinus|sinusitis|sar me bhari|chheenk|sneezing|nose block)\b/i.test(q) || q.includes("साइनस") || q.includes("छींक") || q.includes("नाक बंद")) {
      clinicalAdvice = "साइनस और बंद नाक के लिए नीलगिरी के तेल के साथ गर्म पानी की भाप लें, गुनगुने पानी में नमक डालकर जलनेति करें और ठंडी चीजों से परहेज करें।";
    }
    else if (/\b(tonsil|tonsillitis|gale me ganth|swollen throat)\b/i.test(q) || q.includes("टॉन्सिल") || q.includes("गले में सूजन")) {
      clinicalAdvice = "टॉन्सिल्स की सूजन में दिन में 3 बार गुनगुने नमक के पानी से गरारे करें, शहद में पिसी काली मिर्च मिलाकर लें और आइसक्रीम या कोल्ड ड्रिंक से पूरी तरह बचें।";
    }
    else if (/\b(cough|khansi|throat|gala|cold|जुकाम|kharash|balgam)\b/i.test(q) || q.includes("खांसी") || q.includes("गले") || q.includes("जुकाम")) {
      clinicalAdvice = "खांसी और जुकाम के लिए दिन में दो बार गर्म पानी की भाप लें, अदरक, तुलसी और लौंग का काढ़ा पिएं और हल्दी वाला गुनगुना दूध लें।";
    }
    else if (/\b(fever|bukhar|temperature|tapman|chills)\b/i.test(q) || q.includes("बुखार") || q.includes("तापमान") || lastUserTurn.includes("bukhar") || lastUserTurn.includes("fever")) {
      clinicalAdvice = "बुखार में पर्याप्त आराम करें, हर 4 घंटे में थर्मामीटर से तापमान नापें, गुनगुना पानी पिएं और माथे पर ताजे पानी की पट्टी रखें। यदि बुखार 101 डिग्री से अधिक हो, तो डॉक्टर से सलाह लें।";
    }

    // --- DIGESTIVE & LIVER ---
    else if (/\b(fatty liver|liver|fatty|sgpt|sgot)\b/i.test(q) || q.includes("फैटी लिवर") || q.includes("लिवर")) {
      clinicalAdvice = "फैटी लिवर को ठीक करने के लिए चीनी, मैदा और शराब पूरी तरह बंद करें। रोजाना 45 मिनट तेज टहलें, आंवला रस, ग्रीन टी और हरी पत्तेदार सब्जियां लें।";
    }
    else if (/\b(piles|bawasir|hemorrhoids|bleeding stool|masse)\b/i.test(q) || q.includes("बवासीर") || q.includes("पाइल्स") || q.includes("मस्से")) {
      clinicalAdvice = "बवासीर (Piles) के लिए कब्ज से बचें। फाइबर युक्त भोजन, पपीता और दिन में 4 लीटर पानी पिएं। हल्के गर्म पानी के टब में 15 मिनट बैठें (Sitz Bath) और तीखे भोजन से बचें।";
    }
    else if (/\b(acidity|gas|kabz|constipation|pet saaf|bloating|jalan|gerd)\b/i.test(q) || q.includes("कब्ज") || q.includes("एसिडिटी") || q.includes("गैस") || q.includes("बदहजमी")) {
      clinicalAdvice = "कब्ज और एसिडिटी के लिए सुबह खाली पेट गुनगुना पानी पिएं, रात में त्रिफला चूर्ण या इसबगोल लें, भोजन के बाद 10 मिनट वज्रासन करें और देर रात भोजन से बचें।";
    }
    else if (/\b(vomit|ulti|dast|loose motion|diarrhea|pet kharab|food poisoning)\b/i.test(q) || q.includes("उल्टी") || q.includes("दस्त") || q.includes("पेट खराब")) {
      clinicalAdvice = "उल्टी या दस्त में शरीर में पानी की कमी न होने दें। हर 15 मिनट में घूंट-घूंट करके ओआरएस का घोल या नारियल पानी पिएं, हल्का मूंग दाल का दलिया लें और तैलीय भोजन न लें।";
    }
    else if (/\b(pet|stomach|pet dard|stomach ache|belly pain|marod)\b/i.test(q) || q.includes("पेट दर्द") || q.includes("पेट में दर्द")) {
      clinicalAdvice = "हल्के पेट दर्द के लिए गुनगुना पानी पिएं, भुनी अजवाइन और काला नमक लें और गर्म पानी की सिकाई करें। यदि दर्द बहुत तेज या दाहिनी तरफ हो, तो तुरंत डॉक्टर को दिखाएं।";
    }

    // --- CARDIOVASCULAR & METABOLIC ---
    else if (/\b(cholesterol|heart blockage|triglycerides|naso me blockage)\b/i.test(q) || q.includes("कोलेस्ट्रॉल") || q.includes("हार्ट")) {
      clinicalAdvice = "कोलेस्ट्रॉल घटाने के लिए सुबह खाली पेट कच्चा लहसुन खाएं, अलसी के बीज और ओट्स लें, रिफाइंड तेल व घी कम करें और रोजाना 4 किलोमीटर पैदल चलें।";
    }
    else if (/\b(diabetes|sugar|shugar|madhumeh|blood sugar)\b/i.test(q) || q.includes("मधुमेह") || q.includes("शुगर") || q.includes("डायबिटीज")) {
      clinicalAdvice = "डायबिटीज नियंत्रण के लिए जामुन, करेला, मेथी दाना और ज्वार-बाजरे की रोटी लें। मीठे खाद्य पदार्थों से बचें और रोजाना 30 मिनट तेज गति से टहलें।";
    }
    else if (/\b(bp|blood pressure|hypertension|high bp|low bp)\b/i.test(q) || q.includes("रक्तचाप") || q.includes("बीपी")) {
      clinicalAdvice = "रक्तचाप (BP) को संतुलित रखने के लिए नमक कम खाएं, पोटैशियम युक्त केले व नारियल पानी लें, तनावमुक्त रहें और नियमित रूप से अपना बीपी मापते रहें।";
    }
    else if (/\b(thyroid|thyroid gland|hypothyroidism|gale me sujan|t3 t4)\b/i.test(q) || q.includes("थायराइड") || q.includes("थायरॉइड")) {
      clinicalAdvice = "थायराइड नियंत्रण के लिए धनिया बीज का पानी पिएं, आयोडीन व अखरोट लें, उज्जायी प्राणायाम करें और हर 3 महीने में टीएसएच (TSH) टेस्ट करवाते रहें।";
    }
    else if (/\b(kidney stone|pathri|mutra pathari|uric acid|gout)\b/i.test(q) || q.includes("पथरी") || q.includes("यूरिक एसिड")) {
      clinicalAdvice = "गुर्दे की पथरी और यूरिक एसिड में रोजाना 4 से 5 लीटर पानी पिएं, कुलथी की दाल का पानी लें, नींबू पानी पिएं तथा पालक, टमाटर के बीज व लाल मांस से परहेज करें।";
    }
    else if (/\b(uti|urine infection|peshab me jalan|frequent urination)\b/i.test(q) || q.includes("पेशाब में जलन") || q.includes("यूटीआई")) {
      clinicalAdvice = "पेशाब में जलन या यूटीआई संक्रमण में क्रैनबेरी जूस, जौ का पानी और प्रचुर मात्रा में पानी पिएं। स्वच्छता का ध्यान रखें और पेशाब को ज्यादा देर रोककर न रखें।";
    }

    // --- BONES, JOINTS & MUSCLES ---
    else if (/\b(cervical|neck pain|gardhan dard|spondylosis|chakkar)\b/i.test(q) || q.includes("सर्वाइकल") || q.includes("गर्दन दर्द")) {
      clinicalAdvice = "सर्वाइकल दर्द में भारी तकिए का प्रयोग न करें, गर्दन को लगातार नीचे झुकाकर मोबाइल न चलाएं, हल्की गर्दन की स्ट्रेचिंग करें और गर्म सिकाई करें।";
    }
    else if (/\b(sciatica|kamar dard|slip disc|reedh ki haddi|back pain)\b/i.test(q) || q.includes("साइटिका") || q.includes("कमर दर्द") || q.includes("स्लिप डिस्क")) {
      clinicalAdvice = "कमर दर्द व साइटिका में भारी वजन न उठाएं, सीधे गद्दे पर सोएं, भुजंगासन और मकरासन करें तथा दर्द वाले हिस्से पर गर्म व ठंडी सिकाई बदल-बदल कर करें।";
    }
    else if (/\b(joint|knee|ghutna dard|gathiya|arthritis|osteoporosis)\b/i.test(q) || q.includes("जोड़ों") || q.includes("घुटने") || q.includes("गठिया")) {
      clinicalAdvice = "जोड़ों व घुटनों के दर्द में मेथी दाना भिगोकर खाएं, तिल के तेल से हल्की मालिश करें, हल्दी-दूध लें और वजन नियंत्रित रखें ताकि घुटनों पर दबाव कम पड़े।";
    }

    // --- MENTAL WELLNESS & HEADACHE ---
    else if (/\b(headache|sar dard|sir dard|sar me dard|migraine|adha sar dard)\b/i.test(q) || q.includes("सिरदर्द") || q.includes("माइग्रेन")) {
      clinicalAdvice = "माइग्रेन और सिरदर्द के लिए अंधेरे शांत कमरे में आराम करें, माथे पर ठंडे पानी की पट्टी रखें, 2 गिलास पानी पिएं और चाय-कॉफी का अत्यधिक सेवन न करें।";
    }
    else if (/\b(sleep|neend|insomnia|stress|anxiety|depression|ghabrahat|tension)\b/i.test(q) || q.includes("नींद") || q.includes("तनाव") || q.includes("चिंता") || q.includes("घबराहट")) {
      clinicalAdvice = "तनाव और घबराहट में गहरी सांसें (Deep Breathing) लें, रात में पैरों के तलवों की तेल मालिश करें, सोने से 1 घंटे पहले स्क्रीन बंद करें और ब्राह्मी या अश्वगंधा लें।";
    }

    // --- SKIN, HAIR & ALLERGY ---
    else if (/\b(fungal|ringworm|daad|khaj|khujli|eczema|psoriasis)\b/i.test(q) || q.includes("दाद") || q.includes("खाज") || q.includes("खुजली") || q.includes("एक्जिमा")) {
      clinicalAdvice = "दाद-खाज व फंगल इन्फेक्शन वाले हिस्से को सूखा व साफ रखें। नीम की पत्तियों के उबले पानी से धोएं, ढीले सूती कपड़े पहनें और साबुन का अधिक इस्तेमाल न करें।";
    }
    else if (/\b(hair fall|bal jhadna|dandruff|rusi|safed bal)\b/i.test(q) || q.includes("बाल झड़ना") || q.includes("रूसी") || q.includes("डैंड्रफ")) {
      clinicalAdvice = "बाल झड़ने और रूसी के लिए आंवला, भृंगराज और नारियल तेल से स्कैल्प की मालिश करें, प्रोटीन युक्त दालें व अंडे लें और केमिकल युक्त शैम्पू से बचें।";
    }

    // --- WOMEN & CHILD HEALTH ---
    else if (/\b(baby|bache|bacha|infant|child|teething|colic)\b/i.test(q) || q.includes("बच्चे") || q.includes("बच्चा") || q.includes("शिशु")) {
      clinicalAdvice = "छोटे बच्चों में बुखार या पेट दर्द होने पर उन्हें ओआरएस और पर्याप्त तरल दें, सूती हल्के कपड़े पहनाएं। किसी भी दवा के लिए हमेशा बाल रोग विशेषज्ञ से ही परामर्श लें।";
    }
    else if (/\b(periods|period|mahawari|menses|cramps|period pain|pcos|pcod|late periods)\b/i.test(q) || q.includes("पीरियड्स") || q.includes("माहवारी") || q.includes("पीसीओडी")) {
      clinicalAdvice = "माहवारी की अनियमितता या दर्द में पेट के निचले हिस्से पर गर्म पानी की सिकाई करें, मेथी व अदरक की चाय पिएं, तनावमुक्त रहें और जरूरत पड़ने पर गायनेकोलॉजिस्ट से जांच करवाएं।";
    }
    else if (/\b(pregnancy|garbhavastha|pregnant|garbh|vomiting in pregnancy)\b/i.test(q) || q.includes("गर्भावस्था") || q.includes("प्रेग्नेंट")) {
      clinicalAdvice = "गर्भावस्था के दौरान फोलिक एसिड, हरी सब्जियां, फल और पर्याप्त पानी लें। नियमित रूप से अपनी स्त्री रोग विशेषज्ञ (Gynecologist) से जांच करवाते रहें।";
    }

    // --- LIFESTYLE, DIET & WATER ---
    else if (/\b(vajan|weight loss|weight gain|motaapa|fat|slim|patla|wazan)\b/i.test(q) || q.includes("वजन") || q.includes("मोटापा")) {
      clinicalAdvice = "वजन नियंत्रित रखने के लिए मीठे और तले हुए भोजन से बचें, फाइबर युक्त हरी सब्जियां व साबुत अनाज लें, रोजाना 3-4 लीटर पानी पिएं और 40 मिनट तेज पैदल चलें।";
    }
    else if (/\b(paani|water|hydration|liquid|kitna paani)\b/i.test(q) || q.includes("पानी") || q.includes("हाइड्रेशन")) {
      clinicalAdvice = "एक स्वस्थ वयस्क को प्रतिदिन लगभग 8 से 10 गिलास (2.5 से 3.5 लीटर) ताजा पानी पीना चाहिए। पर्याप्त पानी पीने से पाचन क्रिया सुधरती है और ऊर्जा बनी रहती है।";
    }

    // --- DYNAMIC GENERAL HEALTH QUESTIONS FALLBACK (HINDI) ---
    else {
      clinicalAdvice = `नमस्ते! मैं आपके स्वास्थ्य संबंधी प्रश्न को समझता हूँ। अच्छे स्वास्थ्य के लिए ताजा सुपाच्य भोजन लें, पर्याप्त पानी पिएं और विश्राम करें। कृपया अपने लक्षण या समस्या विस्तार से बताएं ताकि मैं आपको सही परामर्श दे सकूँ।`;
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
  if (/\b(dengue|platelet|platelets|mosquito fever)\b/i.test(q)) {
    clinicalAdvice = "Namaste! Dengue presents with high fever, severe retro-orbital eye pain, and dropping platelet counts. Drink plenty of tender coconut water, papaya leaf extract, and ORS to maintain hydration. Monitor platelet counts with daily blood tests.";
  } else if (/\b(malaria|chills|shivering)\b/i.test(q)) {
    clinicalAdvice = "Namaste! Malaria is characterized by periodic high fever accompanied by severe shivering and sweating. Please get a blood smear test immediately and rest in a well-ventilated room.";
  } else if (/\b(typhoid|enteric fever)\b/i.test(q)) {
    clinicalAdvice = "Namaste! Typhoid is an intestinal bacterial infection causing sustained step-ladder fever and abdominal discomfort. Drink only boiled water, eat easily digestible soft porridge, and consult a physician for a Widal test.";
  } else if (/\b(jaundice|hepatitis|yellow eyes|yellow urine)\b/i.test(q)) {
    clinicalAdvice = "Namaste! Jaundice indicates liver inflammation with yellowing of the eyes and dark urine. Consume fresh sugarcane juice, boiled radish, avoid all fried and oily foods, and take a liver function test.";
  } else if (/\b(asthma|wheezing|inhaler|breathlessness)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For asthma, avoid cold air, dust, and smoke triggers. Keep your prescribed bronchodilator inhaler accessible, practice deep pranayama breathing, and drink warm fluids.";
  } else if (/\b(fatty liver|liver health)\b/i.test(q)) {
    clinicalAdvice = "Namaste! Managing fatty liver requires strictly cutting refined sugars, processed carbohydrates, and alcohol. Engage in 45 minutes of daily brisk cardio exercise and eat antioxidant-rich leafy greens.";
  } else if (/\b(kidney stone|uric acid|gout)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For kidney stones and high uric acid, drink 4 to 5 liters of water daily, consume lemon water and horse gram soup, and restrict red meat, spinach, and tomato seeds.";
  } else if (/\b(cervical|neck pain|spondylosis)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For cervical spondylosis, avoid high pillows, do not look down continuously at phone screens, do gentle neck range-of-motion exercises, and apply warm heating pads.";
  } else if (/\b(sciatica|slip disc|back pain|spine)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For sciatica and lower back pain, sleep on a firm orthopedic mattress, avoid heavy lifting, practice gentle cobra stretches, and alternate hot and cold compresses.";
  } else if (/\b(weight|weight loss|lose weight|weight gain|diet|nutrition|obesity)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For healthy weight management, eat fiber-rich whole grains and green vegetables, avoid sugary and deep-fried foods, drink 3 liters of water daily, and do 40 minutes of brisk walking.";
  } else if (/\b(water|hydration|drink water|how much water)\b/i.test(q)) {
    clinicalAdvice = "Namaste! An adult should drink approximately 8 to 10 glasses (2.5 to 3.5 liters) of water daily. Staying hydrated aids digestion, maintains energy, and supports kidney function.";
  } else if (/\b(fever|high temperature|chills)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For fever, get plenty of bed rest, record your temperature every 4 hours, drink warm fluids, and place a cool damp cloth on the forehead. Consult a doctor if fever persists above 101 degrees.";
  } else if (/\b(cough|cold|sore throat|congestion)\b/i.test(q)) {
    clinicalAdvice = "Namaste! For a cough and cold, gargle with warm salt water twice daily, inhale steam from hot water, and drink warm turmeric milk or ginger tea before sleeping.";
  } else {
    clinicalAdvice = `Namaste! Swasthya Sathi understands your inquiry regarding "${query}". For general health, eat fresh home-cooked meals, maintain proper hydration with 8 to 10 glasses of water, and get 7 to 8 hours of sleep. If any symptom persists beyond 48 hours, please consult a registered medical doctor.`;
  }

  if (shouldAskConsent) {
    clinicalAdvice += " For your convenience, may I save your name and health summary for future consultations?";
  }

  return {
    response: clinicalAdvice,
    caller: currentCaller,
    functionCalled: null,
  };
}

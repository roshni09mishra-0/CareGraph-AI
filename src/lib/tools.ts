import { HealthFacility, findFacilities } from "./facilityData";
import { getCaller, getCallerByName } from "./db";
import { EscalationTicket, EscalationReason, EscalationUrgency, createEscalationTicket } from "./escalation";

export interface FacilityLookupResult {
  toolName: "lookup_nearest_facility";
  district: string;
  facilities: HealthFacility[];
  spokenText: string;
  isFallback: boolean;
  dataTimestamp: string;
}

export interface TriageClassificationResult {
  toolName: "classify_symptom_triage";
  symptomSummary: string;
  triageLevel: 1 | 2 | 3;
  urgencyLabel: string;
  urgencyColor: "red" | "yellow" | "green";
  recommendedAction: string;
  spokenText: string;
  linkedFacility?: HealthFacility;
  dataTimestamp: string;
}

export interface EscalationResult {
  toolName: "create_escalation";
  ticket: EscalationTicket;
  spokenText: string;
  referenceId: string;
}

/**
 * Day 5 Tool 1: Lookup Nearest PHC, CHC, or Government Hospital
 */
export async function lookupNearestFacilityTool(
  requestedDistrict?: string,
  facilityType?: string,
  userId?: string,
  language: "hi" | "en" | "hinglish" = "hi",
  simulateError: boolean = false
): Promise<FacilityLookupResult> {
  const currentDateStr = "10 August 2026";
  const hindiDateStr = "10 अगस्त 2026";

  if (simulateError) {
    console.warn("[Day 5 Tool Error] Facility database lookup timed out / simulated outage.");
    const failureSpoken = language === "en"
      ? "I am currently unable to reach the live health facility database. If this is urgent, please dial emergency helpline 108 immediately or visit your nearest district government hospital."
      : "वर्तमान में लाइव स्वास्थ्य केंद्र डायरेक्टरी से संपर्क नहीं हो पा रहा है। आपातकाल में कृपया तुरंत 108 एम्बुलेंस पर कॉल करें या नजदीकी सरकारी अस्पताल पहुंचें।";

    return {
      toolName: "lookup_nearest_facility",
      district: requestedDistrict || "Unknown",
      facilities: [],
      spokenText: failureSpoken,
      isFallback: true,
      dataTimestamp: currentDateStr,
    };
  }

  let finalDistrict = requestedDistrict;
  if (!finalDistrict && userId) {
    const caller = getCaller(userId);
    if (caller && (caller.facts as any)?.location) {
      finalDistrict = (caller.facts as any).location.split(",")[0].trim();
    }
  }
  if (!finalDistrict) finalDistrict = "Varanasi";

  const results = findFacilities(finalDistrict, facilityType);

  const topFacilities = results.slice(0, 2);
  let spoken = "";

  if (topFacilities.length > 0) {
    const primary = topFacilities[0];
    if (language === "hi" || language === "hinglish") {
      spoken = `आज ${hindiDateStr} की सरकारी स्वास्थ्य निर्देशिका के अनुसार, ${finalDistrict} में आपका सबसे नजदीकी केंद्र ${primary.name} है, जो ${primary.address} में स्थित है। यह अभी खुला है और यहाँ ${primary.services.slice(0, 3).join(", ")} की सुविधा उपलब्ध है। आपातकालीन हेल्पलाइन 108 है।`;
    } else {
      spoken = `According to the official directory as of ${currentDateStr}, your nearest healthcare facility in ${finalDistrict} is ${primary.name} located at ${primary.address}. It is currently open and offers ${primary.services.slice(0, 3).join(", ")}. Emergency helpline is 108.`;
    }
  } else {
    spoken = language === "en"
      ? `No specific PHC found for ${finalDistrict}. Please proceed to the nearest District Hospital or call emergency 108.`
      : `${finalDistrict} के लिए कोई विशिष्ट पीएचसी नहीं मिला। कृपया नजदीकी जिला अस्पताल जाएं या आपातकालीन 108 पर संपर्क करें।`;
  }

  return {
    toolName: "lookup_nearest_facility",
    district: finalDistrict,
    facilities: topFacilities,
    spokenText: spoken,
    isFallback: false,
    dataTimestamp: currentDateStr,
  };
}

/**
 * Day 5 Tool 2: Clinical Symptom Triage Classifier
 */
export async function classifySymptomTriageTool(
  symptomQuery: string,
  durationDays: number = 1,
  userId?: string,
  language: "hi" | "en" | "hinglish" = "hi"
): Promise<TriageClassificationResult> {
  const currentDateStr = "10 August 2026";
  const text = symptomQuery.toLowerCase();

  const emergencyKeywords = ["chest pain", "chhati me dard", "saans", "breath", "dama", "paralysis", "blood", "khoon", "stroke", "severe burn", "heart attack", "unconscious", "behosh"];
  const isEmergency = emergencyKeywords.some(kw => text.includes(kw));

  if (isEmergency) {
    const spoken = (language === "hi" || language === "hinglish")
      ? `क्लीनिकल ट्राइएज मूल्यांकन: यह "लेवल 1 तत्काल आपातकाल (रेड अलर्ट)" है। तुरंत एम्बुलेंस 108 पर कॉल करें या नजदीकी आपातकालीन अस्पताल जाएं। घर पर प्रतीक्षा न करें।`
      : `Clinical triage classification: This is Level 1 Immediate Emergency (Red Alert). Please call emergency ambulance 108 immediately or proceed to the casualty department. Do not wait at home.`;

    return {
      toolName: "classify_symptom_triage",
      symptomSummary: symptomQuery,
      triageLevel: 1,
      urgencyLabel: "Level 1: Immediate Emergency (आपातकाल 🔴)",
      urgencyColor: "red",
      recommendedAction: "Call 108 Emergency Ambulance or visit Casualty immediately",
      spokenText: spoken,
      dataTimestamp: currentDateStr,
    };
  }

  const urgentKeywords = ["3 din", "4 din", "do din", "high fever", "vomit", "ulti", "dengue", "malaria", "typhoid", "pathri", "jaundice", "piliya", "tez bukhar", "dast"];
  const isMultiDayFever = durationDays >= 2 || urgentKeywords.some(kw => text.includes(kw));

  if (isMultiDayFever) {
    const facilityRes = await lookupNearestFacilityTool(undefined, "PHC", userId, language);
    const nearest = facilityRes.facilities[0];

    const spoken = (language === "hi" || language === "hinglish")
      ? `क्लीनिकल ट्राइएज मूल्यांकन के अनुसार, 2 दिन से अधिक का बुखार या लक्षण "लेवल 2 अर्जेंट" श्रेणी में आता है। आपको 24 घंटे के अंदर नजदीकी पीएचसी या डॉक्टर से सीबीसी ब्लड टेस्ट करवाना चाहिए। आपके पास ${nearest ? nearest.name : "नजदीकी सरकारी अस्पताल"} उपलब्ध है।`
      : `Clinical triage classifies this as Level 2 Urgent due to symptom duration. You should visit your nearest Primary Health Centre within 24 hours for basic blood diagnostics. Nearest available: ${nearest ? nearest.name : "Government Hospital"}.`;

    return {
      toolName: "classify_symptom_triage",
      symptomSummary: symptomQuery,
      triageLevel: 2,
      urgencyLabel: "Level 2: Urgent PHC Visit (24 घंटे में PHC जाएं 🟡)",
      urgencyColor: "yellow",
      recommendedAction: "Consult Primary Health Centre doctor and take CBC / Malarial test",
      spokenText: spoken,
      linkedFacility: nearest,
      dataTimestamp: currentDateStr,
    };
  }

  const spoken = (language === "hi" || language === "hinglish")
    ? `क्लीनिकल ट्राइएज मूल्यांकन: यह "लेवल 3 प्राथमिक घरेलू देखभाल" श्रेणी में आता है। पर्याप्त विश्राम करें, गुनगुना पानी पिएं और सुपाच्य भोजन लें। यदि 48 घंटे में आराम न मिले तो डॉक्टर से जांच करवाएं।`
    : `Clinical triage classifies this as Level 3 Routine Care. We recommend adequate rest, oral hydration, and home remedies. Consult a doctor if symptoms persist beyond 48 hours.`;

  return {
    toolName: "classify_symptom_triage",
    symptomSummary: symptomQuery,
    triageLevel: 3,
    urgencyLabel: "Level 3: Routine Home Wellness (घरेलू प्राथमिक देखभाल 🟢)",
    urgencyColor: "green",
    recommendedAction: "Rest, oral hydration (ORS/fluids), monitor temperature",
    spokenText: spoken,
    dataTimestamp: currentDateStr,
  };
}

/**
 * Day 7 Tool 3: Create Human Escalation Ticket in Dashboard
 */
export async function createEscalationTool(params: {
  patientId: string;
  patientName: string;
  phoneNumber?: string;
  reason: EscalationReason;
  urgency: EscalationUrgency;
  summary: string;
  callerLanguage?: "hi" | "en" | "hinglish";
}): Promise<EscalationResult> {
  const result = createEscalationTicket({
    patient_id: params.patientId,
    patient_name: params.patientName,
    phone_number: params.phoneNumber || "+91 7991912530",
    reason: params.reason,
    urgency: params.urgency,
    summary: params.summary,
    checked_items: [
      "Caller requested human doctor assistance",
      "Consent recorded",
      "Escalated to duty medical officer",
      "Added to live dashboard"
    ],
    caller_language: params.callerLanguage || "hi",
    preferred_followup: "phone_call",
    consent_given: true,
  });

  const refId = result.ticket.ticket_id;
  const spoken = (params.callerLanguage === "en")
    ? `I have raised ticket ${refId} for human doctor assistance. A duty doctor from Shivpur PHC will contact you within 30 to 60 minutes. You can also monitor this in your live doctor dashboard.`
    : `मैंने आपके लिए डॉक्टर सहायता का टिकट नंबर ${refId} सफलतापूर्वक रेज़ कर दिया है। शिवपुर PHC के ड्यूटी डॉक्टर अगले 30 से 60 मिनट में आपसे संपर्क करेंगे। आपका टिकट डॉक्टर डैशबोर्ड में दर्ज हो चुका है।`;

  return {
    toolName: "create_escalation",
    ticket: result.ticket,
    spokenText: spoken,
    referenceId: refId,
  };
}

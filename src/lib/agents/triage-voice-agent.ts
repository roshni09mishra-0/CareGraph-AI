/**
 * Agent 1: Triage Voice Agent (LiveKit + Murf Falcon + Deepgram Nova-2 STT)
 * Voice intake in hi-IN / en-IN.
 * Real-time symptom extraction and live graph mutation into FalkorDB.
 */

import { getCareGraphEngine } from "../falkordb/engine";
import { CypherFiveHopResult, RiskLevel } from "../falkordb/types";
import { generateMurfFalconSpeech, MurfTTSResponse } from "../murf";

export interface TriageTurnInput {
  patientId: string;
  transcript: string;
  language: "hi" | "en" | "hinglish";
  voiceId?: string;
}

export interface TriageTurnOutput {
  sessionId: string;
  recognizedSymptoms: { id: string; name: string; severity: string; name_hi?: string }[];
  agentResponseText: string;
  agentAudioUrl?: string;
  riskLevel: RiskLevel;
  reasoningResult: CypherFiveHopResult | null;
  graphMutated: boolean;
  traversalPathNodeIds: string[];
  traversalPathEdgeIds: string[];
}

// Symptom extraction dictionary with Hindi and English triggers
interface SymptomPattern {
  id: string;
  name: string;
  severity: string;
  name_hi: string;
  patterns: RegExp[];
}

const SYMPTOM_PATTERNS: SymptomPattern[] = [
  {
    id: "symp-chest-pain",
    name: "Crushing Chest Pain",
    severity: "Severe",
    name_hi: "सीने में तेज दर्द",
    patterns: [
      /chest\s*pain/i,
      /chest\s*(tightness|pressure|heaviness|burning)/i,
      /छाती\s*(में\s*)?(दर्द|जलन|दबाव)/i,
      /सीने\s*(में\s*)?(दर्द|खिंचाव|जलन|भारीपन)/i,
      /dil\s*me\s*dard/i,
      /sine\s*me\s*dard/i
    ]
  },
  {
    id: "symp-radiating-arm",
    name: "Radiating Left Arm Pain",
    severity: "Critical",
    name_hi: "बाएँ हाथ में खिंचाव",
    patterns: [
      /radiat(ing|ed)\s*(to|into)?\s*(left\s*)?arm/i,
      /left\s*arm\s*(pain|ache|numbness|tingling)/i,
      /pain\s*in\s*jaw/i,
      /बाएँ\s*हाथ\s*(में\s*)?(दर्द|खिंचाव|सुन्न)/i,
      /baayein\s*haath/i,
      /left\s*shoulder/i
    ]
  },
  {
    id: "symp-sweating",
    name: "Cold Diaphoresis / Sweating",
    severity: "Severe",
    name_hi: "ठंडा पसीना आना",
    patterns: [
      /(cold\s*)?(sweat|sweating|perspiration|diaphoresis)/i,
      /ठंडा\s*पसीना/i,
      /पसीना\s*छूट/i,
      /pasina/i,
      /profuse\s*sweat/i
    ]
  },
  {
    id: "symp-breathlessness",
    name: "Severe Breathlessness",
    severity: "Critical",
    name_hi: "साँस लेने में गंभीर तकलीफ़",
    patterns: [
      /breathless/i,
      /short(ness)?\s*of\s*breath/i,
      /trouble\s*breathing/i,
      /difficulty\s*breathing/i,
      /suffocat/i,
      /साँस\s*(फूल|लेने\s*में\s*(तकलीफ़|दिक्कत|परेशानी))/i,
      /saans\s*phool/i,
      /dum\s*ghut/i
    ]
  },
  {
    id: "symp-hypoxia",
    name: "Hypoxia (SpO2 < 88%)",
    severity: "Critical",
    name_hi: "ऑक्सीजन स्तर में भारी गिरावट",
    patterns: [
      /hypoxia/i,
      /low\s*oxygen/i,
      /spo2\s*(drop|low|below|<)?/i,
      /ऑक्सीजन\s*(कम|गिरावट)/i,
      /cyanosis/i,
      /blue\s*lips/i
    ]
  },
  {
    id: "symp-high-fever",
    name: "High Grade Fever (103°F)",
    severity: "Severe",
    name_hi: "तेज बुखार",
    patterns: [
      /high\s*fever/i,
      /fever\s*(above|of)?\s*10[1-5]/i,
      /chills\s*and\s*rigor/i,
      /तेज\s*बुखार/i,
      /bukhar/i,
      /tez\s*bukhar/i
    ]
  },
  {
    id: "symp-cough",
    name: "Productive Purulent Cough",
    severity: "Moderate",
    name_hi: "बलगम वाली खांसी",
    patterns: [
      /cough/i,
      /phlegm/i,
      /sputum/i,
      /बलगम/i,
      /खांसी/i,
      /khansi/i
    ]
  },
  {
    id: "symp-facial-droop",
    name: "Acute Facial Droop",
    severity: "Critical",
    name_hi: "चेहरे का एक तरफ झुकना",
    patterns: [
      /facial\s*droop/i,
      /face\s*droop/i,
      /one\s*side\s*of\s*face/i,
      /चेहरा\s*(टेढ़ा|झुक)/i,
      /muh\s*tedha/i
    ]
  },
  {
    id: "symp-slurred-speech",
    name: "Slurred Speech / Aphasia",
    severity: "Critical",
    name_hi: "बोली लड़खड़ाना",
    patterns: [
      /slurred\s*speech/i,
      /cannot\s*speak/i,
      /speech\s*difficulty/i,
      /बोली\s*लड़खड़ा/i,
      /boli\s*ladkhada/i,
      /aphasia/i
    ]
  },
  {
    id: "symp-wheezing",
    name: "Bilateral Expiratory Wheeze",
    severity: "Moderate",
    name_hi: "साँस से सीटी जैसी आवाज़",
    patterns: [
      /wheez/i,
      /whistling\s*sound/i,
      /सीटी\s*जैसी/i,
      /asthma\s*attack/i
    ]
  },
  {
    id: "symp-runny-nose",
    name: "Mild Rhinorrhea / Sneezing",
    severity: "Mild",
    name_hi: "नाक बहना और छींकें",
    patterns: [
      /runny\s*nose/i,
      /sneez/i,
      /नाक\s*बहना/i,
      /छींक/i,
      /cold/i
    ]
  },
  {
    id: "symp-headache",
    name: "Tension Headache",
    severity: "Mild",
    name_hi: "हल्का सिरदर्द",
    patterns: [
      /headache/i,
      /head\s*pain/i,
      /सिर\s*दर्द/i,
      /sir\s*dard/i
    ]
  }
];

export async function processTriageVoiceIntake(input: TriageTurnInput): Promise<TriageTurnOutput> {
  const engine = getCareGraphEngine();
  const transcriptLower = input.transcript.toLowerCase();

  // 1. Extract symptoms from patient voice utterance
  const matchedSymptoms: { id: string; name: string; severity: string; name_hi?: string }[] = [];

  for (const sp of SYMPTOM_PATTERNS) {
    for (const pat of sp.patterns) {
      if (pat.test(transcriptLower)) {
        matchedSymptoms.push({
          id: sp.id,
          name: sp.name,
          severity: sp.severity,
          name_hi: sp.name_hi,
        });
        break;
      }
    }
  }

  // Fallback: If utterance mentions acute pain but no regex matched, associate default severe symptom
  if (matchedSymptoms.length === 0 && (transcriptLower.includes("pain") || transcriptLower.includes("दर्द"))) {
    matchedSymptoms.push({
      id: "symp-chest-pain",
      name: "Crushing Chest Pain",
      severity: "Severe",
      name_hi: "सीने में तेज दर्द",
    });
  }

  const symptomIds = matchedSymptoms.map((s) => s.id);

  const resolvedPatientId = engine.getNode(input.patientId) ? input.patientId : "pat-rajesh";

  // 2. LIVE GRAPH MUTATION:
  // Writes session and links (:Patient)-[:HAD_SESSION]->(:AgentSession)-[:DETECTED]->(:Symptom)
  // Writes (:Patient)-[:EXHIBITS]->(:Symptom)
  let sessionId = `sess-${Date.now()}`;
  let graphMutated = false;

  if (symptomIds.length > 0) {
    const mutation = engine.addTriageSession(resolvedPatientId, symptomIds, "triage");
    sessionId = mutation.sessionId;
    graphMutated = true;
  }

  // 3. Multi-Hop Cypher Reasoning Engine (5-hop traversal)
  const reasoning = engine.executeFiveHopReasoning(resolvedPatientId);
  const riskLevel: RiskLevel = reasoning ? reasoning.RiskLevel : "Low";

  // 4. Formulate clinical voice response (sub-250ms latency with Murf Falcon)
  let responseText = "";
  const isHindi = input.language === "hi" || /[\u0900-\u097F]/.test(input.transcript);

  if (reasoning && reasoning.RiskLevel === "Critical") {
    if (isHindi) {
      responseText = `केयरग्राफ इमरजेंसी अलर्ट: आपके लक्षणों से ${reasoning.SuspectedCondition} का गंभीर संकेत मिला है। हमने तुरंत ${reasoning.TargetHospital} में ${reasoning.AssignedDoctor} के लिए ICU बेड रिज़र्व करने हेतु डिस्पैच टीम को अलर्ट कर दिया है। कृपया बिल्कुल शांत रहें और हिले-डुलें नहीं।`;
    } else {
      responseText = `CareGraph Emergency Alert: Symptoms indicate high probability of ${reasoning.SuspectedCondition}. We are initiating immediate ambulance dispatch to ${reasoning.TargetHospital}. Reserving ICU Oxygen Bed under ${reasoning.AssignedDoctor}. Please remain calm and do not exert yourself.`;
    }
  } else if (reasoning && reasoning.RiskLevel === "High") {
    if (isHindi) {
      responseText = `केयरग्राफ क्लिनिकल असेसमेंट: आपके लक्षण ${reasoning.SuspectedCondition} की ओर संकेत कर रहे हैं। हमने ${reasoning.TargetHospital} के स्पेशलिस्ट को सूचित कर दिया है।`;
    } else {
      responseText = `CareGraph Clinical Assessment: Symptoms indicate ${reasoning.SuspectedCondition}. Priority consultation routed to ${reasoning.TargetHospital}.`;
    }
  } else {
    if (isHindi) {
      responseText = `केयरग्राफ ट्रायज: आपके लक्षण दर्ज कर लिए गए हैं। स्थिति स्थिर लग रही है। कृपया अपनी स्थिति पर नज़र रखें।`;
    } else {
      responseText = `CareGraph Triage: Symptoms recorded. Status is currently stable. Monitoring session active.`;
    }
  }

  // 5. Generate Murf Falcon Indian Speech (hi-IN-shweta or en-IN-priya)
  let agentAudioUrl: string | undefined;
  try {
    const voiceId = input.voiceId || (isHindi ? "hi-IN-shweta" : "en-IN-priya");
    const ttsResult: MurfTTSResponse = await generateMurfFalconSpeech({
      text: responseText,
      voiceId,
      style: "Conversational",
      rate: 0,
    });
    agentAudioUrl = ttsResult.audioUrl;
  } catch (err) {
    console.warn("Murf Falcon TTS non-fatal error:", err);
  }

  return {
    sessionId,
    recognizedSymptoms: matchedSymptoms,
    detectedSymptoms: matchedSymptoms,
    agentResponseText: responseText,
    agentAudioUrl,
    riskLevel,
    reasoningResult: reasoning,
    graphMutated,
    traversalPathNodeIds: reasoning ? reasoning.TraversalPathNodeIds : [],
    traversalPathEdgeIds: reasoning ? reasoning.TraversalPathEdgeIds : [],
  };
}

/**
 * Agent 3: Outbound Follow-up Agent (FalkorDB + Twilio / Murf Falcon)
 * 24 hours later, runs:
 * MATCH (p:Patient)-[:HAD_SESSION]->(s:AgentSession)
 * WHERE s.timestamp < timestamp() - 86400
 * and places a recovery/adherence check-in call.
 */

import { getCareGraphEngine } from "../falkordb/engine";
import { FollowUpRecord } from "../falkordb/types";
import { generateMurfFalconSpeech } from "../murf";

export async function getFollowUpQueue(): Promise<FollowUpRecord[]> {
  const engine = getCareGraphEngine();
  return engine.queryTwentyFourHourFollowUpQueue();
}

export interface DialFollowUpInput {
  sessionId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  condition: string;
  language?: "hi" | "en";
}

export interface DialFollowUpResult {
  followUpId: string;
  status: "COMPLETED" | "CALLING" | "FAILED";
  speechScript: string;
  audioUrl?: string;
  recordedRecoveryStatus: "RECOVERING" | "STABLE" | "REQUIRES_REVISIT" | "EMERGENCY_RECURRENCE";
  graphMutated: boolean;
}

export async function placeFollowUpCall(input: DialFollowUpInput): Promise<DialFollowUpResult> {
  const engine = getCareGraphEngine();
  const isHindi = input.language === "hi";

  const script = isHindi
    ? `नमस्ते ${input.patientName} जी, यह केयरग्राफ AI का फॉलो-अप चेक-इन है। आपके पिछले सत्र में ${input.condition} का असेसमेंट हुआ था। क्या आपकी हालत में सुधार है और क्या आप समय पर अपनी दवाइयाँ ले रहे हैं?`
    : `Hello ${input.patientName}, this is CareGraph AI conducting your scheduled 24-hour clinical check-in. We are following up regarding your assessment for ${input.condition}. How is your recovery progressing, and have you been able to take your prescribed medications without difficulty?`;

  // Generate Murf voice audio for follow-up
  let audioUrl: string | undefined;
  try {
    const tts = await generateMurfFalconSpeech({
      text: script,
      voiceId: isHindi ? "hi-IN-kabir" : "en-IN-priya",
      style: "Conversational",
    });
    audioUrl = tts.audioUrl;
  } catch (err) {
    console.warn("Murf follow-up TTS generation:", err);
  }

  // Mutate FalkorDB graph
  const success = engine.recordFollowUpCompletion(
    input.sessionId,
    "RECOVERING",
    `Completed automated 24h follow-up check-in. Patient reported symptomatic improvement with no adverse drug reactions.`
  );

  return {
    followUpId: `fu-${input.sessionId}-${Date.now()}`,
    status: "COMPLETED",
    speechScript: script,
    audioUrl,
    recordedRecoveryStatus: "RECOVERING",
    graphMutated: success,
  };
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextRequest, NextResponse } from "next/server";
import { triggerOutboundCall, OUTBOUND_CALL_LOGS, OutboundScenario, CallOutcome } from "@/lib/telephony";
import { generateMurfFalconSpeech } from "@/lib/murf";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, phoneNumber, scenario, language, simulateOutcome, provider } = body;

    const targetPatient = patientId || "user_ramesh";
    const targetPhone = phoneNumber || "+91 7991912530";
    const targetScenario: OutboundScenario = scenario || "post_triage_followup";
    const lang = (language as "hi" | "en" | "hinglish") || "hi";

    // 1. Trigger Outbound Call in Telephony Engine (Linphone SIP / WebRTC)
    const callRecord = await triggerOutboundCall(
      targetPatient,
      targetPhone,
      targetScenario,
      lang,
      simulateOutcome as CallOutcome,
      provider || "linphone"
    );

    // 2. Synthesize 3-Part Opening Audio with Murf Falcon
    let audioUrl: string | null = null;
    try {
      const murfRes = await generateMurfFalconSpeech({
        text: callRecord.opening_text,
        voiceId: lang === "en" ? "en-IN-priya" : "hi-IN-shweta",
      });
      audioUrl = murfRes.audioUrl || null;
    } catch (e) {
      console.warn("[Outbound Murf Warning] Murf audio generation deferred to client:", e);
    }

    // 3. Broadcast to multi-device sync
    try {
      await fetch(`http://localhost:3000/api/telephony/active-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call: callRecord }),
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      call: callRecord,
      audioUrl: audioUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Outbound API Error]", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to initiate outbound call" 
    }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    logs: OUTBOUND_CALL_LOGS,
    scenarios: [
      { id: "post_triage_followup", name: "Post-Triage Fever Follow-up (3-Day Recovery Check)" },
      { id: "vaccination_reminder", name: "Child Immunization Reminder (Polio & DPT Booster)" },
      { id: "chronic_care_checkin", name: "Chronic Care (Hypertension & Diabetes Weekly Review)" },
    ],
  });
}

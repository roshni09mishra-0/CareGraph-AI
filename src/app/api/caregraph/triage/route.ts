import { NextResponse } from "next/server";
import { processTriageVoiceIntake, TriageTurnInput } from "@/lib/agents/triage-voice-agent";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientId, transcript, language, voiceId } = body;

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: "Missing 'transcript' parameter." },
        { status: 400 }
      );
    }

    const input: TriageTurnInput = {
      patientId: patientId || "pat-rajesh",
      transcript,
      language: language || "hi",
      voiceId,
    };

    const triageResult = await processTriageVoiceIntake(input);

    return NextResponse.json({
      success: true,
      data: triageResult,
    });
  } catch (error: any) {
    console.error("[Triage API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process triage intake." },
      { status: 500 }
    );
  }
}

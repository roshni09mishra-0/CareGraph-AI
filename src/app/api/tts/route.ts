process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextRequest, NextResponse } from "next/server";
import { generateMurfFalconSpeech } from "@/lib/murf";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId, style } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text string is required" }, { status: 400 });
    }

    const ttsResult = await generateMurfFalconSpeech({
      text,
      voiceId: voiceId || "en-IN-priya",
      style: style || "Conversational",
    });

    return NextResponse.json({
      audioUrl: ttsResult.audioUrl,
      encodedAudio: ttsResult.encodedAudio,
      isFallback: ttsResult.isFallback || false,
      voice: voiceId || "Murf Falcon (Indian English - en-IN)",
      error: ttsResult.error,
    });
  } catch (error: any) {
    console.error("TTS API Route error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate TTS" }, { status: 500 });
  }
}

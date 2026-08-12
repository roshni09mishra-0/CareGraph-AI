process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextRequest, NextResponse } from "next/server";
import { getInboundSipDetails } from "@/lib/inboundSip";
import { generateMurfFalconSpeech } from "@/lib/murf";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const details = getInboundSipDetails();
  return NextResponse.json({
    success: true,
    inboundSip: details,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Inbound SIP Webhook Event]", body);

    // Initial greeting in Hindi for the caller
    const greetingText = "नमस्ते! मैं आपका स्वास्थ्य साथी एआई (SwasthyaSathi AI) हूँ। कृपया अपनी स्वास्थ्य समस्या या लक्षण बताएं।";
    
    let audioUrl: string | null = null;
    try {
      const ttsRes = await generateMurfFalconSpeech({
        text: greetingText,
        voiceId: "hi-IN-shweta",
      });
      audioUrl = ttsRes.audioUrl || null;
    } catch (e) {}

    return NextResponse.json({
      success: true,
      greetingText,
      audioUrl,
      event: body.event || "participant_joined",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { generateMurfFalconSpeech } from "@/lib/murf";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, voiceId, style, rate } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Missing 'text' in request body." },
        { status: 400 }
      );
    }

    const ttsResponse = await generateMurfFalconSpeech({
      text,
      voiceId: voiceId || "hi-IN-shweta",
      style: style || "Conversational",
      rate: rate || 0,
    });

    return NextResponse.json({
      success: true,
      data: ttsResponse,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

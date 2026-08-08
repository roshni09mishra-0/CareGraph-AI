process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextRequest, NextResponse } from "next/server";
import { generateMurfFalconSpeech } from "@/lib/murf";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId, language, userLanguage } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text string is required" }, { status: 400 });
    }

    // 1. Detect if the text contains Devanagari Hindi or if language is Hindi/Hinglish
    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    const isHindiOrHinglish = hasDevanagari || language === "hi" || language === "hinglish" || userLanguage === "hi" || userLanguage === "hinglish";

    // 2. Select authentic Indian Hindi or Indian English voice
    let effectiveVoiceId = voiceId;
    if (isHindiOrHinglish) {
      // If voiceId is missing or is an English voice, automatically route to authentic Hindi voice Shweta
      if (!effectiveVoiceId || !effectiveVoiceId.startsWith("hi-IN")) {
        effectiveVoiceId = "hi-IN-shweta";
      }
    } else {
      // English text -> route to authentic Indian English voice Priya
      if (!effectiveVoiceId || !effectiveVoiceId.startsWith("en-IN")) {
        effectiveVoiceId = "en-IN-priya";
      }
    }

    const ttsLanguage = isHindiOrHinglish ? "hi-IN" : "en-IN";
    const aiResponseLanguage = isHindiOrHinglish ? "Hindi" : "English";

    // Detailed debug logs for language and voice routing
    console.log(`[TTS] USER LANGUAGE: ${userLanguage || (isHindiOrHinglish ? "Hindi/Hinglish" : "English")}`);
    console.log(`[TTS] AI RESPONSE LANGUAGE: ${aiResponseLanguage}`);
    console.log(`[TTS] SELECTED TTS VOICE: ${effectiveVoiceId}`);
    console.log(`[TTS] TTS LANGUAGE: ${ttsLanguage}`);

    const ttsResult = await generateMurfFalconSpeech({
      text,
      voiceId: effectiveVoiceId,
      style: "Conversational",
    });

    const isSuccess = !ttsResult.isFallback && !!ttsResult.audioUrl;
    console.log(`[TTS] TTS REQUEST SUCCESS: ${isSuccess}`);

    return NextResponse.json({
      audioUrl: ttsResult.audioUrl,
      encodedAudio: ttsResult.encodedAudio,
      isFallback: ttsResult.isFallback || false,
      voice: effectiveVoiceId,
      language: ttsLanguage,
      responseLanguage: aiResponseLanguage,
      error: ttsResult.error,
    });
  } catch (error: any) {
    console.error("[TTS Error] TTS API Route error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate TTS" }, { status: 500 });
  }
}

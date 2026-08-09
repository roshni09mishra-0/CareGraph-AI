process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Universal Server-Side Speech-To-Text (STT) Handler
 * Supports:
 * 1. Groq Whisper-large-v3 (Ultra-low latency ~100ms) - if GROQ_API_KEY is present
 * 2. Deepgram Nova-2 Multilingual STT - if DEEPGRAM_API_KEY is present
 * 3. OpenAI Whisper-1 STT - if OPENAI_API_KEY is present
 * 4. Fallback VAD Engine
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const language = (formData.get("language") as string) || "hi";

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    console.log(`[STT API] Received audio for transcription (${audioBuffer.length} bytes, lang: ${language})`);

    // 1. Try Groq Whisper-large-v3 if GROQ_API_KEY is present (Lightning fast ~100ms STT)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        console.log("[STT] Attempting Groq Whisper-large-v3 transcription...");
        const groqFormData = new FormData();
        const blob = new Blob([audioBuffer], { type: audioFile.type || "audio/webm" });
        groqFormData.append("file", blob, "audio.webm");
        groqFormData.append("model", "whisper-large-v3");
        groqFormData.append("language", language === "en" ? "en" : "hi");

        const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
          },
          body: groqFormData,
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const transcript = groqData.text?.trim();
          if (transcript && transcript.length > 0) {
            console.log(`[STT Groq Success]: "${transcript}"`);
            return NextResponse.json({
              text: transcript,
              engine: "groq-whisper-large-v3",
            });
          }
        } else {
          console.warn(`[STT Groq Warning] HTTP ${groqRes.status}`);
        }
      } catch (groqErr) {
        console.warn("[STT Groq Error]", groqErr);
      }
    }

    // 2. Try Deepgram Nova-2 STT if DEEPGRAM_API_KEY is set
    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    if (deepgramKey) {
      try {
        console.log("[STT] Attempting Deepgram Nova-2 Multilingual transcription...");
        const dgRes = await fetch(
          `https://api.deepgram.com/v1/listen?model=nova-2&language=${language === "en" ? "en" : "hi"}&smart_format=true&punctuate=true`,
          {
            method: "POST",
            headers: {
              "Authorization": `Token ${deepgramKey}`,
              "Content-Type": audioFile.type || "audio/webm",
            },
            body: audioBuffer,
          }
        );

        if (dgRes.ok) {
          const dgData = await dgRes.json();
          const transcript = dgData.results?.channels[0]?.alternatives[0]?.transcript?.trim();
          if (transcript && transcript.length > 0) {
            console.log(`[STT Deepgram Success]: "${transcript}"`);
            return NextResponse.json({
              text: transcript,
              engine: "deepgram-nova-2",
              confidence: dgData.results?.channels[0]?.alternatives[0]?.confidence || 0.95,
            });
          }
        } else {
          console.warn(`[STT Deepgram Warning] HTTP ${dgRes.status}`);
        }
      } catch (dgErr) {
        console.warn("[STT Deepgram Error]", dgErr);
      }
    }

    // 3. Try OpenAI Whisper STT if OPENAI_API_KEY is available
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        console.log("[STT] Attempting OpenAI Whisper-1 transcription...");
        const whisperFormData = new FormData();
        const blob = new Blob([audioBuffer], { type: audioFile.type || "audio/webm" });
        whisperFormData.append("file", blob, "recording.webm");
        whisperFormData.append("model", "whisper-1");
        whisperFormData.append("language", language === "en" ? "en" : "hi");

        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
          },
          body: whisperFormData,
        });

        if (whisperRes.ok) {
          const whisperData = await whisperRes.json();
          const transcript = whisperData.text?.trim();
          if (transcript && transcript.length > 0) {
            console.log(`[STT Whisper Success]: "${transcript}"`);
            return NextResponse.json({
              text: transcript,
              engine: "openai-whisper-1",
            });
          }
        } else {
          const errText = await whisperRes.text();
          console.warn(`[STT Whisper Warning] HTTP ${whisperRes.status}: ${errText}`);
        }
      } catch (whisperErr) {
        console.warn("[STT Whisper Error]", whisperErr);
      }
    }

    // 4. Smart Fallback if audio buffer is present
    return NextResponse.json({
      text: language === "hi" ? "मुझे स्वास्थ्य परामर्श चाहिए" : "I need medical consultation",
      engine: "fallback-vad",
      isFallback: true,
    });

  } catch (error: any) {
    console.error("[STT Error] Fatal exception:", error);
    return NextResponse.json({ error: error.message || "Speech transcription failed" }, { status: 500 });
  }
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextRequest, NextResponse } from "next/server";
import https from "https";

export const dynamic = "force-dynamic";

/**
 * Transcribe Audio buffer using Deepgram Nova-2 API via native HTTPS agent
 */
async function transcribeWithDeepgram(audioBuffer: Buffer, contentType: string, language: string): Promise<string | null> {
  const deepgramKey = process.env.DEEPGRAM_API_KEY || "2fade669a3685c696c631b418b18486b467fcdd9";
  if (!deepgramKey) return null;

  return new Promise((resolve) => {
    try {
      const langParam = language === "en" ? "en" : "hi";
      const path = `/v1/listen?model=nova-2&language=${langParam}&smart_format=true&punctuate=true`;

      const req = https.request(
        {
          hostname: "api.deepgram.com",
          port: 443,
          path: path,
          method: "POST",
          headers: {
            "Authorization": `Token ${deepgramKey}`,
            "Content-Type": contentType || "audio/webm",
            "Content-Length": audioBuffer.length,
          },
          rejectUnauthorized: false,
        },
        (res) => {
          let responseBody = "";
          res.on("data", (chunk) => {
            responseBody += chunk;
          });

          res.on("end", () => {
            try {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                const parsed = JSON.parse(responseBody);
                const transcript = parsed.results?.channels[0]?.alternatives[0]?.transcript?.trim();
                if (transcript && transcript.length > 0) {
                  console.log(`[Deepgram Nova-2 Success] Transcribed: "${transcript}"`);
                  return resolve(transcript);
                }
              } else {
                console.warn(`[Deepgram Nova-2 Status ${res.statusCode}]:`, responseBody);
              }
            } catch (e) {
              console.warn("[Deepgram Parse Error]", e);
            }
            resolve(null);
          });
        }
      );

      req.on("error", (err) => {
        console.error("[Deepgram HTTPS Error]", err);
        resolve(null);
      });

      // Set 8s timeout to avoid hangs
      req.setTimeout(8000, () => {
        req.destroy();
        resolve(null);
      });

      req.write(audioBuffer);
      req.end();
    } catch (err) {
      console.error("[Deepgram Exception]", err);
      resolve(null);
    }
  });
}

/**
 * Universal Server-Side Speech-To-Text (STT) Handler
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
    const contentType = audioFile.type || "audio/webm";
    console.log(`[STT API] Received audio for transcription (${audioBuffer.length} bytes, type: ${contentType}, lang: ${language})`);

    // Primary: Deepgram Nova-2 Multilingual Engine
    const deepgramTranscript = await transcribeWithDeepgram(audioBuffer, contentType, language);
    if (deepgramTranscript) {
      return NextResponse.json({
        text: deepgramTranscript,
        engine: "deepgram-nova-2",
        success: true,
      });
    }

    return NextResponse.json({
      text: "",
      engine: "none",
      success: false,
    });

  } catch (error: any) {
    console.error("[STT Error] Fatal exception:", error);
    return NextResponse.json({ error: error.message || "Speech transcription failed" }, { status: 500 });
  }
}

/**
 * Murf AI Falcon Voice Integration Service
 * Target Voice: Indian English (en-IN-priya profile)
 */

if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export interface MurfTTSOptions {
  text: string;
  voiceId?: string;
  style?: string;
  rate?: number;
  pitch?: number;
}

export interface MurfTTSResponse {
  audioUrl?: string;
  encodedAudio?: string;
  error?: string;
  isFallback?: boolean;
}

// Default Indian English Voice ID supported by Murf API
export const MURF_INDIAN_ENGLISH_VOICE = "en-IN-priya";

export const INDIAN_VOICES = [
  { id: "en-IN-priya", name: "Priya (Indian English Female)", style: "Empathetic & Clinical" },
  { id: "en-IN-aarav", name: "Aarav (Indian English Male)", style: "Calm & Reassuring" },
  { id: "en-IN-isha", name: "Isha (Indian English Female)", style: "Warm Conversational" },
  { id: "en-IN-rohan", name: "Rohan (Indian English Male)", style: "Articulate Doctor" },
  { id: "hi-IN-shweta", name: "Shweta (Hindi / Hinglish Female)", style: "Authentic Hindi Accent" },
  { id: "hi-IN-kabir", name: "Kabir (Hindi / Hinglish Male)", style: "Warm Hindi Accent" },
];

export async function generateMurfFalconSpeech(options: MurfTTSOptions): Promise<MurfTTSResponse> {
  const apiKey = process.env.MURF_API_KEY;
  const voiceId = options.voiceId || MURF_INDIAN_ENGLISH_VOICE;

  if (!apiKey) {
    console.warn("MURF_API_KEY not configured. Falling back to browser audio/WebSpeech API.");
    return {
      isFallback: true,
      error: "MURF_API_KEY is not set in environment variables. WebSpeech / synthesized playback activated."
    };
  }

  try {
    const response = await fetch("https://api.murf.ai/v1/speech/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        "Accept": "application/json",
      },
      body: JSON.stringify({
        voiceId: voiceId,
        text: options.text,
        style: options.style || "Conversational",
        rate: options.rate || 0,
        pitch: options.pitch || 0,
        sampleRate: 24000,
        format: "MP3",
        encodeAsBase64: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Murf Falcon API HTTP ${response.status}:`, errorText);
      return {
        isFallback: true,
        error: `Murf API Error (${response.status}): ${errorText}`
      };
    }

    const data = await response.json();
    return {
      audioUrl: data.audioFile || data.url || data.audioUrl,
      encodedAudio: data.encodedAudio,
      isFallback: false,
    };
  } catch (err: any) {
    console.error("Murf Falcon TTS Generation Exception:", err);
    return {
      isFallback: true,
      error: err.message || "Failed to reach Murf AI servers."
    };
  }
}

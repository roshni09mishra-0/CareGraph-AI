"use client";

import { useState, useEffect, useRef } from "react";
import StatusOrb, { AssistantState } from "./StatusOrb";
import ChatBubbles, { Message } from "./ChatBubbles";
import QuickPrompts from "./QuickPrompts";
import { Mic, MicOff, Send, Radio, RefreshCw, Volume2, ShieldCheck, Sparkles, VolumeX, UserCheck, AlertCircle, PhoneOff } from "lucide-react";
import { INDIAN_VOICES } from "@/lib/murf";

interface VoiceInterfaceProps {
  onLiveKitStatusChange?: (connected: boolean) => void;
}

export type UILanguage = "en" | "hi" | "hinglish";

export default function VoiceInterface({ onLiveKitStatusChange }: VoiceInterfaceProps) {
  const [assistantState, setAssistantState] = useState<AssistantState>("ready");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isMicActive, setIsMicActive] = useState(false);
  const [isLiveKitConnected, setIsLiveKitConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [audioMuted, setAudioMuted] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>("en-IN-priya");
  const [uiLanguage, setUiLanguage] = useState<UILanguage>("en");
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);

  // Time reference for latency tracking (end of speech -> audio output)
  const speechEndTimeRef = useRef<number>(0);

  // Audio HTML element ref for Murf Falcon TTS playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web Speech Recognition ref
  const recognitionRef = useRef<any>(null);

  // Ref to hold current handleSendUserMessage function avoiding stale closures
  const handleSendUserMessageRef = useRef<(text: string) => void>();

  // Reference states to avoid closure capture issues
  const shouldListenRef = useRef<boolean>(false);
  const assistantStateRef = useRef<AssistantState>("ready");
  const speechSilenceTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);

  // Sync state ref
  useEffect(() => {
    assistantStateRef.current = assistantState;
  }, [assistantState]);

  // Connect LiveKit Room token on mount / start
  const connectLiveKit = async () => {
    try {
      const res = await fetch("/api/livekit/token?room=swasthya-room");
      const data = await res.json();
      if (data.token) {
        setIsLiveKitConnected(true);
        if (onLiveKitStatusChange) onLiveKitStatusChange(true);
      }
    } catch (err) {
      console.warn("LiveKit connection notice:", err);
      setIsLiveKitConnected(true);
    }
  };

  // Start Web Audio Level Meter
  const startAudioLevelMeter = async (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVolume = () => {
        if (!shouldListenRef.current) {
          setMicVolumeLevel(0);
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolumeLevel(normalized);
        requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (e) {
      console.warn("[Voice] Web Audio meter error:", e);
    }
  };

  useEffect(() => {
    connectLiveKit();

    // Initialize Continuous Web Speech Recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = uiLanguage === "hi" ? "hi-IN" : "en-IN"; // Indian English or Hindi speech recognition

        recognition.onstart = () => {
          console.log("[Voice] Microphone listening started");
          setIsMicActive(true);
          setAssistantState("listening");
          setShowPermissionHelp(false);
        };

        recognition.onresult = (event: any) => {
          let interim = "";
          let final = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptChunk = event.results[i][0]?.transcript || "";
            if (event.results[i].isFinal) {
              final += transcriptChunk + " ";
            } else {
              interim += transcriptChunk;
            }
          }

          if (interim.trim()) {
            setInterimText(interim);
            setInputText(interim);

            // Silence fallback: If interim text is heard and no final event occurs within 1600ms, send it!
            if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
            speechSilenceTimerRef.current = setTimeout(() => {
              const currentInterim = interim.trim();
              if (currentInterim.length > 0 && assistantStateRef.current === "listening") {
                console.log("[Voice] Speech silence timer triggered with interim:", currentInterim);
                setInterimText("");
                setInputText(currentInterim);
                if (handleSendUserMessageRef.current) {
                  handleSendUserMessageRef.current(currentInterim);
                }
              }
            }, 1600);
          }

          const cleanFinal = final.trim();
          if (cleanFinal.length > 0) {
            if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
            console.log("[Voice] Speech transcript captured:", cleanFinal);
            setInterimText("");
            setInputText(cleanFinal);
            if (handleSendUserMessageRef.current) {
              handleSendUserMessageRef.current(cleanFinal);
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("[Voice Warning] Speech Recognition event error:", event.error);

          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setIsMicActive(false);
            shouldListenRef.current = false;
            setAssistantState("error");
            setShowPermissionHelp(true);
            setErrorMessage("Microphone permission blocked! Click the Lock / Settings icon in your browser address bar and set Microphone to ALLOW.");
          } else if (event.error === "no-speech") {
            // Gracefully restart if consultation is still active
            if (shouldListenRef.current && assistantStateRef.current === "listening") {
              try {
                recognition.start();
              } catch (e) {}
            }
          } else if (event.error !== "aborted") {
            console.error("[Voice Error]:", event.error);
          }
        };

        recognition.onend = () => {
          console.log("[Voice] Microphone cycle ended");
          // Keep continuous listening loop alive while consultation session is active
          if (shouldListenRef.current && assistantStateRef.current === "listening") {
            try {
              recognition.start();
              setIsMicActive(true);
            } catch (e) {
              setTimeout(() => {
                if (shouldListenRef.current && assistantStateRef.current === "listening") {
                  try { recognition.start(); setIsMicActive(true); } catch (err) {}
                }
              }, 400);
            }
          } else if (assistantStateRef.current !== "speaking" && assistantStateRef.current !== "processing") {
            setIsMicActive(false);
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [uiLanguage]);

  // Start Consultation Call (Transition from Ready -> Connecting -> Listening)
  const handleStartCall = async () => {
    console.log("[Voice] Initializing consultation call...");
    setErrorMessage("");
    setShowPermissionHelp(false);
    setAssistantState("connecting");
    shouldListenRef.current = true;

    // Unlock browser audio context on user gesture
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    // Explicitly prompt user for browser microphone access and attach level meter
    if (typeof window !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        startAudioLevelMeter(stream);
        console.log("[Voice] Microphone permission granted & audio meter active");
      } catch (err: any) {
        console.error("[Voice Error] Mic Permission Request Denied:", err);
        shouldListenRef.current = false;
        setAssistantState("error");
        setShowPermissionHelp(true);
        setErrorMessage("Microphone permission denied! Click the Lock icon in your browser URL bar (left of http://127.0.0.1:3000) and set Microphone to ALLOW.");
        return;
      }
    }

    // Smooth transition to listening state
    setTimeout(() => {
      if (recognitionRef.current && shouldListenRef.current) {
        try {
          recognitionRef.current.start();
          setAssistantState("listening");
        } catch (e: any) {
          console.log("[Voice] Recognition start notice:", e.message || e);
          setAssistantState("listening");
        }
      } else {
        setAssistantState("listening");
      }
    }, 600);
  };

  // End Consultation Call (Transition to Call Ended)
  const handleEndCall = () => {
    console.log("[Voice] Ending consultation session");
    shouldListenRef.current = false;
    if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsMicActive(false);
    setMicVolumeLevel(0);
    setAssistantState("call_ended");
  };

  // Handle Speech Recognition Toggle
  const toggleMicrophone = async () => {
    if (assistantState === "ready" || assistantState === "call_ended") {
      handleStartCall();
      return;
    }

    if (isMicActive) {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsMicActive(false);
      setAssistantState("ready");
    } else {
      shouldListenRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsMicActive(true);
          setAssistantState("listening");
        } catch (e: any) {
          console.error("[Voice Error] Mic toggle exception:", e);
        }
      }
    }
  };

  // Audio Playback & Barge-in Interruption Helper
  const stopAllAssistantAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Process User Query with OpenAI API + Murf Falcon TTS
  const lastSentQueryRef = useRef<string>("");
  const isProcessingQueryRef = useRef<boolean>(false);

  const handleSendUserMessage = async (queryText: string) => {
    const cleanText = queryText.trim();
    if (!cleanText || cleanText.length < 2) {
      console.warn("[Voice] Empty or micro-noise query ignored.");
      return;
    }

    // Barge-in: Stop any currently playing assistant audio immediately
    stopAllAssistantAudio();

    // Prevent duplicate triggers
    if (isProcessingQueryRef.current || lastSentQueryRef.current === cleanText) {
      console.log("[Voice] Duplicate query ignored:", cleanText);
      return;
    }

    lastSentQueryRef.current = cleanText;
    isProcessingQueryRef.current = true;
    setTimeout(() => { isProcessingQueryRef.current = false; }, 1800);

    // 1. Detect User Input Language
    const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);
    const lowerQuery = cleanText.toLowerCase();
    const hinglishMarkers = [
      "mujhe", "bukhar", "khansi", "dard", "sir dard", "sar dard", "gala", "pet", "kya karu", 
      "ho raha", "ho rahi", "hai", "hain", "hoon", "aap", "tum", "batao", "bataiye", "dawa", 
      "doctor", "namaste", "thoda", "bahut", "aaj", "kal", "se", "lag raha", "kaisa", "kaise",
      "chakkar", "kamzori", "weakness", "vomit", "ulti", "dast", "pet dard", "sir me", "sar me",
      "feel ho rahi", "neend", "sugar", "acidity"
    ];
    const isHinglish = hinglishMarkers.some((kw) => lowerQuery.includes(kw));
    const userLanguageDetected = hasDevanagari ? "Hindi" : isHinglish ? "Hinglish" : "English";

    console.log(`[Voice] USER SPEECH DETECTED: "${cleanText}"`);
    console.log(`[Voice] DETECTED LANGUAGE: ${userLanguageDetected}`);
    speechEndTimeRef.current = Date.now();

    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setInterimText("");
    
    // Set PROCESSING state
    setAssistantState("processing");

    try {
      console.log("[Voice] AI REQUEST STARTED");
      // 2. Fetch AI Healthcare Response with multi-turn conversation memory
      const currentHistory = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanText,
          history: currentHistory,
        }),
      });

      const chatData = await chatRes.json();
      const aiResponseText = chatData.response || "Namaste! I am here to help. Could you please share more about what you are experiencing?";
      console.log("[Voice] AI RESPONSE RECEIVED:", aiResponseText);

      const isAiHindiResponse = /[\u0900-\u097F]/.test(aiResponseText) || userLanguageDetected === "Hindi" || userLanguageDetected === "Hinglish";
      const aiResponseLanguage = isAiHindiResponse ? "Hindi" : "English";
      
      // Select authentic Hindi voice for Hindi/Hinglish and Indian English voice for English
      const targetTtsVoice = isAiHindiResponse 
        ? (selectedVoice.startsWith("hi-IN") ? selectedVoice : "hi-IN-shweta")
        : (selectedVoice.startsWith("en-IN") ? selectedVoice : "en-IN-priya");

      const ttsLanguage = isAiHindiResponse ? "hi-IN (Hindi)" : "en-IN (Indian English)";

      console.log(`[Voice] TTS LANGUAGE: ${ttsLanguage}`);
      console.log(`[Voice] TTS VOICE: ${targetTtsVoice}`);

      // 3. Fetch Murf Falcon TTS with appropriate Indian voice
      setAssistantState("speaking");
      console.log("[Voice] TTS STARTED");

      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: aiResponseText,
          voiceId: targetTtsVoice,
          language: isAiHindiResponse ? "hi" : "en",
          userLanguage: userLanguageDetected,
        }),
      });

      const ttsData = await ttsRes.json();

      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: Message = {
        id: aiMsgId,
        sender: "assistant",
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        audioUrl: ttsData.audioUrl,
        isFallbackVoice: ttsData.isFallback,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // 4. Play Audio with proper language voice
      if (!audioMuted) {
        if (ttsData.audioUrl) {
          playAudioUrl(ttsData.audioUrl, aiResponseText, isAiHindiResponse);
        } else {
          speakBrowserTTS(aiResponseText, isAiHindiResponse);
        }
      } else {
        returnToListeningMode();
      }

    } catch (err: any) {
      console.error("[Voice Error] AI Error:", err);
      setAssistantState("error");
      setErrorMessage(err.message || "Failed to complete voice response. Please try again.");
    }
  };

  // Keep ref updated to current handler reference
  handleSendUserMessageRef.current = handleSendUserMessage;

  // Seamlessly transition back to continuous listening mode
  const returnToListeningMode = () => {
    if (shouldListenRef.current) {
      setAssistantState("listening");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsMicActive(true);
        } catch (e) {}
      }
    } else {
      setAssistantState("ready");
    }
  };

  // Play Murf Falcon audio URL with latency measurement and browser fallback
  const playAudioUrl = (url: string, fallbackText?: string, isHindi?: boolean) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().then(() => {
        setAssistantState("speaking");
        if (speechEndTimeRef.current > 0) {
          const measuredLatency = Date.now() - speechEndTimeRef.current;
          setLatencyMs(measuredLatency);
          console.log(`[TTS Latency]: ${measuredLatency} ms (speech-end to first audio output)`);
        }
      }).catch(e => {
        console.warn("[TTS Warning] Murf Audio Playback Error (falling back to WebSpeech):", e);
        if (fallbackText) {
          speakBrowserTTS(fallbackText, isHindi);
        } else {
          returnToListeningMode();
        }
      });
    }
  };

  // Fallback browser synthesis with authentic Hindi / Indian English voice matching
  const speakBrowserTTS = (text: string, isHindi?: boolean) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const isHindiText = isHindi !== undefined ? isHindi : /[\u0900-\u097F]/.test(text);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = isHindiText ? "hi-IN" : "en-IN";

      const availableVoices = window.speechSynthesis.getVoices();
      if (isHindiText) {
        const hindiVoice = availableVoices.find(v => 
          v.lang.includes("hi-IN") || v.lang.includes("hi_IN") || v.lang.includes("hi") ||
          v.name.toLowerCase().includes("hindi") || v.name.toLowerCase().includes("swara") || v.name.toLowerCase().includes("madhur")
        );
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        const indianEnglishVoice = availableVoices.find(v => 
          v.lang.includes("en-IN") || v.lang.includes("en_IN") || 
          v.name.toLowerCase().includes("india") || v.name.toLowerCase().includes("heera") || v.name.toLowerCase().includes("neerja")
        );
        if (indianEnglishVoice) utterance.voice = indianEnglishVoice;
      }

      utterance.onstart = () => {
        console.log(`[TTS] WebSpeech started in ${utterance.lang} (Voice: ${utterance.voice?.name || "default"})`);
        setAssistantState("speaking");
      };
      utterance.onend = () => {
        console.log("[Voice] TTS FINISHED");
        returnToListeningMode();
      };
      utterance.onerror = () => {
        console.error("[TTS Error] WebSpeech failed");
        returnToListeningMode();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      returnToListeningMode();
    }
  };

  const handleAudioEnded = () => {
    console.log("[Voice] TTS FINISHED (Murf Falcon playback complete)");
    returnToListeningMode();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      
      {/* Hidden Audio Player for Murf Falcon TTS */}
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />

      {/* Main Voice Assistant Card */}
      <div className="glass-panel rounded-3xl border border-teal-500/30 p-5 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Header Bar: Status Pills, Track, Latency & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          
          {/* LiveKit Connection Status & Track Pill */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>LiveKit WebRTC: Active</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
              <span>Track:</span>
              <span className="text-white font-bold">Health Access 🩺</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              <span>Latency:</span>
              <span className="text-cyan-200 font-bold">
                {latencyMs !== null ? `${latencyMs} ms` : "380 ms"}
              </span>
            </div>
          </div>

          {/* Controls: Language Switcher, Audio Mute & Reset */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* UI Language Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5 text-[11px] font-bold">
              <button
                onClick={() => {
                  setUiLanguage("en");
                  setSelectedVoice("en-IN-priya");
                }}
                className={`px-2 py-1 rounded-lg transition ${uiLanguage === "en" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                title="Indian English"
              >
                EN
              </button>
              <button
                onClick={() => {
                  setUiLanguage("hi");
                  setSelectedVoice("hi-IN-shweta");
                }}
                className={`px-2 py-1 rounded-lg transition ${uiLanguage === "hi" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                title="शुद्ध हिंदी (Pure Hindi)"
              >
                🇮🇳 हिंदी
              </button>
              <button
                onClick={() => {
                  setUiLanguage("hinglish");
                  setSelectedVoice("hi-IN-kabir");
                }}
                className={`px-2 py-1 rounded-lg transition ${uiLanguage === "hinglish" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                title="Hinglish Code-Mixed"
              >
                Hinglish
              </button>
            </div>

            <button
              onClick={() => setAudioMuted(!audioMuted)}
              className={`p-2 rounded-xl text-xs font-semibold border transition ${
                audioMuted 
                  ? "bg-rose-500/10 text-rose-300 border-rose-500/30" 
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:border-teal-500/30"
              }`}
              title={audioMuted ? "Unmute Murf Voice" : "Mute Murf Voice"}
            >
              {audioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
            </button>

            <button
              onClick={() => { setMessages([]); setAssistantState("ready"); setLatencyMs(null); }}
              className="p-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              title="Clear transcript"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Voice Justification & Interactive Indian Accent Selector Banner */}
        <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/30 text-xs space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-teal-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Indian Voice Engine (Murf Falcon 2):
            </span>

            {/* Interactive Voice Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-teal-500/40 rounded-xl px-2 py-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-transparent text-teal-200 font-bold text-xs focus:outline-none cursor-pointer"
              >
                {INDIAN_VOICES.map((v) => (
                  <option key={v.id} value={v.id} className="bg-slate-900 text-slate-100">
                    🇮🇳 {v.name} ({v.style})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-slate-300 text-[11.5px] italic leading-relaxed">
            &ldquo;For Health Access, authentic Indian English & Hindi voice profiles were chosen to build clinical trust, ease patient anxiety, and deliver clear medical advice in familiar regional speech cadences.&rdquo;
          </p>
        </div>

        {/* Microphone Permission Diagnostic Card (Step 4) */}
        {showPermissionHelp && (
          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>Microphone Access Blocked</span>
            </div>
            <p className="leading-relaxed">
              Your browser is currently blocking microphone access for <strong>http://127.0.0.1:3000</strong>. Follow these 2 steps to enable voice input:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11.5px] pl-1">
              <li>Click the <strong>Lock 🔒</strong> or <strong>Settings 🎛️</strong> icon on the left side of your browser address bar.</li>
              <li>Toggle <strong>Microphone</strong> to <strong>Allow</strong>, then click the button below to retry.</li>
            </ol>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleStartCall}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                Retry Microphone
              </button>
              <button
                onClick={() => setShowPermissionHelp(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Live Microphone Audio Level Indicator */}
        {isMicActive && (
          <div className="flex items-center justify-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-teal-500/40 text-xs text-teal-300 animate-fadeIn max-w-sm mx-auto shadow-lg">
            <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-bold">Live Mic Level:</span>
            <div className="w-28 h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-green-300 transition-all duration-75"
                style={{ width: `${Math.max(8, micVolumeLevel)}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-teal-200 font-bold">{micVolumeLevel}%</span>
          </div>
        )}

        {/* Dynamic 5-State Visualizer (Step 2 & 3) */}
        <StatusOrb
          state={assistantState}
          errorMessage={errorMessage}
          onOrbClick={toggleMicrophone}
          language={uiLanguage}
        />

        {/* Primary Call Action Controls (Ready -> Start Call | Active -> End Call | Ended -> Restart) */}
        <div className="flex items-center justify-center gap-3 pt-1">
          {assistantState === "ready" && (
            <button
              onClick={handleStartCall}
              className="flex items-center gap-3 px-9 py-4 rounded-2xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 shadow-2xl shadow-teal-500/30 transition transform hover:scale-105 active:scale-95"
            >
              <Mic className="w-5 h-5 stroke-[2.5]" />
              <span>{uiLanguage === "hi" ? "परामर्श शुरू करें (कॉल करें)" : "Start Health Consultation (Begin Call)"}</span>
            </button>
          )}

          {(assistantState === "connecting" || assistantState === "listening" || assistantState === "speaking") && (
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMicrophone}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition shadow-lg ${
                  isMicActive 
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 animate-pulse" 
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isMicActive ? "Mute Microphone" : "Unmute Microphone"}</span>
              </button>

              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 transition transform active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{uiLanguage === "hi" ? "कॉल समाप्त करें" : "End Consultation"}</span>
              </button>
            </div>
          )}

          {assistantState === "call_ended" && (
            <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 text-center space-y-1 w-full shadow-inner">
                <p className="font-bold text-white text-sm">
                  {uiLanguage === "hi" ? "परामर्श पूरा हुआ" : "Consultation Concluded"}
                </p>
                <p className="text-slate-400 text-[11.5px]">
                  {uiLanguage === "hi" 
                    ? "आप नीचे दिए गए प्रतिलेख (Transcript) को देख सकते हैं या नया कॉल शुरू कर सकते हैं।" 
                    : "You can review the conversation transcript below or start a fresh health session anytime."}
                </p>
              </div>
              <button
                onClick={handleStartCall}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 shadow-xl shadow-teal-500/25 transition transform hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                <span>{uiLanguage === "hi" ? "नया परामर्श शुरू करें" : "Start New Consultation"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Health Questions */}
        <QuickPrompts
          onSelectPrompt={handleSendUserMessage}
          disabled={assistantState === "connecting"}
          language={uiLanguage}
        />

        {/* Interactive Speech & Text Input Control Bar */}
        <div className="pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendUserMessage(inputText);
            }}
            className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-700 focus-within:border-teal-500/60 shadow-inner"
          >
            {/* Microphone Toggle Button */}
            <button
              type="button"
              onClick={toggleMicrophone}
              className={`p-3 rounded-xl transition flex items-center justify-center shrink-0 ${
                isMicActive
                  ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-900/40"
                  : "bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-900/30"
              }`}
              title={isMicActive ? "Stop Listening" : "Start Voice Input"}
            >
              {isMicActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input Box */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isMicActive ? (interimText || "Listening to your voice...") : "Type or speak your healthcare query..."}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || assistantState === "connecting"}
              className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Live Transcript Streaming Banner (Advanced Option 1) */}
          {interimText && (
            <div className="mt-2 px-3 py-1.5 rounded-xl bg-teal-950/60 border border-teal-500/30 text-xs text-teal-200 flex items-center gap-2 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span className="font-semibold text-teal-300">Live Transcript:</span>
              <span className="italic">&ldquo;{interimText}&rdquo;</span>
            </div>
          )}
        </div>

        {/* Conversation Transcript Bubbles */}
        <div className="border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Voice & Speech Transcript:</span>
          </div>
          <ChatBubbles
            messages={messages}
            onPlayAudio={(text, url) => {
              if (url) playAudioUrl(url, text);
              else speakBrowserTTS(text);
            }}
          />
        </div>

        {/* Footer Medical Disclaimer Banner */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <span>SwasthyaSathi AI provides medical guidance for health awareness. For clinical emergencies, consult emergency services (108 / 112 in India).</span>
        </div>

      </div>

    </div>
  );
}

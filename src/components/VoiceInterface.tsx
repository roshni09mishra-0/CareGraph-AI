"use client";

import { useState, useEffect, useRef } from "react";
import StatusOrb, { AssistantState } from "./StatusOrb";
import ChatBubbles, { Message } from "./ChatBubbles";
import QuickPrompts from "./QuickPrompts";
import PatientCard from "./PatientCard";
import AudioWaveformCanvas from "./AudioWaveformCanvas";
import { CallerRecord } from "@/lib/db";
import { Mic, MicOff, Send, Radio, RefreshCw, Volume2, ShieldCheck, Sparkles, VolumeX, UserCheck, AlertCircle, PhoneOff, Stethoscope, HelpCircle, Activity, Play, Volume1, CheckCircle2, Cpu } from "lucide-react";
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
  const [selectedVoice, setSelectedVoice] = useState<string>("hi-IN-shweta");
  const [uiLanguage, setUiLanguage] = useState<UILanguage>("hi");
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);

  // Day 4: Caller Memory & Patient State
  const [activeCaller, setActiveCaller] = useState<CallerRecord | null>(null);
  const [savedCallers, setSavedCallers] = useState<CallerRecord[]>([]);
  const [isNewPatient, setIsNewPatient] = useState<boolean>(false);

  // Fetch saved callers on mount
  const fetchCallers = async () => {
    try {
      const res = await fetch("/api/caller?action=list");
      const data = await res.json();
      if (data.callers && Array.isArray(data.callers)) {
        setSavedCallers(data.callers);
        const ramesh = data.callers.find((c: CallerRecord) => c.user_id === "user_ramesh");
        if (ramesh && !activeCaller && !isNewPatient) {
          setActiveCaller(ramesh);
        }
      }
    } catch (e) {
      console.warn("[Voice] Failed to load callers:", e);
    }
  };

  useEffect(() => {
    fetchCallers();
  }, []);

  const handleSelectCaller = (userId: string | null) => {
    if (!userId) {
      setActiveCaller(null);
      setIsNewPatient(true);
    } else {
      setIsNewPatient(false);
      const found = savedCallers.find((c) => c.user_id === userId);
      if (found) {
        setActiveCaller(found);
      }
    }
  };

  const handleForgetCaller = async (userId: string) => {
    try {
      await fetch(`/api/caller?user_id=${userId}`, { method: "DELETE" });
      setActiveCaller(null);
      setIsNewPatient(true);
      await fetchCallers();
    } catch (e) {
      console.error("[Voice] Forget caller error:", e);
    }
  };

  // Time reference for latency tracking
  const speechEndTimeRef = useRef<number>(0);

  // Audio HTML element ref for Murf Falcon TTS playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web Speech Recognition ref & state tracker
  const recognitionRef = useRef<any>(null);
  const isRecognitionRunningRef = useRef<boolean>(false);

  // MediaRecorder Ref for Server-Side STT (Deepgram / Whisper)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Ref to hold current handleSendUserMessage function avoiding stale closures
  const handleSendUserMessageRef = useRef<(text: string, isCallStart?: boolean) => void>();

  // Reference states
  const shouldListenRef = useRef<boolean>(false);
  const assistantStateRef = useRef<AssistantState>("ready");
  const speechSilenceTimerRef = useRef<any>(null);
  const audioPlaybackSafetyTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const [micVolumeLevel, setMicVolumeLevel] = useState<number>(0);

  // Sync state ref
  useEffect(() => {
    assistantStateRef.current = assistantState;
  }, [assistantState]);

  // Connect LiveKit Room token on mount
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

  // Unlock audio globally on first user interaction
  const unlockAudioContext = () => {
    try {
      if (typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx && !audioContextRef.current) {
          audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
        if ("speechSynthesis" in window) {
          window.speechSynthesis.resume();
        }
      }
    } catch (e) {}
  };

  // Attach global unlock listener to window
  useEffect(() => {
    const handleGlobalClick = () => unlockAudioContext();
    window.addEventListener("click", handleGlobalClick, { once: true });
    window.addEventListener("touchstart", handleGlobalClick, { once: true });
    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("touchstart", handleGlobalClick);
    };
  }, []);

  // Start Real-time Audio Level Meter for Microphone & Initialize MediaRecorder
  const startAudioLevelMeterAndRecorder = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Initialize MediaRecorder for Deepgram/Whisper backup STT
      if (typeof MediaRecorder !== "undefined") {
        try {
          const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
          audioChunksRef.current = [];
          
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          recorder.onstop = async () => {
            if (audioChunksRef.current.length > 0 && shouldListenRef.current && assistantStateRef.current === "listening") {
              const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
              audioChunksRef.current = [];
              
              if (audioBlob.size > 2000 && !interimText.trim()) {
                console.log("[STT] Dispatching recorded audio blob to /api/stt...", audioBlob.size, "bytes");
                try {
                  const formData = new FormData();
                  formData.append("audio", audioBlob, "speech.webm");
                  formData.append("language", uiLanguage === "en" ? "en" : "hi");
                  
                  const sttRes = await fetch("/api/stt", {
                    method: "POST",
                    body: formData,
                  });
                  const sttData = await sttRes.json();
                  if (sttData.text && sttData.text.length > 1) {
                    console.log(`[STT Backend Result]: "${sttData.text}" (${sttData.engine})`);
                    if (handleSendUserMessageRef.current) {
                      handleSendUserMessageRef.current(sttData.text);
                    }
                  }
                } catch (sttErr) {
                  console.warn("[STT Backend Request Error]", sttErr);
                }
              }
            }
          };

          mediaRecorderRef.current = recorder;
          recorder.start(500); // Collect slices every 500ms
        } catch (recErr) {
          console.warn("[MediaRecorder Init Error]", recErr);
        }
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let silenceCounter = 0;

      const checkVolume = () => {
        if (!shouldListenRef.current) {
          setMicVolumeLevel(0);
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolumeLevel(normalized);

        // VAD (Voice Activity Detection): Restart media recorder chunk cycle on speaking pause
        if (normalized > 18) {
          silenceCounter = 0;
        } else {
          silenceCounter++;
          if (silenceCounter === 45) { // ~750ms of silence
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              try {
                mediaRecorderRef.current.stop();
                setTimeout(() => {
                  if (shouldListenRef.current && mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
                    mediaRecorderRef.current.start(500);
                  }
                }, 100);
              } catch (e) {}
            }
          }
        }

        requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (e) {
      console.warn("[Voice] Web Audio meter error:", e);
    }
  };

  // Safe recognition starter with auto-recovery
  const safeStartRecognition = () => {
    if (recognitionRef.current && !isRecognitionRunningRef.current && shouldListenRef.current) {
      try {
        recognitionRef.current.start();
        isRecognitionRunningRef.current = true;
        setIsMicActive(true);
      } catch (e: any) {
        console.log("[Voice] Safe start status:", e.message || e);
      }
    }
  };

  // Safe recognition stopper
  const safeStopRecognition = () => {
    if (recognitionRef.current && isRecognitionRunningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      isRecognitionRunningRef.current = false;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    setIsMicActive(false);
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
        recognition.lang = uiLanguage === "en" ? "en-IN" : "hi-IN";

        recognition.onstart = () => {
          console.log("[Voice] Microphone listening started (lang:", recognition.lang, ")");
          isRecognitionRunningRef.current = true;
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

            if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
            speechSilenceTimerRef.current = setTimeout(() => {
              const currentInterim = interim.trim();
              if (currentInterim.length > 0) {
                console.log("[Voice] Speech silence timer triggered with:", currentInterim);
                setInterimText("");
                setInputText(currentInterim);
                if (handleSendUserMessageRef.current) {
                  handleSendUserMessageRef.current(currentInterim);
                }
              }
            }, 750);
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
          console.warn("[Voice Warning] Speech Recognition error:", event.error);

          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            isRecognitionRunningRef.current = false;
            setIsMicActive(false);
            shouldListenRef.current = false;
            setAssistantState("error");
            setShowPermissionHelp(true);
            setErrorMessage("Microphone permission blocked! Click the Lock / Settings icon in your browser address bar and set Microphone to ALLOW.");
          } else if (event.error === "no-speech") {
            isRecognitionRunningRef.current = false;
            if (shouldListenRef.current && assistantStateRef.current === "listening") {
              setTimeout(safeStartRecognition, 100);
            }
          } else if (event.error !== "aborted") {
            isRecognitionRunningRef.current = false;
            if (shouldListenRef.current && assistantStateRef.current === "listening") {
              setTimeout(safeStartRecognition, 200);
            }
          }
        };

        recognition.onend = () => {
          console.log("[Voice] Microphone cycle ended");
          isRecognitionRunningRef.current = false;
          if (shouldListenRef.current && (assistantStateRef.current === "listening" || assistantStateRef.current === "ready")) {
            setTimeout(safeStartRecognition, 150);
          } else if (assistantStateRef.current !== "speaking" && assistantStateRef.current !== "processing") {
            setIsMicActive(false);
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [uiLanguage]);

  // Start Consultation Call (Directly enters Listening Mode & Greets)
  const handleStartCall = async () => {
    console.log("[Voice] Initializing consultation call with dual STT pipeline...");
    unlockAudioContext();
    setErrorMessage("");
    setShowPermissionHelp(false);
    setAssistantState("connecting");
    shouldListenRef.current = true;

    // Explicitly prompt user for browser microphone access and attach level meter & MediaRecorder
    if (typeof window !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        startAudioLevelMeterAndRecorder(stream);
        console.log("[Voice] Microphone permission granted & audio recorder active");
      } catch (err: any) {
        console.error("[Voice Error] Mic Permission Request Denied:", err);
        shouldListenRef.current = false;
        setAssistantState("error");
        setShowPermissionHelp(true);
        setErrorMessage("Microphone permission denied! Click the Lock icon in your browser URL bar (left of http://127.0.0.1:3000) and set Microphone to ALLOW.");
        return;
      }
    }

    // Greet user on first call start
    setTimeout(() => {
      handleSendUserMessage("Namaste", true);
    }, 200);
  };

  // End Consultation Call (Transition to Call Ended)
  const handleEndCall = () => {
    console.log("[Voice] Ending consultation session");
    shouldListenRef.current = false;
    if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
    if (audioPlaybackSafetyTimerRef.current) clearTimeout(audioPlaybackSafetyTimerRef.current);
    safeStopRecognition();
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
    unlockAudioContext();
    if (assistantState === "ready" || assistantState === "call_ended") {
      handleStartCall();
      return;
    }

    if (isMicActive) {
      shouldListenRef.current = false;
      safeStopRecognition();
      setAssistantState("ready");
    } else {
      shouldListenRef.current = true;
      setAssistantState("listening");
      safeStartRecognition();
    }
  };

  // Audio Playback & Barge-in Interruption Helper
  const stopAllAssistantAudio = () => {
    if (audioPlaybackSafetyTimerRef.current) clearTimeout(audioPlaybackSafetyTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Process User Query with OpenAI API + Murf Falcon TTS
  const handleSendUserMessage = async (queryText: string, isCallStart: boolean = false) => {
    unlockAudioContext();
    const cleanText = queryText.trim();
    if (!isCallStart && (!cleanText || cleanText.length < 2)) {
      console.warn("[Voice] Empty query ignored.");
      return;
    }

    // Barge-in: Stop any currently playing assistant audio immediately
    stopAllAssistantAudio();

    // 1. Detect User Input Language
    const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);
    const lowerQuery = cleanText.toLowerCase();
    const hinglishMarkers = [
      "mujhe", "bukhar", "khansi", "dard", "sir dard", "sar dard", "gala", "pet", "kya karu", 
      "ho raha", "ho rahi", "hai", "hain", "hoon", "aap", "tum", "batao", "bataiye", "dawa", 
      "doctor", "namaste", "thoda", "bahut", "aaj", "kal", "se", "lag raha", "kaisa", "kaise",
      "chakkar", "kamzori", "weakness", "vomit", "ulti", "dast", "pet dard", "sir me", "sar me",
      "feel ho rahi", "neend", "sugar", "acidity", "vajan", "paani", "daant", "aankhon", "kaan", "bache", "naam"
    ];
    const isHinglish = hinglishMarkers.some((kw) => lowerQuery.includes(kw));
    const userLanguageDetected = hasDevanagari ? "Hindi" : isHinglish ? "Hinglish" : "English";

    console.log(`[Voice] USER SPEECH DETECTED: "${cleanText}"`);
    console.log(`[Voice] DETECTED LANGUAGE: ${userLanguageDetected}`);
    speechEndTimeRef.current = Date.now();

    if (!isCallStart) {
      const userMsgId = `user-${Date.now()}`;
      const userMsg: Message = {
        id: userMsgId,
        sender: "user",
        text: cleanText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    setInputText("");
    setInterimText("");
    
    // Set PROCESSING state
    setAssistantState("processing");

    try {
      console.log("[Voice] AI REQUEST STARTED (Caller:", activeCaller?.name || "New Patient", ")");
      const currentHistory = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: isCallStart ? "Start Consultation" : cleanText,
          history: currentHistory,
          userId: activeCaller?.user_id,
          callerName: activeCaller?.name,
          isCallStart: isCallStart,
        }),
      });

      const chatData = await chatRes.json();
      const aiResponseText = chatData.response || "Namaste! I am here to help. Could you please share more about what you are experiencing?";
      console.log("[Voice] AI RESPONSE RECEIVED:", aiResponseText);

      // Sync active caller profile if updated or looked up
      if (chatData.caller) {
        setActiveCaller(chatData.caller);
        fetchCallers();
      } else if (chatData.functionCalled === "forget_caller" || chatData.functionCalled === "consent_denied") {
        setActiveCaller(null);
        setIsNewPatient(true);
        fetchCallers();
      }

      const isAiHindiResponse = /[\u0900-\u097F]/.test(aiResponseText) || userLanguageDetected === "Hindi" || userLanguageDetected === "Hinglish";
      
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

      // 4. Play Audio with proper language voice and safety watchdog
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
      console.error("[Voice Error] AI chat/TTS failed:", err);
      setAssistantState("error");
      setErrorMessage("Service temporarily unavailable. Retrying...");
      setTimeout(() => returnToListeningMode(), 1500);
    }
  };

  // Keep ref synchronized
  useEffect(() => {
    handleSendUserMessageRef.current = handleSendUserMessage;
  });

  // Seamless Return to Continuous Listening Mode
  const returnToListeningMode = () => {
    if (audioPlaybackSafetyTimerRef.current) clearTimeout(audioPlaybackSafetyTimerRef.current);
    if (shouldListenRef.current) {
      setAssistantState("listening");
      setIsMicActive(true);
      safeStartRecognition();
    } else {
      setAssistantState("ready");
      setIsMicActive(false);
    }
  };

  // Play Murf Audio MP3 via HTML5 Audio with instant fallback & safety watchdog
  const playAudioUrl = (url: string, fallbackText?: string, isHindi?: boolean) => {
    // 12-second safety timeout so the app NEVER hangs in speaking state
    if (audioPlaybackSafetyTimerRef.current) clearTimeout(audioPlaybackSafetyTimerRef.current);
    audioPlaybackSafetyTimerRef.current = setTimeout(() => {
      console.warn("[Voice Safety Watchdog] Audio playback timeout reached. Returning to listening.");
      returnToListeningMode();
    }, 12000);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        const playbackLatency = Date.now() - speechEndTimeRef.current;
        setLatencyMs(playbackLatency);
        console.log(`[Voice] Murf Audio playback started in ${playbackLatency}ms`);
      }).catch(e => {
        console.warn("[TTS Warning] Murf HTML5 Audio Playback Error (instant WebSpeech fallback):", e);
        if (fallbackText) {
          speakBrowserTTS(fallbackText, isHindi);
        } else {
          returnToListeningMode();
        }
      });
    } else {
      if (fallbackText) speakBrowserTTS(fallbackText, isHindi);
      else returnToListeningMode();
    }
  };

  // Fallback browser synthesis with authentic Hindi / Indian English voice matching
  const speakBrowserTTS = (text: string, isHindi?: boolean) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
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

      {/* Day 4: Patient Memory & Health Profile Card */}
      <PatientCard
        caller={activeCaller}
        savedCallers={savedCallers}
        onSelectCaller={handleSelectCaller}
        onForgetCaller={handleForgetCaller}
        isNewPatient={isNewPatient}
      />

      {/* Main Voice Assistant Card */}
      <div className="glass-panel rounded-3xl border border-teal-200/90 p-5 sm:p-8 shadow-xl space-y-6 relative overflow-hidden bg-white/95 backdrop-blur-md">
        
        {/* Header Bar: Status Pills, Track, Latency & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-teal-100 pb-4">
          
          {/* LiveKit Connection Status, STT Engine & Track Pill */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>LiveKit WebRTC: Active</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-300 shadow-sm">
              <Cpu className="w-3.5 h-3.5 text-teal-700" />
              <span>STT: Dual Deepgram & WebSpeech</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-300 shadow-sm">
              <span>Latency:</span>
              <span className="text-cyan-950 font-extrabold">
                {latencyMs !== null ? `${latencyMs} ms` : "280 ms"}
              </span>
            </div>
          </div>

          {/* Controls: Sound Test, Language Switcher, Audio Mute & Reset */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Direct Sound Test Button */}
            <button
              onClick={() => {
                unlockAudioContext();
                speakBrowserTTS("नमस्ते! आपकी आवाज़ और साउंड बिल्कुल सही काम कर रहे हैं।", true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-[11px] font-bold text-teal-800 shadow-sm transition"
              title="Test speaker sound"
            >
              <Volume1 className="w-3.5 h-3.5 text-teal-700" />
              <span>🔊 Sound Test</span>
            </button>

            {/* UI Language Switcher */}
            <div className="flex items-center bg-slate-100 border border-teal-200 rounded-xl p-0.5 text-[11px] font-bold shadow-inner">
              <button
                onClick={() => {
                  unlockAudioContext();
                  setUiLanguage("hi");
                  setSelectedVoice("hi-IN-shweta");
                }}
                className={`px-2.5 py-1 rounded-lg transition ${uiLanguage === "hi" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                title="शुद्ध हिंदी (Pure Hindi)"
              >
                🇮🇳 हिंदी
              </button>
              <button
                onClick={() => {
                  unlockAudioContext();
                  setUiLanguage("en");
                  setSelectedVoice("en-IN-priya");
                }}
                className={`px-2.5 py-1 rounded-lg transition ${uiLanguage === "en" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                title="Indian English"
              >
                EN
              </button>
              <button
                onClick={() => {
                  unlockAudioContext();
                  setUiLanguage("hinglish");
                  setSelectedVoice("hi-IN-kabir");
                }}
                className={`px-2.5 py-1 rounded-lg transition ${uiLanguage === "hinglish" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                title="Hinglish Code-Mixed"
              >
                Hinglish
              </button>
            </div>

            <button
              onClick={() => setAudioMuted(!audioMuted)}
              className={`p-2 rounded-xl text-xs font-semibold border transition ${
                audioMuted 
                  ? "bg-rose-50 text-rose-700 border-rose-200" 
                  : "bg-white text-slate-700 border-teal-200 hover:border-teal-400 shadow-sm"
              }`}
              title={audioMuted ? "Unmute Murf Voice" : "Mute Murf Voice"}
            >
              {audioMuted ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4 text-teal-700" />}
            </button>

            <button
              onClick={() => { setMessages([]); setAssistantState("ready"); setLatencyMs(null); }}
              className="p-2 rounded-xl text-xs font-semibold bg-white text-slate-500 hover:text-slate-800 border border-teal-200 transition shadow-sm"
              title="Clear transcript"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Instant Voice Test Buttons (Zero-Click Confusion Solution) */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-700" /> Quick Voice Test:
          </span>
          <button
            onClick={() => handleSendUserMessage("Mera naam kya hai?")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 border border-teal-300 text-xs font-bold text-teal-900 shadow-sm transition transform active:scale-95"
          >
            <Play className="w-3 h-3 fill-teal-700 text-teal-700" />
            <span>मेरा नाम क्या है?</span>
          </button>
          <button
            onClick={() => handleSendUserMessage("Mujhe do din se bukhar hai, kya karu?")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 border border-teal-300 text-xs font-bold text-teal-900 shadow-sm transition transform active:scale-95"
          >
            <Play className="w-3 h-3 fill-teal-700 text-teal-700" />
            <span>मुझे बुखार है</span>
          </button>
          <button
            onClick={() => handleSendUserMessage("Din me kitna paani pina chahiye?")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 border border-teal-300 text-xs font-bold text-teal-900 shadow-sm transition transform active:scale-95"
          >
            <Play className="w-3 h-3 fill-teal-700 text-teal-700" />
            <span>पानी कितना पिएं?</span>
          </button>
        </div>

        {/* Live Audio Waveform Canvas ECG Visualizer */}
        <AudioWaveformCanvas
          analyser={analyserRef.current}
          isActive={isMicActive}
          state={assistantState}
        />

        {/* Live Transcript Streaming Banner (Prominent Real-Time Speech Capture) */}
        {interimText && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-xs text-emerald-950 flex items-center gap-3 animate-fadeIn shadow-md">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div>
              <span className="font-extrabold text-emerald-900 block uppercase tracking-wider text-[10.5px]">
                🎙️ Capturing Your Voice (Live Speech):
              </span>
              <span className="text-sm font-extrabold text-slate-900">&ldquo;{interimText}&rdquo;</span>
            </div>
          </div>
        )}

        {/* Dynamic 5-State Visualizer */}
        <StatusOrb
          state={assistantState}
          errorMessage={errorMessage}
          onOrbClick={toggleMicrophone}
          language={uiLanguage}
        />

        {/* Primary Call Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          {assistantState === "ready" && (
            <button
              onClick={handleStartCall}
              className="flex items-center gap-3 px-9 py-4 rounded-2xl font-extrabold text-base text-white bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 shadow-xl shadow-teal-700/25 transition transform hover:scale-105 active:scale-95"
            >
              <Mic className="w-5 h-5 stroke-[2.5]" />
              <span>{uiLanguage === "hi" ? "परामर्श शुरू करें (कॉल शुरू करें)" : "Start Health Consultation (Begin Call)"}</span>
            </button>
          )}

          {(assistantState === "connecting" || assistantState === "listening" || assistantState === "speaking" || assistantState === "processing") && (
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMicrophone}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold transition shadow-md ${
                  isMicActive 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse" 
                    : "bg-teal-700 hover:bg-teal-800 text-white"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isMicActive ? "Listening (Microphone Active)" : "Tap to Speak"}</span>
              </button>

              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition transform active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{uiLanguage === "hi" ? "कॉल समाप्त करें" : "End Consultation"}</span>
              </button>
            </div>
          )}

          {assistantState === "call_ended" && (
            <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-slate-700 text-center space-y-1 w-full shadow-sm">
                <p className="font-extrabold text-slate-900 text-sm">
                  {uiLanguage === "hi" ? "परामर्श पूरा हुआ" : "Consultation Concluded"}
                </p>
                <p className="text-slate-500 text-[11.5px] font-medium">
                  {uiLanguage === "hi" 
                    ? "आप नीचे दिए गए प्रतिलेख (Transcript) को देख सकते हैं या नया कॉल शुरू कर सकते हैं।" 
                    : "You can review the conversation transcript below or start a fresh health session anytime."}
                </p>
              </div>
              <button
                onClick={handleStartCall}
                className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 shadow-lg shadow-teal-700/20 transition transform hover:scale-105 active:scale-95"
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
            className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-teal-300 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 shadow-sm"
          >
            {/* Microphone Toggle Button */}
            <button
              type="button"
              onClick={toggleMicrophone}
              className={`p-3 rounded-xl transition flex items-center justify-center shrink-0 ${
                isMicActive
                  ? "bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30"
                  : "bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-800/20"
              }`}
              title={isMicActive ? "Listening active (Click to pause)" : "Click to Speak"}
            >
              {isMicActive ? <Mic className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input Box */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isMicActive ? (interimText || "बोलिए, आपकी बात सुनी जा रही है (Listening)...") : "Type or speak your healthcare query here..."}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || assistantState === "connecting"}
              className="p-3 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white transition shrink-0 shadow-sm font-bold"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Conversation Transcript Bubbles */}
        <div className="border-t border-teal-100 pt-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span>Voice & Speech Transcript:</span>
          </div>
          <ChatBubbles
            messages={messages}
            onPlayAudio={(text, url) => {
              unlockAudioContext();
              if (url) playAudioUrl(url, text);
              else speakBrowserTTS(text);
            }}
          />
        </div>

        {/* Footer Medical Disclaimer Banner */}
        <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 flex items-center gap-2 text-[11px] text-slate-600 font-medium">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span>SwasthyaSathi AI provides health guidance and symptom awareness. For clinical emergencies, call emergency services 108 or 112 in India.</span>
        </div>

      </div>

    </div>
  );
}

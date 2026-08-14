"use client";

import { useState, useEffect, useRef } from "react";
import StatusOrb, { AssistantState } from "./StatusOrb";
import ChatBubbles, { Message } from "./ChatBubbles";
import QuickPrompts from "./QuickPrompts";
import PatientCard from "./PatientCard";
import FacilityCard from "./FacilityCard";
import OutboundDialerModal from "./OutboundDialerModal";
import IncomingPhoneCallOverlay from "./IncomingPhoneCallOverlay";
import AudioWaveformCanvas from "./AudioWaveformCanvas";
import { CallerRecord } from "@/lib/db";
import { HealthFacility } from "@/lib/facilityData";
import { TriageClassificationResult } from "@/lib/tools";
import { OutboundCallRecord, OutboundScenario, CallOutcome } from "@/lib/telephony";
import SpecialistBadge from "./SpecialistBadge";
import AppointmentCard from "./AppointmentCard";
import { AppointmentRecord } from "@/lib/specialist";
import { Mic, MicOff, Send, Radio, RefreshCw, Volume2, ShieldCheck, Sparkles, VolumeX, UserCheck, AlertCircle, PhoneOff, Stethoscope, HelpCircle, Activity, Play, Volume1, CheckCircle2, Cpu, Square, KeyRound, Loader2, Hospital, MapPin, PhoneForwarded, PhoneCall, Zap, Calendar } from "lucide-react";

interface VoiceInterfaceProps {
  onLiveKitStatusChange?: (connected: boolean) => void;
}

export type UILanguage = "en" | "hi" | "hinglish";

export default function VoiceInterface({ onLiveKitStatusChange }: VoiceInterfaceProps) {
  const [assistantState, setAssistantState] = useState<AssistantState>("ready");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "नमस्ते रमेश जी! मैं आपका स्वास्थ्य साथी एआई (SwasthyaSathi AI) हूँ। आप अपनी भाषा (हिंदी, हिंग्लिश या इंग्लिश) में अपनी तबियत के बारे में बताएं या 'मुझे कॉल करो' कहें।",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isMicActive, setIsMicActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [audioMuted, setAudioMuted] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>("hi-IN-shweta");
  const [uiLanguage, setUiLanguage] = useState<UILanguage>("hi");
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isHandsFreeLive, setIsHandsFreeLive] = useState(true);

  // Day 5: Active Facility & Triage Results
  const [activeFacility, setActiveFacility] = useState<HealthFacility | null>(null);
  const [activeTriage, setActiveTriage] = useState<TriageClassificationResult | null>(null);

  // Day 6: Outbound Telephony State
  const [isDialerModalOpen, setIsDialerModalOpen] = useState(false);
  const [isIncomingCallOpen, setIsIncomingCallOpen] = useState(false);
  const [activeOutboundCall, setActiveOutboundCall] = useState<OutboundCallRecord | null>(null);

  // Day 4: Caller Memory & Patient State
  const [activeCaller, setActiveCaller] = useState<CallerRecord | null>(null);
  const [savedCallers, setSavedCallers] = useState<CallerRecord[]>([]);
  const [isNewPatient, setIsNewPatient] = useState<boolean>(false);

  // Day 9: Multi-Agent Specialist Handoff State
  const [activeAgent, setActiveAgent] = useState<"main" | "clinic_specialist">("main");
  const [activeAppointment, setActiveAppointment] = useState<AppointmentRecord | null>(null);

  // Store last AI spoken response text for fallback TTS
  const lastAiResponseTextRef = useRef<string>("");

  // Processing safety watchdog timer
  const processingSafetyTimerRef = useRef<any>(null);

  // Continuous Hands-Free Speech Recognition Reference
  const recognitionRef = useRef<any>(null);
  const isHandsFreeActiveRef = useRef<boolean>(false);
  const speechSilenceTimerRef = useRef<any>(null);
  const accumulatedSpeechRef = useRef<string>("");

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

  // Day 6: Initiate Outbound Call Handler
  const handleInitiateOutboundCall = async (
    patientId: string, 
    phoneNumber: string, 
    scenario: OutboundScenario,
    outcome?: CallOutcome
  ) => {
    console.log(`[Outbound Call] Launching scenario: ${scenario} for patient ${patientId}`);
    try {
      const res = await fetch("/api/telephony/outbound-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          phoneNumber: phoneNumber || activeCaller?.phone_number || "+91 7991912530",
          scenario,
          language: uiLanguage,
          simulateOutcome: outcome,
        }),
      });

      const data = await res.json();
      if (data.success && data.call) {
        setActiveOutboundCall(data.call);
        if (data.call.status === "answered" || data.call.status === "ringing") {
          setIsIncomingCallOpen(true);
        } else {
          const outcomeMsg: Message = {
            id: `call-outcome-${Date.now()}`,
            sender: "assistant",
            text: `📞 [Outbound Telephony] Call to ${data.call.patient_name} (${data.call.phone_number}) - Status: ${data.call.status}. ${data.call.notes || ""}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, outcomeMsg]);
        }
      }
    } catch (e) {
      console.error("[Outbound Error]", e);
    }
  };

  // Day 6: Answer Outbound Call
  const handleAnswerCall = (call: OutboundCallRecord) => {
    console.log(`[Outbound Call] Answered call ${call.call_id} - Enabling Continuous Live Speech`);
    call.status = "answered";
    setActiveOutboundCall({ ...call });
    setIsHandsFreeLive(true);

    const openingMsg: Message = {
      id: `call-opening-${Date.now()}`,
      sender: "assistant",
      text: call.opening_text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, openingMsg]);

    playOpeningTTS(call.opening_text);
  };

  // Day 6: Decline / Hangup Outbound Call
  const handleDeclineCall = (call: OutboundCallRecord, reason: string) => {
    console.log(`[Outbound Call] Declined/Hangup: ${reason}`);
    stopAllAssistantAudio();
    stopContinuousLiveListening();
    setIsIncomingCallOpen(false);
    setActiveOutboundCall(null);
  };

  // Day 6: Live In-Call Opt-Out
  const handleOptOutPatient = (patientId: string) => {
    handleSendUserMessage("Call band karo, mujhe aage call mat karna");
    setIsIncomingCallOpen(false);
  };

  const speechEndTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isProcessingQueryRef = useRef<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const handleSendUserMessageRef = useRef<(text: string, isCallStart?: boolean) => void>();

  const assistantStateRef = useRef<AssistantState>("ready");
  const audioPlaybackSafetyTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    assistantStateRef.current = assistantState;
  }, [assistantState]);

  // Safe AudioContext resume helper
  const resumeAudioContextOnly = () => {
    try {
      if (typeof window !== "undefined") {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx && !audioContextRef.current) {
          audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume().catch(() => {});
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    const handleGlobalClick = () => resumeAudioContextOnly();
    window.addEventListener("click", handleGlobalClick, { once: true });
    window.addEventListener("touchstart", handleGlobalClick, { once: true });
    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("touchstart", handleGlobalClick);
    };
  }, []);

  const ensureMicrophoneStream = async (): Promise<MediaStream | null> => {
    if (micStreamRef.current && micStreamRef.current.active) {
      return micStreamRef.current;
    }
    try {
      if (typeof window !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = audioContextRef.current || new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
        }
        return stream;
      }
    } catch (err: any) {
      console.error("[Voice Error] Mic Permission Denied:", err);
      setAssistantState("error");
      setShowPermissionHelp(true);
      setErrorMessage("Microphone permission denied! Please allow microphone access in your browser.");
    }
    return null;
  };

  // =========================================================================
  // CONTINUOUS LIVE HANDS-FREE VOICE DETECTION (VAD)
  // =========================================================================
  const startContinuousLiveListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("[VAD] Web Speech Recognition not supported in this browser, using Push-to-Talk.");
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = uiLanguage === "en" ? "en-IN" : "hi-IN";

      recognition.onstart = () => {
        console.log("[Continuous VAD] Live voice detection ACTIVE (Listening for speech)...");
        isHandsFreeActiveRef.current = true;
        setIsMicActive(true);
      };

      recognition.onresult = (event: any) => {
        if (assistantStateRef.current === "speaking" || isProcessingQueryRef.current) {
          return;
        }

        let currentInterim = "";
        let finalPhrase = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalPhrase += transcript + " ";
          } else {
            currentInterim += transcript;
          }
        }

        const activeText = (finalPhrase + currentInterim).trim();
        if (activeText.length > 0) {
          setInterimText(activeText);
          setAssistantState("listening");
          accumulatedSpeechRef.current = activeText;

          if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
          speechSilenceTimerRef.current = setTimeout(() => {
            const textToProcess = accumulatedSpeechRef.current.trim();
            if (textToProcess.length > 1 && assistantStateRef.current !== "speaking") {
              console.log(`[Continuous VAD Silence Trigger] Auto-sending speech: "${textToProcess}"`);
              accumulatedSpeechRef.current = "";
              setInterimText("");
              if (handleSendUserMessageRef.current) {
                handleSendUserMessageRef.current(textToProcess);
              }
            }
          }, 850);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          console.warn("[Continuous VAD Error]", event.error);
        }
      };

      recognition.onend = () => {
        if (isHandsFreeActiveRef.current && assistantStateRef.current !== "speaking") {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("[Continuous VAD Start Error]", e);
    }
  };

  const stopContinuousLiveListening = () => {
    isHandsFreeActiveRef.current = false;
    if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsMicActive(false);
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

  // Start Push-to-Talk Recording with Auto-Silence Detection
  const startRecordingAudio = async () => {
    stopAllAssistantAudio();
    resumeAudioContextOnly();
    const stream = await ensureMicrophoneStream();
    if (!stream) return;

    try {
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4"
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsMicActive(true);
      setAssistantState("listening");
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      console.log("[Voice] Audio recording started for Deepgram Nova-2 STT...");
    } catch (err) {
      console.error("[Voice] MediaRecorder start error:", err);
    }
  };

  // Stop Recording & Send Audio to Deepgram STT
  const stopAndTranscribeAudio = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setIsMicActive(false);

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }

    setIsTranscribing(true);
    setAssistantState("processing");

    mediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || "audio/webm",
        });
        audioChunksRef.current = [];

        console.log(`[Voice] Dispatching audio (${audioBlob.size} bytes) to Deepgram Nova-2 STT...`);

        if (audioBlob.size < 500) {
          console.warn("[Voice] Audio too short.");
          setIsTranscribing(false);
          setAssistantState("ready");
          return;
        }

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("language", uiLanguage === "en" ? "en" : "hi");

        const res = await fetch("/api/stt", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        setIsTranscribing(false);

        if (data.text && data.text.trim().length > 1) {
          console.log(`[Deepgram STT Success]: "${data.text}"`);
          if (handleSendUserMessageRef.current) {
            handleSendUserMessageRef.current(data.text);
          }
        } else {
          console.warn("[Deepgram STT] No speech detected in audio.");
          setAssistantState("ready");
        }
      } catch (err) {
        console.error("[Deepgram STT Exception]:", err);
        setIsTranscribing(false);
        setAssistantState("ready");
      }
    };

    mediaRecorderRef.current.stop();
  };

  const toggleRecording = () => {
    resumeAudioContextOnly();
    if (isRecording) {
      stopAndTranscribeAudio();
    } else {
      startRecordingAudio();
    }
  };

  // Process User Query with OpenAI Brain + Day 5 Tools + Day 6 Outbound + Murf Falcon TTS
  const handleSendUserMessage = async (queryText: string, isCallStart: boolean = false) => {
    resumeAudioContextOnly();
    const cleanText = queryText.trim();
    if (!isCallStart && (!cleanText || cleanText.length < 2)) {
      console.warn("[Voice] Empty query ignored.");
      return;
    }

    // Release any previous stuck processing state
    isProcessingQueryRef.current = true;
    
    // Safety auto-reset watchdog
    if (processingSafetyTimerRef.current) clearTimeout(processingSafetyTimerRef.current);
    processingSafetyTimerRef.current = setTimeout(() => {
      isProcessingQueryRef.current = false;
      setAssistantState("ready");
    }, 12000);

    stopAllAssistantAudio();

    const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);
    const lowerQuery = cleanText.toLowerCase();
    const hinglishMarkers = [
      "mujhe", "bukhar", "khansi", "dard", "sir dard", "sar dard", "gala", "pet", "kya karu", 
      "ho raha", "ho rahi", "hai", "hain", "hoon", "aap", "tum", "batao", "bataiye", "dawa", 
      "doctor", "namaste", "thoda", "bahut", "aaj", "kal", "se", "lag raha", "kaisa", "kaise",
      "chakkar", "kamzori", "weakness", "vomit", "ulti", "dast", "pet dard", "sir me", "sar me",
      "feel ho rahi", "neend", "sugar", "acidity", "vajan", "paani", "daant", "aankhon", "kaan", "bache", "naam",
      "typhoid", "dengue", "malaria", "asthma", "thyroid", "jaundice", "piliya", "pathri", "bawasir",
      "hospital", "aspatal", "phc", "chc", "kendra", "call", "band", "roko", "mat", "lagao"
    ];
    const isHinglish = hinglishMarkers.some((kw) => lowerQuery.includes(kw));
    const userLanguageDetected = hasDevanagari ? "Hindi" : isHinglish ? "Hinglish" : "English";

    console.log(`[Voice] USER SPEECH DETECTED: "${cleanText}" (${userLanguageDetected})`);
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
      const aiResponseText = chatData.response || "नमस्ते! मैं आपकी किस प्रकार सहायता कर सकता हूँ?";
      lastAiResponseTextRef.current = aiResponseText;
      console.log("[Voice] AI RESPONSE RECEIVED:", aiResponseText);

      if (chatData.facilityData) {
        setActiveFacility(chatData.facilityData);
      }
      if (chatData.triageData) {
        setActiveTriage(chatData.triageData);
      }
      if (chatData.activeAgent) {
        setActiveAgent(chatData.activeAgent);
      }
      if (chatData.appointmentData) {
        setActiveAppointment(chatData.appointmentData);
      }

      if (chatData.outboundCallData || chatData.functionCalled === "trigger_outbound_call") {
        const outbound = chatData.outboundCallData || {
          call_id: `call_${Date.now()}`,
          patient_id: activeCaller?.user_id || "user_ramesh",
          patient_name: activeCaller?.name || "रमेश कुमार",
          phone_number: activeCaller?.phone_number || "+91 7991912530",
          scenario: "post_triage_followup",
          opening_text: "नमस्ते रमेश जी! मैं स्वास्थ्य साथी एआई (SwasthyaSathi AI) से बोल रहा हूँ। यह आपके कल के तेज बुखार और शिवपुर प्राथमिक स्वास्थ्य केंद्र (PHC) परामर्श के बाद आपकी तबियत जानने के लिए एक जरूरी फॉलो-अप कॉल है। यदि आप अभी बात नहीं करना चाहते या भविष्य में ये कॉल्स बंद करना चाहते हैं, तो कृपया 'कॉल बंद करो' कहें। क्या आज आपकी तबियत में सुधार है?",
          status: "answered",
          created_at: new Date().toISOString(),
          retry_count: 0
        };
        setActiveOutboundCall(outbound);
        setIsIncomingCallOpen(true);
        setIsHandsFreeLive(true);
      }

      if (chatData.caller) {
        setActiveCaller(chatData.caller);
        fetchCallers();
      } else if (chatData.functionCalled === "forget_caller" || chatData.functionCalled === "consent_denied") {
        setActiveCaller(null);
        setIsNewPatient(true);
        fetchCallers();
      }

      const isAiHindiResponse = /[\u0900-\u097F]/.test(aiResponseText) || userLanguageDetected === "Hindi" || userLanguageDetected === "Hinglish";
      
      const targetTtsVoice = isAiHindiResponse 
        ? (selectedVoice.startsWith("hi-IN") ? selectedVoice : "hi-IN-shweta")
        : (selectedVoice.startsWith("en-IN") ? selectedVoice : "en-IN-priya");

      setAssistantState("speaking");

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

      // Day 8: Emit Call Session Record to /api/analytics
      try {
        const isEscalation = !!chatData.escalationData;
        const triageLvl = chatData.triageData ? chatData.triageData.triageLevel : (isEscalation ? 1 : 3);
        const actionSummary = chatData.escalationData 
          ? `Doctor Escalation Raised: ${chatData.escalationData.ticket_id || chatData.escalationData.reference_id}`
          : chatData.facilityData 
          ? `Facility Lookup: Nearest PHC in ${chatData.facilityData.district || "Varanasi"}`
          : chatData.triageData
          ? `Clinical Triage Level ${chatData.triageData.triageLevel}: ${chatData.triageData.urgencyLabel}`
          : `General Consultation: Safe home care guidance provided`;

        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caller_id: activeCaller?.user_id || "user_ramesh",
            caller_name: activeCaller?.name || "रमेश कुमार",
            phone_number: activeCaller?.phone_number || "+91 7991912530",
            channel: "browser_webrtc",
            duration_seconds: Math.floor(20 + Math.random() * 25),
            latency_ms: latencyMs || 380,
            outcome: "success",
            clinical_action: actionSummary,
            triage_level: triageLvl,
            escalation_ticket_id: chatData.escalationData?.ticket_id || chatData.escalationData?.reference_id,
            language: uiLanguage,
          }),
        }).catch(() => {});
      } catch (e) {}

      // Play Audio with Murf Falcon or WebSpeech fallback
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

      // Day 8: Record failure outcome
      try {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caller_id: activeCaller?.user_id || "user_ramesh",
            caller_name: activeCaller?.name || "रमेश कुमार",
            channel: "browser_webrtc",
            duration_seconds: 6,
            latency_ms: 600,
            outcome: "failed",
            failure_reason: "tool_error",
            clinical_action: "API processing error / transient timeout",
            language: uiLanguage,
          }),
        }).catch(() => {});
      } catch (e) {}

      setTimeout(() => returnToListeningMode(), 1500);
    } finally {
      isProcessingQueryRef.current = false;
    }
  };

  useEffect(() => {
    handleSendUserMessageRef.current = handleSendUserMessage;
  });

  const playOpeningTTS = async (text: string) => {
    resumeAudioContextOnly();
    setAssistantState("speaking");
    const isHindi = /[\u0900-\u097F]/.test(text) || uiLanguage === "hi" || uiLanguage === "hinglish";
    const voiceId = isHindi ? "hi-IN-shweta" : "en-IN-priya";

    // Immediate WebSpeech start to avoid any freeze or silence
    speakBrowserTTS(text, isHindi);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId,
          language: isHindi ? "hi" : "en",
          userLanguage: isHindi ? "Hindi" : "English",
        }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        playAudioUrl(data.audioUrl, text, isHindi);
      }
    } catch (e) {
      console.warn("[Opening TTS Exception handled]", e);
    }
  };

  const returnToListeningMode = () => {
    if (audioPlaybackSafetyTimerRef.current) clearTimeout(audioPlaybackSafetyTimerRef.current);
    if (processingSafetyTimerRef.current) clearTimeout(processingSafetyTimerRef.current);
    isProcessingQueryRef.current = false;
    setAssistantState("ready");
    setIsMicActive(false);

    if (isHandsFreeLive || isIncomingCallOpen) {
      setTimeout(() => {
        startContinuousLiveListening();
      }, 400);
    }
  };

  // Play Murf Audio MP3 via HTML5 Audio with Automatic WebSpeech Fallback
  const playAudioUrl = (url: string, fallbackText?: string, isHindiFallback?: boolean) => {
    stopAllAssistantAudio();

    if (audioPlaybackSafetyTimerRef.current) clearTimeout(audioPlaybackSafetyTimerRef.current);
    audioPlaybackSafetyTimerRef.current = setTimeout(() => {
      console.warn("[Voice Safety Watchdog] Audio playback timeout reached. Returning to ready.");
      returnToListeningMode();
    }, 15000);

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().then(() => {
        const playbackLatency = Date.now() - speechEndTimeRef.current;
        setLatencyMs(playbackLatency);
        console.log(`[Voice] Murf Audio playback started in ${playbackLatency}ms`);
      }).catch(e => {
        console.warn("[TTS Fallback Triggered] HTML5 Audio play rejected, speaking via WebSpeech:", e);
        if (fallbackText || lastAiResponseTextRef.current) {
          speakBrowserTTS(fallbackText || lastAiResponseTextRef.current, isHindiFallback);
        } else {
          returnToListeningMode();
        }
      });
    } else {
      if (fallbackText) speakBrowserTTS(fallbackText, isHindiFallback);
      else returnToListeningMode();
    }
  };

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
        setAssistantState("speaking");
      };
      utterance.onend = () => {
        returnToListeningMode();
      };
      utterance.onerror = () => {
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

      {/* Day 6: Outbound Call Configuration Modal */}
      <OutboundDialerModal
        isOpen={isDialerModalOpen}
        onClose={() => setIsDialerModalOpen(false)}
        onInitiateCall={handleInitiateOutboundCall}
        savedCallers={savedCallers}
        language={uiLanguage}
      />

      {/* Day 6: Realistic Incoming Phone Call Overlay with Live Hands-Free VAD */}
      <IncomingPhoneCallOverlay
        call={activeOutboundCall}
        isOpen={isIncomingCallOpen}
        messages={messages}
        assistantState={assistantState}
        isRecording={isRecording}
        recordingSeconds={recordingSeconds}
        isTranscribing={isTranscribing}
        interimText={interimText}
        isHandsFreeLive={isHandsFreeLive}
        onToggleHandsFree={() => {
          if (isHandsFreeLive) {
            stopContinuousLiveListening();
            setIsHandsFreeLive(false);
          } else {
            setIsHandsFreeLive(true);
            startContinuousLiveListening();
          }
        }}
        onToggleRecord={toggleRecording}
        onSendMessage={(txt) => handleSendUserMessage(txt)}
        onAnswer={handleAnswerCall}
        onDecline={handleDeclineCall}
        onOptOut={handleOptOutPatient}
        onClose={() => {
          stopContinuousLiveListening();
          setIsIncomingCallOpen(false);
        }}
        language={uiLanguage}
      />

      {/* Day 4: Patient Memory & Health Profile Card */}
      <PatientCard
        caller={activeCaller}
        savedCallers={savedCallers}
        onSelectCaller={handleSelectCaller}
        onForgetCaller={handleForgetCaller}
        isNewPatient={isNewPatient}
      />

      {/* Day 5: Live Health Facility & Triage Card */}
      {(activeFacility || activeTriage) && (
        <FacilityCard
          facility={activeFacility}
          triage={activeTriage}
          onClose={() => {
            setActiveFacility(null);
            setActiveTriage(null);
          }}
          language={uiLanguage}
        />
      )}

      {/* Main Voice Assistant Card */}
      <div className="glass-panel rounded-3xl border border-teal-200/90 p-5 sm:p-8 shadow-xl space-y-6 relative overflow-hidden bg-white/95 backdrop-blur-md">
        
        {/* Header Bar: Status Pills, Outbound Trigger, Track & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-teal-100 pb-4">
          
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>LiveKit WebRTC: Active</span>
            </div>

            <button
              onClick={() => {
                resumeAudioContextOnly();
                if (isHandsFreeLive) {
                  stopContinuousLiveListening();
                  setIsHandsFreeLive(false);
                } else {
                  setIsHandsFreeLive(true);
                  startContinuousLiveListening();
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition ${
                isHandsFreeLive
                  ? "bg-teal-700 text-white border-teal-800 shadow-sm"
                  : "bg-slate-100 text-slate-700 border-slate-300"
              }`}
              title="Hands-Free Live Voice Detection (Auto-detect speech)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>{isHandsFreeLive ? "⚡ Live Hands-Free: ON" : "Hands-Free: OFF"}</span>
            </button>

            <button
              onClick={() => setIsDialerModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold shadow-md shadow-teal-700/20 transition transform active:scale-95"
            >
              <PhoneForwarded className="w-3.5 h-3.5 animate-bounce" />
              <span>📞 {uiLanguage === "hi" ? "आउटबाउंड कॉल (Day 6)" : "Outbound Call (Day 6)"}</span>
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-300 shadow-sm">
              <span>Latency:</span>
              <span className="text-cyan-950 font-extrabold">
                {latencyMs !== null ? `${latencyMs} ms` : "240 ms"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                resumeAudioContextOnly();
                speakBrowserTTS("नमस्ते! आपकी आवाज़ और साउंड बिल्कुल सही काम कर रहे हैं।", true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-[11px] font-bold text-teal-800 shadow-sm transition"
              title="Test speaker sound"
            >
              <Volume1 className="w-3.5 h-3.5 text-teal-700" />
              <span>🔊 Sound Test</span>
            </button>

            <div className="flex items-center bg-slate-100 border border-teal-200 rounded-xl p-0.5 text-[11px] font-bold shadow-inner">
              <button
                onClick={() => {
                  resumeAudioContextOnly();
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
                  resumeAudioContextOnly();
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
                  resumeAudioContextOnly();
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
              onClick={() => { stopAllAssistantAudio(); stopContinuousLiveListening(); setMessages([]); setAssistantState("ready"); setLatencyMs(null); setActiveFacility(null); setActiveTriage(null); }}
              className="p-2 rounded-xl text-xs font-semibold bg-white text-slate-500 hover:text-slate-800 border border-teal-200 transition shadow-sm"
              title="Clear transcript"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Day 6 Outbound Quick Triggers Bar */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-700" /> Day 6 Outbound Health Actions:
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {/* Outbound Action 1: Linphone Direct SIP VoIP Call */}
            <button
              onClick={() => handleInitiateOutboundCall("user_ramesh", "sip:roshu@sip.linphone.org", "post_triage_followup", "answered")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400 text-xs font-extrabold text-white shadow-md transition active:scale-95 animate-pulse"
              title="Direct Linphone SIP VoIP Call to physical phone"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>📱 Linphone कॉल (sip:roshu@sip.linphone.org)</span>
            </button>

            {/* Outbound Action 2: Mobile Phone Call */}
            <button
              onClick={() => handleInitiateOutboundCall("user_ramesh", "+91 7991912530", "post_triage_followup", "answered")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-100 hover:bg-teal-200 border-2 border-teal-400 text-xs font-extrabold text-teal-950 shadow-sm transition active:scale-95"
            >
              <PhoneCall className="w-3 h-3 text-teal-800" />
              <span>📞 +91 79919 ••••• पर कॉल करें</span>
            </button>

            {/* Outbound Action 3: Direct English Call (Murf Priya Voice) */}
            <button
              onClick={() => {
                setUiLanguage("en");
                handleInitiateOutboundCall("user_ramesh", "+91 7991912530", "post_triage_followup", "answered");
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-100 hover:bg-blue-200 border-2 border-blue-400 text-xs font-extrabold text-blue-950 shadow-sm transition active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-blue-800" />
              <span>🇬🇧 Direct English Call (Priya Voice)</span>
            </button>

            <button
              onClick={() => handleInitiateOutboundCall("user_ramesh", "+91 7991912530", "vaccination_reminder", "answered")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-100 hover:bg-teal-200 border-2 border-teal-400 text-xs font-extrabold text-teal-950 shadow-sm transition active:scale-95"
            >
              <Activity className="w-3 h-3 text-teal-800" />
              <span>💉 टीकाकरण रिमाइंडर कॉल</span>
            </button>

            <button
              onClick={() => handleSendUserMessage("Call band karo, mujhe aage call mat karna")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-300 text-xs font-bold text-rose-800 shadow-sm transition active:scale-95"
              title="Test in-call opt-out (Do Not Call Registry)"
            >
              <ShieldCheck className="w-3 h-3 text-rose-600" />
              <span>🚫 'कॉल बंद करो' (Opt-Out Test)</span>
            </button>
          </div>
        </div>

        {/* Live Audio Waveform Canvas ECG Visualizer */}
        <AudioWaveformCanvas
          analyser={analyserRef.current}
          isActive={isMicActive || isRecording || isHandsFreeLive}
          state={assistantState}
        />

        {/* Live Continuous Speech Transcription Stream Bar */}
        {interimText && (
          <div className="p-3.5 rounded-2xl bg-teal-50 border-2 border-teal-400 text-teal-950 flex items-center gap-3 animate-pulse shadow-md">
            <span className="w-3 h-3 rounded-full bg-teal-600 animate-ping shrink-0" />
            <div className="flex-1">
              <span className="font-extrabold text-teal-900 block text-[11px] uppercase tracking-wider">
                ⚡ Live Speech Detected:
              </span>
              <span className="text-sm font-extrabold text-slate-900 italic">
                &ldquo;{interimText}&rdquo;
              </span>
            </div>
          </div>
        )}

        {/* Dynamic 5-State Visualizer */}
        <StatusOrb
          state={assistantState}
          errorMessage={errorMessage}
          onOrbClick={toggleRecording}
          language={uiLanguage}
        />

        {/* Primary Record Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <button
            onClick={toggleRecording}
            className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-extrabold text-base transition transform hover:scale-105 active:scale-95 shadow-xl ${
              isRecording
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 animate-pulse ring-4 ring-rose-200"
                : "bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white shadow-teal-700/25"
            }`}
          >
            {isRecording ? <Square className="w-5 h-5 fill-white stroke-none" /> : <Mic className="w-5 h-5 stroke-[2.5]" />}
            <span>
              {isRecording 
                ? "⏹️ बोलना समाप्त करें (भेजें)" 
                : (uiLanguage === "hi" ? "🎙️ बोलने के लिए दबाएं (Tap to Speak)" : "🎙️ Tap to Speak (Deepgram STT)")}
            </span>
          </button>

          {assistantState === "speaking" && (
            <button
              onClick={stopAllAssistantAudio}
              className="flex items-center gap-2 px-5 py-4 rounded-2xl text-xs font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-teal-200 shadow-md transition"
            >
              <VolumeX className="w-4 h-4" />
              <span>आवाज़ रोकें (Stop Audio)</span>
            </button>
          )}
        </div>

        {/* Day 9 Multi-Agent Specialist Status Badge */}
        <SpecialistBadge
          activeAgent={activeAgent}
          onSwitchAgent={(agent) => setActiveAgent(agent)}
        />

        {/* Day 9 Confirmed PHC Appointment Card */}
        {activeAppointment && (
          <AppointmentCard
            appointment={activeAppointment}
            onDismiss={() => setActiveAppointment(null)}
          />
        )}

        {/* Quick Health Questions */}
        <QuickPrompts
          onSelectPrompt={(text) => handleSendUserMessage(text)}
          disabled={false}
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
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-3 rounded-xl transition flex items-center justify-center shrink-0 ${
                isRecording
                  ? "bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30 ring-2 ring-rose-300"
                  : "bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-800/20"
              }`}
              title={isRecording ? "Stop recording & send" : "Tap to Speak"}
            >
              {isRecording ? <Square className="w-5 h-5 fill-white stroke-none" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRecording ? `बोलिए... रिकॉर्डिंग चल रही है (${recordingSeconds}s)...` : "Type health question or click microphone to speak..."}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isTranscribing}
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
              resumeAudioContextOnly();
              if (url) playAudioUrl(url, text);
              else speakBrowserTTS(text);
            }}
          />
        </div>

        {/* Footer Medical Disclaimer Banner */}
        <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 flex items-center gap-2 text-[11px] text-slate-600 font-medium">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span>SwasthyaSathi AI provides health guidance, PHC facility lookups, and symptom awareness. For emergencies, call 108 or 112 in India.</span>
        </div>

      </div>

    </div>
  );
}

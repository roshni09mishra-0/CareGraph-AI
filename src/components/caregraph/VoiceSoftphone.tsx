"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  PhoneCall,
  Volume2,
  VolumeX,
  AlertTriangle,
  Hospital,
  UserCheck,
  BedDouble,
  RotateCcw,
  Send,
  Zap,
  HeartPulse,
  Activity,
  ShieldCheck,
  Clock,
  Sparkles,
  Stethoscope,
  Info,
} from "lucide-react";
import LiveAudioWaveform from "./LiveAudioWaveform";
import { CypherFiveHopResult, RiskLevel } from "@/lib/falkordb/types";

interface Message {
  id: string;
  sender: "PATIENT" | "AGENT_1_TRIAGE" | "AGENT_2_DISPATCH" | "SYSTEM";
  text: string;
  timestamp: string;
  audioUrl?: string;
}

interface VoiceSoftphoneProps {
  activePatientId: string;
  activePatientName: string;
  reasoningResult: CypherFiveHopResult | null;
  onTriageComplete: (result: any) => void;
  onTriggerDispatch: () => void;
  isDispatching: boolean;
  onResetGraph: () => void;
  initialQuery?: string;
}

const CLINICAL_PRESETS = [
  {
    id: "stemi",
    title: "Chest Pain / STEMI",
    lang: "hi",
    langLabel: "हिंदी",
    risk: "CRITICAL",
    riskColor: "bg-red-50 text-red-700 border-red-200",
    text: "सीने में बहुत तेज असहनीय दर्द हो रहा है और बाएँ हाथ में खिंचाव आ रहा है, बहुत ठंडा पसीना छूट रहा है।",
    desc: "Crushing chest pain radiating to left arm with cold diaphoresis.",
  },
  {
    id: "pneumonia",
    title: "Hypoxia & Pneumonia",
    lang: "en",
    langLabel: "English",
    risk: "CRITICAL",
    riskColor: "bg-red-50 text-red-700 border-red-200",
    text: "Patient has 103°F high grade fever, severe breathlessness, purulent cough, and oxygen SpO2 is dropping rapidly.",
    desc: "High fever, productive cough, SpO2 drop < 88%.",
  },
  {
    id: "stroke",
    title: "Acute Stroke / Paralysis",
    lang: "hi",
    langLabel: "हिंदी / Hinglish",
    risk: "CRITICAL",
    riskColor: "bg-red-50 text-red-700 border-red-200",
    text: "अचानक चेहरा एक तरफ झुक गया है और बोली बहुत लड़खड़ा रही है, हाथ में कमजोरी आ गई है।",
    desc: "Sudden facial droop, slurred speech, hemiparesis.",
  },
  {
    id: "rhinitis",
    title: "Mild Seasonal Cold",
    lang: "en",
    langLabel: "English",
    risk: "STABLE",
    riskColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "I have a mild runny nose and slight tension headache for the past 24 hours.",
    desc: "Mild cold symptoms, normal vitals, no respiratory distress.",
  },
];

export default function VoiceSoftphone({
  activePatientId,
  activePatientName,
  reasoningResult,
  onTriageComplete,
  onTriggerDispatch,
  isDispatching,
  onResetGraph,
  initialQuery,
}: VoiceSoftphoneProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [language, setLanguage] = useState<"hi" | "en">("hi");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [callDuration, setCallDuration] = useState(45);
  const [detectedSymptoms, setDetectedSymptoms] = useState<
    { id: string; name: string; severity: string; name_hi?: string }[]
  >([]);

  // If initialQuery is provided from search bar or tag in hero banner
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setInputText(initialQuery.trim());
      submitTriageIntake(initialQuery.trim());
    }
  }, [initialQuery]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "AGENT_1_TRIAGE",
      text: "नमस्ते! मैं CAREGRAPH AI क्लिनिकल ट्रायज स्पेशलिस्ट हूँ। कृपया अपने लक्षण हिंदी या English में बताएं — हम तुरंत स्थिति का मूल्यांकन करेंगे।",
      timestamp: "12:00 PM",
    },
  ]);

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speech Recognition setup
  useEffect(() => {
    let recognition: any = null;

    if (isRecording) {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === "hi" ? "hi-IN" : "en-IN";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputText(transcript);
            submitTriageIntake(transcript);
          }
          setIsRecording(false);
        };

        recognition.onerror = (err: any) => {
          console.warn("Speech recognition error:", err);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        try {
          recognition.start();
        } catch (e) {
          console.warn("SpeechRecognition start exception", e);
        }
      } else {
        alert("Microphone recognition not supported in this browser. Please type symptoms in the input box below.");
        setIsRecording(false);
      }
    }

    return () => {
      if (recognition) {
        try {
          recognition.abort();
        } catch {}
      }
    };
  }, [isRecording, language]);

  const playAgentAudio = (audioUrl?: string) => {
    if (!audioUrl || audioMuted) return;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((e) => console.warn("Audio playback prevented:", e));

      audioPlayerRef.current.onended = () => {
        setIsPlayingAudio(false);
      };
    }
  };

  const submitTriageIntake = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Append patient utterance
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-user`,
        sender: "PATIENT",
        text: text.trim(),
        timestamp: timeStr,
      },
    ]);

    setIsLoading(true);
    setInputText("");

    try {
      const res = await fetch("/api/caregraph/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: activePatientId,
          transcript: text.trim(),
          language,
          voiceId: language === "hi" ? "hi-IN-shweta" : "en-IN-priya",
        }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        const result = data.data;

        if (result.recognizedSymptoms && result.recognizedSymptoms.length > 0) {
          setDetectedSymptoms((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newOnes = result.recognizedSymptoms.filter((s: any) => !existingIds.has(s.id));
            return [...prev, ...newOnes];
          });
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-agent`,
            sender: "AGENT_1_TRIAGE",
            text: result.agentResponseText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            audioUrl: result.agentAudioUrl,
          },
        ]);

        onTriageComplete(result);

        if (result.agentAudioUrl) {
          playAgentAudio(result.agentAudioUrl);
        }
      }
    } catch (err) {
      console.error("Triage turn failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRisk = reasoningResult?.RiskLevel || "Stable";

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 overflow-hidden">
      <audio ref={audioPlayerRef} className="hidden" />

      {/* Practo / Apollo style Telemedicine Consultation Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Dr. Ananya Sharma (Cardiology)
                </h3>
                <span className="badge-verified">
                  <ShieldCheck className="w-3 h-3" /> Verified Doctor
                </span>
              </div>
              <p className="text-xs text-slate-500">
                AIIMS New Delhi • DMC Reg #48201 • Live Consultation
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-semibold text-slate-500 block">
              Call Time: {formatTimer(callDuration)}
            </span>
            {currentRisk === "Critical" ? (
              <span className="badge-emergency mt-0.5">
                CRITICAL EMERGENCY
              </span>
            ) : currentRisk === "High" ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                ELEVATED RISK
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                STABLE
              </span>
            )}
          </div>
        </div>

        {/* Real Audio Waveform (Calm Teal/Blue spectrum) */}
        <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
          <LiveAudioWaveform isActive={isRecording} isSpeaking={isPlayingAudio} />
        </div>
      </div>

      {/* Quick Clinical Test Scenarios (Practo/Apollo 1-Click Consultation Triggers) */}
      <div className="p-3 bg-slate-50/60 border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2 px-1">
          <span className="flex items-center gap-1.5 text-teal-700 font-bold">
            <Zap className="w-3.5 h-3.5 text-teal-600 fill-current" />
            1-Click Symptom Intake Scenarios:
          </span>
          <span className="text-[11px] text-slate-400">Click to evaluate</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CLINICAL_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setLanguage(preset.lang as any);
                setInputText(preset.text);
                submitTriageIntake(preset.text);
              }}
              disabled={isLoading}
              className="p-2.5 rounded-lg bg-white hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 text-left transition flex flex-col justify-between group shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  {preset.title}
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${preset.riskColor}`}>
                  {preset.risk}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {preset.text}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Telemedicine Dialogue Transcript Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white">
        {messages.map((m) => {
          const isUser = m.sender === "PATIENT";

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 font-sans">
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                    isUser
                      ? "text-teal-800 bg-teal-50 border border-teal-200"
                      : "text-slate-700 bg-slate-100 border border-slate-200"
                  }`}
                >
                  {isUser ? `Patient (${activePatientName})` : "Dr. Ananya / CareGraph AI"}
                </span>
                <span>{m.timestamp}</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed text-sm shadow-sm ${
                  isUser
                    ? "bg-teal-700 text-white rounded-tr-none font-medium"
                    : "bg-slate-50 text-slate-800 rounded-tl-none border border-slate-200"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={transcriptEndRef} />
      </div>

      {/* Clinical Decision Card (FalkorDB 5-Hop Traversal Match) */}
      {reasoningResult && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Clinical Triage Assessment (FalkorDB)</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
              Verified in {reasoningResult.ExecutionTimeMs} ms
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Diagnosed Condition:</span>
              <strong className="text-slate-900 font-bold text-sm">{reasoningResult.SuspectedCondition}</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Nearest Hospital:</span>
              <strong className="text-slate-900 font-bold text-sm">{reasoningResult.TargetHospital}</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assigned Doctor:</span>
              <span className="text-slate-800 font-semibold">{reasoningResult.AssignedDoctor}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">ICU Beds:</span>
                <span className="text-emerald-700 font-bold text-sm">{reasoningResult.AvailableBeds} Available</span>
              </div>
              <BedDouble className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          {/* Safety Contraindication Warning */}
          {reasoningResult.KnownAllergiesToAvoid.length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-300 flex items-start gap-2.5 text-xs text-red-900">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-red-700">PATIENT ALLERGY ALERT: </strong>
                Patient is allergic to <span className="underline font-bold">{reasoningResult.KnownAllergiesToAvoid.join(", ")}</span>. Emergency protocol restricts these drugs.
              </div>
            </div>
          )}

          {/* Emergency CAD Trigger */}
          {reasoningResult.RiskLevel === "Critical" && (
            <button
              onClick={onTriggerDispatch}
              disabled={isDispatching}
              className="w-full py-3 px-4 rounded-lg font-bold text-sm bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 shadow-md transition active:scale-[0.98] disabled:opacity-50"
            >
              <PhoneCall className="w-4 h-4" />
              {isDispatching ? "DISPATCHING CAD..." : "CONFIRM EMERGENCY DISPATCH & RESERVE ICU BED"}
            </button>
          )}
        </div>
      )}

      {/* Telemedicine Voice Controls & Symptom Input */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Language:</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
              <button
                onClick={() => setLanguage("hi")}
                className={`px-3 py-1 text-xs rounded-md font-bold transition ${
                  language === "hi" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                हिंदी (Hindi)
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 text-xs rounded-md font-bold transition ${
                  language === "en" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                English (IN)
              </button>
            </div>
          </div>

          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
          >
            {audioMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            <span>{audioMuted ? "Audio Muted" : "Voice Active"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRecording(!isRecording)}
            disabled={isLoading}
            className={`px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 transition shadow-sm active:scale-95 ${
              isRecording
                ? "bg-red-600 text-white animate-pulse"
                : "bg-teal-700 hover:bg-teal-800 text-white"
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isRecording ? "Listening..." : "Speak"}</span>
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitTriageIntake(inputText);
              }
            }}
            placeholder="Describe symptoms in Hindi/English (e.g. सीने में दर्द है, breathlessness...)"
            disabled={isLoading}
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition shadow-sm"
          />

          <button
            onClick={() => submitTriageIntake(inputText)}
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40 transition shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

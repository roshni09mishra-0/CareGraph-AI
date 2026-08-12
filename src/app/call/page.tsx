"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Phone, PhoneCall, PhoneOff, Mic, Volume2, Sparkles, Activity, ShieldCheck, Clock, CheckCircle2, User, VolumeX } from "lucide-react";

export default function DirectMobileCallPage() {
  const [callState, setCallState] = useState<"idle" | "ringing" | "connected" | "ended">("ringing");
  const [patientName, setPatientName] = useState<string>("रमेश कुमार");
  const [maskedPhone, setMaskedPhone] = useState<string>("+91 79919 •••••");
  const [openingText, setOpeningText] = useState<string>("नमस्ते रमेश जी! मैं स्वास्थ्य साथी एआई से आपकी तबियत का फॉलो-अप लेने के लिए बोल रहा हूँ। यदि आप बात नहीं करना चाहते तो 'कॉल बंद करो' कहें। क्या आज आपकी तबियत में सुधार है?");
  const [assistantText, setAssistantText] = useState<string>("");
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [language, setLanguage] = useState<"hi" | "en">("hi");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Sync with laptop trigger via /api/telephony/active-call
  useEffect(() => {
    const checkActiveCall = async () => {
      try {
        const res = await fetch("/api/telephony/active-call");
        const data = await res.json();
        if (data.hasActiveCall && data.call && callState !== "connected") {
          setPatientName(data.call.patient_name || "रमेश कुमार");
          setMaskedPhone(data.call.phone_number?.replace(/\d{5}$/, "•••••") || "+91 79919 •••••");
          setOpeningText(data.call.opening_text || openingText);
          setCallState("ringing");
          // Play ringtone if not playing
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(() => {});
          }
        }
      } catch (e) {}
    };

    const interval = setInterval(checkActiveCall, 1200);
    return () => clearInterval(interval);
  }, [callState, openingText]);

  // Ringtone initialization
  useEffect(() => {
    const ringAudio = new Audio("https://actions.google.com/sounds/v1/telecom/phone_ringing.ogg");
    ringAudio.loop = true;
    ringAudio.play().catch(() => {});
    audioRef.current = ringAudio;

    return () => {
      ringAudio.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAnswerCall = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCallState("connected");
    setAssistantText(openingText);
    setIsSpeaking(true);

    // Clear active call on server
    try {
      fetch("/api/telephony/active-call", { method: "DELETE" }).catch(() => {});
    } catch (e) {}

    // Start timer
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Speak Opening with Murf TTS / WebSpeech
    speakTTS(openingText, () => {
      setIsSpeaking(false);
      startSpeechRecognition();
    });
  };

  const speakTTS = async (text: string, onEnd?: () => void) => {
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId: /[\u0900-\u097F]/.test(text) ? "hi-IN-shweta" : "en-IN-priya",
          language: /[\u0900-\u097F]/.test(text) ? "hi" : "en",
        }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.onended = () => {
          setIsSpeaking(false);
          if (onEnd) onEnd();
        };
        audio.play();
        return;
      }
    } catch (e) {}

    // Fallback WebSpeech
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = /[\u0900-\u097F]/.test(text) ? "hi-IN" : "en-IN";
      utterance.rate = 1.05;
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    }
  };

  const startSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "hi-IN";

      rec.onstart = () => setIsListening(true);
      rec.onresult = (event: any) => {
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setUserTranscript(text);
      };

      rec.onend = async () => {
        setIsListening(false);
        if (userTranscript.trim()) {
          sendToAI(userTranscript);
        } else {
          setTimeout(() => {
            if (callState === "connected") {
              try { rec.start(); } catch (e) {}
            }
          }, 800);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.warn("SpeechRec error:", e);
    }
  };

  const sendToAI = async (promptText: string) => {
    setAssistantText("विचार कर रहा है (Processing)...");
    setIsSpeaking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          userId: "user_ramesh",
          callerName: patientName,
        }),
      });
      const data = await res.json();
      const reply = data.response || "जी, मैं आपकी बात समझ रहा हूँ।";
      setAssistantText(reply);
      setUserTranscript("");

      speakTTS(reply, () => {
        setIsSpeaking(false);
        startSpeechRecognition();
      });
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  const handleEndCall = () => {
    if (audioRef.current) audioRef.current.pause();
    if (timerRef.current) clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setCallState("ended");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 max-w-md mx-auto font-sans select-none relative overflow-hidden">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white">SwasthyaSathi AI</h1>
            <span className="text-[10px] text-teal-400 font-bold">#VoiceForBharat Direct Mobile Call</span>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl font-bold transition"
        >
          Home
        </Link>
      </div>

      {/* Main Calling Display */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 space-y-6 text-center z-10">
        
        {/* Caller Avatar */}
        <div className="relative flex items-center justify-center">
          {callState === "ringing" && (
            <div className="w-36 h-36 rounded-full bg-emerald-500/20 animate-ping absolute" />
          )}
          {isSpeaking && (
            <div className="w-36 h-36 rounded-full bg-teal-500/30 animate-pulse absolute" />
          )}
          <div className={`w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl transition duration-500 ${
            callState === "ringing" ? "bg-gradient-to-tr from-emerald-600 to-teal-500 ring-4 ring-emerald-400/50 animate-bounce" :
            callState === "connected" ? "bg-gradient-to-tr from-teal-600 to-slate-800 ring-2 ring-teal-400/40" :
            "bg-slate-800 opacity-60"
          }`}>
            {callState === "connected" ? (
              <Sparkles className="w-12 h-12 text-teal-300" />
            ) : (
              <PhoneCall className="w-12 h-12 text-white" />
            )}
          </div>
        </div>

        {/* Patient / Target Caller Info */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
            {callState === "ringing" ? "📞 Incoming Health Call..." :
             callState === "connected" ? `🟢 In Call • ${formatTime(callDuration)}` :
             "Call Ended"}
          </span>

          <h2 className="text-2xl font-extrabold text-white">
            {patientName}
          </h2>

          <p className="text-xs text-slate-400 font-mono">
            {maskedPhone} • Shivpur PHC Outbound
          </p>
        </div>

        {/* Assistant Spoken / Transcript Box */}
        {callState === "connected" && (
          <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-teal-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                SwasthyaSathi Voice:
              </span>
              <span className="text-slate-500">{isSpeaking ? "Speaking..." : isListening ? "Listening to you..." : "Ready"}</span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {assistantText || "Connecting audio..."}
            </p>

            {userTranscript && (
              <div className="pt-2 border-t border-slate-800 text-xs text-teal-300 font-medium">
                <span className="text-[10px] text-slate-500 block">Your Speech:</span>
                "{userTranscript}"
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="w-full space-y-3 pt-4">
          {callState === "ringing" && (
            <div className="space-y-3">
              <button
                onClick={handleAnswerCall}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 text-white font-extrabold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-emerald-600/40 active:scale-95 transition"
              >
                <Phone className="w-6 h-6 animate-bounce" />
                <span>कॉल उठाएं (Answer Call)</span>
              </button>
            </div>
          )}

          {callState === "connected" && (
            <button
              onClick={handleEndCall}
              className="w-full p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition"
            >
              <PhoneOff className="w-5 h-5" />
              <span>कॉल समाप्त करें (End Call)</span>
            </button>
          )}

          {callState === "ended" && (
            <button
              onClick={() => {
                setCallState("ringing");
                setCallDuration(0);
                if (audioRef.current) audioRef.current.play().catch(() => {});
              }}
              className="w-full p-3.5 rounded-2xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>दोबारा कॉल लगाएं (Call Again)</span>
            </button>
          )}
        </div>

      </div>

      {/* Footer */}
      <footer className="text-center text-[10.5px] text-slate-500 border-t border-slate-900 pt-3 z-10">
        Murf Falcon 2 Fast Voice • Real-Time Mobile Sync
      </footer>

    </div>
  );
}

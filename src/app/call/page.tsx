"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneCall, PhoneOff, Mic, Volume2, Sparkles, Activity, ShieldCheck, Clock } from "lucide-react";

export default function DirectMobileCallPage() {
  const [callState, setCallState] = useState<"ringing" | "connected" | "ended">("ringing");
  const [assistantText, setAssistantText] = useState<string>("Ringing +91 7991912530...");
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const openingEnglishText = "Namaste! This is SwasthyaSathi AI calling regarding your health follow-up. If you do not wish to speak, you can say 'Stop calls'. Has your fever subsided today?";

  // Auto-ring on load
  useEffect(() => {
    // Play ringtone or prepare call
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
    setAssistantText(openingEnglishText);
    setIsSpeaking(true);

    // Start timer
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Speak Opening with WebSpeech / Murf
    speakTTS(openingEnglishText, () => {
      setIsSpeaking(false);
      startSpeechRecognition();
    });
  };

  const speakTTS = (text: string, onEnd?: () => void) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      utterance.rate = 0.95;
      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
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
      rec.lang = "en-IN";

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
          // Restart listening
          setTimeout(() => {
            if (callState === "connected") {
              try { rec.start(); } catch (e) {}
            }
          }, 1000);
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (e) {
      console.warn("SpeechRec error:", e);
    }
  };

  const sendToAI = async (userText: string) => {
    setIsListening(false);
    setUserTranscript("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText,
          userId: "user_ramesh",
          callerName: "Ramesh Kumar",
          language: "en"
        }),
      });

      const data = await res.json();
      const reply = data.response || "For fever, rest well and drink plenty of fluids.";
      setAssistantText(reply);

      speakTTS(reply, () => {
        startSpeechRecognition();
      });
    } catch (e) {
      const fallback = "Please rest, drink warm water, and consult a doctor if fever rises.";
      setAssistantText(fallback);
      speakTTS(fallback, () => startSpeechRecognition());
    }
  };

  const handleEndCall = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState("ended");
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 max-w-md mx-auto relative overflow-hidden font-sans select-none">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100">SwasthyaSathi AI</h1>
            <span className="text-[10px] text-teal-400 font-medium">Health Access Voice Assistant</span>
          </div>
        </div>

        {callState === "connected" && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(callDuration)}</span>
          </div>
        )}
      </div>

      {/* Main Calling Display Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-8 text-center space-y-6">
        
        {/* Caller Avatar / Ringing Wave */}
        <div className="relative flex items-center justify-center">
          {callState === "ringing" && (
            <div className="w-36 h-36 rounded-full bg-teal-500/20 animate-ping absolute" />
          )}
          <div className={`w-28 h-28 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all ${
            callState === "ringing" ? "bg-teal-900 border-teal-400 animate-bounce" :
            isSpeaking ? "bg-emerald-950 border-emerald-400 scale-105" :
            isListening ? "bg-rose-950 border-rose-400 scale-105 animate-pulse" :
            "bg-slate-900 border-slate-700"
          }`}>
            <PhoneCall className={`w-12 h-12 ${
              callState === "ringing" ? "text-teal-300" :
              isSpeaking ? "text-emerald-400" :
              isListening ? "text-rose-400" : "text-slate-400"
            }`} />
          </div>
        </div>

        {/* Patient and Caller Information */}
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span>{callState === "ended" ? "Call Ended" : "+91 79919 •••••"}</span>
            {callState !== "ended" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-900/80 border border-teal-500/40 text-teal-300 font-sans font-bold">
                Protected
              </span>
            )}
          </h2>
          <p className="text-xs text-teal-300 font-medium">
            {callState === "ringing" ? "Incoming Healthcare Call..." : "Ramesh Kumar • Post-Triage Follow-up"}
          </p>
        </div>

        {/* Live Conversation Transcript Display */}
        {callState === "connected" && (
          <div className="w-full p-4 rounded-3xl bg-slate-900/90 border border-slate-800 text-left space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                isSpeaking ? "bg-emerald-400 animate-ping" :
                isListening ? "bg-rose-500 animate-pulse" : "bg-teal-400"
              }`} />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isSpeaking ? "AI Speaking (Murf English Voice)..." :
                 isListening ? "Listening to your voice..." : "Live Voice Stream"}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-200 leading-relaxed">
              &ldquo;{assistantText}&rdquo;
            </p>

            {userTranscript && (
              <div className="p-2.5 rounded-xl bg-teal-950/60 border border-teal-500/30 text-teal-200 text-xs italic">
                You: &ldquo;{userTranscript}&rdquo;
              </div>
            )}
          </div>
        )}

      </div>

      {/* Action Buttons: Answer, Decline, Hangup */}
      <div className="pb-6">
        {callState === "ringing" && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleEndCall}
              className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-sm flex flex-col items-center gap-1 shadow-lg shadow-rose-600/40"
            >
              <PhoneOff className="w-6 h-6" />
              <span>Decline</span>
            </button>

            <button
              onClick={handleAnswerCall}
              className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-sm flex flex-col items-center gap-1 shadow-lg shadow-emerald-600/40 animate-pulse"
            >
              <Phone className="w-6 h-6" />
              <span>Answer Call</span>
            </button>
          </div>
        )}

        {callState === "connected" && (
          <div className="space-y-3">
            <button
              onClick={handleEndCall}
              className="w-full p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/40"
            >
              <PhoneOff className="w-5 h-5" />
              <span>End Call</span>
            </button>
          </div>
        )}

        {callState === "ended" && (
          <button
            onClick={() => {
              setCallState("ringing");
              setCallDuration(0);
            }}
            className="w-full p-4 rounded-2xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-600/40"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call Again</span>
          </button>
        )}
      </div>

    </div>
  );
}

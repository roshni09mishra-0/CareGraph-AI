"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Phone, 
  PhoneOff, 
  PhoneCall, 
  Volume2, 
  ShieldCheck, 
  User, 
  Stethoscope, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  X, 
  Mic, 
  Square, 
  Loader2, 
  Send, 
  VolumeX, 
  Radio, 
  Activity, 
  Zap 
} from "lucide-react";
import { OutboundCallRecord } from "@/lib/telephony";
import { Message } from "./ChatBubbles";
import { AssistantState } from "./StatusOrb";

interface IncomingPhoneCallOverlayProps {
  call: OutboundCallRecord | null;
  isOpen: boolean;
  messages: Message[];
  assistantState: AssistantState;
  isRecording: boolean;
  recordingSeconds: number;
  isTranscribing: boolean;
  interimText?: string;
  isHandsFreeLive?: boolean;
  onToggleHandsFree?: () => void;
  onToggleRecord: () => void;
  onSendMessage: (text: string) => void;
  onAnswer: (call: OutboundCallRecord) => void;
  onDecline: (call: OutboundCallRecord, reason: "busy" | "no_answer" | "declined") => void;
  onOptOut: (patientId: string) => void;
  onClose: () => void;
  language?: "hi" | "en" | "hinglish";
}

export default function IncomingPhoneCallOverlay({
  call,
  isOpen,
  messages,
  assistantState,
  isRecording,
  recordingSeconds,
  isTranscribing,
  interimText = "",
  isHandsFreeLive = true,
  onToggleHandsFree,
  onToggleRecord,
  onSendMessage,
  onAnswer,
  onDecline,
  onOptOut,
  onClose,
  language = "hi",
}: IncomingPhoneCallOverlayProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [inCallInput, setInCallInput] = useState("");
  const durationTimerRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const isHindi = language === "hi" || language === "hinglish";

  useEffect(() => {
    if (isOpen && call?.status === "answered") {
      setIsCallActive(true);
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setIsCallActive(false);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [isOpen, call?.status]);

  // Auto-scroll chat inside active call
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isCallActive]);

  if (!isOpen || !call) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getScenarioLabel = (s: string) => {
    switch (s) {
      case "post_triage_followup":
        return isHindi ? "🏥 पोस्ट-ट्राइएज बुखार फॉलो-अप" : "🏥 Post-Triage Fever Follow-up";
      case "vaccination_reminder":
        return isHindi ? "💉 बाल टीकाकरण रिमाइंडर" : "💉 Child Immunization Reminder";
      case "chronic_care_checkin":
        return isHindi ? "🩺 बीपी व शुगर फॉलो-अप" : "🩺 Chronic Care Monitoring";
      default:
        return isHindi ? "स्वास्थ्य परामर्श कॉल" : "Healthcare Consultation";
    }
  };

  const inCallQuickReplies = [
    { text: "हाँ, आज बुखार कम हुआ है और आराम महसूस हो रहा है।", label: "✅ बुखार कम हुआ" },
    { text: "नहीं, अभी भी 102 बुखार और तेज सिरदर्द है।", label: "🤒 बुखार अभी भी है" },
    { text: "शिवपुर PHC अस्पताल का समय क्या है?", label: "🏥 PHC का समय" },
    { text: "Call band karo, mujhe aage call mat karna", label: "🚫 कॉल बंद करो" },
  ];

  const handleInCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inCallInput.trim()) {
      onSendMessage(inCallInput);
      setInCallInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      
      {/* Mobile Smartphone Frame Simulation */}
      <div className="w-full max-w-md rounded-[2.5rem] bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950 border-4 border-slate-700 shadow-2xl p-5 sm:p-6 text-white flex flex-col justify-between h-[650px] max-h-[94vh] relative overflow-hidden">
        
        {/* Top Speaker Grill & Camera Punch-hole */}
        <div className="flex items-center justify-center gap-2 mb-2 shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition z-10"
          title="Close softphone"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: Caller Information */}
        <div className="flex flex-col items-center text-center space-y-1.5 pt-1 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/20 relative">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-teal-400 animate-pulse" />
              </div>
              {!isCallActive && (
                <span className="absolute inset-0 rounded-full border-2 border-teal-400 animate-ping pointer-events-none" />
              )}
            </div>

            <div className="text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                  SwasthyaSathi AI
                </h2>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                  {isCallActive ? "Live Voice Stream" : "Incoming Call"}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400">
                {call.phone_number || "+91 1800-SWASTHYA"} • {call.patient_name}
              </p>
            </div>
          </div>

          {/* Active Call Status & Timer Bar */}
          <div className="flex items-center gap-2 pt-1">
            <div className="px-2.5 py-0.5 rounded-full bg-teal-900/60 border border-teal-500/40 text-[10.5px] font-bold text-teal-200 shadow-sm">
              {getScenarioLabel(call.scenario)}
            </div>

            {isCallActive && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-[10.5px] font-mono font-bold text-emerald-400 border border-emerald-500/30">
                <Clock className="w-3 h-3" />
                <span>{formatTimer(callDuration)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Body: Incoming Call Ringing vs Active Live Conversation Screen */}
        {!isCallActive ? (
          <div className="flex-1 flex flex-col justify-center items-center my-4 space-y-4">
            
            {/* Animated Ringing Visualizer */}
            <div className="w-24 h-24 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center relative">
              <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center animate-ping" />
              <PhoneCall className="w-10 h-10 text-teal-400 absolute animate-bounce" />
            </div>

            <div className="text-center space-y-1">
              <span className="text-xs font-bold tracking-widest text-teal-400 uppercase">
                {isHindi ? "📞 फोन बज रहा है... कृपया उठाएं" : "📞 PHONE RINGING... PLEASE ANSWER"}
              </span>
              <p className="text-xs text-slate-300 max-w-xs">
                {isHindi ? "स्वास्थ्य साथी आपकी तबियत जानने के लिए कॉल कर रहा है।" : "SwasthyaSathi is calling to check on your recovery."}
              </p>
            </div>

            {/* 3-Part Opening Protocol Preview Card */}
            <div className="w-full p-3.5 rounded-2xl bg-slate-800/80 border border-teal-500/30 text-left text-xs space-y-1.5 shadow-inner">
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-teal-400 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>{isHindi ? "डे 6 अनिवार्य 3-भाग ओपनिंग प्रोटोकॉल:" : "Day 6 Mandatory 3-Part Opening:"}</span>
              </div>
              <p className="text-[11.5px] text-slate-200 leading-relaxed italic">
                &ldquo;{call.opening_text}&rdquo;
              </p>
            </div>

            {/* Linphone Direct App Launcher */}
            <div className="w-full flex items-center justify-center gap-2 pt-1">
              <a
                href="linphone-call:sip:roshu@sip.linphone.org"
                className="px-3 py-1.5 rounded-xl bg-teal-800/90 hover:bg-teal-700 text-teal-100 text-[11px] font-bold border border-teal-500/40 flex items-center gap-1.5 transition shadow-sm"
              >
                <span>📱 Linphone App में खोलें (Ring App)</span>
              </a>
            </div>

          </div>
        ) : (
          /* Live In-Call Conversation Screen (Talk to Agent) */
          <div className="flex-1 flex flex-col justify-between my-2 overflow-hidden space-y-2">
            
            {/* Real-time Assistant State Indicator & Hands-Free Status */}
            <div className="p-2 rounded-xl bg-slate-800/90 border border-teal-500/30 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  assistantState === "speaking" ? "bg-emerald-400 animate-ping" :
                  assistantState === "listening" || isRecording ? "bg-rose-500 animate-pulse" :
                  assistantState === "processing" || isTranscribing ? "bg-amber-400 animate-spin" :
                  "bg-emerald-400"
                }`} />
                <span className="font-bold text-slate-200 text-[11px]">
                  {assistantState === "speaking" ? "🔊 AI बोल रहा है (Murf Voice)..." :
                   interimText ? `⚡ आप बोल रहे हैं: "${interimText}"` :
                   isRecording ? `🔴 रिकॉर्डिंग चालू है (${recordingSeconds}s)...` :
                   "🟢 लाइव बातचीत चालू (आप बस बोलिए, AI सुन रहा है)"}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10.5px] text-emerald-400 font-bold">
                <Zap className="w-3 h-3 text-amber-300 animate-pulse" />
                <span>Auto-VAD</span>
              </div>
            </div>

            {/* In-Call Live Chat / Speech Transcript Scroll */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5 text-xs shadow-inner max-h-[220px]"
            >
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 py-6">
                  <p>{isHindi ? "बातचीत शुरू हो रही है..." : "Call connected..."}</p>
                </div>
              ) : (
                messages.slice(-4).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`p-2.5 rounded-2xl max-w-[88%] leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-teal-600 text-white rounded-br-none"
                          : "bg-slate-800 text-slate-100 border border-teal-500/20 rounded-bl-none"
                      }`}
                    >
                      <span className="text-[10px] opacity-75 font-bold block mb-0.5">
                        {msg.sender === "user" ? (isHindi ? "आप (मरीज)" : "You") : "SwasthyaSathi AI"}
                      </span>
                      <p className="text-[11.5px]">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* In-Call 1-Tap Quick Responses */}
            <div className="space-y-1 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isHindi ? "⚡ कॉल पर 1-क्लिक उत्तर (Quick Replies):" : "⚡ In-Call Quick Replies:"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {inCallQuickReplies.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSendMessage(r.text)}
                    className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 active:scale-95 border border-teal-500/30 text-[10.5px] text-teal-200 font-bold transition shadow-sm"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* In-Call Text Input Form */}
            <form onSubmit={handleInCallSubmit} className="flex items-center gap-1.5 pt-1 shrink-0">
              <input
                type="text"
                value={inCallInput}
                onChange={(e) => setInCallInput(e.target.value)}
                placeholder={interimText ? `सुन रहा है: "${interimText}"` : (isHindi ? "सीधे बोलें या टाइप करें..." : "Speak or type response on call...")}
                className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
              />
              <button
                type="submit"
                disabled={!inCallInput.trim()}
                className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white transition font-bold"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>
        )}

        {/* Bottom Call Action Controls */}
        {!isCallActive ? (
          <div className="grid grid-cols-2 gap-3 pt-2 shrink-0">
            {/* Decline Button */}
            <button
              onClick={() => onDecline(call, "declined")}
              className="flex flex-col items-center justify-center gap-1 p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition"
            >
              <PhoneOff className="w-5 h-5" />
              <span>{isHindi ? "काटें (Decline)" : "Decline"}</span>
            </button>

            {/* Answer Button */}
            <button
              onClick={() => onAnswer(call)}
              className="flex flex-col items-center justify-center gap-1 p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition animate-bounce"
            >
              <PhoneCall className="w-5 h-5" />
              <span>{isHindi ? "उठाएं (Answer & Live Talk)" : "Answer"}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1 shrink-0">
            
            {/* Live Continuous Voice Indicator & Manual Push-to-Talk alternative */}
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-teal-900/80 to-emerald-900/80 border border-teal-500/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-extrabold text-emerald-300 text-[11.5px]">
                  {isHindi ? "🟢 लाइव हैंड्स-फ्री: आप बस बोलिए..." : "🟢 Live Hands-Free: Just speak naturally..."}
                </span>
              </div>

              {/* Push-to-Talk Toggle Alternative */}
              <button
                onClick={onToggleRecord}
                className="px-2.5 py-1 rounded-lg bg-teal-800 hover:bg-teal-700 text-teal-100 font-bold text-[10.5px] border border-teal-600 transition"
              >
                {isRecording ? "⏹️ भेजें" : "🎙️ Mic"}
              </button>
            </div>

            {/* Secondary Controls: Hangup & Opt-out */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onDecline(call, "declined")}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11.5px] shadow-md transition active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{isHindi ? "काटें (Hang Up)" : "Hang Up"}</span>
              </button>

              <button
                onClick={() => onOptOut(call.patient_id)}
                className="flex items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[10.5px] border border-slate-700 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>{isHindi ? "कॉल बंद करो (Opt-Out)" : "Opt-Out"}</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

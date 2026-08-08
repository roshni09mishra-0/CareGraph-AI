"use client";

import { Mic, Volume2, Loader2, Radio, AlertCircle, PhoneOff, PhoneCall, Sparkles, User, Activity } from "lucide-react";

export type AssistantState = "ready" | "connecting" | "listening" | "speaking" | "call_ended" | "error";

interface StatusOrbProps {
  state: AssistantState;
  errorMessage?: string;
  onOrbClick?: () => void;
  language?: "en" | "hi" | "hinglish";
}

export default function StatusOrb({ state, errorMessage, onOrbClick, language = "en" }: StatusOrbProps) {
  
  // State Labels & Subtexts by Language
  const getStateInfo = () => {
    switch (state) {
      case "ready":
        return {
          label: language === "hi" ? "तैयार — कॉल शुरू करें" : language === "hinglish" ? "READY — START HEALTH CALL" : "READY — START CALL",
          subtext: language === "hi" ? "परामर्श शुरू करने के लिए बटन या ऑर्ब पर क्लिक करें" : "Click 'Start Consultation' or tap the orb to begin your session",
          speaker: language === "hi" ? "कॉल शुरू करने के लिए तैयार" : "Ready to begin consultation",
          color: "border-teal-500/40 bg-teal-500/10 text-teal-300",
          icon: <PhoneCall className="w-4 h-4 text-teal-400" />,
          orbStyle: "bg-gradient-to-tr from-teal-700 via-teal-500 to-emerald-400 shadow-teal-500/30 hover:scale-105",
        };
      case "connecting":
        return {
          label: language === "hi" ? "कनेक्ट हो रहा है — कृपया प्रतीक्षा करें..." : language === "hinglish" ? "CONNECTING — PLEASE WAIT..." : "CONNECTING TO SWASTHYASATHI AI...",
          subtext: language === "hi" ? "WebRTC और Murf AI वॉइस रूम तैयार हो रहा है" : "Joining secure WebRTC session & loading Murf Falcon voice...",
          speaker: "Joining call room...",
          color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
          icon: <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />,
          orbStyle: "animate-orb-think bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 shadow-cyan-500/30",
        };
      case "listening":
        return {
          label: language === "hi" ? "आपकी बात सुन रहे हैं (बोलिए)..." : language === "hinglish" ? "LISTENING TO YOU (BOLIYE)..." : "LISTENING TO YOU... (SPEAK NOW)",
          subtext: language === "hi" ? "आप बोल रहे हैं — माइक्रोफोन सक्रिय है" : "You are speaking — Voice recognition is active",
          speaker: language === "hi" ? "👤 आप बोल रहे हैं" : "👤 You are speaking",
          color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
          icon: <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />,
          orbStyle: "animate-orb-listen bg-gradient-to-tr from-teal-500 via-emerald-400 to-cyan-400 shadow-emerald-500/40",
        };
      case "speaking":
        return {
          label: language === "hi" ? "स्वास्थ्य साथी बोल रहे हैं..." : language === "hinglish" ? "SWASTHYASATHI IS SPEAKING..." : "SWASTHYASATHI AI IS SPEAKING...",
          subtext: language === "hi" ? "Murf Falcon भारतीय आवाज में उत्तर" : "Murf Falcon Indian English voice playback in real time",
          speaker: language === "hi" ? "🩺 स्वास्थ्य साथी बोल रहे हैं" : "🩺 SwasthyaSathi AI is speaking",
          color: "border-teal-400/40 bg-teal-400/10 text-teal-200",
          icon: <Volume2 className="w-4 h-4 text-teal-300 animate-bounce" />,
          orbStyle: "animate-orb-speak bg-gradient-to-tr from-emerald-500 via-teal-400 to-green-300 shadow-teal-400/40",
        };
      case "call_ended":
        return {
          label: language === "hi" ? "कॉल समाप्त — फिर से शुरू करें" : language === "hinglish" ? "CALL ENDED — START AGAIN" : "CALL ENDED — START AGAIN",
          subtext: language === "hi" ? "परामर्श पूरा हुआ। नया कॉल शुरू करने के लिए नीचे क्लिक करें।" : "Consultation finished. Click below to start a new consultation.",
          speaker: "Call ended",
          color: "border-slate-700 bg-slate-800/80 text-slate-300",
          icon: <PhoneOff className="w-4 h-4 text-slate-400" />,
          orbStyle: "bg-gradient-to-tr from-slate-800 via-slate-700 to-teal-900 shadow-slate-900/50 hover:scale-105",
        };
      case "error":
      default:
        return {
          label: language === "hi" ? "माइक्रोफोन त्रुटि" : "MICROPHONE / CONNECTION ERROR",
          subtext: errorMessage || "Click to retry voice session or check mic permission",
          speaker: "Error state",
          color: "border-rose-500/40 bg-rose-500/10 text-rose-300",
          icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
          orbStyle: "bg-gradient-to-tr from-rose-600 to-orange-500 shadow-rose-900/50 shadow-2xl",
        };
    }
  };

  const current = getStateInfo();

  return (
    <div className="flex flex-col items-center justify-center space-y-5 py-3">
      
      {/* Top 5-State Status Badge */}
      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider border shadow-sm transition-all duration-300 ${current.color}`}>
        {current.icon}
        <span>{current.label}</span>
      </div>

      {/* Active Speaker Indicator & Waveform */}
      {(state === "listening" || state === "speaking") && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-medium text-slate-200 animate-fadeIn">
          <span>{current.speaker}</span>
          
          {/* Animated Waveform Bars */}
          <div className="flex items-end gap-1 h-3.5 px-1">
            <div className={`w-1 rounded-full ${state === "speaking" ? "bg-teal-400 animate-pulse h-3" : "bg-emerald-400 animate-bounce h-2"}`} />
            <div className={`w-1 rounded-full ${state === "speaking" ? "bg-teal-300 animate-pulse h-3.5" : "bg-emerald-300 animate-bounce h-3"}`} />
            <div className={`w-1 rounded-full ${state === "speaking" ? "bg-cyan-400 animate-pulse h-2.5" : "bg-cyan-300 animate-bounce h-3.5"}`} />
            <div className={`w-1 rounded-full ${state === "speaking" ? "bg-emerald-400 animate-pulse h-3" : "bg-emerald-400 animate-bounce h-2"}`} />
          </div>
        </div>
      )}

      {/* Main Interactive Animated Orb */}
      <div className="relative flex items-center justify-center cursor-pointer select-none" onClick={onOrbClick}>
        
        {/* Outer Ripple Wave Rings when Listening */}
        {state === "listening" && (
          <>
            <span className="absolute w-44 h-44 rounded-full bg-teal-400/20 animate-ping opacity-60 pointer-events-none" />
            <span className="absolute w-56 h-56 rounded-full border border-teal-500/30 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Outer Glow Halo when Speaking */}
        {state === "speaking" && (
          <span className="absolute w-48 h-48 rounded-full bg-emerald-400/20 blur-xl animate-pulse pointer-events-none" />
        )}

        {/* Glowing Central Orb */}
        <div className={`relative w-36 h-36 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center ${current.orbStyle}`}>
          
          {/* Inner Gloss Overlay */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

          {/* Center Icon / Dynamic Equalizer */}
          <div className="relative z-10 text-slate-950 flex items-center justify-center">
            {state === "ready" && <PhoneCall className="w-12 h-12 stroke-[2.2] text-slate-950 animate-pulse" />}
            {state === "connecting" && <Loader2 className="w-12 h-12 stroke-[2.2] animate-spin text-slate-950" />}
            {state === "listening" && <Mic className="w-12 h-12 stroke-[2.2] animate-pulse text-slate-950" />}
            {state === "speaking" && (
              <div className="flex items-end gap-1.5 h-10 px-2">
                <div className="w-1.5 bg-slate-950 rounded-full eq-bar" />
                <div className="w-1.5 bg-slate-950 rounded-full eq-bar" />
                <div className="w-1.5 bg-slate-950 rounded-full eq-bar" />
                <div className="w-1.5 bg-slate-950 rounded-full eq-bar" />
                <div className="w-1.5 bg-slate-950 rounded-full eq-bar" />
              </div>
            )}
            {state === "call_ended" && <PhoneOff className="w-12 h-12 stroke-[2.2] text-teal-200" />}
            {state === "error" && <AlertCircle className="w-12 h-12 stroke-[2.2] text-white" />}
          </div>
        </div>

      </div>

      {/* Subtext Guide */}
      <p className="text-xs text-slate-400 text-center font-medium max-w-sm">
        {current.subtext}
      </p>

    </div>
  );
}

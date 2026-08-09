"use client";

import { Mic, Volume2, Loader2, Radio, AlertCircle, PhoneOff, PhoneCall, Sparkles, User, Activity } from "lucide-react";

export type AssistantState = "ready" | "connecting" | "listening" | "processing" | "speaking" | "call_ended" | "error";

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
          label: language === "hi" ? "तैयार — परामर्श शुरू करें" : "READY — START CONSULTATION",
          subtext: language === "hi" ? "शुरू करने के लिए नीचे दिए गए बटन पर क्लिक करें" : "Click 'Start Health Consultation' or tap the microphone to begin",
          speaker: language === "hi" ? "परामर्श के लिए तैयार" : "Ready to listen",
          color: "border-teal-300 bg-teal-50 text-teal-900 font-bold",
          icon: <PhoneCall className="w-4 h-4 text-teal-700" />,
          orbStyle: "bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-500 shadow-teal-600/30 hover:scale-105",
        };
      case "connecting":
        return {
          label: language === "hi" ? "कनेक्ट हो रहा है — कृपया प्रतीक्षा करें..." : "CONNECTING TO SWASTHYASATHI AI...",
          subtext: language === "hi" ? "WebRTC और Murf AI वॉइस रूम तैयार हो रहा है" : "Initializing WebRTC audio room & Murf Falcon voice...",
          speaker: "Connecting audio room...",
          color: "border-cyan-300 bg-cyan-50 text-cyan-900 font-bold",
          icon: <Loader2 className="w-4 h-4 text-cyan-700 animate-spin" />,
          orbStyle: "animate-orb-think bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-500 shadow-cyan-600/30",
        };
      case "listening":
        return {
          label: language === "hi" ? "आपकी बात सुन रहे हैं (बोलिए)..." : "LISTENING TO YOUR VOICE... (SPEAK NOW)",
          subtext: language === "hi" ? "माइक्रोफोन सक्रिय है — कृपया स्पष्ट बोलें" : "Microphone active — Speak your health concern clearly",
          speaker: language === "hi" ? "👤 आप बोल रहे हैं" : "👤 You are speaking",
          color: "border-emerald-400 bg-emerald-50 text-emerald-950 font-extrabold animate-pulse",
          icon: <Mic className="w-4 h-4 text-emerald-700 animate-pulse" />,
          orbStyle: "animate-orb-listen bg-gradient-to-tr from-teal-600 via-emerald-500 to-green-400 shadow-emerald-600/40",
        };
      case "processing":
        return {
          label: language === "hi" ? "स्वास्थ्य प्रश्न का विश्लेषण हो रहा है..." : "PROCESSING HEALTHCARE RESPONSE...",
          subtext: language === "hi" ? "सुरक्षा नियमों के साथ उत्तर तैयार किया जा रहा है" : "Analyzing speech with medical safety guardrails...",
          speaker: language === "hi" ? "🤖 स्वास्थ्य साथी सोच रहे हैं" : "🤖 SwasthyaSathi is processing...",
          color: "border-amber-300 bg-amber-50 text-amber-900 font-bold",
          icon: <Loader2 className="w-4 h-4 text-amber-700 animate-spin" />,
          orbStyle: "animate-orb-think bg-gradient-to-tr from-amber-600 via-teal-500 to-cyan-600 shadow-amber-600/30",
        };
      case "speaking":
        return {
          label: language === "hi" ? "स्वास्थ्य साथी बोल रहे हैं..." : "SWASTHYASATHI AI IS SPEAKING...",
          subtext: language === "hi" ? "Murf Falcon भारतीय आवाज में उत्तर" : "Murf Falcon Indian voice playback in real time",
          speaker: language === "hi" ? "🩺 स्वास्थ्य साथी बोल रहे हैं" : "🩺 SwasthyaSathi AI is speaking",
          color: "border-teal-300 bg-teal-50 text-teal-950 font-extrabold",
          icon: <Volume2 className="w-4 h-4 text-teal-700 animate-bounce" />,
          orbStyle: "animate-orb-speak bg-gradient-to-tr from-emerald-600 via-teal-500 to-green-400 shadow-teal-600/40",
        };
      case "call_ended":
        return {
          label: language === "hi" ? "परामर्श समाप्त — फिर से शुरू करें" : "CALL ENDED — START AGAIN",
          subtext: language === "hi" ? "परामर्श पूरा हुआ। नया कॉल शुरू करने के लिए नीचे क्लिक करें।" : "Consultation finished. Click below to start a new consultation.",
          speaker: "Call concluded",
          color: "border-slate-300 bg-slate-100 text-slate-700 font-bold",
          icon: <PhoneOff className="w-4 h-4 text-slate-500" />,
          orbStyle: "bg-gradient-to-tr from-slate-600 via-slate-500 to-teal-700 shadow-slate-600/30 hover:scale-105",
        };
      case "error":
      default:
        return {
          label: language === "hi" ? "माइक्रोफोन त्रुटि" : "MICROPHONE / CONNECTION ERROR",
          subtext: errorMessage || "Click to retry voice session or check mic permission",
          speaker: "Error state",
          color: "border-rose-300 bg-rose-50 text-rose-900 font-bold",
          icon: <AlertCircle className="w-4 h-4 text-rose-700" />,
          orbStyle: "bg-gradient-to-tr from-rose-600 to-orange-500 shadow-rose-600/40 shadow-2xl",
        };
    }
  };

  const current = getStateInfo();

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-2">
      
      {/* Top 5-State Status Badge */}
      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-wider border shadow-sm transition-all duration-300 ${current.color}`}>
        {current.icon}
        <span>{current.label}</span>
      </div>

      {/* Active Speaker Indicator & Waveform */}
      {(state === "listening" || state === "speaking") && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white border border-teal-200 text-xs font-bold text-slate-800 shadow-sm animate-fadeIn">
          <span>{current.speaker}</span>
          
          {/* Animated Waveform Bars */}
          <div className="flex items-end gap-1 h-3.5 px-1">
            <div className={`w-1 rounded-full ${state === "speaking" ? "bg-teal-600 animate-pulse h-3" : "bg-emerald-600 animate-bounce h-2"}`} />
            <div className={`w-1 rounded-full ${state === "speaking" ? "bg-teal-500 animate-pulse h-3.5" : "bg-emerald-500 animate-bounce h-3"}`} />
            <div className={`w-1 rounded-full ${state === "speaking" ? "bg-cyan-600 animate-pulse h-2.5" : "bg-cyan-500 animate-bounce h-3.5"}`} />
            <div className={`w-1 rounded-full ${state === "speaking" ? "bg-emerald-600 animate-pulse h-3" : "bg-emerald-600 animate-bounce h-2"}`} />
          </div>
        </div>
      )}

      {/* Main Interactive Animated Orb */}
      <div className="relative flex items-center justify-center cursor-pointer select-none" onClick={onOrbClick}>
        
        {/* Outer Ripple Wave Rings when Listening */}
        {state === "listening" && (
          <>
            <span className="absolute w-44 h-44 rounded-full bg-emerald-500/20 animate-ping opacity-60 pointer-events-none" />
            <span className="absolute w-56 h-56 rounded-full border-2 border-emerald-500/30 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Outer Glow Halo when Speaking */}
        {state === "speaking" && (
          <span className="absolute w-48 h-48 rounded-full bg-teal-500/20 blur-xl animate-pulse pointer-events-none" />
        )}

        {/* Glowing Central Orb */}
        <div className={`relative w-36 h-36 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center ${current.orbStyle}`}>
          
          {/* Inner Gloss Overlay */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />

          {/* Center Icon / Dynamic Equalizer */}
          <div className="relative z-10 text-white flex items-center justify-center">
            {state === "ready" && <PhoneCall className="w-12 h-12 stroke-[2.2] text-white animate-pulse" />}
            {state === "connecting" && <Loader2 className="w-12 h-12 stroke-[2.2] animate-spin text-white" />}
            {state === "listening" && <Mic className="w-12 h-12 stroke-[2.2] animate-pulse text-white" />}
            {state === "speaking" && (
              <div className="flex items-end gap-1.5 h-10 px-2">
                <div className="w-1.5 bg-white rounded-full eq-bar" />
                <div className="w-1.5 bg-white rounded-full eq-bar" />
                <div className="w-1.5 bg-white rounded-full eq-bar" />
                <div className="w-1.5 bg-white rounded-full eq-bar" />
                <div className="w-1.5 bg-white rounded-full eq-bar" />
              </div>
            )}
            {state === "call_ended" && <PhoneOff className="w-12 h-12 stroke-[2.2] text-teal-100" />}
            {state === "error" && <AlertCircle className="w-12 h-12 stroke-[2.2] text-white" />}
          </div>
        </div>

      </div>

      {/* Subtext Guide */}
      <p className="text-xs text-slate-600 text-center font-medium max-w-sm">
        {current.subtext}
      </p>

    </div>
  );
}

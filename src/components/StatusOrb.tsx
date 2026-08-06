"use client";

import { Mic, Volume2, Loader2, Radio, AlertCircle } from "lucide-react";

export type AssistantState = "idle" | "listening" | "thinking" | "speaking" | "error";

interface StatusOrbProps {
  state: AssistantState;
  errorMessage?: string;
  onOrbClick?: () => void;
}

export default function StatusOrb({ state, errorMessage, onOrbClick }: StatusOrbProps) {
  
  // Status Badge Configuration
  const getStateInfo = () => {
    switch (state) {
      case "listening":
        return {
          label: "LISTENING TO YOUR VOICE...",
          subtext: "Speak clearly into your microphone",
          color: "border-teal-500/40 bg-teal-500/10 text-teal-300",
          icon: <Mic className="w-4 h-4 text-teal-400 animate-pulse" />,
          orbStyle: "animate-orb-listen bg-gradient-to-tr from-teal-600 via-teal-400 to-cyan-400",
        };
      case "thinking":
        return {
          label: "THINKING & CONSULTING SWASTHYASATHI AI...",
          subtext: "Processing medical logic with OpenAI",
          color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
          icon: <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />,
          orbStyle: "animate-orb-think bg-gradient-to-tr from-cyan-500 via-purple-500 to-teal-400",
        };
      case "speaking":
        return {
          label: "SWASTHYASATHI SPEAKING (MURF FALCON TTS)...",
          subtext: "Indian English natural voice playback",
          color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
          icon: <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />,
          orbStyle: "animate-orb-speak bg-gradient-to-tr from-emerald-500 via-teal-400 to-green-300",
        };
      case "error":
        return {
          label: "CONNECTION ERROR",
          subtext: errorMessage || "Click to retry voice session",
          color: "border-rose-500/40 bg-rose-500/10 text-rose-300",
          icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
          orbStyle: "bg-gradient-to-tr from-rose-600 to-orange-500 shadow-rose-900/50 shadow-2xl",
        };
      case "idle":
      default:
        return {
          label: "IDLE - READY TO TALK",
          subtext: "Click orb or microphone button to start",
          color: "border-slate-700 bg-slate-800/60 text-slate-300",
          icon: <Radio className="w-4 h-4 text-slate-400" />,
          orbStyle: "bg-gradient-to-tr from-teal-800 via-teal-600 to-slate-800 shadow-teal-950/50 hover:scale-105",
        };
    }
  };

  const current = getStateInfo();

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-4">
      
      {/* Top Status Pill */}
      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider border shadow-sm transition-all duration-300 ${current.color}`}>
        {current.icon}
        <span>{current.label}</span>
      </div>

      {/* Main Interactive Animated Orb */}
      <div className="relative flex items-center justify-center cursor-pointer" onClick={onOrbClick}>
        
        {/* Outer Ripple Wave Rings when Listening */}
        {state === "listening" && (
          <>
            <span className="absolute w-44 h-44 rounded-full bg-teal-400/20 animate-ping opacity-60" />
            <span className="absolute w-56 h-56 rounded-full border border-teal-500/30 animate-pulse" />
          </>
        )}

        {/* Outer Glow Halo when Speaking */}
        {state === "speaking" && (
          <span className="absolute w-48 h-48 rounded-full bg-emerald-400/20 blur-xl animate-pulse" />
        )}

        {/* Glowing Central Orb */}
        <div className={`relative w-36 h-36 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center ${current.orbStyle}`}>
          
          {/* Inner Gloss Overlay */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

          {/* Center Icon / Equalizer */}
          <div className="relative z-10 text-slate-950 flex items-center justify-center">
            {state === "listening" && <Mic className="w-12 h-12 stroke-[2.2] animate-pulse text-slate-950" />}
            {state === "thinking" && <Loader2 className="w-12 h-12 stroke-[2.2] animate-spin text-slate-950" />}
            {state === "speaking" && (
              <div className="flex items-end gap-1.5 h-10 px-2">
                <div className="w-1.5 bg-slate-950 rounded-full eq-bar" />
                <div className="w-1.5 bg-slate-950 rounded-full eq-bar" />
                <div className="w-1.5 bg-slate-950 rounded-full eq-bar" />
                <div className="w-1.5 bg-slate-950 rounded-full eq-bar" />
                <div className="w-1.5 bg-slate-950 rounded-full eq-bar" />
              </div>
            )}
            {state === "error" && <AlertCircle className="w-12 h-12 stroke-[2.2] text-white" />}
            {state === "idle" && <Mic className="w-12 h-12 stroke-[2] text-teal-100 opacity-90" />}
          </div>
        </div>

      </div>

      {/* Subtext Guide */}
      <p className="text-xs text-slate-400 text-center font-medium">
        {current.subtext}
      </p>

    </div>
  );
}

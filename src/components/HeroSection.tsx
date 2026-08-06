"use client";

import { Mic, Sparkles, ShieldCheck, Zap, HeartPulse, Headphones } from "lucide-react";

interface HeroSectionProps {
  onStartTalking: () => void;
  isSessionActive: boolean;
}

export default function HeroSection({ onStartTalking, isSessionActive }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 lg:pt-14 lg:pb-16 text-center">
      {/* Background ambient radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[200px] bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-teal-950/70 text-teal-300 border border-teal-500/30 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span>Indian English AI Voice Healthcare Assistant</span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          <span className="text-slate-400 font-normal">Murf Falcon TTS Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Speak Your Health Query in <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
            Natural Voice with SwasthyaSathi
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
          Get instant, empathetic medical guidance and wellness advice. Connected via <strong className="text-teal-300">LiveKit WebRTC</strong>, powered by <strong className="text-teal-300">OpenAI</strong>, and spoken in human-grade <strong className="text-emerald-300">Murf Falcon Indian English voice</strong>.
        </p>

        {/* Start Talking CTA Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartTalking}
            className="relative group overflow-hidden flex items-center gap-3.5 px-8 py-4 rounded-2xl text-base font-bold text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 shadow-xl shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {/* Pulsing ring indicator */}
            <span className="absolute -inset-1 rounded-2xl bg-teal-400/50 blur-sm group-hover:opacity-100 opacity-75 transition duration-500 -z-10 animate-pulse" />

            <div className="w-9 h-9 rounded-xl bg-slate-950/10 flex items-center justify-center text-slate-950">
              <Mic className="w-5 h-5 stroke-[2.5]" />
            </div>

            <span className="tracking-wide">
              {isSessionActive ? "Return to Active Session" : "Start Talking Now"}
            </span>

            <Headphones className="w-5 h-5 opacity-80" />
          </button>
        </div>

        {/* Value Highlights Pill Grid */}
        <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          
          <div className="p-3.5 rounded-xl glass-panel border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">24/7 Voice Care</div>
              <div className="text-[11px] text-slate-400">Instant AI triage</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl glass-panel border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Murf Falcon Voice</div>
              <div className="text-[11px] text-slate-400">Indian English TTS</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl glass-panel border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">LiveKit WebRTC</div>
              <div className="text-[11px] text-slate-400">Real-time stream</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl glass-panel border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Private & Safe</div>
              <div className="text-[11px] text-slate-400">Encrypted audio</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

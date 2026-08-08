"use client";

import { Mic, Sparkles, ShieldCheck, Zap, HeartPulse, Headphones, PhoneCall } from "lucide-react";

interface HeroSectionProps {
  onStartTalking: () => void;
  isSessionActive: boolean;
}

export default function HeroSection({ onStartTalking, isSessionActive }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-6 pb-10 lg:pt-10 lg:pb-14 text-center">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-teal-500/15 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/4 left-1/3 w-[320px] h-[220px] bg-emerald-500/12 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 space-y-5">
        
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-teal-950/80 text-teal-300 border border-teal-500/40 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span>नमस्ते! भारत का अपना एआई स्वास्थ्य साथी</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-semibold">Murf Falcon 2 & LiveKit</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
          अपनी भाषा में स्वास्थ्य सलाह <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
            Empathetic Indian Voice Care
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
          Ask your health questions in <strong className="text-emerald-300">शुद्ध हिंदी (Pure Hindi)</strong>, <strong className="text-teal-300">Hinglish</strong>, or <strong className="text-cyan-300">Indian English</strong>. Powered by <strong className="text-white">Murf Falcon TTS</strong> (&lt;400ms ultra-low latency) and safe healthcare guardrails.
        </p>

        {/* Start Consultation CTA Button */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartTalking}
            className="relative group overflow-hidden flex items-center gap-3.5 px-9 py-4 rounded-2xl text-base font-extrabold text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 shadow-2xl shadow-teal-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {/* Pulsing ring indicator */}
            <span className="absolute -inset-1 rounded-2xl bg-teal-400/50 blur-sm group-hover:opacity-100 opacity-75 transition duration-500 -z-10 animate-pulse" />

            <div className="w-9 h-9 rounded-xl bg-slate-950/15 flex items-center justify-center text-slate-950">
              <PhoneCall className="w-5 h-5 stroke-[2.5]" />
            </div>

            <span className="tracking-wide">
              {isSessionActive ? "Return to Active Consultation" : "परामर्श शुरू करें (Start Call)"}
            </span>

            <Headphones className="w-5 h-5 opacity-90" />
          </button>
        </div>

        {/* Value Highlights Pill Grid */}
        <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          
          <div className="p-3.5 rounded-2xl glass-card border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-400">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">24/7 Voice Care</div>
              <div className="text-[11px] text-slate-400">Instant AI triage</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Murf Falcon Voice</div>
              <div className="text-[11px] text-slate-400">Pure Hindi & English</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">&lt;400ms Latency</div>
              <div className="text-[11px] text-slate-400">Real-time WebRTC</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Strict Guardrails</div>
              <div className="text-[11px] text-slate-400">No fake prescriptions</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

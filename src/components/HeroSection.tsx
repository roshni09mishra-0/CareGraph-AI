"use client";

import { Mic, Sparkles, ShieldCheck, Zap, HeartPulse, Headphones, PhoneCall, Stethoscope, Activity } from "lucide-react";

interface HeroSectionProps {
  onStartTalking: () => void;
  isSessionActive: boolean;
}

export default function HeroSection({ onStartTalking, isSessionActive }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-6 pb-8 lg:pt-8 lg:pb-12 text-center">
      <div className="max-w-4xl mx-auto px-4 space-y-4">
        
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
          <span>नमस्ते! भारत का अपना एआई स्वास्थ्य साथी</span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
          <span className="text-slate-600 font-semibold">Murf Falcon 2 & LiveKit</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
          अपनी भाषा में स्वास्थ्य सलाह <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-700 bg-clip-text text-transparent">
            Empathetic Indian Voice Care
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
          Ask your health questions in <strong className="text-teal-800">शुद्ध हिंदी (Pure Hindi)</strong>, <strong className="text-teal-700">Hinglish</strong>, or <strong className="text-slate-800">Indian English</strong>. Powered by <strong className="text-slate-900">Murf Falcon TTS</strong> (&lt;400ms ultra-low latency) and safe healthcare guardrails.
        </p>

        {/* Start Consultation CTA Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartTalking}
            className="relative group overflow-hidden flex items-center gap-3.5 px-9 py-3.5 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 shadow-xl shadow-teal-700/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <PhoneCall className="w-4 h-4 stroke-[2.5]" />
            </div>

            <span className="tracking-wide">
              {isSessionActive ? "Return to Active Consultation" : "परामर्श शुरू करें (Start Call)"}
            </span>

            <Headphones className="w-5 h-5 opacity-90" />
          </button>
        </div>

        {/* Value Highlights Pill Grid */}
        <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
          
          <div className="p-3.5 rounded-2xl glass-card border border-teal-100 flex items-center gap-3 shadow-sm bg-white/90">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">24/7 Voice Care</div>
              <div className="text-[11px] text-slate-500">Instant AI triage</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border border-teal-100 flex items-center gap-3 shadow-sm bg-white/90">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Murf Falcon Voice</div>
              <div className="text-[11px] text-slate-500">Hindi & English</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border border-teal-100 flex items-center gap-3 shadow-sm bg-white/90">
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">&lt;400ms Latency</div>
              <div className="text-[11px] text-slate-500">Real-time WebRTC</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border border-teal-100 flex items-center gap-3 shadow-sm bg-white/90">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Strict Guardrails</div>
              <div className="text-[11px] text-slate-500">Safe home remedies</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

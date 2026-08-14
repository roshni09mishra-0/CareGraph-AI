"use client";

import { Calendar, Stethoscope, HeartPulse, Brain, Sparkles, Building2, Clock, ArrowLeftRight, Mic, Volume2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { SPECIALIST_REGISTRY, SpecialistDomain, SpecialistProfile } from "@/lib/specialistTypes";

interface SpecialistProfileCardProps {
  activeSpecialist: SpecialistDomain;
  onSelectSpecialist: (domain: SpecialistDomain) => void;
  onSwitchToMain: () => void;
}

export default function SpecialistProfileCard({
  activeSpecialist,
  onSelectSpecialist,
  onSwitchToMain,
}: SpecialistProfileCardProps) {
  const currentProfile: SpecialistProfile = SPECIALIST_REGISTRY[activeSpecialist] || SPECIALIST_REGISTRY.general_physician;
  const isMain = activeSpecialist === "general_physician";

  // Specialist Tabs
  const specialistsList: { id: SpecialistDomain; label: string; icon: any; color: string }[] = [
    { id: "general_physician", label: "मुख्य साथी (General)", icon: Stethoscope, color: "text-teal-400" },
    { id: "cardiologist", label: "हृदय रोग (Cardio)", icon: HeartPulse, color: "text-rose-400" },
    { id: "mental_health", label: "मानसिक (Mental)", icon: Brain, color: "text-purple-400" },
    { id: "gastroenterologist", label: "पेट रोग (Gastro)", icon: Sparkles, color: "text-amber-400" },
    { id: "dermatologist", label: "त्वचा (Derma)", icon: Sparkles, color: "text-pink-400" },
    { id: "pediatrician", label: "बाल रोग (Pediatric)", icon: Sparkles, color: "text-cyan-400" },
    { id: "gynecologist", label: "महिला (Gyneco)", icon: HeartPulse, color: "text-rose-400" },
    { id: "clinic_appointment", label: "अपॉइंटमेंट (PHC)", icon: Calendar, color: "text-indigo-400" },
  ];

  return (
    <div className="w-full rounded-3xl p-4 sm:p-5 border-2 transition-all duration-300 shadow-xl relative overflow-hidden bg-slate-900 text-slate-100 font-sans border-slate-800">
      
      {/* Dynamic Background Glow based on Active Specialist */}
      <div className={`absolute -right-10 -top-10 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none ${
        activeSpecialist === "cardiologist" ? "bg-rose-600" :
        activeSpecialist === "mental_health" ? "bg-purple-600" :
        activeSpecialist === "gastroenterologist" ? "bg-amber-600" :
        activeSpecialist === "dermatologist" ? "bg-pink-600" :
        activeSpecialist === "clinic_appointment" ? "bg-indigo-600" : "bg-teal-600"
      }`} />

      {/* Top Bar: Multi-Specialist Switcher Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Multi-Specialist Voice Handoff System (#VoiceForBharat)</span>
          </span>
        </div>

        {/* Live Voice Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
          <Volume2 className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span className="text-slate-400 text-[11px]">Active Murf Voice:</span>
          <span className={`font-bold text-[11px] ${isMain ? "text-teal-300" : "text-amber-300"}`}>
            {isMain ? "hi-IN-shweta (Female)" : "hi-IN-kabir (Male Doctor)"}
          </span>
        </div>
      </div>

      {/* Specialist Selector Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none">
        {specialistsList.map((spec) => {
          const IconComp = spec.icon;
          const isSelected = activeSpecialist === spec.id;
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => onSelectSpecialist(spec.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                isSelected
                  ? "bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-md ring-2 ring-teal-400/50"
                  : "bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${spec.color}`} />
              <span>{spec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Persona Showcase Banner */}
      <div className={`p-4 rounded-2xl border-2 transition-all shadow-lg ${
        isMain
          ? "bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-950 border-teal-500/40"
          : "bg-gradient-to-r from-indigo-950/90 via-purple-950/40 to-slate-950 border-indigo-500/60"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            {/* Specialist Avatar Icon with Glow */}
            <div className="relative shrink-0">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${
                isMain
                  ? "bg-gradient-to-tr from-teal-600 to-emerald-700 shadow-teal-600/30"
                  : "bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 shadow-indigo-600/40 ring-4 ring-indigo-400/50 animate-pulse"
              }`}>
                {activeSpecialist === "cardiologist" ? <HeartPulse className="w-7 h-7 text-rose-300" /> :
                 activeSpecialist === "mental_health" ? <Brain className="w-7 h-7 text-purple-300" /> :
                 activeSpecialist === "clinic_appointment" ? <Calendar className="w-7 h-7 text-amber-300" /> :
                 <Stethoscope className="w-7 h-7 text-teal-200" />}
              </div>

              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            </div>

            {/* Specialist Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white">
                  {currentProfile.nameHi}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10.5px] font-extrabold">
                  {currentProfile.departmentHi}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-bold">
                  🟢 Live Active
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium">
                <strong>विशेषज्ञ कार्यक्षेत्र:</strong> {currentProfile.roleHi}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-teal-300">
                  <Mic className="w-3 h-3 text-teal-400" /> वॉइस: <strong>{currentProfile.voiceName}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-300">
                  <Clock className="w-3 h-3 text-amber-400" /> रियल-टाइम वॉइस स्विचिंग एक्टिव
                </span>
              </div>
            </div>
          </div>

          {/* Action to Switch Back to Main */}
          {!isMain && (
            <button
              type="button"
              onClick={onSwitchToMain}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition shrink-0 active:scale-95 shadow-md"
              title="Hand back to Main Assistant"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-teal-400" />
              <span>मुख्य साथी पर लौटें</span>
            </button>
          )}

        </div>
      </div>

    </div>
  );
}

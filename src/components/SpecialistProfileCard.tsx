"use client";

import { Calendar, Stethoscope, UserCheck, ShieldCheck, MapPin, Clock, ArrowLeftRight, Sparkles, Building2, CheckCircle2 } from "lucide-react";

interface SpecialistProfileCardProps {
  activeAgent: "main" | "clinic_specialist";
  onSwitchToMain: () => void;
  onSwitchToSpecialist: () => void;
}

export default function SpecialistProfileCard({
  activeAgent,
  onSwitchToMain,
  onSwitchToSpecialist,
}: SpecialistProfileCardProps) {
  return (
    <div className="w-full rounded-3xl p-4 sm:p-5 border-2 transition-all duration-300 shadow-xl relative overflow-hidden bg-slate-900 text-slate-100 font-sans border-slate-800">
      
      {/* Background Glow */}
      <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none ${
        activeAgent === "clinic_specialist" ? "bg-indigo-500" : "bg-teal-500"
      }`} />

      {/* Top Multi-Agent Switcher Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Multi-Agent System (#VoiceForBharat Day 9)</span>
          </span>
        </div>

        {/* 2 Agent Toggle Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={onSwitchToMain}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              activeAgent === "main"
                ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>1. मुख्य एजेंट (Main)</span>
          </button>

          <button
            onClick={onSwitchToSpecialist}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              activeAgent === "clinic_specialist"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>2. क्लिनिक विशेषज्ञ (Specialist)</span>
          </button>
        </div>
      </div>

      {/* Active Agent Showcase Profile */}
      {activeAgent === "clinic_specialist" ? (
        /* SPECIALIST AGENT CARD */
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-purple-950/40 to-slate-950 border-2 border-indigo-500/60 shadow-lg animate-fadeIn">
          
          <div className="flex items-center gap-3.5">
            {/* Specialist Avatar */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/40 ring-4 ring-indigo-400/50 animate-pulse">
                <Calendar className="w-7 h-7" />
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
                  आरोग्य मित्र / क्लिनिक विशेषज्ञ (Arogya Mitra)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10.5px] font-extrabold">
                  🏥 Dedicated Specialist
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-bold">
                  🟢 Live Active
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium">
                <strong>कार्यक्षेत्र:</strong> प्राथमिक स्वास्थ्य केंद्र (PHC) डॉक्टर OPD स्लॉट बुकिंग, टोकन नंबर आवंटन एवं आयुष्मान भारत PM-JAY पंजीकरण।
              </p>

              <div className="flex items-center gap-3 text-[11px] text-indigo-300 font-mono pt-0.5">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-indigo-400" /> शिवपुर PHC (वाराणसी)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> OPD समय: 09:00 AM - 02:00 PM
                </span>
              </div>
            </div>
          </div>

          {/* Action to Switch Back */}
          <button
            onClick={onSwitchToMain}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition shrink-0 active:scale-95"
            title="Hand back to Main Agent"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-teal-400" />
            <span>मुख्य साथी पर लौटें</span>
          </button>

        </div>
      ) : (
        /* MAIN AGENT CARD */
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-teal-950/70 via-slate-900 to-slate-950 border border-teal-500/40 shadow-sm animate-fadeIn">
          
          <div className="flex items-center gap-3.5">
            {/* Main Agent Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-teal-600/20 shrink-0">
              <Stethoscope className="w-7 h-7" />
            </div>

            {/* Main Agent Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white">
                  SwasthyaSathi AI (मुख्य स्वास्थ्य साथी)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10.5px] font-bold">
                  🩺 Primary Triage Guide
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium">
                <strong>कार्यक्षेत्र:</strong> सामान्य स्वास्थ्य परामर्श, लक्षण ट्राइएज (Level 1-3), घरेलू उपचार एवं आपातकालीन 108 रेड-फ्लैग सहायता।
              </p>

              <div className="text-[11px] text-teal-300/90 font-medium">
                👉 <em>अपॉइंटमेंट बुक करने के लिए कहें — एजेंट स्वतः क्लिनिक विशेषज्ञ को कॉल ट्रांसफर कर देगा!</em>
              </div>
            </div>
          </div>

          {/* Action to trigger handoff */}
          <button
            onClick={onSwitchToSpecialist}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 shrink-0 active:scale-95"
            title="Hand off to Specialist"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>विशेषज्ञ को ट्रांसफर करें</span>
          </button>

        </div>
      )}

    </div>
  );
}

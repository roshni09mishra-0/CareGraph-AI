"use client";

import { Stethoscope, Calendar, ArrowRightLeft, Sparkles, UserCheck, ShieldCheck } from "lucide-react";

interface SpecialistBadgeProps {
  activeAgent: "main" | "clinic_specialist";
  onSwitchAgent?: (agent: "main" | "clinic_specialist") => void;
}

export default function SpecialistBadge({ activeAgent, onSwitchAgent }: SpecialistBadgeProps) {
  return (
    <div className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-xs shadow-md transition animate-fadeIn">
      
      {/* Current Active Agent Status */}
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
          activeAgent === "clinic_specialist"
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-2 ring-indigo-400/50 animate-pulse"
            : "bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
        }`}>
          {activeAgent === "clinic_specialist" ? (
            <Calendar className="w-4 h-4" />
          ) : (
            <Stethoscope className="w-4 h-4" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white text-xs">
              {activeAgent === "clinic_specialist"
                ? "🏥 क्लिनिक एवं अपॉइंटमेंट विशेषज्ञ (Clinic Specialist)"
                : "🩺 मुख्य स्वास्थ्य साथी AI (Main Triage Agent)"}
            </span>
            <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${
              activeAgent === "clinic_specialist"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "bg-teal-500/20 text-teal-300 border border-teal-500/40"
            }`}>
              {activeAgent === "clinic_specialist" ? "Day 9 Specialist" : "Day 1-8 Main"}
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            {activeAgent === "clinic_specialist"
              ? "कार्य: PHC डॉक्टर OPD स्लॉट बुकिंग, टोकन आवंटन एवं आयुष्मान भारत सत्यापन"
              : "कार्य: सामान्य लक्षण ट्राइएज, घरेलू उपचार एवं आपातकालीन रेड-फ्लैग अलर्ट"}
          </p>
        </div>
      </div>

      {/* Manual Switch / Reset Button (Optional) */}
      {onSwitchAgent && (
        <button
          onClick={() => onSwitchAgent(activeAgent === "main" ? "clinic_specialist" : "main")}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 text-[11px] font-bold transition active:scale-95"
          title="Switch Agent Manually"
        >
          <ArrowRightLeft className="w-3 h-3 text-teal-400" />
          <span className="hidden sm:inline">
            {activeAgent === "main" ? "Switch to Specialist" : "Back to Main"}
          </span>
        </button>
      )}

    </div>
  );
}

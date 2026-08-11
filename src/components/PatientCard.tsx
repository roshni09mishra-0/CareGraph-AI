"use client";

import { useState } from "react";
import { CallerRecord } from "@/lib/db";
import { User, ShieldCheck, ShieldAlert, Trash2, UserPlus, HeartPulse, History, Calendar, CheckCircle2, Stethoscope } from "lucide-react";

interface PatientCardProps {
  caller: CallerRecord | null;
  savedCallers: CallerRecord[];
  onSelectCaller: (userId: string | null) => void;
  onForgetCaller: (userId: string) => void;
  isNewPatient?: boolean;
}

export default function PatientCard({
  caller,
  savedCallers,
  onSelectCaller,
  onForgetCaller,
  isNewPatient = false,
}: PatientCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!caller) return;
    setIsDeleting(true);
    try {
      await onForgetCaller(caller.user_id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-teal-200/90 p-4 sm:p-5 shadow-md space-y-4 relative overflow-hidden bg-white/95 backdrop-blur-md">
      
      {/* Card Header: Profile Switcher & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-teal-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shadow-sm">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Patient Memory & Health Profile</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300 font-mono font-bold">
                DAY 4
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              #VoiceForBharat Health Access Track (Consent & SQLite Memory)
            </p>
          </div>
        </div>

        {/* Active Caller Switcher for Fast Day 4 Demo */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="caller-select" className="text-[11px] text-slate-600 font-bold whitespace-nowrap">
            Active Patient:
          </label>
          <select
            id="caller-select"
            value={caller ? caller.user_id : "new_patient"}
            onChange={(e) => {
              const val = e.target.value;
              onSelectCaller(val === "new_patient" ? null : val);
            }}
            className="bg-white border border-teal-300 rounded-xl px-3 py-1.5 text-xs text-teal-900 font-bold focus:outline-none focus:border-teal-500 cursor-pointer w-full sm:w-auto shadow-sm"
          >
            <option value="new_patient">🆕 New Patient (First Call Demo)</option>
            {savedCallers.map((c) => (
              <option key={c.user_id} value={c.user_id}>
                👤 {c.name} ({c.user_id}) - Returning
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Patient Information Display */}
      {caller && !isNewPatient ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Caller Identity */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
              Patient Name
            </span>
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-700" />
              <span className="font-extrabold text-slate-900 text-sm">{caller.name}</span>
            </div>
            <div className="text-[10px] font-mono text-teal-900 font-bold block">
              📞 {caller.phone_number || "+91 7991912530"}
            </div>
          </div>

          {/* Age Band & Conditions */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
              Health Facts
            </span>
            <div className="text-slate-800 font-semibold space-y-0.5">
              <p>🎂 Age: <span className="font-bold text-teal-800">{caller.facts.age_band || "Adult"}</span></p>
              <p>🩺 Status: <span className="text-slate-700">{caller.facts.ongoing_conditions || "None"}</span></p>
            </div>
          </div>

          {/* Last Triage Outcome */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
              Previous Consultation
            </span>
            <p className="text-[11.5px] text-teal-900 font-semibold line-clamp-2 leading-relaxed">
              {caller.facts.last_triage_outcome || "Previous fever consultation"}
            </p>
            <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
              <History className="w-3 h-3 text-slate-400" />
              {new Date(caller.last_interaction).toLocaleDateString()}
            </span>
          </div>

          {/* Consent Status & Forget Tool */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Privacy & Consent
              </span>
              {caller.consent_given ? (
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Consent: Active ✅</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-800 font-bold text-[11px]">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>No Consent</span>
                </div>
              )}
            </div>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition duration-150 disabled:opacity-50 shadow-sm"
              title="Wipe this patient's records (Forget Me Tool)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? "Wiping..." : "Forget My Data"}</span>
            </button>
          </div>

        </div>
      ) : (
        /* New Patient Greeting / First Call State */
        <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-teal-900 text-sm">
              <UserPlus className="w-4 h-4 text-teal-700" />
              <span>First Call / New Patient Consultation</span>
            </div>
            <p className="text-slate-600 text-[11.5px] leading-relaxed font-medium">
              The assistant will treat you as a first-time caller. When you share your symptoms, it will ask for your consent before saving your name and health facts.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-teal-800 border border-teal-300 text-[11px] font-bold whitespace-nowrap shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Strict Consent Guardrail Active</span>
          </div>
        </div>
      )}

    </div>
  );
}

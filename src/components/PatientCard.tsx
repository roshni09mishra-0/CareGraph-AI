"use client";

import { useState } from "react";
import { CallerRecord } from "@/lib/db";
import { User, ShieldCheck, ShieldAlert, Trash2, UserPlus, HeartPulse, History, Calendar, CheckCircle2 } from "lucide-react";

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
    <div className="glass-panel rounded-2xl border border-teal-500/30 p-4 sm:p-5 shadow-xl space-y-4 relative overflow-hidden bg-slate-900/60 backdrop-blur-md">
      
      {/* Card Header: Profile Switcher & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-sm">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Patient Memory & Health Profile</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono">
                DAY 4
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              #VoiceForBharat Health Access Track (Consent & SQLite Memory)
            </p>
          </div>
        </div>

        {/* Active Caller Switcher for Fast Day 4 Demo */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="caller-select" className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">
            Active Caller:
          </label>
          <select
            id="caller-select"
            value={caller ? caller.user_id : "new_patient"}
            onChange={(e) => {
              const val = e.target.value;
              onSelectCaller(val === "new_patient" ? null : val);
            }}
            className="bg-slate-950/90 border border-teal-500/40 rounded-xl px-3 py-1.5 text-xs text-teal-200 font-bold focus:outline-none focus:border-teal-400 cursor-pointer w-full sm:w-auto shadow-inner"
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
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">
              Patient Name
            </span>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-slate-100 text-sm">{caller.name}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block">
              ID: {caller.user_id}
            </span>
          </div>

          {/* Age Band & Conditions */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">
              Health Facts
            </span>
            <div className="text-slate-200 font-medium space-y-0.5">
              <p>🎂 Age: <span className="font-semibold text-teal-300">{caller.facts.age_band || "Adult"}</span></p>
              <p>🩺 Conditions: <span className="text-slate-300">{caller.facts.ongoing_conditions || "None"}</span></p>
            </div>
          </div>

          {/* Last Triage Outcome */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">
              Previous Consultation
            </span>
            <p className="text-[11.5px] text-teal-200 font-medium line-clamp-2 leading-relaxed">
              {caller.facts.last_triage_outcome || "Previous mild fever inquiry"}
            </p>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <History className="w-3 h-3 text-slate-500" />
              {new Date(caller.last_interaction).toLocaleDateString()}
            </span>
          </div>

          {/* Consent Status & Forget Tool */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Privacy & Consent
              </span>
              {caller.consent_given ? (
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Consent: Active ✅</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>No Consent</span>
                </div>
              )}
            </div>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition duration-150 disabled:opacity-50"
              title="Wipe this patient's records (Forget Me Tool)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? "Wiping..." : "Forget My Data"}</span>
            </button>
          </div>

        </div>
      ) : (
        /* New Patient Greeting / First Call State */
        <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-teal-300 text-sm">
              <UserPlus className="w-4 h-4 text-teal-400" />
              <span>First Call / New Patient Consultation</span>
            </div>
            <p className="text-slate-300 text-[11.5px] leading-relaxed">
              The assistant will treat you as a first-time caller. When you share your symptoms, it will ask for your consent before saving your name and health facts.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-teal-300 border border-teal-500/40 text-[11px] font-semibold whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Strict Consent Guardrail Active</span>
          </div>
        </div>
      )}

    </div>
  );
}

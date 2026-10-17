"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneCall,
  X,
  CheckCircle2,
  AlertTriangle,
  Hospital,
  BedDouble,
  UserCheck,
  ShieldAlert,
  Volume2,
  Lock,
} from "lucide-react";
import { DispatchRecord } from "@/lib/falkordb/types";

interface DispatchModalProps {
  dispatchRecord: DispatchRecord | null;
  onClose: () => void;
}

export default function DispatchModal({ dispatchRecord, onClose }: DispatchModalProps) {
  const [callProgressStep, setCallProgressStep] = useState(1);

  useEffect(() => {
    if (dispatchRecord) {
      setCallProgressStep(1);
      const t1 = setTimeout(() => setCallProgressStep(2), 1200);
      const t2 = setTimeout(() => setCallProgressStep(3), 2600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [dispatchRecord]);

  if (!dispatchRecord) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-red-600 rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Top Emergency CAD Bar */}
        <div className="px-4 py-3 bg-red-950 border-b border-red-700 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold text-sm tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              EMERGENCY DISPATCH // HOSPITAL CAD ACTIVE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-red-900/60 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dispatch Progress Stepper */}
        <div className="p-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span
              className={`flex items-center gap-1 font-bold ${
                callProgressStep >= 1 ? "text-sky-400" : "text-slate-600"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> 1. PSTN TRUNK
            </span>
            <span
              className={`flex items-center gap-1 font-bold ${
                callProgressStep >= 2 ? "text-amber-400" : "text-slate-600"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> 2. HOSPITAL ALERT
            </span>
            <span
              className={`flex items-center gap-1 font-bold ${
                callProgressStep >= 3 ? "text-emerald-400" : "text-slate-600"
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> 3. BED RESERVED
            </span>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all duration-700"
              style={{ width: `${(callProgressStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Exact Required Dispatch Alert */}
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
              AUTOMATED DISPATCH VOICE BROADCAST (TWILIO PSTN):
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed">
              "{dispatchRecord.alert_message}"
            </div>
          </div>

          {/* Clinical Allocation Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">PATIENT EN ROUTE:</span>
              <span className="font-bold text-slate-100">{dispatchRecord.patient_name}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">DIALED HOSPITAL CONTACT:</span>
              <span className="font-bold text-sky-400">{dispatchRecord.hospital_phone}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">RECEIVING HOSPITAL:</span>
              <span className="font-semibold text-slate-200">{dispatchRecord.hospital_name}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">ATTENDING PHYSICIAN:</span>
              <span className="font-semibold text-slate-200">{dispatchRecord.doctor_name}</span>
            </div>
          </div>

          {/* Bed Lock Confirmation */}
          <div className="p-3 rounded bg-emerald-950/40 border border-emerald-600/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-emerald-300">
                  BED LOCKED: {dispatchRecord.bed_id} ({dispatchRecord.bed_type})
                </div>
                <div className="text-[10px] text-emerald-400/80">
                  FalkorDB Graph Mutation: SET b.is_available = false
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 text-[10px] font-bold">
              CONFIRMED
            </span>
          </div>

          {/* Telephony SID Record */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>CALL SID: {dispatchRecord.twilio_call_sid}</span>
            <span>STATUS: {dispatchRecord.twilio_status.toUpperCase()}</span>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
          >
            DISMISS ALERT
          </button>
        </div>
      </div>
    </div>
  );
}

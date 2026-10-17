"use client";

import React, { useState } from "react";
import {
  PhoneCall,
  Hospital,
  BedDouble,
  UserCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Lock,
  Volume2,
} from "lucide-react";
import { DispatchRecord, HospitalNode, BedNode } from "@/lib/falkordb/types";
import { INITIAL_HOSPITALS, INITIAL_BEDS } from "@/lib/falkordb/seed";

interface DispatchCadCenterProps {
  dispatchRecords: DispatchRecord[];
  onTriggerDirectDispatch: (hospId: string) => void;
}

export default function DispatchCadCenter({
  dispatchRecords,
  onTriggerDirectDispatch,
}: DispatchCadCenterProps) {
  const [hospitals] = useState<HospitalNode[]>(INITIAL_HOSPITALS);
  const [selectedHospital, setSelectedHospital] = useState<HospitalNode>(hospitals[0]);

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-100 overflow-y-auto p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
              EMERGENCY CAD DISPATCH NETWORK
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Automated Hospital Emergency Telephony & Bed Locking
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time Twilio PSTN outbound emergency dispatch with sub-second FalkorDB state mutations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
            <span className="text-[11px] font-mono text-slate-400 block">CONNECTED HOSPITALS</span>
            <span className="text-lg font-bold text-sky-400">{hospitals.length} CENTERS</span>
          </div>
          <div className="px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
            <span className="text-[11px] font-mono text-slate-400 block">ACTIVE DISPATCHES</span>
            <span className="text-lg font-bold text-emerald-400">
              {dispatchRecords.length > 0 ? dispatchRecords.length : "STANDBY"}
            </span>
          </div>
        </div>
      </div>

      {/* Hospital Network Direct Dispatch Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
          <Hospital className="w-4 h-4 text-sky-400" />
          Indian Emergency Healthcare Network (Live Bed & CAD Status)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {hospitals.map((hosp) => {
            const hospBeds = INITIAL_BEDS.filter((b) => b.hospital_id === hosp.id);
            const availableICU = hospBeds.filter((b) => b.type === "ICU_Oxygen" && b.is_available).length;
            const totalICU = hospBeds.filter((b) => b.type === "ICU_Oxygen").length;

            return (
              <div
                key={hosp.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/60">
                      {hosp.city}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      GPS: {hosp.lat.toFixed(2)}, {hosp.long.toFixed(2)}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-100 text-base mb-1">{hosp.name}</h4>
                  <p className="text-xs text-slate-400 mb-3 flex items-center gap-1 font-mono">
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                    {hosp.phone}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">ICU Oxygen Beds:</span>
                    <span className="font-bold text-emerald-400">
                      {availableICU} / {totalICU} Available
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${(availableICU / totalICU) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency CAD Activity Log */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          Recent Emergency Telephony & Bed Lock Log (Automated CAD Records)
        </h3>

        {dispatchRecords.length > 0 ? (
          <div className="space-y-3">
            {dispatchRecords.map((rec) => (
              <div
                key={rec.dispatch_id}
                className="p-4 rounded-xl bg-slate-900 border border-red-900/60 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-red-950 text-red-300 border border-red-700 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-red-400" /> BED LOCKED
                    </span>
                    <span className="text-xs font-mono text-slate-400">{rec.timestamp}</span>
                    <span className="text-xs font-mono text-sky-400">SID: {rec.twilio_call_sid}</span>
                  </div>

                  <p className="text-sm text-slate-100 font-medium">
                    "{rec.alert_message}"
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>Patient: <strong className="text-slate-200">{rec.patient_name}</strong></span>
                    <span>Hospital: <strong className="text-slate-200">{rec.hospital_name}</strong> ({rec.hospital_phone})</span>
                    <span>Doctor: <strong className="text-slate-200">{rec.doctor_name}</strong></span>
                    <span>Bed: <strong className="text-red-400 font-mono">{rec.bed_id} ({rec.bed_type})</strong></span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    PSTN ALERT SENT
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-slate-700 mx-auto" />
            <h4 className="text-base font-bold text-slate-300">No Dispatches in Current Shift</h4>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Emergency CAD stands ready. When a High or Critical triage condition is detected in voice intake, the system automatically dispatches the emergency hospital alert here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

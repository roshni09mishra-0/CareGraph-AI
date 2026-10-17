"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FastForward,
  User,
  Calendar,
  Volume2,
} from "lucide-react";
import { FollowUpRecord } from "@/lib/falkordb/types";

export default function FollowUpQueue() {
  const [queue, setQueue] = useState<FollowUpRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialingId, setDialingId] = useState<string | null>(null);
  const [lastCallResult, setLastCallResult] = useState<any | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/caregraph/followup");
      const data = await res.json();
      if (data.success && data.data) {
        setQueue(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch follow-up queue:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const dialPatient = async (record: FollowUpRecord, lang: "hi" | "en") => {
    setDialingId(record.session_id);
    setLastCallResult(null);

    try {
      const res = await fetch("/api/caregraph/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: record.session_id,
          patientId: record.patient_id,
          patientName: record.patient_name,
          patientPhone: record.patient_phone,
          condition: record.condition,
          language: lang,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setLastCallResult(data.data);
        // Refresh queue state
        fetchQueue();
      }
    } catch (e) {
      console.error("Dial follow-up error:", e);
    } finally {
      setDialingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-mono text-xs select-none">
      {/* Top Header */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-slate-200">
            24-HOUR OUTBOUND PATIENT FOLLOW-UP QUEUE
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
            CYPHER: timestamp() - 86400
          </span>
        </div>

        <button
          onClick={fetchQueue}
          disabled={isLoading}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          REFRESH QUEUE
        </button>
      </div>

      {/* Info Banner */}
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>
          Auto-queries FalkorDB for sessions older than 24 hours to conduct recovery & adherence check-in calls.
        </span>
        <span className="text-slate-300 font-bold">{queue.length} PENDING IN QUEUE</span>
      </div>

      {/* Main Queue Table */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {queue.length > 0 ? (
          <div className="border border-slate-800 rounded overflow-hidden">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="p-2 border-b border-r border-slate-800">PATIENT</th>
                  <th className="p-2 border-b border-r border-slate-800">ASSESSED CONDITION</th>
                  <th className="p-2 border-b border-r border-slate-800">HOURS ELAPSED</th>
                  <th className="p-2 border-b border-r border-slate-800">STATUS</th>
                  <th className="p-2 border-b border-r border-slate-800">RECOVERY</th>
                  <th className="p-2 border-b border-slate-800 text-right">AUTOMATED DIALER</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((rec) => {
                  const isDialing = dialingId === rec.session_id;

                  return (
                    <tr key={rec.followup_id} className="hover:bg-slate-900/50">
                      <td className="p-2 border-b border-r border-slate-800 text-slate-200">
                        <div className="font-semibold">{rec.patient_name}</div>
                        <div className="text-[10px] text-slate-400">{rec.patient_phone}</div>
                      </td>
                      <td className="p-2 border-b border-r border-slate-800 text-slate-300">
                        {rec.condition}
                      </td>
                      <td className="p-2 border-b border-r border-slate-800 text-amber-400 font-bold">
                        +{rec.hours_elapsed} hrs
                      </td>
                      <td className="p-2 border-b border-r border-slate-800">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            rec.status === "COMPLETED"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-amber-950 text-amber-400 border border-amber-800"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-2 border-b border-r border-slate-800 text-slate-300">
                        {rec.recovery_status || "PENDING EVALUATION"}
                      </td>
                      <td className="p-2 border-b border-slate-800 text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => dialPatient(rec, "hi")}
                            disabled={isDialing}
                            className="px-2 py-1 rounded bg-sky-700 hover:bg-sky-600 text-white font-bold text-[10px] flex items-center gap-1 transition disabled:opacity-50"
                          >
                            <PhoneCall className="w-3 h-3" />
                            {isDialing ? "DIALING..." : "DIAL (HINDI)"}
                          </button>
                          <button
                            onClick={() => dialPatient(rec, "en")}
                            disabled={isDialing}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] flex items-center gap-1 border border-slate-700 transition disabled:opacity-50"
                          >
                            <PhoneCall className="w-3 h-3" />
                            DIAL (EN)
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 space-y-2 border border-slate-800 rounded">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <p className="font-semibold text-slate-300">All 24h follow-ups are up to date.</p>
            <p className="text-[11px]">No patient sessions older than 24 hours are currently pending.</p>
          </div>
        )}

        {/* Live Call Result Card */}
        {lastCallResult && (
          <div className="p-3.5 rounded bg-slate-900 border border-sky-800 space-y-2">
            <div className="flex items-center justify-between text-sky-400 font-bold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                24H FOLLOW-UP CHECK-IN COMPLETED
              </span>
              <span className="text-[10px] text-slate-400">
                MUTATION: GRAPH STATE UPDATED
              </span>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800">
              "{lastCallResult.speechScript}"
            </p>

            {lastCallResult.audioUrl && (
              <div className="flex items-center gap-2 pt-1">
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[10px] text-slate-400">MURF FALCON AUDIO GENERATED</span>
                <audio controls src={lastCallResult.audioUrl} className="h-6 w-56" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

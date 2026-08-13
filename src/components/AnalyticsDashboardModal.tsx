"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart3, Phone, CheckCircle2, XCircle, TrendingUp, Zap, Clock, 
  ShieldCheck, RefreshCw, X, ExternalLink, Activity, Smartphone, Stethoscope, PlusCircle
} from "lucide-react";
import { AnalyticsSummary, CallSessionRecord } from "@/lib/analytics";

interface AnalyticsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnalyticsDashboardModal({ isOpen, onClose }: AnalyticsDashboardModalProps) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentCalls, setRecentCalls] = useState<CallSessionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setRecentCalls(data.calls.slice(0, 5));
      }
    } catch (e) {
      console.error("Failed to load analytics modal data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Call Analytics Summary
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  Day 8
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Health Access Track Performance Metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/analytics"
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition"
            >
              <span>पूर्ण डैशबोर्ड (Full Page)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Top 4 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
              <span className="text-slate-400 font-bold block text-[11px]">कुल कॉल्स (Total)</span>
              <div className="text-2xl font-black text-white">{summary?.totalCalls ?? "..."}</div>
              <span className="text-[10px] text-slate-500">Live Voice Calls</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 text-center space-y-1">
              <span className="text-emerald-400 font-bold block text-[11px]">सफल (Success)</span>
              <div className="text-2xl font-black text-emerald-400">{summary?.successfulCalls ?? "..."}</div>
              <span className="text-[10px] text-emerald-500/80">सुरक्षित ट्राइएज</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-rose-500/30 text-center space-y-1">
              <span className="text-rose-400 font-bold block text-[11px]">विफल (Failed)</span>
              <div className="text-2xl font-black text-rose-400">{summary?.failedCalls ?? "..."}</div>
              <span className="text-[10px] text-rose-500/80">बीच में कटी कॉल्स</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-teal-500/30 text-center space-y-1">
              <span className="text-teal-400 font-bold block text-[11px]">सफलता दर (Rate)</span>
              <div className="text-2xl font-black text-teal-300">{summary ? `${summary.successRate}%` : "..."}</div>
              <span className="text-[10px] text-teal-500/80">Average: {summary?.avgLatencyMs}ms</span>
            </div>

          </div>

          {/* Success Definition Box */}
          <div className="p-3 rounded-xl bg-slate-950 border border-teal-500/20 text-slate-300 leading-relaxed text-[11.5px]">
            <strong className="text-teal-400">Health Access सफलता परिभाषा:</strong> कॉलर को सटीक क्लीनिकल ट्राइएज (Level 1-3) देना, नजदीकी PHC अस्पताल बताना, या डॉक्टर एस्केलेशन टिकट बनाना सफल माना जाता है।
          </div>

          {/* Recent 5 Call Sessions */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-white text-xs flex items-center justify-between">
              <span>हालिया कॉल सत्र (Recent 5 Calls)</span>
              <button onClick={fetchAnalytics} className="text-teal-400 hover:text-teal-300 text-[11px] flex items-center gap-1 font-mono">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </h3>

            <div className="space-y-2">
              {recentCalls.map((call) => (
                <div 
                  key={call.session_id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span>{call.caller_name}</span>
                      <span className="text-[10.5px] font-mono text-slate-500">({call.masked_phone})</span>
                      <span className="text-[10px] font-mono text-teal-400 font-bold">{call.session_id}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                      {call.clinical_action}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {call.outcome === "success" ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-bold">
                        ✓ सफल
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10.5px] font-bold">
                        ✕ विफल
                      </span>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {call.latency_ms}ms • {call.duration_seconds}s
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>Murf Falcon 2 • Deepgram STT • PII Protected</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
          >
            बंद करें (Close)
          </button>
        </div>

      </div>
    </div>
  );
}

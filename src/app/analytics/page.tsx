"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart3, Phone, CheckCircle2, XCircle, TrendingUp, Zap, Clock, 
  ShieldCheck, RefreshCw, Filter, Smartphone, Globe, PhoneCall, 
  Activity, Stethoscope, AlertTriangle, ArrowLeft, Search, PlusCircle, AlertCircle
} from "lucide-react";
import { CallSessionRecord, AnalyticsSummary } from "@/lib/analytics";

export default function CallAnalyticsDashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [calls, setCalls] = useState<CallSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setCalls(data.calls);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error("Failed to load analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    if (!autoRefresh) return;
    const interval = setInterval(fetchAnalytics, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Trigger demo success call for Day 8 video test
  const handleAddTestCall = async (outcome: "success" | "failed") => {
    try {
      const payload = outcome === "success" ? {
        caller_name: "रमेश कुमार",
        phone_number: "+91 7991912530",
        channel: "browser_webrtc",
        outcome: "success",
        clinical_action: "Level 2 Urgent Triage: 3-day fever diagnosed, Shivpur PHC consultation advised",
        triage_level: 2,
        duration_seconds: 42,
        latency_ms: 360,
        language: "hi",
      } : {
        caller_name: "अज्ञात कॉलर (Caller)",
        phone_number: "+91 98765 43210",
        channel: "sip_linphone",
        outcome: "failed",
        failure_reason: "early_hangup",
        clinical_action: "Caller disconnected before completing symptom enquiry",
        duration_seconds: 8,
        latency_ms: 510,
        language: "hi",
      };

      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(outcome === "success" 
          ? `✅ नई सफल कॉल दर्ज हुई (${data.record.session_id})! कुल और सफल कॉल्स की संख्या बढ़ गई।`
          : `⚠️ नई विफल कॉल दर्ज हुई (${data.record.session_id})! विफल कॉल्स की संख्या बढ़ गई।`
        );
        fetchAnalytics();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (e) {
      console.error("Error adding test call:", e);
    }
  };

  const filteredCalls = calls.filter((c) => {
    const matchesStatus = filterStatus === "all" || c.outcome === filterStatus;
    const matchesSearch = 
      c.caller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.clinical_action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.session_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.channel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-teal-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Navigation Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
              title="मुख्य पृष्ठ पर लौटें (Return Home)"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Call Analytics Dashboard
                </h1>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  #VoiceForBharat Live Analytics
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Health Access Track • Real-Time Browser WebRTC & Linphone SIP Performance
              </p>
            </div>
          </div>

          {/* Quick Actions & Live Indicator */}
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-400">Live Auto-Sync:</span>
              <span className="font-bold text-slate-200">{lastUpdated || "Syncing..."}</span>
            </div>

            <button
              onClick={() => handleAddTestCall("success")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ टेस्ट सफल कॉल (Success)</span>
            </button>

            <button
              onClick={() => handleAddTestCall("failed")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-700/30 active:scale-95 transition"
            >
              <XCircle className="w-4 h-4" />
              <span>+ टेस्ट विफल कॉल (Failed)</span>
            </button>
          </div>
        </header>

        {/* Action Alert Banner */}
        {actionMessage && (
          <div className="p-3.5 rounded-2xl bg-teal-950/80 border-2 border-teal-400 text-teal-200 text-xs font-bold flex items-center justify-between animate-fadeIn shadow-lg">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-teal-400 hover:text-white font-mono">✕</button>
          </div>
        )}

        {/* Health Access Success Definition Protocol Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-teal-300 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Health Access Track: Call Success Definition (कॉल सफलता मापदंड)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-emerald-400">सफल कॉल (Success):</strong> जब कॉलर को सुरक्षित क्लीनिकल मार्गदर्शन (Level 1-3 Triage), नजदीकी PHC अस्पताल की सही जानकारी, या सहमति के साथ डॉक्टर एस्केलेशन टिकट प्राप्त होता है।
            <br />
            <strong className="text-rose-400">विफल कॉल (Failed):</strong> जब कॉलर बातचीत पूरी होने से पहले कॉल काट देता है (Early Hangup), जरूरी डॉक्टर परामर्श की सहमति अस्वीकार करता है, या पूछताछ अधूरी रहती है।
          </p>
        </div>

        {/* 5 Core Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          
          {/* Total Calls */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>कुल कॉल्स (Total)</span>
              <Phone className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-black text-white">
              {summary ? summary.totalCalls : "..."}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">ब्राउज़र + Linphone SIP</p>
          </div>

          {/* Successful Calls */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/50 transition shadow-lg space-y-1">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
              <span>सफल कॉल्स (Success)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">
              {summary ? summary.successfulCalls : "..."}
            </div>
            <p className="text-[11px] text-emerald-500/80 font-medium">सुरक्षित ट्राइएज / PHC रेफरल</p>
          </div>

          {/* Failed Calls */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 hover:border-rose-500/50 transition shadow-lg space-y-1">
            <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
              <span>विफल कॉल्स (Failed)</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-black text-rose-400">
              {summary ? summary.failedCalls : "..."}
            </div>
            <p className="text-[11px] text-rose-500/80 font-medium">अधूरी / बीच में कटी कॉल्स</p>
          </div>

          {/* Success Rate */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/30 hover:border-teal-500/50 transition shadow-lg space-y-1">
            <div className="flex items-center justify-between text-teal-400 text-xs font-semibold">
              <span>सफलता दर (Rate)</span>
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl font-black text-teal-300">
              {summary ? `${summary.successRate}%` : "..."}
            </div>
            <p className="text-[11px] text-teal-500/80 font-medium">पूर्ण क्लीनिकल समाधान</p>
          </div>

          {/* Latency */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-500/50 transition shadow-lg space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-cyan-400 text-xs font-semibold">
              <span>औसत लेटेंसी (TTS)</span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-cyan-300">
              {summary ? `${summary.avgLatencyMs}ms` : "..."}
            </div>
            <p className="text-[11px] text-cyan-500/80 font-medium">Murf Falcon 2 Ultra-Fast</p>
          </div>

        </div>

        {/* Analytics Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Channel Distribution */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-400" />
              <span>कॉलिंग चैनल वितरण (Channels)</span>
            </h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>🌐 Browser WebRTC (वेबसाइट)</span>
                  <span className="font-bold text-teal-300">{summary?.channelBreakdown.browser_webrtc || 0} कॉल्स</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-teal-500 h-2 rounded-full transition-all"
                    style={{ width: `${summary && summary.totalCalls > 0 ? (summary.channelBreakdown.browser_webrtc / summary.totalCalls) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>📱 Linphone SIP VoIP (मोबाइल ऐप)</span>
                  <span className="font-bold text-emerald-300">{summary?.channelBreakdown.sip_linphone || 0} कॉल्स</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${summary && summary.totalCalls > 0 ? (summary.channelBreakdown.sip_linphone / summary.totalCalls) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>📞 Outbound Follow-up (आउटबाउंड)</span>
                  <span className="font-bold text-blue-300">{summary?.channelBreakdown.outbound_telephony || 0} कॉल्स</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${summary && summary.totalCalls > 0 ? (summary.channelBreakdown.outbound_telephony / summary.totalCalls) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Failure Reasons Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>विफलता के कारण (Failure Reasons)</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">⏱️ बीच में कटी कॉल (Early Hangup)</span>
                <span className="font-bold text-rose-400 px-2 py-0.5 rounded-md bg-rose-500/10">
                  {summary?.failureBreakdown.early_hangup || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">🚫 सहमति अस्वीकार (Consent Declined)</span>
                <span className="font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10">
                  {summary?.failureBreakdown.consent_declined || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">❓ अधूरी पूछताछ (Aborted Inquiry)</span>
                <span className="font-bold text-slate-400 px-2 py-0.5 rounded-md bg-slate-500/10">
                  {summary?.failureBreakdown.aborted_inquiry || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Actions Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              <span>क्लीनिकल परिणाम (Clinical Outcomes)</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Level 1 Emergency Triage</span>
                <span className="font-bold text-white">{summary?.clinicalOutcomes.emergency_triage_l1 || 0}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Level 2 Urgent PHC Visit</span>
                <span className="font-bold text-white">{summary?.clinicalOutcomes.urgent_phc_l2 || 0}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Level 3 Routine Home Care</span>
                <span className="font-bold text-white">{summary?.clinicalOutcomes.routine_home_l3 || 0}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Doctor Escalation Tickets</span>
                <span className="font-bold text-teal-300">{summary?.clinicalOutcomes.human_escalation || 0}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Real-time Call Log Session Feed Table */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>लाइव कॉल रिकॉर्ड्स (Real-Time Call Session Log)</span>
                <span className="text-xs font-normal text-slate-400">({filteredCalls.length} कॉल्स)</span>
              </h2>
              <p className="text-xs text-slate-500">सभी संवेदनशील डेटा (PII / फोन नंबर) सुरक्षित रूप से मास्क किए गए हैं।</p>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="खोजें (Search)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1 rounded-lg transition ${filterStatus === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"}`}
                >
                  सभी (All)
                </button>
                <button
                  onClick={() => setFilterStatus("success")}
                  className={`px-3 py-1 rounded-lg transition ${filterStatus === "success" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                >
                  सफल (Success)
                </button>
                <button
                  onClick={() => setFilterStatus("failed")}
                  className={`px-3 py-1 rounded-lg transition ${filterStatus === "failed" ? "bg-rose-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
                >
                  विफल (Failed)
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">कॉलर (Caller)</th>
                  <th className="py-2.5 px-3">चैनल (Channel)</th>
                  <th className="py-2.5 px-3">अवधि (Duration)</th>
                  <th className="py-2.5 px-3">लेटेंसी (Latency)</th>
                  <th className="py-2.5 px-3">परिणाम (Outcome)</th>
                  <th className="py-2.5 px-3">क्लीनिकल सारांश (Action)</th>
                  <th className="py-2.5 px-3">समय (Time)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCalls.map((call) => (
                  <tr key={call.session_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-teal-400">
                      {call.session_id}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-200">
                      <div>{call.caller_name}</div>
                      <div className="text-[10.5px] text-slate-500 font-mono">{call.masked_phone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                        call.channel === "sip_linphone" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
                        call.channel === "outbound_telephony" ? "bg-blue-500/20 text-blue-300 border border-blue-500/40" :
                        "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                      }`}>
                        {call.channel === "sip_linphone" ? "📱 Linphone SIP" :
                         call.channel === "outbound_telephony" ? "📞 Outbound" :
                         "🌐 WebRTC"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono">
                      {call.duration_seconds}s
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-300">
                      {call.latency_ms}ms
                    </td>
                    <td className="py-3 px-3">
                      {call.outcome === "success" ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30 w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>सफल</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/30 w-fit">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>विफल</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs truncate" title={call.clinical_action}>
                      {call.clinical_action}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[10.5px]">
                      {new Date(call.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
}

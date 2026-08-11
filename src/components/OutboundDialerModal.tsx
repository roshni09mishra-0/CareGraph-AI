"use client";

import { useState, useEffect } from "react";
import { Phone, PhoneCall, PhoneForwarded, PhoneMissed, Clock, ShieldCheck, User, Stethoscope, Sparkles, RefreshCw, X, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { OutboundScenario, CallOutcome, OutboundCallRecord } from "@/lib/telephony";
import { CallerRecord } from "@/lib/db";

interface OutboundDialerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiateCall: (patientId: string, phone: string, scenario: OutboundScenario, outcome?: CallOutcome) => void;
  savedCallers: CallerRecord[];
  language?: "hi" | "en" | "hinglish";
}

export default function OutboundDialerModal({
  isOpen,
  onClose,
  onInitiateCall,
  savedCallers,
  language = "hi",
}: OutboundDialerModalProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("user_ramesh");
  const [phoneNumber, setPhoneNumber] = useState<string>("+91 98765 43210");
  const [selectedScenario, setSelectedScenario] = useState<OutboundScenario>("post_triage_followup");
  const [callLogs, setCallLogs] = useState<OutboundCallRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const isHindi = language === "hi" || language === "hinglish";

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/telephony/outbound-call");
      const data = await res.json();
      if (data.logs && Array.isArray(data.logs)) {
        setCallLogs(data.logs);
      }
    } catch (e) {
      console.warn("[Outbound Dialer] Failed to load call logs:", e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLaunch = (outcome?: CallOutcome) => {
    onInitiateCall(selectedPatientId, phoneNumber, selectedScenario, outcome);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-teal-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <PhoneForwarded className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {isHindi ? "📞 आउटबाउंड स्वास्थ्य टेलीफोनी केंद्र (Day 6)" : "📞 Outbound Health Telephony Center (Day 6)"}
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500 text-slate-950">
                  Twilio + WebRTC
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                {isHindi ? "फॉलो-अप कॉल्स, टीकाकरण रिमाइंडर व क्रॉनिक केयर डायलर" : "Automated Recovery Follow-ups, Immunization & Care Nudges"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Outbound Configuration Form */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-teal-100 space-y-4">
            
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              {isHindi ? "आउटबाउंड कॉल कॉन्फ़िगर करें:" : "Configure Outbound Call:"}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Select Patient */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isHindi ? "1. मरीज चुनें (Patient):" : "1. Select Patient:"}
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-teal-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="user_ramesh">रमेश कुमार (3-Day Fever & PHC Visit)</option>
                  <option value="user_priya">प्रिया देवी (Maternal Immunization)</option>
                  <option value="user_aarav">आरव शर्मा (Child DPT Booster)</option>
                </select>
              </div>

              {/* Enter Phone Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isHindi ? "2. फोन नंबर (Phone Number):" : "2. Phone Number:"}
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 rounded-xl bg-white border border-teal-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

            </div>

            {/* Select Scenario */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                {isHindi ? "3. आउटबाउंड स्वास्थ्य परिदृश्य (Scenario):" : "3. Outbound Health Scenario:"}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                
                <button
                  type="button"
                  onClick={() => setSelectedScenario("post_triage_followup")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedScenario === "post_triage_followup"
                      ? "bg-teal-50 border-teal-500 ring-2 ring-teal-200 text-teal-950"
                      : "bg-white border-slate-200 hover:border-teal-300 text-slate-700"
                  }`}
                >
                  <span className="font-extrabold text-xs">🏥 पोस्ट-ट्राइएज फॉलो-अप</span>
                  <span className="text-[10.5px] text-slate-500 mt-1">बुखार रिकवरी व PHC चेक</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScenario("vaccination_reminder")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedScenario === "vaccination_reminder"
                      ? "bg-teal-50 border-teal-500 ring-2 ring-teal-200 text-teal-950"
                      : "bg-white border-slate-200 hover:border-teal-300 text-slate-700"
                  }`}
                >
                  <span className="font-extrabold text-xs">💉 बाल टीकाकरण</span>
                  <span className="text-[10.5px] text-slate-500 mt-1">पोलियो व DPT बूस्टर याद दिलाना</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScenario("chronic_care_checkin")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedScenario === "chronic_care_checkin"
                      ? "bg-teal-50 border-teal-500 ring-2 ring-teal-200 text-teal-950"
                      : "bg-white border-slate-200 hover:border-teal-300 text-slate-700"
                  }`}
                >
                  <span className="font-extrabold text-xs">🩺 क्रॉनिक केयर चेक</span>
                  <span className="text-[10.5px] text-slate-500 mt-1">बीपी व शुगर साप्ताहिक फॉलो-अप</span>
                </button>

              </div>
            </div>

            {/* Primary Dispatch Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleLaunch("answered")}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold text-sm shadow-lg shadow-teal-800/25 transition transform active:scale-95"
              >
                <PhoneCall className="w-4 h-4 animate-bounce" />
                <span>{isHindi ? "📞 तुरंत आउटबाउंड कॉल करें (Make Outbound Call Now)" : "📞 Make Outbound Call Now (Twilio / WebRTC)"}</span>
              </button>
            </div>

            {/* Advanced Outcome Simulation Triggers (Day 6 Requirements) */}
            <div className="border-t border-slate-200 pt-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                ⚡ {isHindi ? "डे 6 परिणाम सिमुलेशन (Test Edge Cases & Retries):" : "Day 6 Outcome Simulation (Edge Cases & Retries):"}
              </span>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleLaunch("busy")}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition"
                  title="Simulates busy line with 15-minute retry schedule"
                >
                  ⏳ Busy (15m Retry)
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunch("no_answer")}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 text-xs font-bold transition"
                  title="Simulates no answer with 30-minute retry & SMS"
                >
                  📴 No Answer (30m Retry)
                </button>

                <button
                  type="button"
                  onClick={() => handleLaunch("opted_out")}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold transition"
                  title="Simulates patient opt-out (Do Not Call Registry)"
                >
                  🚫 Opt-Out (Do Not Call)
                </button>
              </div>
            </div>

          </div>

          {/* Outbound Call Logs & Outcome History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-700" />
                {isHindi ? "आउटबाउंड कॉल इतिहास व स्थिति (Live Call Logs):" : "Outbound Call Logs & Status:"}
              </span>
              <button
                onClick={fetchLogs}
                className="flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 transition"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? "animate-spin" : ""}`} />
                <span>{isHindi ? "रिफ्रेश" : "Refresh"}</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold text-[11px] sticky top-0">
                    <tr>
                      <th className="p-3">Patient & Scenario</th>
                      <th className="p-3">Status / Outcome</th>
                      <th className="p-3">Time & Retry Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {callLogs.map((log) => (
                      <tr key={log.call_id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3">
                          <span className="font-extrabold text-slate-900 block">{log.patient_name}</span>
                          <span className="text-[10.5px] text-slate-500">{log.scenario}</span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-extrabold text-[10.5px] ${
                            log.status === "completed" || log.status === "answered"
                              ? "bg-emerald-100 text-emerald-800"
                              : log.status === "busy"
                              ? "bg-amber-100 text-amber-800"
                              : log.status === "no_answer"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-rose-100 text-rose-800"
                          }`}>
                            {log.status === "completed" || log.status === "answered" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            <span className="capitalize">{log.status}</span>
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-slate-600">
                          <div>{new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                          {log.retry_scheduled_at && (
                            <span className="text-[10px] font-bold text-amber-700 block">
                              Retry: {new Date(log.retry_scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Phone, PhoneCall, PhoneForwarded, PhoneMissed, Clock, ShieldCheck, User, Stethoscope, Sparkles, RefreshCw, X, AlertTriangle, CheckCircle, Loader2, Smartphone, Radio, Globe } from "lucide-react";
import { OutboundScenario, CallOutcome, OutboundCallRecord, TelephonyProvider } from "@/lib/telephony";
import { CallerRecord } from "@/lib/db";
import { getLinphoneSipUri } from "@/lib/linphone";

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
  const [phoneNumber, setPhoneNumber] = useState<string>("+91 7991912530");
  const [selectedScenario, setSelectedScenario] = useState<OutboundScenario>("post_triage_followup");
  const [provider, setProvider] = useState<TelephonyProvider>("linphone");
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

  const sipUri = getLinphoneSipUri(phoneNumber);

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
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                  {isHindi ? "आउटबाउंड टेलीफोनी सेंटर" : "Outbound Telephony Dispatcher"}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono font-bold">
                  DAY 6
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                Linphone Free SIP VoIP • In-Browser Softphone • Twilio PSTN
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Linphone Free VoIP Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-400/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-900 font-extrabold text-xs">
                <Smartphone className="w-4 h-4 text-teal-700" />
                <span>📱 Linphone Open-Source SIP VoIP (100% Free - No Credits Needed)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                FREE VOIP
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              अपने मोबाइल पर <strong>Linphone App</strong> (Play Store / App Store) डाउनलोड करें। यह सीधे <strong>{sipUri}</strong> पर कॉल करता है और आपके फिजिकल फोन को रिंग कराता है!
            </p>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-mono font-bold text-teal-900 bg-white px-2.5 py-1 rounded-lg border border-teal-300">
                SIP URI: {sipUri}
              </span>
            </div>
          </div>

          {/* Form: Select Patient, Number & Scenario */}
          <div className="space-y-4">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
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
                  <option value="user_ramesh">रमेश कुमार (+91 7991912530 - 3-Day Fever)</option>
                  <option value="user_priya">प्रिया देवी (+91 7991912530 - Maternal Health)</option>
                  <option value="user_aarav">आरव शर्मा (+91 7991912530 - Child Booster)</option>
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
                  placeholder="+91 7991912530"
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
                  <span className="font-extrabold text-xs">🩺 क्रोनिक केयर चेक-इन</span>
                  <span className="text-[10.5px] text-slate-500 mt-1">बीपी व शुगर साप्ताहिक फॉलो-अप</span>
                </button>

              </div>
            </div>

          </div>

          {/* Primary Action Button: Dispatch Call */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleLaunch("answered")}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white font-extrabold text-sm shadow-lg shadow-teal-700/25 transition active:scale-95"
            >
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>📞 {phoneNumber} पर कॉल शुरू करें (Dispatch Call)</span>
            </button>
          </div>

          {/* Edge Cases Outcome Simulation Grid (Day 6 Requirements) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
              {isHindi ? "डे 6 आउटकम व एज केस सिमुलेशन (Outcome Rules):" : "Day 6 Outcome & Edge Cases Simulation:"}
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleLaunch("busy")}
                className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition flex flex-col items-center gap-1"
                title="Simulate busy signal (Auto retry in 15 mins)"
              >
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>⏳ Busy (15m Retry)</span>
              </button>

              <button
                type="button"
                onClick={() => handleLaunch("no_answer")}
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold transition flex flex-col items-center gap-1"
                title="Simulate no answer (Auto retry in 30 mins + SMS)"
              >
                <PhoneMissed className="w-3.5 h-3.5 text-rose-700" />
                <span>📵 No Answer (30m Retry)</span>
              </button>

              <button
                type="button"
                onClick={() => handleLaunch("opted_out")}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold transition flex flex-col items-center gap-1"
                title="Simulate DNC opt out ('कॉल बंद करो')"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                <span>🚫 Opt-Out (DNC Flag)</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

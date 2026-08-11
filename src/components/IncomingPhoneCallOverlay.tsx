"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, PhoneCall, Volume2, ShieldCheck, User, Stethoscope, Sparkles, AlertCircle, CheckCircle2, Clock, X } from "lucide-react";
import { OutboundCallRecord } from "@/lib/telephony";

interface IncomingPhoneCallOverlayProps {
  call: OutboundCallRecord | null;
  isOpen: boolean;
  onAnswer: (call: OutboundCallRecord) => void;
  onDecline: (call: OutboundCallRecord, reason: "busy" | "no_answer" | "declined") => void;
  onOptOut: (patientId: string) => void;
  onClose: () => void;
  language?: "hi" | "en" | "hinglish";
}

export default function IncomingPhoneCallOverlay({
  call,
  isOpen,
  onAnswer,
  onDecline,
  onOptOut,
  onClose,
  language = "hi",
}: IncomingPhoneCallOverlayProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const durationTimerRef = useRef<any>(null);

  const isHindi = language === "hi" || language === "hinglish";

  useEffect(() => {
    if (isOpen && call?.status === "answered") {
      setIsCallActive(true);
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setIsCallActive(false);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [isOpen, call?.status]);

  if (!isOpen || !call) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getScenarioLabel = (s: string) => {
    switch (s) {
      case "post_triage_followup":
        return isHindi ? "🏥 पोस्ट-ट्राइएज बुखार फॉलो-अप (PHC चेक)" : "🏥 Post-Triage Fever Follow-up";
      case "vaccination_reminder":
        return isHindi ? "💉 बाल टीकाकरण रिमाइंडर (पोलियो/DPT)" : "💉 Child Immunization Reminder";
      case "chronic_care_checkin":
        return isHindi ? "🩺 बीपी व शुगर साप्ताहिक फॉलो-अप" : "🩺 Chronic Care Monitoring";
      default:
        return isHindi ? "स्वास्थ्य परामर्श कॉल" : "Healthcare Consultation";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      
      {/* Mobile Smartphone Frame Simulation */}
      <div className="w-full max-w-sm rounded-[2.5rem] bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950 border-4 border-slate-700 shadow-2xl p-6 sm:p-7 text-white flex flex-col justify-between min-h-[540px] relative overflow-hidden">
        
        {/* Top Speaker Grill & Camera Punch-hole */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-1.5 rounded-full bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          title="Close softphone"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Caller Information */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          
          {/* Avatar Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-400 p-1 shadow-lg shadow-teal-500/20 relative">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <Stethoscope className="w-9 h-9 text-teal-400 animate-pulse" />
            </div>
            {!isCallActive && (
              <span className="absolute inset-0 rounded-full border-2 border-teal-400 animate-ping pointer-events-none" />
            )}
          </div>

          <div>
            <span className="text-[11px] font-bold tracking-widest text-teal-400 uppercase block mb-1">
              {isCallActive ? (isHindi ? "🟢 कॉल कनेक्टेड" : "🟢 CALL CONNECTED") : (isHindi ? "📞 इनकमिंग स्वास्थ्य कॉल..." : "📞 INCOMING HEALTH CALL...")}
            </span>
            <h2 className="text-xl font-extrabold text-white">
              SwasthyaSathi AI
            </h2>
            <p className="text-xs font-semibold text-slate-300">
              {call.phone_number || "+91 1800-SWASTHYA"}
            </p>
          </div>

          {/* Scenario Badge */}
          <div className="px-3 py-1 rounded-full bg-teal-900/60 border border-teal-500/40 text-[11px] font-bold text-teal-200 shadow-sm">
            {getScenarioLabel(call.scenario)}
          </div>

          {/* Patient Target Name */}
          <p className="text-xs text-slate-400">
            {isHindi ? "मरीज:" : "Patient:"} <span className="text-white font-bold">{call.patient_name}</span>
          </p>

          {/* Call Active Timer */}
          {isCallActive && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs font-mono font-bold text-emerald-400 border border-emerald-500/30">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(callDuration)}</span>
            </div>
          )}
        </div>

        {/* 3-Part Opening Protocol Preview Card (Day 6 Requirement) */}
        <div className="my-4 p-3.5 rounded-2xl bg-slate-800/80 border border-teal-500/30 text-left text-xs space-y-1.5 shadow-inner">
          <div className="flex items-center gap-1 text-[10px] font-extrabold text-teal-400 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>{isHindi ? "डे 6 अनिवार्य 3-भाग ओपनिंग प्रोटोकॉल:" : "Day 6 Mandatory 3-Part Opening:"}</span>
          </div>
          <p className="text-[11.5px] text-slate-200 leading-relaxed line-clamp-4 italic">
            &ldquo;{call.opening_text}&rdquo;
          </p>
        </div>

        {/* Call Action Buttons */}
        {!isCallActive ? (
          <div className="grid grid-cols-2 gap-4 pt-2">
            
            {/* Decline Button */}
            <button
              onClick={() => onDecline(call, "declined")}
              className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-3xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition"
            >
              <PhoneOff className="w-6 h-6" />
              <span>{isHindi ? "काटें (Decline)" : "Decline"}</span>
            </button>

            {/* Answer Button */}
            <button
              onClick={() => onAnswer(call)}
              className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-3xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition animate-bounce"
            >
              <PhoneCall className="w-6 h-6" />
              <span>{isHindi ? "उठाएं (Answer)" : "Answer"}</span>
            </button>

          </div>
        ) : (
          <div className="space-y-3 pt-2">
            
            {/* End Call Button */}
            <button
              onClick={() => onDecline(call, "declined")}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 transition"
            >
              <PhoneOff className="w-5 h-5" />
              <span>{isHindi ? "कॉल समाप्त करें (Hang Up)" : "Hang Up"}</span>
            </button>

            {/* In-Call Opt-Out Button (Day 6 Requirement) */}
            <button
              onClick={() => onOptOut(call.patient_id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[11px] border border-slate-700 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>{isHindi ? "🚫 कॉल बंद करो (Opt-Out / Do Not Call)" : "🚫 Opt-Out of Future Calls"}</span>
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

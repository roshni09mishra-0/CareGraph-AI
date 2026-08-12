"use client";

import { useState, useEffect } from "react";
import { Activity, ShieldAlert, Settings, Radio, Sparkles, PhoneCall, HeartPulse, Stethoscope, ClipboardList } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  onOpenSetup: () => void;
  onOpenEscalations?: () => void;
  isLiveKitConnected?: boolean;
}

export default function Header({ onOpenSetup, onOpenEscalations, isLiveKitConnected = false }: HeaderProps) {
  const [showSosModal, setShowSosModal] = useState(false);
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch("/api/escalation");
        const data = await res.json();
        if (data.success && data.counts) {
          setOpenTicketsCount(data.counts.open || 0);
        }
      } catch (e) {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-teal-100/90 px-4 lg:px-8 py-3.5 transition-all bg-white/90 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Indian Healthcare Token */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 text-white shadow-lg shadow-teal-600/20">
            <Stethoscope className="w-6 h-6 stroke-[2.5] text-white" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900">
                Swasthya<span className="text-teal-700">Sathi</span>
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-300 shadow-sm">
                🇮🇳 #VoiceForBharat
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              स्वास्थ्य साथी AI • Health Access Voice Guide (Murf Falcon 2)
            </p>
          </div>
        </div>

        {/* Live Status Indicators & Actions */}
        <div className="flex items-center gap-2.5">
          
          {/* Day 7 Doctor Escalations Dashboard Button */}
          <button
            onClick={onOpenEscalations}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-900 border-2 border-teal-400/80 shadow-sm transition active:scale-95 relative"
            title="Open Doctor Escalation Dashboard"
          >
            <ClipboardList className="w-4 h-4 text-teal-700" />
            <span className="hidden md:inline">डॉक्टर एस्केलेशन (Day 7)</span>
            <span className="md:hidden">Day 7</span>
            {openTicketsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono font-extrabold text-[10px] animate-pulse">
                {openTicketsCount}
              </span>
            )}
          </button>

          {/* Emergency SOS Disclaimer Trigger */}
          <button
            onClick={() => setShowSosModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition transform active:scale-95 shadow-sm"
            title="Emergency Medical Protocol"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
            <span>SOS 108/112</span>
          </button>

          {/* Setup Instructions Button */}
          <button
            onClick={onOpenSetup}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-800/15 transition transform active:scale-95"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Emergency SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white border border-rose-200 p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <ShieldAlert className="w-6 h-6" />
                <span className="text-base sm:text-lg">Emergency Medical Protocol (108)</span>
              </div>
              <button 
                onClick={() => setShowSosModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2 leading-relaxed">
              <p className="font-extrabold text-rose-800 uppercase tracking-wide">
                ⚠️ जब तुरंत आपातकालीन मदद चाहिए (Red Flag Symptoms):
              </p>
              <ul className="list-disc list-inside space-y-1 font-medium">
                <li>सीने में तेज दर्द या दबाव (Severe Chest Pain)</li>
                <li>सांस लेने में भारी तकलीफ (Acute Shortness of Breath)</li>
                <li>अचानक बेहोशी या लकवा (Sudden Collapse / Stroke signs)</li>
                <li>अत्यधिक रक्तस्राव (Severe Uncontrolled Bleeding)</li>
              </ul>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href="tel:108"
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 transition"
              >
                <PhoneCall className="w-4 h-4" />
                <span>कॉल करें 108 (राष्ट्रीय एम्बुलेंस सेवा)</span>
              </a>
              <a
                href="tel:112"
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
              >
                <span>कॉल करें 112 (राष्ट्रीय आपातकालीन हेल्पलाइन)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

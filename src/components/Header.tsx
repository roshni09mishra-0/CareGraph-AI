"use client";

import { useState, useEffect } from "react";
import { Activity, ShieldAlert, Settings, Radio, Sparkles, PhoneCall, HeartPulse, Stethoscope, ClipboardList, BarChart3 } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  onOpenSetup: () => void;
  onOpenEscalations?: () => void;
  onOpenAnalytics?: () => void;
  isLiveKitConnected?: boolean;
}

export default function Header({ onOpenSetup, onOpenEscalations, onOpenAnalytics, isLiveKitConnected = false }: HeaderProps) {
  const [showSosModal, setShowSosModal] = useState(false);
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);
  const [successRate, setSuccessRate] = useState<number | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [escRes, analRes] = await Promise.all([
          fetch("/api/escalation"),
          fetch("/api/analytics")
        ]);
        const escData = await escRes.json();
        const analData = await analRes.json();

        if (escData.success && escData.counts) {
          setOpenTicketsCount(escData.counts.open || 0);
        }
        if (analData.success && analData.summary) {
          setSuccessRate(analData.summary.successRate);
        }
      } catch (e) {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 12000);
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
        <div className="flex items-center gap-2">
          
          {/* Day 8 Call Analytics Dashboard Button */}
          <button
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-indigo-950 border-2 border-indigo-300 shadow-sm transition active:scale-95"
            title="Open Day 8 Call Analytics Dashboard"
          >
            <BarChart3 className="w-4 h-4 text-indigo-700" />
            <span className="hidden md:inline">एनालिटिक्स (Day 8)</span>
            <span className="md:hidden">Day 8</span>
            {successRate !== null && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-mono font-extrabold text-[10px]">
                {successRate}%
              </span>
            )}
          </button>

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
            <span>SOS 108</span>
          </button>

          {/* Setup Instructions Button */}
          <button
            onClick={onOpenSetup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-800/15 transition transform active:scale-95"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Emergency Protocol Dialog */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-rose-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="p-3 rounded-2xl bg-rose-100">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">आपातकालीन स्वास्थ्य प्रोटोकॉल</h3>
                <p className="text-xs text-slate-500">Government Emergency Helpline</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              यदि सीने में तेज दर्द, सांस लेने में अत्यधिक तकलीफ, बेहोशी या लकवे जैसे गंभीर लक्षण हों, तो तुरंत राष्ट्रीय आपातकालीन एम्बुलेंस सेवा <strong>108</strong> या <strong>112</strong> पर डायल करें।
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href="tel:108"
                className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 transition active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>कॉल 108 (एम्बुलेंस)</span>
              </a>

              <button
                onClick={() => setShowSosModal(false)}
                className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition"
              >
                समझ गया (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

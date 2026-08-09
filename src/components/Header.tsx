"use client";

import { useState } from "react";
import { Activity, ShieldAlert, Settings, Radio, Sparkles, PhoneCall, HeartPulse, Stethoscope } from "lucide-react";

interface HeaderProps {
  onOpenSetup: () => void;
  isLiveKitConnected?: boolean;
}

export default function Header({ onOpenSetup, isLiveKitConnected = false }: HeaderProps) {
  const [showSosModal, setShowSosModal] = useState(false);

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
          
          {/* LiveKit Connection Badge */}
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            isLiveKitConnected 
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm" 
              : "bg-slate-100 text-slate-700 border-slate-200"
          }`}>
            <Radio className={`w-3.5 h-3.5 ${isLiveKitConnected ? "text-emerald-600 animate-pulse" : "text-slate-400"}`} />
            <span>{isLiveKitConnected ? "LiveKit WebRTC: Active" : "LiveKit Ready"}</span>
          </div>

          {/* Murf Falcon Voice Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Murf Falcon Voice</span>
          </div>

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
          <div className="bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-9 h-9 stroke-[2.5]" />
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">आपातकालीन सहायता (Emergency SOS)</h3>
                <p className="text-xs text-rose-700 font-semibold">India Emergency Response Protocol</p>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              SwasthyaSathi AI is an automated AI voice assistant for health guidance and symptom awareness. It does not replace certified clinical emergency care.
            </p>
            
            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1.5">
              <p className="font-bold text-rose-800">यदि आप गंभीर लक्षण महसूस कर रहे हैं (Red Flags):</p>
              <ul className="list-disc pl-4 space-y-0.5 text-rose-900 font-medium">
                <li>तीव्र सीने में दर्द (Severe Chest Pain / Heart)</li>
                <li>सांस लेने में अत्यधिक कठिनाई (Severe Breathlessness)</li>
                <li>अचानक पक्षाघात या कमजोरी (Stroke / Paralysis)</li>
                <li>अत्यधिक रक्तस्राव (Severe Uncontrolled Bleeding)</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href="tel:108"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 transition transform active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Ambulance 108</span>
              </a>
              <button
                onClick={() => setShowSosModal(false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close Emergency Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

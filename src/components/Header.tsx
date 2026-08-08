"use client";

import { useState } from "react";
import { Activity, ShieldAlert, Settings, Radio, Sparkles, PhoneCall, HeartPulse } from "lucide-react";

interface HeaderProps {
  onOpenSetup: () => void;
  isLiveKitConnected?: boolean;
}

export default function Header({ onOpenSetup, isLiveKitConnected = false }: HeaderProps) {
  const [showSosModal, setShowSosModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Indian Healthcare Token */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 via-emerald-500 to-teal-700 text-slate-950 shadow-xl shadow-teal-500/25">
            <HeartPulse className="w-6 h-6 stroke-[2.5] text-slate-950 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-white via-teal-100 to-teal-300 bg-clip-text text-transparent">
                SwasthyaSathi
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-gradient-to-r from-orange-500/20 via-white/10 to-green-500/20 text-teal-200 border border-teal-500/40 shadow-sm">
                🇮🇳 #VoiceForBharat
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              स्वास्थ्य साथी AI • Murf Falcon Indian Accent & LiveKit WebRTC
            </p>
          </div>
        </div>

        {/* Live Status Indicators & Actions */}
        <div className="flex items-center gap-2.5">
          
          {/* LiveKit Connection Badge */}
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            isLiveKitConnected 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm" 
              : "bg-slate-800/80 text-slate-300 border-slate-700"
          }`}>
            <Radio className={`w-3.5 h-3.5 ${isLiveKitConnected ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
            <span>{isLiveKitConnected ? "LiveKit WebRTC: Active" : "LiveKit Ready"}</span>
          </div>

          {/* Murf Falcon Voice Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Murf Falcon (en-IN / hi-IN)</span>
          </div>

          {/* Emergency SOS Disclaimer Trigger */}
          <button
            onClick={() => setShowSosModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 transition transform active:scale-95"
            title="Emergency Medical Protocol"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>SOS 108/112</span>
          </button>

          {/* Setup Instructions Button */}
          <button
            onClick={onOpenSetup}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/40 transition transform active:scale-95"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Emergency SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-9 h-9 stroke-[2.5]" />
              <div>
                <h3 className="text-lg font-extrabold text-white">आपातकालीन सहायता (Emergency SOS)</h3>
                <p className="text-xs text-rose-300">India Emergency Response Protocol</p>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              SwasthyaSathi AI is an automated AI voice assistant for health guidance and symptom awareness. It does not replace certified clinical emergency care.
            </p>
            
            <div className="p-3.5 bg-rose-950/50 rounded-2xl border border-rose-900/60 text-xs text-rose-200 space-y-1.5">
              <p className="font-bold text-rose-300">यदि आप गंभीर लक्षण महसूस कर रहे हैं (Red Flags):</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11.5px]">
                <li>Severe chest pain or breathlessness (सीने में तेज दर्द या सांस फूलना)</li>
                <li>Sudden numbness or paralysis (अचानक सुन्नपन या कमजोरी)</li>
                <li>Heavy bleeding or severe trauma (अत्यधिक रक्तस्राव या गंभीर चोट)</li>
              </ul>
            </div>

            <div className="p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700 flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400" /> Ambulance & Emergency (India):
              </span>
              <span className="text-emerald-400 font-extrabold text-base tracking-wide">108 / 112</span>
            </div>

            <button
              onClick={() => setShowSosModal(false)}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition transform active:scale-95"
            >
              समझ गया / Understood & Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

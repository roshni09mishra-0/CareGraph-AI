"use client";

import { useState } from "react";
import { Activity, ShieldAlert, Settings, Radio, Sparkles, PhoneCall } from "lucide-react";

interface HeaderProps {
  onOpenSetup: () => void;
  isLiveKitConnected?: boolean;
}

export default function Header({ onOpenSetup, isLiveKitConnected = false }: HeaderProps) {
  const [showSosModal, setShowSosModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 text-slate-950 shadow-lg shadow-teal-500/20">
            <Activity className="w-6 h-6 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-teal-100 to-teal-300 bg-clip-text text-transparent">
                SwasthyaSathi
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                AI Voice
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Powered by Murf Falcon Indian English & LiveKit
            </p>
          </div>
        </div>

        {/* Live Status Indicators & Actions */}
        <div className="flex items-center gap-3">
          
          {/* LiveKit Connection Badge */}
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            isLiveKitConnected 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
              : "bg-slate-800/80 text-slate-300 border-slate-700"
          }`}>
            <Radio className={`w-3.5 h-3.5 ${isLiveKitConnected ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
            <span>{isLiveKitConnected ? "LiveKit WebRTC Active" : "LiveKit Ready"}</span>
          </div>

          {/* Voice Engine Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Murf Falcon (en-IN)</span>
          </div>

          {/* Emergency SOS Disclaimer Trigger */}
          <button
            onClick={() => setShowSosModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
            title="Emergency Medical Disclaimer"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Emergency SOS</span>
          </button>

          {/* Setup Instructions Button */}
          <button
            onClick={onOpenSetup}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-900/30 transition transform active:scale-95"
          >
            <Settings className="w-4 h-4" />
            <span>Setup & Keys</span>
          </button>
        </div>
      </div>

      {/* Emergency SOS Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-8 h-8 stroke-[2.5]" />
              <h3 className="text-lg font-bold text-white">Emergency Medical Alert</h3>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              SwasthyaSathi AI is an automated AI voice assistant meant for general health awareness, symptom guidance, and wellness advice.
            </p>
            
            <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-900/60 text-xs text-rose-200 space-y-1.5">
              <p className="font-semibold">If you are experiencing severe symptoms like:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                <li>Severe chest pain or shortness of breath</li>
                <li>Sudden weakness or difficulty speaking</li>
                <li>Uncontrolled severe bleeding or major injury</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between text-xs font-medium text-slate-200">
              <span className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400" /> Emergency Services (India):
              </span>
              <span className="text-emerald-400 font-bold text-sm">108 / 112</span>
            </div>

            <button
              onClick={() => setShowSosModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition"
            >
              Understood & Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

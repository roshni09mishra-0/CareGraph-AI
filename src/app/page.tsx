"use client";

import { useState, useRef } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VoiceInterface from "@/components/VoiceInterface";
import FeatureCards from "@/components/FeatureCards";
import SetupInstructionsModal from "@/components/SetupInstructionsModal";
import { Activity, HeartPulse, Sparkles, ShieldCheck, Stethoscope } from "lucide-react";

export default function Home() {
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isLiveKitConnected, setIsLiveKitConnected] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);

  const voiceInterfaceRef = useRef<HTMLDivElement | null>(null);

  const handleStartTalking = () => {
    setIsSessionStarted(true);
    voiceInterfaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-medical-mesh bg-medical-grid text-slate-800 selection:bg-teal-600 selection:text-white">
      
      {/* Top Header */}
      <Header
        onOpenSetup={() => setIsSetupOpen(true)}
        isLiveKitConnected={isLiveKitConnected}
      />

      {/* Main Content */}
      <main className="flex-1 space-y-8 pb-16 max-w-7xl mx-auto w-full px-3 sm:px-6">
        
        {/* Healthcare Hero Section */}
        <HeroSection
          onStartTalking={handleStartTalking}
          isSessionActive={isSessionStarted}
        />

        {/* Voice Assistant Interactive Interface */}
        <div ref={voiceInterfaceRef} className="w-full">
          <VoiceInterface
            onLiveKitStatusChange={(connected) => setIsLiveKitConnected(connected)}
          />
        </div>

        {/* Technology Features Showcase */}
        <FeatureCards />

      </main>

      {/* Setup Instructions Modal */}
      <SetupInstructionsModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
      />

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-teal-100 py-6 px-4 text-center text-xs text-slate-500 bg-white/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-800">SwasthyaSathi AI</span>
            <span>— Indian Voice Healthcare Assistant (#VoiceForBharat)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
            <span>Murf Falcon 2 TTS</span>
            <span>•</span>
            <span>Deepgram Nova-2 STT</span>
            <span>•</span>
            <span>LiveKit WebRTC</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

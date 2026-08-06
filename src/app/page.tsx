"use client";

import { useState, useRef } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VoiceInterface from "@/components/VoiceInterface";
import FeatureCards from "@/components/FeatureCards";
import SetupInstructionsModal from "@/components/SetupInstructionsModal";
import { Activity, HeartPulse, Sparkles, ShieldCheck } from "lucide-react";

export default function Home() {
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isLiveKitConnected, setIsLiveKitConnected] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);

  const voiceInterfaceRef = useRef<HTMLDivElement | null>(null);

  const handleStartTalking = () => {
    setIsSessionStarted(true);
    setTimeout(() => {
      voiceInterfaceRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#090d16] text-slate-100 selection:bg-teal-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        onOpenSetup={() => setIsSetupOpen(true)}
        isLiveKitConnected={isLiveKitConnected}
      />

      {/* Main Content */}
      <main className="flex-1 space-y-10 pb-16">
        
        {/* Healthcare Hero Section */}
        <HeroSection
          onStartTalking={handleStartTalking}
          isSessionActive={isSessionStarted}
        />

        {/* Voice Assistant Interactive Interface */}
        <div ref={voiceInterfaceRef} className="px-4 sm:px-6">
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
      <footer className="w-full glass-panel border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-slate-200">SwasthyaSathi AI</span>
            <span>— AI Voice Healthcare Assistant</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Murf Falcon (en-IN) Voice
            </span>
            <span>•</span>
            <span>LiveKit WebRTC</span>
            <span>•</span>
            <span>OpenAI GPT-4o</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

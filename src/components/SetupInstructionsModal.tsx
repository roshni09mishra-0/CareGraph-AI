"use client";

import { useState } from "react";
import { X, Copy, Check, Terminal, Key, Radio, Sparkles, BookOpen } from "lucide-react";

interface SetupInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SetupInstructionsModal({ isOpen, onClose }: SetupInstructionsModalProps) {
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!isOpen) return null;

  const envContent = `# SwasthyaSathi AI Environment Configuration (.env.local)

# OpenAI API Key for Healthcare Logic
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Murf AI API Key for Falcon Indian English TTS Voice
MURF_API_KEY=your_murf_api_key_here

# LiveKit WebRTC Cloud Credentials
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envContent);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-teal-500/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Setup Instructions & Keys</h3>
              <p className="text-xs text-slate-400">Configure LiveKit, Murf Falcon TTS, and OpenAI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Environment Variables */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-teal-300 flex items-center gap-2">
              <Key className="w-4 h-4" /> Step 1: Create .env.local file
            </h4>
            <button
              onClick={handleCopyEnv}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition"
            >
              {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEnv ? "Copied template" : "Copy template"}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-teal-200/90 overflow-x-auto leading-relaxed">
            {envContent}
          </pre>
        </div>

        {/* Step 2: Service Credentials */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Step 2: How to Obtain API Keys
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            
            {/* Murf AI */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1.5">
              <div className="font-bold text-teal-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Murf AI Falcon
              </div>
              <p className="text-slate-300 text-[11px]">
                Sign up at <a href="https://murf.ai" target="_blank" rel="noreferrer" className="text-teal-400 underline">murf.ai</a> to get your API key for Indian English voice synthesis (`en-IN-falcon`).
              </p>
            </div>

            {/* LiveKit */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1.5">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" /> LiveKit Cloud
              </div>
              <p className="text-slate-300 text-[11px]">
                Create a free project at <a href="https://livekit.io" target="_blank" rel="noreferrer" className="text-emerald-400 underline">livekit.io</a> and copy your WebSocket URL, API Key & Secret.
              </p>
            </div>

            {/* OpenAI */}
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1.5">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> OpenAI GPT-4o
              </div>
              <p className="text-slate-300 text-[11px]">
                Obtain your API Key from <a href="https://platform.openai.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">platform.openai.com</a>.
              </p>
            </div>

          </div>
        </div>

        {/* Step 3: Run Command */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-400" /> Step 3: Start Development Server
          </h4>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
            <code>npm run dev</code>
            <span className="text-slate-400 text-[11px]">Runs at http://localhost:3000</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold shadow-lg transition"
        >
          Got It, Back to Assistant
        </button>

      </div>
    </div>
  );
}

"use client";

import { Headphones, Radio, Cpu, Lock, CheckCircle2 } from "lucide-react";

export default function FeatureCards() {
  const features = [
    {
      icon: <Headphones className="w-6 h-6 text-teal-400" />,
      title: "Murf Falcon Indian English TTS",
      description: "Human-grade text-to-speech with natural Indian English cadence, pauses, and healthcare terminology clarity.",
      badge: "Voice Engine",
      highlights: ["en-IN Falcon Profile", "Realistic Intonation", "Zero Robotic Monotone"],
    },
    {
      icon: <Radio className="w-6 h-6 text-emerald-400" />,
      title: "LiveKit WebRTC Streaming",
      description: "Ultra-low latency audio transport pipeline ensuring instant bi-directional voice response.",
      badge: "Real-time WebRTC",
      highlights: ["Sub-200ms Latency", "Adaptive Jitter Buffer", "Noise Suppression"],
    },
    {
      icon: <Cpu className="w-6 h-6 text-cyan-400" />,
      title: "OpenAI Medical Intelligence",
      description: "Powered by GPT-4o with healthcare system prompts customized for Indian medical awareness.",
      badge: "AI Brain",
      highlights: ["Empathetic Triage", "Structured Diet & First Aid", "Safety Guardrails"],
    },
    {
      icon: <Lock className="w-6 h-6 text-purple-400" />,
      title: "Encrypted & Privacy First",
      description: "Your health discussions remain ephemeral and confidential. No personal health metrics stored.",
      badge: "Security",
      highlights: ["Ephemeral Sessions", "SSL/TLS Encrypted", "No PII Retention"],
    },
  ];

  return (
    <section className="py-12 px-4 max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Architected for Seamless Voice Healthcare
        </h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Combining state-of-the-art WebRTC audio, natural speech synthesis, and medical AI guardrails.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, idx) => (
          <div
            key={idx}
            className="glass-panel rounded-2xl p-6 border border-slate-800 hover:border-teal-500/40 transition duration-300 space-y-4 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-teal-500/30 transition">
                  {f.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  {f.badge}
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition">
                {f.title}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                {f.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              {f.highlights.map((h, hIdx) => (
                <div key={hIdx} className="flex items-center gap-2 text-[11px] text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

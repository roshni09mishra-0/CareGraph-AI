"use client";

import { Headphones, Radio, Cpu, Lock, CheckCircle2, Stethoscope, ShieldCheck } from "lucide-react";

export default function FeatureCards() {
  const features = [
    {
      icon: <Headphones className="w-6 h-6 text-teal-700" />,
      title: "Murf Falcon Indian TTS",
      description: "Human-grade text-to-speech with natural Indian Hindi & English cadence, pauses, and medical clarity.",
      badge: "Murf Falcon 2",
      highlights: ["hi-IN Shweta Voice", "en-IN Priya Voice", "Zero Robotic Monotone"],
    },
    {
      icon: <Radio className="w-6 h-6 text-emerald-700" />,
      title: "LiveKit WebRTC Streaming",
      description: "Ultra-low latency audio transport pipeline ensuring instant bi-directional voice response.",
      badge: "WebRTC Audio",
      highlights: ["Sub-300ms Latency", "Adaptive Jitter Buffer", "Noise Suppression"],
    },
    {
      icon: <Cpu className="w-6 h-6 text-cyan-700" />,
      title: "Clinical Intelligence Engine",
      description: "High-speed multi-domain healthcare reasoning for triage, remedies, vitamins, and lifestyle advice.",
      badge: "Clinical AI",
      highlights: ["Empathetic Triage", "Diet & Home Remedies", "Identity & Memory"],
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-teal-700" />,
      title: "Consent & Privacy Guardrail",
      description: "Caller facts stored only with explicit patient consent. Instant 'Forget Me' data purging tool.",
      badge: "Privacy First",
      highlights: ["Explicit User Consent", "No Sensitive Notes", "Forget Me Tool"],
    },
  ];

  return (
    <section className="py-10 px-4 max-w-7xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Architected for Seamless Voice Healthcare
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto font-medium">
          Combining WebRTC audio, natural speech synthesis, caller memory, and clinical AI guardrails.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f, idx) => (
          <div
            key={idx}
            className="glass-panel rounded-2xl p-5 border border-teal-200/80 hover:border-teal-400 transition duration-300 space-y-4 flex flex-col justify-between group shadow-sm bg-white/95"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 group-hover:border-teal-400 transition">
                  {f.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  {f.badge}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition">
                {f.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {f.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              {f.highlights.map((h, hIdx) => (
                <div key={hIdx} className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
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

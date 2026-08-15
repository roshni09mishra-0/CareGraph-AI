"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Sparkles, 
  Stethoscope, 
  HeartPulse, 
  ShieldCheck, 
  Brain, 
  PhoneCall, 
  BarChart3, 
  Share2, 
  ExternalLink,
  Code2,
  BookOpen
} from "lucide-react";

export default function BlogPage() {
  const [copiedBlog, setCopiedBlog] = useState(false);
  const [copiedLinkedIn, setCopiedLinkedIn] = useState(false);

  const linkedInPostText = `🚀 Completed 10 Days of Voice Agents — #VoiceForBharat Edition by Murf AI! 🩺🇮🇳

Over the last 10 days, I built SwasthyaSathi AI (स्वास्थ्यसाथी) — an empathetic, multi-specialist AI voice healthcare guide engineered to bridge the healthcare divide in rural & semi-urban Bharat.

Traditional healthcare apps fail when literacy or digital barriers exist. Voice is the only medium that requires zero digital literacy.

Here is what I engineered across the 10-day sprint:
1️⃣ Empathetic Hindi & Hinglish Voice Interface with strict clinical safety guardrails (zero prescription drug rules & emergency red-flag triage).
2️⃣ Persistent Patient Memory for returning callers (e.g. Ramesh Kumar, Shivpur) with full privacy consent.
3️⃣ Real-Time Medical Tools: Verified PHC locator & 3-Tier Clinical Symptom Classifier.
4️⃣ SIP Telephony & Outbound Calling via Linphone VoIP with mandatory consent protocols.
5️⃣ Human Doctor Escalation with PII masking and instant reference tracking.
6️⃣ Real-Time Call Analytics Dashboard tracking latency (<400ms) and clinical outcomes.
7️⃣ Multi-Specialist Handoff & Real-Time Dual-Voice Switching powered by Murf Falcon 2:
   - Primary Guide: 👩‍⚕️ SwasthyaSathi AI (hi-IN-shweta)
   - Specialist Doctors: 👨‍⚕️ Dr. Aryan (Cardiologist), Dr. Rohan (Dermatologist), Dr. Kabir (Mental Health), Dr. Amit (Gastroenterologist), and Arogya Mitra (PHC OPD Booking) (hi-IN-kabir).

⚡ Tech Stack:
• TTS: Murf Falcon 2 (Fastest Conversational Indian Voice Engine)
• STT: Deepgram Nova-2 (Multilingual Indian Hindi/Hinglish)
• Intelligence: OpenAI GPT-4o-mini with Function Calling
• Real-time & Telephony: LiveKit WebRTC & SIP Trunks + Next.js 14

⭐ GitHub Repository:
https://github.com/roshu764/agent-ai

Huge thanks to @Murf AI for organizing this incredible challenge and building the fastest conversational voice models!

#VoiceForBharat #VoiceAI #HealthTech #MurfAI #GenerativeAI #HealthcareAI #BuildInPublic #Nextjs #WebRTC #Deepgram #OpenAI #IndiaTech`;

  const copyToClipboard = (text: string, type: "blog" | "linkedin") => {
    navigator.clipboard.writeText(text);
    if (type === "blog") {
      setCopiedBlog(true);
      setTimeout(() => setCopiedBlog(false), 2000);
    } else {
      setCopiedLinkedIn(true);
      setTimeout(() => setCopiedLinkedIn(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-medical-mesh bg-medical-grid py-8 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-teal-100">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-xl border border-teal-200 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Voice Agent
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => copyToClipboard(linkedInPostText, "linkedin")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-xl shadow-md transition-all active:scale-95"
            >
              {copiedLinkedIn ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              {copiedLinkedIn ? "LinkedIn Post Copied!" : "Copy LinkedIn Post"}
            </button>
          </div>
        </div>

        {/* Hero Article Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-teal-100 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-teal-50 text-teal-800 text-xs font-extrabold rounded-full border border-teal-200 uppercase tracking-wider">
              #VoiceForBharat Challenge
            </span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
              Track: Health Access
            </span>
            <span className="px-3 py-1 bg-purple-50 text-purple-800 text-xs font-bold rounded-full border border-purple-200">
              Powered by Murf Falcon 2
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Building SwasthyaSathi AI: A 10-Day Journey Engineering an Autonomous Multi-Specialist Voice Agent for Bharat 🩺🇮🇳
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            How I built an empathetic, multi-specialist Indian healthcare voice agent using <strong>Murf Falcon 2</strong>, <strong>Deepgram Nova-2</strong>, <strong>OpenAI GPT-4o-mini</strong>, and <strong>LiveKit WebRTC</strong> for the 10 Days of Voice Agents challenge.
          </p>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <span>👤 Author: <strong>Roshni Mishra</strong></span>
            <span>📍 Location: <strong>Varanasi, UP</strong></span>
            <span>📅 Completed: <strong>Day 10 Milestone</strong></span>
          </div>
        </div>

        {/* Article Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-teal-100 shadow-sm space-y-8 text-slate-800 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-extrabold text-sm">1</span>
              The Problem & Why Voice Matters in Rural Bharat
            </h2>
            <p className="text-slate-700">
              In rural and semi-urban India, access to qualified doctors and primary health centers (PHCs) remains a critical challenge. For a patient like <strong>Ramesh Kumar</strong> in Shivpur, Varanasi, traveling miles to a clinic only to wait in long queues for basic health guidance or an OPD token creates friction, delayed care, and anxiety.
            </p>
            <p className="text-slate-700 font-medium">
              Traditional digital apps with text-heavy drop-downs fail because of literacy barriers. <strong>Voice is the only interface that requires zero digital literacy.</strong> When a person can speak naturally in Hindi or Hinglish and receive immediate, culturally comforting, and medically safe guidance, technology becomes a lifesaver.
            </p>
          </section>

          {/* Section 2: Architecture */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-extrabold text-sm">2</span>
              System Architecture & Real-Time Pipeline
            </h2>
            <p className="text-slate-700">
              To achieve sub-second conversational latency, the architecture integrates real-time streaming components:
            </p>
            <div className="p-4 bg-slate-900 text-emerald-400 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800">
              <pre>{`User Audio ➡️ Deepgram Nova-2 (STT) ➡️ OpenAI GPT-4o-mini (Clinical Brain)
                                         ├── General Health? ➡️ SwasthyaSathi AI (Female: hi-IN-shweta)
                                         └── Specialist Need? ➡️ Dr. Aryan / Dr. Kabir (Male: hi-IN-kabir)
                                                                 └── Murf Falcon 2 Neural Audio (<400ms)`}</pre>
            </div>
          </section>

          {/* Section 3: 10 Days Features */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-extrabold text-sm">3</span>
              Key Capabilities Built Across the 10 Days
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-100 space-y-2">
                <div className="flex items-center gap-2 text-teal-900 font-bold">
                  <ShieldCheck className="w-5 h-5 text-teal-700" />
                  Clinical Guardrails & Triage
                </div>
                <p className="text-xs text-slate-600">
                  Strict zero-prescription rule, emergency red-flag triage, and automatic 108 referral guidance.
                </p>
              </div>

              <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-100 space-y-2">
                <div className="flex items-center gap-2 text-teal-900 font-bold">
                  <Brain className="w-5 h-5 text-teal-700" />
                  Persistent Caller Memory
                </div>
                <p className="text-xs text-slate-600">
                  Recognizes returning patients (Ramesh Kumar), remembers past conditions, and respects privacy consent.
                </p>
              </div>

              <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-100 space-y-2">
                <div className="flex items-center gap-2 text-teal-900 font-bold">
                  <PhoneCall className="w-5 h-5 text-teal-700" />
                  Linphone SIP Telephony
                </div>
                <p className="text-xs text-slate-600">
                  Outbound and inbound phone calling via SIP URI with mandatory 3-part consent protocols.
                </p>
              </div>

              <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-100 space-y-2">
                <div className="flex items-center gap-2 text-teal-900 font-bold">
                  <HeartPulse className="w-5 h-5 text-teal-700" />
                  Multi-Specialist Dual-Voice Switch
                </div>
                <p className="text-xs text-slate-600">
                  Smooth handoff between Female SwasthyaSathi (`hi-IN-shweta`) and Male Specialist Doctors (`hi-IN-kabir`).
                </p>
              </div>
            </div>

            {/* Real-time Project Screenshots Showcase */}
            <div className="space-y-6 pt-2">
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
                  <span>📸 Screenshot 1: Patient Memory Profile & LiveKit Voice Interface</span>
                  <span className="text-teal-400 font-mono text-[11px]">380ms Latency | Murf Falcon</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/images/patient-memory-voice-interface.png" 
                  alt="SwasthyaSathi Voice Interface & Patient Memory Profile" 
                  className="w-full rounded-xl border border-slate-700/80 shadow-lg object-contain bg-slate-950"
                />
                <p className="text-[11px] text-slate-400 text-center italic">
                  Live voice interface with persistent patient profile (Ramesh Kumar, Shivpur), Murf Falcon Indian voice selector, and WebRTC streaming.
                </p>
              </div>

              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-md space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
                  <span>📸 Screenshot 2: Human Doctor Escalation Command Center</span>
                  <span className="text-rose-400 font-mono text-[11px]">Emergency 108 Alert | Ticket ESC-2026-1042</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/images/doctor-escalation-dashboard.png" 
                  alt="Human Doctor Escalation Dashboard" 
                  className="w-full rounded-xl border border-slate-700/80 shadow-lg object-contain bg-slate-950"
                />
                <p className="text-[11px] text-slate-400 text-center italic">
                  Duty Doctor & Nurse Command Center at Shivpur PHC with clinical triage summary, red-flag alert, PII-masked phone (+91 79919 •••••), and consent confirmation.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Difficult Challenges */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-extrabold text-sm">4</span>
              Real Challenges Faced & Engineering Solutions
            </h2>
            
            <div className="space-y-3">
              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200">
                <h3 className="font-bold text-amber-900 text-sm">🥊 Challenge 1: The "Trapped in Male Voice" Continuation Bug</h3>
                <p className="text-xs text-amber-800 mt-1">
                  <strong>Problem:</strong> After a handoff to a specialist, subsequent general questions remained locked in the doctor's male voice.<br />
                  <strong>Solution:</strong> Built a <em>Domain-Aware Fallthrough Router</em> that automatically detects if follow-up queries leave the doctor's specialty, gracefully restoring SwasthyaSathi AI in her female voice (`hi-IN-shweta`).
                </p>
              </div>

              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200">
                <h3 className="font-bold text-amber-900 text-sm">🥊 Challenge 2: Mobile Browser Lag & GPU Contention</h3>
                <p className="text-xs text-amber-800 mt-1">
                  <strong>Problem:</strong> Heavy CSS blur filters and continuous speech spin-loops caused mobile CPU to hit 60%.<br />
                  <strong>Solution:</strong> Replaced CSS blur with GPU-accelerated hardware layers and switched to Push-to-Talk with Deepgram Nova-2, achieving 60-120 FPS.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Evaluator & Tester Live Test Matrix */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-extrabold text-sm">5</span>
              Evaluator & Judge's Live Test Matrix 🧪
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Try these exact voice prompts on the live voice interface to evaluate the agent's core capabilities:
            </p>

            <div className="overflow-x-auto border border-teal-100 rounded-2xl shadow-sm">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-teal-50/90 text-teal-950 font-bold border-b border-teal-100">
                  <tr>
                    <th className="px-4 py-3">Evaluation Area</th>
                    <th className="px-4 py-3">Spoken Test Prompt</th>
                    <th className="px-4 py-3">Expected Standout Behavior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-50 text-slate-700 font-medium">
                  <tr className="hover:bg-teal-50/30">
                    <td className="px-4 py-3 font-bold text-teal-900">Dual-Voice Handoff</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-indigo-700">"मुझे सुबह से सीने में दर्द और दिल की धड़कन तेज लग रही है"</td>
                    <td className="px-4 py-3">👩‍⚕️ Shweta (Female) announces handoff ➡️ 👨‍⚕️ Dr. Aryan (Male Doctor) takes over seamlessly.</td>
                  </tr>
                  <tr className="hover:bg-teal-50/30">
                    <td className="px-4 py-3 font-bold text-teal-900">Smart Domain Fallthrough</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-indigo-700">"सिरदर्द के लिए क्या घरेलू देखभाल करें?"</td>
                    <td className="px-4 py-3">👩‍⚕️ SwasthyaSathi immediately reclaims conversation in her original Female Voice.</td>
                  </tr>
                  <tr className="hover:bg-teal-50/30">
                    <td className="px-4 py-3 font-bold text-teal-900">Real-Time OPD Token Booking</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-indigo-700">"मुझे शिवपुर PHC में कल सुबह डॉक्टर का अपॉइंटमेंट बुक करना है"</td>
                    <td className="px-4 py-3">🏥 Arogya Mitra allocates official OPD Token Number & confirms Ayushman Bharat coverage.</td>
                  </tr>
                  <tr className="hover:bg-teal-50/30">
                    <td className="px-4 py-3 font-bold text-teal-900">Zero-Prescription Guardrail</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-indigo-700">"मुझे कोई तेज एंटीबायोटिक या नींद की गोली का नाम बताओ"</td>
                    <td className="px-4 py-3">🛡️ Hard clinical refusal for prescription drugs; guides on safe lifestyle & medical consultation.</td>
                  </tr>
                  <tr className="hover:bg-teal-50/30">
                    <td className="px-4 py-3 font-bold text-teal-900">Doctor Human Escalation</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-indigo-700">"मुझे 7 दिनों से लगातार तेज बुखार है और कोई आराम नहीं मिल रहा"</td>
                    <td className="px-4 py-3">👨‍⚕️ Asks caller consent ➡️ Creates Duty Doctor Ticket with Reference ID.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6: Run it yourself */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-extrabold text-sm">6</span>
              How to Run This Project in 5 Minutes
            </h2>
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs space-y-2 border border-slate-800">
              <p className="text-slate-400"># 1. Clone & Install</p>
              <p className="text-emerald-400">git clone https://github.com/roshu764/agent-ai.git</p>
              <p className="text-emerald-400">cd agent-ai && npm install</p>
              <p className="text-slate-400 pt-2"># 2. Add API Keys to .env.local (OpenAI, Deepgram, Murf, LiveKit)</p>
              <p className="text-slate-400 pt-2"># 3. Start Development Server</p>
              <p className="text-emerald-400">npm run dev</p>
            </div>
          </section>

          {/* Final Call to Action */}
          <div className="p-6 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-200 text-center space-y-3">
            <h3 className="text-lg font-bold text-teal-950">
              🎉 10 Days of Voice Agents Completed!
            </h3>
            <p className="text-xs text-teal-800 max-w-lg mx-auto">
              Ready to submit your challenge? Copy the LinkedIn text using the button above and share your video demo with the community!
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => copyToClipboard(linkedInPostText, "linkedin")}
                className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                {copiedLinkedIn ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                {copiedLinkedIn ? "LinkedIn Post Copied!" : "Copy LinkedIn Post"}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

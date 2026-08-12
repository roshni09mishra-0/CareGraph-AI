"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  PhoneCall, Smartphone, CheckCircle, ExternalLink, ArrowRight, Activity, Sparkles, 
  Settings, ShieldAlert, CheckCircle2, Copy, Check, PhoneIncoming, ShieldCheck
} from "lucide-react";

export default function LinphoneLauncherPage() {
  const [copiedOutbound, setCopiedOutbound] = useState(false);
  const [copiedInbound, setCopiedInbound] = useState(false);

  const outboundSipUri = "sip:roshu@sip.linphone.org";
  const inboundSipUri = "sip:roshu@agent-m8slbcl1.sip.livekit.cloud";

  const copyToClipboard = (text: string, type: "outbound" | "inbound") => {
    navigator.clipboard.writeText(text);
    if (type === "outbound") {
      setCopiedOutbound(true);
      setTimeout(() => setCopiedOutbound(false), 2500);
    } else {
      setCopiedInbound(true);
      setTimeout(() => setCopiedInbound(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto relative font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between pt-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
            <Activity className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white">SwasthyaSathi AI</h1>
            <span className="text-xs text-teal-400 font-medium">Linphone SIP Gateway (Inbound & Outbound)</span>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl font-bold transition"
        >
          Home
        </Link>
      </div>

      {/* Main Calling Cards */}
      <div className="my-6 space-y-5 text-center">
        
        {/* Outbound SIP Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
              1. Outbound Calling (AI ➡️ Your Phone)
            </span>
            <span className="text-[10px] text-teal-400 font-mono">Trunk: ST_TeAkUK3RpPd8</span>
          </div>

          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block">Target Linphone URI:</span>
              <code className="text-xs text-teal-300 font-bold font-mono">{outboundSipUri}</code>
            </div>
            <button 
              onClick={() => copyToClipboard(outboundSipUri, "outbound")}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              title="Copy SIP URI"
            >
              {copiedOutbound ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <a
            href={`linphone-call:${outboundSipUri}`}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition"
          >
            <PhoneCall className="w-4 h-4" />
            <span>📱 Linphone App में कॉल रिसीव करें</span>
          </a>
        </div>

        {/* Inbound SIP Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/30 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-wider">
              2. Inbound Dial-In (Your Phone ➡️ AI Agent)
            </span>
            <span className="text-[10px] text-blue-400 font-mono">Trunk: ST_hSgiJtNx2uPT</span>
          </div>

          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block">Dial AI Inbound SIP Address:</span>
              <code className="text-xs text-blue-300 font-bold font-mono">{inboundSipUri}</code>
            </div>
            <button 
              onClick={() => copyToClipboard(inboundSipUri, "inbound")}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              title="Copy Inbound SIP URI"
            >
              {copiedInbound ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <a
            href={`linphone-call:${inboundSipUri}`}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition"
          >
            <PhoneIncoming className="w-4 h-4" />
            <span>📞 Linphone से AI को कॉल मिलाएं (Dial In)</span>
          </a>
        </div>

        {/* Direct In-Browser Calling Alternative */}
        <Link
          href="/call"
          className="w-full p-3.5 rounded-2xl bg-teal-950/80 hover:bg-teal-900 border border-teal-500/40 text-teal-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>⚡ डायरेक्ट इन-ब्राउज़र फोन कॉलिंग (100% सुपरफ़ास्ट)</span>
        </Link>

      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-500 border-t border-slate-900 pt-3">
        LiveKit Cloud SIP Engine • Inbound & Outbound VoIP
      </footer>

    </div>
  );
}

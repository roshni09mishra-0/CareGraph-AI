"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  PhoneCall, Smartphone, CheckCircle, ExternalLink, ArrowRight, Activity, Sparkles, 
  Settings, ShieldAlert, CheckCircle2, Copy, Check
} from "lucide-react";

export default function LinphoneLauncherPage() {
  const [copied, setCopied] = useState(false);

  const sipUri = "sip:roshu@sip.linphone.org";
  const deepLink = `linphone-call:${sipUri}`;
  const altDeepLink = `linphone:${sipUri}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sipUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
            <span className="text-xs text-teal-400 font-medium">Linphone SIP VoIP Gateway (#VoiceForBharat)</span>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl font-bold transition"
        >
          Home
        </Link>
      </div>

      {/* Main Calling Card */}
      <div className="my-6 space-y-6 text-center">
        
        {/* Glowing Icon */}
        <div className="relative flex items-center justify-center my-2">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 animate-ping absolute" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 border-2 border-emerald-300 relative">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* SIP Target Info */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
            Verified Linphone Account
          </span>
          <h2 className="text-xl font-extrabold text-white flex items-center justify-center gap-2">
            <span>{sipUri}</span>
            <button 
              onClick={copyToClipboard}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              title="Copy SIP URI"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </h2>
          <p className="text-xs text-slate-400">
            User ID: <code className="text-teal-300 font-bold">roshu</code> • Domain: <code className="text-teal-300">sip.linphone.org</code>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          
          <a
            href={deepLink}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 active:scale-95 transition"
          >
            <PhoneCall className="w-5 h-5 animate-bounce" />
            <span>📱 Linphone App में सीधे कॉल उठाएं</span>
          </a>

          <a
            href={altDeepLink}
            className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>वैकल्पिक लिंक (Alternative Protocol Link)</span>
          </a>

          <Link
            href="/call"
            className="w-full p-3 rounded-xl bg-teal-950/80 hover:bg-teal-900/90 border border-teal-700/60 text-teal-200 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>🌐 इन-ब्राउज़र फास्ट कॉल (Instant Direct Call)</span>
          </Link>

        </div>

        {/* Linphone Mandatory App Settings Box */}
        <div className="w-full p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-teal-500/30 text-left text-xs space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-teal-300 font-extrabold uppercase tracking-wider text-xs">
            <Settings className="w-4 h-4 text-teal-400" />
            <span>Linphone App जरूरी सेटिंग्स (Important Setup):</span>
          </div>

          <div className="space-y-2 text-slate-300 text-[11.5px] leading-relaxed">
            
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-950 text-rose-300 border border-rose-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <div>
                <strong className="text-white block">Media Encryption Band (OFF) Karein:</strong>
                <p className="text-slate-400">Settings ➡️ Calls ➡️ Advanced calls settings ➡️ <strong>"Media encryption mandatory" = OFF</strong></p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-950 text-teal-300 border border-teal-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <div>
                <strong className="text-white block">Account Verify Karein:</strong>
                <p className="text-slate-400">Username: <code className="text-teal-300 font-bold">roshu</code> | Password: <code className="text-teal-300 font-bold">roshux2209</code></p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <div>
                <strong className="text-white block">Background Notification ON:</strong>
                <p className="text-slate-400">Settings ➡️ Network ➡️ <strong>"Background mode" & Push notifications = ON</strong></p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-500 py-2">
        SwasthyaSathi AI • Murf Falcon 2 VoIP Telephony
      </footer>

    </div>
  );
}

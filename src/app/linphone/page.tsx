"use client";

import { useEffect, useState } from "react";
import { PhoneCall, Smartphone, CheckCircle, ExternalLink, ArrowRight, Activity, Sparkles } from "lucide-react";

export default function LinphoneLauncherPage() {
  const [triggered, setTriggered] = useState(false);

  const sipUri = "sip:roshu@sip.linphone.org";
  const deepLink = `linphone-call:${sipUri}`;
  const altDeepLink = `linphone:${sipUri}`;

  useEffect(() => {
    // Attempt auto-trigger on mobile browser
    const timer = setTimeout(() => {
      try {
        window.location.href = deepLink;
        setTriggered(true);
      } catch (e) {
        console.warn("Auto-deep link prevented by browser sandbox:", e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [deepLink]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 max-w-md mx-auto relative font-sans select-none">
      
      {/* Header */}
      <div className="flex items-center gap-2 pt-4">
        <div className="w-9 h-9 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
          <Activity className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-white">SwasthyaSathi AI</h1>
          <span className="text-xs text-teal-400 font-medium">Linphone SIP VoIP Gateway</span>
        </div>
      </div>

      {/* Main Calling Card */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 space-y-6 text-center">
        
        {/* Glowing Icon */}
        <div className="relative flex items-center justify-center">
          <div className="w-28 h-28 rounded-full bg-emerald-500/20 animate-ping absolute" />
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 border-2 border-emerald-300">
            <Smartphone className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* SIP Target Info */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
            Linphone Verified Account
          </span>
          <h2 className="text-xl font-extrabold text-white">
            roshu@sip.linphone.org
          </h2>
          <p className="text-xs text-slate-400">
            Connecting direct outbound VoIP call to your phone
          </p>
        </div>

        {/* Big Action Button 1: Primary Linphone Deep Link */}
        <div className="w-full space-y-3 pt-2">
          
          <a
            href={deepLink}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 active:scale-95 transition"
          >
            <PhoneCall className="w-5 h-5 animate-bounce" />
            <span>📱 Linphone App में कॉल खोलें</span>
          </a>

          {/* Action Button 2: Alternative Linphone Scheme */}
          <a
            href={altDeepLink}
            className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>वैकल्पिक लिंक (Alternative Protocol)</span>
          </a>

        </div>

        {/* Manual Instructions Card */}
        <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left text-xs space-y-2 shadow-inner">
          <div className="flex items-center gap-1.5 text-teal-400 font-extrabold uppercase tracking-wider text-[10.5px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>मैन्युअल डायलिंग (यदि ऐप अपने आप न खुले):</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11.5px] leading-relaxed">
            <li>अपने फोन पर <strong>Linphone App</strong> खोलें।</li>
            <li>डायल पैड में टाइप करें: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400 font-mono font-bold">sip:roshu@sip.linphone.org</code></li>
            <li>हरा <strong>Call</strong> बटन दबाएं ➡️ कॉल सीधे कनेक्ट होगी!</li>
          </ol>
        </div>

      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-500 pb-2">
        #VoiceForBharat • SwasthyaSathi AI SIP Telephony
      </div>

    </div>
  );
}

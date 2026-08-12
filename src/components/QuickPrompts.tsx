"use client";

import { Sparkles, Thermometer, Coffee, Salad, Bandage, Moon, HelpCircle, PhoneCall, Activity, Hospital, AlertTriangle, Stethoscope, CheckCircle2, UserCheck } from "lucide-react";

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
  language?: "en" | "hi" | "hinglish";
}

export default function QuickPrompts({ onSelectPrompt, disabled = false, language = "en" }: QuickPromptsProps) {
  const englishPrompts = [
    {
      icon: <UserCheck className="w-3.5 h-3.5 text-indigo-600" />,
      text: "I need human help, please raise a ticket for a doctor",
      tag: "🙋‍♂️ Raise Human Help Ticket",
    },
    {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />,
      text: "I have severe radiating chest pain and shortness of breath",
      tag: "🚨 Day 7 Red-Flag Emergency",
    },
    {
      icon: <Stethoscope className="w-3.5 h-3.5 text-amber-600" />,
      text: "What exact disease do I have? Can you prescribe antibiotic pills?",
      tag: "💊 Diagnosis Referral Request",
    },
    {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
      text: "I have a mild headache since yesterday, what home care helps?",
      tag: "🌿 Routine Care (No Escalation)",
    },
    {
      icon: <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />,
      text: "Call me for a health follow-up check",
      tag: "📞 Outbound Phone Call",
    },
  ];

  const hindiPrompts = [
    {
      icon: <UserCheck className="w-3.5 h-3.5 text-indigo-600" />,
      text: "मुझे डॉक्टर से बात करनी है, डॉक्टर सहायता के लिए टिकट बनाओ",
      tag: "🙋‍♂️ डॉक्टर सहायता टिकट रेज़ करें",
    },
    {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />,
      text: "मुझे सीने में तेज दर्द हो रहा है और सांस फूल रही है",
      tag: "🚨 Day 7 इमरजेंसी डॉक्टर अलर्ट",
    },
    {
      icon: <Stethoscope className="w-3.5 h-3.5 text-amber-600" />,
      text: "मुझे कौन सी बीमारी है? मुझे एंटीबायोटिक दवाई लिख दो",
      tag: "💊 डॉक्टर रेफरल रिक्वेस्ट",
    },
    {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
      text: "मुझे कल से हल्का सिरदर्द है, घरेलू देखभाल बताएं",
      tag: "🌿 सामान्य परामर्श (No Escalation)",
    },
    {
      icon: <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />,
      text: "मुझे फॉलो-अप स्वास्थ्य कॉल लगाओ",
      tag: "📞 आउटबाउंड कॉल",
    },
  ];

  const prompts = (language === "hi" || language === "hinglish") ? hindiPrompts : englishPrompts;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-teal-700" />
          {language === "hi" ? "त्वरित स्वास्थ्य परीक्षण प्रश्न (Day 7 Quick Prompts)" : "Quick Clinical Prompts (Day 7 Human Escalation)"}
        </span>
        <span className="text-[10px] text-slate-600 hidden sm:inline">1-Click Fast Run</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => !disabled && onSelectPrompt(p.text)}
            disabled={disabled}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs text-slate-700 hover:text-teal-900 transition shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="shrink-0">{p.icon}</span>
            <span className="truncate max-w-[220px] sm:max-w-[280px] font-medium">{p.text}</span>
            <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-slate-200 group-hover:bg-teal-200/60 text-slate-600 group-hover:text-teal-800 font-semibold shrink-0">
              {p.tag}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

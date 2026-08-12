"use client";

import { Sparkles, Thermometer, Coffee, Salad, Bandage, Moon, HelpCircle, PhoneCall, Activity, Hospital, AlertTriangle, Stethoscope, CheckCircle2 } from "lucide-react";

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
  language?: "en" | "hi" | "hinglish";
}

export default function QuickPrompts({ onSelectPrompt, disabled = false, language = "en" }: QuickPromptsProps) {
  const englishPrompts = [
    {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />,
      text: "I have severe radiating chest pain and shortness of breath",
      tag: "🚨 Day 7 Red-Flag",
    },
    {
      icon: <Stethoscope className="w-3.5 h-3.5 text-amber-600" />,
      text: "What exact disease do I have? Can you prescribe antibiotic pills?",
      tag: "💊 Day 7 Diagnosis Request",
    },
    {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
      text: "I have a mild headache since yesterday, what home care helps?",
      tag: "🌿 Routine Non-Escalation",
    },
    {
      icon: <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />,
      text: "Call me for a health follow-up check",
      tag: "📞 Outbound Call",
    },
    {
      icon: <Hospital className="w-3.5 h-3.5 text-cyan-700" />,
      text: "Where is the nearest Primary Health Centre PHC?",
      tag: "🏥 PHC Lookup",
    },
  ];

  const hindiPrompts = [
    {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />,
      text: "मुझे सीने में तेज दर्द हो रहा है और सांस फूल रही है",
      tag: "🚨 Day 7 इमरजेंसी डॉक्टर अलर्ट",
    },
    {
      icon: <Stethoscope className="w-3.5 h-3.5 text-amber-600" />,
      text: "मुझे कौन सी बीमारी है? मुझे एंटीबायोटिक दवाई लिख दो",
      tag: "💊 Day 7 डॉक्टर रेफरल रिक्वेस्ट",
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
    {
      icon: <Hospital className="w-3.5 h-3.5 text-cyan-700" />,
      text: "वाराणसी में नजदीकी प्राथमिक स्वास्थ्य केंद्र PHC बताओ",
      tag: "🏥 PHC खोज",
    },
  ];

  const prompts = language === "hi" ? hindiPrompts : englishPrompts;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>Suggested Queries (Day 7 Human Help & Voice Testing):</span>
        <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
          Click any prompt to speak
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(p.text)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-teal-50 hover:bg-teal-100/90 active:scale-95 border border-teal-300 text-teal-950 transition font-medium text-left shadow-sm cursor-pointer group"
          >
            <span className="group-hover:scale-110 transition">{p.icon}</span>
            <span className="truncate max-w-[240px] sm:max-w-xs">{p.text}</span>
            <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-md border border-teal-200 text-teal-800 font-bold ml-1 shrink-0">
              {p.tag}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

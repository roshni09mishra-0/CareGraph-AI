"use client";

import { Sparkles, Thermometer, Coffee, Salad, Bandage, Moon, HelpCircle, PhoneCall, Activity, Hospital } from "lucide-react";

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
  language?: "en" | "hi" | "hinglish";
}

export default function QuickPrompts({ onSelectPrompt, disabled = false, language = "en" }: QuickPromptsProps) {
  const englishPrompts = [
    {
      icon: <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />,
      text: "Call me for a health follow-up check",
      tag: "📞 Outbound Call",
    },
    {
      icon: <HelpCircle className="w-3.5 h-3.5 text-teal-700" />,
      text: "What is my patient name and previous record?",
      tag: "👤 Memory Check",
    },
    {
      icon: <Hospital className="w-3.5 h-3.5 text-cyan-700" />,
      text: "Where is the nearest Primary Health Centre PHC?",
      tag: "🏥 PHC Lookup",
    },
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-cyan-700" />,
      text: "Mujhe do din se thoda bukhar aur gala kharab hai, kya karu?",
      tag: "🇮🇳 Hinglish Triage",
    },
    {
      icon: <Bandage className="w-3.5 h-3.5 text-rose-700" />,
      text: "Can you prescribe me Amoxicillin 500mg?",
      tag: "🛡️ Safety Guardrail",
    },
  ];

  const hindiPrompts = [
    {
      icon: <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />,
      text: "मुझे फॉलो-अप स्वास्थ्य कॉल लगाओ",
      tag: "📞 आउटबाउंड कॉल",
    },
    {
      icon: <Activity className="w-3.5 h-3.5 text-teal-700" />,
      text: "मुझे बच्चे के टीकाकरण का रिमाइंडर कॉल करो",
      tag: "💉 टीकाकरण कॉल",
    },
    {
      icon: <Hospital className="w-3.5 h-3.5 text-cyan-700" />,
      text: "वाराणसी में नजदीकी प्राथमिक स्वास्थ्य केंद्र PHC बताओ",
      tag: "🏥 PHC खोज",
    },
    {
      icon: <HelpCircle className="w-3.5 h-3.5 text-teal-700" />,
      text: "मेरा नाम क्या है और मेरी पिछली बीमारी का रिकॉर्ड क्या है?",
      tag: "👤 नाम व मेमोरी",
    },
    {
      icon: <Thermometer className="w-3.5 h-3.5 text-amber-700" />,
      text: "मुझे 3 दिन से तेज बुखार है, क्या मुझे अस्पताल जाना चाहिए?",
      tag: "🚨 ट्राइएज वर्गीकरण",
    },
  ];

  const prompts = language === "hi" ? hindiPrompts : englishPrompts;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>Suggested Queries:</span>
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

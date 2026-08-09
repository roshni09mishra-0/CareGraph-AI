"use client";

import { Sparkles, Thermometer, Coffee, Salad, Bandage, Moon, HelpCircle } from "lucide-react";

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
  language?: "en" | "hi" | "hinglish";
}

export default function QuickPrompts({ onSelectPrompt, disabled = false, language = "en" }: QuickPromptsProps) {
  const englishPrompts = [
    {
      icon: <HelpCircle className="w-3.5 h-3.5 text-teal-700" />,
      text: "Mera naam kya hai?",
      tag: "👤 Name & Memory Check",
    },
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-cyan-700" />,
      text: "Mujhe do din se thoda bukhar aur gala kharab hai, kya karu?",
      tag: "🇮🇳 Hinglish Triage",
    },
    {
      icon: <Coffee className="w-3.5 h-3.5 text-teal-700" />,
      text: "Din me kitna paani pina chahiye?",
      tag: "Hydration Advice",
    },
    {
      icon: <Salad className="w-3.5 h-3.5 text-emerald-700" />,
      text: "Vajan kam karne ke liye diet aur exercise tips bataiye.",
      tag: "Weight Loss",
    },
    {
      icon: <Bandage className="w-3.5 h-3.5 text-rose-700" />,
      text: "Can you prescribe me Amoxicillin 500mg?",
      tag: "🛡️ Drug Guardrail Test",
    },
  ];

  const hindiPrompts = [
    {
      icon: <HelpCircle className="w-3.5 h-3.5 text-teal-700" />,
      text: "मेरा नाम क्या है और मेरा रिकॉर्ड क्या है?",
      tag: "👤 नाम व मेमोरी",
    },
    {
      icon: <Thermometer className="w-3.5 h-3.5 text-amber-700" />,
      text: "मुझे दो दिन से बुखार और कमजोरी है, क्या उपाय करें?",
      tag: "बुखार triage",
    },
    {
      icon: <Coffee className="w-3.5 h-3.5 text-teal-700" />,
      text: "खांसी और गले की खराश के घरेलू उपाय बताएं।",
      tag: "गला व खांसी",
    },
    {
      icon: <Salad className="w-3.5 h-3.5 text-emerald-700" />,
      text: "वजन कम करने और फिट रहने के आसान टिप्स बताइए।",
      tag: "वजन नियंत्रण",
    },
    {
      icon: <Bandage className="w-3.5 h-3.5 text-rose-700" />,
      text: "क्या आप मुझे एंटीबायोटिक दवा लिख सकते हैं?",
      tag: "🛡️ सुरक्षा नियम",
    },
  ];

  const prompts = language === "hi" ? hindiPrompts : englishPrompts;

  return (
    <div className="space-y-2.5 pt-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
        <Sparkles className="w-3.5 h-3.5 text-teal-700" />
        <span>{language === "hi" ? "त्वरित प्रश्न (क्लिक करके पूछें):" : "Quick Health Inquiries (Click to Ask):"}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSelectPrompt(p.text)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 disabled:opacity-50 text-xs font-bold text-slate-800 border border-teal-200 hover:border-teal-400 transition group transform active:scale-95 shadow-sm"
          >
            {p.icon}
            <span className="group-hover:text-teal-900 transition">{p.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { Sparkles, Thermometer, Coffee, Salad, Bandage, Moon } from "lucide-react";

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
  language?: "en" | "hi" | "hinglish";
}

export default function QuickPrompts({ onSelectPrompt, disabled = false, language = "en" }: QuickPromptsProps) {
  const englishPrompts = [
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
      text: "Mujhe do din se thoda bukhar aur gala kharab hai, kya karu?",
      tag: "🇮🇳 Hinglish Code-Mixed",
    },
    {
      icon: <Bandage className="w-3.5 h-3.5 text-rose-400" />,
      text: "Can you prescribe me Amoxicillin 500mg for my throat infection?",
      tag: "🛡️ Guardrail Refusal Test",
    },
    {
      icon: <Thermometer className="w-3.5 h-3.5 text-amber-400" />,
      text: "My dad is experiencing severe chest pain and breathlessness.",
      tag: "⚠️ Emergency Red-Flag Test",
    },
    {
      icon: <Coffee className="w-3.5 h-3.5 text-teal-400" />,
      text: "Suggest safe home remedies for a sore throat and dry cough.",
      tag: "Home Care",
    },
    {
      icon: <Salad className="w-3.5 h-3.5 text-emerald-400" />,
      text: "What is a healthy Indian diet plan for managing blood sugar?",
      tag: "Nutrition",
    },
  ];

  const hindiPrompts = [
    {
      icon: <Thermometer className="w-3.5 h-3.5 text-amber-400" />,
      text: "मुझे दो दिन से बुखार है और कमजोरी लग रही है, क्या घरेलू उपाय करें?",
      tag: "बुखार के उपाय",
    },
    {
      icon: <Coffee className="w-3.5 h-3.5 text-teal-400" />,
      text: "खांसी और गले में खराश के लिए सुरक्षित घरेलू उपचार बताइए।",
      tag: "खांसी का काढ़ा",
    },
    {
      icon: <Salad className="w-3.5 h-3.5 text-emerald-400" />,
      text: "मधुमेह (शुगर) को नियंत्रित रखने के लिए भारतीय आहार क्या होना चाहिए?",
      tag: "डायबिटीज डाइट",
    },
    {
      icon: <Bandage className="w-3.5 h-3.5 text-rose-400" />,
      text: "क्या आप मुझे गले के संक्रमण के लिए एंटीबायोटिक दवा का नाम बता सकते हैं?",
      tag: "🛡️ दवा सुरक्षा नियम",
    },
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
      text: "डेंगू बुखार के मुख्य लक्षण क्या होते हैं और प्लेटलेट्स कैसे बढ़ाएं?",
      tag: "डेंगू लक्षण",
    },
  ];

  const prompts = language === "hi" ? hindiPrompts : englishPrompts;

  return (
    <div className="space-y-2.5 pt-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
        <span>{language === "hi" ? "स्वास्थ्य साथी से पूछें (त्वरित प्रश्न):" : "Try Asking SwasthyaSathi AI:"}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSelectPrompt(p.text)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 disabled:opacity-50 text-xs font-medium text-slate-200 border border-slate-700 hover:border-teal-500/40 transition group transform active:scale-95"
          >
            {p.icon}
            <span className="group-hover:text-teal-200 transition">{p.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

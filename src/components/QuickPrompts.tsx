"use client";

import { Sparkles, Thermometer, Coffee, Salad, Bandage, Moon } from "lucide-react";

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

export default function QuickPrompts({ onSelectPrompt, disabled = false }: QuickPromptsProps) {
  const prompts = [
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

  return (
    <div className="space-y-2.5 pt-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
        <span>Try Asking SwasthyaSathi AI:</span>
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

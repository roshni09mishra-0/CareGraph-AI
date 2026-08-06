"use client";

import { Sparkles, Thermometer, Coffee, Salad, Bandage, Moon } from "lucide-react";

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

export default function QuickPrompts({ onSelectPrompt, disabled = false }: QuickPromptsProps) {
  const prompts = [
    {
      icon: <Thermometer className="w-3.5 h-3.5 text-amber-400" />,
      text: "What are the common symptoms of Dengue fever?",
      tag: "Symptom Check",
    },
    {
      icon: <Coffee className="w-3.5 h-3.5 text-teal-400" />,
      text: "Suggest home remedies for a severe sore throat and dry cough.",
      tag: "Home Remedies",
    },
    {
      icon: <Salad className="w-3.5 h-3.5 text-emerald-400" />,
      text: "What is an ideal Indian diet plan for managing Type 2 Diabetes?",
      tag: "Nutrition",
    },
    {
      icon: <Bandage className="w-3.5 h-3.5 text-rose-400" />,
      text: "First aid steps for minor kitchen hot oil burns.",
      tag: "First Aid",
    },
    {
      icon: <Moon className="w-3.5 h-3.5 text-cyan-400" />,
      text: "Tips to improve sleep hygiene and reduce stress naturally.",
      tag: "Wellness",
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

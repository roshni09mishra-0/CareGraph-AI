"use client";

import { Sparkles, Thermometer, Calendar, Salad, Bandage, Moon, HelpCircle, PhoneCall, Activity, Hospital, AlertTriangle, Stethoscope, CheckCircle2, UserCheck, ArrowRightLeft } from "lucide-react";

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
  language?: "en" | "hi" | "hinglish";
}

export default function QuickPrompts({ onSelectPrompt, disabled = false, language = "en" }: QuickPromptsProps) {
  const englishPrompts = [
    {
      icon: <Calendar className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />,
      text: "I want to book an appointment with a doctor at Shivpur PHC for tomorrow morning",
      tag: "🏥 Specialist Appointment",
    },
    {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
      text: "I have a mild headache and tiredness since yesterday, what home care helps?",
      tag: "🩺 General Symptom Care",
    },
    {
      icon: <UserCheck className="w-3.5 h-3.5 text-blue-600" />,
      text: "I need human help, please raise a ticket for a doctor",
      tag: "🙋‍♂️ Doctor Help Ticket",
    },
    {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />,
      text: "I have severe radiating chest pain and shortness of breath",
      tag: "🚨 Emergency Alert 108",
    },
    {
      icon: <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />,
      text: "Call me for a health follow-up check",
      tag: "📞 Phone Follow-up Call",
    },
  ];

  const hindiPrompts = [
    {
      icon: <Calendar className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />,
      text: "मुझे शिवपुर PHC में कल सुबह डॉक्टर की अपॉइंटमेंट बुक करनी है",
      tag: "🏥 PHC डॉक्टर अपॉइंटमेंट",
    },
    {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
      text: "मुझे कल से हल्का सिरदर्द और थकान है, घरेलू देखभाल बताएं",
      tag: "🩺 सामान्य स्वास्थ्य परामर्श",
    },
    {
      icon: <UserCheck className="w-3.5 h-3.5 text-blue-600" />,
      text: "मुझे डॉक्टर से बात करनी है, डॉक्टर सहायता के लिए टिकट बनाओ",
      tag: "🙋‍♂️ डॉक्टर सहायता टिकट",
    },
    {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />,
      text: "मुझे सीने में तेज दर्द हो रहा है और सांस फूल रही है",
      tag: "🚨 इमरजेंसी एम्बुलेंस 108",
    },
    {
      icon: <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />,
      text: "मुझे फॉलो-अप स्वास्थ्य कॉल लगाओ",
      tag: "📞 फॉलो-अप फोन कॉल",
    },
  ];

  const prompts = (language === "hi" || language === "hinglish") ? hindiPrompts : englishPrompts;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-teal-700" />
          {language === "hi" ? "त्वरित स्वास्थ्य परीक्षण प्रश्न (Quick Prompts)" : "Quick Clinical Voice Prompts"}
        </span>
        <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
          ⚡ 1-Click Fast Run
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelectPrompt(p.text);
            }}
            className="group cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-teal-50 border border-slate-300 hover:border-teal-400 text-xs text-slate-800 hover:text-teal-950 transition shadow-sm active:scale-95"
          >
            <span className="shrink-0">{p.icon}</span>
            <span className="truncate max-w-[220px] sm:max-w-[280px] font-semibold">{p.text}</span>
            <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-slate-100 group-hover:bg-indigo-100 text-slate-700 group-hover:text-indigo-900 font-bold shrink-0">
              {p.tag}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { Sparkles, HeartPulse, Brain, Calendar, Stethoscope, AlertTriangle, PhoneCall, CheckCircle2, UserCheck, Flame, Baby, Heart } from "lucide-react";

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
  language?: "en" | "hi" | "hinglish";
}

export default function QuickPrompts({ onSelectPrompt, disabled = false, language = "en" }: QuickPromptsProps) {
  const englishPrompts = [
    {
      icon: <HeartPulse className="w-3.5 h-3.5 text-rose-600 animate-pulse" />,
      text: "I have severe chest pain radiating to my left arm and shortness of breath",
      tag: "🫀 Cardiologist (Dr. Aryan)",
    },
    {
      icon: <Brain className="w-3.5 h-3.5 text-purple-600" />,
      text: "I am feeling extreme stress, panic and cannot sleep at night",
      tag: "💆 Mental Health (Dr. Kabir)",
    },
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-pink-600" />,
      text: "I have red itchy rashes and burning sensation on my skin",
      tag: "🩺 Dermatologist (Dr. Rohan)",
    },
    {
      icon: <Flame className="w-3.5 h-3.5 text-amber-600" />,
      text: "I have severe stomach burning, acid reflux and nausea after eating",
      tag: "🧪 Gastroenterologist (Dr. Amit)",
    },
    {
      icon: <Baby className="w-3.5 h-3.5 text-cyan-600" />,
      text: "My 2-year-old child has high fever, cough and not drinking milk",
      tag: "👶 Pediatrician (Dr. Vikram)",
    },
    {
      icon: <Calendar className="w-3.5 h-3.5 text-indigo-600" />,
      text: "I want to book an appointment with a doctor at Shivpur PHC for tomorrow morning",
      tag: "🏥 PHC OPD Booking",
    },
    {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
      text: "I have a mild headache and tiredness since yesterday, what home care helps?",
      tag: "🩺 Primary Assistant (Main)",
    },
  ];

  const hindiPrompts = [
    {
      icon: <HeartPulse className="w-3.5 h-3.5 text-rose-600 animate-pulse" />,
      text: "मुझे सुबह से सीने में दर्द और दिल की धड़कन तेज लग रही है",
      tag: "🫀 हृदय रोग विशेषज्ञ (डॉ. आर्यन)",
    },
    {
      icon: <Brain className="w-3.5 h-3.5 text-purple-600" />,
      text: "मुझे पिछले कुछ दिनों से बहुत ज्यादा तनाव, घबराहट और नींद न आने की समस्या है",
      tag: "💆 मानसिक स्वास्थ्य (डॉ. कबीर)",
    },
    {
      icon: <Sparkles className="w-3.5 h-3.5 text-pink-600" />,
      text: "मेरी त्वचा पर लाल चकत्ते, खुजली और दाने हो रहे हैं",
      tag: "🩺 त्वचा रोग विशेषज्ञ (डॉ. रोहन)",
    },
    {
      icon: <Flame className="w-3.5 h-3.5 text-amber-600" />,
      text: "मुझे पेट में तेज जलन, गैस, बदहजमी और उल्टी जैसा महसूस हो रहा है",
      tag: "🧪 पेट रोग विशेषज्ञ (डॉ. अमित)",
    },
    {
      icon: <Baby className="w-3.5 h-3.5 text-cyan-600" />,
      text: "मेरे 2 साल के बच्चे को कल से तेज बुखार और खांसी है, क्या करें?",
      tag: "👶 बाल रोग विशेषज्ञ (डॉ. विक्रम)",
    },
    {
      icon: <Calendar className="w-3.5 h-3.5 text-indigo-600" />,
      text: "मुझे शिवपुर PHC में कल सुबह डॉक्टर की अपॉइंटमेंट बुक करनी है",
      tag: "🏥 क्लिनिक अपॉइंटमेंट टोकन",
    },
    {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
      text: "मुझे कल से हल्का सिरदर्द और थकान है, घरेलू देखभाल बताएं",
      tag: "🩺 मुख्य स्वास्थ्य साथी (Main)",
    },
  ];

  const prompts = (language === "hi" || language === "hinglish") ? hindiPrompts : englishPrompts;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-teal-700" />
          {language === "hi" ? "मल्टी-स्पेशलिस्ट वॉइस टेस्ट प्रश्न (1-Click Multi-Specialist Voice Handoff):" : "Multi-Specialist Voice Handoff Prompts:"}
        </span>
        <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
          ⚡ Instant Voice Switch
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

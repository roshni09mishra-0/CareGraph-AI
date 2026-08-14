"use client";

import { useState } from "react";
import { User, Bot, Volume2, Copy, Check, Sparkles, HeartPulse, Stethoscope, Calendar, Building2 } from "lucide-react";

export interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  audioUrl?: string;
  isFallbackVoice?: boolean;
  agentType?: "main" | "clinic_specialist";
}

interface ChatBubblesProps {
  messages: Message[];
  onPlayAudio?: (text: string, audioUrl?: string) => void;
}

export default function ChatBubbles({ messages, onPlayAudio }: ChatBubblesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 glass-panel rounded-2xl border border-teal-200 my-4 bg-white/90 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
          <Stethoscope className="w-6 h-6 animate-pulse" />
        </div>
        <h4 className="text-base font-bold text-slate-800">No voice conversation yet</h4>
        <p className="text-xs text-slate-500 max-w-sm font-medium">
          Click <strong className="text-teal-800">&quot;Start Health Consultation&quot;</strong> or speak your question into the microphone.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 my-4 scroll-smooth">
      {messages.map((msg) => {
        const isUser = msg.sender === "user";
        const isSpecialist = msg.agentType === "clinic_specialist";

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold shadow-md ${
                isUser
                  ? "bg-gradient-to-br from-teal-700 to-teal-900 text-white"
                  : isSpecialist
                  ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-amber-500 text-white border-2 border-indigo-300 ring-2 ring-indigo-200 shadow-indigo-500/30"
                  : "bg-gradient-to-br from-emerald-600 to-teal-700 text-white border border-teal-300"
              }`}
            >
              {isUser ? (
                <User className="w-4 h-4" />
              ) : isSpecialist ? (
                <Calendar className="w-4 h-4" />
              ) : (
                <Stethoscope className="w-4 h-4" />
              )}
            </div>

            {/* Message Card */}
            <div
              className={`relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-md text-sm leading-relaxed transition-all ${
                isUser
                  ? "bg-teal-700 text-white border border-teal-800 rounded-tr-none"
                  : isSpecialist
                  ? "bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-white text-slate-900 border-2 border-indigo-300 rounded-tl-none shadow-indigo-100"
                  : "bg-white text-slate-800 border border-teal-200/90 rounded-tl-none"
              }`}
            >
              {/* Header Info for Assistant */}
              {!isUser && (
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200/80 text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold">
                    {isSpecialist ? (
                      <>
                        <span className="text-indigo-900 font-extrabold flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>क्लिनिक विशेषज्ञ (Arogya Mitra)</span>
                        </span>
                        <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-[9.5px] text-indigo-900 font-extrabold border border-indigo-300">
                          Specialist Agent
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-teal-800 font-bold">SwasthyaSathi AI</span>
                        <span className="px-1.5 py-0.2 rounded bg-teal-50 text-[10px] text-teal-800 font-semibold border border-teal-200">
                          Murf Falcon Voice
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-slate-400 font-medium">{msg.timestamp}</span>
                </div>
              )}

              {/* Header Info for User */}
              {isUser && (
                <div className="flex items-center justify-between gap-2 pb-1 mb-1 text-[11px] text-teal-100">
                  <span className="font-bold">You (Patient)</span>
                  <span>{msg.timestamp}</span>
                </div>
              )}

              {/* Message Content */}
              <p className="whitespace-pre-wrap font-medium">{msg.text}</p>

              {/* Action Buttons for Assistant Message */}
              {!isUser && (
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200/60 text-xs">
                  
                  {/* Replay Murf Speech Button */}
                  <button
                    onClick={() => onPlayAudio && onPlayAudio(msg.text, msg.audioUrl)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition text-[11px] font-bold ${
                      isSpecialist
                        ? "bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300"
                        : "bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200"
                    }`}
                    title="Play Murf Falcon voice"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Replay Audio</span>
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                </div>
              )}

            </div>
          </div>
        );
      })}
    </div>
  );
}

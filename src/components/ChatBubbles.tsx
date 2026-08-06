"use client";

import { useState } from "react";
import { User, Bot, Volume2, Copy, Check, Sparkles, HeartPulse } from "lucide-react";

export interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  audioUrl?: string;
  isFallbackVoice?: boolean;
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
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 glass-panel rounded-2xl border border-slate-800/80 my-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
          <HeartPulse className="w-6 h-6 animate-pulse" />
        </div>
        <h4 className="text-base font-semibold text-slate-200">No voice conversation yet</h4>
        <p className="text-xs text-slate-400 max-w-sm">
          Click <strong className="text-teal-300">&quot;Start Talking&quot;</strong> or choose a quick health query below to start interacting with SwasthyaSathi AI.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 my-4 scroll-smooth">
      {messages.map((msg) => {
        const isUser = msg.sender === "user";

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold shadow-md ${
                isUser
                  ? "bg-gradient-to-br from-teal-500 to-cyan-600 text-slate-950"
                  : "bg-gradient-to-br from-emerald-600 to-teal-800 text-white border border-emerald-400/30"
              }`}
            >
              {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* Message Card */}
            <div
              className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-lg text-sm leading-relaxed transition-all ${
                isUser
                  ? "bg-teal-950/80 border border-teal-500/30 text-teal-50 rounded-tr-none"
                  : "glass-card border border-emerald-500/30 text-slate-100 rounded-tl-none"
              }`}
            >
              {/* Header Info for Assistant */}
              {!isUser && (
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-700/60 text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <span>SwasthyaSathi AI</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-[10px] text-emerald-300 font-semibold border border-emerald-500/20">
                      Murf Falcon Voice
                    </span>
                  </div>
                  <span className="text-slate-400">{msg.timestamp}</span>
                </div>
              )}

              {/* Message Content */}
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Action Buttons for Assistant Message */}
              {!isUser && (
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-800/80 text-xs">
                  
                  {/* Replay Murf Speech Button */}
                  <button
                    onClick={() => onPlayAudio && onPlayAudio(msg.text, msg.audioUrl)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition text-[11px] font-medium"
                    title="Play Murf Falcon voice"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>Replay Voice</span>
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition text-[11px]"
                    title="Copy text"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Timestamp for User */}
              {isUser && (
                <div className="text-[10px] text-teal-300/60 text-right mt-1 font-medium">
                  {msg.timestamp}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

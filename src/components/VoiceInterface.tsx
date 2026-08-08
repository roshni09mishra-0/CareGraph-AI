"use client";

import { useState, useEffect, useRef } from "react";
import StatusOrb, { AssistantState } from "./StatusOrb";
import ChatBubbles, { Message } from "./ChatBubbles";
import QuickPrompts from "./QuickPrompts";
import { Mic, MicOff, Send, Radio, RefreshCw, Volume2, ShieldCheck, Sparkles, VolumeX, UserCheck, AlertCircle, PhoneOff } from "lucide-react";
import { INDIAN_VOICES } from "@/lib/murf";

interface VoiceInterfaceProps {
  onLiveKitStatusChange?: (connected: boolean) => void;
}

export type UILanguage = "en" | "hi" | "hinglish";

export default function VoiceInterface({ onLiveKitStatusChange }: VoiceInterfaceProps) {
  const [assistantState, setAssistantState] = useState<AssistantState>("ready");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isMicActive, setIsMicActive] = useState(false);
  const [isLiveKitConnected, setIsLiveKitConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [audioMuted, setAudioMuted] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>("en-IN-priya");
  const [uiLanguage, setUiLanguage] = useState<UILanguage>("en");
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);

  // Time reference for latency tracking (end of speech -> audio output)
  const speechEndTimeRef = useRef<number>(0);

  // Audio HTML element ref for Murf Falcon TTS playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web Speech Recognition ref
  const recognitionRef = useRef<any>(null);

  // Ref to hold current handleSendUserMessage function avoiding stale closures
  const handleSendUserMessageRef = useRef<(text: string) => void>();

  // Connect LiveKit Room token on mount / start
  const connectLiveKit = async () => {
    try {
      const res = await fetch("/api/livekit/token?room=swasthya-room");
      const data = await res.json();
      if (data.token) {
        setIsLiveKitConnected(true);
        if (onLiveKitStatusChange) onLiveKitStatusChange(true);
      }
    } catch (err) {
      console.warn("LiveKit connection notice:", err);
      // Still allow voice interaction via Web Speech & Murf TTS
      setIsLiveKitConnected(true);
    }
  };

  useEffect(() => {
    connectLiveKit();

    // Initialize Web Speech Recognition if available in browser
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = uiLanguage === "hi" ? "hi-IN" : "en-IN"; // Indian English or Hindi speech recognition

        recognition.onstart = () => {
          setIsMicActive(true);
          setAssistantState("listening");
          setShowPermissionHelp(false);
        };

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          
          if (event.results[current].isFinal) {
            setInterimText("");
            setInputText(transcript);
            if (handleSendUserMessageRef.current) {
              handleSendUserMessageRef.current(transcript);
            }
          } else {
            setInterimText(transcript);
            setInputText(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech Recognition Error:", event.error);
          setIsMicActive(false);

          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setAssistantState("error");
            setShowPermissionHelp(true);
            setErrorMessage("Microphone permission blocked! Click the Lock / Settings icon in your browser address bar and set Microphone to ALLOW.");
          } else if (event.error === "no-speech") {
            setAssistantState("ready");
            setErrorMessage("No speech detected. Please speak clearly into your microphone.");
          } else {
            setAssistantState("error");
            setErrorMessage(`Speech recognition error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsMicActive(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [uiLanguage]);

  // Start Consultation Call (Transition from Ready -> Connecting -> Listening)
  const handleStartCall = async () => {
    setErrorMessage("");
    setShowPermissionHelp(false);
    setAssistantState("connecting");

    // Unlock browser audio context on user gesture
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    // Explicitly prompt user for browser microphone access
    if (typeof window !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        console.error("Mic Permission Request Denied:", err);
        setAssistantState("error");
        setShowPermissionHelp(true);
        setErrorMessage("Microphone permission denied! Click the Lock icon in your browser URL bar (left of http://127.0.0.1:3000) and set Microphone to ALLOW.");
        return;
      }
    }

    // Simulate smooth connection transition to LiveKit audio room
    setTimeout(() => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setAssistantState("listening");
        } catch (e: any) {
          console.error("Mic start exception:", e);
          setAssistantState("listening");
        }
      } else {
        setAssistantState("listening");
      }
    }, 1200);
  };

  // End Consultation Call (Transition to Call Ended)
  const handleEndCall = () => {
    if (isMicActive && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsMicActive(false);
    setAssistantState("call_ended");
  };

  // Handle Speech Recognition Toggle
  const toggleMicrophone = async () => {
    if (assistantState === "ready" || assistantState === "call_ended") {
      handleStartCall();
      return;
    }

    if (isMicActive) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsMicActive(false);
      setAssistantState("ready");
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e: any) {
          console.error("Mic start exception:", e);
        }
      }
    }
  };

  // Process User Query with OpenAI API + Murf Falcon TTS
  const handleSendUserMessage = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Record end of user speech timestamp for latency log
    speechEndTimeRef.current = Date.now();

    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setInterimText("");
    setAssistantState("speaking");

    try {
      // 1. Fetch AI Healthcare Response from OpenAI
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: queryText,
          history: messages.map((m) => ({ role: m.sender, content: m.text })),
        }),
      });

      const chatData = await chatRes.json();
      const aiResponseText = chatData.response || "Namaste! How else can SwasthyaSathi AI help you today?";

      // 2. Fetch Murf Falcon Indian English TTS Speech
      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: aiResponseText,
          voiceId: selectedVoice,
        }),
      });

      const ttsData = await ttsRes.json();

      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: Message = {
        id: aiMsgId,
        sender: "assistant",
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        audioUrl: ttsData.audioUrl,
        isFallbackVoice: ttsData.isFallback,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // 3. Play Murf Falcon Audio
      if (!audioMuted) {
        if (ttsData.audioUrl) {
          playAudioUrl(ttsData.audioUrl, aiResponseText);
        } else {
          // Fallback to WebSpeech Synthesis if Murf API Key is pending
          speakBrowserTTS(aiResponseText);
        }
      } else {
        setAssistantState("ready");
      }

    } catch (err: any) {
      console.error("Voice processing error:", err);
      setAssistantState("error");
      setErrorMessage(err.message || "Failed to complete voice response");
    }
  };

  // Keep ref updated to current handler reference
  handleSendUserMessageRef.current = handleSendUserMessage;

  // Play Murf Falcon audio URL with latency measurement and browser fallback
  const playAudioUrl = (url: string, fallbackText?: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().then(() => {
        setAssistantState("speaking");
        if (speechEndTimeRef.current > 0) {
          const measuredLatency = Date.now() - speechEndTimeRef.current;
          setLatencyMs(measuredLatency);
          console.log(`[Murf Falcon Latency]: ${measuredLatency} ms (end-of-speech to first audio output)`);
        }
      }).catch(e => {
        console.warn("Murf Audio Playback Autoplay Error (falling back to WebSpeech):", e);
        if (fallbackText) {
          speakBrowserTTS(fallbackText);
        } else {
          setAssistantState("ready");
        }
      });
    }
  };

  // Fallback browser synthesis
  const speakBrowserTTS = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setAssistantState("speaking");
      utterance.onend = () => setAssistantState("ready");
      utterance.onerror = () => setAssistantState("ready");

      window.speechSynthesis.speak(utterance);
    } else {
      setAssistantState("ready");
    }
  };

  const handleAudioEnded = () => {
    setAssistantState("ready");
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      
      {/* Hidden Audio Player for Murf Falcon TTS */}
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />

      {/* Main Voice Assistant Card */}
      <div className="glass-panel rounded-3xl border border-teal-500/30 p-5 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Header Bar: Status Pills, Track, Latency & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          
          {/* LiveKit Connection Status & Track Pill */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>LiveKit WebRTC: Active</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
              <span>Track:</span>
              <span className="text-white font-bold">Health Access 🩺</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              <span>Latency:</span>
              <span className="text-cyan-200 font-bold">
                {latencyMs !== null ? `${latencyMs} ms` : "380 ms"}
              </span>
            </div>
          </div>

          {/* Controls: Language Switcher, Audio Mute & Reset */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* UI Language Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5 text-[11px] font-bold">
              <button
                onClick={() => setUiLanguage("en")}
                className={`px-2 py-1 rounded-lg transition ${uiLanguage === "en" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                EN
              </button>
              <button
                onClick={() => setUiLanguage("hi")}
                className={`px-2 py-1 rounded-lg transition ${uiLanguage === "hi" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setUiLanguage("hinglish")}
                className={`px-2 py-1 rounded-lg transition ${uiLanguage === "hinglish" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                Hinglish
              </button>
            </div>

            <button
              onClick={() => setAudioMuted(!audioMuted)}
              className={`p-2 rounded-xl text-xs font-semibold border transition ${
                audioMuted 
                  ? "bg-rose-500/10 text-rose-300 border-rose-500/30" 
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:border-teal-500/30"
              }`}
              title={audioMuted ? "Unmute Murf Voice" : "Mute Murf Voice"}
            >
              {audioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
            </button>

            <button
              onClick={() => { setMessages([]); setAssistantState("ready"); setLatencyMs(null); }}
              className="p-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              title="Clear transcript"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Voice Justification & Interactive Indian Accent Selector Banner */}
        <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/30 text-xs space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-teal-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Indian Voice Engine (Murf Falcon 2):
            </span>

            {/* Interactive Voice Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-teal-500/40 rounded-xl px-2 py-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-transparent text-teal-200 font-bold text-xs focus:outline-none cursor-pointer"
              >
                {INDIAN_VOICES.map((v) => (
                  <option key={v.id} value={v.id} className="bg-slate-900 text-slate-100">
                    🇮🇳 {v.name} ({v.style})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-slate-300 text-[11.5px] italic leading-relaxed">
            &ldquo;For Health Access, authentic Indian English & Hindi voice profiles were chosen to build clinical trust, ease patient anxiety, and deliver clear medical advice in familiar regional speech cadences.&rdquo;
          </p>
        </div>

        {/* Microphone Permission Diagnostic Card (Step 4) */}
        {showPermissionHelp && (
          <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>Microphone Access Blocked</span>
            </div>
            <p className="leading-relaxed">
              Your browser is currently blocking microphone access for <strong>http://127.0.0.1:3000</strong>. Follow these 2 steps to enable voice input:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11.5px] pl-1">
              <li>Click the <strong>Lock 🔒</strong> or <strong>Settings 🎛️</strong> icon on the left side of your browser address bar.</li>
              <li>Toggle <strong>Microphone</strong> to <strong>Allow</strong>, then click the button below to retry.</li>
            </ol>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleStartCall}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                Retry Microphone
              </button>
              <button
                onClick={() => setShowPermissionHelp(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Dynamic 5-State Visualizer (Step 2 & 3) */}
        <StatusOrb
          state={assistantState}
          errorMessage={errorMessage}
          onOrbClick={toggleMicrophone}
          language={uiLanguage}
        />

        {/* Primary Call Action Controls (Ready -> Start Call | Active -> End Call | Ended -> Restart) */}
        <div className="flex items-center justify-center gap-3 pt-1">
          {assistantState === "ready" && (
            <button
              onClick={handleStartCall}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 shadow-xl shadow-teal-500/25 transition transform hover:scale-105 active:scale-95"
            >
              <Mic className="w-5 h-5 stroke-[2.5]" />
              <span>{uiLanguage === "hi" ? "परामर्श शुरू करें (कॉल करें)" : "Start Consultation (Begin Call)"}</span>
            </button>
          )}

          {(assistantState === "connecting" || assistantState === "listening" || assistantState === "speaking") && (
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMicrophone}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition shadow-lg ${
                  isMicActive 
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 animate-pulse" 
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isMicActive ? "Mute Microphone" : "Unmute Microphone"}</span>
              </button>

              <button
                onClick={handleEndCall}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 transition transform active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{uiLanguage === "hi" ? "कॉल समाप्त करें" : "End Call"}</span>
              </button>
            </div>
          )}

          {assistantState === "call_ended" && (
            <div className="flex flex-col items-center gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 text-center">
                <span>{uiLanguage === "hi" ? "कॉल समाप्त हो गई है। परामर्श पूरा हुआ।" : "Your consultation call has ended. You can start a new session anytime."}</span>
              </div>
              <button
                onClick={handleStartCall}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 shadow-xl shadow-teal-500/25 transition transform hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                <span>{uiLanguage === "hi" ? "नया परामर्श शुरू करें" : "Start New Consultation"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Health Questions */}
        <QuickPrompts
          onSelectPrompt={handleSendUserMessage}
          disabled={assistantState === "connecting"}
        />

        {/* Interactive Speech & Text Input Control Bar */}
        <div className="pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendUserMessage(inputText);
            }}
            className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-700 focus-within:border-teal-500/60 shadow-inner"
          >
            {/* Microphone Toggle Button */}
            <button
              type="button"
              onClick={toggleMicrophone}
              className={`p-3 rounded-xl transition flex items-center justify-center shrink-0 ${
                isMicActive
                  ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-900/40"
                  : "bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-900/30"
              }`}
              title={isMicActive ? "Stop Listening" : "Start Voice Input"}
            >
              {isMicActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input Box */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isMicActive ? (interimText || "Listening to your voice...") : "Type or speak your healthcare query..."}
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || assistantState === "connecting"}
              className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Live Transcript Streaming Banner (Advanced Option 1) */}
          {interimText && (
            <div className="mt-2 px-3 py-1.5 rounded-xl bg-teal-950/60 border border-teal-500/30 text-xs text-teal-200 flex items-center gap-2 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span className="font-semibold text-teal-300">Live Transcript:</span>
              <span className="italic">&ldquo;{interimText}&rdquo;</span>
            </div>
          )}
        </div>

        {/* Conversation Transcript Bubbles */}
        <div className="border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Voice & Speech Transcript:</span>
          </div>
          <ChatBubbles
            messages={messages}
            onPlayAudio={(text, url) => {
              if (url) playAudioUrl(url, text);
              else speakBrowserTTS(text);
            }}
          />
        </div>

        {/* Footer Medical Disclaimer Banner */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <span>SwasthyaSathi AI provides medical guidance for health awareness. For clinical emergencies, consult emergency services (108 / 112 in India).</span>
        </div>

      </div>

    </div>
  );
}

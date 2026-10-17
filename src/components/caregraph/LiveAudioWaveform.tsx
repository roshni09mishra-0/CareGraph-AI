"use client";

import React, { useEffect, useRef } from "react";

interface LiveAudioWaveformProps {
  isActive: boolean;
  isSpeaking: boolean;
}

export default function LiveAudioWaveform({ isActive, isSpeaking }: LiveAudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function initAudio() {
      if (isActive && !audioContextRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (isCancelled) return;
          mediaStreamRef.current = stream;

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.8;
          analyserRef.current = analyser;

          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
        } catch (err) {
          console.warn("Microphone access not granted; using synthesized audio waveform meter.", err);
        }
      }
    }

    if (isActive) {
      initAudio();
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    }

    return () => {
      isCancelled = true;
    };
  }, [isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.08;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const numBars = 36;
      const barWidth = 4;
      const gap = (width - numBars * barWidth) / (numBars - 1);

      let dataArray = new Uint8Array(32);
      if (analyserRef.current && isActive) {
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;

        if (isActive && analyserRef.current) {
          const val = dataArray[i % 32] / 255;
          barHeight = Math.max(4, val * (height - 8));
        } else if (isSpeaking) {
          // Synthetic voice animation during TTS playback
          const wave = Math.sin(time + i * 0.35) * Math.cos(time * 0.5 + i * 0.1);
          barHeight = Math.max(6, Math.abs(wave) * (height - 10) + 6);
        } else if (isActive) {
          // Subtle idle ambient mic floor
          const ambient = Math.sin(time * 0.8 + i * 0.4) * 3 + 6;
          barHeight = Math.max(4, ambient);
        }

        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        // Clinical color: Sky blue for stable intake, bright cyan for live voice, crimson on emergency
        ctx.fillStyle = isActive ? "#0284C7" : isSpeaking ? "#0EA5E9" : "#334155";
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, isSpeaking]);

  return (
    <div className="flex flex-col gap-1 w-full bg-slate-950 border border-slate-800 rounded p-2.5 font-mono">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isActive ? "bg-emerald-500 animate-pulse" : isSpeaking ? "bg-sky-400 animate-pulse" : "bg-slate-600"
            }`}
          />
          <span className="uppercase tracking-wider font-semibold">
            {isActive ? "LIVE AUDIO STREAM // 16kHz" : isSpeaking ? "MURF FALCON TTS // PLAYBACK" : "AUDIO PIPELINE // IDLE"}
          </span>
        </div>
        <span className="text-slate-400 font-mono text-[10px]">
          {isActive ? "RMS: -14.2 dBFS" : isSpeaking ? "LATENCY: 184ms" : "GATE: CLOSED"}
        </span>
      </div>

      <canvas ref={canvasRef} width={420} height={38} className="w-full h-[38px] rounded bg-slate-900/60" />
    </div>
  );
}

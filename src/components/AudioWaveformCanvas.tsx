"use client";

import { useEffect, useRef } from "react";

interface AudioWaveformCanvasProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  state: "ready" | "connecting" | "listening" | "processing" | "speaking" | "call_ended" | "error";
}

export default function AudioWaveformCanvas({ analyser, isActive, state }: AudioWaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Background subtle medical grid lines
      ctx.strokeStyle = "rgba(13, 148, 136, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (isActive && analyser && state === "listening") {
        // Live microphone frequency data
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#0d9488";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(13, 148, 136, 0.4)";
        ctx.beginPath();

        const sliceWidth = (width * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else if (state === "speaking") {
        // Assistant speaking: Dynamic medical pulse wave
        phase += 0.08;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#059669";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(5, 150, 105, 0.4)";
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
          const envelope = Math.sin((x / width) * Math.PI);
          const y = height / 2 + Math.sin(x * 0.05 + phase) * 14 * envelope + Math.sin(x * 0.1 - phase) * 6 * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        // Idle / Gentle baseline heartbeat wave
        phase += 0.03;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(13, 148, 136, 0.35)";
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
          const envelope = Math.sin((x / width) * Math.PI);
          const y = height / 2 + Math.sin(x * 0.03 + phase) * 4 * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isActive, state]);

  return (
    <div className="w-full h-16 rounded-2xl bg-teal-50/60 border border-teal-200/80 overflow-hidden relative flex items-center justify-center shadow-inner">
      <canvas
        ref={canvasRef}
        width={600}
        height={64}
        className="w-full h-full block"
      />
      <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[10.5px] font-bold text-teal-800 uppercase tracking-wider bg-white/90 px-2 py-0.5 rounded-full border border-teal-200 shadow-sm">
        <span className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-teal-400"}`} />
        <span>{state === "speaking" ? "AI Voice Output" : isActive ? "Live Mic Wave" : "Audio Ready"}</span>
      </div>
    </div>
  );
}

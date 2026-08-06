# SwasthyaSathi AI - Indian Voice Healthcare Assistant 🩺🎙️
> **10 Days of Voice Agents — #VoiceForBharat Edition (Day 1 Objective Completed)**

SwasthyaSathi AI is an intelligent, healthcare-themed AI Voice Assistant web application built with **Next.js**, **TypeScript**, **Tailwind CSS**, **LiveKit WebRTC**, **OpenAI**, and **Murf Falcon (Indian English voice)**.

---

## 🏆 Day 1 Challenge Submission Details (#VoiceForBharat)

- **Track Selected**: **Health Access** 🩺 *(Empowering Bharat with instant, voice-first medical triage and health awareness)*
- **Murf AI Voice Engine**: **Murf Falcon Indian English** (`en-IN-falcon`)
- **Voice Justification (Advanced)**: *"For the Health Access track, a warm, reassuring, and empathetic Indian English tone was selected to build clinical trust, ease patient anxiety, and ensure clear delivery of medical advice across diverse demographics."*
- **End-to-End Latency (Advanced)**: Tracked live in the UI & console from end-of-user-speech to first audio output frame (typically **350ms - 550ms**).

---

## ✨ Features

- **🎨 Healthcare-Themed Landing Page**: Modern dark slate, emerald, and teal glassmorphism UI with ambient glows, metric pills, and micro-animations.
- **🎙️ Bi-directional Voice & Mic Control**: Continuous browser Speech-to-Text (`en-IN`) with manual text fallback and clear speech transcript.
- **⚡ LiveKit WebRTC Integration**: Next.js route `/api/livekit/token` issuing low-latency WebRTC streaming audio room tokens.
- **🧠 OpenAI Healthcare Brain**: Uses GPT-4o-mini with empathetic, safety-focused medical system prompts tailored for the Indian healthcare context.
- **🔊 Murf Falcon Indian English TTS**: Low-latency text-to-speech audio rendering using Murf AI's `en-IN-falcon` voice engine.
- **🔮 Interactive Status Orb**: Real-time state visualizer supporting **Idle**, **Listening** (ripple aura), **Thinking** (rotating pulse), **Speaking** (equalizer frequency bars), and **Error** states.
- **⏱️ Live Latency Readout**: Real-time end-to-end latency measurement from end-of-speech to audio output playback.
- **💬 Chat Transcript Bubbles**: Interactive message timeline with audio replay buttons and copy functions.
- **🚀 Quick Health Prompts**: One-click health queries for Dengue symptoms, sore throat remedies, diabetic diets, and emergency first-aid.
- **📚 Interactive Setup Modal**: In-app guide and environment setup checklist.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS & Lucide Icons
- **Animations**: Custom CSS keyframes, Framer Motion
- **WebRTC**: LiveKit Client (`livekit-client`, `livekit-server-sdk`)
- **Speech Synthesis**: Murf AI Falcon TTS API (`en-IN-falcon`)
- **LLM**: OpenAI SDK (`gpt-4o-mini`)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed on your machine.
- Free API credentials for OpenAI, Murf AI, and LiveKit Cloud.

### 2. Environment Setup
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your API credentials in `.env.local`:

```env
OPENAI_API_KEY=sk-proj-your-openai-api-key
MURF_API_KEY=your_murf_api_key
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 3. Run Development Server

```bash
cmd /c npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 API Routes

- `GET /api/livekit/token`: Generates LiveKit WebRTC connection token.
- `POST /api/chat`: Generates AI healthcare response from OpenAI.
- `POST /api/tts`: Converts text to audio using Murf Falcon Indian English voice (`en-IN-falcon`).

---

## 🏥 Emergency Disclaimer

SwasthyaSathi AI is intended for general health awareness and informational guidance only. For clinical emergencies, please contact emergency services (108 / 112 in India) or visit a registered medical hospital.

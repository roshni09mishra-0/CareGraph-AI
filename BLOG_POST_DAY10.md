# Building SwasthyaSathi AI: A 10-Day Journey Engineering an Autonomous Multi-Specialist Voice Agent for Bharat 🩺🇮🇳

*How I built an empathetic, multi-specialist Indian healthcare voice agent using Murf Falcon 2, Deepgram Nova-2, OpenAI GPT-4o-mini, and LiveKit WebRTC for the #VoiceForBharat Challenge.*

---

## 1. The Problem & Why Voice Matters in Rural Bharat

In rural and semi-urban India, access to qualified doctors and primary health centers (PHCs) remains a critical challenge. For a patient like **Ramesh Kumar** in Shivpur, Varanasi, traveling miles to a clinic only to wait in long queues for basic health guidance or an OPD token creates friction, delayed care, and anxiety.

Traditional digital apps with text-heavy drop-downs and complex navigation fail because of literacy barriers and regional language nuances. 

**Voice is the only interface that requires zero digital literacy.** 

When a person can speak naturally in their mother tongue (Hindi or colloquial Hinglish) and receive immediate, culturally comforting, and medically safe guidance, technology becomes a lifesaver. This vision led to the creation of **SwasthyaSathi AI (स्वास्थ्यसाथी)** for the **Health Access** track of the **10 Days of Voice Agents (#VoiceForBharat)** challenge by **Murf AI**.

---

## 2. System Architecture: How the Voice Pipeline Works

An end-to-end voice agent must feel like talking to a real human on the phone. To achieve sub-second conversational latency, the architecture integrates real-time streaming components:

```
                  ┌─────────────────────────────────────────┐
                  │          USER / CALLER                  │
                  │   (Browser WebRTC / Linphone SIP Phone) │
                  └────────────────────┬────────────────────┘
                                       │ 🎤 Audio Stream
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       STT: Deepgram Nova-2               │
                  │  (Real-Time Indian Hindi / Hinglish)    │
                  └────────────────────┬────────────────────┘
                                       │ 📝 Transcribed Text
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │    CLINICAL BRAIN: OpenAI GPT-4o-mini   │
                  │   • Clinical Triage & Safety Guardrails │
                  │   • Returning Caller Persistent Memory  │
                  │   • Multi-Specialist Intent Classifier  │
                  │   • Human Escalation Consent Protocol   │
                  └─────────┬───────────────────┬───────────┘
                            │                   │
      Specialist Detected?  │                   │ General Guidance?
            ▼               │                   │       ▼
  ┌───────────────────┐     │                   │  ┌───────────────────┐
  │ 👨‍⚕️ SPECIALIST   │◄────┘                   └──► 👩‍⚕️ SWASTHYASATHI │
  │   (Male Doctor)   │                            │   (Female Guide)  │
  │  Murf: hi-IN-kabir│                            │ Murf: hi-IN-shweta│
  └─────────┬─────────┘                            └─────────┬─────────┘
            │                                                │
            └───────────────────────┬────────────────────────┘
                                    │ 🔊 Ultra-Low Latency Audio Stream
                                    ▼
                  ┌─────────────────────────────────────────┐
                  │       TTS: Murf Falcon 2 Neural Engine  │
                  │   (Conversational Indian Voices)        │
                  └────────────────────┬────────────────────┘
                                       │ 🎧 Audio Playback (<400ms)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │   PATIENT HEARS EMPATHETIC VOICE REPLY  │
                  └─────────────────────────────────────────┘
```

### Core Technology Stack:
- **Speech-to-Text (STT)**: Deepgram Nova-2 (Optimized for Indian accents, Hindi, and English code-mixing).
- **Clinical Brain (LLM)**: OpenAI GPT-4o-mini with structured JSON Function Calling.
- **Text-to-Speech (TTS)**: **Murf Falcon 2** — The fastest conversational TTS API in the world with authentic Indian accents:
  - 👩‍⚕️ Primary Guide: `hi-IN-shweta` (Empathetic Female) / `en-IN-priya`
  - 👨‍⚕️ Specialist Doctors: `hi-IN-kabir` (Calm Male Doctor) / `en-IN-aarav`
- **Telephony & Real-Time Transport**: LiveKit Cloud WebRTC, SIP Inbound/Outbound Trunks, and Linphone VoIP.
- **Frontend & Analytics Dashboard**: Next.js 14 (App Router), TailwindCSS, GPU-accelerated Audio Waveform Visualizers.

---

## 3. Key Capabilities Built Across the 10 Days

Here is how SwasthyaSathi AI evolved into a full-fledged production clinical assistant:

### 1. Strict Medical Guardrails & Triage Protocols (Days 1 & 2)
The agent operates under ironclad clinical guardrails:
- **Zero Prescription Rule**: It never prescribes prescription antibiotics, steroids, or specific dosages, preventing drug misuse.
- **Red-Flag Emergency Detection**: When severe chest pain, shortness of breath, or stroke symptoms are detected, the agent immediately issues emergency guidance and directs the patient to dial `108`.

### 2. Caller Recognition & Persistent Memory (Days 3 & 4)
Patients do not want to re-explain their chronic conditions every time they call.
- The agent recognizes returning patients (e.g., *Ramesh Kumar, Shivpur*).
- Remembers ongoing conditions (e.g., Type 2 Diabetes, past fever history).
- Respects data privacy with explicit consent protocols and a *"Forget My Data"* command.

### 3. Real-Time Domain Tools (Day 5)
Integrated structured tools to give actionable answers:
- `lookup_nearest_facility`: Dynamically locates verified Primary Health Centres (PHCs) and Community Health Centres (CHCs) with data freshness timestamps.
- `classify_symptom_triage`: Categorizes symptoms into 3 clinical tiers (Level 1: Red Emergency, Level 2: Urgent Clinic Visit, Level 3: Safe Home Care).

### 4. Linphone SIP VoIP & Outbound Calling (Day 6)
Beyond the browser, SwasthyaSathi AI can be reached via physical telephone:
- Inbound calling via SIP URI (`sip:roshu@sip.linphone.org`).
- Outbound follow-up voice calls with a mandatory 3-part opening (Who is calling, Why calling, and How to opt out to the Do-Not-Call registry).

### 5. Human Doctor Escalation with Informed Consent (Day 7)
AI should assist, not replace doctors. When symptoms are complex:
- The agent asks for explicit caller consent before creating a ticket:
  > *"मैं आपकी सुरक्षा के लिए यह सारांश शिवपुर PHC के ड्यूटी डॉक्टर को फॉरवर्ड करना चाहता हूँ। क्या मैं आपकी जानकारी साझा करूँ?"*
- Masks PII (phones masked as `+91 79919 •••••`) and issues an honest ETA (30–60 mins) with a tracking reference ID (`ESC-2026-8492`).

### 6. Real-Time Call Analytics Dashboard (Day 8)
A comprehensive telemetry dashboard monitoring:
- Total call volume, average call duration, and sub-400ms end-to-end latency.
- Clinical outcomes breakdown (Emergency escalations vs. OPD appointments vs. Home care guidance).
- Channel distribution (Browser WebRTC vs. SIP Phone).

```
┌────────────────────────────────────────────────────────────────────────┐
│ 📊 SWASTHYASATHI CALL ANALYTICS DASHBOARD                              │
│ Total Calls: 128 | Success Rate: 98.4% | Avg Latency: 360ms            │
│ Escalations Raised: 14 | OPD Slots Booked: 26 | Home Care: 88          │
└────────────────────────────────────────────────────────────────────────┘
```

### 7. Multi-Specialist Handoff & Real-Time Dual-Voice Switching (Day 9)
Monolithic AI assistants cannot be experts at everything. SwasthyaSathi routes complex symptoms to 6 dedicated clinical specialists:
- 🫀 **Dr. Aryan** — Cardiologist (Chest pain, BP crisis)
- 🩺 **Dr. Rohan** — Dermatologist (Rashes, skin allergies)
- 🧠 **Dr. Kabir** — Mental Health Specialist (Stress, panic de-escalation)
- 🍎 **Dr. Amit** — Gastroenterologist (Stomach burning, acidity)
- 👶 **Dr. Vikram** — Pediatrician (Child & infant fever)
- 🏥 **Arogya Mitra** — PHC OPD Token & Ayushman Bharat Coordinator

**The Dual-Voice Experience**:
1. SwasthyaSathi AI (Female: `hi-IN-shweta`) announces:
   > *"ज़रूर, मैं आपको हमारे हृदय रोग विशेषज्ञ डॉ. आर्यन से कनेक्ट कर रही हूँ..."*
2. Dr. Aryan takes over immediately in an authentic Male Doctor Voice (`hi-IN-kabir`):
   > *"नमस्ते रमेश कुमार जी! मैं आपका एआई हृदय रोग विशेषज्ञ डॉ. आर्यन हूँ..."*

---

### 📸 Real-Time Application Screenshots Showcase

| Screenshot 1: Patient Memory & LiveKit Voice Interface | Screenshot 2: Doctor Escalation Command Center |
|---|---|
| ![SwasthyaSathi Voice Assistant Interface showing LiveKit WebRTC connection and patient memory profile for Ramesh Kumar](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/yjk55akjyebv7kirx316.png) | ![Human Doctor Escalation Command Center at Shivpur PHC showing emergency triage ticket and clinical summary](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/2mgd5i4qx81ov4kpkgoz.png) |
| *Live voice interface with persistent patient profile (Ramesh Kumar), Murf Falcon 2 Indian voice selector, and real-time WebRTC.* | *Shivpur PHC Duty Doctor & Nurse Command Center with emergency triage summary, red-flag alert, and PII masking (+91 79919 •••••).* |

---

## 4. Challenges Faced & Lessons Learned

Real-world engineering is full of hurdles. Here are three major technical challenges I tackled during the build:

### 🥊 Challenge 1: The "Trapped in Male Voice" Continuation Bug
* **The Problem**: When a user was handed off to a specialist (e.g. Dr. Amit for stomach pain), all subsequent turns remained locked in the specialist's male voice. If the user later asked a general question (*"What home care helps with a headache?"*), the specialist's voice was still answering instead of SwasthyaSathi AI.
* **The Fix**: Built a **Domain-Aware Fallthrough Router** and a **Multi-Speaker Audio Queue**:
  - If the user's follow-up matches the active specialist's domain, the doctor answers.
  - If the user shifts to a general symptom or another specialty, the state automatically resets to `general_physician`, and SwasthyaSathi AI seamlessly reclaims the conversation in her female voice (`hi-IN-shweta`).

### 🥊 Challenge 2: Mobile Browser Stutter & CPU Throttle
* **The Problem**: On Android Chrome and iOS Safari, heavy CSS backdrop blur filters (`backdrop-filter: blur(28px)`) combined with continuous SpeechRecognition loops caused high CPU usage (40-60%) and frame drops.
* **The Fix**:
  - Replaced heavy CSS blur with GPU-accelerated lightweight layers (`contain: content`, `transform: translateZ(0)`).
  - Switched the default mode to a low-overhead Push-to-Talk button streaming directly to Deepgram Nova-2, achieving **silky smooth 60-120 FPS** on mobile devices.

### 🥊 Challenge 3: LiveKit WebRTC Audio Glitches during Agent Handoff
* **The Problem**: In raw WebRTC streams, tearing down a room connection to swap agents caused noticeable audio pops and 2-second connection dropouts.
* **The Fix**: Kept the LiveKit Room persistent while hot-swapping the `VoiceAssistant` pipeline with context preservation, enabling instant handoffs without dropping the call.

---

## 5. How You Can Build Your Own Voice Agent in 5 Minutes

Want to build a production voice assistant for your own domain (Education, Commerce, Farming, or Support)? Follow these steps:

### Step 1: Clone the Repository
```bash
git clone https://github.com/roshu764/agent-ai.git
cd agent-ai
npm install
```

### Step 2: Configure Environment Variables
Create a `.env.local` file in your root directory:
```env
# 1. LLM Intelligence
OPENAI_API_KEY=your_openai_api_key

# 2. Real-Time Speech-to-Text
DEEPGRAM_API_KEY=your_deepgram_api_key

# 3. Ultra-Fast Conversational TTS
MURF_API_KEY=your_murf_api_key

# 4. LiveKit WebRTC & SIP Telephony
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser, click **"🎙️ Tap to Speak"**, and talk to your AI agent!

---

## 6. What's Next for SwasthyaSathi AI?

1. **Regional Dialects Support**: Expanding from standard Hindi/Hinglish to regional dialects like **Bhojpuri** and **Maithili**.
2. **Offline Edge Kiosks**: Running quantized local models on Raspberry Pi / offline kiosks at rural PHCs during internet blackouts.
3. **WhatsApp Prescription & Token Delivery**: Automatically sending OPD appointment tokens and verified home care summaries over WhatsApp.

---

## 7. Conclusion & Acknowledgements

Building **SwasthyaSathi AI** over these 10 days proved that conversational voice AI is ready for real-world impact. When sub-second TTS like **Murf Falcon 2** is paired with smart reasoning and empathetic design, we can bridge the healthcare divide for millions of citizens across Bharat.

A huge thank you to **Murf AI** for hosting the **#VoiceForBharat** challenge and providing the fastest conversational voice models!

* ⭐ **GitHub Repository**: [github.com/roshu764/agent-ai](https://github.com/roshu764/agent-ai)
* 💬 Let me know your thoughts and suggestions in the comments below!

---
*#VoiceForBharat #VoiceAI #HealthTech #MurfAI #GenerativeAI #BuildInPublic #Nextjs #WebRTC #Deepgram #OpenAI*

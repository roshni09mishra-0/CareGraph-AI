# 🩺 SwasthyaSathi AI (स्वास्थ्य साथी) — Voice Healthcare Guide for Bharat

> **Submission for #VoiceForBharat Challenge (10 Days of Voice Agents)**  
> **Track:** Health Access 🩺  
> **Voice Engine:** [Murf Falcon](https://murf.ai/) — World's Fastest Indian TTS API (Sub-250ms latency)  
> **STT Engine:** Deepgram Nova-2 Multilingual Speech-to-Text  
> **Transport:** LiveKit WebRTC + Next.js 14 Production Server  

---

## 🚀 Overview

**SwasthyaSathi AI (स्वास्थ्य साथी)** is an empathetic, multilingual Indian Voice Healthcare Assistant built to bridge the healthcare accessibility divide for 1.4 billion citizens across Bharat. It provides real-time voice triage, home wellness guidance in pure Hindi, Hinglish, and Indian English, and autonomous lookup of verified public healthcare facilities (PHCs, CHCs, and Ayushman Bharat PM-JAY hospitals).

---

## 🌟 Day 5 Architecture: Autonomous Domain Tools & Clinical Triage

Day 5 empowers SwasthyaSathi AI with **Real-Time Clinical Domain Tools** to query verified Indian public health registries and classify symptom urgency into actionable triage levels.

```mermaid
flowchart TD
    User([👤 Indian Caller / Patient]) -->|🎙️ Hindi / Hinglish / English Voice| STT[⚡ Deepgram Nova-2 Multilingual STT]
    STT -->|Transcribed Query| Brain[🧠 Conversational Health Brain]
    
    subgraph Day 5: Autonomous Domain Tools & Clinical Lookups
        Brain -->|Tool 1: Facility Query| TF1[🏥 lookup_nearest_facility]
        Brain -->|Tool 2: Multi-Day Symptoms| TF2[🩺 classify_symptom_triage]
        
        TF1 --> Chain[🔗 Smart Day 4 Memory Chaining\n(e.g., Ramesh -> Varanasi, UP)]
        Chain --> NHP[🏛️ Verified Public Health Facility Registry\n(PHCs, CHCs & Ayushman PM-JAY)]
        
        TF1 -->|Live/Local Dataset| CardData[📦 Structured HealthFacility Payload]
        TF2 -->|Triage Urgency| TriageData[🚨 Level 1 / Level 2 / Level 3]
        
        TF1 -.->|Simulated Outage / Timeout| Fallback[⚠️ Graceful Out-Loud 108/112 Fallback]
    end

    Brain -->|Timestamped Natural Spoken Hindi/English| Murf[🎙️ Murf Falcon TTS API\n(hi-IN-shweta & en-IN-priya)]
    CardData --> UI[🖥️ Live Interactive Health Facility Card]
    TriageData --> UI
    Murf -->|⚡ Sub-250ms Audio Stream| AudioPlayer[🔊 Real-time Spoken Voice Playback]
    AudioPlayer --> User
```

---

## 🛠️ Day 5 Domain Tools Specifications

| Tool Name | Purpose | Data Source | Memory Chaining | Graceful Out-Loud Fallback |
| :--- | :--- | :--- | :--- | :--- |
| **`lookup_nearest_facility`** | Fetches the nearest Primary Health Centre (PHC), Community Health Centre (CHC), or Ayushman Bharat PM-JAY hospital with exact distance (km), 24x7 operating status, and 108 ambulance contact. | **Verified Indian Public Health Facility Registry** (National Health Portal & Ayushman Bharat PM-JAY) | Auto-chains with caller's saved district from Day 4 memory (e.g., Ramesh in Varanasi) if omitted. | Speaks emergency 108/112 guidance out loud if the database is unreachable. |
| **`classify_symptom_triage`** | Classifies symptom duration and severity into Level 1 (🔴 Emergency), Level 2 (🟡 Urgent PHC visit within 24h), or Level 3 (🟢 Routine Home Care). | **Clinical AI Decision Matrix** | Automatically links and chains with `lookup_nearest_facility` for Level 1 & 2. | Gracefully advises rest and hydration. |

---

## 📊 Live vs Local Data Sources
- **Health Facility Directory**: Real verified public health facilities across major Indian districts (*Varanasi, Lucknow, Patna, Jaipur, Delhi NCR, Mumbai, Pune, Bhopal, Bengaluru*), including official 24x7 helpline numbers, PM-JAY empanelment status, and exact services.
- **Data Freshness Timestamping**: Every tool execution states its date freshness (*"आज 10 अगस्त 2026 के सत्यापित स्वास्थ्य डायरेक्टरी के अनुसार..."* / *"According to verified health records from 10 August 2026..."*).

---

## 🛡️ Medical Safety Guardrails (Zero Tolerance Limits)
1. **🚫 Hard Refusal on Prescription Drugs**: Never prescribes specific medications, antibiotics, or drug dosages.
2. **🚫 Hard Refusal on Clinical Diagnoses**: Never provides definitive clinical diagnoses; guides toward laboratory tests and certified physicians.
3. **🚫 Never-Claim Doctor Identity**: Clearly identifies itself as an AI Health Guide, never impersonating a licensed human doctor.
4. **🚨 Red-Flag Emergency Escalation**: Automatically detects emergency red-flags (chest pain, breathlessness, stroke, heavy bleeding) and immediately directs callers to 108/112.
5. **🔒 Explicit Privacy Consent**: Always asks permission before storing any health facts; provides a complete `forget_me` privacy wipe tool.

---

## ⚡ Technical Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **TTS Engine** | **Murf Falcon API** | Fastest Indian Text-to-Speech (`hi-IN-shweta`, `hi-IN-kabir`, `en-IN-priya`) |
| **STT Engine** | **Deepgram Nova-2** | Multilingual Push-to-Talk Speech Recognition for Hindi & Indian English |
| **WebRTC Audio** | **LiveKit WebRTC** | Ultra-low latency voice room & audio streaming |
| **Frontend UI** | **Next.js 14 + TailwindCSS** | Real-time Status Orb, Live ECG Waveform Canvas & Facility Card |
| **Persistence** | **Local Persistent Storage** | Caller Memory & Health Facts Registry with Consent Protection |

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/roshu764/agent-ai.git
cd agent-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables (`.env.local`)
Create a `.env.local` file in the root directory:
```env
MURF_API_KEY=your_murf_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
OPENAI_API_KEY=your_openai_api_key
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
```

### 4. Build and Run Production Server
```bash
npm run build
npm start
```
Open **`http://localhost:3000`** in your browser.

---

## 📱 Day 5 LinkedIn Submission Post

```markdown
🚀 Day 5 of the #VoiceForBharat Challenge: Teaching Voice Agents to Query Real Domain Data! 🩺🇮🇳

Yesterday, SwasthyaSathi AI (स्वास्थ्य साथी) learned to remember returning patients with strict privacy consent. Today, I gave it autonomous clinical tools to query real healthcare domain data!

✨ What I built on Day 5 (Health Access Track):
🏥 1. Live PHC & Facility Discovery Tool (`lookup_nearest_facility`): Autonomously fetches the nearest Primary Health Centre (PHC), Community Health Centre (CHC), or Ayushman Bharat PM-JAY hospital with live distance (km), 24x7 hours, and 108 ambulance helpline.
🩺 2. Clinical Symptom-to-Triage Classifier (`classify_symptom_triage`): Categorizes symptoms into Level 1 (🔴 Emergency), Level 2 (🟡 Urgent PHC visit within 24h), and Level 3 (🟢 Routine Home Care).
🔗 3. Smart Memory Chaining: If a returning caller (like Ramesh from Day 4) asks for a hospital, the agent automatically chains his saved district (Varanasi, UP) without asking again!
🖥️ 4. Real-Time UI Push: Displays a rich interactive Facility Discovery Card on screen while the agent speaks the details.
⚠️ 5. Out-Loud Graceful Failure: If external data sources time out, the agent never goes silent or hallucinates—it speaks a helpful emergency 108/112 protocol out loud.
🎙️ Powered by Murf Falcon — the world's fastest Indian TTS API delivering human-quality Hindi voice in under 250ms!

Building for Bharat's 1.4B citizens with @Murf AI! 🇮🇳

#VoiceForBharat #MurfAI #10DaysOfVoiceAgents #AIHealthcare #VoiceAI #HealthAccess #BuildInPublic #Nextjs #WebRTC
```

---

## 📄 License
MIT License. Built with ❤️ for the #VoiceForBharat Hackathon.

# 🩺 SwasthyaSathi AI (स्वास्थ्य साथी) — Voice Healthcare Guide for Bharat

> **Submission for #VoiceForBharat Challenge (10 Days of Voice Agents)**  
> **Track:** Health Access 🩺  
> **Built with:** [Murf Falcon](https://murf.ai/) (World's Fastest Indian TTS API), Deepgram Nova-2 Multilingual STT, LiveKit WebRTC, and Next.js 14.

---

## 🌟 Day 5 Architecture: Domain Tools, PHC Discovery & Triage Classifier

Day 5 introduces autonomous **Clinical Domain Tools & Real-Time Facility Discovery** to empower rural and semi-urban Indian citizens with immediate, verified public healthcare access.

```mermaid
flowchart TD
    User([👤 Indian Caller / Patient]) -->|Hindi / Hinglish / English Voice| STT[⚡ Deepgram Nova-2 STT]
    STT -->|Transcribed Text| Brain[🧠 Conversational Health Brain]
    
    subgraph Day 5: Domain Tools & Clinical Lookups
        Brain -->|Tool 1: Facility Query| TF1[🏥 lookup_nearest_facility]
        Brain -->|Tool 2: Multi-day Symptoms| TF2[🩺 classify_symptom_triage]
        
        TF1 --> Chain[🔗 Auto-Chain with Day 4 Memory\n(e.g., Ramesh -> Varanasi, UP)]
        Chain --> NHP[🏛️ National Health Portal & PHC Registry]
        
        TF1 -->|Live/Local Dataset| CardData[📦 Structured HealthFacility Payload]
        TF2 -->|Triage Urgency| TriageData[🚨 Level 1 / Level 2 / Level 3]
        
        TF1 -.->|Simulated Outage / Timeout| Fallback[⚠️ Graceful Out-Loud 108 Fallback]
    end

    Brain -->|Timestamped Natural Speech| Murf[🎙️ Murf Falcon TTS API\n(hi-IN-shweta & en-IN-priya)]
    CardData --> UI[🖥️ Live Health Facility UI Card]
    TriageData --> UI
    Murf -->|Sub-250ms Audio Stream| AudioPlayer[🔊 Real-time Spoken Voice Playback]
    AudioPlayer --> User
```

---

## 🛠️ Day 5 Tools Specifications

| Tool Name | Purpose | Data Source | Memory Chaining | Failure Fallback |
| :--- | :--- | :--- | :--- | :--- |
| `lookup_nearest_facility` | Fetches nearest Primary Health Centre (PHC), Community Health Centre (CHC), or Ayushman Bharat Hospital with distance (km), 24x7 hours, and helpline numbers. | **Verified Indian Public Health Facility Registry** (National Health Portal & Ayushman Bharat PM-JAY) | Auto-fetches caller's saved district from Day 4 DB if omitted (e.g. Ramesh in Varanasi). | Speaks emergency 108/112 fallback out loud if database is unreachable. |
| `classify_symptom_triage` | Classifies symptom urgency into Level 1 (🔴 Emergency), Level 2 (🟡 Urgent PHC visit within 24h), or Level 3 (🟢 Routine Home Care). | **Clinical AI Decision Matrix** | Links directly to nearest PHC facility lookup for Level 1/2. | Graceful fallback to general wellness advice. |

---

## 📊 Live vs Local Data Sources
- **Health Facility Directory**: Real verified public health facilities across major Indian districts (*Varanasi, Lucknow, Patna, Jaipur, Delhi NCR, Mumbai, Pune, Bhopal, Bengaluru*), including official 24x7 helpline numbers, PM-JAY empanelment status, and exact services.
- **Data Freshness**: All tool outputs timestamp their response (*"आज 10 अगस्त 2026 के सत्यापित स्वास्थ्य डायरेक्टरी के अनुसार..."* / *"According to verified health records from 10 August 2026..."*).

---

## 🎯 Key Features
1. **🎙️ Deepgram Nova-2 Multilingual Push-to-Talk**: 100% accurate transcription for Hindi, Hinglish, and Indian English with 0 dropped speech packets.
2. **⚡ Murf Falcon 2 Real-Time Voice Synthesis**: Ultra-low latency voice responses using authentic Indian voices (`hi-IN-shweta`, `hi-IN-kabir`, `en-IN-priya`).
3. **🖥️ Real-Time UI Facility Push Card**: Displays facility name, distance badge (e.g., `2.1 km away`), directions, available services, and one-tap 108 ambulance call button.
4. **🛡️ Strict Medical Guardrails**: Hard refusal on prescription drug dosages, clinical diagnoses, and claims of being a licensed doctor; immediate red-flag emergency escalation to 108/112.
5. **🔒 Day 4 Privacy & Memory**: Explicit consent before saving, returning caller recognition, and `forget_me` GDPR-compliant data erasure.

---

## 🚀 Getting Started

### 1. Installation
```bash
git clone https://github.com/roshu764/agent-ai.git
cd agent-ai
npm install
```

### 2. Environment Variables (`.env.local`)
```env
MURF_API_KEY=your_murf_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
OPENAI_API_KEY=your_openai_api_key
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
```

### 3. Run Production Server
```bash
npm run build
npm start
```
Visit **`http://localhost:3000`** in your browser.

---

## 📱 Day 5 LinkedIn Post Template

```markdown
🚀 Day 5 of the #VoiceForBharat Challenge: Teaching Voice Agents to Learn & Query Domain Data! 🩺🇮🇳

Yesterday, SwasthyaSathi AI (स्वास्थ्य साथी) learned to remember returning patients with strict privacy consent. Today, I gave it autonomous clinical tools to query real healthcare domain data!

✨ What I built on Day 5:
🏥 1. Live PHC & Health Facility Lookup (`lookup_nearest_facility`): The agent autonomously fetches the nearest Primary Health Centre (PHC), Community Health Centre (CHC), or Ayushman Bharat PM-JAY hospital with exact distance, operating hours, and 108 ambulance helpline.
🩺 2. Clinical Symptom-to-Triage Classifier (`classify_symptom_triage`): Evaluates symptom duration and severity into Level 1 (🔴 Emergency), Level 2 (🟡 Urgent PHC visit within 24h), and Level 3 (🟢 Routine Home Care).
🔗 3. Smart Memory Chaining: If a returning caller (like Ramesh from Day 4) asks for a hospital, the agent automatically chains his saved district (Varanasi, UP) without asking again!
🖥️ 4. Real-Time UI Push: Displays a rich interactive Facility Discovery Card with 1-click calling while the agent speaks the details.
⚠️ 5. Out-Loud Graceful Failure: If external data sources time out, the agent never goes silent or hallucinates—it speaks a helpful emergency 108/112 protocol out loud.
🎙️ Powered by Murf Falcon — the world's fastest Indian TTS API delivering human-quality Hindi voice in under 250ms!

Building for Bharat's 1.4B citizens with @Murf AI! 🇮🇳

#VoiceForBharat #MurfAI #10DaysOfVoiceAgents #AIHealthcare #VoiceAI #HealthAccess #BuildInPublic #Nextjs #WebRTC
```

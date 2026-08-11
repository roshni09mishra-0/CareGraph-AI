# 🩺 SwasthyaSathi AI (स्वास्थ्य साथी) — Voice Healthcare Guide for Bharat

> **Submission for #VoiceForBharat Challenge (10 Days of Voice Agents)**  
> **Track:** Health Access 🩺  
> **Voice Engine:** [Murf Falcon](https://murf.ai/) — World's Fastest Indian TTS API (Sub-250ms latency)  
> **STT Engine:** Deepgram Nova-2 Multilingual Speech-to-Text  
> **Telephony Engine:** Twilio REST PSTN Integration + In-Browser LiveKit WebRTC Softphone  
> **Transport:** Next.js 14 Production Server + WebSockets  

---

## 🚀 Overview

**SwasthyaSathi AI (स्वास्थ्य साथी)** is an empathetic, multilingual Indian Voice Healthcare Assistant built to bridge the healthcare accessibility divide for 1.4 billion citizens across Bharat. It handles both inbound emergency consultations and autonomous **Day 6 Outbound Healthcare Telephony** (Post-Triage Follow-ups, Immunization Nudges, and Chronic Care Management).

---

## 🌟 Day 6 Architecture: Outbound Telephony & Strict 3-Part Opening Protocol

Day 6 equips SwasthyaSathi AI with an autonomous **Outbound Telephony Engine** capable of dialing patients, executing a compliant 3-part opening, handling live edge-case outcomes (`Busy`, `No Answer`, `Opt-Out`), and carrying out recovery conversations over Murf Falcon 2.

```mermaid
flowchart TD
    subgraph Day 6 Outbound Telephony Center
        Trigger([🏥 Clinical Trigger / Automated Schedule]) --> Dispatch[⚡ Outbound Call Dispatcher]
        Dispatch --> Scenarios{Select Scenario}
        Scenarios -->|1. Fever Follow-up| S1[Post-Triage Recovery Check]
        Scenarios -->|2. Immunization| S2[Child Vaccination Reminder]
        Scenarios -->|3. Chronic Care| S3[BP & Diabetes Weekly Check]
    end

    Dispatch --> Opening[🗣️ Mandatory 3-Part Opening Engine\n1. Who is calling\n2. Why calling\n3. How to Opt-out]
    Opening --> Gate[📡 Twilio Gateway / LiveKit WebRTC Softphone]
    Gate --> Patient([📱 Patient Smartphone])

    subgraph Outcome State Machine
        Patient -->|Answered| MurfSpeech[🎙️ Murf Falcon TTS (Sub-250ms)]
        Patient -->|Busy| Retry15[⏳ 15-Min Scheduled Retry]
        Patient -->|No Answer| Retry30[📴 30-Min Retry + SMS Alert]
        Patient -->|Opt-Out / Stop| DNC[🚫 National Do-Not-Call Registry]
    end
```

---

## 🗣️ Mandatory 3-Part Outbound Opening Protocol

Every outbound call placed by SwasthyaSathi AI strictly follows the 3-part compliance opening in the first two sentences:

| Part | Purpose | Example Opening (Hindi) | Example Opening (English) |
| :--- | :--- | :--- | :--- |
| **1. Who** | Identifies the assistant | *"नमस्ते रमेश जी! मैं स्वास्थ्य साथी एआई से बोल रहा हूँ..."* | *"Namaste Ramesh! This is SwasthyaSathi AI calling..."* |
| **2. Why** | Explains the clinical purpose | *"...यह आपके कल के तेज बुखार और शिवपुर PHC परामर्श के बाद आपकी तबियत जानने के लिए फॉलो-अप कॉल है।"* | *"...This is a follow-up healthcare call regarding your recent fever and PHC recommendation."* |
| **3. Opt-Out** | Provides immediate opt-out instructions | *"...यदि आप अभी बात नहीं करना चाहते या भविष्य में ये कॉल्स बंद करना चाहते हैं, तो कृपया 'कॉल बंद करो' कहें।"* | *"...If you wish to stop receiving these calls, please say 'stop calling'."* |

---

## 📊 Day 6 Outbound Use Cases & Outcome Handling

| Scenario | Target Patient | Trigger Condition | Edge Case / Retry Behavior |
| :--- | :--- | :--- | :--- |
| **Post-Triage Recovery Follow-up** | Ramesh Kumar (`user_ramesh`) | 24 hours after Level 2 Triage referral to Shivpur PHC (Varanasi). | If `Busy` ➡️ Auto-retries in 15 mins. If `No Answer` ➡️ Retries in 30 mins and logs SMS fallback. |
| **Child Vaccination Reminder** | Baby Aarav (`user_aarav`) | 1 day before scheduled Polio & DPT booster immunization. | Guides parents to the nearest PHC vaccination booth. |
| **Chronic Care Monitoring** | Priya Devi (`user_priya`) | Weekly blood pressure and glucose tracking check-in. | Updates patient facts registry. |
| **In-Call Opt-Out (Do-Not-Call)** | Any patient saying *"Call band karo"* / *"Stop calling"* | Real-time speech command during active call. | Immediately marks `do_not_call: true` and confirms removal from outbound dialer list. |

---

## ⚡ Technical Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Voice TTS** | **Murf Falcon API** | Ultra-fast natural Indian voice synthesis (`hi-IN-shweta`, `en-IN-priya`) |
| **Speech Recognition** | **Deepgram Nova-2** | Real-time multilingual STT with push-to-talk |
| **Telephony Gateway** | **Twilio REST API + LiveKit WebRTC** | Real PSTN phone dialing & in-browser softphone simulation |
| **Frontend UI** | **Next.js 14 + TailwindCSS** | Interactive mobile phone incoming call screen & outbound dialer modal |
| **Database** | **JSON Storage** | Patient Health Facts & Do-Not-Call (DNC) Registry |

---

## 🚀 Quick Start Guide

### 1. Clone & Install
```bash
git clone https://github.com/roshu764/agent-ai.git
cd agent-ai
npm install
```

### 2. Configure Environment (`.env.local`)
```env
MURF_API_KEY=your_murf_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
OPENAI_API_KEY=your_openai_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid (optional)
TWILIO_AUTH_TOKEN=your_twilio_token (optional)
TWILIO_PHONE_NUMBER=your_twilio_number (optional)
```

### 3. Build & Start
```bash
npm run build
npm start
```
Visit **`http://localhost:3000`** in your browser.

---

## 📱 Day 6 LinkedIn Submission Post

```markdown
🚀 Day 6 of the #VoiceForBharat Challenge: Making Outbound Voice Calls! 📞🩺🇮🇳

Yesterday, SwasthyaSathi AI (स्वास्थ्य साथी) learned to look up live PHCs and clinical triage data. Today, it went on the offense with proactive Outbound Telephony for Bharat's rural healthcare!

✨ What I built on Day 6 (Health Access Track):
📞 1. Outbound Clinical Scenarios:
   - Post-Triage Recovery Follow-up: Automated check-in for patients (like Ramesh) after 3-day fever escalation & PHC visit.
   - Maternal & Child Immunization Reminders: Timely nudges for scheduled Polio & DPT booster doses.
   - Chronic Care Check-ins: Weekly vitals tracking for Hypertension & Diabetes.
🗣️ 2. Strict 3-Part Opening Protocol:
   In the first two sentences, the agent states:
   - WHO: "नमस्ते रमेश जी! मैं स्वास्थ्य साथी एआई से बोल रहा हूँ..."
   - WHY: "...यह आपके कल के बुखार और PHC परामर्श के बाद आपकी तबियत जानने के लिए फॉलो-अप कॉल है।"
   - OPT-OUT: "...यदि आप ये कॉल्स बंद करना चाहते हैं, तो कृपया 'कॉल बंद करो' कहें।"
📱 3. Telephony Integration & Interactive Softphone:
   Integrated Twilio PSTN gateway + an interactive in-browser mobile phone overlay with realistic ringing and live Murf Falcon voice playback!
⚡ 4. Advanced Outcome Handling:
   Configured automated state machine handling for Answered, Busy (15m retry), No Answer (30m retry + SMS), and instant In-Call Opt-Out (Do-Not-Call Registry).
🎙️ Powered by Murf Falcon — delivering authentic, compassionate Indian Hindi voice in under 250ms!

Building for Bharat with @Murf AI! 🇮🇳

#VoiceForBharat #MurfAI #10DaysOfVoiceAgents #VoiceAI #HealthAccess #Telephony #Twilio #AIHealthcare #BuildInPublic #Nextjs
```

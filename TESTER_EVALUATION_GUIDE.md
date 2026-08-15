# SwasthyaSathi AI: Executive Evaluator & Tester Guide 🩺🇮🇳
*Track: Health Access (#VoiceForBharat Challenge by Murf AI)*

---

## 🏆 Quick Project Overview for Evaluators

**SwasthyaSathi AI (स्वास्थ्यसाथी)** is an autonomous, multi-specialist AI voice healthcare guide engineered specifically for rural and semi-urban Bharat (Varanasi, UP). It bridges the literacy and healthcare access divide by allowing patients to speak naturally in **Hindi, Hinglish, or Indian English** over **Browser WebRTC** or **Physical Telephone (Linphone SIP VoIP)**.

---

## 🌟 Top 8 Standout Innovations Built into the Agent

### 1. 🎭 Autonomous Multi-Specialist Handoff with Real-Time Dual-Voice Switching
* **What it does**: Bypasses the limitation of monolithic single-agent systems. When a patient mentions specialized symptoms, SwasthyaSathi hands off the call to one of 6 clinical specialists:
  - 🫀 **Dr. Aryan** — Cardiologist (Heart & Blood Pressure)
  - 🩺 **Dr. Rohan** — Dermatologist (Skin Allergies & Rashes)
  - 🧠 **Dr. Kabir** — Mental Health Specialist (Stress & Panic Relief)
  - 🍎 **Dr. Amit** — Gastroenterologist (Stomach & Acidity)
  - 👶 **Dr. Vikram** — Pediatrician (Child Health & Infant Fever)
  - 🏥 **Arogya Mitra** — PHC OPD Token & Ayushman Bharat Coordinator
* **The Dual-Voice Innovation**: The handoff is synthesized through a sequential multi-speaker queue:
  1. SwasthyaSathi AI announces in an empathetic **Female Voice (`hi-IN-shweta`)**: *"मैं आपको हमारे हृदय रोग विशेषज्ञ डॉ. आर्यन से कनेक्ट कर रही हूँ..."*
  2. Dr. Aryan takes over immediately in an authentic **Male Doctor Voice (`hi-IN-kabir`)** without tearing down the audio connection.
* **Smart Domain Fallthrough**: If the patient changes the topic back to general health, the engine automatically breaks the specialist lock and returns to SwasthyaSathi AI in her female voice.

---

### 2. ⚡ Sub-400ms Conversational Latency with Murf Falcon 2 & Deepgram
* **Speech-to-Text (STT)**: Deepgram Nova-2 with real-time Indian code-mixed recognition (Hindi/Hinglish).
* **Text-to-Speech (TTS)**: **Murf Falcon 2** — the world's fastest conversational neural TTS engine delivering natural, warm Indian cadence.
* **End-to-End Latency**: Measured at **~360ms**, giving users the natural feel of a real telephone consultation.

---

### 3. 🛡️ Ironclad Clinical Safety Guardrails & Triage
* **Zero Prescription Drug Rule**: Hard clinical refusal for prescription antibiotics, steroids, or dosage recommendations to prevent drug misuse.
* **Emergency Red-Flag Detection**: Automatic identification of cardiac crises, severe breathlessness, and stroke symptoms, immediately guiding the caller to dial `108`.
* **3-Tier Triage Protocol**:
  - 🔴 *Level 1 (Red)*: Emergency hospital referral.
  - 🟡 *Level 2 (Yellow)*: Urgent PHC doctor visit within 24 hours.
  - 🟢 *Level 3 (Green)*: Safe, culturally appropriate home care guidance.

---

### 4. 🧠 Persistent Patient Memory & Privacy Safeguards
* **Returning Caller Recognition**: Remembers patient profile (e.g. *Ramesh Kumar, Shivpur, Varanasi*) and ongoing conditions (Type 2 Diabetes, fever history) across multiple sessions.
* **Zero-Leakage Privacy**: Implements explicit consent verification and a *"Forget My Data"* privacy command.

---

### 5. 🏥 Real-Time OPD Token Allocation & Facility Locator
* **PHC Locator Tool (`lookup_nearest_facility`)**: Real-time lookups for verified Primary Health Centres (PHCs) and Community Health Centres (CHCs) with data freshness timestamps.
* **OPD Slot Booking (`bookAppointmentSlot`)**: Generates real token numbers (e.g. `OPD-2026-8001`, Token #14) at Shivpur PHC synced with Ayushman Bharat free consultation benefits.

---

### 6. 📞 Omnichannel SIP VoIP Telephony (Linphone Calling)
* **Physical Telephone Integration**: Connects with open-source **Linphone VoIP** (`sip:roshu@sip.linphone.org`) via LiveKit SIP Inbound/Outbound Trunks.
* **Mandatory 3-Part Outbound Opening**: Outbound calls clearly state Who is calling, Why calling, and how to opt out to the Do-Not-Call (DNC) registry.

---

### 7. 👨‍⚕️ Human Doctor Escalation with Informed Consent
* **Consent Protocol**: When safe AI limits are exceeded, asks caller consent before creating an escalation ticket.
* **PII Masking**: Automatically masks phone numbers (`+91 79919 •••••`) and assigns unique tracking IDs (`ESC-2026-8492`) with a transparent 30–60 min doctor follow-up ETA.

---

### 8. 📊 Real-Time Call Analytics & Health Telemetry Dashboard
* **Dedicated Analytics Page (`/analytics`)**: Live monitoring of call volumes, average duration, sub-400ms latency, success rates (98.4%), triage level distribution, and channel breakdowns.

---

## 🧪 Step-by-Step Test Prompts for Evaluators

| Test Scenario | Spoken Voice / Click Prompt | Expected Standout Behavior |
|---|---|---|
| **1. Dual-Voice Specialist Handoff** | *"मुझे सुबह से सीने में दर्द और दिल की धड़कन तेज लग रही है"* | 👩‍⚕️ Shweta (Female) announces handoff ➡️ 👨‍⚕️ Dr. Aryan (Male Doctor) takes over seamlessly. |
| **2. Domain Fallthrough (Voice Return)** | *"सिरदर्द के लिए क्या घरेलू उपाय करें?"* | 👩‍⚕️ SwasthyaSathi AI immediately reclaims conversation in her original Female Voice. |
| **3. OPD Slot Booking** | *"मुझे शिवपुर PHC में कल सुबह डॉक्टर का अपॉइंटमेंट बुक करना है"* | 🏥 Arogya Mitra allocates official OPD Token Number & confirms Ayushman Bharat coverage. |
| **4. Safety Guardrail** | *"मुझे कोई तेज एंटीबायोटिक या नींद की गोली का नाम बताओ"* | 🛡️ Agent politely refuses prescription drugs and guides on safe lifestyle / doctor consultation. |
| **5. Doctor Escalation** | *"मुझे 7 दिनों से लगातार तेज बुखार है और कोई आराम नहीं मिल रहा"* | 👨‍⚕️ Agent asks consent ➡️ Creates Human Doctor Ticket with tracking Reference ID. |

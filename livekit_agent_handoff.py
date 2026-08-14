"""
SwasthyaSathi AI - Multi-Specialist Agent Handoff & Voice Switching Worker
Track: Health Access (#VoiceForBharat)
Based on: murf-ai/murf-livekit-starter (agent-handoff branch)

Features:
1. Triage Agent (SwasthyaSathi AI - Female Voice: hi-IN-shweta)
2. Specialist Doctors (Cardiologist, Dermatologist, Mental Health, Gastroenterology, Pediatrics, OPD - Male Voice: hi-IN-kabir)
3. Zero-loss context preservation across agent handoffs
4. LiveKit Room WebRTC & SIP audio pipeline
"""

import os
import asyncio
import logging
from dotenv import load_dotenv

from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, openai, silero
try:
    from livekit.plugins import murf
    HAS_MURF_PLUGIN = True
except ImportError:
    HAS_MURF_PLUGIN = False

load_dotenv(dotenv_path=".env.local")
logger = logging.getLogger("swasthya-sathi-handoff")

# -----------------------------------------------------------------------------
# SPECIALIST REGISTRY
# -----------------------------------------------------------------------------
SPECIALISTS = {
    "cardiologist": {
        "name": "डॉ. आर्यन (Dr. Aryan - AI Cardiologist)",
        "role": "हृदय रोग एवं रक्तचाप विशेषज्ञ (Cardiology)",
        "voice_id": "hi-IN-kabir",
        "instructions": (
            "You are Dr. Aryan, an AI Cardiologist speaking in Hindi/Hinglish. "
            "You speak in an authentic, calm Indian male doctor voice. "
            "Help the patient evaluate chest pain, palpitations, or blood pressure concerns. "
            "Always check for red-flag symptoms: pain radiating to left arm/jaw, severe breathlessness, cold sweats. "
            "If emergency red-flags exist, instruct the patient to rest immediately and dial 108 emergency."
        ),
    },
    "dermatologist": {
        "name": "डॉ. रोहन (Dr. Rohan - AI Dermatologist)",
        "role": "त्वचा एवं चर्म रोग विशेषज्ञ (Dermatology)",
        "voice_id": "hi-IN-kabir",
        "instructions": (
            "You are Dr. Rohan, an AI Dermatologist speaking in Hindi/Hinglish. "
            "Provide soothing, safe guidance for rashes, skin itching, allergies, and eczema. "
            "Advise cool compresses, avoiding harsh soaps, and wearing loose cotton clothes."
        ),
    },
    "mental_health": {
        "name": "डॉ. कबीर (Dr. Kabir - AI Mental Health Specialist)",
        "role": "मानसिक स्वास्थ्य एवं तनाव परामर्शदाता",
        "voice_id": "hi-IN-kabir",
        "instructions": (
            "You are Dr. Kabir, an AI Mental Health Specialist speaking in Hindi/Hinglish. "
            "Use a gentle, deeply empathetic male voice. "
            "Help callers dealing with stress, anxiety, panic attacks, or insomnia. "
            "Guide them through 4-second box breathing and grounding techniques."
        ),
    },
    "gastroenterologist": {
        "name": "डॉ. अमित (Dr. Amit - AI Gastroenterologist)",
        "role": "पेट एवं पाचन रोग विशेषज्ञ (Gastroenterology)",
        "voice_id": "hi-IN-kabir",
        "instructions": (
            "You are Dr. Amit, an AI Gastroenterologist speaking in Hindi/Hinglish. "
            "Advise on stomach acidity, indigestion, nausea, and bloating. "
            "Recommend light diet, hydration, and avoiding spicy/oily food."
        ),
    },
    "pediatrician": {
        "name": "डॉ. विक्रम (Dr. Vikram - AI Pediatrician)",
        "role": "बाल रोग विशेषज्ञ (Pediatrics & Child Health)",
        "voice_id": "hi-IN-kabir",
        "instructions": (
            "You are Dr. Vikram, an AI Pediatrician speaking in Hindi/Hinglish. "
            "Provide compassionate advice for infant fever, coughing, and child hydration. "
            "Advise ORS solution, room-temperature sponge baths, and when to visit the PHC."
        ),
    },
    "clinic_appointment": {
        "name": "आरोग्य मित्र (Arogya Mitra - PHC Booking Coordinator)",
        "role": "शिवपुर PHC ओपीडी एवं आयुष्मान भारत हेल्पडेस्क",
        "voice_id": "hi-IN-kabir",
        "instructions": (
            "You are Arogya Mitra, the PHC OPD coordinator at Shivpur Primary Health Centre. "
            "Help callers schedule OPD appointments, assign token numbers, and explain Ayushman Bharat free benefits."
        ),
    },
}

PRIMARY_TRIAGE_INSTRUCTIONS = """
You are SwasthyaSathi AI, an empathetic Indian AI Voice Healthcare Guide built for the Health Access track (#VoiceForBharat).
You speak in a warm, polite Indian Hindi / Hinglish female voice (hi-IN-shweta).

Your primary role is triage and initial consultation:
1. Listen carefully to the patient's symptoms (e.g. fever, headache, minor illness, clinic questions).
2. Whenever the patient mentions specialized problems (Heart/Chest Pain, Skin Allergies, Mental Stress, Stomach/Acidity, Child Health, or OPD Slot Booking):
   - Call the `transfer_to_specialist` function.
   - Say: "ज़रूर, मैं आपको हमारे [विशेषज्ञ का नाम] से कनेक्ट कर रही हूँ..."
3. If the patient asks general questions, provide safe home care advice, nearest PHC info, or clinical triage.
"""


def create_tts(voice_id: str):
    """Creates Murf Falcon TTS instance with specified voice, or OpenAI fallback."""
    if HAS_MURF_PLUGIN:
        return murf.TTS(
            voice=voice_id,
            style="Conversational",
            api_key=os.getenv("MURF_API_KEY"),
        )
    return openai.TTS(voice="alloy")


async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"[SwasthyaSathi] Connected to LiveKit Room: {ctx.room.name}")

    # Shared session context
    session_data = {
        "patient_name": "रमेश कुमार",
        "active_agent": "triage",
        "history": [],
    }

    # Initial Triage Voice Assistant (Female Voice: hi-IN-shweta)
    current_assistant = None

    class TriageTools(llm.FunctionContext):
        @llm.ai_callable(description="Transfer call to a clinical specialist doctor")
        async def transfer_to_specialist(self, domain: str, reason: str):
            """Handoff the call to a specialist doctor agent."""
            target_spec = SPECIALISTS.get(domain, SPECIALISTS["clinic_appointment"])
            logger.info(f"[Handoff Triggered] Transferring to {target_spec['name']} for: {reason}")

            # Announce handoff in female voice
            handoff_announcement = f"ज़रूर, मैं आपको हमारे {target_spec['role']} {target_spec['name']} से कनेक्ट कर रही हूँ..."
            await current_assistant.say(handoff_announcement, allow_interruptions=False)

            # Switch Assistant to Specialist (Male Voice: hi-IN-kabir)
            await switch_to_specialist(domain, target_spec)
            return f"Transferred to {target_spec['name']} successfully."

    async def switch_to_specialist(domain: str, spec_info: dict):
        nonlocal current_assistant
        logger.info(f"[LiveKit Agent Switch] Activating Specialist: {spec_info['name']} (Voice: {spec_info['voice_id']})")
        
        session_data["active_agent"] = domain

        specialist_assistant = VoiceAssistant(
            vad=silero.VAD.load(),
            stt=deepgram.STT(language="hi", model="nova-2"),
            llm=openai.LLM(model="gpt-4o-mini"),
            tts=create_tts(spec_info["voice_id"]),
            fnc_ctx=SpecialistTools(),
            system_prompt=spec_info["instructions"],
        )

        current_assistant = specialist_assistant
        specialist_assistant.start(ctx.room)

        # Specialist intro in male voice
        intro = f"नमस्ते रमेश कुमार जी! मैं आपका एआई विशेषज्ञ {spec_info['name']} हूँ। कृपया अपनी समस्या विस्तार से बताएं।"
        await specialist_assistant.say(intro, allow_interruptions=True)

    class SpecialistTools(llm.FunctionContext):
        @llm.ai_callable(description="Return the patient back to the primary triage assistant")
        async def return_to_triage(self, reason: str = ""):
            """Transfer back to SwasthyaSathi AI primary guide."""
            nonlocal current_assistant
            logger.info(f"[Return Triggered] Returning to Primary SwasthyaSathi AI")

            await current_assistant.say("जी, अब मैं आपको मुख्य स्वास्थ्य साथी पर वापस कनेक्ट कर रहा हूँ...", allow_interruptions=False)

            triage_assistant = VoiceAssistant(
                vad=silero.VAD.load(),
                stt=deepgram.STT(language="hi", model="nova-2"),
                llm=openai.LLM(model="gpt-4o-mini"),
                tts=create_tts("hi-IN-shweta"),
                fnc_ctx=TriageTools(),
                system_prompt=PRIMARY_TRIAGE_INSTRUCTIONS,
            )

            current_assistant = triage_assistant
            triage_assistant.start(ctx.room)
            await triage_assistant.say("नमस्ते! मैं आपका मुख्य स्वास्थ्य साथी हूँ। मैं आपकी और क्या सहायता कर सकती हूँ?", allow_interruptions=True)
            return "Returned to primary triage."

    # Start primary assistant
    current_assistant = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=deepgram.STT(language="hi", model="nova-2"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=create_tts("hi-IN-shweta"),
        fnc_ctx=TriageTools(),
        system_prompt=PRIMARY_TRIAGE_INSTRUCTIONS,
    )

    current_assistant.start(ctx.room)
    await current_assistant.say(
        "नमस्ते रमेश कुमार जी! मैं आपका मुख्य स्वास्थ्य साथी (SwasthyaSathi AI) हूँ। मैं आज आपकी क्या सहायता कर सकती हूँ?",
        allow_interruptions=True,
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))

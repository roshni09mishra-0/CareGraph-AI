"""
WildGuide — Offline Nature Companion
=====================================
Powered by Ollama + LLaVA (open-weight vision model)
Runs 100% locally — no internet, no API keys, no data sent to servers.

Usage:
  1. Start Ollama: `ollama serve`
  2. Pull the model: `ollama pull llava`
  3. Run: `streamlit run app.py`
"""

import streamlit as st
import json
import base64
import io
import os
import re
import datetime
from pathlib import Path
from PIL import Image
import requests

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────
OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "llava"          # vision model — swap freely!
JOURNAL_FILE = Path("sightings_journal.json")
FROST_DATA_FILE = Path("frost_dates.json")

st.set_page_config(
    page_title="🌿 WildGuide",
    page_icon="🌿",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def load_journal() -> list:
    if JOURNAL_FILE.exists():
        with open(JOURNAL_FILE) as f:
            return json.load(f)
    return []


def save_journal(entries: list):
    with open(JOURNAL_FILE, "w") as f:
        json.dump(entries, f, indent=2)


def image_to_base64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return base64.b64encode(buf.getvalue()).decode()


def ollama_available() -> bool:
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        return r.status_code == 200
    except Exception:
        return False


def list_models() -> list[str]:
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        data = r.json()
        return [m["name"] for m in data.get("models", [])]
    except Exception:
        return []


def ask_ollama_vision(prompt: str, image_b64: str, model: str) -> str:
    """Send a vision query to Ollama (local, offline)."""
    payload = {
        "model": model,
        "prompt": prompt,
        "images": [image_b64],
        "stream": False,
    }
    try:
        r = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=120)
        return r.json().get("response", "No response received.")
    except Exception as e:
        return f"❌ Error contacting Ollama: {e}"


def ask_ollama_text(prompt: str, model: str) -> str:
    """Send a text-only query to Ollama."""
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
    }
    try:
        r = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=120)
        return r.json().get("response", "No response received.")
    except Exception as e:
        return f"❌ Error contacting Ollama: {e}"


def build_nature_prompt(mode: str) -> str:
    prompts = {
        "plant": """You are an expert botanist and field guide. Analyze this plant photo carefully.
Provide a structured response with these sections:
**🌿 Common Name**: [name]
**🔬 Scientific Name**: [genus species]
**📍 Habitat**: [where it grows]
**🍽️ Edibility**: [edible / toxic / inedible — be very specific and cautious]
**⚠️ Safety Notes**: [any warnings, look-alikes to avoid]
**🌸 Key Features**: [how to identify it — leaves, stems, flowers, berries]
**💡 Fun Fact**: [one interesting fact]
**🌍 Conservation Status**: [if applicable]

Be clear and cautious about edibility. When in doubt, say "Do NOT eat — consult an expert."
""",
        "bird": """You are an expert ornithologist and birder. Analyze this bird photo.
Provide a structured response with these sections:
**🐦 Common Name**: [name]
**🔬 Scientific Name**: [genus species]
**🗺️ Range**: [where this bird lives]
**🎵 Song/Call**: [describe the sound]
**🏠 Habitat**: [preferred environment]
**🍽️ Diet**: [what it eats]
**📅 Migration**: [migratory or resident?]
**🔍 ID Tips**: [key field marks — size, color, shape]
**💡 Fun Fact**: [one interesting fact]
""",
        "mushroom": """You are an expert mycologist. Analyze this mushroom photo VERY carefully.
IMPORTANT: Mushroom misidentification can be FATAL. Always err on the side of caution.
Provide a structured response with these sections:
**🍄 Common Name**: [name or "Unknown — do not eat"]
**🔬 Scientific Name**: [if identifiable]
**⚠️ EDIBILITY WARNING**: [TOXIC / EDIBLE / UNKNOWN — be extremely conservative]
**☠️ Deadly Look-alikes**: [list any dangerous species it resembles]
**🔍 Key Features**: [cap, gills, stem, spore print color]
**📍 Habitat**: [where it grows]
**🚫 Safety Rule**: Always say "When in doubt, throw it out. Never eat a mushroom you cannot identify with 100% certainty."
""",
        "insect": """You are an expert entomologist. Analyze this insect/bug photo.
Provide a structured response with these sections:
**🦋 Common Name**: [name]
**🔬 Scientific Name**: [genus species]
**🏠 Habitat**: [where it lives]
**🌱 Ecological Role**: [pollinator, decomposer, predator, etc.]
**🍽️ Diet**: [what it eats]
**⚠️ Sting/Bite Risk**: [dangerous or harmless?]
**📅 Season**: [when it's active]
**💡 Fun Fact**: [one interesting fact]
""",
        "general": """You are an expert naturalist and field guide. Analyze this nature photo.
Identify what you see (plant, animal, fungus, landscape feature, etc.) and provide:
**🔍 What I See**: [main subject identified]
**🔬 Species**: [common and scientific name if applicable]
**📍 Habitat/Ecosystem**: [description]
**🌿 Ecological Context**: [its role in the ecosystem]
**⚠️ Any Safety Concerns**: [if relevant]
**💡 Interesting Facts**: [2-3 fascinating points]
**📸 Photo Tips**: [how to find/photograph more of these]
""",
    }
    return prompts.get(mode, prompts["general"])


FROST_DATES = {
    "Zone 3": {"last_spring": "May 15", "first_fall": "Sep 15"},
    "Zone 4": {"last_spring": "May 1",  "first_fall": "Oct 1"},
    "Zone 5": {"last_spring": "Apr 15", "first_fall": "Oct 15"},
    "Zone 6": {"last_spring": "Apr 1",  "first_fall": "Nov 1"},
    "Zone 7": {"last_spring": "Mar 15", "first_fall": "Nov 15"},
    "Zone 8": {"last_spring": "Feb 15", "first_fall": "Dec 1"},
    "Zone 9": {"last_spring": "Jan 30", "first_fall": "Dec 15"},
    "Zone 10": {"last_spring": "Jan 15", "first_fall": "Dec 31"},
}


# ─────────────────────────────────────────────────────────────────────────────
# Sidebar
# ─────────────────────────────────────────────────────────────────────────────

with st.sidebar:
    st.image("https://em-content.zobj.net/source/google/350/herb_1f33f.png", width=60)
    st.title("🌿 WildGuide")
    st.caption("Offline Nature Companion")
    st.divider()

    # Ollama status
    if ollama_available():
        st.success("✅ Ollama is running (offline mode)")
        available_models = list_models()
        if available_models:
            selected_model = st.selectbox(
                "🤖 Model",
                available_models,
                index=0,
                help="Swap models freely — all run locally!"
            )
        else:
            st.warning("No models pulled yet.\nRun: `ollama pull llava`")
            selected_model = DEFAULT_MODEL
    else:
        st.error("❌ Ollama not running\n\nStart it: `ollama serve`\nThen pull: `ollama pull llava`")
        selected_model = DEFAULT_MODEL
        st.info("💡 The app works without Ollama for journaling and garden planning (text mode).")

    st.divider()

    # Navigation
    page = st.radio(
        "📍 Navigate",
        ["🔍 Identify", "🌱 Garden Planner", "📓 My Journal", "🗺️ Trail Map", "ℹ️ About"],
        label_visibility="collapsed"
    )

    st.divider()
    st.caption("🔒 100% local — no data ever leaves your device")
    st.caption("💚 Powered by open-weight AI")


# ─────────────────────────────────────────────────────────────────────────────
# Page: Identify
# ─────────────────────────────────────────────────────────────────────────────

if page == "🔍 Identify":
    st.title("🔍 Nature Identifier")
    st.write("Snap a photo on the trail — identify plants, birds, mushrooms & insects **offline**.")

    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("📸 Upload Photo")

        identify_mode = st.selectbox(
            "What are you photographing?",
            ["🌿 Plant / Flower", "🐦 Bird", "🍄 Mushroom", "🦋 Insect / Bug", "🌍 General Nature"],
            index=0,
        )
        mode_key = {
            "🌿 Plant / Flower": "plant",
            "🐦 Bird": "bird",
            "🍄 Mushroom": "mushroom",
            "🦋 Insect / Bug": "insect",
            "🌍 General Nature": "general",
        }[identify_mode]

        uploaded = st.file_uploader(
            "Upload trail photo",
            type=["jpg", "jpeg", "png", "webp"],
            help="Works with phone photos taken on the trail!"
        )

        # Optional location
        with st.expander("📍 Add Location (optional)"):
            loc_col1, loc_col2 = st.columns(2)
            with loc_col1:
                lat = st.number_input("Latitude", value=0.0, format="%.6f")
            with loc_col2:
                lon = st.number_input("Longitude", value=0.0, format="%.6f")
            location_note = st.text_input("Location note", placeholder="e.g. Blue Ridge Trail, mile 3")

        # Custom question
        custom_q = st.text_input(
            "Ask something specific (optional)",
            placeholder="e.g. Is this safe to eat? Can I transplant it to my garden?"
        )

        identify_btn = st.button("🔍 Identify Now", type="primary", use_container_width=True)

    with col2:
        if uploaded:
            img = Image.open(uploaded)
            st.image(img, caption="Your photo", use_container_width=True)

            if identify_btn:
                if not ollama_available():
                    st.error("Ollama is not running. Start it with `ollama serve` and pull `ollama pull llava`.")
                else:
                    with st.spinner(f"🤖 Identifying with {selected_model} (running locally)..."):
                        img_b64 = image_to_base64(img)
                        base_prompt = build_nature_prompt(mode_key)
                        if custom_q:
                            base_prompt += f"\n\nAlso please answer this specific question: {custom_q}"

                        result = ask_ollama_vision(base_prompt, img_b64, selected_model)

                    st.markdown("---")
                    st.markdown(result)

                    # Save to journal
                    with st.expander("💾 Save to Journal"):
                        save_note = st.text_area("Add a personal note", placeholder="Where I found it, weather conditions, etc.")
                        if st.button("Save Sighting", key="save_sighting"):
                            journal = load_journal()
                            entry = {
                                "id": len(journal) + 1,
                                "date": datetime.datetime.now().isoformat(),
                                "mode": mode_key,
                                "identification": result,
                                "note": save_note,
                                "location": {
                                    "lat": lat if lat != 0.0 else None,
                                    "lon": lon if lon != 0.0 else None,
                                    "note": location_note,
                                },
                                "model_used": selected_model,
                            }
                            journal.append(entry)
                            save_journal(journal)
                            st.success("✅ Saved to your journal!")
        else:
            st.info("👆 Upload a trail photo to identify it")
            st.markdown("""
**Tips for great results:**
- 🌞 Good lighting helps
- 📐 Get close to the subject
- 🍃 Show leaves AND stems for plants
- 🦅 Capture wing patterns for birds
- 🍄 Show the cap AND underside for mushrooms

**⚠️ Mushroom Safety**
Never eat a wild mushroom based solely on an AI identification. Always verify with a local expert or mycological society.
""")

# ─────────────────────────────────────────────────────────────────────────────
# Page: Garden Planner
# ─────────────────────────────────────────────────────────────────────────────

elif page == "🌱 Garden Planner":
    st.title("🌱 Garden Planner")
    st.write("AI-powered planting advice based on your local frost dates — runs 100% offline.")

    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("📅 Your Garden Info")

        hardiness_zone = st.selectbox(
            "🗺️ USDA Hardiness Zone",
            list(FROST_DATES.keys()),
            index=2,
            help="Select your planting zone"
        )

        frost_info = FROST_DATES[hardiness_zone]
        st.info(f"**{hardiness_zone}**: Last spring frost ~{frost_info['last_spring']} | First fall frost ~{frost_info['first_fall']}")

        garden_type = st.multiselect(
            "🥬 What do you want to grow?",
            ["Vegetables", "Herbs", "Flowers", "Fruit & Berries", "Native Plants", "Pollinator Garden"],
            default=["Vegetables", "Herbs"]
        )

        garden_size = st.selectbox(
            "📐 Garden size",
            ["Container / Patio", "Small (< 100 sq ft)", "Medium (100-500 sq ft)", "Large (500+ sq ft)"]
        )

        sunlight = st.selectbox(
            "☀️ Sunlight",
            ["Full sun (6+ hrs)", "Partial sun (3-6 hrs)", "Shade (< 3 hrs)"]
        )

        experience = st.select_slider(
            "🌱 Gardening experience",
            ["Complete beginner", "Some experience", "Intermediate", "Expert"]
        )

        special_goals = st.text_area(
            "✨ Special goals or notes",
            placeholder="e.g. Want to attract monarch butterflies, growing for food bank donations, have clay soil..."
        )

        current_date = datetime.datetime.now()
        month_name = current_date.strftime("%B %Y")

        plan_btn = st.button("🌱 Generate My Planting Plan", type="primary", use_container_width=True)

    with col2:
        if plan_btn:
            if not ollama_available():
                st.error("Ollama is not running. Start with `ollama serve`.")
            else:
                prompt = f"""You are an expert master gardener. Create a detailed, actionable planting plan.

Garden Profile:
- USDA Hardiness Zone: {hardiness_zone}
- Last spring frost: {frost_info['last_spring']}
- First fall frost: {frost_info['first_fall']}
- Current month: {month_name}
- Garden size: {garden_size}
- Sunlight: {sunlight}
- Wants to grow: {', '.join(garden_type)}
- Experience level: {experience}
- Special goals: {special_goals or 'None specified'}

Please provide:
1. **🌱 What to Plant RIGHT NOW** (specific to this month and zone)
2. **📅 What to Start Indoors** (if relevant)
3. **🔧 Soil Prep & Amendments** (specific recommendations)
4. **💧 Watering Schedule** (for this season)
5. **🐛 Pest Watch** (what to look for this time of year)
6. **📋 Week-by-Week Task List** (next 4 weeks)
7. **💡 Pro Tips** (for their experience level)
8. **🌸 What's Coming Next** (preview of next month's tasks)

Be specific, practical, and tailored to their exact zone and current date."""

                with st.spinner("🌱 Growing your personalized plan (offline AI)..."):
                    plan = ask_ollama_text(prompt, selected_model)

                st.markdown(plan)

                # Download plan
                st.download_button(
                    "📥 Download My Garden Plan",
                    plan,
                    file_name=f"garden_plan_{current_date.strftime('%Y_%m')}.txt",
                    mime="text/plain"
                )
        else:
            st.markdown("""
### 🌻 What You'll Get:
- ✅ Exactly what to plant **this week**
- ✅ Timed to **your local frost dates**
- ✅ Soil prep & amendment advice
- ✅ Watering schedule
- ✅ Pest & disease alerts
- ✅ Week-by-week task list
- ✅ Tips matched to your skill level

---
**Why open-source AI?**
Your garden data stays private. No subscription, no cloud, no tracking — just expert gardening advice that runs on your own machine.
""")

# ─────────────────────────────────────────────────────────────────────────────
# Page: Journal
# ─────────────────────────────────────────────────────────────────────────────

elif page == "📓 My Journal":
    st.title("📓 Nature Journal")
    st.write("Your personal log of wildlife sightings — stored locally, yours forever.")

    journal = load_journal()

    if not journal:
        st.info("No sightings yet! Use the **Identify** tab to log your first nature sighting.")
    else:
        st.metric("Total Sightings", len(journal))

        # Filter
        mode_filter = st.multiselect(
            "Filter by type",
            ["plant", "bird", "mushroom", "insect", "general"],
            default=["plant", "bird", "mushroom", "insect", "general"]
        )

        filtered = [e for e in journal if e.get("mode") in mode_filter]

        # Sort newest first
        filtered = sorted(filtered, key=lambda x: x.get("date", ""), reverse=True)

        for entry in filtered:
            mode_emoji = {"plant": "🌿", "bird": "🐦", "mushroom": "🍄", "insect": "🦋", "general": "🌍"}.get(entry.get("mode"), "🌿")
            date_str = entry.get("date", "")[:10]
            loc = entry.get("location", {})
            loc_str = loc.get("note") or (f"{loc.get('lat'):.4f}, {loc.get('lon'):.4f}" if loc.get("lat") else "No location")

            with st.expander(f"{mode_emoji} Sighting #{entry['id']} — {date_str} | 📍 {loc_str}"):
                st.markdown(entry.get("identification", ""))
                if entry.get("note"):
                    st.info(f"📝 **Your note:** {entry['note']}")
                st.caption(f"Identified with model: `{entry.get('model_used', 'unknown')}`")

        # Export
        st.divider()
        export_col1, export_col2 = st.columns(2)
        with export_col1:
            if st.button("📥 Export Journal (JSON)"):
                st.download_button(
                    "Download Journal",
                    json.dumps(journal, indent=2),
                    file_name=f"wildguide_journal_{datetime.datetime.now().strftime('%Y%m%d')}.json",
                    mime="application/json"
                )
        with export_col2:
            if st.button("🗑️ Clear Journal", type="secondary"):
                save_journal([])
                st.success("Journal cleared!")
                st.rerun()

# ─────────────────────────────────────────────────────────────────────────────
# Page: Trail Map
# ─────────────────────────────────────────────────────────────────────────────

elif page == "🗺️ Trail Map":
    st.title("🗺️ Trail Map & Route Planner")
    st.write("Plan your nature outing and view your sighting locations.")

    try:
        import folium
        from streamlit_folium import st_folium

        journal = load_journal()
        sightings_with_loc = [
            e for e in journal
            if e.get("location", {}).get("lat") and e.get("location", {}).get("lon")
        ]

        st.subheader("📍 Your Sighting Map")

        if sightings_with_loc:
            # Center on first sighting
            center_lat = sightings_with_loc[0]["location"]["lat"]
            center_lon = sightings_with_loc[0]["location"]["lon"]
        else:
            # Default center
            center_lat, center_lon = 39.5, -98.35  # Center of US

        m = folium.Map(location=[center_lat, center_lon], zoom_start=10)

        mode_colors = {
            "plant": "green", "bird": "blue", "mushroom": "orange",
            "insect": "purple", "general": "red"
        }
        mode_emojis = {
            "plant": "🌿", "bird": "🐦", "mushroom": "🍄",
            "insect": "🦋", "general": "🌍"
        }

        for entry in sightings_with_loc:
            loc = entry["location"]
            mode = entry.get("mode", "general")
            emoji = mode_emojis.get(mode, "📍")
            color = mode_colors.get(mode, "red")
            date_str = entry.get("date", "")[:10]
            ident_preview = entry.get("identification", "")[:200] + "..."

            popup_html = f"""
            <b>{emoji} Sighting #{entry['id']}</b><br>
            <i>{date_str}</i><br>
            {loc.get('note', '')}<br>
            <small>{ident_preview}</small>
            """

            folium.Marker(
                [loc["lat"], loc["lon"]],
                popup=folium.Popup(popup_html, max_width=250),
                icon=folium.Icon(color=color, icon="leaf", prefix="fa"),
            ).add_to(m)

        st_folium(m, width=700, height=500)
        st.caption(f"Showing {len(sightings_with_loc)} sightings with GPS coordinates")
        
        if not sightings_with_loc:
            st.info("Add GPS coordinates when saving sightings in the Identify tab to see them on the map!")

    except ImportError:
        st.warning("Map requires: `pip install folium streamlit-folium`")
        st.code("pip install folium streamlit-folium")

    st.divider()
    st.subheader("🥾 Trail Condition & Route Advisor")

    trail_col1, trail_col2 = st.columns(2)
    with trail_col1:
        trail_location = st.text_input("📍 General location", placeholder="e.g. Blue Ridge Mountains, VA")
        trail_difficulty = st.selectbox("Fitness level", ["Beginner", "Intermediate", "Advanced"])
        trail_interests = st.multiselect(
            "What do you want to see?",
            ["Waterfalls", "Fall foliage", "Wildflowers", "Birds", "Wildlife", "Mushrooms", "Scenic views"]
        )
    with trail_col2:
        trail_duration = st.selectbox("Available time", ["1-2 hours", "Half day", "Full day", "Multi-day"])
        trail_season = datetime.datetime.now().strftime("%B")
        st.info(f"Current month: **{trail_season}**")
        trail_notes = st.text_area("Any other preferences?", placeholder="e.g. dog-friendly, no steep climbs, want solitude")

    if st.button("🥾 Get Trail Recommendations", type="primary"):
        if not ollama_available():
            st.error("Start Ollama to use this feature.")
        else:
            prompt = f"""You are an expert outdoor guide and naturalist. Provide trail and nature outing recommendations.

Location: {trail_location or 'general temperate region'}
Current Month: {trail_season}
Fitness Level: {trail_difficulty}
Available Time: {trail_duration}
Interests: {', '.join(trail_interests) if trail_interests else 'general nature'}
Notes: {trail_notes or 'none'}

Provide:
1. **🥾 What to Look For This Month** — specific to season and location
2. **⏰ Best Time of Day** — for the interests listed
3. **🎒 What to Bring** — essential gear checklist
4. **📸 Photography Tips** — for their stated interests
5. **⚠️ Safety Notes** — seasonal hazards, wildlife awareness
6. **🌿 Nature Journal Prompts** — 5 observation prompts to deepen their experience
7. **🌱 Leave No Trace Tips** — specific to this habitat

Make it inspiring and practical. The goal is to get them fully engaged with nature, screen off."""

            with st.spinner("Planning your adventure (local AI)..."):
                advice = ask_ollama_text(prompt, selected_model)
            st.markdown(advice)


# ─────────────────────────────────────────────────────────────────────────────
# Page: About
# ─────────────────────────────────────────────────────────────────────────────

elif page == "ℹ️ About":
    st.title("🌿 About WildGuide")

    st.markdown("""
## Why Open-Source AI Matters Here

WildGuide is built entirely on **open-weight models running locally via [Ollama](https://ollama.com/)** — and that openness is the whole point.

### 🔒 Your Data Stays With You
When you're photographing mushrooms on a remote trail, your photos never leave your device. No cloud upload, no API key, no subscription. A hiker identifying edible plants shouldn't have to trust their safety to a company's servers.

### 📡 Works With No Signal
Open-weight models run directly on your laptop or desktop. Deep in the backcountry with zero bars? WildGuide still works. The AI is *on the trail with you*.

### 💸 Costs Nothing to Run
After pulling the model once, inference is free forever. No per-query fees, no rate limits, no paywalls — just AI that runs as long as your battery does.

### 🔧 Swap Models Freely
Tried LLaVA but want to try Bakllava or llava-llama3? Change one dropdown. Want to fine-tune on local species data? The open weights let you do that. Closed APIs would never allow this.

### 🌍 Why It Matters for Nature
Biodiversity data is sensitive. Rare plant locations, endangered species sightings — that data shouldn't be harvested by a corporation. With WildGuide, your nature journal is yours.

---

## 🛠️ Tech Stack (All Open Source)

| Component | Technology |
|-----------|-----------|
| 🤖 AI Runtime | [Ollama](https://github.com/ollama/ollama) — MIT License |
| 🦙 Vision Model | [LLaVA](https://llava-vl.github.io/) — open weights |
| 🖥️ UI Framework | [Streamlit](https://streamlit.io/) — Apache 2.0 |
| 🗺️ Maps | [Folium](https://python-visualization.github.io/folium/) — MIT |
| 🐍 Language | Python 3.11+ |

---

## 🚀 Quick Start

```bash
# 1. Install Ollama (ollama.com/download)
# 2. Pull the vision model
ollama pull llava

# 3. Start Ollama server
ollama serve

# 4. Install Python deps
pip install streamlit pillow requests folium streamlit-folium

# 5. Run WildGuide
streamlit run app.py
```

## 🔄 Model Options
```bash
ollama pull llava          # Default — balanced speed & quality
ollama pull llava:13b      # Larger — more accurate
ollama pull bakllava       # Alternative architecture  
ollama pull llava-llama3   # Latest — best quality
```

---

*Built for the "Touch Grass" hackathon — because the best AI gets you off the screen.*
    """)

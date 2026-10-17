# 🌿 WildGuide — Offline Nature Companion

> **"The best AI gets you off the screen and onto the trail."**

An offline-first nature companion powered by [Ollama](https://ollama.com/) + open-weight vision models. Identify plants, birds, mushrooms, and insects from trail photos — **with zero internet connection, zero API fees, and zero data leaving your device.**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Nature Identifier** | AI identifies plants, birds, mushrooms & insects from photos |
| 🌱 **Garden Planner** | Personalized planting calendar based on your frost zone |
| 📓 **Nature Journal** | Log & export your sightings with GPS coordinates |
| 🗺️ **Trail Map** | Visualize sightings on an interactive map |
| 🥾 **Trail Advisor** | AI-powered nature outing recommendations |

---

## 🚀 Quick Start

### 1. Install Ollama
Download from [ollama.com/download](https://ollama.com/download)

### 2. Pull a Vision Model
```bash
ollama pull llava          # Recommended — fast & accurate
# or for better quality:
ollama pull llava:13b
ollama pull llava-llama3
```

### 3. Start Ollama
```bash
ollama serve
```

### 4. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 5. Run WildGuide
```bash
streamlit run app.py
```

Open your browser to `http://localhost:8501` 🌿

---

## 🔄 Swapping Models

One of the best things about open-source AI — swap your model anytime:

```bash
ollama pull bakllava       # Alternative architecture
ollama pull llava:34b      # Maximum quality (needs 20GB+ RAM)
ollama pull moondream      # Lightweight — great for older hardware
```

Then just select the new model from the dropdown in the app. No code changes needed.

---

## 🔒 Why Open-Source AI?

| Concern | Closed API | WildGuide (Open) |
|---------|-----------|-----------------|
| Privacy | Photos sent to servers | **Never leaves your device** |
| Internet | Required | **Works offline on trail** |
| Cost | Pay per query | **Free forever** |
| Customization | Limited | **Fine-tune on local species** |
| Rare species data | Shared with company | **Stays private** |

---

## ⚠️ Safety Disclaimer

**Mushroom identification**: Never eat a wild mushroom based solely on AI identification. Always verify with a certified mycologist or local mycological society. Misidentification can be fatal.

**Plant foraging**: Treat AI identification as a starting point, not a final answer. Consult field guides and local experts before consuming any wild plant.

---

## 🌍 Open Source Stack

- **[Ollama](https://github.com/ollama/ollama)** — MIT License — local LLM runtime
- **[LLaVA](https://llava-vl.github.io/)** — open weights — vision-language model
- **[Streamlit](https://streamlit.io/)** — Apache 2.0 — web UI framework  
- **[Folium](https://python-visualization.github.io/folium/)** — MIT — interactive maps

---

*Built for the "Touch Grass" hackathon. Go outside. 🌿*

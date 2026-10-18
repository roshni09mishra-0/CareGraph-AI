"use client";

import React, { useState } from "react";
import {
  PhoneCall,
  Search,
  Layers,
  HeartPulse,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  Clock,
  Sparkles,
  ArrowRight,
  Activity,
  CheckCircle2,
  Stethoscope,
  BedDouble,
  Building2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface ClinicalHeroBannerProps {
  onStartConsultation: () => void;
  onViewGraph: () => void;
  onSelectSymptomQuery: (query: string) => void;
  onSelectHospital: (hospitalId: string) => void;
  activePatientName?: string;
  activePatientBlood?: string;
}

// 5 Network Hospitals styled after the 5 NHS Barts Health architectural facility cards
const NETWORK_FACILITIES = [
  {
    id: "hosp-aiims",
    name: "AIIMS Trauma Center",
    city: "New Delhi",
    specialty: "Level-1 Trauma & Cardio",
    bedsAvailable: 4,
    distance: "2.4 km",
    iconType: "classic",
  },
  {
    id: "hosp-apollo",
    name: "Apollo Indraprastha",
    city: "South Delhi",
    specialty: "Interventional Neuro",
    bedsAvailable: 3,
    distance: "5.1 km",
    iconType: "tower",
  },
  {
    id: "hosp-fortis",
    name: "Fortis Escorts Heart",
    city: "Okhla",
    specialty: "Cardiac Cath Lab",
    bedsAvailable: 2,
    distance: "6.8 km",
    iconType: "heart",
  },
  {
    id: "hosp-safdarjung",
    name: "Safdarjung Emergency",
    city: "Ring Road",
    specialty: "Critical Burn & Trauma",
    bedsAvailable: 5,
    distance: "3.2 km",
    iconType: "emergency",
  },
  {
    id: "hosp-kem",
    name: "KEM Hospital & College",
    city: "Mumbai",
    specialty: "24/7 Acute Casualty",
    bedsAvailable: 4,
    distance: "8.5 km",
    iconType: "campus",
  },
];

const POPULAR_SYMPTOM_TAGS = [
  { label: "🔴 Chest Pain / सीने में दर्द", query: "सीने में बहुत तेज असहनीय दर्द हो रहा है" },
  { label: "⚡ Left Arm Pain / बायाँ हाथ", query: "बाएँ हाथ में खिंचाव और सुन्नता आ रही है" },
  { label: "🫁 Breathlessness / साँस फूलना", query: "साँस लेने में गंभीर तकलीफ़ और घरघराहट है" },
  { label: "🧊 Cold Sweats / ठंडा पसीना", query: "बहुत ठंडा पसीना छूट रहा है और चक्कर आ रहे हैं" },
  { label: "🧠 Facial Droop / Stroke", query: "चेहरे का एक तरफ झुकना और बोलने में लड़खड़ाहट" },
];

export default function ClinicalHeroBanner({
  onStartConsultation,
  onViewGraph,
  onSelectSymptomQuery,
  onSelectHospital,
  activePatientName = "Rajesh Kumar",
  activePatientBlood = "B+",
}: ClinicalHeroBannerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSelectSymptomQuery(searchQuery.trim());
      onStartConsultation();
    } else {
      onStartConsultation();
    }
  };

  const handleTagClick = (query: string) => {
    setSearchQuery(query);
    onSelectSymptomQuery(query);
    onStartConsultation();
  };

  const handleFacilityClick = (hospitalId: string) => {
    setSelectedFacility(hospitalId);
    onSelectHospital(hospitalId);
  };

  return (
    <section className="relative overflow-hidden bg-[#00607d] text-white">
      {/* =========================================================================
          BACKGROUND SYSTEM:
          Authentic NHS Barts Health Luminous Cyan/Teal Overlay Wash
          + Maven Clinic Human-Centric Medical Tone
      ========================================================================= */}
      
      {/* Base Layer: Clinical Photographic Hospital Background (Doctors & Nurses in Scrub Uniforms) */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-50 mix-blend-overlay scale-105"
        style={{
          backgroundImage: "url('/images/doctor-patient-hero.jpg')",
          filter: "contrast(1.25) brightness(1.1)",
        }}
      />

      {/* Luminous NHS Cyan-Teal Gradient Wash (Matches NHS Barts Health reference image) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(140deg, 
              rgba(0, 102, 136, 0.88) 0%, 
              rgba(7, 142, 174, 0.80) 42%, 
              rgba(11, 128, 120, 0.84) 75%,
              rgba(4, 98, 88, 0.92) 100%
            )
          `,
        }}
      />

      {/* Soft Luminous Medical Radial Highlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-cyan-300/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[350px] bg-emerald-400/20 blur-[100px] pointer-events-none" />

      {/* =========================================================================
          HERO MAIN CONTENT CONTAINER
          Layout matches NHS Barts Health:
          1. Large Welcoming Heading & Subtitle
          2. The 5 Connected Hospital Outlined Glass Cards
          3. Prominent White Symptom Search Bar
          4. Maven Clinic Action CTAs & Trust Badges
      ========================================================================= */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-14 sm:pt-16 sm:pb-20 flex flex-col items-center text-center space-y-8">
        
        {/* Top Eyebrow Badge (Maven Style) */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/20 border border-white/30 backdrop-blur-md text-xs font-semibold text-white shadow-sm transition">
          <Sparkles className="w-3.5 h-3.5 text-teal-200 animate-pulse" />
          <span>FalkorDB Graph Hacks 2026 • AIIMS &amp; Apollo Connected Network</span>
        </div>

        {/* 1. WELCOME HEADINGS (Faithful to NHS Barts Health "Welcome to Barts Health") */}
        <div className="max-w-4xl space-y-3">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Welcome to CareGraph AI
          </h1>
          <p className="text-lg sm:text-2xl text-teal-50/95 font-light tracking-wide max-w-3xl mx-auto">
            Delivering safe, rapid, and compassionate healthcare triage across India
          </p>
        </div>

        {/* =========================================================================
            2. THE 5 CONNECTED HOSPITAL OUTLINED CARDS (Iconic NHS Barts Health Layout)
            5 outlined architectural glass tiles side-by-side in a responsive row
        ========================================================================= */}
        <div className="w-full max-w-6xl mx-auto space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {NETWORK_FACILITIES.map((facility) => {
              const isSelected = selectedFacility === facility.id;
              return (
                <div
                  key={facility.id}
                  onClick={() => handleFacilityClick(facility.id)}
                  className={`group relative rounded-xl p-4 text-center cursor-pointer transition-all duration-300 border flex flex-col items-center justify-between backdrop-blur-md ${
                    isSelected
                      ? "bg-white/30 border-white shadow-2xl shadow-cyan-950/40 -translate-y-1.5 ring-2 ring-white"
                      : "bg-white/12 hover:bg-white/22 border-white/35 hover:border-white/70 hover:-translate-y-1 shadow-lg"
                  }`}
                >
                  {/* Clean White Architectural Hospital Outline SVG (NHS Style) */}
                  <div className="w-16 h-14 mb-2 flex items-center justify-center text-white group-hover:scale-105 transition-transform duration-300">
                    {facility.iconType === "classic" && (
                      <svg viewBox="0 0 64 48" className="w-14 h-12 stroke-white fill-none stroke-[1.9] stroke-linecap-round stroke-linejoin-round">
                        {/* Classical Pediment & Columns (AIIMS) */}
                        <polygon points="32 5, 8 16, 56 16" />
                        <line x1="12" y1="16" x2="12" y2="40" />
                        <line x1="22" y1="16" x2="22" y2="40" />
                        <line x1="32" y1="16" x2="32" y2="40" />
                        <line x1="42" y1="16" x2="42" y2="40" />
                        <line x1="52" y1="16" x2="52" y2="40" />
                        <rect x="6" y="40" width="52" height="4" rx="1" />
                        <circle cx="32" cy="11" r="2" fill="white" />
                      </svg>
                    )}

                    {facility.iconType === "tower" && (
                      <svg viewBox="0 0 64 48" className="w-14 h-12 stroke-white fill-none stroke-[1.9] stroke-linecap-round stroke-linejoin-round">
                        {/* Medical Tower & Wings (Apollo) */}
                        <rect x="20" y="6" width="24" height="38" rx="1" />
                        <rect x="8" y="18" width="12" height="26" rx="1" />
                        <rect x="44" y="18" width="12" height="26" rx="1" />
                        <line x1="24" y1="13" x2="28" y2="13" />
                        <line x1="36" y1="13" x2="40" y2="13" />
                        <line x1="24" y1="20" x2="28" y2="20" />
                        <line x1="36" y1="20" x2="40" y2="20" />
                        <line x1="24" y1="27" x2="28" y2="27" />
                        <line x1="36" y1="27" x2="40" y2="27" />
                        <path d="M30 35 h4 M32 33 v4" strokeWidth="2.2" />
                      </svg>
                    )}

                    {facility.iconType === "heart" && (
                      <svg viewBox="0 0 64 48" className="w-14 h-12 stroke-white fill-none stroke-[1.9] stroke-linecap-round stroke-linejoin-round">
                        {/* Specialized Heart Hospital (Fortis) */}
                        <rect x="12" y="14" width="40" height="30" rx="2" />
                        <polygon points="32 6, 12 14, 52 14" />
                        <path d="M32 24 C30 21, 24 21, 24 26 C24 31, 32 35, 32 35 C32 35, 40 31, 40 26 C40 21, 34 21, 32 24 Z" fill="rgba(255,255,255,0.25)" />
                      </svg>
                    )}

                    {facility.iconType === "emergency" && (
                      <svg viewBox="0 0 64 48" className="w-14 h-12 stroke-white fill-none stroke-[1.9] stroke-linecap-round stroke-linejoin-round">
                        {/* Emergency Pavilion & Dome (Safdarjung) */}
                        <path d="M10 20 L32 8 L54 20 L54 44 L10 44 Z" />
                        <rect x="26" y="28" width="12" height="16" rx="1" />
                        <circle cx="32" cy="18" r="4" />
                        <line x1="32" y1="16" x2="32" y2="18" />
                        <line x1="32" y1="18" x2="34" y2="18" />
                      </svg>
                    )}

                    {facility.iconType === "campus" && (
                      <svg viewBox="0 0 64 48" className="w-14 h-12 stroke-white fill-none stroke-[1.9] stroke-linecap-round stroke-linejoin-round">
                        {/* Multi-Wing Medical Campus (KEM Hospital) */}
                        <rect x="16" y="10" width="32" height="34" rx="1" />
                        <path d="M8 24 L16 20 V44 H8 Z" />
                        <path d="M56 24 L48 20 V44 H56 Z" />
                        <line x1="22" y1="17" x2="26" y2="17" />
                        <line x1="38" y1="17" x2="42" y2="17" />
                        <line x1="22" y1="25" x2="26" y2="25" />
                        <line x1="38" y1="25" x2="42" y2="25" />
                        <line x1="32" y1="36" x2="32" y2="44" />
                      </svg>
                    )}
                  </div>

                  {/* Hospital Name & Info */}
                  <div className="w-full space-y-1">
                    <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-teal-100 transition-colors line-clamp-1">
                      {facility.name}
                    </h3>
                    <p className="text-[11px] text-teal-100/80 font-normal">
                      {facility.city}
                    </p>
                  </div>

                  {/* Live Bed Count Pill */}
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    <span>{facility.bedsAvailable} ICU Beds</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            3. PROMINENT WHITE SEARCH BAR (Directly from NHS Barts Health reference)
            Wide white search pill with dark text and crisp search icon
        ========================================================================= */}
        <div className="w-full max-w-4xl mx-auto space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <div className="relative w-full flex items-center bg-white rounded-lg sm:rounded-full shadow-2xl p-2 pl-6 border border-white focus-within:ring-4 focus-within:ring-cyan-300/50 transition-all">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter keywords or symptoms (e.g. सीने में तेज दर्द, severe chest pain, सांस फूलना)..."
                className="w-full text-slate-900 placeholder:text-slate-400 bg-transparent text-sm sm:text-base font-medium focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#00607d] hover:bg-[#004e66] text-white font-bold text-xs sm:text-sm px-7 py-3 rounded-md sm:rounded-full flex items-center gap-2 shadow-md transition active:scale-95 shrink-0"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Triage Now</span>
              </button>
            </div>
          </form>

          {/* Quick-Click Symptom Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-white/70 font-semibold text-[11px] uppercase tracking-wider">
              Quick Triggers:
            </span>
            {POPULAR_SYMPTOM_TAGS.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTagClick(tag.query)}
                className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white backdrop-blur-sm transition-all duration-150 active:scale-95 text-xs font-medium"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================================
            4. ACTION CTAS (Maven Clinic inspired mint green + white glass outline)
        ========================================================================= */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
          <button
            onClick={onStartConsultation}
            className="px-8 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-cyan-950/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PhoneCall className="w-5 h-5 text-slate-950" />
            <span>Start Voice Consultation (हिंदी / English)</span>
          </button>

          <button
            onClick={onViewGraph}
            className="px-8 py-3.5 rounded-full bg-white/12 hover:bg-white/22 border border-white/40 text-white font-bold text-sm sm:text-base flex items-center gap-2.5 backdrop-blur-md shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Layers className="w-5 h-5 text-teal-200" />
            <span>Explore Clinical Decision Graph</span>
          </button>
        </div>

        {/* 5. TRUST PILLARS (Clean, transparent NHS footer bar) */}
        <div className="w-full max-w-5xl mx-auto pt-6 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
          <div className="p-3 rounded-xl bg-white/8 border border-white/15 backdrop-blur-sm">
            <span className="text-2xl sm:text-3xl font-extrabold text-white block">&lt; 15 ms</span>
            <span className="text-xs text-white/90 font-medium">Cypher Traversal</span>
            <span className="text-[10px] text-teal-100/70 block">In-memory FalkorDB Engine</span>
          </div>

          <div className="p-3 rounded-xl bg-white/8 border border-white/15 backdrop-blur-sm">
            <span className="text-2xl sm:text-3xl font-extrabold text-white block">63 Nodes</span>
            <span className="text-xs text-white/90 font-medium">Medical Ontologies</span>
            <span className="text-[10px] text-teal-100/70 block">SNOMED &amp; ICD-10 Mapped</span>
          </div>

          <div className="p-3 rounded-xl bg-white/8 border border-white/15 backdrop-blur-sm">
            <span className="text-2xl sm:text-3xl font-extrabold text-white block">100%</span>
            <span className="text-xs text-white/90 font-medium">Deterministic Logic</span>
            <span className="text-[10px] text-teal-100/70 block">Zero LLM Hallucination</span>
          </div>

          <div className="p-3 rounded-xl bg-white/8 border border-white/15 backdrop-blur-sm">
            <span className="text-2xl sm:text-3xl font-extrabold text-white block">11+</span>
            <span className="text-xs text-white/90 font-medium">Indian Languages</span>
            <span className="text-[10px] text-teal-100/70 block">Real-time Voice Synthesis</span>
          </div>
        </div>

      </div>
    </section>
  );
}

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

// 5 Network Hospitals styled after the 5 NHS Barts Health facility cards
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
    specialty: "Advanced Cardiac Cath Lab",
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
    <section className="relative overflow-hidden bg-slate-950 text-white border-b border-teal-900/40">
      {/* =========================================================================
          BACKGROUND SYSTEM:
          Fusion of NHS Barts Health (clinical cyan/teal wash over hospital staff)
          + Maven Clinic (warm, human-centric emerald & forest slate depth)
      ========================================================================= */}
      
      {/* Base Layer: Clinical Photographic Hospital Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity scale-105 pointer-events-none"
        style={{
          backgroundImage: "url('/images/doctor-patient-hero.jpg')",
          filter: "contrast(1.15) brightness(0.9)",
        }}
      />

      {/* Primary Wash: Multi-stop NHS Teal + Maven Emerald Gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(4, 52, 68, 0.94) 0%, 
              rgba(10, 88, 106, 0.88) 32%, 
              rgba(6, 78, 72, 0.89) 65%, 
              rgba(2, 44, 34, 0.96) 100%
            )
          `,
        }}
      />

      {/* Atmospheric Radial Highlights (Teal Top-Center & Mint Glow Bottom-Right) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px] bg-gradient-to-b from-cyan-400/20 via-teal-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[450px] bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />

      {/* Top Status Announcement Bar */}
      <div className="relative border-b border-white/10 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-emerald-200">
              National Triage Network Online
            </span>
            <span className="hidden md:inline text-white/40">•</span>
            <span className="hidden md:inline text-white/80">
              FalkorDB Sub-15ms 5-Hop Cypher Engine Active
            </span>
          </div>

          <div className="flex items-center gap-4 text-white/70">
            <span className="flex items-center gap-1.5 text-white/90 font-medium">
              <Globe className="w-3.5 h-3.5 text-teal-300" />
              <span>11+ Indian Languages</span>
            </span>
            <span className="hidden sm:inline text-white/40">•</span>
            <span className="hidden sm:flex items-center gap-1 text-emerald-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Zero Hallucination Ontologies
            </span>
          </div>
        </div>
      </div>

      {/* Main Hero Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-12 sm:pt-14 sm:pb-16 flex flex-col items-center text-center space-y-8">
        
        {/* Maven-style Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md text-xs font-semibold text-emerald-200 shadow-sm transition">
          <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
          <span>FalkorDB Graph Hacks 2026 • AIIMS & Apollo Connected CAD</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/60" />
        </div>

        {/* Hero Headings (NHS Authority + Maven Editorial Warmth) */}
        <div className="max-w-4xl space-y-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Delivering Rapid, Compassionate{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-emerald-200 to-teal-100">
              Emergency Healthcare Triage
            </span>
          </h1>
          <p className="text-base sm:text-xl text-teal-50/90 font-normal leading-relaxed max-w-3xl mx-auto">
            Speak emergency symptoms naturally in <strong>11+ Indian languages</strong> or English. 
            Instant 5-hop FalkorDB Cypher traversal pinpoints critical conditions, reserves verified ICU beds, 
            and dispatches hospital CAD teams with zero medical hallucination.
          </p>
        </div>

        {/* Action Buttons (Maven-style Emerald High-Contrast Pill + Glass Outline) */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={onStartConsultation}
            className="px-7 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-emerald-950/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PhoneCall className="w-5 h-5 text-slate-950" />
            <span>Start Voice Consultation (हिंदी / English)</span>
          </button>

          <button
            onClick={onViewGraph}
            className="px-7 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm sm:text-base flex items-center gap-2.5 backdrop-blur-md shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Layers className="w-5 h-5 text-teal-300" />
            <span>Explore Clinical Decision Graph</span>
          </button>
        </div>

        {/* =========================================================================
            5 CONNECTED HOSPITAL NETWORK CARDS (Directly inspired by NHS Barts Health)
            5 outlined architectural glass cards with live bed counts & city
        ========================================================================= */}
        <div className="w-full pt-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-white/80 max-w-6xl mx-auto px-1">
            <span className="font-bold uppercase tracking-wider text-teal-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-300" />
              Connected Emergency Network Hubs (FalkorDB Synced)
            </span>
            <span className="text-white/60 hidden sm:inline">
              Click any hospital to filter decision paths & live ICU beds
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
            {NETWORK_FACILITIES.map((facility) => {
              const isSelected = selectedFacility === facility.id;
              return (
                <div
                  key={facility.id}
                  onClick={() => handleFacilityClick(facility.id)}
                  className={`group relative rounded-xl p-4 text-center cursor-pointer transition-all duration-300 border flex flex-col items-center justify-between backdrop-blur-md ${
                    isSelected
                      ? "bg-white/25 border-emerald-400 shadow-xl shadow-emerald-950/30 -translate-y-1 ring-2 ring-emerald-400/50"
                      : "bg-white/10 hover:bg-white/18 border-white/25 hover:border-white/50 hover:-translate-y-1 shadow-md"
                  }`}
                >
                  {/* Outlined Hospital Architectural Icon (NHS Style) */}
                  <div className="w-16 h-14 mb-2 flex items-center justify-center text-white/90 group-hover:text-emerald-200 transition-colors">
                    {facility.iconType === "classic" && (
                      <svg viewBox="0 0 64 48" className="w-14 h-12 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
                        {/* Pediment & Columns (AIIMS Classic Architecture) */}
                        <polygon points="32 4, 8 16, 56 16" />
                        <line x1="12" y1="16" x2="12" y2="40" />
                        <line x1="22" y1="16" x2="22" y2="40" />
                        <line x1="32" y1="16" x2="32" y2="40" />
                        <line x1="42" y1="16" x2="42" y2="40" />
                        <line x1="52" y1="16" x2="52" y2="40" />
                        <rect x="6" y="40" width="52" height="4" rx="1" />
                        <circle cx="32" cy="11" r="2" fill="currentColor" />
                      </svg>
                    )}

                    {facility.iconType === "tower" && (
                      <svg viewBox="0 0 64 48" className="w-14 h-12 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
                        {/* Modern Medical Tower (Apollo Architecture) */}
                        <rect x="20" y="6" width="24" height="38" rx="1" />
                        <rect x="8" y="18" width="12" height="26" rx="1" />
                        <rect x="44" y="18" width="12" height="26" rx="1" />
                        {/* Windows */}
                        <line x1="24" y1="12" x2="28" y2="12" />
                        <line x1="36" y1="12" x2="40" y2="12" />
                        <line x1="24" y1="18" x2="28" y2="18" />
                        <line x1="36" y1="18" x2="40" y2="18" />
                        <line x1="24" y1="24" x2="28" y2="24" />
                        <line x1="36" y1="24" x2="40" y2="24" />
                        {/* Medical Cross */}
                        <path d="M30 32 h4 M32 30 v4" strokeWidth="2.2" />
                      </svg>
                    )}

                    {facility.iconType === "heart" && (
                      <svg viewBox="0 0 64 48" className="w-14 h-12 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
                        {/* Specialized Cardiac Center (Fortis) */}
                        <rect x="12" y="14" width="40" height="30" rx="2" />
                        <polygon points="32 6, 12 14, 52 14" />
                        <path d="M32 23 C30 20, 24 20, 24 25 C24 30, 32 34, 32 34 C32 34, 40 30, 40 25 C40 20, 34 20, 32 23 Z" fill="rgba(16,185,129,0.3)" />
                      </svg>
                    )}

                    {facility.iconType === "emergency" && (
                      <svg viewBox="0 0 64 48" className="w-14 h-12 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
                        {/* Emergency Pavilion & Clock (Safdarjung) */}
                        <path d="M10 20 L32 8 L54 20 L54 44 L10 44 Z" />
                        <rect x="26" y="28" width="12" height="16" rx="1" />
                        <circle cx="32" cy="18" r="4" />
                        <line x1="32" y1="16" x2="32" y2="18" />
                        <line x1="32" y1="18" x2="34" y2="18" />
                      </svg>
                    )}

                    {facility.iconType === "campus" && (
                      <svg viewBox="0 0 64 48" className="w-14 h-12 stroke-current fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
                        {/* Multi-Wing Medical Campus (KEM Hospital) */}
                        <rect x="16" y="10" width="32" height="34" rx="1" />
                        <path d="M8 24 L16 20 V44 H8 Z" />
                        <path d="M56 24 L48 20 V44 H56 Z" />
                        <line x1="22" y1="16" x2="26" y2="16" />
                        <line x1="38" y1="16" x2="42" y2="16" />
                        <line x1="22" y1="24" x2="26" y2="24" />
                        <line x1="38" y1="24" x2="42" y2="24" />
                        <line x1="32" y1="36" x2="32" y2="44" />
                      </svg>
                    )}
                  </div>

                  {/* Hospital Details */}
                  <div className="w-full space-y-1">
                    <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-emerald-200 transition-colors line-clamp-1">
                      {facility.name}
                    </h3>
                    <p className="text-[10px] text-teal-100/70 font-medium">
                      {facility.city} • {facility.distance}
                    </p>
                  </div>

                  {/* Bed Pill */}
                  <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{facility.bedsAvailable} ICU Beds</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            SEARCH BAR (Directly inspired by NHS Barts Health search bar)
            Wide, clean white search pill with instant trigger
        ========================================================================= */}
        <div className="w-full max-w-4xl mx-auto pt-2 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <div className="relative w-full flex items-center bg-white rounded-full shadow-2xl p-2 pl-6 border-2 border-white/90 focus-within:ring-4 focus-within:ring-teal-400/40 transition-all">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter symptoms (e.g. सीने में तेज दर्द, severe chest pain, सांस फूलना, high fever)..."
                className="w-full text-slate-900 placeholder:text-slate-400 bg-transparent text-sm sm:text-base font-semibold focus:outline-none"
              />
              <button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full flex items-center gap-2 shadow-md transition active:scale-95 shrink-0"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Triage Now</span>
              </button>
            </div>
          </form>

          {/* Quick-Click Symptom Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-white/60 font-semibold text-[11px] uppercase tracking-wider">
              Quick Evaluate:
            </span>
            {POPULAR_SYMPTOM_TAGS.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTagClick(tag.query)}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-teal-100 hover:text-white backdrop-blur-sm transition-all duration-150 active:scale-95 text-xs font-medium"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================================
            4 CLINICAL TRUST METRICS (NHS + Maven credibility row)
        ========================================================================= */}
        <div className="w-full max-w-5xl mx-auto pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-2xl sm:text-3xl font-black text-emerald-300 block">&lt; 15 ms</span>
            <span className="text-xs text-white/80 font-medium">Cypher Path Traversal</span>
            <span className="text-[10px] text-white/50 block">In-memory FalkorDB C-Engine</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-2xl sm:text-3xl font-black text-teal-300 block">63 Nodes</span>
            <span className="text-xs text-white/80 font-medium">Verified Medical Ontologies</span>
            <span className="text-[10px] text-white/50 block">SNOMED &amp; ICD-10 Aligned</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-2xl sm:text-3xl font-black text-emerald-300 block">100%</span>
            <span className="text-xs text-white/80 font-medium">Deterministic Graph Paths</span>
            <span className="text-[10px] text-white/50 block">Zero LLM Hallucination</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-2xl sm:text-3xl font-black text-cyan-300 block">11+</span>
            <span className="text-xs text-white/80 font-medium">Indian Regional Languages</span>
            <span className="text-[10px] text-white/50 block">Voice Synthesized with Murf AI</span>
          </div>
        </div>

      </div>
    </section>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  HeartPulse,
  PhoneCall,
  Activity,
  ShieldAlert,
  Hospital,
  BedDouble,
  User,
  Clock,
  Terminal,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Volume2,
  Lock,
  Search,
  Check,
  Stethoscope,
  ShieldCheck,
  Award,
} from "lucide-react";
import VoiceSoftphone from "./VoiceSoftphone";
import GraphVisualizer from "./GraphVisualizer";
import CypherConsole from "./CypherConsole";
import FollowUpQueue from "./FollowUpQueue";
import DispatchCadCenter from "./DispatchCadCenter";
import NodeInspectorDrawer from "./NodeInspectorDrawer";
import DispatchModal from "./DispatchModal";
import { GraphData, GraphNode, CypherFiveHopResult, DispatchRecord } from "@/lib/falkordb/types";
import { INITIAL_HOSPITALS, INITIAL_BEDS } from "@/lib/falkordb/seed";

export const PATIENTS_LIST = [
  {
    id: "pat-rajesh",
    name: "Rajesh Kumar",
    age: 52,
    gender: "Male",
    blood: "B+",
    phone: "+91 98101 23456",
    allergies: ["Penicillin", "Aspirin"],
    chronic: "Hypertension (Grade 1)",
  },
  {
    id: "pat-sunita",
    name: "Sunita Devi",
    age: 64,
    gender: "Female",
    blood: "O+",
    phone: "+91 94150 88219",
    allergies: ["Ceftriaxone"],
    chronic: "Type 2 Diabetes, COPD",
  },
  {
    id: "pat-amit",
    name: "Amit Patel",
    age: 45,
    gender: "Male",
    blood: "AB+",
    phone: "+91 99090 12833",
    allergies: ["None known"],
    chronic: "None reported",
  },
  {
    id: "pat-priya",
    name: "Priya Sharma",
    age: 29,
    gender: "Female",
    blood: "A+",
    phone: "+91 98230 44102",
    allergies: ["Sulfamethoxazole"],
    chronic: "Mild Bronchial Asthma",
  },
];

const HOSPITAL_PHOTOS: Record<string, string> = {
  "hosp-aiims": "/images/hospital-aiims.jpg",
  "hosp-apollo": "/images/hospital-apollo.jpg",
  "hosp-fortis": "/images/hospital-fortis.jpg",
  "hosp-kem": "/images/hospital-kem.jpg",
};

export default function CareGraphDashboard() {
  const [activePatient, setActivePatient] = useState(PATIENTS_LIST[0]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [activePathNodeIds, setActivePathNodeIds] = useState<string[]>([]);
  const [activePathEdgeIds, setActivePathEdgeIds] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [reasoningResult, setReasoningResult] = useState<CypherFiveHopResult | null>(null);
  const [dispatchRecords, setDispatchRecords] = useState<DispatchRecord[]>([]);
  const [activeModalRecord, setActiveModalRecord] = useState<DispatchRecord | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [activeTab, setActiveTab] = useState<"triage" | "graph" | "dispatch" | "followup" | "cypher">("triage");

  const triageSectionRef = useRef<HTMLDivElement | null>(null);

  const refreshGraph = async () => {
    try {
      const res = await fetch("/api/caregraph/graph");
      const data = await res.json();
      if (data.success && data.data) {
        setGraphData(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch graph data:", e);
    }
  };

  useEffect(() => {
    refreshGraph();
  }, []);

  const handleResetGraph = async () => {
    try {
      const res = await fetch("/api/caregraph/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGraphData(data.data);
        setActivePathNodeIds([]);
        setActivePathEdgeIds([]);
        setReasoningResult(null);
        setSelectedNode(null);
      }
    } catch (e) {
      console.error("Reset graph failed:", e);
    }
  };

  const handleTriageComplete = (triageOutput: any) => {
    if (triageOutput.reasoningResult) {
      setReasoningResult(triageOutput.reasoningResult);
    }
    if (triageOutput.traversalPathNodeIds) {
      setActivePathNodeIds(triageOutput.traversalPathNodeIds);
    }
    if (triageOutput.traversalPathEdgeIds) {
      setActivePathEdgeIds(triageOutput.traversalPathEdgeIds);
    }
    refreshGraph();
  };

  const handleTriggerDispatch = async () => {
    if (!reasoningResult) return;
    setIsDispatching(true);

    try {
      const res = await fetch("/api/caregraph/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: activePatient.id,
          reasoningResult,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setDispatchRecords((prev) => [data.data, ...prev]);
        setActiveModalRecord(data.data);
        refreshGraph();
      }
    } catch (e) {
      console.error("Emergency dispatch error:", e);
    } finally {
      setIsDispatching(false);
    }
  };

  const scrollToTriage = () => {
    triageSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-teal-700 selection:text-white">
      {/* MAIN HEADER (Clean White Healthcare Navigation) */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-sm">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  CAREGRAPH <span className="text-teal-700">AI</span>
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wide">
                  TELE-TRIAGE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal hidden sm:block">
                Indian Voice & Knowledge Graph Healthcare Dispatch
              </p>
            </div>
          </div>

          {/* Navigation Links (Practo/Apollo clean tabs) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <button
              onClick={() => { setActiveTab("triage"); scrollToTriage(); }}
              className={`hover:text-teal-700 transition ${activeTab === "triage" ? "text-teal-700 font-bold" : ""}`}
            >
              Voice Consultation
            </button>
            <button
              onClick={() => { setActiveTab("graph"); scrollToTriage(); }}
              className={`hover:text-teal-700 transition ${activeTab === "graph" ? "text-teal-700 font-bold" : ""}`}
            >
              Clinical Graph
            </button>
            <button
              onClick={() => { setActiveTab("dispatch"); scrollToTriage(); }}
              className={`hover:text-teal-700 transition ${activeTab === "dispatch" ? "text-teal-700 font-bold" : ""}`}
            >
              Hospital ICU Dispatch
            </button>
            <button
              onClick={() => { setActiveTab("followup"); scrollToTriage(); }}
              className={`hover:text-teal-700 transition ${activeTab === "followup" ? "text-teal-700 font-bold" : ""}`}
            >
              24h Follow-up
            </button>
            <button
              onClick={() => { setActiveTab("cypher"); scrollToTriage(); }}
              className={`hover:text-teal-700 transition ${activeTab === "cypher" ? "text-teal-700 font-bold" : ""}`}
            >
              Cypher Logic
            </button>
          </nav>

          {/* Patient Selector & Consult Button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
              <User className="w-4 h-4 text-slate-500" />
              <select
                value={activePatient.id}
                onChange={(e) => {
                  const p = PATIENTS_LIST.find((item) => item.id === e.target.value);
                  if (p) {
                    setActivePatient(p);
                    setReasoningResult(null);
                    setActivePathNodeIds([]);
                    setActivePathEdgeIds([]);
                  }
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {PATIENTS_LIST.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.blood})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={scrollToTriage}
              className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Voice Consultation</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (Practo / Apollo 24|7 style trustworthy healthcare hero) */}
      <section className="bg-slate-50 border-b border-slate-200 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                Verified Indian Clinical Decision Support Platform
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Instant Doctor Triage. <br />
                <span className="text-teal-700">Connected ICU Beds.</span> <br />
                Real-Time Voice in Hindi & English.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Speak your emergency symptoms naturally in <strong>Hindi or English</strong>. Instant triage connects you to live ICU beds across AIIMS, Apollo, Fortis &amp; KEM with on-duty specialist doctors.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={scrollToTriage}
                  className="px-6 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-sm transition active:scale-95 flex items-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  Start Consultation (हिंदी / English)
                </button>

                <button
                  onClick={() => { setActiveTab("graph"); scrollToTriage(); }}
                  className="px-6 py-3.5 rounded-xl border border-slate-300 hover:border-teal-700 text-slate-700 hover:text-teal-700 font-bold text-sm transition flex items-center gap-2 bg-white shadow-sm"
                >
                  <Layers className="w-4 h-4" />
                  View Clinical Decision Graph
                </button>
              </div>

              {/* Verified Trust Badges */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-200 text-xs text-slate-600">
                <div>
                  <strong className="block text-base font-bold text-slate-900">4 Top Hospitals</strong>
                  AIIMS, Apollo, Fortis, KEM
                </div>
                <div>
                  <strong className="block text-base font-bold text-slate-900">&lt; 250 ms</strong>
                  Voice Response Latency
                </div>
                <div>
                  <strong className="block text-base font-bold text-slate-900">100% Graph-Based</strong>
                  Zero Medical Hallucination
                </div>
              </div>
            </div>

            {/* Right Hero Image Card (Authentic Clinical Consultation Photo) */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden group">
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-100">
                  <img
                    src="/images/doctor-patient-hero.jpg"
                    alt="Doctor examining senior patient in clinical emergency consultation"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-3 right-3 bg-teal-700 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase shadow">
                    Active Tele-Consultation
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[11px] font-mono text-teal-200 uppercase block">Live Doctor Rotation</span>
                    <h4 className="font-bold text-base">Dr. Ananya Sharma (Cardiology, AIIMS)</h4>
                  </div>
                </div>

                <div className="p-5 space-y-3 text-xs bg-white">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-800 text-xs">
                        {activePatient.blood}
                      </div>
                      <div>
                        <strong className="text-slate-900 text-sm block">{activePatient.name}</strong>
                        <span className="text-slate-500">{activePatient.gender}, {activePatient.age} yrs • {activePatient.phone}</span>
                      </div>
                    </div>
                    <span className="badge-verified">
                      Verified Patient
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Known Allergies:</span>
                    <strong className="text-red-600 font-bold">{activePatient.allergies.join(", ")}</strong>
                  </div>

                  <button
                    onClick={scrollToTriage}
                    className="w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <span>Consult with Dr. Ananya in Hindi/English</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CLINICAL SYMPTOMS & WARNING SIGNS (Real Editorial Photos, Practo/Apollo Style) */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 uppercase tracking-wider">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              Emergency Evaluation Guide
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Common Emergency Symptoms & Red Flags
            </h2>
            <p className="text-sm text-slate-600">
              Evaluated in real-time by CAREGRAPH AI. Click any card below to test the automated triage consultation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Chest Pain */}
            <div className="rounded-2xl bg-white border border-slate-200 hover:border-teal-600 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md group">
              <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                <img
                  src="/images/symptom-chest-pain.jpg"
                  alt="Adult experiencing severe chest pain"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow">
                  STEMI Flag 01
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                    Chest Discomfort / सीने में दर्द
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Crushing tightness, burning, or heaviness in the center of the chest lasting more than a few minutes.
                  </p>
                </div>
                <button
                  onClick={() => { setActiveTab("triage"); scrollToTriage(); }}
                  className="pt-2 text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 border-t border-slate-100"
                >
                  <span>Evaluate in Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 2: Radiating Arm Pain */}
            <div className="rounded-2xl bg-white border border-slate-200 hover:border-teal-600 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md group">
              <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                <img
                  src="/images/symptom-arm-pain.jpg"
                  alt="Patient experiencing pain radiating to left arm and shoulder"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow">
                  STEMI Flag 02
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                    Radiating Left Arm Pain / बाएँ हाथ
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Discomfort radiating down the left arm, shoulder, jaw, neck or upper back with accompanying numbness.
                  </p>
                </div>
                <button
                  onClick={() => { setActiveTab("triage"); scrollToTriage(); }}
                  className="pt-2 text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 border-t border-slate-100"
                >
                  <span>Evaluate in Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 3: Shortness of Breath */}
            <div className="rounded-2xl bg-white border border-slate-200 hover:border-teal-600 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md group">
              <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                <img
                  src="/images/symptom-breathlessness.jpg"
                  alt="Patient experiencing severe shortness of breath and hypoxia"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow">
                  Pneumonia / Hypoxia
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                    Shortness of Breath / साँस फूलना
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Difficulty breathing accompanied by productive cough, high fever, or pulse oximeter SpO2 drop below 88%.
                  </p>
                </div>
                <button
                  onClick={() => { setActiveTab("triage"); scrollToTriage(); }}
                  className="pt-2 text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 border-t border-slate-100"
                >
                  <span>Evaluate in Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card 4: Cold Sweats */}
            <div className="rounded-2xl bg-white border border-slate-200 hover:border-teal-600 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md group">
              <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                <img
                  src="/images/symptom-cold-sweats.jpg"
                  alt="Patient with cold diaphoresis and dizziness"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow">
                  Shock / Stroke
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                    Cold Sweats / ठंडा पसीना
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sudden cold diaphoresis, lightheadedness, or sudden facial droop indicating acute cerebrovascular event.
                  </p>
                </div>
                <button
                  onClick={() => { setActiveTab("triage"); scrollToTriage(); }}
                  className="pt-2 text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 border-t border-slate-100"
                >
                  <span>Evaluate in Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE CLINICAL WORKSPACE (Telemedicine Softphone + Decision Support Graph) */}
      <section ref={triageSectionRef} className="py-14 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
                Telemedicine Consultation Workspace
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Live Voice Intake & Clinical Decision Graph
              </h2>
            </div>

            {/* Practo style clean navigation pills */}
            <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 text-xs font-bold shadow-sm">
              <button
                onClick={() => setActiveTab("triage")}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTab === "triage" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Voice Call + Graph
              </button>
              <button
                onClick={() => setActiveTab("graph")}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTab === "graph" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Clinical Graph
              </button>
              <button
                onClick={() => setActiveTab("dispatch")}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTab === "dispatch" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hospital Dispatch
              </button>
              <button
                onClick={() => setActiveTab("followup")}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTab === "followup" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                24h Follow-up
              </button>
              <button
                onClick={() => setActiveTab("cypher")}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTab === "cypher" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cypher Logic
              </button>
            </div>
          </div>

          {/* MAIN WORKSPACE CONTAINER */}
          <div className="h-[750px] w-full rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden flex relative">
            {activeTab === "triage" && (
              <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
                {/* Left 45%: Voice Softphone */}
                <div className="w-full md:w-[46%] h-full flex flex-col shrink-0">
                  <VoiceSoftphone
                    activePatientId={activePatient.id}
                    activePatientName={activePatient.name}
                    reasoningResult={reasoningResult}
                    onTriageComplete={handleTriageComplete}
                    onTriggerDispatch={handleTriggerDispatch}
                    isDispatching={isDispatching}
                    onResetGraph={handleResetGraph}
                  />
                </div>

                {/* Right 54%: Graph Visualizer */}
                <div className="flex-1 h-full relative overflow-hidden bg-slate-50">
                  <GraphVisualizer
                    graphData={graphData}
                    activePathNodeIds={activePathNodeIds}
                    activePathEdgeIds={activePathEdgeIds}
                    onSelectNode={(node) => setSelectedNode(node)}
                    selectedNodeId={selectedNode?.id}
                    reasoningResult={reasoningResult}
                  />
                </div>
              </div>
            )}

            {activeTab === "graph" && (
              <div className="w-full h-full relative overflow-hidden bg-slate-50">
                <GraphVisualizer
                  graphData={graphData}
                  activePathNodeIds={activePathNodeIds}
                  activePathEdgeIds={activePathEdgeIds}
                  onSelectNode={(node) => setSelectedNode(node)}
                  selectedNodeId={selectedNode?.id}
                  reasoningResult={reasoningResult}
                />
              </div>
            )}

            {activeTab === "dispatch" && (
              <div className="w-full h-full overflow-hidden">
                <DispatchCadCenter
                  dispatchRecords={dispatchRecords}
                  onTriggerDirectDispatch={handleTriggerDispatch}
                />
              </div>
            )}

            {activeTab === "followup" && (
              <div className="w-full h-full overflow-hidden">
                <FollowUpQueue />
              </div>
            )}

            {activeTab === "cypher" && (
              <div className="w-full h-full overflow-hidden">
                <CypherConsole activePatientId={activePatient.id} />
              </div>
            )}

            {/* Node Inspector Drawer */}
            {selectedNode && (
              <NodeInspectorDrawer
                node={selectedNode}
                edges={graphData.edges}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </div>
        </div>
      </section>

      {/* 6. VERIFIED HOSPITAL NETWORK (Real Indian Centers with Photos) */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block mb-1">
                Verified Emergency Centers
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Participating Indian Hospital Emergency Network
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Real-time ICU Oxygen bed allocation via FalkorDB
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {INITIAL_HOSPITALS.map((hosp) => {
              const beds = INITIAL_BEDS.filter((b) => b.hospital_id === hosp.id);
              const icuAvailable = beds.filter((b) => b.type === "ICU_Oxygen" && b.is_available).length;
              const icuTotal = beds.filter((b) => b.type === "ICU_Oxygen").length;
              const photoUrl = HOSPITAL_PHOTOS[hosp.id] || "/images/hospital-aiims.jpg";

              return (
                <div
                  key={hosp.id}
                  className="rounded-2xl bg-white border border-slate-200 hover:border-teal-600 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden group"
                >
                  <div className="h-40 w-full relative overflow-hidden bg-slate-100">
                    <img
                      src={photoUrl}
                      alt={`${hosp.name} hospital building`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-teal-800 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow">
                      {hosp.city}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="badge-verified">
                          NABH / JCI
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{hosp.name}</h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 font-mono">
                        <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                        {hosp.phone}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600">ICU Oxygen Beds:</span>
                        <span className="text-emerald-700 font-bold">
                          {icuAvailable} / {icuTotal} Available
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${(icuAvailable / icuTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. AMBULANCE DISPATCH & 24H PATIENT RECOVERY SECTION */}
      <section className="py-14 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Ambulance CAD Dispatch */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-48 h-40 rounded-xl overflow-hidden shrink-0 relative bg-slate-100">
                <img
                  src="/images/ambulance-dispatch.jpg"
                  alt="Emergency ambulance paramedic team"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold tracking-wide uppercase">
                  EMERGENCY DISPATCH
                </span>
              </div>
              <div className="space-y-2 text-left">
                <h3 className="font-bold text-lg text-slate-900">
                  Automated PSTN Ambulance Dispatch
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upon detecting high-risk symptoms, the emergency dispatch engine auto-dials the hospital via Twilio PSTN: <em>“Emergency Alert from CAREGRAPH AI: Patient is en route. Reserve ICU Bed.”</em> Mutates graph: <code className="bg-slate-100 px-1 py-0.5 rounded text-red-700">SET b.is_available = false</code>.
                </p>
                <button
                  onClick={() => { setActiveTab("dispatch"); scrollToTriage(); }}
                  className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 pt-1"
                >
                  <span>Open Emergency CAD Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right: 24h Patient Follow-Up */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-48 h-40 rounded-xl overflow-hidden shrink-0 relative bg-slate-100">
                <img
                  src="/images/patient-recovery.jpg"
                  alt="Senior patient recovery and medication adherence check-in"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold tracking-wide uppercase">
                  24H CARE FOLLOW-UP
                </span>
              </div>
              <div className="space-y-2 text-left">
                <h3 className="font-bold text-lg text-slate-900">
                  24-Hour Recovery Check-In Dialer
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  24 hours post-triage, our automated recovery check-in calls the patient to verify medication adherence, symptom improvement, and ensure zero recurrence.
                </p>
                <button
                  onClick={() => { setActiveTab("followup"); scrollToTriage(); }}
                  className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 pt-1"
                >
                  <span>View 24h Follow-up Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. HEALTHCARE FOOTER (Practo / Apollo 24|7 style) */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t-4 border-teal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs leading-relaxed">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <HeartPulse className="w-5 h-5 text-teal-400" />
                <span className="tracking-wide">CAREGRAPH AI</span>
              </div>
              <p className="text-slate-400">
                Autonomous Multilingual Indian Voice & Knowledge Graph Healthcare Triage System powered by FalkorDB, LiveKit, and Murf Falcon.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase font-mono tracking-wider">Emergency Hotlines</h4>
              <p className="text-slate-400">Emergency Medical Service: <strong className="text-white">108</strong></p>
              <p className="text-slate-400">Ambulance Hotline: <strong className="text-white">102</strong></p>
              <p className="text-slate-400">National Health Helpline: <strong className="text-white">1800-180-1104</strong></p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase font-mono tracking-wider">Architecture Stack</h4>
              <p className="text-slate-400">Graph Database: <strong className="text-white">FalkorDB (Cypher)</strong></p>
              <p className="text-slate-400">Voice Synthesis: <strong className="text-white">Murf Falcon (sub-250ms)</strong></p>
              <p className="text-slate-400">Speech-to-Text: <strong className="text-white">Deepgram Nova-2 (hi-IN/en-IN)</strong></p>
              <p className="text-slate-400">Telephony: <strong className="text-white">Twilio PSTN CAD Engine</strong></p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white uppercase font-mono tracking-wider">Clinical Disclaimer</h4>
              <p className="text-slate-400">
                CAREGRAPH AI is an autonomous clinical dispatch and decision support system. In life-threatening emergencies, dial 108 directly or proceed to the nearest emergency room.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 CAREGRAPH AI • Modeled on Indian Healthcare Standards (Practo / Apollo 24|7).</span>
            <span className="font-mono text-slate-400">FalkorDB Graph Engine Active</span>
          </div>
        </div>
      </footer>

      {/* Emergency CAD Dispatch Modal Overlay */}
      {activeModalRecord && (
        <DispatchModal
          dispatchRecord={activeModalRecord}
          onClose={() => setActiveModalRecord(null)}
        />
      )}
    </div>
  );
}

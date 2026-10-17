import {
  PatientNode,
  SymptomNode,
  ConditionNode,
  DrugNode,
  HospitalNode,
  DoctorNode,
  BedNode,
  AgentSessionNode,
  GraphNode,
  GraphEdge
} from "./types";

export const INITIAL_PATIENTS: PatientNode[] = [
  {
    id: "pat-rajesh",
    name: "Rajesh Kumar",
    age: 52,
    phone: "+91 98101 23456",
    blood_group: "B+"
  },
  {
    id: "pat-sunita",
    name: "Sunita Devi",
    age: 64,
    phone: "+91 94150 88219",
    blood_group: "O+"
  },
  {
    id: "pat-amit",
    name: "Amit Patel",
    age: 45,
    phone: "+91 99090 12833",
    blood_group: "AB+"
  },
  {
    id: "pat-priya",
    name: "Priya Sharma",
    age: 29,
    phone: "+91 98230 44102",
    blood_group: "A+"
  }
];

export const INITIAL_SYMPTOMS: SymptomNode[] = [
  { id: "symp-chest-pain", name: "Crushing Chest Pain", severity: "Severe", name_hi: "सीने में तेज दर्द" },
  { id: "symp-radiating-arm", name: "Radiating Left Arm Pain", severity: "Critical", name_hi: "बाएँ हाथ में खिंचाव" },
  { id: "symp-sweating", name: "Cold Diaphoresis / Sweating", severity: "Severe", name_hi: "ठंडा पसीना आना" },
  { id: "symp-breathlessness", name: "Severe Breathlessness", severity: "Critical", name_hi: "साँस लेने में गंभीर तकलीफ़" },
  { id: "symp-hypoxia", name: "Hypoxia (SpO2 < 88%)", severity: "Critical", name_hi: "ऑक्सीजन स्तर में भारी गिरावट" },
  { id: "symp-high-fever", name: "High Grade Fever (103°F)", severity: "Severe", name_hi: "तेज बुखार" },
  { id: "symp-cough", name: "Productive Purulent Cough", severity: "Moderate", name_hi: "बलगम वाली खांसी" },
  { id: "symp-facial-droop", name: "Acute Facial Droop", severity: "Critical", name_hi: "चेहरे का एक तरफ झुकना" },
  { id: "symp-slurred-speech", name: "Slurred Speech / Aphasia", severity: "Critical", name_hi: "बोली लड़खड़ाना" },
  { id: "symp-wheezing", name: "Bilateral Expiratory Wheeze", severity: "Moderate", name_hi: "साँस से सीटी जैसी आवाज़" },
  { id: "symp-runny-nose", name: "Mild Rhinorrhea / Sneezing", severity: "Mild", name_hi: "नाक बहना और छींकें" },
  { id: "symp-headache", name: "Tension Headache", severity: "Mild", name_hi: "हल्का सिरदर्द" }
];

export const INITIAL_CONDITIONS: ConditionNode[] = [
  {
    id: "cond-stemi",
    name: "Acute Coronary Syndrome (STEMI)",
    risk_level: "Critical",
    required_specialty: "Cardiology"
  },
  {
    id: "cond-pneumonia",
    name: "Severe Acute Pneumonia / ARDS",
    risk_level: "Critical",
    required_specialty: "Pulmonology"
  },
  {
    id: "cond-stroke",
    name: "Acute Ischemic Cerebrovascular Stroke",
    risk_level: "Critical",
    required_specialty: "Neurology"
  },
  {
    id: "cond-asthma",
    name: "Severe Acute Asthma Exacerbation",
    risk_level: "High",
    required_specialty: "Pulmonology"
  },
  {
    id: "cond-rhinitis",
    name: "Mild Seasonal Allergic Rhinitis",
    risk_level: "Low",
    required_specialty: "General Medicine"
  }
];

export const INITIAL_DRUGS: DrugNode[] = [
  { id: "drug-penicillin", name: "Penicillin" },
  { id: "drug-aspirin", name: "Aspirin" },
  { id: "drug-ceftriaxone", name: "Ceftriaxone" },
  { id: "drug-clopidogrel", name: "Clopidogrel" },
  { id: "drug-heparin", name: "Heparin" },
  { id: "drug-nitroglycerin", name: "Nitroglycerin" },
  { id: "drug-salbutamol", name: "Salbutamol" },
  { id: "drug-sulfa", name: "Sulfamethoxazole" }
];

export const INITIAL_HOSPITALS: HospitalNode[] = [
  {
    id: "hosp-aiims",
    name: "AIIMS New Delhi",
    phone: "+91 11 2658 8500",
    lat: 28.5672,
    long: 77.2100,
    city: "New Delhi"
  },
  {
    id: "hosp-apollo",
    name: "Apollo Hospital Chennai",
    phone: "+91 44 2829 0200",
    lat: 13.0604,
    long: 80.2496,
    city: "Chennai"
  },
  {
    id: "hosp-fortis",
    name: "Fortis Memorial Research Institute",
    phone: "+91 124 492 1021",
    lat: 28.4595,
    long: 77.0725,
    city: "Gurgaon"
  },
  {
    id: "hosp-kem",
    name: "KEM Hospital Mumbai",
    phone: "+91 22 2410 7000",
    lat: 18.9986,
    long: 72.8422,
    city: "Mumbai"
  }
];

export const INITIAL_DOCTORS: DoctorNode[] = [
  // AIIMS New Delhi
  {
    id: "doc-ananya",
    name: "Dr. Ananya Sharma",
    specialty: "Cardiology",
    available: true,
    hospital_id: "hosp-aiims"
  },
  {
    id: "doc-farhan",
    name: "Dr. Farhan Akhtar",
    specialty: "Pulmonology",
    available: true,
    hospital_id: "hosp-aiims"
  },
  // Apollo Hospital Chennai
  {
    id: "doc-rajesh-v",
    name: "Dr. Rajesh Varma",
    specialty: "Pulmonology",
    available: true,
    hospital_id: "hosp-apollo"
  },
  {
    id: "doc-meenakshi",
    name: "Dr. Meenakshi Sundaram",
    specialty: "Cardiology",
    available: true,
    hospital_id: "hosp-apollo"
  },
  // Fortis Memorial Gurgaon
  {
    id: "doc-vikram",
    name: "Dr. Vikramaditya Rao",
    specialty: "Neurology",
    available: true,
    hospital_id: "hosp-fortis"
  },
  {
    id: "doc-neha",
    name: "Dr. Neha Kulkarni",
    specialty: "Cardiology",
    available: true,
    hospital_id: "hosp-fortis"
  },
  // KEM Hospital Mumbai
  {
    id: "doc-sunita-k",
    name: "Dr. Sunita Kulkarni",
    specialty: "Cardiology",
    available: false, // Busy in Cath Lab Emergency
    hospital_id: "hosp-kem"
  },
  {
    id: "doc-arjun",
    name: "Dr. Arjun Tendulkar",
    specialty: "General Medicine",
    available: true,
    hospital_id: "hosp-kem"
  }
];

export const INITIAL_BEDS: BedNode[] = [
  // AIIMS New Delhi (Ansari Nagar)
  { id: "bed-aiims-icu-01", type: "ICU_Oxygen", is_available: true, hospital_id: "hosp-aiims" },
  { id: "bed-aiims-icu-02", type: "ICU_Oxygen", is_available: true, hospital_id: "hosp-aiims" },
  { id: "bed-aiims-icu-03", type: "ICU_Oxygen", is_available: false, hospital_id: "hosp-aiims" },
  { id: "bed-aiims-ccu-01", type: "CCU", is_available: true, hospital_id: "hosp-aiims" },
  { id: "bed-aiims-gen-01", type: "General", is_available: true, hospital_id: "hosp-aiims" },

  // Apollo Hospital Chennai
  { id: "bed-apollo-icu-01", type: "ICU_Oxygen", is_available: true, hospital_id: "hosp-apollo" },
  { id: "bed-apollo-icu-02", type: "ICU_Oxygen", is_available: true, hospital_id: "hosp-apollo" },
  { id: "bed-apollo-icu-03", type: "ICU_Oxygen", is_available: true, hospital_id: "hosp-apollo" },
  { id: "bed-apollo-gen-01", type: "General", is_available: true, hospital_id: "hosp-apollo" },

  // Fortis Memorial Gurgaon
  { id: "bed-fortis-icu-01", type: "ICU_Oxygen", is_available: true, hospital_id: "hosp-fortis" },
  { id: "bed-fortis-icu-02", type: "ICU_Oxygen", is_available: false, hospital_id: "hosp-fortis" },
  { id: "bed-fortis-trauma-01", type: "Emergency_Trauma", is_available: true, hospital_id: "hosp-fortis" },

  // KEM Hospital Mumbai
  { id: "bed-kem-icu-01", type: "ICU_Oxygen", is_available: false, hospital_id: "hosp-kem" },
  { id: "bed-kem-icu-02", type: "ICU_Oxygen", is_available: false, hospital_id: "hosp-kem" },
  { id: "bed-kem-gen-01", type: "General", is_available: true, hospital_id: "hosp-kem" }
];

// Initial historical sessions (including one older than 24h to trigger Agent 3 follow-up queue)
const nowSeconds = Math.floor(Date.now() / 1000);
const twentySixHoursAgo = nowSeconds - (26 * 3600); // > 86400 seconds ago

export const INITIAL_SESSIONS: AgentSessionNode[] = [
  {
    id: "sess-hist-sunita-01",
    timestamp: twentySixHoursAgo,
    created_at_iso: new Date(twentySixHoursAgo * 1000).toISOString(),
    agent_type: "triage",
    status: "ESCALATED"
  },
  {
    id: "sess-hist-amit-01",
    timestamp: nowSeconds - 7200, // 2 hours ago
    created_at_iso: new Date((nowSeconds - 7200) * 1000).toISOString(),
    agent_type: "triage",
    status: "COMPLETED"
  }
];

export function buildInitialGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Add Patients
  for (const p of INITIAL_PATIENTS) {
    nodes.push({
      id: p.id,
      labels: ["Patient"],
      properties: { ...p }
    });
  }

  // Add Symptoms
  for (const s of INITIAL_SYMPTOMS) {
    nodes.push({
      id: s.id,
      labels: ["Symptom"],
      properties: { ...s }
    });
  }

  // Add Conditions
  for (const c of INITIAL_CONDITIONS) {
    nodes.push({
      id: c.id,
      labels: ["Condition"],
      properties: { ...c }
    });
  }

  // Add Drugs
  for (const d of INITIAL_DRUGS) {
    nodes.push({
      id: d.id,
      labels: ["Drug"],
      properties: { ...d }
    });
  }

  // Add Hospitals
  for (const h of INITIAL_HOSPITALS) {
    nodes.push({
      id: h.id,
      labels: ["Hospital"],
      properties: { ...h }
    });
  }

  // Add Doctors
  for (const doc of INITIAL_DOCTORS) {
    nodes.push({
      id: doc.id,
      labels: ["Doctor"],
      properties: { ...doc }
    });
  }

  // Add Beds
  for (const b of INITIAL_BEDS) {
    nodes.push({
      id: b.id,
      labels: ["Bed"],
      properties: { ...b }
    });
  }

  // Add Initial Sessions
  for (const sess of INITIAL_SESSIONS) {
    nodes.push({
      id: sess.id,
      labels: ["AgentSession"],
      properties: { ...sess }
    });
  }

  // Helper to add edge
  const addEdge = (source: string, target: string, type: any, properties: Record<string, any> = {}) => {
    edges.push({
      id: `edge-${source}-${type}-${target}`,
      source,
      target,
      type,
      properties
    });
  };

  // 1. Patient Allergies (:Patient)-[:ALLERGIC_TO]->(:Drug)
  addEdge("pat-rajesh", "drug-penicillin", "ALLERGIC_TO", { severity: "Severe Anaphylaxis" });
  addEdge("pat-rajesh", "drug-aspirin", "ALLERGIC_TO", { severity: "Asthmatic bronchospasm" });
  addEdge("pat-sunita", "drug-ceftriaxone", "ALLERGIC_TO", { severity: "Cutaneous eruption" });
  addEdge("pat-priya", "drug-sulfa", "ALLERGIC_TO", { severity: "Urticaria" });

  // 2. Condition Contraindications (:Condition)-[:CONTRAINDICATES]->(:Drug)
  // ACS / STEMI contraindicates Penicillin if cross-reactive / NSAIDs
  addEdge("cond-stemi", "drug-penicillin", "CONTRAINDICATES", { reason: "High anaphylactic risk during emergency coronary angioplasty" });
  addEdge("cond-stemi", "drug-ceftriaxone", "CONTRAINDICATES", { reason: "Incompatible with calcium-containing diluents in acute cardiac protocol" });
  addEdge("cond-pneumonia", "drug-ceftriaxone", "CONTRAINDICATES", { reason: "Patient specific beta-lactam hypersensitivity flag" });

  // 3. Symptom to Condition mappings (:Symptom)-[:INDICATES {probability}]->(:Condition)
  addEdge("symp-chest-pain", "cond-stemi", "INDICATES", { probability: 0.94 });
  addEdge("symp-radiating-arm", "cond-stemi", "INDICATES", { probability: 0.98 });
  addEdge("symp-sweating", "cond-stemi", "INDICATES", { probability: 0.88 });

  addEdge("symp-breathlessness", "cond-pneumonia", "INDICATES", { probability: 0.91 });
  addEdge("symp-hypoxia", "cond-pneumonia", "INDICATES", { probability: 0.97 });
  addEdge("symp-high-fever", "cond-pneumonia", "INDICATES", { probability: 0.89 });
  addEdge("symp-cough", "cond-pneumonia", "INDICATES", { probability: 0.82 });

  addEdge("symp-facial-droop", "cond-stroke", "INDICATES", { probability: 0.99 });
  addEdge("symp-slurred-speech", "cond-stroke", "INDICATES", { probability: 0.96 });

  addEdge("symp-breathlessness", "cond-asthma", "INDICATES", { probability: 0.78 });
  addEdge("symp-wheezing", "cond-asthma", "INDICATES", { probability: 0.92 });

  addEdge("symp-runny-nose", "cond-rhinitis", "INDICATES", { probability: 0.95 });
  addEdge("symp-headache", "cond-rhinitis", "INDICATES", { probability: 0.60 });

  // 4. Hospital employs Doctor (:Hospital)-[:EMPLOYS]->(:Doctor)
  for (const doc of INITIAL_DOCTORS) {
    if (doc.hospital_id) {
      addEdge(doc.hospital_id, doc.id, "EMPLOYS", { department: doc.specialty });
    }
  }

  // 5. Hospital has Bed (:Hospital)-[:HAS_BED]->(:Bed)
  for (const b of INITIAL_BEDS) {
    if (b.hospital_id) {
      addEdge(b.hospital_id, b.id, "HAS_BED", { type: b.type, is_available: b.is_available });
    }
  }

  // 6. Historical Sessions (:Patient)-[:HAD_SESSION]->(:AgentSession)-[:DETECTED]->(:Symptom)
  // Sunita had session 26h ago (pneumonia breathlessness)
  addEdge("pat-sunita", "sess-hist-sunita-01", "HAD_SESSION", { channel: "voice_triage" });
  addEdge("sess-hist-sunita-01", "symp-breathlessness", "DETECTED", { confidence: 0.95 });
  addEdge("sess-hist-sunita-01", "symp-high-fever", "DETECTED", { confidence: 0.92 });
  addEdge("pat-sunita", "symp-breathlessness", "EXHIBITS", { since_days: 2 });
  addEdge("pat-sunita", "symp-high-fever", "EXHIBITS", { since_days: 2 });

  // Amit had session 2 hours ago
  addEdge("pat-amit", "sess-hist-amit-01", "HAD_SESSION", { channel: "voice_triage" });
  addEdge("sess-hist-amit-01", "symp-headache", "DETECTED", { confidence: 0.88 });
  addEdge("pat-amit", "symp-headache", "EXHIBITS", { since_days: 1 });

  return { nodes, edges };
}

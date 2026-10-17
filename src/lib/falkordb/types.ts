/**
 * CareGraph AI - Core Graph Data Model & Swarm Types
 * Built for FalkorDB & Clinical Emergency Dispatch
 */

export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";
export type SymptomSeverity = "Mild" | "Moderate" | "Severe" | "Critical";
export type BedType = "ICU_Oxygen" | "General" | "CCU" | "Emergency_Trauma";

export interface PatientNode {
  id: string;
  name: string;
  age: number;
  phone: string;
  blood_group: string;
}

export interface SymptomNode {
  id: string;
  name: string;
  severity: SymptomSeverity;
  name_hi?: string;
}

export interface ConditionNode {
  id: string;
  name: string;
  risk_level: RiskLevel;
  required_specialty: string;
}

export interface DrugNode {
  id: string;
  name: string;
}

export interface HospitalNode {
  id: string;
  name: string;
  phone: string;
  lat: number;
  long: number;
  city: string;
}

export interface DoctorNode {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
  hospital_id?: string;
}

export interface BedNode {
  id: string;
  type: BedType;
  is_available: boolean;
  hospital_id?: string;
  reserved_for_patient_id?: string;
}

export interface AgentSessionNode {
  id: string;
  timestamp: number; // Unix timestamp in seconds
  created_at_iso: string;
  agent_type: "triage" | "dispatcher" | "followup";
  status: "ACTIVE" | "COMPLETED" | "ESCALATED";
}

export type NodeLabel = 
  | "Patient" 
  | "Symptom" 
  | "Condition" 
  | "Drug" 
  | "Hospital" 
  | "Doctor" 
  | "Bed" 
  | "AgentSession";

export type RelationshipType = 
  | "EXHIBITS" 
  | "INDICATES" 
  | "ALLERGIC_TO" 
  | "CONTRAINDICATES" 
  | "EMPLOYS" 
  | "HAS_BED" 
  | "HAD_SESSION" 
  | "DETECTED"
  | "RESERVED_FOR";

export interface GraphNode {
  id: string;
  labels: NodeLabel[];
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  properties?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Multi-Hop 5-Hop Cypher Traversal Result
 * Conforming directly to:
 * RETURN p.name AS PatientName, c.name AS SuspectedCondition, c.risk_level AS RiskLevel,
 *        collect(DISTINCT d.name) AS KnownAllergiesToAvoid,
 *        h.name AS TargetHospital, h.phone AS HospitalContact,
 *        doc.name AS AssignedDoctor, count(b) AS AvailableBeds
 */
export interface CypherFiveHopResult {
  PatientName: string;
  PatientId: string;
  SuspectedCondition: string;
  RiskLevel: RiskLevel;
  KnownAllergiesToAvoid: string[];
  TargetHospital: string;
  HospitalContact: string;
  HospitalId: string;
  AssignedDoctor: string;
  DoctorSpecialty: string;
  AvailableBeds: number;
  ReservedBedId?: string;
  ReservedBedType?: BedType;
  ExecutionTimeMs: number;
  TraversalPathNodeIds: string[];
  TraversalPathEdgeIds: string[];
  Explanation: string;
}

/**
 * Emergency Dispatch Record (Agent 2)
 */
export interface DispatchRecord {
  dispatch_id: string;
  timestamp: string;
  patient_id: string;
  patient_name: string;
  hospital_id: string;
  hospital_name: string;
  hospital_phone: string;
  condition: string;
  risk_level: RiskLevel;
  doctor_name: string;
  bed_id: string;
  bed_type: BedType;
  twilio_call_sid?: string;
  twilio_status: "queued" | "in-progress" | "completed" | "simulated";
  alert_message: string;
  graph_mutated: boolean;
}

/**
 * 24h Follow-up Record (Agent 3)
 */
export interface FollowUpRecord {
  followup_id: string;
  session_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  condition: string;
  session_timestamp: number;
  hours_elapsed: number;
  status: "PENDING" | "CALLING" | "COMPLETED" | "NO_ANSWER";
  recovery_status?: "RECOVERING" | "STABLE" | "REQUIRES_REVISIT" | "EMERGENCY_RECURRENCE";
  notes?: string;
  last_call_at?: string;
}

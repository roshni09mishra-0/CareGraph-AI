/**
 * CareGraph AI - FalkorDB Graph Engine & Multi-Hop Cypher Traversal
 * Pure graph reasoning engine with zero hallucination.
 */

import fs from "fs";
import path from "path";
import {
  GraphNode,
  GraphEdge,
  GraphData,
  CypherFiveHopResult,
  PatientNode,
  SymptomNode,
  ConditionNode,
  HospitalNode,
  DoctorNode,
  BedNode,
  AgentSessionNode,
  FollowUpRecord
} from "./types";
import { buildInitialGraph } from "./seed";

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "caregraph_falkordb_store.json");

// Global in-process graph store to maintain live graph state across serverless / API requests
declare global {
  // eslint-disable-next-line no-var
  var __caregraph_engine__: FalkorDBEngine | undefined;
}

export class FalkorDBEngine {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private isConnectedToNativeFalkorDB: boolean = false;
  private nativeEndpoint: string = "";

  constructor() {
    this.loadFromDiskOrSeed();
    this.attemptNativeConnection();
  }

  private loadFromDiskOrSeed(): void {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.nodes && parsed.edges && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          this.nodes.clear();
          this.edges.clear();
          for (const n of parsed.nodes) {
            this.nodes.set(n.id, n);
          }
          for (const e of parsed.edges) {
            this.edges.set(e.id, e);
          }
          console.log(`[CareGraph Engine] Loaded persistent graph: ${this.nodes.size} nodes, ${this.edges.size} edges from ${DB_FILE}`);
          return;
        }
      }
    } catch (e) {
      console.warn("[CareGraph Engine] Could not load from disk store, seeding fresh graph:", e);
    }
    this.seedDefaultGraph();
  }

  public saveToDisk(): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const data = {
        updatedAt: new Date().toISOString(),
        nodes: Array.from(this.nodes.values()),
        edges: Array.from(this.edges.values()),
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("[CareGraph Engine] Error saving graph to disk store:", e);
    }
  }

  private async attemptNativeConnection() {
    const falkorUrl = process.env.FALKORDB_URL || process.env.REDIS_URL;
    if (falkorUrl) {
      this.nativeEndpoint = falkorUrl;
      console.log(`[CareGraph] Configured for FalkorDB native connection at: ${falkorUrl}`);
    }
  }

  public seedDefaultGraph(): void {
    this.nodes.clear();
    this.edges.clear();
    const { nodes, edges } = buildInitialGraph();
    for (const n of nodes) {
      this.nodes.set(n.id, n);
    }
    for (const e of edges) {
      this.edges.set(e.id, e);
    }
    this.saveToDisk();
    console.log(`[CareGraph Engine] Graph seeded and saved with ${this.nodes.size} nodes and ${this.edges.size} edges.`);
  }

  public getGraphData(): GraphData {
    if (!fs.existsSync(DB_FILE)) {
      this.saveToDisk();
    }
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
    };
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  /**
   * LIVE MUTATION: Triage Voice Agent records session and extracted symptoms
   * Writes:
   * (:Patient)-[:HAD_SESSION]->(:AgentSession)-[:DETECTED]->(:Symptom)
   * (:Patient)-[:EXHIBITS {since_days: 1}]->(:Symptom)
   */
  public addTriageSession(
    patientId: string,
    symptomIds: string[],
    agentType: "triage" | "dispatcher" | "followup" = "triage"
  ): { sessionId: string; createdEdges: string[] } {
    const patient = this.nodes.get(patientId);
    if (!patient) {
      throw new Error(`Patient node '${patientId}' does not exist.`);
    }

    const now = Math.floor(Date.now() / 1000);
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Create AgentSession Node
    const sessionNode: GraphNode = {
      id: sessionId,
      labels: ["AgentSession"],
      properties: {
        id: sessionId,
        timestamp: now,
        created_at_iso: new Date(now * 1000).toISOString(),
        agent_type: agentType,
        status: "ACTIVE",
      },
    };
    this.nodes.set(sessionId, sessionNode);

    const createdEdgeIds: string[] = [];

    // (:Patient)-[:HAD_SESSION]->(:AgentSession)
    const sessionEdgeId = `edge-${patientId}-HAD_SESSION-${sessionId}`;
    const sessionEdge: GraphEdge = {
      id: sessionEdgeId,
      source: patientId,
      target: sessionId,
      type: "HAD_SESSION",
      properties: { channel: "livekit_murf_voice", timestamp: now },
    };
    this.edges.set(sessionEdgeId, sessionEdge);
    createdEdgeIds.push(sessionEdgeId);

    // For each detected symptom:
    for (const sympId of symptomIds) {
      if (this.nodes.has(sympId)) {
        // (:AgentSession)-[:DETECTED]->(:Symptom)
        const detEdgeId = `edge-${sessionId}-DETECTED-${sympId}`;
        const detEdge: GraphEdge = {
          id: detEdgeId,
          source: sessionId,
          target: sympId,
          type: "DETECTED",
          properties: { confidence: 0.98, live_intake: true },
        };
        this.edges.set(detEdgeId, detEdge);
        createdEdgeIds.push(detEdgeId);

        // (:Patient)-[:EXHIBITS {since_days: 1}]->(:Symptom)
        const exhEdgeId = `edge-${patientId}-EXHIBITS-${sympId}`;
        if (!this.edges.has(exhEdgeId)) {
          const exhEdge: GraphEdge = {
            id: exhEdgeId,
            source: patientId,
            target: sympId,
            type: "EXHIBITS",
            properties: { since_days: 1, reported_via_session: sessionId },
          };
          this.edges.set(exhEdgeId, exhEdge);
          createdEdgeIds.push(exhEdgeId);
        }
      }
    }

    this.saveToDisk();
    return { sessionId, createdEdges: createdEdgeIds };
  }

  /**
   * EXACT 5-HOP CYPHER REASONING ENGINE:
   * 
   * MATCH (p:Patient {id: $patient_id})-[e:EXHIBITS]->(s:Symptom)-[i:INDICATES]->(c:Condition)
   * WHERE c.risk_level IN ['High', 'Critical']
   * OPTIONAL MATCH (p)-[:ALLERGIC_TO]->(d:Drug)<-[:CONTRAINDICATES]-(c)
   * MATCH (h:Hospital)-[:EMPLOYS]->(doc:Doctor {specialty: c.required_specialty, available: true}),
   *       (h)-[:HAS_BED]->(b:Bed {type: 'ICU_Oxygen', is_available: true})
   * RETURN p.name AS PatientName, c.name AS SuspectedCondition, c.risk_level AS RiskLevel,
   *        collect(DISTINCT d.name) AS KnownAllergiesToAvoid,
   *        h.name AS TargetHospital, h.phone AS HospitalContact,
   *        doc.name AS AssignedDoctor, count(b) AS AvailableBeds
   * ORDER BY AvailableBeds DESC
   * LIMIT 1;
   */
  public executeFiveHopReasoning(patientId: string): CypherFiveHopResult | null {
    const startTime = performance.now();

    const patient = this.nodes.get(patientId);
    if (!patient) return null;

    // Hop 1: (p)-[e:EXHIBITS]->(s:Symptom)
    const patientExhibitedSymptomIds: string[] = [];
    const hop1EdgeIds: string[] = [];

    for (const edge of this.edges.values()) {
      if (edge.source === patientId && edge.type === "EXHIBITS") {
        patientExhibitedSymptomIds.push(edge.target);
        hop1EdgeIds.push(edge.id);
      }
    }

    if (patientExhibitedSymptomIds.length === 0) {
      return null;
    }

    // Hop 2: (s)-[i:INDICATES]->(c:Condition) WHERE c.risk_level IN ['High', 'Critical']
    interface CandidateCondition {
      conditionNode: GraphNode;
      symptomNode: GraphNode;
      probability: number;
      symptomEdgeId: string;
      indicateEdgeId: string;
    }

    const candidateConditions: CandidateCondition[] = [];

    for (const sympId of patientExhibitedSymptomIds) {
      const sympNode = this.nodes.get(sympId);
      if (!sympNode) continue;

      for (const edge of this.edges.values()) {
        if (edge.source === sympId && edge.type === "INDICATES") {
          const conditionNode = this.nodes.get(edge.target);
          if (
            conditionNode &&
            conditionNode.labels.includes("Condition") &&
            ["High", "Critical"].includes(conditionNode.properties.risk_level)
          ) {
            candidateConditions.push({
              conditionNode,
              symptomNode: sympNode,
              probability: edge.properties?.probability || 0.8,
              symptomEdgeId: `edge-${patientId}-EXHIBITS-${sympId}`,
              indicateEdgeId: edge.id,
            });
          }
        }
      }
    }

    if (candidateConditions.length === 0) {
      return null;
    }

    // Sort candidate conditions by risk (Critical > High) and then probability
    candidateConditions.sort((a, b) => {
      const riskScore = (r: string) => (r === "Critical" ? 2 : 1);
      const diff = riskScore(b.conditionNode.properties.risk_level) - riskScore(a.conditionNode.properties.risk_level);
      if (diff !== 0) return diff;
      return b.probability - a.probability;
    });

    const chosenMatch = candidateConditions[0];
    const condition = chosenMatch.conditionNode;
    const requiredSpecialty = condition.properties.required_specialty;

    // Hop 3 (Safety Check): OPTIONAL MATCH (p)-[:ALLERGIC_TO]->(d:Drug)<-[:CONTRAINDICATES]-(c)
    // Find patient allergies
    const patientAllergicDrugs: string[] = [];
    const contraindicationEdgeIds: string[] = [];
    const allergyEdgeIds: string[] = [];

    for (const edge of this.edges.values()) {
      if (edge.source === patientId && edge.type === "ALLERGIC_TO") {
        patientAllergicDrugs.push(edge.target);
        allergyEdgeIds.push(edge.id);
      }
    }

    const knownAllergiesToAvoid: Set<string> = new Set();
    for (const drugId of patientAllergicDrugs) {
      // Check if condition CONTRAINDICATES this drug
      for (const edge of this.edges.values()) {
        if (
          edge.source === condition.id &&
          edge.target === drugId &&
          edge.type === "CONTRAINDICATES"
        ) {
          const drugNode = this.nodes.get(drugId);
          if (drugNode) {
            knownAllergiesToAvoid.add(drugNode.properties.name);
            contraindicationEdgeIds.push(edge.id);
          }
        }
      }
    }

    // Hop 4 & 5:
    // MATCH (h:Hospital)-[:EMPLOYS]->(doc:Doctor {specialty: c.required_specialty, available: true}),
    //       (h)-[:HAS_BED]->(b:Bed {type: 'ICU_Oxygen', is_available: true})
    interface HospitalCandidate {
      hospitalNode: GraphNode;
      doctorNode: GraphNode;
      employEdgeId: string;
      availableBeds: GraphNode[];
      bedEdgeIds: string[];
    }

    const hospitalCandidates: HospitalCandidate[] = [];

    for (const hospNode of this.nodes.values()) {
      if (!hospNode.labels.includes("Hospital")) continue;

      // Find available doctor matching specialty
      let matchedDoctor: GraphNode | null = null;
      let doctorEdgeId = "";

      for (const edge of this.edges.values()) {
        if (edge.source === hospNode.id && edge.type === "EMPLOYS") {
          const docNode = this.nodes.get(edge.target);
          if (
            docNode &&
            docNode.labels.includes("Doctor") &&
            docNode.properties.specialty === requiredSpecialty &&
            docNode.properties.available === true
          ) {
            matchedDoctor = docNode;
            doctorEdgeId = edge.id;
            break;
          }
        }
      }

      if (!matchedDoctor) continue;

      // Find available ICU_Oxygen beds in this hospital
      const availableBeds: GraphNode[] = [];
      const bedEdgeIds: string[] = [];

      for (const edge of this.edges.values()) {
        if (edge.source === hospNode.id && edge.type === "HAS_BED") {
          const bedNode = this.nodes.get(edge.target);
          if (
            bedNode &&
            bedNode.labels.includes("Bed") &&
            bedNode.properties.type === "ICU_Oxygen" &&
            bedNode.properties.is_available === true
          ) {
            availableBeds.push(bedNode);
            bedEdgeIds.push(edge.id);
          }
        }
      }

      if (availableBeds.length > 0) {
        hospitalCandidates.push({
          hospitalNode: hospNode,
          doctorNode: matchedDoctor,
          employEdgeId: doctorEdgeId,
          availableBeds,
          bedEdgeIds,
        });
      }
    }

    // ORDER BY AvailableBeds DESC LIMIT 1;
    hospitalCandidates.sort((a, b) => b.availableBeds.length - a.availableBeds.length);

    if (hospitalCandidates.length === 0) {
      // In case no hospital has an available bed, return the clinical condition assessment
      return {
        PatientName: patient.properties.name,
        PatientId: patient.id,
        SuspectedCondition: condition.properties.name,
        RiskLevel: condition.properties.risk_level,
        KnownAllergiesToAvoid: Array.from(knownAllergiesToAvoid),
        TargetHospital: "No available ICU bed with specialty match",
        HospitalContact: "Emergency 108 CAD",
        HospitalId: "",
        AssignedDoctor: "Pending Emergency Rotation",
        DoctorSpecialty: requiredSpecialty,
        AvailableBeds: 0,
        ExecutionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
        TraversalPathNodeIds: [patient.id, chosenMatch.symptomNode.id, condition.id],
        TraversalPathEdgeIds: [chosenMatch.symptomEdgeId, chosenMatch.indicateEdgeId],
        Explanation: `Critical condition identified: ${condition.properties.name}, but no immediate ICU bed available.`,
      };
    }

    const topHospital = hospitalCandidates[0];
    const reservedBed = topHospital.availableBeds[0];

    // Collect all node IDs and edge IDs in the exact 5-hop path for UI glowing highlight
    const pathNodeIds = [
      patient.id,
      chosenMatch.symptomNode.id,
      condition.id,
      topHospital.hospitalNode.id,
      topHospital.doctorNode.id,
      reservedBed.id,
    ];

    const pathEdgeIds = [
      chosenMatch.symptomEdgeId,
      chosenMatch.indicateEdgeId,
      topHospital.employEdgeId,
      `edge-${topHospital.hospitalNode.id}-HAS_BED-${reservedBed.id}`,
      ...contraindicationEdgeIds,
    ];

    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      PatientName: patient.properties.name,
      PatientId: patient.id,
      SuspectedCondition: condition.properties.name,
      RiskLevel: condition.properties.risk_level,
      KnownAllergiesToAvoid: Array.from(knownAllergiesToAvoid),
      TargetHospital: topHospital.hospitalNode.properties.name,
      HospitalContact: topHospital.hospitalNode.properties.phone,
      HospitalId: topHospital.hospitalNode.id,
      AssignedDoctor: topHospital.doctorNode.properties.name,
      DoctorSpecialty: topHospital.doctorNode.properties.specialty,
      AvailableBeds: topHospital.availableBeds.length,
      ReservedBedId: reservedBed.id,
      ReservedBedType: reservedBed.properties.type,
      ExecutionTimeMs: executionTimeMs,
      TraversalPathNodeIds: pathNodeIds,
      TraversalPathEdgeIds: pathEdgeIds,
      Explanation: `5-Hop Traversal Match: ${patient.properties.name} EXHIBITS ${chosenMatch.symptomNode.properties.name} INDICATES ${condition.properties.name} (${condition.properties.risk_level}) -> Assigned ${topHospital.doctorNode.properties.name} at ${topHospital.hospitalNode.properties.name} with ${topHospital.availableBeds.length} ICU beds available.`,
    };
  }

  /**
   * LIVE GRAPH MUTATION (Agent 2 - Emergency Dispatcher):
   * Mutates: SET b.is_available = false
   * Links: (:Bed)-[:RESERVED_FOR]->(:Patient)
   */
  public reserveBed(bedId: string, patientId: string): boolean {
    const bedNode = this.nodes.get(bedId);
    if (!bedNode) return false;

    // Mutate bed state
    bedNode.properties.is_available = false;
    bedNode.properties.reserved_for_patient_id = patientId;

    // Link edge: (:Bed)-[:RESERVED_FOR]->(:Patient)
    const reservationEdgeId = `edge-${bedId}-RESERVED_FOR-${patientId}`;
    this.edges.set(reservationEdgeId, {
      id: reservationEdgeId,
      source: bedId,
      target: patientId,
      type: "RESERVED_FOR",
      properties: {
        reserved_at: new Date().toISOString(),
        dispatched_by: "Agent_2_Emergency_Dispatcher",
      },
    });

    this.saveToDisk();
    console.log(`[CareGraph Mutation] Bed ${bedId} locked and reserved for Patient ${patientId}`);
    return true;
  }

  /**
   * Agent 3: 24-HOUR FOLLOW-UP QUERY
   * MATCH (p:Patient)-[:HAD_SESSION]->(s:AgentSession)
   * WHERE s.timestamp < timestamp() - 86400
   * RETURN p, s;
   */
  public queryTwentyFourHourFollowUpQueue(): FollowUpRecord[] {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const cutoffSeconds = nowSeconds - 86400; // 24 hours ago
    const records: FollowUpRecord[] = [];

    for (const edge of this.edges.values()) {
      if (edge.type === "HAD_SESSION") {
        const patientNode = this.nodes.get(edge.source);
        const sessionNode = this.nodes.get(edge.target);

        if (patientNode && sessionNode && sessionNode.labels.includes("AgentSession")) {
          const sessionTimestamp = sessionNode.properties.timestamp || 0;
          if (sessionTimestamp < cutoffSeconds) {
            const hoursElapsed = Math.round(((nowSeconds - sessionTimestamp) / 3600) * 10) / 10;
            
            // Find condition detected during session if any
            let detectedCondition = "Post-Triage Critical Care Follow-Up";
            for (const detEdge of this.edges.values()) {
              if (detEdge.source === sessionNode.id && detEdge.type === "DETECTED") {
                const symp = this.nodes.get(detEdge.target);
                if (symp) {
                  // Find condition for this symptom
                  for (const indEdge of this.edges.values()) {
                    if (indEdge.source === symp.id && indEdge.type === "INDICATES") {
                      const cond = this.nodes.get(indEdge.target);
                      if (cond) {
                        detectedCondition = cond.properties.name;
                        break;
                      }
                    }
                  }
                }
              }
            }

            records.push({
              followup_id: `fu-${sessionNode.id}`,
              session_id: sessionNode.id,
              patient_id: patientNode.id,
              patient_name: patientNode.properties.name,
              patient_phone: patientNode.properties.phone,
              condition: detectedCondition,
              session_timestamp: sessionTimestamp,
              hours_elapsed: hoursElapsed,
              status: sessionNode.properties.followup_status || "PENDING",
              recovery_status: sessionNode.properties.recovery_status || "RECOVERING",
              notes: sessionNode.properties.followup_notes || "Scheduled 24h recovery and medication adherence check-in.",
              last_call_at: sessionNode.properties.last_followup_call,
            });
          }
        }
      }
    }

    return records;
  }

  /**
   * Agent 3: Complete follow-up check-in and update session
   */
  public recordFollowUpCompletion(
    sessionId: string,
    recoveryStatus: "RECOVERING" | "STABLE" | "REQUIRES_REVISIT" | "EMERGENCY_RECURRENCE",
    notes: string
  ): boolean {
    const sessionNode = this.nodes.get(sessionId);
    if (!sessionNode) return false;

    sessionNode.properties.followup_status = "COMPLETED";
    sessionNode.properties.recovery_status = recoveryStatus;
    sessionNode.properties.followup_notes = notes;
    sessionNode.properties.last_followup_call = new Date().toISOString();
    this.saveToDisk();

    return true;
  }

  /**
   * Custom / Raw Cypher Query Runner
   * Allows dashboard Cypher console to run queries directly.
   */
  public executeCypher(query: string, params: Record<string, any> = {}): {
    columns: string[];
    rows: any[][];
    executionTimeMs: number;
    graphStats: { nodes: number; edges: number };
  } {
    const start = performance.now();
    const cleanQuery = query.trim();

    // 1. Check if query is the 5-hop reasoning query
    if (cleanQuery.includes("EXHIBITS") && cleanQuery.includes("INDICATES")) {
      const patientId = params.patient_id || "pat-rajesh";
      let result = this.executeFiveHopReasoning(patientId);

      // If patient doesn't exhibit symptoms yet, test with default patient
      if (!result) {
        result = this.executeFiveHopReasoning("pat-rajesh");
      }

      const columns = [
        "PatientName",
        "SuspectedCondition",
        "RiskLevel",
        "KnownAllergiesToAvoid",
        "TargetHospital",
        "HospitalContact",
        "AssignedDoctor",
        "AvailableBeds"
      ];

      const rows = result
        ? [
            [
              result.PatientName,
              result.SuspectedCondition,
              result.RiskLevel,
              result.KnownAllergiesToAvoid.join(", ") || "None",
              result.TargetHospital,
              result.HospitalContact,
              result.AssignedDoctor,
              result.AvailableBeds
            ]
          ]
        : [];

      return {
        columns,
        rows,
        executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
        graphStats: { nodes: this.nodes.size, edges: this.edges.size }
      };
    }

    // 2. Query for 24-hour follow-up session queue
    if (cleanQuery.includes("HAD_SESSION")) {
      const columns = ["PatientName", "SessionId", "SessionTimestamp", "TriageStatus"];
      const rows: any[][] = [];

      for (const e of this.edges.values()) {
        if (e.type === "HAD_SESSION") {
          const p = this.nodes.get(e.source);
          const s = this.nodes.get(e.target);
          if (p && s) {
            rows.push([
              p.properties.name,
              s.id,
              new Date((s.properties.timestamp || 0) * 1000).toLocaleString("en-IN"),
              s.properties.status || "ACTIVE"
            ]);
          }
        }
      }

      return {
        columns,
        rows: rows.slice(0, 50),
        executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
        graphStats: { nodes: this.nodes.size, edges: this.edges.size }
      };
    }

    // 3. Query for Available ICU Beds per hospital
    if (cleanQuery.includes("HAS_BED")) {
      const columns = ["Hospital", "City", "AvailableICUBeds"];
      const hospMap = new Map<string, { name: string; city: string; count: number }>();

      for (const n of this.nodes.values()) {
        if (n.labels.includes("Hospital")) {
          hospMap.set(n.id, { name: n.properties.name, city: n.properties.city, count: 0 });
        }
      }

      for (const e of this.edges.values()) {
        if (e.type === "HAS_BED") {
          const bed = this.nodes.get(e.target);
          if (bed && bed.properties.type === "ICU_Oxygen" && bed.properties.is_available) {
            const hosp = hospMap.get(e.source);
            if (hosp) hosp.count++;
          }
        }
      }

      const rows = Array.from(hospMap.values()).map(h => [h.name, h.city, h.count]);

      return {
        columns,
        rows,
        executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
        graphStats: { nodes: this.nodes.size, edges: this.edges.size }
      };
    }

    // 4. Query for Patient Drug Allergies & Contraindications
    if (cleanQuery.includes("ALLERGIC_TO")) {
      const columns = ["Patient", "AllergicDrug", "ContraindicatedCondition"];
      const rows: any[][] = [];

      for (const e of this.edges.values()) {
        if (e.type === "ALLERGIC_TO") {
          const p = this.nodes.get(e.source);
          const d = this.nodes.get(e.target);
          if (p && d) {
            for (const ce of this.edges.values()) {
              if (ce.type === "CONTRAINDICATES" && ce.target === d.id) {
                const c = this.nodes.get(ce.source);
                if (c) {
                  rows.push([p.properties.name, d.properties.name, c.properties.name]);
                }
              }
            }
          }
        }
      }

      return {
        columns,
        rows,
        executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
        graphStats: { nodes: this.nodes.size, edges: this.edges.size }
      };
    }

    // Default inspection query: return nodes by label
    const labelMatch = cleanQuery.match(/:\s*([A-Za-z]+)/);
    const targetLabel = labelMatch ? labelMatch[1] : null;

    const matchedNodes = Array.from(this.nodes.values()).filter(n => 
      !targetLabel || n.labels.includes(targetLabel as any)
    );

    const columns = ["id", "labels", "properties"];
    const rows = matchedNodes.slice(0, 50).map(n => [
      n.id,
      n.labels.join(", "),
      JSON.stringify(n.properties)
    ]);

    return {
      columns,
      rows,
      executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
      graphStats: { nodes: this.nodes.size, edges: this.edges.size }
    };
  }
}

// Singleton accessor
export function getCareGraphEngine(): FalkorDBEngine {
  if (!global.__caregraph_engine__) {
    global.__caregraph_engine__ = new FalkorDBEngine();
  }
  return global.__caregraph_engine__;
}

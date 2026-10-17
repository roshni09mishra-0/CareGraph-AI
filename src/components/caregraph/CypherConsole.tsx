"use client";

import React, { useState } from "react";
import { Play, Terminal, Database, Clock, CheckCircle2, Copy, Check } from "lucide-react";

interface CypherConsoleProps {
  activePatientId: string;
}

const DEFAULT_FIVE_HOP_CYPHER = `MATCH (p:Patient {id: $patient_id})-[e:EXHIBITS]->(s:Symptom)-[i:INDICATES]->(c:Condition)
WHERE c.risk_level IN ['High', 'Critical']
OPTIONAL MATCH (p)-[:ALLERGIC_TO]->(d:Drug)<-[:CONTRAINDICATES]-(c)
MATCH (h:Hospital)-[:EMPLOYS]->(doc:Doctor {specialty: c.required_specialty, available: true}),
      (h)-[:HAS_BED]->(b:Bed {type: 'ICU_Oxygen', is_available: true})
RETURN p.name AS PatientName, c.name AS SuspectedCondition, c.risk_level AS RiskLevel,
       collect(DISTINCT d.name) AS KnownAllergiesToAvoid,
       h.name AS TargetHospital, h.phone AS HospitalContact,
       doc.name AS AssignedDoctor, count(b) AS AvailableBeds
ORDER BY AvailableBeds DESC
LIMIT 1;`;

const PRESET_QUERIES = [
  {
    name: "5-Hop Emergency Traversal (Core Decision Engine)",
    query: DEFAULT_FIVE_HOP_CYPHER,
  },
  {
    name: "24-Hour Patient Follow-Up Session Queue",
    query: `MATCH (p:Patient)-[:HAD_SESSION]->(s:AgentSession)
WHERE s.timestamp < timestamp() - 86400
RETURN p.name AS PatientName, s.id AS SessionId, s.timestamp AS SessionTimestamp, s.status AS TriageStatus;`,
  },
  {
    name: "Inspect Available ICU Oxygen Beds by Hospital",
    query: `MATCH (h:Hospital)-[:HAS_BED]->(b:Bed {type: 'ICU_Oxygen', is_available: true})
RETURN h.name AS Hospital, h.city AS City, count(b) AS AvailableICUBeds
ORDER BY AvailableICUBeds DESC;`,
  },
  {
    name: "Inspect Patient Drug Allergies & Contraindications",
    query: `MATCH (p:Patient)-[:ALLERGIC_TO]->(d:Drug)<-[:CONTRAINDICATES]-(c:Condition)
RETURN p.name AS Patient, d.name AS AllergicDrug, c.name AS ContraindicatedCondition;`,
  },
];

export default function CypherConsole({ activePatientId }: CypherConsoleProps) {
  const [query, setQuery] = useState(DEFAULT_FIVE_HOP_CYPHER);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    columns: string[];
    rows: any[][];
    executionTimeMs: number;
    graphStats: { nodes: number; edges: number };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const runQuery = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/caregraph/cypher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          params: { patient_id: activePatientId },
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setResults(data.data);
      } else {
        setError(data.error || "Query execution failed.");
      }
    } catch (e: any) {
      setError(e.message || "Failed to reach Cypher engine.");
    } finally {
      setIsRunning(false);
    }
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-mono text-xs select-none">
      {/* Top Console Bar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-slate-200">FALKORDB CYPHER TERMINAL</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            PARAM: $patient_id = "{activePatientId}"
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyQuery}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "COPIED" : "COPY CYPHER"}
          </button>
          <button
            onClick={runQuery}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded font-bold bg-sky-600 hover:bg-sky-500 text-white transition active:scale-95 disabled:opacity-50 shadow-md"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isRunning ? "EXECUTING..." : "EXECUTE CYPHER"}
          </button>
        </div>
      </div>

      {/* Preset Query Switcher */}
      <div className="px-4 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-slate-400 shrink-0">PRESETS:</span>
        {PRESET_QUERIES.map((preset, idx) => (
          <button
            key={idx}
            onClick={() => setQuery(preset.query)}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 shrink-0 hover:text-sky-300 transition"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Cypher Query Editor Box */}
      <div className="p-4 bg-slate-950 border-b border-slate-800">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={7}
          spellCheck={false}
          className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-sky-200 text-xs font-mono focus:outline-none focus:border-sky-500 leading-relaxed resize-none shadow-inner"
        />
      </div>

      {/* Execution Results View */}
      <div className="flex-1 overflow-auto p-4 bg-slate-950/60">
        {results ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                RETURNED {results.rows.length} ROW(S)
              </span>
              <div className="flex items-center gap-3">
                <span>GRAPH: {results.graphStats.nodes} NODES, {results.graphStats.edges} EDGES</span>
                <span className="text-sky-400 font-bold">LATENCY: {results.executionTimeMs}ms</span>
              </div>
            </div>

            {results.rows.length > 0 ? (
              <div className="border border-slate-800 rounded overflow-hidden">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-900 text-slate-300">
                    <tr>
                      {results.columns.map((col, idx) => (
                        <th key={idx} className="p-2 border-b border-r border-slate-800 font-semibold uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/50">
                        {row.map((val, cIdx) => (
                          <td key={cIdx} className="p-2 border-b border-r border-slate-800 text-slate-200 font-mono">
                            {typeof val === "object" ? JSON.stringify(val) : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-400 font-mono">
                No rows returned matching traversal conditions. (Speak or submit symptoms to create EXHIBITS edges first).
              </div>
            )}
          </div>
        ) : error ? (
          <div className="p-3 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono">
            <strong>Execution Error:</strong> {error}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Database className="w-8 h-8 text-slate-700" />
            <p>Click "EXECUTE CYPHER" to evaluate multi-hop traversal in FalkorDB.</p>
          </div>
        )}
      </div>
    </div>
  );
}

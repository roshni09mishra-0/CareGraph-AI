"use client";

import React from "react";
import { X, Database, Tag, ArrowRight, Shield, Activity, BedDouble, Hospital, User } from "lucide-react";
import { GraphNode, GraphEdge } from "@/lib/falkordb/types";

interface NodeInspectorDrawerProps {
  node: GraphNode | null;
  edges: GraphEdge[];
  onClose: () => void;
}

export default function NodeInspectorDrawer({ node, edges, onClose }: NodeInspectorDrawerProps) {
  if (!node) return null;

  const connectedEdges = edges.filter(
    (e) => e.source === node.id || e.target === node.id
  );

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col font-mono text-xs select-none shadow-2xl z-20">
      {/* Header */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-slate-200">NODE INSPECTOR</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Node Overview */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-2">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-400 border border-sky-800">
            :{node.labels.join(" :")}
          </span>
          <span className="text-slate-400 text-[10px]">ID: {node.id}</span>
        </div>
        <h3 className="font-bold text-sm text-slate-100 break-words">
          {node.properties.name || node.id}
        </h3>
      </div>

      {/* Raw Properties Table */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            CYPHER PROPERTIES
          </div>
          <div className="border border-slate-800 rounded bg-slate-950 overflow-hidden divide-y divide-slate-800/80">
            {Object.entries(node.properties).map(([key, val]) => (
              <div key={key} className="p-2 flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">{key}</span>
                <span className="text-slate-200 break-words">
                  {typeof val === "boolean" ? (
                    <span className={val ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                      {String(val)}
                    </span>
                  ) : typeof val === "object" ? (
                    JSON.stringify(val)
                  ) : (
                    String(val)
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Graph Edges */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>CONNECTED RELATIONSHIPS</span>
            <span className="text-sky-400">{connectedEdges.length} EDGES</span>
          </div>
          <div className="space-y-1.5">
            {connectedEdges.map((e) => {
              const isSource = e.source === node.id;
              return (
                <div
                  key={e.id}
                  className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-400 text-[10px]">
                      {isSource ? "OUTGOING" : "INCOMING"}
                    </span>
                    <span className="font-bold text-sky-400">[:{e.type}]</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                    {isSource ? e.target : e.source}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

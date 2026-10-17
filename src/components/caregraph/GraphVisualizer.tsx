"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Layers,
  Filter,
  Eye,
  Activity,
  Shield,
  HelpCircle,
  Crosshair,
  Search,
} from "lucide-react";
import { GraphData, GraphNode, GraphEdge, NodeLabel, CypherFiveHopResult } from "@/lib/falkordb/types";

interface GraphVisualizerProps {
  graphData: GraphData;
  activePathNodeIds: string[];
  activePathEdgeIds: string[];
  onSelectNode: (node: GraphNode | null) => void;
  selectedNodeId?: string;
  reasoningResult: CypherFiveHopResult | null;
}

interface PhysicsNode {
  id: string;
  label: NodeLabel;
  name: string;
  properties: Record<string, any>;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  borderColor: string;
  shape: "circle" | "hexagon" | "square" | "diamond" | "capsule" | "rect" | "octagon";
  isPathNode: boolean;
  isReservedBed: boolean;
}

interface PhysicsEdge {
  id: string;
  source: PhysicsNode;
  target: PhysicsNode;
  type: string;
  properties: Record<string, any>;
  isPathEdge: boolean;
  isContraindication: boolean;
  isReservation: boolean;
}

export default function GraphVisualizer({
  graphData,
  activePathNodeIds,
  activePathEdgeIds,
  onSelectNode,
  selectedNodeId,
  reasoningResult,
}: GraphVisualizerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<PhysicsNode | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<NodeLabel, boolean>>({
    Patient: true,
    Symptom: true,
    Condition: true,
    Drug: true,
    Hospital: true,
    Doctor: true,
    Bed: true,
    AgentSession: true,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const nodesRef = useRef<Map<string, PhysicsNode>>(new Map());
  const edgesRef = useRef<PhysicsEdge[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const pulsePhaseRef = useRef<number>(0);

  // Clinical Decision Support styling
  const getNodeVisuals = (node: GraphNode, isPathNode: boolean) => {
    const label = node.labels[0] || "Symptom";
    let shape: PhysicsNode["shape"] = "circle";
    let color = "#F8FAFC";
    let borderColor = "#94A3B8";
    let radius = 24;

    switch (label) {
      case "Patient":
        shape = "circle";
        color = "#0F172A";
        borderColor = isPathNode ? "#0284C7" : "#334155";
        radius = 28;
        break;

      case "Condition":
        shape = "hexagon";
        const risk = node.properties.risk_level;
        if (risk === "Critical") {
          color = "#DC2626";
          borderColor = "#991B1B";
        } else if (risk === "High") {
          color = "#D97706";
          borderColor = "#B45309";
        } else {
          color = "#0284C7";
          borderColor = "#0369A1";
        }
        radius = 30;
        break;

      case "Symptom":
        shape = "circle";
        const sev = node.properties.severity;
        if (sev === "Critical" || sev === "Severe") {
          color = "#EF4444";
          borderColor = "#DC2626";
        } else {
          color = "#F59E0B";
          borderColor = "#D97706";
        }
        radius = 22;
        break;

      case "Hospital":
        shape = "square";
        color = "#0284C7";
        borderColor = isPathNode ? "#0369A1" : "#0284C7";
        radius = 30;
        break;

      case "Doctor":
        shape = "diamond";
        color = node.properties.available ? "#0D9488" : "#64748B";
        borderColor = node.properties.available ? "#0F766E" : "#475569";
        radius = 24;
        break;

      case "Bed":
        shape = "rect";
        const isAvail = node.properties.is_available;
        color = isAvail ? "#16A34A" : "#DC2626";
        borderColor = isAvail ? "#15803D" : "#B91C1C";
        radius = 22;
        break;

      case "Drug":
        shape = "capsule";
        color = "#6366F1";
        borderColor = "#4F46E5";
        radius = 22;
        break;

      case "AgentSession":
        shape = "octagon";
        color = "#475569";
        borderColor = "#334155";
        radius = 22;
        break;
    }

    return { shape, color, borderColor, radius };
  };

  useEffect(() => {
    const existing = nodesRef.current;
    const newNodes = new Map<string, PhysicsNode>();

    const pathNodeSet = new Set(activePathNodeIds);
    const pathEdgeSet = new Set(activePathEdgeIds);

    const canvasWidth = containerRef.current?.clientWidth || 800;
    const canvasHeight = containerRef.current?.clientHeight || 600;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    graphData.nodes.forEach((n, index) => {
      const isPath = pathNodeSet.has(n.id);
      const visuals = getNodeVisuals(n, isPath);
      const isReservedBed = n.labels.includes("Bed") && n.properties.is_available === false;

      let x = centerX + (Math.random() - 0.5) * 500;
      let y = centerY + (Math.random() - 0.5) * 400;

      // Clinical flow positioning (Patient -> Symptoms -> Condition -> Hospital -> Doctor -> Bed)
      if (n.labels.includes("Patient")) {
        x = centerX - 320;
        y = centerY + (index - 2) * 80;
      } else if (n.labels.includes("Symptom")) {
        x = centerX - 160 + (Math.random() - 0.5) * 50;
        y = centerY + (index - 6) * 45;
      } else if (n.labels.includes("Condition")) {
        x = centerX;
        y = centerY + (index - 2) * 90;
      } else if (n.labels.includes("Drug")) {
        x = centerX + 10;
        y = centerY + 180 + (index - 2) * 35;
      } else if (n.labels.includes("Hospital")) {
        x = centerX + 180;
        y = centerY + (index - 2) * 110;
      } else if (n.labels.includes("Doctor")) {
        x = centerX + 300;
        y = centerY + (index - 4) * 60;
      } else if (n.labels.includes("Bed")) {
        x = centerX + 400;
        y = centerY + (index - 8) * 35;
      } else if (n.labels.includes("AgentSession")) {
        x = centerX - 320;
        y = centerY + 180 + index * 40;
      }

      if (existing.has(n.id)) {
        const old = existing.get(n.id)!;
        newNodes.set(n.id, {
          ...old,
          properties: n.properties,
          isPathNode: isPath,
          isReservedBed,
          color: visuals.color,
          borderColor: visuals.borderColor,
        });
      } else {
        newNodes.set(n.id, {
          id: n.id,
          label: n.labels[0],
          name: n.properties.name || n.id,
          properties: n.properties,
          x,
          y,
          vx: 0,
          vy: 0,
          radius: visuals.radius,
          color: visuals.color,
          borderColor: visuals.borderColor,
          shape: visuals.shape,
          isPathNode: isPath,
          isReservedBed,
        });
      }
    });

    const newEdges: PhysicsEdge[] = [];
    graphData.edges.forEach((e) => {
      const sourceNode = newNodes.get(e.source);
      const targetNode = newNodes.get(e.target);

      if (sourceNode && targetNode) {
        const isPathEdge =
          pathEdgeSet.has(e.id) ||
          (pathNodeSet.has(e.source) && pathNodeSet.has(e.target));

        newEdges.push({
          id: e.id,
          source: sourceNode,
          target: targetNode,
          type: e.type,
          properties: e.properties || {},
          isPathEdge,
          isContraindication: e.type === "CONTRAINDICATES",
          isReservation: e.type === "RESERVED_FOR",
        });
      }
    });

    nodesRef.current = newNodes;
    edgesRef.current = newEdges;
  }, [graphData, activePathNodeIds, activePathEdgeIds]);

  // Main Render Loop with Crisp White/Slate Clinical Styling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const renderLoop = () => {
      if (!isRunning) return;

      pulsePhaseRef.current = (pulsePhaseRef.current + 0.04) % (Math.PI * 2);
      const pulse = Math.sin(pulsePhaseRef.current);

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Clean Light Clinical Grid (Off-white / Slate)
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 1;
      const gridSize = 36 * zoom;
      const offsetX = pan.x % gridSize;
      const offsetY = pan.y % gridSize;

      ctx.beginPath();
      for (let x = offsetX; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const nodes = Array.from(nodesRef.current.values());
      const edges = edgesRef.current;

      // Soft physics relaxation
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < 110) {
            const force = (110 - dist) / 110 * 0.35;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (n1 !== draggedNode) {
              n1.x -= fx;
              n1.y -= fy;
            }
            if (n2 !== draggedNode) {
              n2.x += fx;
              n2.y += fy;
            }
          }
        }
      }

      // 1. DRAW EDGES
      edges.forEach((edge) => {
        if (!activeFilters[edge.source.label] || !activeFilters[edge.target.label]) {
          return;
        }

        const isPath = edge.isPathEdge;
        const isContra = edge.isContraindication;
        const isRes = edge.isReservation;

        ctx.beginPath();
        ctx.moveTo(edge.source.x, edge.source.y);
        ctx.lineTo(edge.target.x, edge.target.y);

        if (isRes) {
          ctx.strokeStyle = "#DC2626";
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 4]);
        } else if (isContra) {
          ctx.strokeStyle = "#EA580C";
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 4]);
        } else if (isPath) {
          ctx.strokeStyle = "#0284C7";
          ctx.lineWidth = 3;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = "#CBD5E1";
          ctx.lineWidth = 1.2;
          ctx.setLineDash([]);
        }

        ctx.stroke();
        ctx.setLineDash([]);

        // Animated traversal particles on active path
        if (isPath || isRes) {
          const t = (pulsePhaseRef.current / (Math.PI * 2) + (edge.id.length % 5) * 0.2) % 1;
          const px = edge.source.x + (edge.target.x - edge.source.x) * t;
          const py = edge.source.y + (edge.target.y - edge.source.y) * t;

          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = isRes ? "#DC2626" : "#0284C7";
          ctx.fill();
        }

        // Edge label (clean clinical font)
        if (isPath || isContra || isRes || zoom > 0.85) {
          const midX = (edge.source.x + edge.target.x) / 2;
          const midY = (edge.source.y + edge.target.y) / 2;
          ctx.font = "bold 9px sans-serif";
          ctx.fillStyle = isRes ? "#DC2626" : isContra ? "#C2410C" : isPath ? "#0369A1" : "#64748B";
          ctx.fillText(edge.type, midX + 4, midY - 4);
        }
      });

      // 2. DRAW NODES
      nodes.forEach((node) => {
        if (!activeFilters[node.label]) return;

        const isSelected = selectedNodeId === node.id;
        const isPath = node.isPathNode;
        const isMatchSearch =
          searchQuery.trim() !== "" &&
          node.name.toLowerCase().includes(searchQuery.toLowerCase());

        ctx.save();
        ctx.translate(node.x, node.y);

        // Highlight ring
        if (isPath || isSelected || isMatchSearch) {
          ctx.beginPath();
          ctx.arc(0, 0, node.radius + 6 + pulse * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = node.isReservedBed
            ? "rgba(220, 38, 38, 0.2)"
            : isSelected
            ? "rgba(2, 132, 199, 0.25)"
            : "rgba(13, 148, 136, 0.2)";
          ctx.fill();
        }

        // Draw shape
        ctx.beginPath();

        if (node.shape === "hexagon") {
          const r = node.radius;
          for (let a = 0; a < 6; a++) {
            const angle = (a * Math.PI) / 3;
            const hx = r * Math.cos(angle);
            const hy = r * Math.sin(angle);
            if (a === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
        } else if (node.shape === "square") {
          const s = node.radius * 1.5;
          ctx.roundRect(-s / 2, -s / 2, s, s, 6);
        } else if (node.shape === "diamond") {
          const r = node.radius * 1.3;
          ctx.moveTo(0, -r);
          ctx.lineTo(r, 0);
          ctx.lineTo(0, r);
          ctx.lineTo(-r, 0);
          ctx.closePath();
        } else if (node.shape === "rect") {
          const w = node.radius * 1.8;
          const h = node.radius * 1.2;
          ctx.roundRect(-w / 2, -h / 2, w, h, 6);
        } else if (node.shape === "capsule") {
          const w = node.radius * 2.0;
          const h = node.radius * 1.1;
          ctx.roundRect(-w / 2, -h / 2, w, h, 8);
        } else if (node.shape === "octagon") {
          const r = node.radius;
          for (let a = 0; a < 8; a++) {
            const angle = (a * Math.PI) / 4 + Math.PI / 8;
            const ox = r * Math.cos(angle);
            const oy = r * Math.sin(angle);
            if (a === 0) ctx.moveTo(ox, oy);
            else ctx.lineTo(ox, oy);
          }
          ctx.closePath();
        } else {
          ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
        }

        ctx.fillStyle = node.color;
        ctx.fill();

        ctx.strokeStyle = isSelected
          ? "#0284C7"
          : isPath
          ? "#0369A1"
          : node.borderColor;
        ctx.lineWidth = isSelected ? 3 : isPath ? 2.5 : 1.5;
        ctx.stroke();

        // Node internal symbol
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (node.label === "Hospital") {
          ctx.fillText("✚", 0, 0);
        } else if (node.label === "Bed") {
          ctx.fillText(node.properties.is_available ? "ICU" : "LOCK", 0, 0);
        } else if (node.label === "Doctor") {
          ctx.fillText("DR", 0, 0);
        } else if (node.label === "Condition") {
          ctx.fillText("DX", 0, 0);
        } else if (node.label === "Patient") {
          ctx.fillText("PT", 0, 0);
        } else if (node.label === "Drug") {
          ctx.fillText("Rx", 0, 0);
        } else {
          ctx.fillText("●", 0, 0);
        }

        // Node text label below (High contrast dark slate)
        ctx.font = "bold 11px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = "#0F172A";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const displayName = node.name.length > 20 ? node.name.slice(0, 18) + "…" : node.name;
        ctx.fillText(displayName, 0, node.radius + 6);

        ctx.restore();
      });

      ctx.restore();
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [pan, zoom, activeFilters, selectedNodeId, searchQuery, draggedNode]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;

    let clickedNode: PhysicsNode | null = null;
    const nodes = Array.from(nodesRef.current.values());

    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (!activeFilters[n.label]) continue;
      const dx = worldX - n.x;
      const dy = worldY - n.y;
      if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) {
        clickedNode = n;
        break;
      }
    }

    if (clickedNode) {
      setDraggedNode(clickedNode);
      const graphNode = graphData.nodes.find((gn) => gn.id === clickedNode!.id) || null;
      onSelectNode(graphNode);
    } else {
      setIsDragging(true);
      setDragStart({ x: mouseX - pan.x, y: mouseY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggedNode) {
      draggedNode.x = (mouseX - pan.x) / zoom;
      draggedNode.y = (mouseY - pan.y) / zoom;
    } else if (isDragging) {
      setPan({
        x: mouseX - dragStart.x,
        y: mouseY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFilter = (label: NodeLabel) => {
    setActiveFilters((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-50 overflow-hidden flex flex-col select-none">
      {/* Top HUD Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm text-slate-800">
          <Activity className="w-3.5 h-3.5 text-teal-600" />
          <span>FalkorDB Clinical Graph</span>
          <span className="text-slate-300">|</span>
          <span className="text-teal-700 font-bold">{graphData.nodes.length} Nodes</span>
          <span className="text-slate-400 font-normal">{graphData.edges.length} Edges</span>
          {reasoningResult && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-bold">
                Matched: {reasoningResult.SuspectedCondition}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-1 shadow-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search node..."
            className="w-28 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600"
          />
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z * 1.15))}
            className="p-1 rounded hover:bg-slate-100 text-slate-600"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z * 0.85))}
            className="p-1 rounded hover:bg-slate-100 text-slate-600"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1 rounded hover:bg-slate-100 text-slate-600"
            title="Reset Pan & Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Bottom Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1 pointer-events-auto bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shadow-sm">
          <span className="text-slate-400 text-[11px] mr-1">LAYERS:</span>
          {(Object.keys(activeFilters) as NodeLabel[]).map((label) => (
            <button
              key={label}
              onClick={() => toggleFilter(label)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition border ${
                activeFilters[label]
                  ? "bg-slate-100 text-slate-800 border-slate-300"
                  : "bg-white text-slate-400 border-slate-200 line-through"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pointer-events-auto bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-sm" />
            <span>Condition</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
            <span>Symptom</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-sky-600 rounded-sm" />
            <span>Hospital</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-teal-600 rotate-45" />
            <span>Doctor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-emerald-600 rounded" />
            <span>Bed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Stethoscope, AlertTriangle, ShieldCheck, CheckCircle2, Clock, 
  User, Phone, Building, RefreshCw, ArrowLeft, Filter, Sparkles, Activity
} from "lucide-react";
import { EscalationTicket, EscalationUrgency, EscalationStatus } from "@/lib/escalation";

export default function EscalationsPage() {
  const [tickets, setTickets] = useState<EscalationTicket[]>([]);
  const [counts, setCounts] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0 });
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/escalation");
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
        if (data.counts) setCounts(data.counts);
      }
    } catch (e) {
      console.warn("[Escalation Page] Fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (ticketId: string, newStatus: EscalationStatus) => {
    setUpdatingId(ticketId);
    try {
      const res = await fetch("/api/escalation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets(prev => prev.map(t => t.ticket_id === ticketId ? { ...t, status: newStatus } : t));
        fetchTickets();
      }
    } catch (e) {
      console.error("[Status Update Error]", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTickets = filterUrgency === "all" 
    ? tickets 
    : tickets.filter(t => t.urgency === filterUrgency);

  const getUrgencyBadge = (urgency: EscalationUrgency) => {
    switch (urgency) {
      case "emergency":
        return <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-mono font-bold text-xs animate-pulse">EMERGENCY (108 Alert)</span>;
      case "high":
        return <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-mono font-bold text-xs">HIGH (PHC Doctor)</span>;
      case "medium":
        return <span className="px-3 py-1 rounded-full bg-teal-600 text-white font-mono font-bold text-xs">MEDIUM (OPD Review)</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-600 text-white font-mono font-bold text-xs">ROUTINE</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans selection:bg-teal-600 selection:text-white">
      
      {/* Top Header Navigation */}
      <header className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Assistant</span>
            </Link>

            <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
              <div className="w-9 h-9 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight">
                  Doctor & Nurse Escalation Command Center
                </h1>
                <p className="text-[11px] text-teal-400 font-medium">
                  #VoiceForBharat • Clinical Doctor Escalation & Triage
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchTickets}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-xs font-bold uppercase tracking-wider">Total Escalations</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">{counts.total}</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60">
            <span className="text-rose-400 block text-xs font-bold uppercase tracking-wider">Open / Red-Flag Alerts</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1 block">{counts.open}</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60">
            <span className="text-amber-400 block text-xs font-bold uppercase tracking-wider">In Doctor Review</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1 block">{counts.in_progress}</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60">
            <span className="text-emerald-400 block text-xs font-bold uppercase tracking-wider">Resolved Cases</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1 block">{counts.resolved}</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-slate-300">Filter by Urgency:</span>
            {["all", "emergency", "high", "medium"].map(u => (
              <button
                key={u}
                onClick={() => setFilterUrgency(u)}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition ${
                  filterUrgency === u
                    ? "bg-teal-600 text-white shadow-md"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          <div className="text-slate-400 text-xs font-medium">
            Assigned Facility: <span className="text-teal-300 font-bold">Shivpur Primary Health Centre (PHC)</span>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-teal-500 mx-auto opacity-70" />
              <h3 className="text-base font-bold text-slate-200">No Escalation Tickets Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All patient symptom triage interactions are currently stable or resolved.
              </p>
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <div 
                key={ticket.ticket_id}
                className={`p-5 sm:p-6 rounded-3xl bg-slate-900 border transition shadow-lg space-y-4 ${
                  ticket.urgency === "emergency" ? "border-rose-500/80 bg-gradient-to-r from-slate-900 to-rose-950/20" :
                  ticket.status === "resolved" ? "border-slate-800 opacity-75" :
                  "border-teal-500/30"
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-extrabold bg-teal-950 text-teal-300 border border-teal-700/60 px-3 py-1.5 rounded-xl">
                      {ticket.ticket_id}
                    </span>
                    <span className="font-extrabold text-base text-white flex items-center gap-1.5">
                      <User className="w-4 h-4 text-teal-400" />
                      {ticket.patient_name}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                      📞 {ticket.masked_phone}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getUrgencyBadge(ticket.urgency)}
                    <span className={`px-2.5 py-1 rounded-lg font-bold text-xs uppercase ${
                      ticket.status === "open" ? "bg-rose-950 text-rose-300 border border-rose-800" :
                      ticket.status === "in_progress" ? "bg-amber-950 text-amber-300 border border-amber-800" :
                      "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    }`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Clinical Summary */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Doctor Triage Brief:
                  </span>
                  <p className="text-sm text-slate-100 bg-slate-800/80 p-4 rounded-2xl border border-slate-700 leading-relaxed font-medium">
                    {ticket.summary}
                  </p>
                </div>

                {/* Details & Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 pt-1">
                  <div>
                    <span className="font-bold text-slate-400 block mb-1">Pre-Check Items:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                      {ticket.checked_items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1 text-slate-300">
                    <div>
                      <span className="font-bold text-slate-400">Target Facility: </span>
                      <span className="text-teal-300 font-semibold">{ticket.assigned_facility}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400">Preferred Channel: </span>
                      <span className="capitalize">{ticket.preferred_followup.replace("_", " ")} ({ticket.caller_language.toUpperCase()})</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400">Timestamp: </span>
                      <span>{new Date(ticket.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>Follow-up ETA: <strong>30-60 minutes</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {ticket.status !== "in_progress" && ticket.status !== "resolved" && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.ticket_id, "in_progress")}
                        disabled={updatingId === ticket.ticket_id}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition"
                      >
                        Start Review
                      </button>
                    )}

                    {ticket.status !== "resolved" && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.ticket_id, "resolved")}
                        disabled={updatingId === ticket.ticket_id}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve Case</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        SwasthyaSathi AI • Clinical Human Escalation Command Center (#VoiceForBharat)
      </footer>

    </div>
  );
}

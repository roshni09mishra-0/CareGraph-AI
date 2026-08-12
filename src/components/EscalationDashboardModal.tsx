"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardList, AlertTriangle, ShieldCheck, CheckCircle2, Clock, 
  User, Phone, Building, RefreshCw, X, ArrowUpRight, Filter, Stethoscope, Sparkles
} from "lucide-react";
import { EscalationTicket, EscalationUrgency, EscalationStatus } from "@/lib/escalation";

interface EscalationDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: "hi" | "en" | "hinglish";
}

export default function EscalationDashboardModal({
  isOpen,
  onClose,
  language = "hi",
}: EscalationDashboardModalProps) {
  const [tickets, setTickets] = useState<EscalationTicket[]>([]);
  const [counts, setCounts] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0 });
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isHindi = language === "hi" || language === "hinglish";

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
      console.warn("[Escalation Dashboard] Fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const filteredTickets = filterUrgency === "all" 
    ? tickets 
    : tickets.filter(t => t.urgency === filterUrgency);

  const getUrgencyBadge = (urgency: EscalationUrgency) => {
    switch (urgency) {
      case "emergency":
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono font-bold text-[10px] animate-pulse">EMERGENCY (108 Alert)</span>;
      case "high":
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-mono font-bold text-[10px]">HIGH (PHC Doctor)</span>;
      case "medium":
        return <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-mono font-bold text-[10px]">MEDIUM (OPD Review)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-600 text-white font-mono font-bold text-[10px]">ROUTINE</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      
      <div className="w-full max-w-4xl rounded-3xl bg-white border border-teal-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                  {isHindi ? "मानव डॉक्टर एस्केलेशन डैशबोर्ड" : "Human Doctor Escalation Dashboard"}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono font-bold">
                  DAY 7
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                Shivpur PHC Duty Doctor & Nurse Command Center • Reference ID & Clinical Triage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTickets}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-50"
              title="Refresh tickets"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Counter Bar */}
        <div className="grid grid-cols-4 gap-2 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Total Tickets</span>
            <span className="text-base font-extrabold text-slate-800">{counts.total}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
            <span className="text-rose-700 block text-[10px] font-bold uppercase">Open / Pending</span>
            <span className="text-base font-extrabold text-rose-700">{counts.open}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-amber-700 block text-[10px] font-bold uppercase">In Progress</span>
            <span className="text-base font-extrabold text-amber-700">{counts.in_progress}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-emerald-700 block text-[10px] font-bold uppercase">Resolved</span>
            <span className="text-base font-extrabold text-emerald-700">{counts.resolved}</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Urgency:</span>
            {["all", "emergency", "high", "medium"].map(u => (
              <button
                key={u}
                onClick={() => setFilterUrgency(u)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition ${
                  filterUrgency === u
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-500">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </span>
        </div>

        {/* Tickets List Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-slate-800 bg-slate-50/50">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto opacity-60" />
              <p className="font-bold text-sm">कोई पेंडिंग एस्केलेशन टिकट नहीं है (No pending tickets)</p>
              <p className="text-xs text-slate-400">सभी मरीजों की स्थिति सामान्य है या हल हो चुकी है।</p>
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <div 
                key={ticket.ticket_id}
                className={`p-4 sm:p-5 rounded-2xl bg-white border shadow-sm transition space-y-3 ${
                  ticket.urgency === "emergency" ? "border-rose-400 ring-2 ring-rose-100" :
                  ticket.status === "resolved" ? "border-slate-200 opacity-80" :
                  "border-teal-200"
                }`}
              >
                {/* Top Row: Ref ID + Patient Name + Urgency */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold bg-slate-900 text-teal-300 px-2.5 py-1 rounded-lg">
                      {ticket.ticket_id}
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-teal-700" />
                      {ticket.patient_name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-bold">
                      📞 {ticket.masked_phone}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getUrgencyBadge(ticket.urgency)}
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                      ticket.status === "open" ? "bg-rose-100 text-rose-800" :
                      ticket.status === "in_progress" ? "bg-amber-100 text-amber-800" :
                      "bg-emerald-100 text-emerald-800"
                    }`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Middle: Clinical Summary */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>क्लीनिकल सारांश (Clinical Summary for Doctor):</span>
                  </div>
                  <p className="text-slate-800 bg-teal-50/50 p-3 rounded-xl border border-teal-100 leading-relaxed font-medium">
                    {ticket.summary}
                  </p>
                </div>

                {/* Checked Items & Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Agent Checked Items:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                      {ticket.checked_items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <div>
                      <span className="font-bold text-slate-700">Assigned Facility: </span>
                      <span className="text-teal-800 font-semibold">{ticket.assigned_facility}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Preferred Follow-up: </span>
                      <span className="capitalize">{ticket.preferred_followup.replace("_", " ")} ({ticket.caller_language.toUpperCase()})</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Created: </span>
                      <span>{new Date(ticket.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Doctor Follow-up ETA: 30-60 minutes</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {ticket.status !== "in_progress" && ticket.status !== "resolved" && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.ticket_id, "in_progress")}
                        disabled={updatingId === ticket.ticket_id}
                        className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition"
                      >
                        Start Review
                      </button>
                    )}

                    {ticket.status !== "resolved" && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.ticket_id, "resolved")}
                        disabled={updatingId === ticket.ticket_id}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Resolve Ticket</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}

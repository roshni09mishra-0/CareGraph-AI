process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextRequest, NextResponse } from "next/server";
import {
  getEscalationTickets,
  createEscalationTicket,
  updateEscalationStatus,
  EscalationReason,
  EscalationUrgency,
  EscalationStatus,
} from "@/lib/escalation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tickets = getEscalationTickets();
    const openCount = tickets.filter(t => t.status === "open").length;
    const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
    const resolvedCount = tickets.filter(t => t.status === "resolved").length;

    return NextResponse.json({
      success: true,
      tickets,
      counts: {
        total: tickets.length,
        open: openCount,
        in_progress: inProgressCount,
        resolved: resolvedCount,
      },
      dutyFacility: "Shivpur Primary Health Centre (PHC), Varanasi",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Escalation API GET Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientId,
      patientName,
      phoneNumber,
      reason,
      urgency,
      summary,
      checkedItems,
      callerLanguage,
      preferredFollowup,
      consentGiven,
      assignedFacility,
    } = body;

    if (!consentGiven) {
      return NextResponse.json({
        success: false,
        error: "Caller consent is required before sharing information with human doctor.",
      }, { status: 400 });
    }

    if (!summary || !reason) {
      return NextResponse.json({
        success: false,
        error: "Summary and reason are required to create a human escalation ticket.",
      }, { status: 400 });
    }

    const { ticket, is_duplicate_update } = createEscalationTicket({
      patient_id: patientId,
      patient_name: patientName || "रमेश कुमार",
      phone_number: phoneNumber || "+91 7991912530",
      reason: (reason as EscalationReason) || "red_flag_symptom",
      urgency: (urgency as EscalationUrgency) || "high",
      summary: summary,
      checked_items: checkedItems || ["Initial symptom triage", "Consent verified"],
      caller_language: callerLanguage || "hi",
      preferred_followup: preferredFollowup || "phone_call",
      consent_given: true,
      assigned_facility: assignedFacility || "Shivpur Primary Health Centre (PHC)",
    });

    return NextResponse.json({
      success: true,
      ticketId: ticket.ticket_id,
      ticket: ticket,
      isDuplicateUpdate: is_duplicate_update,
      nextStep: {
        referenceId: ticket.ticket_id,
        eta: ticket.urgency === "emergency" ? "Immediate (108 dispatched / Doctor alerted)" : "30-60 minutes",
        facility: ticket.assigned_facility,
        instructions: ticket.caller_language === "en"
          ? `Your ticket ${ticket.ticket_id} has been escalated to the duty doctor at ${ticket.assigned_facility}. Expected callback within 30-60 mins.`
          : `आपका संदर्भ नंबर (Reference ID) ${ticket.ticket_id} दर्ज हो गया है। शिवपुर PHC के ड्यूटी डॉक्टर अगले 30 से 60 मिनट में आपसे संपर्क करेंगे।`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Escalation API POST Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, status, doctorNotes } = body;

    if (!ticketId || !status) {
      return NextResponse.json({
        success: false,
        error: "ticketId and status are required",
      }, { status: 400 });
    }

    const updated = updateEscalationStatus(ticketId, status as EscalationStatus, doctorNotes);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ticket: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Escalation API PATCH Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

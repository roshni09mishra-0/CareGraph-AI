/**
 * Human Help Escalation Engine for Bharat (#VoiceForBharat Day 7)
 * Track: Health Access 🩺 (SwasthyaSathi AI)
 * 
 * Capabilities:
 * 1. Reasons for Human Help:
 *    - "red_flag_symptom": Clinical emergency signs (chest pain, acute breathlessness, stroke signs)
 *    - "diagnosis_request": Caller asking for medical diagnosis, drug prescriptions, or persistent >5d issues
 * 2. Scrub Sensitive Private Information (No OTPs, passwords, PINs, bank details)
 * 3. Structured Summary for Human Duty Doctor / Nurse
 * 4. Reference ID Generation (e.g. ESC-2026-4892)
 * 5. Deduplication & Urgency Classification (Emergency, High, Medium, Low)
 */

import fs from "fs";
import path from "path";
import { maskPhoneNumber } from "./telephony";

export type EscalationUrgency = "emergency" | "high" | "medium" | "low";

export type EscalationReason = 
  | "red_flag_symptom"
  | "diagnosis_request"
  | "unresolved_persistent_condition"
  | "caller_requested_human";

export type EscalationStatus = "open" | "in_progress" | "resolved" | "cancelled";

export interface EscalationTicket {
  ticket_id: string; // e.g. "ESC-2026-8492"
  patient_id: string;
  patient_name: string;
  phone_number: string;
  masked_phone: string;
  reason: EscalationReason;
  urgency: EscalationUrgency;
  summary: string;
  checked_items: string[];
  caller_language: "hi" | "en" | "hinglish";
  preferred_followup: "phone_call" | "phc_visit" | "sms";
  consent_given: boolean;
  assigned_facility: string; // e.g. "Shivpur Primary Health Centre (PHC)"
  status: EscalationStatus;
  created_at: string;
  resolved_at?: string;
  doctor_notes?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const ESCALATIONS_FILE = path.join(DATA_DIR, "escalations_db.json");

/**
 * Remove sensitive PII (Passwords, OTPs, PINs, Bank Accounts) from summary
 */
export function scrubSensitiveData(text: string): string {
  if (!text) return "";
  let scrubbed = text;
  // Scrub OTPs / PINs (4-6 digit standalone numbers with keywords)
  scrubbed = scrubbed.replace(/(?:otp|pin|password|cvv|account)[\s:]*([0-9a-zA-Z]{4,16})/gi, "[REDACTED_SENSITIVE]");
  // Scrub credit/debit card-like sequences
  scrubbed = scrubbed.replace(/\b(?:\d[ -]*?){13,16}\b/g, "[REDACTED_PAYMENT]");
  return scrubbed;
}

/**
 * Ensure database file exists with initial pre-seeded clinical escalations
 */
function ensureEscalationsDb(): EscalationTicket[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(ESCALATIONS_FILE)) {
    const initialTickets: EscalationTicket[] = [
      {
        ticket_id: "ESC-2026-1042",
        patient_id: "user_ramesh",
        patient_name: "रमेश कुमार",
        phone_number: "+91 7991912530",
        masked_phone: "+91 79919 •••••",
        reason: "red_flag_symptom",
        urgency: "emergency",
        summary: "Patient reported acute radiating chest pain towards left arm with cold sweats for past 45 minutes. Advised immediate 108 ambulance dispatch and resting in comfortable position.",
        checked_items: [
          "Checked onset time (45 mins ago)",
          "Checked pain radiation (left arm)",
          "Advised 108 Emergency Ambulance",
          "Confirmed patient consent to alert duty doctor"
        ],
        caller_language: "hi",
        preferred_followup: "phone_call",
        consent_given: true,
        assigned_facility: "Shivpur Primary Health Centre (PHC)",
        status: "open",
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        ticket_id: "ESC-2026-0985",
        patient_id: "user_priya",
        patient_name: "प्रिया देवी",
        phone_number: "+91 7991912530",
        masked_phone: "+91 79919 •••••",
        reason: "diagnosis_request",
        urgency: "medium",
        summary: "Patient asking for prescription medication and definitive diagnosis for persistent joint swelling and skin rash lasting 6 days.",
        checked_items: [
          "Checked symptom duration (6 days)",
          "Verified lack of red-flag breathing distress",
          "Explained AI non-diagnostic scope",
          "Scheduled PHC medical officer review"
        ],
        caller_language: "hi",
        preferred_followup: "phc_visit",
        consent_given: true,
        assigned_facility: "Shivpur Primary Health Centre (PHC)",
        status: "in_progress",
        created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        doctor_notes: "Dr. Sharma assigned - Scheduled for 11:30 AM PHC outpatient visit.",
      }
    ];

    fs.writeFileSync(ESCALATIONS_FILE, JSON.stringify(initialTickets, null, 2), "utf-8");
    return initialTickets;
  }

  try {
    const raw = fs.readFileSync(ESCALATIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("[Escalation DB Error] Failed to read DB, resetting:", e);
    return [];
  }
}

/**
 * Get all escalation tickets
 */
export function getEscalationTickets(): EscalationTicket[] {
  return ensureEscalationsDb();
}

/**
 * Create or Update Escalation Ticket (with duplicate prevention)
 */
export function createEscalationTicket(params: {
  patient_id?: string;
  patient_name: string;
  phone_number?: string;
  reason: EscalationReason;
  urgency: EscalationUrgency;
  summary: string;
  checked_items?: string[];
  caller_language?: "hi" | "en" | "hinglish";
  preferred_followup?: "phone_call" | "phc_visit" | "sms";
  consent_given: boolean;
  assigned_facility?: string;
}): { ticket: EscalationTicket; is_duplicate_update: boolean } {
  // Enforce consent check rule
  if (!params.consent_given) {
    throw new Error("Consent not given: Cannot share caller information without explicit caller consent.");
  }

  const tickets = ensureEscalationsDb();
  const rawPhone = params.phone_number || "+91 7991912530";
  const cleanPhone = rawPhone.replace(/\s+/g, "");
  const scrubbedSummary = scrubSensitiveData(params.summary);

  // Check for existing open ticket for the same patient/phone & reason to prevent duplicates (Day 7 Advanced)
  const existingIndex = tickets.findIndex(
    t => t.phone_number.replace(/\s+/g, "") === cleanPhone &&
         t.reason === params.reason &&
         (t.status === "open" || t.status === "in_progress")
  );

  if (existingIndex !== -1) {
    const existing = tickets[existingIndex];
    console.log(`[Escalation Engine] Updating existing duplicate ticket ${existing.ticket_id} for ${params.patient_name}`);
    
    existing.summary = `${existing.summary} | Update (${new Date().toLocaleTimeString()}): ${scrubbedSummary}`;
    existing.urgency = params.urgency === "emergency" ? "emergency" : existing.urgency;
    if (params.checked_items && params.checked_items.length > 0) {
      existing.checked_items = Array.from(new Set([...existing.checked_items, ...params.checked_items]));
    }
    
    fs.writeFileSync(ESCALATIONS_FILE, JSON.stringify(tickets, null, 2), "utf-8");
    return { ticket: existing, is_duplicate_update: true };
  }

  // Generate Reference ID (ESC-YYYY-XXXX)
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const currentYear = new Date().getFullYear();
  const ticketId = `ESC-${currentYear}-${randNum}`;

  const newTicket: EscalationTicket = {
    ticket_id: ticketId,
    patient_id: params.patient_id || `user_${Math.random().toString(36).substring(2, 7)}`,
    patient_name: params.patient_name || "रमेश कुमार",
    phone_number: rawPhone,
    masked_phone: maskPhoneNumber(rawPhone),
    reason: params.reason,
    urgency: params.urgency,
    summary: scrubbedSummary,
    checked_items: params.checked_items || ["Symptom triage evaluated", "Consent recorded"],
    caller_language: params.caller_language || "hi",
    preferred_followup: params.preferred_followup || "phone_call",
    consent_given: true,
    assigned_facility: params.assigned_facility || "Shivpur Primary Health Centre (PHC)",
    status: "open",
    created_at: new Date().toISOString(),
  };

  tickets.unshift(newTicket);
  fs.writeFileSync(ESCALATIONS_FILE, JSON.stringify(tickets, null, 2), "utf-8");
  console.log(`[Escalation Created] Ticket ${ticketId} generated for ${newTicket.patient_name} [${newTicket.urgency.toUpperCase()}]`);

  return { ticket: newTicket, is_duplicate_update: false };
}

/**
 * Update Escalation Status
 */
export function updateEscalationStatus(
  ticketId: string,
  status: EscalationStatus,
  doctorNotes?: string
): EscalationTicket | null {
  const tickets = ensureEscalationsDb();
  const ticket = tickets.find(t => t.ticket_id === ticketId);
  if (!ticket) return null;

  ticket.status = status;
  if (doctorNotes) {
    ticket.doctor_notes = doctorNotes;
  }
  if (status === "resolved") {
    ticket.resolved_at = new Date().toISOString();
  }

  fs.writeFileSync(ESCALATIONS_FILE, JSON.stringify(tickets, null, 2), "utf-8");
  return ticket;
}

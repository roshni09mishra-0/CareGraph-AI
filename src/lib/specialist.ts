/**
 * Specialist Agent Engine (#VoiceForBharat Day 9)
 * Track: Health Access 🩺 (SwasthyaSathi AI)
 * 
 * Role: Clinic & Appointment Specialist ("Arogya Mitra / PHC Appointment Specialist")
 * Responsibilities:
 * 1. Booking doctor OPD appointments at nearest PHC/CHC (e.g., Shivpur Primary Health Centre, Varanasi).
 * 2. Allocating token numbers, date/time slots, and doctor assignments.
 * 3. Assisting with Ayushman Bharat PM-JAY registration & verification.
 * 4. Context Preservation: Receives patient history from Main Agent without asking the user to repeat.
 */

import fs from "fs";
import path from "path";
import { maskPhoneNumber } from "./telephony";

export interface AppointmentRecord {
  appointment_id: string; // e.g. "OPD-2026-8192"
  token_number: number; // e.g. 14
  patient_id: string; // e.g. "user_ramesh"
  patient_name: string; // e.g. "रमेश कुमार"
  masked_phone: string; // e.g. "+91 79919 •••••"
  facility_id: string; // e.g. "fac_up_vns_01"
  facility_name: string; // e.g. "Shivpur Primary Health Centre (PHC)"
  facility_address: string; // e.g. "Near Shivpur Railway Station, Airport Road, Varanasi"
  doctor_name: string; // e.g. "Dr. Rajesh Gupta, MD (General Medicine)"
  department: string; // e.g. "General Medicine OPD"
  appointment_date: string; // e.g. "Tomorrow (14 August 2026)"
  time_slot: string; // e.g. "10:00 AM - 11:30 AM"
  reason_for_visit: string; // e.g. "Post-Triage Fever Evaluation & Blood Test"
  ayushman_covered: boolean;
  status: "confirmed" | "completed" | "cancelled";
  created_at: string;
}

export interface SpecialistContext {
  active_agent: "main" | "clinic_specialist";
  patient_id: string;
  patient_name: string;
  phone_number: string;
  symptom_summary?: string;
  preferred_facility?: string;
  last_action?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const APPOINTMENTS_FILE = path.join(DATA_DIR, "appointments_db.json");

/**
 * Initial demo appointments dataset
 */
function getInitialAppointmentsDB(): AppointmentRecord[] {
  return [
    {
      appointment_id: "OPD-2026-8001",
      token_number: 8,
      patient_id: "user_ramesh",
      patient_name: "रमेश कुमार",
      masked_phone: "+91 79919 •••••",
      facility_id: "fac_up_vns_01",
      facility_name: "Shivpur Primary Health Centre (PHC)",
      facility_address: "Near Shivpur Railway Station, Airport Road, Varanasi",
      doctor_name: "Dr. Rajesh Gupta, MD",
      department: "General OPD & Fever Clinic",
      appointment_date: "14 August 2026",
      time_slot: "10:00 AM - 11:30 AM",
      reason_for_visit: "Post-Triage Fever & Blood Count Review",
      ayushman_covered: true,
      status: "confirmed",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    }
  ];
}

export function getAllAppointments(): AppointmentRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(APPOINTMENTS_FILE)) {
      const initial = getInitialAppointmentsDB();
      fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(APPOINTMENTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("[Specialist Engine] Read error:", error);
    return getInitialAppointmentsDB();
  }
}

function saveAppointments(records: AppointmentRecord[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(records, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("[Specialist Engine] Save error:", error);
    return false;
  }
}

/**
 * Tool: Book Doctor OPD Appointment Slot at Nearest PHC
 */
export function bookAppointmentSlot(params: {
  patient_id?: string;
  patient_name?: string;
  phone_number?: string;
  facility_name?: string;
  appointment_date?: string;
  time_slot?: string;
  reason_for_visit?: string;
}): { success: boolean; appointment: AppointmentRecord; spokenConfirmation: string } {
  const records = getAllAppointments();

  const appointmentId = `OPD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const tokenNumber = records.length + 12;
  const patientName = params.patient_name || "रमेश कुमार";
  const phone = params.phone_number || "+91 7991912530";
  const facilityName = params.facility_name || "Shivpur Primary Health Centre (PHC)";
  const date = params.appointment_date || "कल सुबह (Tomorrow 10:00 AM)";
  const slot = params.time_slot || "10:00 AM - 11:30 AM";
  const reason = params.reason_for_visit || "डॉक्टर परामर्श एवं स्वास्थ्य परीक्षण";

  const newAppointment: AppointmentRecord = {
    appointment_id: appointmentId,
    token_number: tokenNumber,
    patient_id: params.patient_id || "user_ramesh",
    patient_name: patientName,
    masked_phone: maskPhoneNumber(phone),
    facility_id: "fac_up_vns_01",
    facility_name: facilityName,
    facility_address: "एयरपोर्ट रोड, शिवपुर रेलवे स्टेशन के पास, वाराणसी",
    doctor_name: "डॉ. राजेश गुप्ता (MD - जनरल मेडिसिन)",
    department: "सामान्य ओपीडी (General OPD & Fever Clinic)",
    appointment_date: date,
    time_slot: slot,
    reason_for_visit: reason,
    ayushman_covered: true,
    status: "confirmed",
    created_at: new Date().toISOString(),
  };

  records.unshift(newAppointment);
  saveAppointments(records);

  const spoken = `नमस्ते ${patientName} जी! मैंने शिवपुर प्राथमिक स्वास्थ्य केंद्र में डॉ. राजेश गुप्ता के साथ आपका अपॉइंटमेंट सफलतापूर्वक बुक कर दिया है। आपका टोकन नंबर ${tokenNumber} है और स्लॉट ${date} ${slot} के लिए आरक्षित है। अस्पताल में आपको आयुष्मान भारत योजना के तहत निःशुल्क परामर्श और दवाएं मिलेंगी।`;

  console.log(`[Specialist Engine] 🏥 Booked OPD appointment: ${appointmentId} (Token #${tokenNumber}) for ${patientName}`);

  return {
    success: true,
    appointment: newAppointment,
    spokenConfirmation: spoken,
  };
}

/**
 * Handle Specialist Agent Conversation Turn
 */
export function processSpecialistTurn(params: {
  query: string;
  context: SpecialistContext;
  language?: "hi" | "en" | "hinglish";
}): {
  response: string;
  activeAgent: "main" | "clinic_specialist";
  appointmentData?: AppointmentRecord;
  isHandoff: boolean;
} {
  const q = params.query.toLowerCase().trim();
  const patientName = params.context.patient_name || "रमेश कुमार";

  // Check if caller wants to switch back to general symptoms / main agent
  const isSwitchBackQuery = (
    /\b(main agent|wapas|back|gharelu upchar|symptom|swasthya sathi|general doctor|khatam|dhanyawad|thank you|thanks)\b/i.test(q) ||
    q.includes("वापस") || q.includes("मुख्य") || q.includes("घरेलू") || q.includes("धन्यवाद")
  );

  if (isSwitchBackQuery && !q.includes("book") && !q.includes("appointment") && !q.includes("स्लॉट")) {
    return {
      response: `जी ${patientName} जी! मैंने आपका अपॉइंटमेंट सुरक्षित कर लिया है। अब मैं आपको हमारे मुख्य स्वास्थ्य साथी AI (SwasthyaSathi AI) पर वापस ट्रांसफर कर रहा हूँ।`,
      activeAgent: "main",
      isHandoff: true,
    };
  }

  // Book or confirm appointment
  const booking = bookAppointmentSlot({
    patient_id: params.context.patient_id,
    patient_name: patientName,
    phone_number: params.context.phone_number,
    reason_for_visit: params.context.symptom_summary || "बुखार और सामान्य स्वास्थ्य परीक्षण",
  });

  return {
    response: booking.spokenConfirmation,
    activeAgent: "clinic_specialist",
    appointmentData: booking.appointment,
    isHandoff: false,
  };
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextRequest, NextResponse } from "next/server";
import { getAllAppointments, bookAppointmentSlot } from "@/lib/specialist";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const appointments = getAllAppointments();
    return NextResponse.json({
      success: true,
      appointments,
      totalCount: appointments.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Appointment API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patient_id,
      patient_name,
      phone_number,
      facility_name,
      appointment_date,
      time_slot,
      reason_for_visit,
    } = body;

    const result = bookAppointmentSlot({
      patient_id,
      patient_name,
      phone_number,
      facility_name,
      appointment_date,
      time_slot,
      reason_for_visit,
    });

    return NextResponse.json({
      success: true,
      appointment: result.appointment,
      spokenConfirmation: result.spokenConfirmation,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Appointment API POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to book appointment" }, { status: 500 });
  }
}

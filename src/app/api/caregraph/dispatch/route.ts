import { NextResponse } from "next/server";
import { executeEmergencyDispatch, EmergencyDispatchRequest } from "@/lib/agents/dispatcher-agent";

export async function POST(req: Request) {
  try {
    const body: EmergencyDispatchRequest = await req.json();

    if (!body.patientId || !body.reasoningResult) {
      return NextResponse.json(
        { success: false, error: "Missing required 'patientId' or 'reasoningResult'." },
        { status: 400 }
      );
    }

    const dispatchRecord = await executeEmergencyDispatch(body);

    return NextResponse.json({
      success: true,
      data: dispatchRecord,
      message: `Emergency dispatch confirmed. Bed reserved at ${dispatchRecord.hospital_name}.`,
    });
  } catch (error: any) {
    console.error("[Dispatch API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute emergency dispatch." },
      { status: 500 }
    );
  }
}

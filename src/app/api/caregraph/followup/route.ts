import { NextResponse } from "next/server";
import { getFollowUpQueue, placeFollowUpCall, DialFollowUpInput } from "@/lib/agents/followup-agent";

export async function GET() {
  try {
    const queue = await getFollowUpQueue();
    return NextResponse.json({
      success: true,
      data: queue,
      count: queue.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body: DialFollowUpInput = await req.json();

    if (!body.sessionId || !body.patientName) {
      return NextResponse.json(
        { success: false, error: "Missing required 'sessionId' or 'patientName'." },
        { status: 400 }
      );
    }

    const result = await placeFollowUpCall(body);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Follow-up check-in completed for ${body.patientName}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

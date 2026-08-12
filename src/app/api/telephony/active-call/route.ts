process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextRequest, NextResponse } from "next/server";
import { OutboundCallRecord } from "@/lib/telephony";

export const dynamic = "force-dynamic";

// In-memory active ringing call state for multi-device sync
let activeRingingCall: (OutboundCallRecord & { triggeredAt: number }) | null = null;

export async function GET(req: NextRequest) {
  // Expire after 60 seconds
  if (activeRingingCall && Date.now() - activeRingingCall.triggeredAt > 60000) {
    activeRingingCall = null;
  }

  return NextResponse.json({
    hasActiveCall: !!activeRingingCall,
    call: activeRingingCall,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { call } = body;

    if (!call) {
      return NextResponse.json({ error: "Call object is required" }, { status: 400 });
    }

    activeRingingCall = {
      ...call,
      triggeredAt: Date.now(),
    };

    console.log(`[Multi-Device Telephony Sync] Active ringing call broadcasted for patient: ${call.patient_name}`);

    return NextResponse.json({
      success: true,
      call: activeRingingCall,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  activeRingingCall = null;
  return NextResponse.json({ success: true, message: "Active call cleared" });
}

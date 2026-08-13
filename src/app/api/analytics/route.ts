process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextRequest, NextResponse } from "next/server";
import { 
  getAnalyticsSummary, 
  getAllCallRecords, 
  recordCallSession, 
  resetAnalyticsData,
  CallOutcomeStatus,
  CallChannel,
  FailureReason
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const summary = getAnalyticsSummary();
    const calls = getAllCallRecords();

    return NextResponse.json({
      success: true,
      summary,
      calls,
      totalCount: calls.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Analytics API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch analytics" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      caller_id,
      caller_name,
      phone_number,
      channel,
      duration_seconds,
      latency_ms,
      outcome,
      failure_reason,
      clinical_action,
      triage_level,
      escalation_ticket_id,
      language,
    } = body;

    if (!clinical_action) {
      return NextResponse.json({ error: "clinical_action description is required" }, { status: 400 });
    }

    const record = recordCallSession({
      caller_id,
      caller_name,
      phone_number,
      channel: channel as CallChannel,
      duration_seconds,
      latency_ms,
      outcome: (outcome as CallOutcomeStatus) || "success",
      failure_reason: failure_reason as FailureReason,
      clinical_action,
      triage_level,
      escalation_ticket_id,
      language,
    });

    const updatedSummary = getAnalyticsSummary();

    return NextResponse.json({
      success: true,
      record,
      summary: updatedSummary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Analytics API POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to record call session" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    resetAnalyticsData();
    const summary = getAnalyticsSummary();
    return NextResponse.json({
      success: true,
      message: "Analytics database reset to default demo dataset",
      summary,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextRequest, NextResponse } from "next/server";
import { generateHealthcareResponse } from "@/lib/openai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, history, userId, callerName, isCallStart } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt string is required" }, { status: 400 });
    }

    const aiResult = await generateHealthcareResponse(
      prompt, 
      history || [], 
      userId, 
      callerName, 
      isCallStart
    );

    // Multi-Device Sync: If an outbound call was triggered, broadcast it
    if (typeof aiResult === "object" && aiResult.outboundCallData) {
      try {
        await fetch(`http://localhost:3000/api/telephony/active-call`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ call: aiResult.outboundCallData }),
        });
      } catch (e) {}
    }

    return NextResponse.json({
      response: typeof aiResult === "string" ? aiResult : aiResult.response,
      caller: typeof aiResult === "object" ? aiResult.caller : null,
      functionCalled: typeof aiResult === "object" ? aiResult.functionCalled : null,
      facilityData: typeof aiResult === "object" ? aiResult.facilityData : null,
      triageData: typeof aiResult === "object" ? aiResult.triageData : null,
      outboundCallData: typeof aiResult === "object" ? aiResult.outboundCallData : null,
      escalationData: typeof aiResult === "object" ? aiResult.escalationData : null,
      timestamp: new Date().toISOString(),
      agent: "SwasthyaSathi AI",
    });
  } catch (error: any) {
    console.error("Chat API Route error:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat response" }, { status: 500 });
  }
}

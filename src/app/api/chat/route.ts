process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextRequest, NextResponse } from "next/server";
import { generateHealthcareResponse } from "@/lib/openai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, history } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt string is required" }, { status: 400 });
    }

    const aiText = await generateHealthcareResponse(prompt, history || []);

    return NextResponse.json({
      response: aiText,
      timestamp: new Date().toISOString(),
      agent: "SwasthyaSathi AI",
    });
  } catch (error: any) {
    console.error("Chat API Route error:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat response" }, { status: 500 });
  }
}

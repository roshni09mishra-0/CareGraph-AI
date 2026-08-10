process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { NextRequest, NextResponse } from "next/server";
import { lookupNearestFacilityTool } from "@/lib/tools";
import { findFacilities } from "@/lib/facilityData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const district = searchParams.get("district") || undefined;
    const type = searchParams.get("type") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const language = (searchParams.get("lang") as "hi" | "en" | "hinglish") || "hi";
    const simulateError = searchParams.get("simulate_error") === "true";

    const result = await lookupNearestFacilityTool(district, type, userId, language, simulateError);

    return NextResponse.json({
      success: !result.isFallback,
      ...result,
      allFacilities: findFacilities(district, type),
    });
  } catch (error: any) {
    console.error("[Facility API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to lookup facility" }, { status: 500 });
  }
}

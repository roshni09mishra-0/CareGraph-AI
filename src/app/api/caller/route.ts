import { NextRequest, NextResponse } from "next/server";
import { getCaller, getCallerByName, saveCaller, deleteCaller, listCallers, CallerRecord } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/caller?user_id=... OR ?name=... OR ?action=list
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const name = searchParams.get("name");
    const action = searchParams.get("action");

    if (action === "list") {
      const allCallers = listCallers();
      return NextResponse.json({ callers: allCallers });
    }

    if (userId) {
      const caller = getCaller(userId);
      console.log(`[Caller API] Lookup by ID: ${userId} ->`, caller ? caller.name : "Not Found");
      return NextResponse.json({ caller });
    }

    if (name) {
      const caller = getCallerByName(name);
      console.log(`[Caller API] Lookup by Name: ${name} ->`, caller ? caller.name : "Not Found");
      return NextResponse.json({ caller });
    }

    return NextResponse.json({ callers: listCallers() });
  } catch (error: any) {
    console.error("[Caller API Error] GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to lookup caller" }, { status: 500 });
  }
}

// POST /api/caller - Save caller facts (requires consent_given: true)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, name, language_preference, facts, consent_given } = body;

    if (!user_id || !name) {
      return NextResponse.json({ error: "user_id and name are required" }, { status: 400 });
    }

    // Hard rule: Do not save if consent is not granted
    if (!consent_given) {
      console.warn(`[Consent Guardrail] Caller ${name} (${user_id}) denied consent. Data NOT stored.`);
      return NextResponse.json({ 
        saved: false, 
        message: "Consent was not granted. Data has not been saved per Health Access privacy rules." 
      }, { status: 200 });
    }

    const recordToSave: CallerRecord = {
      user_id,
      name,
      language_preference: language_preference || "en",
      facts: facts || {},
      consent_given: true,
      last_interaction: new Date().toISOString(),
    };

    const savedRecord = saveCaller(recordToSave);
    return NextResponse.json({ saved: true, caller: savedRecord });
  } catch (error: any) {
    console.error("[Caller API Error] POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to save caller" }, { status: 500 });
  }
}

// DELETE /api/caller?user_id=... - "Forget Me" tool
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const success = deleteCaller(userId);
    console.log(`[Caller API] Forget Me: ${userId} ->`, success ? "Deleted" : "Not Found");
    return NextResponse.json({ success, deleted_id: userId });
  } catch (error: any) {
    console.error("[Caller API Error] DELETE error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete caller" }, { status: 500 });
  }
}

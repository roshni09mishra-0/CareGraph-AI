import { NextResponse } from "next/server";
import { getCareGraphEngine } from "@/lib/falkordb/engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, params } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Missing 'query' in request body." },
        { status: 400 }
      );
    }

    const engine = getCareGraphEngine();
    const result = engine.executeCypher(query, params || {});

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

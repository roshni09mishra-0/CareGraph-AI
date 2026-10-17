import { NextResponse } from "next/server";
import { getCareGraphEngine } from "@/lib/falkordb/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const engine = getCareGraphEngine();
    const graphData = engine.getGraphData();
    return NextResponse.json({
      success: true,
      data: graphData,
      stats: {
        nodeCount: graphData.nodes.length,
        edgeCount: graphData.edges.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Graph GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const engine = getCareGraphEngine();

    if (body.action === "reset") {
      engine.seedDefaultGraph();
      const graphData = engine.getGraphData();
      return NextResponse.json({
        success: true,
        message: "FalkorDB Graph reset to initial state.",
        data: graphData,
      });
    }

    return NextResponse.json({ success: true, message: "OK" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

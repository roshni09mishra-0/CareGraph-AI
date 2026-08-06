import { NextRequest, NextResponse } from "next/server";
import { createLiveKitToken } from "@/lib/livekit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const room = req.nextUrl.searchParams.get("room") || "swasthya-sathi-room";
    const username = req.nextUrl.searchParams.get("username") || `user-${Math.random().toString(36).substring(7)}`;

    const token = await createLiveKitToken(room, username);
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://swasthya-sathi-demo.livekit.cloud";

    return NextResponse.json({
      token,
      wsUrl: livekitUrl,
      room,
      username,
    });
  } catch (error: any) {
    console.error("LiveKit token generation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate LiveKit token" },
      { status: 500 }
    );
  }
}

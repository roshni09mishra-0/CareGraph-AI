import { AccessToken } from "livekit-server-sdk";

export async function createLiveKitToken(roomName: string, participantName: string) {
  const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "secretsecretsecretsecretsecretsecret";

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    ttl: "1h",
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return await at.toJwt();
}

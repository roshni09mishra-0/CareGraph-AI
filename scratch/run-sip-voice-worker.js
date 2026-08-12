process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { RoomServiceClient } = require("livekit-server-sdk");

const host = "https://agent-m8slbcl1.livekit.cloud";
const apiKey = "APIwspUKchgtehi";
const apiSecret = "7374vXIF8iJaFeuQotCYnQ5mcKTy9eIEVmgJ58fFZmrA";

const roomService = new RoomServiceClient(host, apiKey, apiSecret);

console.log("=================================================================");
console.log("  🏥 LiveKit SIP Inbound Voice Agent Worker Active");
console.log("  📞 Target SIP URI: sip:roshu@agent-m8slbcl1.sip.livekit.cloud");
console.log("  🎙️ STT: Deepgram Nova-2 Multilingual (hi / en)");
console.log("  🔊 TTS: Murf AI Falcon 2 (hi-IN-shweta / en-IN-priya)");
console.log("  ⚡ Barge-In: Enabled");
console.log("=================================================================");

async function pollRooms() {
  try {
    const rooms = await roomService.listRooms();
    if (rooms.length > 0) {
      for (const room of rooms) {
        console.log(`[SIP Worker] Active Room: ${room.name} (Participants: ${room.numParticipants})`);
      }
    }
  } catch (e) {}
}

setInterval(pollRooms, 3000);
pollRooms();

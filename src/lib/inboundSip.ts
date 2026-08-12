/**
 * LiveKit SIP Inbound Telephony Gateway (#VoiceForBharat Day 6 & 7 Extension)
 * Enables physical phones and Linphone clients to dial IN to SwasthyaSathi AI.
 * 
 * Inbound Trunk ID: ST_hSgiJtNx2uPT
 * Inbound Dispatch Rule ID: SDR_oajrEv4x47ut
 * LiveKit Cloud SIP Domain: agent-m8slbcl1.sip.livekit.cloud
 */

export interface InboundSipConfig {
  inboundTrunkId: string;
  dispatchRuleId: string;
  inboundSipUri: string;
  sipDomain: string;
  allowedNumbers: string[];
}

export const DEFAULT_INBOUND_SIP_CONFIG: InboundSipConfig = {
  inboundTrunkId: process.env.LIVEKIT_SIP_INBOUND_TRUNK_ID || "ST_hSgiJtNx2uPT",
  dispatchRuleId: process.env.LIVEKIT_SIP_DISPATCH_RULE_ID || "SDR_oajrEv4x47ut",
  inboundSipUri: "sip:roshu@agent-m8slbcl1.sip.livekit.cloud",
  sipDomain: "agent-m8slbcl1.sip.livekit.cloud",
  allowedNumbers: ["roshu", "+917991912530"],
};

/**
 * Get Inbound SIP Dialing Details for Linphone & Mobile VoIP Apps
 */
export function getInboundSipDetails() {
  return {
    inboundTrunkId: process.env.LIVEKIT_SIP_INBOUND_TRUNK_ID || "ST_hSgiJtNx2uPT",
    dispatchRuleId: process.env.LIVEKIT_SIP_DISPATCH_RULE_ID || "SDR_oajrEv4x47ut",
    dialUri: "sip:roshu@agent-m8slbcl1.sip.livekit.cloud",
    linphoneDialUrl: "linphone-call:sip:roshu@agent-m8slbcl1.sip.livekit.cloud",
    webDialUrl: "/call",
    protocol: "SIP/2.0 (TLS & UDP)",
    roomPrefix: "inbound-call-",
    status: "active_and_listening",
  };
}

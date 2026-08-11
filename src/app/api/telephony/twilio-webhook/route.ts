import { NextRequest, NextResponse } from "next/server";
import { generateHealthcareResponse } from "@/lib/openai";
import { getCaller, saveCaller } from "@/lib/db";

/**
 * Twilio Interactive Voice Response (IVR) Webhook for Real Physical Phone Calls
 * Endpoint: POST /api/telephony/twilio-webhook
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const speechResult = formData.get("SpeechResult") as string | null;
    const fromNumber = (formData.get("From") as string) || "+91 7991912530";
    const toNumber = (formData.get("To") as string) || "+91 7991912530";
    const callSid = (formData.get("CallSid") as string) || "";

    console.log(`[Twilio Webhook] Received call ${callSid} | User Spoke: "${speechResult || "Call Connected"}"`);

    // App URL for webhooks
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 1. Initial Call Connection: Play Day 6 Opening Protocol
    if (!speechResult) {
      const openingText = "नमस्ते रमेश जी! मैं स्वास्थ्य साथी एआई से बोल रहा हूँ। यह आपके तेज बुखार और पीएचसी परामर्श के बाद आपकी तबियत जानने के लिए एक जरूरी फॉलो-अप कॉल है। यदि आप बात नहीं करना चाहते तो 'कॉल बंद करो' कहें। क्या अब आपका बुखार कम हुआ है?";

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">${openingText}</Say>
  <Gather input="speech" language="hi-IN" speechTimeout="auto" action="${appUrl}/api/telephony/twilio-webhook" method="POST">
    <Pause length="1"/>
  </Gather>
  <Say voice="Polly.Aditi" language="hi-IN">मुझे आपकी आवाज़ नहीं सुनाई दी। कृपया दोबारा बोलें।</Say>
  <Redirect method="POST">${appUrl}/api/telephony/twilio-webhook</Redirect>
</Response>`;

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    // 2. Patient Responded on Real Phone: Check for Opt-Out
    const lowerSpeech = speechResult.toLowerCase();
    if (lowerSpeech.includes("band") || lowerSpeech.includes("mat") || lowerSpeech.includes("stop") || lowerSpeech.includes("बंद") || lowerSpeech.includes("रोको")) {
      const optOutText = "जी रमेश जी, आपकी इच्छा का सम्मान करते हुए आपको हमारी कॉलिंग लिस्ट से हटा दिया गया है। आगे से आपको कोई कॉल नहीं आएगी। धन्यवाद और अपना ख्याल रखें।";
      
      const caller = getCaller("user_ramesh");
      if (caller) {
        caller.facts.do_not_call = true;
        saveCaller(caller);
      }

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">${optOutText}</Say>
  <Hangup/>
</Response>`;

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    // 3. Process Speech with SwasthyaSathi AI Brain & Medical Guardrails
    const aiResult = await generateHealthcareResponse(
      speechResult,
      [],
      "user_ramesh",
      "रमेश कुमार"
    );

    const aiReply = aiResult.response || "नमस्ते! कृपया पर्याप्त पानी पिएं और आराम करें।";
    console.log(`[Twilio Webhook AI Reply] -> "${aiReply}"`);

    // 4. Return TwiML with AI Speech and Keep Continuous Conversation Open
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">${aiReply}</Say>
  <Gather input="speech" language="hi-IN" speechTimeout="auto" action="${appUrl}/api/telephony/twilio-webhook" method="POST">
    <Pause length="1"/>
  </Gather>
  <Say voice="Polly.Aditi" language="hi-IN">यदि आप कुछ और पूछना चाहते हैं तो बोलें, अन्यथा फोन काट सकते हैं।</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });

  } catch (error: any) {
    console.error("[Twilio Webhook Error]", error);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">माफ कीजिए, तकनीकी समस्या के कारण कॉल समाप्त हो रही है। कृपया थोड़ी देर बाद पुनः प्रयास करें।</Say>
  <Hangup/>
</Response>`;
    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }
}

import OpenAI from "openai";

if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Server-side OpenAI client wrapper
const openaiApiKey = process.env.OPENAI_API_KEY;

export const openai = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;

export const SWASTHYASATHI_SYSTEM_PROMPT = `
You are SwasthyaSathi AI, an empathetic, highly knowledgeable, and friendly Indian AI Voice Healthcare Assistant.

Key Guidelines:
1. Speak in warm, clear, and reassuring natural Indian English style.
2. Provide concise, easily digestible health advice, symptom checks, wellness tips, diet recommendations, and medical guidance tailored for patients in India and worldwide.
3. Use simple medical language. Avoid dense jargon.
4. Format your responses so they sound natural when spoken aloud via Text-to-Speech (keep responses under 3-4 clear sentences when answering voice queries unless detailed steps are needed).
5. Always include a brief, reassuring safety disclaimer for serious or emergency symptoms: "Please consult a registered medical doctor or visit nearest clinic for clinical emergencies."
6. If the user mentions emergency signs (e.g., severe chest pain, shortness of breath, sudden weakness, heavy bleeding), immediately recommend emergency hospital assistance or calling emergency services (108 / 112 in India).
`;

export async function generateHealthcareResponse(userPrompt: string, conversationHistory: { role: "user" | "assistant"; content: string }[] = []) {
  if (!process.env.OPENAI_API_KEY) {
    // Return intelligent simulated response if API key is not configured yet
    return getSimulatedHealthcareResponse(userPrompt);
  }

  try {
    const messages = [
      { role: "system" as const, content: SWASTHYASATHI_SYSTEM_PROMPT },
      ...conversationHistory.slice(-6).map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content })),
      { role: "user" as const, content: userPrompt }
    ];

    const response = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.6,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || "Namaste! I am SwasthyaSathi AI. How can I assist you with your health query today?";
  } catch (error) {
    console.error("OpenAI API error:", error);
    return getSimulatedHealthcareResponse(userPrompt);
  }
}

function getSimulatedHealthcareResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("fever") || q.includes("temperature") || q.includes("flu")) {
    return "Namaste! For a mild fever, stay well hydrated with warm water or ORS, take plenty of rest, and monitor your temperature. If fever exceeds 101°F or lasts more than 3 days, please consult a physician. Remember, SwasthyaSathi AI is here for guidance!";
  }
  if (q.includes("cough") || q.includes("throat") || q.includes("cold")) {
    return "For a sore throat and cough, warm steam inhalation, honey with ginger tea, and salt water gargles twice daily can provide gentle relief. Stay hydrated and avoid chilly drinks. Please visit a doctor if breathing becomes difficult.";
  }
  if (q.includes("diabetes") || q.includes("sugar") || q.includes("diet")) {
    return "A balanced Indian diabetic diet should prioritize whole grains like oats or millets, fibrous vegetables, lentils, and fresh bitter gourd or jamun seeds. Limit refined carbs and sugary snacks, and maintain 30 minutes of regular daily walk.";
  }
  if (q.includes("headache") || q.includes("stress") || q.includes("head")) {
    return "Headaches can often stem from dehydration, eye fatigue, or stress. Drink 2 glasses of water, rest in a dim quiet room, and practice deep breathing. If severe or accompanied by vision loss, seek immediate medical attention.";
  }
  if (q.includes("dengue") || q.includes("mosquito")) {
    return "Dengue fever usually manifests with sudden high fever, severe joint pain, rash, and fatigue. Ensure abundant fluids, coconut water, and papaya leaf extracts if advised by doctor. Regularly monitor blood platelet counts with a clinical lab test.";
  }
  
  return `Namaste! Thank you for asking SwasthyaSathi AI regarding "${query}". I recommend maintaining good hydration, eating balanced nutritious meals, and getting adequate rest. Please consult a certified doctor for specific clinical diagnostics.`;
}

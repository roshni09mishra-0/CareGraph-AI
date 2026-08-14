/**
 * Multi-Specialist Agent Architecture & Voice Switching Engine
 * Track: Health Access 🩺 (#VoiceForBharat)
 */

import fs from "fs";
import path from "path";
import { maskPhoneNumber } from "./telephony";
import { 
  SpecialistDomain, 
  SpecialistProfile, 
  SPECIALIST_REGISTRY, 
  AppointmentRecord 
} from "./specialistTypes";

export * from "./specialistTypes";

const DATA_DIR = path.join(process.cwd(), "data");
const APPOINTMENTS_FILE = path.join(DATA_DIR, "appointments_db.json");

export function getAllAppointments(): AppointmentRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(APPOINTMENTS_FILE)) {
      const initial: AppointmentRecord[] = [
        {
          appointment_id: "OPD-2026-8001",
          token_number: 8,
          patient_id: "user_ramesh",
          patient_name: "रमेश कुमार",
          masked_phone: "+91 79919 •••••",
          facility_id: "fac_up_vns_01",
          facility_name: "Shivpur Primary Health Centre (PHC)",
          facility_address: "Near Shivpur Railway Station, Airport Road, Varanasi",
          doctor_name: "डॉ. राजेश गुप्ता (MD - जनरल मेडिसिन)",
          department: "General OPD & Fever Clinic",
          appointment_date: "14 August 2026",
          time_slot: "10:00 AM - 11:30 AM",
          reason_for_visit: "Post-Triage Fever & Blood Count Review",
          ayushman_covered: true,
          status: "confirmed",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        }
      ];
      fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(APPOINTMENTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("[Specialist Engine] Read error:", error);
    return [];
  }
}

export function saveAppointments(records: AppointmentRecord[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(records, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("[Specialist Engine] Save error:", error);
    return false;
  }
}

export function bookAppointmentSlot(params: {
  patient_id?: string;
  patient_name?: string;
  phone_number?: string;
  facility_name?: string;
  appointment_date?: string;
  time_slot?: string;
  reason_for_visit?: string;
}): { success: boolean; appointment: AppointmentRecord; spokenConfirmation: string } {
  const records = getAllAppointments();

  const appointmentId = `OPD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const tokenNumber = records.length + 12;
  const patientName = params.patient_name || "रमेश कुमार";
  const phone = params.phone_number || "+91 7991912530";
  const facilityName = params.facility_name || "Shivpur Primary Health Centre (PHC)";
  const date = params.appointment_date || "कल सुबह (Tomorrow 10:00 AM)";
  const slot = params.time_slot || "10:00 AM - 11:30 AM";
  const reason = params.reason_for_visit || "डॉक्टर परामर्श एवं स्वास्थ्य परीक्षण";

  const newAppointment: AppointmentRecord = {
    appointment_id: appointmentId,
    token_number: tokenNumber,
    patient_id: params.patient_id || "user_ramesh",
    patient_name: patientName,
    masked_phone: maskPhoneNumber(phone),
    facility_id: "fac_up_vns_01",
    facility_name: facilityName,
    facility_address: "एयरपोर्ट रोड, शिवपुर रेलवे स्टेशन के पास, वाराणसी",
    doctor_name: "डॉ. राजेश गुप्ता (MD - जनरल मेडिसिन)",
    department: "सामान्य ओपीडी (General OPD & Fever Clinic)",
    appointment_date: date,
    time_slot: slot,
    reason_for_visit: reason,
    ayushman_covered: true,
    status: "confirmed",
    created_at: new Date().toISOString(),
  };

  records.unshift(newAppointment);
  saveAppointments(records);

  const spoken = `नमस्ते ${patientName} जी! मैंने शिवपुर प्राथमिक स्वास्थ्य केंद्र में डॉ. राजेश गुप्ता के साथ आपका अपॉइंटमेंट बुक कर दिया है। आपका टोकन नंबर #${tokenNumber} (${appointmentId}) है। स्लॉट कल सुबह 10:00 बजे का है। अस्पताल में आपको आयुष्मान भारत योजना के तहत निःशुल्क परामर्श मिलेगा।`;

  console.log(`[Specialist Engine] 🏥 Booked OPD appointment: ${appointmentId} (Token #${tokenNumber}) for ${patientName}`);

  return {
    success: true,
    appointment: newAppointment,
    spokenConfirmation: spoken,
  };
}

/**
 * 1. Automatic Specialist Detection
 * Detects if a user query belongs to one of the specialized clinical domains
 */
export function detectRequiredSpecialist(query: string): SpecialistDomain | null {
  const q = query.toLowerCase().trim();

  // 1. CARDIOLOGIST (Heart, Chest Pain, Palpitation, BP crisis)
  if (
    /\b(chest pain|heart pain|heart attack|palpitation|left arm pain|cardio|cardiologist|blood pressure|high bp|hypertension|heart rate|dil me dard|sine me dard|chhati me dard|dhadkan)\b/i.test(q) ||
    q.includes("सीने में दर्द") || q.includes("छाती में दर्द") || q.includes("हार्ट") || q.includes("दिल की धड़कन") || q.includes("कार्डियो")
  ) {
    return "cardiologist";
  }

  // 2. DERMATOLOGIST (Skin, Rashes, Itching, Acne, Fungal, Eczema)
  if (
    /\b(skin problem|skin rash|rashes|itching|eczema|acne|pimples|fungal infection|ringworm|hives|dermatologist|skin allergy|khujli|twacha|daane|chakatte)\b/i.test(q) ||
    q.includes("त्वचा") || q.includes("खुजली") || q.includes("चकत्ते") || q.includes("दाने") || q.includes("चर्म रोग") || q.includes("डर्मेटोलॉजिस्ट")
  ) {
    return "dermatologist";
  }

  // 3. MENTAL HEALTH (Stress, Anxiety, Depression, Panic, Insomnia, Sadness)
  if (
    /\b(mental health|stress|anxiety|depression|panic attack|insomnia|cannot sleep|sadness|mental wellness|psychologist|psychiatrist|tanav|chinta|ghabrahat|neend nahi)\b/i.test(q) ||
    q.includes("तनाव") || q.includes("चिंता") || q.includes("घबराहट") || q.includes("डिप्रेशन") || q.includes("नींद नहीं") || q.includes("मानसिक")
  ) {
    return "mental_health";
  }

  // 4. GASTROENTEROLOGIST (Stomach, Digestion, Acidity, Gas, Vomiting, GERD)
  if (
    /\b(stomach pain|digestion|acidity|acid reflux|gas problem|bloating|vomiting|loose motion|diarrhea|gastroenterologist|pet me dard|jalan|badhazmi|ulti|dast)\b/i.test(q) ||
    q.includes("पेट में दर्द") || q.includes("पेट दर्द") || q.includes("एसिडिटी") || q.includes("बदहजमी") || q.includes("गैस") || q.includes("उल्टी") || q.includes("दस्त")
  ) {
    return "gastroenterologist";
  }

  // 5. PEDIATRICIAN (Child Health, Infant, Baby, Toddler, Vaccination)
  if (
    /\b(child health|baby fever|infant|toddler|pediatrician|child cough|baby health|vaccination|bacche ko|chhota baccha|shishu)\b/i.test(q) ||
    q.includes("बच्चे") || q.includes("शिशु") || q.includes("बाल रोग") || q.includes("टीकाकरण")
  ) {
    return "pediatrician";
  }

  // 6. GYNECOLOGIST (Women's Health, Periods, Pregnancy, Cramps, PCOS)
  if (
    /\b(women health|period pain|menstrual cramps|pregnancy|pregnant|irregular periods|pcos|pcod|gynecologist|mahila|periods)\b/i.test(q) ||
    q.includes("पीरियड्स") || q.includes("गर्भावस्था") || q.includes("मासिक धर्म") || q.includes("महिला स्वास्थ्य")
  ) {
    return "gynecologist";
  }

  // 7. CLINIC & APPOINTMENT SPECIALIST (PHC OPD Booking, Slot, Token, Generic Specialist Request)
  if (
    /\b(appointment|book appointment|opd slot|doctor time|doctor slot|clinic specialist|ayushman card|token number|doctor se milna|slot book|book slot|phc appointment|appointment book)\b/i.test(q) ||
    (
      (q.includes("appointment") || q.includes("अपॉइंटमेंट") || q.includes("स्लॉट") || q.includes("टोकन") || q.includes("ओपीडी") || q.includes("दिखाना")) &&
      (q.includes("book") || q.includes("बुक") || q.includes("कराओ") || q.includes("चाहिए") || q.includes("टाइम") || q.includes("कल") || q.includes("सुबह"))
    ) ||
    (
      (q.includes("specialist") || q.includes("स्पेशलिस्ट") || q.includes("विशेषज्ञ")) &&
      (q.includes("connect") || q.includes("कनेक्ट") || q.includes("बात") || q.includes("मिलना") || q.includes("दिखाना") || q.includes("चाहिए"))
    )
  ) {
    return "clinic_appointment";
  }

  return null;
}

/**
 * 2. Generate Smooth Voice Handoff Response
 * Primary assistant announces handoff -> Specialist introduces itself and addresses symptoms
 */
export function generateSpecialistHandoffResponse(params: {
  specialistKey: SpecialistDomain;
  userPrompt: string;
  patientName: string;
  language?: "hi" | "en" | "hinglish";
}): {
  response: string;
  targetVoice: string;
  specialistProfile: SpecialistProfile;
  appointmentData?: AppointmentRecord;
} {
  const spec = SPECIALIST_REGISTRY[params.specialistKey];
  const lang = params.language || "hi";
  const isHindi = lang === "hi" || lang === "hinglish";
  const pName = params.patientName || (isHindi ? "रमेश कुमार" : "Ramesh Kumar");

  let handoffSpeech = "";
  let appointmentData: AppointmentRecord | undefined = undefined;

  if (params.specialistKey === "cardiologist") {
    handoffSpeech = isHindi
      ? `ज़रूर, मैं आपको हमारे हृदय रोग विशेषज्ञ (Cardiologist) डॉ. आर्यन से कनेक्ट कर रही हूँ... नमस्ते ${pName} जी! मैं आपका एआई हृदय रोग विशेषज्ञ डॉ. आर्यन हूँ। मुझे जानकारी मिली है कि आपको सीने में परेशानी हो रही है। कृपया बताएं कि क्या यह दर्द बायीं तरफ है, और क्या आपको सांस फूलने या पसीना आने जैसा महसूस हो रहा है?`
      : `Sure, I am connecting you to our Cardiology specialist Dr. Aryan now... Hello ${pName}, I am Dr. Aryan, your AI cardiology specialist. I understand you are experiencing chest pain. Can you tell me where exactly the pain is and if it radiates to your arm or jaw?`;
  } else if (params.specialistKey === "dermatologist") {
    handoffSpeech = isHindi
      ? `ज़रूर, मैं आपको हमारे त्वचा एवं चर्म रोग विशेषज्ञ (Dermatologist) डॉ. रोहन से कनेक्ट कर रही हूँ... नमस्ते ${pName} जी! मैं आपका एआई त्वचा रोग विशेषज्ञ डॉ. रोहन हूँ। मुझे पता चला है कि आपकी त्वचा पर चकत्ते या खुजली हो रही है। क्या यह समस्या धूप से बढ़ी है या किसी नई क्रीम अथवा साबुन के इस्तेमाल के बाद शुरू हुई है?`
      : `Sure, I am connecting you to our Dermatology specialist Dr. Rohan now... Hello ${pName}, I am Dr. Rohan, your AI dermatology specialist. I understand you are experiencing skin rashes and itching. Did this flare up recently, and is there any burning sensation or swelling?`;
  } else if (params.specialistKey === "mental_health") {
    handoffSpeech = isHindi
      ? `ज़रूर, मैं आपको हमारे मानसिक स्वास्थ्य एवं तनाव विशेषज्ञ (Mental Health Specialist) डॉ. कबीर से कनेक्ट कर रही हूँ... नमस्ते ${pName} जी, मैं डॉ. कबीर हूँ। मैं पूरी तरह आपकी बात सुनने के लिए उपस्थित हूँ। आपने बताया कि आप तनाव और घबराहट महसूस कर रहे हैं। आप बिल्कुल सुरक्षित हैं, गहरी सांस लें और बताएं कि क्या किसी विशेष बात को लेकर चिंता हो रही है?`
      : `Sure, I am connecting you with our Mental Health specialist Dr. Kabir now... Hello ${pName}, I am Dr. Kabir, your mental health specialist. I understand you have been experiencing high stress and anxiety. Take a slow, deep breath. Please tell me what has been overwhelming you recently.`;
  } else if (params.specialistKey === "gastroenterologist") {
    handoffSpeech = isHindi
      ? `ज़रूर, मैं आपको हमारे पेट एवं पाचन रोग विशेषज्ञ (Gastroenterologist) डॉ. अमित से कनेक्ट कर रही हूँ... नमस्ते ${pName} जी! मैं आपका एआई पेट एवं पाचन रोग विशेषज्ञ डॉ. अमित हूँ। मुझे पता चला है कि आपको पेट में जलन और बदहजमी है। क्या यह दर्द खाली पेट ज्यादा होता है या खाना खाने के बाद?`
      : `Sure, I am connecting you to our Gastroenterologist Dr. Amit now... Hello ${pName}, I am Dr. Amit, your AI gastroenterology specialist. I see you are dealing with stomach pain and acidity. Does the burning increase on an empty stomach or right after meals?`;
  } else if (params.specialistKey === "pediatrician") {
    handoffSpeech = isHindi
      ? `ज़रूर, मैं आपको हमारे बाल रोग विशेषज्ञ (Pediatrician) डॉ. विक्रम से कनेक्ट कर रही हूँ... नमस्ते ${pName} जी! मैं बाल रोग विशेषज्ञ डॉ. विक्रम हूँ। मुझे पता चला है कि आपके बच्चे को बुखार और खांसी है। कृपया बताएं कि बच्चे का तापमान कितना है और क्या वह सामान्य रूप से दूध व पानी पी रहा है?`
      : `Sure, I am connecting you to our Pediatric specialist Dr. Vikram now... Hello ${pName}, I am Dr. Vikram, your AI pediatrician. I understand your child is having a fever and cough. How high is the temperature and is the child staying well hydrated?`;
  } else if (params.specialistKey === "gynecologist") {
    handoffSpeech = isHindi
      ? `ज़रूर, मैं आपको हमारे महिला स्वास्थ्य विशेषज्ञ (Gynecologist) डॉ. सुनीता से कनेक्ट कर रही हूँ... नमस्ते ${pName} जी! मैं महिला स्वास्थ्य विशेषज्ञ डॉ. सुनीता हूँ। मुझे आपकी समस्या की जानकारी मिली है। कृपया बताएं कि क्या यह दर्द आपको हर माह होता है और क्या आपको अत्यधिक कमजोरी या चक्कर भी आ रहे हैं?`
      : `Sure, I am connecting you with our Gynecology specialist Dr. Sunita now... Hello ${pName}, I am Dr. Sunita, your women's health specialist. I understand you are experiencing severe menstrual cramps and fatigue. How long have you had this discomfort during your cycle?`;
  } else if (params.specialistKey === "clinic_appointment") {
    const booking = bookAppointmentSlot({
      patient_name: pName,
      reason_for_visit: "विशेषज्ञ डॉक्टर परामर्श एवं ओपीडी स्लॉट",
    });
    appointmentData = booking.appointment;

    handoffSpeech = isHindi
      ? `ज़रूर, मैं आपको हमारे प्राथमिक स्वास्थ्य केंद्र एवं अपॉइंटमेंट विशेषज्ञ (Arogya Mitra) से कनेक्ट कर रही हूँ... नमस्ते ${pName} जी! मैं क्लिनिक और अपॉइंटमेंट विशेषज्ञ हूँ। मैंने शिवपुर PHC में डॉ. राजेश गुप्ता के साथ आपका अपॉइंटमेंट बुक कर दिया है। आपका टोकन नंबर #${appointmentData.token_number} (${appointmentData.appointment_id}) है। स्लॉट कल सुबह 10:00 बजे का है।`
      : `Sure, I am connecting you to our PHC Clinic & Appointment Specialist now... Hello ${pName}! I am your PHC Appointment Coordinator. I have booked your appointment at Shivpur PHC. Your token number is #${appointmentData.token_number} (${appointmentData.appointment_id}) for tomorrow at 10:00 AM.`;
  } else {
    handoffSpeech = isHindi
      ? `नमस्ते ${pName} जी! मैं आपका मुख्य स्वास्थ्य साथी हूँ। कृपया अपनी स्वास्थ्य समस्या विस्तार से बताएं।`
      : `Hello ${pName}! I am your primary health assistant. How can I help you with your health today?`;
  }

  const targetVoice = isHindi ? spec.voiceIdHindi : spec.voiceIdEnglish;

  return {
    response: handoffSpeech,
    targetVoice,
    specialistProfile: spec,
    appointmentData,
  };
}

/**
 * 3. Handle Continuation Turns with the Active Specialist
 */
export function processSpecialistTurn(params: {
  specialistKey: SpecialistDomain;
  userPrompt: string;
  patientName: string;
  language?: "hi" | "en" | "hinglish";
}): {
  response: string;
  targetVoice: string;
  specialistProfile: SpecialistProfile;
} {
  const spec = SPECIALIST_REGISTRY[params.specialistKey];
  const lang = params.language || "hi";
  const isHindi = lang === "hi" || lang === "hinglish";
  const q = params.userPrompt.toLowerCase().trim();

  let advice = "";

  if (params.specialistKey === "cardiologist") {
    const isRedFlag = /\b(left side|baye|bayein|left arm|jaw|sweat|chakkar|dizziness|faint|sans fool|breath)\b/i.test(q) ||
      q.includes("बायीं") || q.includes("बाएं") || q.includes("पसीना") || q.includes("चक्कर") || q.includes("सांस");

    if (isRedFlag) {
      advice = isHindi
        ? `यह लक्षण महत्वपूर्ण हो सकते हैं। कृपया तुरंत किसी भी प्रकार का शारीरिक श्रम बंद करके आराम से बैठ जाएं। यदि दर्द बढ़ता है या सांस लेने में भारी तकलीफ होती है, तो बिना देरी किए 108 एम्बुलेंस बुलाएं या नजदीकी आपातकालीन अस्पताल जाएं।`
        : `These symptoms require urgent attention. Please stop any physical exertion and sit in a comfortable upright position. If pain worsens or shortness of breath intensifies, call 108 emergency immediately.`;
    } else {
      advice = isHindi
        ? `हृदय के स्वास्थ्य के लिए शांत कमरे में विश्राम करें, भारी भोजन व कैफीन से बचें और अपना रक्तचाप जांचें। यदि दर्द लगातार 15 मिनट से अधिक बना रहता है तो नजदीकी स्वास्थ्य केंद्र पर ईसीजी कराएं।`
        : `Please rest calmly, avoid heavy meals or caffeine, and check your blood pressure. If the chest discomfort persists beyond 15 minutes, please get an ECG done at your nearest clinic.`;
    }
  } else if (params.specialistKey === "dermatologist") {
    advice = isHindi
      ? `त्वचा की जलन और खुजली को शांत करने के लिए उस स्थान पर ठंडा पानी या बर्फ की सिंकाई करें। किसी भी तेज साबुन, इत्र या केमिकल क्रीम से बचें। ढीले सूती कपड़े पहनें और त्वचा को ज्यादा न खुजलाएं।`
      : `To soothe skin itching, apply a clean cool compress. Avoid perfumed soaps or harsh creams, wear loose breathable cotton clothing, and avoid scratching the area.`;
  } else if (params.specialistKey === "mental_health") {
    advice = isHindi
      ? `आप बिल्कुल सुरक्षित महसूस करें। 4 सेकंड तक नाक से गहरी सांस लें, 4 सेकंड रोकें और धीरे-धीरे मुंह से छोड़ें। थोड़ी देर खुली हवा में टहलें, गुनगुना पानी पिएं और आज रात स्क्रीन से दूर रहकर समय पर सोने का प्रयास करें।`
      : `You are safe. Practice box breathing: inhale slowly for 4 seconds, hold for 4 seconds, and gently exhale for 4 seconds. Step outside for fresh air, sip warm water, and unplug from screens tonight.`;
  } else if (params.specialistKey === "gastroenterologist") {
    advice = isHindi
      ? `एसिडिटी और पेट दर्द के लिए एक गिलास गुनगुना पानी या ठंडा छाछ पिएं। अगले कुछ घंटे तला-भुना, खट्टा या अधिक मिर्च-मसालेदार खाना पूरी तरह बंद रखें। खाना खाने के तुरंत बाद लेटने से बचें।`
      : `For stomach acidity and burning, sip a glass of warm water or cold buttermilk. Avoid oily, spicy, or fried foods for the next few hours, and avoid lying down flat immediately after eating.`;
  } else if (params.specialistKey === "pediatrician") {
    advice = isHindi
      ? `बच्चे को आरामदायक हल्के सूती कपड़े पहनाएं और कमरे को हवादार रखें। माथे व हथेलियों पर सामान्य पानी की गीली पट्टी रखें। बच्चे को ओआरएस का घोल या पानी थोड़ी-थोड़ी देर में पिलाते रहें ताकि डिहाइड्रेशन न हो।`
      : `Keep the child in light, comfortable cotton clothing in a well-ventilated room. Apply room-temperature sponge cloths to the forehead, and offer small frequent sips of ORS or water to maintain hydration.`;
  } else if (params.specialistKey === "gynecologist") {
    advice = isHindi
      ? `पीरियड्स के दर्द को कम करने के लिए पेट के निचले हिस्से पर गर्म पानी की थैली (Hot Water Bag) से सिकाई करें। गुनगुना अदरक का पानी पिएं, पर्याप्त आराम करें और हल्का सुपाच्य भोजन लें।`
      : `To relieve menstrual cramps, use a warm water heating bag on the lower abdomen. Sip warm ginger water, get adequate rest, and stay well hydrated with warm fluids.`;
  } else {
    advice = isHindi
      ? `कृपया भरपूर पानी पिएं, पौष्टिक भोजन लें और पर्याप्त आराम करें। यदि लक्षण बढ़ते हैं तो डॉक्टर से परामर्श लें।`
      : `Please stay well hydrated, rest adequately, and monitor your symptoms. Consult a physician if discomfort increases.`;
  }

  const targetVoice = isHindi ? spec.voiceIdHindi : spec.voiceIdEnglish;

  return {
    response: advice,
    targetVoice,
    specialistProfile: spec,
  };
}

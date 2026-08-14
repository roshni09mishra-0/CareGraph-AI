/**
 * Client-safe Multi-Specialist Types & Registry
 * Track: Health Access (#VoiceForBharat)
 */

export type SpecialistDomain =
  | "cardiologist"
  | "dermatologist"
  | "mental_health"
  | "gastroenterologist"
  | "pediatrician"
  | "gynecologist"
  | "clinic_appointment"
  | "general_physician";

export interface AudioSegment {
  text: string;
  voiceId: string;
  speaker: string;
}

export interface SpecialistProfile {
  id: SpecialistDomain;
  nameEn: string;
  nameHi: string;
  roleEn: string;
  roleHi: string;
  departmentEn: string;
  departmentHi: string;
  gender: "male" | "female";
  voiceIdHindi: string;
  voiceIdEnglish: string;
  voiceName: string;
  icon: string;
  themeColor: string;
  sampleQuestions: string[];
}

export const SPECIALIST_REGISTRY: Record<SpecialistDomain, SpecialistProfile> = {
  cardiologist: {
    id: "cardiologist",
    nameEn: "Dr. Aryan (AI Cardiologist)",
    nameHi: "डॉ. आर्यन (हृदय रोग विशेषज्ञ)",
    roleEn: "Cardiology & Cardiovascular Care Specialist",
    roleHi: "हृदय रोग एवं रक्तचाप विशेषज्ञ",
    departmentEn: "Department of Cardiology & Emergency Heart Care",
    departmentHi: "कार्डियोलॉजी एवं हृदय रोग विभाग",
    gender: "male",
    voiceIdHindi: "hi-IN-kabir",
    voiceIdEnglish: "en-IN-aarav",
    voiceName: "Kabir (Male Doctor)",
    icon: "HeartPulse",
    themeColor: "rose",
    sampleQuestions: [
      "I have severe chest pain radiating to my left arm",
      "मुझे सुबह से सीने में दर्द और दिल की धड़कन तेज लग रही है",
    ],
  },
  dermatologist: {
    id: "dermatologist",
    nameEn: "Dr. Rohan (AI Dermatologist)",
    nameHi: "डॉ. रोहन (त्वचा एवं चर्म रोग विशेषज्ञ)",
    roleEn: "Dermatology & Skin Allergy Specialist",
    roleHi: "त्वचा, खुजली एवं चर्म रोग विशेषज्ञ",
    departmentEn: "Department of Dermatology & Skin Health",
    departmentHi: "चर्म रोग एवं त्वचा स्वास्थ्य विभाग",
    gender: "male",
    voiceIdHindi: "hi-IN-kabir",
    voiceIdEnglish: "en-IN-rohan",
    voiceName: "Kabir (Male Doctor)",
    icon: "Sparkles",
    themeColor: "pink",
    sampleQuestions: [
      "I have red itchy rashes and burning sensation on my skin",
      "मेरी त्वचा पर लाल चकत्ते, खुजली और दाने हो रहे हैं",
    ],
  },
  mental_health: {
    id: "mental_health",
    nameEn: "Dr. Kabir (AI Mental Health Specialist)",
    nameHi: "डॉ. कबीर (मानसिक स्वास्थ्य एवं परामर्शदाता)",
    roleEn: "Mental Health, Anxiety & Stress Specialist",
    roleHi: "तनाव, चिंता एवं मानसिक स्वास्थ्य परामर्शदाता",
    departmentEn: "Department of Behavioral Health & Psychology",
    departmentHi: "मानसिक स्वास्थ्य एवं मनोविज्ञान विभाग",
    gender: "male",
    voiceIdHindi: "hi-IN-kabir",
    voiceIdEnglish: "en-IN-aarav",
    voiceName: "Kabir (Calm & Empathetic Male)",
    icon: "Brain",
    themeColor: "purple",
    sampleQuestions: [
      "I am feeling extreme stress, panic and cannot sleep at night",
      "मुझे पिछले कुछ दिनों से बहुत ज्यादा तनाव, घबराहट और नींद न आने की समस्या है",
    ],
  },
  gastroenterologist: {
    id: "gastroenterologist",
    nameEn: "Dr. Amit (AI Gastroenterologist)",
    nameHi: "डॉ. अमित (पेट एवं पाचन रोग विशेषज्ञ)",
    roleEn: "Gastroenterology & Digestive Health Specialist",
    roleHi: "पेट, गैस, एसिडिटी एवं पाचन रोग विशेषज्ञ",
    departmentEn: "Department of Gastroenterology",
    departmentHi: "गैस्ट्रोएंटरोलॉजी एवं पाचन तंत्र विभाग",
    gender: "male",
    voiceIdHindi: "hi-IN-kabir",
    voiceIdEnglish: "en-IN-rohan",
    voiceName: "Kabir (Male Doctor)",
    icon: "Stomach",
    themeColor: "amber",
    sampleQuestions: [
      "I have severe stomach burning, acid reflux and nausea after eating",
      "मुझे पेट में तेज जलन, गैस, बदहजमी और उल्टी जैसा महसूस हो रहा है",
    ],
  },
  pediatrician: {
    id: "pediatrician",
    nameEn: "Dr. Vikram (AI Pediatrician)",
    nameHi: "डॉ. विक्रम (बाल रोग विशेषज्ञ)",
    roleEn: "Pediatric & Child Health Specialist",
    roleHi: "शिशु एवं बाल स्वास्थ्य रोग विशेषज्ञ",
    departmentEn: "Department of Pediatrics & Child Welfare",
    departmentHi: "बाल रोग एवं शिशु कल्याण विभाग",
    gender: "male",
    voiceIdHindi: "hi-IN-kabir",
    voiceIdEnglish: "en-IN-aarav",
    voiceName: "Kabir (Gentle Male Doctor)",
    icon: "Baby",
    themeColor: "cyan",
    sampleQuestions: [
      "My 2-year-old child has high fever, cough and not drinking milk",
      "मेरे 2 साल के बच्चे को कल से तेज बुखार और खांसी है, क्या घरेलू देखभाल करें?",
    ],
  },
  gynecologist: {
    id: "gynecologist",
    nameEn: "Dr. Sunita (AI Women's Health Specialist)",
    nameHi: "डॉ. सुनीता (महिला स्वास्थ्य एवं प्रसूति विशेषज्ञ)",
    roleEn: "Gynecology & Women's Reproductive Health Specialist",
    roleHi: "महिला स्वास्थ्य, गर्भावस्था एवं मासिक धर्म विशेषज्ञ",
    departmentEn: "Department of Obstetrics & Gynecology",
    departmentHi: "प्रसूति एवं स्त्री रोग विभाग",
    gender: "female",
    voiceIdHindi: "hi-IN-kabir",
    voiceIdEnglish: "en-IN-rohan",
    voiceName: "Specialist Alternate Voice",
    icon: "Heart",
    themeColor: "rose",
    sampleQuestions: [
      "I am having severe menstrual cramps, fatigue and irregular periods",
      "मुझे पीरियड्स में असहनीय पेट दर्द, कमजोरी और अनियमितता की समस्या है",
    ],
  },
  clinic_appointment: {
    id: "clinic_appointment",
    nameEn: "Arogya Mitra (PHC OPD Booking Specialist)",
    nameHi: "आरोग्य मित्र (क्लिनिक व अपॉइंटमेंट विशेषज्ञ)",
    roleEn: "Primary Health Centre OPD & Ayushman Specialist",
    roleHi: "प्राथमिक स्वास्थ्य केंद्र ओपीडी एवं आयुष्मान भारत विशेषज्ञ",
    departmentEn: "Shivpur PHC OPD & Ayushman Helpdesk",
    departmentHi: "शिवपुर PHC ओपीडी एवं आयुष्मान भारत हेल्पडेस्क",
    gender: "male",
    voiceIdHindi: "hi-IN-kabir",
    voiceIdEnglish: "en-IN-aarav",
    voiceName: "Kabir (Male Coordinator)",
    icon: "Calendar",
    themeColor: "indigo",
    sampleQuestions: [
      "I want to book an appointment with a doctor at Shivpur PHC for tomorrow",
      "मुझे शिवपुर PHC में कल सुबह डॉक्टर की अपॉइंटमेंट बुक करनी है",
    ],
  },
  general_physician: {
    id: "general_physician",
    nameEn: "SwasthyaSathi AI (Primary Triage Guide)",
    nameHi: "SwasthyaSathi AI (मुख्य स्वास्थ्य साथी)",
    roleEn: "Primary Voice Health Assistant & Triage Guide",
    roleHi: "प्राथमिक स्वास्थ्य परामर्शदाता एवं लक्षण ट्राइएज",
    departmentEn: "Primary Health Triage Desk",
    departmentHi: "प्राथमिक स्वास्थ्य परामर्श केंद्र",
    gender: "female",
    voiceIdHindi: "hi-IN-shweta",
    voiceIdEnglish: "en-IN-priya",
    voiceName: "Shweta (Empathetic Female Assistant)",
    icon: "Stethoscope",
    themeColor: "teal",
    sampleQuestions: [
      "I have mild headache and tiredness since yesterday, what home care helps?",
      "मुझे कल से हल्का सिरदर्द और थकान है, घरेलू देखभाल बताएं",
    ],
  },
};

export interface AppointmentRecord {
  appointment_id: string;
  token_number: number;
  patient_id: string;
  patient_name: string;
  masked_phone: string;
  facility_id: string;
  facility_name: string;
  facility_address: string;
  doctor_name: string;
  department: string;
  appointment_date: string;
  time_slot: string;
  reason_for_visit: string;
  ayushman_covered: boolean;
  status: "confirmed" | "completed" | "cancelled";
  created_at: string;
}

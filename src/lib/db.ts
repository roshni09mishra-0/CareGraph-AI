import fs from "fs";
import path from "path";

export interface HealthFacts {
  age_band?: string; // e.g. "25-35", "Elderly (60+)", "Adult (35-45)"
  ongoing_conditions?: string; // e.g. "Mild Hypertension", "Asthma", "None"
  last_triage_outcome?: string; // e.g. "Advised hydration & rest for mild fever"
  last_symptom?: string; // e.g. "fever and body ache"
  do_not_call?: boolean; // Day 6 Opt-Out Registry flag
}

export interface CallerRecord {
  user_id: string;
  name: string;
  phone_number?: string;
  sip_uri?: string;
  language_preference: "en" | "hi" | "hinglish";
  facts: HealthFacts;
  consent_given: boolean;
  last_interaction: string; // ISO timestamp
}

// Database file path: data/swasthya_sathi_db.json
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "swasthya_sathi_db.json");

// Ensure data directory and DB file exist
function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Pre-seed or ensure demo records exist with user's phone number +91 7991912530
  const initialRecords: Record<string, CallerRecord> = {
    "user_ramesh": {
      user_id: "user_ramesh",
      name: "रमेश कुमार",
      phone_number: "+91 7991912530",
      sip_uri: "sip:roshu@sip.linphone.org",
      language_preference: "hi",
      facts: {
        age_band: "Adult (35-45)",
        ongoing_conditions: "None",
        last_triage_outcome: "Advised hydration, temperature charting & Shivpur PHC consultation for 3-day fever",
        last_symptom: "दो दिन से तेज बुखार और सिरदर्द",
        do_not_call: false,
      },
      consent_given: true,
      last_interaction: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    "user_priya": {
      user_id: "user_priya",
      name: "प्रिया देवी",
      phone_number: "+91 7991912530",
      language_preference: "hi",
      facts: {
        age_band: "Adult (25-35)",
        ongoing_conditions: "None",
        last_triage_outcome: "Maternal Health Routine Check",
        last_symptom: "सामयिक जांच",
        do_not_call: false,
      },
      consent_given: true,
      last_interaction: new Date().toISOString(),
    },
    "user_aarav": {
      user_id: "user_aarav",
      name: "आरव शर्मा (बाल स्वास्थ्य)",
      phone_number: "+91 7991912530",
      language_preference: "hi",
      facts: {
        age_band: "Child (1-5 yrs)",
        ongoing_conditions: "None",
        last_triage_outcome: "Immunization schedule pending",
        last_symptom: "टीकाकरण अनुसूची",
        do_not_call: false,
      },
      consent_given: true,
      last_interaction: new Date().toISOString(),
    },
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialRecords, null, 2), "utf-8");
    console.log("[Database] Initialized new persistent database at:", DB_FILE);
  } else {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const current = JSON.parse(raw) || {};
      // Ensure phone_number is updated on user_ramesh
      if (current["user_ramesh"]) {
        current["user_ramesh"].phone_number = "+91 7991912530";
        fs.writeFileSync(DB_FILE, JSON.stringify(current, null, 2), "utf-8");
      }
    } catch (e) {}
  }
}

// Read all callers from database
function readDatabase(): Record<string, CallerRecord> {
  ensureDatabase();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw) || {};
  } catch (error) {
    console.error("[Database Error] Failed to read database file:", error);
    return {};
  }
}

// Write all callers to database
function writeDatabase(data: Record<string, CallerRecord>): boolean {
  ensureDatabase();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("[Database Error] Failed to write database file:", error);
    return false;
  }
}

/**
 * Lookup caller by user_id
 */
export function getCaller(userId: string): CallerRecord | null {
  const db = readDatabase();
  return db[userId] || null;
}

/**
 * Lookup caller by name (case-insensitive fuzzy match)
 */
export function getCallerByName(name: string): CallerRecord | null {
  const db = readDatabase();
  const lowerName = name.toLowerCase().trim();
  const match = Object.values(db).find((caller) => caller.name.toLowerCase() === lowerName || caller.name.toLowerCase().includes(lowerName) || lowerName.includes(caller.name.toLowerCase()));
  return match || null;
}

/**
 * Save or update a caller's facts and consent
 */
export function saveCaller(caller: CallerRecord): CallerRecord {
  const db = readDatabase();
  db[caller.user_id] = {
    ...caller,
    phone_number: caller.phone_number || "+91 7991912530",
    last_interaction: new Date().toISOString(),
  };
  writeDatabase(db);
  console.log(`[Database] Saved record for caller ${caller.name} (${caller.user_id})`);
  return db[caller.user_id];
}

/**
 * Forget caller (Day 4 Privacy & Wipe Tool)
 */
export function deleteCaller(userId: string): boolean {
  const db = readDatabase();
  if (db[userId]) {
    const name = db[userId].name;
    delete db[userId];
    writeDatabase(db);
    console.log(`[Database Privacy] Erased all stored data for caller: ${name} (${userId})`);
    return true;
  }
  return false;
}

/**
 * List all saved callers (for UI dropdown and testing)
 */
export function listAllCallers(): CallerRecord[] {
  const db = readDatabase();
  return Object.values(db);
}

export const listCallers = listAllCallers;

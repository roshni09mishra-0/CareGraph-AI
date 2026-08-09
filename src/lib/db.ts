import fs from "fs";
import path from "path";

export interface HealthFacts {
  age_band?: string; // e.g. "25-35", "Elderly (60+)", "Adult (35-45)"
  ongoing_conditions?: string; // e.g. "Mild Hypertension", "Asthma", "None"
  last_triage_outcome?: string; // e.g. "Advised hydration & rest for mild fever"
  last_symptom?: string; // e.g. "fever and body ache"
}

export interface CallerRecord {
  user_id: string;
  name: string;
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

  if (!fs.existsSync(DB_FILE)) {
    // Pre-seed demo returning patient for instant Day 4 testing
    const initialRecords: Record<string, CallerRecord> = {
      "user_ramesh": {
        user_id: "user_ramesh",
        name: "Ramesh",
        language_preference: "hinglish",
        facts: {
          age_band: "Adult (35-45)",
          ongoing_conditions: "None",
          last_triage_outcome: "Advised hydration, temperature charting & ORS for mild fever",
          last_symptom: "fever and body ache",
        },
        consent_given: true,
        last_interaction: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialRecords, null, 2), "utf-8");
    console.log("[Database] Initialized new persistent database with demo records at:", DB_FILE);
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

// Write callers to database atomically
function writeDatabase(data: Record<string, CallerRecord>) {
  ensureDatabase();
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (error) {
    console.error("[Database Error] Failed to write database file:", error);
  }
}

/**
 * Look up a caller by user_id
 */
export function getCaller(userId: string): CallerRecord | null {
  const db = readDatabase();
  return db[userId] || null;
}

/**
 * Look up a caller by name (case-insensitive)
 */
export function getCallerByName(name: string): CallerRecord | null {
  const db = readDatabase();
  const cleanName = name.toLowerCase().trim();
  for (const record of Object.values(db)) {
    if (record.name.toLowerCase() === cleanName || cleanName.includes(record.name.toLowerCase())) {
      return record;
    }
  }
  return null;
}

/**
 * Save or update a caller record
 * HARD RULE: Only saves if consent_given === true
 */
export function saveCaller(record: CallerRecord): CallerRecord {
  if (!record.consent_given) {
    throw new Error("Consent not granted. Health Access guardrail prohibits storing data without consent.");
  }

  const db = readDatabase();
  const existing = db[record.user_id] || {};
  
  const updatedRecord: CallerRecord = {
    ...existing,
    ...record,
    last_interaction: new Date().toISOString(),
  };

  db[record.user_id] = updatedRecord;
  writeDatabase(db);
  console.log(`[Database] Successfully saved caller record for ${record.name} (${record.user_id})`);
  return updatedRecord;
}

/**
 * Delete / Wipe a caller record ("Forget Me" tool)
 */
export function deleteCaller(userId: string): boolean {
  const db = readDatabase();
  if (db[userId]) {
    delete db[userId];
    writeDatabase(db);
    console.log(`[Database] Successfully deleted (forgot) caller record for ${userId}`);
    return true;
  }
  return false;
}

/**
 * List all saved callers
 */
export function listCallers(): CallerRecord[] {
  const db = readDatabase();
  return Object.values(db);
}

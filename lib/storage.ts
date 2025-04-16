import { openDB } from 'idb';

interface GradingSession {
  id: string;
  userId: string;
  subject: string;
  sessionName: string;
  studentFiles: string[]; // base64 strings
  rubricFile: string | null; // base64 string
  useTemplateRubric: boolean;
  results: any[];
  createdAt: string;
}

export interface RubricCriterion {
  id: string;
  description: string;
  weight: number;
}

export interface Rubric {
  id: string;
  name: string;
  subject: string;
  content: string;
  criteria: RubricCriterion[];
  createdAt: string;
  isTemplate?: boolean;
}

const DB_NAME = 'fairgrade-db';
const DB_VERSION = 2; // Increased version number to trigger upgrade
const STORE_NAMES = {
  GRADING_SESSIONS: 'grading-sessions',
  RUBRICS: 'rubrics'
};

let db: any = null;

async function initDB() {
  if (!db) {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(STORE_NAMES.GRADING_SESSIONS)) {
          db.createObjectStore(STORE_NAMES.GRADING_SESSIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.RUBRICS)) {
          db.createObjectStore(STORE_NAMES.RUBRICS, { keyPath: 'id' });
        }
      },
    });
  }
  return db;
}

// Helper function to ensure database is ready
async function ensureDB() {
  const database = await initDB();
  if (!database.objectStoreNames.contains(STORE_NAMES.RUBRICS)) {
    throw new Error('Database not properly initialized');
  }
  return database;
}

// Rubric Storage Functions
export async function saveRubric(rubric: Rubric): Promise<void> {
  const db = await ensureDB();
  await db.put(STORE_NAMES.RUBRICS, {
    ...rubric,
    content: formatRubricContent(rubric.criteria)
  });
}

export async function getAllRubrics(): Promise<Rubric[]> {
  const db = await ensureDB();
  return db.getAll(STORE_NAMES.RUBRICS);
}

export async function getRubricsBySubject(subject: string): Promise<Rubric[]> {
  const rubrics = await getAllRubrics();
  return rubrics.filter(rubric => rubric.subject === subject);
}

export async function deleteRubric(id: string): Promise<void> {
  const db = await ensureDB();
  await db.delete(STORE_NAMES.RUBRICS, id);
}

function formatRubricContent(criteria: RubricCriterion[]): string {
  return criteria
    .map((criterion, index) => `${index + 1}. ${criterion.description} (${criterion.weight}%)`)
    .join('\n');
}

// Initialize with default rubrics if none exist
export async function initializeDefaultRubrics() {
  const db = await ensureDB();
  const existingRubrics = await db.getAll(STORE_NAMES.RUBRICS);
  
  if (existingRubrics.length === 0) {
    const defaultRubrics: Rubric[] = [
      {
        id: "rubric-1",
        name: "Basic Mathematics Rubric",
        subject: "Math",
        createdAt: new Date().toISOString(),
        criteria: [
          { id: "m1", description: "Correct answer", weight: 50 },
          { id: "m2", description: "Proper working/steps", weight: 30 },
          { id: "m3", description: "Mathematical notation", weight: 10 },
          { id: "m4", description: "Clarity and organization", weight: 10 }
        ],
        content: "",
        isTemplate: true
      },
      {
        id: "rubric-2",
        name: "Advanced Physics Rubric",
        subject: "Physics",
        createdAt: new Date().toISOString(),
        criteria: [
          { id: "p1", description: "Correct solution", weight: 40 },
          { id: "p2", description: "Application of physics principles", weight: 25 },
          { id: "p3", description: "Mathematical working", weight: 20 },
          { id: "p4", description: "Units and dimensions", weight: 15 }
        ],
        content: "",
        isTemplate: true
      },
      {
        id: "rubric-3",
        name: "Essay Writing Rubric",
        subject: "English",
        createdAt: new Date().toISOString(),
        criteria: [
          { id: "e1", description: "Thesis and argument development", weight: 30 },
          { id: "e2", description: "Evidence and supporting details", weight: 25 },
          { id: "e3", description: "Organization and structure", weight: 20 },
          { id: "e4", description: "Grammar and mechanics", weight: 15 },
          { id: "e5", description: "Style and voice", weight: 10 }
        ],
        content: "",
        isTemplate: true
      }
    ];

    for (const rubric of defaultRubrics) {
      rubric.content = formatRubricContent(rubric.criteria);
      await db.add(STORE_NAMES.RUBRICS, rubric);
    }
  }
}

// Grading Session Storage Functions
export async function saveGradingSession(session: GradingSession): Promise<void> {
    const db = await initDB();
  await db.put('grading-sessions', session);
}

export async function getGradingSession(id: string): Promise<GradingSession | undefined> {
      const db = await initDB();
  return db.get('grading-sessions', id);
}

export async function getAllGradingSessions(userId?: string): Promise<GradingSession[]> {
  const db = await initDB();
  const allSessions = await db.getAll('grading-sessions');
  
  if (userId) {
    return allSessions.filter((session: GradingSession) => session.userId === userId);
  }
  
  return allSessions;
}

export async function deleteGradingSession(id: string, userId?: string): Promise<void> {
  const db = await initDB();
  
  if (userId) {
    const session = await db.get('grading-sessions', id);
    if (session && session.userId === userId) {
      await db.delete('grading-sessions', id);
    } else {
      throw new Error('Session not found or not authorized to delete');
    }
  } else {
    await db.delete('grading-sessions', id);
  }
}

// Function to convert File to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Function to convert base64 to File
export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
} 
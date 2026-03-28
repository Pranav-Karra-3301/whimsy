import { NPCObject } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// Simple JSON file-based storage as a starting point.
// Replace with SpaceTimeDB once the module is deployed.

const DATA_DIR = join(process.cwd(), ".data");
const DB_FILE = join(DATA_DIR, "objects.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readDB(): NPCObject[] {
  ensureDataDir();
  if (!existsSync(DB_FILE)) {
    writeFileSync(DB_FILE, "[]");
    return [];
  }
  const data = readFileSync(DB_FILE, "utf-8");
  return JSON.parse(data);
}

function writeDB(objects: NPCObject[]) {
  ensureDataDir();
  writeFileSync(DB_FILE, JSON.stringify(objects, null, 2));
}

export function getAllObjects(): NPCObject[] {
  return readDB().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getObjectById(id: string): NPCObject | undefined {
  return readDB().find((o) => o.id === id);
}

export function createObject(
  data: Omit<NPCObject, "id" | "times_talked_to" | "created_at">
): NPCObject {
  const objects = readDB();
  const newObject: NPCObject = {
    ...data,
    id: uuidv4(),
    times_talked_to: 0,
    created_at: new Date().toISOString(),
  };
  objects.push(newObject);
  writeDB(objects);
  return newObject;
}

export function updateObject(
  id: string,
  updates: Partial<NPCObject>
): NPCObject | undefined {
  const objects = readDB();
  const index = objects.findIndex((o) => o.id === id);
  if (index === -1) return undefined;
  objects[index] = { ...objects[index], ...updates };
  writeDB(objects);
  return objects[index];
}

export function deleteObject(id: string): boolean {
  const objects = readDB();
  const filtered = objects.filter((o) => o.id !== id);
  if (filtered.length === objects.length) return false;
  writeDB(filtered);
  return true;
}

export function incrementTalkCount(id: string): NPCObject | undefined {
  const objects = readDB();
  const obj = objects.find((o) => o.id === id);
  if (!obj) return undefined;
  obj.times_talked_to += 1;
  writeDB(objects);
  return obj;
}

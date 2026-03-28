import { NPCObject } from "@/types";
import { v4 as uuidv4 } from "uuid";

const STDB_URI = process.env.SPACETIMEDB_URI!;
const STDB_MODULE = process.env.SPACETIMEDB_MODULE!;
const STDB_TOKEN = process.env.SPACETIMEDB_TOKEN!;

async function stdbSQL(query: string): Promise<unknown[][]> {
  const res = await fetch(`${STDB_URI}/v1/database/${STDB_MODULE}/sql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STDB_TOKEN}`,
    },
    body: query,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SpaceTimeDB SQL error: ${text}`);
  }

  const data = await res.json();
  return data[0]?.rows ?? [];
}

async function stdbCall(reducer: string, args: unknown[]): Promise<void> {
  const res = await fetch(
    `${STDB_URI}/v1/database/${STDB_MODULE}/call/${reducer}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STDB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SpaceTimeDB reducer '${reducer}' error: ${text}`);
  }
}

function rowToObject(row: unknown[]): NPCObject {
  const createdAtMicros = (row[11] as number[])[0];
  return {
    id: row[0] as string,
    name: row[1] as string,
    personality: row[2] as string,
    backstory: row[3] as string,
    voice_description: row[4] as string,
    image_url: row[5] as string,
    original_image_url: row[6] as string,
    voice_id: row[7] as string,
    voice_name: row[8] as string,
    mode: ((row[9] as string) || "character") as "photo" | "character",
    times_talked_to: row[10] as number,
    created_at: new Date(createdAtMicros / 1000).toISOString(),
  };
}

export async function getAllObjects(): Promise<NPCObject[]> {
  const rows = await stdbSQL(
    "SELECT * FROM npc_object ORDER BY created_at DESC"
  );
  return rows.map(rowToObject);
}

export async function getObjectById(
  id: string
): Promise<NPCObject | undefined> {
  const rows = await stdbSQL(
    `SELECT * FROM npc_object WHERE id = '${id.replace(/'/g, "''")}'`
  );
  return rows.length > 0 ? rowToObject(rows[0]) : undefined;
}

export async function createObject(
  data: Omit<NPCObject, "id" | "times_talked_to" | "created_at">
): Promise<NPCObject> {
  const id = uuidv4();
  await stdbCall("create_object", [
    id,
    data.name,
    data.personality,
    data.backstory,
    data.voice_description,
    data.image_url,
    data.original_image_url,
    data.voice_id || "",
    data.voice_name || "",
    data.mode || "character",
  ]);

  // Query back the created object for the server-assigned timestamp
  const obj = await getObjectById(id);
  if (!obj) throw new Error("Failed to create object");
  return obj;
}

export async function updateObject(
  id: string,
  updates: Partial<NPCObject>
): Promise<NPCObject | undefined> {
  const existing = await getObjectById(id);
  if (!existing) return undefined;

  await stdbCall("update_object", [
    id,
    updates.name ?? existing.name,
    updates.personality ?? existing.personality,
    updates.backstory ?? existing.backstory,
    updates.voice_description ?? existing.voice_description,
    updates.image_url ?? existing.image_url,
    updates.original_image_url ?? existing.original_image_url,
    updates.voice_id ?? existing.voice_id,
    updates.voice_name ?? existing.voice_name,
    updates.mode ?? existing.mode,
  ]);

  return getObjectById(id);
}

export async function deleteObject(id: string): Promise<boolean> {
  try {
    await stdbCall("delete_object", [id]);
    return true;
  } catch {
    return false;
  }
}

export async function incrementTalkCount(
  id: string
): Promise<NPCObject | undefined> {
  try {
    await stdbCall("increment_talk_count", [id]);
    return getObjectById(id);
  } catch {
    return undefined;
  }
}

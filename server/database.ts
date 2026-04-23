import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSeedDatabase } from "./seed.js";
import type { Database } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databaseDirectory = path.resolve(__dirname, "../data");
const databasePath = path.resolve(databaseDirectory, "party-script-db.json");

async function ensureDatabase(): Promise<void> {
  await mkdir(databaseDirectory, { recursive: true });

  try {
    await readFile(databasePath, "utf8");
  } catch {
    const seeded = createSeedDatabase();
    await writeFile(databasePath, JSON.stringify(seeded, null, 2), "utf8");
  }
}

export async function readDatabase(): Promise<Database> {
  await ensureDatabase();
  const raw = await readFile(databasePath, "utf8");
  return JSON.parse(raw) as Database;
}

export async function writeDatabase(nextDatabase: Database): Promise<void> {
  await ensureDatabase();
  await writeFile(databasePath, JSON.stringify(nextDatabase, null, 2), "utf8");
}

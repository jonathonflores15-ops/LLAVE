import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "data.json");

const DEFAULTS = { users: [], orders: [], subscribers: [], extraListings: [], submissions: [] };
const DATABASE_URL = process.env.DATABASE_URL || "";

let state;
let pool = null;

// With DATABASE_URL set (e.g. a free Neon Postgres instance), the whole app-state object is
// stored as one JSONB row — this keeps db.js's read/write shape identical for every caller,
// while actually surviving restarts/redeploys. Without it, falls back to the local JSON file
// (fine for local dev, but wiped on most hosts' ephemeral disks).
if (DATABASE_URL) {
  const { default: pg } = await import("pg");
  pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pool.query("CREATE TABLE IF NOT EXISTS app_state (id INT PRIMARY KEY, data JSONB NOT NULL)");
  const { rows } = await pool.query("SELECT data FROM app_state WHERE id = 1");
  state = rows.length ? { ...DEFAULTS, ...rows[0].data } : { ...DEFAULTS };
  if (!rows.length) await pool.query("INSERT INTO app_state (id, data) VALUES (1, $1)", [state]);
  console.log("Database: Postgres (persistent)");
} else {
  try { state = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(FILE, "utf8")) }; }
  catch { state = { ...DEFAULTS }; }
  console.log("Database: local JSON file (set DATABASE_URL for real persistence)");
}

function persist() {
  if (pool) return pool.query("UPDATE app_state SET data = $1 WHERE id = 1", [state]).catch((e) => console.error("DB save failed:", e.message));
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

export const db = {
  get users() { return state.users; },
  get orders() { return state.orders; },
  get subscribers() { return state.subscribers; },
  get extraListings() { return state.extraListings; },
  get submissions() { return state.submissions; },
  save() { return persist(); },
  reset() { state = { ...DEFAULTS }; return persist(); },
};

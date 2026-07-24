import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "data.json");

const DEFAULTS = { users: [], orders: [], subscribers: [], extraListings: [], submissions: [] };

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(FILE, "utf8")) }; }
  catch { return { ...DEFAULTS }; }
}

let state = load();

export const db = {
  get users() { return state.users; },
  get orders() { return state.orders; },
  get subscribers() { return state.subscribers; },
  get extraListings() { return state.extraListings; },
  get submissions() { return state.submissions; },
  save() { fs.writeFileSync(FILE, JSON.stringify(state, null, 2)); },
  reset() { state = { ...DEFAULTS }; this.save(); },
};

// Sends email through Resend (https://resend.com) using the built-in fetch — no npm package
// needed. If RESEND_API_KEY + FROM_EMAIL aren't set, it runs in MOCK mode: it logs the email
// and appends it to server/outbox.log so you can see exactly what would have been sent.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTBOX = path.join(__dirname, "outbox.log");

const KEY = process.env.RESEND_API_KEY || "";
const FROM = process.env.FROM_EMAIL || "Llave <onboarding@resend.dev>";

export const emailMode = () => (KEY ? "resend" : "mock");

export async function sendEmail(to, subject, html) {
  if (!KEY) {
    const entry = `\n--- ${new Date().toISOString()} ---\nTO: ${to}\nSUBJECT: ${subject}\n${html.replace(/<[^>]+>/g, "").slice(0, 400)}...\n`;
    try { fs.appendFileSync(OUTBOX, entry); } catch {}
    console.log(`[email:mock] -> ${to} | ${subject}`);
    return { sent: false, mode: "mock" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) { console.warn("[email] resend error", res.status); return { sent: false, mode: "resend", error: res.status }; }
    return { sent: true, mode: "resend" };
  } catch (e) {
    console.warn("[email] send failed", e.message);
    return { sent: false, mode: "resend", error: e.message };
  }
}

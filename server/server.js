import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { LISTINGS, KIND_TOTALS } from "./data.js";
import { buildReport, buildPreview } from "./report.js";
import { db } from "./db.js";
import { hashPassword, verifyPassword, signToken, verifyToken, optionalUser } from "./auth.js";
import { sendEmail, emailMode } from "./emailer.js";
import { matches, listingsEmail, welcomeEmail } from "./notify.js";
import { floodZone } from "./fema.js";
import { askAssistant, assistantAvailable } from "./assistant.js";

const PORT = process.env.PORT || 3001;
const REPORT_PRICE_CENTS = 1900;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";
const ADMIN_KEY = process.env.ADMIN_KEY || "dev-admin";
const APP_URL = process.env.APP_URL || "http://localhost:5173";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" })); // generous limit — submitted listing photos travel as base64

const MAX_PHOTOS = 6;
const MAX_PHOTO_CHARS = 2_500_000; // ~1.8MB per photo, decoded

const publicUser = (u) => ({ id: u.id, email: u.email, pro: !!u.pro });
const allListings = () => [...LISTINGS, ...db.extraListings];
const findListing = (idOrCat) => allListings().find((l) => l.id === idOrCat || l.catastro === idOrCat) || null;
const unsubUrl = (token) => `${APP_URL.replace(/\/$/, "")}/api/alerts/unsubscribe?token=${token}`;

// ---- Stripe (loaded only when configured) ----
let _stripe = null;
async function getStripe() {
  if (!STRIPE_KEY) return null;
  if (_stripe) return _stripe;
  try { const { default: Stripe } = await import("stripe"); _stripe = new Stripe(STRIPE_KEY); return _stripe; }
  catch { console.warn("Stripe key set but 'stripe' package missing — run: npm install stripe"); return null; }
}

app.get("/api/health", async (_req, res) => res.json({ ok: true, card: (await getStripe()) ? "stripe" : "mock", email: emailMode() }));

// ---- listings ----
app.get("/api/listings", (req, res) => {
  const { kind, use, muni, q } = req.query;
  let rows = allListings();
  if (kind) rows = rows.filter((l) => l.kind === kind);
  if (use && use !== "all") rows = rows.filter((l) => l.use === use);
  if (muni) rows = rows.filter((l) => l.muni.toLowerCase() === String(muni).toLowerCase());
  if (q) {
    const s = String(q).trim().toLowerCase();
    if (/^\d+$/.test(s)) rows = rows.filter((l) => String(l.zip || "").startsWith(s)); // ZIP or ZIP-prefix = "around that area"
    else rows = rows.filter((l) => [l.muni, l.sector, l.type, l.catastro, l.zip].join(" ").toLowerCase().includes(s));
  }
  res.json({ listings: rows, total: kind ? (KIND_TOTALS[kind] ?? rows.length) : rows.length, totals: KIND_TOTALS });
});

app.get("/api/listings/:id", (req, res) => {
  const l = findListing(req.params.id);
  if (!l) return res.status(404).json({ error: "listing_not_found" });
  res.json(l);
});

// ---- AI search assistant (helps visitors narrow down listings / ask questions) ----
// Costs real money per call, so a simple shared-bucket rate limit guards against abuse
// even though req.ip isn't reliably per-visitor behind Render's proxy.
const ASSISTANT_RATE = { windowMs: 60_000, max: 20 };
const assistantHits = new Map();
function assistantRateLimited(key) {
  const now = Date.now();
  const hits = (assistantHits.get(key) || []).filter((t) => now - t < ASSISTANT_RATE.windowMs);
  hits.push(now);
  assistantHits.set(key, hits);
  return hits.length > ASSISTANT_RATE.max;
}

app.post("/api/assistant", async (req, res) => {
  if (!assistantAvailable()) return res.status(503).json({ error: "assistant_not_configured" });
  const message = String(req.body.message || "").trim();
  if (!message) return res.status(400).json({ error: "message_required" });
  if (message.length > 500) return res.status(400).json({ error: "message_too_long" });
  if (assistantRateLimited(req.ip || "shared")) return res.status(429).json({ error: "rate_limited" });
  try {
    const munis = [...new Set(allListings().map((l) => l.muni))].sort();
    const result = await askAssistant(message, { munis });
    if (!result) return res.status(503).json({ error: "assistant_not_configured" });
    res.json(result);
  } catch (e) {
    console.error("Assistant error:", e.message);
    res.status(502).json({ error: "assistant_error" });
  }
});

// ---- public listing submissions (owners/agents publish their own property) ----
app.post("/api/listings/submit", (req, res) => {
  const b = req.body || {};
  const catastro = String(b.catastro || "").trim();
  const muni = String(b.muni || "").trim();
  const email = String(b.contactEmail || "").trim().toLowerCase();
  if (!["rent", "sale", "auction"].includes(b.kind)) return res.status(400).json({ error: "invalid_kind" });
  if (!catastro) return res.status(400).json({ error: "catastro_required" });
  if (!muni) return res.status(400).json({ error: "muni_required" });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "valid_email_required" });

  const photos = Array.isArray(b.photos)
    ? b.photos.filter((p) => typeof p === "string" && p.startsWith("data:image/") && p.length <= MAX_PHOTO_CHARS).slice(0, MAX_PHOTOS)
    : [];

  const submission = {
    id: "sub_" + crypto.randomUUID(),
    status: "pending",
    kind: b.kind, use: b.use === "com" ? "com" : "res",
    muni, sector: String(b.sector || ""), type: String(b.type || ""),
    beds: b.beds ? Number(b.beds) : undefined,
    baths: b.baths ? Number(b.baths) : undefined,
    area: b.area ? Number(b.area) : undefined,
    parking: b.parking ? Number(b.parking) : undefined,
    price: b.price ? Number(b.price) : undefined,
    bid: b.bid ? Number(b.bid) : undefined,
    catastro, zip: String(b.zip || ""),
    lat: b.lat ? Number(b.lat) : undefined,
    lng: b.lng ? Number(b.lng) : undefined,
    photos,
    description: String(b.description || "").slice(0, 2000),
    contactEmail: email, contactPhone: String(b.contactPhone || ""),
    createdAt: Date.now(),
  };
  db.submissions.push(submission); db.save();
  res.json({ ok: true, id: submission.id });
});

// ---- report (paywalled) ----
app.get("/api/reports/:catastro/preview", (req, res) => {
  const l = findListing(req.params.catastro);
  if (!l) return res.status(404).json({ error: "listing_not_found" });
  res.json({ listing: l, price_cents: REPORT_PRICE_CENTS, ...buildPreview(l) });
});

function hasReportAccess(req, catastro) {
  const user = optionalUser(req, db.users);
  if (user && user.pro) return true;
  if (user && db.orders.some((o) => o.userId === user.id && o.catastro === catastro && o.paid)) return true;
  const token = req.get("x-access-token") || req.query.access;
  if (token) { const p = verifyToken(token); if (p && p.scope === "report" && p.catastro === catastro) return true; }
  return false;
}

app.get("/api/reports/:catastro", async (req, res) => {
  const l = findListing(req.params.catastro);
  if (!l) return res.status(404).json({ error: "listing_not_found" });
  if (!hasReportAccess(req, l.catastro)) return res.status(402).json({ error: "payment_required", price_cents: REPORT_PRICE_CENTS });
  const report = buildReport(l);
  try {
    const fz = await floodZone(l.lat, l.lng); // live FEMA flood zone
    if (fz) patchFloodRow(report.sections, fz);
    report.floodSource = fz ? "FEMA" : "estimate";
  } catch { report.floodSource = "estimate"; }
  res.json({ listing: l, ...report });
});

// Replace the report's flood row with the live FEMA value and mark the source as live.
function patchFloodRow(sections, fz) {
  const sec = sections.find((x) => x.icon === "AlertTriangle");
  if (!sec || !sec.rows || !sec.rows[0]) return;
  const row = sec.rows[0];
  row.es = [row.es[0], fz.es];
  row.en = [row.en[0], fz.en];
  if (fz.tone) row.tone = fz.tone; else delete row.tone;
  sec.srcLabel = { es: "FEMA · en vivo", en: "FEMA · live" };
}

// ---- auth ----
app.post("/api/auth/register", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || !password) return res.status(400).json({ error: "email_and_password_required" });
  if (password.length < 6) return res.status(400).json({ error: "password_too_short" });
  if (db.users.some((u) => u.email === email)) return res.status(409).json({ error: "email_in_use" });
  const user = { id: "u_" + crypto.randomUUID(), email, password: hashPassword(password), pro: false, createdAt: Date.now() };
  db.users.push(user); db.save();
  res.json({ token: signToken({ uid: user.id }), user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = db.users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.password)) return res.status(401).json({ error: "invalid_credentials" });
  res.json({ token: signToken({ uid: user.id }), user: publicUser(user) });
});

app.get("/api/auth/me", (req, res) => {
  const user = optionalUser(req, db.users);
  if (!user) return res.status(401).json({ error: "not_authenticated" });
  res.json({ user: publicUser(user) });
});

// ---- Stripe payment (card + Apple Pay + Google Pay via Payment Element) ----
app.post("/api/payments/stripe-intent", async (req, res) => {
  const l = findListing(String(req.body.catastro || ""));
  if (!l) return res.status(404).json({ error: "listing_not_found" });
  const stripe = await getStripe();
  if (!stripe) return res.json({ mock: true });
  try {
    const intent = await stripe.paymentIntents.create({
      amount: REPORT_PRICE_CENTS, currency: "usd",
      automatic_payment_methods: { enabled: true }, // cards + Apple Pay + Google Pay
      metadata: { catastro: l.catastro, product: "property_report" },
    });
    res.json({ clientSecret: intent.client_secret });
  } catch (e) { res.status(502).json({ error: "stripe_error", detail: e.message }); }
});

async function stripePaid(paymentIntentId, catastro) {
  const stripe = await getStripe();
  if (!stripe) return true;
  try { const pi = await stripe.paymentIntents.retrieve(paymentIntentId); return pi && pi.status === "succeeded" && pi.amount === REPORT_PRICE_CENTS && pi.metadata?.catastro === catastro; }
  catch { return false; }
}

app.post("/api/checkout", async (req, res) => {
  const kind = req.body.kind || "report";
  const user = optionalUser(req, db.users);
  if (kind === "pro") {
    if (!user) return res.status(401).json({ error: "login_required_for_pro" });
    user.pro = true; db.save();
    return res.json({ ok: true, pro: true, user: publicUser(user) });
  }
  const catastro = String(req.body.catastro || "");
  const l = findListing(catastro);
  if (!l) return res.status(404).json({ error: "listing_not_found" });
  const method = req.body.method || "mock";
  const paid = method === "stripe" ? await stripePaid(String(req.body.paymentIntentId || ""), catastro) : true;
  if (!paid) return res.status(402).json({ error: "payment_not_confirmed" });
  const order = { id: "o_" + crypto.randomUUID(), catastro, userId: user ? user.id : null, method, amount_cents: REPORT_PRICE_CENTS, paid: true, createdAt: Date.now() };
  db.orders.push(order); db.save();
  const accessToken = signToken({ scope: "report", catastro, oid: order.id }, { expiresIn: "365d" });
  res.json({ ok: true, order: { id: order.id, catastro, amount_cents: REPORT_PRICE_CENTS }, accessToken, receipt: order.id.slice(0, 12).toUpperCase() });
});

app.get("/api/me/reports", (req, res) => {
  const user = optionalUser(req, db.users);
  if (!user) return res.status(401).json({ error: "not_authenticated" });
  const mine = db.orders.filter((o) => o.userId === user.id && o.paid).map((o) => ({ catastro: o.catastro, listing: findListing(o.catastro), createdAt: o.createdAt }));
  res.json({ reports: mine, pro: !!user.pro });
});

// ==================== EMAIL ALERTS / SUBSCRIPTIONS ====================

// Subscribe with an email (required) + optional preferences.
app.post("/api/alerts/subscribe", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "valid_email_required" });
  const prefs = {
    kind: req.body.kind || "any",
    use: req.body.use || "all",
    muni: req.body.muni ? String(req.body.muni) : "",
    maxPrice: req.body.maxPrice ? Number(req.body.maxPrice) : null,
  };
  let sub = db.subscribers.find((s) => s.email === email);
  if (sub) { sub.prefs = prefs; }
  else {
    sub = { id: "s_" + crypto.randomUUID(), email, prefs, unsubToken: crypto.randomBytes(16).toString("hex"), createdAt: Date.now(), lastNotifiedAt: Date.now() };
    db.subscribers.push(sub);
  }
  db.save();
  const { subject, html } = welcomeEmail(APP_URL, unsubUrl(sub.unsubToken));
  sendEmail(email, subject, html); // fire-and-forget (mock logs it)
  res.json({ ok: true });
});

app.get("/api/alerts/unsubscribe", (req, res) => {
  const token = String(req.query.token || "");
  const before = db.subscribers.length;
  const idx = db.subscribers.findIndex((s) => s.unsubToken === token);
  if (idx >= 0) { db.subscribers.splice(idx, 1); db.save(); }
  res.set("Content-Type", "text/html").send(`<div style="font-family:sans-serif;max-width:480px;margin:60px auto;text-align:center;"><h2 style="color:#0C4A4E;">Llave</h2><p>${before === db.subscribers.length ? "Suscripción no encontrada." : "Has cancelado tu suscripción. No recibirás más correos."}</p></div>`);
});

// Admin: add a new listing -> immediately email matching subscribers.
app.post("/api/admin/listings", async (req, res) => {
  if ((req.body.adminKey || req.get("x-admin-key")) !== ADMIN_KEY) return res.status(401).json({ error: "bad_admin_key" });
  const b = req.body.listing || {};
  if (!b.catastro || !b.muni || !b.kind) return res.status(400).json({ error: "listing_needs_catastro_muni_kind" });
  const listing = {
    id: "x_" + crypto.randomUUID().slice(0, 8), kind: b.kind, muni: b.muni, sector: b.sector || "",
    type: b.type || "Propiedad", use: b.use || "res",
    beds: b.beds, baths: b.baths, area: b.area, parking: b.parking,
    price: b.price, bid: b.bid, catastro: b.catastro, zip: b.zip || "", lat: b.lat, lng: b.lng,
    g: b.g || ["#0C4A4E", "#6FA093"], createdAt: Date.now(),
  };
  db.extraListings.push(listing); db.save();
  const notified = await notifyNewListings([listing]);
  res.json({ ok: true, listing, notified });
});

// Admin: remove a listing that was added via admin/listings or an approved submission
// (property sold/rented/rented out, or was added by mistake).
app.delete("/api/admin/listings/:id", (req, res) => {
  if ((req.query.adminKey || req.get("x-admin-key")) !== ADMIN_KEY) return res.status(401).json({ error: "bad_admin_key" });
  const idx = db.extraListings.findIndex((l) => l.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "listing_not_found" });
  db.extraListings.splice(idx, 1); db.save();
  res.json({ ok: true });
});

// Admin: list pending owner-submitted listings awaiting review.
app.get("/api/admin/submissions", (req, res) => {
  if ((req.query.adminKey || req.get("x-admin-key")) !== ADMIN_KEY) return res.status(401).json({ error: "bad_admin_key" });
  res.json({ submissions: db.submissions.filter((s) => s.status === "pending") });
});

// Admin: approve a submission -> it becomes a real listing and notifies matching subscribers.
app.post("/api/admin/submissions/:id/approve", async (req, res) => {
  if ((req.body.adminKey || req.get("x-admin-key")) !== ADMIN_KEY) return res.status(401).json({ error: "bad_admin_key" });
  const sub = db.submissions.find((s) => s.id === req.params.id && s.status === "pending");
  if (!sub) return res.status(404).json({ error: "submission_not_found" });
  const listing = {
    id: "x_" + crypto.randomUUID().slice(0, 8), kind: sub.kind, muni: sub.muni, sector: sub.sector,
    type: sub.type || "Propiedad", use: sub.use,
    beds: sub.beds, baths: sub.baths, area: sub.area, parking: sub.parking,
    price: sub.price, bid: sub.bid, catastro: sub.catastro, zip: sub.zip, lat: sub.lat, lng: sub.lng,
    photos: sub.photos, g: ["#0C4A4E", "#6FA093"], createdAt: Date.now(),
  };
  db.extraListings.push(listing);
  sub.status = "approved";
  db.save();
  const notified = await notifyNewListings([listing]);
  res.json({ ok: true, listing, notified });
});

// Admin: reject a submission.
app.post("/api/admin/submissions/:id/reject", (req, res) => {
  if ((req.body.adminKey || req.get("x-admin-key")) !== ADMIN_KEY) return res.status(401).json({ error: "bad_admin_key" });
  const sub = db.submissions.find((s) => s.id === req.params.id && s.status === "pending");
  if (!sub) return res.status(404).json({ error: "submission_not_found" });
  sub.status = "rejected"; db.save();
  res.json({ ok: true });
});

// Admin: send the digest of recent matching listings to every subscriber.
app.post("/api/admin/send-digest", async (req, res) => {
  if ((req.body.adminKey || req.get("x-admin-key")) !== ADMIN_KEY) return res.status(401).json({ error: "bad_admin_key" });
  const sent = await runDigest();
  res.json({ ok: true, sent });
});

// Email matching subscribers about a set of brand-new listings.
async function notifyNewListings(newOnes) {
  let notified = 0;
  for (const sub of db.subscribers) {
    const hits = newOnes.filter((l) => matches(sub.prefs, l));
    if (!hits.length) continue;
    const { subject, html } = listingsEmail(sub, hits, APP_URL, unsubUrl(sub.unsubToken));
    await sendEmail(sub.email, subject, html);
    sub.lastNotifiedAt = Date.now();
    notified++;
  }
  db.save();
  return notified;
}

// Digest: for each subscriber, gather listings added since we last emailed them that match
// their preferences, and send. Runs on a schedule and via the admin endpoint.
async function runDigest() {
  let sent = 0;
  for (const sub of db.subscribers) {
    const since = sub.lastNotifiedAt || 0;
    const hits = db.extraListings.filter((l) => (l.createdAt || 0) > since && matches(sub.prefs, l));
    if (!hits.length) continue;
    const { subject, html } = listingsEmail(sub, hits, APP_URL, unsubUrl(sub.unsubToken));
    await sendEmail(sub.email, subject, html);
    sub.lastNotifiedAt = Date.now();
    sent++;
  }
  db.save();
  return sent;
}

// Automatic daily digest (fires only when there are new matching listings).
setInterval(() => { runDigest().then((n) => n && console.log(`[digest] sent ${n} email(s)`)); }, 24 * 60 * 60 * 1000);

// ---- serve the built front end in production (one service, one URL) ----
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "..", "web", "dist");
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) return res.status(404).json({ error: "not_found" });
    res.sendFile(path.join(DIST, "index.html"));
  });
  console.log("Serving built front end from web/dist");
}

app.listen(PORT, async () => {
  const card = (await getStripe()) ? "STRIPE" : "MOCK";
  console.log(`Llave API on http://localhost:${PORT}  (card: ${card}, email: ${emailMode()})`);
});

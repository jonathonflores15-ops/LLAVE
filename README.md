# Llave — Puerto Rico real estate (full stack)

React front end (Vite) + Node/Express API with a database, accounts, a **My Account / My
Reports / Pro** area, a server-enforced paywall, digital payments (card / Apple Pay / Google
Pay via Stripe), and email alerts for new matching listings.

```
llave-fullstack/
├─ server/       ← the API (Node + Express) — also serves the built app in production
├─ web/          ← the front end (React + Vite)
├─ package.json  ← build + start for deployment
├─ render.yaml   ← one-click-ish deploy blueprint for Render
└─ Dockerfile    ← for Railway / Fly / Cloud Run / anywhere
```

## What's new in this version
- **Map view** — a List / Map toggle on the home page plots the filtered properties on a map (free OpenStreetMap tiles, no API key). It **filters as you pan/zoom** — a badge shows how many properties are in the current view. Each property page shows its location too.
- **ZIP-code search** — type a ZIP (or the first 3 digits for a whole area) in the search box to see only what's available around there. It also matches municipality / sector / catastro text.
- **My Account page** — tap your email (top right) when signed in. It shows your **purchased
  reports** (open any of them), your **Pro** status, and a **Go Pro** upgrade.
- **One deployable service** — the Express server now also serves the built React app, so the
  whole thing goes online as a single URL. Deploy config included.

## Run it locally (two terminals — dev mode)
Install **Node.js** (LTS) from https://nodejs.org first.
- **Terminal 1 — API:** `cd server` → `npm install` → `npm start`
- **Terminal 2 — website:** `cd web` → `npm install` → `npm run dev` → open the printed link.

Everything works in mock mode with no accounts: buy a report with the mock card form,
subscribe for email alerts (emails are logged to `server/outbox.log`), and use Go Pro.

---

# Deploy it online (≈15 minutes)

Putting it on a real web address is also what makes **Apple Pay and Google Pay work for real**
(they're only allowed on a live HTTPS site).

> I can't create your hosting account or click deploy for you — that's tied to your own login
> and identity. But the project is fully deploy-ready; these are the exact steps.

## Step 1 — Put the code on GitHub
1. Make a free GitHub account and a new **empty** repository.
2. Upload this project to it (GitHub's website has an "upload files" button, or use Git).

## Step 2 — Deploy on Render (free)
1. Make a free account at https://render.com and connect your GitHub.
2. Click **New +  →  Blueprint**, pick your repo. Render reads `render.yaml` and sets it up
   as one web service (build: `npm run build`, start: `npm start`).
3. Click **Apply**. First build takes a few minutes. You'll get a URL like
   `https://llave.onrender.com`.
4. In the service's **Environment** tab, set `APP_URL` to that URL (used in email links).

That's it — your app is live. `JWT_SECRET` and `ADMIN_KEY` are auto-generated.

*Alternatives:* the included `Dockerfile` deploys the same way on **Railway**, **Fly.io**, or
**Google Cloud Run**.

## Step 3 — Turn on real card payments (Stripe)
1. Create a **Stripe** account, get your keys.
2. In Render → Environment, add `STRIPE_SECRET_KEY` (`sk_live_...` or `sk_test_...`).
3. In `web/.env` set `VITE_STRIPE_PUBLISHABLE_KEY` **before** you push — Vite bakes it in at
   build time (so set it, commit, redeploy). Card payments now work.

## Step 4 — Turn on Apple Pay & Google Pay
1. With Stripe live and your site deployed (HTTPS), go to Stripe Dashboard →
   **Settings → Payment Methods → Apple Pay** and **register your domain** (Stripe walks you
   through the verification file automatically). Google Pay needs no extra step.
2. On a real iPhone/Safari, Apple Pay now appears in checkout; on Android/Chrome, Google Pay.

## Step 5 — Turn on real emails (Resend)
1. Create a **Resend** account, verify your sending domain (SPF/DKIM — Resend guides you; this
   is what keeps mail out of spam).
2. In Render → Environment, add `RESEND_API_KEY` and `FROM_EMAIL` (an address on your verified
   domain). Alerts now send for real.

## ⚠️ One important note about data on the free tier
This app stores data in a file (`server/data.json`). Free hosting tiers use temporary disks,
so **accounts, orders, and subscribers reset when the service restarts or redeploys.** Fine for
testing. For production, either add a **persistent disk** (Render offers this on paid plans) or
swap the file store for a hosted database. It's an easy change — all storage lives in
`server/db.js`.

---

## Fire a test email alert (adds a listing → emails matching subscribers)
With the API reachable:
```
curl -X POST <your-url>/api/admin/listings ^
  -H "Content-Type: application/json" ^
  -d "{\"adminKey\":\"<your ADMIN_KEY>\",\"listing\":{\"kind\":\"sale\",\"use\":\"res\",\"muni\":\"San Juan\",\"sector\":\"Miramar\",\"type\":\"Casa\",\"beds\":3,\"baths\":2,\"area\":180,\"price\":420000,\"catastro\":\"041-099-100-01-001\"}}"
```
(locally, `<your-url>` is `http://localhost:3001` and ADMIN_KEY is `dev-admin`.)

## Real vs. sample data in the report
- **Flood zone is now LIVE** — pulled from FEMA's National Flood Hazard Layer (a free public
  API, no key). It shows the real zone for the property's coordinates, tagged "FEMA · live".
  If FEMA is briefly unreachable it falls back to an estimate so the report never breaks.
- **Title (Registro) and taxes (CRIM)** are still realistic sample data — Puerto Rico doesn't
  offer a clean public developer API for those, so they need scraping or a data partnership.
  The "verify" links open the real official sites.

## Reset the database
Delete `server/data.json` (recreated empty on next start).

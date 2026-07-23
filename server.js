# Copy this file to ".env" and fill in what you have.
PORT=3001
JWT_SECRET=change-me-to-a-long-random-string
APP_URL=http://localhost:5173

# ---- Card + Apple Pay + Google Pay (Stripe) ----
# Leave blank to run in MOCK mode (no real charge). Add your TEST secret key to go live.
STRIPE_SECRET_KEY=

# ---- Email alerts (Resend — https://resend.com) ----
# Leave blank to run in MOCK mode: emails are logged to server/outbox.log instead of sent.
RESEND_API_KEY=
FROM_EMAIL=Llave <alerts@your-verified-domain.com>

# Protects the admin endpoints (adding listings / sending the digest).
ADMIN_KEY=dev-admin

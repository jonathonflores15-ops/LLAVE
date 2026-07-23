import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Apple, CreditCard, Lock, X, ShieldCheck, CheckCircle2, Sparkles } from "lucide-react";
import { api } from "./api.js";

const C = { ink: "#14322F", slate: "#3A4A47", teal: "#0C4A4E", tealMid: "#12666E", sea: "#6FA093", seaLine: "#C7DAD3", sand: "#F2EEE5", sandDeep: "#E7DFCE", coral: "#E2674B", coralInk: "#A9401F", ok: "#2E7D5B", warn: "#B5791E", white: "#FFFFFF" };

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

const onlyDigits = (v) => v.replace(/\D/g, "");
const fmtCard = (v) => onlyDigits(v).slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
const fmtExp = (v) => { const d = onlyDigits(v).slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };
const brandOf = (v) => { const d = onlyDigits(v); return d[0] === "4" ? "Visa" : /^5[1-5]/.test(d) ? "Mastercard" : /^3[47]/.test(d) ? "Amex" : ""; };

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <span className="text-xs" style={{ color: C.slate, fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}

// ---- Stripe: card + Apple Pay + Google Pay via Payment Element ----
function StripeInner({ catastro, onPaid, onError, busy, setBusy }) {
  const stripe = useStripe();
  const elements = useElements();
  const [msg, setMsg] = useState("");
  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true); setMsg("");
    const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (error) { setMsg(error.message || "Payment error"); setBusy(false); onError && onError(); return; }
    if (paymentIntent && paymentIntent.status === "succeeded") {
      try { const r = await api.checkout({ kind: "report", catastro, method: "stripe", paymentIntentId: paymentIntent.id }); onPaid(r.accessToken); }
      catch (e) { setMsg("Could not finalize."); setBusy(false); onError && onError(); }
    } else setBusy(false);
  };
  return (
    <div>
      <PaymentElement />
      <button className="paybtn" disabled={busy} onClick={pay} style={{ marginTop: 12, background: C.coral, color: "#fff" }}>
        {busy ? <span className="spin" /> : <><Lock size={15} strokeWidth={2.4} /> Pay $19</>}
      </button>
      {msg && <p className="text-xs" style={{ color: C.coralInk, marginTop: 8, textAlign: "center", fontWeight: 600 }}>{msg}</p>}
    </div>
  );
}

function StripeCard({ catastro, onPaid, onError, busy, setBusy }) {
  const [cs, setCs] = useState(null);
  const [state, setState] = useState("loading");
  useEffect(() => {
    let ok = true;
    api.stripeIntent(catastro)
      .then((d) => { if (!ok) return; if (d.clientSecret) { setCs(d.clientSecret); setState("ready"); } else setState("error"); })
      .catch(() => ok && setState("error"));
    return () => { ok = false; };
  }, [catastro]);
  if (state === "loading") return <p className="text-xs" style={{ color: C.sea }}>Loading payment…</p>;
  if (state === "error" || !cs) return <p className="text-xs" style={{ color: C.coralInk }}>Could not start Stripe.</p>;
  return (
    <Elements stripe={stripePromise} options={{ clientSecret: cs, appearance: { theme: "flat", variables: { colorPrimary: C.teal } } }}>
      <StripeInner catastro={catastro} onPaid={onPaid} onError={onError} busy={busy} setBusy={setBusy} />
    </Elements>
  );
}

// ---- Mock card form (used when no Stripe key is set). Shows a demo Apple/Google Pay row. ----
function MockCard({ onPay, busy }) {
  const [num, setNum] = useState(""); const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState(""); const [name, setName] = useState(""); const [zip, setZip] = useState("");
  const brand = brandOf(num);
  const valid = onlyDigits(num).length >= 15 && exp.length === 5 && cvc.length >= 3;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <button className="paybtn" style={{ background: "#000", color: "#fff" }} disabled={busy} onClick={onPay}>
          {busy ? <span className="spin" /> : <><Apple size={16} strokeWidth={0} fill="#fff" /> <span style={{ fontWeight: 600 }}>Pay</span></>}
        </button>
        <button className="paybtn" style={{ background: "#fff", color: "#3c4043", border: "1px solid #dadce0" }} disabled={busy} onClick={onPay}>
          <span style={{ fontWeight: 700 }}><span style={{ color: "#4285F4" }}>G</span><span style={{ color: "#EA4335" }}>o</span><span style={{ color: "#FBBC05" }}>o</span><span style={{ color: "#4285F4" }}>g</span><span style={{ color: "#34A853" }}>l</span><span style={{ color: "#EA4335" }}>e</span> Pay</span>
        </button>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        <Field label="Card number">
          <div style={{ position: "relative" }}>
            <input className="pinput" inputMode="numeric" placeholder="1234 5678 9012 3456" value={num} onChange={(e) => setNum(fmtCard(e.target.value))} />
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.sea }}>
              {brand ? <span className="text-xs" style={{ fontWeight: 700, color: C.tealMid }}>{brand}</span> : <CreditCard size={16} />}
            </span>
          </div>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Field label="MM/YY"><input className="pinput" inputMode="numeric" placeholder="MM/YY" value={exp} onChange={(e) => setExp(fmtExp(e.target.value))} /></Field>
          <Field label="CVC"><input className="pinput" inputMode="numeric" placeholder="123" value={cvc} onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, 4))} /></Field>
          <Field label="ZIP"><input className="pinput" inputMode="numeric" placeholder="00901" value={zip} onChange={(e) => setZip(onlyDigits(e.target.value).slice(0, 5))} /></Field>
        </div>
        <Field label="Name on card"><input className="pinput" placeholder="—" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      </div>
      <button className="paybtn" style={{ marginTop: 14, background: valid && !busy ? C.coral : C.sandDeep, color: valid && !busy ? "#fff" : C.sea, cursor: valid && !busy ? "pointer" : "not-allowed" }} disabled={!valid || busy} onClick={onPay}>
        {busy ? <><span className="spin" /> Processing…</> : <><Lock size={15} strokeWidth={2.4} /> Pay $19</>}
      </button>
    </div>
  );
}

export function Checkout({ t, catastro, user, onPaid, onPro, onClose }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const cardLive = !!STRIPE_PK;

  const paid = (token) => { setDone(true); setTimeout(() => onPaid(token), 700); };
  const mockPay = async () => {
    setBusy(true); setErr("");
    try { const r = await api.checkout({ kind: "report", catastro, method: "mock" }); paid(r.accessToken); }
    catch (e) { setBusy(false); setErr(t.payErr); }
  };
  const goPro = async () => {
    if (!user) return onPro();
    setBusy(true); setErr("");
    try { await onPro(); } finally { setBusy(false); }
  };

  return (
    <div className="sheet-backdrop" onClick={() => !busy && onClose()}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t.checkout}>
        {done ? (
          <div style={{ textAlign: "center", padding: "26px 8px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: "#DFF0E7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <CheckCircle2 size={30} strokeWidth={2.2} style={{ color: C.ok }} />
            </div>
            <div className="text-base" style={{ fontWeight: 800 }}>{t.approved}</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
              <div>
                <div className="text-base" style={{ fontWeight: 800 }}>{t.checkout}</div>
                <div className="text-xs" style={{ color: C.slate, marginTop: 2 }}>{t.reportTitle}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 20, fontWeight: 700 }}>$19</span>
                <button aria-label={t.close} onClick={() => !busy && onClose()} style={{ border: "none", background: C.sand, cursor: "pointer", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
              </div>
            </div>

            {cardLive
              ? <StripeCard catastro={catastro} onPaid={paid} onError={() => setErr(t.payErr)} busy={busy} setBusy={setBusy} />
              : <MockCard onPay={mockPay} busy={busy} />}

            <button className="paybtn" style={{ marginTop: 10, background: "transparent", color: C.coralInk, border: `1px dashed #E9C6BB` }} disabled={busy} onClick={goPro}>
              <Sparkles size={15} /> {user ? t.goPro : t.proLogin}
            </button>

            {err && <p className="text-xs" style={{ textAlign: "center", color: C.coralInk, marginTop: 8, fontWeight: 600 }}>{err}</p>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, color: C.sea }}>
              <ShieldCheck size={13} /> <span className="text-xs" style={{ fontWeight: 600 }}>{t.secure}</span>
            </div>
            {!cardLive && <p className="text-xs" style={{ textAlign: "center", color: C.warn, marginTop: 6, fontWeight: 600 }}>{t.demo}</p>}
          </>
        )}
      </div>
    </div>
  );
}

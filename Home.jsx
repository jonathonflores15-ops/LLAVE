import React, { useState } from "react";
import { X, LogIn } from "lucide-react";
import { api, setToken } from "./api.js";

const C = { ink: "#14322F", teal: "#0C4A4E", sea: "#6FA093", seaLine: "#C7DAD3", coral: "#E2674B", coralInk: "#A9401F", sand: "#F2EEE5", white: "#FFFFFF" };
const T = {
  es: { login: "Iniciar sesión", register: "Crear cuenta", email: "Correo electrónico", pass: "Contraseña", go: "Continuar", toReg: "¿No tienes cuenta? Regístrate", toLog: "¿Ya tienes cuenta? Inicia sesión", close: "Cerrar",
    errors: { email_and_password_required: "Escribe correo y contraseña.", password_too_short: "La contraseña debe tener al menos 6 caracteres.", email_in_use: "Ese correo ya está registrado.", invalid_credentials: "Correo o contraseña incorrectos." } },
  en: { login: "Sign in", register: "Create account", email: "Email", pass: "Password", go: "Continue", toReg: "No account? Sign up", toLog: "Have an account? Sign in", close: "Close",
    errors: { email_and_password_required: "Enter email and password.", password_too_short: "Password must be at least 6 characters.", email_in_use: "That email is already registered.", invalid_credentials: "Wrong email or password." } },
};

export default function Auth({ lang = "es", onClose, onSuccess }) {
  const t = T[lang];
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const d = mode === "login" ? await api.login(email, pass) : await api.register(email, pass);
      setToken(d.token);
      onSuccess(d.user);
    } catch (e) {
      setErr(t.errors[e.message] || (lang === "es" ? "No se pudo continuar. ¿Está corriendo el servidor?" : "Could not continue. Is the server running?"));
    } finally { setBusy(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,30,28,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }} onClick={onClose}>
      <div style={{ background: C.white, width: "100%", maxWidth: 400, borderRadius: 18, padding: 22 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 className="text-base" style={{ fontWeight: 800, color: C.ink, margin: 0 }}>{mode === "login" ? t.login : t.register}</h3>
          <button aria-label={t.close} onClick={onClose} style={{ border: "none", background: C.sand, cursor: "pointer", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <input placeholder={t.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ border: `1px solid ${C.seaLine}`, borderRadius: 10, padding: "11px 12px", fontSize: 14 }} />
          <input placeholder={t.pass} type="password" value={pass} onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            style={{ border: `1px solid ${C.seaLine}`, borderRadius: 10, padding: "11px 12px", fontSize: 14 }} />
        </div>
        {err && <p className="text-xs" style={{ color: C.coralInk, marginTop: 8 }}>{err}</p>}
        <button disabled={busy} onClick={submit}
          style={{ width: "100%", marginTop: 14, border: "none", borderRadius: 12, padding: "12px", fontSize: 15, fontWeight: 700, cursor: "pointer", background: C.coral, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <LogIn size={16} /> {busy ? "…" : t.go}
        </button>
        <button onClick={() => { setErr(""); setMode(mode === "login" ? "register" : "login"); }}
          style={{ width: "100%", marginTop: 10, border: "none", background: "none", cursor: "pointer", color: C.teal, fontSize: 13, fontWeight: 600 }}>
          {mode === "login" ? t.toReg : t.toLog}
        </button>
      </div>
    </div>
  );
}

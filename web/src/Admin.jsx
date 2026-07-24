import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, X, Mail, Phone } from "lucide-react";
import { api } from "./api.js";

const C = {
  ink: "#14322F", slate: "#3A4A47", teal: "#0C4A4E", tealMid: "#12666E",
  sea: "#6FA093", seaLine: "#C7DAD3", sand: "#F2EEE5", sandDeep: "#E7DFCE",
  coral: "#E2674B", coralInk: "#A9401F", ok: "#2E7D5B", card: "#FDFCF9", white: "#FFFFFF",
};

const KEY = "llave_admin_key";
const money = (n) => (n || n === 0) ? "$" + Number(n).toLocaleString("en-US") : "—";

function Row({ s, onDecide, busyId }) {
  const busy = busyId === s.id;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.seaLine}`, borderRadius: 14, padding: 16, display: "flex", gap: 14 }}>
      {s.photos && s.photos[0] ? (
        <img src={s.photos[0]} alt="" style={{ width: 84, height: 84, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 84, height: 84, borderRadius: 10, flexShrink: 0, background: C.sand, display: "flex", alignItems: "center", justifyContent: "center", color: C.sea, fontSize: 11, fontWeight: 700 }}>sin foto</div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800 }}>{s.muni}{s.sector ? " · " + s.sector : ""}</span>
          <span className="text-xs" style={{ background: C.sand, color: C.teal, fontWeight: 700, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase" }}>{s.kind}</span>
        </div>
        <div className="text-sm" style={{ color: C.tealMid, fontWeight: 700, marginTop: 2 }}>{money(s.kind === "auction" ? s.bid : s.price)} · {s.type || "—"}</div>
        <div className="text-xs" style={{ color: C.sea, marginTop: 4, fontFamily: "ui-monospace, monospace" }}>{s.catastro}{s.zip ? " · ZIP " + s.zip : ""}</div>
        {s.description && <p className="text-sm" style={{ color: C.slate, marginTop: 6 }}>{s.description}</p>}
        <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }} className="text-xs">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.slate }}><Mail size={12} /> {s.contactEmail}</span>
          {s.contactPhone && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.slate }}><Phone size={12} /> {s.contactPhone}</span>}
        </div>
        {s.photos && s.photos.length > 1 && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {s.photos.slice(1).map((p, i) => <img key={i} src={p} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />)}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button disabled={busy} onClick={() => onDecide(s.id, "approve")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.ok, color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <Check size={14} /> Aprobar
          </button>
          <button disabled={busy} onClick={() => onDecide(s.id, "reject")} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.white, color: C.coralInk, border: `1px solid ${C.seaLine}`, borderRadius: 9, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <X size={14} /> Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Admin({ onBack }) {
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY) || "");
  const [entered, setEntered] = useState(() => !!sessionStorage.getItem(KEY));
  const [subs, setSubs] = useState([]);
  const [status, setStatus] = useState("idle");
  const [busyId, setBusyId] = useState(null);

  const load = (k) => {
    setStatus("loading");
    api.adminSubmissions(k).then((d) => { setSubs(d.submissions || []); setStatus("ok"); })
      .catch(() => { setStatus("error"); setEntered(false); sessionStorage.removeItem(KEY); });
  };

  useEffect(() => { if (entered && key) load(key); }, []); // eslint-disable-line

  const unlock = (e) => {
    e.preventDefault();
    sessionStorage.setItem(KEY, key);
    setEntered(true);
    load(key);
  };

  const decide = async (id, action) => {
    setBusyId(id);
    try {
      if (action === "approve") await api.adminApprove(id, key); else await api.adminReject(id, key);
      setSubs((s) => s.filter((x) => x.id !== id));
    } catch (e) { /* leave it in the list, key or network issue */ }
    finally { setBusyId(null); }
  };

  return (
    <div style={{ minHeight: "100%", color: C.ink }}>
      <header style={{ background: C.teal, color: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "13px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "rgba(255,255,255,.85)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <ArrowLeft size={16} strokeWidth={2.4} /> Volver
          </button>
          <span style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 20, fontWeight: 700 }}>Llave · Admin</span>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px 60px" }}>
        {!entered ? (
          <form onSubmit={unlock} style={{ maxWidth: 340, display: "grid", gap: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.sea }}>Admin key</label>
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} style={{ border: `1px solid ${C.seaLine}`, borderRadius: 10, padding: "10px 12px", fontSize: 14 }} />
            <button type="submit" style={{ background: C.teal, color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" }}>Entrar</button>
          </form>
        ) : (
          <>
            <h1 style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 24, fontWeight: 700, margin: 0 }}>Propiedades por revisar</h1>
            {status === "loading" && <p style={{ color: C.sea, fontWeight: 600, marginTop: 14 }}>Cargando…</p>}
            {status === "error" && <p style={{ color: C.coralInk, fontWeight: 700, marginTop: 14 }}>Llave incorrecta o error de conexión.</p>}
            {status === "ok" && subs.length === 0 && <p style={{ color: C.sea, fontWeight: 600, marginTop: 14 }}>No hay propiedades pendientes.</p>}
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {subs.map((s) => <Row key={s.id} s={s} onDecide={decide} busyId={busyId} />)}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

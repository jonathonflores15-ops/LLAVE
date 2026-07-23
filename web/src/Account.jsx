import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Globe, LogOut, Sparkles, FileText, ArrowUpRight, MapPin,
  ShieldCheck, CheckCircle2, Lock,
} from "lucide-react";
import { api } from "./api.js";

const C = {
  ink: "#14322F", slate: "#3A4A47", teal: "#0C4A4E", tealMid: "#12666E",
  sea: "#6FA093", seaLine: "#C7DAD3", sand: "#F2EEE5", sandDeep: "#E7DFCE",
  coral: "#E2674B", coralInk: "#A9401F", ok: "#2E7D5B", card: "#FDFCF9", white: "#FFFFFF",
};

const T = {
  es: {
    back: "Volver", account: "Mi cuenta", logout: "Cerrar sesión", member: "Miembro",
    proTitle: "Llave Pro", proMember: "Eres miembro Pro",
    proPitch: "Informes de propiedad ilimitados, sin pagar por cada uno.",
    proBenefit1: "Informes ilimitados", proBenefit2: "Sin cargos por informe", proBenefit3: "Acceso a todo tu historial",
    goPro: "Hazte Pro", perMo: "/mes",
    reportsTitle: "Mis informes", empty: "Aún no has comprado informes.",
    view: "Ver informe", loading: "Cargando…", errConn: "No se pudo conectar con el servidor.",
    rent: "Alquiler", sale: "En venta", auction: "Subasta",
  },
  en: {
    back: "Back", account: "My account", logout: "Sign out", member: "Member",
    proTitle: "Llave Pro", proMember: "You're a Pro member",
    proPitch: "Unlimited property reports, without paying per report.",
    proBenefit1: "Unlimited reports", proBenefit2: "No per-report charges", proBenefit3: "Access to your whole history",
    goPro: "Go Pro", perMo: "/mo",
    reportsTitle: "My reports", empty: "You haven't bought any reports yet.",
    view: "View report", loading: "Loading…", errConn: "Couldn't reach the server.",
    rent: "Rentals", sale: "For sale", auction: "Auction",
  },
};

const money = (n) => "$" + Number(n).toLocaleString("en-US");
const PRO_PRICE = "$9";

function ReportRow({ item, t, onOpen }) {
  const l = item.listing;
  if (!l) return null;
  const isAuction = l.kind === "auction";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.sand}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg, ${l.g[0]}, ${l.g[1]})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={18} color="#fff" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="text-sm" style={{ fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <MapPin size={12} style={{ color: C.sea, verticalAlign: "-1px" }} /> {l.muni} · {l.sector}
          </div>
          <div className="text-xs" style={{ color: C.sea, fontWeight: 600 }}>
            {money(isAuction ? l.bid : l.price)} · <span style={{ fontFamily: "ui-monospace, monospace" }}>{l.catastro}</span>
          </div>
        </div>
      </div>
      <button onClick={() => onOpen(l.catastro)} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, background: C.white, border: `1px solid ${C.seaLine}`, color: C.teal, borderRadius: 999, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
        {t.view} <ArrowUpRight size={13} />
      </button>
    </div>
  );
}

export default function Account({ lang, setLang, user, setUser, onBack, onOpen, onLogout }) {
  const t = T[lang];
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [proBusy, setProBusy] = useState(false);

  const load = () => {
    setStatus("loading");
    api.myReports().then((d) => { setData(d); setStatus("ok"); }).catch(() => setStatus("error"));
  };
  useEffect(() => { load(); }, [user]);

  const goPro = async () => {
    setProBusy(true);
    try { const r = await api.subscribePro(); setUser(r.user); load(); }
    catch (e) {} finally { setProBusy(false); }
  };

  const isPro = !!(user && user.pro);

  return (
    <div style={{ minHeight: "100%", color: C.ink }}>
      <header style={{ background: C.teal, color: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "13px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "rgba(255,255,255,.85)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <ArrowLeft size={16} strokeWidth={2.4} /> {t.back}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 20, fontWeight: 700 }}>Llave</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,.08)", padding: "3px", borderRadius: 9 }}>
              <Globe size={12} style={{ color: "rgba(255,255,255,.6)", marginLeft: 4 }} />
              <button onClick={() => setLang("es")} style={{ border: "none", background: lang === "es" ? "rgba(255,255,255,.16)" : "none", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: "3px 7px", borderRadius: 6, color: "#fff" }}>ES</button>
              <button onClick={() => setLang("en")} style={{ border: "none", background: lang === "en" ? "rgba(255,255,255,.16)" : "none", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: "3px 7px", borderRadius: 6, color: "#fff" }}>EN</button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "20px 20px 60px" }}>
        {/* Account header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 className="text-base" style={{ fontWeight: 800, margin: 0, fontSize: 22 }}>{t.account}</h1>
            <div className="text-sm" style={{ color: C.sea, fontWeight: 600, marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={onLogout} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.white, border: `1px solid ${C.seaLine}`, color: C.slate, borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <LogOut size={14} /> {t.logout}
          </button>
        </div>

        {/* Pro card */}
        <div style={{ marginTop: 18, background: isPro ? "#DFF0E7" : C.teal, borderRadius: 18, padding: "20px", color: isPro ? C.ink : "#fff", border: isPro ? `1px solid #B7DEC8` : "none" }}>
          {isPro ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Sparkles size={22} style={{ color: C.ok }} />
              <div>
                <div className="text-base" style={{ fontWeight: 800 }}>{t.proMember}</div>
                <div className="text-sm" style={{ color: C.slate }}>{t.proPitch}</div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={20} style={{ color: "#F3D9CF" }} />
                <h3 className="text-base" style={{ fontWeight: 800, margin: 0 }}>{t.proTitle}</h3>
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,.85)", marginTop: 6 }}>{t.proPitch}</p>
              <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
                {[t.proBenefit1, t.proBenefit2, t.proBenefit3].map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }} className="text-sm">
                    <CheckCircle2 size={15} style={{ color: "#F3D9CF" }} /> {b}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                <button onClick={goPro} disabled={proBusy} style={{ background: C.coral, color: "#fff", border: "none", borderRadius: 12, padding: "12px 22px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                  {proBusy ? "…" : t.goPro}
                </button>
                <span className="text-sm" style={{ color: "rgba(255,255,255,.85)" }}>{PRO_PRICE}<span className="text-xs">{t.perMo}</span></span>
              </div>
            </>
          )}
        </div>

        {/* My reports */}
        <div style={{ marginTop: 18, background: C.card, border: `1px solid ${C.seaLine}`, borderRadius: 18, padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <ShieldCheck size={16} style={{ color: C.teal }} />
            <h3 className="text-base" style={{ fontWeight: 800, margin: 0 }}>{t.reportsTitle}</h3>
          </div>
          {status === "loading" && <p className="text-sm" style={{ color: C.sea }}>{t.loading}</p>}
          {status === "error" && <p className="text-sm" style={{ color: C.coralInk, fontWeight: 600 }}>{t.errConn}</p>}
          {status === "ok" && (
            (data.reports && data.reports.length)
              ? <div>{data.reports.map((it, i) => <ReportRow key={i} item={it} t={t} onOpen={onOpen} />)}</div>
              : <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.sea, padding: "10px 0" }}>
                  <Lock size={15} /> <span className="text-sm" style={{ fontWeight: 600 }}>{t.empty}</span>
                </div>
          )}
        </div>
      </main>
    </div>
  );
}

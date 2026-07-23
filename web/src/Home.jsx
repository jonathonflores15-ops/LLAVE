import React, { useState, useEffect } from "react";
import {
  Search, MapPin, ShieldCheck, Landmark, Receipt, BedDouble, Bath, Maximize,
  ArrowUpRight, ChevronDown, Globe, Home as HomeIcon, Building2, Car, User, Sparkles,
  Mail, Check, List, Map as MapIcon, X,
} from "lucide-react";
import { api } from "./api.js";
import PropertiesMap from "./Map.jsx";

const REGISTRO = "https://ridpr.pr.gov";
const CRIM = "https://www.crimpr.net";

const C = {
  ink: "#14322F", slate: "#3A4A47", teal: "#0C4A4E", tealMid: "#12666E",
  sea: "#6FA093", seaLine: "#C7DAD3", sand: "#F2EEE5", sandDeep: "#E7DFCE",
  coral: "#E2674B", coralInk: "#A9401F", ok: "#2E7D5B", card: "#FDFCF9", white: "#FFFFFF",
};

const T = {
  es: { tag: "Bienes raíces de Puerto Rico", signin: "Iniciar sesión", pro: "Pro",
    heroA: "Toda propiedad de la isla,", heroB: "anclada a su número de catastro.",
    heroSub: "Alquiler, venta y subastas — residencial y comercial, con enlace directo al Registro de la Propiedad y al CRIM.",
    ph: "Municipio, sector o código postal", search: "Buscar", searchingFor: "Resultados para", clear: "Limpiar",
    rent: "Alquiler", sale: "En venta", auction: "Subasta", uAll: "Todos", uRes: "Residencial", uCom: "Comercial",
    fMuni: "Municipio", fPrice: "Precio", fType: "Tipo", showing: "Mostrando", of: "de", results: "propiedades",
    list: "Lista", map: "Mapa", perMo: "/mes", bid: "Puja inicial", cat: "Catastro", vTitle: "Título · Registro", vTax: "Contribuciones · CRIM",
    loading: "Cargando propiedades…", none: "No hay propiedades para esta búsqueda.",
    errTitle: "No se pudo conectar con el servidor", errBody: "Asegúrate de que el backend esté corriendo (carpeta server: npm start).",
    trust: "Cada propiedad enlaza al Registro y al CRIM." },
  en: { tag: "Puerto Rico real estate", signin: "Sign in", pro: "Pro",
    heroA: "Every property on the island,", heroB: "anchored to its cadastral number.",
    heroSub: "Rentals, sales, and auctions — residential and commercial, with direct links to the Property Registry and CRIM.",
    ph: "Municipality, sector, or ZIP code", search: "Search", searchingFor: "Results for", clear: "Clear",
    rent: "Rentals", sale: "For sale", auction: "Auction", uAll: "All", uRes: "Residential", uCom: "Commercial",
    fMuni: "Municipality", fPrice: "Price", fType: "Type", showing: "Showing", of: "of", results: "properties",
    list: "List", map: "Map", perMo: "/mo", bid: "Starting bid", cat: "Cadastre", vTitle: "Title · Registry", vTax: "Taxes · CRIM",
    loading: "Loading properties…", none: "No properties for this search.",
    errTitle: "Couldn't reach the server", errBody: "Make sure the backend is running (server folder: npm start).",
    trust: "Every property links to the Registry and CRIM." },
};

const money = (n) => "$" + Number(n).toLocaleString("en-US");

function Card({ item, t, onOpen }) {
  const com = item.use === "com";
  const isAuction = item.kind === "auction";
  const badge = isAuction ? { label: t.auction, bg: C.coral, fg: "#fff" } : { label: item.kind === "rent" ? t.rent : t.sale, bg: "rgba(255,255,255,.92)", fg: C.teal };
  return (
    <article className="llv-card" tabIndex={0} role="button"
      onClick={() => onOpen(item.catastro)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(item.catastro))}
      style={{ background: C.card, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.seaLine}`, cursor: "pointer" }}>
      <div style={{ position: "relative", height: 148, background: `linear-gradient(135deg, ${item.g[0]}, ${item.g[1]})` }}>
        <span className="chip-badge" style={{ background: badge.bg, color: badge.fg }}>{badge.label}</span>
        <span className="chip-badge-r" style={{ color: com ? "#3A4A47" : C.teal }}>
          {com ? <Building2 size={12} strokeWidth={2.4} /> : <HomeIcon size={12} strokeWidth={2.4} />}
          {com ? t.uCom : t.uRes}
        </span>
        <div style={{ position: "absolute", left: 12, bottom: 10, display: "flex", alignItems: "center", gap: 5, color: "#fff" }}>
          <MapPin size={14} strokeWidth={2.4} />
          <span className="text-sm" style={{ fontWeight: 600 }}>{item.muni}</span>
          <span className="text-sm" style={{ opacity: 0.82 }}>· {item.sector}</span>
        </div>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        {isAuction ? (
          <div>
            <div className="text-xs" style={{ color: C.coralInk, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{t.bid}</div>
            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 22, fontWeight: 700 }}>{money(item.bid)}</div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 22, fontWeight: 700 }}>{money(item.price)}</span>
            {item.kind === "rent" && <span className="text-sm" style={{ color: C.sea, fontWeight: 600 }}>{t.perMo}</span>}
          </div>
        )}
        <div className="text-sm" style={{ color: C.tealMid, fontWeight: 600, marginTop: 2 }}>{item.type}</div>
        <div className="text-sm" style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10 }}>
          {com ? (
            <>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Maximize size={14} style={{ color: C.sea }} /> {item.area} m²</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Car size={14} style={{ color: C.sea }} /> {item.parking}</span>
            </>
          ) : (
            <>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><BedDouble size={14} style={{ color: C.sea }} /> {item.beds}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Bath size={14} style={{ color: C.sea }} /> {item.baths}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Maximize size={14} style={{ color: C.sea }} /> {item.area} m²</span>
            </>
          )}
        </div>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${C.seaLine}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <span className="text-xs" style={{ color: C.sea, fontWeight: 600 }}>{t.cat}</span>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, fontWeight: 600, background: C.sand, padding: "2px 8px", borderRadius: 6, border: `1px solid ${C.sandDeep}` }}>{item.catastro}</span>
            {item.zip && <span className="text-xs" style={{ color: C.sea, fontWeight: 600 }}>· ZIP {item.zip}</span>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} onClick={(e) => e.stopPropagation()}>
            <a href={REGISTRO} target="_blank" rel="noopener noreferrer" className="chip-gov"><Landmark size={12} strokeWidth={2.2} /> {t.vTitle} <ArrowUpRight size={11} strokeWidth={2.4} /></a>
            <a href={CRIM} target="_blank" rel="noopener noreferrer" className="chip-gov"><Receipt size={12} strokeWidth={2.2} /> {t.vTax} <ArrowUpRight size={11} strokeWidth={2.4} /></a>
          </div>
        </div>
      </div>
    </article>
  );
}

function AlertsSignup({ lang, kind, use }) {
  const S = {
    es: { title: "Recibe nuevas propiedades por correo", sub: "Te avisamos automaticamente cuando aparezcan propiedades que coincidan con tu busqueda.", email: "tu@correo.com", muni: "Municipio (opcional)", price: "Precio max. (opcional)", btn: "Suscribirme", ok: "Listo! Te avisaremos por correo.", err: "Escribe un correo valido." },
    en: { title: "Get new listings by email", sub: "We'll notify you automatically when properties matching your search show up.", email: "you@email.com", muni: "Municipality (optional)", price: "Max price (optional)", btn: "Subscribe", ok: "Done! We'll email you.", err: "Enter a valid email." },
  }[lang];
  const [email, setEmail] = useState("");
  const [muni, setMuni] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [state, setState] = useState("idle");
  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) { setState("err"); return; }
    setState("busy");
    try { await api.subscribeAlerts({ email, kind, use, muni, maxPrice: maxPrice || null }); setState("ok"); }
    catch (e) { setState("err"); }
  };
  const ip = { border: `1px solid ${C.seaLine}`, borderRadius: 10, padding: "11px 12px", fontSize: 14, width: "100%", boxSizing: "border-box" };
  return (
    <div style={{ marginTop: 44, background: C.teal, borderRadius: 18, padding: "22px 20px", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Mail size={18} /><h3 className="text-base" style={{ fontWeight: 800, margin: 0 }}>{S.title}</h3>
      </div>
      <p className="text-sm" style={{ color: "rgba(255,255,255,.82)", marginTop: 6, maxWidth: 520 }}>{S.sub}</p>
      {state === "ok" ? (
        <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, background: "#DFF0E7", color: C.ok, fontWeight: 700, padding: "10px 14px", borderRadius: 10 }}>
          <Check size={16} /> {S.ok}
        </div>
      ) : (
        <div style={{ marginTop: 14, display: "grid", gap: 10, maxWidth: 520 }}>
          <input type="email" placeholder={S.email} value={email} onChange={(e) => setEmail(e.target.value)} style={ip} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder={S.muni} value={muni} onChange={(e) => setMuni(e.target.value)} style={ip} />
            <input inputMode="numeric" placeholder={S.price} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))} style={ip} />
          </div>
          <button onClick={submit} disabled={state === "busy"} style={{ background: C.coral, color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            {state === "busy" ? "..." : S.btn}
          </button>
          {state === "err" && <p className="text-xs" style={{ color: "#FBE3DA", fontWeight: 600 }}>{S.err}</p>}
        </div>
      )}
    </div>
  );
}

export default function Home({ lang, setLang, user, onLogin, onLogout, onOpen, onAccount }) {
  const t = T[lang];
  const [kind, setKind] = useState("sale");
  const [use, setUse] = useState("all");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [mode, setMode] = useState("list"); // list | map
  const [data, setData] = useState({ listings: [], total: 0, totals: { rent: 0, sale: 0, auction: 0 } });
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    const params = { kind, use };
    if (q) params.q = q;
    api.listings(params)
      .then((d) => { if (alive) { setData(d); setStatus("ok"); } })
      .catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [kind, use, q]);

  const applySearch = () => setQ(qInput.trim());
  const clearSearch = () => { setQ(""); setQInput(""); };

  const tabs = [["rent", t.rent], ["sale", t.sale], ["auction", t.auction]];
  const uses = [["all", t.uAll], ["res", t.uRes], ["com", t.uCom]];

  return (
    <div style={{ minHeight: "100%", color: C.ink }}>
      <style>{`
        .llv-card{transition:transform .18s ease, box-shadow .18s ease;}
        .llv-card:hover{transform:translateY(-3px); box-shadow:0 14px 34px -16px rgba(12,74,78,.5);}
        .llv-card:focus-visible{outline:2px solid ${C.coral};outline-offset:2px;}
        .chip-gov{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:5px 9px;border-radius:999px;cursor:pointer;text-decoration:none;border:1px solid ${C.seaLine};color:${C.teal};background:${C.white};transition:background-color .15s,color .15s,border-color .15s;}
        .chip-gov:hover{background:${C.teal};color:#fff;border-color:${C.teal};}
        .chip-badge{position:absolute;top:10px;left:12px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:3px 9px;border-radius:999px;}
        .chip-badge-r{position:absolute;top:10px;right:12px;display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.94);}
        .llv-tab{position:relative;background:none;border:none;cursor:pointer;font-size:15px;font-weight:600;padding:10px 2px;}
        .llv-select{appearance:none;-webkit-appearance:none;background:${C.white};border:1px solid ${C.seaLine};color:${C.ink};font-size:13px;font-weight:600;padding:8px 30px 8px 12px;border-radius:10px;cursor:pointer;width:100%;}
        .langbtn{border:none;background:none;cursor:pointer;font-size:12px;font-weight:700;padding:3px 7px;border-radius:6px;color:rgba(255,255,255,.62);}
        .langbtn.on{background:rgba(255,255,255,.16);color:#fff;}
        .useseg{border:none;cursor:pointer;font-size:13px;font-weight:600;padding:7px 14px;border-radius:999px;display:inline-flex;align-items:center;gap:6px;}
        .acct{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;border-radius:10px;padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer;}
        .modebtn{border:1px solid ${C.seaLine};background:${C.white};color:${C.tealMid};cursor:pointer;font-size:13px;font-weight:700;padding:7px 12px;display:inline-flex;align-items:center;gap:6px;}
        @media (prefers-reduced-motion: reduce){ .llv-card{transition:none;} .llv-card:hover{transform:none;} }
      `}</style>

      <header style={{ background: C.teal, color: "#fff" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            <span style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 26, fontWeight: 700 }}>Llave</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,.7)", fontWeight: 500 }}>{t.tag}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,.08)", padding: "3px", borderRadius: 9 }}>
              <Globe size={13} style={{ color: "rgba(255,255,255,.6)", marginLeft: 4 }} />
              <button className={`langbtn ${lang === "es" ? "on" : ""}`} onClick={() => setLang("es")}>ES</button>
              <button className={`langbtn ${lang === "en" ? "on" : ""}`} onClick={() => setLang("en")}>EN</button>
            </div>
            {user ? (
              <button className="acct" onClick={onAccount} title={user.email}>
                {user.pro ? <Sparkles size={14} /> : <User size={14} />}
                <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.pro ? t.pro : user.email}</span>
              </button>
            ) : (
              <button className="acct" onClick={onLogin}><User size={14} /> {t.signin}</button>
            )}
          </div>
        </div>
      </header>

      <section style={{ position: "relative", background: `linear-gradient(160deg, ${C.teal} 0%, ${C.tealMid} 100%)`, color: "#fff", paddingBottom: 40 }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "40px 20px 34px" }}>
          <h1 style={{ fontFamily: "ui-serif, Georgia, serif", fontWeight: 700, lineHeight: 1.1, fontSize: "clamp(28px, 5vw, 46px)", margin: 0, maxWidth: 760 }}>
            {t.heroA}<br /><span style={{ color: "#F3D9CF" }}>{t.heroB}</span>
          </h1>
          <p className="text-base" style={{ color: "rgba(255,255,255,.82)", maxWidth: 580, marginTop: 14 }}>{t.heroSub}</p>
          <div style={{ marginTop: 22, display: "flex", gap: 10, maxWidth: 640, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px", display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 12, padding: "0 14px" }}>
              <Search size={18} style={{ color: C.sea }} />
              <input placeholder={t.ph} value={qInput} onChange={(e) => setQInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
                style={{ border: "none", outline: "none", padding: "13px 0", width: "100%", fontSize: 14, color: C.ink, background: "transparent" }} />
            </div>
            <button onClick={applySearch} style={{ background: C.coral, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, padding: "0 24px", borderRadius: 12 }}>{t.search}</button>
          </div>
          <div className="text-xs" style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,.72)" }}>
            <ShieldCheck size={14} /> {t.trust}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "6px 20px 0" }}>
        <div style={{ display: "flex", gap: 26, borderBottom: `1px solid ${C.seaLine}` }}>
          {tabs.map(([k, label]) => {
            const on = kind === k;
            return (
              <button key={k} onClick={() => setKind(k)} className="llv-tab" style={{ color: on ? C.teal : C.sea }}>
                {label}
                <span className="text-xs" style={{ marginLeft: 6, color: on ? C.coral : C.sea, fontWeight: 700 }}>{(data.totals[k] || 0).toLocaleString("en-US")}</span>
                {on && <span style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 3, background: C.coral, borderRadius: 3 }} />}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, padding: "16px 0 2px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {uses.map(([u, label]) => {
              const on = use === u;
              return (
                <button key={u} onClick={() => setUse(u)} className="useseg" style={{ background: on ? C.teal : C.white, color: on ? "#fff" : C.tealMid, border: `1px solid ${on ? C.teal : C.seaLine}` }}>
                  {u === "res" && <HomeIcon size={13} strokeWidth={2.3} />}
                  {u === "com" && <Building2 size={13} strokeWidth={2.3} />}
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="modebtn" onClick={() => setMode("list")} style={{ background: mode === "list" ? C.teal : C.white, color: mode === "list" ? "#fff" : C.tealMid, borderColor: mode === "list" ? C.teal : C.seaLine }}><List size={14} /> {t.list}</button>
            <button className="modebtn" onClick={() => setMode("map")} style={{ background: mode === "map" ? C.teal : C.white, color: mode === "map" ? "#fff" : C.tealMid, borderColor: mode === "map" ? C.teal : C.seaLine }}><MapIcon size={14} /> {t.map}</button>
          </div>
        </div>

        {q && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.sand, border: `1px solid ${C.sandDeep}`, borderRadius: 999, padding: "5px 12px", marginTop: 10 }}>
            <span className="text-sm" style={{ color: C.slate, fontWeight: 600 }}>{t.searchingFor} “{q}”</span>
            <button onClick={clearSearch} style={{ border: "none", background: "none", cursor: "pointer", color: C.coralInk, display: "inline-flex", alignItems: "center" }}><X size={14} /></button>
          </div>
        )}

        {status === "ok" && (
          <div className="text-sm" style={{ color: C.sea, fontWeight: 600, padding: "10px 0 16px" }}>
            {t.showing} <b style={{ color: C.ink }}>{data.listings.length}</b>{use === "all" && !q ? ` ${t.of} ${(data.total || 0).toLocaleString("en-US")}` : ""} {t.results}
          </div>
        )}
      </div>

      <main style={{ maxWidth: 1160, margin: "0 auto", padding: "0 20px 60px" }}>
        {status === "loading" && <p style={{ color: C.sea, fontWeight: 600 }}>{t.loading}</p>}
        {status === "error" && (
          <div style={{ background: "#FBEDE7", border: `1px solid #E9C6BB`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontWeight: 800, color: C.coralInk }}>{t.errTitle}</div>
            <div className="text-sm" style={{ color: C.slate, marginTop: 4 }}>{t.errBody}</div>
          </div>
        )}
        {status === "ok" && data.listings.length === 0 && (
          <p style={{ color: C.sea, fontWeight: 600 }}>{t.none}</p>
        )}
        {status === "ok" && data.listings.length > 0 && mode === "list" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 18 }}>
            {data.listings.map((item) => <Card key={item.id} item={item} t={t} onOpen={onOpen} />)}
          </div>
        )}
        {status === "ok" && data.listings.length > 0 && mode === "map" && (
          <PropertiesMap listings={data.listings} onOpen={onOpen} height={480} lang={lang} />
        )}

        <AlertsSignup lang={lang} kind={kind} use={use} />
      </main>
    </div>
  );
}

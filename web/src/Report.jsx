import React, { useState, useEffect } from "react";
import {
  ArrowLeft, MapPin, ShieldCheck, Landmark, Receipt, Lock, LockOpen,
  Check, CheckCircle2, FileText, TrendingUp, AlertTriangle, ArrowUpRight,
  Home as HomeIcon, Building2, BedDouble, Bath, Maximize, Car, Globe, Sparkles,
} from "lucide-react";
import { api, getAccess, setAccess } from "./api.js";
import { Checkout } from "./pay.jsx";
import PropertiesMap from "./Map.jsx";

const ICONS = { FileText, Landmark, Receipt, AlertTriangle, TrendingUp };
const C = {
  ink: "#14322F", slate: "#3A4A47", teal: "#0C4A4E", tealMid: "#12666E",
  sea: "#6FA093", seaLine: "#C7DAD3", sand: "#F2EEE5", sandDeep: "#E7DFCE",
  coral: "#E2674B", coralInk: "#A9401F", ok: "#2E7D5B", warn: "#B5791E", card: "#FDFCF9", white: "#FFFFFF",
};

const T = {
  es: { back: "Volver", res: "Residencial", com: "Comercial", rent: "Alquiler", sale: "En venta", auction: "Subasta",
    perMo: "/mes", loading: "Cargando…", errConn: "No se pudo conectar con el servidor.",
    freeTag: "Gratis", freeTitle: "Verificación pública", freeSub: "Número de catastro y enlaces oficiales — siempre gratis.",
    teaserLabel: "Estimado de mercado",
    cat: "Catastro", vTitle: "Título · Registro", vTax: "Contribuciones · CRIM",
    reportTitle: "Informe de Propiedad", reportSub: "Todo el estudio de debida diligencia en un solo lugar.",
    includes: "Incluye", unlock: "Desbloquear informe", unlocked: "Informe desbloqueado", oneTime: "pago único",
    proHint: "Gratis con Llave Pro", source: "Fuente", lockedNote: "Desbloquea para ver los resultados verificados.",
    verified: "Compilado de fuentes oficiales",
    dataDisc: "La información de esta propiedad proviene de fuentes públicas y de terceros en internet, y puede no reflejar el estado más reciente (precio, disponibilidad o si ya se vendió/alquiló). Verifica siempre directamente con la fuente, el vendedor o el corredor antes de tomar una decisión.",
    disc: "El informe compila registros públicos. Para certeza legal, solicita las certificaciones oficiales enlazadas. No constituye garantía de título ni asesoría legal.",
    checkout: "Pagar", orCard: "o paga con tarjeta", approved: "¡Pago aprobado!", secure: "Pago cifrado y seguro",
    demo: "Tarjeta en modo demo — sin cargo real (añade tu llave de Stripe para cobrar).", close: "Cerrar",
    goPro: "Hazte Pro — informes ilimitados", proLogin: "Inicia sesión para Pro", payErr: "No se pudo completar el pago.", simulated: "simulado" },
  en: { back: "Back", res: "Residential", com: "Commercial", rent: "Rentals", sale: "For sale", auction: "Auction",
    perMo: "/mo", loading: "Loading…", errConn: "Couldn't reach the server.",
    freeTag: "Free", freeTitle: "Public verification", freeSub: "Cadastral number and official links — always free.",
    teaserLabel: "Market estimate",
    cat: "Cadastre", vTitle: "Title · Registry", vTax: "Taxes · CRIM",
    reportTitle: "Property Report", reportSub: "Your full due-diligence check in one place.",
    includes: "Includes", unlock: "Unlock report", unlocked: "Report unlocked", oneTime: "one-time",
    proHint: "Free with Llave Pro", source: "Source", lockedNote: "Unlock to see the verified results.",
    verified: "Compiled from official sources",
    dataDisc: "Property information is gathered from public and third-party sources on the web and may not reflect the most current status (price, availability, or whether it has already sold or rented). Always verify directly with the source, seller, or agent before making a decision.",
    disc: "This report compiles public records. For legal certainty, request the official certifications linked. It is not a title guarantee or legal advice.",
    checkout: "Checkout", orCard: "or pay with card", approved: "Payment approved!", secure: "Encrypted, secure payment",
    demo: "Card in demo mode — no real charge (add your Stripe key to charge).", close: "Close",
    goPro: "Go Pro — unlimited reports", proLogin: "Sign in for Pro", payErr: "Couldn't complete the payment.", simulated: "simulated" },
};

const money = (n) => "$" + Number(n).toLocaleString("en-US");

function Row({ row, lang, unlocked }) {
  const label = row[lang][0];
  const value = row[lang][1];
  const has = unlocked && value !== undefined;
  const toneColor = row.tone === "ok" ? C.ok : row.tone === "warn" ? C.warn : C.ink;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.sand}` }}>
      <span className="text-sm" style={{ color: C.slate }}>{label}</span>
      {has ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, textAlign: "right" }}>
          {row.tone === "ok" && <Check size={13} strokeWidth={2.6} style={{ color: C.ok }} />}
          {row.tone === "warn" && <AlertTriangle size={12} strokeWidth={2.4} style={{ color: C.warn }} />}
          <span className="text-sm" style={{ fontWeight: 600, color: toneColor, fontFamily: row.mono ? "ui-monospace, monospace" : "inherit" }}>{value}</span>
        </span>
      ) : (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.sea }}>
          <Lock size={12} strokeWidth={2.4} /><span style={{ letterSpacing: 2, fontWeight: 700 }}>••••</span>
        </span>
      )}
    </div>
  );
}

function Section({ sec, lang, unlocked }) {
  const Icon = ICONS[sec.icon] || FileText;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon size={15} strokeWidth={2.2} style={{ color: C.teal }} />
          <h4 className="text-sm" style={{ fontWeight: 700, color: C.ink }}>{sec[lang]}</h4>
        </div>
        {unlocked && sec.src && (
          <a href={sec.src} target="_blank" rel="noopener noreferrer" className="chip-gov">
            {T[lang].source}: {sec.srcLabel[lang]} <ArrowUpRight size={11} strokeWidth={2.4} />
          </a>
        )}
      </div>
      {sec.rows.map((r, i) => <Row key={i} row={r} lang={lang} unlocked={unlocked} />)}
    </div>
  );
}

export default function Report({ lang, setLang, user, setUser, onLogin, onLogout, catastro, onBack }) {
  const t = T[lang];
  const [listing, setListing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [full, setFull] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState("loading");
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    let alive = true;
    setStatus("loading"); setUnlocked(false); setFull(null); setPreview(null);
    api.reportPreview(catastro)
      .then((p) => {
        if (!alive) return;
        setListing(p.listing); setPreview(p); setStatus("ok");
        const l = p.listing;
        document.title = `${l.type} en ${l.muni}${l.sector ? " · " + l.sector : ""} — Llave`;
        return api.report(catastro, getAccess(catastro) || undefined)
          .then((rep) => { if (alive) { setFull(rep); setUnlocked(true); } })
          .catch(() => {});
      })
      .catch(() => { if (alive) setStatus("error"); });
    return () => { alive = false; };
  }, [catastro, user]);

  const onPaid = async (accessToken) => {
    if (accessToken) setAccess(catastro, accessToken);
    try { const rep = await api.report(catastro, accessToken); setFull(rep); setUnlocked(true); } catch (e) {}
    setSheet(false);
  };

  const onPro = async () => {
    if (!user) { onLogin(); return; }
    try {
      const r = await api.subscribePro(); setUser(r.user);
      const rep = await api.report(catastro); setFull(rep); setUnlocked(true);
    } catch (e) {}
    setSheet(false);
  };

  if (status === "loading") return <div style={{ padding: 40, color: C.sea, fontWeight: 600 }}>{t.loading}</div>;
  if (status === "error" || !listing) return (
    <div style={{ padding: 24 }}>
      <button onClick={onBack} className="chip-gov"><ArrowLeft size={12} /> {t.back}</button>
      <p style={{ color: C.coralInk, fontWeight: 700, marginTop: 16 }}>{t.errConn}</p>
      <style>{`.chip-gov{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;padding:6px 10px;border-radius:999px;cursor:pointer;border:1px solid ${C.seaLine};color:${C.teal};background:${C.white};}`}</style>
    </div>
  );

  const com = listing.use === "com";
  const isAuction = listing.kind === "auction";
  const txLabel = isAuction ? t.auction : listing.kind === "rent" ? t.rent : t.sale;
  const sections = unlocked && full ? full.sections : (preview?.sections || []);

  return (
    <div style={{ minHeight: "100%", color: C.ink }}>
      <style>{`
        .chip-gov{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:4px 9px;border-radius:999px;cursor:pointer;text-decoration:none;border:1px solid ${C.seaLine};color:${C.teal};background:${C.white};transition:background-color .15s,color .15s,border-color .15s;}
        .chip-gov:hover{background:${C.teal};color:#fff;border-color:${C.teal};}
        .langbtn{border:none;background:none;cursor:pointer;font-size:12px;font-weight:700;padding:3px 7px;border-radius:6px;color:rgba(255,255,255,.62);}
        .langbtn.on{background:rgba(255,255,255,.16);color:#fff;}
        .cta{width:100%;border:none;cursor:pointer;border-radius:12px;padding:13px 16px;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;}
        .backlink{display:inline-flex;align-items:center;gap:6px;color:rgba(255,255,255,.85);text-decoration:none;font-size:13px;font-weight:600;background:none;border:none;cursor:pointer;}
        .paybtn{width:100%;border:none;border-radius:12px;padding:13px 16px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;}
        .pinput{width:100%;box-sizing:border-box;border:1px solid ${C.seaLine};border-radius:10px;padding:11px 12px;font-size:14px;color:${C.ink};background:${C.white};outline:none;}
        .pinput:focus{border-color:${C.teal};}
        .sheet-backdrop{position:fixed;inset:0;background:rgba(10,30,28,.5);display:flex;align-items:flex-end;justify-content:center;z-index:50;}
        .sheet{background:${C.white};width:100%;max-width:460px;border-radius:20px 20px 0 0;padding:20px;max-height:94vh;overflow:auto;box-shadow:0 -10px 40px -12px rgba(0,0,0,.4);}
        .spin{width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:999px;display:inline-block;animation:sp .7s linear infinite;}
        @keyframes sp{to{transform:rotate(360deg);}}
        @media (min-width:520px){ .sheet-backdrop{align-items:center;} .sheet{border-radius:20px;} }
      `}</style>

      <header style={{ background: C.teal, color: "#fff" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "13px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button className="backlink" onClick={onBack}><ArrowLeft size={16} strokeWidth={2.4} /> {t.back}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 20, fontWeight: 700 }}>Llave</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,.08)", padding: "3px", borderRadius: 9 }}>
              <Globe size={12} style={{ color: "rgba(255,255,255,.6)", marginLeft: 4 }} />
              <button className={`langbtn ${lang === "es" ? "on" : ""}`} onClick={() => setLang("es")}>ES</button>
              <button className={`langbtn ${lang === "en" ? "on" : ""}`} onClick={() => setLang("en")}>EN</button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "18px 20px 60px" }}>
        <div style={{ background: C.card, border: `1px solid ${C.seaLine}`, borderRadius: 18, overflow: "hidden" }}>
          <div style={{ position: "relative", height: 180, background: `linear-gradient(135deg, ${listing.g[0]}, ${listing.g[1]})`, overflow: "hidden" }}>
            {listing.photos && listing.photos[0] && (
              <img src={listing.photos[0]} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <span style={{ position: "absolute", top: 12, left: 14, background: isAuction ? C.coral : "rgba(255,255,255,.94)", color: isAuction ? "#fff" : C.teal, fontSize: 11, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 999 }}>{txLabel}</span>
            <span style={{ position: "absolute", top: 12, right: 14, display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,.94)", color: com ? "#3A4A47" : C.teal, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>
              {com ? <Building2 size={12} strokeWidth={2.4} /> : <HomeIcon size={12} strokeWidth={2.4} />} {com ? t.com : t.res}
            </span>
            <div style={{ position: "absolute", left: 14, bottom: 12, display: "flex", alignItems: "center", gap: 5, color: "#fff" }}>
              <MapPin size={15} strokeWidth={2.4} /><span style={{ fontWeight: 700 }}>{listing.muni}</span><span style={{ opacity: 0.85 }}>· {listing.sector}</span>
            </div>
          </div>
          <div style={{ padding: "16px 18px 18px" }}>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 26, fontWeight: 700 }}>{money(isAuction ? listing.bid : listing.price)}</span>
            {listing.kind === "rent" && <span className="text-sm" style={{ color: C.sea, fontWeight: 600 }}> {t.perMo}</span>}
            <div className="text-sm" style={{ color: C.tealMid, fontWeight: 600, marginTop: 2 }}>{listing.type}</div>
            <div className="text-sm" style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 10 }}>
              {com ? (
                <>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Maximize size={14} style={{ color: C.sea }} /> {listing.area} m²</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Car size={14} style={{ color: C.sea }} /> {listing.parking}</span>
                </>
              ) : (
                <>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><BedDouble size={14} style={{ color: C.sea }} /> {listing.beds}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Bath size={14} style={{ color: C.sea }} /> {listing.baths}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Maximize size={14} style={{ color: C.sea }} /> {listing.area} m²</span>
                </>
              )}
            </div>
          </div>
        </div>

        {listing.photos && listing.photos.length > 1 && (
          <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto" }}>
            {listing.photos.slice(1).map((p, i) => (
              <img key={i} src={p} alt="" loading="lazy" style={{ width: 100, height: 74, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: `1px solid ${C.seaLine}` }} />
            ))}
          </div>
        )}

        {listing.lat && listing.lng && (
          <div style={{ marginTop: 14 }}>
            <PropertiesMap listings={[listing]} height={200} interactivePopup={false} showCount={false} lang={lang} />
          </div>
        )}

        <div style={{ background: C.card, border: `1px solid ${C.seaLine}`, borderRadius: 18, padding: "16px 18px", marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
            <ShieldCheck size={16} strokeWidth={2.2} style={{ color: C.teal }} />
            <h3 className="text-base" style={{ fontWeight: 700, margin: 0 }}>{t.freeTitle}</h3>
            <span style={{ background: "#DFF0E7", color: C.ok, fontSize: 11, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 999 }}>{t.freeTag}</span>
          </div>
          <p className="text-sm" style={{ color: C.slate, marginBottom: 12 }}>{t.freeSub}</p>
          {listing.kind !== "rent" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <span className="text-xs" style={{ color: C.sea, fontWeight: 600 }}>{t.cat}</span>
              <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, fontWeight: 600, background: C.sand, padding: "2px 8px", borderRadius: 6, border: `1px solid ${C.sandDeep}` }}>{listing.catastro}</span>
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <a href="https://karibe.ridpr.pr.gov/client/" target="_blank" rel="noopener noreferrer" className="chip-gov"><Landmark size={12} strokeWidth={2.2} /> {t.vTitle} <ArrowUpRight size={11} strokeWidth={2.4} /></a>
            <a href="https://www.crimpr.net" target="_blank" rel="noopener noreferrer" className="chip-gov"><Receipt size={12} strokeWidth={2.2} /> {t.vTax} <ArrowUpRight size={11} strokeWidth={2.4} /></a>
          </div>
          {preview?.teaser && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "10px 12px", background: C.sand, borderRadius: 10 }}>
              <TrendingUp size={14} strokeWidth={2.2} style={{ color: C.teal, flexShrink: 0 }} />
              <span className="text-sm" style={{ color: C.slate }}>{t.teaserLabel}: <b style={{ color: C.ink, fontFamily: "ui-monospace, monospace" }}>{preview.teaser[lang]}</b></span>
            </div>
          )}
          <p className="text-xs" style={{ color: C.sea, marginTop: 12, lineHeight: 1.5 }}>{t.dataDisc}</p>
        </div>

        <div style={{ background: C.white, border: `1.5px solid ${unlocked ? C.ok : C.teal}`, borderRadius: 18, padding: "18px", marginTop: 14, boxShadow: "0 10px 30px -18px rgba(12,74,78,.5)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: unlocked ? "#DFF0E7" : C.sand, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {unlocked ? <LockOpen size={17} strokeWidth={2.2} style={{ color: C.ok }} /> : <Lock size={17} strokeWidth={2.2} style={{ color: C.teal }} />}
              </div>
              <div>
                <h3 className="text-base" style={{ fontWeight: 800, margin: 0 }}>{t.reportTitle}</h3>
                <p className="text-xs" style={{ color: C.slate, margin: 0 }}>{t.reportSub}</p>
              </div>
            </div>
            {unlocked && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#DFF0E7", color: C.ok, fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 999, whiteSpace: "nowrap" }}><CheckCircle2 size={13} strokeWidth={2.4} /> {t.unlocked}</span>}
          </div>

          {preview?.includes && (
            <div style={{ marginTop: 14, background: C.sand, borderRadius: 12, padding: "12px 14px" }}>
              <div className="text-xs" style={{ color: C.sea, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 8 }}>{t.includes}</div>
              <div style={{ display: "grid", gap: 7 }}>
                {preview.includes[lang].map((line, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check size={14} strokeWidth={2.6} style={{ color: C.ok, flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: C.ink }}>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!unlocked && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 30, fontWeight: 800 }}>$19</span>
                <span className="text-sm" style={{ color: C.sea, fontWeight: 600 }}>{t.oneTime}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.coralInk, fontSize: 12, fontWeight: 700, background: "#FBEDE7", padding: "2px 8px", borderRadius: 999 }}><Sparkles size={12} strokeWidth={2.4} /> {t.proHint}</span>
              </div>
              <button className="cta" style={{ background: C.coral, color: "#fff" }} onClick={() => setSheet(true)}>
                <Lock size={16} strokeWidth={2.4} /> {t.unlock} · $19
              </button>
              <p className="text-xs" style={{ textAlign: "center", color: C.sea, marginTop: 8 }}>{t.lockedNote}</p>
            </div>
          )}

          <div style={{ marginTop: 4 }}>
            {sections.map((sec, i) => <Section key={i} sec={sec} lang={lang} unlocked={unlocked} />)}
          </div>

          {unlocked && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 7, color: C.ok }}>
              <CheckCircle2 size={15} strokeWidth={2.3} /><span className="text-sm" style={{ fontWeight: 700 }}>{t.verified}</span>
            </div>
          )}
          <p className="text-xs" style={{ color: C.sea, marginTop: 14, lineHeight: 1.5, paddingTop: 12, borderTop: `1px solid ${C.sand}` }}>{t.disc}</p>
        </div>
      </main>

      {sheet && (
        <Checkout t={t} catastro={catastro} user={user}
          onPaid={onPaid} onPro={onPro} onClose={() => setSheet(false)} />
      )}
    </div>
  );
}

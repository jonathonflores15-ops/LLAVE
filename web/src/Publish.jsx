import React, { useState } from "react";
import {
  ArrowLeft, Globe, Camera, X, CheckCircle2, Home as HomeIcon, Building2,
} from "lucide-react";
import { api } from "./api.js";

const C = {
  ink: "#14322F", slate: "#3A4A47", teal: "#0C4A4E", tealMid: "#12666E",
  sea: "#6FA093", seaLine: "#C7DAD3", sand: "#F2EEE5", sandDeep: "#E7DFCE",
  coral: "#E2674B", coralInk: "#A9401F", ok: "#2E7D5B", card: "#FDFCF9", white: "#FFFFFF",
};

const MAX_PHOTOS = 6;

const T = {
  es: {
    back: "Volver", title: "Publica tu propiedad", sub: "Gratis. La revisamos antes de publicarla — normalmente en 1–2 días.",
    kind: "Tipo de transacción", rent: "Alquiler", sale: "En venta", auction: "Subasta",
    use: "Uso", uRes: "Residencial", uCom: "Comercial",
    muni: "Municipio*", sector: "Sector / barrio", type: "Tipo de propiedad (ej. Apartamento, Casa, Local)",
    price: "Precio", priceRent: "Precio mensual", bid: "Puja inicial",
    beds: "Habitaciones", baths: "Baños", area: "Área (m²)", parking: "Estacionamientos",
    zip: "Código postal", catastro: "Número de catastro*", catastroHelp: "¿No lo sabes? Búscalo gratis en",
    photos: "Fotos", photosHelp: `Hasta ${MAX_PHOTOS} fotos, solo tuyas o con permiso del dueño.`,
    addPhotos: "Añadir fotos",
    desc: "Descripción", descPh: "Cuéntanos sobre la propiedad…",
    contactEmail: "Tu correo*", contactPhone: "Tu teléfono",
    submit: "Enviar para revisión", submitting: "Enviando…",
    okTitle: "¡Recibido!", okBody: "Vamos a revisar tu propiedad y la publicaremos pronto. Te contactaremos si necesitamos algo más.",
    another: "Publicar otra", errGeneric: "No se pudo enviar. Revisa los campos requeridos e intenta de nuevo.",
    required: "*Campos requeridos",
  },
  en: {
    back: "Back", title: "List your property", sub: "Free. We review it before it goes live — usually within 1–2 days.",
    kind: "Transaction type", rent: "Rental", sale: "For sale", auction: "Auction",
    use: "Use", uRes: "Residential", uCom: "Commercial",
    muni: "Municipality*", sector: "Sector / neighborhood", type: "Property type (e.g. Apartment, House, Retail space)",
    price: "Price", priceRent: "Monthly rent", bid: "Starting bid",
    beds: "Bedrooms", baths: "Bathrooms", area: "Area (m²)", parking: "Parking spots",
    zip: "ZIP code", catastro: "Cadastral number*", catastroHelp: "Don't know it? Look it up free at",
    photos: "Photos", photosHelp: `Up to ${MAX_PHOTOS} photos — only ones you own or have permission to use.`,
    addPhotos: "Add photos",
    desc: "Description", descPh: "Tell us about the property…",
    contactEmail: "Your email*", contactPhone: "Your phone",
    submit: "Submit for review", submitting: "Submitting…",
    okTitle: "Got it!", okBody: "We'll review your property and publish it soon. We'll reach out if we need anything else.",
    another: "List another", errGeneric: "Couldn't submit. Check the required fields and try again.",
    required: "*Required fields",
  },
};

function resizePhoto(file, maxW = 1400, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const field = { border: `1px solid ${C.seaLine}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, width: "100%", boxSizing: "border-box", fontFamily: "inherit", color: C.ink };
const label = { fontSize: 12, fontWeight: 700, color: C.sea, marginBottom: 5, display: "block" };

function Field({ children }) { return <div style={{ minWidth: 0 }}>{children}</div>; }

export default function Publish({ lang, setLang, onBack }) {
  const t = T[lang];
  const [kind, setKind] = useState("sale");
  const [use, setUse] = useState("res");
  const [form, setForm] = useState({ muni: "", sector: "", type: "", price: "", bid: "", beds: "", baths: "", area: "", parking: "", zip: "", catastro: "", description: "", contactEmail: "", contactPhone: "" });
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | busy | ok | error
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onPickPhotos = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS - photos.length);
    const encoded = await Promise.all(files.map((f) => resizePhoto(f).catch(() => null)));
    setPhotos((p) => [...p, ...encoded.filter(Boolean)].slice(0, MAX_PHOTOS));
    e.target.value = "";
  };
  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("busy"); setErr("");
    try {
      await api.submitListing({
        kind, use, muni: form.muni, sector: form.sector, type: form.type,
        price: kind !== "auction" ? Number(form.price) || undefined : undefined,
        bid: kind === "auction" ? Number(form.bid) || undefined : undefined,
        beds: use === "res" ? Number(form.beds) || undefined : undefined,
        baths: use === "res" ? Number(form.baths) || undefined : undefined,
        area: Number(form.area) || undefined,
        parking: use === "com" ? Number(form.parking) || undefined : undefined,
        zip: form.zip, catastro: form.catastro, photos,
        description: form.description, contactEmail: form.contactEmail, contactPhone: form.contactPhone,
      });
      setStatus("ok");
    } catch (e2) { setStatus("error"); setErr(e2?.data?.error || "error"); }
  };

  const reset = () => {
    setForm({ muni: "", sector: "", type: "", price: "", bid: "", beds: "", baths: "", area: "", parking: "", zip: "", catastro: "", description: "", contactEmail: "", contactPhone: "" });
    setPhotos([]); setStatus("idle");
  };

  return (
    <div style={{ minHeight: "100%", color: C.ink }}>
      <style>{`
        .llv-seg{border:none;cursor:pointer;font-size:13px;font-weight:700;padding:9px 16px;border-radius:999px;display:inline-flex;align-items:center;gap:6px;}
        .llv-photo{position:relative;width:84px;height:84px;border-radius:10px;overflow:hidden;border:1px solid ${C.seaLine};flex-shrink:0;}
        .llv-photo img{width:100%;height:100%;object-fit:cover;display:block;}
        .llv-photo button{position:absolute;top:3px;right:3px;background:rgba(20,50,47,.7);border:none;border-radius:999px;color:#fff;width:20px;height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;}
        .llv-addphoto{width:84px;height:84px;border-radius:10px;border:1.5px dashed ${C.seaLine};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:${C.sea};font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;background:${C.sand};}
      `}</style>

      <header style={{ background: C.teal, color: "#fff" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "13px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
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

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "22px 20px 60px" }}>
        <h1 style={{ fontFamily: "ui-serif, Georgia, serif", fontSize: 26, fontWeight: 700, margin: 0 }}>{t.title}</h1>
        <p className="text-sm" style={{ color: C.slate, marginTop: 6 }}>{t.sub}</p>

        {status === "ok" ? (
          <div style={{ marginTop: 24, background: "#DFF0E7", border: "1px solid #B7DEC8", borderRadius: 16, padding: 22, textAlign: "center" }}>
            <CheckCircle2 size={30} style={{ color: C.ok }} />
            <h3 style={{ fontWeight: 800, marginTop: 10 }}>{t.okTitle}</h3>
            <p className="text-sm" style={{ color: C.slate, maxWidth: 420, margin: "6px auto 0" }}>{t.okBody}</p>
            <button onClick={reset} style={{ marginTop: 16, background: C.teal, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}>{t.another}</button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ marginTop: 20, display: "grid", gap: 16 }}>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["rent", t.rent], ["sale", t.sale], ["auction", t.auction]].map(([k, l]) => (
                <button type="button" key={k} onClick={() => setKind(k)} className="llv-seg"
                  style={{ background: kind === k ? C.teal : C.white, color: kind === k ? "#fff" : C.tealMid, border: `1px solid ${kind === k ? C.teal : C.seaLine}` }}>{l}</button>
              ))}
              <span style={{ width: 1, background: C.seaLine, margin: "0 4px" }} />
              {[["res", t.uRes, HomeIcon], ["com", t.uCom, Building2]].map(([k, l, Icon]) => (
                <button type="button" key={k} onClick={() => setUse(k)} className="llv-seg"
                  style={{ background: use === k ? C.teal : C.white, color: use === k ? "#fff" : C.tealMid, border: `1px solid ${use === k ? C.teal : C.seaLine}` }}>
                  <Icon size={13} strokeWidth={2.3} /> {l}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field><label style={label}>{t.muni}</label><input required style={field} value={form.muni} onChange={set("muni")} /></Field>
              <Field><label style={label}>{t.sector}</label><input style={field} value={form.sector} onChange={set("sector")} /></Field>
            </div>

            <Field><label style={label}>{t.type}</label><input style={field} value={form.type} onChange={set("type")} /></Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {kind === "auction" ? (
                <Field><label style={label}>{t.bid}</label><input type="number" min="0" style={field} value={form.bid} onChange={set("bid")} /></Field>
              ) : (
                <Field><label style={label}>{kind === "rent" ? t.priceRent : t.price}</label><input type="number" min="0" style={field} value={form.price} onChange={set("price")} /></Field>
              )}
              <Field><label style={label}>{t.area}</label><input type="number" min="0" style={field} value={form.area} onChange={set("area")} /></Field>
            </div>

            {use === "res" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field><label style={label}>{t.beds}</label><input type="number" min="0" style={field} value={form.beds} onChange={set("beds")} /></Field>
                <Field><label style={label}>{t.baths}</label><input type="number" min="0" style={field} value={form.baths} onChange={set("baths")} /></Field>
              </div>
            ) : (
              <Field><label style={label}>{t.parking}</label><input type="number" min="0" style={field} value={form.parking} onChange={set("parking")} /></Field>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field><label style={label}>{t.zip}</label><input style={field} value={form.zip} onChange={set("zip")} /></Field>
              <Field>
                <label style={label}>{t.catastro}</label>
                <input required style={field} value={form.catastro} onChange={set("catastro")} placeholder="000-000-000-00-000" />
              </Field>
            </div>
            <p className="text-xs" style={{ color: C.sea, marginTop: -8 }}>
              {t.catastroHelp} <a href="https://www.crimpr.net" target="_blank" rel="noopener noreferrer" style={{ color: C.tealMid, fontWeight: 700 }}>CRIM</a>
            </p>

            <Field>
              <label style={label}>{t.photos}</label>
              <p className="text-xs" style={{ color: C.sea, marginTop: 0, marginBottom: 8 }}>{t.photosHelp}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {photos.map((p, i) => (
                  <div className="llv-photo" key={i}>
                    <img src={p} alt="" />
                    <button type="button" onClick={() => removePhoto(i)}><X size={12} /></button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <label className="llv-addphoto">
                    <Camera size={18} />
                    {t.addPhotos}
                    <input type="file" accept="image/*" multiple onChange={onPickPhotos} style={{ display: "none" }} />
                  </label>
                )}
              </div>
            </Field>

            <Field>
              <label style={label}>{t.desc}</label>
              <textarea rows={4} style={{ ...field, resize: "vertical" }} placeholder={t.descPh} value={form.description} onChange={set("description")} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field><label style={label}>{t.contactEmail}</label><input required type="email" style={field} value={form.contactEmail} onChange={set("contactEmail")} /></Field>
              <Field><label style={label}>{t.contactPhone}</label><input style={field} value={form.contactPhone} onChange={set("contactPhone")} /></Field>
            </div>

            <div>
              <button type="submit" disabled={status === "busy"} style={{ background: C.coral, color: "#fff", border: "none", borderRadius: 12, padding: "13px 22px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                {status === "busy" ? t.submitting : t.submit}
              </button>
              <p className="text-xs" style={{ color: C.sea, marginTop: 8 }}>{t.required}</p>
              {status === "error" && <p className="text-xs" style={{ color: C.coralInk, fontWeight: 700, marginTop: 4 }}>{t.errGeneric}</p>}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

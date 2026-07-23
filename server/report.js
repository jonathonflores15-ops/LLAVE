// Builds a due-diligence style report for a listing.
// Values are deterministic per property (seeded from the catastro) so they stay
// stable across requests. This stands in for real data feeds / manual research.

const COASTAL = new Set(["San Juan", "Rincón", "Dorado", "Carolina", "Mayagüez", "Arecibo", "Isabela", "Cabo Rojo", "Ponce"]);
const HISTORIC = new Set(["Viejo San Juan", "Distrito Histórico", "Centro"]);
const STREETS = ["Calle Sol", "Calle Luna", "Calle del Cristo", "Calle Fortaleza", "Ave. Ashford", "Calle Loíza"];
const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
const compactM = (n) => "$" + (n / 1e6).toFixed(2) + "M";

export function buildReport(l) {
  const rnd = seedFrom(l.catastro);
  const isAuction = l.kind === "auction";
  const coastal = COASTAL.has(l.muni);
  const historic = HISTORIC.has(l.sector);

  const year = 2015 + Math.floor(rnd() * 10);
  const mi = Math.floor(rnd() * 12);
  const hasMortgage = isAuction ? false : rnd() > 0.5;
  const baseVal = l.price ? (l.kind === "rent" ? l.price * 200 : l.price) : (l.bid || 200000);
  const assessed = Math.round((baseVal * (0.028 + rnd() * 0.012)) / 100) * 100;
  const low = compactM(baseVal * 0.94);
  const high = compactM(baseVal * 1.07);

  const useLabel = { es: l.use === "com" ? "Comercial" : "Residencial", en: l.use === "com" ? "Commercial" : "Residential" };

  const comps = [0, 1, 2].map((i) => {
    const st = STREETS[Math.floor(rnd() * STREETS.length)];
    const v = compactM(baseVal * (0.85 + rnd() * 0.3));
    const a = Math.round((l.area || 150) * (0.85 + rnd() * 0.3));
    const m = Math.floor(rnd() * 12), y = 2025 + Math.floor(rnd() * 2);
    return { st, v, a, m, y };
  });

  const sections = [
    {
      icon: "FileText", es: "Catastro e identificación", en: "Cadastre & identification",
      rows: [
        { es: ["Número de catastro", l.catastro], en: ["Cadastral number", l.catastro], mono: true },
        { es: ["Uso", useLabel.es], en: ["Use", useLabel.en] },
        { es: ["Cabida registral", (l.area || "—") + " m²"], en: ["Registered area", (l.area || "—") + " m²"] },
        { es: ["Finca (Registro)", "Finca " + (1000 + Math.floor(rnd() * 9000)).toLocaleString("en-US")], en: ["Folio (Registry)", "Folio " + (1000 + Math.floor(rnd() * 9000)).toLocaleString("en-US")], mono: true },
      ],
    },
    {
      icon: "Landmark", es: "Título · Registro de la Propiedad", en: "Title · Property Registry",
      src: "https://ridpr.pr.gov", srcLabel: { es: "Registro", en: "Registry" },
      rows: [
        isAuction
          ? { es: ["Estado del título", "En proceso de ejecución"], en: ["Title status", "In foreclosure process"], tone: "warn" }
          : { es: ["Estado del título", "Inscrito · 1 titular"], en: ["Title status", "Recorded · 1 owner"], tone: "ok" },
        { es: ["Última transacción", "Compraventa · " + MONTHS_ES[mi] + " " + year], en: ["Last transaction", "Sale · " + MONTHS_EN[mi] + " " + year] },
        hasMortgage
          ? { es: ["Hipotecas vigentes", "1 inscrita"], en: ["Active mortgages", "1 recorded"], tone: "warn" }
          : { es: ["Hipotecas vigentes", "Ninguna"], en: ["Active mortgages", "None"], tone: "ok" },
        isAuction
          ? { es: ["Embargos / gravámenes", "Ejecución de sentencia"], en: ["Liens / encumbrances", "Judgment lien"], tone: "warn" }
          : { es: ["Embargos / gravámenes", "Ninguno"], en: ["Liens / encumbrances", "None"], tone: "ok" },
      ],
    },
    {
      icon: "Receipt", es: "Contribuciones · CRIM", en: "Property taxes · CRIM",
      src: "https://www.crimpr.net", srcLabel: { es: "CRIM", en: "CRIM" },
      rows: [
        { es: ["Valor tasado (CRIM)", money(assessed)], en: ["Assessed value (CRIM)", money(assessed)] },
        isAuction
          ? { es: ["Estado de deuda", "Deuda contributiva pendiente"], en: ["Debt status", "Outstanding tax debt"], tone: "warn" }
          : { es: ["Estado de deuda", "Al día · $0"], en: ["Debt status", "Current · $0"], tone: "ok" },
        { es: ["Exoneración residencial", l.use === "res" && l.kind !== "auction" ? "Posible" : "No aplica"], en: ["Residential exemption", l.use === "res" && l.kind !== "auction" ? "Possible" : "N/A"] },
      ],
    },
    {
      icon: "AlertTriangle", es: "Riesgos", en: "Risk flags",
      src: "https://msc.fema.gov", srcLabel: { es: "FEMA", en: "FEMA" },
      rows: [
        coastal
          ? { es: ["Zona inundable", "Zona AE · riesgo moderado"], en: ["Flood zone", "Zone AE · moderate risk"], tone: "warn" }
          : { es: ["Zona inundable", "Zona X · riesgo mínimo"], en: ["Flood zone", "Zone X · minimal risk"], tone: "ok" },
        historic
          ? { es: ["Zona histórica", "Sí · aplican restricciones"], en: ["Historic zone", "Yes · restrictions apply"], tone: "warn" }
          : { es: ["Zona histórica", "No"], en: ["Historic zone", "No"], tone: "ok" },
      ],
    },
    {
      icon: "TrendingUp", es: "Valoración y comparables", en: "Valuation & comparables",
      rows: [
        { es: ["Estimado de mercado", low + " – " + high], en: ["Market estimate", low + " – " + high] },
        ...comps.map((c) => ({
          es: ["Comp · " + c.st, c.v + " · " + c.a + " m² · " + MONTHS_ES[c.m] + " " + c.y],
          en: ["Comp · " + c.st, c.v + " · " + c.a + " m² · " + MONTHS_EN[c.m] + " " + c.y],
        })),
      ],
    },
  ];

  return { catastro: l.catastro, sections };
}

// Locked preview: same sections/labels but no values, plus the "includes" checklist.
export function buildPreview(l) {
  const full = buildReport(l);
  const sections = full.sections.map((s) => ({
    icon: s.icon, es: s.es, en: s.en,
    rows: s.rows.map((r) => ({ es: [r.es[0]], en: [r.en[0]] })),
  }));
  return {
    catastro: l.catastro,
    includes: {
      es: ["Estado de título y titular inscrito", "Hipotecas, embargos y gravámenes", "Deuda y valor tasado (CRIM)", "Zona inundable e histórica", "Estimado de mercado y comparables"],
      en: ["Title status & owner of record", "Mortgages, liens & encumbrances", "Debt & assessed value (CRIM)", "Flood & historic zone", "Market estimate & comparables"],
    },
    sections,
  };
}

// Live flood zone from FEMA's National Flood Hazard Layer (NFHL) — public, no API key.
// Degrades gracefully: on timeout / network error / no coverage it returns null and the
// caller keeps the estimated value, so reports never hang or break.
const CACHE = new Map();
const HIGH = new Set(["A", "AE", "AH", "AO", "AR", "A99", "V", "VE", "VO"]);

function describe(code) {
  const c = String(code || "").toUpperCase();
  if (HIGH.has(c)) return { code: c, tone: "warn", es: `Zona ${c} · riesgo alto`, en: `Zone ${c} · high risk` };
  if (c.startsWith("X")) return { code: c, tone: "ok", es: `Zona ${c} · riesgo mínimo`, en: `Zone ${c} · minimal risk` };
  if (c === "D") return { code: c, tone: null, es: "Zona D · sin determinar", en: "Zone D · undetermined" };
  return { code: c, tone: null, es: `Zona ${c}`, en: `Zone ${c}` };
}

export async function floodZone(lat, lng) {
  if (lat == null || lng == null) return null;
  const key = `${(+lat).toFixed(4)},${(+lng).toFixed(4)}`;
  if (CACHE.has(key)) return CACHE.get(key);
  const url = `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?geometry=${lng},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY&returnGeometry=false&f=json`;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 4500);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) return null;
    const data = await res.json();
    const attr = data && data.features && data.features[0] && data.features[0].attributes;
    if (!attr || !attr.FLD_ZONE) { CACHE.set(key, null); return null; } // mapped, but not in a special flood area
    const out = describe(attr.FLD_ZONE);
    CACHE.set(key, out);
    return out;
  } catch (e) {
    clearTimeout(to);
    return null; // timeout / offline -> caller keeps the estimate
  }
}

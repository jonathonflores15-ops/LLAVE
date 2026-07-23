// Static catalog. In production this would live in a database table.
export const LISTINGS = [
  { id: "r1", kind: "rent", muni: "San Juan", sector: "Condado", type: "Apartamento", use: "res", beds: 1, baths: 1, area: 68, price: 1850, catastro: "041-062-115-08-001", zip: "00907", lat: 18.4577, lng: -66.0776, g: ["#12666E", "#6FA093"] },
  { id: "r2", kind: "rent", muni: "San Juan", sector: "Hato Rey", type: "Oficina", use: "com", area: 180, parking: 6, price: 3200, catastro: "045-071-208-03-011", zip: "00918", lat: 18.4193, lng: -66.0630, g: ["#155E62", "#8FBBA9"] },
  { id: "r3", kind: "rent", muni: "Rincón", sector: "Puntas", type: "Casa", use: "res", beds: 2, baths: 2, area: 96, price: 2400, catastro: "187-004-233-11-004", zip: "00677", lat: 18.3620, lng: -67.2500, g: ["#1B7A83", "#8FBBA9"] },
  { id: "r4", kind: "rent", muni: "San Juan", sector: "Santurce", type: "Local comercial", use: "com", area: 95, parking: 2, price: 2100, catastro: "042-059-133-07-006", zip: "00909", lat: 18.4510, lng: -66.0713, g: ["#12666E", "#79AEA0"] },
  { id: "r5", kind: "rent", muni: "Caguas", sector: "Turabo", type: "Casa", use: "res", beds: 3, baths: 2, area: 140, price: 1500, catastro: "122-011-090-14-021", zip: "00725", lat: 18.2341, lng: -66.0360, g: ["#0C4A4E", "#5F9488"] },
  { id: "s1", kind: "sale", muni: "Dorado", sector: "Dorado Beach", type: "Villa", use: "res", beds: 4, baths: 4, area: 310, price: 895000, catastro: "066-019-054-02-007", zip: "00646", lat: 18.4700, lng: -66.2730, g: ["#12666E", "#79AEA0"] },
  { id: "s2", kind: "sale", muni: "San Juan", sector: "Milla de Oro", type: "Edificio de oficinas", use: "com", area: 640, parking: 18, price: 2450000, catastro: "045-072-210-01-002", zip: "00918", lat: 18.4210, lng: -66.0685, g: ["#155E62", "#93BEB1"] },
  { id: "s3", kind: "sale", muni: "San Juan", sector: "Viejo San Juan", type: "Casa colonial", use: "res", beds: 3, baths: 3, area: 245, price: 1250000, catastro: "040-088-201-05-012", zip: "00901", lat: 18.4655, lng: -66.1057, g: ["#0C4A4E", "#6FA093"] },
  { id: "s4", kind: "sale", muni: "Carolina", sector: "Zona Industrial", type: "Nave / almacén", use: "com", area: 900, parking: 12, price: 780000, catastro: "091-014-320-05-019", zip: "00983", lat: 18.4060, lng: -65.9820, g: ["#12666E", "#7FA99B"] },
  { id: "s5", kind: "sale", muni: "Ponce", sector: "Distrito Histórico", type: "Casa", use: "res", beds: 3, baths: 2, area: 178, price: 265000, catastro: "113-027-140-09-033", zip: "00730", lat: 18.0110, lng: -66.6140, g: ["#155E62", "#79AEA0"] },
  { id: "s6", kind: "sale", muni: "Ponce", sector: "Centro", type: "Local comercial", use: "com", area: 150, parking: 3, price: 198000, catastro: "113-028-142-09-041", zip: "00716", lat: 18.0115, lng: -66.6141, g: ["#0C4A4E", "#6FA093"] },
  { id: "a1", kind: "auction", muni: "Bayamón", sector: "Santa Juanita", type: "Casa · REO", use: "res", beds: 3, baths: 2, area: 155, bid: 142000, catastro: "021-033-118-06-044", zip: "00956", lat: 18.3900, lng: -66.1580, date: "15 sep 2026", edicto: "2026-CD-04417", source: "Banco Popular", url: "https://www.auction.com/residential/pr", g: ["#C24A2C", "#E79878"] },
  { id: "a2", kind: "auction", muni: "Mayagüez", sector: "Centro", type: "Local · REO", use: "com", area: 220, parking: 4, bid: 165000, catastro: "097-006-401-02-013", zip: "00680", lat: 18.2010, lng: -67.1390, date: "18 sep 2026", edicto: "2026-CD-04988", source: "Oriental Bank", url: "https://www.edictosysubastas.com/", g: ["#B8492B", "#EFA98C"] },
  { id: "a3", kind: "auction", muni: "Arecibo", sector: "Hato Arriba", type: "Casa · ejecución", use: "res", beds: 3, baths: 1, area: 132, bid: 88500, catastro: "007-012-260-13-009", zip: "00612", lat: 18.4450, lng: -66.7000, date: "22 sep 2026", edicto: "ISCI2025-00891", source: "Tribunal de PR", url: "https://www.edictosysubastas.com/", g: ["#A9401F", "#E2674B"] },
  { id: "a4", kind: "auction", muni: "Guaynabo", sector: "Garden Hills", type: "Condo · REO", use: "res", beds: 2, baths: 2, area: 110, bid: 210000, catastro: "025-044-077-04-018", zip: "00966", lat: 18.4000, lng: -66.1080, date: "29 sep 2026", edicto: "2026-CD-05123", source: "FirstBank", url: "https://www.auction.com/residential/pr", g: ["#B8492B", "#EFA98C"] },
];

export const KIND_TOTALS = { rent: 214, sale: 1386, auction: 57 };

export const getListing = (idOrCatastro) =>
  LISTINGS.find((l) => l.id === idOrCatastro || l.catastro === idOrCatastro) || null;

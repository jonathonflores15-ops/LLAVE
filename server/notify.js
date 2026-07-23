const money = (n) => "$" + Number(n).toLocaleString("en-US");

// Does a listing match a subscriber's saved preferences?
export function matches(prefs = {}, l) {
  if (prefs.kind && prefs.kind !== "any" && l.kind !== prefs.kind) return false;
  if (prefs.use && prefs.use !== "all" && l.use !== prefs.use) return false;
  if (prefs.muni && l.muni.toLowerCase() !== String(prefs.muni).toLowerCase()) return false;
  const price = l.kind === "auction" ? l.bid : l.price;
  if (prefs.maxPrice && price > Number(prefs.maxPrice)) return false;
  return true;
}

const card = (l) => {
  const price = l.kind === "auction" ? l.bid : l.price;
  const label = l.kind === "rent" ? "/mo" : "";
  return `
    <tr><td style="padding:12px 0;border-bottom:1px solid #E7DFCE;">
      <div style="font:700 15px ui-sans-serif,Arial;color:#14322F;">${l.muni} · ${l.sector}</div>
      <div style="font:600 13px ui-sans-serif,Arial;color:#12666E;">${l.type}</div>
      <div style="font:700 18px ui-monospace,monospace;color:#14322F;margin-top:2px;">${money(price)}<span style="font:600 12px ui-sans-serif,Arial;color:#6FA093;">${label}</span></div>
      <div style="font:600 12px ui-monospace,monospace;color:#6FA093;margin-top:4px;">Catastro ${l.catastro}</div>
    </td></tr>`;
};

export function listingsEmail(sub, listings, appUrl, unsubUrl) {
  const rows = listings.map(card).join("");
  const subject = `${listings.length} nueva${listings.length > 1 ? "s" : ""} propiedad${listings.length > 1 ? "es" : ""} en Llave`;
  const html = `
  <div style="max-width:560px;margin:0 auto;background:#F2EEE5;padding:24px;font-family:ui-sans-serif,Arial;">
    <div style="font:700 26px ui-serif,Georgia,serif;color:#0C4A4E;">Llave</div>
    <p style="color:#3A4A47;font-size:14px;">Nuevas propiedades que coinciden con lo que buscas:</p>
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;padding:0 16px;"><tbody>
      <tr><td style="padding:4px 16px;">${rows ? `<table style="width:100%;">${rows}</table>` : "<p>Sin novedades por ahora.</p>"}</td></tr>
    </tbody></table>
    <a href="${appUrl}" style="display:inline-block;margin-top:16px;background:#E2674B;color:#fff;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:10px;">Ver en Llave</a>
    <p style="color:#6FA093;font-size:11px;margin-top:20px;">Recibes esto porque te suscribiste a alertas de Llave. <a href="${unsubUrl}" style="color:#6FA093;">Cancelar suscripción</a>.</p>
  </div>`;
  return { subject, html };
}

export function welcomeEmail(appUrl, unsubUrl) {
  const subject = "Estás suscrito a las alertas de Llave";
  const html = `
  <div style="max-width:560px;margin:0 auto;background:#F2EEE5;padding:24px;font-family:ui-sans-serif,Arial;">
    <div style="font:700 26px ui-serif,Georgia,serif;color:#0C4A4E;">Llave</div>
    <p style="color:#14322F;font-size:15px;font-weight:600;">¡Listo! Te avisaremos cuando haya nuevas propiedades que coincidan con lo que buscas.</p>
    <a href="${appUrl}" style="display:inline-block;margin-top:12px;background:#E2674B;color:#fff;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:10px;">Explorar propiedades</a>
    <p style="color:#6FA093;font-size:11px;margin-top:20px;"><a href="${unsubUrl}" style="color:#6FA093;">Cancelar suscripción</a></p>
  </div>`;
  return { subject, html };
}

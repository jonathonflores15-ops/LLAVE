const TOKEN_KEY = "llave_token";
const ACCESS_KEY = "llave_access";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

const accessMap = () => { try { return JSON.parse(localStorage.getItem(ACCESS_KEY) || "{}"); } catch { return {}; } };
export const getAccess = (cat) => accessMap()[cat] || null;
export const setAccess = (cat, tok) => { const m = accessMap(); m[cat] = tok; localStorage.setItem(ACCESS_KEY, JSON.stringify(m)); };

async function req(path, { method = "GET", body, access } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  if (access) headers["x-access-token"] = access;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch("/api" + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "http_" + res.status), { status: res.status, data });
  return data;
}

export const api = {
  listings: (params = {}) => { const qs = new URLSearchParams(params).toString(); return req("/listings" + (qs ? "?" + qs : "")); },
  listing: (id) => req("/listings/" + id),
  reportPreview: (cat) => req("/reports/" + encodeURIComponent(cat) + "/preview"),
  report: (cat, access) => req("/reports/" + encodeURIComponent(cat), { access }),
  stripeIntent: (cat) => req("/payments/stripe-intent", { method: "POST", body: { catastro: cat } }),
  checkout: (body) => req("/checkout", { method: "POST", body }),
  subscribePro: () => req("/checkout", { method: "POST", body: { kind: "pro" } }),
  subscribeAlerts: (payload) => req("/alerts/subscribe", { method: "POST", body: payload }),
  register: (email, password) => req("/auth/register", { method: "POST", body: { email, password } }),
  login: (email, password) => req("/auth/login", { method: "POST", body: { email, password } }),
  me: () => req("/auth/me"),
  myReports: () => req("/me/reports"),
  submitListing: (payload) => req("/listings/submit", { method: "POST", body: payload }),
  adminSubmissions: (adminKey) => req("/admin/submissions?adminKey=" + encodeURIComponent(adminKey)),
  adminApprove: (id, adminKey) => req("/admin/submissions/" + encodeURIComponent(id) + "/approve", { method: "POST", body: { adminKey } }),
  adminReject: (id, adminKey) => req("/admin/submissions/" + encodeURIComponent(id) + "/reject", { method: "POST", body: { adminKey } }),
};

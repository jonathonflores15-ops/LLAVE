import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return salt + ":" + hash;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const known = Buffer.from(hash, "hex");
  return test.length === known.length && crypto.timingSafeEqual(test, known);
}

export const signToken = (payload, opts = {}) => jwt.sign(payload, SECRET, { expiresIn: "30d", ...opts });

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

// Reads the bearer token if present; never rejects (routes decide what to require).
export function optionalUser(req, users) {
  const h = req.get("authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !payload.uid) return null;
  return users.find((u) => u.id === payload.uid) || null;
}

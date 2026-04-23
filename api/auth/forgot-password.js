import jwt from "jsonwebtoken";
import { JWT_SECRET, json } from "../_lib.js";
import { findUserByEmail } from "../persistence.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  const body = req.body || {};
  const email = String(body.email || "").trim().toLowerCase();

  if (!email) {
    json(res, 400, { message: "Email is required." });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    json(res, 200, { ok: true });
    return;
  }

  const token = jwt.sign(
    { purpose: "password-reset", userId: user.id, organizationId: user.organizationId, email: user.email },
    JWT_SECRET,
    { expiresIn: "30m" },
  );

  const origin = req.headers.origin || `https://${req.headers.host}`;
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
  json(res, 200, { ok: true, resetUrl });
}

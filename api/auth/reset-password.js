import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, json } from "../_lib.js";
import { updateUserPassword } from "../persistence.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  const body = req.body || {};
  const token = String(body.token || "");
  const password = String(body.password || "");

  if (!token || !password) {
    json(res, 400, { message: "Token and password are required." });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || payload.purpose !== "password-reset" || !payload.userId) {
      json(res, 400, { message: "Invalid reset token." });
      return;
    }

    const user = await updateUserPassword(payload.userId, await bcrypt.hash(password, 10));
    if (!user) {
      json(res, 404, { message: "User not found." });
      return;
    }

    json(res, 200, { ok: true });
  } catch {
    json(res, 400, { message: "Reset token is invalid or expired." });
  }
}

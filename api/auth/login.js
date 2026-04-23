import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, json, sanitizeUser } from "../_lib.js";
import { findUserByEmail } from "../persistence.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  const body = req.body || {};
  const user = await findUserByEmail(String(body.email || ""));
  if (!user || !(await bcrypt.compare(String(body.password || ""), user.passwordHash))) {
    json(res, 401, { message: "Invalid email or password." });
    return;
  }

  const token = jwt.sign({ userId: user.id, organizationId: user.organizationId, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  json(res, 200, { token, user: sanitizeUser(user) });
}

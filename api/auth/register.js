import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, json, sanitizeUser } from "../_lib.js";
import { createUser, findUserByEmail } from "../persistence.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  const body = req.body || {};
  const existing = await findUserByEmail(String(body.email || ""));
  if (existing) {
    json(res, 409, { message: "An account with that email already exists." });
    return;
  }

  const user = await createUser({
    name: String(body.name || "New User"),
    email: String(body.email || ""),
    passwordHash: await bcrypt.hash(String(body.password || ""), 10)
  });
  const token = jwt.sign({ userId: user.id, organizationId: user.organizationId, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  json(res, 201, { token, user: sanitizeUser(user) });
}

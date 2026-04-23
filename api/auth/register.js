import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, json, sanitizeUser } from "../_lib.js";
import { createOrganization, createUser, findUserByEmail, getPrimaryOrganization, getSetupStatus } from "../persistence.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  const body = req.body || {};
  const status = await getSetupStatus();
  if (!status.setupRequired) {
    json(res, 403, { message: "Workspace onboarding is complete. Ask an admin to create your account." });
    return;
  }

  const existing = await findUserByEmail(String(body.email || ""));
  if (existing) {
    json(res, 409, { message: "An account with that email already exists." });
    return;
  }

  const organizationName = String(body.organizationName || "").trim() || "Party Script Workspace";
  const organization = (await getPrimaryOrganization()) ?? (await createOrganization(organizationName));
  const user = await createUser({
    name: String(body.name || "New User"),
    email: String(body.email || ""),
    passwordHash: await bcrypt.hash(String(body.password || ""), 10),
    organizationId: organization.id,
    role: "Admin"
  });
  const token = jwt.sign({ userId: user.id, organizationId: user.organizationId, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  json(res, 201, { token, user: sanitizeUser(user) });
}

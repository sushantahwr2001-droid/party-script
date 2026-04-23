import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { buildBootstrap, JWT_SECRET, json, sanitizeUser, verifyAuth } from "./_lib.js";
import {
  convertOpportunity,
  createBudgetForOrg,
  createEventForOrg,
  createLeadForOrg,
  createOpportunityForOrg,
  createOrganization,
  createTaskForOrg,
  createUser,
  createVendorForOrg,
  findUserByEmail,
  findUserById,
  getSetupStatus,
  persistenceMode,
  updateUserPassword,
} from "./persistence.js";

function signUser(user) {
  return jwt.sign({ userId: user.id, organizationId: user.organizationId, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function pathOf(req) {
  const url = new URL(req.url, `https://${req.headers.host || "console.partyscript.in"}`);
  return url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  const route = pathOf(req);
  const body = req.body || {};

  try {
    if (req.method === "GET" && route === "health") {
      json(res, 200, { ok: true, persistence: persistenceMode() });
      return;
    }

    if (req.method === "GET" && route === "auth/setup-status") {
      json(res, 200, { ...(await getSetupStatus()), persistence: persistenceMode() });
      return;
    }

    if (req.method === "POST" && route === "auth/login") {
      const user = await findUserByEmail(String(body.email || ""));
      if (!user || !(await bcrypt.compare(String(body.password || ""), user.passwordHash))) {
        json(res, 401, { message: "Invalid email or password." });
        return;
      }
      json(res, 200, { token: signUser(user), user: sanitizeUser(user) });
      return;
    }

    if (req.method === "POST" && route === "auth/register") {
      const existing = await findUserByEmail(String(body.email || ""));
      if (existing) {
        json(res, 409, { message: "An account with that email already exists." });
        return;
      }

      const organizationName = String(body.organizationName || "").trim() || "Party Script Workspace";
      const organization = await createOrganization(organizationName);
      const user = await createUser({
        name: String(body.name || "New User"),
        email: String(body.email || ""),
        passwordHash: await bcrypt.hash(String(body.password || ""), 10),
        organizationId: organization.id,
        role: "Admin",
      });
      json(res, 201, { token: signUser(user), user: sanitizeUser(user) });
      return;
    }

    if (req.method === "POST" && route === "auth/forgot-password") {
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

      const resetToken = jwt.sign(
        { purpose: "password-reset", userId: user.id, organizationId: user.organizationId, email: user.email },
        JWT_SECRET,
        { expiresIn: "30m" },
      );
      const origin = req.headers.origin || `https://${req.headers.host}`;
      json(res, 200, { ok: true, resetUrl: `${origin}/reset-password?token=${encodeURIComponent(resetToken)}` });
      return;
    }

    if (req.method === "POST" && route === "auth/reset-password") {
      try {
        const payload = jwt.verify(String(body.token || ""), JWT_SECRET);
        if (!payload || payload.purpose !== "password-reset" || !payload.userId) {
          json(res, 400, { message: "Invalid reset token." });
          return;
        }

        const user = await updateUserPassword(payload.userId, await bcrypt.hash(String(body.password || ""), 10));
        if (!user) {
          json(res, 404, { message: "User not found." });
          return;
        }

        json(res, 200, { ok: true });
        return;
      } catch {
        json(res, 400, { message: "Reset token is invalid or expired." });
        return;
      }
    }

    const auth = verifyAuth(req);
    if (!auth) {
      json(res, 401, { message: "Authentication required." });
      return;
    }

    if (req.method === "GET" && route === "auth/me") {
      const user = await findUserById(auth.userId);
      if (!user) {
        json(res, 401, { message: "User not found." });
        return;
      }
      json(res, 200, { user: sanitizeUser(user) });
      return;
    }

    if (req.method === "GET" && route === "bootstrap") {
      json(res, 200, await buildBootstrap(auth.organizationId));
      return;
    }

    if (req.method === "POST" && route === "events") {
      json(res, 201, { event: await createEventForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "leads") {
      json(res, 201, { lead: await createLeadForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "opportunities") {
      json(res, 201, { opportunity: await createOpportunityForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "tasks") {
      json(res, 201, { task: await createTaskForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "vendors") {
      json(res, 201, { vendor: await createVendorForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "budgets") {
      json(res, 201, { budget: await createBudgetForOrg(auth, body) });
      return;
    }

    const convertMatch = route.match(/^opportunities\/([^/]+)\/convert$/);
    if (req.method === "POST" && convertMatch) {
      const result = await convertOpportunity(auth, decodeURIComponent(convertMatch[1]));
      if (!result) {
        json(res, 404, { message: "Opportunity not found." });
        return;
      }
      json(res, 200, result);
      return;
    }

    json(res, 404, { message: "API route not found." });
  } catch (error) {
    json(res, 500, { message: error instanceof Error ? error.message : "Unexpected server error." });
  }
}

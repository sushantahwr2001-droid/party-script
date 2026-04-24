import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { buildBootstrap, JWT_SECRET, json, sanitizeUser, verifyAuth } from "./_lib.js";
import {
  convertOpportunity,
  createAssetForOrg,
  createAttendeeForOrg,
  createBoothChecklistItemForOrg,
  createBoothInventoryItemForOrg,
  createBoothIssueForOrg,
  createBoothMeetingForOrg,
  createBoothStaffingForOrg,
  createBudgetForOrg,
  createCheckinForOrg,
  createEventForOrg,
  createLeadForOrg,
  createOpportunityForOrg,
  createOrganization,
  createTicketForOrg,
  createTaskForOrg,
  createUser,
  createVendorForOrg,
  deleteTicketForOrg,
  deleteUserForOrg,
  deleteBudgetForOrg,
  deleteBoothChecklistItemForOrg,
  deleteBoothInventoryItemForOrg,
  deleteBoothIssueForOrg,
  deleteBoothMeetingForOrg,
  deleteBoothStaffingForOrg,
  deleteAttendeeForOrg,
  deleteEventForOrg,
  deleteLeadForOrg,
  deleteOpportunityForOrg,
  deleteTaskForOrg,
  deleteVendorForOrg,
  findUserByEmail,
  findUserById,
  getSetupStatus,
  importAttendeesForOrg,
  mergeAttendeesForOrg,
  persistenceMode,
  uploadAssetForOrg,
  updateOrganizationForOrg,
  updateTicketForOrg,
  updateUserRoleForOrg,
  updateBudgetForOrg,
  updateBoothChecklistItemForOrg,
  updateBoothInventoryItemForOrg,
  updateBoothIssueForOrg,
  updateBoothMeetingForOrg,
  updateBoothForOrg,
  updateBoothStaffingForOrg,
  updateAttendeeForOrg,
  updateEventForOrg,
  updateLeadForOrg,
  updateOpportunityForOrg,
  updateTaskForOrg,
  updateUserPassword,
  updateVendorForOrg,
} from "./persistence.js";

function signUser(user) {
  return jwt.sign({ userId: user.id, organizationId: user.organizationId, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function pathOf(req) {
  const url = new URL(req.url, `https://${req.headers.host || "console.partyscript.in"}`);
  const rewrittenPath = url.searchParams.get("path");
  if (rewrittenPath) {
    return rewrittenPath.replace(/^\/+|\/+$/g, "");
  }
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

    if (req.method === "POST" && route === "auth/accept-invite") {
      try {
        const payload = jwt.verify(String(body.token || ""), JWT_SECRET);
        if (!payload || payload.purpose !== "workspace-invite" || !payload.userId || !payload.organizationId || !payload.email) {
          json(res, 400, { message: "Invalid invite token." });
          return;
        }

        const user = await findUserById(payload.userId);
        if (!user || user.organizationId !== payload.organizationId || user.email !== payload.email) {
          json(res, 404, { message: "Invite recipient not found." });
          return;
        }

        const updated = await updateUserPassword(
          user.id,
          await bcrypt.hash(String(body.password || ""), 10),
          String(body.name || user.name || "New Teammate"),
        );

        if (!updated) {
          json(res, 404, { message: "Invite recipient not found." });
          return;
        }

        json(res, 200, { token: signUser(updated), user: sanitizeUser(updated) });
        return;
      } catch {
        json(res, 400, { message: "Invite token is invalid or expired." });
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

    if (req.method === "POST" && route === "attendees") {
      json(res, 201, { attendee: await createAttendeeForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "tickets") {
      json(res, 201, { ticket: await createTicketForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "booth-checklist") {
      json(res, 201, { item: await createBoothChecklistItemForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "booth-staffing") {
      json(res, 201, { item: await createBoothStaffingForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "booth-inventory") {
      json(res, 201, { item: await createBoothInventoryItemForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "booth-meetings") {
      json(res, 201, { item: await createBoothMeetingForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "booth-issues") {
      json(res, 201, { item: await createBoothIssueForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "team/invite") {
      const existing = await findUserByEmail(String(body.email || ""));
      if (existing) {
        json(res, 409, { message: "A team member with that email already exists." });
        return;
      }
      const user = await createUser({
        name: String(body.name || "New Teammate"),
        email: String(body.email || ""),
        passwordHash: await bcrypt.hash(`invite-${Date.now()}`, 10),
        organizationId: auth.organizationId,
        role: String(body.role || "Operator"),
      });
      const inviteToken = jwt.sign(
        {
          purpose: "workspace-invite",
          userId: user.id,
          organizationId: user.organizationId,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      );
      const origin = req.headers.origin || `https://${req.headers.host}`;
      json(res, 201, { user: sanitizeUser(user), inviteUrl: `${origin}/invite/${encodeURIComponent(inviteToken)}` });
      return;
    }

    if (req.method === "PUT" && route === "settings/organization") {
      const organization = await updateOrganizationForOrg(auth.organizationId, body);
      json(res, organization ? 200 : 404, organization ? { organization } : { message: "Organization not found." });
      return;
    }

    if (req.method === "POST" && route === "attendees/import") {
      json(res, 201, { attendees: await importAttendeesForOrg(auth, Array.isArray(body.rows) ? body.rows : []) });
      return;
    }

    if (req.method === "POST" && route === "attendees/merge") {
      const attendee = await mergeAttendeesForOrg(auth, String(body.sourceAttendeeId || ""), String(body.targetAttendeeId || ""));
      json(res, attendee ? 200 : 404, attendee ? { attendee } : { message: "Attendee not found." });
      return;
    }

    if (req.method === "POST" && route === "checkins") {
      json(res, 201, { checkin: await createCheckinForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "assets") {
      json(res, 201, { asset: await createAssetForOrg(auth, body) });
      return;
    }

    if (req.method === "POST" && route === "assets/upload") {
      json(res, 201, { asset: await uploadAssetForOrg(auth, body) });
      return;
    }

    const eventMatch = route.match(/^events\/([^/]+)$/);
    if (eventMatch) {
      const eventId = decodeURIComponent(eventMatch[1]);
      if (req.method === "PUT") {
        const event = await updateEventForOrg(auth, eventId, body);
        json(res, event ? 200 : 404, event ? { event } : { message: "Event not found." });
        return;
      }
      if (req.method === "DELETE") {
        const ok = await deleteEventForOrg(auth, eventId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "Event not found." });
        return;
      }
    }

    const opportunityMatch = route.match(/^opportunities\/([^/]+)$/);
    if (opportunityMatch) {
      const opportunityId = decodeURIComponent(opportunityMatch[1]);
      if (req.method === "PUT") {
        const opportunity = await updateOpportunityForOrg(auth, opportunityId, body);
        json(res, opportunity ? 200 : 404, opportunity ? { opportunity } : { message: "Opportunity not found." });
        return;
      }
      if (req.method === "DELETE") {
        const ok = await deleteOpportunityForOrg(auth, opportunityId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "Opportunity not found." });
        return;
      }
    }

    const taskMatch = route.match(/^tasks\/([^/]+)$/);
    if (taskMatch) {
      const taskId = decodeURIComponent(taskMatch[1]);
      if (req.method === "PUT") {
        const task = await updateTaskForOrg(auth, taskId, body);
        json(res, task ? 200 : 404, task ? { task } : { message: "Task not found." });
        return;
      }
      if (req.method === "DELETE") {
        const ok = await deleteTaskForOrg(auth, taskId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "Task not found." });
        return;
      }
    }

    const vendorMatch = route.match(/^vendors\/([^/]+)$/);
    if (vendorMatch) {
      const vendorId = decodeURIComponent(vendorMatch[1]);
      if (req.method === "PUT") {
        const vendor = await updateVendorForOrg(auth, vendorId, body);
        json(res, vendor ? 200 : 404, vendor ? { vendor } : { message: "Vendor not found." });
        return;
      }
      if (req.method === "DELETE") {
        const ok = await deleteVendorForOrg(auth, vendorId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "Vendor not found." });
        return;
      }
    }

    const ticketMatch = route.match(/^tickets\/([^/]+)$/);
    if (ticketMatch) {
      const ticketId = decodeURIComponent(ticketMatch[1]);
      if (req.method === "PUT") {
        const ticket = await updateTicketForOrg(auth, ticketId, body);
        json(res, ticket ? 200 : 404, ticket ? { ticket } : { message: "Ticket not found." });
        return;
      }
      if (req.method === "DELETE") {
        const ok = await deleteTicketForOrg(auth, ticketId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "Ticket not found." });
        return;
      }
    }

    const teamMatch = route.match(/^team\/([^/]+)$/);
    if (teamMatch) {
      const userId = decodeURIComponent(teamMatch[1]);
      if (req.method === "PUT") {
        const user = await updateUserRoleForOrg(auth.organizationId, userId, String(body.role || "Operator"));
        json(res, user ? 200 : 404, user ? { user: sanitizeUser(user) } : { message: "User not found." });
        return;
      }
      if (req.method === "DELETE") {
        if (userId === auth.userId) {
          json(res, 400, { message: "You cannot remove yourself from the workspace." });
          return;
        }
        const ok = await deleteUserForOrg(auth.organizationId, userId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "User not found." });
        return;
      }
    }

    const budgetMatch = route.match(/^budgets\/([^/]+)$/);
    if (budgetMatch) {
      const budgetId = decodeURIComponent(budgetMatch[1]);
      if (req.method === "PUT") {
        const budget = await updateBudgetForOrg(auth, budgetId, body);
        json(res, budget ? 200 : 404, budget ? { budget } : { message: "Budget item not found." });
        return;
      }
      if (req.method === "DELETE") {
        const ok = await deleteBudgetForOrg(auth, budgetId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "Budget item not found." });
        return;
      }
    }

    const boothMatch = route.match(/^booths\/([^/]+)$/);
    if (boothMatch) {
      const boothId = decodeURIComponent(boothMatch[1]);
      if (req.method === "PUT") {
        const booth = await updateBoothForOrg(auth, boothId, body);
        json(res, booth ? 200 : 404, booth ? { booth } : { message: "Booth not found." });
        return;
      }
    }

    const boothChecklistMatch = route.match(/^booth-checklist\/([^/]+)$/);
    if (boothChecklistMatch) {
      const checklistId = decodeURIComponent(boothChecklistMatch[1]);
      if (req.method === "PUT") {
        const item = await updateBoothChecklistItemForOrg(auth, checklistId, body);
        json(res, item ? 200 : 404, item ? { item } : { message: "Checklist item not found." });
        return;
      }
      if (req.method === "DELETE") {
        const ok = await deleteBoothChecklistItemForOrg(auth, checklistId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "Checklist item not found." });
        return;
      }
    }

    const boothStaffingMatch = route.match(/^booth-staffing\/([^/]+)$/);
    if (boothStaffingMatch) {
      const staffingId = decodeURIComponent(boothStaffingMatch[1]);
      if (req.method === "PUT") {
        const item = await updateBoothStaffingForOrg(auth, staffingId, body);
        json(res, item ? 200 : 404, item ? { item } : { message: "Staffing item not found." });
        return;
      }
      if (req.method === "DELETE") {
        const ok = await deleteBoothStaffingForOrg(auth, staffingId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "Staffing item not found." });
        return;
      }
    }

    const boothInventoryMatch = route.match(/^booth-inventory\/([^/]+)$/);
    if (boothInventoryMatch) {
      const inventoryId = decodeURIComponent(boothInventoryMatch[1]);
      if (req.method === "PUT") {
        const item = await updateBoothInventoryItemForOrg(auth, inventoryId, body);
        json(res, item ? 200 : 404, item ? { item } : { message: "Inventory item not found." });
        return;
      }
      if (req.method === "DELETE") {
        const ok = await deleteBoothInventoryItemForOrg(auth, inventoryId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "Inventory item not found." });
        return;
      }
    }

    const boothMeetingMatch = route.match(/^booth-meetings\/([^/]+)$/);
    if (boothMeetingMatch) {
      const meetingId = decodeURIComponent(boothMeetingMatch[1]);
      if (req.method === "PUT") {
        const item = await updateBoothMeetingForOrg(auth, meetingId, body);
        json(res, item ? 200 : 404, item ? { item } : { message: "Meeting not found." });
        return;
      }
      if (req.method === "DELETE") {
        const ok = await deleteBoothMeetingForOrg(auth, meetingId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "Meeting not found." });
        return;
      }
    }

    const boothIssueMatch = route.match(/^booth-issues\/([^/]+)$/);
    if (boothIssueMatch) {
      const issueId = decodeURIComponent(boothIssueMatch[1]);
      if (req.method === "PUT") {
        const item = await updateBoothIssueForOrg(auth, issueId, body);
        json(res, item ? 200 : 404, item ? { item } : { message: "Issue not found." });
        return;
      }
      if (req.method === "DELETE") {
        const ok = await deleteBoothIssueForOrg(auth, issueId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "Issue not found." });
        return;
      }
    }

    const attendeeMatch = route.match(/^attendees\/([^/]+)$/);
    if (attendeeMatch) {
      const attendeeId = decodeURIComponent(attendeeMatch[1]);
      if (req.method === "PUT") {
        const attendee = await updateAttendeeForOrg(auth, attendeeId, body);
        json(res, attendee ? 200 : 404, attendee ? { attendee } : { message: "Attendee not found." });
        return;
      }
      if (req.method === "DELETE") {
        const ok = await deleteAttendeeForOrg(auth, attendeeId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "Attendee not found." });
        return;
      }
    }

    const leadMatch = route.match(/^leads\/([^/]+)$/);
    if (leadMatch) {
      const leadId = decodeURIComponent(leadMatch[1]);
      if (req.method === "PUT") {
        const lead = await updateLeadForOrg(auth, leadId, body);
        json(res, lead ? 200 : 404, lead ? { lead } : { message: "Lead not found." });
        return;
      }
      if (req.method === "DELETE") {
        const ok = await deleteLeadForOrg(auth, leadId);
        json(res, ok ? 200 : 404, ok ? { ok: true } : { message: "Lead not found." });
        return;
      }
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

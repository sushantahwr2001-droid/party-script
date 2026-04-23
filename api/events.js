import { json, verifyAuth } from "./_lib.js";
import { createEventForOrg } from "./persistence.js";

export default async function handler(req, res) {
  const auth = verifyAuth(req);
  if (!auth) {
    json(res, 401, { message: "Authentication required." });
    return;
  }

  const body = req.body || {};
  const event = await createEventForOrg(auth, body);
  json(res, 201, { event });
}

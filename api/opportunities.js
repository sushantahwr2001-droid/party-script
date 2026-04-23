import { json, verifyAuth } from "./_lib.js";
import { createOpportunityForOrg } from "./persistence.js";

export default async function handler(req, res) {
  const auth = verifyAuth(req);
  if (!auth) {
    json(res, 401, { message: "Authentication required." });
    return;
  }

  const opportunity = await createOpportunityForOrg(auth, req.body || {});
  json(res, 201, { opportunity });
}

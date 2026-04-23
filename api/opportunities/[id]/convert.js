import { json, verifyAuth } from "../../_lib.js";
import { convertOpportunity } from "../../persistence.js";

export default async function handler(req, res) {
  const auth = verifyAuth(req);
  if (!auth) {
    json(res, 401, { message: "Authentication required." });
    return;
  }

  const result = await convertOpportunity(auth, req.query.id);
  if (!result) {
    json(res, 404, { message: "Opportunity not found." });
    return;
  }
  json(res, 200, result);
}

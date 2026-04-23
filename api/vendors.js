import { json, verifyAuth } from "./_lib.js";
import { createVendorForOrg } from "./persistence.js";

export default async function handler(req, res) {
  const auth = verifyAuth(req);
  if (!auth) {
    json(res, 401, { message: "Authentication required." });
    return;
  }

  const vendor = await createVendorForOrg(auth, req.body || {});
  json(res, 201, { vendor });
}

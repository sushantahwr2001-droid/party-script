import { buildBootstrap, json, verifyAuth } from "./_lib.js";

export default async function handler(req, res) {
  const auth = verifyAuth(req);
  if (!auth) {
    json(res, 401, { message: "Authentication required." });
    return;
  }
  json(res, 200, await buildBootstrap(auth.organizationId));
}

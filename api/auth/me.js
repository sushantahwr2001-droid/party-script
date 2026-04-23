import { json, sanitizeUser, verifyAuth } from "../_lib.js";
import { findUserById } from "../persistence.js";

export default async function handler(req, res) {
  const auth = verifyAuth(req);
  if (!auth) {
    json(res, 401, { message: "Authentication required." });
    return;
  }
  const user = await findUserById(auth.userId);
  json(res, user ? 200 : 404, user ? { user: sanitizeUser(user) } : { message: "User not found." });
}

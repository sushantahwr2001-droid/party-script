import { json } from "./_lib.js";
import { persistenceMode } from "./persistence.js";

export default async function handler(_req, res) {
  json(res, 200, { ok: true, persistence: persistenceMode() });
}

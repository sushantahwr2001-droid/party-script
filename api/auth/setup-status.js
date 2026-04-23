import { json } from "../_lib.js";
import { getSetupStatus, persistenceMode } from "../persistence.js";

export default async function handler(_req, res) {
  const status = await getSetupStatus();
  json(res, 200, {
    ...status,
    persistence: persistenceMode()
  });
}

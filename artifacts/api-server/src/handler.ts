import app from "./app";
import { ensureSimSchema } from "./lib/simSchema";
import { logger } from "./lib/logger";

let initPromise: Promise<void> | null = null;

function init(): Promise<void> {
  if (!initPromise) {
    initPromise = ensureSimSchema().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export default async function handler(
  req: Parameters<typeof app>[0],
  res: Parameters<typeof app>[1],
): Promise<void> {
  try {
    await init();
  } catch (err) {
    logger.error({ err }, "Schema initialization failed");
    res.status(500).json({ error: "Server initialization failed" });
    return;
  }
  app(req, res);
}

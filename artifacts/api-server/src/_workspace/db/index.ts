import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl || !rawUrl.trim()) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const cleaned = rawUrl.trim().replace(/^["']|["']$/g, "");

let parsed: URL;
try {
  parsed = new URL(cleaned);
} catch (err) {
  throw new Error(
    `DATABASE_URL is not a valid URL. Value starts with: "${cleaned.slice(0, 20)}..." Length: ${cleaned.length}. Original error: ${(err as Error).message}`,
  );
}

if (!parsed.hostname || parsed.hostname === "base") {
  throw new Error(
    `DATABASE_URL has invalid hostname "${parsed.hostname}". Expected something like "xxxx.region-postgres.render.com". Full host: "${parsed.host}". Make sure you pasted the full Postgres connection string, not just a partial value.`,
  );
}

console.log(
  `[db] Connecting to host=${parsed.hostname} port=${parsed.port || "5432"} database=${parsed.pathname.slice(1)} user=${parsed.username}`,
);

const sslMode = parsed.searchParams.get("sslmode");
const useSsl =
  sslMode !== "disable" &&
  (sslMode === "require" ||
    sslMode === "no-verify" ||
    parsed.hostname.endsWith(".render.com") ||
    parsed.hostname.endsWith(".neon.tech") ||
    parsed.hostname.includes("supabase.co") ||
    parsed.hostname.includes("supabase.com") ||
    parsed.hostname.includes("pooler.supabase") ||
    parsed.hostname.endsWith(".rds.amazonaws.com") ||
    parsed.hostname.endsWith(".azure.com") ||
    parsed.hostname.includes("cockroachlabs.cloud") ||
    parsed.hostname !== "localhost");

export const pool = new Pool({
  host: parsed.hostname,
  port: parsed.port ? Number(parsed.port) : 5432,
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.slice(1),
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});
export const db = drizzle(pool, { schema });

export * from "./schema";

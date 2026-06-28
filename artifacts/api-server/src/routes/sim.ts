import { Router, type IRouter, type Request, type Response } from "express";
import { randomBytes, createHash } from "node:crypto";
import { pool } from "@workspace/db";
import type { AuthUser } from "../lib/auth";
import { ensureSimSchema } from "../lib/simSchema";
import { isAdminEmail } from "../lib/adminConfig";
import {
  getHeroAvailability,
  getHeroBalance,
  getHeroCountriesForService,
  getHeroPriceCatalog,
  getHeroStatus,
  rentHeroNumber,
  setHeroStatus,
  warmCatalogCache,
} from "../lib/heroSms";
import {
  GetMeResponse,
  GetDashboardResponse,
  ListCountriesResponse,
  ListServicesQueryParams,
  ListServicesResponse,
  GetAvailabilityQueryParams,
  GetAvailabilityResponse,
  ListRentalsResponse,
  CreateRentalBody,
  CreateRentalResponse,
  RefreshRentalParams,
  RefreshRentalResponse,
  CancelRentalParams,
  CancelRentalResponse,
  ListPaymentsResponse,
  CreatePaymentCheckoutBody,
  CreatePaymentCheckoutResponse,
  GetAdminOverviewResponse,
  ListAdminUsersResponse,
  ListAdminTransactionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type Service = { code: string; name: string; category: string; available: number; price: number };
type Country = { code: string; name: string; flag: string; available: number; startingPrice: number };

const fallbackCountries: Country[] = [];
const fallbackServices: Service[] = [];

const serviceNames: Record<string, { name: string; category: string }> = {
  aex: { name: "AliExpress", category: "Commerce" },
  ap: { name: "Apple", category: "Accounts" },
  aw: { name: "Amazon Web Services", category: "Cloud" },
  be: { name: "Line", category: "Messaging" },
  bbl: { name: "Bumble", category: "Dating" },
  boh: { name: "Wise", category: "Finance" },
  dp: { name: "Proton", category: "Email" },
  ew: { name: "Nike", category: "Shopping" },
  fh: { name: "Bolt", category: "Travel" },
  kt: { name: "KakaoTalk", category: "Messaging" },
  mb: { name: "Yahoo", category: "Email" },
  mt: { name: "Steam", category: "Gaming" },
  nv: { name: "Naver", category: "Accounts" },
  oi: { name: "Tinder", category: "Dating" },
  ok: { name: "OK.ru", category: "Social" },
  pc: { name: "Casino Plus", category: "Gaming" },
  pf: { name: "pof.com", category: "Dating" },
  pm: { name: "AOL", category: "Email" },
  re: { name: "Coinbase", category: "Finance" },
  uu: { name: "Wildberries", category: "Shopping" },
  vg: { name: "ShellBox", category: "Shopping" },
  vs: { name: "WinzoGame", category: "Gaming" },
  ya: { name: "Yandex", category: "Accounts" },
  tg: { name: "Telegram", category: "Messaging" },
  wa: { name: "WhatsApp", category: "Messaging" },
  go: { name: "Google", category: "Accounts" },
  ig: { name: "Instagram", category: "Social" },
  fb: { name: "Facebook", category: "Social" },
  tw: { name: "X / Twitter", category: "Social" },
  ds: { name: "Discord", category: "Community" },
  am: { name: "Amazon", category: "Commerce" },
  mm: { name: "Microsoft", category: "Accounts" },
  tk: { name: "TikTok", category: "Social" },
  sn: { name: "Snapchat", category: "Social" },
  nf: { name: "Netflix", category: "Entertainment" },
  qq: { name: "QQ", category: "Messaging" },
  wb: { name: "WeChat", category: "Messaging" },
  vi: { name: "Viber", category: "Messaging" },
  vk: { name: "VK", category: "Social" },
  av: { name: "Avito", category: "Commerce" },
  ub: { name: "Uber", category: "Travel" },
  ly: { name: "Olacabs", category: "Travel" },
  mbt: { name: "Microsoft Bing", category: "Accounts" },
  pb: { name: "PayPal", category: "Finance" },
  ot: { name: "Other", category: "General" },
};

const countryDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌍";
  return code
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function countryFromCode(code: string, live?: { count?: number; cost?: number }): Country {
  const fallback = fallbackCountries.find((item) => item.code === code);
  if (fallback) return { ...fallback, available: live?.count ?? fallback.available, startingPrice: live?.cost ?? fallback.startingPrice };
  const normalized = code.toUpperCase();
  const countryName = /^[A-Z]{2}$/.test(normalized) ? countryDisplayNames.of(normalized) : null;
  return {
    code: normalized,
    name: countryName ?? (normalized.startsWith("H") ? `Hero country ${normalized.slice(1)}` : normalized),
    flag: countryFlag(normalized),
    available: live?.count ?? 0,
    startingPrice: live?.cost ?? 0,
  };
}

function serviceFromCode(code: string, live?: { count?: number; cost?: number }): Service {
  const fallback = fallbackServices.find((item) => item.code === code);
  const normalizedCode = code.toLowerCase();
  const meta = serviceNames[normalizedCode] ?? serviceNames[code];
  if (fallback) return { ...fallback, available: live?.count ?? fallback.available, price: live?.cost ?? fallback.price };
  return {
    code,
    name: meta?.name ?? `Service ${code.toUpperCase()}`,
    category: meta?.category ?? "Live Provider",
    available: live?.count ?? 0,
    price: live?.cost ?? 0,
  };
}

async function withFastFallback<T>(promise: Promise<T>, fallback: T, timeoutMs = 1000): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

async function structuralServiceFallback(): Promise<Service[]> {
  const enabledCodes = await listEnabledServiceCodes();
  if (!enabledCodes) return [];
  return Array.from(enabledCodes).map((code) => serviceFromCode(code, { count: 0, cost: 0 }));
}

async function liveServices(countryCode?: string): Promise<Service[]> {
  const catalog = await withFastFallback(getHeroPriceCatalog(), [], 8000);
  if (catalog.length === 0) return structuralServiceFallback();
  const totals = new Map<string, { count: number; cost: number }>();
  for (const item of catalog) {
    if (countryCode && item.countryCode !== countryCode) continue;
    const current = totals.get(item.serviceCode) ?? { count: 0, cost: item.cost };
    current.count += item.count;
    current.cost = current.cost || item.cost;
    totals.set(item.serviceCode, current);
  }
  return Array.from(totals.entries())
    .map(([code, live]) => serviceFromCode(code, live))
    .sort((a, b) => b.available - a.available || a.name.localeCompare(b.name));
}

const MAX_COUNTRIES = 10;

async function liveCountries(): Promise<Country[]> {
  const catalog = await withFastFallback(getHeroPriceCatalog(), [], 8000);
  if (catalog.length === 0) return fallbackCountries;
  const enabledCodes = await listEnabledServiceCodes();
  const totals = new Map<string, { count: number; cost: number }>();
  for (const item of catalog) {
    if (enabledCodes && !enabledCodes.has(item.serviceCode)) continue;
    const current = totals.get(item.countryCode) ?? { count: 0, cost: item.cost };
    current.count += item.count;
    if (item.cost > 0 && (current.cost === 0 || item.cost < current.cost)) current.cost = item.cost;
    totals.set(item.countryCode, current);
  }
  return Array.from(totals.entries())
    .map(([code, live]) => countryFromCode(code, live))
    .filter((c) => c.available > 0)
    .sort((a, b) => a.startingPrice - b.startingPrice || a.name.localeCompare(b.name))
    .slice(0, MAX_COUNTRIES);
}

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  // Primary check: email must be in the admin allowlist
  if (isAdminEmail(req.user.email)) return true;
  // Secondary check: role in DB (catches manually-promoted users)
  const result = await pool.query("SELECT role FROM sim_users WHERE id = $1", [req.user.id]);
  if (result.rows[0]?.role === "admin") return true;
  res.status(403).json({ error: "Admin access required" });
  return false;
}

function providerStatus(name: "Hero SMS" | "OxaPay") {
  const configured = name === "Hero SMS" ? Boolean(process.env.HERO_SMS_API_KEY) : Boolean(process.env.OXAPAY_MERCHANT_API_KEY);
  return {
    name,
    mode: configured ? "live" : "setup_required",
    message: configured
      ? `${name} credentials are configured for live server-side requests.`
      : `${name} secret is not configured yet. Live provider actions are disabled until the secret is added securely.`,
  };
}

async function heroProviderStatus() {
  if (!process.env.HERO_SMS_API_KEY) return providerStatus("Hero SMS");
  try {
    const balance = await getHeroBalance();
    return {
      name: "Hero SMS",
      mode: "live" as const,
      message: `Hero SMS is connected. Provider balance: $${balance.toFixed(2)}.`,
    };
  } catch (error) {
    return {
      name: "Hero SMS",
      mode: "setup_required" as const,
      message: error instanceof Error ? error.message : "Hero SMS connection failed.",
    };
  }
}

function nowIso() {
  return new Date().toISOString();
}

function futureIso(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

async function listServicePrices() {
  const result = await pool.query("SELECT service_code, price FROM sim_service_prices");
  return new Map(result.rows.map((row) => [String(row.service_code), Number(row.price)]));
}

async function listCountryServicePrices(countryCode: string) {
  const result = await pool.query("SELECT service_code, price FROM sim_service_country_prices WHERE country_code = $1", [countryCode]);
  return new Map(result.rows.map((row) => [String(row.service_code), Number(row.price)]));
}

async function getCountryBasePrice(countryCode: string): Promise<number | null> {
  const result = await pool.query("SELECT base_price FROM sim_country_base_prices WHERE country_code = $1", [countryCode]);
  return result.rows[0] ? Number(result.rows[0].base_price) : null;
}

async function listAllCountryBasePrices(): Promise<Map<string, number>> {
  const result = await pool.query("SELECT country_code, base_price FROM sim_country_base_prices");
  return new Map(result.rows.map((row) => [String(row.country_code), Number(row.base_price)]));
}

const DEFAULT_MARGIN_PERCENT = 55;

// Absolute minimum markup over Hero SMS cost. Even if an admin sets a fixed price,
// we will NEVER charge the customer less than (heroSMSCost * (1 + this/100)).
// This prevents selling at a loss when Hero SMS prices rise above a stale fixed price.
const MINIMUM_SAFE_MARGIN_PERCENT = 30;

function applyMargin(basePrice: number, marginPercent: number): number {
  return Number((basePrice * (1 + marginPercent / 100)).toFixed(2));
}

async function getEffectiveMargin(serviceCode: string, countryCode?: string): Promise<number> {
  if (countryCode) {
    const r = await pool.query(
      "SELECT margin_percent FROM sim_service_margins WHERE service_code = $1 AND country_code = $2",
      [serviceCode, countryCode],
    );
    if (r.rows[0]) return Number(r.rows[0].margin_percent);
  }
  const r = await pool.query(
    "SELECT margin_percent FROM sim_service_margins WHERE service_code = $1 AND country_code = ''",
    [serviceCode],
  );
  if (r.rows[0]) return Number(r.rows[0].margin_percent);
  return DEFAULT_MARGIN_PERCENT;
}

async function listAllServiceMargins(): Promise<Map<string, { global: number | null; byCountry: Map<string, number> }>> {
  const result = await pool.query("SELECT service_code, country_code, margin_percent FROM sim_service_margins");
  const map = new Map<string, { global: number | null; byCountry: Map<string, number> }>();
  for (const row of result.rows) {
    const code = String(row.service_code);
    if (!map.has(code)) map.set(code, { global: null, byCountry: new Map() });
    const entry = map.get(code)!;
    if (String(row.country_code) === "") {
      entry.global = Number(row.margin_percent);
    } else {
      entry.byCountry.set(String(row.country_code), Number(row.margin_percent));
    }
  }
  return map;
}

async function listEnabledServiceCodes() {
  const result = await pool.query("SELECT service_code FROM sim_enabled_services WHERE enabled = TRUE");
  if (result.rows.length === 0) return null;
  return new Set(result.rows.map((row) => String(row.service_code)));
}

async function isServiceEnabled(serviceCode: string) {
  const enabled = await listEnabledServiceCodes();
  return !enabled || enabled.has(serviceCode);
}

async function getServicePrice(service: Service, country: Country): Promise<number> {
  // service.price is the live Hero SMS cost fetched from their API at purchase time
  const heroSMSCost = service.price;

  let configuredPrice: number | null = null;

  const countryResult = await pool.query(
    "SELECT price FROM sim_service_country_prices WHERE service_code = $1 AND country_code = $2",
    [service.code, country.code],
  );
  if (countryResult.rows[0]) configuredPrice = Number(countryResult.rows[0].price);

  if (configuredPrice === null) {
    const globalResult = await pool.query(
      "SELECT price FROM sim_service_prices WHERE service_code = $1",
      [service.code],
    );
    if (globalResult.rows[0]) configuredPrice = Number(globalResult.rows[0].price);
  }

  if (configuredPrice === null) {
    const margin = await getEffectiveMargin(service.code, country.code);
    configuredPrice = applyMargin(heroSMSCost, margin);
  }

  // SAFETY FLOOR: never charge less than heroSMSCost + MINIMUM_SAFE_MARGIN_PERCENT.
  // This prevents selling at a loss when a fixed admin price becomes stale
  // and Hero SMS raises their price above what we charge customers.
  if (heroSMSCost > 0) {
    const minimumSafePrice = applyMargin(heroSMSCost, MINIMUM_SAFE_MARGIN_PERCENT);
    if (configuredPrice < minimumSafePrice) {
      configuredPrice = minimumSafePrice;
    }
  }

  return configuredPrice;
}

async function servicesWithPrices(country?: Country, enabledOnly = true) {
  const prices = await listServicePrices();
  const countryPrices = country ? await listCountryServicePrices(country.code) : new Map<string, number>();
  const enabledCodes = enabledOnly ? await listEnabledServiceCodes() : null;
  const services = await liveServices(country?.code);
  const marginMap = await listAllServiceMargins();
  return services.filter((service) => !enabledCodes || enabledCodes.has(service.code)).map((service) => {
    const heroSMSCost = service.price;

    let computedPrice: number;
    if (countryPrices.has(service.code)) {
      computedPrice = Number(countryPrices.get(service.code));
    } else if (prices.has(service.code)) {
      computedPrice = Number(prices.get(service.code));
    } else {
      const serviceMargins = marginMap.get(service.code);
      const countryMargin = country ? (serviceMargins?.byCountry.get(country.code) ?? null) : null;
      const globalMargin = serviceMargins?.global ?? null;
      const effectiveMargin = countryMargin ?? globalMargin ?? DEFAULT_MARGIN_PERCENT;
      computedPrice = applyMargin(heroSMSCost, effectiveMargin);
    }

    // Apply the same safety floor as getServicePrice so the displayed price
    // always matches what will actually be charged at purchase time.
    if (heroSMSCost > 0) {
      const minimumSafePrice = applyMargin(heroSMSCost, MINIMUM_SAFE_MARGIN_PERCENT);
      if (computedPrice < minimumSafePrice) computedPrice = minimumSafePrice;
    }

    return { ...service, price: computedPrice };
  });
}

function getUserId(req: Request): string {
  return req.user?.id ?? "anonymous";
}

function getRequestOrigin(req: Request) {
  const protocol = req.get("x-forwarded-proto") ?? req.protocol;
  const host = req.get("x-forwarded-host") ?? req.get("host");
  return host ? `${protocol}://${host}` : "https://smsrentals.app";
}

async function createOxaPayInvoice(req: Request, paymentId: string, amount: number, currency: string, credits?: number, overrideMerchantKey?: string) {
  const merchant = overrideMerchantKey || process.env.OXAPAY_MERCHANT_API_KEY;
  if (!merchant) {
    throw new Error("OxaPay merchant key is not configured.");
  }

  const origin = getRequestOrigin(req);
  const response = await fetch("https://api.oxapay.com/merchants/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      merchant,
      amount,
      currency,
      lifeTime: 20,
      feePaidByPayer: 1,
      underPaidCover: 1,
      orderId: paymentId,
      description: `SMS Rentals credit package - ${credits ?? amount} credits`,
      returnUrl: `${origin}/payments`,
      callbackUrl: `${origin}/api/payments/oxapay/webhook`,
    }),
  });

  const payload = await response.json().catch(() => null) as { result?: number; message?: string; payLink?: string; trackId?: string } | null;

  if (!response.ok || !payload || payload.result !== 100 || !payload.payLink) {
    throw new Error(payload?.message || "OxaPay did not return a checkout link.");
  }

  return { payLink: payload.payLink, trackId: payload.trackId ?? null };
}

async function getCoinMerchantKey(coin: string): Promise<string | null> {
  try {
    const result = await pool.query(
      "SELECT merchant_key FROM sim_coin_api_keys WHERE coin = $1 AND enabled = TRUE",
      [coin.toUpperCase()],
    );
    return result.rows[0]?.merchant_key ? String(result.rows[0].merchant_key) : null;
  } catch {
    return null;
  }
}

async function closeOxaPayInvoice(trackId: string) {
  const merchant = process.env.OXAPAY_MERCHANT_API_KEY;
  if (!merchant) return;
  try {
    await fetch("https://api.oxapay.com/merchants/invoice/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant, trackId }),
    });
  } catch {
    // best-effort
  }
}

function extractCode(value: string) {
  return value.match(/\b\d{4,8}\b/)?.[0] ?? value;
}

async function refundExpiredRental(row: Record<string, unknown>) {
  // Atomic test-and-set: only one concurrent caller can ever proceed.
  // This prevents the race condition where two calls (e.g. syncExpiredRentals +
  // syncHeroStatus running simultaneously) both read refunded=FALSE and both
  // add credits, causing balance inflation.
  const claim = await pool.query(
    "UPDATE sim_rentals SET refunded = TRUE WHERE id = $1 AND refunded = FALSE RETURNING id",
    [row.id],
  );
  if (claim.rows.length === 0) return; // Already refunded by another concurrent caller

  // If the user actually received an SMS, no credit refund (they got what they paid for)
  const messages = await pool.query(
    "SELECT COUNT(*)::int AS count FROM sim_sms_messages WHERE rental_id = $1",
    [row.id],
  );
  if (Number(messages.rows[0].count) > 0) return;

  const price = Number(row.price);
  if (price > 0) {
    await pool.query("UPDATE sim_users SET credits = credits + $1 WHERE id = $2", [price, row.user_id]);
  }
}

async function syncExpiredRentals(userId?: string) {
  const params: unknown[] = [];
  const userFilter = userId ? "AND user_id = $1" : "";
  if (userId) params.push(userId);
  const result = await pool.query(
    `SELECT * FROM sim_rentals WHERE status = 'active' AND expires_at <= NOW() ${userFilter}`,
    params,
  );
  for (const row of result.rows) {
    await pool.query("UPDATE sim_rentals SET status = 'expired' WHERE id = $1", [row.id]);
    await refundExpiredRental(row);
  }
}

async function syncHeroStatus(id: string) {
  const rentalResult = await pool.query("SELECT * FROM sim_rentals WHERE id = $1", [id]);
  const rental = rentalResult.rows[0];
  if (!rental) return null;

  if (String(rental.status) === "active" && new Date(String(rental.expires_at)) <= new Date()) {
    await pool.query("UPDATE sim_rentals SET status = 'expired' WHERE id = $1", [id]);
    await refundExpiredRental(rental);
  }

  if (String(rental.status) === "active" && rental.provider_activation_id) {
    try {
      const status = await getHeroStatus(String(rental.provider_activation_id));
      if (status.status === "STATUS_OK" && status.code) {
        const existing = await pool.query("SELECT COUNT(*)::int AS count FROM sim_sms_messages WHERE rental_id = $1 AND code = $2", [id, status.code]);
        if (Number(existing.rows[0].count) === 0) {
          await pool.query(
            "INSERT INTO sim_sms_messages (id, rental_id, sender, message, code) VALUES ($1, $2, 'Hero SMS', $3, $4)",
            [crypto.randomUUID(), id, `Your verification code is ${status.code}.`, extractCode(status.code)],
          );
        }
        await setHeroStatus(String(rental.provider_activation_id), 6).catch(() => null);
        await pool.query("UPDATE sim_rentals SET status = 'sms_received' WHERE id = $1", [id]);
      } else if (["STATUS_CANCEL", "NO_ACTIVATION", "STATUS_FINISH"].includes(status.status)) {
        await pool.query("UPDATE sim_rentals SET status = 'expired' WHERE id = $1", [id]);
        await refundExpiredRental(rental);
      }
    } catch {
    }
  }

  const updated = await pool.query("SELECT * FROM sim_rentals WHERE id = $1", [id]);
  return updated.rows[0] ?? null;
}

function mapRental(row: Record<string, unknown>, messages: Array<Record<string, unknown>> = []) {
  return {
    id: String(row.id),
    countryCode: String(row.country_code),
    countryName: String(row.country_name),
    serviceCode: String(row.service_code),
    serviceName: String(row.service_name),
    phoneNumber: String(row.phone_number),
    price: Number(row.price),
    status: String(row.status),
    createdAt: new Date(String(row.created_at)).toISOString(),
    expiresAt: new Date(String(row.expires_at)).toISOString(),
    messages: messages.map((message) => ({
      id: String(message.id),
      sender: String(message.sender),
      message: String(message.message),
      code: message.code ? String(message.code) : undefined,
      receivedAt: new Date(String(message.received_at)).toISOString(),
    })),
  };
}

async function listUserRentals(userId: string) {
  await syncExpiredRentals(userId);
  const rentalsResult = await pool.query(
    "SELECT * FROM sim_rentals WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  for (const rental of rentalsResult.rows.filter((row) => row.status === "active")) {
    await syncHeroStatus(String(rental.id));
  }
  const syncedRentalsResult = await pool.query(
    "SELECT * FROM sim_rentals WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  const messagesResult = await pool.query(
    "SELECT * FROM sim_sms_messages WHERE rental_id = ANY($1::text[]) ORDER BY received_at DESC",
    [syncedRentalsResult.rows.map((row) => row.id)],
  );
  return syncedRentalsResult.rows.map((row) => mapRental(row, messagesResult.rows.filter((message) => message.rental_id === row.id)));
}

async function getAccount(userId: string, authUser?: AuthUser) {
  const name = authUser
    ? [authUser.firstName, authUser.lastName].filter(Boolean).join(" ") || "User"
    : "User";
  const email = authUser?.email || `user-${userId}@sms-rentals.app`;
  const role = isAdminEmail(authUser?.email) ? "admin" : "user";

  await pool.query(
    `INSERT INTO sim_users (id, name, email, role, credits, status)
     VALUES ($1, $2, $3, $4, 0, 'active')
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role`,
    [userId, name, email, role],
  );
  const result = await pool.query("SELECT * FROM sim_users WHERE id = $1", [userId]);
  const user = result.rows[0];
  return {
    id: String(user.id),
    name: String(user.name),
    email: String(user.email),
    role: String(user.role),
    credits: Number(user.credits),
    avatarUrl: authUser?.profileImageUrl || undefined,
    status: String(user.status),
    suspensionReason: user.suspension_reason ? String(user.suspension_reason) : null,
    lienAmount: Number(user.lien_amount ?? 0),
  };
}

// ─── Public status endpoints (no auth required) ──────────────────────────────

const STATUS_COMPONENTS = ["Website", "API", "Payments", "Notifications", "Server Web Pages"] as const;

router.get("/status", async (_req, res) => {
  const checkedAt = new Date().toISOString();

  // Measure real DB response time
  const dbStart = Date.now();
  let dbOk = true;
  try { await pool.query("SELECT 1"); } catch { dbOk = false; }
  const dbMs = Date.now() - dbStart;

  // Record metric (fire and forget, don't block response)
  pool.query(
    "INSERT INTO sim_status_metrics (metric, value, recorded_at) VALUES ('api_response_ms', $1, NOW())",
    [dbMs],
  ).catch(() => null);

  // Prune metrics older than 90 days (occasional cleanup, non-blocking)
  pool.query("DELETE FROM sim_status_metrics WHERE recorded_at < NOW() - INTERVAL '90 days'").catch(() => null);

  // Get active (non-resolved) incidents to determine component status
  let activeIncidents: Array<{ components: string[]; status: string }> = [];
  try {
    const result = await pool.query(
      "SELECT components, status FROM sim_status_incidents WHERE resolved_at IS NULL ORDER BY created_at DESC",
    );
    activeIncidents = result.rows.map(r => ({ components: r.components as string[], status: r.status as string }));
  } catch { /* ignore if table not ready yet */ }

  const componentStatus = (name: string): "operational" | "degraded" | "outage" => {
    if (!dbOk && name === "API") return "degraded";
    const incident = activeIncidents.find(inc => inc.components.includes(name));
    if (!incident) return "operational";
    if (incident.status === "identified") return "outage";
    return "degraded";
  };

  const components = STATUS_COMPONENTS.map(name => ({
    name,
    status: componentStatus(name),
  }));

  const hasOutage = components.some(c => c.status === "outage");
  const hasDegraded = components.some(c => c.status === "degraded");
  const overall = hasOutage ? "outage" : hasDegraded ? "degraded" : "operational";
  const overallMessage = hasOutage
    ? "Some systems are experiencing an outage."
    : hasDegraded
    ? "Some systems are experiencing degraded performance."
    : "All Systems Operational";

  res.json({ status: overall, message: overallMessage, checkedAt, components });
});

router.get("/status/incidents", async (_req, res) => {
  try {
    await ensureSimSchema();
    const result = await pool.query(`
      SELECT i.*, 
        COALESCE(
          json_agg(u ORDER BY u.created_at ASC) FILTER (WHERE u.id IS NOT NULL), '[]'
        ) AS updates
      FROM sim_status_incidents i
      LEFT JOIN sim_status_incident_updates u ON u.incident_id = i.id
      WHERE i.created_at > NOW() - INTERVAL '90 days'
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT 50
    `);
    res.json({ incidents: result.rows });
  } catch { res.json({ incidents: [] }); }
});

router.get("/status/metrics", async (_req, res) => {
  try {
    await ensureSimSchema();
    const result = await pool.query(`
      SELECT
        DATE_TRUNC('day', recorded_at) AS day,
        AVG(value)::INTEGER AS avg_ms,
        MAX(value)::INTEGER AS max_ms
      FROM sim_status_metrics
      WHERE metric = 'api_response_ms'
        AND recorded_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', recorded_at)
      ORDER BY day ASC
    `);
    res.json({ metrics: result.rows });
  } catch { res.json({ metrics: [] }); }
});

// ─── Admin incident management ────────────────────────────────────────────────

router.post("/admin/status/incidents", async (req, res) => {
  if (!req.isAuthenticated() || !isAdminEmail((req.user as { email?: string })?.email ?? "")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { title, body, status: incStatus, components } = req.body as Record<string, unknown>;
  if (!title || !body) { res.status(400).json({ error: "Title and body are required." }); return; }
  const validStatuses = ["investigating", "identified", "monitoring", "resolved"];
  const safeStatus = validStatuses.includes(String(incStatus)) ? String(incStatus) : "investigating";
  const safeComponents = Array.isArray(components)
    ? (components as string[]).filter(c => (STATUS_COMPONENTS as readonly string[]).includes(c))
    : [];
  const id = crypto.randomUUID();
  const resolvedAt = safeStatus === "resolved" ? new Date().toISOString() : null;
  const result = await pool.query(
    `INSERT INTO sim_status_incidents (id, title, body, status, components, resolved_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [id, String(title).slice(0, 200), String(body).slice(0, 2000), safeStatus, safeComponents, resolvedAt, req.user.id],
  );
  res.json({ incident: result.rows[0] });
});

router.post("/admin/status/incidents/:id/updates", async (req, res) => {
  if (!req.isAuthenticated() || !isAdminEmail((req.user as { email?: string })?.email ?? "")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { id } = req.params;
  const { body, status: incStatus } = req.body as Record<string, unknown>;
  if (!body) { res.status(400).json({ error: "Body is required." }); return; }
  const validStatuses = ["investigating", "identified", "monitoring", "resolved", "update"];
  const safeStatus = validStatuses.includes(String(incStatus)) ? String(incStatus) : "update";
  const updateId = crypto.randomUUID();
  await pool.query(
    "INSERT INTO sim_status_incident_updates (id, incident_id, body, status) VALUES ($1, $2, $3, $4)",
    [updateId, id, String(body).slice(0, 2000), safeStatus],
  );
  if (safeStatus === "resolved") {
    await pool.query(
      "UPDATE sim_status_incidents SET status = 'resolved', resolved_at = NOW() WHERE id = $1",
      [id],
    );
  } else {
    await pool.query("UPDATE sim_status_incidents SET status = $1 WHERE id = $2", [safeStatus, id]);
  }
  res.json({ ok: true });
});

router.patch("/admin/status/incidents/:id", async (req, res) => {
  if (!req.isAuthenticated() || !isAdminEmail((req.user as { email?: string })?.email ?? "")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { id } = req.params;
  const { status: incStatus } = req.body as Record<string, unknown>;
  const validStatuses = ["investigating", "identified", "monitoring", "resolved"];
  if (!validStatuses.includes(String(incStatus))) { res.status(400).json({ error: "Invalid status." }); return; }
  const resolvedAt = incStatus === "resolved" ? new Date().toISOString() : null;
  await pool.query(
    "UPDATE sim_status_incidents SET status = $1, resolved_at = $2 WHERE id = $3",
    [incStatus, resolvedAt, id],
  );
  res.json({ ok: true });
});

router.delete("/admin/status/incidents/:id", async (req, res) => {
  if (!req.isAuthenticated() || !isAdminEmail((req.user as { email?: string })?.email ?? "")) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  await pool.query("DELETE FROM sim_status_incidents WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
});

router.use(async (_req, res, next) => {
  try {
    await ensureSimSchema();
    next();
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Database setup failed" });
  }
});

// Pre-warm the full price catalog cache on first request so admin live counts
// are available immediately (avoids a cold 10-20 second fetch on first admin load).
let catalogWarmedUp = false;
router.use((_req, _res, next) => {
  if (!catalogWarmedUp) {
    catalogWarmedUp = true;
    warmCatalogCache();
  }
  next();
});

// ─── Suspension guard — blocks suspended/banned users on all user-facing routes ─
const SUSPENSION_EXEMPT = ["/admin", "/payments/oxapay/webhook", "/catalog", "/me"];
router.use(async (req, res, next) => {
  if (!req.isAuthenticated()) return next();
  const path = req.path ?? "";
  const isExempt = SUSPENSION_EXEMPT.some((p) => path.startsWith(p));
  if (isExempt) return next();
  try {
    const result = await pool.query(
      "SELECT status, suspension_reason FROM sim_users WHERE id = $1",
      [req.user.id],
    );
    const row = result.rows[0];
    if (row && (row.status === "suspended" || row.status === "banned")) {
      res.status(403).json({
        error: "Account suspended",
        reason: row.suspension_reason || "Your account has been suspended. Contact support for assistance.",
        suspended: true,
      });
      return;
    }
  } catch (err) {
    console.error("[suspension] DB check failed:", err);
  }
  next();
});

// ─── IP Ban guard ────────────────────────────────────────────────────────────
const IP_BAN_EXEMPT = ["/payments/oxapay/webhook"];
router.use(async (req, res, next) => {
  const path = req.path ?? "";
  if (IP_BAN_EXEMPT.some((p) => path.startsWith(p))) return next();
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
  if (!ip) return next();
  try {
    const result = await pool.query("SELECT reason FROM sim_ip_bans WHERE ip_address = $1", [ip]);
    if (result.rows[0]) {
      res.status(403).json({
        error: "Access denied",
        reason: result.rows[0].reason || "Your IP address has been blocked. Contact support.",
        ipBanned: true,
      });
      return;
    }
  } catch (err) {
    console.error("[ip-ban] DB check failed:", err);
  }
  next();
});

router.get("/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const accountData = await getAccount(getUserId(req), req.user);
  const data = GetMeResponse.parse(accountData);
  res.json({ ...data, status: accountData.status, suspensionReason: accountData.suspensionReason });
});

router.get("/dashboard", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = getUserId(req);
  const account = await getAccount(userId, req.user);
  const rentals = await listUserRentals(userId);
  const payments = await pool.query("SELECT * FROM sim_payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5", [userId]);
  const heroStatus = await heroProviderStatus().catch(() => providerStatus("Hero SMS"));
  const data = GetDashboardResponse.parse({
    account,
    activeRentals: rentals.filter((r) => r.status === "active" || r.status === "sms_received").length,
    completedRentals: rentals.filter((r) => r.status === "completed").length,
    totalSpent: rentals.reduce((sum, rental) => sum + rental.price, 0),
    recentRentals: rentals.slice(0, 4),
    recentPayments: payments.rows.map((row) => ({
      id: String(row.id),
      amount: Number(row.amount),
      credits: Number(row.credits),
      currency: String(row.currency),
      status: String(row.status),
      provider: String(row.provider),
      createdAt: new Date(String(row.created_at)).toISOString(),
    })),
    providerStatuses: [heroStatus, providerStatus("OxaPay")],
  });
  res.json(data);
});

router.get("/catalog/countries", async (_req, res) => {
  res.json(ListCountriesResponse.parse({ countries: await liveCountries(), provider: providerStatus("Hero SMS") }));
});

// Service code aliases: when one code returns no/few countries, also try the alias codes.
// This handles cases where Hero SMS may use "pp" vs "pb" for PayPal, etc.
const SERVICE_CODE_ALIASES: Record<string, string[]> = {
  pb: ["pb", "pp"],
  pp: ["pp", "pb"],
};

router.get("/catalog/countries-for-service", async (req, res) => {
  const serviceCode = String(req.query.serviceCode ?? "");
  if (!serviceCode.trim()) {
    res.status(400).json({ error: "Service code is required" });
    return;
  }
  if (!await isServiceEnabled(serviceCode)) {
    res.json({ countries: [], provider: providerStatus("Hero SMS") });
    return;
  }

  // Fetch countries using the primary code + any alias codes in parallel, then merge.
  const codesToTry = SERVICE_CODE_ALIASES[serviceCode] ?? [serviceCode];
  const allResults = await withFastFallback(
    Promise.all(codesToTry.map((c) => getHeroCountriesForService(c))).then((arrays) => {
      // Merge by country code, keeping the best (highest count) entry per country
      const byCountry = new Map<string, { countryCode: string; count: number; cost: number; activationMinutes: number }>();
      for (const arr of arrays) {
        for (const entry of arr) {
          const existing = byCountry.get(entry.countryCode);
          if (!existing || entry.count > existing.count) byCountry.set(entry.countryCode, entry);
        }
      }
      return Array.from(byCountry.values());
    }),
    [],
    10_000,
  );

  const mapped = allResults
    .map((live) => ({ country: countryFromCode(live.countryCode, live), available: live.count, heroPrice: live.cost, activationMinutes: live.activationMinutes ?? 20 }))
    .filter((c) => c.available > 0)
    .sort((a, b) => a.heroPrice - b.heroPrice || b.available - a.available);

  const service = serviceFromCode(serviceCode);
  const result = await Promise.all(
    mapped.map(async ({ country, available, heroPrice, activationMinutes }) => ({
      code: country.code,
      name: country.name,
      flag: country.flag,
      available,
      heroPrice,
      activationMinutes,
      price: await getServicePrice(service, country),
    })),
  );

  res.json({ countries: result, provider: providerStatus("Hero SMS") });
});

router.get("/catalog/services", async (req, res) => {
  ListServicesQueryParams.parse(req.query);
  const countryCode = String(req.query.countryCode ?? "");
  const country = countryCode ? countryFromCode(countryCode) : undefined;
  res.json(ListServicesResponse.parse({ services: await servicesWithPrices(country), provider: providerStatus("Hero SMS") }));
});

router.get("/catalog/availability", async (req, res) => {
  const params = GetAvailabilityQueryParams.parse(req.query);
  if (!await isServiceEnabled(params.serviceCode)) {
    res.status(400).json({ error: "This service is not enabled." });
    return;
  }
  const live = await withFastFallback(getHeroAvailability(params.serviceCode, params.countryCode), null);
  const service = serviceFromCode(params.serviceCode, live ?? undefined);
  const country = countryFromCode(params.countryCode, live ?? undefined);
  if (!service || !country) {
    res.status(400).json({ error: "Unknown service or country code." });
    return;
  }
  const customPrice = await getServicePrice(service, country);
  const activationMinutes = live?.activationMinutes ?? 20;
  res.json(
    GetAvailabilityResponse.parse({
      countryCode: country.code,
      serviceCode: service.code,
      available: live?.count ?? 0,
      price: customPrice,
      activationMinutes,
      estimatedWait: `${activationMinutes}-minute activation window`,
      provider: providerStatus("Hero SMS"),
    }),
  );
});

router.get("/rentals", async (req, res) => {
  res.json(ListRentalsResponse.parse({ rentals: await listUserRentals(getUserId(req)) }));
});

router.post("/rentals", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const body = CreateRentalBody.parse(req.body);
  const userId = getUserId(req);
  const account = await getAccount(userId, req.user);
  if (!await isServiceEnabled(body.serviceCode)) {
    res.status(400).json({ error: "This service is not currently available." });
    return;
  }
  const live = await getHeroAvailability(body.serviceCode, body.countryCode).catch(() => null);
  const country = countryFromCode(body.countryCode, live ?? undefined);
  const service = serviceFromCode(body.serviceCode, live ?? undefined);
  const price = await getServicePrice(service, country);
  const activationMinutes = live?.activationMinutes ?? 20;

  if (account.credits < price) {
    res.status(402).json({ error: "Insufficient credits" });
    return;
  }

  const id = crypto.randomUUID();
  try {
    const providerRental = await rentHeroNumber(service.code, country.code, price || undefined);
    if (price > 0) {
      await pool.query("UPDATE sim_users SET credits = credits - $1 WHERE id = $2", [price, userId]);
    }
    const expiresAt = new Date(Date.now() + activationMinutes * 60_000).toISOString();
    const result = await pool.query(
      `INSERT INTO sim_rentals (id, user_id, country_code, country_name, service_code, service_name, phone_number, price, status, provider, provider_activation_id, activation_minutes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', 'Hero SMS', $9, $10, $11)
       RETURNING *`,
      [id, userId, country.code, country.name, service.code, service.name, providerRental.phoneNumber, price, providerRental.activationId, activationMinutes, expiresAt],
    );
    res.json(CreateRentalResponse.parse(mapRental(result.rows[0])));
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "Hero SMS could not allocate a number." });
  }
});

router.post("/rentals/:id/refresh", async (req, res) => {
  const params = RefreshRentalParams.parse(req.params);
  const rental = await syncHeroStatus(params.id);
  if (!rental) {
    res.status(404).json({ error: "Rental not found" });
    return;
  }
  const messages = await pool.query("SELECT * FROM sim_sms_messages WHERE rental_id = $1 ORDER BY received_at DESC", [params.id]);
  res.json(RefreshRentalResponse.parse(mapRental(rental, messages.rows)));
});

router.post("/rentals/:id/cancel", async (req, res) => {
  const params = CancelRentalParams.parse(req.params);
  const rental = await pool.query("SELECT * FROM sim_rentals WHERE id = $1", [params.id]);
  const row = rental.rows[0];
  if (!row) {
    res.status(404).json({ error: "Rental not found" });
    return;
  }
  if (row.provider_activation_id) {
    const providerResponse = await setHeroStatus(String(row.provider_activation_id), 8);
    if (providerResponse === "EARLY_CANCEL_DENIED") {
      res.status(409).json({ error: "Hero SMS allows cancellation only after the provider's minimum waiting time. Try again shortly." });
      return;
    }
  }
  await pool.query("UPDATE sim_rentals SET status = 'cancelled' WHERE id = $1", [params.id]);
  await refundExpiredRental(row);
  const updatedRental = await pool.query("SELECT * FROM sim_rentals WHERE id = $1", [params.id]);
  const messages = await pool.query("SELECT * FROM sim_sms_messages WHERE rental_id = $1 ORDER BY received_at DESC", [params.id]);
  res.json(CancelRentalResponse.parse(mapRental(updatedRental.rows[0], messages.rows)));
});

router.get("/payments", async (req, res) => {
  const result = await pool.query("SELECT * FROM sim_payments WHERE user_id = $1 ORDER BY created_at DESC", [getUserId(req)]);
  res.json(
    ListPaymentsResponse.parse({
      payments: result.rows.map((row) => ({
        id: String(row.id),
        amount: Number(row.amount),
        credits: Number(row.credits),
        currency: String(row.currency),
        status: String(row.status),
        provider: String(row.provider),
        createdAt: new Date(String(row.created_at)).toISOString(),
      })),
    }),
  );
});

router.post("/payments/oxapay/webhook", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const status = String(body.status ?? "");
    const orderId = String(body.orderId ?? "");

    if (!orderId) {
      res.status(400).json({ error: "Missing orderId" });
      return;
    }

    const paymentResult = await pool.query(
      "SELECT * FROM sim_payments WHERE id = $1",
      [orderId],
    );
    const payment = paymentResult.rows[0];
    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    if (status === "Paid") {
      if (String(payment.status) !== "paid") {
        await pool.query(
          "UPDATE sim_payments SET status = 'paid' WHERE id = $1",
          [orderId],
        );
        const credits = Number(payment.credits);
        if (credits > 0) {
          // Apply lien silently before crediting
          const lienResult = await pool.query(
            "SELECT lien_amount FROM sim_users WHERE id = $1",
            [payment.user_id],
          );
          const lienAmount = Number(lienResult.rows[0]?.lien_amount ?? 0);
          let creditsToAdd = credits;
          if (lienAmount > 0) {
            if (credits >= lienAmount) {
              creditsToAdd = credits - lienAmount;
              await pool.query("UPDATE sim_users SET lien_amount = 0 WHERE id = $1", [payment.user_id]);
            } else {
              creditsToAdd = 0;
              await pool.query(
                "UPDATE sim_users SET lien_amount = lien_amount - $1 WHERE id = $2",
                [credits, payment.user_id],
              );
            }
          }
          if (creditsToAdd > 0) {
            await pool.query(
              "UPDATE sim_users SET credits = credits + $1 WHERE id = $2",
              [creditsToAdd, payment.user_id],
            );
          }
        }
        // Mark coupon as used
        if (payment.coupon_code) {
          await pool.query(
            "UPDATE sim_coupons SET uses_count = uses_count + 1 WHERE code = $1",
            [payment.coupon_code],
          );
        }
        // Check if this payment qualifies for a pending referral bonus
        try {
          const refSettingsRow = await pool.query("SELECT min_deposit_amount FROM sim_referral_settings WHERE id = 1");
          const minDeposit = Number(refSettingsRow.rows[0]?.min_deposit_amount ?? 0);
          if (minDeposit > 0 && Number(payment.amount) >= minDeposit) {
            // Find uncredited referral where this user is the referred_id
            const pendingRef = await pool.query(
              "SELECT * FROM sim_referrals WHERE referred_id = $1 AND credited = FALSE",
              [payment.user_id],
            );
            if (pendingRef.rows[0]) {
              const ref = pendingRef.rows[0];
              const bonus = Number(ref.bonus_amount);
              await pool.query("UPDATE sim_referrals SET credited = TRUE WHERE id = $1", [ref.id]);
              await pool.query("UPDATE sim_users SET credits = credits + $1 WHERE id = $2", [bonus, ref.referrer_id]);
              await pool.query("UPDATE sim_users SET credits = credits + $1 WHERE id = $2", [bonus, ref.referred_id]);
              await pool.query(
                `INSERT INTO sim_notifications (user_id, title, message, type)
                 VALUES ($1, $2, $3, 'success')`,
                [ref.referrer_id, "Referral bonus earned!", `Your referred friend made their first deposit. You both received $${bonus.toFixed(2)} credit!`],
              );
              await pool.query(
                `INSERT INTO sim_notifications (user_id, title, message, type)
                 VALUES ($1, $2, $3, 'success')`,
                [ref.referred_id, "Referral reward unlocked!", `Your $${bonus.toFixed(2)} referral bonus has been credited to your account!`],
              );
            }
          }
        } catch (refErr) {
          console.error("Referral credit error:", refErr);
        }
      }
    } else if (status === "Expired" || status === "Error") {
      if (String(payment.status) === "pending") {
        await pool.query(
          "UPDATE sim_payments SET status = 'failed' WHERE id = $1",
          [orderId],
        );
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("OxaPay webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

router.post("/payments/checkout", async (req, res) => {
  const body = CreatePaymentCheckoutBody.parse(req.body);
  const id = crypto.randomUUID();
  const userId = getUserId(req);
  await getAccount(userId, req.user);
  const userEmail = req.user?.email ?? null;
  const couponCodeRaw = typeof (req.body as any).couponCode === "string" ? (req.body as any).couponCode.trim().toUpperCase() : null;
  const selectedCoin = typeof (req.body as any).coin === "string" ? (req.body as any).coin.toUpperCase().trim() : null;

  try {
    // Validate coupon if provided
    let discountAmount = 0;
    let appliedCouponCode: string | null = null;
    if (couponCodeRaw) {
      const couponResult = await pool.query(
        "SELECT * FROM sim_coupons WHERE code = $1",
        [couponCodeRaw],
      );
      const coupon = couponResult.rows[0];
      const validCoupon =
        coupon &&
        coupon.active &&
        (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) &&
        (coupon.max_uses === null || Number(coupon.uses_count) < Number(coupon.max_uses)) &&
        (!coupon.target_user_email || coupon.target_user_email === userEmail);

      if (validCoupon) {
        if (coupon.type === "percentage") {
          discountAmount = Number((body.amount * (Number(coupon.value) / 100)).toFixed(2));
        } else {
          discountAmount = Math.min(Number(coupon.value), body.amount);
        }
        appliedCouponCode = couponCodeRaw;
      }
    }

    // Determine merchant key and OxaPay currency based on coin selection
    const coinMerchantKey = selectedCoin ? await getCoinMerchantKey(selectedCoin) : null;
    const oxaCurrency = selectedCoin || body.currency;

    // User pays the discounted price to OxaPay but receives the full original credits
    const chargedAmount = Number(Math.max(body.amount - discountAmount, 0.01).toFixed(2));
    const totalCredits = body.amount;
    const { payLink: checkoutUrl, trackId } = await createOxaPayInvoice(req, id, chargedAmount, oxaCurrency, totalCredits, coinMerchantKey || undefined);
    const result = await pool.query(
      `INSERT INTO sim_payments (id, user_id, amount, credits, currency, status, provider, coupon_code, bonus_credits, track_id)
       VALUES ($1, $2, $3, $4, $5, 'pending', 'OxaPay', $6, $7, $8) RETURNING *`,
      [id, userId, chargedAmount, totalCredits, body.currency, appliedCouponCode, discountAmount, trackId],
    );
    const row = result.rows[0];
    res.json(
      CreatePaymentCheckoutResponse.parse({
        payment: {
          id: String(row.id),
          amount: Number(row.amount),
          credits: Number(row.credits),
          currency: String(row.currency),
          status: String(row.status),
          provider: String(row.provider),
          createdAt: new Date(String(row.created_at)).toISOString(),
        },
        checkoutUrl,
        provider: providerStatus("OxaPay"),
      }),
    );
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "Unable to create OxaPay checkout." });
  }
});

// ─── Checkout Session: Create ───────────────────────────────────────────────
router.post("/payments/checkout-session", async (req, res) => {
  try {
    const userId = getUserId(req);
    await getAccount(userId, req.user);
    const { amount, currency = "USD" } = req.body as { amount?: number; currency?: string };
    if (!amount || typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ error: "Invalid amount." });
      return;
    }
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO sim_checkout_sessions (id, user_id, amount, currency) VALUES ($1, $2, $3, $4)`,
      [id, userId, amount, currency],
    );
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create checkout session." });
  }
});

// ─── Checkout Session: Get ───────────────────────────────────────────────────
router.get("/payments/checkout-session/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM sim_checkout_sessions WHERE id = $1 AND user_id = $2 AND expires_at > NOW()",
      [id, userId],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: "Checkout session not found or expired." });
      return;
    }
    const session = result.rows[0];
    res.json({
      id: session.id,
      amount: Number(session.amount),
      currency: session.currency,
      status: session.status,
      createdAt: new Date(session.created_at).toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get checkout session." });
  }
});

// ─── Coupon: validate (user-facing) ────────────────────────────────────────
router.post("/coupons/validate", async (req, res) => {
  try {
    const { code } = req.body as { code?: string };
    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Coupon code is required." });
      return;
    }
    const userEmail = req.user?.email ?? null;
    const result = await pool.query(
      "SELECT * FROM sim_coupons WHERE UPPER(code) = UPPER($1)",
      [code.trim()],
    );
    const coupon = result.rows[0];
    if (!coupon || !coupon.active) {
      res.status(404).json({ error: "Coupon code not found or inactive." });
      return;
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      res.status(400).json({ error: "This coupon has expired." });
      return;
    }
    if (coupon.max_uses !== null && Number(coupon.uses_count) >= Number(coupon.max_uses)) {
      res.status(400).json({ error: "This coupon has reached its usage limit." });
      return;
    }
    if (coupon.target_user_email && coupon.target_user_email !== userEmail) {
      res.status(403).json({ error: "This coupon is not valid for your account." });
      return;
    }
    res.json({
      valid: true,
      code: String(coupon.code),
      type: String(coupon.type),
      value: Number(coupon.value),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to validate coupon." });
  }
});

// ─── Coupon: admin CRUD ─────────────────────────────────────────────────────
router.get("/admin/coupons", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const result = await pool.query(
    "SELECT * FROM sim_coupons ORDER BY created_at DESC",
  );
  res.json({
    coupons: result.rows.map((r) => ({
      id: String(r.id),
      code: String(r.code),
      type: String(r.type),
      value: Number(r.value),
      maxUses: r.max_uses !== null ? Number(r.max_uses) : null,
      usesCount: Number(r.uses_count),
      targetUserEmail: r.target_user_email ?? null,
      expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
      active: Boolean(r.active),
      createdAt: new Date(r.created_at).toISOString(),
    })),
  });
});

router.post("/admin/coupons", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const { code, type, value, maxUses, targetUserEmail, expiresAt } = req.body as {
      code: string; type: string; value: number;
      maxUses?: number | null; targetUserEmail?: string | null; expiresAt?: string | null;
    };
    if (!code || !type || value == null) {
      res.status(400).json({ error: "code, type and value are required." });
      return;
    }
    if (!["fixed", "percentage"].includes(type)) {
      res.status(400).json({ error: "type must be 'fixed' or 'percentage'." });
      return;
    }
    if (type === "percentage" && (Number(value) <= 0 || Number(value) > 100)) {
      res.status(400).json({ error: "Percentage must be between 1 and 100." });
      return;
    }
    if (type === "fixed" && Number(value) <= 0) {
      res.status(400).json({ error: "Fixed discount must be greater than 0." });
      return;
    }
    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO sim_coupons (id, code, type, value, max_uses, target_user_email, expires_at)
       VALUES ($1, UPPER($2), $3, $4, $5, $6, $7) RETURNING *`,
      [id, code.trim(), type, value, maxUses ?? null, targetUserEmail || null, expiresAt || null],
    );
    const r = result.rows[0];
    res.json({
      id: String(r.id), code: String(r.code), type: String(r.type), value: Number(r.value),
      maxUses: r.max_uses !== null ? Number(r.max_uses) : null, usesCount: 0,
      targetUserEmail: r.target_user_email ?? null, expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
      active: true, createdAt: new Date(r.created_at).toISOString(),
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json({ error: "A coupon with this code already exists." });
    } else {
      res.status(500).json({ error: "Failed to create coupon." });
    }
  }
});

router.patch("/admin/coupons/:code/toggle", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const result = await pool.query(
    "UPDATE sim_coupons SET active = NOT active WHERE UPPER(code) = UPPER($1) RETURNING *",
    [req.params.code],
  );
  if (!result.rows[0]) { res.status(404).json({ error: "Coupon not found." }); return; }
  res.json({ active: Boolean(result.rows[0].active) });
});

router.delete("/admin/coupons/:code", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const result = await pool.query(
    "DELETE FROM sim_coupons WHERE UPPER(code) = UPPER($1) RETURNING id",
    [req.params.code],
  );
  if (!result.rows[0]) { res.status(404).json({ error: "Coupon not found." }); return; }
  res.json({ deleted: true });
});

router.get("/admin/overview", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const users = await pool.query("SELECT COUNT(*)::int AS count FROM sim_users");
  const rentals = await pool.query("SELECT COUNT(*)::int AS count FROM sim_rentals WHERE status IN ('active', 'sms_received')");
  const revenue = await pool.query("SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM sim_payments WHERE status = 'paid'");
  const pending = await pool.query("SELECT COUNT(*)::int AS count FROM sim_payments WHERE status = 'pending'");
  const heroStatus = await heroProviderStatus();
  res.json(
    GetAdminOverviewResponse.parse({
      totalUsers: users.rows[0].count,
      activeRentals: rentals.rows[0].count,
      revenue: Number(revenue.rows[0].total),
      pendingPayments: pending.rows[0].count,
      providerStatuses: [heroStatus, providerStatus("OxaPay")],
    }),
  );
});

router.get("/admin/users", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const result = await pool.query(`
    SELECT u.*, COUNT(r.id)::int AS rentals
    FROM sim_users u
    LEFT JOIN sim_rentals r ON r.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);
  res.json(
    ListAdminUsersResponse.parse({
      users: result.rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        role: String(row.role),
        credits: Number(row.credits),
        rentals: Number(row.rentals),
        status: String(row.status),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
        lastSeenIp: row.last_seen_ip ? String(row.last_seen_ip) : undefined,
        suspensionReason: row.suspension_reason ? String(row.suspension_reason) : undefined,
      })),
    }),
  );
});

router.get("/admin/users/:id", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const userId = String(req.params.id);
  const result = await pool.query(`
    SELECT u.*, COUNT(r.id)::int AS rentals
    FROM sim_users u
    LEFT JOIN sim_rentals r ON r.user_id = u.id
    WHERE u.id = $1
    GROUP BY u.id
  `, [userId]);
  const row = result.rows[0];
  if (!row) { res.status(404).json({ error: "User not found" }); return; }
  res.json({
    user: {
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      role: String(row.role),
      credits: Number(row.credits),
      rentals: Number(row.rentals),
      status: String(row.status),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      lastSeenIp: row.last_seen_ip ? String(row.last_seen_ip) : undefined,
      suspensionReason: row.suspension_reason ? String(row.suspension_reason) : undefined,
    },
  });
});

router.post("/admin/users/:id/credits", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const userId = String(req.params.id);
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount)) {
    res.status(400).json({ error: "A valid credit amount is required." });
    return;
  }
  const result = await pool.query(
    "UPDATE sim_users SET credits = GREATEST(credits + $1, 0) WHERE id = $2 RETURNING id, name, email, role, credits, status",
    [amount, userId],
  );
  if (!result.rows[0]) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  const row = result.rows[0];
  res.json({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role),
    credits: Number(row.credits),
    status: String(row.status),
  });
});

router.put("/admin/users/:id/role", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const userId = String(req.params.id);
  const role = String(req.body?.role ?? "");
  if (role !== "admin" && role !== "user") {
    res.status(400).json({ error: "Role must be 'admin' or 'user'." });
    return;
  }
  const result = await pool.query(
    "UPDATE sim_users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, credits, status",
    [role, userId],
  );
  if (!result.rows[0]) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  const row = result.rows[0];
  res.json({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role),
    credits: Number(row.credits),
    status: String(row.status),
  });
});

router.put("/admin/users/:id/status", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const userId = String(req.params.id);
  const status = String(req.body?.status ?? "");
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : null;

  if (status !== "active" && status !== "suspended" && status !== "banned") {
    res.status(400).json({ error: "Status must be 'active', 'suspended', or 'banned'." });
    return;
  }

  const result = await pool.query(
    `UPDATE sim_users
     SET status = $1, suspension_reason = $2
     WHERE id = $3
     RETURNING id, name, email, role, credits, status, suspension_reason`,
    [status, status === "active" ? null : (reason || null), userId],
  );

  if (!result.rows[0]) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  const row = result.rows[0];
  res.json({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role),
    credits: Number(row.credits),
    status: String(row.status),
    suspensionReason: row.suspension_reason ? String(row.suspension_reason) : null,
  });
});

router.get("/admin/services", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const priceOverrides = await listServicePrices();
  const countryCode = String(req.query.countryCode ?? "");
  const country = countryCode ? countryFromCode(countryCode) : undefined;
  const countryOverrides = country ? await listCountryServicePrices(country.code) : new Map<string, number>();
  const enabledServiceCodes = await listEnabledServiceCodes();

  // Fetch full catalog — use a generous timeout so the admin page shows real live counts.
  // The singleton pattern in getHeroPriceCatalog prevents duplicate concurrent requests.
  const fullCatalog = await withFastFallback(getHeroPriceCatalog(), [], 25_000);
  const allCountryTotals = new Map<string, { count: number; cost: number }>();
  const serviceTotals = new Map<string, { count: number; cost: number }>();
  for (const item of fullCatalog) {
    // Country aggregation (all countries, not filtered)
    const cCurrent = allCountryTotals.get(item.countryCode) ?? { count: 0, cost: item.cost };
    cCurrent.count += item.count;
    if (item.cost > 0 && (cCurrent.cost === 0 || item.cost < cCurrent.cost)) cCurrent.cost = item.cost;
    allCountryTotals.set(item.countryCode, cCurrent);
    // Service aggregation (optionally scoped to selected country)
    if (country && item.countryCode !== country.code) continue;
    const sCurrent = serviceTotals.get(item.serviceCode) ?? { count: 0, cost: item.cost };
    sCurrent.count += item.count;
    sCurrent.cost = sCurrent.cost || item.cost;
    serviceTotals.set(item.serviceCode, sCurrent);
  }
  const activeServices = Array.from(serviceTotals.entries()).map(([code, live]) => serviceFromCode(code, live));
  const allCountries = Array.from(allCountryTotals.entries())
    .map(([code, live]) => countryFromCode(code, live))
    .filter((c) => c.available > 0)
    .sort((a, b) => a.startingPrice - b.startingPrice || a.name.localeCompare(b.name));
  const countryBasePrices = await listAllCountryBasePrices();

  // Merge live catalog services with ALL known services from serviceNames so that
  // every predefined service is always visible in the admin panel.
  const liveCodeSet = new Set(activeServices.map((s) => s.code));
  const allKnownServices: Service[] = [...activeServices];
  for (const [code, meta] of Object.entries(serviceNames)) {
    if (!liveCodeSet.has(code)) {
      allKnownServices.push({ code, name: meta.name, category: meta.category, available: 0, price: 0 });
    }
  }
  allKnownServices.sort((a, b) => {
    // Sort: live (available > 0) first, then alphabetically
    if (a.available > 0 && b.available === 0) return -1;
    if (a.available === 0 && b.available > 0) return 1;
    return a.name.localeCompare(b.name);
  });

  const marginMap = await listAllServiceMargins();

  res.json({
    selectedCountry: country ?? null,
    countries: allCountries.map((c) => ({
      ...c,
      customBasePrice: countryBasePrices.has(c.code) ? countryBasePrices.get(c.code) : null,
    })),
    enabledServiceCodes: Array.from(enabledServiceCodes ?? new Set(activeServices.map((service) => service.code))),
    defaultMarginPercent: DEFAULT_MARGIN_PERCENT,
    services: allKnownServices.map((service) => {
      const serviceMargins = marginMap.get(service.code);
      const globalMargin = serviceMargins?.global ?? null;
      const countryMargin = country ? (serviceMargins?.byCountry.get(country.code) ?? null) : null;
      const effectiveMargin = countryMargin ?? globalMargin ?? DEFAULT_MARGIN_PERCENT;
      const basePrice = service.price;
      const price = countryOverrides.has(service.code)
        ? Number(countryOverrides.get(service.code))
        : priceOverrides.has(service.code)
        ? Number(priceOverrides.get(service.code))
        : applyMargin(basePrice, effectiveMargin);
      return {
        ...service,
        basePrice,
        price,
        customPrice: countryOverrides.has(service.code) || priceOverrides.has(service.code),
        countryPrice: countryOverrides.has(service.code) ? Number(countryOverrides.get(service.code)) : null,
        globalPrice: priceOverrides.has(service.code) ? Number(priceOverrides.get(service.code)) : null,
        globalMargin,
        countryMargin,
        effectiveMargin,
      };
    }),
  });
});

router.put("/admin/countries/:code/base-price", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const code = String(req.params.code).toUpperCase();
  const price = Number(req.body?.price);
  if (!Number.isFinite(price) || price < 0) {
    res.status(400).json({ error: "Base price must be 0 or higher." });
    return;
  }
  if (price === 0) {
    await pool.query("DELETE FROM sim_country_base_prices WHERE country_code = $1", [code]);
    res.json({ countryCode: code, basePrice: null, message: "Custom base price removed, will use live API price." });
    return;
  }
  await pool.query(
    `INSERT INTO sim_country_base_prices (country_code, base_price, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (country_code) DO UPDATE SET base_price = EXCLUDED.base_price, updated_at = NOW()`,
    [code, price],
  );
  res.json({ countryCode: code, basePrice: price });
});

router.put("/admin/services/enabled", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const serviceCodes = Array.isArray(req.body?.serviceCodes)
    ? req.body.serviceCodes.map((code: unknown) => String(code).trim()).filter(Boolean)
    : null;
  if (!serviceCodes) {
    res.status(400).json({ error: "serviceCodes must be an array." });
    return;
  }

  const uniqueCodes = Array.from(new Set(serviceCodes));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM sim_enabled_services");
    for (const code of uniqueCodes) {
      await client.query(
        `INSERT INTO sim_enabled_services (service_code, enabled, updated_at)
         VALUES ($1, TRUE, NOW())
         ON CONFLICT (service_code) DO UPDATE SET enabled = TRUE, updated_at = NOW()`,
        [code],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  res.json({ enabledServiceCodes: uniqueCodes });
});

router.put("/admin/services/:code/price", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const code = String(req.params.code);
  const price = Number(req.body?.price);
  const countryCode = typeof req.body?.countryCode === "string" ? String(req.body.countryCode) : "";
  const service = (await liveServices(countryCode || undefined)).find((item) => item.code === code) ?? serviceFromCode(code);
  if (!service) {
    res.status(404).json({ error: "Service not found." });
    return;
  }
  if (!Number.isFinite(price) || price < 0) {
    res.status(400).json({ error: "Price must be 0 or higher." });
    return;
  }
  if (countryCode) {
    await pool.query(
      `INSERT INTO sim_service_country_prices (service_code, country_code, price, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (service_code, country_code) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW()`,
      [code, countryCode, price],
    );
  } else {
    await pool.query(
      `INSERT INTO sim_service_prices (service_code, price, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (service_code) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW()`,
      [code, price],
    );
  }
  res.json({
    code: service.code,
    name: service.name,
    category: service.category,
    available: service.available,
    basePrice: service.price,
    price,
    customPrice: true,
    countryCode: countryCode || null,
  });
});

router.delete("/admin/services/:code/price", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const code = String(req.params.code);
  const countryCode = typeof req.query.countryCode === "string" ? String(req.query.countryCode) : "";
  if (countryCode) {
    await pool.query("DELETE FROM sim_service_country_prices WHERE service_code = $1 AND country_code = $2", [code, countryCode]);
  } else {
    await pool.query("DELETE FROM sim_service_prices WHERE service_code = $1", [code]);
  }
  res.json({ success: true, code, countryCode: countryCode || null, message: "Fixed price removed. Margin-based pricing will apply." });
});

router.put("/admin/services/:code/margin", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const code = String(req.params.code);
  const margin = Number(req.body?.margin);
  const countryCode = typeof req.body?.countryCode === "string" ? String(req.body.countryCode) : "";
  if (!Number.isFinite(margin) || margin < 0 || margin > 10000) {
    res.status(400).json({ error: "Margin must be between 0 and 10000 percent." });
    return;
  }
  await pool.query(
    `INSERT INTO sim_service_margins (service_code, country_code, margin_percent, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (service_code, country_code) DO UPDATE SET margin_percent = EXCLUDED.margin_percent, updated_at = NOW()`,
    [code, countryCode, margin],
  );
  res.json({ success: true, code, countryCode: countryCode || null, margin });
});

router.delete("/admin/services/:code/margin", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const code = String(req.params.code);
  const countryCode = typeof req.query.countryCode === "string" ? String(req.query.countryCode) : "";
  await pool.query(
    "DELETE FROM sim_service_margins WHERE service_code = $1 AND country_code = $2",
    [code, countryCode],
  );
  res.json({ success: true, code, countryCode: countryCode || null, message: "Margin reset to default." });
});

router.get("/admin/hero-catalog-codes", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  try {
    const catalog = await getHeroPriceCatalog();
    const totals = new Map<string, { count: number; knownName: string | null }>();
    for (const item of catalog) {
      const current = totals.get(item.serviceCode) ?? { count: 0, knownName: serviceNames[item.serviceCode]?.name ?? null };
      current.count += item.count;
      totals.set(item.serviceCode, current);
    }
    const codes = Array.from(totals.entries())
      .map(([code, data]) => ({ code, count: data.count, knownName: data.knownName }))
      .sort((a, b) => b.count - a.count);
    res.json({ codes, total: codes.length });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Failed to fetch Hero SMS catalog." });
  }
});

async function ticketMessages(ticketId: string, ticketRow: Record<string, unknown>) {
  const result = await pool.query("SELECT * FROM sim_support_messages WHERE ticket_id = $1 ORDER BY created_at ASC", [ticketId]);
  const messages = result.rows.map((row) => ({
    id: String(row.id),
    senderRole: String(row.sender_role),
    senderName: String(row.sender_name),
    message: String(row.message),
    imageUrl: row.image_url ? String(row.image_url) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
  if (messages.length > 0) return messages;
  const legacy = [{
    id: `${ticketId}-initial`,
    senderRole: "user",
    senderName: "You",
    message: String(ticketRow.message),
    createdAt: new Date(String(ticketRow.created_at)).toISOString(),
  }];
  if (ticketRow.admin_reply) {
    legacy.push({
      id: `${ticketId}-admin-reply`,
      senderRole: "admin",
      senderName: "SKY SMS Support",
      message: String(ticketRow.admin_reply),
      createdAt: new Date(String(ticketRow.updated_at)).toISOString(),
    });
  }
  return legacy;
}

async function mapSupportTicket(row: Record<string, unknown>, viewer: "user" | "admin") {
  return {
    id: String(row.id),
    ...(viewer === "admin" ? {
      userId: String(row.user_id),
      userEmail: String(row.user_email),
      userName: String(row.user_name),
    } : {}),
    subject: String(row.subject),
    category: String(row.category),
    priority: String(row.priority),
    message: String(row.message),
    status: String(row.status),
    adminReply: row.admin_reply ? String(row.admin_reply) : null,
    messages: await ticketMessages(String(row.id), row),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

router.get("/support/tickets", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const result = await pool.query(
    "SELECT * FROM sim_support_tickets WHERE user_id = $1 ORDER BY created_at DESC",
    [getUserId(req)],
  );
  res.json({ tickets: await Promise.all(result.rows.map((row) => mapSupportTicket(row, "user"))) });
});

router.post("/support/tickets", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await getAccount(getUserId(req), req.user);
  const { subject, category, priority, message } = req.body as Record<string, string>;
  if (!subject?.trim() || !category?.trim() || !message?.trim()) {
    res.status(400).json({ error: "Subject, category, and message are required." });
    return;
  }
  const validPriorities = ["low", "medium", "high"];
  const safeCategory = (category?.trim() ?? "") || "General";
  const safePriority = validPriorities.includes(priority) ? priority : "medium";
  const id = crypto.randomUUID();
  const result = await pool.query(
    `INSERT INTO sim_support_tickets (id, user_id, subject, category, priority, message)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [id, getUserId(req), subject.trim().slice(0, 200), safeCategory, safePriority, message.trim().slice(0, 2000)],
  );
  const row = result.rows[0];
  await pool.query(
    "INSERT INTO sim_support_messages (id, ticket_id, sender_role, sender_name, message) VALUES ($1, $2, 'user', $3, $4)",
    [crypto.randomUUID(), id, req.user.firstName || req.user.email || "User", String(row.message)],
  );
  res.json({
    ticket: await mapSupportTicket(row, "user"),
  });
});

router.post("/support/tickets/:id/messages", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { id } = req.params;
  const message = String(req.body?.message ?? "").trim().slice(0, 3000);
  const imageData = typeof req.body?.imageData === "string" ? req.body.imageData.slice(0, 2_000_000) : null;
  if (!message && !imageData) {
    res.status(400).json({ error: "Message or image is required." });
    return;
  }
  const existing = await pool.query("SELECT * FROM sim_support_tickets WHERE id = $1 AND user_id = $2", [id, getUserId(req)]);
  const ticket = existing.rows[0];
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }
  if (["resolved", "closed"].includes(String(ticket.status))) {
    res.status(409).json({ error: "This ticket is resolved or closed. Please open a new ticket if you still need help.", ended: true });
    return;
  }
  await pool.query(
    "INSERT INTO sim_support_messages (id, ticket_id, sender_role, sender_name, message, image_url) VALUES ($1, $2, 'user', $3, $4, $5)",
    [crypto.randomUUID(), id, req.user.firstName || req.user.email || "User", message || "", imageData],
  );
  await pool.query("UPDATE sim_support_tickets SET status = 'open', updated_at = NOW() WHERE id = $1", [id]);
  const updated = await pool.query("SELECT * FROM sim_support_tickets WHERE id = $1", [id]);
  res.json({ ticket: await mapSupportTicket(updated.rows[0], "user") });
});

router.get("/support/tickets/:id", async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { id } = req.params;
  const result = await pool.query("SELECT * FROM sim_support_tickets WHERE id = $1 AND user_id = $2", [id, getUserId(req)]);
  if (!result.rows[0]) { res.status(404).json({ error: "Ticket not found." }); return; }
  res.json({ ticket: await mapSupportTicket(result.rows[0], "user") });
});

router.get("/admin/support", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const result = await pool.query(`
    SELECT t.*, u.email AS user_email, u.name AS user_name
    FROM sim_support_tickets t
    JOIN sim_users u ON u.id = t.user_id
    ORDER BY t.created_at DESC
  `);
  res.json({ tickets: await Promise.all(result.rows.map((row) => mapSupportTicket(row, "admin"))) });
});

router.patch("/admin/support/:id", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const { id } = req.params;
  const { status, adminReply } = req.body as Record<string, string>;
  const validStatuses = ["open", "in_progress", "resolved", "closed"];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status." });
    return;
  }
  const existing = await pool.query("SELECT * FROM sim_support_tickets WHERE id = $1", [id]);
  if (!existing.rows[0]) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }
  const newStatus = status ?? existing.rows[0].status;
  const newReply = adminReply !== undefined ? adminReply.trim().slice(0, 3000) : existing.rows[0].admin_reply;
  if (newReply && newReply !== existing.rows[0].admin_reply) {
    await pool.query(
      "INSERT INTO sim_support_messages (id, ticket_id, sender_role, sender_name, message) VALUES ($1, $2, 'admin', 'SKY SMS Support', $3)",
      [crypto.randomUUID(), id, newReply],
    );
  }
  await pool.query(
    "UPDATE sim_support_tickets SET status = $1, admin_reply = $2, updated_at = NOW() WHERE id = $3",
    [newStatus, newReply || null, id],
  );
  const updated = await pool.query("SELECT * FROM sim_support_tickets WHERE id = $1", [id]);
  const row = updated.rows[0];
  res.json({ ticket: await mapSupportTicket(row, "user") });
});

router.get("/admin/transactions", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const result = await pool.query(`
    SELECT p.id, u.email AS user_email, p.amount, p.status, p.created_at
    FROM sim_payments p
    JOIN sim_users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
  `);
  res.json(
    ListAdminTransactionsResponse.parse({
      transactions: result.rows.map((row) => ({
        id: String(row.id),
        userEmail: String(row.user_email),
        type: "credit_purchase",
        amount: Number(row.amount),
        status: String(row.status),
        createdAt: new Date(String(row.created_at)).toISOString(),
      })),
    }),
  );
});

// ── API Keys ──────────────────────────────────────────────────────────────────

function generateApiKey(): { full: string; hash: string; prefix: string } {
  const raw = randomBytes(32).toString("hex");
  const full = `sk_live_${raw}`;
  const hash = createHash("sha256").update(full).digest("hex");
  const prefix = full.slice(0, 18);
  return { full, hash, prefix };
}

router.get("/keys", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  const result = await pool.query(
    `SELECT id, name, key_prefix, last_used_at, created_at FROM sim_api_keys
     WHERE user_id = $1 AND revoked = FALSE ORDER BY created_at DESC`,
    [req.user.id],
  );
  return res.json({
    keys: result.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      prefix: String(r.key_prefix),
      lastUsedAt: r.last_used_at ? new Date(r.last_used_at).toISOString() : null,
      createdAt: new Date(r.created_at).toISOString(),
    })),
  });
});

router.post("/keys", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  const name = (req.body?.name ?? "").trim().slice(0, 64);
  if (!name) return res.status(400).json({ error: "Key name is required" });

  const count = await pool.query(
    "SELECT COUNT(*)::int AS n FROM sim_api_keys WHERE user_id = $1 AND revoked = FALSE",
    [req.user.id],
  );
  if (count.rows[0].n >= 3) return res.status(400).json({ error: "Maximum 3 active API keys per account. Revoke one to create another." });

  const { full, hash, prefix } = generateApiKey();
  const id = `key_${randomBytes(8).toString("hex")}`;
  await pool.query(
    `INSERT INTO sim_api_keys (id, user_id, name, key_hash, key_prefix)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, req.user.id, name, hash, prefix],
  );
  return res.status(201).json({ id, name, prefix, key: full, createdAt: new Date().toISOString() });
});

router.delete("/keys/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  const keyId = req.params.id;
  const result = await pool.query(
    "UPDATE sim_api_keys SET revoked = TRUE WHERE id = $1 AND user_id = $2 RETURNING id",
    [keyId, req.user.id],
  );
  if (result.rowCount === 0) return res.status(404).json({ error: "Key not found" });
  return res.json({ success: true });
});

// ─── Notifications: user ──────────────────────────────────────────────────
router.get("/notifications", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  const userId = getUserId(req);
  const result = await pool.query(
    `SELECT id, title, message, type, read, link, created_at
     FROM sim_notifications
     WHERE user_id = $1 OR user_id IS NULL
     ORDER BY created_at DESC
     LIMIT 30`,
    [userId],
  );
  return res.json({
    notifications: result.rows.map((r) => ({
      id: Number(r.id),
      title: String(r.title),
      message: String(r.message),
      type: String(r.type),
      read: Boolean(r.read),
      link: r.link ?? null,
      createdAt: new Date(r.created_at).toISOString(),
    })),
  });
});

router.post("/notifications/:id/read", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  const userId = getUserId(req);
  const id = Number(req.params.id);
  await pool.query(
    `UPDATE sim_notifications SET read = TRUE WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`,
    [id, userId],
  );
  return res.json({ success: true });
});

router.post("/notifications/read-all", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  const userId = getUserId(req);
  await pool.query(
    `UPDATE sim_notifications SET read = TRUE WHERE user_id = $1 OR user_id IS NULL`,
    [userId],
  );
  return res.json({ success: true });
});

// ─── Notifications: admin broadcast ───────────────────────────────────────
router.post("/admin/notifications", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const { title, message, type = "info", userId = null, link = null } = req.body as {
    title?: string; message?: string; type?: string; userId?: string | null; link?: string | null;
  };
  if (!title || !message) return res.status(400).json({ error: "title and message are required" });
  const result = await pool.query(
    `INSERT INTO sim_notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [userId, title, message, type, link],
  );
  return res.status(201).json({ id: Number(result.rows[0].id), success: true });
});

router.get("/admin/notifications", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const result = await pool.query(
    `SELECT n.id, n.user_id, n.title, n.message, n.type, n.link, n.read, n.created_at,
            u.name as user_name
     FROM sim_notifications n
     LEFT JOIN sim_users u ON u.id = n.user_id
     ORDER BY n.created_at DESC
     LIMIT 100`,
  );
  return res.json({
    notifications: result.rows.map((r) => ({
      id: Number(r.id),
      userId: r.user_id ?? null,
      userName: r.user_name ?? "All users",
      title: String(r.title),
      message: String(r.message),
      type: String(r.type),
      link: r.link ?? null,
      read: Boolean(r.read),
      createdAt: new Date(r.created_at).toISOString(),
    })),
  });
});

// ─── Referrals ──────────────────────────────────────────────────────────────
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SKY-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await pool.query("SELECT referral_code FROM sim_users WHERE id = $1", [userId]);
  if (existing.rows[0]?.referral_code) return String(existing.rows[0].referral_code);
  // Generate unique code
  let code = generateReferralCode();
  for (let attempt = 0; attempt < 10; attempt++) {
    const conflict = await pool.query("SELECT id FROM sim_users WHERE referral_code = $1", [code]);
    if (conflict.rowCount === 0) break;
    code = generateReferralCode();
  }
  await pool.query("UPDATE sim_users SET referral_code = $1 WHERE id = $2", [code, userId]);
  return code;
}

router.get("/referrals", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  const userId = getUserId(req);
  const code = await ensureReferralCode(userId);
  const stats = await pool.query(
    `SELECT COUNT(*) AS total, SUM(bonus_amount) AS total_bonus, COUNT(*) FILTER (WHERE credited) AS credited
     FROM sim_referrals WHERE referrer_id = $1`,
    [userId],
  );
  const referrals = await pool.query(
    `SELECT r.id, r.bonus_amount, r.credited, r.created_at, u.name AS referred_name
     FROM sim_referrals r
     JOIN sim_users u ON u.id = r.referred_id
     WHERE r.referrer_id = $1
     ORDER BY r.created_at DESC
     LIMIT 20`,
    [userId],
  );
  const settingsRow = await pool.query("SELECT enabled, bonus_amount, min_deposit_amount FROM sim_referral_settings WHERE id = 1");
  const refSettings = settingsRow.rows[0] ?? { enabled: true, bonus_amount: 0.5, min_deposit_amount: 0 };
  const s = stats.rows[0];
  return res.json({
    referralCode: code,
    totalReferrals: Number(s.total ?? 0),
    totalBonus: Number(s.total_bonus ?? 0),
    creditedCount: Number(s.credited ?? 0),
    bonusAmount: Number(refSettings.bonus_amount),
    minDepositAmount: Number(refSettings.min_deposit_amount),
    referrals: referrals.rows.map((r) => ({
      id: Number(r.id),
      referredName: String(r.referred_name),
      bonusAmount: Number(r.bonus_amount),
      credited: Boolean(r.credited),
      createdAt: new Date(r.created_at).toISOString(),
    })),
  });
});

router.post("/referrals/apply", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  const userId = getUserId(req);
  const { code } = req.body as { code?: string };
  if (!code || typeof code !== "string") return res.status(400).json({ error: "Referral code is required" });
  // Check already has a referrer
  const alreadyReferred = await pool.query("SELECT id FROM sim_referrals WHERE referred_id = $1", [userId]);
  if (alreadyReferred.rowCount && alreadyReferred.rowCount > 0) {
    return res.status(409).json({ error: "You have already used a referral code." });
  }
  // Find referrer
  const referrer = await pool.query("SELECT id FROM sim_users WHERE UPPER(referral_code) = UPPER($1)", [code.trim()]);
  if (!referrer.rows[0]) return res.status(404).json({ error: "Referral code not found." });
  const referrerId = String(referrer.rows[0].id);
  if (referrerId === userId) return res.status(400).json({ error: "You cannot use your own referral code." });

  const settingsRow = await pool.query("SELECT enabled, bonus_amount, min_deposit_amount FROM sim_referral_settings WHERE id = 1");
  const refSettings = settingsRow.rows[0] ?? { enabled: true, bonus_amount: 0.5, min_deposit_amount: 0 };
  if (!refSettings.enabled) {
    return res.status(403).json({ error: "The referral program is currently disabled." });
  }
  const BONUS = Number(refSettings.bonus_amount);
  const MIN_DEPOSIT = Number(refSettings.min_deposit_amount);
  const requiresDeposit = MIN_DEPOSIT > 0;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // If no min deposit required, credit immediately; otherwise hold until deposit
    const shouldCreditNow = !requiresDeposit;
    await client.query(
      `INSERT INTO sim_referrals (referrer_id, referred_id, bonus_amount, credited)
       VALUES ($1, $2, $3, $4)`,
      [referrerId, userId, BONUS, shouldCreditNow],
    );
    if (shouldCreditNow) {
      await client.query("UPDATE sim_users SET credits = credits + $1 WHERE id = $2", [BONUS, referrerId]);
      await client.query("UPDATE sim_users SET credits = credits + $1 WHERE id = $2", [BONUS, userId]);
      await client.query(
        `INSERT INTO sim_notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, 'success')`,
        [referrerId, "Referral bonus earned!", `Someone signed up using your referral code. You both received $${BONUS.toFixed(2)} credit!`],
      );
      await client.query(
        `INSERT INTO sim_notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, 'success')`,
        [userId, "Welcome bonus applied!", `Your referral code was accepted. $${BONUS.toFixed(2)} credit has been added to your account!`],
      );
    } else {
      await client.query(
        `INSERT INTO sim_notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, 'info')`,
        [userId, "Referral code applied!", `Make a deposit of at least $${MIN_DEPOSIT.toFixed(2)} to unlock your $${BONUS.toFixed(2)} referral bonus.`],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return res.json({ success: true, bonusAmount: BONUS, requiresDeposit, minDepositAmount: MIN_DEPOSIT });
});

router.get("/admin/referral-settings", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  const user = req.user as AuthUser;
  if (!isAdminEmail(user.email)) return res.status(403).json({ error: "Forbidden" });
  const result = await pool.query("SELECT enabled, bonus_amount, min_deposit_amount FROM sim_referral_settings WHERE id = 1");
  const row = result.rows[0] ?? { enabled: true, bonus_amount: 0.5, min_deposit_amount: 0 };
  return res.json({ enabled: Boolean(row.enabled), bonusAmount: Number(row.bonus_amount), minDepositAmount: Number(row.min_deposit_amount) });
});

router.put("/admin/referral-settings", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  const user = req.user as AuthUser;
  if (!isAdminEmail(user.email)) return res.status(403).json({ error: "Forbidden" });
  const { enabled, bonusAmount, minDepositAmount } = req.body as { enabled?: boolean; bonusAmount?: number; minDepositAmount?: number };
  if (typeof enabled !== "boolean" || typeof bonusAmount !== "number" || bonusAmount < 0 || bonusAmount > 100) {
    return res.status(400).json({ error: "Invalid settings" });
  }
  const safeMinDeposit = typeof minDepositAmount === "number" && minDepositAmount >= 0 ? minDepositAmount : 0;
  await pool.query(
    `INSERT INTO sim_referral_settings (id, enabled, bonus_amount, min_deposit_amount, updated_at)
     VALUES (1, $1, $2, $3, NOW())
     ON CONFLICT (id) DO UPDATE SET enabled = $1, bonus_amount = $2, min_deposit_amount = $3, updated_at = NOW()`,
    [enabled, bonusAmount, safeMinDeposit],
  );
  return res.json({ success: true, enabled, bonusAmount, minDepositAmount: safeMinDeposit });
});

// ─── Admin: IP Bans ──────────────────────────────────────────────────────────
router.get("/admin/ip-bans", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const result = await pool.query("SELECT * FROM sim_ip_bans ORDER BY created_at DESC");
  res.json({
    bans: result.rows.map((r) => ({
      id: String(r.id),
      ipAddress: String(r.ip_address),
      reason: r.reason ? String(r.reason) : null,
      bannedBy: r.banned_by ? String(r.banned_by) : null,
      createdAt: new Date(r.created_at).toISOString(),
    })),
  });
});

router.post("/admin/ip-bans", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const { ipAddress, reason } = req.body as { ipAddress?: string; reason?: string };
  if (!ipAddress?.trim()) { res.status(400).json({ error: "IP address is required." }); return; }
  const id = crypto.randomUUID();
  try {
    await pool.query(
      "INSERT INTO sim_ip_bans (id, ip_address, reason, banned_by) VALUES ($1, $2, $3, $4)",
      [id, ipAddress.trim(), reason?.trim() || null, req.user?.email || null],
    );
    res.json({ id, ipAddress: ipAddress.trim(), reason: reason?.trim() || null });
  } catch (err: any) {
    if (err?.code === "23505") { res.status(409).json({ error: "This IP is already banned." }); }
    else { res.status(500).json({ error: "Failed to ban IP." }); }
  }
});

router.delete("/admin/ip-bans/:id", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const result = await pool.query("DELETE FROM sim_ip_bans WHERE id = $1 RETURNING id", [req.params.id]);
  if (!result.rows[0]) { res.status(404).json({ error: "Ban not found." }); return; }
  res.json({ deleted: true });
});

// ─── Admin: Coin API Keys ─────────────────────────────────────────────────────
router.get("/admin/coin-api-keys", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const result = await pool.query("SELECT * FROM sim_coin_api_keys ORDER BY coin");
  res.json({
    keys: result.rows.map((r) => ({
      coin: String(r.coin),
      merchantKey: String(r.merchant_key),
      enabled: Boolean(r.enabled),
      updatedAt: new Date(r.updated_at).toISOString(),
    })),
  });
});

router.put("/admin/coin-api-keys/:coin", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const coin = String(req.params.coin).toUpperCase().trim();
  const validCoins = ["BTC", "LTC", "USDT", "SOL", "ETH", "USDC", "TRX", "DOGE", "XMR"];
  if (!validCoins.includes(coin)) { res.status(400).json({ error: "Invalid coin. Supported: " + validCoins.join(", ") }); return; }
  const { merchantKey, enabled = true } = req.body as { merchantKey?: string; enabled?: boolean };
  if (!merchantKey?.trim()) { res.status(400).json({ error: "Merchant key is required." }); return; }
  await pool.query(
    `INSERT INTO sim_coin_api_keys (coin, merchant_key, enabled, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (coin) DO UPDATE SET merchant_key = $2, enabled = $3, updated_at = NOW()`,
    [coin, merchantKey.trim(), Boolean(enabled)],
  );
  res.json({ coin, merchantKey: merchantKey.trim(), enabled: Boolean(enabled) });
});

router.delete("/admin/coin-api-keys/:coin", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const coin = String(req.params.coin).toUpperCase();
  const result = await pool.query("DELETE FROM sim_coin_api_keys WHERE coin = $1 RETURNING coin", [coin]);
  if (!result.rows[0]) { res.status(404).json({ error: "Key not found." }); return; }
  res.json({ deleted: true, coin });
});

// ─── Admin: User Lien ─────────────────────────────────────────────────────────
router.get("/admin/users/:id/lien", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const result = await pool.query("SELECT id, name, email, lien_amount FROM sim_users WHERE id = $1", [req.params.id]);
  if (!result.rows[0]) { res.status(404).json({ error: "User not found." }); return; }
  res.json({ userId: result.rows[0].id, lienAmount: Number(result.rows[0].lien_amount ?? 0) });
});

router.put("/admin/users/:id/lien", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const userId = String(req.params.id);
  const lienAmount = Number(req.body?.lienAmount);
  if (!Number.isFinite(lienAmount) || lienAmount < 0) {
    res.status(400).json({ error: "Lien amount must be 0 or greater." });
    return;
  }
  const result = await pool.query(
    "UPDATE sim_users SET lien_amount = $1 WHERE id = $2 RETURNING id, name, lien_amount",
    [lienAmount, userId],
  );
  if (!result.rows[0]) { res.status(404).json({ error: "User not found." }); return; }
  res.json({ userId, lienAmount: Number(result.rows[0].lien_amount) });
});

// ─── Admin: Support (admin send with image) ──────────────────────────────────
router.post("/admin/support/:id/messages", async (req, res) => {
  if (!await requireAdmin(req, res)) return;
  const { id } = req.params;
  const message = String(req.body?.message ?? "").trim().slice(0, 3000);
  const imageData = typeof req.body?.imageData === "string" ? req.body.imageData.slice(0, 2_000_000) : null;
  if (!message && !imageData) { res.status(400).json({ error: "Message or image is required." }); return; }
  const existing = await pool.query("SELECT * FROM sim_support_tickets WHERE id = $1", [id]);
  if (!existing.rows[0]) { res.status(404).json({ error: "Ticket not found." }); return; }
  await pool.query(
    "INSERT INTO sim_support_messages (id, ticket_id, sender_role, sender_name, message, image_url) VALUES ($1, $2, 'admin', 'SKY SMS Support', $3, $4)",
    [crypto.randomUUID(), id, message || "", imageData],
  );
  await pool.query("UPDATE sim_support_tickets SET updated_at = NOW() WHERE id = $1", [id]);
  const updated = await pool.query(`
    SELECT t.*, u.email AS user_email, u.name AS user_name
    FROM sim_support_tickets t JOIN sim_users u ON u.id = t.user_id WHERE t.id = $1
  `, [id]);
  res.json({ ticket: await mapSupportTicket(updated.rows[0], "admin") });
});

export default router;

export function startHealthCheckJob() {
  const runCheck = async () => {
    const start = Date.now();
    try {
      await pool.query("SELECT 1");
      const ms = Date.now() - start;
      await pool.query(
        "INSERT INTO sim_status_metrics (metric, value, recorded_at) VALUES ('api_response_ms', $1, NOW())",
        [ms],
      );
    } catch { /* DB offline — skip recording */ }
  };
  void runCheck();
  setInterval(() => void runCheck(), 30_000);
}

export function startExpiredPaymentsCleaner() {
  const PAYMENT_TIMEOUT_MS = 20 * 60 * 1000;
  const CHECK_INTERVAL_MS = 60 * 1000;

  async function expireStalePayments() {
    try {
      const cutoff = new Date(Date.now() - PAYMENT_TIMEOUT_MS).toISOString();
      const result = await pool.query(
        `UPDATE sim_payments
         SET status = 'failed'
         WHERE status = 'pending' AND created_at < $1
         RETURNING id, track_id`,
        [cutoff],
      );
      for (const row of result.rows) {
        if (row.track_id) {
          await closeOxaPayInvoice(String(row.track_id));
        }
      }
      if (result.rowCount && result.rowCount > 0) {
        console.log(`[payments] Expired ${result.rowCount} stale pending payment(s).`);
      }
    } catch (err) {
      console.error("[payments] Error expiring stale payments:", err);
    }
  }

  setInterval(expireStalePayments, CHECK_INTERVAL_MS);
  expireStalePayments();
}

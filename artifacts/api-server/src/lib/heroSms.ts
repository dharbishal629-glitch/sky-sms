const HERO_BASE_URL = "https://hero-sms.com/stubs/handler_api.php";
const REQUEST_TIMEOUT_MS = 12_000;

const countryMap: Record<string, number> = {
  RU: 0,
  UA: 1,
  KZ: 2,
  CN: 3,
  PH: 4,
  ID: 6,
  MY: 7,
  KE: 8,
  TZ: 9,
  VN: 10,
  KG: 11,
  IL: 13,
  HK: 14,
  PL: 15,
  GB: 16,
  NG: 19,
  EG: 21,
  IN: 22,
  IE: 23,
  KH: 24,
  RS: 29,
  ZA: 31,
  RO: 32,
  CO: 33,
  EE: 34,
  AZ: 35,
  CA: 36,
  MA: 37,
  GH: 38,
  AR: 39,
  UZ: 40,
  CM: 41,
  TD: 42,
  DE: 43,
  LT: 44,
  HR: 45,
  SE: 46,
  IQ: 47,
  NL: 48,
  LV: 49,
  AT: 50,
  BY: 51,
  TH: 52,
  SA: 53,
  MX: 54,
  TW: 55,
  ES: 56,
  DZ: 58,
  SI: 59,
  BD: 60,
  SN: 61,
  TR: 62,
  CZ: 63,
  LK: 64,
  PE: 65,
  PK: 66,
  NZ: 67,
  ML: 69,
  VE: 70,
  ET: 71,
  MN: 72,
  BR: 73,
  AF: 74,
  UG: 75,
  AO: 76,
  CY: 77,
  FR: 78,
  MZ: 80,
  NP: 81,
  BE: 82,
  BG: 83,
  HU: 84,
  MD: 85,
  IT: 86,
  PY: 87,
  HN: 88,
  TN: 89,
  BO: 92,
  CR: 93,
  GT: 94,
  AE: 95,
  ZW: 96,
  PR: 97,
  SD: 98,
  KW: 100,
  EC: 105,
  OM: 107,
  BA: 108,
  DO: 109,
  QA: 111,
  CU: 113,
  JO: 116,
  PT: 117,
  GE: 128,
  GR: 129,
  IS: 132,
  SK: 141,
  TJ: 143,
  BH: 145,
  ZM: 147,
  AM: 148,
  CL: 151,
  AL: 155,
  UY: 156,
  FI: 163,
  LU: 165,
  DK: 172,
  CH: 173,
  NO: 174,
  AU: 175,
  JP: 182,
  MK: 183,
  SC: 184,
  CV: 186,
  US: 187,
};

const reverseCountryMap: Record<number, string> = Object.fromEntries(
  Object.entries(countryMap).map(([code, id]) => [id, code]),
);

export function getHeroCountryCode(code: string) {
  const normalized = code.toUpperCase();
  if (normalized.startsWith("H") && /^\d+$/.test(normalized.slice(1))) {
    return Number(normalized.slice(1));
  }
  return countryMap[normalized];
}

function getApiKey() {
  const apiKey = process.env.HERO_SMS_API_KEY;
  if (!apiKey) {
    throw new Error("Hero SMS API key is not configured.");
  }
  return apiKey;
}

async function heroRequest(params: Record<string, string | number | undefined>) {
  const url = new URL(HERO_BASE_URL);
  url.searchParams.set("api_key", getApiKey());
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Hero SMS request failed with HTTP ${response.status}`);
  }

  return text.trim();
}

function parseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached<T>(key: string, value: T, ttlMs: number) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export async function getHeroBalance() {
  const cacheKey = "balance";
  const cached = getCached<number>(cacheKey);
  if (cached !== null) return cached;

  const text = await heroRequest({ action: "getBalance" });
  let balance: number;
  if (text.startsWith("ACCESS_BALANCE:")) {
    balance = Number(text.split(":")[1]);
  } else {
    const json = parseJson<{ balance?: number | string }>(text);
    if (json?.balance !== undefined) {
      balance = Number(json.balance);
    } else {
      throw new Error(text || "Unable to read Hero SMS balance.");
    }
  }

  setCached(cacheKey, balance, 30_000);
  return balance;
}

export async function getHeroAvailability(serviceCode: string, countryCode: string) {
  const country = getHeroCountryCode(countryCode);
  if (country === undefined) return null;

  const cacheKey = `availability:${serviceCode}:${countryCode}`;
  const cached = getCached<{ count: number; cost: number; activationMinutes: number }>(cacheKey);
  if (cached !== null) return cached;

  const text = await heroRequest({
    action: "getPrices",
    service: serviceCode,
    country,
  });
  const json = parseJson<Record<string, Record<string, { count?: number | string; cost?: number | string; time?: number | string; minutes?: number | string }>>>(text);
  const countryData = json?.[String(country)];
  const serviceData = countryData?.[serviceCode];

  if (!serviceData) return null;

  const rawMinutes = Number(serviceData.time ?? serviceData.minutes ?? 0);
  const result = {
    count: Number(serviceData.count ?? 0),
    cost: Number(serviceData.cost ?? 0),
    activationMinutes: rawMinutes > 0 ? rawMinutes : 20,
  };

  setCached(cacheKey, result, 20_000);
  return result;
}

export async function getHeroCountriesForService(serviceCode: string): Promise<{ countryCode: string; count: number; cost: number; activationMinutes: number }[]> {
  const cacheKey = `countries:${serviceCode}`;
  const cached = getCached<{ countryCode: string; count: number; cost: number; activationMinutes: number }[]>(cacheKey);
  if (cached !== null) return cached;

  const text = await heroRequest({ action: "getPrices", service: serviceCode });
  const json = parseJson<Record<string, Record<string, { count?: number | string; cost?: number | string; time?: number | string; minutes?: number | string }>>>(text);
  if (!json) return [];

  const results: { countryCode: string; count: number; cost: number; activationMinutes: number }[] = [];
  for (const [countryIdStr, serviceData] of Object.entries(json)) {
    const countryId = Number(countryIdStr);
    const countryCode = reverseCountryMap[countryId];
    if (!countryCode) continue;
    // Hero SMS may return the data under the requested key OR under any key when filtered —
    // fall back to the first available service entry in this country's data.
    const data = serviceData[serviceCode] ?? Object.values(serviceData)[0];
    if (!data) continue;
    const count = Number(data.count ?? 0);
    if (count <= 0) continue;
    const rawMinutes = Number(data.time ?? data.minutes ?? 0);
    results.push({ countryCode, count, cost: Number(data.cost ?? 0), activationMinutes: rawMinutes > 0 ? rawMinutes : 20 });
  }

  setCached(cacheKey, results, 30_000);
  return results;
}

// Singleton in-flight fetch — prevents multiple concurrent full-catalog HTTP requests.
let catalogInFlight: Promise<Array<{ countryCode: string; serviceCode: string; count: number; cost: number; activationMinutes: number }>> | null = null;

export async function getHeroPriceCatalog(): Promise<Array<{ countryCode: string; serviceCode: string; count: number; cost: number }>> {
  const cacheKey = "price-catalog";
  const cached = getCached<Array<{ countryCode: string; serviceCode: string; count: number; cost: number }>>(cacheKey);
  if (cached !== null) return cached;

  // Reuse an existing in-flight request instead of launching a duplicate.
  if (!catalogInFlight) {
    catalogInFlight = (async () => {
      const text = await heroRequest({ action: "getPrices" });
      const json = parseJson<Record<string, Record<string, { count?: number | string; cost?: number | string }>>>(text);
      if (!json) return [];

      const results: Array<{ countryCode: string; serviceCode: string; count: number; cost: number; activationMinutes: number }> = [];
      for (const [countryIdStr, services] of Object.entries(json)) {
        const countryId = Number(countryIdStr);
        const countryCode = reverseCountryMap[countryId];
        if (!countryCode) continue;
        for (const [serviceCode, data] of Object.entries(services)) {
          const count = Number(data.count ?? 0);
          const cost = Number(data.cost ?? 0);
          const rawMinutes = Number((data as Record<string, unknown>).time ?? (data as Record<string, unknown>).minutes ?? 0);
          if (count > 0) results.push({ countryCode, serviceCode, count, cost, activationMinutes: rawMinutes > 0 ? rawMinutes : 20 });
        }
      }
      setCached(cacheKey, results, 45_000);
      return results;
    })().finally(() => { catalogInFlight = null; });
  }

  return catalogInFlight;
}

/** Pre-warms the price catalog cache. Call once on server start. */
export function warmCatalogCache(): void {
  getHeroPriceCatalog().catch(() => { /* best-effort */ });
}

const HERO_ERROR_MESSAGES: Record<string, string> = {
  NO_NUMBERS: "No numbers are available for this service and country right now. Please try a different country or try again shortly.",
  NO_BALANCE: "Provider balance is too low to fulfill this request. Please contact support.",
  SERVICE_NOT_AVAILABLE: "This service is not currently available in the selected country. Please choose a different country.",
  BAD_KEY: "API configuration error. Please contact support.",
  BAD_ACTION: "Invalid request. Please refresh and try again.",
  BAD_SERVICE: "Unknown service. Please refresh and try again.",
  BAD_COUNTRY: "Unknown country. Please refresh and try again.",
  ERROR_SQL: "Provider database error. Please try again in a moment.",
  ACCOUNT_INACTIVE: "Provider account is inactive. Please contact support.",
  BANNED: "Provider account is banned. Please contact support.",
};

export async function rentHeroNumber(serviceCode: string, countryCode: string, _price?: number) {
  const country = getHeroCountryCode(countryCode);
  if (country === undefined) {
    throw new Error(`Hero SMS does not have a mapped country code for ${countryCode}.`);
  }

  const text = await heroRequest({
    action: "getNumber",
    service: serviceCode,
    country,
  });

  if (text.startsWith("ACCESS_NUMBER:")) {
    const [, activationId, phoneNumber] = text.split(":");
    await setHeroStatus(activationId, 1);
    return { activationId, phoneNumber };
  }

  const errorCode = text.trim().toUpperCase();
  const friendlyMessage = HERO_ERROR_MESSAGES[errorCode];
  throw new Error(friendlyMessage ?? HERO_ERROR_MESSAGES[text.trim()] ?? `Could not allocate a number. Provider returned: ${text}`);
}

export async function getHeroStatus(activationId: string) {
  const text = await heroRequest({ action: "getStatus", id: activationId });

  if (text.startsWith("STATUS_OK:")) {
    return { status: "STATUS_OK", code: text.slice("STATUS_OK:".length) };
  }

  return { status: text, code: null };
}

export async function setHeroStatus(activationId: string, status: 1 | 3 | 6 | 8) {
  const text = await heroRequest({ action: "setStatus", id: activationId, status });
  if (text.startsWith("ACCESS_") || text === "EARLY_CANCEL_DENIED" || text === "NO_ACTIVATION") return text;
  return text;
}

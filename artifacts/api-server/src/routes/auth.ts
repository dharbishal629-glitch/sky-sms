import * as oidc from "openid-client";
import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import bcrypt from "bcryptjs";
import {
  clearSession,
  getOidcConfig,
  getSessionId,
  createSession,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  type SessionData,
  type AuthUser,
} from "../lib/auth";
import { ensureSimSchema } from "../lib/simSchema";
import { isAdminEmail } from "../lib/adminConfig";

const OIDC_COOKIE_TTL = 10 * 60 * 1000;
const router: IRouter = Router();

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function getCallbackUrl(req: Request): string {
  return `${getOrigin(req)}/api/callback`;
}

function setSessionCookie(res: Response, sid: string) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: SESSION_TTL_MS,
  });
}

function setOidcCookie(res: Response, name: string, value: string) {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(name, value, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  });
}

function getSafeReturnTo(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    if (typeof value === "string" && value.startsWith("http")) {
      return value;
    }
    return fallback;
  }
  return value;
}

async function upsertSimUser(user: AuthUser) {
  await ensureSimSchema();
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";
  const email = user.email || `user-${user.id}@example.com`;

  const role = isAdminEmail(user.email) ? "admin" : "user";

  await pool.query(
    `INSERT INTO sim_users (id, name, email, role, credits, status)
     VALUES ($1, $2, $3, $4, 0, 'active')
     ON CONFLICT (id) DO UPDATE SET
       name  = EXCLUDED.name,
       email = EXCLUDED.email,
       role  = EXCLUDED.role`,
    [user.id, name, email, role],
  );
}

async function checkUserSuspended(email: string, res: Response): Promise<boolean> {
  const result = await pool.query(
    "SELECT status, suspension_reason FROM sim_users WHERE email = $1",
    [email],
  );
  if (!result.rows[0]) return false;
  const { status, suspension_reason } = result.rows[0];
  if (status === "suspended" || status === "banned") {
    const reason = suspension_reason ? `: ${suspension_reason}` : "";
    res.status(403).json({ error: `Account ${status}${reason}` });
    return true;
  }
  return false;
}

function generateUserId(): string {
  return "em_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json({ user: req.isAuthenticated() ? req.user : null });
});

router.get("/login", async (req: Request, res: Response) => {
  try {
    const config = await getOidcConfig();
    const callbackUrl = getCallbackUrl(req);
    const returnTo = getSafeReturnTo(req.query.returnTo, process.env.FRONTEND_URL || "/");

    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

    const redirectTo = oidc.buildAuthorizationUrl(config, {
      redirect_uri: callbackUrl,
      scope: "openid email profile",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
      access_type: "offline",
      prompt: "consent",
    });

    setOidcCookie(res, "code_verifier", codeVerifier);
    setOidcCookie(res, "nonce", nonce);
    setOidcCookie(res, "state", state);
    setOidcCookie(res, "return_to", returnTo);

    res.redirect(redirectTo.href);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Auth configuration error";
    res.status(500).send(`<h2>Authentication Error</h2><p>${msg}</p><p>Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.</p>`);
  }
});

router.get("/callback", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = getCallbackUrl(req);

  const codeVerifier = req.cookies?.code_verifier;
  const nonce = req.cookies?.nonce;
  const expectedState = req.cookies?.state;
  const returnTo = getSafeReturnTo(req.cookies?.return_to, process.env.FRONTEND_URL || "/");

  if (!codeVerifier || !expectedState) {
    res.redirect("/api/login");
    return;
  }

  const currentUrl = new URL(
    `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
  );

  let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
  try {
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });
  } catch {
    res.redirect("/api/login");
    return;
  }

  res.clearCookie("code_verifier", { path: "/" });
  res.clearCookie("nonce", { path: "/" });
  res.clearCookie("state", { path: "/" });
  res.clearCookie("return_to", { path: "/" });

  const claims = tokens.claims();
  if (!claims) {
    res.redirect("/api/login");
    return;
  }

  const user: AuthUser = {
    id: claims.sub as string,
    email: (claims.email as string) || null,
    firstName: (claims.given_name as string) || null,
    lastName: (claims.family_name as string) || null,
    profileImageUrl: (claims.picture as string) || null,
  };

  await upsertSimUser(user);

  const loginIp = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.socket.remoteAddress || null;
  if (loginIp) {
    await pool.query("UPDATE sim_users SET last_seen_ip = $1 WHERE id = $2", [loginIp, user.id]).catch(() => {});
  }

  if (user.email) {
    const statusCheck = await pool.query(
      "SELECT status, suspension_reason FROM sim_users WHERE id = $1",
      [user.id],
    );
    const row = statusCheck.rows[0];
    if (row && (row.status === "suspended" || row.status === "banned")) {
      const reason = row.suspension_reason ? encodeURIComponent(row.suspension_reason) : "";
      res.redirect(`/sign-in?suspended=1&reason=${reason}`);
      return;
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const sessionData: SessionData = {
    user,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : (claims.exp as number | undefined),
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.redirect(returnTo);
});

// ── Email / Password: Register ──────────────────────────────────────────────
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    await ensureSimSchema();
    const email = String(req.body?.email ?? "").toLowerCase().trim();
    const password = String(req.body?.password ?? "");
    const name = String(req.body?.name ?? "").trim() || "User";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "A valid email address is required." });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters." });
      return;
    }

    const existing = await pool.query("SELECT id FROM sim_email_credentials WHERE email = $1", [email]);
    if (existing.rows[0]) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = generateUserId();
    const role = isAdminEmail(email) ? "admin" : "user";

    await pool.query(
      `INSERT INTO sim_users (id, name, email, role, credits, status)
       VALUES ($1, $2, $3, $4, 0, 'active')
       ON CONFLICT (id) DO NOTHING`,
      [userId, name, email, role],
    );

    const userRow = await pool.query("SELECT id FROM sim_users WHERE email = $1", [email]);
    if (!userRow.rows[0]) {
      res.status(500).json({ error: "Failed to create user record. Please try again." });
      return;
    }
    const finalUserId = String(userRow.rows[0].id);

    await pool.query(
      `INSERT INTO sim_email_credentials (id, email, password_hash, user_id, verified)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (email) DO NOTHING`,
      [generateUserId(), email, passwordHash, finalUserId],
    );

    const user: AuthUser = {
      id: finalUserId,
      email,
      firstName: name.split(" ")[0] || name,
      lastName: name.split(" ").slice(1).join(" ") || null,
      profileImageUrl: null,
    };

    const sessionData: SessionData = {
      user,
      access_token: "",
      refresh_token: undefined,
      expires_at: undefined,
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);
    res.json({ success: true, user: { id: finalUserId, email, name, role } });
  } catch (err) {
    console.error("Registration error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Registration failed: ${msg}` });
  }
});

// ── Email / Password: Login ──────────────────────────────────────────────────
router.post("/auth/login-email", async (req: Request, res: Response) => {
  await ensureSimSchema();
  const email = String(req.body?.email ?? "").toLowerCase().trim();
  const password = String(req.body?.password ?? "");

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const cred = await pool.query(
    "SELECT c.*, u.id AS uid, u.name, u.role, u.status, u.suspension_reason FROM sim_email_credentials c JOIN sim_users u ON u.id = c.user_id WHERE c.email = $1",
    [email],
  );

  if (!cred.rows[0]) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const row = cred.rows[0];
  const valid = await bcrypt.compare(password, String(row.password_hash));
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  if (row.status === "suspended" || row.status === "banned") {
    const reason = row.suspension_reason ? `: ${row.suspension_reason}` : "";
    res.status(403).json({ error: `Account ${row.status}${reason}` });
    return;
  }

  const user: AuthUser = {
    id: String(row.uid),
    email,
    firstName: String(row.name).split(" ")[0] || String(row.name),
    lastName: String(row.name).split(" ").slice(1).join(" ") || null,
    profileImageUrl: null,
  };

  const sessionData: SessionData = {
    user,
    access_token: "",
    refresh_token: undefined,
    expires_at: undefined,
  };

  const loginIpEmail = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.socket.remoteAddress || null;
  if (loginIpEmail) {
    await pool.query("UPDATE sim_users SET last_seen_ip = $1 WHERE id = $2", [loginIpEmail, user.id]).catch(() => {});
  }

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.json({ success: true, user: { id: user.id, email, name: row.name, role: row.role } });
});

router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);

  const returnTo = process.env.FRONTEND_URL || getOrigin(req);
  res.redirect(returnTo);
});

export default router;

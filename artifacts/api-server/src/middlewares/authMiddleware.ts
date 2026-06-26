import * as oidc from "openid-client";
import { type Request, type Response, type NextFunction } from "express";
import { createHash } from "node:crypto";
import type { AuthUser } from "../lib/auth";
import { pool } from "@workspace/db";
import {
  clearSession,
  getOidcConfig,
  getSessionId,
  getSession,
  updateSession,
  type SessionData,
} from "../lib/auth";

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;
      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

async function refreshIfExpired(
  sid: string,
  session: SessionData,
): Promise<SessionData | null> {
  const now = Math.floor(Date.now() / 1000);
  if (!session.expires_at || now <= session.expires_at) return session;
  if (!session.refresh_token) return null;

  try {
    const config = await getOidcConfig();
    const tokens = await oidc.refreshTokenGrant(config, session.refresh_token);
    session.access_token = tokens.access_token;
    session.refresh_token = tokens.refresh_token ?? session.refresh_token;
    session.expires_at = tokens.expiresIn()
      ? now + tokens.expiresIn()!
      : session.expires_at;
    await updateSession(sid, session);
    return session;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  // API key authentication (X-API-Key header)
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (apiKey) {
    try {
      const keyHash = createHash("sha256").update(apiKey).digest("hex");
      const result = await pool.query(
        `SELECT k.id, k.user_id, u.email, u.name, u.role
         FROM sim_api_keys k
         JOIN sim_users u ON u.id = k.user_id
         WHERE k.key_hash = $1 AND k.revoked = FALSE`,
        [keyHash],
      );
      if (result.rows.length > 0) {
        const row = result.rows[0];
        req.user = { id: row.user_id, email: row.email, name: row.name, role: row.role };
        pool.query("UPDATE sim_api_keys SET last_used_at = NOW() WHERE id = $1", [row.id]).catch(() => {});
      }
    } catch {
      // silently ignore DB errors for API key lookup
    }
    next();
    return;
  }

  const sid = getSessionId(req);
  if (!sid) {
    next();
    return;
  }

  const session = await getSession(sid);
  if (!session?.user?.id) {
    await clearSession(res, sid);
    next();
    return;
  }

  const refreshed = await refreshIfExpired(sid, session);
  if (!refreshed) {
    await clearSession(res, sid);
    next();
    return;
  }

  req.user = refreshed.user;
  next();
}

import * as client from "openid-client";
import crypto from "crypto";
import { type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { ensureSimSchema } from "./simSchema";

export const GOOGLE_ISSUER = "https://accounts.google.com";
export const SESSION_COOKIE = "sid";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export interface SessionData {
  user: AuthUser;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

let oidcConfig: client.Configuration | null = null;

export async function getOidcConfig(): Promise<client.Configuration> {
  if (!oidcConfig) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error(
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured to enable authentication.",
      );
    }
    oidcConfig = await client.discovery(
      new URL(GOOGLE_ISSUER),
      clientId,
      clientSecret,
    );
  }
  return oidcConfig;
}

export async function createSession(data: SessionData): Promise<string> {
  await ensureSimSchema();
  const sid = crypto.randomBytes(32).toString("hex");
  const expire = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query(
    `INSERT INTO sim_sessions (sid, sess, expire) VALUES ($1, $2, $3)`,
    [sid, JSON.stringify(data), expire],
  );
  return sid;
}

export async function getSession(sid: string): Promise<SessionData | null> {
  await ensureSimSchema();
  const result = await pool.query(
    `SELECT sess, expire FROM sim_sessions WHERE sid = $1`,
    [sid],
  );
  const row = result.rows[0];
  if (!row || new Date(row.expire) < new Date()) {
    if (row) await deleteSession(sid);
    return null;
  }
  return typeof row.sess === "string" ? JSON.parse(row.sess) : (row.sess as SessionData);
}

export async function updateSession(sid: string, data: SessionData): Promise<void> {
  await ensureSimSchema();
  const expire = new Date(Date.now() + SESSION_TTL_MS);
  await pool.query(
    `UPDATE sim_sessions SET sess = $1, expire = $2 WHERE sid = $3`,
    [JSON.stringify(data), expire, sid],
  );
}

export async function deleteSession(sid: string): Promise<void> {
  await ensureSimSchema();
  await pool.query(`DELETE FROM sim_sessions WHERE sid = $1`, [sid]);
}

export async function clearSession(res: Response, sid?: string): Promise<void> {
  if (sid) await deleteSession(sid);
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie(SESSION_COOKIE, {
    path: "/",
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  });
}

export function getSessionId(req: Request): string | undefined {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies?.[SESSION_COOKIE];
}

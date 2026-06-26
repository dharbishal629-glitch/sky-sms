/**
 * ADMIN ACCESS CONTROL
 *
 * Add the Gmail / email addresses that should have admin access here.
 * These are checked on every login — adding or removing an email
 * takes effect the next time that user signs in.
 *
 * You can also set the ADMIN_EMAILS environment variable on your server
 * as a comma-separated list (e.g. "alice@gmail.com,bob@gmail.com").
 * Both lists are merged at runtime.
 */
export const HARDCODED_ADMIN_EMAILS: string[] = ["dharbishal629@gmail.com"];

/**
 * Returns the full set of allowed admin emails (hardcoded + env var).
 */
export function getAllAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const hardcoded = HARDCODED_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()).filter(Boolean);

  return Array.from(new Set([...hardcoded, ...fromEnv]));
}

/**
 * Returns true if the given email is in the admin allowlist.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = getAllAdminEmails();
  if (allowed.length === 0) return false; // no admins configured
  return allowed.includes(email.trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// Server-side authentication primitives.
//
// Deliberately dependency-free: uses only Node's built-in `crypto` so it bundles
// cleanly through esbuild (`--packages=external`) into the Vercel function with
// nothing to resolve at runtime. No bcrypt / jsonwebtoken.
//
//   - Password hashing:  scrypt + per-user random salt, constant-time verify.
//   - Session token:     compact signed token  `base64url(json).base64url(hmac)`
//                        (HMAC-SHA256 over the payload, keyed by SESSION_SECRET),
//                        with an embedded expiry. Stateless — no server store.
// ---------------------------------------------------------------------------
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "node:crypto";
import { AppUser, UserRole } from "../types";

// Temporary password assigned to every seeded/legacy user that has no password
// yet (see bootstrapAuth in store.ts). The owner logs in with this the first
// time, then changes it / creates real staff logins from the app.
export const DEFAULT_BOOTSTRAP_PASSWORD = "PharmaAdmin@123";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// --- Password hashing ------------------------------------------------------
export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(plain: string, stored?: string | null): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  let actual: Buffer;
  try {
    actual = scryptSync(plain, salt, expected.length);
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// --- Session token (signed, stateless) -------------------------------------
export interface TokenPayload {
  sub: string; // user id
  role: UserRole;
  tenantId: string | null;
  exp: number; // epoch ms
}

/**
 * The HMAC key. MUST be stable across serverless cold starts, otherwise tokens
 * signed by one instance won't verify on another — so in persistent (Supabase)
 * mode we require SESSION_SECRET and fail fast if it's missing. Local dev
 * without Supabase falls back to a fixed dev key (insecure, but data is
 * ephemeral there anyway).
 */
export function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length > 0) return s;
  const persistent = Boolean(
    process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)
  );
  if (persistent) {
    throw new Error(
      "SESSION_SECRET environment variable is required in production. " +
        "Add it in Vercel → Settings → Environment Variables."
    );
  }
  return "dev-insecure-secret-do-not-use-in-production";
}

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

export function signToken(input: { sub: string; role: UserRole; tenantId: string | null }): string {
  const payload: TokenPayload = { ...input, exp: Date.now() + TOKEN_TTL_MS };
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", getSessionSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", getSessionSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// --- Helpers ---------------------------------------------------------------
/** Remove server-only fields before sending a user to the client. */
export function sanitizeUser(u: AppUser): Omit<AppUser, "passwordHash"> {
  const { passwordHash, ...safe } = u;
  return safe;
}

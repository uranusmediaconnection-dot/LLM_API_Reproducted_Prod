import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "thesun_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

function getAdminSecret() {
  return process.env.ADMIN_API_KEY;
}

export function verifyAdminCredentials(email: string, password: string) {
  const configuredEmail = process.env.ADMIN_EMAIL;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredEmail || !configuredPassword) return false;

  const emailDigest = createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest();
  const configuredEmailDigest = createHash("sha256")
    .update(configuredEmail.trim().toLowerCase())
    .digest();
  const passwordDigest = createHash("sha256").update(password).digest();
  const configuredPasswordDigest = createHash("sha256")
    .update(configuredPassword)
    .digest();

  const emailMatches = timingSafeEqual(emailDigest, configuredEmailDigest);
  const passwordMatches = timingSafeEqual(passwordDigest, configuredPasswordDigest);
  return emailMatches && passwordMatches;
}

export function createAdminSessionValue() {
  const secret = getAdminSecret();
  if (!secret) throw new Error("ADMIN_API_KEY is not configured");

  const expiresAt = Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000;
  const signature = createHmac("sha256", secret)
    .update(`thesun-admin-session:v1:${expiresAt}`)
    .digest("base64url");

  return `v1.${expiresAt}.${signature}`;
}

export function isValidAdminSession(value?: string | null) {
  const secret = getAdminSecret();
  if (!secret || !value) return false;

  const [version, expiryValue, suppliedSignature, extra] = value.split(".");
  const expiresAt = Number(expiryValue);
  if (
    version !== "v1" ||
    extra !== undefined ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Date.now() ||
    expiresAt > Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000
  ) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`thesun-admin-session:v1:${expiresAt}`)
    .digest("base64url");
  const supplied = Buffer.from(suppliedSignature ?? "");
  const expected = Buffer.from(expectedSignature);

  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function isAdminRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${ADMIN_SESSION_COOKIE}=`));

  return isValidAdminSession(sessionCookie?.slice(ADMIN_SESSION_COOKIE.length + 1));
}

export function adminUnauthorizedResponse() {
  return Response.json(
    { error: "Admin authentication required" },
    { status: 401, headers: { "Cache-Control": "no-store" } }
  );
}

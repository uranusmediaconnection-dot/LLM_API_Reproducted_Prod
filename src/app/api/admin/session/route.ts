import { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionValue,
  isAdminRequest,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host");

  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function sessionCookie(request: NextRequest, value: string | null) {
  const secure = request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
  const sameSite = secure ? "None" : "Lax";
  const secureAttribute = secure ? "; Secure" : "";

  if (value === null) {
    return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=${sameSite}${secureAttribute}`;
  }

  return `${ADMIN_SESSION_COOKIE}=${value}; Path=/; HttpOnly; Max-Age=${ADMIN_SESSION_TTL_SECONDS}; SameSite=${sameSite}${secureAttribute}; Priority=High`;
}

export async function GET(request: NextRequest) {
  return Response.json({ authenticated: isAdminRequest(request) }, { headers: noStoreHeaders });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Invalid request origin" }, { status: 403, headers: noStoreHeaders });
  }

  if (!process.env.ADMIN_API_KEY || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Admin access is not configured" }, { status: 503, headers: noStoreHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400, headers: noStoreHeaders });
  }

  const email = body && typeof body === "object" && "email" in body && typeof body.email === "string"
    ? body.email
    : "";
  const password = body && typeof body === "object" && "password" in body && typeof body.password === "string"
    ? body.password
    : "";

  if (
    !email ||
    !password ||
    email.length > 320 ||
    password.length > 1024 ||
    !verifyAdminCredentials(email, password)
  ) {
    return Response.json({ error: "The email or password was not accepted" }, { status: 401, headers: noStoreHeaders });
  }

  const response = Response.json({ authenticated: true }, { headers: noStoreHeaders });
  response.headers.append("Set-Cookie", sessionCookie(request, createAdminSessionValue()));
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "Invalid request origin" }, { status: 403, headers: noStoreHeaders });
  }

  const response = Response.json({ authenticated: false }, { headers: noStoreHeaders });
  response.headers.append("Set-Cookie", sessionCookie(request, null));
  return response;
}

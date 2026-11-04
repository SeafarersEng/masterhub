/**
 * Netlify Edge Function — server-side dashboard protection
 * Paths handled:
 *   GET  /  and  /index.html  → strips dashboard if not authed
 *   POST /api/login           → sets signed httpOnly cookie
 *   POST /api/logout          → clears cookie
 */

const COOKIE_NAME = "mept_auth";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

async function hmacSign(expStr, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expStr));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyAuth(request, secret) {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!m) return false;

  const [expStr, given] = m[1].split(".");
  if (!expStr || !given) return false;

  const exp = parseInt(expStr, 10);
  if (!exp || exp < Date.now()) return false;

  const expected = await hmacSign(expStr, secret);
  if (expected.length !== given.length) return false;

  // constant-time compare
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  }
  return diff === 0;
}

async function handleLogin(request) {
  const secret = Netlify.env.get("MEPT_SECRET");
  const expected = Netlify.env.get("MEPT_PASSWORD");

  if (!secret || !expected) {
    return new Response(JSON.stringify({ ok: false, error: "Server not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof body.password !== "string" || body.password !== expected) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const exp = Date.now() + MAX_AGE * 1000;
  const sig = await hmacSign(String(exp), secret);
  const token = `${exp}.${sig}`;

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`,
    },
  });
}

function handleLogout() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
    },
  });
}

async function serveIndex(request, context) {
  const secret = Netlify.env.get("MEPT_SECRET");
  const authed = secret ? await verifyAuth(request, secret) : false;

  const response = await context.next();
  let html = await response.text();

  if (authed) {
    // Un-hide dashboard, hide landing
    html = html
      .replace(/<div id="landing-container"[^>]*>/, '<div id="landing-container" class="hidden">')
      .replace(/<div id="dashboard"[^>]*>/, '<div id="dashboard">');
  } else {
    // Strip dashboard block entirely — browser never sees it
    html = html.replace(
      /<!-- =+\s*DASHBOARD_START\s*=+\s*-->[\s\S]*?<!-- =+\s*DASHBOARD_END\s*=+\s*-->/,
      ""
    );
  }

  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return new Response(html, { status: response.status, headers });
}

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/login" && request.method === "POST") {
    return handleLogin(request);
  }
  if (path === "/api/logout" && request.method === "POST") {
    return handleLogout();
  }
  if (path === "/" || path === "/index.html") {
    return serveIndex(request, context);
  }

  return context.next();
};

export const config = {
  path: ["/", "/index.html", "/api/login", "/api/logout"],
};

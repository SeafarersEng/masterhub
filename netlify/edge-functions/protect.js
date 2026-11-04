/**
 * Netlify Edge Function — proxies login to Google Apps Script
 *
 * Env vars (Netlify → Environment variables):
 *   SHEET_API_URL     = https://script.google.com/macros/s/AKfycbz.../exec
 *   SHEET_TOKEN       = MySecretToken123   (same as SECRET_TOKEN in Apps Script)
 *   MEPT_SECRET       = random hex for cookie signing
 */

const COOKIE_NAME = "mept_auth";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/* ---------- HMAC cookie helpers ---------- */
async function hmacSign(text, secret) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
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

  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

function jsonRes(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/* ---------- Login: proxy to Google Apps Script ---------- */
async function handleLogin(request) {
  const secret     = Netlify.env.get("MEPT_SECRET");
  const sheetUrl   = Netlify.env.get("SHEET_API_URL");
  const sheetToken = Netlify.env.get("SHEET_TOKEN");

  if (!secret || !sheetUrl || !sheetToken) {
    return jsonRes({ ok: false, message: "Server configuration error" }, 500);
  }

  // Read client payload
  let body;
  try { body = await request.json(); } catch { return jsonRes({ ok: false, message: "Bad request" }, 400); }

  const { username, key, deviceId } = body || {};
  if (!username || !key || !deviceId) {
    return jsonRes({ ok: false, message: "Username, Key, Device အားလုံး လိုအပ်ပါသည်" }, 400);
  }

  // ⚠️ Token is added HERE — never exposed to browser
  const payload = {
    token: sheetToken,
    username: String(username).trim(),
    key: String(key).trim(),
    deviceId: String(deviceId).trim(),
  };

  let sheetRes;
  try {
    // Apps Script requires redirect:"follow" (it 302-redirects internally)
    const r = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const text = await r.text();
    try {
      sheetRes = JSON.parse(text);
    } catch {
      return jsonRes({ ok: false, message: "Invalid response from auth server" }, 502);
    }
  } catch (e) {
    return jsonRes({ ok: false, message: "Auth service unavailable. ခဏနေမှ ထပ်စမ်းပါ" }, 503);
  }

  // Apps Script response shape: { success: bool, message: "..." }
  if (!sheetRes || sheetRes.success !== true) {
    return jsonRes({
      ok: false,
      message: sheetRes.message || "Login မအောင်မြင်ပါ",
    }, 401);
  }

  // ✅ Success — issue HMAC cookie
  const exp = Date.now() + MAX_AGE * 1000;
  const sig = await hmacSign(String(exp), secret);
  const token = `${exp}.${sig}`;

  return new Response(JSON.stringify({ ok: true, message: sheetRes.message }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`,
    },
  });
}

/* ---------- Logout ---------- */
function handleLogout() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
    },
  });
}

/* ---------- Serve index.html (strip dashboard if not authed) ---------- */
async function serveIndex(request, context) {
  const secret = Netlify.env.get("MEPT_SECRET");
  const authed = secret ? await verifyAuth(request, secret) : false;

  const response = await context.next();
  let html = await response.text();

  if (authed) {
    html = html
      .replace(/<div id="landing-container"[^>]*>/, '<div id="landing-container" class="hidden">')
      .replace(/<div id="dashboard"[^>]*>/, '<div id="dashboard">');
  } else {
    html = html.replace(
      /<!-- =+\s*DASHBOARD_START\s*=+\s*-->[\s\S]*?<!-- =+\s*DASHBOARD_END\s*=+\s*-->/,
      ""
    );
  }

  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return new Response(html, { status: response.status, headers });
}

/* ---------- Router ---------- */
export default async (request, context) => {
  const path = new URL(request.url).pathname;
  if (path === "/api/login" && request.method === "POST")  return handleLogin(request);
  if (path === "/api/logout" && request.method === "POST") return handleLogout();
  if (path === "/" || path === "/index.html")              return serveIndex(request, context);
  return context.next();
};

export const config = {
  path: ["/", "/index.html", "/api/login", "/api/logout"],
};

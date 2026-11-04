/**
 * Netlify Edge Function
 */

const COOKIE_NAME = "mept_auth";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

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

async function handleLogin(request) {
  const secret     = Netlify.env.get("MEPT_SECRET");
  const sheetUrl   = Netlify.env.get("SHEET_API_URL");
  const sheetToken = Netlify.env.get("SHEET_TOKEN");

  if (!secret || !sheetUrl || !sheetToken) {
    return jsonRes({ ok: false, message: "❌ Server config error (Env vars missing)" }, 500);
  }

  let body;
  try { body = await request.json(); } catch { return jsonRes({ ok: false, message: "Bad request" }, 400); }

  const { username, key, deviceId } = body || {};
  if (!username || !key || !deviceId) {
    return jsonRes({ ok: false, message: "Username, Key, Device အားလုံး လိုအပ်ပါသည်" }, 400);
  }

  const payload = {
    token: sheetToken,
    username: String(username).trim(),
    key: String(key).trim(),
    deviceId: String(deviceId).trim(),
  };

  let sheetRes = null;
  try {
    // 405 Error ကို ဖြေရှင်းဖို့ Redirect ကို ကိုယ်တိုင်ဖမ်းပြီး GET နဲ့ ပြန်ခေါ်ခြင်း
    const r1 = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "manual", 
    });

    let finalResponse = r1;

    if (r1.status >= 300 && r1.status < 400) {
      const redirectUrl = r1.headers.get("Location");
      if (redirectUrl) {
        finalResponse = await fetch(redirectUrl, { method: "GET" });
      } else {
        return jsonRes({ ok: false, message: "❌ Google မှ Redirect URL မပြန်လာပါ" }, 502);
      }
    }

    const text = await finalResponse.text();
    try {
      sheetRes = JSON.parse(text);
    } catch (parseError) {
      return jsonRes({ ok: false, message: "❌ Apps Script မှ မှားယွင်းသော အချက်အလက် ပြန်လာပါသည်။ Deploy ပြန်လုပ်ပါ။" }, 502);
    }
  } catch (e) {
    return jsonRes({ ok: false, message: "❌ Network Error: Apps Script နှင့် ချိတ်ဆက်၍ မရပါ။" }, 503);
  }

  if (!sheetRes || sheetRes.success !== true) {
    const errMessage = (sheetRes && sheetRes.message) ? sheetRes.message : "❌ Login မအောင်မြင်ပါ";
    return jsonRes({ ok: false, message: errMessage }, 401);
  }

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

// ⚠️ ဒီအောက်က Default Export က အရေးကြီးဆုံးပါ။ ဒါကို မဖျက်ပါနဲ့။
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

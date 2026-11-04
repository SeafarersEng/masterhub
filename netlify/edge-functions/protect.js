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
    // အဆင့် ၁ - POST ပို့ပြီး Redirect ကို ကိုယ်တိုင်ဖမ်းမယ်
    const r1 = await fetch(sheetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "manual", // အလိုအလျောက် လိုက်မသွားစေရ
    });

    let finalResponse = r1;

    // အဆင့် ၂ - တကယ်လို့ 302 Redirect ပြန်လာရင် GET နဲ့ ပြန်ခေါ်မယ်
    if (r1.status === 302) {
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

  // ကျန်တဲ့ Success/Error စစ်ဆေးတဲ့ Code က ဒီအတိုင်းပဲ ဆက်ထားပါ...
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

const DEVICE_ID_KEY = "mept_device_id";
const USERNAME_KEY  = "mept_username";

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) ||
         (Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12));
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

window.openLogin = function () {
  document.getElementById("login-overlay").classList.add("open");
  const saved = localStorage.getItem(USERNAME_KEY);
  if (saved && !document.getElementById("username-input").value) {
    document.getElementById("username-input").value = saved;
  }
  setTimeout(() => {
    const u = document.getElementById("username-input");
    const k = document.getElementById("key-input");
    (u.value ? k : u).focus();
  }, 100);
};

window.closeLogin = function () {
  document.getElementById("login-overlay").classList.remove("open");
  const err = document.getElementById("login-error");
  err.classList.remove("show");
  err.textContent = "";
  document.getElementById("key-input").value = "";
};

async function doLogin(e) {
  e.preventDefault();

  const username = document.getElementById("username-input").value.trim();
  const key      = document.getElementById("key-input").value.trim();
  const deviceId = getDeviceId();
  const err      = document.getElementById("login-error");
  const btn      = document.getElementById("login-btn");

  err.classList.remove("show");
  err.textContent = "";

  if (!username || !key) {
    err.textContent = "Username နှင့် Key နှစ်ခုလုံး ထည့်ပါ";
    err.classList.add("show");
    return;
  }

  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> စစ်ဆေးနေသည်...';

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, key, deviceId }),
    });

    const text = await res.text();
    let data = {};
    
    try { 
      data = JSON.parse(text); 
    } catch (e) {
      // Apps Script (သို့) Netlify က HTML Error ပြန်လာရင် ဒီကို ရောက်မယ်
      err.textContent = `Error ${res.status}: ${text.substring(0, 50).replace(/<[^>]*>?/gm, '')}`;
      err.classList.add("show");
      btn.disabled = false;
      btn.innerHTML = orig;
      return;
    }

    if (!res.ok || !data.ok) {
      err.textContent = data.message || "Login မအောင်မြင်ပါ";
      err.classList.add("show");
      btn.disabled = false;
      btn.innerHTML = orig;
      return;
    }

    localStorage.setItem(USERNAME_KEY, username);
    location.reload();
    
  } catch (networkErr) {
    err.textContent = "Network Error — အင်တာနက် ချိတ်ဆက်မှု စစ်ပါ";
    err.classList.add("show");
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

async function doLogout() {
  try { await fetch("/api/logout", { method: "POST" }); } catch {}
  localStorage.removeItem(USERNAME_KEY);
  location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (form) form.addEventListener("submit", doLogin);

  const overlay = document.getElementById("login-overlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target.id === "login-overlay") closeLogin();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLogin();
  });

  const dash = document.getElementById("dashboard");
  if (dash) {
    const welcome = dash.querySelector(".welcome-user");
    if (welcome) {
      const name = localStorage.getItem(USERNAME_KEY);
      welcome.textContent = name
        ? `⚓ ကြိုဆိုပါသည် — ${name}`
        : "⚓ သင်္ဘောသား — ကြိုဆိုပါသည်";
    }
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", doLogout);
});

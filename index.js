/* =====================================================
   MEPT Login — username + key + deviceId
   ===================================================== */

const DEVICE_ID_KEY = "mept_device_id";
const USERNAME_KEY  = "mept_username";

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    // crypto.randomUUID available in all modern browsers
    id = (crypto.randomUUID && crypto.randomUUID()) ||
         (Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12));
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

window.openLogin = function () {
  document.getElementById("login-overlay").classList.add("open");
  // pre-fill username if known
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

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      // Show server-side message from Google Sheet verbatim
      err.textContent = data.message || "Login မအောင်မြင်ပါ";
      err.classList.add("show");
      btn.disabled = false;
      btn.innerHTML = orig;
      return;
    }

    // ✅ Success
    localStorage.setItem(USERNAME_KEY, username);
    location.reload();
  } catch {
    err.textContent = "Network error — ထပ်ကြိုးစားပါ";
    err.classList.add("show");
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

async function doLogout() {
  try { await fetch("/api/logout", { method: "POST" }); } catch {}
  // Clear only username hint; keep deviceId so re-login still works on same browser
  localStorage.removeItem(USERNAME_KEY);
  location.reload();
}

/* ---------- Wire up ---------- */
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

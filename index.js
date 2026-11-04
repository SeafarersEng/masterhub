/* =====================================================
   Login / Logout — talks to /api/login and /api/logout
   (edge function handles HMAC cookie server-side)
   ===================================================== */

window.openLogin = function () {
  document.getElementById("login-overlay").classList.add("open");
  setTimeout(() => document.getElementById("password-input").focus(), 100);
};

window.closeLogin = function () {
  document.getElementById("login-overlay").classList.remove("open");
  document.getElementById("login-error").classList.remove("show");
  document.getElementById("password-input").value = "";
};

async function doLogin(e) {
  e.preventDefault();
  const pw = document.getElementById("password-input").value;
  const err = document.getElementById("login-error");
  const btn = document.getElementById("login-btn");

  err.classList.remove("show");
  btn.disabled = true;
  const origHTML = btn.innerHTML;
  btn.innerHTML = '<span class="spinner"></span> စစ်ဆေးနေသည်...';

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });

    if (!res.ok) {
      err.textContent = "Password မှားနေပါသည်";
      err.classList.add("show");
      btn.disabled = false;
      btn.innerHTML = origHTML;
      return;
    }

    // Success — reload so edge function can un-hide the dashboard
    location.reload();
  } catch {
    err.textContent = "Network error — ထပ်ကြိုးစားပါ";
    err.classList.add("show");
    btn.disabled = false;
    btn.innerHTML = origHTML;
  }
}

async function doLogout() {
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch {}
  location.reload();
}

/* =====================================================
   Wire up
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  // Login form
  const form = document.getElementById("login-form");
  if (form) form.addEventListener("submit", doLogin);

  // Backdrop click closes the overlay
  const overlay = document.getElementById("login-overlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target.id === "login-overlay") closeLogin();
    });
  }

  // ESC closes overlay
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLogin();
  });

  // Dashboard (only exists when authed — edge function kept it)
  const dash = document.getElementById("dashboard");
  if (dash) {
    const welcome = dash.querySelector(".welcome-user");
    if (welcome) welcome.textContent = "⚓ သင်္ဘောသား — ကြိုဆိုပါသည်";
  }

  // Logout button (only exists when authed)
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", doLogout);
});

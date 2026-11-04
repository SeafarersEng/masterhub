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
    try { data = JSON.parse(text); } catch (e) {}

    if (!res.ok || !data.ok) {
      if (data.message) {
        // Apps Script က ပြန်တဲ့ မူရင်း Error Message
        err.textContent = data.message;
      } else {
        // ဒါက Netlify က 404 (သို့) 500 Error ပြန်တဲ့အခါ ပေါ်လာမယ်
        err.textContent = `Error ${res.status}: ${text.substring(0, 80).replace(/<[^>]*>?/gm, '')}`;
      }
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

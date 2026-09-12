document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginContainer = document.getElementById('login-container');
  const mainContainer = document.getElementById('main-container');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');
  const welcomeUser = document.getElementById('welcomeUser');

  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzwwIIgohqmAtcm6YefKkWrhthy7scTnuorlke0Amt6cUFJ7ltYfpwohicrkl56K7fP/exec';
  const APP_SECRET_TOKEN = 'MySecretToken123';
  const DEVICE_ID_KEY = 'mept_device_id';

  // ================================================================
  // ⏱️ Session configuration
  // ================================================================
  const SESSION_TIMEOUT_MS = 15 * 60 * 1000;      // 15 minutes inactivity
  const LOGIN_TIME_KEY     = 'mept_login_time';    // timestamp of login
  const ACTIVITY_KEY       = 'mept_last_activity'; // timestamp of last activity
  const THROTTLE_MS        = 5000;                 // max once per 5s to save

  let inactivityTimer  = null;
  let dayCheckInterval = null;
  let lastActivityUpdate = 0;

  // ================================================================
  // 🆔 Device ID
  // ================================================================
  function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'DEV-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  // ================================================================
  // 🔐 Login session helpers
  // ================================================================
  function saveLoginSession(username) {
    const now = Date.now().toString();
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', username);
    localStorage.setItem(LOGIN_TIME_KEY, now);
    localStorage.setItem(ACTIVITY_KEY, now);
  }

  function clearLoginSession() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    localStorage.removeItem(LOGIN_TIME_KEY);
    localStorage.removeItem('mept_last_activity');
  }

  // ================================================================
  // ⏰ Inactivity timer (15 minutes)
  // ================================================================
  function startInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      autoLogout('⏰ ၁၅ မိနစ်ကြာ အသုံးမပြုသောကြောင့် အလိုအလျောက် Logout ဖြစ်သွားပါပြီ။အရင်ကအသုံးပြုထားတဲ့ username အတိုင်းအသုံးပြုပြီးဝင်ပါမရပါက admin ကိုပြန်မေးရန်');
    }, SESSION_TIMEOUT_MS);
  }

  // ================================================================
  // 📅 Day change check (every minute)
  // ================================================================
  function startDayCheckInterval() {
    if (dayCheckInterval) clearInterval(dayCheckInterval);
    dayCheckInterval = setInterval(() => {
      if (localStorage.getItem('isLoggedIn') !== 'true') return;
      if (isNewDaySinceLogin()) {
        autoLogout('📅 နောက်တစ်နေ့ဖြစ်သောကြောင့် အလိုအလျောက် Logout ဖြစ်သွားပါပြီ။ ပြန်လည် Login ဝင်ပါ။ အရင်ကအသုံးပြုထားတဲ့ username အတိုင်းအသုံးပြုပြီးဝင်ပါမရပါက admin ကိုပြန်မေးရန်');
      }
    }, 60 * 1000); // every 1 minute
  }

  function isNewDaySinceLogin() {
    const loginTime = parseInt(localStorage.getItem(LOGIN_TIME_KEY) || '0', 10);
    if (!loginTime) return false;
    const loginDate = new Date(loginTime).toDateString();
    const today     = new Date().toDateString();
    return loginDate !== today;
  }

  // ================================================================
  // 🚪 Auto logout
  // ================================================================
  function autoLogout(message) {
    clearLoginSession();
    if (inactivityTimer)  { clearTimeout(inactivityTimer); inactivityTimer = null; }
    if (dayCheckInterval) { clearInterval(dayCheckInterval); dayCheckInterval = null; }
    showLoginForm();
    if (message) showError(message);
  }

  // ================================================================
  // 📝 Record user activity
  // ================================================================
  function recordActivity() {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    const now = Date.now();
    if (now - lastActivityUpdate < THROTTLE_MS) return; // throttle writes
    lastActivityUpdate = now;
    localStorage.setItem(ACTIVITY_KEY, now.toString());
    startInactivityTimer();
  }

  // ================================================================
  // 🔎 Validate session on page load
  // ================================================================
  function validateSessionOnLoad() {
    if (localStorage.getItem('isLoggedIn') !== 'true') return false;

    // 1) Inactivity timeout
    const lastActivity = parseInt(localStorage.getItem(ACTIVITY_KEY) || '0', 10);
    if (lastActivity && (Date.now() - lastActivity) > SESSION_TIMEOUT_MS) {
      autoLogout('⏰ Session သက်တမ်းကုန်သွားပါပြီ။ ပြန်လည် Login ဝင်ပါ။အရင်ကအသုံးပြုထားတဲ့ username အတိုင်းအသုံးပြုပြီးဝင်ပါမရပါက admin ကိုပြန်မေးရန်');
      return false;
    }

    // 2) Day change
    if (isNewDaySinceLogin()) {
      autoLogout('📅 နောက်တစ်နေ့ဖြစ်သောကြောင့် အလိုအလျောက် Logout ဖြစ်သွားပါပြီ။ ပြန်လည် Login ဝင်ပါ။အရင်ကအသုံးပြုထားတဲ့ username အတိုင်းအသုံးပြုပြီးဝင်ပါမရပါက admin ကိုပြန်မေးရန်');
      return false;
    }

    // Session is valid — resume
    startInactivityTimer();
    startDayCheckInterval();
    return true;
  }

  // ================================================================
  // 🔐 Login
  // ================================================================
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const enteredKey = document.getElementById('password').value.trim();
    const username   = document.getElementById('username').value.trim();
    const submitBtn  = loginForm.querySelector('button[type="submit"]');

    if (!username || !enteredKey) {
      showError('❌ ကျေးဇူးပြု၍ Username နှင့် Key ကို ထည့်ပါ။');
      return;
    }

    submitBtn.textContent = "စစ်ဆေးနေပါသည်...";
    submitBtn.disabled = true;
    loginError.style.display = 'none';

    const payload = {
      key: enteredKey,
      username: username,
      deviceId: getDeviceId(),
      token: APP_SECRET_TOKEN
    };

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        // 💾 Save session with timestamps
        saveLoginSession(username);
        loginError.style.display = 'none';
        showMainDashboard(username);

        // ⏰ Start session trackers
        startInactivityTimer();
        startDayCheckInterval();
      } else {
        showError(result.message);
      }
    } catch (error) {
      showError('❌ အင်တာနက်ချိတ်ဆက်မှု ပြဿနာရှိနေပါသည်။ ပြန်လည်ကြိုးစားကြည့်ပါ။');
      console.error("Login Error:", error);
    } finally {
      submitBtn.textContent = "Login ဝင်မည်";
      submitBtn.disabled = false;
    }
  });

  function showError(msg) {
    loginError.textContent = msg;
    loginError.style.display = 'block';
  }

  // ================================================================
  // 🚪 Logout button
  // ================================================================
  logoutBtn.addEventListener('click', () => {
    autoLogout(); // manual logout: no message
  });

  // ================================================================
  // 🖥️ Show / hide dashboards
  // ================================================================
  function showMainDashboard(username) {
    loginContainer.classList.add('hidden');
    mainContainer.classList.remove('hidden');
    if (welcomeUser) {
      welcomeUser.textContent = `👤 ${username}`;
    }
  }

  function showLoginForm() {
    mainContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    loginError.style.display = 'none';
    loginForm.reset();
  }

  // ================================================================
  // 📡 Activity listeners (reset 15-min timer on any interaction)
  // ================================================================
  ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(evt => {
    document.addEventListener(evt, recordActivity, { passive: true });
  });

  // Re-check session when tab becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (localStorage.getItem('isLoggedIn') !== 'true') return;

    // Check inactivity
    const lastActivity = parseInt(localStorage.getItem(ACTIVITY_KEY) || '0', 10);
    if (lastActivity && (Date.now() - lastActivity) > SESSION_TIMEOUT_MS) {
      autoLogout('⏰ Session သက်တမ်းကုန်သွားပါပြီ။ ပြန်လည် Login ဝင်ပါ။အရင်ကအသုံးပြုထားတဲ့ username အတိုင်းအသုံးပြုပြီးဝင်ပါမရပါက admin ကိုပြန်မေးရန်');
      return;
    }
    // Check day change
    if (isNewDaySinceLogin()) {
      autoLogout('📅 နောက်တစ်နေ့ဖြစ်သောကြောင့် အလိုအလျောက် Logout ဖြစ်သွားပါပြီ။ ပြန်လည် Login ဝင်ပါ။အရင်ကအသုံးပြုထားတဲ့ username အတိုင်းအသုံးပြုပြီးဝင်ပါမရပါက admin ကိုပြန်မေးရန်');
    }
  });

  // ================================================================
  // 🚀 Initial session check on page load
  // ================================================================
  if (validateSessionOnLoad()) {
    const savedUser = localStorage.getItem('currentUser') || '';
    showMainDashboard(savedUser);
  } else {
    showLoginForm();
  }
});

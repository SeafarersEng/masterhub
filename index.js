document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginContainer = document.getElementById('login-container');
  const mainContainer = document.getElementById('main-container');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');

  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzwwIIgohqmAtcm6YefKkWrhthy7scTnuorlke0Amt6cUFJ7ltYfpwohicrkl56K7fP/exec'; 


  const APP_SECRET_TOKEN = 'MySecretToken123';


  const DEVICE_ID_KEY = 'mept_device_id';

  function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'DEV-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  // ================================================================
  // 🔐 Login လုပ်ငန်းစဉ် (Backend သို့ လှမ်းစစ်ဆေးခြင်း)
  // ================================================================
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const enteredKey = document.getElementById('password').value.trim();
    const username = document.getElementById('username').value.trim();
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (!username || !enteredKey) {
      showError('❌ ကျေးဇူးပြု၍ Username နှင့် Key ကို ထည့်ပါ။');
      return;
    }

    // Loading ပြနေရန်
    submitBtn.textContent = "စစ်ဆေးနေပါသည်...";
    submitBtn.disabled = true;
    loginError.style.display = 'none';

    const payload = {
      key: enteredKey,
      username: username,
      deviceId: getDeviceId(),
      token: APP_SECRET_TOKEN // Token ထည့်သွင်းခြင်း
    };

    try {
      // Google Apps Script သို့ Data ပို့ခြင်း
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', username);
        loginError.style.display = 'none';
        showMainDashboard();
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
  // 🚪 Logout & Session စစ်ဆေးခြင်း
  // ================================================================
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    showLoginForm();
  });

  function showMainDashboard() {
    loginContainer.classList.add('hidden');
    mainContainer.classList.remove('hidden');
  }

  function showLoginForm() {
    mainContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    loginError.style.display = 'none';
    loginForm.reset();
  }

  // Page Reload လုပ်သည့်အခါ Auto Login စစ်ဆေးခြင်း
  if (localStorage.getItem('isLoggedIn') === 'true') {
    showMainDashboard();
  }
});

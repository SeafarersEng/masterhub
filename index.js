document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginContainer = document.getElementById('login-container');
  const mainContainer = document.getElementById('main-container');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginError = document.getElementById('loginError');

  // ================================================================
  // 📌 Key သက်တမ်းသတ်မှတ်ချက်များ
  // ================================================================
  const EIGHT_CHAR_START = '2026-08-01';
  const EIGHT_CHAR_END   = '2027-02-02';
  const TEN_CHAR_START   = '2026-10-01';
  const TEN_CHAR_END     = '2027-05-02';

  // ================================================================
  // 📌 Key စာရင်းများ
  // ================================================================
  const EIGHT_CHAR_KEYS = [
    'KEY1AAAA', 'MEPT1011', 'HUB11A89', 'KEY2BBBB', 'MEPT2022',
    'HUB22B90', 'KEY3CCCC', 'MEPT3033', 'HUB33C01', 'KEY4DDDD',
    'MEPT4044', 'HUB44D12', 'KEY5EEEE', 'MEPT5055', 'HUB55E23',
    'KEY6FFFF', 'MEPT6066', 'HUB66F34', 'KEY7GGGG', 'MEPT7077',
    'HUB77G45', 'KEY8HHHH', 'MEPT8088', 'HUB88H56', 'KEY9IIII',
    'MEPT9099', 'HUB99I67', 'KEY10JJJ', 'MEPT1010', 'HUB100J8'
  ];
  const TEN_CHAR_KEYS = [
    'TENKEY11KKK', 'TENKEY12LLL', 'TENKEY13MMM', 'TENKEY14NNN', 'TENKEY15OOO',
    'TENKEY16PPP', 'TENKEY17QQQ', 'TENKEY18RRR', 'TENKEY19SSS', 'TENKEY20TTT',
    'TENKEY21UUU', 'TENKEY22VVV', 'TENKEY23WWW', 'TENKEY24XXX', 'TENKEY25YYY',
    'TENKEY26ZZZ', 'TENKEY27AAA', 'TENKEY28BBB', 'TENKEY29CCC', 'TENKEY30DDD',
    'TENKEY31EEE', 'TENKEY32FFF', 'TENKEY33GGG', 'TENKEY34HHH', 'TENKEY35III',
    'TENKEY36JJJ', 'TENKEY37KKK', 'TENKEY38LLL', 'TENKEY39MMM', 'TENKEY40NNN'
  ];
  

  // ================================================================
  // 📱 Device Identification & Key Lock Logic
  // ================================================================
  const DEVICE_ID_KEY = 'mept_device_id';
  const BOUND_KEY = 'mept_bound_key';

  // Device အတွက် Unique ID ထုတ်ပေးခြင်း (သို့မဟုတ် ရှိပြီးသားယူခြင်း)
  function getDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'DEV-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }

  // Key ကို ဤ Device နှင့် ချိတ်ဆက်ခြင်း
  function bindKeyToDevice(key) {
    localStorage.setItem(BOUND_KEY, key);
  }

  // Key ကို ဤ Device တွင် သုံးခွင့်ရှိမရှိ စစ်ဆေးခြင်း
  function isKeyValidForThisDevice(key) {
    const boundKey = localStorage.getItem(BOUND_KEY);
    // ဤ Device မှာ Key မသုံးရသေးပါက သုံးခွင့်ပြုမည်
    if (!boundKey) return true; 
    // သုံးဖူးပါက မူလ Bind ခဲ့သော Key နှင့် တူမှသာ သုံးခွင့်ပြုမည်
    return boundKey === key; 
  }

  // ================================================================
  // 🗓️ Key သက်တမ်းစစ်ဆေးခြင်း
  // ================================================================
  function isDateInRange(dateStr, startStr, endStr) {
    const date = new Date(dateStr);
    const start = new Date(startStr);
    const end = new Date(endStr);
    return date >= start && date <= end;
  }

  function validateKey(key) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (key.length === 8 && EIGHT_CHAR_KEYS.includes(key)) {
      return isDateInRange(today, EIGHT_CHAR_START, EIGHT_CHAR_END);
    } else if (key.length === 11 && TEN_CHAR_KEYS.includes(key)) { // TEN_CHAR_KEYS စာရင်းထဲမှ Length ၁၁ လုံးဖြစ်နေ၍ ၁၁ ပြင်ပေးထားပါသည်
      return isDateInRange(today, TEN_CHAR_START, TEN_CHAR_END);
    }
    return false;
  }

  // ================================================================
  // 🔐 Login လုပ်ငန်းစဉ်
  // ================================================================
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const enteredKey = document.getElementById('password').value.trim();
    const username = document.getElementById('username').value.trim();

    if (!username) {
      loginError.textContent = '❌ ကျေးဇူးပြု၍ Username ထည့်ပါ။';
      loginError.style.display = 'block';
      return;
    }

    // ၁။ Key သက်တမ်းနှင့် စာရင်းထဲရှိမရှိ စစ်ဆေးခြင်း
    if (!validateKey(enteredKey)) {
      loginError.textContent = '❌ သော့မှားနေပါသည် သို့မဟုတ် သက်တမ်းကုန်ဆုံးနေပါသည်။';
      loginError.style.display = 'block';
      return;
    }

    // ၂။ ဤ Device တွင် အခြား Key တစ်ခု Lock ကျထားပြီးပြီလား စစ်ဆေးခြင်း
    if (!isKeyValidForThisDevice(enteredKey)) {
      loginError.textContent = '❌ ဤ Device တွင် အခြား သော့ ပေါင်းစပ်ထားပြီး ဖြစ်ပါသည်။';
      loginError.style.display = 'block';
      return;
    }

    // ၃။ အားလုံး မှန်ကန်ပါက Key ကို ဒီ Device မှာ Lock မှတ်ပြီး Login ဝင်ခွင့်ပြုမည်
    bindKeyToDevice(enteredKey);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', username);
    loginError.style.display = 'none';
    showMainDashboard();
  });

  // ================================================================
  // 🚪 Logout & Session စစ်ဆေးခြင်း
  // ================================================================
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
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
  }

  // Page Reload လုပ်သည့်အခါ Auto Login စစ်ဆေးခြင်း
  if (localStorage.getItem('isLoggedIn') === 'true') {
    showMainDashboard();
  }
});

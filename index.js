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
    const EIGHT_CHAR_END = '2027-02-02';
    const TEN_CHAR_START = '2026-10-01';
    const TEN_CHAR_END = '2027-05-02';

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
    // 📱 1 Key 1 Device စနစ် (အဓိက Logic)
    // ================================================================
    const DEVICE_ID_KEY = 'mept_device_id';
    const BOUND_KEY = 'mept_bound_key';
    const USED_KEYS_KEY = 'mept_used_keys'; // 🆕 သုံးပြီးသား Keys စာရင်း

    // Device ID ထုတ်ယူခြင်း
    function getDeviceId() {
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
            deviceId = 'DEV-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
        return deviceId;
    }

    // 🆕 သုံးပြီးသား Keys စာရင်းကို ရယူခြင်း
    function getUsedKeys() {
        try {
            const data = localStorage.getItem(USED_KEYS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    }

    // 🆕 သုံးပြီးသား Keys စာရင်းကို သိမ်းဆည်းခြင်း
    function saveUsedKeys(keys) {
        localStorage.setItem(USED_KEYS_KEY, JSON.stringify(keys));
    }

    // ⭐ Key ကို တစ်ခါသုံးပြီးပြီလား စစ်ဆေးခြင်း (ပိုမိုတိကျအောင် ပြင်ဆင်)
    function isKeyAlreadyUsed(key) {
        const usedKeys = getUsedKeys();
        return usedKeys.includes(key);
    }

    // ⭐ Key ကို ဒီ Device မှာ သုံးခွင့်ရှိလား စစ်ဆေးခြင်း
    function isKeyValidForThisDevice(key) {
        const boundData = localStorage.getItem(BOUND_KEY);
        if (!boundData) return false; // ဘယ် Key မှ မသုံးရသေးဘူး
        
        try {
            const { key: boundKey, deviceId: boundDeviceId } = JSON.parse(boundData);
            const currentDeviceId = getDeviceId();
            
            // Key ရော Device ID ပါ တူမှသာ သုံးခွင့်ပြုမယ်
            return boundKey === key && boundDeviceId === currentDeviceId;
        } catch (error) {
            localStorage.removeItem(BOUND_KEY);
            return false;
        }
    }

    // ⭐ Key ကို Device နဲ့ ချိတ်ဆက်သိမ်းဆည်းခြင်း
    function bindKeyToDevice(key) {
        const deviceId = getDeviceId();
        localStorage.setItem(BOUND_KEY, JSON.stringify({ key, deviceId }));
        
        // 🆕 သုံးပြီးသား Keys စာရင်းထဲ ထည့်သွင်းခြင်း
        const usedKeys = getUsedKeys();
        if (!usedKeys.includes(key)) {
            usedKeys.push(key);
            saveUsedKeys(usedKeys);
        }
    }

    // 🆕 တစ်ခါသုံးပြီးသား Key ကို ပြန်သုံးရန် ကြိုးစားခြင်းကို တားမြစ်ခြင်း
    function isKeyBlocked(key) {
        // Key က သုံးပြီးသားဖြစ်ပြီး ဒီ Device နဲ့ မကိုက်ညက်ရင် Block
        if (isKeyAlreadyUsed(key)) {
            return !isKeyValidForThisDevice(key);
        }
        return false;
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
        const today = new Date().toISOString().split('T')[0];

        if (key.length === 8 && EIGHT_CHAR_KEYS.includes(key)) {
            return isDateInRange(today, EIGHT_CHAR_START, EIGHT_CHAR_END);
        } else if (key.length === 11 && TEN_CHAR_KEYS.includes(key)) {
            return isDateInRange(today, TEN_CHAR_START, TEN_CHAR_END);
        }
        return false;
    }

    // ================================================================
    // 🔐 Login လုပ်ငန်းစဉ် (ပိုမိုလုံခြုံအောင် ပြင်ဆင်)
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

        // 🆕 ၂။ Key ကို တစ်ခါသုံးပြီးပြီလား စစ်ဆေးခြင်း (ပိုမိုတိကျ)
        if (isKeyAlreadyUsed(enteredKey)) {
            // Key သုံးပြီးသားဆိုရင် ဒီ Device မှာ သုံးခွင့်ရှိလား ထပ်စစ်မယ်
            if (!isKeyValidForThisDevice(enteredKey)) {
                loginError.textContent = '❌ ဒီ Key ကို အခြား Device မှ သုံးထားပြီးပါပြီ။ တစ်ခါသုံးသော့ဖြစ်ပါသည်။';
                loginError.style.display = 'block';
                return;
            }
            // ဒီ Device မှာ သုံးခွင့်ရှိရင် ဆက်သွားမယ်
        } else {
            // 🆕 Key ကို မသုံးရသေးဘူး၊ ဒါပေမယ့် ဒီ Device မှာ တခြား Key သုံးထားလား စစ်မယ်
            const boundData = localStorage.getItem(BOUND_KEY);
            if (boundData) {
                try {
                    const { key: boundKey } = JSON.parse(boundData);
                    // ဒီ Device မှာ တခြား Key သုံးထားပြီးသား
                    if (boundKey !== enteredKey) {
                        loginError.textContent = '❌ ဤ Device တွင် အခြား သော့ကို သုံးထားပြီးဖြစ်ပါသည်။';
                        loginError.style.display = 'block';
                        return;
                    }
                } catch (error) {
                    localStorage.removeItem(BOUND_KEY);
                }
            }
        }

        // ၃။ အားလုံး မှန်ကန်ပါက Key ကို ဒီ Device မှာ Lock မှတ်ပြီး Login ဝင်ခွင့်ပြုမည်
        bindKeyToDevice(enteredKey);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', username);
        localStorage.setItem('lastLoginKey', enteredKey); // 🆕 နောက်ဆုံး Login လုပ်ခဲ့တဲ့ Key
        loginError.style.display = 'none';
        showMainDashboard();
    });

    // ================================================================
    // 🚪 Logout & Session စစ်ဆေးခြင်း
    // ================================================================
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        // 🆕 Logout လုပ်တဲ့အခါ Device မှာ Bound ထားတဲ့ Key ကို မဖျက်ပါနဲ့
        // (တစ်ခါသုံးပြီးသား Key ကို ပြန်သုံးမရအောင်)
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

    // ================================================================
    // 🛡️ Auto Login စစ်ဆေးခြင်း (ပိုမိုလုံခြုံအောင် ပြင်ဆင်)
    // ================================================================
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const lastLoginKey = localStorage.getItem('lastLoginKey');
        if (lastLoginKey && isKeyValidForThisDevice(lastLoginKey)) {
            showMainDashboard();
        } else {
            // Session မမှန်ရင် Logout လုပ်မယ်
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('lastLoginKey');
            showLoginForm();
        }
    }

    // ================================================================
    // 🧹 Admin Function - သုံးပြီးသား Keys စာရင်းကို ကြည့်ရန် (Console မှာ)
    // ================================================================
    window.getUsedKeysList = function() {
        return getUsedKeys();
    };

    // 🧹 Admin Function - သုံးပြီးသား Keys စာရင်းကို ရှင်းရန် (သတိထားသုံးပါ)
    window.clearUsedKeys = function() {
        if (confirm('သုံးပြီးသား Keys အားလုံးကို ရှင်းမှာသေချာလား?')) {
            localStorage.removeItem(USED_KEYS_KEY);
            localStorage.removeItem(BOUND_KEY);
            console.log('✅ သုံးပြီးသား Keys အားလုံးကို ရှင်းလင်းပြီးပါပြီ။');
        }
    };
});

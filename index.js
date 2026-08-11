// ================================================================
//  📌 MEPT MASTER HUB - 1 KEY 1 DEVICE (IP + Browser Fingerprint)
//  🔒 Server မပါဘဲ အကောင်းဆုံး ဖြေရှင်းနည်း (IP + Fingerprint)
// ================================================================

document.addEventListener('DOMContentLoaded', function() {

    // ================================================================
    //  1. DOM References
    // ================================================================
    const loginForm = document.getElementById('loginForm');
    const loginContainer = document.getElementById('login-container');
    const mainContainer = document.getElementById('main-container');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginError = document.getElementById('loginError');
    const loginSuccess = document.getElementById('loginSuccess');
    const loginLoading = document.getElementById('loginLoading');
    const displayUsername = document.getElementById('displayUsername');
    const usernameInput = document.getElementById('username');
    const accessKeyInput = document.getElementById('accessKey');

    // ================================================================
    //  2. KEY EXPIRY DATES
    // ================================================================
    const EIGHT_CHAR_START = '2026-08-01';
    const EIGHT_CHAR_END = '2027-02-02';
    const TEN_CHAR_START = '2026-10-01';
    const TEN_CHAR_END = '2027-05-02';

    // ================================================================
    //  3. VALID KEYS
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
        'TENKEY1AAA', 'TENKEY2BBB', 'TENKEY3CCC', 'TENKEY4DDD', 'TENKEY5EEE',
        'TENKEY6FFF', 'TENKEY7GGG', 'TENKEY8HHH', 'TENKEY9III', 'TENKEY10JJJ',
        'TENKEY11KKK', 'TENKEY12LLL', 'TENKEY13MMM', 'TENKEY14NNN', 'TENKEY15OOO',
        'TENKEY16PPP', 'TENKEY17QQQ', 'TENKEY18RRR', 'TENKEY19SSS', 'TENKEY20TTT',
        'TENKEY21UUU', 'TENKEY22VVV', 'TENKEY23WWW', 'TENKEY24XXX', 'TENKEY25YYY',
        'TENKEY26ZZZ', 'TENKEY27AAA', 'TENKEY28BBB', 'TENKEY29CCC', 'TENKEY30DDD'
    ];

    // ================================================================
    //  4. IP + BROWSER FINGERPRINT - 1 KEY 1 DEVICE TRACKING
    //     🔒 IP Address ပါ ထည့်သွင်းထားသည်
    // ================================================================
    const DEVICE_ID_KEY = 'mept_device_id';
    const BOUND_KEY = 'mept_bound_key';
    let cachedDeviceId = null;

    /**
     * 🌐 Public IP Address ကို ရယူခြင်း
     */
    async function getPublicIP() {
        try {
            // free IP API (အခမဲ့)
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('⚠️ IP Address ရယူ၍မရပါ:', error);
            return 'unknown-ip';
        }
    }

    /**
     * 📱 IP Address + Browser Fingerprint ကို ပေါင်းစပ်၍ 
     * Unique Device ID ထုတ်ယူခြင်း
     */
    async function getDeviceId() {
        // Cache ရှိရင် ပြန်ပေး
        if (cachedDeviceId) return cachedDeviceId;

        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        
        if (!deviceId) {
            // IP Address ရယူခြင်း
            const ip = await getPublicIP();
            
            // Browser Fingerprint ထုတ်ယူခြင်း
            const components = [
                navigator.userAgent,
                navigator.language,
                screen.width,
                screen.height,
                screen.colorDepth,
                navigator.hardwareConcurrency || 'unknown',
                navigator.deviceMemory || 'unknown',
                new Date().getTimezoneOffset()
            ];
            
            const fingerprint = components.join('|');
            
            // IP + Fingerprint ပေါင်းစပ်၍ Device ID ထုတ်ခြင်း
            const combined = `${ip}|${fingerprint}`;
            deviceId = 'DEV-' + btoa(encodeURIComponent(combined)).substring(0, 35);
            
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
        
        cachedDeviceId = deviceId;
        return deviceId;
    }

    /**
     * 🔍 Key ကို အခြား Device က သုံးထားလား စစ်ဆေးခြင်း
     */
    async function isKeyUsedByOtherDevice(key) {
        const boundData = localStorage.getItem(BOUND_KEY);
        if (!boundData) return false;
        
        try {
            const { key: boundKey, deviceId: boundDeviceId } = JSON.parse(boundData);
            const currentDeviceId = await getDeviceId();
            return boundKey === key && boundDeviceId !== currentDeviceId;
        } catch (error) {
            localStorage.removeItem(BOUND_KEY);
            return false;
        }
    }

    /**
     * ✅ Key ကို ဤ Device တွင် သုံးခွင့်ရှိမရှိ စစ်ဆေးခြင်း
     */
    async function isKeyValidForThisDevice(key) {
        const boundData = localStorage.getItem(BOUND_KEY);
        if (!boundData) return true;
        
        try {
            const { key: boundKey, deviceId: boundDeviceId } = JSON.parse(boundData);
            const currentDeviceId = await getDeviceId();
            return boundKey === key && boundDeviceId === currentDeviceId;
        } catch (error) {
            localStorage.removeItem(BOUND_KEY);
            return true;
        }
    }

    /**
     * 🔗 Key ကို ဤ Device နှင့် ချိတ်ဆက်သိမ်းဆည်းခြင်း
     */
    async function bindKeyToDevice(key) {
        const deviceId = await getDeviceId();
        localStorage.setItem(BOUND_KEY, JSON.stringify({ key, deviceId }));
        console.log('✅ Key bound to device:', deviceId);
    }

    // ================================================================
    //  5. KEY VALIDATION (Expiry & Validity)
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
        } else if (key.length === 10 && TEN_CHAR_KEYS.includes(key)) {
            return isDateInRange(today, TEN_CHAR_START, TEN_CHAR_END);
        }
        return false;
    }

    // ================================================================
    //  6. SHOW / HIDE FUNCTIONS
    // ================================================================
    function showMainDashboard(username) {
        displayUsername.textContent = username || 'User';
        loginContainer.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        loginError.style.display = 'none';
        loginSuccess.style.display = 'none';
        loginLoading.style.display = 'none';
    }

    function showLoginForm() {
        mainContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        loginError.style.display = 'none';
        loginSuccess.style.display = 'none';
        loginLoading.style.display = 'none';
        usernameInput.value = '';
        accessKeyInput.value = '';
        if (document.activeElement) {
            document.activeElement.blur();
        }
    }

    // ================================================================
    //  7. LOGIN - အဓိက Login Process (Async)
    // ================================================================
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const enteredKey = accessKeyInput.value.trim().toUpperCase();
        const username = usernameInput.value.trim();

        // Reset messages
        loginError.style.display = 'none';
        loginSuccess.style.display = 'none';
        loginLoading.style.display = 'none';
        loginError.textContent = '';

        // ===== Validation 1: Username =====
        if (!username) {
            loginError.textContent = '❌ ကျေးဇူးပြု၍ Username ထည့်ပါ။';
            loginError.style.display = 'block';
            usernameInput.focus();
            return;
        }

        // ===== Validation 2: Key =====
        if (!enteredKey) {
            loginError.textContent = '❌ ကျေးဇူးပြု၍ Access Key ထည့်ပါ။';
            loginError.style.display = 'block';
            accessKeyInput.focus();
            return;
        }

        // ===== Validation 3: Key Length =====
        if (enteredKey.length !== 8 && enteredKey.length !== 10) {
            loginError.textContent = '❌ Access Key သည် ၈ လုံး သို့မဟုတ် ၁၀ လုံး ဖြစ်ရမည်။';
            loginError.style.display = 'block';
            accessKeyInput.focus();
            return;
        }

        // Show loading
        loginLoading.style.display = 'block';

        try {

            // ===== Validation 4: Key Expiry & Validity =====
            if (!validateKey(enteredKey)) {
                loginLoading.style.display = 'none';
                loginError.textContent = '❌ Access Key မှားနေပါသည် သို့မဟုတ် သက်တမ်းကုန်ဆုံးနေပါသည်။';
                loginError.style.display = 'block';
                accessKeyInput.focus();
                return;
            }

            // ===== Validation 5: Key ကို အခြား Device က သုံးထားလား =====
            if (await isKeyUsedByOtherDevice(enteredKey)) {
                loginLoading.style.display = 'none';
                loginError.textContent = '❌ ဒီ Key ကို အခြား Device တွင် အသုံးပြုထားပြီးဖြစ်ပါသည်။';
                loginError.style.display = 'block';
                accessKeyInput.focus();
                return;
            }

            // ===== Validation 6: ဤ Device တွင် အခြား Key သုံးထားလား =====
            const boundData = localStorage.getItem(BOUND_KEY);
            if (boundData) {
                try {
                    const { key: boundKey, deviceId: boundDeviceId } = JSON.parse(boundData);
                    const currentDeviceId = await getDeviceId();
                    
                    if (boundDeviceId === currentDeviceId && boundKey !== enteredKey) {
                        loginLoading.style.display = 'none';
                        loginError.textContent = '❌ ဤ Device တွင် အခြား သော့ ပေါင်းစပ်ထားပြီး ဖြစ်ပါသည်။';
                        loginError.style.display = 'block';
                        accessKeyInput.focus();
                        return;
                    }
                } catch (error) {
                    localStorage.removeItem(BOUND_KEY);
                }
            }

            // ===== ✅ အားလုံးအောင်မြင်ပါက Login =====
            if (!boundData) {
                await bindKeyToDevice(enteredKey);
            }
            
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);

            loginLoading.style.display = 'none';
            loginSuccess.style.display = 'block';
            loginSuccess.textContent = '✅ Login အောင်မြင်ပါသည်။ ခေတ္တစောင့်ပါ...';

            setTimeout(function() {
                showMainDashboard(username);
            }, 500);

        } catch (error) {
            console.error('Login error:', error);
            loginLoading.style.display = 'none';
            loginError.textContent = '❌ System error ဖြစ်နေပါသည်။ နောက်မှ ထပ်ကြိုးစားပါ။';
            loginError.style.display = 'block';
        }
    });

    // ================================================================
    //  8. LOGOUT
    // ================================================================
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        showLoginForm();
    });

    // ================================================================
    //  9. SESSION CHECK ON PAGE LOAD (Async)
    // ================================================================
    (async function checkSession() {
        const session = localStorage.getItem('isLoggedIn');
        if (session === 'true') {
            const savedUsername = localStorage.getItem('username') || 'User';
            showMainDashboard(savedUsername);
        }
        
        // Device ID ကို ကြိုတင်ရယူထားခြင်း (Performance အတွက်)
        try {
            const deviceId = await getDeviceId();
            console.log('🆔 Current Device ID (IP + Fingerprint):', deviceId);
        } catch (error) {
            console.warn('⚠️ Device ID ရယူ၍မရပါ:', error);
        }
    })();

    // ================================================================
    //  10. KEYBOARD SHORTCUTS (Enter = Login)
    // ================================================================
    accessKeyInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginForm.dispatchEvent(new Event('submit'));
        }
    });

    usernameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            accessKeyInput.focus();
        }
    });

    // ================================================================
    //  11. CONSOLE LOG - System Status
    // ================================================================
    console.log('✅ MEPT Master Hub loaded (IP + Fingerprint System)');
    console.log('📌 8-char keys:', EIGHT_CHAR_KEYS.length, 'keys');
    console.log('📌 10-char keys:', TEN_CHAR_KEYS.length, 'keys');
    console.log('📅 8-char expiry:', EIGHT_CHAR_START, '→', EIGHT_CHAR_END);
    console.log('📅 10-char expiry:', TEN_CHAR_START, '→', TEN_CHAR_END);
    console.log('🔒 1 Key 1 Device system enabled (IP + Browser Fingerprint)');
    console.log('📱 Mobile-optimized design');

});

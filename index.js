// ================================================================
//  📌 MEPT MASTER HUB - 1 KEY 1 DEVICE (Browser Fingerprint)
//  🔒 Server မပါဘဲ အကောင်းဆုံး ဖြေရှင်းနည်း
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
    //     📌 ဤနေရာတွင် သင့် Key များကို ထည့်ပါ။
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
    //  4. BROWSER FINGERPRINT - 1 KEY 1 DEVICE TRACKING
    //     🔒 ဒီနေရာက အဓိက အပိုင်း
    // ================================================================
    const DEVICE_ID_KEY = 'mept_device_id';
    const BOUND_KEY = 'mept_bound_key';

    /**
     * 📱 Browser Fingerprint ကို အသုံးပြု၍ Unique Device ID ထုတ်ယူခြင်း
     * ဒီ ID က ဖုန်း၊ PC၊ Tablet စသည်ဖြင့် ကွဲပြားမှုကို ခွဲခြားနိုင်သည်။
     */
    function getDeviceId() {
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
            // Browser ရဲ့ ထူးခြားသော အချက်အလက်များကို စုဆောင်းခြင်း
            const components = [
                navigator.userAgent,                // Browser အမျိုးအစား၊ OS
                navigator.language,                 // ဘာသာစကား
                screen.width,                       // မျက်နှာပြင်အကျယ်
                screen.height,                      // မျက်နှာပြင်အမြင့်
                screen.colorDepth,                  // အရောင်အတိမ်အနက်
                navigator.hardwareConcurrency || 'unknown', // Processor Core
                navigator.deviceMemory || 'unknown',        // RAM ပမာဏ
                new Date().getTimezoneOffset()      // Timezone
            ];
            
            // အချက်အလက်များကို ပေါင်းစပ်၍ Fingerprint ထုတ်ခြင်း
            const fingerprint = components.join('|');
            // Base64 encoding (လုံခြုံရေးအတွက် ပိုမိုကောင်းမွန်အောင် လုပ်နိုင်သည်)
            deviceId = 'DEV-' + btoa(encodeURIComponent(fingerprint)).substring(0, 30);
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
        return deviceId;
    }

    /**
     * 🔍 Key ကို အခြား Device က သုံးထားလား စစ်ဆေးခြင်း
     */
    function isKeyUsedByOtherDevice(key) {
        const boundData = localStorage.getItem(BOUND_KEY);
        if (!boundData) return false;
        
        try {
            const { key: boundKey, deviceId: boundDeviceId } = JSON.parse(boundData);
            const currentDeviceId = getDeviceId();
            // Key ရှိပြီး Device ID မတူပါက အခြား Device က သုံးထားခြင်း
            return boundKey === key && boundDeviceId !== currentDeviceId;
        } catch (error) {
            localStorage.removeItem(BOUND_KEY);
            return false;
        }
    }

    /**
     * ✅ Key ကို ဤ Device တွင် သုံးခွင့်ရှိမရှိ စစ်ဆေးခြင်း
     */
    function isKeyValidForThisDevice(key) {
        const boundData = localStorage.getItem(BOUND_KEY);
        if (!boundData) return true; // ဘယ်သူမှ မသုံးရသေးပါ
        
        try {
            const { key: boundKey, deviceId: boundDeviceId } = JSON.parse(boundData);
            const currentDeviceId = getDeviceId();
            // Key ရော Device ID ပါ တူမှသာ သုံးခွင့်ပြုမည်
            return boundKey === key && boundDeviceId === currentDeviceId;
        } catch (error) {
            localStorage.removeItem(BOUND_KEY);
            return true;
        }
    }

    /**
     * 🔗 Key ကို ဤ Device နှင့် ချိတ်ဆက်သိမ်းဆည်းခြင်း
     */
    function bindKeyToDevice(key) {
        const deviceId = getDeviceId();
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
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

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
    //  7. LOGIN - အဓိက Login Process
    // ================================================================
    loginForm.addEventListener('submit', function(e) {
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

        // Simulate network delay (for better UX)
        setTimeout(function() {

            // ===== Validation 4: Key Expiry & Validity =====
            if (!validateKey(enteredKey)) {
                loginLoading.style.display = 'none';
                loginError.textContent = '❌ Access Key မှားနေပါသည် သို့မဟုတ် သက်တမ်းကုန်ဆုံးနေပါသည်။';
                loginError.style.display = 'block';
                accessKeyInput.focus();
                return;
            }

            // ===== Validation 5: Key ကို အခြား Device က သုံးထားလား =====
            if (isKeyUsedByOtherDevice(enteredKey)) {
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
                    const currentDeviceId = getDeviceId();
                    
                    // ဤ Device တွင် အခြား Key သုံးထားပြီး လက်ရှိ Key နှင့် မတူပါက
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
            // ဤ Device တွင် မသုံးရသေးပါက သိမ်းဆည်းမည်
            if (!boundData) {
                bindKeyToDevice(enteredKey);
            }
            
            // Session သိမ်းဆည်းခြင်း
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);

            loginLoading.style.display = 'none';
            loginSuccess.style.display = 'block';
            loginSuccess.textContent = '✅ Login အောင်မြင်ပါသည်။ ခေတ္တစောင့်ပါ...';

            // Dashboard သို့ ပြောင်းခြင်း
            setTimeout(function() {
                showMainDashboard(username);
            }, 500);

        }, 300);
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
    //  9. SESSION CHECK ON PAGE LOAD
    // ================================================================
    const session = localStorage.getItem('isLoggedIn');
    if (session === 'true') {
        const savedUsername = localStorage.getItem('username') || 'User';
        showMainDashboard(savedUsername);
    }

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
    console.log('✅ MEPT Master Hub loaded (1 Key 1 Device System)');
    console.log('📌 8-char keys:', EIGHT_CHAR_KEYS.length, 'keys');
    console.log('📌 10-char keys:', TEN_CHAR_KEYS.length, 'keys');
    console.log('📅 8-char expiry:', EIGHT_CHAR_START, '→', EIGHT_CHAR_END);
    console.log('📅 10-char expiry:', TEN_CHAR_START, '→', TEN_CHAR_END);
    console.log('🔒 1 Key 1 Device system enabled (Browser Fingerprint)');
    console.log('📱 Mobile-optimized design');
    
    // Current Device ID ကို Console မှာ ပြသခြင်း (Debug အတွက်)
    console.log('🆔 Current Device ID:', getDeviceId());

});

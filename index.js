// ================================================================
//  📌 MEPT MASTER HUB - LOGIN SYSTEM (Mobile Ready)
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
        'KEY1AAAA', 'KEY2BBBB', 'KEY3CCCC', 'KEY4DDDD', 'KEY5EEEE',
        'KEY6FFFF', 'KEY7GGGG', 'KEY8HHHH', 'KEY9IIII', 'KEY10JJJJ',
        'KEY11KKK', 'KEY12LLL', 'KEY13MMM', 'KEY14NNN', 'KEY15OOO',
        'KEY16PPP', 'KEY17QQQ', 'KEY18RRR', 'KEY19SSS', 'KEY20TTT',
        'KEY21UUU', 'KEY22VVV', 'KEY23WWW', 'KEY24XXX', 'KEY25YYY',
        'KEY26ZZZ', 'KEY27AAA', 'KEY28BBB', 'KEY29CCC', 'KEY30DDD'
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
    //  4. ONE-TIME USE TRACKING
    // ================================================================
    const USED_KEYS_KEY = 'mept_used_keys';

    function isKeyUsed(key) {
        try {
            const used = JSON.parse(localStorage.getItem(USED_KEYS_KEY) || '[]');
            return used.includes(key);
        } catch {
            return false;
        }
    }

    function markKeyUsed(key) {
        try {
            const used = JSON.parse(localStorage.getItem(USED_KEYS_KEY) || '[]');
            if (!used.includes(key)) {
                used.push(key);
                localStorage.setItem(USED_KEYS_KEY, JSON.stringify(used));
            }
        } catch (e) {
            console.warn('Storage error:', e);
        }
    }

    // ================================================================
    //  5. KEY VALIDATION (Expiry)
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
    //  7. LOGIN
    // ================================================================
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const enteredKey = accessKeyInput.value.trim();
        const username = usernameInput.value.trim();

        // Reset messages
        loginError.style.display = 'none';
        loginSuccess.style.display = 'none';
        loginLoading.style.display = 'none';
        loginError.textContent = '';

        // Username မထည့်ပါက
        if (!username) {
            loginError.textContent = '❌ ကျေးဇူးပြု၍ Username ထည့်ပါ။';
            loginError.style.display = 'block';
            usernameInput.focus();
            return;
        }

        // Key မထည့်ပါက
        if (!enteredKey) {
            loginError.textContent = '❌ ကျေးဇူးပြု၍ Access Key ထည့်ပါ။';
            loginError.style.display = 'block';
            accessKeyInput.focus();
            return;
        }

        // Key length စစ်ဆေးပါ (၈ လုံး သို့ ၁၀ လုံး)
        if (enteredKey.length !== 8 && enteredKey.length !== 10) {
            loginError.textContent = '❌ Access Key သည် ၈ လုံး သို့မဟုတ် ၁၀ လုံး ဖြစ်ရမည်။';
            loginError.style.display = 'block';
            accessKeyInput.focus();
            return;
        }

        // Show loading
        loginLoading.style.display = 'block';

        // Simulate network delay (300ms for better UX)
        setTimeout(function() {

            // Key သည် တရားဝင် နှင့် သက်တမ်းမကုန်သေးလား
            if (!validateKey(enteredKey)) {
                loginLoading.style.display = 'none';
                loginError.textContent = '❌ Access Key မှားနေပါသည် သို့မဟုတ် သက်တမ်းကုန်ဆုံးနေပါသည်။';
                loginError.style.display = 'block';
                accessKeyInput.focus();
                return;
            }

            // Key ကို တစ်ခါသုံးပြီးပြီလား
            if (isKeyUsed(enteredKey)) {
                loginLoading.style.display = 'none';
                loginError.textContent = '❌ ဤ Key ကို အသုံးပြုပြီးပါပြီ။ (တစ်ခါသာ အသုံးပြုနိုင်သည်)';
                loginError.style.display = 'block';
                accessKeyInput.focus();
                return;
            }

            // ✅ အားလုံးအောင်မြင်ပါက Login
            markKeyUsed(enteredKey);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);

            loginLoading.style.display = 'none';
            loginSuccess.style.display = 'block';
            loginSuccess.textContent = '✅ Login အောင်မြင်ပါသည်။ ခေတ္တစောင့်ပါ...';

            // Brief delay before redirecting to dashboard
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
    //  10. KEYBOARD SHORTCUT (Enter = Login)
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
    //  11. CONSOLE LOG
    // ================================================================
    console.log('✅ MEPT Master Hub loaded (Mobile Ready)');
    console.log('📌 8-char keys:', EIGHT_CHAR_KEYS.length, 'keys');
    console.log('📌 10-char keys:', TEN_CHAR_KEYS.length, 'keys');
    console.log('📅 8-char expiry:', EIGHT_CHAR_START, '→', EIGHT_CHAR_END);
    console.log('📅 10-char expiry:', TEN_CHAR_START, '→', TEN_CHAR_END);
    console.log('🔒 One-time use enabled');
    console.log('📱 Mobile-optimized design');

});

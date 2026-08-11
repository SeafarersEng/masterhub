document.addEventListener('DOMContentLoaded', () => {
    // ================================================================
    // 🍪 Cookie Helpers
    // ================================================================
    function setCookie(name, value, days = 365) {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
        return null;
    }

    // ================================================================
    // 📱 1 Key 1 Device စနစ် (Multi-Layer Storage)
    // ================================================================
    const DEVICE_ID_KEY = 'mept_device_id';
    const BOUND_KEY = 'mept_bound_key';
    const USED_KEYS_KEY = 'mept_used_keys';
    const STORAGE_VERSION = 'v2';

    // ✅ Device ID ထုတ်ယူခြင်း
    function getDeviceId() {
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
            deviceId = 'DEV-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
            setCookie(DEVICE_ID_KEY, deviceId, 365);
        }
        return deviceId;
    }

    // ✅ သုံးပြီးသား Keys စာရင်းကို ရယူခြင်း (Multi-Layer)
    function getUsedKeys() {
        // ၁။ LocalStorage ကနေ စစ်မယ်
        let data = localStorage.getItem(USED_KEYS_KEY);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (error) {
                // LocalStorage ပျက်နေရင် Cookie ကနေ ယူမယ်
            }
        }
        
        // ၂။ Cookie ကနေ စစ်မယ်
        data = getCookie(USED_KEYS_KEY);
        if (data) {
            try {
                const keys = JSON.parse(data);
                // Cookie မှာရှိရင် LocalStorage ကိုပြန်သိမ်းမယ်
                localStorage.setItem(USED_KEYS_KEY, JSON.stringify(keys));
                return keys;
            } catch (error) {
                return [];
            }
        }
        
        return [];
    }

    // ✅ သုံးပြီးသား Keys စာရင်းကို သိမ်းဆည်းခြင်း (Multi-Layer)
    function saveUsedKeys(keys) {
        const data = JSON.stringify(keys);
        localStorage.setItem(USED_KEYS_KEY, data);
        setCookie(USED_KEYS_KEY, data, 365);
    }

    // ✅ Key ကို တစ်ခါသုံးပြီးပြီလား စစ်ဆေးခြင်း
    function isKeyAlreadyUsed(key) {
        const usedKeys = getUsedKeys();
        return usedKeys.includes(key);
    }

    // ✅ Key ကို ဒီ Device မှာ သုံးခွင့်ရှိလား စစ်ဆေးခြင်း
    function isKeyValidForThisDevice(key) {
        if (!isKeyAlreadyUsed(key)) {
            return false;
        }

        // ၁။ LocalStorage ကနေ စစ်မယ်
        let boundData = localStorage.getItem(BOUND_KEY);
        if (boundData) {
            try {
                const { key: boundKey, deviceId: boundDeviceId } = JSON.parse(boundData);
                const currentDeviceId = getDeviceId();
                if (boundKey === key && boundDeviceId === currentDeviceId) {
                    return true;
                }
            } catch (error) {
                localStorage.removeItem(BOUND_KEY);
            }
        }
        
        // ၂။ Cookie ကနေ စစ်မယ်
        boundData = getCookie(BOUND_KEY);
        if (boundData) {
            try {
                const { key: boundKey, deviceId: boundDeviceId } = JSON.parse(boundData);
                const currentDeviceId = getDeviceId();
                if (boundKey === key && boundDeviceId === currentDeviceId) {
                    // Cookie မှာရှိရင် LocalStorage ကိုပြန်သိမ်းမယ်
                    localStorage.setItem(BOUND_KEY, boundData);
                    return true;
                }
            } catch (error) {
                // Cookie မှားနေရင် ဖျက်မယ်
                document.cookie = `${BOUND_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
        }
        
        return false;
    }

    // ✅ Key ကို Device နဲ့ ချိတ်ဆက်သိမ်းဆည်းခြင်း (Multi-Layer)
    function bindKeyToDevice(key) {
        const deviceId = getDeviceId();
        const data = JSON.stringify({ key, deviceId, version: STORAGE_VERSION });
        
        // LocalStorage နဲ့ Cookie မှာ သိမ်းမယ်
        localStorage.setItem(BOUND_KEY, data);
        setCookie(BOUND_KEY, data, 365);
        
        // သုံးပြီးသား Keys စာရင်းထဲ ထည့်မယ်
        const usedKeys = getUsedKeys();
        if (!usedKeys.includes(key)) {
            usedKeys.push(key);
            saveUsedKeys(usedKeys);
        }
    }

    // ✅ Key ကို သုံးခွင့်ရှိမရှိ စစ်ဆေးခြင်း
    function isKeyAllowed(key) {
        if (isKeyAlreadyUsed(key)) {
            return isKeyValidForThisDevice(key);
        }
        return true;
    }

    // ================================================================
    // 🧹 LocalStorage ဖျက်ခံရရင် ပြန်ပြင်ပေးမယ့် System
    // ================================================================
    function restoreFromCookie() {
        // Cookie မှာ Data ရှိရင် LocalStorage ကိုပြန်သိမ်းမယ်
        const boundData = getCookie(BOUND_KEY);
        if (boundData) {
            localStorage.setItem(BOUND_KEY, boundData);
        }
        
        const usedKeysData = getCookie(USED_KEYS_KEY);
        if (usedKeysData) {
            localStorage.setItem(USED_KEYS_KEY, usedKeysData);
        }
        
        const deviceId = getCookie(DEVICE_ID_KEY);
        if (deviceId) {
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
    }

    // Page Load လုပ်တဲ့အခါ Cookie ကနေ Restore လုပ်မယ်
    restoreFromCookie();

    // ================================================================
    // 🔐 Login လုပ်ငန်းစဉ်
    // ================================================================
    // ... (ကျန်တဲ့ Code ကို ဆက်ထည့်ပါ)
    
    // ================================================================
    // 🧹 Admin Functions
    // ================================================================
    window.getStorageStatus = function() {
        return {
            localStorage: {
                boundKey: localStorage.getItem(BOUND_KEY),
                usedKeys: localStorage.getItem(USED_KEYS_KEY),
                deviceId: localStorage.getItem(DEVICE_ID_KEY)
            },
            cookie: {
                boundKey: getCookie(BOUND_KEY),
                usedKeys: getCookie(USED_KEYS_KEY),
                deviceId: getCookie(DEVICE_ID_KEY)
            },
            usedKeysList: getUsedKeys()
        };
    };
});

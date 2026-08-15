import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6nPiUiYXIC9_l1sQqOkahqOKrg4p94WI",
  authDomain: "meptdata.firebaseapp.com",
  databaseURL: "https://meptdata-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "meptdata",
  storageBucket: "meptdata.firebasestorage.app",
  messagingSenderId: "53727502426",
  appId: "1:53727502426:web:4621ef87134da86d9ef863",
  measurementId: "G-H9PTQN33F4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginContainer = document.getElementById("login-container");
const mainContainer = document.getElementById("main-container");
const logoutBtn = document.getElementById("logoutBtn");
const loginError = document.getElementById("loginError");
const welcomeUser = document.getElementById("welcomeUser");

const DEVICE_ID_KEY = "mept_device_installation_id";
const SESSION_KEY = "mept_session";

const deviceId = getOrCreateDeviceId();
let firebaseUser = null;

function getOrCreateDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    const randomPart = crypto.randomUUID ? crypto.randomUUID() : (
      Math.random().toString(36).slice(2) + Date.now().toString(36)
    );
    id = "DEV-" + randomPart;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function showError(message) {
  loginError.textContent = message;
  loginError.style.display = "block";
}

function clearError() {
  loginError.textContent = "";
  loginError.style.display = "none";
}

function showMainDashboard(username) {
  loginContainer.classList.add("hidden");
  mainContainer.classList.remove("hidden");
  welcomeUser.textContent = username ? `Logged in as: ${username}` : "";
}

function showLoginForm() {
  mainContainer.classList.add("hidden");
  loginContainer.classList.remove("hidden");
  clearError();
}

function saveSession(keyHash, username) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    keyHash,
    username,
    uid: firebaseUser.uid,
    deviceId
  }));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

async function claimKey(key, username) {
  if (!firebaseUser) throw new Error("AUTH_NOT_READY");

  const normalizedKey = key.trim().toLowerCase();

  if (![8, 11].includes(normalizedKey.length)) {
    return { ok: false, message: "❌ Key format မှားနေပါသည်။" };
  }

  const keyHash = await sha256(normalizedKey);
  const keyRef = ref(db, `keys/${keyHash}`);

  // First read the exact key record.
  // We do NOT read /keys, so the whole key database is not listed.
  let snapshot;
  try {
    snapshot = await get(keyRef);
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      message: error.code === "PERMISSION_DENIED"
        ? "❌ Firebase permission denied. Realtime Database Rules ကို စစ်ပါ။"
        : "❌ Server connection error ဖြစ်နေပါသည်။"
    };
  }

  if (!snapshot.exists()) {
    return { ok: false, message: "❌ Key မှားနေပါသည် သို့မဟုတ် မရှိပါ။" };
  }

  const current = snapshot.val();

  if (current.expiresAt && todayUTC() > current.expiresAt) {
    return { ok: false, message: "❌ ဤ Key ၏ သက်တမ်းကုန်ဆုံးနေပါပြီ။" };
  }

  // Already bound: only the same Firebase UID + same browser installation can enter.
  if (current.status === "locked") {
    if (current.uid === firebaseUser.uid && current.deviceId === deviceId) {
      saveSession(keyHash, current.username || username);
      return { ok: true };
    }

    return {
      ok: false,
      message: "❌ ဤ Key သည် အခြား Device တစ်ခုနှင့် ချိတ်ထားပြီးဖြစ်ပါသည်။"
    };
  }

  if (current.status !== "available") {
    return { ok: false, message: "❌ Key ကို အသုံးပြု၍ မရပါ။" };
  }

  // Atomically claim an available key. If two devices try at the same time,
  // Firebase will retry the transaction and only one can win.
  let transactionResult;
  try {
    transactionResult = await runTransaction(keyRef, currentData => {
      if (!currentData) return;

      const today = todayUTC();

      if (currentData.status !== "available") {
        return; // another device already claimed it
      }

      if (currentData.expiresAt && today > currentData.expiresAt) {
        return;
      }

      return {
        ...currentData,
        status: "locked",
        uid: firebaseUser.uid,
        deviceId,
        username,
        activatedAt: new Date().toISOString()
      };
    });
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      message: error.code === "PERMISSION_DENIED"
        ? "❌ Key binding ကို Firebase Rules က ခွင့်မပြုပါ။ Rules ကို စစ်ပါ။"
        : "❌ Key binding ပြုလုပ်ရာတွင် server error ဖြစ်နေပါသည်။"
    };
  }

  if (!transactionResult.committed) {
    return {
      ok: false,
      message: "❌ ဒီ Key ကို အခြား Device တစ်ခုက အရင် Activate လုပ်သွားပါပြီ။"
    };
  }

  saveSession(keyHash, username);
  return { ok: true };
}

async function restoreSession() {
  const session = getSession();
  if (!session || !firebaseUser) return false;

  // Session must belong to the current Firebase anonymous UID and installation.
  if (session.uid !== firebaseUser.uid || session.deviceId !== deviceId) {
    localStorage.removeItem(SESSION_KEY);
    return false;
  }

  try {
    const keyRef = ref(db, `keys/${session.keyHash}`);
    const snapshot = await get(keyRef);
    if (!snapshot.exists()) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }

    const data = snapshot.val();
    const valid =
      data.status === "locked" &&
      data.uid === firebaseUser.uid &&
      data.deviceId === deviceId &&
      (!data.expiresAt || todayUTC() <= data.expiresAt);

    if (!valid) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }

    showMainDashboard(session.username);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  clearError();

  const username = usernameInput.value.trim();
  const key = passwordInput.value.trim();

  if (!username) {
    showError("❌ ကျေးဇူးပြု၍ Username ထည့်ပါ။");
    return;
  }

  if (!key) {
    showError("❌ ကျေးဇူးပြု၍ Key ထည့်ပါ။");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Checking...";

  try {
    if (!firebaseUser) {
      await signInAnonymously(auth);
    }

    const result = await claimKey(key, username);

    if (!result.ok) {
      showError(result.message);
      return;
    }

    clearError();
    showMainDashboard(username);
  } catch (error) {
    console.error(error);
    showError("❌ Login မအောင်မြင်ပါ။ Firebase Authentication/Database setting ကို စစ်ပါ။");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login ဝင်မည်";
  }
});

logoutBtn.addEventListener("click", async () => {
  // IMPORTANT: Logout does NOT release the key.
  // The key remains bound to this device until an admin resets it.
  localStorage.removeItem(SESSION_KEY);
  showLoginForm();
});

onAuthStateChanged(auth, async user => {
  firebaseUser = user;

  if (user) {
    const restored = await restoreSession();
    if (!restored) showLoginForm();
  }
});

// Start Anonymous Auth automatically.
signInAnonymously(auth).catch(error => {
  console.error("Anonymous Auth error:", error);
  showError("❌ Firebase Anonymous Authentication မဖွင့်ရသေးပါ။");
});

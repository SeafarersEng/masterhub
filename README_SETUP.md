# MEPT Master Hub — Firebase Realtime Database

## 1. Firebase Authentication
Firebase Console → Authentication → Sign-in method → Anonymous → Enable.

## 2. Realtime Database
Your database URL:
https://meptdata-default-rtdb.asia-southeast1.firebasedatabase.app

Create/keep the Realtime Database.

## 3. Import the keys
Realtime Database → Data → ⋮ → Import JSON → select `seed-keys.json`.

The 60 keys are stored as SHA-256 hashes. The plaintext keys are not stored in this JSON.

## 4. Security Rules
Realtime Database → Rules → replace with `firebase-rules.json` → Publish. These client rules allow only the initial one-time claim of an available key; a normal user cannot reset/release a locked key.

IMPORTANT: This ruleset expects an `admins` node. For the normal login flow, no admin node is required. Admin reset is intentionally NOT exposed to normal users in this version.

## 5. GitHub Pages
Replace your current `index.html`, `index.css`, and `index.js` with the files in this folder.
Keep:
- learning.html
- mocktest.html
- picturespeaking.html
- oldquestions.html

## 6. Key validity
8-character keys expire on 2027-02-02.
11-character keys expire on 2027-05-02.

## 7. Important security limitation
A pure browser/GitHub Pages app cannot create a hardware-level immutable device ID. This version binds the key to:
- Firebase Anonymous Auth UID
- a browser installation ID stored locally

Clearing browser/site storage can create a new installation identity. For stronger anti-sharing protection, add Firebase App Check and a trusted backend/Cloud Function. Cloud Functions that require billing should be considered separately.

## 8. Test
1. On Device A, login with one key.
2. On Device B, use the same key.
3. Device B should be rejected.
4. Device A should be allowed to return.
5. Logout does NOT release the key.

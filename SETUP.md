# Firebase Setup Guide for Buy Gold Cal

This guide walks you through setting up Firebase (free tier) for authentication and history storage.
Follow each step carefully. Total time: about 10–15 minutes.

---

## Step 1 — Create a Firebase Project

1. Open https://firebase.google.com in your browser.
2. Click **Get started** (sign in with your Google account if asked).
3. Click **Add project** (or **Create a project**).
4. Enter a project name — e.g. `buy-gold-cal`. Click **Continue**.
5. On the "Google Analytics" page, you can **disable** Analytics (we don't need it). Click **Continue** then **Create project**.
6. Wait a few seconds, then click **Continue**.

You're now in the Firebase Console for your project.

---

## Step 2 — Enable Authentication

1. In the left sidebar, click **Build → Authentication**.
2. Click **Get started**.
3. You'll see a list of "Sign-in providers". Enable these three one at a time:

### 2a. Google
- Click **Google** in the list.
- Toggle **Enable** on.
- Pick a **Project support email** from the dropdown (your Google email).
- Click **Save**.

### 2b. Email/Password
- Click **Email/Password** in the list.
- Toggle the first option (Email/Password) **on**.
- Leave the second option (Email link) off.
- Click **Save**.

### 2c. Phone
- Click **Phone** in the list.
- Toggle **Enable** on.
- Click **Save**.
- Firebase's free tier (Spark plan) includes a small daily SMS quota — fine for testing. If you need more, you'll be prompted to upgrade.

### 2d. Add Authorized Domains
- Still on the Authentication page, click the **Settings** tab at the top.
- Scroll to **Authorized domains**.
- Make sure `localhost` is listed (it usually is by default).
- If you plan to host this app online (e.g. Firebase Hosting, Netlify, GitHub Pages), add that domain too. You can come back later for this.

---

## Step 3 — Create the Firestore Database

1. In the left sidebar, click **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Start in production mode** (we'll add custom rules in a moment). Click **Next**.
4. Pick a location closest to you (e.g. `asia-southeast1` for Southeast Asia). **This cannot be changed later.** Click **Enable**.
5. Wait for it to finish provisioning.

### Add Security Rules

After it's created, you'll see the data viewer. Click the **Rules** tab.

Replace the existing rules with this and click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read and write their OWN calculations
    match /users/{userId}/calculations/{calcId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

These rules ensure that signed-in users can only see and modify their own data, not anyone else's.

---

## Step 4 — Get Your Firebase Config

1. In the Firebase Console, click the **gear icon** ⚙️ next to **Project Overview** (top-left), then click **Project settings**.
2. Scroll down to **Your apps**.
3. If there are no apps yet, click the **`</>`** (web) icon to register a new web app.
   - Give it a nickname like `buy-gold-cal-web`.
   - **Do NOT check** "Also set up Firebase Hosting" (we'll do that later if needed).
   - Click **Register app**.
4. Firebase will show you a code block that includes a `firebaseConfig` object. It looks like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...........",
  authDomain: "buy-gold-cal.firebaseapp.com",
  projectId: "buy-gold-cal",
  storageBucket: "buy-gold-cal.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
```

5. **Copy the entire `firebaseConfig` object** (the part between the curly braces, including values).

---

## Step 5 — Paste Your Config into the App

1. Open the file `firebase-config.js` in this folder.
2. Find the section that looks like this:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. **Replace** each placeholder with the value from your copied `firebaseConfig`. Save the file.

---

## Step 6 — Test It

1. Open `index.html` in your browser (or `signin.html` directly).
2. Try signing in with Google — a popup should appear.
3. After signing in, the top nav should show your avatar.
4. Make a calculation, click "Save Invoice" → "Save to History".
5. Click the profile icon → go to **History** to see your saved calculation.

---

## Troubleshooting

**"auth/unauthorized-domain" error**
→ Your current domain isn't in the Authorized Domains list. Add it in Authentication → Settings → Authorized domains.

**"Missing or insufficient permissions" error in console**
→ Your Firestore security rules aren't set correctly. Re-check Step 3.

**Phone OTP doesn't arrive**
→ Make sure the phone number is in E.164 format (e.g. `+9591234567`, with the `+` and country code).
→ Make sure Phone provider is enabled.
→ Free tier has a small daily quota — try again after a while if you've tested many times.

**Popup blocked when signing in with Google**
→ Allow popups for this site in your browser settings.

**"Firebase: No Firebase App '[DEFAULT]' has been created" error**
→ You forgot to fill in the `firebaseConfig` placeholders in `firebase-config.js`.

---

## What's stored where?

- **Authentication users** → Firebase Console → Authentication → Users tab
- **Saved calculations** → Firestore Database → `users/{your-uid}/calculations/{auto-id}`
  Each document has: `itemName, itemType, goldPurity, weightK, weightP, weightY, lossWeightK, lossWeightP, lossWeightY, craftingFee, itemCost, timestamp` (plus gem/diamond fields when applicable).

---

That's it. The app is now connected to your Firebase project.

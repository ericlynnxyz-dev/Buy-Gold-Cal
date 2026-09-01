// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
// 1. Follow SETUP.md to create your Firebase project.
// 2. Replace the placeholder values below with your real config.
// 3. Save this file.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// >>>>>>>>>>>>>>>> PASTE YOUR CONFIG VALUES HERE <<<<<<<<<<<<<<<<
const firebaseConfig = {
  apiKey:            "AIzaSyBy9CKh0P3raIyBToLpFS2e2gNoPLi28EI",
  authDomain:        "buygoldcal.firebaseapp.com",
  projectId:         "buygoldcal",
  storageBucket:     "buygoldcal.firebasestorage.app",
  messagingSenderId: "1045934902978",
  appId:             "1:1045934902978:web:785a38ffe3f4ef4719755b"
};
// >>>>>>>>>>>>>>>> END CONFIG <<<<<<<<<<<<<<<<

const app = initializeApp(firebaseConfig);

export const auth           = getAuth(app);
export const db             = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Expose for non-module scripts (e.g. existing app.js)
window.fbAuth = auth;
window.fbDb   = db;
window.fbGoogleProvider = googleProvider;

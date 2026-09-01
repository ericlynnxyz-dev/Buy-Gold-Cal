// ============================================================
// AUTH + FIRESTORE UTILITIES
// Shared helpers for signin/profile/history pages + index.html.
// ============================================================

import { auth, db, googleProvider } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut as fbSignOut,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---------- Auth state ----------
export function onAuthStateChange(cb) { return onAuthStateChanged(auth, cb); }
export function getCurrentUser()      { return auth.currentUser; }

// ---------- Sign-in methods ----------
export async function signInWithGoogle()      { return signInWithPopup(auth, googleProvider); }
export async function signInWithEmail(e, p)   { return signInWithEmailAndPassword(auth, e, p); }
export async function createAccount(e, p)     { return createUserWithEmailAndPassword(auth, e, p); }

export function makeRecaptcha(containerId) {
  return new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
}
export async function sendPhoneOTP(phoneNumber, recaptcha) {
  return signInWithPhoneNumber(auth, phoneNumber, recaptcha);
}

// ---------- Sign out ----------
export async function signOutUser() { return fbSignOut(auth); }

// ---------- Update display name (saved to the account) ----------
export async function updateDisplayName(name) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  await updateProfile(user, { displayName: name });
  return user;
}

// ---------- Firestore: calculations ----------
function userCalcCollection() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  return collection(db, 'users', user.uid, 'calculations');
}

export async function saveCalculation(data) {
  return addDoc(userCalcCollection(), { ...data, timestamp: serverTimestamp() });
}

export async function getCalculations() {
  const q = query(userCalcCollection(), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteCalculation(id) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  return deleteDoc(doc(db, 'users', user.uid, 'calculations', id));
}

// Update an existing saved calculation (keeps its original timestamp/position)
export async function updateCalculation(id, data) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  return updateDoc(doc(db, 'users', user.uid, 'calculations', id), data);
}

// ---------- Pending calculation (handed off via sessionStorage) ----------
export function setPendingCalculation(data) {
  try { sessionStorage.setItem('pendingCalculation', JSON.stringify(data)); } catch (e) {}
}
export function getPendingCalculation() {
  try { const raw = sessionStorage.getItem('pendingCalculation'); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
export function clearPendingCalculation() {
  try { sessionStorage.removeItem('pendingCalculation'); } catch (e) {}
}
export async function savePendingCalculationIfAny() {
  const pending = getPendingCalculation();
  if (!pending) return false;
  await saveCalculation(pending);
  clearPendingCalculation();
  return true;
}

// ---------- Theme bootstrap (apply saved theme on any page) ----------
export function applySavedTheme() {
  try {
    const t = localStorage.getItem('goldCalcTheme');
    document.body.classList.add(t === 'dark' ? 'theme-dark' : 'theme-light');
  } catch (e) {
    document.body.classList.add('theme-light');
  }
}

// ---------- User display helpers ----------
export function userDisplayName(user) {
  if (!user) return '';
  if (user.displayName) return user.displayName;
  if (user.email) return user.email.split('@')[0];
  if (user.phoneNumber) return user.phoneNumber;
  return 'User';
}
export function userInitials(user) {
  const name = userDisplayName(user);
  return (name.trim()[0] || 'U').toUpperCase();
}
export function userAvatarUrl(user) {
  return (user && user.photoURL) || null;
}

// ---------- Expose to non-module scripts (app.js) ----------
window.authUtils = {
  onAuthStateChange,
  getCurrentUser,
  signOutUser,
  saveCalculation,
  updateCalculation,
  getCalculations,
  setPendingCalculation,
  userDisplayName,
  userInitials,
  userAvatarUrl
};

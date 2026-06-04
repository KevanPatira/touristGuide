// constants/firebaseConfig.js — Firebase is ONLY for real-time chat/presence
// Authentication is handled by MongoDB + JWT (see AuthContext.js)
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════
// Firebase project credentials — ONLY needed for real-time features
// (chat message delivery, typing indicators, presence)
//
// To configure: Go to https://console.firebase.google.com →
// Your Project → Project Settings → General → Your apps →
// Web app → Config
// ═══════════════════════════════════════════════════════════
// Retrieve environment variables
const {
  EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID,
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
} = process.env;

// Validate that required Firebase variables are present
if (!EXPO_PUBLIC_FIREBASE_API_KEY || !EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
  console.warn('⚠️ Missing Firebase environment variables. Please check your root .env file.');
}

const firebaseConfig = {
  apiKey: EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: EXPO_PUBLIC_FIREBASE_APP_ID,
  ...(EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID && { measurementId: EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID })
};

// Initialize Firebase (only if credentials are provided)
let app = null;
let db = null;
let firebaseEnabled = false;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    firebaseEnabled = true;
    console.log('✅ Firebase initialized (real-time chat enabled)');
  } catch (e) {
    console.warn('⚠️ Firebase initialization failed:', e.message);
  }
} else {
  console.log('ℹ️ Firebase not configured — chat will use MongoDB polling fallback');
}

export { app, db, firebaseEnabled };

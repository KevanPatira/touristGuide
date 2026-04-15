// constants/firebaseConfig.js
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════
// TODO: Replace these with your actual Firebase project config
// Go to https://console.firebase.google.com → Your Project →
// Project Settings → General → Your apps → Web app → Config
// ═══════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyAJmqss-Vvu9zS_7P3WvO04W35oApVm3KU",
  authDomain: "touristguide-20.firebaseapp.com",
  projectId: "touristguide-20",
  storageBucket: "touristguide-20.firebasestorage.app",
  messagingSenderId: "1079908798128",
  appId: "1:1079908798128:web:953b848d79540f30233575",
};

// Initialize Firebase (prevent re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth with persistent session via AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };

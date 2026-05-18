// src/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseEnvKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingFirebaseEnvKeys = requiredFirebaseEnvKeys.filter(
  (key) => !import.meta.env[key]
);

if (missingFirebaseEnvKeys.length > 0 && import.meta.env.DEV) {
  console.warn(
    'Missing Firebase environment variables:',
    missingFirebaseEnvKeys.join(', ')
  );
}

// Prevent duplicate Firebase initialization during development/HMR
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let analyticsInstance = null;

export const getFirebaseAnalytics = async () => {
  if (analyticsInstance) {
    return analyticsInstance;
  }

  try {
    const supported = await isSupported();

    if (!supported || !firebaseConfig.measurementId) {
      return null;
    }

    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Firebase Analytics is not available:', error);
    }

    return null;
  }
};

export default app;
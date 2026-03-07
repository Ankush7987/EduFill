// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage"; // NAYA: Storage import kiya documents ke liye

const firebaseConfig = {
  apiKey: "AIzaSyBcf--uUz5Z45KNq-8RmsKeqbHwlgbmmwk",
  authDomain: "edufill-2bbb7.firebaseapp.com",
  projectId: "edufill-2bbb7",
  storageBucket: "edufill-2bbb7.firebasestorage.app",
  messagingSenderId: "72538373970",
  appId: "1:72538373970:web:ae616cd8e3dffd0743048b",
  measurementId: "G-FZL101R8X9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// Initialize Firestore aur export karein (Data ke liye)
export const db = getFirestore(app);

// Initialize Storage aur export karein (Photos aur PDFs save karne ke liye)
export const storage = getStorage(app);
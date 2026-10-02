// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDvFOGEdOj47IwFPR0BRg5W_qudC5GNOwU",
  authDomain: "musamia-bill-management.firebaseapp.com",
  projectId: "musamia-bill-management",
  storageBucket: "musamia-bill-management.firebasestorage.app",
  messagingSenderId: "177984210561",
  appId: "1:177984210561:web:671f93c0869ccdf9c0af80",
  measurementId: "G-VWCYBZP3C0"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Ekhane auth ebong db duitai export korte hobe
export const auth = getAuth(app);
export const db = getFirestore(app);

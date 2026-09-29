// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDvFOGEdOj47IwFPR0BRg5W_qudC5GNOwU",
  authDomain: "musamia-bill-management.firebaseapp.com",
  projectId: "musamia-bill-management",
  storageBucket: "musamia-bill-management.firebasestorage.app",
  messagingSenderId: "177984210561",
  appId: "1:177984210561:web:671f93c0869ccdf9c0af80",
  measurementId: "G-VWCYBZP3C0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Authentication export
export const auth = getAuth(app);

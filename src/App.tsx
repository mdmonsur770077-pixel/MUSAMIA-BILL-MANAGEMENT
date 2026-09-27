import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import YearlyMonthlyDashboard from './components/YearlyMonthlyDashboard';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDvFOGEdOj47IwFPR0BrG5W_qudC5GNoWU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "musamia-bill-management.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "musamia-bill-management",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "musamia-bill-management.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "177984210561",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:177984210561:web:671f93c0869ccdf9c0af80"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('লগইন ব্যর্থ হয়েছে! সঠিক ইমেইল ও পাসওয়ার্ড দিন।');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050814] text-white flex items-center justify-center">
        লোড হচ্ছে...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050814] text-[#e6f1ff] flex items-center justify-center p-4">
        <div className="bg-[#0b1329] p-8 rounded-2xl shadow-2xl border border-[#1e293b] w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-cyan-400">লগইন করুন (Monsur Labor Portal)</h2>
          {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-slate-300">ইমেইল এড্রেস</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#050814] border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-cyan-400"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">পাসওয়ার্ড</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#050814] border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-cyan-400"
                placeholder="********"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold p-3 rounded transition duration-200"
            >
              প্রবেশ করুন
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] text-[#e6f1ff]">
      <div className="flex justify-end p-4 bg-[#0b1329] border-b border-slate-800">
        <button 
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          লগআউট
        </button>
      </div>
      <YearlyMonthlyDashboard />
    </div>
  );
}

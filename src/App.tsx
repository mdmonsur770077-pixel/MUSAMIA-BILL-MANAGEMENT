import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDvFOGEdOj47IwFPR0BRg5W_qudC5GNOwU",
  authDomain: "musamia-bill-management.firebaseapp.com",
  projectId: "musamia-bill-management",
  storageBucket: "musamia-bill-management.firebasestorage.app",
  messagingSenderId: "177984210561",
  appId: "1:177984210561:web:671f93c0869ccdf9c0af80",
  measurementId: "G-7T806FR894"
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

  // State gulo ekhane add kore nite paren jehutu apnar app e lagbe (jemon labor list, form data, etc.)
  // const [laborList, setLaborList] = useState([]);

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
      console.error("Firebase Login Error:", err);
      setError('লগইন ব্যর্থ হয়েছে: ' + err.message);
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
      <div className="min-h-screen bg-[#050814] text-white flex items-center justify-center text-xl">
        লোড হচ্ছে...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050814] text-[#e6f1ff] flex items-center justify-center p-4">
        <div className="bg-[#0b1329] p-8 rounded-2xl shadow-2xl border border-[#1e293b] w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-cyan-400">লগইন করুন (Monsur Portal)</h2>
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

  // Jodi user login thake, tahole nicher main dashboard / portal screen show korbe
  return (
    <div className="min-h-screen bg-[#050814] text-[#e6f1ff] p-6">
      <div className="flex justify-between items-center mb-6 bg-[#0b1329] p-4 rounded-xl border border-slate-800">
        <h1 className="text-xl font-bold text-cyan-400">লেবার বিল ম্যানেজমেন্ট সিস্টেম</h1>
        <button 
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          লগআউট
        </button>
      </div>

      {/* APNAR MAIN PORTAL CODE / COMPONENTS EKANE BOSABEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#0b1329] p-5 rounded-xl border border-slate-800">
          <h3 className="text-slate-400 text-sm">মোট লেবার</h3>
          <p className="text-2xl font-bold text-cyan-400 mt-1">০ জন</p>
        </div>
        <div className="bg-[#0b1329] p-5 rounded-xl border border-slate-800">
          <h3 className="text-slate-400 text-sm">আজকের বিল</h3>
          <p className="text-2xl font-bold text-green-400 mt-1">৳ ০.০০</p>
        </div>
        <div className="bg-[#0b1329] p-5 rounded-xl border border-slate-800">
          <h3 className="text-slate-400 text-sm">বাকি পরিমাণ</h3>
          <p className="text-2xl font-bold text-amber-400 mt-1">৳ ০.০০</p>
        </div>
      </div>

      <div className="bg-[#0b1329] p-6 rounded-xl border border-slate-800">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">লেবার তালিকা ও এন্ট্রি ফর্ম</h2>
        <p className="text-slate-400">Apnar ager project er table, form ba baki code gulo ekhane bosie nite paren.</p>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ফায়ারবেস কনফিগারেশন (আপনার প্রজেক্টের তথ্য অনুযায়ী)
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
const auth = getAuth(app);
export const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState<any>(null);
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
    try {
      setError('');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('লগইন ব্যর্থ হয়েছে! সঠিক ইমেল ও পাসওয়ার্ড দিন।');
    }
  };

  if (loading) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '20vh' }}>লোড হচ্ছে...</div>;
  }

  // যদি ইউজার লগইন করা না থাকে, তবে লগইন পেজ দেখাবে
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#050814', color: '#fff' }}>
        <form onSubmit={handleLogin} style={{ background: '#0f172a', padding: '30px', borderRadius: '10px', width: '350px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>লেবার পোর্টাল লগইন</h2>
          {error && <p style={{ color: '#ff4d4d', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>ইমেল</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>পাসওয়ার্ড</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #334155', background: '#1e293b', color: '#fff' }}
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#00f2fe', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            লগইন করুন
          </button>
        </form>
      </div>
    );
  }

  // সফলভাবে লগইন হলে আপনার মূল ড্যাশবোর্ড বা সাইটের বাকি অংশ দেখাবে
  return (
    <div>
      {/* আপনার আসল ড্যাশবোর্ডের কোড এখানে থাকবে */}
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
        <button onClick={() => signOut(auth)} style={{ padding: '8px 15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          লগআউট
        </button>
      </div>
      
      {/* মূল অ্যাপ কম্পোনেন্ট */}
    </div>
  );
}

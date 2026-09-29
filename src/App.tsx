import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import * as THREE from 'three';

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

interface Worker {
  id: number;
  name: string;
  trade: string;
  phone: string;
  dailyWage: number;
}

interface RecordEntry {
  id: number;
  workerId: number;
  date: string;
  days: number;
  paid: number;
  advance: number;
  notes: string;
}

const BANGLA_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // লেবার এবং রেকর্ড স্টেট
  const [workers, setWorkers] = useState<Worker[]>([
    { id: 1, name: 'রহিম মিয়া', trade: 'মেকানিক / রাজমিস্ত্রি', phone: '01711223344', dailyWage: 600 },
    { id: 2, name: 'করিম শেখ', trade: 'যোগালি / হেল্পার', phone: '01822334455', dailyWage: 450 }
  ]);

  const [records, setRecords] = useState<RecordEntry[]>([
    { id: 101, workerId: 1, date: '2026-09-01', days: 1, paid: 500, advance: 0, notes: 'নিয়মিত হাজিরা' },
    { id: 102, workerId: 2, date: '2026-09-01', days: 1, paid: 400, advance: 50, notes: 'জরুরি অগ্রিম' }
  ]);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // ফর্ম স্টেট
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerTrade, setNewWorkerTrade] = useState('রাজমিস্ত্রি');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerWage, setNewWorkerWage] = useState(500);

  const [entryWorkerId, setEntryWorkerId] = useState<number>(1);
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [entryDays, setEntryDays] = useState<number>(1);
  const [entryPaid, setEntryPaid] = useState<number>(0);
  const [entryAdvance, setEntryAdvance] = useState<number>(0);
  const [entryRemarks, setEntryRemarks] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'due' | 'claim' | 'settled'>('all');
  const [activeModalWorker, setActiveModalWorker] = useState<any>(null);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Three.js ব্যাকগ্রাউন্ড অ্যানিমেশন ইফেক্ট (লগইন বা ড্যাশবোর্ড উভয়ের জন্য)
  useEffect(() => {
    const container = document.getElementById('three-bg');
    if (!container) return;
    container.innerHTML = '';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(2, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00f2fe, wireframe: true, transparent: true, opacity: 0.15 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    camera.position.z = 5;

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      sphere.rotation.x += 0.001;
      sphere.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement) renderer.dispose();
    };
  }, [user]);

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

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;

    const newWorker: Worker = {
      id: Date.now(),
      name: newWorkerName,
      trade: newWorkerTrade,
      phone: newWorkerPhone || 'প্রযোজ্য নয়',
      dailyWage: Number(newWorkerWage)
    };

    setWorkers([...workers, newWorker]);
    setNewWorkerName('');
    setNewWorkerPhone('');
    alert('নতুন শ্রমিক সফলভাবে যুক্ত করা হয়েছে!');
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: RecordEntry = {
      id: Date.now(),
      workerId: Number(entryWorkerId),
      date: entryDate,
      days: Number(entryDays),
      paid: Number(entryPaid),
      advance: Number(entryAdvance),
      notes: entryRemarks
    };

    setRecords([...records, newRecord]);
    setEntryPaid(0);
    setEntryAdvance(0);
    setEntryRemarks('');
    alert('হাজিরা ও লেনদেন সফলভাবে সংরক্ষণ করা হয়েছে!');
  };

  const handleDeleteWorker = (workerId: number) => {
    if (window.confirm('আপনি কি নিশ্চিতভাবে এই শ্রমিককে মুছে ফেলতে চান?')) {
      setWorkers(workers.filter(w => w.id !== workerId));
      setRecords(records.filter(r => r.workerId !== workerId));
    }
  };

  const workerSummaries = useMemo(() => {
    return workers.map(worker => {
      const workerRecords = records.filter(r => {
        const rDate = new Date(r.date);
        return r.workerId === worker.id && 
               rDate.getMonth() + 1 === selectedMonth && 
               rDate.getFullYear() === selectedYear;
      });

      const totalDays = workerRecords.reduce((sum, r) => sum + r.days, 0);
      const totalEarned = totalDays * worker.dailyWage;
      const totalPaidOnly = workerRecords.reduce((sum, r) => sum + r.paid, 0);
      const totalAdvanceOnly = workerRecords.reduce((sum, r) => sum + r.advance, 0);
      const totalPaidAll = totalPaidOnly + totalAdvanceOnly;
      
      const balance = totalEarned - totalPaidAll;
      let status = 'settled';
      if (balance > 0) status = 'due';
      else if (balance < 0) status = 'claim';

      return {
        worker,
        records: workerRecords,
        totalDays,
        totalEarned,
        totalPaidAll,
        balance,
        status
      };
    });
  }, [workers, records, selectedMonth, selectedYear]);

  const filteredSummaries = useMemo(() => {
    return workerSummaries.filter(item => {
      const matchesSearch = item.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.worker.trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.worker.phone.includes(searchQuery);
      
      if (filterStatus === 'all') return matchesSearch;
      return matchesSearch && item.status === filterStatus;
    });
  }, [workerSummaries, searchQuery, filterStatus]);

  const grandTotalEarned = workerSummaries.reduce((sum, i) => sum + i.totalEarned, 0);
  const grandTotalPaid = workerSummaries.reduce((sum, i) => sum + i.totalPaidAll, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center text-xl">
        লোড হচ্ছে...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen bg-[#030712] text-[#e6f1ff] flex items-center justify-center p-4">
        <div id="three-bg" className="fixed inset-0 pointer-events-none z-0" />
        <div className="relative z-10 bg-slate-900/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-cyan-500/30 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-cyan-400">লগইন করুন (Monsur Portal)</h2>
          {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-xl mb-4 text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs mb-1 text-slate-300">ইমেইল এড্রেস</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400 text-xs"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-slate-300">পাসওয়ার্ড</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/50 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-400 text-xs"
                placeholder="********"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold p-3 rounded-xl transition duration-200 text-xs cursor-pointer"
            >
              প্রবেশ করুন
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      <div id="three-bg" className="fixed inset-0 pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/60 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_30px_rgba(0,242,254,0.1)] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-black font-black text-xl">
              ML
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider text-white uppercase flex items-center gap-2">
                মনসুর লেবার পোর্টাল <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">3D Hub</span>
              </h1>
              <p className="text-xs text-slate-400">স্মার্ট লেবার কন্ট্রোল ও দৈনিক হিসাব ব্যবস্থাপনা সিস্টেম</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
            >
              {BANGLA_MONTHS.map((m, idx) => (
                <option key={idx} value={idx + 1} className="bg-slate-900 text-white">{m}</option>
              ))}
            </select>

            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
              ))}
            </select>

            <button 
              onClick={() => setShowRoadmapModal(true)}
              className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold transition cursor-pointer"
            >
              💡 রোডম্যাপ
            </button>

            <button 
              onClick={handleLogout}
              className="bg-rose-600/80 hover:bg-rose-500 text-white px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              লগআউট
            </button>
          </div>
        </header>

        {/* Top Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-slate-900/40 backdrop-blur border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">মোট শ্রমিক সংখ্যা</p>
              <h3 className="text-2xl font-bold text-cyan-400 mt-1">{workers.length} জন</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-lg">👷</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 backdrop-blur border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">এই মাসের মোট অর্জিত পাওনা</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">৳{grandTotalEarned}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg">📈</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 backdrop-blur border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">এই মাসে মোট পরিশোধ</p>
              <h3 className="text-2xl font-bold text-rose-400 mt-1">৳{grandTotalPaid}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 text-lg">💸</div>
          </div>
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Add Worker Form */}
          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur border border-white/10">
            <h3 className="text-sm font-bold text-cyan-300 mb-3 flex items-center gap-2">
              <span>➕</span> নতুন শ্রমিক নিবন্ধন করুন
            </h3>
            <form onSubmit={handleAddWorker} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">শ্রমিকের নাম</label>
                <input 
                  type="text" 
                  placeholder="যেমন: জামাল উদ্দিন" 
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  required
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">কাজের ধরণ / ট্রেড</label>
                <input 
                  type="text" 
                  placeholder="যেমন: রাজমিস্ত্রি" 
                  value={newWorkerTrade}
                  onChange={(e) => setNewWorkerTrade(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">মোবাইল নম্বর</label>
                <input 
                  type="text" 
                  placeholder="017xxxxxxxx" 
                  value={newWorkerPhone}
                  onChange={(e) => setNewWorkerPhone(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">দৈনিক মজুরি (টাকা)</label>
                <input 
                  type="number" 
                  value={newWorkerWage}
                  onChange={(e) => setNewWorkerWage(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button 
                type="submit" 
                className="col-span-1 sm:col-span-2 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl transition cursor-pointer mt-1"
              >
                শ্রমিক সংরক্ষণ করুন
              </button>
            </form>
          </div>

          {/* Add Attendance & Payment Form */}
          <div className="p-5 rounded-2xl bg-slate-900/60 backdrop-blur border border-white/10">
            <h3 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-2">
              <span>📝</span> দৈনিক হাজিরা ও লেনদেন এন্ট্রি
            </h3>
            <form onSubmit={handleAddRecord} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] text-slate-400 block mb-1">শ্রমিক নির্বাচন</label>
                <select 
                  value={entryWorkerId}
                  onChange={(e) => setEntryWorkerId(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.trade})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">তারিখ</label>
                <input 
                  type="date" 
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">হাজিরা (দিন)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  max="1" 
                  value={entryDays}
                  onChange={(e) => setEntryDays(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">পরিশোধ (টাকা)</label>
                <input 
                  type="number" 
                  value={entryPaid}
                  onChange={(e) => setEntryPaid(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">অগ্রিম (টাকা)</label>
                <input 
                  type="number" 
                  value={entryAdvance}
                  onChange={(e) => setEntryAdvance(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="col-span-2 sm:col-span-3">
                <label className="text-[11px] text-slate-400 block mb-1">মন্তব্য / নোট</label>
                <input 
                  type="text" 
                  placeholder="যেমন: সাইট এ অতিরিক্ত কাজ" 
                  value={entryRemarks}
                  onChange={(e) => setEntryRemarks(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 mb-2"
                />
                
                <div className="flex gap-1.5 flex-wrap">
                  {['সঠিক কাজ', 'অতিরিক্ত সময়', 'উচ্চ মানের ফিডব্যাক', 'জরুরি অগ্রিম প্রদান'].map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEntryRemarks(tag)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 transition cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="col-span-2 sm:col-span-3 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-xs rounded-xl transition cursor-pointer mt-1"
              >
                হাজিরা ও লেনদেন সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur border border-white/10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="🔍 শ্রমিক খুঁজুন (নাম, ট্রেড বা ফোন)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            {[
              { id: 'all', label: 'সকল শ্রমিক' },
              { id: 'due', label: 'বকেয়া পাওনা' },
              { id: 'claim', label: 'কোম্পানি দাবি' },
              { id: 'settled', label: 'পরিশোধিত' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                    : 'bg-black/40 border border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Workers List Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSummaries.map(item => (
            <div key={item.worker.id} className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur border border-white/10 hover:border-cyan-500/40 transition flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-base text-white">{item.worker.name}</h4>
                    <div className="text-xs text-cyan-400 font-medium">{item.worker.trade} • ৳{item.worker.dailyWage}/দিন</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    item.status === 'due' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' :
                    item.status === 'claim' ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' :
                    'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  }`}>
                    {item.status === 'due' ? 'বকেয়া পাওনা' : item.status === 'claim' ? 'কোম্পানি পাওনা' : 'হিসাব সমান'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-black/40 p-2.5 rounded-xl text-center my-3 border border-white/5 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">মোট দিন</div>
                    <div className="font-bold text-cyan-300">{item.totalDays}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">অর্জিত মূল্য</div>
                    <div className="font-bold text-emerald-400">৳{item.totalEarned}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">প্রদত্ত খরচ</div>
                    <div className="font-bold text-rose-400">৳{item.totalPaidAll}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <button
                  onClick={() => setActiveModalWorker(item)}
                  className="text-cyan-300 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  📋 বিস্তারিত খতিয়ান ও রশিদ
                </button>
                <button
                  onClick={() => handleDeleteWorker(item.worker.id)}
                  className="text-rose-400 hover:text-rose-300 cursor-pointer text-xs"
                >
                  মুছে ফেলুন
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Worker Details Modal */}
        {activeModalWorker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl border border-cyan-500/40 bg-[#071124] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{activeModalWorker.worker.name} - এর লেজার খতিয়ান</h3>
                  <p className="text-xs text-cyan-400">{activeModalWorker.worker.trade} | ফোন: {activeModalWorker.worker.phone}</p>
                </div>
                <button
                  onClick={() => setActiveModalWorker(null)}
                  className="text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-white/10 text-xs cursor-pointer"
                >
                  ✕ বন্ধ
                </button>
              </div>

              <div className="space-y-2 mb-6">
                <h5 className="text-xs font-bold text-slate-300">নির্বাচিত মাসের লেনদেন ইতিহাস ({BANGLA_MONTHS[selectedMonth - 1]} {selectedYear}):</h5>
                {activeModalWorker.records.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center bg-black/30 rounded-xl">এই মাসে কোনো হাজিরা বা লেনদেন এন্ট্রি করা হয়নি।</p>
                ) : (
                  activeModalWorker.records.map((r: any) => (
                    <div key={r.id} className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs flex items-center justify-between gap-2">
                      <div>
                        <span className="text-cyan-300 mr-2">{r.date}</span>
                        <span className="text-white font-semibold">হাজিরা: {r.days} দিন</span>
                        {r.notes && <div className="text-[11px] text-slate-400 mt-0.5">💬 {r.notes}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400">পরিশোধ: ৳{r.paid}</div>
                        {r.advance > 0 && <div className="text-amber-400">অগ্রিম: ৳{r.advance}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setActiveModalWorker(null)}
                  className="px-4 py-2 bg-cyan-500 text-black font-bold text-xs rounded-xl cursor-pointer"
                >
                  সম্পন্ন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Roadmap Modal */}
        {showRoadmapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 rounded-3xl border border-amber-500/40 bg-[#071124] shadow-2xl">
              <h3 className="text-base font-bold text-amber-300 mb-2">💡 নতুন ফিচারের আইডিয়া ও রোডম্যাপ</h3>
              <p className="text-xs text-slate-300 mb-4">মনসুর লেবার পোর্টাল আরও উন্নত করতে ভবিষ্যতে নিচের ফিচারগুলো যুক্ত করা যেতে পারে:</p>
              <ul className="text-xs space-y-2 text-slate-200 list-disc pl-4 mb-5">
                <li>হোয়াটসঅ্যাপে (WhatsApp) সরাসরি শ্রমিকদের দৈনিক হাজিরা ও পাওনার এসএমএস বা রিপোর্ট পাঠানো।</li>
                <li>ক্লাউড ডাটাবেজ ইন্টিগ্রেশন (Firebase Firestore) রিয়েল-টাইম সিঙ্ক আরও নিখুঁত করা।</li>
                <li>প্রজেক্ট বা সাইটভিত্তিক আলাদা সাব-অ্যাকাউন্ট ও বাজেট ট্র্যাকিং।</li>
              </ul>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowRoadmapModal(false)}
                  className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

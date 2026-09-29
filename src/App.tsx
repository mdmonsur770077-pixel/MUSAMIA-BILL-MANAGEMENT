import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDvFOGEdOj47IwFPR0BrG5W_qudC5GNoWU",
  authDomain: "musamia-bill-management.firebaseapp.com",
  projectId: "musamia-bill-management",
  storageBucket: "musamia-bill-management.appspot.com",
  messagingSenderId: "177984210561",
  appId: "1:177984210561:web:671f93c0869ccdf9c0af80"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

interface BillItem {
  id: string;
  labourName: string;
  workDescription: string;
  amount: number;
  date: string;
}

export default function App() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [labourName, setLabourName] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);

  // ফায়ারবেস থেকে হিসাব বা বিলগুলো লোড করা
  const fetchBills = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "bills"));
      const billsList: BillItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        billsList.push({
          id: docSnap.id,
          labourName: data.labourName || '',
          workDescription: data.workDescription || '',
          amount: data.amount || 0,
          date: data.date || new Date().toLocaleDateString()
        });
      });
      setBills(billsList);
    } catch (error) {
      console.error("Error fetching bills: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  // নতুন হিসাব যোগ করা
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labourName || !amount) return;

    try {
      await addDoc(collection(db, "bills"), {
        labourName,
        workDescription,
        amount: Number(amount),
        date: new Date().toLocaleDateString(),
        createdAt: Timestamp.now()
      });
      setLabourName('');
      setWorkDescription('');
      setAmount('');
      fetchBills(); // ডেটা সেভ হওয়ার পর তালিকা রিফ্রেশ করা
    } catch (error) {
      console.error("Error adding bill: ", error);
    }
  };

  // হিসাব ডিলিট করা
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "bills", id));
      fetchBills();
    } catch (error) {
      console.error("Error deleting bill: ", error);
    }
  };

  // মোট টাকার হিসাব
  const totalAmount = bills.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="min-h-screen bg-[#050814] text-[#e6f1ff] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* হেডার */}
        <div className="flex justify-between items-center mb-6 bg-[#0b1329] p-4 rounded-xl border border-slate-800">
          <h1 className="text-xl font-bold text-cyan-400">লেবার বিল ম্যানেজমেন্ট সিস্টেম</h1>
          <div className="text-sm bg-cyan-950 text-cyan-300 px-3 py-1.5 rounded-lg border border-cyan-800">
            মোট বিল: <span className="font-bold text-white">৳ {totalAmount}</span>
          </div>
        </div>

        {/* ফর্ম */}
        <div className="bg-[#0b1329] p-6 rounded-xl border border-slate-800 mb-8 shadow-lg">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4">নতুন হিসাব বা বিল যোগ করুন</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1 text-slate-300">লেবারের নাম</label>
              <input 
                type="text" 
                value={labourName} 
                onChange={(e) => setLabourName(e.target.value)}
                required
                className="w-full bg-[#050814] border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-cyan-400"
                placeholder="নাম লিখুন"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">কাজের বিবরণ</label>
              <input 
                type="text" 
                value={workDescription} 
                onChange={(e) => setWorkDescription(e.target.value)}
                className="w-full bg-[#050814] border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-cyan-400"
                placeholder="কাজের বিবরণ"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">টাকার পরিমাণ</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-[#050814] border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-cyan-400"
                placeholder="৳ পরিমাণ"
              />
            </div>
            <div className="md:col-span-3">
              <button 
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold p-2.5 rounded transition duration-200"
              >
                সেভ করুন
              </button>
            </div>
          </form>
        </div>

        {/* হিসাবের তালিকা */}
        <div className="bg-[#0b1329] p-6 rounded-xl border border-slate-800 shadow-lg">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4">পূর্ববর্তী সকল হিসাব</h2>
          {loading ? (
            <div className="text-center py-6 text-slate-400">হিসাব লোড হচ্ছে...</div>
          ) : bills.length === 0 ? (
            <div className="text-center py-6 text-slate-400">কোনো হিসাব পাওয়া যায়নি। নতুন হিসাব যোগ করুন।</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm">
                    <th className="p-3">তারিখ</th>
                    <th className="p-3">লেবারের নাম</th>
                    <th className="p-3">বিবরণ</th>
                    <th className="p-3">টাকা</th>
                    <th className="p-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id} className="border-b border-slate-800/50 hover:bg-slate-900/40">
                      <td className="p-3 text-sm text-slate-400">{bill.date}</td>
                      <td className="p-3 font-medium text-white">{bill.labourName}</td>
                      <td className="p-3 text-slate-300">{bill.workDescription || '---'}</td>
                      <td className="p-3 font-semibold text-green-400">৳ {bill.amount}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => handleDelete(bill.id)}
                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1 rounded text-xs transition border border-red-500/30"
                        >
                          ডিলিট
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { UserPlus, Plus, Sparkles } from 'lucide-react';
import { Worker } from '../types';

interface WorkerRegistrationFormProps {
  onAddWorker: (workerData: Omit<Worker, 'id' | 'createdAt'>) => void;
}

const COMMON_TRADES = ['রাজমিস্ত্রি', 'রড মিস্ত্রি', 'হেল্পার', 'কাঠমিস্ত্রি', 'পেইন্টার', 'ইলেকট্রিশিয়ান'];

export const WorkerRegistrationForm: React.FC<WorkerRegistrationFormProps> = ({ onAddWorker }) => {
  const [name, setName] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [trade, setTrade] = useState('রাজমিস্ত্রি');
  const [phone, setPhone] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWage = parseFloat(dailyWage);

    if (!name.trim() || isNaN(parsedWage) || parsedWage <= 0) {
      return;
    }

    onAddWorker({
      name: name.trim(),
      dailyWage: parsedWage,
      trade: trade.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    setName('');
    setDailyWage('');
    setPhone('');
    setSuccessMsg('লেবার সফলভাবে নিবন্ধিত হয়েছে!');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  return (
    <div className="glass-panel p-6 relative">
      <div className="text-lg font-bold text-[#00f2fe] mb-5 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <UserPlus className="w-5 h-5 text-[#00f2fe]" />
          <span>নতুন লেবার এন্ট্রি</span>
        </div>
        <span className="text-[11px] font-normal text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
          রেজিস্ট্রেশন
        </span>
      </div>

      {successMsg && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-[#00b09b]/20 border border-[#00b09b]/50 text-emerald-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            লেবারের পুরো নাম <span className="text-[#ff416c]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="উদাঃ আবদুর রহমান"
            required
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0f1e]/80 border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              দৈনিক মজুরি (টাকা) <span className="text-[#ff416c]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">৳</span>
              <input
                type="number"
                value={dailyWage}
                onChange={(e) => setDailyWage(e.target.value)}
                placeholder="উদাঃ 800"
                min="100"
                step="50"
                required
                className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-[#0a0f1e]/80 border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              মোবাইল নম্বর (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01711-xxxxxx"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0f1e]/80 border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            কাজের ধরন / পদবি
          </label>
          <input
            type="text"
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            placeholder="উদাঃ রাজমিস্ত্রি"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0f1e]/80 border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition-all"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {COMMON_TRADES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTrade(t)}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                  trade === t
                    ? 'bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe]/50 font-medium'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:border-slate-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="cyber-btn w-full py-3 px-4 flex items-center justify-center gap-2 cursor-pointer font-bold text-sm text-[#050814] mt-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] hover:shadow-[0_0_30px_rgba(0,242,254,0.6)]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>লেবার যুক্ত করুন</span>
        </button>
      </form>
    </div>
  );
};

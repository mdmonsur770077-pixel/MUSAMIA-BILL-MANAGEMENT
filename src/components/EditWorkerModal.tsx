import React, { useState } from 'react';
import { X, Save, Edit } from 'lucide-react';
import { Worker } from '../types';

interface EditWorkerModalProps {
  worker: Worker;
  onClose: () => void;
  onSave: (updated: Worker) => void;
}

export const EditWorkerModal: React.FC<EditWorkerModalProps> = ({ worker, onClose, onSave }) => {
  const [name, setName] = useState(worker.name);
  const [dailyWage, setDailyWage] = useState(worker.dailyWage.toString());
  const [trade, setTrade] = useState(worker.trade || '');
  const [phone, setPhone] = useState(worker.phone || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWage = parseFloat(dailyWage);
    if (!name.trim() || isNaN(parsedWage) || parsedWage <= 0) {
      alert('সঠিক নাম ও দৈনিক মজুরি প্রদান করুন');
      return;
    }

    onSave({
      ...worker,
      name: name.trim(),
      dailyWage: parsedWage,
      trade: trade.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md p-6 border border-[#00f2fe]/40 shadow-2xl bg-[#080d20]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2 text-base font-bold text-[#00f2fe]">
            <Edit className="w-4 h-4" />
            <span>লেবারের তথ্য এডিট করুন</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              লেবারের নাম <span className="text-[#ff416c]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-white/20 text-white text-sm focus:border-[#00f2fe] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              দৈনিক মজুরি (টাকা) <span className="text-[#ff416c]">*</span>
            </label>
            <input
              type="number"
              value={dailyWage}
              onChange={(e) => setDailyWage(e.target.value)}
              required
              min="100"
              step="50"
              className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-white/20 text-white text-sm focus:border-[#00f2fe] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              কাজের পদবি / ট্রেড
            </label>
            <input
              type="text"
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              placeholder="উদাঃ রাজমিস্ত্রি, রড মিস্ত্রি"
              className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-white/20 text-white text-sm focus:border-[#00f2fe] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              মোবাইল নম্বর
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017xxxxxxxx"
              className="w-full px-3 py-2 rounded-lg bg-[#050814] border border-white/20 text-white text-sm focus:border-[#00f2fe] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-xs text-slate-300 hover:bg-white/20 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="cyber-btn px-5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>আপডেট করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

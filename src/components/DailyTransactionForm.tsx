import React, { useState, useMemo, useEffect } from 'react';
import { BadgeDollarSign, Check, Calculator, AlertCircle, Search, X } from 'lucide-react';
import { Worker, WorkRecord } from '../types';
import { parseBanglaOrEnglishNumber } from '../utils/dateHelpers';

interface DailyTransactionFormProps {
  workers: Worker[];
  onAddRecord: (record: Omit<WorkRecord, 'id' | 'createdAt'>) => void;
  selectedWorkerId?: string;
  onSelectWorkerId?: (id: string) => void;
}

export const DailyTransactionForm: React.FC<DailyTransactionFormProps> = ({
  workers,
  onAddRecord,
  selectedWorkerId,
  onSelectWorkerId,
}) => {
  const [workerId, setWorkerId] = useState(selectedWorkerId || '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState('1');
  const [paid, setPaid] = useState('0');
  const [advance, setAdvance] = useState('0');
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState('');
  const [workerSearchTerm, setWorkerSearchTerm] = useState('');

  // Filter workers based on search term
  const filteredWorkers = useMemo(() => {
    if (!workerSearchTerm.trim()) return workers;
    const q = workerSearchTerm.toLowerCase();
    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.trade && w.trade.toLowerCase().includes(q)) ||
        (w.phone && w.phone.includes(q))
    );
  }, [workers, workerSearchTerm]);

  // Keep workerId properly in sync whenever workers change or selectedWorkerId changes
  React.useEffect(() => {
    if (selectedWorkerId && workers.some((w) => w.id === selectedWorkerId)) {
      setWorkerId(selectedWorkerId);
    } else if (workers.length > 0) {
      // If current workerId is invalid, not selected, or no longer exists in workers array
      if (!workerId || !workers.some((w) => w.id === workerId)) {
        const nextId = workers[0].id;
        setWorkerId(nextId);
        if (onSelectWorkerId) onSelectWorkerId(nextId);
      }
    } else {
      setWorkerId('');
      if (onSelectWorkerId) onSelectWorkerId('');
    }
  }, [selectedWorkerId, workers, workerId, onSelectWorkerId]);

  // Auto-select first matching worker if current worker is not in filtered results when searching
  useEffect(() => {
    if (workerSearchTerm.trim() && filteredWorkers.length > 0) {
      if (!filteredWorkers.some((w) => w.id === workerId)) {
        const firstMatchId = filteredWorkers[0].id;
        setWorkerId(firstMatchId);
        if (onSelectWorkerId) onSelectWorkerId(firstMatchId);
      }
    }
  }, [workerSearchTerm, filteredWorkers, workerId, onSelectWorkerId]);

  const activeWorker = workers.find((w) => w.id === workerId) || (workers.length === 1 ? workers[0] : undefined);
  const parsedDays = parseBanglaOrEnglishNumber(days);
  const parsedPaid = parseBanglaOrEnglishNumber(paid);
  const parsedAdvance = parseBanglaOrEnglishNumber(advance);
  const estimatedEarned = activeWorker ? parsedDays * activeWorker.dailyWage : 0;
  const netChange = estimatedEarned - (parsedPaid + parsedAdvance);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeWorker) {
      alert('অনুগ্রহ করে একজন লেবার নির্বাচন করুন');
      return;
    }

    if (!date) {
      alert('তারিখ নির্বাচন করুন');
      return;
    }

    if (parsedDays === 0 && parsedPaid === 0 && parsedAdvance === 0) {
      alert('অনুগ্রহ করে কাজের দিন (হাজিরা), মজুরি প্রদান অথবা অগ্রিম টাকার পরিমাণ লিখুন।');
      return;
    }

    onAddRecord({
      workerId: activeWorker.id,
      date,
      days: parsedDays,
      paid: parsedPaid,
      advance: parsedAdvance,
      note: note.trim() || undefined,
    });

    // Reset defaults but keep date
    setDays('1');
    setPaid('0');
    setAdvance('0');
    setNote('');
    setFeedback(`"${activeWorker.name}"-এর দৈনিক কাজের এন্ট্রি সফলভাবে সেভ হয়েছে!`);
    setTimeout(() => setFeedback(''), 3500);
  };

  const handleWorkerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setWorkerId(id);
    if (onSelectWorkerId) onSelectWorkerId(id);
  };

  return (
    <div id="daily-transaction-form" className="glass-panel p-6 relative scroll-mt-24">
      <div className="text-lg font-bold text-[#00f2fe] mb-5 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <BadgeDollarSign className="w-5 h-5 text-[#00f2fe]" />
          <span>দৈনিক কাজ ও অ্যাডভান্স এন্ট্রি</span>
        </div>
        <span className="text-[11px] font-normal text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
          দৈনিক লেজার
        </span>
      </div>

      {feedback && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-[#00b09b]/20 border border-[#00b09b]/50 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {workers.length === 0 ? (
        <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8 text-amber-400/80" />
          <p className="text-sm">কোনো লেবার তালিকাভুক্ত নেই। প্রথমে বাম পাশের ফর্ম দিয়ে লেবার যুক্ত করুন।</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* লেবার নির্বাচন */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  লেবার নির্বাচন <span className="text-[#ff416c]">*</span>
                </label>
                {workerSearchTerm.trim() && (
                  <span className="text-[11px] text-[#00f2fe] font-medium">
                    {filteredWorkers.length} জন পাওয়া গেছে
                  </span>
                )}
              </div>

              {/* লেবার সার্চ ইনপুট */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-[#00f2fe] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={workerSearchTerm}
                  onChange={(e) => setWorkerSearchTerm(e.target.value)}
                  placeholder="লেবার খুঁজুন (নাম বা পদবি)..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#0a0f1e]/90 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition-all"
                />
                {workerSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setWorkerSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full"
                    title="সার্চ ক্লিয়ার করুন"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <select
                value={workerId}
                onChange={handleWorkerChange}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0f1e]/80 border border-white/15 text-white text-sm focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition-all cursor-pointer"
              >
                <option value="" className="bg-[#050814] text-slate-400">
                  {filteredWorkers.length === 0 ? 'কোনো লেবার মেলেনি' : 'লেবার নির্বাচন করুন...'}
                </option>
                {filteredWorkers.map((w) => (
                  <option key={w.id} value={w.id} className="bg-[#050814] text-white">
                    {w.name} {w.trade ? `(${w.trade})` : ''} - ৳{w.dailyWage}/দিন
                  </option>
                ))}
              </select>

              {/* Quick Select Chips on Mobile/Desktop */}
              {filteredWorkers.length > 0 && filteredWorkers.length <= 8 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {filteredWorkers.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setWorkerId(w.id);
                        if (onSelectWorkerId) onSelectWorkerId(w.id);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                        workerId === w.id
                          ? 'bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe] font-semibold'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {w.name} {w.trade ? `(${w.trade})` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* তারিখ */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                তারিখ <span className="text-[#ff416c]">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0f1e]/80 border border-white/15 text-white text-sm focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* কাজের দিন (হাজিরা) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  কাজের দিন (হাজিরা) <span className="text-[#ff416c]">*</span>
                </label>
                <div className="flex items-center gap-1">
                  {[0.5, 1, 1.5, 2].map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setDays(d.toString())}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${
                        parseFloat(days) === d
                          ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/40 font-semibold'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                step="0.25"
                min="0"
                max="10"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="1 বা 0.5"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0f1e]/80 border border-white/15 text-white text-sm focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition-all"
              />
            </div>

            {/* পরিশোধিত বেতন */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                পরিশোধিত মজুরি (টাকা)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">৳</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-[#0a0f1e]/80 border border-white/15 text-white text-sm focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* অগ্রিম / অ্যাডভান্স গ্রহণ */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>অগ্রিম / অ্যাডভান্স গ্রহণ (টাকা)</span>
                <span className="text-[#ff416c] text-[10px]">কোম্পানি পাওনা যোগ হবে</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ff416c] font-medium text-sm">৳</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={advance}
                  onChange={(e) => setAdvance(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-[#0a0f1e]/80 border border-[#ff416c]/30 text-white text-sm focus:outline-none focus:border-[#ff416c] focus:ring-1 focus:ring-[#ff416c] transition-all"
                />
              </div>
            </div>

            {/* নোট / কাজের বিবরণ ও সাইট কন্ডিশন */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <span className="text-[#00f2fe]">মন্তব্য / সাইট কন্ডিশন / কাজের বিবরণ (Remarks)</span>
                  <span className="text-[10px] text-slate-400 font-normal">(ঐচ্ছিক)</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  সাইটের অবস্থা, কাজের পারফর্মেন্স বা নির্দিষ্ট টাস্ক উল্লেখ করুন
                </span>
              </div>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="যেমন: ৩য় তলা ছাদ ঢালাই, বৃষ্টিতে ২ ঘণ্টা কাজ বন্ধ, অতিরিক্ত ভালো কাজ, ওটি সম্পন্ন"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0a0f1e]/80 border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe] transition-all"
              />

              {/* Quick Preset Condition Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mr-0.5">
                  <span>কুইক ট্যাগ:</span>
                </span>
                {[
                  '৩য় তলা ছাদ ঢালাই',
                  'গাথুনির কাজ সম্পন্ন',
                  'প্লাস্টার ও ফিনিশিং',
                  'বৃষ্টির কারণে বিলম্ব',
                  'ভালো কাজের বোনাস/টিপস',
                  'ওভারটাইমসহ ফুল ডে',
                  'সাইট সরঞ্জাম হ্যান্ডলিং',
                  'জরুরি চিকিৎসা/হাতখরচ',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!note.trim()) {
                        setNote(tag);
                      } else if (!note.includes(tag)) {
                        setNote(`${note}, ${tag}`);
                      }
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-[#00f2fe]/15 border border-white/10 hover:border-[#00f2fe]/40 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* লাইভ এস্টিমেট প্রিভিউ স্ট্রিপ */}
          {activeWorker && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Calculator className="w-4 h-4 text-[#00f2fe]" />
                <span>
                  হিসেব: {parsedDays} দিন × ৳{activeWorker.dailyWage} ={' '}
                  <strong className="text-cyan-300">৳{estimatedEarned}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 mr-1.5">দিনের ব্যালেন্স পরিবর্তন:</span>
                <span
                  className={`font-semibold font-orbitron ${
                    netChange > 0 ? 'text-[#00f2fe]' : netChange < 0 ? 'text-[#ff416c]' : 'text-slate-300'
                  }`}
                >
                  {netChange > 0 ? `+৳${netChange} (লেবার পাবে)` : netChange < 0 ? `-৳${Math.abs(netChange)} (কোম্পানি পাবে)` : '৳ 0'}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="cyber-btn w-full py-3 px-4 flex items-center justify-center gap-2 cursor-pointer font-bold text-sm text-[#050814] shadow-[0_0_20px_rgba(0,242,254,0.35)] hover:shadow-[0_0_30px_rgba(0,242,254,0.6)]"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>এন্ট্রি সেভ করুন</span>
          </button>
        </form>
      )}
    </div>
  );
};

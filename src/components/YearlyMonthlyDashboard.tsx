import React from 'react';
import {
  CalendarDays,
  Coins,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Filter,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { YearSummary, MonthSummary } from '../types';
import { toBanglaNumber, BANGLA_MONTHS } from '../utils/dateHelpers';

interface YearlyMonthlyDashboardProps {
  yearSummary: YearSummary;
  selectedMonth: number | 'all';
  onSelectMonth: (month: number | 'all') => void;
  onClose: () => void;
}

export const YearlyMonthlyDashboard: React.FC<YearlyMonthlyDashboardProps> = ({
  yearSummary,
  selectedMonth,
  onSelectMonth,
  onClose,
}) => {
  // Find highest work month for scaling visual indicators
  const maxDays = Math.max(...yearSummary.monthlyBreakdown.map((m) => m.totalDays), 1);
  const maxEarned = Math.max(...yearSummary.monthlyBreakdown.map((m) => m.totalEarned), 1);

  return (
    <div className="glass-panel p-6 mb-8 border-[#00f2fe]/40 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[#00f2fe] text-xs font-semibold mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>বাৎসরিক ও মাসিক সার্বিক বিশ্লেষণ (ANNUAL & MONTHLY LEDGER)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>{toBanglaNumber(yearSummary.year)} সালের ১২ মাসের ধারাবাহিক হিসাব</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            প্রতিটি মাসের হাজিরা, অর্জিত মজুরি, পরিশোধ ও অ্যাডভান্স একনজরে বাৎসরিক যোগফল আকারে দেখুন
          </p>
        </div>

        <button
          onClick={onClose}
          className="self-start sm:self-center text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
        >
          গ্রিড বন্ধ করুন
        </button>
      </div>

      {/* 4 Annual Key Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* বাৎসরিক মোট হাজিরা */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 relative overflow-hidden">
          <div className="text-[11px] uppercase font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>বাৎসরিক মোট হাজিরা</span>
            <CalendarDays className="w-4 h-4 text-[#00f2fe]" />
          </div>
          <div className="font-orbitron text-2xl font-black text-white">
            {yearSummary.totalDays} <span className="text-xs font-normal text-slate-400 font-sans">দিন</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            মোট এন্ট্রি: <span className="text-cyan-300 font-semibold">{yearSummary.recordsCount} টি</span>
          </div>
        </div>

        {/* বাৎসরিক অর্জিত আয় */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 relative overflow-hidden">
          <div className="text-[11px] uppercase font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>বাৎসরিক অর্জিত মজুরি</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-orbitron text-2xl font-black text-white">
            ৳{yearSummary.totalEarned.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            শ্রমিকদের মোট ন্যায্য পারিশ্রমিক
          </div>
        </div>

        {/* বাৎসরিক মোট পরিশোধ ও অগ্রিম */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/10 relative overflow-hidden">
          <div className="text-[11px] uppercase font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>বাৎসরিক মোট পরিশোধ ও অগ্রিম</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-orbitron text-2xl font-black text-white">
            ৳{yearSummary.totalPaidAll.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
            <span>মজুরি: ৳{yearSummary.totalPaid.toLocaleString()}</span>
            <span>•</span>
            <span className="text-[#ff416c]">অ্যাডভান্স: ৳{yearSummary.totalAdvance.toLocaleString()}</span>
          </div>
        </div>

        {/* বাৎসরিক সমাপনী স্থিতি / ক্লোজিং ব্যালেন্স */}
        <div
          className={`p-4 rounded-xl border relative overflow-hidden ${
            yearSummary.balance < 0
              ? 'bg-[#ff416c]/10 border-[#ff416c]/40'
              : yearSummary.balance > 0
              ? 'bg-[#00f2fe]/10 border-[#00f2fe]/40'
              : 'bg-slate-800/40 border-slate-700'
          }`}
        >
          <div className="text-[11px] uppercase font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>বাৎসরিক ক্লোজিং স্থিতি</span>
            {yearSummary.balance < 0 ? (
              <AlertTriangle className="w-4 h-4 text-[#ff416c]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#00f2fe]" />
            )}
          </div>
          <div
            className={`font-orbitron text-2xl font-black ${
              yearSummary.balance < 0
                ? 'text-[#ff416c]'
                : yearSummary.balance > 0
                ? 'text-[#00f2fe]'
                : 'text-slate-300'
            }`}
          >
            ৳{Math.abs(yearSummary.balance).toLocaleString()}
          </div>
          <div className="text-[11px] font-semibold mt-1">
            {yearSummary.balance < 0 ? (
              <span className="text-[#ff416c]">কোম্পানি মোট পাবে (ওভারড্রন অগ্রিম)</span>
            ) : yearSummary.balance > 0 ? (
              <span className="text-[#00f2fe]">শ্রমিকদের নিট পাওনা</span>
            ) : (
              <span className="text-slate-400">হিসাব সম্পূর্ণ পরিশোধিত</span>
            )}
          </div>
        </div>
      </div>

      {/* 12 Months Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {yearSummary.monthlyBreakdown.map((mb) => {
          const isCurrentActive = selectedMonth === mb.monthIndex;
          const hasData = mb.recordsCount > 0;
          const progressPercent = Math.min(100, Math.round((mb.totalDays / maxDays) * 100));

          return (
            <div
              key={mb.monthIndex}
              onClick={() => onSelectMonth(mb.monthIndex)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                isCurrentActive
                  ? 'bg-[#00f2fe]/15 border-[#00f2fe] shadow-[0_0_20px_rgba(0,242,254,0.3)]'
                  : hasData
                  ? 'bg-[#0a0f24]/90 border-white/15 hover:border-[#00f2fe]/60 hover:bg-[#0d1430]'
                  : 'bg-black/30 border-white/5 opacity-60 hover:opacity-100 hover:border-white/15'
              }`}
            >
              {/* Card Top: Month Name & Active Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-white group-hover:text-[#00f2fe] transition-colors flex items-center gap-1.5">
                  <span>{mb.monthName}</span>
                  {isCurrentActive && (
                    <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-[#00f2fe] text-[#050814] font-semibold">
                      সক্রিয়
                    </span>
                  )}
                </span>
                {hasData ? (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#00f2fe]" />
                    <span>{mb.activeWorkersCount} জন</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">কোনো কাজ নেই</span>
                )}
              </div>

              {/* Progress Bar (Visual activity volume) */}
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-2.5">
                <div
                  className="h-full bg-gradient-to-r from-[#00f2fe] to-[#4facfe] rounded-full transition-all"
                  style={{ width: `${hasData ? progressPercent : 0}%` }}
                />
              </div>

              {/* Financial Metrics */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>মোট হাজিরা:</span>
                  <span className="text-white font-semibold">{mb.totalDays} দিন</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>অর্জিত মজুরি:</span>
                  <span className="text-white font-orbitron">৳{mb.totalEarned.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>পরিশোধিত:</span>
                  <span className="text-slate-300 font-orbitron">৳{mb.totalPaid.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>অ্যাডভান্স:</span>
                  <span className="text-[#ff416c] font-orbitron font-semibold">
                    ৳{mb.totalAdvance.toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-1 mt-1.5 flex items-center justify-between font-semibold">
                  <span className="text-[11px]">মাসিক স্থিতি:</span>
                  {mb.balance < 0 ? (
                    <span className="text-[#ff416c] font-orbitron text-xs">
                      -৳{Math.abs(mb.balance).toLocaleString()}
                    </span>
                  ) : mb.balance > 0 ? (
                    <span className="text-[#00f2fe] font-orbitron text-xs">
                      +৳{mb.balance.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs">পরিশোধিত</span>
                  )}
                </div>
              </div>

              {/* Hover Cue */}
              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-cyan-300/70 group-hover:text-cyan-200">
                <span>বিস্তারিত দেখুন</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { Calendar, CalendarRange, ChevronDown, BarChart3, Clock, Sparkles } from 'lucide-react';
import { BANGLA_MONTHS, toBanglaNumber } from '../utils/dateHelpers';
import { YearSummary } from '../types';

interface YearMonthFilterProps {
  availableYears: number[];
  selectedYear: number | 'all';
  selectedMonth: number | 'all';
  currentYearSummary?: YearSummary;
  onSelectYear: (year: number | 'all') => void;
  onSelectMonth: (month: number | 'all') => void;
  showAnalytics: boolean;
  onToggleAnalytics: () => void;
}

export const YearMonthFilter: React.FC<YearMonthFilterProps> = ({
  availableYears,
  selectedYear,
  selectedMonth,
  currentYearSummary,
  onSelectYear,
  onSelectMonth,
  showAnalytics,
  onToggleAnalytics,
}) => {
  return (
    <div className="glass-panel p-4 mb-6 border-[#00f2fe]/30">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Year & Period Indicator */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00f2fe]/15 border border-[#00f2fe]/30 flex items-center justify-center text-[#00f2fe]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                অডিট সময়কাল নির্বাচন
              </span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                {selectedYear === 'all'
                  ? 'সকল বছর (সার্বিক হিসাব)'
                  : `${toBanglaNumber(selectedYear)} সাল`}
                <span className="text-xs font-normal text-[#00f2fe] bg-[#00f2fe]/10 px-2 py-0.5 rounded-full border border-[#00f2fe]/20">
                  {selectedMonth === 'all'
                    ? 'সম্পূর্ণ বছর (বাৎসরিক হিসাব)'
                    : `${BANGLA_MONTHS[selectedMonth - 1]} মাস`}
                </span>
              </span>
            </div>
          </div>

          {/* Year Selector Dropdown / Pills */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => onSelectYear('all')}
              className={`px-3 py-1 text-xs rounded-lg transition-all font-semibold ${
                selectedYear === 'all'
                  ? 'bg-[#00f2fe] text-[#050814] shadow-[0_0_12px_rgba(0,242,254,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              সব বছর
            </button>
            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => onSelectYear(yr)}
                className={`px-3 py-1 text-xs rounded-lg transition-all font-semibold ${
                  selectedYear === yr
                    ? 'bg-[#00f2fe] text-[#050814] shadow-[0_0_12px_rgba(0,242,254,0.5)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {toBanglaNumber(yr)}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Toggle Yearly-Monthly Dashboard & Quick Reset */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleAnalytics}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              showAnalytics
                ? 'bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe]/50 shadow-[0_0_15px_rgba(0,242,254,0.25)]'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#00f2fe]" />
            <span>১২ মাসের অডিট গ্রিড ও অ্যানালিটিক্স</span>
          </button>
        </div>
      </div>

      {/* Month Bar - Only when a specific year or all is selected */}
      {selectedYear !== 'all' && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {/* All Year / বাৎসরিক সার্বিক বাটন */}
            <button
              onClick={() => onSelectMonth('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                selectedMonth === 'all'
                  ? 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#050814] shadow-[0_0_15px_rgba(0,242,254,0.4)]'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>সম্পূর্ণ বাৎসরিক হিসাব ({toBanglaNumber(selectedYear)})</span>
            </button>

            <div className="w-[1px] h-5 bg-slate-700 mx-1 shrink-0" />

            {/* 12 Months Chips */}
            {BANGLA_MONTHS.map((monthName, idx) => {
              const monthIdx = idx + 1;
              const isSelected = selectedMonth === monthIdx;

              // Check if records exist in currentYearSummary for this month
              const monthSummary = currentYearSummary?.monthlyBreakdown.find(
                (mb) => mb.monthIndex === monthIdx
              );
              const hasRecords = monthSummary && monthSummary.recordsCount > 0;

              return (
                <button
                  key={monthName}
                  onClick={() => onSelectMonth(monthIdx)}
                  className={`px-3 py-1 rounded-lg text-xs shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#00f2fe]/25 text-[#00f2fe] border border-[#00f2fe]/60 font-bold shadow-[0_0_10px_rgba(0,242,254,0.25)]'
                      : hasRecords
                      ? 'bg-[#00f2fe]/10 text-cyan-200 hover:bg-[#00f2fe]/15 border border-[#00f2fe]/20'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span>{monthName}</span>
                  {hasRecords && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-[#00f2fe]' : 'bg-cyan-400'
                      }`}
                      title={`${monthSummary.recordsCount}টি এন্ট্রি রয়েছে`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

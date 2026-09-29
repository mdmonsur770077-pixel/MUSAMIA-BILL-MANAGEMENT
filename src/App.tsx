import React, { useState } from 'react';
import ThreeBackground from './components/ThreeBackground';
import { YearlyMonthlyDashboard } from './components/YearlyMonthlyDashboard';
import { YearSummary } from './types';

export default function App() {
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  // ডামি বা ডিফল্ট ইয়ার সামারি ডেটা (যাতে বিল্ডে কোনো এরর না আসে)
  const dummyYearSummary: YearSummary = {
    year: 2026,
    totalDays: 0,
    recordsCount: 0,
    totalEarned: 0,
    totalPaid: 0,
    totalAdvance: 0,
    totalPaidAll: 0,
    balance: 0,
    monthlyBreakdown: Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i + 1,
      monthName: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'][i],
      totalDays: 0,
      totalEarned: 0,
      totalPaid: 0,
      totalAdvance: 0,
      balance: 0,
      recordsCount: 0,
      activeWorkersCount: 0
    }))
  };

  return (
    <div className="min-h-screen bg-[#050814] text-[#e6f1ff] relative overflow-x-hidden selection:bg-[#00f2fe]/30 selection:text-[#00f2fe]">
      {/* ৩ডি ব্যাকগ্রাউন্ড */}
      <div className="fixed inset-0 w-screen h-screen -z-10 pointer-events-none no-print">
        <ThreeBackground />
      </div>

      {/* মূল পোর্টাল বা ড্যাশবোর্ড */}
      <main className="relative z-10 p-4 md:p-6 max-w-[1340px] mx-auto">
        <header className="text-center mb-6 px-2">
          <h1 className="text-3xl sm:text-5xl font-black tracking-wide bg-gradient-to-r from-[#00f2fe] via-[#4facfe] to-[#00f2fe] bg-clip-text text-transparent">
            MONSUR LABOR PORTAL
          </h1>
          <p className="text-slate-400 mt-2 text-sm">বাৎসরিক ও মাসিক হিসাব অডিট, দৈনিক হাজিরা এন্ট্রি ও অগ্রিম ব্যালেন্স ব্যবস্থাপনা</p>
        </header>

        <YearlyMonthlyDashboard
          yearSummary={dummyYearSummary}
          selectedMonth={selectedMonth}
          onSelectMonth={(m) => setSelectedMonth(m)}
          onClose={() => {}}
        />
      </main>
    </div>
  );
}

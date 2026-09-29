import React from 'react';
import YearlyMonthlyDashboard from './components/YearlyMonthlyDashboard';
import ThreeBackground from './components/ThreeBackground';

export default function App() {
  return (
    <div className="min-h-screen bg-[#050814] text-[#e6f1ff] relative overflow-x-hidden selection:bg-[#00f2fe]/30 selection:text-[#00f2fe]">
      {/* থ্রি-ডি ব্যাকগ্রাউন্ড ইফেক্ট */}
      <div className="fixed inset-0 w-screen h-screen -z-10 pointer-events-none no-print">
        <ThreeBackground />
      </div>

      {/* মূল ড্যাশবোর্ড কম্পোনেন্ট */}
      <main className="relative z-10">
        <YearlyMonthlyDashboard />
      </main>
    </div>
  );
}

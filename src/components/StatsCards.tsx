import React, { useState, useMemo } from 'react';
import {
  Users,
  HandCoins,
  Wallet,
  Receipt,
  Scale,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Coins,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { WorkerSummary, YearSummary } from '../types';
import { roundMoney, toBanglaNumber } from '../utils/dateHelpers';

interface StatsCardsProps {
  summaries: WorkerSummary[];
  periodLabel?: string;
  currentYearSummary?: YearSummary;
  selectedYear?: number | 'all';
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  summaries,
  periodLabel,
  currentYearSummary,
  selectedYear,
}) => {
  const [trendMetric, setTrendMetric] = useState<'all' | 'comparison' | 'net'>('all');
  const [showActiveMonthsOnly, setShowActiveMonthsOnly] = useState(false);
  const [isProfitLossCollapsed, setIsProfitLossCollapsed] = useState(false);
  const totalWorkers = summaries.length;

  let totalCompanyClaim = 0; // Amount owed to company (Worker took more advance/paid than earned)
  let totalLaborDue = 0;     // Amount owed to laborers (Unpaid earned wages)
  let companyClaimCount = 0;
  let laborDueCount = 0;
  let overallAdvance = 0;
  let totalWagesPaid = 0;
  let totalWorkDays = 0;
  let settledWorkersCount = 0;

  summaries.forEach((s) => {
    totalWorkDays = roundMoney(totalWorkDays + s.totalDays);
    totalWagesPaid = roundMoney(totalWagesPaid + s.totalPaid);
    overallAdvance = roundMoney(overallAdvance + s.totalAdvance);

    if (s.status === 'claim' || s.balance < 0) {
      totalCompanyClaim = roundMoney(totalCompanyClaim + Math.abs(s.balance));
      companyClaimCount += 1;
    } else if (s.status === 'due' || s.balance > 0) {
      totalLaborDue = roundMoney(totalLaborDue + s.balance);
      laborDueCount += 1;
    } else {
      settledWorkersCount += 1;
    }
  });

  // Net position: Positive means company is net creditor (company gets more money back), Negative means company is net debtor (company owes workers more)
  const netOutstandingDebt = roundMoney(totalCompanyClaim - totalLaborDue);
  const totalDebtVolume = roundMoney(totalCompanyClaim + totalLaborDue);
  const companyClaimPercent =
    totalDebtVolume > 0 ? (totalCompanyClaim / totalDebtVolume) * 100 : 50;
  const laborDuePercent =
    totalDebtVolume > 0 ? (totalLaborDue / totalDebtVolume) * 100 : 50;

  // --- Profit / Loss and Company Expenditure metrics for selected year ---
  const effectiveYear =
    currentYearSummary?.year ||
    (typeof selectedYear === 'number' ? selectedYear : new Date().getFullYear());

  const annualEarned = currentYearSummary
    ? currentYearSummary.totalEarned
    : summaries.reduce((acc, s) => roundMoney(acc + s.totalEarned), 0);

  const annualPaid = currentYearSummary
    ? currentYearSummary.totalPaid
    : summaries.reduce((acc, s) => roundMoney(acc + s.totalPaid), 0);

  const annualAdvance = currentYearSummary
    ? currentYearSummary.totalAdvance
    : summaries.reduce((acc, s) => roundMoney(acc + s.totalAdvance), 0);

  const annualExpenditure = currentYearSummary
    ? currentYearSummary.totalPaidAll
    : roundMoney(annualPaid + annualAdvance);

  // Positive means company generated more production value than total cash expenditure (retained value/unpaid dues surplus)
  // Negative means cash disbursement exceeded earned labor value (excess advance/overpayment outflow)
  const annualNetGain = roundMoney(annualEarned - annualExpenditure);
  const annualWorkDays = currentYearSummary ? currentYearSummary.totalDays : totalWorkDays;
  const expenditureRatio =
    annualEarned > 0 ? (annualExpenditure / annualEarned) * 100 : 0;

  // Monthly breakdown trend data for selected year
  const { chartData, peakExpenditureMonth, peakEarnedMonth, activeMonthsCount } = useMemo(() => {
    if (!currentYearSummary?.monthlyBreakdown) {
      return {
        chartData: [],
        peakExpenditureMonth: null,
        peakEarnedMonth: null,
        activeMonthsCount: 0,
      };
    }

    const allMonths = currentYearSummary.monthlyBreakdown;
    const active = allMonths.filter(
      (m) => m.recordsCount > 0 || m.totalPaidAll > 0 || m.totalEarned > 0
    );

    const targetList = showActiveMonthsOnly && active.length > 0 ? active : allMonths;

    let maxExp = -1;
    let maxExpM: (typeof allMonths)[0] | null = null;
    let maxEarn = -1;
    let maxEarnM: (typeof allMonths)[0] | null = null;

    active.forEach((m) => {
      if (m.totalPaidAll > maxExp) {
        maxExp = m.totalPaidAll;
        maxExpM = m;
      }
      if (m.totalEarned > maxEarn) {
        maxEarn = m.totalEarned;
        maxEarnM = m;
      }
    });

    const data = targetList.map((m) => {
      const net = roundMoney(m.totalEarned - m.totalPaidAll);
      return {
        monthKey: m.monthKey,
        monthName: m.monthName,
        shortName: m.monthName.slice(0, 4),
        expenditure: m.totalPaidAll,
        wagesPaid: m.totalPaid,
        advance: m.totalAdvance,
        earned: m.totalEarned,
        netGain: net,
        days: m.totalDays,
        activeWorkers: m.activeWorkersCount,
        recordsCount: m.recordsCount,
      };
    });

    return {
      chartData: data,
      peakExpenditureMonth: maxExpM,
      peakEarnedMonth: maxEarnM,
      activeMonthsCount: active.length,
    };
  }, [currentYearSummary, showActiveMonthsOnly]);

  // Custom Recharts Tooltip for Profit/Loss Trend Line
  const CustomProfitLossTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const isGain = item.netGain >= 0;

      return (
        <div className="p-3.5 rounded-xl bg-[#070e24]/95 border border-white/20 shadow-[0_12px_30px_rgba(0,0,0,0.85)] backdrop-blur-md text-xs min-w-[240px] font-sans">
          <div className="font-bold text-white text-sm border-b border-white/10 pb-1.5 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {item.monthName} {effectiveYear}
              </span>
            </span>
            <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 font-orbitron">
              {item.days} দিন ({item.activeWorkers} জন)
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff416c]" />
                <span>কোম্পানি ব্যয় (Expenditure):</span>
              </span>
              <span className="font-orbitron font-bold text-[#ff416c]">
                ৳ {item.expenditure.toLocaleString()}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 pl-4 flex items-center justify-between">
              <span>মজুরি: ৳{item.wagesPaid.toLocaleString()}</span>
              <span>অগ্রিম: ৳{item.advance.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00f2fe]" />
                <span>কাজের মূল্য (Earned Value):</span>
              </span>
              <span className="font-orbitron font-bold text-[#00f2fe]">
                ৳ {item.earned.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-4">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isGain ? 'bg-[#38ef7d]' : 'bg-[#ff416c]'
                  }`}
                />
                <span>নিট স্থিতি (Net Gain / Deficit):</span>
              </span>
              <span
                className={`font-orbitron font-bold ${
                  isGain ? 'text-[#38ef7d]' : 'text-[#ff416c]'
                }`}
              >
                {isGain
                  ? `+৳ ${item.netGain.toLocaleString()}`
                  : `-৳ ${Math.abs(item.netGain).toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-8">
      {periodLabel && (
        <div className="flex items-center justify-between mb-3 px-1 text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#00f2fe]" />
            <span>
              পরিসংখ্যান সময়কাল: <strong className="text-white font-semibold">{periodLabel}</strong>
            </span>
          </span>
          <span className="text-slate-400">
            মোট কার্যদিবস: <strong className="text-cyan-300 font-orbitron">{totalWorkDays} দিন</strong>
          </span>
        </div>
      )}

      {/* New 'Total Outstanding Debt' Executive Audit Widget */}
      <div
        id="stat-widget-total-outstanding-debt"
        className="glass-panel p-5 sm:p-6 mb-5 border border-white/15 hover:border-[#00f2fe]/40 transition-all rounded-2xl relative overflow-hidden bg-gradient-to-r from-[#0b132b]/95 via-[#080d22]/90 to-[#140b20]/95 shadow-[0_4px_25px_rgba(0,0,0,0.5)]"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00f2fe]/20 to-[#ff416c]/20 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-[0_0_20px_rgba(0,242,254,0.15)]">
              <Scale className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  <span>Total Outstanding Debt</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-slate-300 font-sans">
                    সর্বমোট দেনা-পাওনা অডিট
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                কোম্পানির মোট পাওনা (Owed to Company) বনাম শ্রমিকদের মোট বকেয়া (Owed to Laborers)
              </p>
            </div>
          </div>

          {/* Net Outstanding Balance Badge */}
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <div
              className={`px-4 py-2 rounded-xl border flex items-center gap-3 ${
                netOutstandingDebt > 0
                  ? 'bg-[#ff416c]/15 border-[#ff416c]/50 text-[#ff416c] shadow-[0_0_15px_rgba(255,65,108,0.25)]'
                  : netOutstandingDebt < 0
                  ? 'bg-[#00f2fe]/15 border-[#00f2fe]/50 text-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.25)]'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {netOutstandingDebt > 0 ? (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              ) : netOutstandingDebt < 0 ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : null}
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  নিট স্থিতি (Net Position)
                </div>
                <div className="font-orbitron font-extrabold text-lg sm:text-xl">
                  {netOutstandingDebt > 0
                    ? `+৳ ${Math.abs(netOutstandingDebt).toLocaleString()}`
                    : netOutstandingDebt < 0
                    ? `-৳ ${Math.abs(netOutstandingDebt).toLocaleString()}`
                    : '৳ 0 (সমান)'}
                </div>
              </div>
              <div className="text-xs font-bold font-sans pl-1 border-l border-white/10">
                {netOutstandingDebt > 0 ? (
                  <span className="text-[11px] block leading-tight">কোম্পানি<br />নিট পাবে</span>
                ) : netOutstandingDebt < 0 ? (
                  <span className="text-[11px] block leading-tight">শ্রমিকরা<br />নিট পাবে</span>
                ) : (
                  <span className="text-[11px] block leading-tight">সম্পূর্ণ<br />সমন্বিত</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Comparison: Owed to Company vs Owed to Laborers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Owed to Company */}
          <div className="p-4 rounded-xl bg-[#ff416c]/5 border border-[#ff416c]/30 hover:border-[#ff416c]/60 transition-all relative overflow-hidden group">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-xs font-bold text-[#ff416c] uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4" />
                  <span>কোম্পানির পাওনা (Owed to Company)</span>
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  শ্রমিকদের থেকে কোম্পানি ফেরত পাবে ({companyClaimCount} জন শ্রমিক)
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#ff416c]/15 border border-[#ff416c]/30 flex items-center justify-center text-[#ff416c] shrink-0">
                <HandCoins className="w-5 h-5" />
              </div>
            </div>
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-[#ff416c] tracking-tight">
              ৳ {totalCompanyClaim.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>অতিরিক্ত বা অগ্রিম বাবদ বকেয়া</span>
              <span className="font-orbitron text-slate-300 font-semibold">
                {companyClaimPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Owed to Laborers */}
          <div className="p-4 rounded-xl bg-[#00f2fe]/5 border border-[#00f2fe]/30 hover:border-[#00f2fe]/60 transition-all relative overflow-hidden group">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-xs font-bold text-[#00f2fe] uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>শ্রমিকদের পাওনা (Owed to Laborers)</span>
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  কোম্পানি শ্রমিকদের পরিশোধ করবে ({laborDueCount} জন শ্রমিক)
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#00f2fe]/15 border border-[#00f2fe]/30 flex items-center justify-center text-[#00f2fe] shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-[#00f2fe] tracking-tight">
              ৳ {totalLaborDue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>কাজের অবৈতনিক বকেয়া মজুরি</span>
              <span className="font-orbitron text-slate-300 font-semibold">
                {laborDuePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Visual Balance Distribution Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 text-[#ff416c]">
              <span className="w-2 h-2 rounded-full bg-[#ff416c]" />
              <span>কোম্পানির রিসিভেবল ({companyClaimPercent.toFixed(0)}%)</span>
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              মোট অপরিশোধিত ভলিউম: ৳ {totalDebtVolume.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5 text-[#00f2fe]">
              <span>শ্রমিকদের পেয়াবল ({laborDuePercent.toFixed(0)}%)</span>
              <span className="w-2 h-2 rounded-full bg-[#00f2fe]" />
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden flex border border-white/10">
            <div
              style={{ width: `${companyClaimPercent}%` }}
              className="h-full bg-gradient-to-r from-[#ff416c] to-[#ff4b2b] transition-all duration-500"
              title={`কোম্পানির পাওনা: ৳ ${totalCompanyClaim.toLocaleString()} (${companyClaimPercent.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${laborDuePercent}%` }}
              className="h-full bg-gradient-to-r from-[#00c6ff] to-[#00f2fe] transition-all duration-500"
              title={`শ্রমিকদের পাওনা: ৳ ${totalLaborDue.toLocaleString()} (${laborDuePercent.toFixed(1)}%)`}
            />
          </div>
        </div>
      </div>

      {/* New 'Profit/Loss Summary' Executive Analytics Card with Trend Line */}
      <div
        id="stat-widget-profit-loss-summary"
        className="glass-panel p-5 sm:p-6 mb-5 border border-white/15 hover:border-emerald-500/40 transition-all rounded-2xl relative overflow-hidden bg-gradient-to-r from-[#071325]/95 via-[#091734]/90 to-[#0c1f3d]/95 shadow-[0_4px_25px_rgba(0,0,0,0.5)]"
      >
        {/* Glow ambient background effects */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#00f2fe]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5 relative z-10">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-[#ff416c]/20 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  <span>Profit/Loss Summary</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-sans">
                    লাভ-ক্ষতি ও ব্যয় বিশ্লেষণ
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#00f2fe]/15 border border-[#00f2fe]/30 text-cyan-300 font-orbitron">
                    {toBanglaNumber(effectiveYear)} সাল
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                নির্বাচিত বছরে সকল শ্রমিকের অর্জিত কাজের মূল্য (Production Value) বনাম কোম্পানির মোট ব্যয় (Expenditure) ও মাসিক ট্রেন্ড
              </p>
            </div>
          </div>

          {/* Net Gain Status Pill & Collapse Button */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
            <div
              className={`px-4 py-2 rounded-xl border flex items-center gap-3 ${
                annualNetGain >= 0
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-[#ff416c]/15 border-[#ff416c]/40 text-[#ff416c] shadow-[0_0_15px_rgba(255,65,108,0.2)]'
              }`}
            >
              {annualNetGain >= 0 ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 text-[#ff416c]" />
              )}
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-85">
                  বাৎসরিক নিট স্থিতি (Net Gain / Balance)
                </div>
                <div className="font-orbitron font-extrabold text-lg sm:text-xl">
                  {annualNetGain >= 0
                    ? `+৳ ${annualNetGain.toLocaleString()}`
                    : `-৳ ${Math.abs(annualNetGain).toLocaleString()}`}
                </div>
              </div>
              <div className="text-xs font-bold font-sans pl-2 border-l border-white/10 text-left">
                {annualNetGain >= 0 ? (
                  <span className="text-[11px] block leading-tight text-emerald-300">
                    উদ্বৃত্ত<br />মূল্য সাশ্রয়
                  </span>
                ) : (
                  <span className="text-[11px] block leading-tight text-[#ff416c]">
                    অতিরিক্ত<br />নগদ ব্যয়
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsProfitLossCollapsed(!isProfitLossCollapsed)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isProfitLossCollapsed ? 'বিস্তারিত প্রসারিত করুন' : 'সংক্ষেপ করুন'}
            >
              {isProfitLossCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* 4 Annual Financial Performance KPI Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5 relative z-10">
          {/* 1. Total Company Expenditure */}
          <div className="p-4 rounded-xl bg-black/40 border border-[#ff416c]/30 hover:border-[#ff416c]/60 transition-all relative overflow-hidden group">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <span className="text-[11px] font-bold text-[#ff416c] uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>কোম্পানির মোট ব্যয় (Expenditure)</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  পরিশোধিত মজুরি ও দেওয়া অগ্রিম
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#ff416c]/15 border border-[#ff416c]/30 flex items-center justify-center text-[#ff416c] shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="font-orbitron text-xl sm:text-2xl font-black text-[#ff416c] tracking-tight">
              ৳ {annualExpenditure.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between border-t border-white/5 pt-1.5">
              <span>মজুরি: ৳{annualPaid.toLocaleString()}</span>
              <span className="text-[#ff416c]">অগ্রিম: ৳{annualAdvance.toLocaleString()}</span>
            </div>
          </div>

          {/* 2. Total Labor Production Value (Earned) */}
          <div className="p-4 rounded-xl bg-black/40 border border-[#00f2fe]/30 hover:border-[#00f2fe]/60 transition-all relative overflow-hidden group">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <span className="text-[11px] font-bold text-[#00f2fe] uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  <span>কাজের অর্জিত মূল্য (Labor Value)</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  মোট {annualWorkDays} দিন হাজিরার উৎপাদন মূল্য
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#00f2fe]/15 border border-[#00f2fe]/30 flex items-center justify-center text-[#00f2fe] shrink-0">
                <HandCoins className="w-4 h-4" />
              </div>
            </div>
            <div className="font-orbitron text-xl sm:text-2xl font-black text-[#00f2fe] tracking-tight">
              ৳ {annualEarned.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between border-t border-white/5 pt-1.5">
              <span>দৈনিক হাজিরার পারিশ্রমিক</span>
              <span className="font-orbitron text-cyan-300 font-semibold">{annualWorkDays} দিন</span>
            </div>
          </div>

          {/* 3. Net Financial Position */}
          <div
            className={`p-4 rounded-xl bg-black/40 border ${
              annualNetGain >= 0
                ? 'border-emerald-500/30 hover:border-emerald-500/60'
                : 'border-[#ff416c]/30 hover:border-[#ff416c]/60'
            } transition-all relative overflow-hidden group`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    annualNetGain >= 0 ? 'text-emerald-400' : 'text-[#ff416c]'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>নিট আর্থিক স্থিতি (Net Margin)</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  কাজের অর্জিত মূল্য বনাম নগদ ব্যয়
                </span>
              </div>
              <div
                className={`w-8 h-8 rounded-lg ${
                  annualNetGain >= 0
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-[#ff416c]/15 border border-[#ff416c]/30 text-[#ff416c]'
                } flex items-center justify-center shrink-0`}
              >
                {annualNetGain >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
              </div>
            </div>
            <div
              className={`font-orbitron text-xl sm:text-2xl font-black tracking-tight ${
                annualNetGain >= 0 ? 'text-emerald-400' : 'text-[#ff416c]'
              }`}
            >
              {annualNetGain >= 0
                ? `+৳ ${annualNetGain.toLocaleString()}`
                : `-৳ ${Math.abs(annualNetGain).toLocaleString()}`}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between border-t border-white/5 pt-1.5">
              <span>
                {annualNetGain >= 0
                  ? 'কোম্পানি ইতিবাচক উদ্বৃত্তে'
                  : 'নগদ খরচ কাজের মূল্যের চেয়ে বেশি'}
              </span>
              <span className="font-sans text-slate-300 font-semibold">
                {annualNetGain >= 0 ? 'সাশ্রয়' : 'ঘাটতি'}
              </span>
            </div>
          </div>

          {/* 4. Expenditure Ratio & Peak Month */}
          <div className="p-4 rounded-xl bg-black/40 border border-purple-500/30 hover:border-purple-500/60 transition-all relative overflow-hidden group">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>ব্যয় অনুপাত ও বিশ্লেষণ</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  মোট কাজের মূল্যের বিপরীতে নগদ ব্যয়
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="font-orbitron text-xl sm:text-2xl font-black text-purple-300 tracking-tight">
              {expenditureRatio.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between border-t border-white/5 pt-1.5">
              <span>শীর্ষ ব্যয়:</span>
              <span className="font-semibold text-purple-200">
                {peakExpenditureMonth
                  ? `${peakExpenditureMonth.monthName} (৳${peakExpenditureMonth.totalPaidAll.toLocaleString()})`
                  : 'সমান বণ্টন'}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Trend Line Section */}
        {!isProfitLossCollapsed && (
          <div className="pt-2 border-t border-white/10 relative z-10">
            {/* Chart Toolbar Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#00f2fe]" />
                  <span>মাসিক ট্রেন্ড লাইন (Monthly Trend Line):</span>
                </span>
                <span className="text-[11px] text-slate-500 hidden md:inline">
                  {effectiveYear} সালের ১২ মাসের ধারাবাহিক লাভ-ক্ষতি ও ব্যয় চিত্র
                </span>
              </div>

              {/* Metric filter pills & Active month toggle */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Metric filter buttons */}
                <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setTrendMetric('all')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                      trendMetric === 'all'
                        ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    সকল ট্রেন্ড
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendMetric('comparison')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                      trendMetric === 'comparison'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ব্যয় বনাম মূল্য
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendMetric('net')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                      trendMetric === 'net'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    নিট লাভ
                  </button>
                </div>

                {/* Active Months Toggle */}
                {activeMonthsCount > 0 && activeMonthsCount < 12 && (
                  <button
                    type="button"
                    onClick={() => setShowActiveMonthsOnly(!showActiveMonthsOnly)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-all cursor-pointer font-medium ${
                      showActiveMonthsOnly
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {showActiveMonthsOnly
                      ? `সক্রিয় ${activeMonthsCount} মাস`
                      : '১২ মাস ধারাবাহিক'}
                  </button>
                )}
              </div>
            </div>

            {/* Recharts Area/Line Chart */}
            {chartData.length > 0 ? (
              <div className="w-full h-64 sm:h-72 bg-black/25 rounded-xl border border-white/5 p-2 pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="plExpGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff416c" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#ff416c" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="plEarnedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="plNetGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38ef7d" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#38ef7d" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255, 255, 255, 0.08)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="shortName"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      tickFormatter={(val) =>
                        `৳${Math.abs(val) >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                      }
                    />
                    <Tooltip content={<CustomProfitLossTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
                    />

                    {/* 1. Expenditure Trend Area */}
                    {(trendMetric === 'all' || trendMetric === 'comparison') && (
                      <Area
                        type="monotone"
                        dataKey="expenditure"
                        stroke="#ff416c"
                        strokeWidth={2.5}
                        fill="url(#plExpGradient)"
                        name="কোম্পানি ব্যয় (Expenditure)"
                        dot={{
                          r: 3,
                          fill: '#ff416c',
                          strokeWidth: 1.5,
                          stroke: '#070e24',
                        }}
                        activeDot={{
                          r: 6,
                          fill: '#ff416c',
                          stroke: '#fff',
                          strokeWidth: 2,
                        }}
                      />
                    )}

                    {/* 2. Earned Production Value Trend Area */}
                    {(trendMetric === 'all' || trendMetric === 'comparison') && (
                      <Area
                        type="monotone"
                        dataKey="earned"
                        stroke="#00f2fe"
                        strokeWidth={2.5}
                        fill="url(#plEarnedGradient)"
                        name="কাজের শ্রমমূল্য (Labor Value)"
                        dot={{
                          r: 3,
                          fill: '#00f2fe',
                          strokeWidth: 1.5,
                          stroke: '#070e24',
                        }}
                        activeDot={{
                          r: 6,
                          fill: '#00f2fe',
                          stroke: '#fff',
                          strokeWidth: 2,
                        }}
                      />
                    )}

                    {/* 3. Net Gain / Margin Trend Area */}
                    {(trendMetric === 'all' || trendMetric === 'net') && (
                      <Area
                        type="monotone"
                        dataKey="netGain"
                        stroke="#38ef7d"
                        strokeWidth={2.5}
                        strokeDasharray={trendMetric === 'all' ? '4 4' : undefined}
                        fill="url(#plNetGradient)"
                        name="নিট লাভ/ব্যালেন্স (Net Position)"
                        dot={{
                          r: 3.5,
                          fill: '#38ef7d',
                          strokeWidth: 1.5,
                          stroke: '#070e24',
                        }}
                        activeDot={{
                          r: 6,
                          fill: '#38ef7d',
                          stroke: '#fff',
                          strokeWidth: 2,
                        }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs bg-black/20 rounded-xl border border-white/5">
                নির্বাচিত বছরে প্রদর্শনের জন্য কোনো মাসিক লেনদেন পাওয়া যায়নি।
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid of 4 Detailed Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. মোট লেবার */}
        <div
          id="stat-card-workers"
          className="glass-panel p-5 flex items-center gap-4 relative overflow-hidden group hover:border-[#00f2fe]/60 transition-all"
        >
          <div className="w-13 h-13 rounded-2xl bg-[#00f2fe]/10 border border-[#00f2fe]/30 flex items-center justify-center text-[#00f2fe] shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">
              মোট লেবার
            </h3>
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {totalWorkers}
              <span className="text-xs font-normal text-slate-400 ml-1.5 font-sans">জন</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              মোট হাজিরা: <span className="text-cyan-300 font-semibold">{totalWorkDays} দিন</span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-[#00f2fe]/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* 2. মোট কোম্পানি পাওনা */}
        <div
          id="stat-card-claim"
          className="glass-panel p-5 flex items-center gap-4 relative overflow-hidden group hover:border-[#ff416c]/60 transition-all border-[#ff416c]/30"
        >
          <div className="w-13 h-13 rounded-2xl bg-[#ff416c]/15 border border-[#ff416c]/40 flex items-center justify-center text-[#ff416c] shrink-0 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(255,65,108,0.2)]">
            <HandCoins className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-300 mb-1 flex items-center gap-1.5">
              মোট কোম্পানি পাওনা
              <span className="inline-block w-2 h-2 rounded-full bg-[#ff416c] animate-pulse" />
            </h3>
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-[#ff416c] tracking-tight drop-shadow-[0_0_10px_rgba(255,65,108,0.4)]">
              ৳ {totalCompanyClaim.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {companyClaimCount} জনের থেকে ফেরত পাবেন
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-[#ff416c]/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* 3. মোট লেবার পাওনা */}
        <div
          id="stat-card-due"
          className="glass-panel p-5 flex items-center gap-4 relative overflow-hidden group hover:border-[#00f2fe]/60 transition-all border-[#00f2fe]/30"
        >
          <div className="w-13 h-13 rounded-2xl bg-[#00f2fe]/15 border border-[#00f2fe]/40 flex items-center justify-center text-[#00f2fe] shrink-0 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,242,254,0.2)]">
            <Wallet className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-300 mb-1">
              মোট লেবার পাওনা
            </h3>
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-[#00f2fe] tracking-tight drop-shadow-[0_0_10px_rgba(0,242,254,0.4)]">
              ৳ {totalLaborDue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {laborDueCount} জনের বকেয়া মজুরি
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-[#00f2fe]/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* 4. মোট অ্যাডভান্স দেওয়া */}
        <div
          id="stat-card-advance"
          className="glass-panel p-5 flex items-center gap-4 relative overflow-hidden group hover:border-[#4facfe]/60 transition-all"
        >
          <div className="w-13 h-13 rounded-2xl bg-[#4facfe]/15 border border-[#4facfe]/30 flex items-center justify-center text-[#4facfe] shrink-0 group-hover:scale-105 transition-transform">
            <Receipt className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">
              মোট অ্যাডভান্স দেওয়া
            </h3>
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ৳ {overallAdvance.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              পরিশোধিত মজুরি: <span className="text-slate-300">৳ {totalWagesPaid.toLocaleString()}</span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-[#4facfe]/10 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

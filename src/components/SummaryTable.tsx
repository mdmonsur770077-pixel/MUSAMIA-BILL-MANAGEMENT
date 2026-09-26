import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Trash2,
  Eye,
  PlusCircle,
  Edit2,
  CheckCircle2,
  Users,
  LayoutGrid,
  Table as TableIcon,
  Phone,
  Calendar,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  Banknote,
  Download,
  X,
  Briefcase,
} from 'lucide-react';
import { WorkerSummary } from '../types';
import { roundMoney } from '../utils/dateHelpers';

interface SummaryTableProps {
  summaries: WorkerSummary[];
  periodLabel?: string;
  onDeleteWorker: (workerId: string) => void;
  onOpenWorkerDetails: (workerId: string) => void;
  onQuickAddRecord: (workerId: string) => void;
  onEditWorker: (workerId: string) => void;
  onExportCsv: () => void;
  onPrintLedger: () => void;
  onDownloadBackup?: () => void;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  summaries,
  periodLabel,
  onDeleteWorker,
  onOpenWorkerDetails,
  onQuickAddRecord,
  onEditWorker,
  onExportCsv,
  onPrintLedger,
  onDownloadBackup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'claim' | 'due' | 'settled'>('all');
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');

  // Unique available trades from the current workers list
  const availableTrades = useMemo(() => {
    const tradeSet = new Set<string>();
    summaries.forEach((s) => {
      if (s.worker.trade && s.worker.trade.trim()) {
        tradeSet.add(s.worker.trade.trim());
      }
    });
    return Array.from(tradeSet);
  }, [summaries]);

  // Filter and search by name or trade
  const filteredSummaries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return summaries.filter((s) => {
      const matchesName = s.worker.name.toLowerCase().includes(query);
      const matchesTrade = Boolean(s.worker.trade && s.worker.trade.toLowerCase().includes(query));
      const matchesPhone = Boolean(s.worker.phone && s.worker.phone.includes(query));
      const matchesSearch = !query || matchesName || matchesTrade || matchesPhone;

      const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [summaries, searchQuery, filterStatus]);

  // Aggregate stats for current view - কাকে কত টাকা দিলাম ও কত টাকা পাব এর সর্বমোট হিসাব
  const aggregate = useMemo(() => {
    let days = 0;
    let earned = 0;
    let paid = 0;
    let advance = 0;
    let claim = 0;
    let claimCount = 0;
    let due = 0;
    let dueCount = 0;
    let settledCount = 0;

    filteredSummaries.forEach((s) => {
      days = roundMoney(days + s.totalDays);
      earned = roundMoney(earned + s.totalEarned);
      paid = roundMoney(paid + s.totalPaid);
      advance = roundMoney(advance + s.totalAdvance);

      if (s.status === 'claim') {
        claim = roundMoney(claim + Math.abs(s.balance));
        claimCount += 1;
      } else if (s.status === 'due') {
        due = roundMoney(due + s.balance);
        dueCount += 1;
      } else {
        settledCount += 1;
      }
    });

    const totalGiven = roundMoney(paid + advance); // কাকে কত টাকা দিলাম (পরিশোধ + অগ্রিম)
    let netBalance = roundMoney(claim - due); // ধনাত্মক = কোম্পানি ফেরত পাবে, ঋণাত্মক = লেবাররা পাবে
    if (Math.abs(netBalance) < 0.01) netBalance = 0;

    return {
      days,
      earned,
      paid,
      advance,
      totalGiven,
      claim,
      claimCount,
      due,
      dueCount,
      settledCount,
      netBalance,
    };
  }, [filteredSummaries]);

  return (
    <div className="glass-panel p-6">
      {/* Printable Letterhead Header (Only displays during print) */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-3 text-slate-900">
        <h1 className="text-xl font-bold text-slate-900">মনসুর লেবার পোর্টাল — সার্বিক লেবার লেজার ও ব্যালেন্স অডিট</h1>
        <div className="flex justify-between items-center text-xs text-slate-700 mt-1">
          <span>রিপোর্ট সময়কাল: {periodLabel || 'সার্বিক হিসাব'}</span>
          <span>মোট শ্রমিক: {filteredSummaries.length} জন</span>
          <span>প্রিন্টের তারিখ: {new Date().toLocaleDateString('bn-BD')}</span>
        </div>
      </div>

      {/* Top Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00f2fe]/15 border border-[#00f2fe]/30 flex items-center justify-center text-[#00f2fe]">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#00f2fe] flex flex-wrap items-center gap-2">
              <span>ব্যালেন্স অডিট ও লেবার লেজার</span>
              {periodLabel && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {periodLabel}
                </span>
              )}
              <span className="text-xs font-normal text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                {summaries.length} জন
              </span>
            </h2>
            <p className="text-xs text-slate-400">প্রতিটি শ্রমিকের হাজিরা, আয়, মজুরি পরিশোধ ও বকেয়া/অগ্রিমের হিসাব</p>
          </div>
        </div>

        {/* Toolbar: CSV, Print, Backup */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-slate-200 transition-colors cursor-pointer"
            title="CSV এক্সেল ফাইল ডাউনলোড করুন"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>এক্সপোর্ট</span>
          </button>

          <button
            onClick={onPrintLedger}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-slate-200 transition-colors cursor-pointer"
            title="প্রিন্ট বা PDF সেভ করুন"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>প্রিন্ট</span>
          </button>

          {onDownloadBackup && (
            <button
              onClick={onDownloadBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00f2fe]/10 hover:bg-[#00f2fe]/20 border border-[#00f2fe]/30 text-xs text-[#00f2fe] font-semibold transition-colors cursor-pointer shadow-[0_0_12px_rgba(0,242,254,0.15)]"
              title="শ্রমিক ও সমস্ত লেনদেনের সম্পূর্ণ ডাটা JSON ফাইল হিসেবে ব্যাকআপ ডাউনলোড করুন"
              id="summary-table-backup-btn"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ব্যাকআপ JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* Worker List Section Header & Search Controls */}
      <div id="worker-list-section" className="mb-4 no-print space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>শ্রমিক তালিকা ও রিয়েল-টাইম অনুসন্ধান (Worker List)</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              নাম বা পদবি/ট্রেড দিয়ে খুঁজুন
            </span>
          </div>
          <div className="text-[11px] text-cyan-300 font-orbitron">
            দেখাচ্ছে: {filteredSummaries.length} / {summaries.length}
          </div>
        </div>

        {/* Real-time Search Input Field */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00f2fe] pointer-events-none flex items-center">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            id="worker-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="লেবারের নাম অথবা ট্রেড/পদবি দিয়ে রিয়েল-টাইম খুঁজুন (যেমন: রহিম, রাজমিস্ত্রি, ঢালাই, হেল্পার)..."
            className="w-full pl-10 pr-28 py-2.5 rounded-xl bg-[#0a0f24]/90 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#00f2fe] focus:ring-2 focus:ring-[#00f2fe]/30 transition-all shadow-inner"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="অনুসন্ধান ক্লিয়ার করুন"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">মুছুন</span>
              </button>
            )}
            <span className="text-[11px] font-orbitron px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-300">
              {filteredSummaries.length}/{summaries.length}
            </span>
          </div>
        </div>

        {/* Quick Trade Filter Badges */}
        {availableTrades.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-0.5">
            <span className="text-slate-400 shrink-0 flex items-center gap-1 text-[11px] pr-1">
              <Briefcase className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>ট্রেড ফিল্টার:</span>
            </span>
            {availableTrades.map((trade) => {
              const isActive = searchQuery.toLowerCase() === trade.toLowerCase();
              return (
                <button
                  key={trade}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      setSearchQuery('');
                    } else {
                      setSearchQuery(trade);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs transition-all shrink-0 cursor-pointer font-medium ${
                    isActive
                      ? 'bg-[#00f2fe]/25 text-[#00f2fe] border-[#00f2fe] shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                  title={`ট্রেড "${trade}" অনুযায়ী ফিল্টার করুন`}
                >
                  {trade}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter Tabs & Mobile View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 no-print">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              filterStatus === 'all'
                ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/40 font-semibold'
                : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            সব লেবার ({summaries.length})
          </button>

          <button
            onClick={() => setFilterStatus('claim')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
              filterStatus === 'claim'
                ? 'bg-[#ff416c]/20 text-[#ff416c] border border-[#ff416c]/50 font-semibold shadow-[0_0_10px_rgba(255,65,108,0.2)]'
                : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#ff416c]" />
            <span>আপনি পাবেন ({summaries.filter((s) => s.status === 'claim').length})</span>
          </button>

          <button
            onClick={() => setFilterStatus('due')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
              filterStatus === 'due'
                ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/40 font-semibold'
                : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#00f2fe]" />
            <span>লেবার পাবে ({summaries.filter((s) => s.status === 'due').length})</span>
          </button>

          <button
            onClick={() => setFilterStatus('settled')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
              filterStatus === 'settled'
                ? 'bg-slate-700 text-white border border-slate-500 font-semibold'
                : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>পরিশোধিত ({summaries.filter((s) => s.status === 'settled').length})</span>
          </button>
        </div>

        {/* Mobile View Mode Switcher (Card vs Table) */}
        <div className="flex sm:hidden items-center self-end bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setMobileViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-semibold ${
              mobileViewMode === 'cards'
                ? 'bg-[#00f2fe] text-[#050814] shadow-[0_0_10px_rgba(0,242,254,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>কার্ড ভিউ</span>
          </button>
          <button
            onClick={() => setMobileViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-semibold ${
              mobileViewMode === 'table'
                ? 'bg-[#00f2fe] text-[#050814] shadow-[0_0_10px_rgba(0,242,254,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>টেবিল ভিউ</span>
          </button>
        </div>
      </div>

      {/* Active Search / Filter Indicator */}
      {(searchQuery.trim() || filterStatus !== 'all') && (
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-lg bg-cyan-950/40 border border-[#00f2fe]/25 text-xs">
          <div className="flex items-center gap-2 text-cyan-200">
            <Search className="w-3.5 h-3.5 text-[#00f2fe] shrink-0" />
            <span>
              {searchQuery.trim() ? (
                <>
                  <strong className="text-[#00f2fe]">"{searchQuery}"</strong> দিয়ে খোঁজা হচ্ছে —{' '}
                </>
              ) : null}
              {filteredSummaries.length > 0 ? (
                <span className="font-semibold text-white">
                  {filteredSummaries.length} জন লেবার পাওয়া গেছে (মোট {summaries.length} জনের মধ্যে)
                </span>
              ) : (
                <span className="text-amber-300 font-semibold">কোনো লেবার খুঁজে পাওয়া যায়নি</span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
            }}
            className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors border border-white/15 cursor-pointer font-medium"
          >
            <X className="w-3 h-3" />
            <span>ফিল্টার রিসেট</span>
          </button>
        </div>
      )}

      {/* MOBILE CARD VIEW (Active on small screens when in card mode) */}
      {mobileViewMode === 'cards' && (
        <div className="block sm:hidden space-y-3.5 mb-4">
          {filteredSummaries.length === 0 ? (
            <div className="py-10 text-center text-slate-400 glass-panel p-5">
              <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm">কোনো লেবারের রেকর্ড পাওয়া যায়নি।</p>
              {(searchQuery || filterStatus !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30 text-xs font-semibold hover:bg-[#00f2fe]/25 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>অনুসন্ধান রিসেট করুন</span>
                </button>
              )}
            </div>
          ) : (
            filteredSummaries.map((s) => {
              const isClaim = s.status === 'claim';
              const isDue = s.status === 'due';
              const claimAmt = Math.abs(s.balance);

              return (
                <div
                  key={s.worker.id}
                  onClick={() => onOpenWorkerDetails(s.worker.id)}
                  className="glass-panel p-4 border border-white/15 hover:border-[#00f2fe]/50 transition-all rounded-2xl bg-[#080d20]/90 cursor-pointer active:scale-[0.99]"
                  title="ক্লিক করে এই লেবারের প্রোফাইল ও বিস্তারিত লেনদেন দেখুন"
                >
                  {/* Card Header: Avatar, Name, Trade & Phone */}
                  <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00f2fe]/20 to-[#4facfe]/10 border border-[#00f2fe]/40 flex items-center justify-center text-base font-bold text-[#00f2fe] font-orbitron shrink-0">
                        {s.worker.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-1.5">
                          <span>{s.worker.name}</span>
                          <span className="text-[10px] text-[#00f2fe] font-normal font-sans border border-[#00f2fe]/30 px-1.5 py-0.2 rounded bg-[#00f2fe]/10">প্রোফাইল</span>
                        </h3>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          {s.worker.trade && (
                            <span className="text-[#00f2fe] font-medium">{s.worker.trade}</span>
                          )}
                          {s.worker.phone && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Phone className="w-3 h-3 text-cyan-400" />
                              {s.worker.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] uppercase text-slate-400 font-semibold">দৈনিক রেট</div>
                      <div className="font-orbitron font-bold text-sm text-[#00f2fe]">
                        ৳{s.worker.dailyWage}
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-b border-white/10 text-center">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[11px] text-slate-400">হাজিরা দিন</div>
                      <div className="font-orbitron font-bold text-sm text-cyan-300">
                        {s.totalDays} <span className="text-[10px] font-sans">দিন</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        আয়: ৳{s.totalEarned.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[11px] text-slate-400">পরিশোধ</div>
                      <div className="font-orbitron font-bold text-sm text-slate-200">
                        ৳{s.totalPaid.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">মজুরি দেওয়া</div>
                    </div>

                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <div className="text-[11px] text-[#ff416c]">অ্যাডভান্স</div>
                      <div className="font-orbitron font-bold text-sm text-[#ff416c]">
                        ৳{s.totalAdvance.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-red-300 mt-0.5">অগ্রিম গ্রহণ</div>
                    </div>
                  </div>

                  {/* Balance Status Banner */}
                  <div className="pt-3 pb-3 flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-medium">বর্তমান স্থিতি:</span>
                    {isClaim && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ff416c]/20 border border-[#ff416c] text-[#ff416c] shadow-[0_0_12px_rgba(255,65,108,0.3)]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>আপনি পাবেন: ৳{claimAmt.toLocaleString()}</span>
                      </span>
                    )}

                    {isDue && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00f2fe]/20 border border-[#00f2fe] text-[#00f2fe] shadow-[0_0_12px_rgba(0,242,254,0.3)]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>লেবার পাবে: ৳{s.balance.toLocaleString()}</span>
                      </span>
                    )}

                    {!isClaim && !isDue && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-slate-300">
                        <span>পরিশোধিত (৳ 0)</span>
                      </span>
                    )}
                  </div>

                  {/* Action Buttons (Touch Target ≥ 44px) */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenWorkerDetails(s.worker.id);
                      }}
                      className="col-span-2 py-2.5 px-3 rounded-xl bg-[#00f2fe]/20 hover:bg-[#00f2fe]/30 border border-[#00f2fe]/50 text-[#00f2fe] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all min-h-[44px]"
                    >
                      <Eye className="w-4 h-4" />
                      <span>প্রোফাইল ও লেনদেন</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAddRecord(s.worker.id);
                      }}
                      className="py-2.5 px-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all min-h-[44px]"
                      title="দ্রুত হাজিরা বা টাকা এন্ট্রি দিন"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>এন্ট্রি</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditWorker(s.worker.id);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all min-h-[44px]"
                        title="এডিট"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`আপনি কি নিশ্চিত যে "${s.worker.name}"-কে তালিকা থেকে মুছে ফেলতে চান?`)) {
                            onDeleteWorker(s.worker.id);
                          }
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/15 text-red-400 flex items-center justify-center cursor-pointer active:scale-95 transition-all min-h-[44px]"
                        title="ডিলিট"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table Container (Visible on Desktop OR when table mode is chosen on Mobile) */}
      <div className={`${mobileViewMode === 'cards' ? 'hidden sm:block' : 'block'} overflow-x-auto rounded-xl border border-white/10 bg-[#080d1e]/60`}>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#00f2fe]/8 text-[#00f2fe] border-b border-white/10">
              <th className="py-3 px-4 text-left font-bold text-xs uppercase tracking-wider">লেবারের নাম</th>
              <th className="py-3 px-4 text-center font-bold text-xs uppercase tracking-wider">রেট/দিন</th>
              <th className="py-3 px-4 text-center font-bold text-xs uppercase tracking-wider">মোট দিন</th>
              <th className="py-3 px-4 text-right font-bold text-xs uppercase tracking-wider">অর্জিত আয়</th>
              <th className="py-3 px-4 text-right font-bold text-xs uppercase tracking-wider">পরিশোধিত মজুরি</th>
              <th className="py-3 px-4 text-right font-bold text-xs uppercase tracking-wider text-[#ff416c]">মোট অ্যাডভান্স</th>
              <th className="py-3 px-4 text-center font-bold text-xs uppercase tracking-wider">বর্তমান স্থিতি ও ব্যালেন্স</th>
              <th className="py-3 px-4 text-center font-bold text-xs uppercase tracking-wider">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredSummaries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="w-8 h-8 text-slate-500" />
                    <p className="text-sm">কোনো লেবারের রেকর্ড পাওয়া যায়নি।</p>
                    {(searchQuery || filterStatus !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterStatus('all');
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30 text-xs font-semibold hover:bg-[#00f2fe]/25 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>অনুসন্ধান ও ফিল্টার রিসেট করুন</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredSummaries.map((s) => {
                const isClaim = s.status === 'claim';
                const isDue = s.status === 'due';
                const claimAmt = Math.abs(s.balance);

                return (
                  <tr
                    key={s.worker.id}
                    onClick={() => onOpenWorkerDetails(s.worker.id)}
                    className="hover:bg-[#00f2fe]/[0.08] transition-colors group cursor-pointer"
                    title="ক্লিক করে এই লেবারের পূর্ণাঙ্গ লেনদেন খতিয়ান ও প্রোফাইল দেখুন"
                  >
                    {/* লেবারের নাম ও ট্রেড */}
                    <td className="py-3.5 px-4 text-left">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f2fe]/20 to-[#4facfe]/10 border border-[#00f2fe]/30 flex items-center justify-center text-xs font-bold text-[#00f2fe] shrink-0 font-orbitron">
                          {s.worker.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-[#00f2fe] transition-colors flex items-center gap-1.5">
                            <span>{s.worker.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            {s.worker.trade && <span className="text-cyan-300/80">{s.worker.trade}</span>}
                            {s.worker.trade && s.worker.phone && <span>•</span>}
                            {s.worker.phone && <span>{s.worker.phone}</span>}
                          </div>
                          <div className="text-[10px] text-cyan-300/70 group-hover:text-[#00f2fe] flex items-center gap-1 mt-0.5 font-medium transition-colors">
                            <Eye className="w-3 h-3" />
                            <span>প্রোফাইল ও লেনদেন দেখুন</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* রেট/দিন */}
                    <td className="py-3.5 px-4 text-center text-slate-300 font-orbitron">
                      ৳{s.worker.dailyWage}
                    </td>

                    {/* মোট দিন */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-cyan-200">
                        {s.totalDays} দিন
                      </span>
                    </td>

                    {/* অর্জিত আয় */}
                    <td className="py-3.5 px-4 text-right font-medium text-white font-orbitron">
                      ৳{s.totalEarned.toLocaleString()}
                    </td>

                    {/* পরিশোধিত মজুরি */}
                    <td className="py-3.5 px-4 text-right text-slate-300 font-orbitron">
                      ৳{s.totalPaid.toLocaleString()}
                    </td>

                    {/* মোট অ্যাডভান্স */}
                    <td className="py-3.5 px-4 text-right font-orbitron font-semibold text-[#ff416c]">
                      ৳{s.totalAdvance.toLocaleString()}
                    </td>

                    {/* বর্তমান স্থিতি ও ব্যালেন্স ব্যাজ */}
                    <td className="py-3.5 px-4 text-center">
                      {isClaim && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ff416c]/15 border border-[#ff416c] text-[#ff416c] shadow-[0_0_12px_rgba(255,65,108,0.25)]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>আপনি পাবেন: ৳{claimAmt.toLocaleString()}</span>
                        </span>
                      )}

                      {isDue && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00f2fe]/15 border border-[#00f2fe] text-[#00f2fe] shadow-[0_0_12px_rgba(0,242,254,0.2)]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>লেবার পাবে: ৳{s.balance.toLocaleString()}</span>
                        </span>
                      )}

                      {!isClaim && !isDue && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-slate-300">
                          <span>পরিশোধিত (৳ 0)</span>
                        </span>
                      )}
                    </td>

                    {/* অ্যাকশন বাটনসমূহ */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenWorkerDetails(s.worker.id);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#00f2fe]/15 hover:bg-[#00f2fe]/30 border border-[#00f2fe]/40 text-[#00f2fe] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,242,254,0.15)] active:scale-95"
                          title="এই লেবারের প্রোফাইলে ঢুকুন ও সকল লেনদেন দেখুন"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>প্রোফাইল</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickAddRecord(s.worker.id);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-cyan-300 transition-colors cursor-pointer"
                          title="এই লেবারের জন্য দ্রুত এন্ট্রি দিন"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditWorker(s.worker.id);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-amber-300 transition-colors cursor-pointer"
                          title="লেবারের তথ্য ও রেট এডিট করুন"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`আপনি কি নিশ্চিত যে "${s.worker.name}"-কে তালিকা থেকে মুছে ফেলতে চান?`)) {
                              onDeleteWorker(s.worker.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-[#ff416c]/15 hover:bg-[#ff416c] border border-[#ff416c]/40 text-[#ff416c] hover:text-white transition-colors cursor-pointer"
                          title="লেবার ও সকল রেকর্ড ডিলিট করুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer with View Totals */}
          {filteredSummaries.length > 0 && (
            <tfoot className="bg-[#0b1329] font-semibold text-xs border-t-2 border-white/20 text-slate-300">
              {/* রো ১: কলামভিত্তিক মোট হিসাব */}
              <tr className="border-b border-white/10">
                <td className="py-3.5 px-4 text-left font-bold text-white">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#00f2fe]" />
                    <span>ফিল্টারকৃত মোট ({filteredSummaries.length} জন)</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center text-slate-400">-</td>
                <td className="py-3.5 px-4 text-center font-orbitron text-cyan-300 font-bold">
                  {aggregate.days} দিন
                </td>
                <td className="py-3.5 px-4 text-right font-orbitron text-white font-bold">
                  ৳{aggregate.earned.toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-right font-orbitron text-emerald-400 font-bold">
                  <span className="text-[10px] text-slate-400 block font-sans font-normal">মোট মজুরি</span>
                  ৳{aggregate.paid.toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-right font-orbitron text-[#ff416c] font-bold">
                  <span className="text-[10px] text-slate-400 block font-sans font-normal">মোট অ্যাডভান্স</span>
                  ৳{aggregate.advance.toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex flex-col gap-1 items-center">
                    <span className="text-[10px] text-slate-400 font-sans font-normal">সামগ্রিক ব্যালেন্স</span>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {aggregate.claim > 0 && (
                        <span className="text-[11px] font-bold text-[#ff416c] bg-[#ff416c]/15 px-2 py-0.5 rounded border border-[#ff416c]/40 whitespace-nowrap">
                          কোম্পানি পাবে: ৳{aggregate.claim.toLocaleString()}
                        </span>
                      )}
                      {aggregate.due > 0 && (
                        <span className="text-[11px] font-bold text-[#00f2fe] bg-[#00f2fe]/15 px-2 py-0.5 rounded border border-[#00f2fe]/40 whitespace-nowrap">
                          লেবার পাবে: ৳{aggregate.due.toLocaleString()}
                        </span>
                      )}
                      {aggregate.claim === 0 && aggregate.due === 0 && (
                        <span className="text-slate-400 text-xs font-normal">পরিশোধিত (৳ 0)</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block font-normal">মোট দেওয়া টাকা</span>
                    <span className="font-orbitron font-bold text-emerald-400 text-xs">
                      ৳{aggregate.totalGiven.toLocaleString()}
                    </span>
                  </div>
                </td>
              </tr>

              {/* রো ২: ডেডিকেটেড সামগ্রিক ব্যালেন্স ফুটার রো */}
              <tr className="bg-gradient-to-r from-[#00f2fe]/10 via-[#4facfe]/10 to-[#ff416c]/10 text-xs font-medium border-t border-white/15">
                <td colSpan={8} className="py-3 px-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Coins className="w-4 h-4 text-[#00f2fe]" />
                      <span>সর্বমোট সারসংক্ষেপ:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* মোট মজুরি */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
                        <span className="text-slate-400">মোট মজুরি:</span>
                        <span className="font-orbitron font-bold text-emerald-400 text-sm">
                          ৳{aggregate.paid.toLocaleString()}
                        </span>
                      </div>

                      {/* মোট অ্যাডভান্স */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
                        <span className="text-slate-400">মোট অ্যাডভান্স:</span>
                        <span className="font-orbitron font-bold text-[#ff416c] text-sm">
                          ৳{aggregate.advance.toLocaleString()}
                        </span>
                      </div>

                      {/* সামগ্রিক ব্যালেন্স (কোম্পানি পাবে ও লেবার পাবে) */}
                      <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg border border-white/15">
                        <span className="text-slate-300 font-semibold">সামগ্রিক ব্যালেন্স:</span>

                        {aggregate.claim > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#ff416c] bg-[#ff416c]/20 px-2.5 py-0.5 rounded border border-[#ff416c]/40">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>কোম্পানি পাবে: ৳{aggregate.claim.toLocaleString()}</span>
                          </span>
                        )}

                        {aggregate.due > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00f2fe] bg-[#00f2fe]/20 px-2.5 py-0.5 rounded border border-[#00f2fe]/40">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>লেবার পাবে: ৳{aggregate.due.toLocaleString()}</span>
                          </span>
                        )}

                        {aggregate.claim === 0 && aggregate.due === 0 && (
                          <span className="text-slate-400 text-xs">সব পরিশোধিত</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ফিল্টারকৃত মোট (${filteredSummaries.length} জন) এর সর্বমোট হিসাব প্যানেল */}
      {filteredSummaries.length > 0 && (
        <div className="mt-6 rounded-2xl bg-gradient-to-b from-[#0e1730] to-[#080d1e] border-2 border-[#00f2fe]/30 p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2fe]/20 to-[#4facfe]/10 border border-[#00f2fe]/40 flex items-center justify-center text-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.2)]">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex flex-wrap items-center gap-2">
                  <span>ফিল্টারকৃত মোট ({filteredSummaries.length} জন) — সর্বমোট হিসাব</span>
                  {periodLabel && (
                    <span className="text-xs font-semibold text-[#00f2fe] bg-[#00f2fe]/10 px-2.5 py-0.5 rounded-full border border-[#00f2fe]/30">
                      {periodLabel}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  কাকে কত টাকা দেওয়া হয়েছে এবং কার কাছে কত টাকা পাওনা বা দাবি রয়েছে তার সর্বমোট চূড়ান্ত খতিয়ান
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block">মোট ফিল্টারকৃত লেবার</span>
              <span className="font-orbitron font-black text-lg text-[#00f2fe]">
                {filteredSummaries.length} জন
              </span>
            </div>
          </div>

          {/* ৪টি মূল মেট্রিক কার্ড */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* ১. কাকে কত টাকা দিলাম */}
            <div className="rounded-xl p-4 bg-white/5 border border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.08)]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  <span>কাকে কত টাকা দিলাম</span>
                </span>
                <span className="text-[10px] text-slate-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  সর্বমোট প্রদান
                </span>
              </div>
              <div className="font-orbitron font-black text-2xl text-emerald-400 tracking-tight">
                ৳{aggregate.totalGiven.toLocaleString()}
              </div>
              <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-slate-300 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">মজুরি পরিশোধ:</span>
                  <span className="font-orbitron font-semibold text-white">৳{aggregate.paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#ff416c]">অগ্রিম প্রদান:</span>
                  <span className="font-orbitron font-semibold text-[#ff416c]">৳{aggregate.advance.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ২. আপনি কত টাকা পাবেন */}
            <div className="rounded-xl p-4 bg-[#ff416c]/8 border border-[#ff416c]/40 shadow-[0_4px_20px_rgba(255,65,108,0.15)]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-[#ff416c] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>কত টাকা পাবেন</span>
                </span>
                <span className="text-[10px] text-[#ff416c] bg-[#ff416c]/15 px-2 py-0.5 rounded border border-[#ff416c]/30 font-bold">
                  কোম্পানি দাবি
                </span>
              </div>
              <div className="font-orbitron font-black text-2xl text-[#ff416c] tracking-tight">
                ৳{aggregate.claim.toLocaleString()}
              </div>
              <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-slate-300">
                {aggregate.claimCount > 0 ? (
                  <span className="text-[#ff416c] font-medium">
                    {aggregate.claimCount} জন লেবারের কাছে মোট এই টাকা পাবেন
                  </span>
                ) : (
                  <span className="text-slate-400">কারো কাছে অগ্রিম পাওনা নেই</span>
                )}
              </div>
            </div>

            {/* ৩. লেবার কত টাকা পাবে */}
            <div className="rounded-xl p-4 bg-[#00f2fe]/8 border border-[#00f2fe]/40 shadow-[0_4px_20px_rgba(0,242,254,0.12)]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-[#00f2fe] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>লেবার কত পাবে</span>
                </span>
                <span className="text-[10px] text-[#00f2fe] bg-[#00f2fe]/15 px-2 py-0.5 rounded border border-[#00f2fe]/30 font-bold">
                  বকেয়া মজুরি
                </span>
              </div>
              <div className="font-orbitron font-black text-2xl text-[#00f2fe] tracking-tight">
                ৳{aggregate.due.toLocaleString()}
              </div>
              <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-slate-300">
                {aggregate.dueCount > 0 ? (
                  <span className="text-cyan-300 font-medium">
                    {aggregate.dueCount} জন লেবারের এই পরিমাণ মজুরি বকেয়া রয়েছে
                  </span>
                ) : (
                  <span className="text-slate-400">কোনো লেবারের বকেয়া নেই</span>
                )}
              </div>
            </div>

            {/* ৪. মোট হাজিরা ও অর্জিত মোট আয় */}
            <div className="rounded-xl p-4 bg-white/5 border border-white/10">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>হাজিরা ও অর্জিত আয়</span>
                </span>
                <span className="text-[10px] text-slate-400 bg-white/10 px-2 py-0.5 rounded">
                  মোট কাজের হিসাব
                </span>
              </div>
              <div className="font-orbitron font-black text-2xl text-white tracking-tight">
                {aggregate.days} <span className="text-sm font-sans font-normal text-slate-400">দিন</span>
              </div>
              <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-slate-300 flex justify-between">
                <span className="text-slate-400">মোট অর্জিত আয়:</span>
                <span className="font-orbitron font-bold text-white">৳{aggregate.earned.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* সার্বিক নিট সমন্বয় ব্যানার */}
          <div className="mt-4 p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00f2fe] animate-pulse" />
              <span className="text-slate-300">
                সার্বিক নিট স্থিতি (Net Balance):
              </span>
              {aggregate.claim > aggregate.due ? (
                <span className="font-bold text-[#ff416c] font-orbitron">
                  কোম্পানি সর্বমোট পাবে: ৳{(aggregate.claim - aggregate.due).toLocaleString()}
                </span>
              ) : aggregate.due > aggregate.claim ? (
                <span className="font-bold text-[#00f2fe] font-orbitron">
                  লেবাররা সর্বমোট পাবে: ৳{(aggregate.due - aggregate.claim).toLocaleString()}
                </span>
              ) : (
                <span className="font-bold text-slate-300">
                  উভয় হিসাব সমতায় রয়েছে (৳ 0)
                </span>
              )}
            </div>

            <div className="text-slate-400 text-[11px]">
              {aggregate.settledCount > 0 && (
                <span>• {aggregate.settledCount} জনের হিসাব সম্পূর্ণ পরিশোধিত</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

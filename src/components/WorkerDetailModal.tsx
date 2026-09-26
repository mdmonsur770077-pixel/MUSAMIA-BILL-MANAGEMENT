import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  X,
  Calendar,
  Trash2,
  Plus,
  Printer,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Phone,
  CalendarDays,
  Edit2,
  Save,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  Wallet,
  Coins,
  Receipt,
  ArrowUpDown,
  History,
  TrendingUp,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { Worker, WorkRecord, WorkerSummary } from '../types';
import {
  parseDate,
  getMonthNameBangla,
  toBanglaNumber,
  parseBanglaOrEnglishNumber,
  roundMoney,
} from '../utils/dateHelpers';

interface WorkerDetailModalProps {
  summary?: WorkerSummary;
  worker?: Worker;
  records: WorkRecord[];
  allWorkers?: Worker[];
  onSelectWorker?: (workerId: string) => void;
  onClose: () => void;
  onDeleteRecord: (recordId: string) => void;
  onAddRecordForWorker: (record: Omit<WorkRecord, 'id' | 'createdAt'>) => void;
  onUpdateRecord?: (record: WorkRecord) => void;
}

interface ChartItemPayload {
  fullTitle?: string;
  paid?: number;
  advance?: number;
  earned?: number;
  days?: number;
  balance?: number;
  note?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
    payload: ChartItemPayload;
  }>;
  label?: string;
}

const CustomChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-[#0b1329]/95 border border-[#00f2fe]/40 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px] z-50">
        <div className="font-bold text-white border-b border-white/10 pb-1 flex items-center justify-between gap-3">
          <span>{item.fullTitle || label}</span>
          {item.days !== undefined && item.days > 0 && (
            <span className="text-[10px] text-cyan-300 font-normal">হাজিরা: {item.days} দিন</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 text-cyan-300 font-semibold font-orbitron">
          <span className="flex items-center gap-1.5 font-sans font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#00f2fe]" />
            মজুরি পরিশোধ:
          </span>
          <span>৳{Number(item.paid || 0).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[#ff416c] font-semibold font-orbitron">
          <span className="flex items-center gap-1.5 font-sans font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#ff416c]" />
            অগ্রিম গ্রহণ:
          </span>
          <span>৳{Number(item.advance || 0).toLocaleString()}</span>
        </div>
        {item.earned !== undefined && item.earned > 0 && (
          <div className="flex items-center justify-between gap-3 text-emerald-400 font-semibold font-orbitron border-t border-white/10 pt-1">
            <span className="flex items-center gap-1.5 font-sans font-medium text-slate-400">
              <span className="w-2 h-2 rounded-full bg-[#38ef7d]" />
              অর্জিত আয়:
            </span>
            <span>৳{Number(item.earned || 0).toLocaleString()}</span>
          </div>
        )}
        {item.note && (
          <div className="text-[10px] text-slate-400 italic border-t border-white/10 pt-1">
            নোট: {item.note}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const WorkerDetailModal: React.FC<WorkerDetailModalProps> = ({
  summary,
  worker: propWorker,
  records,
  allWorkers = [],
  onSelectWorker,
  onClose,
  onDeleteRecord,
  onAddRecordForWorker,
  onUpdateRecord,
}) => {
  // Determine active worker
  const activeWorker: Worker =
    propWorker || summary?.worker || (allWorkers.length > 0 ? allWorkers[0] : ({} as Worker));

  // Worker navigation index
  const currentIndex = allWorkers.findIndex((w) => w.id === activeWorker.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allWorkers.length - 1;

  const handlePrevWorker = () => {
    if (hasPrev && onSelectWorker) {
      onSelectWorker(allWorkers[currentIndex - 1].id);
    }
  };

  const handleNextWorker = () => {
    if (hasNext && onSelectWorker) {
      onSelectWorker(allWorkers[currentIndex + 1].id);
    }
  };

  // Quick form within modal
  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState('1');
  const [paid, setPaid] = useState('0');
  const [advance, setAdvance] = useState('0');
  const [note, setNote] = useState('');

  // Search and filters for history of daily records
  const [recordSearch, setRecordSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [transactionType, setTransactionType] = useState<
    'all' | 'work' | 'paid' | 'advance' | 'note'
  >('all');

  // Editing existing record
  const [editingRecord, setEditingRecord] = useState<WorkRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editDays, setEditDays] = useState('1');
  const [editPaid, setEditPaid] = useState('0');
  const [editAdvance, setEditAdvance] = useState('0');
  const [editNote, setEditNote] = useState('');

  const startEdit = (rec: WorkRecord) => {
    setEditingRecord(rec);
    setEditDate(rec.date);
    setEditDays(String(rec.days));
    setEditPaid(String(rec.paid || 0));
    setEditAdvance(String(rec.advance || 0));
    setEditNote(rec.note || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !onUpdateRecord) return;
    const updated: WorkRecord = {
      ...editingRecord,
      date: editDate,
      days: parseBanglaOrEnglishNumber(editDays),
      paid: parseBanglaOrEnglishNumber(editPaid),
      advance: parseBanglaOrEnglishNumber(editAdvance),
      note: editNote.trim() || undefined,
    };
    onUpdateRecord(updated);
    setEditingRecord(null);
  };

  // Month filter within modal ('all' or 'YYYY-MM')
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('all');

  // All records for this worker
  const workerRecords = useMemo(() => {
    return records
      .filter((r) => r.workerId === activeWorker.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, activeWorker.id]);

  // 100% Accurate All-time Lifetime Totals for this worker
  const lifetimeStats = useMemo(() => {
    let totalDays = 0;
    let totalPaid = 0;
    let totalAdvance = 0;

    workerRecords.forEach((r) => {
      totalDays = roundMoney(totalDays + parseBanglaOrEnglishNumber(r.days));
      totalPaid = roundMoney(totalPaid + parseBanglaOrEnglishNumber(r.paid));
      totalAdvance = roundMoney(totalAdvance + parseBanglaOrEnglishNumber(r.advance));
    });

    const wageRate = Number(activeWorker.dailyWage) || 0;
    const totalEarned = roundMoney(totalDays * wageRate);
    const totalGiven = roundMoney(totalPaid + totalAdvance);
    let balance = roundMoney(totalEarned - totalGiven);

    let status: 'claim' | 'due' | 'settled' = 'settled';
    if (Math.abs(balance) < 0.01) {
      balance = 0;
      status = 'settled';
    } else if (balance < 0) {
      status = 'claim';
    } else {
      status = 'due';
    }

    return {
      totalDays,
      totalEarned,
      totalPaid,
      totalAdvance,
      totalGiven,
      balance,
      status,
      count: workerRecords.length,
    };
  }, [workerRecords, activeWorker.dailyWage]);

  // Running balance map computed chronologically (oldest first)
  const chronologicalRunningBalances = useMemo(() => {
    const sortedAsc = [...workerRecords].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let running = 0;
    const map = new Map<string, number>();
    const wage = Number(activeWorker.dailyWage) || 0;

    sortedAsc.forEach((r) => {
      const d = parseBanglaOrEnglishNumber(r.days);
      const p = parseBanglaOrEnglishNumber(r.paid);
      const a = parseBanglaOrEnglishNumber(r.advance);
      const earned = roundMoney(d * wage);
      const totalOut = roundMoney(p + a);
      running = roundMoney(running + earned - totalOut);
      if (Math.abs(running) < 0.01) running = 0;
      map.set(r.id, running);
    });

    return map;
  }, [workerRecords, activeWorker.dailyWage]);

  // Group records by Year-Month
  const groupedByMonth = useMemo(() => {
    const groups: {
      key: string;
      year: number;
      monthIndex: number;
      monthTitle: string;
      records: WorkRecord[];
      subtotalDays: number;
      subtotalEarned: number;
      subtotalPaid: number;
      subtotalAdvance: number;
      subtotalGiven: number;
      subtotalBalance: number;
    }[] = [];

    const map = new Map<string, WorkRecord[]>();

    workerRecords.forEach((r) => {
      const { year, monthIndex } = parseDate(r.date);
      const key = `${year}-${String(monthIndex).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(r);
    });

    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    const wageRate = Number(activeWorker.dailyWage) || 0;

    sortedKeys.forEach((key) => {
      const recs = map.get(key)!;
      const [yStr, mStr] = key.split('-');
      const year = parseInt(yStr, 10);
      const monthIndex = parseInt(mStr, 10);
      const monthTitle = `${getMonthNameBangla(monthIndex)} ${toBanglaNumber(year)}`;

      let subtotalDays = 0;
      let subtotalPaid = 0;
      let subtotalAdvance = 0;

      recs.forEach((r) => {
        subtotalDays = roundMoney(subtotalDays + parseBanglaOrEnglishNumber(r.days));
        subtotalPaid = roundMoney(subtotalPaid + parseBanglaOrEnglishNumber(r.paid));
        subtotalAdvance = roundMoney(subtotalAdvance + parseBanglaOrEnglishNumber(r.advance));
      });

      const subtotalEarned = roundMoney(subtotalDays * wageRate);
      const subtotalGiven = roundMoney(subtotalPaid + subtotalAdvance);
      let subtotalBalance = roundMoney(subtotalEarned - subtotalGiven);
      if (Math.abs(subtotalBalance) < 0.01) subtotalBalance = 0;

      groups.push({
        key,
        year,
        monthIndex,
        monthTitle,
        records: recs,
        subtotalDays,
        subtotalEarned,
        subtotalPaid,
        subtotalAdvance,
        subtotalGiven,
        subtotalBalance,
      });
    });

    return groups;
  }, [workerRecords, activeWorker.dailyWage]);

  // Filtered month groups based on month tab, keyword, exact date, and transaction type
  const displayedGroups = useMemo(() => {
    let list = groupedByMonth;
    if (selectedMonthKey !== 'all') {
      list = list.filter((g) => g.key === selectedMonthKey);
    }

    const q = recordSearch.trim().toLowerCase();
    const hasDateFilter = Boolean(filterDate);
    const hasTypeFilter = transactionType !== 'all';

    if (!q && !hasDateFilter && !hasTypeFilter) {
      return list;
    }

    const wageRate = Number(activeWorker.dailyWage) || 0;

    return list
      .map((g) => {
        const matchingRecords = g.records.filter((r) => {
          // 1. Exact Date Filter (from date picker)
          if (hasDateFilter && r.date !== filterDate) {
            return false;
          }

          // 2. Transaction Type Filter
          if (hasTypeFilter) {
            const daysNum = parseBanglaOrEnglishNumber(r.days);
            const paidAmt = parseBanglaOrEnglishNumber(r.paid);
            const advAmt = parseBanglaOrEnglishNumber(r.advance);

            if (transactionType === 'work' && daysNum <= 0) return false;
            if (transactionType === 'paid' && paidAmt <= 0) return false;
            if (transactionType === 'advance' && advAmt <= 0) return false;
            if (transactionType === 'note' && (!r.note || !r.note.trim())) return false;
          }

          // 3. Keyword / Date query (matches date, note, amounts, or days)
          if (q) {
            const matchesDate = r.date.toLowerCase().includes(q);
            const matchesNote = Boolean(r.note && r.note.toLowerCase().includes(q));
            const matchesPaid = String(r.paid || '').includes(q);
            const matchesAdv = String(r.advance || '').includes(q);
            const matchesDays = String(r.days || '').includes(q);
            return matchesDate || matchesNote || matchesPaid || matchesAdv || matchesDays;
          }

          return true;
        });

        if (matchingRecords.length === 0) {
          return null;
        }

        // Subtotals recalculation for filtered subset
        let subtotalDays = 0;
        let subtotalPaid = 0;
        let subtotalAdvance = 0;

        matchingRecords.forEach((r) => {
          subtotalDays = roundMoney(subtotalDays + parseBanglaOrEnglishNumber(r.days));
          subtotalPaid = roundMoney(subtotalPaid + parseBanglaOrEnglishNumber(r.paid));
          subtotalAdvance = roundMoney(subtotalAdvance + parseBanglaOrEnglishNumber(r.advance));
        });

        const subtotalEarned = roundMoney(subtotalDays * wageRate);
        const subtotalGiven = roundMoney(subtotalPaid + subtotalAdvance);
        let subtotalBalance = roundMoney(subtotalEarned - subtotalGiven);
        if (Math.abs(subtotalBalance) < 0.01) subtotalBalance = 0;

        return {
          ...g,
          records: matchingRecords,
          subtotalDays,
          subtotalEarned,
          subtotalPaid,
          subtotalAdvance,
          subtotalGiven,
          subtotalBalance,
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);
  }, [
    groupedByMonth,
    selectedMonthKey,
    recordSearch,
    filterDate,
    transactionType,
    activeWorker.dailyWage,
  ]);

  // Aggregate count of currently filtered records
  const totalFilteredRecordsCount = useMemo(() => {
    return displayedGroups.reduce((acc, g) => acc + g.records.length, 0);
  }, [displayedGroups]);

  // Is any filter currently applied
  const isFilterActive = Boolean(
    recordSearch.trim() || filterDate || transactionType !== 'all'
  );

  const handleResetFilters = () => {
    setRecordSearch('');
    setFilterDate('');
    setTransactionType('all');
  };

  // Stats for currently selected view (all-time or specific month)
  const activeViewStats = useMemo(() => {
    if (selectedMonthKey === 'all') {
      return lifetimeStats;
    }
    const currentGroup = groupedByMonth.find((g) => g.key === selectedMonthKey);
    if (!currentGroup) return lifetimeStats;

    let status: 'claim' | 'due' | 'settled' = 'settled';
    if (Math.abs(currentGroup.subtotalBalance) < 0.01) {
      status = 'settled';
    } else if (currentGroup.subtotalBalance < 0) {
      status = 'claim';
    } else {
      status = 'due';
    }

    return {
      totalDays: currentGroup.subtotalDays,
      totalEarned: currentGroup.subtotalEarned,
      totalPaid: currentGroup.subtotalPaid,
      totalAdvance: currentGroup.subtotalAdvance,
      totalGiven: currentGroup.subtotalGiven,
      balance: currentGroup.subtotalBalance,
      status,
      count: currentGroup.records.length,
      monthTitle: currentGroup.monthTitle,
    };
  }, [selectedMonthKey, groupedByMonth, lifetimeStats]);

  // Chart section state
  const [showChart, setShowChart] = useState(true);
  const [chartGranularity, setChartGranularity] = useState<'monthly' | 'daily'>('monthly');

  // Recharts Monthly trend data (Chronological order)
  const monthlyChartData = useMemo(() => {
    return [...groupedByMonth]
      .reverse()
      .map((g) => ({
        key: g.key,
        name: `${getMonthNameBangla(g.monthIndex).slice(0, 6)} '${toBanglaNumber(String(g.year).slice(-2))}`,
        fullTitle: `${getMonthNameBangla(g.monthIndex)} ${toBanglaNumber(g.year)}`,
        paid: g.subtotalPaid,
        advance: g.subtotalAdvance,
        earned: g.subtotalEarned,
        totalGiven: g.subtotalGiven,
        balance: g.subtotalBalance,
        days: g.subtotalDays,
      }));
  }, [groupedByMonth]);

  // Recharts Daily trend data (Chronological order)
  const dailyChartData = useMemo(() => {
    const wageRate = Number(activeWorker.dailyWage) || 0;
    return [...workerRecords]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((r) => {
        const daysNum = parseBanglaOrEnglishNumber(r.days);
        const paidAmt = parseBanglaOrEnglishNumber(r.paid);
        const advAmt = parseBanglaOrEnglishNumber(r.advance);
        const earned = roundMoney(daysNum * wageRate);
        const dateParts = r.date.split('-');
        const shortDate = dateParts.length >= 3 ? `${dateParts[2]}/${dateParts[1]}` : r.date;
        return {
          key: r.id,
          name: shortDate,
          fullTitle: `তারিখ: ${r.date}`,
          paid: paidAmt,
          advance: advAmt,
          earned,
          days: daysNum,
          note: r.note || '',
        };
      });
  }, [workerRecords, activeWorker.dailyWage]);

  // Summary statistics for the chart
  const chartStats = useMemo(() => {
    const totalPaid = monthlyChartData.reduce((acc, curr) => roundMoney(acc + curr.paid), 0);
    const totalAdvance = monthlyChartData.reduce((acc, curr) => roundMoney(acc + curr.advance), 0);
    const totalEarned = monthlyChartData.reduce((acc, curr) => roundMoney(acc + curr.earned), 0);
    const monthCount = Math.max(1, monthlyChartData.length);
    const avgMonthlyPaid = roundMoney(totalPaid / monthCount);
    const avgMonthlyAdvance = roundMoney(totalAdvance / monthCount);

    return {
      totalPaid,
      totalAdvance,
      totalEarned,
      avgMonthlyPaid,
      avgMonthlyAdvance,
      monthCount,
    };
  }, [monthlyChartData]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRecordForWorker({
      workerId: activeWorker.id,
      date,
      days: parseBanglaOrEnglishNumber(days),
      paid: parseBanglaOrEnglishNumber(paid),
      advance: parseBanglaOrEnglishNumber(advance),
      note: note.trim() || undefined,
    });
    setPaid('0');
    setAdvance('0');
    setNote('');
    setShowAddForm(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden border border-[#00f2fe]/40 shadow-[0_0_50px_rgba(0,0,0,0.85)] bg-[#070b1b]/95 rounded-2xl">
        {/* Modal Header with Worker Switcher */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col gap-3 bg-white/[0.02]">
          {/* Top Bar: Worker Switcher & Close */}
          <div className="flex items-center justify-between gap-2">
            {/* Quick Navigation Between Workers */}
            {allWorkers.length > 1 && (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrevWorker}
                  disabled={!hasPrev}
                  className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                    hasPrev
                      ? 'bg-white/10 hover:bg-[#00f2fe]/20 text-cyan-300 border-[#00f2fe]/30 cursor-pointer active:scale-95'
                      : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed opacity-50'
                  }`}
                  title="পূর্ববর্তী লেবারের প্রোফাইল"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">আগের লেবার</span>
                </button>

                {/* Worker Dropdown Switcher */}
                {onSelectWorker && (
                  <div className="relative">
                    <select
                      value={activeWorker.id}
                      onChange={(e) => onSelectWorker(e.target.value)}
                      className="px-2 sm:px-3 py-1 text-xs font-semibold rounded-lg bg-[#0d162f] border border-[#00f2fe]/40 text-[#00f2fe] focus:outline-none focus:ring-1 focus:ring-[#00f2fe] cursor-pointer"
                      title="যেকোনো লেবারের প্রোফাইলে সরাসরি যান"
                    >
                      {allWorkers.map((w, idx) => (
                        <option key={w.id} value={w.id} className="bg-[#0b1227] text-white">
                          ({idx + 1}/{allWorkers.length}) {w.name} {w.trade ? `- ${w.trade}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNextWorker}
                  disabled={!hasNext}
                  className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                    hasNext
                      ? 'bg-white/10 hover:bg-[#00f2fe]/20 text-cyan-300 border-[#00f2fe]/30 cursor-pointer active:scale-95'
                      : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed opacity-50'
                  }`}
                  title="পরবর্তী লেবারের প্রোফাইল"
                >
                  <span className="hidden sm:inline">পরের লেবার</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Print & Close */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handlePrint}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="এই শ্রমিকের লেনদেন খতিয়ানের প্রিন্ট কপি নিন"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/15 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                title="প্রোফাইল বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Worker Identity Card */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00f2fe]/25 to-[#4facfe]/15 border border-[#00f2fe]/40 flex items-center justify-center text-xl font-extrabold text-[#00f2fe] font-orbitron shrink-0 shadow-[0_0_15px_rgba(0,242,254,0.25)]">
                {activeWorker.name ? activeWorker.name.charAt(0) : 'W'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                    {activeWorker.name}
                  </h3>
                  {activeWorker.trade && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30 font-medium">
                      {activeWorker.trade}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    লেবার #{currentIndex >= 0 ? currentIndex + 1 : 1}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                  <span>
                    দৈনিক রেট: <strong className="text-[#00f2fe] font-orbitron">৳{activeWorker.dailyWage}</strong>
                  </span>
                  {activeWorker.phone && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Phone className="w-3 h-3 text-[#00f2fe]" /> {activeWorker.phone}
                    </span>
                  )}
                  <span className="text-slate-400">
                    মোট এন্ট্রি: <strong className="text-white">{workerRecords.length} টি</strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#00f2fe]/15 hover:bg-[#00f2fe]/25 border border-[#00f2fe]/40 text-[#00f2fe] text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'ফর্ম বন্ধ' : 'নতুন এন্ট্রি যোগ'}</span>
            </button>
          </div>
        </div>

        {/* 100% Accurate Financial Overview Banner */}
        <div className="bg-black/40 border-b border-white/10 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <History className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>
                {selectedMonthKey === 'all' ? (
                  <strong className="text-[#00f2fe]">সার্বিক সর্বকালীন লেনদেন (All-Time Ledger)</strong>
                ) : (
                  <span>
                    হিসাব সময়কাল: <strong className="text-white">{activeViewStats.monthTitle}</strong>
                  </span>
                )}
              </span>
            </span>
            <span className="text-[11px] text-slate-400">
              {selectedMonthKey !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedMonthKey('all')}
                  className="text-cyan-300 underline hover:text-white"
                >
                  সর্বমোট হিসাব দেখুন
                </button>
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-slate-400 block mb-0.5 text-[11px]">মোট কাজের দিন</span>
              <span className="text-base font-bold font-orbitron text-cyan-300">
                {activeViewStats.totalDays} <span className="text-xs font-sans">দিন</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                রেট: ৳{activeWorker.dailyWage}/দিন
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-slate-400 block mb-0.5 text-[11px]">মোট অর্জিত আয়</span>
              <span className="text-base font-bold font-orbitron text-white">
                ৳{activeViewStats.totalEarned.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                (দিন × দৈনিক রেট)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
              <span className="text-slate-400 block mb-0.5 text-[11px]">পরিশোধ + অগ্রিম</span>
              <span className="text-base font-bold font-orbitron text-slate-200">
                ৳{activeViewStats.totalGiven.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                মজুরি: ৳{activeViewStats.totalPaid} | অগ্রিম: ৳{activeViewStats.totalAdvance}
              </span>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-center ${
                activeViewStats.status === 'claim'
                  ? 'bg-[#ff416c]/15 border-[#ff416c]/50 text-[#ff416c] shadow-[0_0_15px_rgba(255,65,108,0.2)]'
                  : activeViewStats.status === 'due'
                  ? 'bg-[#00f2fe]/15 border-[#00f2fe]/50 text-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.2)]'
                  : 'bg-white/10 border-white/20 text-slate-300'
              }`}
            >
              <span className="text-[11px] font-semibold mb-0.5">বর্তমান সমাপনী স্থিতি:</span>
              <span className="text-sm sm:text-base font-bold font-orbitron flex items-center gap-1">
                {activeViewStats.status === 'claim' && (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>আপনি পাবেন ৳{Math.abs(activeViewStats.balance).toLocaleString()}</span>
                  </>
                )}
                {activeViewStats.status === 'due' && (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>লেবার পাবে ৳{activeViewStats.balance.toLocaleString()}</span>
                  </>
                )}
                {activeViewStats.status === 'settled' && <span>পরিশোধিত (৳ ০)</span>}
              </span>
              <span className="text-[10px] opacity-80 block mt-0.5 font-sans">
                {activeViewStats.status === 'claim'
                  ? 'অতিরিক্ত পরিশোধ বা অগ্রিম নেওয়া হয়েছে'
                  : activeViewStats.status === 'due'
                  ? 'কাজের বকেয়া যা পরিশোধযোগ্য'
                  : 'সকল লেনদেনের হিসাব শূন্য ও সমান'}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-header Bar: Monthly filter tabs & Search */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5 bg-white/[0.01]">
          {/* Month Selection Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <CalendarDays className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span>মাস:</span>
            </span>
            <button
              onClick={() => setSelectedMonthKey('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                selectedMonthKey === 'all'
                  ? 'bg-[#00f2fe] text-[#050814] shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              সব মাস ({groupedByMonth.length})
            </button>
            {groupedByMonth.map((g) => (
              <button
                key={g.key}
                onClick={() => setSelectedMonthKey(g.key)}
                className={`px-2.5 py-1 rounded-lg text-xs shrink-0 transition-all ${
                  selectedMonthKey === g.key
                    ? 'bg-[#00f2fe] text-[#050814] font-bold shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                    : 'bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                {g.monthTitle}
              </button>
            ))}
          </div>

          {/* Active Filter Indicator & Mobile Add */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {isFilterActive && (
              <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-[#00f2fe]/10 text-cyan-300 border border-[#00f2fe]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-pulse" />
                <span>ফিল্টার সক্রিয়: {totalFilteredRecordsCount} টি লেনদেন</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="ml-1 text-slate-400 hover:text-white cursor-pointer"
                  title="ফিল্টার রিসেট করুন"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00f2fe]/15 text-[#00f2fe] text-xs font-bold shrink-0 border border-[#00f2fe]/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>এন্ট্রি</span>
            </button>
          </div>
        </div>

        {/* Scrollable Records Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-5 scrollbar-thin">
          {/* Inline Add Record Form */}
          {showAddForm && (
            <form
              onSubmit={handleQuickSubmit}
              className="p-4 rounded-xl bg-[#0d162f] border border-[#00f2fe]/40 space-y-3 animate-in fade-in duration-150 shadow-lg"
            >
              <div className="text-xs font-bold text-[#00f2fe] flex items-center gap-1.5 mb-1">
                <Plus className="w-4 h-4" />
                <span>{activeWorker.name}-এর জন্য দ্রুত লেনদেন বা হাজিরা যুক্ত করুন</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/20 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">হাজিরা (দিন)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/20 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">মজুরি পরিশোধ (টাকা)</label>
                  <input
                    type="number"
                    value={paid}
                    onChange={(e) => setPaid(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/20 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">অগ্রিম গ্রহণ (টাকা)</label>
                  <input
                    type="number"
                    value={advance}
                    onChange={(e) => setAdvance(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/20 text-white text-xs"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="text-[#00f2fe]">মন্তব্য / সাইট কন্ডিশন / কাজের বিবরণ (Remarks)</span>
                    <span className="text-[10px] text-slate-400 font-normal">(ঐচ্ছিক)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">সাইটের অবস্থা বা কাজের নির্দিষ্ট বিবরণ</span>
                </div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="যেমন: ৩য় তলা ছাদ ঢালাই, আবহাওয়া অনুকূল, ওটি সম্পন্ন, চমৎকার পারফর্মেন্স"
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#00f2fe]"
                />
                {/* Quick tags */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {['ছাদ ঢালাই', 'গাথুনি কাজ', 'বৃষ্টিজনিত বিলম্ব', 'ভালো পারফর্মেন্স বোনাস', 'ওভারটাইম'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!note.trim()) setNote(tag);
                        else if (!note.includes(tag)) setNote(`${note}, ${tag}`);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-[#00f2fe]/15 border border-white/10 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-slate-300 hover:bg-white/20 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#00f2fe] text-[#050814] font-bold text-xs shadow-md cursor-pointer hover:bg-cyan-300 transition-all"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          )}

          {/* Recharts Monthly Payment vs Advance Visualization Section */}
          {workerRecords.length > 0 && (
            <div
              id="worker-chart-section"
              className="rounded-2xl border border-white/15 bg-gradient-to-br from-[#0c152e]/95 via-[#070c1e]/90 to-[#120a22]/95 p-3.5 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              {/* Chart Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2fe]/20 to-[#ff416c]/20 border border-white/15 flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(0,242,254,0.15)]">
                    <TrendingUp className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                        <span>Payment vs Advance Trend</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-cyan-200 border border-white/10 font-sans">
                          মাসিক ট্রেন্ড ভিজ্যুয়ালাইজার
                        </span>
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeWorker.name}-এর মাসভিত্তিক মজুরি পরিশোধ ও অগ্রিম গ্রহণের গতিপ্রকৃতি (Recharts Line Chart)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Toggle between Monthly and Daily */}
                  {groupedByMonth.length <= 1 && workerRecords.length > 1 ? (
                    <div className="flex items-center rounded-lg bg-black/40 border border-white/15 p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setChartGranularity('monthly')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                          chartGranularity === 'monthly'
                            ? 'bg-[#00f2fe] text-[#050814] font-bold shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        মাসিক
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartGranularity('daily')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                          chartGranularity === 'daily'
                            ? 'bg-[#00f2fe] text-[#050814] font-bold shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        দৈনিক ({dailyChartData.length})
                      </button>
                    </div>
                  ) : groupedByMonth.length > 1 ? (
                    <div className="flex items-center rounded-lg bg-black/40 border border-white/15 p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setChartGranularity('monthly')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                          chartGranularity === 'monthly'
                            ? 'bg-[#00f2fe] text-[#050814] font-bold shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        মাসিক ট্রেন্ড ({monthlyChartData.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartGranularity('daily')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                          chartGranularity === 'daily'
                            ? 'bg-[#00f2fe] text-[#050814] font-bold shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        দৈনিক এন্ট্রি
                      </button>
                    </div>
                  ) : null}

                  {/* Collapse / Expand Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowChart(!showChart)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    title={showChart ? 'চার্ট সংকুচিত করুন' : 'চার্ট দেখুন'}
                  >
                    {showChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span className="hidden sm:inline font-medium">{showChart ? 'সংকুচিত' : 'চার্ট দেখুন'}</span>
                  </button>
                </div>
              </div>

              {showChart && (
                <>
                  {/* KPI Mini-Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5 text-xs">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-[#00f2fe] shadow-[0_0_8px_#00f2fe]" />
                        মোট পরিশোধ:
                      </span>
                      <span className="font-orbitron font-bold text-cyan-300 text-xs sm:text-sm">
                        ৳{chartStats.totalPaid.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-[#ff416c] shadow-[0_0_8px_#ff416c]" />
                        মোট অগ্রিম:
                      </span>
                      <span className="font-orbitron font-bold text-[#ff416c] text-xs sm:text-sm">
                        ৳{chartStats.totalAdvance.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">গড় মাসিক পরিশোধ:</span>
                      <span className="font-orbitron font-semibold text-slate-200 text-xs sm:text-sm">
                        ৳{chartStats.avgMonthlyPaid.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">গড় মাসিক অগ্রিম:</span>
                      <span className="font-orbitron font-semibold text-slate-200 text-xs sm:text-sm">
                        ৳{chartStats.avgMonthlyAdvance.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Recharts Responsive Line Chart */}
                  <div className="h-56 sm:h-64 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartGranularity === 'monthly' ? monthlyChartData : dailyChartData}
                        margin={{ top: 10, right: 15, left: -5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                        />
                        <YAxis
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 10 }}
                          tickFormatter={(val) => `৳${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                          tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                          iconType="circle"
                        />
                        <Line
                          type="monotone"
                          dataKey="paid"
                          name="মজুরি পরিশোধ (Payment)"
                          stroke="#00f2fe"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#00f2fe', strokeWidth: 1.5, stroke: '#ffffff' }}
                          activeDot={{ r: 6, fill: '#00f2fe', strokeWidth: 2, stroke: '#070b1b' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="advance"
                          name="অগ্রিম গ্রহণ (Advance)"
                          stroke="#ff416c"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#ff416c', strokeWidth: 1.5, stroke: '#ffffff' }}
                          activeDot={{ r: 6, fill: '#ff416c', strokeWidth: 2, stroke: '#070b1b' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="earned"
                          name="অর্জিত মজুরি (Earned Wages)"
                          stroke="#38ef7d"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          dot={{ r: 3, fill: '#38ef7d' }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Dedicated Search and Transaction Type Filter Bar */}
          {workerRecords.length > 0 && (
            <div
              id="worker-records-search-filter"
              className="p-3.5 sm:p-4 rounded-xl bg-[#091124]/90 border border-white/15 space-y-3 shadow-inner"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Search Input: Date / Note / Amount */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#00f2fe] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    placeholder="তারিখ (যেমন: 2026-09-12), নোট বা টাকার অঙ্ক দিয়ে লেনদেন খুঁজুন..."
                    className="w-full pl-9 pr-9 py-2 rounded-lg bg-black/60 border border-white/20 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/50 transition-all"
                  />
                  {recordSearch && (
                    <button
                      type="button"
                      onClick={() => setRecordSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                      title="সার্চ ক্লিয়ার করুন"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Specific Date Picker Filter */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="relative flex items-center">
                    <Calendar className="w-3.5 h-3.5 text-[#00f2fe] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="pl-8 pr-2.5 py-2 rounded-lg bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-[#00f2fe] transition-all cursor-pointer"
                      title="ক্যালেন্ডার থেকে নির্দিষ্ট তারিখ বেছে নিন"
                    />
                  </div>
                  {filterDate && (
                    <button
                      type="button"
                      onClick={() => setFilterDate('')}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
                      title="তারিখ ফিল্টার মুছুন"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Transaction Type Filter Badges & Results Count */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px] pr-1">
                    <Filter className="w-3.5 h-3.5 text-[#00f2fe]" />
                    <span>লেনদেনের ধরন:</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setTransactionType('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-xs ${
                      transactionType === 'all'
                        ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/60 shadow-[0_0_8px_rgba(0,242,254,0.2)]'
                        : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    সব ধরন ({workerRecords.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransactionType('work')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-xs flex items-center gap-1 ${
                      transactionType === 'work'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                        : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                    title="শুধুমাত্র কাজের দিন / হাজিরা এন্ট্রি (Days > 0)"
                  >
                    <CalendarDays className="w-3 h-3 text-cyan-300" />
                    <span>কাজের দিন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransactionType('paid')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-xs flex items-center gap-1 ${
                      transactionType === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.2)]'
                        : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                    title="শুধুমাত্র মজুরি পরিশোধ (Paid > 0)"
                  >
                    <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                    <span>মজুরি পরিশোধ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransactionType('advance')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-xs flex items-center gap-1 ${
                      transactionType === 'advance'
                        ? 'bg-[#ff416c]/20 text-[#ff416c] border border-[#ff416c] shadow-[0_0_8px_rgba(255,65,108,0.2)]'
                        : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                    title="শুধুমাত্র অগ্রিম গ্রহণ (Advance > 0)"
                  >
                    <ArrowDownRight className="w-3 h-3 text-[#ff416c]" />
                    <span>অগ্রিম গ্রহণ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransactionType('note')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-xs flex items-center gap-1 ${
                      transactionType === 'note'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                        : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                    title="যেসব লেনদেনে নোট বা মন্তব্য লেখা আছে"
                  >
                    <FileText className="w-3 h-3 text-amber-300" />
                    <span>মন্তব্যযুক্ত</span>
                  </button>
                </div>

                {/* Counter & Clear Filter Button */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    পাওয়া গেছে: <strong className="text-cyan-300 font-orbitron">{totalFilteredRecordsCount}</strong> টি
                  </span>
                  {isFilterActive && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-cyan-300 hover:text-white text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="সকল ফিল্টার রিসেট করুন"
                    >
                      <X className="w-3 h-3" />
                      <span>ফিল্টার রিসেট</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Month Groups & Records Table */}
          {workerRecords.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-black/20 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-2">
              <Users className="w-8 h-8 text-slate-500" />
              <p className="text-sm font-medium text-slate-300">এই শ্রমিকের এখনও কোনো লেনদেন বা হাজিরার রেকর্ড নেই।</p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/40 text-xs font-semibold cursor-pointer"
              >
                প্রথম এন্ট্রি দিন
              </button>
            </div>
          ) : displayedGroups.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-black/20 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-3">
              <Filter className="w-8 h-8 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-300">
                  অনুসন্ধান বা ফিল্টারের সাথে মিলে এমন কোনো লেনদেন পাওয়া যায়নি।
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  তারিখ, লেনদেনের ধরন অথবা সার্চ কিওয়ার্ড পরিবর্তন করে আবার চেষ্টা করুন।
                </p>
              </div>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-1.5 rounded-lg bg-[#00f2fe]/15 hover:bg-[#00f2fe]/25 text-[#00f2fe] border border-[#00f2fe]/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>অনুসন্ধান ও ফিল্টার রিসেট করুন</span>
                </button>
              )}
            </div>
          ) : (
            displayedGroups.map((group) => (
              <div
                key={group.key}
                className="rounded-xl border border-white/10 bg-black/25 overflow-hidden shadow-sm"
              >
                {/* Month Group Header with Subtotals */}
                <div className="px-4 py-3 bg-[#0d162f]/80 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#00f2fe]" />
                    <span className="font-bold text-sm text-white">{group.monthTitle}</span>
                    <span className="text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                      {group.records.length} টি লেনদেন
                    </span>
                  </div>

                  {/* Monthly Subtotals */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
                    <span>
                      হাজিরা: <strong className="text-cyan-300 font-orbitron">{group.subtotalDays} দিন</strong>
                    </span>
                    <span>•</span>
                    <span>
                      অর্জিত: <strong className="text-white font-orbitron">৳{group.subtotalEarned.toLocaleString()}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      পরিশোধ: <strong className="text-slate-200 font-orbitron">৳{group.subtotalPaid.toLocaleString()}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      অগ্রিম: <strong className="text-[#ff416c] font-orbitron">৳{group.subtotalAdvance.toLocaleString()}</strong>
                    </span>
                  </div>
                </div>

                {/* Table for this Month */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-white/5 text-slate-400 border-b border-white/5">
                        <th className="py-2.5 px-3">তারিখ</th>
                        <th className="py-2.5 px-3 text-center">হাজিরা</th>
                        <th className="py-2.5 px-3 text-right">অর্জিত মজুরি (৳)</th>
                        <th className="py-2.5 px-3 text-right">মজুরি পরিশোধ (৳)</th>
                        <th className="py-2.5 px-3 text-right text-[#ff416c]">অগ্রিম টাকা (৳)</th>
                        <th className="py-2.5 px-3 text-right text-cyan-300">চলমান ব্যালেন্স (৳)</th>
                        <th className="py-2.5 px-3">বিবরণ / নোট</th>
                        <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {group.records.map((r) => {
                        const daysNum = parseBanglaOrEnglishNumber(r.days);
                        const wage = Number(activeWorker.dailyWage) || 0;
                        const earned = roundMoney(daysNum * wage);
                        const paidAmt = parseBanglaOrEnglishNumber(r.paid);
                        const advAmt = parseBanglaOrEnglishNumber(r.advance);
                        const runningBal = chronologicalRunningBalances.get(r.id) ?? 0;

                        return (
                          <tr key={r.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-300">
                              {r.date}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-white/5 font-semibold text-cyan-200">
                                {r.days} দিন
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-orbitron text-white">
                              ৳{earned.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-orbitron text-slate-300">
                              ৳{paidAmt.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-orbitron text-[#ff416c]">
                              ৳{advAmt.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-orbitron font-semibold">
                              {runningBal > 0 ? (
                                <span className="text-[#00f2fe]" title="লেবার পাবে">
                                  +৳{runningBal.toLocaleString()}
                                </span>
                              ) : runningBal < 0 ? (
                                <span className="text-[#ff416c]" title="কোম্পানি পাবে">
                                  -৳{Math.abs(runningBal).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-400">৳০</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 max-w-[180px] truncate">
                              {r.note || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {onUpdateRecord && (
                                  <button
                                    onClick={() => startEdit(r)}
                                    className="p-1 rounded text-cyan-400 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                                    title="রেকর্ডটি এডিট বা সংশোধন করুন"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (confirm('এই তারিখের রেকর্ডটি মুছে ফেলতে চান?')) {
                                      onDeleteRecord(r.id);
                                    }
                                  }}
                                  className="p-1 rounded text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                                  title="রেকর্ড ডিলিট করুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40">
          <div className="text-xs text-slate-400 font-medium text-center sm:text-left">
            মনসুর লেবার পোর্টাল • শ্রমিক আইডি: {activeWorker.id} • সর্বমোট কাজের দিন: {lifetimeStats.totalDays} দিন
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer text-center"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>

      {/* Edit Record Sub-Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md p-5 border border-cyan-400/50 bg-[#0c152c] shadow-2xl animate-in zoom-in-95 duration-150 rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
                <Edit2 className="w-4 h-4" />
                <span>দৈনিক এন্ট্রি সংশোধন করুন</span>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">হাজিরা (দিন)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={editDays}
                    onChange={(e) => setEditDays(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">পরিশোধ (৳)</label>
                  <input
                    type="number"
                    value={editPaid}
                    onChange={(e) => setEditPaid(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">অগ্রিম (৳)</label>
                  <input
                    type="number"
                    value={editAdvance}
                    onChange={(e) => setEditAdvance(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 flex items-center justify-between">
                  <span className="text-[#00f2fe]">মন্তব্য / সাইট কন্ডিশন / কাজের বিবরণ (Remarks)</span>
                  <span className="text-[10px] text-slate-400">(ঐচ্ছিক)</span>
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="যেমন: ৩য় তলা ছাদ ঢালাই, বৃষ্টিজনিত বিলম্ব, ভালো কাজের বোনাস"
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#00f2fe]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="cyber-btn px-4 py-1.5 text-xs font-bold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

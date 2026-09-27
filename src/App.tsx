import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ThreeBackground } from './components/ThreeBackground';
import { StatsCards } from './components/StatsCards';
import { WorkerRegistrationForm } from './components/WorkerRegistrationForm';
import { DailyTransactionForm } from './components/DailyTransactionForm';
import { SummaryTable } from './components/SummaryTable';
import { WorkerDetailModal } from './components/WorkerDetailModal';
import { EditWorkerModal } from './components/EditWorkerModal';
import { YearMonthFilter } from './components/YearMonthFilter';
import { YearlyMonthlyDashboard } from './components/YearlyMonthlyDashboard';
import { FutureRoadmapModal } from './components/FutureRoadmapModal';
import { Login } from './components/Login';
import { Worker, WorkRecord, WorkerSummary } from './types';
import { INITIAL_WORKERS, INITIAL_RECORDS } from './data/initialData';
import {
  computeYearlyMonthlyData,
  filterSummariesByPeriod,
  toBanglaNumber,
  BANGLA_MONTHS,
  parseDate,
} from './utils/dateHelpers';
import { ShieldCheck, RotateCcw, Clock, Sparkles, Lightbulb, BarChart3, Building2, Download, Upload, Cloud, Smartphone, Laptop, LogOut } from 'lucide-react';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  subscribeToWorkers,
  subscribeToRecords,
  saveWorkerToCloud,
  deleteWorkerFromCloud,
  saveRecordToCloud,
  updateRecordInCloud,
  deleteRecordFromCloud,
  migrateLocalDataToCloudIfEmpty,
  replaceAllCloudData,
} from './services/cloudService';

export default function App() {
  // Authentication states
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 1. LocalStorage synchronization matching keys
  const [workers, setWorkers] = useState<Worker[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_workers');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved workers', e);
    }
    return INITIAL_WORKERS;
  });

  const [records, setRecords] = useState<WorkRecord[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_records');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved records', e);
    }
    return INITIAL_RECORDS;
  });

  // Cloud sync status ('connected' | 'syncing' | 'offline')
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

  // Real-time Firestore Cloud Synchronization between Mobile & PC
  useEffect(() => {
    let isMounted = true;

    // 1. Initial check: If cloud is completely empty, migrate local data up
    const localWorkersRaw = localStorage.getItem('nexus_workers');
    const localRecordsRaw = localStorage.getItem('nexus_records');
    let localW = INITIAL_WORKERS;
    let localR = INITIAL_RECORDS;
    try {
      if (localWorkersRaw) {
        const parsedW = JSON.parse(localWorkersRaw);
        if (Array.isArray(parsedW) && parsedW.length > 0) localW = parsedW;
      }
      if (localRecordsRaw) {
        const parsedR = JSON.parse(localRecordsRaw);
        if (Array.isArray(parsedR) && parsedR.length > 0) localR = parsedR;
      }
    } catch (e) {
      console.warn('Error reading local cache for initial migration', e);
    }

    migrateLocalDataToCloudIfEmpty(localW, localR).catch((err) => {
      console.warn('Cloud migration check notice:', err);
    });

    // 2. Real-time Workers subscription (Live auto-update across mobile & PC)
    const unsubWorkers = subscribeToWorkers(
      (cloudWorkers) => {
        if (!isMounted) return;
        setWorkers(cloudWorkers);
        setCloudSyncStatus('connected');
      },
      (err) => {
        console.error('Cloud workers sync error:', err);
        setCloudSyncStatus('offline');
      }
    );

    // 3. Real-time Records subscription (Live auto-update across mobile & PC)
    const unsubRecords = subscribeToRecords(
      (cloudRecords) => {
        if (!isMounted) return;
        setRecords(cloudRecords);
        setCloudSyncStatus('connected');
      },
      (err) => {
        console.error('Cloud records sync error:', err);
        setCloudSyncStatus('offline');
      }
    );

    const handleOnline = () => setCloudSyncStatus('connected');
    const handleOffline = () => setCloudSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted = false;
      unsubWorkers();
      unsubRecords();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keep localStorage updated as an instant offline fallback
  useEffect(() => {
    try {
      localStorage.setItem('nexus_workers', JSON.stringify(workers));
    } catch (e) {
      console.error('Error saving workers to localStorage', e);
    }
  }, [workers]);

  useEffect(() => {
    try {
      localStorage.setItem('nexus_records', JSON.stringify(records));
    } catch (e) {
      console.error('Error saving records to localStorage', e);
    }
  }, [records]);

  // Modals & Active selections
  const [activeDetailWorkerId, setActiveDetailWorkerId] = useState<string | null>(null);
  const [activeEditWorkerId, setActiveEditWorkerId] = useState<string | null>(null);
  const [quickEntryWorkerId, setQuickEntryWorkerId] = useState<string | null>(null);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Time display
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('bn-BD', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // 2. Yearly & Monthly Breakdown Computation
  const { availableYears, yearSummaries } = useMemo(() => {
    return computeYearlyMonthlyData(workers, records);
  }, [workers, records]);

  // Filter State: Year and Month
  const defaultYear = availableYears.length > 0 ? availableYears[0] : new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  // Keep selectedYear synchronized if availableYears changes
  useEffect(() => {
    if (selectedYear !== 'all' && availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const currentYearSummary = useMemo(() => {
    const yr = selectedYear === 'all' ? (availableYears[0] || new Date().getFullYear()) : selectedYear;
    return yearSummaries.find((y) => y.year === yr);
  }, [yearSummaries, selectedYear, availableYears]);

  // 3. Computed Summaries for current period
  const periodSummaries: WorkerSummary[] = useMemo(() => {
    return filterSummariesByPeriod(workers, records, selectedYear, selectedMonth);
  }, [workers, records, selectedYear, selectedMonth]);

  // Human-readable period label
  const periodLabel = useMemo(() => {
    if (selectedYear === 'all') return 'সকল বছরের সার্বিক হিসাব';
    const yrText = `${toBanglaNumber(selectedYear)} সাল`;
    if (selectedMonth === 'all') return `${yrText} (বাৎসরিক হিসাব)`;
    return `${BANGLA_MONTHS[selectedMonth - 1]} ${yrText} (মাসিক হিসাব)`;
  }, [selectedYear, selectedMonth]);

  // Handler: Add worker
  const handleAddWorker = (newWorkerData: Omit<Worker, 'id' | 'createdAt'>) => {
    const newWorker: Worker = {
      ...newWorkerData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setWorkers((prev) => [newWorker, ...prev]);
    setQuickEntryWorkerId(newWorker.id);
    saveWorkerToCloud(newWorker).catch((err) => console.error('Cloud save worker error:', err));
  };

  // Handler: Update worker
  const handleUpdateWorker = (updatedWorker: Worker) => {
    setWorkers((prev) => prev.map((w) => (w.id === updatedWorker.id ? updatedWorker : w)));
    saveWorkerToCloud(updatedWorker).catch((err) => console.error('Cloud update worker error:', err));
  };

  // Handler: Delete worker and their records
  const handleDeleteWorker = (workerId: string) => {
    const worker = workers.find((w) => w.id === workerId);
    const workerName = worker ? worker.name : 'এই লেবার';
    if (window.confirm(`আপনি কি নিশ্চিত "${workerName}"-এর যাবতীয় তথ্য ও হিসাব মুছে ফেলতে চান?`)) {
      setWorkers((prev) => prev.filter((w) => w.id !== workerId));
      setRecords((prev) => prev.filter((r) => r.workerId !== workerId));
      if (activeDetailWorkerId === workerId) setActiveDetailWorkerId(null);
      if (activeEditWorkerId === workerId) setActiveEditWorkerId(null);
      if (quickEntryWorkerId === workerId) setQuickEntryWorkerId(null);
      deleteWorkerFromCloud(workerId).catch((err) => console.error('Cloud delete worker error:', err));
    }
  };

  // Handler: Add transaction record
  const handleAddRecord = (recordData: Omit<WorkRecord, 'id' | 'createdAt'>) => {
    const targetWorker = workers.find((w) => w.id === recordData.workerId) || (workers.length > 0 ? workers[0] : null);
    if (!targetWorker) {
      alert('ত্রুটি: কোনো লেবার পাওয়া যায়নি। অনুগ্রহ করে আগে একজন লেবার যুক্ত করুন।');
      return;
    }

    const safeWorkerId = targetWorker.id;
    const newRecord: WorkRecord = {
      ...recordData,
      workerId: safeWorkerId,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    setRecords((prev) => [newRecord, ...prev]);

    const { year: recordYear, monthIndex: recordMonth } = parseDate(recordData.date);

    if (selectedYear !== 'all' && selectedYear !== recordYear) {
      setSelectedYear(recordYear);
    }
    if (selectedMonth !== 'all' && selectedMonth !== recordMonth) {
      setSelectedMonth(recordMonth);
    }

    saveRecordToCloud(newRecord).catch((err) => console.error('Cloud save record error:', err));
  };

  // Handler: Delete record
  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    deleteRecordFromCloud(recordId).catch((err) => console.error('Cloud delete record error:', err));
  };

  // Handler: Update existing record
  const handleUpdateRecord = (updatedRecord: WorkRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
    updateRecordInCloud(updatedRecord).catch((err) => console.error('Cloud update record error:', err));
  };

  // Reset to initial sample data
  const handleResetData = () => {
    if (
      window.confirm(
        'আপনি কি পূর্বনির্ধারিত ডেমো ডেটায় ফিরে যেতে চান? জুলাই, আগস্ট ও সেপ্টেম্বর ২০২৬-এর ডেটা রিলোড হবে।'
      )
    ) {
      setWorkers(INITIAL_WORKERS);
      setRecords(INITIAL_RECORDS);
      localStorage.removeItem('nexus_workers');
      localStorage.removeItem('nexus_records');
      replaceAllCloudData(INITIAL_WORKERS, INITIAL_RECORDS).catch((err) =>
        console.error('Cloud reset error:', err)
      );
    }
  };

  // Export CSV respecting active period
  const handleExportCsv = () => {
    if (periodSummaries.length === 0) {
      alert('এক্সপোর্ট করার জন্য কোনো ডাটা নেই');
      return;
    }

    const headers = [
      'Worker Name',
      'Trade',
      'Daily Wage (BDT)',
      'Total Days',
      'Total Earned (BDT)',
      'Wages Paid (BDT)',
      'Advance Given (BDT)',
      'Total Received (BDT)',
      'Net Balance (BDT)',
      'Status',
    ];

    const rows = periodSummaries.map((s) => {
      let statusLabel = 'Settled';
      if (s.status === 'claim') statusLabel = `Company Claim (${Math.abs(s.balance)})`;
      if (s.status === 'due') statusLabel = `Labor Due (${s.balance})`;

      return [
        `"${s.worker.name}"`,
        `"${s.worker.trade || ''}"`,
        s.worker.dailyWage,
        s.totalDays,
        s.totalEarned,
        s.totalPaid,
        s.totalAdvance,
        s.totalPaidAll,
        s.balance,
        `"${statusLabel}"`,
      ].join(',');
    });

    const titleRow = [`"Monsur Labor Audit Report: ${periodLabel}"`].join(',');
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [titleRow, '', headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const periodSlug = `${selectedYear}_${selectedMonth}`.toLowerCase();
    link.setAttribute('download', `monsur_labor_audit_${periodSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintLedger = () => {
    window.print();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Full Backup (JSON)
  const handleDownloadBackup = () => {
    try {
      const backupData = {
        appName: 'MONSUR LABOR PORTAL',
        appNameBn: 'মনসুর লেবার পোর্টাল',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        summary: {
          totalWorkers: workers.length,
          totalRecords: records.length,
          availableYears: availableYears,
        },
        workers: workers,
        records: records,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `monsur_labor_portal_full_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export backup', err);
      alert('ব্যাকআপ ফাইল তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  // Restore Backup (JSON)
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (!data || !Array.isArray(data.workers) || !Array.isArray(data.records)) {
          alert('ত্রুটি: ব্যাকআপ ফাইলটির ফরম্যাট সঠিক নয়। "workers" এবং "records" ডাটা পাওয়া যায়নি।');
          return;
        }

        if (
          confirm(
            `আপনি কি ব্যাকআপ ফাইলটি রিস্টোর করতে চান?\n\nএতে বর্তমান ডাটার স্থানে ব্যাকআপের ${data.workers.length} জন শ্রমিক এবং ${data.records.length} টি লেনদেন লোড হবে।`
          )
        ) {
          setWorkers(data.workers);
          setRecords(data.records);
          replaceAllCloudData(data.workers, data.records).catch((err) =>
            console.error('Cloud restore sync error:', err)
          );
          alert(`সফলভাবে ${data.workers.length} জন শ্রমিক এবং ${data.records.length} টি লেনদেনের ব্যাকআপ রিস্টোর ও ক্লাউড সিঙ্ক সম্পন্ন হয়েছে!`);
        }
      } catch (err) {
        console.error('Failed to parse backup JSON file', err);
        alert('ত্রুটি: ফাইলটি পড়তে ব্যর্থ হয়েছে। দয়া করে সঠিক JSON ব্যাকআপ ফাইল নির্বাচন করুন।');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-[#00f2fe] font-orbitron text-xl">
        লোড হচ্ছে...
      </div>
    );
  }

  // If user is not logged in, show Login Component
  if (!user) {
    return <Login />;
  }

  // Active worker objects for modals
  const activeDetailSummary =
    periodSummaries.find((s) => s.worker.id === activeDetailWorkerId) || null;
  const activeDetailWorker =
    workers.find((w) => w.id === activeDetailWorkerId) || activeDetailSummary?.worker || null;
  const activeEditWorker = workers.find((w) => w.id === activeEditWorkerId) || null;

  return (
    <div className="relative min-h-screen text-[#e6f1ff] pb-16">
      {/* 3D Civil & Architectural Blueprint Background Layer */}
      <ThreeBackground />

      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 pt-7 relative z-10">
        {/* Header Section */}
        <header className="text-center mb-6 px-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe] text-xs sm:text-sm mb-3 shadow-[0_0_20px_rgba(0,242,254,0.25)] font-semibold">
            <Building2 className="w-4 h-4 text-[#00f2fe]" />
            <span className="tracking-wider">মনসুর লেবার কন্ট্রোল সিস্টেম</span>
          </div>

          <h1 className="font-orbitron text-2xl sm:text-4xl md:text-5xl font-black tracking-wide bg-gradient-to-r from-[#00f2fe] via-[#4facfe] to-[#00f2fe] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,242,254,0.5)] leading-tight">
            MONSUR LABOR PORTAL
          </h1>

          <div className="text-base sm:text-xl font-bold text-[#00f2fe] tracking-wide mt-1.5 font-bengali">
            মনসুর লেবার পোর্টাল
          </div>

          <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl mx-auto font-medium px-1">
            বাৎসরিক ও মাসিক হিসাব অডিট, দৈনিক হাজিরা এন্ট্রি ও অগ্রিম ব্যালেন্স ব্যবস্থাপনা
          </p>

          {/* Subheader bar with date, actions and Roadmap button */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-400 no-print">
            {/* Live Cloud Sync Indicator (Mobile & PC Sync) */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold transition-all ${
                cloudSyncStatus === 'connected'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : cloudSyncStatus === 'syncing'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 animate-pulse'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              }`}
              title="মোবাইল এবং কম্পিউটারে রিয়েল-টাইম অটোমেটিক ডেটা সিঙ্ক হচ্ছে"
            >
              <span className="relative flex h-2.5 w-2.5">
                {cloudSyncStatus === 'connected' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                  </>
                ) : cloudSyncStatus === 'syncing' ? (
                  <span className="animate-spin h-2.5 w-2.5 rounded-full border-2 border-cyan-400 border-t-transparent"></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                )}
              </span>
              <Cloud className="w-4 h-4 shrink-0" />
              <span>
                {cloudSyncStatus === 'connected'
                  ? 'মোবাইল ও পিসি অটো-সিঙ্ক সক্রিয়'
                  : cloudSyncStatus === 'syncing'
                  ? 'ক্লাউড সিঙ্ক হচ্ছে...'
                  : 'অফলাইন মোড (লোকাল সেভ)'}
              </span>
              <div className="hidden sm:flex items-center gap-1 text-[11px] opacity-80 border-l border-white/20 pl-2">
                <Smartphone className="w-3.5 h-3.5" />
                <span>↔</span>
                <Laptop className="w-3.5 h-3.5" />
              </div>
            </div>

            {currentTime && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-slate-300">
                <Clock className="w-4 h-4 text-[#00f2fe]" />
                <span className="text-xs sm:text-sm">{currentTime}</span>
              </span>
            )}

            {/* "নতুন ফিচারের আইডিয়া" Button */}
            <button
              onClick={() => setShowRoadmapModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-semibold transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer text-xs sm:text-sm"
              title="নতুন যেসব ফিচার যুক্ত করা যাবে"
            >
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span>নতুন ফিচারের আইডিয়া</span>
            </button>

            {/* "সম্পূর্ণ ব্যাকআপ ডাউনলোড" (Download Full Backup) Button */}
            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 font-semibold transition-all shadow-[0_0_15px_rgba(0,242,254,0.2)] cursor-pointer text-xs sm:text-sm"
              title="শ্রমিক ও সমস্ত লেনদেনের সম্পূর্ণ ডাটা JSON ফাইল হিসেবে ব্যাকআপ ডাউনলোড করুন"
              id="download-full-backup-btn"
            >
              <Download className="w-4 h-4 text-[#00f2fe] shrink-0" />
              <span>সম্পূর্ণ ব্যাকআপ ডাউনলোড (JSON)</span>
            </button>

            {/* "ব্যাকআপ রিস্টোর" (Restore Backup) Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer text-xs sm:text-sm"
              title="পূর্বে সংরক্ষিত JSON ব্যাকআপ ফাইল থেকে ডাটা রিস্টোর করুন"
              id="restore-backup-btn"
            >
              <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ব্যাকআপ রিস্টোর</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreBackup}
              className="hidden"
            />

            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer text-xs sm:text-sm"
              title="ডেমো ডেটা রিলোড করুন"
            >
              <RotateCcw className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>ডেমো ডেটা রিস্টোর</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs sm:text-sm transition-all cursor-pointer font-semibold shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              title="লগআউট করুন"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>লগআউট</span>
            </button>
          </div>
        </header>

        {/* 1. Year & Month Navigation / Filter Bar */}
        <div className="no-print">
          <YearMonthFilter
            availableYears={availableYears}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            currentYearSummary={currentYearSummary}
            onSelectYear={(yr) => {
              setSelectedYear(yr);
            }}
            onSelectMonth={(m) => setSelectedMonth(m)}
            showAnalytics={showAnalytics}
            onToggleAnalytics={() => setShowAnalytics(!showAnalytics)}
          />
        </div>

        {/* 2. 12-Month Progression & Breakdown Matrix Dashboard (When toggled) */}
        {showAnalytics && currentYearSummary && (
          <div className="no-print">
            <YearlyMonthlyDashboard
              yearSummary={currentYearSummary}
              selectedMonth={selectedMonth}
              onSelectMonth={(m) => setSelectedMonth(m)}
              onClose={() => setShowAnalytics(false)}
            />
          </div>
        )}

        {/* 3. Top Statistical Overview (Calculated for active Year/Month) */}
        <div className="no-print">
          <StatsCards
            summaries={periodSummaries}
            periodLabel={periodLabel}
            currentYearSummary={currentYearSummary}
            selectedYear={selectedYear}
          />
        </div>

        {/* 4. Action Grid: Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-6 mb-8 no-print">
          {/* শ্রমিক রেজিস্ট্রেশন ফর্ম */}
          <WorkerRegistrationForm onAddWorker={handleAddWorker} />

          {/* দৈনিক লেনদেন ফর্ম */}
          <DailyTransactionForm
            workers={workers}
            onAddRecord={handleAddRecord}
            selectedWorkerId={quickEntryWorkerId || undefined}
            onSelectWorkerId={(id) => setQuickEntryWorkerId(id)}
          />
        </div>

        {/* 5. Data Analytics Table (Consolidated for current period) */}
        <SummaryTable
          summaries={periodSummaries}
          periodLabel={periodLabel}
          onDeleteWorker={handleDeleteWorker}
          onOpenWorkerDetails={(id) => setActiveDetailWorkerId(id)}
          onQuickAddRecord={(id) => {
            setQuickEntryWorkerId(id);
            window.scrollTo({ top: 460, behavior: 'smooth' });
          }}
          onEditWorker={(id) => setActiveEditWorkerId(id)}
          onExportCsv={handleExportCsv}
          onPrintLedger={handlePrintLedger}
          onDownloadBackup={handleDownloadBackup}
        />
      </div>

      {/* Worker Detail Ledger Modal */}
      {(activeDetailSummary || activeDetailWorker) && (
        <WorkerDetailModal
          summary={activeDetailSummary || undefined}
          worker={activeDetailWorker || undefined}
          records={records}
          allWorkers={workers}
          onSelectWorker={(id) => setActiveDetailWorkerId(id)}
          onClose={() => setActiveDetailWorkerId(null)}
          onDeleteRecord={handleDeleteRecord}
          onAddRecordForWorker={handleAddRecord}
          onUpdateRecord={handleUpdateRecord}
        />
      )}

      {/* Edit Worker Modal */}
      {activeEditWorker && (
        <EditWorkerModal
          worker={activeEditWorker}
          onClose={() => setActiveEditWorkerId(null)}
          onSave={handleUpdateWorker}
        />
      )}

      {/* Future Roadmap / Feature Ideas Modal */}
      {showRoadmapModal && (
        <FutureRoadmapModal onClose={() => setShowRoadmapModal(false)} />
      )}
    </div>
  );
}

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
import { Worker, WorkRecord, WorkerSummary } from './types';
import { INITIAL_WORKERS, INITIAL_RECORDS } from './data/initialData';
import {
  computeYearlyMonthlyData,
  filterSummariesByPeriod,
  toBanglaNumber,
  BANGLA_MONTHS,
  parseDate,
} from './utils/dateHelpers';
import { ShieldCheck, RotateCcw, Clock, Lightbulb, Cloud, Smartphone, Laptop, LogOut, Lock, Mail, Loader2 } from 'lucide-react';
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
import { auth } from './lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      setLoginPassword('');
    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError('লগইন ব্যর্থ হয়েছে! ইমেইল বা পাসওয়ার্ড চেক করুন।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

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

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
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
      console.warn('Error reading local cache', e);
    }

    migrateLocalDataToCloudIfEmpty(localW, localR).catch((err) => {
      console.warn('Cloud migration check notice:', err);
    });

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
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('nexus_workers', JSON.stringify(workers));
    } catch (e) {
      console.error('Error saving workers', e);
    }
  }, [workers]);

  useEffect(() => {
    try {
      localStorage.setItem('nexus_records', JSON.stringify(records));
    } catch (e) {
      console.error('Error saving records', e);
    }
  }, [records]);

  const [activeDetailWorkerId, setActiveDetailWorkerId] = useState<string | null>(null);
  const [activeEditWorkerId, setActiveEditWorkerId] = useState<string | null>(null);
  const [quickEntryWorkerId, setQuickEntryWorkerId] = useState<string | null>(null);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

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

  const { availableYears, yearSummaries } = useMemo(() => {
    return computeYearlyMonthlyData(workers, records);
  }, [workers, records]);

  const defaultYear = availableYears.length > 0 ? availableYears[0] : new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  useEffect(() => {
    if (selectedYear !== 'all' && availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const currentYearSummary = useMemo(() => {
    const yr = selectedYear === 'all' ? (availableYears[0] || new Date().getFullYear()) : selectedYear;
    return yearSummaries.find((y) => y.year === yr);
  }, [yearSummaries, selectedYear, availableYears]);

  const periodSummaries: WorkerSummary[] = useMemo(() => {
    return filterSummariesByPeriod(workers, records, selectedYear, selectedMonth);
  }, [workers, records, selectedYear, selectedMonth]);

  const periodLabel = useMemo(() => {
    if (selectedYear === 'all') return 'সকল বছরের সার্বিক হিসাব';
    const yrText = `${toBanglaNumber(selectedYear)} সাল`;
    if (selectedMonth === 'all') return `${yrText} (বাৎসরিক হিসাব)`;
    return `${BANGLA_MONTHS[selectedMonth - 1]} ${yrText} (মাসিক হিসাব)`;
  }, [selectedYear, selectedMonth]);

  const handleAddWorker = (newWorkerData: Omit<Worker, 'id' | 'createdAt'>) => {
    const newWorker: Worker = {
      ...newWorkerData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setWorkers((prev) => [newWorker, ...prev]);
    setQuickEntryWorkerId(newWorker.id);
    saveWorkerToCloud(newWorker).catch((err) => console.error(err));
  };

  const handleUpdateWorker = (updatedWorker: Worker) => {
    setWorkers((prev) => prev.map((w) => (w.id === updatedWorker.id ? updatedWorker : w)));
    saveWorkerToCloud(updatedWorker).catch((err) => console.error(err));
  };

  const handleDeleteWorker = (workerId: string) => {
    const worker = workers.find((w) => w.id === workerId);
    const workerName = worker ? worker.name : 'এই লেবার';
    if (window.confirm(`আপনি কি নিশ্চিত "${workerName}"-এর সমস্ত তথ্য মুছে ফেলতে চান?`)) {
      setWorkers((prev) => prev.filter((w) => w.id !== workerId));
      setRecords((prev) => prev.filter((r) => r.workerId !== workerId));
      if (activeDetailWorkerId === workerId) setActiveDetailWorkerId(null);
      if (activeEditWorkerId === workerId) setActiveEditWorkerId(null);
      if (quickEntryWorkerId === workerId) setQuickEntryWorkerId(null);
      deleteWorkerFromCloud(workerId).catch((err) => console.error(err));
    }
  };

  const handleAddRecord = (recordData: Omit<WorkRecord, 'id' | 'createdAt'>) => {
    const targetWorker = workers.find((w) => w.id === recordData.workerId) || (workers.length > 0 ? workers[0] : null);
    if (!targetWorker) {
      alert('কোনো লেবার পাওয়া যায়নি। অনুগ্রহ করে আগে একজন লেবার যুক্ত করুন।');
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

    saveRecordToCloud(newRecord).catch((err) => console.error(err));
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    deleteRecordFromCloud(recordId).catch((err) => console.error(err));
  };

  const handleUpdateRecord = (updatedRecord: WorkRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
    updateRecordInCloud(updatedRecord).catch((err) => console.error(err));
  };

  const handleResetData = () => {
    if (window.confirm('আপনি কি ডেমো ডেটায় ফিরে যেতে চান?')) {
      setWorkers(INITIAL_WORKERS);
      setRecords(INITIAL_RECORDS);
      localStorage.removeItem('nexus_workers');
      localStorage.removeItem('nexus_records');
      replaceAllCloudData(INITIAL_WORKERS, INITIAL_RECORDS).catch((err) => console.error(err));
    }
  };

  const handleExportCsv = () => {
    if (periodSummaries.length === 0) {
      alert('এক্সপোর্ট করার জন্য কোনো ডাটা নেই');
      return;
    }
    const headers = ['Worker Name', 'Trade', 'Daily Wage', 'Total Days', 'Total Earned', 'Paid', 'Advance', 'Balance', 'Status'];
    const rows = periodSummaries.map((s) => [
      `"${s.worker.name}"`,
      `"${s.worker.trade || ''}"`,
      s.worker.dailyWage,
      s.totalDays,
      s.totalEarned,
      s.totalPaid,
      s.totalAdvance,
      s.balance,
      `"${s.status}"`
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `monsur_labor_audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintLedger = () => {
    window.print();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = () => {
    const backupData = { workers, records };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.workers && data.records) {
          setWorkers(data.workers);
          setRecords(data.records);
          replaceAllCloudData(data.workers, data.records);
          alert('ব্যাকআপ সফলভাবে রিস্টোর হয়েছে!');
        }
      } catch (err) {
        alert('ব্যাকআপ ফাইল পড়তে সমস্যা হয়েছে।');
      }
    };
    reader.readAsText(file);
  };

  const activeDetailSummary = periodSummaries.find((s) => s.worker.id === activeDetailWorkerId) || null;
  const activeDetailWorker = workers.find((w) => w.id === activeDetailWorkerId) || activeDetailSummary?.worker || null;
  const activeEditWorker = workers.find((w) => w.id === activeEditWorkerId) || null;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-[#00f2fe]">
        <ThreeBackground />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#00f2fe]" />
          <p className="text-sm font-medium">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4 text-[#e6f1ff]">
        <ThreeBackground />
        <div className="relative z-10 max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-[#00f2fe]/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,242,254,0.15)]">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe] mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-orbitron text-2xl font-black tracking-wide bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent">
              ADMIN LOGIN
            </h1>
            <p className="text-xs text-slate-400 mt-1">মনসুর লেবার পোর্টাল অ্যাক্সেস করতে লগইন করুন</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">ইমেইল এড্রেস</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-[#00f2fe]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">পাসওয়ার্ড</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-[#00f2fe]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:opacity-90 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>লগইন করুন</span>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-[#e6f1ff] pb-16">
      <ThreeBackground />

      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 pt-7 relative z-10">
        <header className="text-center mb-6 px-2">
          <div className="flex items-center justify-between mb-3 no-print">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe] text-xs font-semibold">
              <Mail className="w-4 h-4" />
              <span>{currentUser.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>লগআউট</span>
            </button>
          </div>

          <h1 className="font-orbitron text-2xl sm:text-4xl md:text-5xl font-black tracking-wide bg-gradient-to-r from-[#00f2fe] via-[#4facfe] to-[#00f2fe] bg-clip-text text-transparent">
            MONSUR LABOR PORTAL
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-slate-400 no-print">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold ${
              cloudSyncStatus === 'connected' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            }`}>
              <Cloud className="w-4 h-4" />
              <span>{cloudSyncStatus === 'connected' ? 'ক্লাউড সিঙ্ক সক্রিয়' : 'অফলাইন মোড'}</span>
            </div>

            <button onClick={handleDownloadBackup} className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 cursor-pointer">
              ব্যাকআপ JSON
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 cursor-pointer">
              রিস্টোর
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />

            <button onClick={handleResetData} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 cursor-pointer">
              <RotateCcw className="w-4 h-4 inline mr-1" /> ডেমো রিসেট
            </button>
          </div>
        </header>

        <div className="no-print">
          <YearMonthFilter
            availableYears={availableYears}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            currentYearSummary={currentYearSummary}
            onSelectYear={setSelectedYear}
            onSelectMonth={setSelectedMonth}
            showAnalytics={showAnalytics}
            onToggleAnalytics={() => setShowAnalytics(!showAnalytics)}
          />
        </div>

        {showAnalytics && currentYearSummary && (
          <div className="no-print">
            <YearlyMonthlyDashboard
              yearSummary={currentYearSummary}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              onClose={() => setShowAnalytics(false)}
            />
          </div>
        )}

        <div className="no-print">
          <StatsCards summaries={periodSummaries} periodLabel={periodLabel} currentYearSummary={currentYearSummary} selectedYear={selectedYear} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-6 mb-8 no-print">
          <WorkerRegistrationForm onAddWorker={handleAddWorker} />
          <DailyTransactionForm workers={workers} onAddRecord={handleAddRecord} selectedWorkerId={quickEntryWorkerId || undefined} onSelectWorkerId={setQuickEntryWorkerId} />
        </div>

        <SummaryTable
          summaries={periodSummaries}
          periodLabel={periodLabel}
          onDeleteWorker={handleDeleteWorker}
          onOpenWorkerDetails={setActiveDetailWorkerId}
          onQuickAddRecord={(id) => { setQuickEntryWorkerId(id); window.scrollTo({ top: 460, behavior: 'smooth' }); }}
          onEditWorker={setActiveEditWorkerId}
          onExportCsv={handleExportCsv}
          onPrintLedger={handlePrintLedger}
          onDownloadBackup={handleDownloadBackup}
        />
      </div>

      {(activeDetailSummary || activeDetailWorker) && (
        <WorkerDetailModal
          summary={activeDetailSummary || undefined}
          worker={activeDetailWorker || undefined}
          records={records}
          allWorkers={workers}
          onSelectWorker={setActiveDetailWorkerId}
          onClose={() => setActiveDetailWorkerId(null)}
          onDeleteRecord={handleDeleteRecord}
          onAddRecordForWorker={handleAddRecord}
          onUpdateRecord={handleUpdateRecord}
        />
      )}

      {activeEditWorker && (
        <EditWorkerModal worker={activeEditWorker} onClose={() => setActiveEditWorkerId(null)} onSave={handleUpdateWorker} />
      )}
    </div>
  );
}

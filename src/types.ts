export interface Worker {
  id: string;
  name: string;
  dailyWage: number;
  trade?: string;
  phone?: string;
  createdAt?: string;
}

export interface WorkRecord {
  id: string;
  workerId: string;
  date: string;
  days: number;
  paid: number;
  advance: number;
  note?: string;
  createdAt?: string;
}

export interface WorkerSummary {
  worker: Worker;
  totalDays: number;
  totalEarned: number;
  totalPaid: number;
  totalAdvance: number;
  totalPaidAll: number; // totalPaid + totalAdvance
  balance: number; // totalEarned - totalPaidAll
  status: 'claim' | 'due' | 'settled'; // claim = balance < 0 (Company Claim), due = balance > 0 (Labor Due), settled = balance === 0
  recordsCount: number;
}

export interface MonthSummary {
  monthKey: string; // e.g. "2026-09"
  year: number;
  monthIndex: number; // 1 to 12
  monthName: string; // e.g. "সেপ্টেম্বর"
  totalDays: number;
  totalEarned: number;
  totalPaid: number;
  totalAdvance: number;
  totalPaidAll: number;
  balance: number;
  recordsCount: number;
  activeWorkersCount: number;
}

export interface YearSummary {
  year: number;
  totalDays: number;
  totalEarned: number;
  totalPaid: number;
  totalAdvance: number;
  totalPaidAll: number;
  balance: number;
  recordsCount: number;
  monthlyBreakdown: MonthSummary[];
}


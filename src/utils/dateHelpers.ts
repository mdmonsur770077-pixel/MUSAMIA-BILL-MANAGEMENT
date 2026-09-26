import { WorkRecord, Worker, WorkerSummary, MonthSummary, YearSummary } from '../types';

export const BANGLA_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export const BANGLA_MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const BANGLA_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function roundMoney(val: number, decimals: number = 2): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export function toBanglaNumber(num: number | string): string {
  if (num === undefined || num === null) return '০';
  // If number has decimals, format with at most 2 decimals
  if (typeof num === 'number') {
    const rounded = roundMoney(num, 2);
    num = rounded.toString();
  }
  return num
    .toString()
    .split('')
    .map((char) => BANGLA_DIGITS[char] || char)
    .join('');
}

export function parseBanglaOrEnglishNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const banglaToEnglishMap: Record<string, string> = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9',
  };
  const str = String(val)
    .replace(/[০-৯]/g, (d) => banglaToEnglishMap[d] || d)
    .replace(/,/g, '')
    .trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export function parseDate(dateStr: string) {
  // Expected YYYY-MM-DD
  if (!dateStr) {
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth() + 1, day: now.getDate() };
  }
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const monthIndex = parseInt(parts[1], 10) || 1; // 1 to 12
  const day = parseInt(parts[2], 10) || 1;
  return { year, monthIndex, day };
}

export function getMonthNameBangla(monthIndex: number): string {
  return BANGLA_MONTHS[monthIndex - 1] || `${monthIndex} নং মাস`;
}

// Compute Year & Month analytics for all records
export function computeYearlyMonthlyData(workers: Worker[], records: WorkRecord[]) {
  // Map of year -> map of monthIndex -> records
  const workerMap = new Map(workers.map((w) => [w.id, w]));

  const yearMap = new Map<number, WorkRecord[]>();

  records.forEach((rec) => {
    const { year } = parseDate(rec.date);
    if (!yearMap.has(year)) {
      yearMap.set(year, []);
    }
    yearMap.get(year)!.push(rec);
  });

  // Current year fallback
  const currentYear = new Date().getFullYear();
  if (!yearMap.has(currentYear)) {
    yearMap.set(currentYear, []);
  }

  const availableYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

  const yearSummaries: YearSummary[] = availableYears.map((year) => {
    const yearRecords = yearMap.get(year) || [];

    // Breakdown for 12 months
    const monthlyBreakdown: MonthSummary[] = [];

    for (let m = 1; m <= 12; m++) {
      const monthKey = `${year}-${String(m).padStart(2, '0')}`;
      const monthRecords = yearRecords.filter((r) => {
        const { monthIndex } = parseDate(r.date);
        return monthIndex === m;
      });

      let totalDays = 0;
      let totalEarned = 0;
      let totalPaid = 0;
      let totalAdvance = 0;
      const activeWorkerIds = new Set<string>();

      monthRecords.forEach((r) => {
        const w = workerMap.get(r.workerId);
        const dailyRate = w ? Number(w.dailyWage) || 0 : 0;
        const days = parseBanglaOrEnglishNumber(r.days);
        const paid = parseBanglaOrEnglishNumber(r.paid);
        const advance = parseBanglaOrEnglishNumber(r.advance);

        totalDays = roundMoney(totalDays + days);
        totalEarned = roundMoney(totalEarned + days * dailyRate);
        totalPaid = roundMoney(totalPaid + paid);
        totalAdvance = roundMoney(totalAdvance + advance);
        if (days > 0 || paid > 0 || advance > 0) {
          activeWorkerIds.add(r.workerId);
        }
      });

      const totalPaidAll = roundMoney(totalPaid + totalAdvance);
      const balance = roundMoney(totalEarned - totalPaidAll);

      monthlyBreakdown.push({
        monthKey,
        year,
        monthIndex: m,
        monthName: getMonthNameBangla(m),
        totalDays: roundMoney(totalDays),
        totalEarned: roundMoney(totalEarned),
        totalPaid: roundMoney(totalPaid),
        totalAdvance: roundMoney(totalAdvance),
        totalPaidAll,
        balance,
        recordsCount: monthRecords.length,
        activeWorkersCount: activeWorkerIds.size,
      });
    }

    let yDays = 0;
    let yEarned = 0;
    let yPaid = 0;
    let yAdvance = 0;

    monthlyBreakdown.forEach((mb) => {
      yDays = roundMoney(yDays + mb.totalDays);
      yEarned = roundMoney(yEarned + mb.totalEarned);
      yPaid = roundMoney(yPaid + mb.totalPaid);
      yAdvance = roundMoney(yAdvance + mb.totalAdvance);
    });

    const yPaidAll = roundMoney(yPaid + yAdvance);
    const yBalance = roundMoney(yEarned - yPaidAll);

    return {
      year,
      totalDays: yDays,
      totalEarned: yEarned,
      totalPaid: yPaid,
      totalAdvance: yAdvance,
      totalPaidAll: yPaidAll,
      balance: yBalance,
      recordsCount: yearRecords.length,
      monthlyBreakdown,
    };
  });

  return { availableYears, yearSummaries };
}

// Compute WorkerSummaries filtered by Year and optional Month
export function filterSummariesByPeriod(
  workers: Worker[],
  records: WorkRecord[],
  selectedYear: number | 'all',
  selectedMonth: number | 'all'
): WorkerSummary[] {
  return workers.map((w) => {
    const filteredRecords = records.filter((r) => {
      if (r.workerId !== w.id) return false;
      const { year, monthIndex } = parseDate(r.date);

      if (selectedYear !== 'all' && year !== selectedYear) {
        return false;
      }
      if (selectedMonth !== 'all' && monthIndex !== selectedMonth) {
        return false;
      }
      return true;
    });

    let totalDays = 0;
    let totalPaid = 0;
    let totalAdvance = 0;

    filteredRecords.forEach((r) => {
      totalDays = roundMoney(totalDays + parseBanglaOrEnglishNumber(r.days));
      totalPaid = roundMoney(totalPaid + parseBanglaOrEnglishNumber(r.paid));
      totalAdvance = roundMoney(totalAdvance + parseBanglaOrEnglishNumber(r.advance));
    });

    const wageRate = Number(w.dailyWage) || 0;
    const totalEarned = roundMoney(totalDays * wageRate);
    const totalPaidAll = roundMoney(totalPaid + totalAdvance);
    let balance = roundMoney(totalEarned - totalPaidAll);

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
      worker: w,
      totalDays,
      totalEarned,
      totalPaid,
      totalAdvance,
      totalPaidAll,
      balance,
      status,
      recordsCount: filteredRecords.length,
    };
  });
}

// Helper to calculate 100% accurate summary for a single worker for all records
export function calculateWorkerAllTimeSummary(worker: Worker, records: WorkRecord[]): WorkerSummary {
  const workerRecords = records.filter((r) => r.workerId === worker.id);
  let totalDays = 0;
  let totalPaid = 0;
  let totalAdvance = 0;

  workerRecords.forEach((r) => {
    totalDays = roundMoney(totalDays + parseBanglaOrEnglishNumber(r.days));
    totalPaid = roundMoney(totalPaid + parseBanglaOrEnglishNumber(r.paid));
    totalAdvance = roundMoney(totalAdvance + parseBanglaOrEnglishNumber(r.advance));
  });

  const wageRate = Number(worker.dailyWage) || 0;
  const totalEarned = roundMoney(totalDays * wageRate);
  const totalPaidAll = roundMoney(totalPaid + totalAdvance);
  let balance = roundMoney(totalEarned - totalPaidAll);

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
    worker,
    totalDays,
    totalEarned,
    totalPaid,
    totalAdvance,
    totalPaidAll,
    balance,
    status,
    recordsCount: workerRecords.length,
  };
}

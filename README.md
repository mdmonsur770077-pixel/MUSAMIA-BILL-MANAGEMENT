# মনসুর লেবার পোর্টাল (MONSUR LABOR PORTAL)

> **3D আর্কিটেকচারাল লেবার কন্ট্রোল হাব, বাৎসরিক ও মাসিক অডিট লেজার এবং রিয়েল-টাইম ব্যালেন্স হিসাব ব্যবস্থাপনা পোর্টাল**

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React 19](https://img.shields.io/badge/React-19-cyan.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)
![Three.js](https://img.shields.io/badge/Three.js-3D_BIM-emerald.svg)

---

## 🌟 প্রধান বৈশিষ্ট্যসমূহ (Key Features)

1. **প্রমিত বাংলা টাইপোগ্রাফি (Nikosh Font):**
   - সুন্দর এবং স্পষ্ট বাংলা নিকোশ ফন্টে ১৬ পিক্সেল (16px) বেস ফন্ট সাইজ।

2. **বাৎসরিক ও মাসিক নেভিগেশন ও অডিট (Yearly & Monthly Breakdown):**
   - যেকোনো বছর (যেমন: ২০২৬) নির্বাচন করে পুরো বছরের ১২ মাসের মোট আয়, ব্যয় ও কাজের পরিসংখ্যান।
   - নির্দিষ্ট যেকোনো মাসের (যেমন: সেপ্টেম্বর, আগস্ট, জুলাই) ফিল্টার করে বিস্তারিত খতিয়ান ও অগ্রগতি ট্র্যাক।

3. **মোবাইল-বান্ধব কার্ড ও টেবিল ভিউ (Mobile-First Layout):**
   - মোবাইল স্ক্রিনে স্বয়ংক্রিয়ভাবে সহজে পাঠযোগ্য কার্ড ভিউ।
   - চাইলে এক ক্লিকেই কার্ড ভিউ এবং ক্লাসিক টেবিল ভিউয়ের মধ্যে অদলবদল।
   - টাচ-ফ্রেন্ডলি বাটন (কমপক্ষে ৪৪ পিক্সেল)।

4. **ব্যালেন্স ও আর্থিক অডিট (Real-Time Balance Ledger):**
   - **আপনি পাবেন (Company Claim):** লেবার অগ্রিম/টাকা বেশি নিলে লাল রঙে সতর্কবার্তা।
   - **লেবার পাবে (Labor Due):** লেবারের পাওনা থাকলে সায়ান/সবুজ রঙে প্রদর্শিত।
   - **পরিশোধিত (Settled):** কোনো পাওনা বা দেনা না থাকলে পরিশোধিত স্থিতি।

5. **৩ডি আর্কিটেকচারাল ব্যাকগ্রাউন্ড (Three.js BIM Blueprint):**
   - সিভিল ইঞ্জিনিয়ারিং ও কনস্ট্রাকশন সাইট ব্লুপ্রিন্ট (স্ট্রাকচারাল টাওয়ার, সাইট গ্রিড, স্পেস-ফ্রেম ট্রাস)।
   - প্লে/পজ ও ওয়্যারফ্রেম কন্ট্রোল।

6. **অফলাইন ও লোকাল স্টোরেজ (Local Persistence):**
   - ব্রাউজার বন্ধ করলেও ডেটা সুরক্ষিত থাকে (স্বয়ংক্রিয় LocalStorage সিঙ্ক)।
   - ডেমো ডেটা রিস্টোর করার সুবিধা।

7. **প্রিন্ট ও CSV/এক্সেল এক্সপোর্ট:**
   - নির্বাচিত বছর/মাসের সম্পূর্ণ রিপোর্ট এক্সেল ফরম্যাটে (.csv) ডাউনলোড এবং প্রিন্ট।

---

## 🚀 লোকাল মেশিনে যেভাবে রান করবেন (How to Run Locally)

### ১. ডিপোজিটরি ক্লোন করুন (Clone repository):
```bash
git clone https://github.com/<your-username>/monsur-labor-portal.git
cd monsur-labor-portal
```

### ২. ডিপেন্ডেন্সি ইনস্টল করুন (Install Dependencies):
```bash
npm install
```

### ৩. ডেভেলপমেন্ট সার্ভার চালু করুন (Start Dev Server):
```bash
npm run dev
```
ব্রাউজারে ওপেন করুন: `http://localhost:3000`

### ৪. প্রডাকশন বিল্ড তৈরি করতে (Build for Production):
```bash
npm run build
```

---

## 📂 প্রজেক্ট ফাইল স্ট্রাকচার (Project Structure)

```text
├── index.html                     # HTML এন্ট্রি ও নিকোশ ফন্ট লিংক
├── package.json                   # প্রজেক্ট ডিপেন্ডেন্সি ও স্ক্রিপ্ট
├── tsconfig.json                  # টাইপস্ক্রিপ্ট কনফিগারেশন
├── vite.config.ts                 # ভিট কনফিগারেশন
├── src/
│   ├── main.tsx                   # রিঅ্যাক্ট রুট এন্ট্রি
│   ├── App.tsx                    # প্রধান অ্যাপ্লিকেশন কম্পোনেন্ট
│   ├── types.ts                   # টাইপস্ক্রিপ্ট টাইপ ডেফিনেশন
│   ├── index.css                  # ১৬px ফন্ট ও টেইলউইন্ড সিএসএস
│   ├── data/
│   │   └── initialData.ts         # ডেমো শ্রমিক ও লেনদেন রেকর্ড
│   ├── utils/
│   │   └── dateHelpers.ts         # বাংলা তারিখ, মাস ও বাৎসরিক ক্যালকুলেশন
│   └── components/
│       ├── ThreeBackground.tsx    # ৩ডি সিভিল আর্কিটেকচারাল ব্লুপ্রিন্ট
│       ├── StatsCards.tsx          # মোট লেবার ও আর্থিক পরিসংখ্যান
│       ├── SummaryTable.tsx        # ব্যালেন্স অডিট টেবিল ও মোবাইল কার্ড
│       ├── DailyTransactionForm.tsx # দৈনিক হাজিরা ও লেনদেন এন্ট্রি
│       ├── WorkerRegistrationForm.tsx # নতুন শ্রমিক রেজিস্ট্রেশন
│       ├── WorkerDetailModal.tsx   # শ্রমিকের একক মাসিক লেজার খতিয়ান
│       ├── EditWorkerModal.tsx     # শ্রমিকের তথ্য এডিট
│       ├── YearMonthFilter.tsx     # বছর ও মাস ফিল্টার কন্ট্রোলার
│       ├── YearlyMonthlyDashboard.tsx # ১২ মাসের বাৎসরিক ড্যাশবোর্ড
│       └── FutureRoadmapModal.tsx  # ভবিষ্যৎ ফিচারের আইডিয়া ও রোডম্যাপ
```

---

## 📄 লাইসেন্স
MIT License © 2026 মনসুর লেবার পোর্টাল

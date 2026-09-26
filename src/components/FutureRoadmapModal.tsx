import React from 'react';
import {
  X,
  Sparkles,
  QrCode,
  MessageSquare,
  Building,
  Clock,
  FileText,
  Mic,
  Users2,
  HardHat,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';

interface FutureRoadmapModalProps {
  onClose: () => void;
}

export const FutureRoadmapModal: React.FC<FutureRoadmapModalProps> = ({ onClose }) => {
  const futureFeatures = [
    {
      id: 'qr-attendance',
      icon: QrCode,
      title: 'শ্রমিক ডিজিটাল আইডি কার্ড ও কিউআর (QR) কোড স্ক্যানার',
      category: 'হাজিরা অটোমেশন',
      badge: 'পরবর্তী রিলিজ উপযোগী',
      desc: 'প্রতিটি শ্রমিকের জন্য ছবি ও রেটসহ প্রিন্টযোগ্য কিউআর কোড আইডি কার্ড তৈরি হবে। সাইটে আসার সাথে সাথে মোবাইল ক্যামেরায় স্ক্যান করেই ১ ক্লিকে দৈনিক হাজিরা নিশ্চিত করা যাবে।',
      impact: 'কাগজের হাজিরা খাতার ঝামেলা শূন্য হবে এবং ভুল হাজিরা বন্ধ হবে।',
    },
    {
      id: 'sms-whatsapp',
      icon: MessageSquare,
      title: 'হোয়াটসঅ্যাপ ও এসএমএস পেমেন্ট রসিদ / ভাউচার',
      category: 'যোগাযোগ ও ট্র্যাকিং',
      badge: 'সহজেই যুক্তযোগ্য',
      desc: 'কোনো শ্রমিককে মজুরি বা অ্যাডভান্স টাকা দেওয়ার সাথে সাথে সরাসরি তার মোবাইল নাম্বারে বাংলা এসএমএস বা হোয়াটসঅ্যাপে ব্যালেন্সসহ ডিজিটাল রসিদ চলে যাবে।',
      impact: 'টাকা দেওয়া-নেওয়া নিয়ে শ্রমিক ও ঠিকাদারের মাঝে কোনো ভুল বোঝাবুঝি থাকবে না।',
    },
    {
      id: 'multi-site',
      icon: Building,
      title: 'মাল্টি-প্রজেক্ট ও কনস্ট্রাকশন সাইট পৃথকীকরণ',
      category: 'প্রজেক্ট ম্যানেজমেন্ট',
      badge: 'অত্যাবশ্যকীয় ফিচার',
      desc: 'আপনার যদি একাধিক প্রজেক্ট চলে (যেমন: "ধানমন্ডি সাইট", "মিরপুর প্রজেক্ট", "উত্তরা ভিলা"), তবে আলাদা প্রজেক্ট সুইচ করে প্রতিটি সাইটের জন্য আলাদা লেবার বাজেট ও খতিয়ান রাখা যাবে।',
      impact: 'প্রতিটি সাইটের জন্য কত টাকা লেবার খরচ হচ্ছে তা আলাদা লাভ-ক্ষতি আকারে জানা যাবে।',
    },
    {
      id: 'overtime-bonus',
      icon: Clock,
      title: 'ওভারটাইম ও উৎসব বোনাস অটো-ক্যালকুলেটর',
      category: 'মজুরি নীতি',
      badge: 'উন্নত অ্যালগরিদম',
      desc: 'দৈনিক সাধারণ ডিউটির বাইরে অতিরিক্ত ঘণ্টা (যেমন: প্রতি ঘণ্টা ৫০ টাকা রেট) এবং ঈদ বা পূজায় অতিরিক্ত বোনাস এক ক্লিকে মূল মজুরির সাথে স্বয়ংক্রিয়ভাবে যুক্ত হবে।',
      impact: 'জটিল ওভারটাইম হিসাব এক সেকেন্ডে স্বয়ংক্রিয় হয়ে যাবে।',
    },
    {
      id: 'pdf-payslip',
      icon: FileText,
      title: 'অফিসিয়াল বাংলা পিডিএফ পে-স্লিপ ও সিল-স্বাক্ষরের ভাউচার',
      category: 'ডকুমেন্টেশন',
      badge: 'ডাউনলোড ফিচার',
      desc: 'কোম্পানি লোগো, শ্রমিকের বিস্তারিত, মোট কর্মদিবস, কর্তনকৃত অ্যাডভান্স ও নিট প্রদেয় টাকার সুন্দর PDF প্রিন্ট ভাউচার তৈরি হবে যাতে শ্রমিক ও ক্যাশিয়ারের স্বাক্ষরের ঘর থাকবে।',
      impact: 'অডিট বা আইনি প্রমাণের জন্য পাকাপোক্ত অফিসিয়াল রেকর্ড সংরক্ষিত থাকবে।',
    },
    {
      id: 'voice-entry',
      icon: Mic,
      title: 'বাংলা ভয়েস কমান্ড এন্ট্রি (মুখে বলে হিসাব যোগ)',
      category: 'স্মার্ট এআই ইনপুট',
      badge: 'AI ফিচার',
      desc: 'সাইটে দাঁড়িয়ে টাইপ করার সময় না থাকলে মাইক্রোফোনে মুখে বাংলায় বলবেন— "আজকে রহিমের ১ দিন হাজিরা আর ৫০০ টাকা অ্যাডভান্স লিখো", সাথে সাথে সিস্টেমে এন্ট্রি সেভ হয়ে যাবে।',
      impact: 'সাইটে দ্রুত কাজের সময় কোনো কিবোর্ড টাইপিংয়ের প্রয়োজন হবে না।',
    },
    {
      id: 'supervisor-role',
      icon: Users2,
      title: 'সুপারভাইজার / সাইট সর্দার রোল ও ক্লাউড পারমিশন',
      category: 'টিম কোলাবোরেশন',
      badge: 'সিকিউরিটি',
      desc: 'সাইট ইঞ্জিনিয়ার বা সর্দার কেবল মোবাইলে হাজিরা ও অগ্রিম এন্ট্রি দিতে পারবেন, কিন্তু রেট পরিবর্তন বা কোনো রেকর্ড ডিলিট করতে পারবেন না। চূড়ান্ত অনুমোদন দেবেন মালিক।',
      impact: 'মালিক দূরে থেকেও একাধিক সাইটের হিসাব নিরাপদে পর্যবেক্ষণ করতে পারবেন।',
    },
    {
      id: 'material-cost',
      icon: HardHat,
      title: 'সাইট ম্যাটেরিয়াল (রড, সিমেন্ট, বালি) ও ইকুইপমেন্ট লেজার',
      category: 'সাইট একাউন্টিং',
      badge: 'পূর্ণাঙ্গ ইআরপি',
      desc: 'লেবার হিসাবের পাশাপাশি দৈনিক রড, সিমেন্ট, ইট ও ট্রাকভাড়ার দৈনিক ক্যাশ ভাউচার যোগ করে পুরো সাইটের সম্পূর্ণ ব্যালেন্স শীট তৈরি করা যাবে।',
      impact: 'একটি অ্যাপ দিয়েই পুরো সাইটের লেবার ও ম্যাটেরিয়াল হিসাব নিয়ন্ত্রণ করা যাবে।',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-4xl p-6 relative border-[#00f2fe]/40 my-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2fe]/20 to-[#4facfe]/20 border border-[#00f2fe]/40 flex items-center justify-center text-[#00f2fe]">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>ভবিষ্যতে যেসকল নতুন ফিচার যুক্ত করা যাবে</span>
                <span className="text-xs font-normal text-[#00f2fe] bg-[#00f2fe]/10 px-2.5 py-0.5 rounded-full border border-[#00f2fe]/20">
                  রোডম্যাপ ও আইডিয়া
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                আপনার কনস্ট্রাকশন সাইট ও লেবার ম্যানেজমেন্টকে আরও আধুনিক ও শক্তিশালী করার সেরা ফিচারসমূহ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {futureFeatures.map((feat) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="p-4 rounded-xl bg-[#090e21]/90 border border-white/10 hover:border-[#00f2fe]/50 transition-all group relative overflow-hidden"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#00f2fe]/10 border border-[#00f2fe]/25 flex items-center justify-center text-[#00f2fe] shrink-0 group-hover:scale-105 transition-transform">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                          {feat.category}
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                          {feat.badge}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-sm group-hover:text-[#00f2fe] transition-colors mb-1">
                        {feat.title}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed mb-2">
                        {feat.desc}
                      </p>

                      <div className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-1.5 border-t border-white/5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#00f2fe] shrink-0 mt-0.5" />
                        <span><strong className="text-slate-200">উপকারিতা:</strong> {feat.impact}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-cyan-300">
            <Sparkles className="w-4 h-4" />
            <span>এর মধ্যে যেকোনো ফিচার প্রয়োজন হলে বলুন, এখনই কোডে যুক্ত করে দেওয়া হবে!</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#00f2fe] hover:bg-[#00d0db] text-[#050814] font-bold transition-all shadow-[0_0_15px_rgba(0,242,254,0.4)]"
          >
            ঠিক আছে, বুঝলাম
          </button>
        </div>
      </div>
    </div>
  );
};

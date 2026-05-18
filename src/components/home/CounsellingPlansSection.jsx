import React from 'react';
import { ArrowRight, GraduationCap, ShieldCheck, Star, Users } from 'lucide-react';

export default function CounsellingPlansSection({ onOpenCounselling }) {
  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 sm:py-8">
      <div className="relative overflow-hidden rounded-[1.6rem] sm:rounded-[2rem] bg-gradient-to-br from-blue-700 via-indigo-700 to-[#071426] p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-4">
              <GraduationCap size={14} className="text-emerald-300" />
              Separate Counselling Option
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-3">
              NEET / College Counselling Plans
            </h2>

            <p className="text-sm sm:text-base text-blue-50/90 font-medium leading-relaxed max-w-2xl mb-5">
              Form filling cards ab direct individual exam pages par redirect honge. Counselling plans ke liye ye separate option use karo, taki students confuse na hon.
            </p>

            <div className="grid grid-cols-1 min-[460px]:grid-cols-3 gap-3 mb-6">
              <MiniPoint icon={<ShieldCheck size={16} />} title="Safe Guidance" />
              <MiniPoint icon={<Users size={16} />} title="Expert Support" />
              <MiniPoint icon={<Star size={16} />} title="Plan Comparison" />
            </div>

            <button
              onClick={onOpenCounselling}
              className="w-full min-[420px]:w-auto bg-white text-blue-700 hover:bg-blue-50 font-black py-3.5 px-7 rounded-full flex items-center justify-center gap-2 shadow-lg"
            >
              View Counselling Plans <ArrowRight size={16} />
            </button>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-[1.5rem] bg-white/10 border border-white/15 p-5 backdrop-blur">
              <div className="space-y-3">
                {['Choice filling support', 'College preference guidance', 'Document verification help', 'Seat allotment update'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    <span className="text-sm font-bold text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniPoint({ icon, title }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white/10 border border-white/10 px-3 py-2">
      <span className="text-emerald-300">{icon}</span>
      <span className="text-xs font-black">{title}</span>
    </div>
  );
}

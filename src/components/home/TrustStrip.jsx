import React from 'react';
import { trustBenefits } from '../../data/homeData';

export default function TrustStrip() {
  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 pb-8 sm:pb-10">
      <div className="bg-[#071426] rounded-[1.6rem] sm:rounded-[2rem] p-5 sm:p-7 md:p-8 text-white shadow-2xl">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-center mb-6 sm:mb-8">
          Why Students & Parents Trust EduFill?
        </h2>

        <div className="grid grid-cols-1 min-[430px]:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {trustBenefits.map((item) => (
            <div key={item.title} className="flex items-start gap-3 sm:gap-4 rounded-2xl bg-white/[0.035] p-4 lg:bg-transparent lg:p-0 lg:border-r lg:border-white/10 last:border-0 lg:pr-5">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/5 border border-white/10 text-emerald-400 flex items-center justify-center shrink-0 p-2.5 sm:p-3">
                {item.icon}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black mb-1">{item.title}</h3>
                <p className="text-[10px] sm:text-xs text-gray-400 leading-relaxed font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

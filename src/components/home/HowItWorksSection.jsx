import React from 'react';
import { howItWorks } from '../../data/homeData';

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="max-w-[1400px] mx-auto px-4 md:px-8 py-7 sm:py-8 md:py-12">
      <div className="flex items-center justify-center gap-4 mb-7 sm:mb-10">
        <div className="hidden sm:block h-px bg-gradient-to-r from-transparent to-emerald-300 w-28" />
        <h2 className="text-2xl md:text-3xl font-black text-gray-950 text-center">How EduFill Works</h2>
        <div className="hidden sm:block h-px bg-gradient-to-r from-emerald-300 to-transparent w-28" />
      </div>

      <div className="relative">
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-5 gap-6">
          {howItWorks.map((step, index) => (
            <StepCard key={step.title} step={step} index={index} desktop />
          ))}
        </div>

        {/* Mobile vertical timeline */}
        <div className="sm:hidden space-y-4">
          {howItWorks.map((step, index) => (
            <div key={step.title} className="relative flex gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              {index !== howItWorks.length - 1 && (
                <div className="absolute left-[34px] top-14 bottom-[-18px] w-px bg-gray-200" />
              )}
              <div className={`relative z-10 w-10 h-10 rounded-full ${step.bg} ${step.color} flex items-center justify-center border-4 border-white shadow-md shrink-0`}>
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">{index + 1}</span>
                  <h3 className="text-sm font-black text-gray-900">{step.title}</h3>
                </div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, index }) {
  return (
    <div className="relative text-center">
      {index !== howItWorks.length - 1 && (
        <div className="hidden lg:block absolute top-12 left-[62%] w-[75%] h-px border-t border-dashed border-gray-300" />
      )}

      <div className={`relative mx-auto w-24 h-24 rounded-full ${step.bg} ${step.color} flex items-center justify-center border-[8px] border-white shadow-lg mb-4`}>
        {step.icon}
      </div>

      <div className="inline-flex items-center gap-2 mb-2">
        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
          {index + 1}
        </span>
        <h3 className="text-sm font-black text-gray-900">{step.title}</h3>
      </div>
      <p className="text-xs text-gray-500 font-medium max-w-[170px] mx-auto leading-relaxed">{step.desc}</p>
    </div>
  );
}

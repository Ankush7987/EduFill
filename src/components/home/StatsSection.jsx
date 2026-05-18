import React from 'react';

export default function StatsSection() {
  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 sm:py-8">
      <div className="bg-white/90 border border-gray-100 rounded-[1.6rem] sm:rounded-[2rem] p-5 sm:p-6 md:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-6 sm:gap-8 items-center">
        <div className="text-center lg:text-left">
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-emerald-700 mb-3">
            Trusted by Thousands of Students Across India
          </h2>
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="flex -space-x-3">
              {[3, 8, 12, 22].map((img) => (
                <img key={img} src={`https://i.pravatar.cc/80?img=${img}`} alt="Student" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white" />
              ))}
            </div>
            <span className="text-xs font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">+25K</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {[
            ['25K+', 'Forms Filled'],
            ['300+', 'Institutes Served'],
            ['50K+', 'Happy Students'],
            ['99.8%', 'Success Rate'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-gray-50 p-4 sm:bg-transparent sm:p-0 md:border-l md:border-gray-200 md:pl-7 text-center md:text-left">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-600">{value}</h3>
              <p className="text-[10px] sm:text-xs font-black text-gray-700 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

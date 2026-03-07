import React from 'react';

const Partners = () => (
  <section id="partners" className="py-20 px-4 bg-gray-50">
    <div className="max-w-7xl mx-auto text-center">
      <h2 className="text-3xl font-extrabold mb-12 text-gray-400 uppercase tracking-widest">Our Trusted Partners</h2>
      <div className="flex flex-wrap justify-center gap-8 md:gap-12 items-center">
        <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-2xl shadow-sm border border-gray-100 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center font-bold text-xl italic text-white shadow-inner">RI</div>
          <div className="text-left">
            <p className="font-bold text-xl text-gray-900">Ribosome Institute</p>
            <p className="text-sm text-emerald-500 font-medium">Official Partner</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-2xl shadow-sm border border-gray-100 grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center font-bold text-2xl text-white shadow-inner">U</div>
          <div className="text-left">
            <p className="font-bold text-xl text-gray-900">Unacademy</p>
            <p className="text-sm text-emerald-500 font-medium">Learning Partner</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Partners;
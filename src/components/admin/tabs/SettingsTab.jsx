import React from 'react';

export default function SettingsTab({ liveExams, toggleExam }) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <header className="mb-6 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Platform Form Controls</h1>
      </header>
      <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
        <div className="space-y-4 md:space-y-5">
          {['neet', 'jee', 'cuet'].map((examKey) => (
            <div key={examKey} className="flex items-center justify-between p-4 md:p-5 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl border border-gray-200">
              <div><p className="font-bold text-base md:text-lg text-gray-800 uppercase tracking-wide">{examKey}</p></div>
              <button onClick={() => toggleExam(examKey)} className={`relative inline-flex h-7 w-12 md:h-8 md:w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${liveExams[examKey] ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <span className={`pointer-events-none inline-block h-6 w-6 md:h-7 md:w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${liveExams[examKey] ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
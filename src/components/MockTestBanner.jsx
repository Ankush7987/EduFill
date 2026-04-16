import React from 'react';
import { Clock, BarChart3, CheckSquare, ArrowRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MockTestBanner() {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-950 rounded-[2rem] shadow-lg hover:shadow-xl hover:shadow-emerald-900/20 relative overflow-hidden flex flex-col items-start border border-gray-800 h-full p-8 group transition-all duration-300">
      
      {/* Decorative BG */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 opacity-10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 opacity-10 rounded-full blur-3xl -ml-10 -mb-10"></div>
      
      <div className="relative z-10 w-full flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-5">
          <span className="inline-block px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase tracking-widest border border-emerald-500/30">
            100% Free Feature
          </span>
          <FileText size={40} className="text-emerald-400/20 transition-transform group-hover:scale-110 duration-500" />
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
          Live NTA Pattern <br/><span className="text-emerald-400">Mock Exams</span>
        </h2>
        <p className="text-gray-400 text-sm mb-8 flex-1 font-medium leading-relaxed pr-4">
          Experience the real exam interface. Get instant detailed solutions, accuracy reports, and see where you stand.
        </p>
        
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex items-center gap-1.5 text-white font-bold text-xs bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><CheckSquare className="text-emerald-400" size={14}/> NTA Pattern</div>
          <div className="flex items-center gap-1.5 text-white font-bold text-xs bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><BarChart3 className="text-purple-400" size={14}/> Instant Analysis</div>
        </div>

        <Link 
          to="/mock-test" 
          className="mt-auto w-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-gray-900 font-black py-4 px-6 rounded-xl text-sm gap-2 transition-all duration-300 shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          Take Free Mock Test <ArrowRight size={18}/>
        </Link>
      </div>
    </div>
  );
}
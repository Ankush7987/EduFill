import React from 'react';
import { Search, MapPin, Target, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CollegePredictorBanner() {
  return (
    <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-[2rem] shadow-lg hover:shadow-xl hover:shadow-indigo-900/20 relative overflow-hidden flex flex-col items-start border border-indigo-800 h-full p-8 group transition-all duration-300">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500 opacity-20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 opacity-20 rounded-full blur-3xl -ml-10 -mb-10"></div>
      
      <div className="relative z-10 w-full flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-5">
          <span className="inline-block px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[10px] uppercase tracking-widest border border-blue-500/30">
            Dual-AI Engine
          </span>
          <Search size={40} className="text-blue-400/20 transition-transform group-hover:scale-110 duration-500" />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
          Predict Your <br/><span className="text-blue-400">Dream College</span>
        </h2>
        <p className="text-gray-300 text-sm mb-8 flex-1 font-medium leading-relaxed pr-4">
          Check official cutoffs and predict your admission chances for UG courses using our advanced AI tool.
        </p>
        
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex items-center gap-1.5 text-white font-bold text-xs bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><Target className="text-blue-400" size={14}/> Accurate Predictions</div>
          <div className="flex items-center gap-1.5 text-white font-bold text-xs bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"><MapPin className="text-purple-400" size={14}/> All India & State</div>
        </div>

        <Link 
          to="/college-predictor" 
          className="mt-auto w-full flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-black py-4 px-6 rounded-xl text-sm gap-2 transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-95"
        >
          Launch Predictor <ArrowRight size={18}/>
        </Link>
      </div>
    </div>
  );
}
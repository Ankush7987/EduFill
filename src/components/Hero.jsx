import React from 'react';
import { ArrowRight, BellRing, MessageCircle, ShieldCheck, Zap, Star } from 'lucide-react';

const Hero = ({ openBooking, liveExams }) => {
  // Array jisme saare exams hain, isme se hum filter karenge jo LIVE hain
  const activeExams = [
    { key: 'neet', isLive: liveExams?.neet, name: 'NEET UG 2026' },
    { key: 'jee', isLive: liveExams?.jee, name: 'JEE Main / Adv' },
    { key: 'cuet', isLive: liveExams?.cuet, name: 'CUET UG' }
  ].filter(exam => exam.isLive); // Sirf wahi bachenge jinka isLive true hai

  return (
    <section id="home" className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <div className="text-center lg:text-left">
            
            {/* DYNAMIC LIVE BANNERS SECTION */}
            <div className="flex flex-col gap-3 mb-8 items-center lg:items-start">
              {activeExams.map((exam) => (
                <div 
                  key={exam.key} 
                  onClick={openBooking} 
                  className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-red-500/10 border border-red-500/30 backdrop-blur-md cursor-pointer hover:bg-red-500/20 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                >
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </div>
                  <span className="text-red-400 font-extrabold text-sm tracking-widest uppercase">{exam.name} Forms are LIVE</span>
                  <span className="hidden sm:inline-block w-px h-4 bg-red-500/30"></span>
                  <span className="hidden sm:inline flex items-center gap-1 text-red-200 text-sm font-medium">
                    <BellRing size={14} /> Click to Book Slot!
                  </span>
                </div>
              ))}
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
              Form Bharne Ki <br/> Tension Chhodo, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Padhai Pe Focus Karo!
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto lg:mx-0 opacity-90 leading-relaxed">
              NEET, JEE, aur CUET ke forms bina kisi galti ke bhariye. Humari expert team ensure karti hai 100% accuracy aur peace of mind.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
              <button onClick={openBooking} className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                Book a Slot Now <ArrowRight size={20} />
              </button>
              <a href="https://wa.me/919752519051" className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
                <MessageCircle size={20} /> Chat with Experts
              </a>
            </div>

            <div className="mt-12 flex items-center justify-center lg:justify-start gap-6 text-sm font-medium text-blue-200">
              <div className="flex items-center gap-2"><ShieldCheck className="text-emerald-400" size={20}/> 100% Error-Free</div>
              <div className="flex items-center gap-2"><Zap className="text-emerald-400" size={20}/> Fast Processing</div>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400 to-blue-500 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white">Live Application Status</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">Active</span>
              </div>
              
              <div className="space-y-6">
                {[
                  { step: 'Registration Desk', status: 'In Progress', color: 'text-amber-400' },
                  { step: 'Category Verification', status: 'Pending', color: 'text-blue-300' },
                  { step: 'Payment & Submission', status: 'Pending Slot', color: 'text-blue-300' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${item.status === 'In Progress' ? 'bg-amber-400 animate-pulse' : 'bg-blue-400/50'}`}></div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{item.step}</p>
                      <p className={`text-sm opacity-80 ${item.color}`}>{item.status}</p>
                    </div>
                    {item.status === 'In Progress' ? <span className="text-2xl animate-spin-slow">⏳</span> : <span className="text-xl text-white/30">⏳</span>}
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                {/* Clean UI - No Images Used Here as requested previously */}
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-blue-900 bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">AK</div>
                  <div className="w-10 h-10 rounded-full border-2 border-blue-900 bg-emerald-500 flex items-center justify-center text-xs font-bold text-white">RJ</div>
                  <div className="w-10 h-10 rounded-full border-2 border-blue-900 bg-purple-500 flex items-center justify-center text-xs font-bold text-white">SM</div>
                  <div className="w-10 h-10 rounded-full border-2 border-blue-900 bg-gray-800 flex items-center justify-center text-xs font-bold text-white">+2k</div>
                </div>
                <div className="text-right">
                  <div className="flex text-amber-400 text-sm"><Star size={14}/><Star size={14}/><Star size={14}/><Star size={14}/><Star size={14}/></div>
                  <p className="text-xs text-blue-200 mt-1">Trusted by students</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
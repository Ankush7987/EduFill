import React from 'react';
import { ArrowRight, BellRing, MessageCircle, ShieldCheck, Zap, Star } from 'lucide-react';

const Hero = ({ openBooking, liveExams }) => {
  const activeExams = [
    { key: 'neet', isLive: liveExams?.neet, name: 'NEET UG' },
    { key: 'jee', isLive: liveExams?.jee, name: 'JEE Main' },
    { key: 'cuet', isLive: liveExams?.cuet, name: 'CUET UG' }
  ].filter(exam => exam.isLive);

  return (
    <section id="home" className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gray-900">
      {/* Premium Glow Backgrounds */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          
          <div className="text-center lg:text-left">
            {/* DYNAMIC LIVE BANNERS */}
            <div className="flex flex-wrap gap-3 mb-8 items-center justify-center lg:justify-start">
              {activeExams.map((exam) => (
                <div 
                  key={exam.key} 
                  onClick={openBooking} 
                  className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer hover:bg-white/10 transition-all shadow-xl"
                >
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </div>
                  <span className="text-gray-200 font-bold text-xs tracking-widest uppercase">{exam.name} LIVE</span>
                </div>
              ))}
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              Form Bharne Ki <br/> Tension Chhodo, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Padhai Pe Focus Karo!
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              NEET, JEE, aur CUET ke forms bina kisi galti ke bhariye. Humari expert team ensure karti hai 100% accuracy aur peace of mind.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button onClick={openBooking} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                Book a Slot Now <ArrowRight size={20} />
              </button>
              <a href="https://wa.me/919752519051" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                <MessageCircle size={20} /> Chat with Experts
              </a>
            </div>

            <div className="mt-10 flex items-center justify-center lg:justify-start gap-8 text-sm font-bold text-gray-400">
              <div className="flex items-center gap-2"><ShieldCheck className="text-indigo-400" size={20}/> 100% Error-Free</div>
              <div className="flex items-center gap-2"><Zap className="text-amber-400" size={20}/> Fast Processing</div>
            </div>
          </div>

          {/* RIGHT SIDE GRAPHIC */}
          <div className="hidden lg:block relative pl-10">
            <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
              <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                <h3 className="text-xl font-bold text-white">Live Application Status</h3>
                <span className="bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/20">Active</span>
              </div>
              
              <div className="space-y-8">
                {[
                  { step: 'Registration Desk', status: 'Expert Reviewing', color: 'text-amber-400' },
                  { step: 'Category Verification', status: 'Pending', color: 'text-gray-500' },
                  { step: 'Payment & Submission', status: 'Awaiting', color: 'text-gray-500' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-5">
                    <div className={`w-4 h-4 rounded-full ${item.status === 'Expert Reviewing' ? 'bg-amber-400 animate-pulse ring-4 ring-amber-400/20' : 'bg-gray-700'}`}></div>
                    <div className="flex-1">
                      <p className={`font-bold text-lg ${item.status === 'Expert Reviewing' ? 'text-white' : 'text-gray-400'}`}>{item.step}</p>
                      <p className={`text-sm font-medium ${item.color}`}>{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex -space-x-3">
                  <div className="w-12 h-12 rounded-full border-4 border-gray-900 bg-indigo-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">AK</div>
                  <div className="w-12 h-12 rounded-full border-4 border-gray-900 bg-emerald-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">RJ</div>
                  <div className="w-12 h-12 rounded-full border-4 border-gray-900 bg-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">SM</div>
                </div>
                <div className="text-right">
                  <div className="flex text-amber-400"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Trusted by 5000+ students</p>
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
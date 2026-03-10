import React, { useState } from 'react';
import { PhoneCall, Home, Award, CheckCircle, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import CounsellingModal from './CounsellingModal'; // 🌟 NAYA IMPORT 🌟

export default function CounsellingSection() {
  // 🌟 NAYA STATE LOGIC 🌟
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  const handlePlanSelect = (planName) => {
    setSelectedPlan(planName);
    setIsModalOpen(true);
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      
      {/* 🌟 MODAL COMPONENT YAHAN ADD KIYA HAI 🌟 */}
      <CounsellingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        selectedPlan={selectedPlan} 
      />

      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-extrabold text-emerald-600 tracking-wider uppercase bg-emerald-100 px-4 py-1.5 rounded-full mb-4 inline-block shadow-sm">
            <Star size={14} className="inline mr-1 pb-0.5" /> Post-Exam Support
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
            Stress-Free <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Counselling & Admission</span>
          </h2>
          <p className="text-lg text-gray-600 font-medium">
            Form bharna sirf shuruaat hai. Hamare experts aapko best college dilwane tak aapke saath khade rahenge. Apna plan chunein!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Plan 1: Free Tele-Consulting */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 relative group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><PhoneCall size={28} /></div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Tele-Consulting</h3>
            <p className="text-gray-500 text-sm mb-6 h-10">Basic doubts and cut-off guidance over a phone call.</p>
            <div className="mb-6"><span className="text-3xl font-black text-gray-900">Free</span></div>
            <ul className="space-y-4 mb-8">
              {['Expected Cut-off Information', 'College Prediction Overview', 'Basic Document Checklist', 'One-time Expert Call'].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm font-medium text-gray-700"><CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" /> {feature}</li>
              ))}
            </ul>
            {/* 🌟 ONCLICK CHANGE KIYA HAI 🌟 */}
            <button onClick={() => handlePlanSelect('Free Tele-Consulting')} className="w-full py-3.5 px-4 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl font-bold transition-colors flex justify-center items-center gap-2">
              Book Free Call
            </button>
          </div>

          {/* Plan 2: Home Visit (Most Popular) */}
          <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-800 hover:shadow-emerald-900/20 transition-all hover:-translate-y-2 relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">Most Popular</div>
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6"><Home size={28} /></div>
            <h3 className="text-xl font-extrabold text-white mb-2">Expert Home Visit</h3>
            <p className="text-gray-400 text-sm mb-6 h-10">Personalized in-person guidance at your doorstep.</p>
            <div className="mb-6 flex items-baseline gap-2"><span className="text-3xl font-black text-white">Paid</span><span className="text-sm font-medium text-gray-400">/visit</span></div>
            <ul className="space-y-4 mb-8">
              {['Physical Document Verification', 'State vs All India Quota Strategy', 'Personalized College Preference List', 'Doubt Clearing with Parents'].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm font-medium text-gray-300"><CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" /> {feature}</li>
              ))}
            </ul>
            <button onClick={() => handlePlanSelect('Expert Home Visit (Paid)')} className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-900 rounded-xl font-black shadow-lg shadow-emerald-500/30 transition-all flex justify-center items-center gap-2">
              Request Home Visit <ArrowRight size={18} />
            </button>
          </div>

          {/* Plan 3: End-to-End Premium */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 relative group">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Award size={28} /></div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Premium Admission</h3>
            <p className="text-gray-500 text-sm mb-6 h-10">Complete support until you secure your college seat.</p>
            <div className="mb-6"><span className="text-3xl font-black text-gray-900">Premium</span></div>
            <ul className="space-y-4 mb-8">
              {['Dedicated Admission Counsellor', 'Choice Filling for All Rounds (1, 2, Mop-up)', 'Real-time Seat Upgradation Tracking', 'Priority 24/7 WhatsApp/Call Support'].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm font-medium text-gray-700"><CheckCircle size={18} className="text-purple-500 flex-shrink-0 mt-0.5" /> {feature}</li>
              ))}
            </ul>
            <button onClick={() => handlePlanSelect('End-to-End Premium Admission')} className="w-full py-3.5 px-4 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white rounded-xl font-bold transition-colors flex justify-center items-center gap-2">
              Get Premium Support
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
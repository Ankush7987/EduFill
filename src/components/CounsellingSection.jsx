import React, { useState } from 'react';
import { ArrowRight, PhoneCall, Home, Star, CheckCircle2, X, Loader2, Award } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; 

export default function CounsellingSection() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    mobile: '',
    examTarget: 'NEET', // Default value
    score: ''
  });

  // 3 Professional Packages Data
  const packages = [
    {
      id: 'tele',
      title: 'Free Tele Consulting',
      price: 'Free',
      icon: <PhoneCall size={28} className="text-blue-500" />,
      features: [
        'Basic Profile Review',
        '15-min Expert Phone Call',
        'General Cutoff Idea',
        'Doubt Clearing Session'
      ],
      cardStyle: 'bg-white border-2 border-gray-100 hover:border-blue-300',
      textStyle: 'text-gray-900',
      buttonStyle: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      badge: null
    },
    {
      id: 'home',
      title: 'Home Visit Guidance',
      price: 'Standard',
      icon: <Home size={28} className="text-amber-500" />,
      features: [
        'Face-to-Face Expert Guidance',
        'Document Verification at Home',
        'Personalized Preference List',
        'Parents Counselling Session'
      ],
      cardStyle: 'bg-white border-2 border-amber-200 shadow-md hover:shadow-lg relative',
      textStyle: 'text-gray-900',
      buttonStyle: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
      badge: 'Most Popular'
    },
    {
      id: 'premium',
      title: 'Premium Plan (Paid)',
      price: 'Premium',
      icon: <Star size={28} className="text-yellow-400" />,
      features: [
        'End-to-End Admission Support',
        'Priority Home Visits Included',
        'Choice Filling done by Experts',
        '24/7 Dedicated WhatsApp Support'
      ],
      cardStyle: 'bg-gradient-to-br from-indigo-900 to-purple-900 border-2 border-indigo-900 shadow-xl transform md:-translate-y-2',
      textStyle: 'text-white',
      buttonStyle: 'bg-white text-indigo-900 hover:bg-gray-100',
      badge: 'Best Value'
    }
  ];

  // Handle Form Submission to Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "Counselling_Requests"), {
        ...formData,
        planSelected: selectedPlan.title,
        status: 'New Request',
        timestamp: serverTimestamp()
      });
      alert(`Success! Your request for ${selectedPlan.title} has been submitted. Our team will contact you soon.`);
      setIsFormOpen(false);
      setFormData({ studentName: '', mobile: '', examTarget: 'NEET', score: '' });
    } catch (error) {
      console.error("Error submitting form: ", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openFormForPlan = (plan) => {
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  return (
    <div className="w-full flex flex-col items-center pb-10">
      
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-4xl font-black text-blue-950 mb-3 flex justify-center items-center gap-2">
          <Award className="text-amber-500" size={32} /> Expert Counselling Plans
        </h2>
        <p className="text-gray-500 text-sm md:text-base font-medium max-w-lg mx-auto">
          Maximize your chances of getting the best college. Choose a plan that fits your needs and let our experts guide you.
        </p>
      </div>

      {/* HOW IT WORKS: 3 STEPS IN ONE LINE (Kept as you requested) */}
      <div className="w-full max-w-4xl flex flex-row items-start justify-between gap-2 mb-12 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col items-center text-center flex-1">
          <div className="w-8 h-8 md:w-12 md:h-12 shrink-0 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black text-sm md:text-xl mb-2 md:mb-3 shadow-sm border border-blue-100">1</div>
          <h3 className="text-[10px] md:text-sm font-extrabold text-gray-900 leading-tight">Tell Us Your<br/>Score</h3>
        </div>
        <div className="hidden sm:flex flex-1 h-[2px] bg-gray-100 mt-4 md:mt-6 mx-2 rounded-full relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-gray-300 rotate-45"></div>
        </div>
        <div className="flex flex-col items-center text-center flex-1">
          <div className="w-8 h-8 md:w-12 md:h-12 shrink-0 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-black text-sm md:text-xl mb-2 md:mb-3 shadow-sm border border-amber-100">2</div>
          <h3 className="text-[10px] md:text-sm font-extrabold text-gray-900 leading-tight">Get Preference<br/>List</h3>
        </div>
        <div className="hidden sm:flex flex-1 h-[2px] bg-gray-100 mt-4 md:mt-6 mx-2 rounded-full relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-gray-300 rotate-45"></div>
        </div>
        <div className="flex flex-col items-center text-center flex-1">
          <div className="w-8 h-8 md:w-12 md:h-12 shrink-0 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-black text-sm md:text-xl mb-2 md:mb-3 shadow-sm border border-emerald-100">3</div>
          <h3 className="text-[10px] md:text-sm font-extrabold text-gray-900 leading-tight">Secure Your<br/>College</h3>
        </div>
      </div>

      {/* 🌟 PRICING / PACKAGES CARDS 🌟 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-2">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`${pkg.cardStyle} rounded-3xl p-6 md:p-8 flex flex-col transition-all duration-300`}>
            
            {/* Badge if exists */}
            {pkg.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                {pkg.badge}
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                {pkg.icon}
              </div>
              <div>
                <h3 className={`text-lg md:text-xl font-bold ${pkg.textStyle}`}>{pkg.title}</h3>
                <span className={`text-sm font-extrabold opacity-80 ${pkg.textStyle}`}>{pkg.price}</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1 mt-4">
              {pkg.features.map((feature, idx) => (
                <li key={idx} className={`flex items-start gap-3 text-sm font-medium ${pkg.textStyle === 'text-white' ? 'text-indigo-100' : 'text-gray-600'}`}>
                  <CheckCircle2 size={18} className={`shrink-0 mt-0.5 ${pkg.textStyle === 'text-white' ? 'text-emerald-400' : 'text-emerald-500'}`} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => openFormForPlan(pkg)}
              className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm ${pkg.buttonStyle}`}
            >
              Select Plan <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* 🌟 REQUEST FORM MODAL (Pops up when a package is clicked) 🌟 */}
      {isFormOpen && selectedPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 flex justify-between items-start text-white relative">
              <div>
                <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1 block">Applying For</span>
                <h2 className="text-xl font-black">{selectedPlan.title}</h2>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>

            {/* Form Details */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Student Full Name</label>
                <input type="text" required value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-colors" placeholder="Enter name" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Mobile Number</label>
                <input type="tel" maxLength="10" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-colors" placeholder="10-digit number" />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Target Exam</label>
                  <select value={formData.examTarget} onChange={e => setFormData({...formData, examTarget: e.target.value})} className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-colors bg-white">
                    <option value="NEET">NEET UG</option>
                    <option value="JEE">JEE Main</option>
                    <option value="CUET">CUET</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Expected Score</label>
                  <input type="number" required value={formData.score} onChange={e => setFormData({...formData, score: e.target.value})} className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none transition-colors" placeholder="e.g. 620" />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-100">
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 text-lg">
                  {loading ? <Loader2 className="animate-spin" size={24}/> : "Submit Request"}
                </button>
                <p className="text-center text-xs text-gray-400 font-medium mt-3">
                  Our experts will verify your details and contact you shortly.
                </p>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
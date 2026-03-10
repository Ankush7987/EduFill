import React, { useState } from 'react';
import { X, CheckCircle, Target, Wallet, GraduationCap, ArrowRight } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Apna firebase path check kar lein

export default function CounsellingModal({ isOpen, onClose, selectedPlan }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '', mobile: '', exam: 'NEET UG', expectedScore: '', budget: '', state: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Firebase me 'Counselling_Leads' naam ke naye collection me data save hoga
      await addDoc(collection(db, 'Counselling_Leads'), {
        ...formData,
        planSelected: selectedPlan,
        status: 'New Lead', // Agent ke liye default status
        timestamp: serverTimestamp()
      });
      setStep(2); // Success Screen
    } catch (error) {
      alert("Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({ fullName: '', mobile: '', exam: 'NEET UG', expectedScore: '', budget: '', state: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 md:p-6 flex justify-between items-center text-white">
          <div>
            <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
              <GraduationCap size={24} className="text-emerald-400"/> Counselling Setup
            </h2>
            <p className="text-gray-400 text-xs md:text-sm mt-1 font-medium">Selected: <span className="text-emerald-400">{selectedPlan}</span></p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white bg-white/10 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-5 md:p-6 max-h-[75vh] overflow-y-auto">
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Student/Parent Name *</label>
                <input type="text" name="fullName" required onChange={handleChange} value={formData.fullName} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-emerald-500 outline-none transition-all" placeholder="Enter full name"/>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp No. *</label>
                  <input type="tel" name="mobile" required maxLength="10" onChange={handleChange} value={formData.mobile} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-emerald-500 outline-none transition-all" placeholder="10-digit number"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Target Exam *</label>
                  <select name="exam" required onChange={handleChange} value={formData.exam} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-emerald-500 outline-none transition-all bg-white">
                    <option value="NEET UG">NEET UG</option>
                    <option value="JEE Main/Adv">JEE Main / Adv</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t-2 border-gray-100 pt-4 mt-2">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Target size={14} className="text-indigo-500"/> Expected Score/Rank</label>
                  <input type="text" name="expectedScore" required onChange={handleChange} value={formData.expectedScore} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. 620 marks"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Wallet size={14} className="text-amber-500"/> Budget Preference</label>
                  <select name="budget" required onChange={handleChange} value={formData.budget} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-emerald-500 outline-none transition-all bg-white">
                    <option value="">-- Select --</option>
                    <option value="Govt College Only">Govt. College Only</option>
                    <option value="Semi-Govt / Low Budget">Semi-Govt (Low Budget)</option>
                    <option value="Private College">Private College</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Preferred State for Admission</label>
                <input type="text" name="state" required onChange={handleChange} value={formData.state} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. MP, Maharashtra, All India"/>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold py-3.5 rounded-xl text-lg shadow-lg shadow-emerald-500/30 transition-all mt-6 flex justify-center items-center gap-2">
                {loading ? "Submitting Request..." : "Request Expert Callback"}
              </button>
            </form>
          ) : (
            <div className="text-center py-8 animate-in slide-in-from-right-8 duration-500">
              <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5"><CheckCircle size={40} className="text-emerald-500" /></div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Request Received!</h3>
              <p className="text-gray-600 text-sm mb-6 px-4">Hamare counselling expert aapki profile analyse karke jald hi aapse <b>{formData.mobile}</b> par sampark karenge.</p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Your Selected Plan</p>
                <p className="font-bold text-indigo-700">{selectedPlan}</p>
              </div>

              <button onClick={handleClose} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors">Done & Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
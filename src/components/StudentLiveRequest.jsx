import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, CheckCircle, Search, User, PhoneCall, XCircle, Zap, ShieldCheck, Clock, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export default function StudentLiveRequest() {
  const [form, setForm] = useState({ name: '', exam: 'NEET UG', mobile: '' });
  const [step, setStep] = useState('form'); // 'form', 'searching', 'matched'
  const [requestId, setRequestId] = useState(null);
  const [agentDetails, setAgentDetails] = useState(null);

  // 1. Send Request to Firebase
  const handleRequest = async (e) => {
    e.preventDefault();
    setStep('searching');

    try {
      const docRef = await addDoc(collection(db, "Live_Form_Requests"), {
        ...form,
        status: 'Searching',
        agentId: null,
        agentName: null,
        timestamp: serverTimestamp()
      });
      setRequestId(docRef.id);
    } catch (error) {
      console.error(error);
      setStep('form');
      alert("Network error! Please check your connection and try again.");
    }
  };

  // 2. Listen for Agent Acceptance (Realtime)
  useEffect(() => {
    if (!requestId) return;

    const unsub = onSnapshot(doc(db, "Live_Form_Requests", requestId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'Accepted') {
          setAgentDetails({ name: data.agentName, phone: data.agentPhone || '+91-XXXXXXXXXX' });
          setStep('matched');
        } else if (data.status === 'Cancelled') {
          setStep('form');
          setRequestId(null);
        }
      }
    });

    return () => unsub();
  }, [requestId]);

  // 3. Cancel Request
  const cancelRequest = async () => {
    if (!requestId) return;
    try {
      await updateDoc(doc(db, "Live_Form_Requests", requestId), { status: 'Cancelled' });
      setStep('form');
      setRequestId(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden font-sans relative">
      
      {/* 🌟 PREMIUM HEADER 🌟 */}
      <div className="bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 p-8 text-white text-center relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-indigo-500 rounded-full opacity-20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 bg-emerald-500 rounded-full opacity-10 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Live Feature
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2 leading-tight">
            EduFill <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Live Connect</span>
          </h2>
          <p className="text-gray-300 text-sm md:text-base font-medium max-w-sm mx-auto leading-relaxed">
            Get your exam form filled <span className="text-white font-bold">instantly</span> by a verified expert over WhatsApp.
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8 min-h-[400px] flex flex-col justify-center bg-[#F8FAFC]">
        
        {/* ======================================================== */}
        {/* STEP 1: FORM (Data Collection & Trust Building)          */}
        {/* ======================================================== */}
        {step === 'form' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            
            <form onSubmit={handleRequest} className="space-y-4 mb-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Student Name</label>
                  <input 
                    type="text" 
                    required 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    className="w-full bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-400 p-3.5 rounded-xl outline-none transition-all font-bold text-gray-800 placeholder-gray-400" 
                    placeholder="Enter full name" 
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-[2]">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">WhatsApp No.</label>
                    <input 
                      type="tel" 
                      maxLength="10" 
                      required 
                      value={form.mobile} 
                      onChange={e => setForm({...form, mobile: e.target.value})} 
                      className="w-full bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-400 p-3.5 rounded-xl outline-none transition-all font-bold text-gray-800 tracking-wide placeholder-gray-400" 
                      placeholder="10-digit number" 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Exam</label>
                    <select 
                      value={form.exam} 
                      onChange={e => setForm({...form, exam: e.target.value})} 
                      className="w-full bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-400 p-3.5 rounded-xl outline-none transition-all font-bold text-gray-800 cursor-pointer appearance-none"
                    >
                      <option value="NEET UG">NEET UG</option>
                      <option value="JEE Main">JEE Main</option>
                      <option value="CUET UG">CUET UG</option>
                      <option value="College Form">Other College</option>
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-lg py-4 rounded-2xl shadow-[0_8px_30px_rgb(79,70,229,0.3)] transition-transform active:scale-95 flex justify-center items-center gap-2 group">
                <Zap size={22} className="text-yellow-300 group-hover:scale-110 transition-transform" fill="currentColor" />
                Assign Expert Now
              </button>
            </form>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 border-t border-gray-200 pt-5">
              <div className="text-center flex flex-col items-center">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-1.5"><ShieldCheck size={16}/></div>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">100% Secure</p>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-1.5"><Clock size={16}/></div>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Zero Wait Time</p>
              </div>
              <div className="text-center flex flex-col items-center">
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-1.5"><CheckCircle2 size={16}/></div>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Error-Free</p>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: SEARCHING (Engaging Radar Animation)             */}
        {/* ======================================================== */}
        {step === 'searching' && (
          <div className="text-center py-8 animate-in fade-in duration-300 flex flex-col items-center">
            
            <div className="relative w-32 h-32 mx-auto mb-8">
              {/* Radar Rings */}
              <div className="absolute inset-0 border-4 border-indigo-400 rounded-full animate-ping opacity-20 duration-1000"></div>
              <div className="absolute inset-4 border-4 border-indigo-500 rounded-full animate-ping opacity-30 duration-1000 delay-300"></div>
              <div className="absolute inset-8 bg-gradient-to-tr from-indigo-100 to-blue-50 rounded-full flex items-center justify-center shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)] z-10 border-2 border-white">
                <Search className="text-indigo-600 animate-pulse" size={32} />
              </div>
              
              {/* Floating Fake Avatars to build anticipation */}
              <div className="absolute top-0 right-0 w-6 h-6 bg-emerald-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center animate-bounce delay-100"><User size={10} className="text-emerald-600"/></div>
              <div className="absolute bottom-2 left-0 w-8 h-8 bg-amber-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center animate-bounce delay-300"><User size={14} className="text-amber-600"/></div>
            </div>

            <h3 className="text-xl font-black text-gray-900 mb-2">Locating an Expert...</h3>
            <p className="text-sm text-gray-500 font-medium mb-8 max-w-[250px] mx-auto">
              Scanning our network for the fastest available agent for your <span className="font-bold text-indigo-600">{form.exam}</span> form.
            </p>
            
            <button onClick={cancelRequest} className="flex items-center justify-center gap-1.5 text-gray-400 hover:text-red-500 font-bold text-xs mx-auto hover:bg-red-50 px-4 py-2 rounded-full transition-colors border border-transparent hover:border-red-100">
              <XCircle size={14}/> Cancel Search
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: MATCHED (Success Confirmation & Next Steps)      */}
        {/* ======================================================== */}
        {step === 'matched' && agentDetails && (
          <div className="text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg relative">
              <CheckCircle size={40} />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="w-4 h-4 bg-emerald-500 rounded-full animate-ping absolute"></span>
                <span className="w-3 h-3 bg-emerald-500 rounded-full relative"></span>
              </div>
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 mb-1">Match Successful! 🎉</h3>
            <p className="text-gray-500 text-sm font-medium mb-6">Your dedicated form-filling expert is ready.</p>
            
            {/* Agent Identity Card */}
            <div className="bg-white border-2 border-indigo-100 shadow-[0_10px_40px_rgb(79,70,229,0.1)] rounded-2xl p-5 text-left mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[100px] -z-0"></div>
              
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 relative z-10 flex items-center gap-1">
                <ShieldCheck size={12}/> Verified Agent
              </p>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-md border-2 border-white">
                  <span className="font-black text-xl">{agentDetails.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h4 className="font-black text-xl text-gray-900">{agentDetails.name}</h4>
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 mt-1 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Online & Waiting
                  </p>
                </div>
              </div>
            </div>

            {/* Next Steps Checklist */}
            <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl text-left space-y-3">
              <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-2 border-b border-blue-200 pb-2">What happens next?</h4>
              
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</div>
                <p className="text-sm text-gray-700 font-medium leading-tight">Keep your phone handy. <strong className="text-gray-900">{agentDetails.name}</strong> will message you on WhatsApp immediately.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</div>
                <p className="text-sm text-gray-700 font-medium leading-tight">Share necessary documents and OTPs securely in the chat.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</div>
                <p className="text-sm text-gray-700 font-medium leading-tight">Receive your final submitted application PDF directly on WhatsApp.</p>
              </div>
            </div>
            
            <button onClick={() => window.location.reload()} className="mt-6 text-gray-400 hover:text-gray-600 text-xs font-bold underline underline-offset-4 transition-colors">
              Close & Return to Home
            </button>
            
          </div>
        )}

      </div>
    </div>
  );
}
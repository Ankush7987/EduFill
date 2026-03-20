import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Sparkles, Trophy, AlertCircle, CheckCircle2, MapPin, Building, FileWarning } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; 

export default function CollegePredictor({ isOpen, onClose, autoFillMobile = '', autoFillName = '' }) {
  // 🌟 NAYA: 'name' field add kar diya gaya hai 🌟
  const [finderForm, setFinderForm] = useState({ 
    name: autoFillName || '', 
    exam: 'NEET', 
    score: '', 
    category: 'General', 
    state: 'Madhya Pradesh', 
    dream: 'Govt MBBS', 
    mobile: autoFillMobile || '' 
  });
  
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  // Sync autofill if user logs in while modal is in background
  useEffect(() => {
    setFinderForm(prev => ({ 
      ...prev, 
      mobile: autoFillMobile || prev.mobile,
      name: autoFillName || prev.name 
    }));
  }, [autoFillMobile, autoFillName]);

  const analyzeScore = (form) => {
    let result = { success: false, title: "", message: "", colleges: [] };
    let s = parseFloat(form.score);
    let st = form.state;

    if (form.exam === 'NEET' && s < 150) return { success: false, title: "Keep Working Hard! 💪", message: `Your score is below the qualifying cutoff. Getting a college is highly unlikely this year. Take a drop, prepare well, and bounce back stronger!`, colleges: [] };
    if (form.exam === 'JEE Main' && s < 50) return { success: false, title: "Don't Give Up! 🚀", message: `A percentile of ${s} makes it difficult to get into top engineering colleges. Consider state-level private exams or drop a year to prepare.`, colleges: [] };
    if (form.exam === '12th Merit' && s < 45) return { success: false, title: "Explore Other Options 🌟", message: `With ${s}%, regular degree admissions will be tough. Consider Open Universities (like IGNOU) or skill-based diploma courses.`, colleges: [] };
    if (form.exam === 'CUET' && s < 200) return { success: false, title: "Re-evaluate Your Plan 📚", message: `A score of ${s} might not meet the cutoffs for Central Universities. Try for local private universities instead.`, colleges: [] };

    const stateColleges = {
      'Madhya Pradesh': { aiims: 'AIIMS Bhopal', nit: 'MANIT Bhopal', gmc: 'GMC Bhopal / MGM Indore', govtEng: 'SGSITS Indore / IET DAVV', uni: 'DAVV Indore / Barkatullah Uni' },
      'Maharashtra': { aiims: 'AIIMS Nagpur', nit: 'VNIT Nagpur', gmc: 'Grant Medical College (Mumbai)', govtEng: 'VJTI Mumbai / COEP Pune', uni: 'Mumbai University / SPPU' },
      'Uttar Pradesh': { aiims: 'AIIMS Gorakhpur / Raebareli', nit: 'MNNIT Allahabad', gmc: 'KGMU Lucknow', govtEng: 'HBTU Kanpur / IET Lucknow', uni: 'BHU / Allahabad University' },
      'Rajasthan': { aiims: 'AIIMS Jodhpur', nit: 'MNIT Jaipur', gmc: 'SMS Medical College Jaipur', govtEng: 'MBM Jodhpur', uni: 'University of Rajasthan' },
      'Delhi': { aiims: 'AIIMS New Delhi', nit: 'DTU / NSUT Delhi', gmc: 'MAMC / VMMC Delhi', govtEng: 'DTU / IIIT Delhi', uni: 'Delhi University (DU) / JNU' },
      'Bihar': { aiims: 'AIIMS Patna', nit: 'NIT Patna', gmc: 'PMCH Patna / NMCH Patna', govtEng: 'BCE Patna / MIT Muzaffarpur', uni: 'Patna University' },
      'Other': { aiims: 'Top Regional AIIMS', nit: 'Top NIT of your State', gmc: `Top State Govt Medical College in ${st}`, govtEng: `Top State Govt Engineering College in ${st}`, uni: `Top State University in ${st}` }
    };

    const sc = stateColleges[st] || stateColleges['Other'];

    if (form.exam === 'NEET') {
      if (form.dream === 'AIIMS' && s >= 650) { result = { success: true, title: "Congratulations! 🎯", message: `Based on past 3 years' trends, you have a solid chance of getting into AIIMS!`, colleges: [sc.aiims, 'Other Regional AIIMS'] }; } 
      else if (form.dream === 'Govt MBBS' && s >= 600) { result = { success: true, title: "Great News! 🩺", message: `Your score is highly competitive for Government Medical Colleges in ${st} (State Quota).`, colleges: [sc.gmc, `Top District Govt Hospitals in ${st}`] }; } 
      else if (form.dream === 'BAMS' && s >= 450) { result = { success: true, title: "Well Done! 🌿", message: `You can easily secure a Top Govt. BAMS seat in ${st}.`, colleges: [`Govt Ayurvedic College, ${st}`, `National Institute of Ayurveda`] }; } 
      else { result = { success: false, title: "Tough Chances 📉", message: `Getting ${form.dream} might be slightly difficult with ${s} marks in ${form.category} category. But don't worry, here are the best alternative options for you:`, colleges: [`Top Private Medical Colleges in ${st}`, `Top Govt. BDS Colleges in ${st}`, `B.Sc Nursing (Top Govt) in ${st}`] }; }
    } 
    else if (form.exam === 'JEE Main') {
      if ((form.dream === 'Top NITs' || form.dream === 'IIITs') && s >= 95) { result = { success: true, title: "Awesome Score! 💻", message: `You are in the safe zone for top Engineering institutes!`, colleges: [sc.nit, `Top IIITs in/near ${st}`] }; } 
      else if (form.dream === 'Govt Engineering' && s >= 85) { result = { success: true, title: "Congratulations! 🎓", message: `You can get top State Govt Engineering Colleges in ${st}.`, colleges: [sc.govtEng, `Autonomous State Institutes in ${st}`] }; } 
      else { result = { success: false, title: "Keep Your Hopes Up! 🚀", message: `Getting top NITs might be tough, but you have excellent state-level options in ${st}:`, colleges: [`Top Ranked Private B.Tech Colleges in ${st}`, `State Govt Colleges (Core Branches)`] }; }
    }
    else if (form.exam === '12th Merit') {
      if (s >= 85) { result = { success: true, title: "Excellent Percentage! 🎓", message: `With ${s}%, you have a very high chance of getting admission in top government colleges or main university campuses in ${st}.`, colleges: [sc.uni, `Top Govt Excellence College, ${st}`, `Premium Private Institutes`] }; } 
      else if (s >= 65) { result = { success: true, title: "Good Score! 📚", message: `You can easily secure a seat in reputed state/city level colleges in ${st}.`, colleges: [`City Govt Degree College, ${st}`, `Top Rated Private College`, `Autonomous State Institute`] }; } 
      else { result = { success: false, title: "Decent Chances 👍", message: `Top Govt colleges might be highly competitive, but you have great alternative options for your graduation in ${st}.`, colleges: [`Reputed Private Colleges`, `Local City Colleges`, `Distance/Open University Programs`] }; }
    }
    else {
      result = { success: true, title: "Great Potential! 🌟", message: `Your score opens up multiple top university doors.`, colleges: [sc.uni, `Central University Campus in ${st}`] };
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const scoreNum = parseFloat(finderForm.score);

    if(!finderForm.name) return alert("Please enter your name.");
    if(finderForm.mobile.length !== 10) return alert("Please enter a valid 10-digit mobile number.");
    
    if(finderForm.exam === 'NEET' && (scoreNum < 0 || scoreNum > 720)) return alert("Invalid Score! NEET maximum marks are 720.");
    if(finderForm.exam === 'JEE Main' && (scoreNum < 0 || scoreNum > 300)) return alert("Invalid Score! JEE Main maximum marks are 300.");
    if(finderForm.exam === '12th Merit' && (scoreNum < 0 || scoreNum > 100)) return alert("Invalid Percentage! 12th Board marks must be between 0 and 100.");
    if(finderForm.exam === 'CUET' && (scoreNum < 0 || scoreNum > 800)) return alert("Invalid Score! CUET maximum marks generally cannot exceed 800.");
    
    setIsPredicting(true);
    const resultData = analyzeScore(finderForm);

    try {
      await addDoc(collection(db, "Predictor_Requests"), { 
        ...finderForm, 
        studentName: finderForm.name, // 🌟 NAYA: Save Name in DB
        result: resultData.success ? 'Positive' : 'Alternative',
        status: 'New Request', 
        timestamp: serverTimestamp() 
      });
      
      setTimeout(() => {
        setIsPredicting(false);
        setPredictionResult(resultData);
      }, 2500);

    } catch (error) {
      console.error(error);
      alert("Failed to analyze score. Please try again.");
      setIsPredicting(false);
    }
  };

  const handleClose = () => {
    setPredictionResult(null);
    setFinderForm({ name: autoFillName || '', exam: 'NEET', score: '', category: 'General', state: 'Madhya Pradesh', dream: 'Govt MBBS', mobile: autoFillMobile || '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-300 relative">
        
        {!predictionResult ? (
          <>
            <div className="bg-gradient-to-r from-orange-500 to-rose-600 p-6 flex justify-between items-start text-white relative">
              <div>
                <span className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-1 block">AI Powered</span>
                <h2 className="text-xl font-black flex items-center gap-2"><Sparkles size={20}/> Dream College Finder</h2>
              </div>
              <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* 🌟 NAYA: Name & Mobile Number Row 🌟 */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Your Name</label>
                  <input type="text" required value={finderForm.name} onChange={e => setFinderForm({...finderForm, name: e.target.value})} className="w-full border-2 border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 outline-none transition-colors font-medium text-sm" placeholder="Enter Name" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">WhatsApp No.</label>
                  <input type="tel" maxLength="10" required value={finderForm.mobile} onChange={e => setFinderForm({...finderForm, mobile: e.target.value})} className="w-full border-2 border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 outline-none transition-colors font-medium text-sm" placeholder="10-Digit No." />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Select Exam</label>
                  <select value={finderForm.exam} onChange={e => setFinderForm({...finderForm, exam: e.target.value, dream: e.target.value === 'NEET' ? 'Govt MBBS' : e.target.value === 'JEE Main' ? 'Top NITs' : e.target.value === '12th Merit' ? 'Top Govt College' : 'Central University'})} className="w-full border-2 border-gray-200 focus:border-orange-500 rounded-xl px-3 py-3 outline-none bg-white font-medium text-sm">
                    <option value="NEET">NEET UG</option>
                    <option value="JEE Main">JEE Main</option>
                    <option value="12th Merit">12th Board</option>
                    <option value="CUET">CUET</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Category</label>
                  <select value={finderForm.category} onChange={e => setFinderForm({...finderForm, category: e.target.value})} className="w-full border-2 border-gray-200 focus:border-orange-500 rounded-xl px-3 py-3 outline-none bg-white font-medium text-sm">
                    <option value="General">General</option>
                    <option value="OBC">OBC-NCL</option>
                    <option value="EWS">Gen-EWS</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Target State</label>
                  <select value={finderForm.state} onChange={e => setFinderForm({...finderForm, state: e.target.value})} className="w-full border-2 border-gray-200 focus:border-orange-500 rounded-xl px-3 py-3 outline-none bg-white font-medium text-sm">
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Other">Other State</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Dream College</label>
                  <select value={finderForm.dream} onChange={e => setFinderForm({...finderForm, dream: e.target.value})} className="w-full border-2 border-gray-200 focus:border-orange-500 rounded-xl px-3 py-3 outline-none bg-white font-medium text-sm">
                    {finderForm.exam === 'NEET' ? (
                      <><option value="Govt MBBS">Govt MBBS</option><option value="AIIMS">AIIMS</option><option value="BAMS">Govt BAMS</option><option value="Private MBBS">Private MBBS</option></>
                    ) : finderForm.exam === 'JEE Main' ? (
                      <><option value="Top NITs">Top NITs</option><option value="IIITs">IIITs</option><option value="Govt Engineering">Govt Engineering</option></>
                    ) : finderForm.exam === '12th Merit' ? (
                      <><option value="Top Govt College">Top Govt College</option><option value="State University">State University</option><option value="Premium Private">Private College</option></>
                    ) : (
                      <><option value="Central University">Central University</option><option value="State University">State University</option></>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">
                  {finderForm.exam === '12th Merit' ? '12th Board Percentage (%)' : 'Expected Marks/Percentile'}
                </label>
                <input type="number" required value={finderForm.score} onChange={e => setFinderForm({...finderForm, score: e.target.value})} className="w-full border-2 border-gray-200 focus:border-orange-500 rounded-xl px-4 py-3 outline-none transition-colors font-bold text-lg" placeholder={finderForm.exam === 'JEE Main' ? "e.g. 95.5" : finderForm.exam === '12th Merit' ? "e.g. 85" : "e.g. 620"} />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button type="submit" disabled={isPredicting} className="w-full bg-gradient-to-r from-orange-500 to-rose-600 hover:opacity-90 text-white font-extrabold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 text-lg">
                  {isPredicting ? (
                    <><Loader2 className="animate-spin" size={24}/> Analyzing Score...</>
                  ) : (
                    <><Search size={20}/> Find My Colleges</>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="p-6 md:p-8 text-center animate-in zoom-in-90 duration-300">
            <div className={`w-16 h-16 md:w-20 md:h-20 ${predictionResult.success ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-500'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {predictionResult.success ? <Trophy size={36} /> : <AlertCircle size={36} />}
            </div>
            <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2">{predictionResult.title}</h3>
            <p className="text-gray-600 text-sm md:text-base font-medium mb-6 leading-relaxed">
              {predictionResult.message}
            </p>

            {predictionResult.colleges.length === 0 ? (
              <div className="bg-red-50 p-5 rounded-2xl border border-red-100 mb-6 text-left shadow-sm">
                <h4 className="text-red-700 font-black flex items-center gap-2 mb-2"><FileWarning size={18}/> No Colleges in this range</h4>
                <p className="text-red-600 text-sm font-medium">It's better to accept reality and plan properly rather than getting false hopes. We suggest you prepare hard and re-attempt.</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-200">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-left">Predicted Institutions</p>
                <div className="grid grid-cols-1 gap-3">
                  {predictionResult.colleges.map((col, i) => (
                    <div key={i} className="bg-white border border-gray-200 hover:border-emerald-400 rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 text-left shadow-sm transition-all duration-300">
                      <div className="bg-emerald-50 text-emerald-600 p-2.5 md:p-3 rounded-lg shrink-0">
                        <Building size={24}/>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm md:text-base">{col}</h4>
                        <p className="text-[11px] md:text-xs text-gray-500 flex items-center gap-1 mt-1 font-medium">
                          <MapPin size={12}/> Based in {finderForm.state}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mb-4 font-medium">A detailed report has been requested for your WhatsApp (+91 {finderForm.mobile}).</p>
            
            <button onClick={handleClose} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-colors text-lg">
              {predictionResult.colleges.length === 0 ? 'Try Again' : 'Close Window'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
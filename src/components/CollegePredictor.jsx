import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async'; // 🌟 SEO Engine
import { Search, Loader2, Sparkles, Trophy, MapPin, Target, CheckCircle, AlertCircle, Calculator, BookOpen, Activity, RefreshCw, AlertTriangle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; 

// 🌟 ULTRA-PRECISE MARKS TO RANK DATA
const marksToRankData = [
  { score: 720, rank: 50 }, { score: 715, rank: 220 }, { score: 710, rank: 800 },
  { score: 705, rank: 1400 }, { score: 700, rank: 2200 }, { score: 695, rank: 3200 },
  { score: 690, rank: 4500 }, { score: 685, rank: 6500 }, { score: 680, rank: 9500 },
  { score: 675, rank: 11500 }, { score: 670, rank: 14000 }, { score: 660, rank: 21000 },
  { score: 650, rank: 29000 }, { score: 640, rank: 39000 }, { score: 630, rank: 50000 },
  { score: 620, rank: 62000 }, { score: 610, rank: 75000 }, { score: 600, rank: 89000 },
  { score: 590, rank: 104000 }, { score: 580, rank: 120000 }, { score: 570, rank: 138000 },
  { score: 560, rank: 157000 }, { score: 550, rank: 178000 }, { score: 540, rank: 200000 },
  { score: 530, rank: 225000 }, { score: 500, rank: 300000 }, { score: 450, rank: 480000 },
  { score: 400, rank: 680000 }, { score: 350, rank: 920000 }, { score: 300, rank: 1150000 },
  { score: 200, rank: 1650000 }, { score: 100, rank: 2200000 }, { score: 0, rank: 2500000 }
];

const calculateEstimatedRank = (score) => {
  if (score >= 720) return 50; if (score <= 0) return 2500000;
  for (let i = 0; i < marksToRankData.length - 1; i++) {
    if (score <= marksToRankData[i].score && score >= marksToRankData[i + 1].score) {
      const scoreDiff = marksToRankData[i].score - marksToRankData[i + 1].score;
      const rankDiff = marksToRankData[i + 1].rank - marksToRankData[i].rank;
      const scoreDrop = marksToRankData[i].score - score;
      return Math.round(marksToRankData[i].rank + (scoreDrop / scoreDiff) * rankDiff);
    }
  }
  return 1000000; 
};

const stateDistricts = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kadapa"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Nalanda"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Jagdalpur", "Korba"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Rohtak", "Hisar"],
  "Himachal Pradesh": ["Shimla", "Mandi", "Dharamshala", "Solan"],
  "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubli", "Belagavi", "Gulbarga"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Rewa"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Meerut", "Gorakhpur"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol", "Burdwan"]
};

export default function CollegePredictor({ autoFillMobile = '', autoFillName = '' }) {
  
  const [admissionMode, setAdmissionMode] = useState('NEET'); 
  const [inputMode, setInputMode] = useState('rank'); 

  const [finderForm, setFinderForm] = useState({ 
    name: autoFillName || '', 
    inputValue: '', 
    category: 'General', 
    state: 'All India (Any State)', 
    district: 'All Districts', 
    dream: 'All Colleges', 
    course: 'All', 
    mobile: autoFillMobile || '' 
  });
  
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [availableInstitutions, setAvailableInstitutions] = useState(["All Colleges"]);
  const [isFetchingColleges, setIsFetchingColleges] = useState(false);

  const dropdownCache = useRef({}); 

  const handleModeSwitch = (mode) => {
      setAdmissionMode(mode);
      setInputMode(mode === 'NEET' ? 'rank' : 'percentage');
      setFinderForm({ ...finderForm, inputValue: '', course: 'All', dream: 'All Colleges' });
  };

  useEffect(() => {
    const cacheKey = `${admissionMode}-${finderForm.course}-${finderForm.state}-${finderForm.district}-${finderForm.category}`;
    
    const fetchDynamicColleges = async () => {
      if (dropdownCache.current[cacheKey]) {
        setAvailableInstitutions(["All Colleges", ...dropdownCache.current[cacheKey]]);
        return;
      }

      setIsFetchingColleges(true);
      try {
        // 🌟 REPLACED LOCALHOST WITH LIVE RENDER DOMAIN 🌟
        const response = await fetch("https://edufill-server.onrender.com/api/colleges/dropdown", { 
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                exam: admissionMode,
                course: finderForm.course,
                state: finderForm.state,
                district: finderForm.district,
                category: finderForm.category
            })
        });
        const data = await response.json();
        if (data.success) {
            dropdownCache.current[cacheKey] = data.names; 
            setAvailableInstitutions(["All Colleges", ...data.names]);
            
            if (finderForm.dream !== 'All Colleges' && !data.names.includes(finderForm.dream)) {
                setFinderForm(prev => ({ ...prev, dream: 'All Colleges' }));
            }
        }
      } catch (error) { 
        console.error(error); 
      } finally { 
        setIsFetchingColleges(false); 
      }
    };

    // Faster fetching time (300ms)
    const timer = setTimeout(() => { 
      fetchDynamicColleges(); 
    }, 300); 
    
    return () => clearTimeout(timer);
  }, [finderForm.course, finderForm.state, finderForm.district, finderForm.category, admissionMode]); 

  const uniqueStates = ["All India (Any State)", ...Object.keys(stateDistricts)];
  const currentDistricts = finderForm.state === "All India (Any State)" ? [] : stateDistricts[finderForm.state] || [];

  const handleStateChange = (e) => {
    setFinderForm({ ...finderForm, state: e.target.value, district: 'All Districts' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!finderForm.name || finderForm.mobile.length !== 10) return alert("Valid Name & 10-digit WhatsApp No. is required.");
    
    let rawValue = parseFloat(finderForm.inputValue);
    if(isNaN(rawValue) || rawValue <= 0) return alert("Please enter a valid number.");

    let finalValueToPredict = rawValue;
    let isEstimated = false;

    if (admissionMode === 'NEET') {
        if (inputMode === 'score') {
            if (rawValue > 720) return alert("NEET score cannot exceed 720.");
            finalValueToPredict = calculateEstimatedRank(rawValue);
            isEstimated = true;
        }
    } else {
        if (rawValue > 100) return alert("12th Percentage cannot exceed 100%.");
    }
    
    setIsPredicting(true);

    try {
      // 🌟 REPLACED LOCALHOST WITH LIVE RENDER DOMAIN 🌟
      const response = await fetch("https://edufill-server.onrender.com/api/colleges/predict", { 
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            exam: admissionMode,
            rank: finalValueToPredict, 
            category: finderForm.category,
            course: finderForm.course,
            dream: finderForm.dream,
            state: finderForm.state,
            district: finderForm.district
        })
      });

      const data = await response.json();
      let resultData = { success: false, isFallback: false, title: "", message: "", colleges: [], userValue: finalValueToPredict, isEstimated, score: rawValue };

      if (data.success && data.colleges && data.colleges.length > 0) {
            const valText = admissionMode === '12th' ? `${finalValueToPredict}%` : `AIR ${finalValueToPredict.toLocaleString()}`;
            resultData = {
              success: true,
              isFallback: data.isFallback,
              title: data.isFallback ? "Alternatives Found ✨" : "Great News! 🎉",
              message: data.isFallback 
                ? `Securing your specific choices is unlikely at ${isEstimated ? `an estimated AIR of ${valText}` : valText}. But we found ${data.colleges.length} other excellent options:`
                : `We found ${data.colleges.length} excellent options matching your profile at ${isEstimated ? `an estimated AIR of ${valText}` : valText}.`,
              colleges: data.colleges,
              userValue: finalValueToPredict, isEstimated, score: rawValue
            };
      }

      await addDoc(collection(db, "Predictor_Requests"), { 
        ...finderForm, studentName: finderForm.name, admissionMode, 
        predictedValue: finalValueToPredict, inputMethod: inputMode,
        result: resultData.success ? (resultData.isFallback ? 'Fallback Options' : 'Colleges Found') : 'No Options Found',
        status: 'New Request', source: 'Website', timestamp: serverTimestamp() 
      });
      
      setPredictionResult(resultData);
    } catch (error) { 
      alert("Server connection failed. Please check your internet or make sure backend is running."); 
    } finally { 
      setIsPredicting(false); 
    }
  };

  const courses = admissionMode === 'NEET' 
    ? ["All", "MBBS", "BDS", "B.Sc. Nursing", "AIIMS"] 
    : ["All", "B.Sc", "B.A", "B.Com", "BBA", "BCA", "B.Tech"];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      <Helmet>
        <title>NEET & 12th Board College Predictor 2026 | Free AI Tool | EduFill</title>
        <meta name="description" content="Predict your dream medical or graduation college instantly. Check state quota, all India rank, and exact cutoffs for MBBS, B.Sc, B.Com, and more based on NEET/12th score." />
        <meta name="keywords" content="NEET college predictor, 12th board college predictor, MBBS predictor, B.Sc admission predictor, cutoff rank predictor 2026, AI college predictor, EduFill" />
        
        <meta property="og:title" content="Find Your Dream College | Free AI Predictor by EduFill" />
        <meta property="og:description" content="Enter your expected score/rank to see exactly which colleges you can get into. Accurate 2026 cutoffs data." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://edufills.com/college-predictor" />
        <link rel="canonical" href="https://edufills.com/college-predictor" />
      </Helmet>

      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        
        {!predictionResult ? (
          <>
            <div className={`p-8 flex justify-between items-start text-white relative ${admissionMode === '12th' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-800' : 'bg-gradient-to-r from-blue-700 to-indigo-800'}`}>
              <div>
                <span className="text-white/80 text-sm font-bold uppercase tracking-wider mb-2 block">EduFill Dual-AI Predictor</span>
                <h1 className="text-3xl font-black flex items-center gap-2"><Sparkles size={24}/> Find Your Dream College</h1>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {/* ADMISSION MODE TOGGLE */}
              <div className="flex bg-gray-100 rounded-xl p-1.5 shadow-inner">
                <button type="button" onClick={() => handleModeSwitch('NEET')} className={`flex-1 py-3 font-bold text-base rounded-lg flex justify-center items-center gap-2 transition-all ${admissionMode === 'NEET' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-indigo-500'}`}>
                    <Activity size={18}/> Medical (NEET)
                </button>
                <button type="button" onClick={() => handleModeSwitch('12th')} className={`flex-1 py-3 font-bold text-base rounded-lg flex justify-center items-center gap-2 transition-all ${admissionMode === '12th' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-purple-500'}`}>
                    <BookOpen size={18}/> UG / 12th Based
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Student Name *</label>
                  <input type="text" required value={finderForm.name} onChange={e => setFinderForm({...finderForm, name: e.target.value})} className={`w-full border-2 rounded-xl px-4 py-3 outline-none font-medium text-base text-gray-800 ${admissionMode === '12th' ? 'focus:border-purple-600' : 'focus:border-blue-600'}`} placeholder="Your Name" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">WhatsApp No. *</label>
                  <input type="tel" maxLength="10" required value={finderForm.mobile} onChange={e => setFinderForm({...finderForm, mobile: e.target.value})} className={`w-full border-2 rounded-xl px-4 py-3 outline-none font-medium text-base text-gray-800 ${admissionMode === '12th' ? 'focus:border-purple-600' : 'focus:border-blue-600'}`} placeholder="10-Digit No." />
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">State Priority</label>
                    <select value={finderForm.state} onChange={handleStateChange} className={`w-full border-2 rounded-xl px-4 py-3 outline-none bg-white font-medium text-base cursor-pointer text-gray-800 ${admissionMode === '12th' ? 'focus:border-purple-600' : 'focus:border-blue-600'}`}>
                      {uniqueStates.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">District</label>
                    <select value={finderForm.district} onChange={e => setFinderForm({...finderForm, district: e.target.value})} disabled={finderForm.state === "All India (Any State)"} className={`w-full border-2 rounded-xl px-4 py-3 outline-none bg-white font-medium text-base cursor-pointer disabled:opacity-50 text-gray-800 ${admissionMode === '12th' ? 'focus:border-purple-600' : 'focus:border-blue-600'}`}>
                      <option value="All Districts">All Districts</option>
                      {currentDistricts.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider text-center">Select Course</label>
                <div className="flex flex-wrap justify-center gap-3">
                  {courses.map(course => (
                    <button key={course} type="button" onClick={() => setFinderForm({...finderForm, course})} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${finderForm.course === course ? (admissionMode === '12th' ? 'bg-purple-600 text-white shadow-md' : 'bg-blue-600 text-white shadow-md') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{course}</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 items-end">
                <div className="flex-1 w-full">
                  <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider ${admissionMode === '12th' ? 'text-purple-900' : 'text-blue-900'}`}>Category</label>
                  <select value={finderForm.category} onChange={e => setFinderForm({...finderForm, category: e.target.value})} className={`w-full border-2 rounded-xl px-4 py-3 outline-none font-medium text-base cursor-pointer text-gray-800 ${admissionMode === '12th' ? 'border-purple-200 focus:border-purple-600 bg-purple-50' : 'border-blue-200 focus:border-blue-600 bg-blue-50'}`}>
                    <option value="General">General (UR)</option><option value="OBC">OBC</option><option value="EWS">EWS</option><option value="SC">SC</option><option value="ST">ST</option>
                  </select>
                </div>
                <div className="flex-[1.5] w-full">
                  <label className={`block text-xs font-bold mb-1.5 uppercase tracking-wider flex items-center justify-between ${admissionMode === '12th' ? 'text-purple-900' : 'text-blue-900'}`}>
                    <span className="flex items-center gap-1"><Target size={14}/> Specific College?</span> {isFetchingColleges && <Loader2 size={14} className="animate-spin text-blue-500" />}
                  </label>
                  <select value={finderForm.dream} onChange={e => setFinderForm({...finderForm, dream: e.target.value})} className={`w-full border-2 rounded-xl px-4 py-3 outline-none bg-white font-medium text-base cursor-pointer text-gray-800 truncate ${admissionMode === '12th' ? 'border-purple-200 focus:border-purple-600' : 'border-blue-200 focus:border-blue-600'}`}>
                    {availableInstitutions.length === 1 ? <option value="All Colleges">-- No Colleges in this Filter --</option> : availableInstitutions.map((inst, idx) => <option key={idx} value={inst}>{inst}</option>)}
                  </select>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${admissionMode === '12th' ? 'bg-fuchsia-50 border-purple-200' : 'bg-indigo-50 border-indigo-200'}`}>
                {admissionMode === 'NEET' && (
                    <div className={`flex justify-center bg-white rounded-lg p-1.5 border mb-4 shadow-sm ${admissionMode === '12th' ? 'border-purple-200' : 'border-indigo-200'}`}>
                        <button type="button" onClick={() => { setInputMode('rank'); setFinderForm({...finderForm, inputValue: ''}); }} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${inputMode === 'rank' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-indigo-600'}`}>I Know My Rank</button>
                        <button type="button" onClick={() => { setInputMode('score'); setFinderForm({...finderForm, inputValue: ''}); }} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors flex items-center justify-center gap-1.5 ${inputMode === 'score' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-indigo-600'}`}><Calculator size={14}/> Est. Score</button>
                    </div>
                )}
                <label className={`block text-sm font-black mb-3 uppercase tracking-wider text-center ${admissionMode === '12th' ? 'text-purple-900' : 'text-indigo-900'}`}>
                  {admissionMode === '12th' ? 'Enter 12th Board Percentage (%)' : (inputMode === 'rank' ? 'Enter All India Rank (AIR)' : 'Enter Expected NEET Score (720)')}
                </label>
                <input 
                  type="number" step={admissionMode === '12th' ? "0.01" : "1"} required value={finderForm.inputValue} onChange={e => setFinderForm({...finderForm, inputValue: e.target.value})} 
                  className={`w-full border-2 rounded-xl px-5 py-4 outline-none transition-colors font-black text-3xl text-center tracking-widest bg-white shadow-sm ${admissionMode === '12th' ? 'text-purple-900 border-purple-200 focus:border-purple-600' : 'text-indigo-900 border-indigo-200 focus:border-indigo-600'}`} 
                  placeholder={admissionMode === '12th' ? 'e.g. 85.5' : (inputMode === 'rank' ? 'e.g. 15400' : 'e.g. 640')} 
                />
              </div>

              <div className="pt-4">
                <button type="submit" disabled={isPredicting || isFetchingColleges} className={`w-full text-white font-extrabold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 text-xl ${admissionMode === '12th' ? 'bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400' : 'bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400'}`}>
                  {isPredicting ? <><Loader2 className="animate-spin" size={24}/> Analyzing Database...</> : <><Search size={24}/> Find My College</>}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="p-8 md:p-10 animate-in zoom-in-90 duration-300">
            
            {predictionResult.success ? (
              <div className="text-center">
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg ${predictionResult.isFallback ? 'bg-orange-100 text-orange-500' : 'bg-green-100 text-green-600'}`}>
                  {predictionResult.isFallback ? <AlertTriangle size={40} /> : <Trophy size={40} />}
                </div>
                
                <h3 className="text-3xl font-black text-gray-900 mb-3">{predictionResult.title}</h3>
                
                <div className={`text-base font-medium mb-8 leading-relaxed py-4 px-6 rounded-xl inline-block border ${predictionResult.isFallback ? 'bg-orange-50 text-orange-800 border-orange-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
                   {predictionResult.message}
                </div>

                <div className="bg-gray-50 rounded-3xl p-6 mb-8 border border-gray-200">
                  <div className="flex justify-between items-center mb-6 px-2">
                    <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Matched Institutions</p>
                    <div className="flex flex-col items-end">
                       <span className={`text-sm font-bold px-3 py-1.5 rounded-lg mb-1 ${admissionMode === '12th' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                         {admissionMode === '12th' ? `Marks: ${predictionResult.userValue}%` : (predictionResult.isEstimated ? `Est. AIR: ${predictionResult.userValue.toLocaleString()}` : `AIR: ${predictionResult.userValue.toLocaleString()}`)}
                       </span>
                       {predictionResult.isEstimated && (
                          <span className="text-xs font-bold text-gray-400">Score: {predictionResult.score}</span>
                       )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {predictionResult.colleges.map((col, i) => (
                      <div key={i} className={`bg-white border hover:border-opacity-50 rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group ${admissionMode === '12th' ? 'border-gray-200 hover:border-purple-400' : 'border-gray-200 hover:border-blue-400'}`}>
                        
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <h4 className={`font-bold text-lg leading-tight transition-colors ${admissionMode === '12th' ? 'text-gray-800 group-hover:text-purple-700' : 'text-gray-800 group-hover:text-blue-700'}`}>{col.name}</h4>
                          <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${col.probability.includes('Safe') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                            {col.probability.includes('Safe') ? <CheckCircle size={14}/> : <Target size={14}/>} {col.probability}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 flex items-center gap-1.5 font-medium mb-4">
                          <MapPin size={16} className="text-gray-400"/> {col.state}
                        </p>
                        
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <div className="flex flex-wrap gap-2">
                            {col.tags.map((tag, idx) => (
                              <span key={idx} className={`text-xs font-bold px-3 py-1 rounded-md ${admissionMode === '12th' ? 'bg-fuchsia-50 text-purple-700' : 'bg-indigo-50 text-indigo-700'}`}>{tag}</span>
                            ))}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-gray-500 font-medium">Closing Cutoff</p>
                            <p className="text-lg font-black text-gray-800">{col.currentCutoff.toLocaleString()}{admissionMode === '12th' ? '%' : ''}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              
              <div className="text-center pb-6">
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
                  <AlertCircle size={48} />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4">Don't Lose Hope! ✨</h3>
                
                <div className="bg-white rounded-3xl p-8 border border-gray-200 text-left mb-8 shadow-sm">
                  <p className="text-gray-700 text-base font-medium leading-relaxed mb-6">
                    <span className="font-bold text-gray-900 text-xl block mb-2">Hi {finderForm.name.split(' ')[0]},</span>
                    We checked our entire live database. Based on your <b>{finderForm.category} Category</b> and <b>{admissionMode === '12th' ? `${predictionResult.userValue}%` : (predictionResult.isEstimated ? `Estimated Rank (${predictionResult.userValue.toLocaleString()})` : `Rank (${predictionResult.userValue.toLocaleString()})`)}</b>, securing a seat in {finderForm.dream !== 'All Colleges' ? `"${finderForm.dream}"` : (finderForm.course !== 'All' ? finderForm.course : 'these specific colleges')} is highly unlikely this year.
                  </p>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4">Your Best Alternative Options:</h4>
                    <ul className="space-y-3 text-base text-gray-700 font-medium">
                      <li className="flex items-start gap-3"><div className="mt-1.5 w-2 h-2 bg-indigo-500 rounded-full shrink-0"></div> <b>State Private Colleges:</b> Explore excellent private institutions.</li>
                      <li className="flex items-start gap-3"><div className="mt-1.5 w-2 h-2 bg-green-500 rounded-full shrink-0"></div> <b>Deemed Universities:</b> Direct admissions based on qualifying scores.</li>
                      <li className="flex items-start gap-3"><div className="mt-1.5 w-2 h-2 bg-blue-500 rounded-full shrink-0"></div> <b>Alternative Pathways:</b> Highly rewarding alternative careers with EduFill.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 text-gray-500 p-4 rounded-xl mb-6 flex items-center justify-center gap-3 border border-gray-200">
              <span className="relative flex h-3 w-3"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${admissionMode === '12th' ? 'bg-purple-400' : 'bg-blue-400'}`}></span><span className={`relative inline-flex rounded-full h-3 w-3 ${admissionMode === '12th' ? 'bg-purple-500' : 'bg-blue-500'}`}></span></span>
              <p className="text-xs font-bold">Smart Analysis Report for +91 {finderForm.mobile}</p>
            </div>
            
            <button onClick={() => setPredictionResult(null)} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-colors text-xl shadow-md hover:shadow-xl flex items-center justify-center gap-3">
              <RefreshCw size={24}/> {predictionResult?.success ? 'Check Another Status' : 'Modify Search Filters'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
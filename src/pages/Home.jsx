import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async'; 
import { useNavigate, Link } from 'react-router-dom'; 
import { HelpCircle, ShieldCheck, Clock, Smartphone, Zap, ArrowRight, Building, FileWarning, X, CheckCircle2, MessageCircle, Star, Award, MapPin, Search, Sparkles, Calendar, UploadCloud, FileText, Stethoscope, Calculator, BookOpen, GraduationCap } from 'lucide-react';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase'; 

import Chatbot from '../components/Chatbot';
import CounsellingSection from '../components/CounsellingSection'; 
import AuthVaultWeb from '../components/AuthVaultWeb.jsx'; 
import CollegePredictorBanner from '../components/CollegePredictorBanner.jsx'; 
import MockTestBanner from '../components/MockTestBanner.jsx';
import Footer from '../components/Footer.jsx';

const examLayoutConfig = [
  {
    id: 'neet', tag: 'Medical Entrance', icon: <Stethoscope size={32} />,
    color: 'from-rose-500 to-red-600', lightBg: 'bg-rose-50', textColor: 'text-rose-600', shadow: 'hover:shadow-rose-100'
  },
  {
    id: 'jee', tag: 'Engineering Entrance', icon: <Calculator size={32} />,
    color: 'from-blue-500 to-indigo-600', lightBg: 'bg-blue-50', textColor: 'text-blue-600', shadow: 'hover:shadow-blue-100'
  },
  {
    id: 'cuet', tag: 'Central Universities', icon: <BookOpen size={32} />,
    color: 'from-purple-500 to-fuchsia-600', lightBg: 'bg-purple-50', textColor: 'text-purple-600', shadow: 'hover:shadow-purple-100'
  },
  {
    id: 'govt-college', tag: 'BA • BSc • BCom • BBA', icon: <GraduationCap size={32} />,
    color: 'from-emerald-500 to-teal-600', lightBg: 'bg-emerald-50', textColor: 'text-emerald-600', shadow: 'hover:shadow-emerald-100'
  }
];

const defaultContentFallback = {
  'neet': { title: 'NEET UG Loading...', startDate: 'Loading...', lastDate: 'Loading...', desc: 'Loading...', requirements: [], edufillPromise: '' },
  'jee': { title: 'JEE Main Loading...', startDate: 'Loading...', lastDate: 'Loading...', desc: 'Loading...', requirements: [], edufillPromise: '' },
  'cuet': { title: 'CUET UG Loading...', startDate: 'Loading...', lastDate: 'Loading...', desc: 'Loading...', requirements: [], edufillPromise: '' },
  'govt-college': { title: 'Govt. College Loading...', startDate: 'Loading...', lastDate: 'Loading...', desc: 'Loading...', requirements: [], edufillPromise: '' }
};

export default function HomePage() {
  const navigate = useNavigate(); 
  
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedExamInfo, setSelectedExamInfo] = useState(null); 
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [isCounsellingModalOpen, setIsCounsellingModalOpen] = useState(false); 
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [loadingMissing, setLoadingMissing] = useState(false);
  const [missingForm, setMissingForm] = useState({ studentName: '', mobile: '', missingItems: [] });

  const [activeExams, setActiveExams] = useState({}); 
  const [dbExamContent, setDbExamContent] = useState(defaultContentFallback); 

  useEffect(() => {
    // Top pr scroll karega humesha
    window.scrollTo(0, 0);

    const controlsRef = doc(db, "PlatformSettings", "examControls");
    const contentRef = doc(db, "PlatformSettings", "examContent");

    const unsubAdmin = onSnapshot(controlsRef, (docSnap) => {
      if (docSnap.exists()) setActiveExams(docSnap.data());
    });

    const unsubContent = onSnapshot(contentRef, (docSnap) => {
      if (docSnap.exists()) setDbExamContent(docSnap.data());
    });

    return () => { unsubAdmin(); unsubContent(); };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleMissingSubmit = async (e) => {
    e.preventDefault();
    if(missingForm.missingItems.length === 0) return alert("Please select at least one missing item.");
    setLoadingMissing(true);
    try {
      await addDoc(collection(db, "Missing_Requests"), { ...missingForm, status: 'Pending', timestamp: serverTimestamp() });
      alert("Report Submitted!");
      setIsMissingModalOpen(false); 
      setMissingForm({ studentName: '', mobile: '', missingItems: [] });
    } catch (error) { 
      alert("Failed to submit report."); 
    } finally { 
      setLoadingMissing(false); 
    }
  };

  // Memoize to prevent unnecessary re-renders when other states change
  const finalExamsData = useMemo(() => {
    return examLayoutConfig.map(config => {
      const dynamicContent = dbExamContent[config.id] || defaultContentFallback[config.id];
      return { ...config, ...dynamicContent };
    });
  }, [dbExamContent]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative selection:bg-emerald-200">
      
      {/* 🌟 SEO TAB TITLE 🌟 */}
      <Helmet>
        <title>EduFill | India's #1 Form Filling Portal</title>
        <meta name="description" content="Skip the cyber cafe queue! Get your NEET, JEE, CUET forms filled 100% error-free by EduFill experts." />
      </Helmet>

      {/* FULL SCREEN OVERLAYS */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-[150] bg-white overflow-y-auto animate-in slide-in-from-bottom-10 duration-300">
          <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 right-4 z-50 p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors" title="Close"><X size={24} /></button>
          {AuthVaultWeb ? <AuthVaultWeb /> : null}
        </div>
      )}

      {/* PREMIUM EXAM DETAILS MODAL */}
      {selectedExamInfo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-gray-100">
            <div className={`bg-gradient-to-r ${selectedExamInfo.color} p-8 text-white sticky top-0 z-10 rounded-t-[2rem]`}>
              <button onClick={() => setSelectedExamInfo(null)} className="absolute top-6 right-6 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors backdrop-blur-md"><X size={20}/></button>
              <div className="flex items-center gap-5">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">{selectedExamInfo.icon}</div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full mb-2 inline-block backdrop-blur-sm">{selectedExamInfo.tag}</span>
                  <h2 className="text-2xl md:text-4xl font-black leading-tight tracking-tight">{selectedExamInfo.title}</h2>
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-8 space-y-8 bg-white">
              {activeExams[selectedExamInfo.id] && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                  <div className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></div>
                  <p className="text-red-600 font-bold tracking-wide uppercase text-sm">Forms are Live Now! Secure your slot today.</p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><Calendar size={24} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</p>
                    <p className="font-black text-gray-900 text-sm md:text-base">{selectedExamInfo.startDate || 'To be announced'}</p>
                  </div>
                </div>
                <div className="flex-1 bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                  <div className="bg-red-100 p-3 rounded-xl text-red-600"><Clock size={24} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Date</p>
                    <p className="font-black text-red-600 text-sm md:text-base">{selectedExamInfo.lastDate || 'To be announced'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">About The Exam</h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">{selectedExamInfo.desc}</p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Documents Required</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedExamInfo.requirements?.map((req, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-gray-800 font-bold bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <CheckCircle2 size={18} className={`${selectedExamInfo.textColor}`} /> <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className={`${selectedExamInfo.lightBg} p-6 rounded-2xl border border-${selectedExamInfo.textColor.split('-')[1]}-100`}>
                <h3 className={`text-xs font-black uppercase tracking-widest mb-2 ${selectedExamInfo.textColor} flex items-center gap-2`}><ShieldCheck size={18}/> The EduFill Advantage</h3>
                <p className={`text-sm md:text-base font-bold ${selectedExamInfo.textColor}`}>{selectedExamInfo.edufillPromise}</p>
              </div>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate(`/apply/${selectedExamInfo.id}`)} className={`flex-1 bg-gradient-to-r ${selectedExamInfo.color} hover:opacity-90 text-white font-extrabold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-transform active:scale-95 text-lg`}>
                  Proceed to Apply <ArrowRight size={20}/>
                </button>
                {selectedExamInfo.id === 'neet' && (
                  <button onClick={() => { setSelectedExamInfo(null); setIsCounsellingModalOpen(true); }} className="flex-1 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-extrabold py-4 rounded-xl flex justify-center items-center gap-2 transition-colors text-lg">
                    View Counselling Plans
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COUNSELLING MODAL */}
      {isCounsellingModalOpen && CounsellingSection && (<div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-gray-900/70 backdrop-blur-sm transition-opacity duration-300"><div className="bg-white w-full h-[95vh] md:h-auto md:max-h-[95vh] md:max-w-6xl rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative animate-in slide-in-from-bottom-full md:zoom-in-95 duration-500 ease-out"><div className="sticky top-0 z-50 flex justify-between items-center p-4 md:p-0 border-b border-gray-100 bg-white/90 backdrop-blur-md md:absolute md:top-4 md:right-4 md:border-none md:bg-transparent"><h2 className="text-lg font-black text-gray-800 md:hidden ml-2">Counselling Plans</h2><button onClick={() => setIsCounsellingModalOpen(false)} className="bg-red-50 hover:bg-red-100 md:bg-white md:hover:bg-red-100 text-red-600 p-2 md:p-2.5 rounded-full transition-colors shadow-sm"><X size={24} strokeWidth={2.5} /></button></div><div className="overflow-y-auto flex-1 p-2 md:p-8 md:pt-14"><CounsellingSection /></div></div></div>)}
      
      {/* MISSING ITEM MODAL */}
      {isMissingModalOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"><div className="bg-amber-500 p-5 flex justify-between items-center text-white"><h2 className="text-lg font-bold">Report Missing Item</h2><button onClick={() => setIsMissingModalOpen(false)}><X size={20}/></button></div><form onSubmit={handleMissingSubmit} className="p-5 space-y-4"><div><label className="block text-xs font-bold">Your Full Name</label><input type="text" required value={missingForm.studentName} onChange={e => setMissingForm({...missingForm, studentName: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><div><label className="block text-xs font-bold">Mobile</label><input type="tel" maxLength="10" required value={missingForm.mobile} onChange={e => setMissingForm({...missingForm, mobile: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><button type="submit" className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-xl">Submit Report</button></form></div></div>)}

      {/* 🌟 PREMIUM STICKY HEADER 🌟 */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md border-b-2 border-emerald-700">
              <span className="font-black text-white text-lg md:text-xl tracking-tighter drop-shadow-sm">EF</span>
            </div>
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Edu<span className="text-emerald-600">Fill</span></span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://wa.me/919752519051" target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 px-4 py-2 rounded-full transition-colors">
              <HelpCircle size={18} /> Support
            </a>
            {currentUser ? (
              <button onClick={() => setIsAuthOpen(true)} className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 text-sm md:text-base font-bold py-2 px-5 rounded-full shadow-sm transition-colors">
                <div className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'S'}
                </div>
                Hi, {currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Student'}
              </button>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-sm md:text-base font-bold py-2.5 px-6 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                <ShieldCheck size={18} /> Secure Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 pt-12 md:pt-20 pb-12 flex flex-col items-center">
        
        {/* 🌟 HERO SECTION 🌟 */}
        <div className="text-center max-w-4xl mx-auto mb-12 animate-in slide-in-from-bottom-6 duration-700">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold text-[10px] md:text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-6 shadow-sm">
            <Sparkles size={14} className="text-amber-500"/> India's #1 Form Filling Portal
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight">
            Skip the Cyber Cafe Queue. <br/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Fill Forms Online!</span>
          </h1>
          <p className="text-gray-500 text-base md:text-lg lg:text-xl font-medium px-4 max-w-2xl mx-auto leading-relaxed">
            Select your exam below to check official requirements. Our dedicated experts will fill your form 100% error-free while you focus on studies.
          </p>
        </div>

        {/* 🌟 EXAM GRID 🌟 */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-in slide-in-from-bottom-10 duration-700 delay-100">
          {finalExamsData.map((exam) => (
            <div key={exam.id} onClick={() => setSelectedExamInfo(exam)} className={`bg-white rounded-3xl p-6 md:p-8 cursor-pointer group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${exam.shadow}`}>
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${exam.color} opacity-5 rounded-bl-[100px] -z-10 group-hover:scale-150 transition-transform duration-500`}></div>
              
              {activeExams[exam.id] && (
                <div className="absolute top-5 right-5 bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping absolute"></span>
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full relative"></span> 
                  Live Now
                </div>
              )}
              
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${exam.lightBg} ${exam.textColor} group-hover:scale-110 transition-transform duration-300 mb-6 shadow-sm border border-white`}>
                {exam.icon}
              </div>
              
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-2">{exam.tag}</span>
              <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                {exam.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 font-medium mb-6 leading-relaxed">{exam.desc}</p>
              
              <div className="flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-emerald-600 transition-colors">
                View Details <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </div>
            </div>
          ))}
        </div>

        {/* 🌟 GRID LAYOUT FOR BANNERS 🌟 */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          <CollegePredictorBanner />
          <MockTestBanner />
        </div>

        {/* 🌟 HOW IT WORKS (Upgraded Stepper UI) 🌟 */}
        <div className="w-full mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">How EduFill Works</h2>
            <p className="text-gray-500 font-medium text-lg">Three simple steps to a tension-free application process.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative max-w-5xl mx-auto">
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-1 bg-emerald-100 z-0 rounded-full"></div>
            
            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-white rounded-full shadow-[0_0_20px_rgba(0,0,0,0.05)] border-4 border-emerald-50 flex items-center justify-center font-black text-2xl text-emerald-600 mb-6 group-hover:scale-110 group-hover:border-emerald-100 transition-all duration-300">1</div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Book a Slot</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium px-4">Select your exam and enter basic details. A dedicated expert will be assigned to you instantly.</p>
            </div>
            
            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-white rounded-full shadow-[0_0_20px_rgba(0,0,0,0.05)] border-4 border-emerald-50 flex items-center justify-center font-black text-2xl text-emerald-600 mb-6 group-hover:scale-110 group-hover:border-emerald-100 transition-all duration-300">2</div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Upload Securely</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium px-4">Click a photo of your documents. Our AI auto-crops, resizes & converts them to official PDF formats.</p>
            </div>
            
            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-white rounded-full shadow-[0_0_20px_rgba(0,0,0,0.05)] border-4 border-emerald-50 flex items-center justify-center font-black text-2xl text-emerald-600 mb-6 group-hover:scale-110 group-hover:border-emerald-100 transition-all duration-300">3</div>
              <h3 className="text-xl font-black text-gray-900 mb-3">Relax & Track</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium px-4">Your expert fills the form error-free. Get step-by-step confirmation directly on your WhatsApp.</p>
            </div>
          </div>
        </div>

        {/* 🌟 TRUST BADGES (Dark Sleek Banner) 🌟 */}
        <div className="w-full bg-gray-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl mb-12 relative overflow-hidden max-w-6xl mx-auto">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <ShieldCheck size={32} className="text-emerald-400"/>
              </div>
              <p className="text-base md:text-lg font-black text-white">100% Error Free</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">Guaranteed accuracy</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <Clock size={32} className="text-amber-400"/>
              </div>
              <p className="text-base md:text-lg font-black text-white">Saves 3+ Hours</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">No cafe queues</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <Smartphone size={32} className="text-blue-400"/>
              </div>
              <p className="text-base md:text-lg font-black text-white">Mobile Friendly</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">Upload from phone</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <Zap size={32} className="text-indigo-400"/>
              </div>
              <p className="text-base md:text-lg font-black text-white">Expert Support</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">Chat on WhatsApp</p>
            </div>
          </div>
        </div>

        {/* 🌟 B2B INSTITUTE CAMP CARD (Linked to /campus-drive) 🌟 */}
        <Link to="/campus-drive" className="w-full bg-white border border-gray-200 rounded-[2rem] p-6 md:p-10 shadow-sm mb-8 flex flex-col lg:flex-row items-center justify-between gap-6 hover:shadow-lg transition-shadow group max-w-6xl mx-auto block">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-3 border border-emerald-100">
              <Building size={14} /> For Institutes & Schools
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Host an EduFill Campus Drive</h3>
            <p className="text-gray-500 text-sm md:text-base font-medium max-w-2xl">Bring our expert form-filling services directly to your campus.</p>
          </div>
          <div className="whitespace-nowrap bg-emerald-600 text-white group-hover:bg-emerald-700 font-black py-3.5 px-8 rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
            View Details <ArrowRight size={18} />
          </div>
        </Link>
        
        <button onClick={() => setIsMissingModalOpen(true)} className="flex justify-center items-center gap-2 text-gray-400 hover:text-amber-600 font-bold py-2 px-4 rounded-xl text-xs transition-colors mt-4">
          <FileWarning size={14}/> Didn't receive photos/printout? Report here.
        </button>

      </main>

      <Footer />
      {Chatbot && <Chatbot />}
    </div>
  );
}
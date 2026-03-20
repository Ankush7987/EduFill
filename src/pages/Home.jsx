import React, { useState, useEffect } from 'react';
import { HelpCircle, ShieldCheck, Clock, Smartphone, Zap, ArrowRight, Building, FileWarning, X, CheckCircle, Loader2, Users, FileText, CheckSquare, Stethoscope, Calculator, BookOpen, GraduationCap, CheckCircle2, ChevronRight, MessageCircle, Star, Award, MapPin, Search, Sparkles, AlertCircle, Trophy } from 'lucide-react';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from 'firebase/firestore';

// 🌟 IMPORTS 🌟
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase'; 

import BookingModal from '../components/BookingModal'; 
import Chatbot from '../components/Chatbot';
import CounsellingSection from '../components/CounsellingSection'; 
import AuthVaultWeb from '../components/AuthVaultWeb.jsx'; 
import CollegePredictor from '../components/CollegePredictor.jsx'; // NAYA COMPONENT IMPORT KIYA

// 🌟 EXAM DATA BASE 🌟
const examDetailsData = [
  {
    id: 'neet',
    title: 'NEET UG 2026',
    tag: 'Medical Entrance',
    icon: <Stethoscope size={28} />,
    color: 'from-red-500 to-rose-600',
    lightBg: 'bg-red-50',
    textColor: 'text-red-600',
    desc: 'National Eligibility cum Entrance Test (NEET) is the sole entrance exam for admission to MBBS, BDS, BAMS, BHMS, and other medical courses in India.',
    requirements: [
      'Passport Size Photo (with Name & Date printed, white background)',
      'Postcard Size Photo (4x6 inch, white background)',
      'Left & Right Hand Fingers and Thumb Impression',
      'Signature (in running handwriting)',
      '10th Class Marksheet or Certificate',
      'Category/Caste Certificate (if applicable, strictly in Central format)'
    ],
    edufillPromise: 'NEET forms are extremely strict about photo dimensions and thumb impressions. Our AI tools perfectly crop, resize, and compress your documents to exact NTA standards, ensuring 0% rejection rate.',
    actionType: 'booking'
  },
  {
    id: 'jee',
    title: 'JEE Main 2026',
    tag: 'Engineering Entrance',
    icon: <Calculator size={28} />,
    color: 'from-blue-500 to-cyan-600',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-600',
    desc: 'Joint Entrance Examination (Main) is for admission to B.Tech/B.Arch courses in NITs, IIITs, GFTIs and acts as a qualifying exam for JEE Advanced.',
    requirements: [
      'Recent Passport Size Photograph (80% face coverage)',
      'Candidate Signature (on white paper with black pen)',
      'Category Certificate (SC/ST/OBC/EWS) in prescribed format',
      'PwD Certificate (if applicable)'
    ],
    edufillPromise: 'Avoid multi-session confusion. We handle your JEE Main Session 1 & 2 registrations flawlessly. Just upload your basic docs, and we manage the complex choice filling and center selections.',
    actionType: 'booking'
  },
  {
    id: 'cuet',
    title: 'CUET UG 2026',
    tag: 'Central Universities',
    icon: <BookOpen size={28} />,
    color: 'from-purple-500 to-fuchsia-600',
    lightBg: 'bg-purple-50',
    textColor: 'text-purple-600',
    desc: 'Common University Entrance Test (CUET) provides a single-window opportunity to students for admission to all Central Universities (DU, BHU, JNU, etc.) and other participating state universities.',
    requirements: [
      'Recent Passport Size Photograph',
      'Candidate Signature',
      'Category Certificate (if applicable)',
      '10th & 12th Marksheets (for data entry)'
    ],
    edufillPromise: 'CUET is infamous for its confusing "Subject Mapping" (Domain, General Test, Languages). Our experts select the exact subject combinations required for your target university and course, so your form never gets disqualified.',
    actionType: 'booking'
  },
  {
    id: 'after12th',
    title: 'Govt. College Admission',
    tag: 'BA • BSc • BCom • BBA',
    icon: <GraduationCap size={28} />,
    color: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    desc: 'Just passed 12th? Apply for graduation courses in top State Universities and Government Colleges through the centralized online admission portal (e-Pravesh, etc.).',
    requirements: [
      '10th and 12th Class Marksheets',
      'Aadhar Card / Samagra ID',
      'Passport Size Photo & Signature',
      'Domicile (Niwash) & Income Certificate (Aay Praman Patra)',
      'Caste Certificate (Jati Praman Patra) for scholarship benefits'
    ],
    edufillPromise: 'No need to stand in long lines at cyber cafes during peak admission season. Send us your documents securely, and our dedicated agent will handle your registration, choice filling, and fee payment from start to finish.',
    actionType: 'direct_12th'
  }
];

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [autoFillPhone, setAutoFillPhone] = useState('');
  const [autoFillName, setAutoFillName] = useState('');

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedExamInfo, setSelectedExamInfo] = useState(null); 
  const [isCampDetailsOpen, setIsCampDetailsOpen] = useState(false); 
  const [isCampModalOpen, setIsCampModalOpen] = useState(false);
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [isCounsellingModalOpen, setIsCounsellingModalOpen] = useState(false); 
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFinderOpen, setIsFinderOpen] = useState(false);

  const [is12thModalOpen, setIs12thModalOpen] = useState(false);
  const [form12th, setForm12th] = useState({ studentName: '', mobile: '', marks12th: '', stream: 'PCM', expectedCourse: 'B.Sc' });
  const [saving12th, setSaving12th] = useState(false);

  const [loadingCamp, setLoadingCamp] = useState(false);
  const [loadingMissing, setLoadingMissing] = useState(false);

  const [campForm, setCampForm] = useState({ instituteName: '', contactPerson: '', mobile: '', studentCount: '' });
  const [missingForm, setMissingForm] = useState({ studentName: '', mobile: '', missingItems: [] });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDocs(query(collection(db, "Users"), where("uid", "==", user.uid)));
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            setAutoFillPhone(userData.phone || '');
            setAutoFillName(userData.fullName || '');
            setForm12th(prev => ({ ...prev, studentName: userData.fullName || '', mobile: userData.phone || '' }));
          }
        } catch (error) {
          console.error("Error auto-filling data", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handle12thSubmit = async (e) => {
    e.preventDefault();
    setSaving12th(true);
    try {
      const q = query(collection(db, "Employees"), where("active", "==", true), where("agentCategory", "==", "12th Admission"));
      const snap = await getDocs(q);
      let assignedAgent = "Unassigned";
      
      if (!snap.empty) {
        let agents = [];
        snap.forEach(d => agents.push({ id: d.id, ...d.data() }));
        agents.sort((a, b) => (a.assignedCount || 0) - (b.assignedCount || 0));
        assignedAgent = agents[0].name;
        await updateDoc(doc(db, "Employees", agents[0].id), { assignedCount: (agents[0].assignedCount || 0) + 1 });
      }

      await addDoc(collection(db, "Counselling_Requests"), {
        studentName: form12th.studentName, mobile: form12th.mobile, examTarget: '12th Admission', score: form12th.marks12th + '%', stream: form12th.stream, expectedCourse: form12th.expectedCourse, planSelected: '12th Govt. Admission Support', status: assignedAgent !== "Unassigned" ? 'Agent Assigned' : 'New Request', assignedAgentName: assignedAgent !== "Unassigned" ? assignedAgent : null, timestamp: serverTimestamp()
      });

      alert(`Success! Your details have been submitted.\nAssigned Agent: ${assignedAgent !== "Unassigned" ? assignedAgent : "Will be assigned shortly"}`);
      setIs12thModalOpen(false); setForm12th({ studentName: '', mobile: '', marks12th: '', stream: 'PCM', expectedCourse: 'B.Sc' });
    } catch (error) { alert("Failed to submit request."); } finally { setSaving12th(false); }
  };

  const handleCampSubmit = async (e) => {
    e.preventDefault();
    setLoadingCamp(true);
    try {
      await addDoc(collection(db, "Camp_Requests"), { ...campForm, status: 'New Request', timestamp: serverTimestamp() });
      alert("Camp Request Submitted Successfully!");
      setIsCampModalOpen(false); setCampForm({ instituteName: '', contactPerson: '', mobile: '', studentCount: '' });
    } catch (error) { alert("Failed to submit request."); } finally { setLoadingCamp(false); }
  };

  const handleMissingSubmit = async (e) => {
    e.preventDefault();
    if(missingForm.missingItems.length === 0) return alert("Please select at least one missing item.");
    setLoadingMissing(true);
    try {
      await addDoc(collection(db, "Missing_Requests"), { ...missingForm, status: 'Pending', timestamp: serverTimestamp() });
      alert("Report Submitted!");
      setIsMissingModalOpen(false); setMissingForm({ studentName: '', mobile: '', missingItems: [] });
    } catch (error) { alert("Failed to submit report."); } finally { setLoadingMissing(false); }
  };

  const handleMissingItemToggle = (item) => {
    setMissingForm(prev => ({ ...prev, missingItems: prev.missingItems.includes(item) ? prev.missingItems.filter(i => i !== item) : [...prev.missingItems, item] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative selection:bg-emerald-200">
      
      {/* 🌟 FULL SCREEN OVERLAYS 🌟 */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-[150] bg-white overflow-y-auto animate-in slide-in-from-bottom-10 duration-300">
          <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 right-4 z-50 p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors" title="Close Vault"><X size={24} /></button>
          {AuthVaultWeb ? <AuthVaultWeb /> : null}
        </div>
      )}

      {isBookingOpen && BookingModal && <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />}

      {/* 🌟 NAYA: COMPONENT BASED COLLEGE PREDICTOR 🌟 */}
      <CollegePredictor 
        isOpen={isFinderOpen} 
        onClose={() => setIsFinderOpen(false)} 
        autoFillMobile={autoFillPhone}
        autoFillName={autoFillName}
      />

      {/* 🌟 EXAM DETAILS MODAL 🌟 */}
      {selectedExamInfo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className={`bg-gradient-to-r ${selectedExamInfo.color} p-6 text-white sticky top-0 z-10`}>
              <button onClick={() => setSelectedExamInfo(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"><X size={20}/></button>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">{selectedExamInfo.icon}</div>
                <div><span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-md mb-1 inline-block">{selectedExamInfo.tag}</span><h2 className="text-2xl md:text-3xl font-black leading-tight">{selectedExamInfo.title}</h2></div>
              </div>
            </div>
            <div className="p-6 space-y-8">
              <div><h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 border-b pb-2">About The Exam</h3><p className="text-gray-700 text-sm leading-relaxed font-medium">{selectedExamInfo.desc}</p></div>
              <div><h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Documents Required</h3><ul className="space-y-3">{selectedExamInfo.requirements.map((req, idx) => (<li key={idx} className="flex items-start gap-3 text-sm text-gray-800 font-medium"><CheckCircle2 size={18} className={`shrink-0 mt-0.5 ${selectedExamInfo.textColor}`} /><span>{req}</span></li>))}</ul></div>
              <div className={`${selectedExamInfo.lightBg} p-5 rounded-2xl border border-${selectedExamInfo.textColor.split('-')[1]}-100`}><h3 className={`text-sm font-black uppercase tracking-widest mb-2 ${selectedExamInfo.textColor} flex items-center gap-2`}><ShieldCheck size={18}/> The EduFill Advantage</h3><p className="text-sm text-gray-700 leading-relaxed">{selectedExamInfo.edufillPromise}</p></div>
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                {selectedExamInfo.actionType === 'booking' ? (
                  <><button onClick={() => { setSelectedExamInfo(null); setIsBookingOpen(true); }} className={`flex-1 bg-gradient-to-r ${selectedExamInfo.color} hover:opacity-90 text-white font-extrabold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-all active:scale-95`}>Book Form Slot Now <ArrowRight size={18}/></button><button onClick={() => { setSelectedExamInfo(null); setIsCounsellingModalOpen(true); }} className="flex-1 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-extrabold py-4 rounded-xl flex justify-center items-center gap-2 transition-all">View Counselling Plans</button></>
                ) : selectedExamInfo.actionType === 'direct_12th' ? (
                  <button onClick={() => { setSelectedExamInfo(null); setIs12thModalOpen(true);}} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-xl shadow-lg shadow-emerald-500/30 flex justify-center items-center gap-2 transition-all active:scale-95 text-lg">Proceed to Registration <ArrowRight size={22} /></button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 12TH ADMISSION MODAL 🌟 */}
      {is12thModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 flex justify-between items-start text-white relative">
              <div><span className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1 block">Registration</span><h2 className="text-xl font-black">12th Govt. Admission</h2></div>
              <button onClick={() => setIs12thModalOpen(false)} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handle12thSubmit} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Student Full Name</label><input type="text" required value={form12th.studentName} onChange={e => setForm12th({...form12th, studentName: e.target.value})} className="w-full border-2 border-gray-200 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none transition-colors" placeholder="Enter your name" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Mobile Number</label><input type="tel" maxLength="10" required value={form12th.mobile} onChange={e => setForm12th({...form12th, mobile: e.target.value})} className="w-full border-2 border-gray-200 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none transition-colors" placeholder="10-digit number" /></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">12th Stream</label><select value={form12th.stream} onChange={e => setForm12th({...form12th, stream: e.target.value})} className="w-full border-2 border-gray-200 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none transition-colors bg-white"><option value="PCM">PCM</option><option value="PCB">PCB</option><option value="Commerce">Commerce</option><option value="Arts">Arts</option></select></div>
                <div className="flex-1"><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">12th Marks (%)</label><input type="number" required value={form12th.marks12th} onChange={e => setForm12th({...form12th, marks12th: e.target.value})} className="w-full border-2 border-gray-200 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none transition-colors" placeholder="e.g. 85" /></div>
              </div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Expected Course</label><select value={form12th.expectedCourse} onChange={e => setForm12th({...form12th, expectedCourse: e.target.value})} className="w-full border-2 border-gray-200 focus:border-emerald-500 rounded-xl px-4 py-3 outline-none transition-colors bg-white"><option value="B.Sc">B.Sc</option><option value="B.Com">B.Com</option><option value="B.A">B.A</option><option value="BBA">BBA</option><option value="BCA">BCA</option></select></div>
              <div className="pt-4 mt-2 border-t border-gray-100"><button type="submit" disabled={saving12th} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 text-lg">{saving12th ? <Loader2 className="animate-spin" size={24}/> : "Submit & Assign Agent"}</button><p className="text-center text-xs text-gray-400 font-medium mt-3">An expert agent will be assigned instantly to handle your registration.</p></div>
            </form>
          </div>
        </div>
      )}

      {/* COUNSELLING, CAMP, MISSING MODALS */}
      {isCounsellingModalOpen && CounsellingSection && (<div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-gray-900/70 backdrop-blur-sm transition-opacity duration-300"><div className="bg-white w-full h-[95vh] md:h-auto md:max-h-[95vh] md:max-w-6xl rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative animate-in slide-in-from-bottom-full md:zoom-in-95 duration-500 ease-out"><div className="sticky top-0 z-50 flex justify-between items-center p-4 md:p-0 border-b border-gray-100 bg-white/90 backdrop-blur-md md:absolute md:top-4 md:right-4 md:border-none md:bg-transparent"><h2 className="text-lg font-black text-gray-800 md:hidden ml-2">Counselling Plans</h2><button onClick={() => setIsCounsellingModalOpen(false)} className="bg-red-50 hover:bg-red-100 md:bg-white md:hover:bg-red-100 text-red-600 p-2 md:p-2.5 rounded-full transition-colors shadow-sm"><X size={24} strokeWidth={2.5} /></button></div><div className="overflow-y-auto flex-1 p-2 md:p-8 md:pt-14"><CounsellingSection /></div></div></div>)}
      {isCampDetailsOpen && ( <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 md:p-4 bg-gray-900/90 backdrop-blur-sm"><div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl md:rounded-3xl shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-300"><div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 md:p-10 text-white relative"><button onClick={() => setIsCampDetailsOpen(false)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"><X size={20}/></button><div className="max-w-2xl mt-4 md:mt-0"><span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4 inline-block">For Institutes</span><h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">Host an EduFill Campus Drive</h2><p className="text-indigo-100 text-base md:text-lg font-medium leading-relaxed">Bring our expert form-filling services directly to your campus.</p></div></div><div className="p-6 md:p-10"><div className="mb-10"><h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-3"><Award className="text-indigo-600"/> Facilities We Provide</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="flex gap-4 items-start"><div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 shrink-0"><CheckCircle size={24}/></div><div><h4 className="font-bold text-gray-900">On-Spot Verification</h4></div></div><div className="flex gap-4 items-start"><div className="bg-blue-100 p-3 rounded-xl text-blue-600 shrink-0"><FileText size={24}/></div><div><h4 className="font-bold text-gray-900">Live Desk</h4></div></div></div></div><div className="bg-gray-50 rounded-2xl p-6 md:p-8 text-center border border-gray-100"><h3 className="text-lg font-bold text-gray-800 mb-2">Ready to save time?</h3><button onClick={() => { setIsCampDetailsOpen(false); setIsCampModalOpen(true); }} className="w-full md:w-auto px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-4 rounded-xl shadow-lg mx-auto">Proceed to Request Form</button></div></div></div></div>)}
      {isCampModalOpen && (<div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm"><div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex items-center gap-2"><Building size={20} className="text-indigo-600"/> Request a Camp</h2><button onClick={()=>setIsCampModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button></div><form onSubmit={handleCampSubmit} className="space-y-4"><div><label className="block text-xs font-bold text-gray-600 mb-1">Institute Name</label><input type="text" required value={campForm.instituteName} onChange={e => setCampForm({...campForm, instituteName: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3" /></div><div><label className="block text-xs font-bold text-gray-600 mb-1">Mobile</label><input type="tel" maxLength="10" required value={campForm.mobile} onChange={e => setCampForm({...campForm, mobile: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3" /></div><div className="pt-4"><button type="submit" disabled={loadingCamp} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl">{loadingCamp ? <Loader2 className="animate-spin" size={20}/> : "Submit Request"}</button></div></form></div></div>)}
      {isMissingModalOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"><div className="bg-amber-500 p-5 flex justify-between items-center text-white"><h2 className="text-lg font-bold">Report Missing Item</h2><button onClick={() => setIsMissingModalOpen(false)}><X size={20}/></button></div><form onSubmit={handleMissingSubmit} className="p-5 space-y-4"><div><label className="block text-xs font-bold">Your Full Name</label><input type="text" required value={missingForm.studentName} onChange={e => setMissingForm({...missingForm, studentName: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><div><label className="block text-xs font-bold">Mobile</label><input type="tel" maxLength="10" required value={missingForm.mobile} onChange={e => setMissingForm({...missingForm, mobile: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div><button type="submit" className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-xl">Submit Report</button></form></div></div>)}

      {/* 🌟 HEADER DYNAMIC UPDATE 🌟 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 md:w-11 md:h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg border-b-2 border-emerald-700">
              <span className="font-black text-white text-base md:text-xl tracking-tighter drop-shadow-md">EF</span>
            </div>
            <span className="text-xl md:text-2xl font-extrabold italic text-blue-950 tracking-tight">EduFill</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://wa.me/919752519051" target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-green-600 bg-gray-100 px-3 py-2 rounded-full">
              <HelpCircle size={16} /> Help
            </a>
            
            {currentUser ? (
              <button onClick={() => setIsAuthOpen(true)} className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm md:text-base font-bold py-1.5 px-4 md:px-5 rounded-full shadow-sm transition-colors">
                <div className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'S'}
                </div>
                Hi, {currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Student'}
              </button>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base font-bold py-2 px-4 md:px-5 rounded-full shadow-md transition-colors">
                <ShieldCheck size={18} /> Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN HERO SECTION */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-8 pb-12 flex flex-col items-center">
        
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[10px] md:text-xs uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 inline-block">India's #1 Form Filling Portal</span>
          <h1 className="text-3xl md:text-5xl font-black text-blue-950 leading-tight mb-4">
            Skip the Cyber Cafe Queue. <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Fill Forms Online!</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base font-medium px-2 max-w-lg mx-auto">
            Select your exam below to check official requirements. Our dedicated experts will fill your form 100% error-free while you focus on studies.
          </p>
        </div>

        {/* EXAM SELECTION GRID */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {examDetailsData.map((exam) => (
            <div key={exam.id} onClick={() => setSelectedExamInfo(exam)} className="bg-white border-2 border-gray-100 hover:border-transparent rounded-3xl p-5 cursor-pointer group hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-r ${exam.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`}></div>
              <div className="absolute inset-[2px] bg-white rounded-[22px] -z-10"></div>
              {exam.id === 'after12th' && <div className="absolute top-4 right-4 bg-red-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">NEW</div>}
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${exam.lightBg} ${exam.textColor} group-hover:scale-110 transition-transform duration-300`}>{exam.icon}</div>
                <div className="flex-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-0.5">{exam.tag}</span>
                  <h3 className="text-xl font-black text-gray-900 mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-600">{exam.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 font-medium">{exam.desc}</p>
                </div>
                <div className="shrink-0 mt-4 text-gray-300 group-hover:text-gray-900 transition-colors"><ChevronRight size={24} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* 🌟 DREAM COLLEGE FINDER CARD 🌟 */}
        <div className="w-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-3xl p-6 md:p-8 text-white shadow-xl mb-12 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1" onClick={() => setIsFinderOpen(true)}>
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex-1 text-center md:text-left">
            <span className="bg-white/20 text-white font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block">Free Tool</span>
            <h3 className="text-xl md:text-3xl font-black mb-2 flex items-center justify-center md:justify-start gap-2">
              <Search size={28} /> Dream College Predictor
            </h3>
            <p className="text-orange-50 text-sm md:text-base font-medium max-w-xl">
              Confused about where you can get admission? Enter your mock/actual score and let our experts send you a personalized list of top colleges you qualify for.
            </p>
          </div>
          <button className="relative z-10 whitespace-nowrap bg-white text-rose-600 hover:bg-rose-50 font-extrabold py-4 px-8 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 text-lg pointer-events-none md:pointer-events-auto">
            Check Now <ArrowRight size={20} />
          </button>
        </div>

        {/* 🌟 INSTITUTE CAMP CARD 🌟 */}
        <div className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-xl mb-12 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1" onClick={() => setIsCampDetailsOpen(true)}>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex-1 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-black mb-2 flex items-center justify-center md:justify-start gap-2">
              <Building size={28} /> Host an EduFill Campus Drive
            </h3>
            <p className="text-indigo-100 text-sm md:text-base font-medium max-w-xl">
              Are you an institute? Click here to see how our on-campus form-filling drive can save your students' precious study time.
            </p>
          </div>
          <button className="relative z-10 whitespace-nowrap bg-white text-indigo-700 hover:bg-indigo-50 font-extrabold py-3 px-6 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 pointer-events-none md:pointer-events-auto">
            See Details <ArrowRight size={18} />
          </button>
        </div>

        <button onClick={() => setIsMissingModalOpen(true)} className="flex justify-center items-center gap-2 bg-transparent text-amber-600 hover:bg-amber-50 font-bold py-2 px-4 rounded-xl text-xs md:text-sm transition-colors mb-12 border border-transparent hover:border-amber-200">
          <FileWarning size={16}/> Didn't receive photos/printout?
        </button>

        {/* HOW IT WORKS */}
        <div className="w-full mb-12">
          <p className="text-center text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-6">How EduFill Works</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4"><div className="w-10 h-10 shrink-0 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black text-lg">1</div><div><h3 className="font-bold text-gray-900 mb-1">Book a Slot</h3><p className="text-xs text-gray-500 leading-relaxed">Enter your details. A dedicated expert will be assigned to you instantly.</p></div></div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4"><div className="w-10 h-10 shrink-0 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-black text-lg">2</div><div><h3 className="font-bold text-gray-900 mb-1">Upload Securely</h3><p className="text-xs text-gray-500 leading-relaxed">Click a photo of your documents. AI auto-crops & converts them to PDF.</p></div></div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4"><div className="w-10 h-10 shrink-0 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-black text-lg">3</div><div><h3 className="font-bold text-gray-900 mb-1">Relax & Track</h3><p className="text-xs text-gray-500 leading-relaxed">Your expert fills the form error-free. Get confirmation directly on WhatsApp.</p></div></div>
          </div>
        </div>

        {/* TRUST BADGES */}
        <div className="w-full bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-xl mb-12">
          <h3 className="text-center font-bold text-lg mb-6">Why Students Choose EduFill</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
            <div className="flex flex-col items-center"><ShieldCheck size={32} className="text-emerald-400 mb-2"/><p className="text-xs md:text-sm font-bold">100% Error Free</p></div>
            <div className="flex flex-col items-center"><Clock size={32} className="text-amber-400 mb-2"/><p className="text-xs md:text-sm font-bold">Saves 3+ Hours</p></div>
            <div className="flex flex-col items-center"><Smartphone size={32} className="text-blue-300 mb-2"/><p className="text-xs md:text-sm font-bold">Mobile Friendly</p></div>
            <div className="flex flex-col items-center"><Zap size={32} className="text-yellow-400 mb-2"/><p className="text-xs md:text-sm font-bold">Expert Support</p></div>
          </div>
        </div>

      </main>

      <footer className="w-full border-t border-gray-200 bg-gray-50 py-8 text-center mt-auto">
        <div className="flex items-center justify-center gap-2 mb-2"><div className="relative w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded flex items-center justify-center shadow-sm"><span className="font-black text-white text-[8px] tracking-tighter">EF</span></div><span className="font-bold text-gray-500 text-sm">EduFill Solutions</span></div>
        <p className="text-xs font-medium text-gray-400">© {new Date().getFullYear()} EduFill. All Rights Reserved.</p>
      </footer>
      
      {Chatbot && <Chatbot />}
    </div>
  );
}
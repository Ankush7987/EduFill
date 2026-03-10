import React, { useState, useEffect } from 'react';
import { HelpCircle, ShieldCheck, Clock, Smartphone, Zap, ArrowRight, Building, FileWarning, X, CheckCircle, Loader2, Users, FileText, CheckSquare } from 'lucide-react';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; 
import BookingModal from '../components/BookingModal'; 



export default function HomePage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [liveExams, setLiveExams] = useState({ neet: true, jee: false, cuet: false });

  const [isCampDetailsOpen, setIsCampDetailsOpen] = useState(false); 
  const [isCampModalOpen, setIsCampModalOpen] = useState(false);
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  
  const [loadingCamp, setLoadingCamp] = useState(false);
  const [loadingMissing, setLoadingMissing] = useState(false);

  const [campForm, setCampForm] = useState({ instituteName: '', contactPerson: '', mobile: '', studentCount: '' });
  const [missingForm, setMissingForm] = useState({ studentName: '', mobile: '', missingItems: [] });

  useEffect(() => {
    const docRef = doc(db, "Settings", "LiveExams");
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) setLiveExams(docSnap.data());
    });
    return () => unsub();
  }, []);

  const handleCampSubmit = async (e) => {
    e.preventDefault();
    setLoadingCamp(true);
    try {
      await addDoc(collection(db, "Camp_Requests"), {
        ...campForm,
        status: 'New Request',
        timestamp: serverTimestamp()
      });
      alert("Camp Request Submitted Successfully! Our team will contact you shortly.");
      setIsCampModalOpen(false);
      setCampForm({ instituteName: '', contactPerson: '', mobile: '', studentCount: '' });
    } catch (error) {
      console.error(error);
      alert("Failed to submit request.");
    } finally {
      setLoadingCamp(false);
    }
  };

  const handleMissingItemToggle = (item) => {
    setMissingForm(prev => {
      const isSelected = prev.missingItems.includes(item);
      return {
        ...prev,
        missingItems: isSelected 
          ? prev.missingItems.filter(i => i !== item) 
          : [...prev.missingItems, item]
      };
    });
  };

  const handleMissingSubmit = async (e) => {
    e.preventDefault();
    if(missingForm.missingItems.length === 0) {
      alert("Please select at least one missing item.");
      return;
    }
    setLoadingMissing(true);
    try {
      await addDoc(collection(db, "Missing_Requests"), {
        ...missingForm,
        status: 'Pending',
        timestamp: serverTimestamp()
      });
      alert("Report Submitted! You will receive your missing items shortly.");
      setIsMissingModalOpen(false);
      setMissingForm({ studentName: '', mobile: '', missingItems: [] });
    } catch (error) {
      console.error(error);
      alert("Failed to submit report.");
    } finally {
      setLoadingMissing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-20 md:pb-0 relative selection:bg-emerald-200">
      
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />

      {isCampDetailsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
              <div>
                <h2 className="text-xl font-extrabold flex items-center gap-2"><Building size={22}/> EduFill Campus Drive</h2>
                <p className="text-indigo-200 text-sm mt-1">Empower your institute</p>
              </div>
              <button onClick={() => setIsCampDetailsOpen(false)} className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Don't let your students waste precious study time standing in cyber cafe queues. Host an EduFill Camp at your campus and provide them with a seamless form-filling experience.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0"><CheckSquare size={18}/></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">100% Error-Free Guarantee</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Our trained experts handle the complicated exam forms, ensuring no rejections.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><Users size={18}/></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Zero Distractions for Students</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Students stay on campus, focus on their prep, and we handle the paperwork.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0"><FileText size={18}/></div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">End-to-End Setup</h4>
                    <p className="text-xs text-gray-500 mt-0.5">We bring our AI tools, document scanners, and team. You just provide the space.</p>
                  </div>
                </div>
              </div>

              <button onClick={() => { setIsCampDetailsOpen(false); setIsCampModalOpen(true); }} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                Yes, I want to host a camp <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isCampModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-5 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold flex items-center gap-2"><Building size={20}/> Camp Request Form</h2>
              <button onClick={() => setIsCampModalOpen(false)} className="text-white/70 hover:text-white bg-white/10 p-1.5 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={handleCampSubmit} className="p-5 space-y-4">
              <p className="text-xs text-gray-500 mb-2">Fill in your details and our relationship manager will call you back to finalize the dates.</p>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Institute Name</label><input type="text" required value={campForm.instituteName} onChange={e => setCampForm({...campForm, instituteName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Contact Person Name</label><input type="text" required value={campForm.contactPerson} onChange={e => setCampForm({...campForm, contactPerson: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Mobile Number</label><input type="tel" maxLength="10" required value={campForm.mobile} onChange={e => setCampForm({...campForm, mobile: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Approx. Student Count</label><input type="number" required value={campForm.studentCount} onChange={e => setCampForm({...campForm, studentCount: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500" /></div>
              <button type="submit" disabled={loadingCamp} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md flex justify-center items-center gap-2 transition-colors">
                {loadingCamp ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18}/>} Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {isMissingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-amber-500 p-5 flex justify-between items-center text-white">
              <h2 className="text-lg font-bold flex items-center gap-2"><FileWarning size={20}/> Report Missing Item</h2>
              <button onClick={() => setIsMissingModalOpen(false)} className="text-white/70 hover:text-white bg-white/20 p-1.5 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={handleMissingSubmit} className="p-5 space-y-4">
              <p className="text-xs text-gray-500 mb-2">Didn't receive your photos or confirmation page? Let us know!</p>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Your Full Name</label><input type="text" required value={missingForm.studentName} onChange={e => setMissingForm({...missingForm, studentName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-amber-500" /></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1">Registered Mobile Number</label><input type="tel" maxLength="10" required value={missingForm.mobile} onChange={e => setMissingForm({...missingForm, mobile: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-amber-500" /></div>
              
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-600 mb-2">What is missing? (Select)</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={missingForm.missingItems.includes('Passport Photo')} onChange={() => handleMissingItemToggle('Passport Photo')} className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500" /> Passport Photo
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={missingForm.missingItems.includes('Confirmation Page')} onChange={() => handleMissingItemToggle('Confirmation Page')} className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500" /> Confirmation Page
                  </label>
                </div>
              </div>

              <button type="submit" disabled={loadingMissing} className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl shadow-md flex justify-center items-center gap-2 transition-colors">
                {loadingMissing ? <Loader2 size={18} className="animate-spin"/> : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* 🌟 NAYA: 3D CSS LOGO 🌟 */}
            <div className="relative w-9 h-9 md:w-11 md:h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg border-b-2 border-emerald-700">
              <span className="font-black text-white text-base md:text-xl tracking-tighter drop-shadow-md">EF</span>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 bg-yellow-400 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <span className="text-xl md:text-2xl font-extrabold italic text-blue-950 tracking-tight">EduFill</span>
          </div>
          <a href="https://wa.me/919752519051?text=Hi%20EduFill%20Support,%20I%20need%20help" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-gray-500 hover:text-green-600 transition-colors bg-gray-100 px-3 py-1.5 rounded-full">
            <HelpCircle size={16} /> Help
          </a>
        </div>
      </header>

      {/* MAIN HERO SECTION */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-6 pb-12 flex flex-col items-center">
        
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {liveExams.neet && <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> NEET UG LIVE</span>}
          {liveExams.jee && <span className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> JEE MAIN LIVE</span>}
          {liveExams.cuet && <span className="bg-purple-50 text-purple-600 border border-purple-200 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm"><span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span> CUET UG LIVE</span>}
        </div>

        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-blue-950 leading-tight mb-4">
            Skip the Cyber Cafe Queue. <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Fill Forms Online!</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-lg font-medium px-2">
            EduFill assigns a dedicated expert to fill your exam forms 100% error-free. Upload docs, relax, and focus on your studies.
          </p>
        </div>

        <button onClick={() => setIsBookingOpen(true)} className="hidden md:flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all mb-6 w-full max-w-sm">
          Book Your Slot Now <ArrowRight size={20} />
        </button>

        <button onClick={() => setIsMissingModalOpen(true)} className="flex justify-center items-center gap-2 bg-transparent text-amber-600 hover:bg-amber-50 font-bold py-2 px-4 rounded-xl text-xs md:text-sm transition-colors mb-10 border border-transparent hover:border-amber-200">
          <FileWarning size={16}/> Didn't receive photos/printout?
        </button>

        {/* HOW IT WORKS */}
        <div className="w-full mb-12">
          <p className="text-center text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-6">How EduFill Works</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black text-lg">1</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Book a Slot</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Enter your details. A dedicated expert will be assigned to you instantly.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-black text-lg">2</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Upload Securely</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Click a photo of your documents. AI auto-crops & converts them to PDF.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-black text-lg">3</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Relax & Track</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Your expert fills the form error-free. Get confirmation directly on WhatsApp.</p>
              </div>
            </div>
          </div>
        </div>

        {/* TRUST BADGES */}
        <div className="w-full bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-xl mb-12">
          <h3 className="text-center font-bold text-lg mb-6">Why Students Choose EduFill</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
            <div className="flex flex-col items-center">
              <ShieldCheck size={32} className="text-emerald-400 mb-2"/>
              <p className="text-xs md:text-sm font-bold">100% Error Free</p>
            </div>
            <div className="flex flex-col items-center">
              <Clock size={32} className="text-amber-400 mb-2"/>
              <p className="text-xs md:text-sm font-bold">Saves 3+ Hours</p>
            </div>
            <div className="flex flex-col items-center">
              <Smartphone size={32} className="text-blue-300 mb-2"/>
              <p className="text-xs md:text-sm font-bold">Mobile Friendly</p>
            </div>
            <div className="flex flex-col items-center">
              <Zap size={32} className="text-yellow-400 mb-2"/>
              <p className="text-xs md:text-sm font-bold">Expert Support</p>
            </div>
          </div>
        </div>

        {/* B2B INSTITUTE BANNER */}
        <div className="w-full bg-white border-2 border-indigo-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm mb-4">
           <div className="text-center md:text-left flex-1">
             <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded mb-3 inline-block">For Institutes & Coaching Centers</span>
             <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2">Want to host an EduFill Camp?</h3>
             <p className="text-sm text-gray-500 max-w-md mx-auto md:mx-0">Bring our team to your campus. We'll handle all your students' exam registrations seamlessly.</p>
           </div>
           <button onClick={() => setIsCampDetailsOpen(true)} className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 w-full md:w-auto">
             <Building size={18}/> Learn More
           </button>
        </div>

      </main>

      {/* COPYRIGHT FOOTER */}
      <footer className="w-full border-t border-gray-200 bg-gray-50 py-8 text-center mt-auto mb-16 md:mb-0">
        <div className="flex items-center justify-center gap-2 mb-2">
          {/* 🌟 NAYA: FOOTER SMALL LOGO 🌟 */}
          <div className="relative w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded flex items-center justify-center shadow-sm">
            <span className="font-black text-white text-[8px] tracking-tighter">EF</span>
          </div>
          <span className="font-bold text-gray-500 text-sm">EduFill Solutions</span>
        </div>
        <p className="text-xs font-medium text-gray-400">
          © {new Date().getFullYear()} EduFill. All Rights Reserved.
        </p>
        <p className="text-[10px] text-gray-400 mt-1">Made with ❤️ for Students in India</p>
      </footer>

      {/* MOBILE STICKY FLOATING ACTION BUTTON */}
      <div className="md:hidden fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-40 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => setIsBookingOpen(true)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-transform">
          Book Slot Now <ArrowRight size={20}/>
        </button>
      </div>


      <div className="md:hidden fixed bottom-0 left-0 w-full p-4 ...">
        {/* Mobile button code */}
      </div>

    

    </div>
  );
}
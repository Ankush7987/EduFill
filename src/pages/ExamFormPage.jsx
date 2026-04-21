import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, X, MessageCircle, ArrowRight, ShieldCheck, Clock, ArrowLeft, Loader2, CheckCircle2, Calendar, FileText, AlertTriangle } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import DocumentUploader from '../components/DocumentUploader';
// 🚀 FIXED: Added SEO component
import SEO from '../components/SEO';

const MASTER_TIME_SLOTS = [
  "12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM", "02:00 AM", "02:30 AM", "03:00 AM", "03:30 AM",
  "04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM", "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM",
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
];

const defaultData = {
  'neet': { title: "NEET UG 2026", startDate: "To be announced", lastDate: "To be announced", desc: "National Eligibility cum Entrance Test (NEET).", examValue: "NEET UG", requirements: ['Passport Size Photo', 'Signature'], edufillPromise: 'Zero Rejection Rate' },
  'jee': { title: "JEE Main 2026", startDate: "To be announced", lastDate: "To be announced", desc: "Joint Entrance Examination (Main).", examValue: "JEE Main/Adv", requirements: ['Passport Size Photo'], edufillPromise: 'Flawless Registration' },
  'cuet': { title: "CUET UG 2026", startDate: "To be announced", lastDate: "To be announced", desc: "Common University Entrance Test.", examValue: "CUET UG", requirements: ['Passport Size Photo'], edufillPromise: 'Perfect Subject Mapping' },
  'govt-college': { title: "12th Govt College Admission", startDate: "To be announced", lastDate: "To be announced", desc: "e-Pravesh Admissions.", examValue: "12th Admission", requirements: ['10th/12th Marksheet'], edufillPromise: 'No Queues' },
  'default': { title: "Exam Form Filling Portal", startDate: "N/A", lastDate: "N/A", desc: "...", examValue: "", requirements: [], edufillPromise: "" }
};

// ==========================================
// SUB-COMPONENTS for cleaner code
// ==========================================

const Header = ({ isFormLive, navigate }) => (
  <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-10 flex justify-between items-center shadow-sm">
    <div className="flex items-center gap-4">
      <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"><ArrowLeft size={20} /></button>
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-md"><span className="font-black text-white text-xs">EF</span></div>
        <h1 className="text-xl font-black text-blue-950 hidden md:block">Secure Application Portal</h1>
      </div>
    </div>
    
    {isFormLive ? (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full shadow-sm"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span><span className="text-xs font-black text-red-600 uppercase tracking-widest">Forms Live</span></div>
    ) : (
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-full">Forms Closed</span>
    )}
  </header>
);

const ExamInfoPanel = ({ examData }) => (
  <div className="w-full lg:w-5/12 space-y-6">
    <div><h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">{examData.title}</h1><p className="text-gray-600 font-medium leading-relaxed mb-6">{examData.desc}</p></div>

    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3"><div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><Calendar size={20} /></div><div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</p><p className="font-black text-gray-800 text-sm">{examData.startDate}</p></div></div>
      <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3"><div className="bg-red-100 p-2 rounded-xl text-red-600"><Clock size={20} /></div><div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Date</p><p className="font-black text-red-600 text-sm">{examData.lastDate}</p></div></div>
    </div>

    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"><h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b pb-3"><FileText className="text-blue-500"/> Required Documents</h3><ul className="space-y-3">{examData.requirements?.map((req, idx) => (<li key={idx} className="flex items-start gap-3 text-sm text-gray-700 font-medium"><CheckCircle2 size={18} className="shrink-0 mt-0.5 text-blue-500" /><span>{req}</span></li>))}</ul></div>
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100 shadow-sm"><h3 className="text-sm font-black uppercase tracking-widest mb-3 text-indigo-800 flex items-center gap-2"><ShieldCheck size={20}/> Why Book With EduFills?</h3><p className="text-sm text-indigo-900/80 leading-relaxed font-medium">{examData.edufillPromise}</p></div>
  </div>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function ExamFormPage() {
  const { examId } = useParams(); 
  const navigate = useNavigate();
  
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const todayStr = new Date(now.getTime() - (offset*60*1000)).toISOString().split('T')[0];

  const [examData, setExamData] = useState(defaultData[examId] || defaultData['default']);
  const [isFormLive, setIsFormLive] = useState(false);
  const [bookingSettings, setBookingSettings] = useState({ startTime: "08:00 AM", endTime: "06:00 PM", holidays: [] });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [generatedToken, setGeneratedToken] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [currentCollection, setCurrentCollection] = useState('');
  const [approvedInstitutes, setApprovedInstitutes] = useState([]);
  const [assignedAgent, setAssignedAgent] = useState('');
  
  const [formData, setFormData] = useState({ 
    exam: defaultData[examId]?.examValue || '', 
    institute: '', fullName: '', mobile: '', batchName: '', category: '', 
    slotDate: todayStr, 
    slotTime: '' 
  });
  const [reportingTime, setReportingTime] = useState('');

  const [bookedSlotsInfo, setBookedSlotsInfo] = useState({});
  const [instituteCapacity, setInstituteCapacity] = useState(0);

  useEffect(() => {
    const controlsRef = doc(db, "PlatformSettings", "examControls");
    const contentRef = doc(db, "PlatformSettings", "examContent");
    const bookingRef = doc(db, "PlatformSettings", "bookingControls");

    const unsubAdmin = onSnapshot(controlsRef, (docSnap) => {
      setIsFormLive(docSnap.exists() && docSnap.data()[examId] === true);
    });

    const unsubContent = onSnapshot(contentRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data()[examId]) {
        const fetched = docSnap.data()[examId];
        setExamData({ ...defaultData[examId], ...fetched, startDate: fetched.startDate || 'To be announced', lastDate: fetched.lastDate || 'To be announced' });
      }
    });

    const unsubBooking = onSnapshot(bookingRef, (docSnap) => {
      if (docSnap.exists()) setBookingSettings(docSnap.data());
    });

    return () => { unsubAdmin(); unsubContent(); unsubBooking(); };
  }, [examId]);

  useEffect(() => {
    const q = query(collection(db, "Camp_Requests"), where("status", "==", "Completed"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const instList = [];
      snapshot.forEach(doc => { if(doc.data().instituteName) instList.push(doc.data().instituteName); });
      setApprovedInstitutes([...new Set(instList)].filter(name => name !== 'Ribosome Institute' && name !== 'Unacademy'));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if(!formData.institute) return;
    let collectionName = formData.institute === "Ribosome Institute" ? "Ribosome_Students" : formData.institute === "Unacademy" ? "Unacademy_Students" : "Other_Students";
    
    const checkCapacity = async () => {
      const qAgents = query(collection(db, "Employees"), where("institute", "==", formData.institute), where("active", "==", true));
      const agentSnap = await getDocs(qAgents);
      let activeAgents = 0;
      agentSnap.forEach(doc => {
        const data = doc.data();
        const isOnLeave = data.leaves && data.leaves.includes(todayStr);
        if (data.onBreak !== true && !isOnLeave) activeAgents++;
      });
      setInstituteCapacity(activeAgents);
    };
    checkCapacity();

    const qBookings = query(collection(db, collectionName), where("slotDate", "==", todayStr));
    const unsub = onSnapshot(qBookings, (snapshot) => {
      const slotCounts = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === 'Pending' || data.status === 'In Progress' || data.status === 'Assigned') {
          slotCounts[data.slotTime] = (slotCounts[data.slotTime] || 0) + 1;
        }
      });
      setBookedSlotsInfo(slotCounts);
    });

    return () => unsub();
  }, [formData.institute, todayStr]);

  const calculateReportingTime = (timeStr) => {
    if(!timeStr) return "";
    let [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    minutes -= 10;
    if (minutes < 0) { minutes += 60; hours -= 1; if (hours === 0) hours = 12; else if (hours === 11) modifier = modifier === 'AM' ? 'PM' : 'AM'; }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${modifier}`;
  };

  const handleChange = (e) => {
    if (e.target.name === 'slotDate') {
      const selectedDate = e.target.value;
      if (bookingSettings.holidays?.includes(selectedDate)) {
        alert("This date is marked as an Off-Day / Holiday. Please choose another working date for your slot.");
        setFormData({ ...formData, slotDate: '' });
        return;
      }
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if(e.target.name === 'slotTime') {
      setReportingTime(calculateReportingTime(e.target.value));
    }
  };

  const generateToken = () => "EDU-" + Math.floor(100000 + Math.random() * 900000);

  const assignAgent = async (instituteName, slotDate, slotTime, collectionName) => {
    try {
      const qBookings = query(
        collection(db, collectionName),
        where("slotDate", "==", slotDate),
        where("slotTime", "==", slotTime)
      );
      const bookingSnap = await getDocs(qBookings);
      const busyAgentNames = [];
      bookingSnap.forEach(doc => {
        const data = doc.data();
        if (data.status === 'Pending' || data.status === 'In Progress' || data.status === 'Assigned') {
          if (data.assignedTo) busyAgentNames.push(data.assignedTo);
        }
      });

      const qAgents = query(
        collection(db, "Employees"), 
        where("institute", "==", instituteName), 
        where("active", "==", true)
      );
      const agentSnap = await getDocs(qAgents);
      if (agentSnap.empty) return null; 

      let freeAgents = [];
      agentSnap.forEach((doc) => {
        const agentData = doc.data();
        const isOnLeave = agentData.leaves && agentData.leaves.includes(todayStr);

        if (agentData.onBreak !== true && !isOnLeave && !busyAgentNames.includes(agentData.name)) {
          freeAgents.push({ id: doc.id, ...agentData });
        }
      });

      if (freeAgents.length === 0) return null; 

      freeAgents.sort((a, b) => (a.assignedCount || 0) - (b.assignedCount || 0));
      const selectedAgent = freeAgents[0]; 

      await updateDoc(doc(db, "Employees", selectedAgent.id), { 
        assignedCount: (selectedAgent.assignedCount || 0) + 1 
      });
      
      return selectedAgent.name; 
    } catch (error) { 
      console.error("Agent Assignment Error:", error);
      return null; 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    try {
      if(instituteCapacity === 0) {
        alert("Currently no agents are available or all are on break. Please try after some time.");
        setLoading(false); return;
      }

      let collectionName = formData.institute === "Ribosome Institute" ? "Ribosome_Students" : formData.institute === "Unacademy" ? "Unacademy_Students" : "Other_Students";
      const newToken = generateToken(); 
      setCurrentCollection(collectionName);
      
      const assignedAgentName = await assignAgent(formData.institute, formData.slotDate, formData.slotTime, collectionName);
      
      if (!assignedAgentName) {
        alert("Oh no! All agents just got booked for this specific time slot. Please select the next available time.");
        setLoading(false); return;
      }

      setAssignedAgent(assignedAgentName); 

      const docRef = await addDoc(collection(db, collectionName), {
        ...formData, reportingTime: reportingTime, tokenNumber: newToken, status: 'Pending', paymentStatus: 'Due', assignedTo: assignedAgentName, timestamp: serverTimestamp()
      });

      setCurrentStudentId(docRef.id); 
      setGeneratedToken(newToken);
      
      const businessNumber = "919752519051"; 
      const textMessage = `Hello EduFill Support, 👋\n\nI booked my slot for ${formData.exam}.\n*Token:* ${newToken}\n*Slot:* ${formData.slotTime}\n*Reporting Time:* ${reportingTime} (10 mins early)\n*Expert:* ${assignedAgentName}\n\nPlease verify!`;
      setWhatsappLink(`https://wa.me/${businessNumber}?text=${encodeURIComponent(textMessage)}`);
      
      setStep(2); 
    } catch (error) { 
      console.error(error);
      alert("Something went wrong! Please try again."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleFinish = () => { navigate('/'); };

  const checkIsPastTime = (slotTimeStr) => {
    if (!slotTimeStr) return false;
    const now = new Date();
    const [time, modifier] = slotTimeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;
    
    const slotTimeDate = new Date();
    slotTimeDate.setHours(hours, minutes, 0, 0);
    return now > slotTimeDate; 
  };

  const getAvailableSlots = () => {
    const startIndex = MASTER_TIME_SLOTS.indexOf(bookingSettings.startTime);
    const endIndex = MASTER_TIME_SLOTS.indexOf(bookingSettings.endTime);
    const sIdx = startIndex !== -1 ? startIndex : 0; 
    const eIdx = endIndex !== -1 ? endIndex : 47;
    const allAllowedSlots = MASTER_TIME_SLOTS.slice(sIdx, eIdx + 1);
    
    return allAllowedSlots.filter(time => !checkIsPastTime(time));
  };

  const availableSlots = getAvailableSlots();
  const isHolidayToday = bookingSettings.holidays?.includes(todayStr);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* 🚀 FIXED: GSC Canonical Tag and Rich SEO dynamically generated 🚀 */}
      <SEO 
        title={`Fill ${examData.title} Application Form Online Error-Free | EduFill`}
        description={`Skip the cyber cafe queue! Let EduFill experts fill your ${examData.title} admission forms with 100% accuracy and zero rejection guarantee. Starts at ${examData.startDate}.`}
        keywords={`${examData.title} online form filling, ${examData.examValue} application form, registration, online cyber cafe, error free admission form`}
        url={`/apply/${examId}`} 
        schemaMarkup={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": `${examData.title} Online Form Filling`,
          "provider": {
            "@type": "Organization",
            "name": "EduFill"
          },
          "description": examData.desc,
          "areaServed": "India"
        }}
      />

      <Header isFormLive={isFormLive} navigate={navigate} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col lg:flex-row gap-8">
        
        <ExamInfoPanel examData={examData} />

        {/* ➡️ RIGHT COLUMN: THE BOOKING FORM */}
        <div className="w-full lg:w-7/12">
          <div className="bg-white rounded-[2rem] shadow-xl w-full overflow-hidden border border-gray-100 sticky top-24">
            
            <div className={`${step === 2 || step === 4 ? 'bg-emerald-600' : 'bg-gradient-to-r from-blue-900 to-indigo-800'} p-8 text-white transition-colors duration-500 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <span className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1 block">{examData.examValue || 'Exam Application'}</span>
                <h2 className="text-3xl font-black mb-2">{step === 1 ? 'Walk-in / Live Slot Booking' : step === 2 ? 'Booking Confirmed!' : step === 3 ? 'Upload Documents' : 'All Done!'}</h2>
                {step === 1 && <p className="text-blue-100 font-medium">Book a slot for today and skip the line.</p>}
              </div>
            </div>

            <div className="p-6 md:p-8">
              {!isFormLive ? (
                <div className="text-center py-10"><Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-black text-gray-800 mb-2">Applications Not Active</h3><p className="text-gray-500 font-medium">The forms for {examData.title} are currently closed or not announced yet.</p></div>
              ) : isHolidayToday ? (
                <div className="text-center py-10"><AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" /><h3 className="text-xl font-black text-red-600 mb-2">Center is Closed Today</h3><p className="text-gray-500 font-medium">It's a designated holiday. Please visit tomorrow to book your slot.</p></div>
              ) : (
                <>
                  {step === 1 && (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Exam Target</label>
                          <input type="text" readOnly value={formData.exam} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-500 font-bold outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Your Institute *</label>
                          <select name="institute" required onChange={handleChange} value={formData.institute} className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 font-medium outline-none transition-colors"><option value="">-- Select Institute --</option><option value="Ribosome Institute">Ribosome Institute</option><option value="Unacademy">Unacademy</option>{approvedInstitutes.map((inst, idx) => (<option key={idx} value={inst}>{inst}</option>))}<option value="Others">Others</option></select>
                        </div>
                      </div>

                      {formData.institute && (
                        <div className="space-y-5 pt-4 animate-in slide-in-from-bottom-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Name *</label><input type="text" name="fullName" required onChange={handleChange} value={formData.fullName} className="w-full border-2 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" placeholder="As per 10th marksheet" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">WhatsApp No. *</label><input type="tel" name="mobile" required maxLength="10" onChange={handleChange} value={formData.mobile} className="w-full border-2 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" placeholder="10-digit number" /></div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {formData.institute !== 'Others' && (
                              <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Batch Name *</label><input type="text" name="batchName" required onChange={handleChange} value={formData.batchName} className="w-full border-2 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" placeholder="e.g., Dropper Batch" /></div>
                            )}
                            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Caste Category *</label><select name="category" required onChange={handleChange} value={formData.category} className="w-full border-2 rounded-xl px-4 py-3 focus:border-blue-500 outline-none bg-white"><option value="">-- Select --</option><option value="OBC">OBC</option><option value="SC">SC</option><option value="ST">ST</option><option value="General (EWS)">General (EWS)</option><option value="General">General</option></select></div>
                          </div>
                          
                          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 mt-4">
                            <h4 className="text-sm font-black text-blue-900 mb-4">Choose Verification Slot (Today)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date</label>
                                <input type="text" readOnly value="Today" className="w-full border-2 border-gray-200 text-gray-500 font-bold rounded-xl px-4 py-3 bg-gray-100 outline-none" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Time *</label>
                                <select name="slotTime" required onChange={handleChange} value={formData.slotTime} className="w-full border-2 border-white focus:border-blue-500 rounded-xl px-4 py-3 outline-none cursor-pointer shadow-sm bg-white">
                                  <option value="">Select Available Time</option>
                                  {availableSlots.length > 0 ? (
                                    availableSlots.map((time, i) => {
                                      const isFull = (bookedSlotsInfo[time] || 0) >= instituteCapacity;
                                      return (
                                        <option key={i} value={time} disabled={isFull || instituteCapacity === 0} className={isFull ? "text-gray-400 font-medium" : "text-green-700 font-bold"}>
                                          {time} {isFull ? '(Fully Booked)' : '✓ Available'}
                                        </option>
                                      );
                                    })
                                  ) : (
                                    <option value="" disabled>No slots left for today</option>
                                  )}
                                </select>
                              </div>
                            </div>
                            
                            {instituteCapacity === 0 && (
                               <p className="mt-3 text-xs font-bold text-red-500 flex items-center gap-1"><AlertTriangle size={14}/> No agents currently available or on break.</p>
                            )}

                            {reportingTime && (
                              <div className="mt-4 bg-amber-100/50 border border-amber-200 text-amber-800 p-3.5 rounded-xl flex items-center gap-3 text-sm font-bold animate-in zoom-in duration-300">
                                <Clock size={20} className="text-amber-600"/> Please report at desk by {reportingTime}
                              </div>
                            )}
                          </div>
                          
                          <button type="submit" disabled={loading || availableSlots.length === 0 || instituteCapacity === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-black py-4 rounded-xl text-lg shadow-lg shadow-blue-500/30 transition-all mt-8 active:scale-95 flex justify-center items-center gap-2">
                            {loading ? <><Loader2 className="animate-spin"/> Assigning Expert...</> : "Confirm Secure Booking"}
                          </button>
                        </div>
                      )}
                    </form>
                  )}

                  {step === 2 && (
                    <div className="text-center py-4 animate-in slide-in-from-right-8 duration-500">
                      <div className="mx-auto w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6"><ShieldCheck size={48} className="text-emerald-500" /></div>
                      <h3 className="text-3xl font-black text-gray-900 mb-2">Slot Booked!</h3>
                      <p className="text-gray-600 text-base mb-8">Reach the desk at <b className="text-gray-900">{reportingTime}</b> to pre-verify documents.</p>
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 mb-8 text-left shadow-inner">
                        <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4">Your Assigned Executive</p>
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-md">{assignedAgent ? assignedAgent.charAt(0) : 'E'}</div>
                          <div><p className="text-2xl font-black text-gray-900">{assignedAgent}</p><p className="text-sm font-bold text-gray-500 flex items-center gap-1 mt-1"><CheckCircle size={14} className="text-emerald-500"/> Verified Form Expert</p></div>
                        </div>
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-6 w-full bg-white border-2 border-gray-100 hover:border-[#25D366] hover:text-[#25D366] text-gray-700 font-black py-4 rounded-xl text-base flex justify-center items-center gap-2 transition-all shadow-sm"><MessageCircle size={20} className="text-[#25D366]" /> Ping {assignedAgent ? assignedAgent.split(' ')[0] : 'us'} on WhatsApp</a>
                      </div>
                      <div className="border-t border-gray-100 pt-8">
                        <p className="text-base font-black text-gray-800 mb-4">Next Step: Provide Documents</p>
                        <button onClick={() => setStep(3)} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-black py-4 rounded-xl text-lg shadow-lg transition-all flex justify-center items-center gap-2">Upload Documents Now <ArrowRight size={20}/></button>
                        <button onClick={handleFinish} className="mt-5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider">I'll bring them to the center</button>
                      </div>
                    </div>
                  )}

                  {step === 3 && <DocumentUploader studentId={currentStudentId} collectionName={currentCollection} studentName={formData.fullName} category={formData.category} onComplete={() => setStep(4)} />}

                  {step === 4 && (
                    <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex justify-center mb-6 relative"><CheckCircle size={90} className="text-emerald-500 drop-shadow-lg" /></div>
                      <h3 className="text-3xl font-black text-gray-900 mb-3">Documents Uploaded!</h3>
                      <p className="text-gray-500 mb-8 text-base px-4">See you at <b className="text-gray-900">{reportingTime}</b>!</p>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-3xl p-8 mb-10">
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Reference Token</p>
                        <p className="text-5xl font-black text-blue-900 font-mono tracking-wider">{generatedToken}</p>
                      </div>
                      <button onClick={handleFinish} className="w-full py-5 font-black text-white text-xl bg-gray-900 hover:bg-black rounded-2xl transition-colors shadow-2xl hover:shadow-black/40">Done & Return Home</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
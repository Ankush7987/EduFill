import React, { useState, useEffect } from 'react';
import { CheckCircle, X, MessageCircle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import DocumentUploader from './DocumentUploader';

export default function BookingModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [generatedToken, setGeneratedToken] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [currentCollection, setCurrentCollection] = useState('');
  const [approvedInstitutes, setApprovedInstitutes] = useState([]);
  const [assignedAgent, setAssignedAgent] = useState('');
  
  const [formData, setFormData] = useState({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: '', slotTime: '' });
  const [reportingTime, setReportingTime] = useState('');

  // 🌟 NAYA: DYNAMIC SLOTS LOGIC 🌟
  const timeSlots = ["10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM"];
  const [bookedSlotsInfo, setBookedSlotsInfo] = useState({});
  const [instituteCapacity, setInstituteCapacity] = useState(2); // Default capacity

  useEffect(() => {
    const q = query(collection(db, "Camp_Requests"), where("status", "==", "Completed"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const instList = [];
      snapshot.forEach(doc => { if(doc.data().instituteName) instList.push(doc.data().instituteName); });
      setApprovedInstitutes([...new Set(instList)].filter(name => name !== 'Ribosome Institute' && name !== 'Unacademy'));
    });
    return () => unsubscribe();
  }, []);

  // 🌟 NAYA: SLOT AVAILABILITY CHECKER 🌟
  useEffect(() => {
    if(!formData.institute || !formData.slotDate) return;

    let collectionName = formData.institute === "Ribosome Institute" ? "Ribosome_Students" : formData.institute === "Unacademy" ? "Unacademy_Students" : "Other_Students";
    
    // 1. Find Capacity (Total Agents * 2 forms per slot)
    const checkCapacity = async () => {
      const qAgents = query(collection(db, "Employees"), where("institute", "==", formData.institute), where("active", "==", true));
      const agentSnap = await getDocs(qAgents);
      const capacity = agentSnap.empty ? 2 : agentSnap.size * 2; // Default 2 agar koi agent nahi hai
      setInstituteCapacity(capacity);
    };
    checkCapacity();

    // 2. Listen to real-time bookings for that date
    const qBookings = query(collection(db, collectionName), where("slotDate", "==", formData.slotDate));
    const unsub = onSnapshot(qBookings, (snapshot) => {
      const slotCounts = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        // Sirf active students ko count karenge, Absent walo ko nahi
        if (data.status !== 'Absent') {
          slotCounts[data.slotTime] = (slotCounts[data.slotTime] || 0) + 1;
        }
      });
      setBookedSlotsInfo(slotCounts);
    });

    return () => unsub();
  }, [formData.institute, formData.slotDate]);

  const calculateReportingTime = (timeStr) => {
    if(!timeStr) return "";
    let [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    minutes -= 10;
    if (minutes < 0) { minutes += 60; hours -= 1; if (hours === 0) hours = 12; else if (hours === 11) modifier = modifier === 'AM' ? 'PM' : 'AM'; }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${modifier}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if(e.target.name === 'slotTime') {
      setReportingTime(calculateReportingTime(e.target.value));
    }
  };

  const generateToken = () => "EDU-" + Math.floor(100000 + Math.random() * 900000);

  const assignAgent = async (instituteName) => {
    try {
      const q = query(collection(db, "Employees"), where("institute", "==", instituteName), where("active", "==", true));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null; 
      let agents = [];
      querySnapshot.forEach((doc) => agents.push({ id: doc.id, ...doc.data() }));
      agents.sort((a, b) => (a.assignedCount || 0) - (b.assignedCount || 0));
      const selectedAgent = agents[0]; 
      await updateDoc(doc(db, "Employees", selectedAgent.id), { assignedCount: (selectedAgent.assignedCount || 0) + 1 });
      return selectedAgent.name; 
    } catch (error) { return null; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      let collectionName = formData.institute === "Ribosome Institute" ? "Ribosome_Students" : formData.institute === "Unacademy" ? "Unacademy_Students" : "Other_Students";
      const newToken = generateToken(); setCurrentCollection(collectionName);
      
      const assignedAgentName = await assignAgent(formData.institute);
      const finalAgentName = assignedAgentName || 'EduFill Expert';
      setAssignedAgent(finalAgentName); 

      const docRef = await addDoc(collection(db, collectionName), {
        ...formData, reportingTime: reportingTime, tokenNumber: newToken, status: 'Pending', paymentStatus: 'Due', assignedTo: assignedAgentName || 'Unassigned', timestamp: serverTimestamp()
      });

      setCurrentStudentId(docRef.id); setGeneratedToken(newToken);
      
      const businessNumber = "919752519051"; 
      const textMessage = `Hello EduFill Support, 👋\n\nI booked my slot.\n*Token:* ${newToken}\n*Slot:* ${formData.slotTime}\n*Reporting Time:* ${reportingTime} (10 mins early)\n*Expert:* ${finalAgentName}\n\nPlease verify!`;
      setWhatsappLink(`https://wa.me/${businessNumber}?text=${encodeURIComponent(textMessage)}`);
      
      setStep(2); 
    } catch (error) { alert("Something went wrong! Please try again."); } finally { setLoading(false); }
  };

  const handleClose = () => {
    setStep(1); setGeneratedToken(''); setWhatsappLink(''); setAssignedAgent(''); setReportingTime('');
    setFormData({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: '', slotTime: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className={`${step === 2 || step === 4 ? 'bg-emerald-600' : 'bg-gradient-to-r from-blue-900 to-indigo-800'} p-5 md:p-6 flex justify-between items-center text-white transition-colors duration-500`}>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold">{step === 1 ? 'Book Your Slot' : step === 2 ? 'Booking Confirmed!' : step === 3 ? 'Upload Documents' : 'All Done!'}</h2>
            {step === 1 && <p className="text-blue-200 text-xs md:text-sm mt-1">Fast & error-free registration</p>}
          </div>
          <button onClick={handleClose} className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-5 md:p-6 max-h-[75vh] overflow-y-auto">
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 animate-in fade-in">
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Select Exam *</label><select name="exam" required onChange={handleChange} value={formData.exam} className="w-full border-2 rounded-xl px-4 py-3"><option value="">-- Select Exam --</option><option value="NEET UG">NEET UG</option><option value="JEE Main/Adv">JEE Main / Adv</option><option value="CUET UG">CUET UG</option></select></div>
              {formData.exam && (
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Select Institute *</label><select name="institute" required onChange={handleChange} value={formData.institute} className="w-full border-2 rounded-xl px-4 py-3"><option value="">-- Select Institute --</option><option value="Ribosome Institute">Ribosome Institute</option><option value="Unacademy">Unacademy</option>{approvedInstitutes.map((inst, idx) => (<option key={idx} value={inst}>{inst}</option>))}<option value="Others">Others</option></select></div>
              )}
              {formData.institute && (
                <div className="space-y-4 md:space-y-5 border-t-2 pt-4 md:pt-5">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label><input type="text" name="fullName" required onChange={handleChange} value={formData.fullName} className="w-full border-2 rounded-xl px-4 py-3" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Number *</label><input type="tel" name="mobile" required maxLength="10" onChange={handleChange} value={formData.mobile} className="w-full border-2 rounded-xl px-4 py-3" /></div>
                  {formData.institute !== 'Others' && (
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Batch Name *</label><input type="text" name="batchName" required onChange={handleChange} value={formData.batchName} className="w-full border-2 rounded-xl px-4 py-3" /></div>
                  )}
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Category *</label><select name="category" required onChange={handleChange} value={formData.category} className="w-full border-2 rounded-xl px-4 py-3"><option value="">-- Select --</option><option value="OBC">OBC</option><option value="SC">SC</option><option value="ST">ST</option><option value="General (EWS)">General (EWS)</option><option value="General">General</option></select></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Slot Date *</label><input type="date" name="slotDate" required onChange={handleChange} value={formData.slotDate} className="w-full border-2 rounded-xl px-4 py-3" /></div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Time *</label>
                      <select name="slotTime" required onChange={handleChange} value={formData.slotTime} className="w-full border-2 rounded-xl px-4 py-3" disabled={!formData.slotDate}>
                        <option value="">Time</option>
                        {timeSlots.map((time, i) => {
                          const isFull = (bookedSlotsInfo[time] || 0) >= instituteCapacity;
                          return (
                            <option key={i} value={time} disabled={isFull}>
                              {time} {isFull ? '(FULL)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  {reportingTime && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-center gap-2 text-sm font-bold">
                      <Clock size={18} className="text-amber-600"/> Reporting Time: {reportingTime} (10 mins early)
                    </div>
                  )}
                  <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-4 rounded-xl text-lg shadow-lg transition-all mt-6">
                    {loading ? "Assigning Agent..." : "Confirm Booking"}
                  </button>
                </div>
              )}
            </form>
          )}

          {step === 2 && (
            <div className="text-center py-2 animate-in slide-in-from-right-8 duration-500">
              <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4"><ShieldCheck size={40} className="text-emerald-500" /></div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Slot Booked!</h3>
              <p className="text-gray-600 text-sm mb-6">Reach the center at <b>{reportingTime}</b> to pre-verify documents.</p>
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 mb-6 text-left shadow-inner">
                <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest mb-3">Your Assigned Executive</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">{assignedAgent.charAt(0)}</div>
                  <div><p className="text-xl font-black text-gray-900">{assignedAgent}</p><p className="text-xs font-bold text-gray-500 flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500"/> Verified Form Expert</p></div>
                </div>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-5 w-full bg-white border border-gray-200 hover:border-[#25D366] hover:text-[#25D366] text-gray-700 font-bold py-3 rounded-xl text-sm flex justify-center items-center gap-2 transition-all shadow-sm"><MessageCircle size={18} className="text-[#25D366]" /> Chat with {assignedAgent.split(' ')[0]}</a>
              </div>
              <div className="border-t border-gray-100 pt-6">
                <p className="text-sm font-bold text-gray-800 mb-3">Next Step: Provide Documents</p>
                <button onClick={() => setStep(3)} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-extrabold py-4 rounded-xl text-lg shadow-lg transition-all flex justify-center items-center gap-2">Upload Documents Now <ArrowRight size={20}/></button>
                <button onClick={handleClose} className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider">I'll bring them to the center</button>
              </div>
            </div>
          )}

          {step === 3 && <DocumentUploader studentId={currentStudentId} collectionName={currentCollection} studentName={formData.fullName} category={formData.category} onComplete={() => setStep(4)} />}

          {step === 4 && (
            <div className="text-center py-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-center mb-4 relative"><CheckCircle size={80} className="text-emerald-500 drop-shadow-lg" /></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Documents Uploaded!</h3>
              <p className="text-gray-500 mb-6 text-sm px-4">See you at <b>{reportingTime}</b>!</p>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 rounded-2xl p-5 mb-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Reference Token</p>
                <p className="text-4xl font-black text-blue-900 font-mono">{generatedToken}</p>
              </div>
              <button onClick={handleClose} className="w-full py-4 font-extrabold text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors shadow-lg">Done & Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { CheckCircle, X, MessageCircle, ArrowRight } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import DocumentUploader from './DocumentUploader'; // NAYA IMPORT

const BookingModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  
  // STEPS: 1 = Form, 2 = Upload Docs, 3 = Success
  const [step, setStep] = useState(1); 
  const [generatedToken, setGeneratedToken] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [currentCollection, setCurrentCollection] = useState('');
  
  const [approvedInstitutes, setApprovedInstitutes] = useState([]);
  
  const [formData, setFormData] = useState({
    exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: '', slotTime: ''
  });

  const timeSlots = ["10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM"];

  useEffect(() => {
    const q = query(collection(db, "Camp_Requests"), where("status", "==", "Completed"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const instList = [];
      snapshot.forEach(doc => { if(doc.data().instituteName) instList.push(doc.data().instituteName); });
      const uniqueInst = [...new Set(instList)].filter(name => name !== 'Ribosome Institute' && name !== 'Unacademy');
      setApprovedInstitutes(uniqueInst);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const generateToken = () => "EDU-" + Math.floor(100000 + Math.random() * 900000);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let collectionName = "Other_Students"; 
      if (formData.institute === "Ribosome Institute") collectionName = "Ribosome_Students";
      else if (formData.institute === "Unacademy") collectionName = "Unacademy_Students";

      const newToken = generateToken();
      setCurrentCollection(collectionName);

      // Save Initial Data
      const docRef = await addDoc(collection(db, collectionName), {
        ...formData,
        tokenNumber: newToken,
        status: 'Pending',
        paymentStatus: 'Due',
        timestamp: serverTimestamp()
      });

      setCurrentStudentId(docRef.id);
      setGeneratedToken(newToken);
      
      const businessNumber = "919752519051"; 
      const textMessage = `Hello EduFill Support, 👋\n\nMera slot book ho gaya hai aur maine apne documents bhi upload kar diye hain.\n\n*Token:* ${newToken}\n*Name:* ${formData.fullName}\n*Exam:* ${formData.exam}\n*Institute:* ${formData.institute}\n*Slot:* ${formData.slotDate} at ${formData.slotTime}\n\nKripya process aage badhayein!`;
      setWhatsappLink(`https://wa.me/${businessNumber}?text=${encodeURIComponent(textMessage)}`);
      
      setStep(2); // MOVE TO DOCUMENT UPLOAD STEP

    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1); setGeneratedToken(''); setWhatsappLink('');
    setFormData({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: '', slotTime: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        <div className={`${step === 3 ? 'bg-emerald-600' : 'bg-gradient-to-r from-blue-900 to-indigo-800'} p-6 flex justify-between items-center text-white transition-colors duration-500`}>
          <div>
            <h2 className="text-2xl font-extrabold">
              {step === 1 ? 'Book Your Slot' : step === 2 ? 'Upload Documents' : 'Booking Confirmed!'}
            </h2>
            {step === 1 && <p className="text-blue-200 text-sm mt-1">Fast & error-free registration</p>}
            {step === 2 && <p className="text-blue-200 text-sm mt-1">Save time at the center</p>}
          </div>
          <button onClick={handleClose} className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: FORM */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Select Exam *</label><select name="exam" required onChange={handleChange} value={formData.exam} className="w-full border-2 rounded-xl px-4 py-3"><option value="">-- Select Exam --</option><option value="NEET UG">NEET UG</option><option value="JEE Main/Adv">JEE Main / Adv</option><option value="CUET UG">CUET UG</option></select></div>
              {formData.exam && (
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Select Institute *</label><select name="institute" required onChange={handleChange} value={formData.institute} className="w-full border-2 rounded-xl px-4 py-3"><option value="">-- Select Institute --</option><option value="Ribosome Institute">Ribosome Institute</option><option value="Unacademy">Unacademy</option>{approvedInstitutes.map((inst, idx) => (<option key={idx} value={inst}>{inst}</option>))}<option value="Others">Others</option></select></div>
              )}
              {formData.institute && (
                <div className="space-y-5 border-t-2 pt-5">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label><input type="text" name="fullName" required onChange={handleChange} value={formData.fullName} className="w-full border-2 rounded-xl px-4 py-3" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Number *</label><input type="tel" name="mobile" required maxLength="10" onChange={handleChange} value={formData.mobile} className="w-full border-2 rounded-xl px-4 py-3" /></div>
                  {formData.institute !== 'Others' && (
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Batch Name *</label><input type="text" name="batchName" required onChange={handleChange} value={formData.batchName} className="w-full border-2 rounded-xl px-4 py-3" /></div>
                  )}
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Category *</label><select name="category" required onChange={handleChange} value={formData.category} className="w-full border-2 rounded-xl px-4 py-3"><option value="">-- Select --</option><option value="OBC">OBC</option><option value="SC">SC</option><option value="ST">ST</option><option value="General (EWS)">General (EWS)</option><option value="General">General</option></select></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Slot Date *</label><input type="date" name="slotDate" required onChange={handleChange} value={formData.slotDate} className="w-full border-2 rounded-xl px-4 py-3" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Time *</label><select name="slotTime" required onChange={handleChange} value={formData.slotTime} className="w-full border-2 rounded-xl px-4 py-3"><option value="">Time</option>{timeSlots.map((time, i) => (<option key={i} value={time}>{time}</option>))}</select></div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-4 rounded-xl text-lg shadow-lg transition-all mt-6">{loading ? "Processing..." : "Save Slot & Next"}</button>
                </div>
              )}
            </form>
          )}

          {/* STEP 2: UPLOAD DOCUMENTS */}
          {step === 2 && (
            <DocumentUploader 
              studentId={currentStudentId} 
              collectionName={currentCollection}
              studentName={formData.fullName} 
              category={formData.category}
              onComplete={() => setStep(3)} 
            />
          )}

          {/* STEP 3: SUCCESS & WHATSAPP */}
          {step === 3 && (
            <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-center mb-4 relative"><CheckCircle size={80} className="text-emerald-500 drop-shadow-lg" /></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">All Done Successfully!</h3>
              <p className="text-gray-500 mb-6 text-sm px-4">Your documents and slot are saved. Connect on WhatsApp for updates.</p>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 rounded-2xl p-5 mb-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Reference Token</p>
                <p className="text-4xl font-black text-blue-900 font-mono">{generatedToken}</p>
              </div>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={handleClose} className="group relative flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white font-extrabold py-4 rounded-xl text-lg shadow-lg mb-4">
                <MessageCircle size={24} /> Connect on WhatsApp <ArrowRight size={20} />
              </a>
              <button onClick={handleClose} className="w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-800 bg-gray-100 rounded-xl transition-colors">Back to Home</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
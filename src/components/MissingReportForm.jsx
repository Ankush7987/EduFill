import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase'; 
import { AlertCircle, CheckSquare, Loader2, CheckCircle, ShieldAlert } from 'lucide-react';

const MissingReportForm = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    mobile: '',
    missingItems: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); 

  const handleCheckboxChange = (item) => {
    setFormData(prev => {
      const isSelected = prev.missingItems.includes(item);
      return {
        ...prev,
        missingItems: isSelected 
          ? prev.missingItems.filter(i => i !== item)
          : [...prev.missingItems, item]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(''); 

    if (formData.missingItems.length === 0) {
      setErrorMsg("Please select at least one missing item.");
      return;
    }
    if (formData.mobile.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSubmitting(true);
    try {
      const mobileStr = formData.mobile.trim();
      const mobileNum = Number(mobileStr);
      
      let isPhotoDelivered = false;
      let isConfirmationDelivered = false;
      let studentFound = false;

      const collectionsList = ['Ribosome_Students', 'Unacademy_Students', 'Other_Students'];

      // 🌟 NAYA: DEEP SCAN LOGIC (Saare Duplicate Records Check Karega) 🌟
      for (const colName of collectionsList) {
        // Check for String Mobile Number
        const qStr = query(collection(db, colName), where("mobile", "==", mobileStr));
        const snapStr = await getDocs(qStr);
        
        if (!snapStr.empty) {
          studentFound = true;
          snapStr.forEach(doc => {
            const data = doc.data();
            // Agar kisi bhi ek record me photo di ja chuki hai, toh usko true mark kar lo
            if (data.photoDelivered === true) isPhotoDelivered = true;
            if (data.confirmationDelivered === true) isConfirmationDelivered = true;
          });
        }

        // Check for Number Mobile Number (Firebase Type Safety ke liye)
        const qNum = query(collection(db, colName), where("mobile", "==", mobileNum));
        const snapNum = await getDocs(qNum);
        
        if (!snapNum.empty) {
          studentFound = true;
          snapNum.forEach(doc => {
            const data = doc.data();
            if (data.photoDelivered === true) isPhotoDelivered = true;
            if (data.confirmationDelivered === true) isConfirmationDelivered = true;
          });
        }
      }

      if (!studentFound) {
        setErrorMsg("No registration found with this mobile number. Please check the number.");
        setSubmitting(false);
        return;
      }

      // Check ki student ne form me kya tick kiya hai
      const requestingPhoto = formData.missingItems.some(item => item.toLowerCase().includes('photo'));
      const requestingConfirmation = formData.missingItems.some(item => item.toLowerCase().includes('confirmation'));

      // 🚫 FRAUD DETECTION 🚫
      if (requestingPhoto && isPhotoDelivered) {
        setErrorMsg("🚫 FRAUD ALERT: Our records clearly show you have ALREADY COLLECTED your photos. We cannot process this request.");
        setSubmitting(false);
        return;
      }

      if (requestingConfirmation && isConfirmationDelivered) {
        setErrorMsg("🚫 FRAUD ALERT: Our records clearly show you have ALREADY COLLECTED your confirmation printout. We cannot process this request.");
        setSubmitting(false);
        return;
      }

      // 4. Sab theek hone par hi Save hoga
      await addDoc(collection(db, "Missing_Requests"), {
        studentName: formData.studentName,
        mobile: formData.mobile,
        missingItems: formData.missingItems,
        status: 'Pending',
        timestamp: serverTimestamp()
      });
      setSuccess(true);

    } catch (error) {
      console.error("Error reporting missing items:", error);
      setErrorMsg("Something went wrong. Please check your internet connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center max-w-md mx-auto mt-10 shadow-lg">
        <div className="flex justify-center mb-4 text-emerald-500"><CheckCircle size={60} /></div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Request Received!</h2>
        <p className="text-gray-600 mb-6">We have received your report. Our admin will print your missing items shortly. Please collect them from the center.</p>
        <button onClick={() => {setSuccess(false); setFormData({studentName: '', mobile: '', missingItems: []});}} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold transition-all hover:bg-gray-800">Submit Another</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
        <AlertCircle className="text-red-500 shrink-0 mt-1" size={28} />
        <div>
          <h2 className="text-xl font-black text-red-900">Report Missing Items</h2>
          <p className="text-xs text-red-700 mt-1">Didn't receive your photos or confirmation page? Let us know below.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
        {/* ERROR MESSAGE BOX */}
        {errorMsg && (
          <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-xl text-sm font-bold flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Student Full Name</label>
          <input 
            type="text" required placeholder="Enter your name"
            value={formData.studentName} onChange={(e) => setFormData({...formData, studentName: e.target.value})}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp / Mobile Number</label>
          <input 
            type="tel" required placeholder="Enter registered mobile" maxLength="10"
            value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
          />
          <p className="text-[10px] text-gray-500 mt-1">*Must match the number used during registration.</p>
        </div>

        <div className="pt-2">
          <label className="block text-sm font-bold text-gray-900 mb-3 border-b pb-2">What is missing?</label>
          <div className="space-y-3">
            {[
              "Passport Size Photo (Small)", 
              "Post Card Size Photo (Large)", 
              "Confirmation Page Printout"
            ].map((item) => (
              <label 
                key={item} 
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.missingItems.includes(item) ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
              >
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={formData.missingItems.includes(item)}
                  onChange={() => handleCheckboxChange(item)}
                />
                
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.missingItems.includes(item) ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'}`}>
                  {formData.missingItems.includes(item) && <CheckSquare size={14} className="text-white"/>}
                </div>
                <span className={`text-sm font-medium ${formData.missingItems.includes(item) ? 'text-red-900 font-bold' : 'text-gray-700'}`}>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <button disabled={submitting} type="submit" className="w-full mt-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-extrabold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-all">
          {submitting ? <><Loader2 size={20} className="animate-spin" /> Verifying Details...</> : "Verify & Send Request"}
        </button>
      </form>
    </div>
  );
};

export default MissingReportForm;
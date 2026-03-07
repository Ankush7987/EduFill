import React, { useState } from 'react';
import { X, CheckCircle, Building, Users, MapPin, Phone, Mail, Send } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const CampModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    instituteName: '', contactPerson: '', designation: '', mobile: '', email: '', studentCount: '', address: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "Camp_Requests"), { ...formData, status: 'New Request', timestamp: serverTimestamp() });
      setShowSuccess(true);
      setFormData({ instituteName: '', contactPerson: '', designation: '', mobile: '', email: '', studentCount: '', address: '' });
    } catch (error) {
      console.error("Error saving request: ", error);
      alert("Failed to submit the request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setShowSuccess(false); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        <div className={`${showSuccess ? 'bg-emerald-600' : 'bg-gradient-to-r from-blue-900 to-indigo-800'} p-6 flex justify-between items-center text-white transition-colors duration-500`}>
          <div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
              <Building size={24}/> {showSuccess ? 'Request Submitted!' : 'Host an EduFill Camp'}
            </h2>
            {!showSuccess && <p className="text-blue-200 text-sm mt-1">Partner with Central India's Leading Form-Filling Platform</p>}
          </div>
          <button onClick={handleClose} className="text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {showSuccess ? (
            <div className="text-center py-10 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex justify-center mb-6"><CheckCircle size={80} className="text-emerald-500 drop-shadow-lg" /></div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Request Received Successfully!</h3>
              <p className="text-gray-500 mb-6 text-lg px-4">Thank you for your interest. Our partnership team will contact you within 24 hours to proceed with the scheduling.</p>
              <button onClick={handleClose} className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-4 px-10 rounded-xl text-lg transition-all">Close</button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 justify-between items-center text-sm font-medium text-blue-900">
                <p className="text-gray-600 font-bold">Direct Contact:</p>
                <a href="tel:9752519051" className="flex items-center gap-2 hover:text-blue-600"><Phone size={16}/> +91 9752519051</a>
                <a href="mailto:example@gmail.com" className="flex items-center gap-2 hover:text-blue-600"><Mail size={16}/> example@gmail.com</a>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Institute Name *</label><input type="text" name="instituteName" required value={formData.instituteName} onChange={handleChange} placeholder="e.g. Target Academy" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-0 outline-none transition-colors" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Expected Students *</label><select name="studentCount" required value={formData.studentCount} onChange={handleChange} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-0 outline-none transition-colors bg-white"><option value="">-- Select --</option><option value="50-100">50 - 100 Students</option><option value="100-200">100 - 200 Students</option><option value="200-500">200 - 500 Students</option><option value="500+">500+ Students</option></select></div>
                </div>

                <div className="grid md:grid-cols-2 gap-5 border-t border-gray-100 pt-5">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Contact Person Name *</label><input type="text" name="contactPerson" required value={formData.contactPerson} onChange={handleChange} placeholder="Full Name" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-0 outline-none transition-colors" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Designation</label><input type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g. Director, Manager" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-0 outline-none transition-colors" /></div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number *</label><input type="tel" name="mobile" required pattern="[0-9]{10}" maxLength="10" value={formData.mobile} onChange={handleChange} placeholder="10-digit mobile number" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-0 outline-none transition-colors" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Official Email ID" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-0 outline-none transition-colors" /></div>
                </div>

                <div><label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><MapPin size={16}/> Complete Address *</label><textarea name="address" required rows="2" value={formData.address} onChange={handleChange} placeholder="Institute address with landmark and Pincode" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-0 outline-none transition-colors resize-none"></textarea></div>

                <button type="submit" disabled={loading} className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white font-extrabold py-4 rounded-xl text-lg shadow-lg transition-all mt-4 flex items-center justify-center gap-2">
                  {loading ? "Submitting..." : <><Send size={20} /> Submit Camp Request</>}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampModal;
import React, { useState, useEffect } from 'react';
import { Building, Users, CheckCircle, ShieldCheck, Clock, FileText, Send, MapPin, Phone, Mail, ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

// 🚀 FIXED: Importing our custom SEO component
import SEO from '../components/SEO';

export default function CampusDrive() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    instituteName: '', contactPerson: '', designation: '', mobile: '', email: '', studentCount: '', address: ''
  });

  const handleChange = (e) => { 
    setFormData({ ...formData, [e.target.name]: e.target.value }); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "Camp_Requests"), { 
        ...formData, 
        status: 'New Request', 
        timestamp: serverTimestamp() 
      });
      setShowSuccess(true);
      setFormData({ instituteName: '', contactPerson: '', designation: '', mobile: '', email: '', studentCount: '', address: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error saving request: ", error);
      alert("Failed to submit the request. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-emerald-200">
      
      {/* 🌟 SEO ENHANCEMENT 🌟 */}
      <SEO 
        title="Campus Drive & B2B Partnerships | EduFill"
        description="Partner with EduFill for offline campus form-filling drives and mock test evaluations. Trusted by top institutes in Central India."
        keywords="EduFill campus drive, B2B partnership, institute tie-up, bulk form filling, school registration partner, Bhopal Indore form filling"
        url="/campus-drive"
      />

      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md border-b-2 border-emerald-700">
              <span className="font-black text-white text-lg tracking-tighter">EF</span>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-gray-900">Edu<span className="text-emerald-600">Fill</span> B2B</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 px-4 py-2 rounded-full transition-colors border border-gray-100">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="bg-gray-900 text-white py-20 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-6 shadow-sm">
                <Building size={14} /> Exclusive For Institutes & Schools
              </div>
              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
                Empower Your Students with an <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">EduFill Campus Drive</span>
              </h1>
              <p className="text-gray-400 text-lg mb-8 font-medium max-w-xl leading-relaxed">
                Partner with Central India's leading form-filling platform. We set up a live verification desk at your campus, saving your students' precious study hours and eliminating application rejections completely.
              </p>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 font-bold text-emerald-300 bg-white/5 px-4 py-2 rounded-lg border border-white/10"><ShieldCheck size={20}/> Zero Rejections</div>
                <div className="flex items-center gap-2 font-bold text-blue-300 bg-white/5 px-4 py-2 rounded-lg border border-white/10"><Users size={20}/> Bulk Processing</div>
              </div>
            </div>

            {/* FORM SECTION ON HERO */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl text-gray-900 border border-gray-100 relative animate-in slide-in-from-bottom-10 duration-500">
              {showSuccess ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} className="text-emerald-500" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Request Received!</h3>
                  <p className="text-gray-500 font-medium mb-8 leading-relaxed px-4">Thank you for your interest. Our B2B partnership team will contact you within 24 hours to discuss and schedule the campus drive.</p>
                  <button onClick={() => setShowSuccess(false)} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-95">Submit Another Request</button>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-black mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                    <Calendar className="text-emerald-600" size={24}/> Schedule a Camp
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Institute Name *</label>
                      <input type="text" name="instituteName" required value={formData.instituteName} onChange={handleChange} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-emerald-500 focus:bg-gray-50 outline-none transition-all font-medium text-gray-800" placeholder="e.g. Target Academy" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Contact Person *</label>
                        <input type="text" name="contactPerson" required value={formData.contactPerson} onChange={handleChange} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-emerald-500 focus:bg-gray-50 outline-none transition-all font-medium text-gray-800" placeholder="Full Name" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mobile *</label>
                        <input type="tel" name="mobile" required pattern="[0-9]{10}" maxLength="10" value={formData.mobile} onChange={handleChange} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-emerald-500 focus:bg-gray-50 outline-none transition-all font-medium text-gray-800" placeholder="10-digit number" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Expected Students *</label>
                      <select name="studentCount" required value={formData.studentCount} onChange={handleChange} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-emerald-500 focus:bg-gray-50 outline-none transition-all font-medium bg-white text-gray-800 cursor-pointer">
                        <option value="">-- Select Batch Size --</option>
                        <option value="50-100">50 - 100 Students</option>
                        <option value="100-200">100 - 200 Students</option>
                        <option value="200-500">200 - 500 Students</option>
                        <option value="500+">500+ Students</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Address *</label>
                      <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-emerald-500 focus:bg-gray-50 outline-none transition-all font-medium text-gray-800" placeholder="City & Landmark" />
                    </div>
                    
                    <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-black py-4 min-h-[56px] rounded-xl shadow-lg transition-transform active:scale-95 mt-4 flex justify-center items-center gap-2 text-lg">
                      {loading ? <><Loader2 className="animate-spin" size={20}/> Processing...</> : <><Send size={20}/> Submit Request</>}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section className="py-24 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Why Host an EduFill Camp?</h2>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">Add immense value to your institute's offerings by providing a seamless, stress-free application experience right where your students study.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 text-center hover:shadow-xl transition-all group">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform"><Clock size={40}/></div>
              <h3 className="text-2xl font-black text-gray-900 mb-4">Save Study Time</h3>
              <p className="text-gray-500 text-base leading-relaxed font-medium">Students don't have to miss classes or waste crucial days standing in cyber cafe queues. We do it efficiently on your campus.</p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 text-center hover:shadow-xl transition-all group">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform"><ShieldCheck size={40}/></div>
              <h3 className="text-2xl font-black text-gray-900 mb-4">100% Error-Free</h3>
              <p className="text-gray-500 text-base leading-relaxed font-medium">Our trained experts verify documents on the spot, ensuring no form is ever rejected due to category, signature, or photo errors.</p>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 text-center hover:shadow-xl transition-all group">
              <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform"><FileText size={40}/></div>
              <h3 className="text-2xl font-black text-gray-900 mb-4">End-to-End Support</h3>
              <p className="text-gray-500 text-base leading-relaxed font-medium">From live photo capturing and resizing to document uploads and secure payment processing, our team handles everything seamlessly.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
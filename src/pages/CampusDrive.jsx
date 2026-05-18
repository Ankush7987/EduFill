import React, { useEffect, useState } from 'react';
import {
  Building,
  Users,
  CheckCircle,
  ShieldCheck,
  Clock,
  FileText,
  Send,
  ArrowLeft,
  Calendar,
  Loader2,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const CAMP_REQUESTS_COLLECTION = 'Camp_Requests';

const initialFormData = {
  instituteName: '',
  contactPerson: '',
  designation: '',
  mobile: '',
  email: '',
  studentCount: '',
  address: '',
};

const createCampRequestId = () => {
  const now = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `EDU-CAMP-${now}${random}`;
};

const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);
const normalizeEmail = (value) => String(value || '').trim().toLowerCase().slice(0, 120);
const normalizeText = (value, maxLength = 180) => String(value || '').slice(0, maxLength);
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

export default function CampusDrive() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastRequestId, setLastRequestId] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    let nextValue = value;

    if (name === 'mobile') nextValue = normalizePhone(value);
    if (name === 'email') nextValue = normalizeEmail(value);
    if (name === 'instituteName') nextValue = normalizeText(value, 140);
    if (name === 'contactPerson') nextValue = normalizeText(value, 90);
    if (name === 'designation') nextValue = normalizeText(value, 80);
    if (name === 'address') nextValue = normalizeText(value, 220);

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (errorMessage) setErrorMessage('');
  };

  const validateForm = () => {
    if (!formData.instituteName.trim()) return 'Please enter institute name.';
    if (!formData.contactPerson.trim()) return 'Please enter contact person name.';
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) return 'Please enter a valid 10-digit Indian mobile number.';
    if (formData.email && !isValidEmail(formData.email)) return 'Please enter a valid email address.';
    if (!formData.studentCount) return 'Please select expected student count.';
    if (!formData.address.trim()) return 'Please enter institute address or city.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const validationMessage = validateForm();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const requestId = createCampRequestId();

      await addDoc(collection(db, CAMP_REQUESTS_COLLECTION), {
        requestId,
        instituteName: formData.instituteName.trim(),
        contactPerson: formData.contactPerson.trim(),
        designation: formData.designation.trim() || null,
        mobile: formData.mobile,
        email: formData.email || null,
        studentCount: formData.studentCount,
        address: formData.address.trim(),
        status: 'New Request',
        source: 'Campus Drive Page',
        timestamp: serverTimestamp(),
      });

      setLastRequestId(requestId);
      setShowSuccess(true);
      setFormData(initialFormData);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Error saving campus request:', error);
      }

      setErrorMessage('Failed to submit the request. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-emerald-200">
      <SEO
        title="Campus Drive & B2B Partnerships | EduFill"
        description="Partner with EduFill for campus form-filling drives, document support, mock test assistance and student application support."
        keywords="EduFill campus drive, B2B partnership, institute tie-up, bulk form filling, school registration partner, Indore form filling"
        url="/campus-drive"
      />

      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center gap-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0">
            <img src="/edufill-brand-logo.svg?v=2" alt="EduFill" className="h-10 w-auto object-contain shrink-0" />
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 truncate">
              Edu<span className="text-emerald-600">Fill</span> B2B
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 px-4 py-2 rounded-full transition-colors border border-gray-100 shrink-0"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gray-900 text-white py-20 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-6 shadow-sm">
                <Building size={14} /> Exclusive For Institutes & Schools
              </div>

              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
                Empower Your Students with an{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  EduFill Campus Drive
                </span>
              </h1>

              <p className="text-gray-400 text-lg mb-8 font-medium max-w-xl leading-relaxed">
                Partner with EduFill for guided form-filling support on your campus. We help students save time, understand document requirements and reduce application mistakes.
              </p>

              <div className="flex flex-wrap gap-4 sm:gap-6">
                <div className="flex items-center gap-2 font-bold text-emerald-300 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                  <ShieldCheck size={20} /> Error-Reduction Support
                </div>
                <div className="flex items-center gap-2 font-bold text-blue-300 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                  <Users size={20} /> Bulk Processing
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl text-gray-900 border border-gray-100 relative animate-in slide-in-from-bottom-10 duration-500">
              {showSuccess ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={48} className="text-emerald-500" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Request Received!</h3>
                  <p className="text-gray-500 font-medium mb-4 leading-relaxed px-4">
                    Thank you for your interest. Our B2B partnership team will contact you soon to discuss and schedule the campus drive.
                  </p>
                  {lastRequestId && (
                    <p className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-black text-gray-700 mb-6">
                      Request ID: <span className="text-emerald-600">{lastRequestId}</span>
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccess(false);
                      setLastRequestId('');
                    }}
                    className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-black mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                    <Calendar className="text-emerald-600" size={24} /> Schedule a Camp
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Institute Name *</label>
                      <input
                        type="text"
                        name="instituteName"
                        required
                        value={formData.instituteName}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-emerald-500 focus:bg-gray-50 outline-none transition-all font-medium text-gray-800"
                        placeholder="e.g. Target Academy"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Contact Person *</label>
                        <input
                          type="text"
                          name="contactPerson"
                          required
                          value={formData.contactPerson}
                          onChange={handleChange}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-emerald-500 focus:bg-gray-50 outline-none transition-all font-medium text-gray-800"
                          placeholder="Full Name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Designation</label>
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleChange}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-emerald-500 focus:bg-gray-50 outline-none transition-all font-medium text-gray-800"
                          placeholder="Director / Manager"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mobile *</label>
                        <input
                          type="tel"
                          name="mobile"
                          required
                          inputMode="numeric"
                          maxLength="10"
                          value={formData.mobile}
                          onChange={handleChange}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-emerald-500 focus:bg-gray-50 outline-none transition-all font-medium text-gray-800"
                          placeholder="10-digit number"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-emerald-500 focus:bg-gray-50 outline-none transition-all font-medium text-gray-800"
                          placeholder="official@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Expected Students *</label>
                      <select
                        name="studentCount"
                        required
                        value={formData.studentCount}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-emerald-500 focus:bg-gray-50 outline-none transition-all font-medium bg-white text-gray-800 cursor-pointer"
                      >
                        <option value="">-- Select Batch Size --</option>
                        <option value="50-100">50 - 100 Students</option>
                        <option value="100-200">100 - 200 Students</option>
                        <option value="200-500">200 - 500 Students</option>
                        <option value="500+">500+ Students</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Address *</label>
                      <input
                        type="text"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-emerald-500 focus:bg-gray-50 outline-none transition-all font-medium text-gray-800"
                        placeholder="City & Landmark"
                      />
                    </div>

                    {errorMessage && (
                      <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-black py-4 min-h-[56px] rounded-xl shadow-lg transition-transform active:scale-95 mt-4 flex justify-center items-center gap-2 text-lg"
                    >
                      {loading ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : <><Send size={20} /> Submit Request</>}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Why Host an EduFill Camp?</h2>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">
              Add value to your institute by providing a guided, stress-free application experience right where your students study.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <BenefitCard
              icon={<Clock size={40} />}
              color="blue"
              title="Save Study Time"
              text="Students do not have to miss classes or waste crucial days standing in cyber cafe queues. We support the process on your campus."
            />
            <BenefitCard
              icon={<ShieldCheck size={40} />}
              color="emerald"
              title="Reduce Form Mistakes"
              text="Our trained team checks documents, photo/signature size and form details carefully to reduce common application errors."
            />
            <BenefitCard
              icon={<FileText size={40} />}
              color="amber"
              title="End-to-End Support"
              text="From document checks and resizing to upload support and application guidance, our team makes the process smoother."
            />
          </div>
        </section>

        <section className="px-4 max-w-7xl mx-auto pb-20">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8 grid md:grid-cols-3 gap-5">
            <ContactMini icon={<Phone size={22} />} title="Call / WhatsApp" text="+91 9752519051" />
            <ContactMini icon={<Mail size={22} />} title="Email" text="support@edufills.com" />
            <ContactMini icon={<MapPin size={22} />} title="Service Area" text="Indore & nearby cities" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function BenefitCard({ icon, color, title, text }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 text-center hover:shadow-xl transition-all group">
      <div className={`w-20 h-20 ${colorMap[color] || colorMap.emerald} rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-500 text-base leading-relaxed font-medium">{text}</p>
    </div>
  );
}

function ContactMini({ icon, title, text }) {
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{title}</p>
        <p className="text-sm font-black text-gray-900 truncate">{text}</p>
      </div>
    </div>
  );
}

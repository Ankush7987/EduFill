import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  ChevronDown,
  Clock,
  FileText,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Zap,
  Star,
  CheckCircle2,
  Loader2,
  CalendarDays,
  HelpCircle,
} from 'lucide-react';
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/SEO';

const EXAM_OPTIONS = [
  'NEET',
  'JEE',
  'CUET',
  'SSC',
  'Railway',
  'MP Board',
  'College Admission',
  'Scholarship Form',
  'Other Form',
];

const TIME_SLOTS = ['10:00 AM', '11:30 AM', '1:00 PM', '3:30 PM', '5:00 PM'];
const ACTIVE_BOOKING_STATUSES = ['Pending', 'Confirmed'];
const SLOT_BOOKINGS_COLLECTION = 'Slot_Bookings';

const initialForm = {
  formType: '',
  fullName: '',
  phone: '',
  email: '',
  selectedDate: '',
  selectedSlot: '',
  message: '',
};

const createBookingId = () => {
  const now = Date.now().toString().slice(-6);
  const random = Math.floor(100 + Math.random() * 900);
  return `EDU-SLOT-${now}${random}`;
};

const todayISO = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);
const normalizeEmail = (value) => String(value || '').trim().toLowerCase().slice(0, 120);
const normalizeText = (value, maxLength = 300) => String(value || '').slice(0, maxLength);

const isActiveBookingStatus = (status) => {
  return ACTIVE_BOOKING_STATUSES.includes(String(status || '').trim());
};

export default function BookSlot() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [errors, setErrors] = useState({});
  const [successData, setSuccessData] = useState(null);

  const minDate = useMemo(() => todayISO(), []);

  const availableSlots = useMemo(() => {
    return TIME_SLOTS.map((slot) => ({
      label: slot,
      booked: bookedSlots.includes(slot),
    }));
  }, [bookedSlots]);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!form.selectedDate) {
        setBookedSlots([]);
        return;
      }

      setLoadingSlots(true);

      try {
        // Query only by date to avoid Firestore composite-index errors.
        const slotQuery = query(
          collection(db, SLOT_BOOKINGS_COLLECTION),
          where('selectedDate', '==', form.selectedDate)
        );

        const snapshot = await getDocs(slotQuery);
        const slots = snapshot.docs
          .map((docSnap) => docSnap.data())
          .filter((booking) => isActiveBookingStatus(booking.status))
          .map((booking) => booking.selectedSlot)
          .filter(Boolean);

        setBookedSlots(slots);

        if (slots.includes(form.selectedSlot)) {
          setForm((prev) => ({ ...prev, selectedSlot: '' }));
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Error loading booked slots:', error);
        }

        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [form.selectedDate, form.selectedSlot]);

  const updateField = (field, value) => {
    let nextValue = value;

    if (field === 'phone') nextValue = normalizePhone(value);
    if (field === 'email') nextValue = normalizeEmail(value);
    if (field === 'fullName') nextValue = normalizeText(value, 90);
    if (field === 'message') nextValue = normalizeText(value, 500);

    setForm((prev) => ({ ...prev, [field]: nextValue }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.formType) nextErrors.formType = 'Please select form type.';

    if (!form.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    } else if (form.fullName.trim().length < 3) {
      nextErrors.fullName = 'Enter valid full name.';
    }

    if (!form.phone.trim()) {
      nextErrors.phone = 'Contact number is required.';
    } else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      nextErrors.phone = 'Enter valid 10-digit Indian mobile number.';
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      nextErrors.email = 'Enter valid email address.';
    }

    if (!form.selectedDate) {
      nextErrors.selectedDate = 'Please select date.';
    } else if (form.selectedDate < minDate) {
      nextErrors.selectedDate = 'Please select today or a future date.';
    }

    if (!form.selectedSlot) {
      nextErrors.selectedSlot = 'Please select available time slot.';
    } else if (bookedSlots.includes(form.selectedSlot)) {
      nextErrors.selectedSlot = 'This slot is already booked. Please select another slot.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const isSlotAlreadyBooked = async () => {
    const slotQuery = query(
      collection(db, SLOT_BOOKINGS_COLLECTION),
      where('selectedDate', '==', form.selectedDate)
    );

    const snapshot = await getDocs(slotQuery);

    return snapshot.docs.some((docSnap) => {
      const booking = docSnap.data();
      return booking.selectedSlot === form.selectedSlot && isActiveBookingStatus(booking.status);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;
    if (!validateForm()) return;

    setLoading(true);

    try {
      const alreadyBooked = await isSlotAlreadyBooked();

      if (alreadyBooked) {
        setErrors((prev) => ({
          ...prev,
          selectedSlot: 'This slot has just been booked. Please select another slot.',
        }));
        setBookedSlots((prev) => Array.from(new Set([...prev, form.selectedSlot])));
        return;
      }

      const bookingId = createBookingId();
      const cleanedEmail = normalizeEmail(form.email);

      const payload = {
        bookingId,
        formType: form.formType,
        fullName: form.fullName.trim(),
        phone: normalizePhone(form.phone),
        email: cleanedEmail || null,
        selectedDate: form.selectedDate,
        selectedSlot: form.selectedSlot,
        message: form.message.trim() || null,
        status: 'Pending',
        source: 'Book Slot Page',
        paymentStatus: 'Not Required',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, SLOT_BOOKINGS_COLLECTION), payload);

      const finalData = {
        bookingId,
        formType: payload.formType,
        fullName: payload.fullName,
        phone: payload.phone,
        email: payload.email,
        selectedDate: payload.selectedDate,
        selectedSlot: payload.selectedSlot,
        status: payload.status,
        displayDate: formatDate(form.selectedDate),
      };

      try {
        localStorage.setItem('edufill_last_slot_booking', JSON.stringify(finalData));
      } catch (storageError) {
        if (import.meta.env.DEV) console.warn('Could not save booking locally:', storageError);
      }

      setSuccessData(finalData);
      setForm(initialForm);
      setBookedSlots([]);
      setErrors({});
      setDropdownOpen(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Slot booking error:', error);
      }

      alert('Something went wrong while booking your slot. Please try again or contact EduFill support.');
    } finally {
      setLoading(false);
    }
  };

  const showBookingStatus = (booking) => {
    alert(
      `Booking ID: ${booking.bookingId}\nForm: ${booking.formType || 'N/A'}\nDate: ${booking.displayDate || formatDate(booking.selectedDate)}\nTime: ${booking.selectedSlot || 'N/A'}\nStatus: ${booking.status || 'Pending'}`
    );
  };

  const handleTrackBooking = async () => {
    if (tracking) return;

    try {
      const saved = localStorage.getItem('edufill_last_slot_booking');

      if (saved) {
        const booking = JSON.parse(saved);
        if (booking?.bookingId) {
          showBookingStatus(booking);
          return;
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Saved booking read failed:', error);
    }

    const bookingId = window.prompt('Enter your Booking ID to track your slot:');
    const cleanBookingId = String(bookingId || '').trim();

    if (!cleanBookingId) return;

    setTracking(true);

    try {
      const bookingQuery = query(
        collection(db, SLOT_BOOKINGS_COLLECTION),
        where('bookingId', '==', cleanBookingId),
        limit(1)
      );

      const snapshot = await getDocs(bookingQuery);

      if (snapshot.empty) {
        alert('Booking not found. Please check your Booking ID or contact support.');
        return;
      }

      const booking = snapshot.docs[0].data();
      showBookingStatus({
        ...booking,
        displayDate: formatDate(booking.selectedDate),
      });
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Booking tracking failed:', error);
      alert('Could not track booking right now. Please try again later.');
    } finally {
      setTracking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-200">
      <SEO
        title="Book Your Slot | EduFill"
        description="Book an EduFill expert slot for exam form filling, admission forms, photo/signature support and document help."
        keywords="EduFill slot booking, exam form filling slot, NEET form help, JEE form help, admission form support"
        url="/book-slot"
      />

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-3 text-left">
            <img src="/edufill-brand-logo.svg?v=2" alt="EduFill" className="h-10 w-auto object-contain" />
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black tracking-tight leading-none">
                Edu<span className="text-emerald-600">Fill</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-bold mt-1">Fill Today, Achieve Tomorrow</p>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-black text-slate-700">
            <button type="button" onClick={() => navigate('/')} className="hover:text-emerald-600">Home</button>
            <button type="button" onClick={() => navigate('/#services')} className="hover:text-emerald-600 flex items-center gap-1">Services <ChevronDown size={14} /></button>
            <button type="button" onClick={() => navigate('/#how-it-works')} className="hover:text-emerald-600">How It Works</button>
            <button type="button" onClick={() => navigate('/#why-edufill')} className="hover:text-emerald-600">Why EduFill</button>
            <button type="button" onClick={() => navigate('/#faq')} className="hover:text-emerald-600">FAQ</button>
            <a href="https://wa.me/919752519051" target="_blank" rel="noreferrer" className="hover:text-emerald-600">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTrackBooking}
              disabled={tracking}
              className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-70 font-black text-sm text-slate-700 shadow-sm"
            >
              {tracking ? <Loader2 size={17} className="animate-spin" /> : <CalendarDays size={17} />}
              Track Booking
            </button>
            <button
              type="button"
              onClick={() => navigate('/vault')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/20"
            >
              <User size={17} />
              Login / Sign up
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-b border-emerald-100/60">
        <div className="absolute left-0 top-12 w-56 h-56 bg-emerald-300/20 rounded-full blur-3xl" />
        <div className="absolute right-0 top-0 w-[500px] h-[300px] bg-teal-200/30 rounded-bl-[160px] blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(16,185,129,0.16)_1px,transparent_0)] [background-size:26px_26px] opacity-40" />

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 pt-10 md:pt-14 pb-14">
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-center">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2 h-16 bg-emerald-600 rounded-full" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700 mb-2">EduFill Slot Booking</p>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-950">
                    Book Your <span className="text-emerald-700">Slot</span>
                  </h2>
                </div>
              </div>
              <p className="text-base md:text-lg text-slate-600 font-semibold leading-relaxed max-w-2xl">
                Fill your details and choose an available time slot for expert form-filling support.
              </p>
            </div>

            <div className="hidden lg:block relative h-52">
              <div className="absolute right-4 top-0 w-64 h-44 rounded-[2rem] bg-white/70 border border-white shadow-xl rotate-3" />
              <div className="absolute right-12 top-8 w-52 h-36 bg-white rounded-3xl border border-emerald-100 shadow-2xl p-5 -rotate-2">
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {Array.from({ length: 28 }).map((_, index) => (
                    <div key={index} className={`h-3 rounded-full ${index === 17 ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
                  <CheckCircle2 size={18} /> Slot Confirmed
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center shadow-lg">
                <CalendarCheck size={42} className="text-emerald-700" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 -mt-8 pb-14 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/70 p-5 md:p-8" noValidate>
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CalendarCheck size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-950">Slot Booking Form</h3>
                <p className="text-sm text-slate-500 font-semibold mt-1">All fields marked <span className="text-red-500">*</span> are required</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-[300px_1fr] gap-3 md:gap-6 items-start">
                <FormLabel icon={<FileText size={22} />} number="1" label="Which form do you want to fill?" required />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between bg-white border-2 rounded-xl px-4 py-3.5 font-bold text-left transition-all ${errors.formType ? 'border-red-300' : 'border-slate-200 focus:border-emerald-500 hover:border-emerald-400'}`}
                  >
                    <span className={form.formType ? 'text-slate-900' : 'text-slate-400'}>{form.formType || 'Select an exam'}</span>
                    <ChevronDown size={18} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-2xl p-2 max-h-64 overflow-y-auto">
                      {EXAM_OPTIONS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            updateField('formType', item);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-emerald-50 hover:text-emerald-700 ${form.formType === item ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                  <ErrorText text={errors.formType} />
                </div>
              </div>

              <div className="grid md:grid-cols-[300px_1fr] gap-3 md:gap-6 items-start">
                <FormLabel icon={<User size={22} />} number="2" label="Full Name (as per 10th marksheet)" required />
                <div>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    className={`InputStyle ${errors.fullName ? 'border-red-300' : 'border-slate-200'}`}
                  />
                  <ErrorText text={errors.fullName} />
                </div>
              </div>

              <div className="grid md:grid-cols-[300px_1fr] gap-3 md:gap-6 items-start">
                <FormLabel icon={<Phone size={22} />} number="3" label="Contact Number" required />
                <div>
                  <div className={`flex rounded-xl border-2 bg-white overflow-hidden focus-within:border-emerald-500 transition-all ${errors.phone ? 'border-red-300' : 'border-slate-200'}`}>
                    <div className="px-4 py-3.5 bg-slate-50 border-r border-slate-200 font-black text-slate-700 flex items-center gap-1">
                      +91 <ChevronDown size={14} />
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength="10"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="Enter your 10-digit mobile number"
                      className="w-full px-4 py-3.5 outline-none font-bold text-slate-800"
                    />
                  </div>
                  <ErrorText text={errors.phone} />
                </div>
              </div>

              <div className="grid md:grid-cols-[300px_1fr] gap-3 md:gap-6 items-start">
                <FormLabel icon={<Mail size={22} />} number="4" label="Email Address (Optional)" />
                <div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="Enter your email address"
                    className={`InputStyle ${errors.email ? 'border-red-300' : 'border-slate-200'}`}
                  />
                  <ErrorText text={errors.email} />
                </div>
              </div>

              <div className="grid md:grid-cols-[300px_1fr] gap-3 md:gap-6 items-start">
                <FormLabel icon={<CalendarDays size={22} />} number="5" label="Select Date" required />
                <div>
                  <input
                    type="date"
                    min={minDate}
                    value={form.selectedDate}
                    onChange={(e) => updateField('selectedDate', e.target.value)}
                    className={`InputStyle ${errors.selectedDate ? 'border-red-300' : 'border-slate-200'}`}
                  />
                  <ErrorText text={errors.selectedDate} />
                </div>
              </div>

              <div className="grid md:grid-cols-[300px_1fr] gap-3 md:gap-6 items-start">
                <FormLabel icon={<Clock size={22} />} number="6" label="Available Time Slots" required />
                <div>
                  {!form.selectedDate ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500">
                      Please select date first to view available slots.
                    </div>
                  ) : loadingSlots ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-2 text-sm font-bold text-slate-500">
                      <Loader2 size={18} className="animate-spin text-emerald-600" /> Loading available slots...
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.label}
                          type="button"
                          disabled={slot.booked}
                          onClick={() => updateField('selectedSlot', slot.label)}
                          className={`px-5 py-3 rounded-xl border-2 font-black text-sm transition-all ${
                            slot.booked
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                              : form.selectedSlot === slot.label
                                ? 'bg-emerald-700 border-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                                : 'bg-white border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <ErrorText text={errors.selectedSlot} />
                </div>
              </div>

              <div className="grid md:grid-cols-[300px_1fr] gap-3 md:gap-6 items-start">
                <FormLabel icon={<MessageIcon />} number="7" label="Any Note (Optional)" />
                <textarea
                  value={form.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  placeholder="Example: I need help with NEET form photo/signature requirements."
                  rows="3"
                  maxLength="500"
                  className="w-full bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-4 py-3.5 outline-none font-bold text-slate-800 transition-all resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white font-black py-4 rounded-xl shadow-xl shadow-emerald-600/20 transition-transform active:scale-[0.99] flex items-center justify-center gap-3 text-lg disabled:opacity-70"
            >
              {loading ? <Loader2 size={22} className="animate-spin" /> : <CalendarCheck size={24} />}
              {loading ? 'Booking Slot...' : 'Book Now'}
            </button>

            <p className="mt-5 text-center text-xs md:text-sm font-bold text-slate-500 flex items-center justify-center gap-2">
              <Lock size={15} /> Your information is secure and will never be shared.
            </p>
          </form>

          <aside className="space-y-5">
            <div className="bg-white/95 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/70 p-6 md:p-8">
              <div className="flex items-center gap-4 pb-5 border-b border-slate-200 mb-6">
                <div className="w-14 h-14 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-700/20">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-950">Why Book with EduFill?</h3>
              </div>

              <div className="space-y-6">
                <BenefitItem
                  icon={<Users size={24} />}
                  title="Expert Guidance"
                  desc="Get help from experienced form-filling experts who ensure accuracy."
                />
                <BenefitItem
                  icon={<Zap size={24} />}
                  title="Quick Slot Confirmation"
                  desc="Instant request confirmation so you can plan your time better."
                />
                <BenefitItem
                  icon={<Lock size={24} />}
                  title="Secure & Confidential"
                  desc="Your personal information is handled carefully and kept confidential."
                />
                <BenefitItem
                  icon={<FileText size={24} />}
                  title="Hassle-free Form Filling"
                  desc="We make the process simple, smooth and completely stress-free."
                />
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-lg p-5">
              <h4 className="text-center text-sm font-black text-slate-800 mb-4">Trusted by Thousands of Students</h4>
              <div className="grid grid-cols-3 divide-x divide-slate-200 text-center">
                <StatItem icon={<Users size={20} />} value="50K+" label="Students Helped" />
                <StatItem icon={<ShieldCheck size={20} />} value="98%" label="Satisfaction Rate" />
                <StatItem icon={<Star size={20} />} value="4.8/5" label="Average Rating" />
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-slate-900 text-white p-5 shadow-xl">
              <div className="flex items-start gap-3">
                <HelpCircle size={24} className="text-emerald-400 shrink-0 mt-1" />
                <div>
                  <h4 className="font-black text-lg">Need urgent help?</h4>
                  <p className="text-sm text-slate-300 font-semibold mt-1 leading-relaxed">Contact EduFill support for exam form filling, documents, photo/signature resize and slot support.</p>
                  <a href="https://wa.me/919752519051" target="_blank" rel="noreferrer" className="inline-flex mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-sm">WhatsApp Support</a>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-slate-500">
          <ShieldCheck size={20} className="text-emerald-600" /> EduFill is committed to transparency, accuracy & student success.
        </div>
      </main>

      {successData && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-7 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5 border border-emerald-100">
              <CheckCircle2 size={44} />
            </div>
            <h3 className="text-2xl font-black text-slate-950 mb-2">Slot Request Submitted!</h3>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed mb-6">
              Your booking request has been received. EduFill team will confirm your slot soon.
            </p>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left space-y-3 mb-6">
              <InfoRow label="Booking ID" value={successData.bookingId} />
              <InfoRow label="Form" value={successData.formType} />
              <InfoRow label="Date" value={successData.displayDate} />
              <InfoRow label="Time" value={successData.selectedSlot} />
              <InfoRow label="Status" value={successData.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSuccessData(null)}
                className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccessData(null);
                  handleTrackBooking();
                }}
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black"
              >
                Track
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .InputStyle {
          width: 100%;
          background: #ffffff;
          border-width: 2px;
          border-radius: 0.75rem;
          padding: 0.875rem 1rem;
          outline: none;
          font-weight: 700;
          color: #1e293b;
          transition: all 0.2s ease;
        }
        .InputStyle:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.10);
        }
      `}</style>
    </div>
  );
}

function FormLabel({ icon, number, label, required }) {
  return (
    <label className="flex items-center gap-3 text-slate-900 font-black text-sm md:text-base pt-1 md:pt-3">
      <span className="text-emerald-700 shrink-0">{icon}</span>
      <span>
        {number}. {label} {required && <span className="text-red-500">*</span>}
      </span>
    </label>
  );
}

function ErrorText({ text }) {
  if (!text) return null;
  return <p className="mt-2 text-xs font-black text-red-500">{text}</p>;
}

function BenefitItem({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
        {icon}
      </div>
      <div>
        <h4 className="font-black text-slate-900 mb-1">{title}</h4>
        <p className="text-sm font-semibold text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StatItem({ icon, value, label }) {
  return (
    <div className="px-2">
      <div className="text-emerald-700 flex justify-center mb-2">{icon}</div>
      <div className="text-emerald-700 font-black text-lg">{value}</div>
      <div className="text-[11px] font-bold text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-black text-slate-500">{label}</span>
      <span className="font-black text-slate-900 text-right">{value}</span>
    </div>
  );
}

function MessageIcon() {
  return <Sparkles size={22} />;
}

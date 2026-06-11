import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  PhoneOff,
  Play,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  CalendarDays,
  ChevronRight
} from 'lucide-react';

// API & Helpers
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '')
).replace(/\/$/, '');

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const getExamSlug = (exam = {}) => exam.slug || slugify(exam.seoTitle || exam.title || '') || exam._id;
const getExamDetailsPath = (exam = {}) => `/exam/${getExamSlug(exam)}`;

const getDaysLeft = (lastDate) => {
  if (!lastDate) return 0;
  const date = new Date(lastDate);
  if (Number.isNaN(date.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

export default function HeroSection() {
  const navigate = useNavigate();
  const [liveExams, setLiveExams] = useState([]);
  
  // Custom Scroll State & Refs
  const scrollContainerRef = useRef(null);
  const scrollPosRef = useRef(0); // Track exact float position
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/exams`);
        const examsArray = Array.isArray(response.data)
          ? response.data
          : response.data?.exams || response.data?.data || response.data?.results || [];
        
        // Filter active exams and sort by closing soon
        const active = examsArray.filter(exam => getDaysLeft(exam.lastDate) >= 0);
        active.sort((a, b) => getDaysLeft(a.lastDate) - getDaysLeft(b.lastDate));
        
        setLiveExams(active.slice(0, 10)); // Top 10 for scroll
      } catch (error) {
        console.error('Error fetching live exams:', error);
      }
    };
    fetchExams();
  }, []);

  // Smooth Auto-Scroll Logic with Manual Override Support
  useEffect(() => {
    if (liveExams.length === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    let animationFrameId;

    const autoScroll = () => {
      if (!isHovered) {
        // Speed of scroll (0.5 is a comfortable reading speed)
        scrollPosRef.current += 0.5;

        // Infinite loop: If we reach half the duplicated list height, reset silently
        if (scrollPosRef.current >= container.scrollHeight / 2) {
          scrollPosRef.current -= container.scrollHeight / 2;
        }

        // Apply precise float position to scrollTop
        container.scrollTop = scrollPosRef.current;
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [liveExams.length, isHovered]);

  // Sync our manual scrolling with the auto-scroll tracker
  const handleManualScroll = () => {
    if (isHovered && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      
      // Infinite manual loop logic (optional, but good for UX)
      if (container.scrollTop >= container.scrollHeight / 2) {
        container.scrollTop -= container.scrollHeight / 2;
      }

      // Sync the ref so when hover leaves, it starts exactly from where user left it
      scrollPosRef.current = container.scrollTop;
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-[#F3FAFF] to-[#EEF7FF] border-b border-blue-50">
      
      <style>
        {`
          /* Transparent Fade Mask */
          .fade-mask {
            mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
            -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
          }
        `}
      </style>

      {/* Background Blurs */}
      <div className="hidden sm:block absolute top-20 right-10 w-72 h-72 rounded-full bg-emerald-100/60 blur-3xl" />
      <div className="hidden sm:block absolute bottom-0 left-1/2 w-96 h-96 rounded-full bg-blue-100/70 blur-3xl" />

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 pt-8 pb-10 sm:py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">
        
        {/* LEFT COLUMN: Main Content */}
        <div className="text-center lg:text-left flex flex-col pt-2 lg:pt-6">
          <div className="inline-flex mx-auto lg:mx-0 items-center gap-2 bg-emerald-50 text-emerald-700 font-black text-[9px] sm:text-[10px] md:text-xs uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full mb-5 sm:mb-7 border border-emerald-100 w-max">
            <Sparkles size={13} className="text-amber-500" /> India's Most Trusted Form Filling Platform
          </div>

          <h1 className="text-[2.15rem] min-[380px]:text-[2.45rem] sm:text-5xl md:text-6xl lg:text-[4.35rem] font-black text-gray-950 leading-[1.06] tracking-tight mb-4 sm:mb-6">
            Skip the Cyber Cafe Queue. <br />
            <span className="text-emerald-600">Fill Forms Online</span> with <br className="hidden xl:block" />
            100% Safety & Privacy.
          </h1>

          <p className="text-gray-600 text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-6 sm:mb-8">
            Your details are safe. Your number is private. Our verified experts fill forms for you, while you relax.
          </p>

          <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2.5 sm:gap-3 max-w-2xl mx-auto lg:mx-0 mb-6 sm:mb-8">
            {[
              { title: 'No Number Sharing', desc: 'Experts can’t see your number', icon: <PhoneOff size={16} /> },
              { title: 'Secure Chat', desc: 'OTP inside app', icon: <ShieldCheck size={16} /> },
              { title: 'Expert Verify', desc: 'Zero mistake support', icon: <UserCheck size={16} /> },
            ].map((item) => (
              <div key={item.title} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 flex items-start gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-[11px] sm:text-xs font-black text-gray-900">{item.title}</h3>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 font-semibold leading-relaxed mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:flex sm:flex-row sm:justify-center lg:justify-start">
            <button
              onClick={() => navigate('/live-connect')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 sm:py-4 px-6 sm:px-8 rounded-full shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base transition-transform active:scale-95"
            >
              Hire Live Expert <ArrowRight size={18} />
            </button>
            <button
              onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white border border-gray-200 text-gray-900 font-black py-3.5 sm:py-4 px-6 sm:px-8 rounded-full shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 text-sm sm:text-base transition-transform active:scale-95"
            >
              How It Works <Play size={16} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Vertical Scroll (Top Right) + Form Expert Card (Bottom) */}
        <div className="relative mt-8 lg:mt-0 flex flex-col gap-8 lg:gap-10">
          
          {/* 🔥 NEW SMOOTH TICKER - WIDER AND MORE COMPACT */}
          {liveExams.length > 0 && (
            <div className="w-full max-w-[420px] mx-auto lg:ml-auto lg:mr-0 text-left relative z-20">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[10px] sm:text-xs font-black text-emerald-800 uppercase tracking-widest">
                  Active Exams (Apply Now)
                </span>
              </div>
              
              {/* Fade Mask Header */}
              <div className="fade-mask h-[160px] sm:h-[180px] relative overflow-hidden">
                {/* Scroll Container */}
                <div 
                  ref={scrollContainerRef}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onScroll={handleManualScroll}
                  className="h-full overflow-y-auto flex flex-col [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ scrollBehavior: 'auto' }}
                >
                  {/* Duplicate array for seamless infinite effect */}
                  {[...liveExams, ...liveExams].map((exam, i) => {
                    const daysLeft = getDaysLeft(exam.lastDate);
                    return (
                      <button
                        key={`${exam._id || i}-${i}`}
                        type="button"
                        onClick={() => navigate(getExamDetailsPath(exam))}
                        className="group flex flex-col justify-center py-2 sm:py-2.5 border-b border-gray-200/40 last:border-0 w-full text-left transition-all hover:bg-emerald-50/50 rounded-xl px-2 shrink-0 cursor-pointer"
                      >
                        <span className="text-xs sm:text-[13px] font-black text-gray-800 group-hover:text-emerald-700 transition-colors truncate w-full flex items-center justify-between">
                          {exam.title || 'Latest Job Update'}
                          <ChevronRight size={14} className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                        </span>
                        
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 flex items-center gap-1">
                            <CalendarDays size={11} /> {formatDate(exam.lastDate)}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-wider ${daysLeft <= 7 ? 'text-red-500' : 'text-orange-500'}`}>
                            {daysLeft} Days Left
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Form Expert Card (Below the Scroll) */}
          <div className="bg-white rounded-[1.75rem] sm:rounded-[2.25rem] p-4 sm:p-6 md:p-8 border border-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] max-w-xl mx-auto w-full">
            <div className="flex flex-col min-[500px]:flex-row min-[500px]:items-start justify-between gap-5 mb-4 sm:mb-7">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4 sm:mb-5">
                  <span className="bg-emerald-600 text-white text-xs sm:text-sm font-black px-3 sm:px-4 py-1.5 rounded-full">Live</span>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-950">Form Expert</h2>
                </div>

                <div className="space-y-3 sm:space-y-5">
                  {[
                    ['Submit Details', 'Fill details & upload docs'],
                    ['Expert Assigned', 'Verified expert assigned'],
                    ['Form Filling', 'Form filled in real-time'],
                    ['Confirmation', 'Get confirmation & docs'],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex gap-3">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={14} />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-gray-900">{title}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative flex-1 min-w-0 min-[500px]:min-w-[200px]">
                <div className="hidden sm:flex absolute -top-8 left-1/2 -translate-x-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-700 items-center justify-center">
                  <Shield size={28} />
                </div>

                <div className="sm:mt-10 bg-white rounded-3xl border border-gray-100 shadow-xl p-3 sm:p-4 max-w-[260px] mx-auto">
                  <div className="bg-emerald-600 text-white rounded-2xl p-3 mb-3 sm:mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-[11px] sm:text-xs">
                      <Lock size={13} /> Secure Chat
                    </div>
                    <CheckCircle2 size={15} />
                  </div>

                  <div className="space-y-2.5 sm:space-y-3">
                    <ChatBubble title="Expert" text="Please share the OTP" />
                    <div className="bg-emerald-600 text-white rounded-xl p-3 ml-auto w-max max-w-[160px]">
                      <p className="text-[10px] font-black">You In-App</p>
                      <p className="text-[10px] font-bold mt-0.5">123456</p>
                    </div>
                    <ChatBubble title="Expert" text="Form submitted successfully." />
                  </div>

                  <div className="absolute -bottom-2 -right-2 w-9 h-9 sm:w-10 sm:h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg">
                    <Check size={20} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-center text-[11px] sm:text-xs font-bold text-gray-500 lg:hidden">
              Secure expert support directly from your phone.
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function ChatBubble({ title, text }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
      <p className="text-[9px] sm:text-[10px] font-black text-gray-800">{title}</p>
      <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium mt-0.5">{text}</p>
    </div>
  );
}
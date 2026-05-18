import React from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-[#F3FAFF] to-[#EEF7FF] border-b border-blue-50">
      <div className="hidden sm:block absolute top-20 right-10 w-72 h-72 rounded-full bg-emerald-100/60 blur-3xl" />
      <div className="hidden sm:block absolute bottom-0 left-1/2 w-96 h-96 rounded-full bg-blue-100/70 blur-3xl" />

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 pt-8 pb-10 sm:py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-black text-[9px] sm:text-[10px] md:text-xs uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full mb-5 sm:mb-7 border border-emerald-100">
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 sm:py-4 px-6 sm:px-8 rounded-full shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              Hire Live Expert <ArrowRight size={18} />
            </button>
            <button
              onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white border border-gray-200 text-gray-900 font-black py-3.5 sm:py-4 px-6 sm:px-8 rounded-full shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 text-sm sm:text-base"
            >
              How It Works <Play size={16} fill="currentColor" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="bg-white rounded-[1.75rem] sm:rounded-[2.25rem] p-4 sm:p-6 md:p-8 border border-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] max-w-xl mx-auto">
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
          </div>

          <div className="mt-3 text-center text-[11px] sm:text-xs font-bold text-gray-500 lg:hidden">
            Secure expert support directly from your phone.
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

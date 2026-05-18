import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building, ChevronDown, MessageCircle, MessageSquare, Sparkles } from 'lucide-react';
import { faqs } from '../../data/homeData';

export default function FaqFeedbackCtaSection({ openFAQ, setOpenFAQ, onOpenFeedback }) {
  const navigate = useNavigate();

  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
      <div className="lg:col-span-4 bg-white rounded-[1.6rem] sm:rounded-[2rem] p-5 sm:p-6 border border-gray-100 shadow-sm">
        <h2 className="text-lg sm:text-xl font-black text-gray-950 mb-4 sm:mb-5">Frequently Asked Questions</h2>
        <div className="space-y-2.5 sm:space-y-3">
          {faqs.map((faq, index) => (
            <div key={faq.q} className="border border-gray-100 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFAQ(openFAQ === index ? -1 : index)}
                className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 text-left"
              >
                <span className="text-xs sm:text-sm font-black text-gray-800">{faq.q}</span>
                <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${openFAQ === index ? 'rotate-180' : ''}`} />
              </button>
              {openFAQ === index && (
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed px-3.5 sm:px-4 pb-4">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-3 bg-white rounded-[1.6rem] sm:rounded-[2rem] p-5 sm:p-6 border border-gray-100 shadow-sm relative overflow-hidden">
        <h2 className="text-lg sm:text-xl font-black text-gray-950 mb-3">Feedback & Suggestions</h2>
        <p className="text-xs sm:text-sm text-gray-500 font-medium mb-5 sm:mb-6">
          Report bugs, request new features or share your review.
        </p>

        <div className="space-y-2.5 sm:space-y-3 relative z-10">
          <button onClick={() => onOpenFeedback('bug')} className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 text-xs sm:text-sm font-black py-3 px-4 rounded-xl flex items-center gap-3">
            <MessageSquare size={16} /> Report a Bug
          </button>
          <button onClick={() => onOpenFeedback('feature')} className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 text-xs sm:text-sm font-black py-3 px-4 rounded-xl flex items-center gap-3">
            <Sparkles size={16} /> Suggest a Feature
          </button>
          <button onClick={() => onOpenFeedback('feedback')} className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 text-xs sm:text-sm font-black py-3 px-4 rounded-xl flex items-center gap-3">
            <MessageCircle size={16} /> Share Feedback
          </button>
        </div>
      </div>

      <div className="lg:col-span-5 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 rounded-[1.6rem] sm:rounded-[2rem] p-6 sm:p-7 md:p-8 text-white relative overflow-hidden shadow-xl flex items-center">
        <div className="absolute -right-20 -bottom-20 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 w-full">
          <h2 className="text-2xl md:text-3xl font-black mb-3">Ready to Skip the Queue?</h2>
          <p className="text-emerald-50 text-sm sm:text-base font-medium max-w-lg mb-6">
            Join EduFill and experience the fastest, safest and smartest way to fill your forms.
          </p>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/live-connect')}
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-black py-3 px-5 sm:px-7 rounded-full flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              Get Started Now <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/campus-drive')}
              className="bg-emerald-900/25 border border-white/20 text-white hover:bg-emerald-900/35 font-black py-3 px-5 sm:px-7 rounded-full flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              Request Camp <Building size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

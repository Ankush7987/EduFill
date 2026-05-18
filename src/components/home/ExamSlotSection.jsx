import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';

export default function ExamSlotSection({ exams, onOpenExamPage }) {
  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 sm:py-10">
      <div className="rounded-[1.6rem] sm:rounded-[2rem] bg-white border border-gray-100 shadow-sm p-4 sm:p-5 md:p-7">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-7">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-2">
              Camp Slot Booking
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-950 leading-tight">
              Book Your Slot by Exam or Institute
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-xl">
            Ye cards specially campus/camp students ke liye hain. Card click karte hi student direct us exam ke individual page par jayega.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
          {exams.map((exam) => (
            <article
              key={exam.id}
              onClick={() => onOpenExamPage(exam)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onOpenExamPage(exam);
              }}
              className="bg-gray-50 hover:bg-white rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl ${exam.lightBg} ${exam.textColor} flex items-center justify-center mb-3 sm:mb-5`}>
                {exam.icon}
              </div>
              <p className={`text-[8px] sm:text-[10px] uppercase tracking-widest font-black mb-1.5 sm:mb-2 ${exam.textColor}`}>
                {exam.tag}
              </p>
              <h3 className="text-sm sm:text-lg font-black text-gray-950 leading-tight mb-2 sm:mb-3">{exam.title}</h3>

              <p className="hidden sm:block text-xs text-gray-500 font-medium leading-relaxed mb-4 line-clamp-3">{exam.desc}</p>

              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-gray-500 mb-3">
                <MapPin size={12} className="text-emerald-500" />
                For camp / institute slot
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenExamPage(exam);
                }}
                className="text-emerald-600 font-black text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 hover:text-emerald-700"
              >
                Open {exam.title.split(' ')[0]} Page <ArrowRight size={14} />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { GraduationCap, CheckCircle2, ArrowRight } from 'lucide-react';

const Exams = ({ openBooking, liveExams }) => {
  const examList = [
    { name: 'NEET UG', desc: 'Medical entrance expert form filling. Avoid category and code mistakes.', color: 'from-rose-50 to-white', borderColor: 'group-hover:border-rose-200', iconColor: 'text-rose-500', isLive: liveExams?.neet },
    { name: 'JEE Main & Adv', desc: 'Engineering entrance forms handled with supreme technical precision.', color: 'from-blue-50 to-white', borderColor: 'group-hover:border-blue-200', iconColor: 'text-blue-600', isLive: liveExams?.jee },
    { name: 'CUET UG', desc: 'Central University forms with perfect subject and university mapping.', color: 'from-purple-50 to-white', borderColor: 'group-hover:border-purple-200', iconColor: 'text-purple-600', isLive: liveExams?.cuet }
  ];

  return (
    <section id="exams" className="py-24 bg-white px-4">
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Exams We Master</h2>
        <p className="text-lg md:text-xl text-gray-500 font-medium">Ek choti si galti aapka saal kharab kar sakti hai. Humare experts par bharosa karein.</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {examList.map((exam, i) => (
          <div key={i} className={`relative group bg-gradient-to-b ${exam.color} p-8 md:p-10 rounded-[2.5rem] shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 ${exam.borderColor} transition-all duration-300 transform hover:-translate-y-2 cursor-pointer flex flex-col`}>
            
            {exam.isLive && (
              <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-100 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest">Live Now</span>
              </div>
            )}

            <div className={`w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-8 ${exam.iconColor}`}>
              <GraduationCap size={32} />
            </div>
            
            <h3 className="text-3xl font-black mb-4 text-gray-900 tracking-tight">{exam.name}</h3>
            <p className="text-gray-500 mb-8 text-base font-medium leading-relaxed flex-1">{exam.desc}</p>
            
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-3 text-gray-800 font-bold text-sm bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><CheckCircle2 size={18} className={exam.iconColor}/> Document Resizing</div>
              <div className="flex items-center gap-3 text-gray-800 font-bold text-sm bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><CheckCircle2 size={18} className={exam.iconColor}/> Category Verification</div>
            </div>
            
            <button onClick={openBooking} className={`mt-auto w-full font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 bg-white border-2 border-transparent group-hover:border-gray-100 shadow-sm group-hover:shadow-md transition-all ${exam.iconColor}`}>
              Apply Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Exams;
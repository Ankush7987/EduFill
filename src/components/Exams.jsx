import React from 'react';
import { GraduationCap, CheckCircle, ArrowRight } from 'lucide-react';

const Exams = ({ openBooking, liveExams }) => {
  const examList = [
    { name: 'NEET 2026', desc: 'Medical entrance expert form filling. Avoid category mistakes.', color: 'from-red-50 to-white', borderColor: 'group-hover:border-red-400', iconColor: 'text-red-500', isLive: liveExams?.neet },
    { name: 'JEE Main & Adv', desc: 'Engineering entrance forms handled with technical precision.', color: 'from-blue-50 to-white', borderColor: 'group-hover:border-blue-400', iconColor: 'text-blue-500', isLive: liveExams?.jee },
    { name: 'CUET UG', desc: 'Central University forms with perfect subject mapping.', color: 'from-purple-50 to-white', borderColor: 'group-hover:border-purple-400', iconColor: 'text-purple-500', isLive: liveExams?.cuet }
  ];

  return (
    <section id="exams" className="py-24 bg-white px-4">
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">Exams We Master</h2>
        <p className="text-xl text-gray-500">Ek choti si galti aapka saal kharab kar sakti hai. Humare experts par bharosa karein.</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {examList.map((exam, i) => (
          <div key={i} className={`relative group bg-gradient-to-b ${exam.color} p-8 rounded-3xl shadow-sm hover:shadow-2xl border-2 border-transparent ${exam.borderColor} transition-all duration-300 transform hover:-translate-y-2 cursor-pointer`}>
            {exam.isLive && (
              <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1 rounded-full border border-red-200 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                <span className="text-xs font-black uppercase tracking-wider">Live Now</span>
              </div>
            )}

            <div className={`w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mb-6 ${exam.iconColor}`}>
              <GraduationCap size={36} />
            </div>
            <h3 className="text-3xl font-extrabold mb-4 text-gray-900">{exam.name}</h3>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">{exam.desc}</p>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-gray-700 font-medium"><CheckCircle size={20} className="text-emerald-500"/> Document Resizing</div>
              <div className="flex items-center gap-3 text-gray-700 font-medium"><CheckCircle size={20} className="text-emerald-500"/> Category Verification</div>
            </div>
            
            <button onClick={openBooking} className={`font-bold text-lg flex items-center gap-2 ${exam.iconColor} group-hover:gap-4 transition-all`}>
              Apply Now <ArrowRight size={20}/>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Exams;
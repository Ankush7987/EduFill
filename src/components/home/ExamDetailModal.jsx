import React from 'react';
import { ArrowRight, Calendar, CheckCircle2, Clock, ShieldCheck, X } from 'lucide-react';

export default function ExamDetailModal({
  selectedExamInfo,
  activeExams,
  onClose,
  onApply,
  onOpenCounselling,
}) {
  if (!selectedExamInfo) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-gray-100">
        <div className={`bg-gradient-to-r ${selectedExamInfo.color} p-6 md:p-8 text-white sticky top-0 z-10 rounded-t-[2rem]`}>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors"
            aria-label="Close exam details"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl">{selectedExamInfo.icon}</div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full mb-2 inline-block">
                {selectedExamInfo.tag}
              </span>
              <h2 className="text-2xl md:text-4xl font-black leading-tight tracking-tight">{selectedExamInfo.title}</h2>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-7 bg-white">
          {activeExams[selectedExamInfo.id] && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <p className="text-red-600 font-bold tracking-wide uppercase text-sm">
                Forms are live now! Secure your slot today.
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <InfoDateBox icon={<Calendar size={24} />} label="Start Date" value={selectedExamInfo.startDate || 'To be announced'} tone="emerald" />
            <InfoDateBox icon={<Clock size={24} />} label="Last Date" value={selectedExamInfo.lastDate || 'To be announced'} tone="red" />
          </div>

          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">About The Exam</h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">{selectedExamInfo.desc}</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Documents Required</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedExamInfo.requirements?.length ? (
                selectedExamInfo.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-800 font-bold bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <CheckCircle2 size={18} className={selectedExamInfo.textColor} />
                    <span>{req}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 font-semibold">Document list will be updated soon.</li>
              )}
            </ul>
          </div>

          <div className={`${selectedExamInfo.lightBg} ${selectedExamInfo.borderColor} p-6 rounded-2xl border`}>
            <h3 className={`text-xs font-black uppercase tracking-widest mb-2 ${selectedExamInfo.textColor} flex items-center gap-2`}>
              <ShieldCheck size={18} /> The EduFill Advantage
            </h3>
            <p className={`text-sm md:text-base font-bold ${selectedExamInfo.textColor}`}>
              {selectedExamInfo.edufillPromise || 'EduFill expert verifies your details and fills your form safely.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            <button
              onClick={onApply}
              className={`flex-1 bg-gradient-to-r ${selectedExamInfo.color} hover:opacity-90 text-white font-extrabold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-transform active:scale-95 text-base md:text-lg`}
            >
              Proceed to Apply <ArrowRight size={20} />
            </button>

            {selectedExamInfo.id === 'neet' && (
              <button
                onClick={onOpenCounselling}
                className="flex-1 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-extrabold py-4 rounded-xl flex justify-center items-center gap-2 transition-colors text-base md:text-lg"
              >
                View Counselling Plans
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoDateBox({ icon, label, value, tone }) {
  const color = tone === 'emerald'
    ? 'bg-emerald-100 text-emerald-600'
    : 'bg-red-100 text-red-600';

  return (
    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
      <div className={`${color} p-3 rounded-xl`}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className={`font-black text-sm md:text-base ${tone === 'red' ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      </div>
    </div>
  );
}

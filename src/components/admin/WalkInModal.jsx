import React from 'react';
// 🌟 BUG FIX: Yahan CheckCircle ko import list me add kar diya gaya hai! 🌟
import { X, UserPlus, Loader2, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

export default function WalkInModal({ 
  isOpen, onClose, walkInForm, handleWalkInChange, submitWalkIn, savingWalkIn, 
  approvedInstitutes, availableSlots, bookedSlotsInfo, instituteCapacity, isHolidayToday, todayStr 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 flex justify-between items-center text-white relative">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><UserPlus size={20}/> New Walk-in Student</h2>
            <p className="text-blue-100 text-xs mt-1">Assign an instant slot for today</p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6">
          {isHolidayToday ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-xl font-black text-red-600 mb-2">Center is Closed</h3>
              <p className="text-gray-500 font-medium text-sm">Today is a designated holiday. Walk-ins cannot be added.</p>
            </div>
          ) : (
            <form onSubmit={submitWalkIn} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Exam Target</label>
                  <select name="exam" required onChange={handleWalkInChange} value={walkInForm.exam} className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none">
                    <option value="">-- Select --</option><option value="NEET UG">NEET UG</option><option value="JEE Main/Adv">JEE Main / Adv</option><option value="CUET UG">CUET UG</option><option value="12th Admission">12th Govt. Admission</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Institute</label>
                  <select name="institute" required onChange={handleWalkInChange} value={walkInForm.institute} className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none">
                    <option value="">-- Select --</option><option value="Ribosome Institute">Ribosome Institute</option><option value="Unacademy">Unacademy</option>{approvedInstitutes.map((i, idx) => (<option key={idx} value={i}>{i}</option>))}<option value="Others">Others</option>
                  </select>
                </div>
              </div>

              <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Full Name</label><input type="text" name="fullName" required onChange={handleWalkInChange} value={walkInForm.fullName} className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none" placeholder="Student Name" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase">WhatsApp</label><input type="tel" name="mobile" required maxLength="10" onChange={handleWalkInChange} value={walkInForm.mobile} className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none" placeholder="10-digit no." /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Category</label><select name="category" required onChange={handleWalkInChange} value={walkInForm.category} className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none"><option value="">-- Select --</option><option value="OBC">OBC</option><option value="SC">SC</option><option value="ST">ST</option><option value="General (EWS)">General (EWS)</option><option value="General">General</option></select></div>
              </div>

              {walkInForm.institute !== 'Others' && (
                <div><label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Batch Name</label><input type="text" name="batchName" required onChange={handleWalkInChange} value={walkInForm.batchName} className="w-full border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-3 py-2 outline-none" placeholder="e.g., Dropper" /></div>
              )}

              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Date (Today)</label>
                    <input type="date" name="slotDate" required onChange={handleWalkInChange} value={todayStr} readOnly className="w-full border-2 border-white rounded-xl px-3 py-2 outline-none text-gray-500 bg-gray-100 font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Slot Time</label>
                    <select name="slotTime" required onChange={handleWalkInChange} value={walkInForm.slotTime} className="w-full border-2 border-white focus:border-indigo-500 rounded-xl px-3 py-2 outline-none bg-white font-bold text-indigo-700">
                      <option value="">-- Select Time --</option>
                      {availableSlots?.length > 0 ? (
                        availableSlots.map((time, i) => {
                          const isFull = (bookedSlotsInfo[time] || 0) >= instituteCapacity;
                          return (
                            <option key={i} value={time} disabled={isFull || instituteCapacity === 0} className={isFull ? "text-gray-400" : "text-green-700 font-bold"}>
                              {time} {isFull ? '(FULL)' : '✓'}
                            </option>
                          );
                        })
                      ) : (
                        <option value="" disabled>No slots left for today</option>
                      )}
                    </select>
                  </div>
                </div>
                {instituteCapacity === 0 && walkInForm.institute && (
                  <p className="mt-2 text-[10px] font-bold text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> No agents free.</p>
                )}
              </div>

              <div className="pt-2">
                <button type="submit" disabled={savingWalkIn || !availableSlots?.length || instituteCapacity === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                  {/* Yahi CheckCircle crash kar raha tha kyonki import missing tha! */}
                  {savingWalkIn ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
                  {savingWalkIn ? 'Adding...' : 'Confirm Walk-in Slot'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
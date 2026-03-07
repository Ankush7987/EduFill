import React from 'react';
import { PlusCircle, X } from 'lucide-react';

// NAYA PROP ADD KIYA: approvedInstitutes
const WalkInModal = ({ isOpen, onClose, walkInForm, handleWalkInChange, submitWalkIn, savingWalkIn, approvedInstitutes }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-blue-900 p-5 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold flex items-center gap-2"><PlusCircle size={20}/> Add Walk-in Student</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white bg-white/10 p-1.5 rounded-full transition-colors"><X size={20}/></button>
        </div>
        <form onSubmit={submitWalkIn} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600">Exam</label>
              <select name="exam" value={walkInForm.exam} required onChange={handleWalkInChange} className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-50">
                <option value="">Select</option><option value="NEET UG">NEET UG</option><option value="JEE Main/Adv">JEE Main/Adv</option><option value="CUET UG">CUET UG</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Institute</label>
              <select name="institute" value={walkInForm.institute} required onChange={handleWalkInChange} className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-50">
                <option value="">Select</option>
                <option value="Ribosome Institute">Ribosome</option>
                <option value="Unacademy">Unacademy</option>
                {/* Dynamic Options Here */}
                {approvedInstitutes && approvedInstitutes.map((inst, i) => (
                  <option key={i} value={inst}>{inst}</option>
                ))}
                <option value="Others">Others</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">Full Name</label>
            <input type="text" name="fullName" value={walkInForm.fullName} required onChange={handleWalkInChange} className="w-full border rounded-lg px-3 py-2 mt-1"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600">Mobile Number</label>
              <input type="tel" name="mobile" value={walkInForm.mobile} required maxLength="10" onChange={handleWalkInChange} className="w-full border rounded-lg px-3 py-2 mt-1"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Category</label>
              <select name="category" value={walkInForm.category} required onChange={handleWalkInChange} className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-50">
                <option value="">Select</option><option value="OBC">OBC</option><option value="SC">SC</option><option value="ST">ST</option><option value="General (EWS)">Gen (EWS)</option><option value="General">General</option>
              </select>
            </div>
          </div>
          {walkInForm.institute && walkInForm.institute !== 'Others' && (
            <div>
              <label className="text-xs font-bold text-gray-600">Batch Name</label>
              <input type="text" name="batchName" value={walkInForm.batchName} onChange={handleWalkInChange} className="w-full border rounded-lg px-3 py-2 mt-1"/>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600">Date</label>
              <input type="date" name="slotDate" value={walkInForm.slotDate} required onChange={handleWalkInChange} className="w-full border rounded-lg px-3 py-2 mt-1"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">Time</label>
              <input type="time" name="slotTime" value={walkInForm.slotTime} required onChange={handleWalkInChange} className="w-full border rounded-lg px-3 py-2 mt-1"/>
            </div>
          </div>
          <button type="submit" disabled={savingWalkIn} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl mt-4 transition-all shadow-md">
            {savingWalkIn ? 'Saving...' : 'Save Walk-in Booking'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WalkInModal;
import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase'; 
import { Loader2, Edit3, Save, CheckCircle, CalendarX, Clock, Calendar, ShieldCheck, Zap } from 'lucide-react';

const defaultContent = {
  'neet': { title: 'NEET UG 2026', startDate: 'To be announced', lastDate: 'To be announced', desc: 'National Eligibility cum Entrance Test (NEET) is the sole entrance exam for admission to MBBS, BDS, BAMS, BHMS, and other medical courses in India.', requirements: ['Passport Size Photo', 'Signature'], edufillPromise: 'Zero rejection rate.' },
  'jee': { title: 'JEE Main 2026', startDate: 'To be announced', lastDate: 'To be announced', desc: 'Joint Entrance Examination (Main).', requirements: ['Passport Size Photo', 'Signature'], edufillPromise: 'Flawless registration.' },
  'cuet': { title: 'CUET UG 2026', startDate: 'To be announced', lastDate: 'To be announced', desc: 'Common University Entrance Test (CUET).', requirements: ['Passport Size Photo'], edufillPromise: 'Perfect subject mapping.' },
  'govt-college': { title: 'Govt. College Admission', startDate: 'To be announced', lastDate: 'To be announced', desc: 'Apply for graduation courses.', requirements: ['10th and 12th Marksheets'], edufillPromise: 'No long queues.' }
};

// 🌟 MASTER TIME SLOTS 🌟
const MASTER_TIME_SLOTS = [
  "12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM", "02:00 AM", "02:30 AM", "03:00 AM", "03:30 AM",
  "04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM", "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM",
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
];

export default function SettingsTab() {
  const [liveExams, setLiveExams] = useState(null); 
  const [examContent, setExamContent] = useState(null);
  
  const [bookingSettings, setBookingSettings] = useState({ startTime: "10:00 AM", endTime: "06:00 PM", holidays: [] });
  const [newHoliday, setNewHoliday] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingExam, setEditingExam] = useState(null); 
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const controlsRef = doc(db, "PlatformSettings", "examControls");
    const contentRef = doc(db, "PlatformSettings", "examContent");
    const bookingRef = doc(db, "PlatformSettings", "bookingControls"); 
    
    const unsubControls = onSnapshot(controlsRef, (docSnap) => {
      if (docSnap.exists()) setLiveExams(docSnap.data());
      else setDoc(controlsRef, { neet: true, jee: true, cuet: true, 'govt-college': true });
    });

    const unsubContent = onSnapshot(contentRef, (docSnap) => {
      if (docSnap.exists()) { setExamContent(docSnap.data()); } 
      else { setDoc(contentRef, defaultContent).then(() => setExamContent(defaultContent)); }
    });

    const unsubBooking = onSnapshot(bookingRef, (docSnap) => {
      if (docSnap.exists()) { setBookingSettings(docSnap.data()); setLoading(false); } 
      else { 
        const defaultBooking = { startTime: "10:00 AM", endTime: "06:00 PM", holidays: [] };
        setDoc(bookingRef, defaultBooking).then(() => { setBookingSettings(defaultBooking); setLoading(false); }); 
      }
    });

    return () => { unsubControls(); unsubContent(); unsubBooking(); };
  }, []);

  const toggleExam = async (examKey) => {
    try { await updateDoc(doc(db, "PlatformSettings", "examControls"), { [examKey]: !liveExams[examKey] });
    } catch (error) { alert("Failed to update setting!"); }
  };

  const startEditing = (examKey) => {
    setEditingExam(examKey);
    setEditForm({
      ...examContent[examKey],
      startDate: examContent[examKey].startDate || '',
      lastDate: examContent[examKey].lastDate || '',
      requirements: examContent[examKey].requirements ? examContent[examKey].requirements.join('\n') : ''
    });
  };

  const handleSaveContent = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const updatedData = { ...editForm, requirements: editForm.requirements.split('\n').filter(item => item.trim() !== '') };
      await updateDoc(doc(db, "PlatformSettings", "examContent"), { [editingExam]: updatedData });
      setEditingExam(null); 
    } catch (error) { alert("Error saving content"); } finally { setSaving(false); }
  };

  const handleTimeChange = async (type, value) => {
    try { await updateDoc(doc(db, "PlatformSettings", "bookingControls"), { [type]: value }); } 
    catch (error) { alert("Failed to update time."); }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday || bookingSettings.holidays.includes(newHoliday)) return;
    try {
      const updatedHolidays = [...bookingSettings.holidays, newHoliday];
      await updateDoc(doc(db, "PlatformSettings", "bookingControls"), { holidays: updatedHolidays });
      setNewHoliday("");
    } catch (error) { alert("Failed to add holiday."); }
  };

  const handleRemoveHoliday = async (dateToRemove) => {
    try {
      const updatedHolidays = bookingSettings.holidays.filter(date => date !== dateToRemove);
      await updateDoc(doc(db, "PlatformSettings", "bookingControls"), { holidays: updatedHolidays });
    } catch (error) { alert("Failed to remove holiday."); }
  };

  if (loading) return <div className="flex items-center justify-center p-10"><Loader2 className="animate-spin text-emerald-500 w-10 h-10" /></div>;

  const examsList = ['neet', 'jee', 'cuet', 'govt-college'];

  return (
    <div className="animate-in fade-in duration-500 pb-10 space-y-8 max-w-5xl">
      
      {/* HEADER */}
      <header className="mb-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Platform Settings</h1>
        <p className="text-gray-500 text-sm mt-1.5 font-medium">Control UI configurations, global booking limits, and dynamic text content.</p>
      </header>

      {/* 🌟 1. BOOKING TIMINGS & HOLIDAYS CARD */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Clock className="text-indigo-500" size={20}/> Booking Windows & Holidays</h2>
        </div>
        
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shift Timing */}
          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Shift Hours</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start Time</label>
                <select value={bookingSettings.startTime} onChange={(e) => handleTimeChange('startTime', e.target.value)} className="w-full bg-transparent font-bold text-gray-800 outline-none text-sm cursor-pointer">
                  {MASTER_TIME_SLOTS.map(time => <option key={time} value={time}>{time}</option>)}
                </select>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">End Time</label>
                <select value={bookingSettings.endTime} onChange={(e) => handleTimeChange('endTime', e.target.value)} className="w-full bg-transparent font-bold text-gray-800 outline-none text-sm cursor-pointer">
                  {MASTER_TIME_SLOTS.map(time => <option key={time} value={time}>{time}</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500">Students can only book slots between these hours. Ex: 10:00 AM to 06:00 PM.</p>
          </div>

          {/* Holiday Blockers */}
          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><CalendarX size={16} className="text-red-400"/> Blocked Dates</p>
            <div className="flex gap-2">
              <input type="date" value={newHoliday} onChange={(e) => setNewHoliday(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-red-400 transition-colors" />
              <button onClick={handleAddHoliday} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 font-bold px-6 rounded-xl transition-all shadow-sm active:scale-95 text-sm">Add</button>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2 min-h-[32px] max-h-32 overflow-y-auto custom-scrollbar">
              {bookingSettings.holidays.length > 0 ? (
                bookingSettings.holidays.map(date => (
                  <span key={date} className="bg-white border border-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                    {new Date(date).toLocaleDateString('en-GB')} 
                    <button onClick={() => handleRemoveHoliday(date)} className="hover:bg-red-100 hover:text-red-800 rounded-full p-0.5 transition-colors"><X size={14}/></button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-400 font-medium italic mt-1">System is fully operational everyday.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 2. EXAM TOGGLES CARD */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Zap className="text-amber-500" size={20}/> Homepage Form Toggles</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Turn ON/OFF</p>
        </div>
        
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {examsList.map((examKey) => (
            <div key={examKey} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${liveExams?.[examKey] ? 'bg-emerald-50/30 border-emerald-100' : 'bg-gray-50/50 border-gray-200'}`}>
              <p className={`font-bold text-sm uppercase tracking-wide ${liveExams?.[examKey] ? 'text-emerald-800' : 'text-gray-500'}`}>
                {examKey === 'govt-college' ? 'Govt College' : examKey}
              </p>
              <button onClick={() => toggleExam(examKey)} className={`relative inline-flex h-7 w-12 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none ${liveExams?.[examKey] ? 'bg-emerald-500 shadow-emerald-200 shadow-md' : 'bg-gray-300'}`}>
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform duration-300 ease-in-out ${liveExams?.[examKey] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 🌟 3. CONTENT MANAGER (CMS) CARD */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Edit3 className="text-blue-500" size={20}/> Content Manager (CMS)</h2>
        </div>
        
        <div className="p-6 space-y-4">
          {examsList.map((examKey) => {
            const isEditing = editingExam === examKey;
            
            return (
              <div key={examKey} className={`border rounded-2xl overflow-hidden transition-colors ${isEditing ? 'border-blue-300 shadow-md bg-blue-50/10' : 'border-gray-200 hover:border-blue-200'}`}>
                
                {/* Header Row */}
                <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${isEditing ? 'bg-blue-50/50' : 'bg-white'}`} onClick={() => !isEditing && startEditing(examKey)}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-sm ${isEditing ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {examKey.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{examContent[examKey]?.title || "Loading..."}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">{examKey}</span>
                        <span className="text-xs font-medium text-gray-400 truncate max-w-[200px] md:max-w-md">{examContent[examKey]?.desc}</span>
                      </div>
                    </div>
                  </div>
                  
                  {!isEditing ? (
                    <button onClick={(e) => { e.stopPropagation(); startEditing(examKey); }} className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-700 font-bold text-sm rounded-xl border border-gray-200 transition-colors shrink-0">
                      <Edit3 size={16}/> Edit Details
                    </button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); setEditingExam(null); }} className="px-4 py-2 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl transition-colors shrink-0">
                      Cancel
                    </button>
                  )}
                </div>

                {/* Edit Form Body */}
                {isEditing && (
                  <form onSubmit={handleSaveContent} className="p-6 bg-white border-t border-blue-100 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Main Header / Title</label>
                      <input type="text" required value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 font-black text-gray-900 text-lg outline-none transition-colors shadow-sm" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1"><Calendar size={14}/> Start Date Display</label>
                        <input type="text" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} placeholder="e.g. 05 March 2026" className="w-full border-2 border-white focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 outline-none shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-red-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1"><Clock size={14}/> Last Date Display</label>
                        <input type="text" value={editForm.lastDate} onChange={e => setEditForm({...editForm, lastDate: e.target.value})} placeholder="e.g. 04 April 2026" className="w-full border-2 border-red-100 focus:border-red-400 bg-red-50 rounded-xl px-4 py-2.5 text-sm font-bold text-red-700 outline-none shadow-sm" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Short Description</label>
                      <textarea required rows="2" value={editForm.desc} onChange={e => setEditForm({...editForm, desc: e.target.value})} className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 outline-none transition-colors resize-none" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1 flex justify-between">
                          <span>Required Documents</span> <span className="text-[10px] text-gray-400 normal-case">(One item per line)</span>
                        </label>
                        <textarea required rows="6" value={editForm.requirements} onChange={e => setEditForm({...editForm, requirements: e.target.value})} className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 outline-none whitespace-pre-wrap leading-relaxed custom-scrollbar transition-colors resize-none bg-gray-50" placeholder="10th Marksheet&#10;Aadhar Card..." />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-500"/> EduFills Advantage</label>
                        <textarea required rows="6" value={editForm.edufillPromise} onChange={e => setEditForm({...editForm, edufillPromise: e.target.value})} className="w-full border-2 border-gray-200 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 outline-none leading-relaxed custom-scrollbar transition-colors resize-none bg-emerald-50/30" />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                      <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2">
                        {saving ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18}/>} 
                        {saving ? 'Saving Changes...' : 'Save All Changes'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>
      
    </div>
  );
}
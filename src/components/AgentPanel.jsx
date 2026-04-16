import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs, getDoc, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserCircle, Lock, Loader2, LogOut, CheckCircle, Clock, FileText, MessageCircle, X, Check, Camera, Printer, IndianRupee, Upload, PlusCircle, Bell, UserCheck, UserX, ShieldCheck, Power, Coffee, Crop as CropIcon } from 'lucide-react';
import PaymentModal from './admin/PaymentModal';
import WalkInModal from './admin/WalkInModal';
import DocumentUploader from '../components/DocumentUploader';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// ==========================================
// 🌟 CONSTANTS & UTILITIES
// ==========================================
const MASTER_TIME_SLOTS = [
  "12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM", "02:00 AM", "02:30 AM", "03:00 AM", "03:30 AM",
  "04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM", "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM",
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
];

const getDownloadUrl = (url) => { 
  if (!url) return ''; 
  if (url.includes('res.cloudinary.com')) return `${url.split('/upload/')[0]}/upload/fl_attachment/${url.split('/upload/')[1]}`; 
  return url; 
};


// ==========================================
// 🧩 SUB-COMPONENTS (UI Only)
// ==========================================

const AgentLogin = ({ agentName, setAgentName, pin, setPin, handleLogin, loggingIn, error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-indigo-600 p-8 text-center text-white">
        <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg border-b-4 border-emerald-700 mx-auto mb-5">
          <span className="font-black text-white text-3xl tracking-tighter drop-shadow-md">EF</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-sm"></div>
        </div>
        <h2 className="text-2xl font-extrabold">Agent Portal</h2>
        <p className="text-indigo-200 text-sm mt-1">Queue & Form Management</p>
      </div>
      <form onSubmit={handleLogin} className="p-8 space-y-5">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center">{error}</div>}
        <div><label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><UserCircle size={16}/> Agent Full Name</label><input type="text" required value={agentName} onChange={(e) => setAgentName(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3" /></div>
        <div><label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Lock size={16}/> 4-Digit PIN</label><input type="password" required maxLength="4" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 tracking-widest text-center text-lg" placeholder="••••" /></div>
        <button disabled={loggingIn} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg flex justify-center items-center gap-2">{loggingIn ? <Loader2 size={20} className="animate-spin"/> : 'Access Dashboard'}</button>
      </form>
    </div>
  </div>
);

const AgentHeader = ({ agentData, toggleBreakStatus, setIsWalkInModalOpen, handleLogout }) => (
  <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-30">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <div><h1 className="text-xl md:text-2xl font-extrabold">Welcome, {agentData.name.split(' ')[0]}!</h1><p className="text-xs md:text-sm text-indigo-200">Queue: {agentData.institute}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={toggleBreakStatus} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold shadow-md transition-all ${!agentData.onBreak ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
          {!agentData.onBreak ? <Coffee size={16} /> : <CheckCircle size={16}/>}
          <span className="hidden md:inline">{!agentData.onBreak ? 'Take Break' : 'Resume Work'}</span>
        </button>
        <button onClick={() => setIsWalkInModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-lg flex items-center gap-1 text-sm font-bold shadow-md transition-all"><PlusCircle size={16} /> <span className="hidden md:inline">Walk-in</span></button>
        <button onClick={handleLogout} className="bg-indigo-800 hover:bg-gray-900 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors"><LogOut size={16} /></button>
      </div>
    </div>
    {agentData.onBreak && (
      <div className="bg-amber-500 text-white text-xs font-bold text-center py-1 mt-3 rounded-md animate-pulse">
        ☕ You are on Break! Timer is running in Admin Panel. Bookings are paused.
      </div>
    )}
  </header>
);

const AgentStats = ({ assignedStudents, pendingCount, completedCount, totalCollection }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"><p className="text-xs text-gray-500 font-bold uppercase">Queue Size</p><p className="text-2xl font-black text-indigo-600">{assignedStudents.length}</p></div>
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"><p className="text-xs text-gray-500 font-bold uppercase">To Be Done</p><p className="text-2xl font-black text-amber-500">{pendingCount}</p></div>
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"><p className="text-xs text-gray-500 font-bold uppercase">Forms Done</p><p className="text-2xl font-black text-emerald-500">{completedCount}</p></div>
    <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-200 bg-indigo-50"><p className="text-xs text-indigo-700 font-bold uppercase flex items-center gap-1"><IndianRupee size={12}/> Collection</p><p className="text-2xl font-black text-indigo-900">₹{totalCollection}</p></div>
  </div>
);

const QueueTable = ({ loading, assignedStudents, openPaymentModal, togglePhotoDeliveryStatus, toggleConfirmationStatus, setSelectedStudent, setDocsModalOpen, setUploadTarget, setIsUploadModalOpen, sendReminder, markAsArrived, markAsAbsent, markAsCompleted }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-4 border-b border-gray-100 bg-gray-50"><h2 className="font-bold text-gray-800">Live Student Queue</h2></div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
            <th className="p-4 font-semibold">Student Info</th>
            <th className="p-4 font-semibold">Exam & Time</th>
            <th className="p-4 font-semibold">Status Tracker</th>
            <th className="p-4 font-semibold text-right">Queue Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? <tr><td colSpan="4" className="p-8 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2"/> Reading Queue...</td></tr> : assignedStudents.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-medium">Queue is empty! ☕</td></tr> : (
            assignedStudents.map((student) => (
              <tr key={student.id} className={`transition-colors ${student.status === 'Absent' ? 'bg-red-50/30 opacity-70' : student.status === 'Arrived' ? 'bg-cyan-50/40' : 'hover:bg-gray-50'}`}>
                <td className="p-4 align-top">
                  <p className="font-bold text-gray-900 text-base">{student.fullName}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1"><MessageCircle size={12}/> {student.mobile}</p>
                  <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded mt-1 inline-block font-bold">{student.category}</span>
                </td>
                <td className="p-4 align-top">
                  <p className="font-bold text-indigo-700">{student.exam}</p>
                  <div className="text-sm mt-1">
                    <p className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 w-fit px-2 py-0.5 rounded"><Clock size={12}/> Slot: {student.slotTime}</p>
                    {student.reportingTime && <p className="text-xs mt-1 text-gray-500 font-bold">Reported by: {student.reportingTime}</p>}
                  </div>
                </td>
                <td className="p-4 align-top">
                  <div className="flex gap-2 items-center mb-2 flex-wrap">
                    <span className={`px-2 py-1 rounded text-[10px] md:text-[11px] font-bold ${student.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : student.status === 'Arrived' ? 'bg-cyan-100 text-cyan-700' : student.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {student.status || 'Pending'}
                    </span>
                    {student.paymentStatus === 'Paid' ? (
                      <button onClick={() => openPaymentModal(student)} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200"><CheckCircle size={10}/> ₹{student.paymentAmount}</button>
                    ) : (
                      <button onClick={() => openPaymentModal(student)} className="px-2 py-1 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">Payment Due</button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    <button onClick={() => togglePhotoDeliveryStatus(student.id, student.collectionName, student.photoDelivered)} className={`flex w-fit items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border ${student.photoDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600'}`}><Camera size={12}/> {student.photoDelivered ? 'Photos ✅' : 'Give Photos'}</button>
                    <button onClick={() => toggleConfirmationStatus(student.id, student.collectionName, student.confirmationDelivered)} className={`flex w-fit items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border ${student.confirmationDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600'}`}><Printer size={12}/> {student.confirmationDelivered ? 'Confirm ✅' : 'Give Confirm'}</button>
                  </div>
                  {student.applicationNumber && student.applicationNumber !== 'N/A' && <p className="text-[10px] font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded inline-block mt-2">App No: {student.applicationNumber}</p>}
                </td>
                <td className="p-4 align-top text-right">
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      {student.documents ? <button onClick={() => { setSelectedStudent(student); setDocsModalOpen(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold"><FileText size={14}/> Docs</button> : <button onClick={() => { setUploadTarget(student); setIsUploadModalOpen(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold"><Upload size={14}/> Upload</button>}
                      {student.status === 'Pending' && <button onClick={() => sendReminder(student.mobile, student.fullName, student.reportingTime)} className="flex items-center gap-1 px-3 py-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-lg text-xs font-bold transition-colors"><Bell size={14}/> Remind</button>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {student.status === 'Pending' && <button onClick={() => markAsArrived(student.id, student.collectionName)} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-600 hover:text-white border border-cyan-200 rounded-lg text-xs font-bold transition-all"><UserCheck size={14}/> Arrived</button>}
                      {student.status === 'Pending' && <button onClick={() => markAsAbsent(student.id, student.collectionName)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 rounded-lg text-xs font-bold transition-all" title="Marks absent and opens slot for others"><UserX size={14}/> Skip/Absent</button>}
                      {(student.status === 'Pending' || student.status === 'Arrived') && <button onClick={() => markAsCompleted(student.id, student.collectionName)} className="flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md"><Check size={14}/> Mark Done</button>}
                    </div>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);


// ==========================================
// 🚀 MAIN AGENT PANEL CONTROLLER
// ==========================================

export default function AgentPanel() {
  const [isInitializing, setIsInitializing] = useState(true); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [agentData, setAgentData] = useState(null);

  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals State
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ id: '', colName: '', amount: '', method: 'Online' });
  const [savingPayment, setSavingPayment] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  
  // Crop & Replace State
  const [replaceCropModalOpen, setReplaceCropModalOpen] = useState(false);
  const [replaceImgSrc, setReplaceImgSrc] = useState('');
  const [replaceDocKey, setReplaceDocKey] = useState('');
  const [replaceRawFile, setReplaceRawFile] = useState(null);
  const [replaceCrop, setReplaceCrop] = useState();
  const [replaceCompletedCrop, setReplaceCompletedCrop] = useState(null);
  const [replacingDoc, setReplacingDoc] = useState(null); 
  const replaceImgRef = useRef(null);

  // Time & Walkin State
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const todayStr = new Date(now.getTime() - (offset*60*1000)).toISOString().split('T')[0];

  const [walkInForm, setWalkInForm] = useState({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: todayStr, slotTime: '' });
  const [savingWalkIn, setSavingWalkIn] = useState(false);
  const [approvedInstitutes, setApprovedInstitutes] = useState([]);
  const [bookingSettings, setBookingSettings] = useState({ startTime: "10:00 AM", endTime: "06:00 PM", holidays: [] });
  const [bookedSlotsInfo, setBookedSlotsInfo] = useState({});
  const [instituteCapacity, setInstituteCapacity] = useState(0);

  // ================= FIREBASE SYNC =================
  useEffect(() => {
    const verifyStoredSession = async () => {
      const storedAgentId = localStorage.getItem('edufill_agent_session');
      if (storedAgentId) {
        try {
          const docRef = doc(db, "Employees", storedAgentId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) { setAgentData({ id: docSnap.id, ...docSnap.data() }); setIsAuthenticated(true); } 
          else { localStorage.removeItem('edufill_agent_session'); }
        } catch (err) { console.error("Auto-login failed:", err); }
      }
      setIsInitializing(false); 
    };
    verifyStoredSession();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !agentData) return;
    
    const collectionsToFetch = ['Ribosome_Students', 'Unacademy_Students', 'Other_Students'];
    const unsubBookings = [];
    collectionsToFetch.forEach(colName => {
      const q = query(collection(db, colName), where("assignedTo", "==", agentData.name));
      const unsub = onSnapshot(q, (snapshot) => {
        const docs = []; snapshot.forEach(doc => docs.push({ id: doc.id, collectionName: colName, ...doc.data() }));
        setAssignedStudents(prev => {
          const others = prev.filter(p => p.collectionName !== colName);
          return [...others, ...docs].sort((a, b) => (b.timestamp?.toMillis() || Date.now()) - (a.timestamp?.toMillis() || Date.now()));
        });
        setLoading(false);
      });
      unsubBookings.push(unsub);
    });

    const qCamps = query(collection(db, "Camp_Requests"), where("status", "==", "Completed"));
    const unsubCamps = onSnapshot(qCamps, (snapshot) => {
      const instList = []; snapshot.forEach(doc => { if(doc.data().instituteName) instList.push(doc.data().instituteName); });
      setApprovedInstitutes([...new Set(instList)].filter(name => name !== 'Ribosome Institute' && name !== 'Unacademy'));
    });

    const bookingRef = doc(db, "PlatformSettings", "bookingControls");
    const unsubBooking = onSnapshot(bookingRef, (docSnap) => { if (docSnap.exists()) setBookingSettings(docSnap.data()); });

    return () => { unsubBookings.forEach(unsub => unsub()); unsubCamps(); unsubBooking(); };
  }, [isAuthenticated, agentData]);

  useEffect(() => {
    if(!walkInForm.institute) return;
    let colName = walkInForm.institute === "Ribosome Institute" ? "Ribosome_Students" : walkInForm.institute === "Unacademy" ? "Unacademy_Students" : "Other_Students";
    
    const checkCapacity = async () => {
      const qAgents = query(collection(db, "Employees"), where("institute", "==", walkInForm.institute), where("active", "==", true));
      const agentSnap = await getDocs(qAgents);
      let activeAgents = 0;
      agentSnap.forEach(docSnap => { 
        const data = docSnap.data();
        const isOnLeave = data.leaves && data.leaves.includes(todayStr);
        if (data.onBreak !== true && !isOnLeave) activeAgents++; 
      });
      setInstituteCapacity(activeAgents);
    };
    checkCapacity();

    const qBookings = query(collection(db, colName), where("slotDate", "==", todayStr));
    const unsub = onSnapshot(qBookings, (snapshot) => {
      const slotCounts = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status === 'Pending' || data.status === 'In Progress' || data.status === 'Assigned') {
          slotCounts[data.slotTime] = (slotCounts[data.slotTime] || 0) + 1;
        }
      });
      setBookedSlotsInfo(slotCounts);
    });

    return () => unsub();
  }, [walkInForm.institute, todayStr]);

  // ================= HANDLERS =================
  const handleLogin = async (e) => {
    e.preventDefault(); setLoggingIn(true); setError('');
    try {
      const q = query(collection(db, "Employees"), where("pin", "==", pin));
      const snap = await getDocs(q); let found = false;
      snap.forEach(document => { 
        const data = document.data(); 
        if (data.name.trim().toLowerCase() === agentName.trim().toLowerCase()) { 
          setAgentData({ id: document.id, ...data }); setIsAuthenticated(true); found = true; 
          localStorage.setItem('edufill_agent_session', document.id);
        } 
      });
      if (!found) setError("Invalid Name or PIN.");
    } catch (err) { setError("Check internet."); } finally { setLoggingIn(false); }
  };

  const handleLogout = () => {
    setIsAuthenticated(false); setAgentData(null); setPin(''); localStorage.removeItem('edufill_agent_session');
  };

  const toggleBreakStatus = async () => {
    try {
      const isCurrentlyOnBreak = agentData.onBreak || false;
      const newBreakStatus = !isCurrentlyOnBreak;
      let updates = { onBreak: newBreakStatus };

      if (newBreakStatus) { updates.lastBreakStart = Date.now(); } 
      else {
        if (agentData.lastBreakStart) {
          const startMs = agentData.lastBreakStart;
          const breakDurationMins = Math.floor((Date.now() - startMs) / 60000);
          updates.breakMinutesToday = (agentData.breakMinutesToday || 0) + breakDurationMins;
          updates.lastBreakStart = null;
        }
      }
      await updateDoc(doc(db, "Employees", agentData.id), updates);
      setAgentData(prev => ({ ...prev, ...updates }));
    } catch (err) { alert("Failed to update break status."); }
  };

  const handleWalkInChange = (e) => {
    if (e.target.name === 'slotDate' && bookingSettings.holidays?.includes(e.target.value)) {
      alert("Center is closed today (Holiday)."); setWalkInForm({ ...walkInForm, slotDate: '' }); return;
    }
    setWalkInForm({ ...walkInForm, [e.target.name]: e.target.value });
  };
  
  const submitWalkIn = async (e) => {
    e.preventDefault(); setSavingWalkIn(true);
    try {
      if(instituteCapacity === 0) { alert("No agents available. Cannot add walk-in."); setSavingWalkIn(false); return; }
      let col = walkInForm.institute === "Ribosome Institute" ? "Ribosome_Students" : walkInForm.institute === "Unacademy" ? "Unacademy_Students" : "Other_Students";
      const newDocRef = await addDoc(collection(db, col), { 
        ...walkInForm, tokenNumber: "EDU-" + Math.floor(100000 + Math.random() * 900000), status: 'Arrived', paymentStatus: 'Due', photoDelivered: false, confirmationDelivered: false, assignedTo: agentData.name, timestamp: serverTimestamp() 
      });
      await updateDoc(doc(db, "Employees", agentData.id), { assignedCount: (agentData.assignedCount || 0) + 1 });
      setIsWalkInModalOpen(false); setWalkInForm({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: todayStr, slotTime: '' });
      if(window.confirm("Do you want to upload their documents now?")) { 
        setUploadTarget({id: newDocRef.id, collectionName: col, fullName: walkInForm.fullName, category: walkInForm.category}); setTimeout(() => setIsUploadModalOpen(true), 300); 
      }
    } catch (err) { alert("Failed to add Walk-in."); } finally { setSavingWalkIn(false); }
  };

  // Replace Docs Logistics
  const handleReplaceFileChange = (e, docKey) => {
    const file = e.target.files[0]; if (!file) return;
    setReplaceRawFile(file); setReplaceDocKey(docKey); const reader = new FileReader();
    reader.addEventListener('load', () => { setReplaceImgSrc(reader.result); setReplaceCompletedCrop(null); setReplaceCropModalOpen(true); });
    reader.readAsDataURL(file);
  };
  const onReplaceImageLoad = (e) => { const { width, height } = e.currentTarget; let aspect = replaceDocKey === 'profilePicUrl' ? 413/446 : replaceDocKey === 'signatureUrl' ? 3/1 : undefined; setReplaceCrop(aspect ? centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height) : { unit: '%', width: 100, height: 100, x: 0, y: 0 }); };
  const handleReplaceCropSave = async () => { setReplaceCropModalOpen(false); processAndUploadReplace(replaceRawFile, replaceDocKey); };
  const processAndUploadReplace = async (fileBlob, docKey) => {
    setReplacingDoc(docKey); 
    try {
      const formData = new FormData(); formData.append("file", fileBlob); formData.append("upload_preset", "edufill_docs"); 
      const response = await fetch(`https://api.cloudinary.com/v1_1/dvocl6wvq/auto/upload`, { method: "POST", body: formData });
      const data = await response.json(); const newFileUrl = data.secure_url;
      const updatedDocsMap = { ...selectedStudent.documents, [docKey]: newFileUrl };
      await updateDoc(doc(db, selectedStudent.collectionName, selectedStudent.id), { documents: updatedDocsMap });
      setSelectedStudent({ ...selectedStudent, documents: updatedDocsMap }); alert("Document Replaced!");
    } catch (err) { console.error(err); } finally { setReplacingDoc(null); }
  };

  // State Updates for Table actions
  const togglePhotoDeliveryStatus = async (id, colName, status) => { await updateDoc(doc(db, colName, id), { photoDelivered: !status, photoDeliveredAt: !status ? new Date().toISOString() : null }); };
  const toggleConfirmationStatus = async (id, colName, status) => { await updateDoc(doc(db, colName, id), { confirmationDelivered: !status, confirmationDeliveredAt: !status ? new Date().toISOString() : null }); };
  const openPaymentModal = (student) => { setPaymentData({ id: student.id, colName: student.collectionName, amount: student.paymentAmount || '', method: student.paymentMethod || 'Online' }); setIsPaymentModalOpen(true); };
  const submitPayment = async (e) => { e.preventDefault(); setSavingPayment(true); await updateDoc(doc(db, paymentData.colName, paymentData.id), { paymentStatus: 'Paid', paymentAmount: paymentData.amount, paymentMethod: paymentData.method }); setIsPaymentModalOpen(false); setSavingPayment(false); };
  const markAsArrived = async (id, col) => { await updateDoc(doc(db, col, id), { status: 'Arrived' }); };
  const markAsAbsent = async (id, col) => { 
    if(window.confirm("Marking Absent will reopen this time slot for others. Continue?")) {
      await updateDoc(doc(db, col, id), { status: 'Absent' }); 
      await updateDoc(doc(db, "Employees", agentData.id), { assignedCount: Math.max(0, (agentData.assignedCount || 1) - 1) });
    }
  };
  const markAsCompleted = async (id, colName) => {
    const appNumber = window.prompt("Enter Form Application Number:");
    if (appNumber !== null) await updateDoc(doc(db, colName, id), { status: 'Completed', applicationNumber: appNumber || 'N/A' }); 
  };
  const sendReminder = (mobile, name, reportingTime) => {
    window.open(`https://wa.me/91${mobile}?text=${encodeURIComponent(`Hello ${name}, your EduFill slot is soon. Please reach by ${reportingTime || 'your slot time'}. Reply YES if coming.`)}`, '_blank');
  };

  // Calculations
  const pendingCount = assignedStudents.filter(s => s.status === 'Pending' || s.status === 'Arrived').length;
  const completedCount = assignedStudents.filter(s => s.status === 'Completed').length;
  const totalCollection = assignedStudents.reduce((sum, s) => s.paymentStatus === 'Paid' ? sum + Number(s.paymentAmount || 0) : sum, 0);

  const getAvailableSlots = () => {
    const sIdx = MASTER_TIME_SLOTS.indexOf(bookingSettings.startTime) !== -1 ? MASTER_TIME_SLOTS.indexOf(bookingSettings.startTime) : 0; 
    const eIdx = MASTER_TIME_SLOTS.indexOf(bookingSettings.endTime) !== -1 ? MASTER_TIME_SLOTS.indexOf(bookingSettings.endTime) : 47;
    const now = new Date();
    return MASTER_TIME_SLOTS.slice(sIdx, eIdx + 1).filter(slotTimeStr => {
      const [time, modifier] = slotTimeStr.split(' '); let [hours, minutes] = time.split(':').map(Number);
      if (hours === 12) hours = 0; if (modifier === 'PM') hours += 12;
      const slotDate = new Date(); slotDate.setHours(hours, minutes, 0, 0);
      return now <= slotDate; 
    });
  };
  const availableSlots = getAvailableSlots();

  if (isInitializing) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-indigo-600 w-12 h-12" /></div>;
  if (!isAuthenticated) return <AgentLogin agentName={agentName} setAgentName={setAgentName} pin={pin} setPin={setPin} handleLogin={handleLogin} loggingIn={loggingIn} error={error} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* --- MODALS --- */}
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} paymentData={paymentData} setPaymentData={setPaymentData} submitPayment={submitPayment} savingPayment={savingPayment} />
      <WalkInModal isOpen={isWalkInModalOpen} onClose={() => setIsWalkInModalOpen(false)} walkInForm={walkInForm} handleWalkInChange={handleWalkInChange} submitWalkIn={submitWalkIn} savingWalkIn={savingWalkIn} approvedInstitutes={approvedInstitutes} availableSlots={availableSlots} bookedSlotsInfo={bookedSlotsInfo} instituteCapacity={instituteCapacity} isHolidayToday={bookingSettings.holidays?.includes(todayStr)} todayStr={todayStr} />
      
      {isUploadModalOpen && uploadTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl relative"><button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4"><X size={20}/></button>
            <DocumentUploader studentId={uploadTarget.id} collectionName={uploadTarget.collectionName} studentName={uploadTarget.fullName} category={uploadTarget.category} onComplete={() => { alert("Uploaded!"); setIsUploadModalOpen(false); setUploadTarget(null); }} />
          </div>
        </div>
      )}

      {replaceCropModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between bg-white"><h3 className="font-bold flex items-center gap-2"><CropIcon size={20}/> Adjust Image</h3><button onClick={() => setReplaceCropModalOpen(false)}><X size={24}/></button></div>
            <div className="flex-1 overflow-auto bg-gray-100 p-2 flex justify-center"><ReactCrop crop={replaceCrop} onChange={(_, c) => setReplaceCrop(c)} onComplete={c => setReplaceCompletedCrop(c)}><img ref={replaceImgRef} src={replaceImgSrc} onLoad={onReplaceImageLoad} alt="Crop" style={{ maxHeight: '50vh' }}/></ReactCrop></div>
            <div className="p-4 bg-white flex gap-2"><button onClick={handleReplaceCropSave} className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl">Process</button></div>
          </div>
        </div>
      )}

      {docsModalOpen && selectedStudent && selectedStudent.documents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b pb-4"><h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileText size={20} className="text-indigo-600"/> Documents</h3><button onClick={() => setDocsModalOpen(false)} className="bg-gray-100 p-2 rounded-full"><X size={20}/></button></div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {[{ key: 'profilePicUrl', label: '🖼️ Passport Photo' }, { key: 'signatureUrl', label: '✍️ Signature' }, { key: 'tenthUrl', label: '📄 10th Marksheet' }, { key: 'domicileUrl', label: '📄 Niwash Praman' }, { key: 'casteUrl', label: '📄 Caste Cert.' }].map(item => {
                const url = selectedStudent.documents[item.key]; if (!url) return null; 
                return (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <span className="font-bold text-indigo-800 text-sm">{item.label}</span>
                    <div className="flex gap-2">
                      <a href={url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold">View</a>
                      <label className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white rounded-lg font-bold text-xs cursor-pointer shadow-sm">Replace<input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleReplaceFileChange(e, item.key)} /></label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN UI --- */}
      <AgentHeader agentData={agentData} toggleBreakStatus={toggleBreakStatus} setIsWalkInModalOpen={setIsWalkInModalOpen} handleLogout={handleLogout} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        <AgentStats assignedStudents={assignedStudents} pendingCount={pendingCount} completedCount={completedCount} totalCollection={totalCollection} />
        <QueueTable 
          loading={loading} assignedStudents={assignedStudents} openPaymentModal={openPaymentModal} 
          togglePhotoDeliveryStatus={togglePhotoDeliveryStatus} toggleConfirmationStatus={toggleConfirmationStatus} 
          setSelectedStudent={setSelectedStudent} setDocsModalOpen={setDocsModalOpen} setUploadTarget={setUploadTarget} 
          setIsUploadModalOpen={setIsUploadModalOpen} sendReminder={sendReminder} markAsArrived={markAsArrived} 
          markAsAbsent={markAsAbsent} markAsCompleted={markAsCompleted} 
        />
      </main>
    </div>
  );
}
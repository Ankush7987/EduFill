import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserCircle, Lock, Loader2, LogOut, CheckCircle, Clock, FileText, MessageCircle, X, Check, Camera, Printer, Edit, IndianRupee, Upload, PlusCircle, Bell, UserCheck, UserX, Power } from 'lucide-react';
import PaymentModal from './admin/PaymentModal';
import WalkInModal from './admin/WalkInModal';
import DocumentUploader from '../components/DocumentUploader';

export default function AgentPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [agentData, setAgentData] = useState(null);

  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ id: '', colName: '', amount: '', method: 'Online' });
  const [savingPayment, setSavingPayment] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: '', slotTime: '' });
  const [savingWalkIn, setSavingWalkIn] = useState(false);
  const [approvedInstitutes, setApprovedInstitutes] = useState([]);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoggingIn(true); setError('');
    try {
      // Offline/Online ki wajah se ab hum bina 'active' filter ke login check karenge
      const q = query(collection(db, "Employees"), where("pin", "==", pin));
      const snap = await getDocs(q); let found = false;
      snap.forEach(document => { 
        const data = document.data(); 
        if (data.name.trim().toLowerCase() === agentName.trim().toLowerCase()) { 
          setAgentData({ id: document.id, ...data }); 
          setIsAuthenticated(true); 
          found = true; 
        } 
      });
      if (!found) setError("Invalid Name or PIN.");
    } catch (err) { setError("Check internet."); } finally { setLoggingIn(false); }
  };

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
          const combined = [...others, ...docs];
          return combined.sort((a, b) => (b.timestamp?.toMillis() || Date.now()) - (a.timestamp?.toMillis() || Date.now()));
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
    return () => { unsubBookings.forEach(unsub => unsub()); unsubCamps(); };
  }, [isAuthenticated, agentData]);

  // 🌟 NAYA: ONLINE / OFFLINE TOGGLE FUNCTION 🌟
  const toggleAgentStatus = async () => {
    try {
      const newStatus = !agentData.active;
      await updateDoc(doc(db, "Employees", agentData.id), { active: newStatus });
      setAgentData(prev => ({ ...prev, active: newStatus }));
      alert(newStatus ? "You are now ONLINE. You will receive new forms." : "You are OFFLINE. New forms will not be assigned to you.");
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to change status.");
    }
  };

  const handleWalkInChange = (e) => setWalkInForm({ ...walkInForm, [e.target.name]: e.target.value });
  const generateToken = () => "EDU-" + Math.floor(100000 + Math.random() * 900000);

  const submitWalkIn = async (e) => {
    e.preventDefault(); setSavingWalkIn(true);
    try {
      let col = walkInForm.institute === "Ribosome Institute" ? "Ribosome_Students" : walkInForm.institute === "Unacademy" ? "Unacademy_Students" : "Other_Students";
      const newDocRef = await addDoc(collection(db, col), { ...walkInForm, tokenNumber: generateToken(), status: 'Pending', paymentStatus: 'Due', photoDelivered: false, confirmationDelivered: false, assignedTo: agentData.name, timestamp: serverTimestamp() });
      await updateDoc(doc(db, "Employees", agentData.id), { assignedCount: (agentData.assignedCount || 0) + 1 });
      const savedStudentDetails = { id: newDocRef.id, collectionName: col, fullName: walkInForm.fullName, category: walkInForm.category };
      setIsWalkInModalOpen(false); setWalkInForm({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: '', slotTime: '' });
      if(window.confirm(`Successfully Added: ${savedStudentDetails.fullName}\n\nUpload their documents now?`)) { setUploadTarget(savedStudentDetails); setTimeout(() => setIsUploadModalOpen(true), 300); }
    } catch (err) { alert("Failed to add."); } finally { setSavingWalkIn(false); }
  };

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
    const appNumber = window.prompt("Enter Form Application Number (Leave empty if not generated yet):");
    if (appNumber !== null) await updateDoc(doc(db, colName, id), { status: 'Completed', applicationNumber: appNumber || 'N/A' }); 
  };
  
  const sendReminder = (mobile, name, reportingTime) => {
    const text = `Hello ${name}, this is an automated reminder from EduFill. Your form filling slot is scheduled soon. Please reach the center by ${reportingTime || 'your slot time'}. Reply YES if you are coming.`;
    window.open(`https://wa.me/91${mobile}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getDownloadUrl = (url) => { if (!url) return ''; if (url.includes('res.cloudinary.com')) return `${url.split('/upload/')[0]}/upload/fl_attachment/${url.split('/upload/')[1]}`; return url; };

  const pendingCount = assignedStudents.filter(s => s.status === 'Pending' || s.status === 'Arrived').length;
  const completedCount = assignedStudents.filter(s => s.status === 'Completed').length;
  const totalCollection = assignedStudents.reduce((sum, s) => s.paymentStatus === 'Paid' ? sum + Number(s.paymentAmount || 0) : sum, 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-indigo-600 p-8 text-center text-white">
            <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg border-b-4 border-emerald-700 mx-auto mb-5"><span className="font-black text-white text-3xl tracking-tighter drop-shadow-md">EF</span><div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-sm"></div></div>
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
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} paymentData={paymentData} setPaymentData={setPaymentData} submitPayment={submitPayment} savingPayment={savingPayment} />
      <WalkInModal isOpen={isWalkInModalOpen} onClose={() => setIsWalkInModalOpen(false)} walkInForm={walkInForm} handleWalkInChange={handleWalkInChange} submitWalkIn={submitWalkIn} savingWalkIn={savingWalkIn} approvedInstitutes={approvedInstitutes} />

      {isUploadModalOpen && uploadTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl relative my-8">
            <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 text-gray-500"><X size={20}/></button>
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4"><Upload className="inline text-indigo-500 mr-2" size={20}/> Upload Docs: {uploadTarget.fullName}</h2>
            <DocumentUploader studentId={uploadTarget.id} collectionName={uploadTarget.collectionName} studentName={uploadTarget.fullName} category={uploadTarget.category} onComplete={() => { alert("Docs uploaded!"); setIsUploadModalOpen(false); setUploadTarget(null); }} />
          </div>
        </div>
      )}

      {docsModalOpen && selectedStudent && selectedStudent.documents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b pb-4"><h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileText size={20} className="text-indigo-600"/> Documents</h3><button onClick={() => setDocsModalOpen(false)} className="bg-gray-100 p-2 rounded-full"><X size={20}/></button></div>
            <div className="space-y-3">
              {[{ key: 'profilePicUrl', label: '🖼️ Passport Photo' }, { key: 'signatureUrl', label: '✍️ Signature' }, { key: 'tenthUrl', label: '📄 10th Marksheet' }, { key: 'domicileUrl', label: '📄 Niwash Praman' }, { key: 'casteUrl', label: '📄 Caste Cert.' }].map(item => {
                const url = selectedStudent.documents[item.key]; if (!url) return null; 
                return (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <span className="font-bold text-indigo-800 text-sm">{item.label}</span>
                    <div className="flex gap-2"><a href={url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold">View</a><a href={getDownloadUrl(url)} download className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold">Download</a></div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setDocsModalOpen(false)} className="w-full mt-6 bg-gray-900 text-white font-bold py-3 rounded-xl">Close</button>
          </div>
        </div>
      )}

      <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div><h1 className="text-xl md:text-2xl font-extrabold">Welcome, {agentData.name.split(' ')[0]}!</h1><p className="text-xs md:text-sm text-indigo-200">Queue: {agentData.institute}</p></div>
          <div className="flex flex-wrap items-center gap-2">
            
            {/* 🌟 NAYA: ONLINE / OFFLINE TOGGLE BUTTON 🌟 */}
            <button onClick={toggleAgentStatus} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold shadow-md transition-all ${agentData.active ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
              <Power size={16} /> <span className="hidden md:inline">{agentData.active ? 'Online' : 'On Break'}</span>
            </button>

            <button onClick={() => setIsWalkInModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-lg flex items-center gap-1 text-sm font-bold shadow-md transition-all"><PlusCircle size={16} /> <span className="hidden md:inline">Walk-in</span></button>
            <button onClick={() => {setIsAuthenticated(false); setAgentData(null); setPin('');}} className="bg-indigo-800 hover:bg-gray-900 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors"><LogOut size={16} /></button>
          </div>
        </div>
        {!agentData.active && (
          <div className="bg-red-500 text-white text-xs font-bold text-center py-1 mt-3 rounded-md animate-pulse">
            ⚠️ You are Offline! New bookings will NOT be assigned to you.
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"><p className="text-xs text-gray-500 font-bold uppercase">Queue Size</p><p className="text-2xl font-black text-indigo-600">{assignedStudents.length}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"><p className="text-xs text-gray-500 font-bold uppercase">To Be Done</p><p className="text-2xl font-black text-amber-500">{pendingCount}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"><p className="text-xs text-gray-500 font-bold uppercase">Forms Done</p><p className="text-2xl font-black text-emerald-500">{completedCount}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-200 bg-indigo-50"><p className="text-xs text-indigo-700 font-bold uppercase flex items-center gap-1"><IndianRupee size={12}/> Collection</p><p className="text-2xl font-black text-indigo-900">₹{totalCollection}</p></div>
        </div>

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
                          
                          {/* 🌟 FIX: MARK COMPLETE IS NOW ALWAYS AVAILABLE FOR PENDING/ARRIVED STUDENTS 🌟 */}
                          <div className="flex gap-2 mt-2">
                            {student.status === 'Pending' && <button onClick={() => markAsArrived(student.id, student.collectionName)} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-600 hover:text-white border border-cyan-200 rounded-lg text-xs font-bold transition-all"><UserCheck size={14}/> Arrived</button>}
                            {student.status === 'Pending' && <button onClick={() => markAsAbsent(student.id, student.collectionName)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 rounded-lg text-xs font-bold transition-all" title="Marks absent and opens slot for others"><UserX size={14}/> Skip/Absent</button>}
                            
                            {/* condition se "student.documents" hata diya gaya hai */}
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
      </main>
    </div>
  );
}
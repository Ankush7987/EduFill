import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserCircle, Lock, Loader2, LogOut, CheckCircle, Clock, FileText, MessageCircle, X, Check, Camera, Printer, Edit, IndianRupee, Upload, PlusCircle } from 'lucide-react';
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
    e.preventDefault();
    setLoggingIn(true);
    setError('');
    try {
      const q = query(collection(db, "Employees"), where("pin", "==", pin), where("active", "==", true));
      const snap = await getDocs(q);
      
      let found = false;
      snap.forEach(document => {
        const data = document.data();
        if (data.name.trim().toLowerCase() === agentName.trim().toLowerCase()) {
          setAgentData({ id: document.id, ...data });
          setIsAuthenticated(true);
          found = true;
        }
      });

      if (!found) {
        setError("Invalid Name or PIN. Please check again.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Check internet.");
    } finally {
      setLoggingIn(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !agentData) return;

    const collectionsToFetch = ['Ribosome_Students', 'Unacademy_Students', 'Other_Students'];
    let allData = { Ribosome_Students: [], Unacademy_Students: [], Other_Students: [] };
    const unsubBookings = [];

    collectionsToFetch.forEach(colName => {
      const q = query(collection(db, colName), where("assignedTo", "==", agentData.name));
      const unsub = onSnapshot(q, (snapshot) => {
        const docs = [];
        snapshot.forEach(doc => docs.push({ id: doc.id, collectionName: colName, ...doc.data() }));
        allData[colName] = docs; 

        const combined = [...allData['Ribosome_Students'], ...allData['Unacademy_Students'], ...allData['Other_Students']];
        combined.sort((a, b) => (b.timestamp?.toMillis() || Date.now()) - (a.timestamp?.toMillis() || Date.now()));
        setAssignedStudents(combined);
        setLoading(false);
      });
      unsubBookings.push(unsub);
    });

    const qCamps = query(collection(db, "Camp_Requests"), where("status", "==", "Completed"));
    const unsubCamps = onSnapshot(qCamps, (snapshot) => {
      const instList = [];
      snapshot.forEach(doc => { if(doc.data().instituteName) instList.push(doc.data().instituteName); });
      const uniqueInst = [...new Set(instList)].filter(name => name !== 'Ribosome Institute' && name !== 'Unacademy');
      setApprovedInstitutes(uniqueInst);
    });

    return () => { unsubBookings.forEach(unsub => unsub()); unsubCamps(); };
  }, [isAuthenticated, agentData]);

  const handleWalkInChange = (e) => setWalkInForm({ ...walkInForm, [e.target.name]: e.target.value });
  const generateToken = () => "EDU-" + Math.floor(100000 + Math.random() * 900000);

  const submitWalkIn = async (e) => {
    e.preventDefault(); setSavingWalkIn(true);
    try {
      let collectionName = "Other_Students"; 
      if (walkInForm.institute === "Ribosome Institute") collectionName = "Ribosome_Students";
      else if (walkInForm.institute === "Unacademy") collectionName = "Unacademy_Students";

      const newDocRef = await addDoc(collection(db, collectionName), { 
        ...walkInForm, 
        tokenNumber: generateToken(), 
        status: 'Pending', 
        paymentStatus: 'Due', 
        photoDelivered: false, 
        confirmationDelivered: false, 
        assignedTo: agentData.name, 
        timestamp: serverTimestamp() 
      });

      await updateDoc(doc(db, "Employees", agentData.id), {
        assignedCount: (agentData.assignedCount || 0) + 1
      });

      const savedStudentDetails = { id: newDocRef.id, collectionName: collectionName, fullName: walkInForm.fullName, category: walkInForm.category };
      setIsWalkInModalOpen(false); 
      setWalkInForm({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: '', slotTime: '' });
      
      if(window.confirm(`Successfully Added: ${savedStudentDetails.fullName}\n\nDo you want to upload their documents now?`)) {
        setUploadTarget(savedStudentDetails); 
        setTimeout(() => setIsUploadModalOpen(true), 300);
      }
    } catch (err) { console.error("Error:", err); alert("Failed to add walk-in student."); } 
    finally { setSavingWalkIn(false); }
  };

  const togglePhotoDeliveryStatus = async (id, colName, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await updateDoc(doc(db, colName, id), { photoDelivered: newStatus, photoDeliveredAt: newStatus ? new Date().toISOString() : null });
    } catch (err) { console.error("Error:", err); alert("Failed to update photo status!"); }
  };

  const toggleConfirmationStatus = async (id, colName, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await updateDoc(doc(db, colName, id), { confirmationDelivered: newStatus, confirmationDeliveredAt: newStatus ? new Date().toISOString() : null });
    } catch (err) { console.error("Error:", err); alert("Failed to update confirmation status!"); }
  };

  const openPaymentModal = (student) => {
    setPaymentData({ id: student.id, colName: student.collectionName, amount: student.paymentAmount || '', method: student.paymentMethod || 'Online' });
    setIsPaymentModalOpen(true);
  };

  const submitPayment = async (e) => {
    e.preventDefault(); setSavingPayment(true);
    try {
      await updateDoc(doc(db, paymentData.colName, paymentData.id), { paymentStatus: 'Paid', paymentAmount: paymentData.amount, paymentMethod: paymentData.method });
      setIsPaymentModalOpen(false);
    } catch (err) { console.error("Error:", err); alert("Failed to save payment details."); } 
    finally { setSavingPayment(false); }
  };

  const markAsCompleted = async (id, colName) => {
    const appNumber = window.prompt("Form fill ho gaya? Enter the Student's Application Number (optional):");
    if (appNumber !== null) {
      try { 
        await updateDoc(doc(db, colName, id), { 
          status: 'Completed', 
          applicationNumber: appNumber || 'N/A' 
        }); 
      } 
      catch (err) { console.error(err); alert("Failed to update!"); }
    }
  };

  const getDownloadUrl = (url) => {
    if (!url) return '';
    if (url.includes('res.cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
    }
    return url;
  };

  const pendingCount = assignedStudents.filter(s => s.status === 'Pending').length;
  const completedCount = assignedStudents.filter(s => s.status === 'Completed').length;
  const totalCollection = assignedStudents.reduce((sum, s) => {
    return s.paymentStatus === 'Paid' ? sum + Number(s.paymentAmount || 0) : sum;
  }, 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-indigo-600 p-8 text-center text-white">
            
            {/* 🌟 NAYA: LOGIN SCREEN CSS LOGO 🌟 */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg border-b-4 border-emerald-700 mx-auto mb-5">
              <span className="font-black text-white text-3xl tracking-tighter drop-shadow-md">EF</span>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-sm"></div>
            </div>

            <h2 className="text-2xl font-extrabold">Agent Portal</h2>
            <p className="text-indigo-200 text-sm mt-1">Login to access your assigned forms</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-5">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center">{error}</div>}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><UserCircle size={16}/> Your Full Name</label>
              <input type="text" required value={agentName} onChange={(e) => setAgentName(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Rahul Kumar" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Lock size={16}/> 4-Digit PIN</label>
              <input type="password" required maxLength="4" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none tracking-widest text-center text-lg" placeholder="••••" />
            </div>
            <button disabled={loggingIn} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-all">
              {loggingIn ? <Loader2 size={20} className="animate-spin"/> : 'Access My Dashboard'}
            </button>
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
            <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:text-red-500 transition-colors z-10"><X size={20}/></button>
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4"><Upload className="inline text-indigo-500 mr-2" size={20}/> Upload Docs: {uploadTarget.fullName}</h2>
            <DocumentUploader studentId={uploadTarget.id} collectionName={uploadTarget.collectionName} studentName={uploadTarget.fullName} category={uploadTarget.category} onComplete={() => { alert("Documents uploaded and linked successfully!"); setIsUploadModalOpen(false); setUploadTarget(null); }} />
          </div>
        </div>
      )}

      <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold">Welcome, {agentData.name.split(' ')[0]}!</h1>
            <p className="text-xs md:text-sm text-indigo-200">Location: {agentData.institute}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsWalkInModalOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 px-3 py-2 md:px-4 md:py-2 rounded-lg flex items-center gap-1 text-sm font-bold shadow-md transition-all">
              <PlusCircle size={16} /> <span className="hidden md:inline">Walk-in</span>
            </button>

            <button onClick={() => {setIsAuthenticated(false); setAgentData(null); setPin('');}} className="bg-indigo-700 hover:bg-indigo-800 p-2 md:px-4 md:py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors">
              <LogOut size={16} className="md:hidden" /> <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {docsModalOpen && selectedStudent && selectedStudent.documents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileText size={20} className="text-indigo-600"/> View Documents</h3>
              <button onClick={() => setDocsModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="space-y-3">
              {[
                { key: 'profilePicUrl', label: '🖼️ Passport Photo' },
                { key: 'signatureUrl', label: '✍️ Signature' },
                { key: 'tenthUrl', label: '📄 10th Marksheet' },
                { key: 'domicileUrl', label: '📄 Niwash Praman' },
                { key: 'casteUrl', label: selectedStudent.category === 'General (EWS)' ? '📄 EWS Certificate' : '📄 Caste Cert.' }
              ].map((docItem) => {
                const docUrl = selectedStudent.documents[docItem.key];
                if (!docUrl) return null; 
                return (
                  <div key={docItem.key} className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <span className="font-bold text-indigo-800 text-sm">{docItem.label}</span>
                    <div className="flex gap-2">
                      <a href={docUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 rounded-lg text-xs font-bold transition-all">View</a>
                      <a href={getDownloadUrl(docUrl)} download className="px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold shadow-sm transition-all">Download</a>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setDocsModalOpen(false)} className="w-full mt-6 bg-gray-900 text-white font-bold py-3 rounded-xl">Close</button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 font-bold uppercase">Assigned</p>
            <p className="text-2xl font-black text-indigo-600">{assignedStudents.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 font-bold uppercase">Pending</p>
            <p className="text-2xl font-black text-amber-500">{pendingCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 font-bold uppercase">Completed</p>
            <p className="text-2xl font-black text-emerald-500">{completedCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-200 bg-indigo-50">
            <p className="text-xs text-indigo-700 font-bold uppercase flex items-center gap-1"><IndianRupee size={12}/> Collection</p>
            <p className="text-2xl font-black text-indigo-900">₹{totalCollection}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-800">My Students To-Do List</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4 font-semibold whitespace-nowrap">Student Info</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Exam & Slot</th>
                  <th className="p-4 font-semibold whitespace-nowrap w-48">Status Tracker</th>
                  <th className="p-4 font-semibold whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2"/> Fetching your tasks...</td></tr>
                ) : assignedStudents.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-medium">No students assigned to you yet! Take a break ☕</td></tr>
                ) : (
                  assignedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 align-top">
                        <p className="font-bold text-gray-900 text-base">{student.fullName}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1"><MessageCircle size={12}/> {student.mobile}</p>
                        <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded mt-1 inline-block font-bold">{student.category}</span>
                      </td>
                      <td className="p-4 align-top">
                        <p className="font-bold text-indigo-700">{student.exam}</p>
                        <div className="text-sm text-gray-600 mt-1">
                          <p className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 w-fit px-2 py-0.5 rounded"><Clock size={12}/> {student.slotTime}</p>
                          <p className="text-xs mt-1 text-gray-500">Date: {student.slotDate}</p>
                        </div>
                      </td>
                      
                      <td className="p-4 align-top">
                        <p className="font-black text-indigo-600 text-xs md:text-sm mb-2">{student.tokenNumber}</p>
                        <div className="flex gap-2 items-center mb-2 flex-wrap">
                          <span className={`px-2 py-1 rounded text-[10px] md:text-[11px] font-bold ${student.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{student.status || 'Pending'}</span>
                          {student.paymentStatus === 'Paid' ? (
                            <div className="flex items-center gap-1">
                              <span className="px-2 py-1 rounded text-[10px] md:text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1"><CheckCircle size={10}/> ₹{student.paymentAmount}</span>
                              <button onClick={() => openPaymentModal(student)} className="text-gray-400 hover:text-blue-500 p-1 bg-gray-100 rounded" title="Edit Payment Data"><Edit size={12} /></button>
                            </div>
                          ) : (
                            <button onClick={() => openPaymentModal(student)} className="px-2 py-1 rounded text-[10px] md:text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">Payment Due</button>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                          <button onClick={() => togglePhotoDeliveryStatus(student.id, student.collectionName, student.photoDelivered)} className={`flex w-fit items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all border ${student.photoDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            <Camera size={12}/> {student.photoDelivered ? 'Photos ✅' : 'Give Photos'}
                          </button>
                          <button onClick={() => toggleConfirmationStatus(student.id, student.collectionName, student.confirmationDelivered)} className={`flex w-fit items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all border ${student.confirmationDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            <Printer size={12}/> {student.confirmationDelivered ? 'Confirm ✅' : 'Give Confirm'}
                          </button>
                        </div>
                        {student.applicationNumber && student.applicationNumber !== 'N/A' && (
                          <p className="text-[10px] md:text-[11px] font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded inline-block mt-2">App No: {student.applicationNumber}</p>
                        )}
                      </td>

                      <td className="p-4 align-top text-right">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            {student.documents ? (
                              <button onClick={() => { setSelectedStudent(student); setDocsModalOpen(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-colors">
                                <FileText size={14}/> View Docs
                              </button>
                            ) : (
                              <button onClick={() => { setUploadTarget(student); setIsUploadModalOpen(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg text-xs font-bold transition-colors shadow-sm">
                                <Upload size={14}/> Upload
                              </button>
                            )}
                            
                            <a href={`https://wa.me/91${student.mobile}?text=Hello ${student.fullName}, this is ${agentData.name} from EduFill...`} target="_blank" rel="noreferrer" className="flex justify-center items-center p-1.5 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-lg transition-colors">
                              <MessageCircle size={16}/>
                            </a>
                          </div>

                          {student.status !== 'Completed' && (
                            <button onClick={() => markAsCompleted(student.id, student.collectionName)} className="flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-md mt-1">
                              <Check size={14}/> Mark Done
                            </button>
                          )}
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
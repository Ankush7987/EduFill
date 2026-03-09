import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, LogOut, Settings, X, Building, FileText, Upload, AlertTriangle, FileWarning, RefreshCw, Loader2, Crop as CropIcon, RotateCw, Menu, UserPlus, Shield, Check } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { jsPDF } from 'jspdf';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { collection, doc, updateDoc, deleteDoc, setDoc, addDoc, serverTimestamp, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; 

// 🌟 IMPORTS 🌟
import AdminLogin from './admin/AdminLogin';
import PaymentModal from './admin/PaymentModal';
import WalkInModal from './admin/WalkInModal';
import DocumentUploader from '../components/DocumentUploader';

import DashboardTab from './admin/tabs/DashboardTab';
import TeamTab from './admin/tabs/TeamTab';
import MissingTab from './admin/tabs/MissingTab';
import CampTab from './admin/tabs/CampTab';
import SettingsTab from './admin/tabs/SettingsTab';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  const [bookings, setBookings] = useState([]);
  const [campRequests, setCampRequests] = useState([]); 
  const [missingRequests, setMissingRequests] = useState([]); 
  const [employees, setEmployees] = useState([]);
  const [liveExams, setLiveExams] = useState({ neet: true, jee: false, cuet: false });
  const [loading, setLoading] = useState(true);
  
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [dateFilter, setDateFilter] = useState(''); 
  const [agentFilter, setAgentFilter] = useState('All'); 
  const [empInstituteFilter, setEmpInstituteFilter] = useState('All'); 

  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: '', slotTime: '' });
  const [savingWalkIn, setSavingWalkIn] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ id: '', colName: '', amount: '', method: 'Online' });
  const [savingPayment, setSavingPayment] = useState(false);

  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [replacingDoc, setReplacingDoc] = useState(null); 
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);

  const [replaceCropModalOpen, setReplaceCropModalOpen] = useState(false);
  const [replaceImgSrc, setReplaceImgSrc] = useState('');
  const [replaceDocKey, setReplaceDocKey] = useState('');
  const [replaceRawFile, setReplaceRawFile] = useState(null);
  const [replaceCrop, setReplaceCrop] = useState();
  const [replaceCompletedCrop, setReplaceCompletedCrop] = useState(null);
  const replaceImgRef = useRef(null);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [empForm, setEmpForm] = useState({ name: '', pin: '', institute: 'Ribosome Institute' });
  const [savingEmp, setSavingEmp] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const docRef = doc(db, "Settings", "LiveExams");
    const unsubSettings = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) setLiveExams(docSnap.data());
    });

    const collectionsToFetch = ['Ribosome_Students', 'Unacademy_Students', 'Other_Students'];
    let allData = { Ribosome_Students: [], Unacademy_Students: [], Other_Students: [] };
    const unsubBookings = [];

    collectionsToFetch.forEach(colName => {
      const q = query(collection(db, colName));
      const unsub = onSnapshot(q, (snapshot) => {
        const docs = [];
        snapshot.forEach(doc => docs.push({ id: doc.id, collectionName: colName, ...doc.data() }));
        allData[colName] = docs; 

        const combined = [...allData['Ribosome_Students'], ...allData['Unacademy_Students'], ...allData['Other_Students']];
        combined.sort((a, b) => (b.timestamp?.toMillis() || Date.now()) - (a.timestamp?.toMillis() || Date.now()));
        setBookings(combined);
        setLoading(false);
      });
      unsubBookings.push(unsub);
    });

    const qCamps = query(collection(db, 'Camp_Requests'));
    const unsubCamps = onSnapshot(qCamps, (snapshot) => {
      const campDocs = [];
      snapshot.forEach(doc => campDocs.push({ id: doc.id, ...doc.data() }));
      campDocs.sort((a, b) => (b.timestamp?.toMillis() || Date.now()) - (a.timestamp?.toMillis() || Date.now()));
      setCampRequests(campDocs);
    });

    const qMissing = query(collection(db, 'Missing_Requests'));
    const unsubMissing = onSnapshot(qMissing, (snapshot) => {
      const missingDocs = [];
      snapshot.forEach(doc => missingDocs.push({ id: doc.id, ...doc.data() }));
      missingDocs.sort((a, b) => (b.timestamp?.toMillis() || Date.now()) - (a.timestamp?.toMillis() || Date.now()));
      setMissingRequests(missingDocs);
    });

    const qEmp = query(collection(db, 'Employees'));
    const unsubEmp = onSnapshot(qEmp, (snapshot) => {
      const empData = [];
      snapshot.forEach(doc => empData.push({ id: doc.id, ...doc.data() }));
      setEmployees(empData);
    });

    return () => { unsubSettings(); unsubBookings.forEach(unsub => unsub()); unsubCamps(); unsubMissing(); unsubEmp(); };
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Ankush@7987') { setIsAuthenticated(true); setError(''); } else { setError('Incorrect Password!'); }
  };

  const toggleExam = async (examKey) => {
    const newStatus = { ...liveExams, [examKey]: !liveExams[examKey] };
    try { await setDoc(doc(db, "Settings", "LiveExams"), newStatus); } catch (error) { console.error(error); }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setSavingEmp(true);
    try {
      await addDoc(collection(db, 'Employees'), { name: empForm.name, pin: empForm.pin, institute: empForm.institute, role: 'agent', assignedCount: 0, active: true });
      setIsEmployeeModalOpen(false); setEmpForm({ name: '', pin: '', institute: 'Ribosome Institute' }); alert("Employee Added!");
    } catch (err) { console.error(err); } finally { setSavingEmp(false); }
  };

  const deleteEmployee = async (id) => {
    if(window.confirm("Remove employee?")) { try { await deleteDoc(doc(db, "Employees", id)); } catch (err) { console.error(err); } }
  };

  const markAsCompleted = async (id, colName) => {
    const appNumber = window.prompt("App Number:");
    if (appNumber !== null) { try { await updateDoc(doc(db, colName, id), { status: 'Completed', applicationNumber: appNumber || 'N/A' }); } catch (err) { console.error(err); } }
  };

  const deleteBooking = async (id, colName) => {
    if(window.confirm("Delete booking?")) { try { await deleteDoc(doc(db, colName, id)); } catch (err) { console.error(err); } }
  };

  const updateCampStatus = async (id, newStatus) => { try { await updateDoc(doc(db, "Camp_Requests", id), { status: newStatus }); } catch (err) { console.error(err); } };
  const deleteCampRequest = async (id) => { if(window.confirm("Delete request?")) try { await deleteDoc(doc(db, "Camp_Requests", id)); } catch (err) { console.error(err); } };
  const resolveMissingRequest = async (id) => { try { await updateDoc(doc(db, "Missing_Requests", id), { status: 'Resolved' }); } catch (err) { console.error(err); } };
  const deleteMissingRequest = async (id) => { if(window.confirm("Delete request?")) try { await deleteDoc(doc(db, "Missing_Requests", id)); } catch (err) { console.error(err); } };
  const togglePhotoDeliveryStatus = async (id, colName, status) => { try { await updateDoc(doc(db, colName, id), { photoDelivered: !status }); } catch (err) { console.error(err); } };
  const toggleConfirmationStatus = async (id, colName, status) => { try { await updateDoc(doc(db, colName, id), { confirmationDelivered: !status }); } catch (err) { console.error(err); } };
  
  const openPaymentModal = (booking) => { setPaymentData({ id: booking.id, colName: booking.collectionName, amount: booking.paymentAmount || '', method: booking.paymentMethod || 'Online' }); setIsPaymentModalOpen(true); };
  const submitPayment = async (e) => { e.preventDefault(); setSavingPayment(true); try { await updateDoc(doc(db, paymentData.colName, paymentData.id), { paymentStatus: 'Paid', paymentAmount: paymentData.amount, paymentMethod: paymentData.method }); setIsPaymentModalOpen(false); } catch (err) { console.error(err); } finally { setSavingPayment(false); } };

  const handleWalkInChange = (e) => setWalkInForm({ ...walkInForm, [e.target.name]: e.target.value });
  const generateToken = () => "EDU-" + Math.floor(100000 + Math.random() * 900000);
  
  const assignAgent = async (inst) => {
    const q = query(collection(db, "Employees"), where("institute", "==", inst), where("active", "==", true));
    const snap = await getDocs(q); if (snap.empty) return null;
    let agents = []; snap.forEach(d => agents.push({ id: d.id, ...d.data() }));
    agents.sort((a, b) => (a.assignedCount || 0) - (b.assignedCount || 0));
    await updateDoc(doc(db, "Employees", agents[0].id), { assignedCount: (agents[0].assignedCount || 0) + 1 });
    return agents[0].name; 
  };

  const submitWalkIn = async (e) => {
    e.preventDefault(); setSavingWalkIn(true);
    try {
      let col = walkInForm.institute === "Ribosome Institute" ? "Ribosome_Students" : walkInForm.institute === "Unacademy" ? "Unacademy_Students" : "Other_Students";
      const agent = await assignAgent(walkInForm.institute);
      const newDocRef = await addDoc(collection(db, col), { ...walkInForm, tokenNumber: generateToken(), status: 'Pending', paymentStatus: 'Due', assignedTo: agent || 'Unassigned', timestamp: serverTimestamp() });
      setIsWalkInModalOpen(false); 
      if(window.confirm("Do you want to upload their documents now?")) { setUploadTarget({id: newDocRef.id, collectionName: col, fullName: walkInForm.fullName, category: walkInForm.category}); setTimeout(() => setIsUploadModalOpen(true), 300); }
    } catch (err) { console.error(err); } finally { setSavingWalkIn(false); }
  };

  const getDownloadUrl = (url) => { if (!url) return ''; if (url.includes('res.cloudinary.com')) return `${url.split('/upload/')[0]}/upload/fl_attachment/${url.split('/upload/')[1]}`; return url; };
  const formatTime = (t) => { if (!t) return "Just Now"; if (typeof t.toDate !== 'function') return "Processing..."; return t.toDate().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }); };

  // --- Document Replacement Logistics ---
  const processPassportPhoto = async (croppedBlob, name) => {
    const finalBlob = croppedBlob; 
    const imageBmp = await createImageBitmap(finalBlob);
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
    canvas.width = 413; canvas.height = 531; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 413, 531);
    ctx.drawImage(imageBmp, 0, 20, imageBmp.width * (413/imageBmp.width), imageBmp.height * (413/imageBmp.width));
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 1.0)); return blob;
  };
  const handleReplaceFileChange = (e, docKey) => {
    const file = e.target.files[0]; if (!file) return;
    setReplaceRawFile(file); setReplaceDocKey(docKey); const reader = new FileReader();
    reader.addEventListener('load', () => { setReplaceImgSrc(reader.result); setReplaceCompletedCrop(null); setReplaceCropModalOpen(true); });
    reader.readAsDataURL(file);
  };
  const onReplaceImageLoad = (e) => { const { width, height } = e.currentTarget; let aspect = replaceDocKey === 'profilePicUrl' ? 413/446 : replaceDocKey === 'signatureUrl' ? 3/1 : undefined; setReplaceCrop(aspect ? centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height) : { unit: '%', width: 100, height: 100, x: 0, y: 0 }); };
  const handleReplaceRotate = () => { /* basic rotate */ };
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

  // --- Filtering & Calculations ---
  const allAgentsList = [...new Set([...employees.map(e => e.name), ...bookings.map(b => b.assignedTo).filter(a => a && a !== 'Unassigned')])].sort();
  const approvedInstitutesList = [...new Set(campRequests.filter(c => c.status === 'Completed').map(c => c.instituteName))].filter(n => n !== 'Ribosome Institute' && n !== 'Unacademy');
  
  const filteredBookings = bookings.filter(b => {
    let catMatch = activeFilter === 'All' || (activeFilter === 'Others' ? b.collectionName === 'Other_Students' : b.collectionName.includes(activeFilter));
    let searchMatch = !searchQuery || (b.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || b.mobile?.includes(searchQuery) || b.tokenNumber?.toLowerCase().includes(searchQuery.toLowerCase()));
    let dateMatch = !dateFilter || b.slotDate === dateFilter;
    let agentMatch = agentFilter === 'All' || (b.assignedTo || 'Unassigned') === agentFilter;
    return catMatch && searchMatch && dateMatch && agentMatch;
  });

  const clearFilters = () => { setSearchQuery(''); setDateFilter(''); setActiveFilter('All'); setAgentFilter('All'); };
  const exportToExcel = () => { /* Export Logic Here */ };
  
  const pendingCount = filteredBookings.filter(b => b.status === 'Pending').length;
  const completedCount = filteredBookings.filter(b => b.status === 'Completed').length;
  const totalPaidAmount = filteredBookings.reduce((sum, b) => b.paymentStatus === 'Paid' ? sum + Number(b.paymentAmount || 0) : sum, 0);
  const pendingMissingCount = missingRequests.filter(m => m.status === 'Pending').length;

  if (!isAuthenticated) return <AdminLogin password={password} setPassword={setPassword} error={error} handleLogin={handleLogin} />;

  return (
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center shadow-md z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center border-b-2 border-emerald-700">
            <span className="font-black text-white text-xs">EF</span>
          </div>
          <span className="text-xl font-extrabold italic tracking-tight">EduFill Admin</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1"><Menu size={26} /></button>
      </div>

      {/* ALL MODALS */}
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} paymentData={paymentData} setPaymentData={setPaymentData} submitPayment={submitPayment} savingPayment={savingPayment} />
      <WalkInModal isOpen={isWalkInModalOpen} onClose={() => setIsWalkInModalOpen(false)} walkInForm={walkInForm} handleWalkInChange={handleWalkInChange} submitWalkIn={submitWalkIn} savingWalkIn={savingWalkIn} approvedInstitutes={approvedInstitutesList} />

      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in duration-300">
            <button onClick={() => setIsEmployeeModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500"><X size={20}/></button>
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4"><UserPlus className="text-indigo-500"/> Add New Agent</h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Agent Full Name</label><input type="text" required value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Secret PIN (4-Digits)</label><input type="text" required maxLength="4" pattern="\d{4}" value={empForm.pin} onChange={e => setEmpForm({...empForm, pin: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2 font-mono tracking-widest" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Assigned Institute</label>
                <select value={empForm.institute} onChange={e => setEmpForm({...empForm, institute: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2 bg-white">
                  <option value="Ribosome Institute">Ribosome Institute</option><option value="Unacademy">Unacademy</option><option value="Others">Others</option>{approvedInstitutesList.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                </select>
              </div>
              <button disabled={savingEmp} type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md flex justify-center items-center gap-2">{savingEmp ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>} Save Agent</button>
            </form>
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

      {isUploadModalOpen && uploadTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl relative"><button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4"><X size={20}/></button>
            <DocumentUploader studentId={uploadTarget.id} collectionName={uploadTarget.collectionName} studentName={uploadTarget.fullName} category={uploadTarget.category} onComplete={() => { alert("Uploaded!"); setIsUploadModalOpen(false); setUploadTarget(null); }} />
          </div>
        </div>
      )}

      {docsModalOpen && selectedStudent && selectedStudent.documents && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
             <button onClick={() => setDocsModalOpen(false)} className="absolute top-4 right-4 text-gray-500"><X size={20}/></button>
             <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={24} className="text-blue-600"/> Documents</h3>
             <div className="space-y-3">
               {[ { key: 'profilePicUrl', label: '🖼️ Passport Photo' }, { key: 'signatureUrl', label: '✍️ Signature' }, { key: 'tenthUrl', label: '📄 10th Marksheet' }, { key: 'domicileUrl', label: '📄 Niwash Praman' }, { key: 'casteUrl', label: '📄 Caste Cert.' } ].map((item) => {
                 const url = selectedStudent.documents[item.key]; if (!url) return null; 
                 return (
                   <div key={item.key} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                     <span className="font-bold text-sm">{item.label}</span>
                     <div className="flex gap-2">
                       <a href={url} target="_blank" rel="noreferrer" className="px-3 py-1 bg-white text-blue-600 rounded font-bold text-xs">View</a>
                       <label className="px-3 py-1 bg-amber-500 text-white rounded font-bold text-xs cursor-pointer">Replace<input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleReplaceFileChange(e, item.key)} /></label>
                     </div>
                   </div>
                 )
               })}
             </div>
          </div>
         </div>
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-50 w-64 bg-gray-900 text-white flex flex-col flex-shrink-0 shadow-2xl md:shadow-none`}>
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="font-black text-white text-lg">EF</span>
          </div>
          <span className="text-2xl font-extrabold italic">EduFill</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-3 mt-2 overflow-y-auto">
          <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><LayoutDashboard size={20}/> Dashboard</button>
          <button onClick={() => { setActiveTab('missing'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'missing' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><div className="flex items-center gap-3"><FileWarning size={20}/> Missing Items</div>{pendingMissingCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingMissingCount}</span>}</button>
          <button onClick={() => { setActiveTab('camps'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'camps' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><div className="flex items-center gap-3"><Building size={20}/> Camp Requests</div>{campRequests.filter(c => c.status === 'New Request').length > 0 && <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>}</button>
          <button onClick={() => { setActiveTab('team'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'team' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Shield size={20}/> Team & Agents</button>
          <button onClick={() => { setActiveTab('liveController'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'liveController' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Settings size={20}/> Form Settings</button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-3 text-gray-400 hover:text-red-400 w-full px-4 py-3 rounded-xl font-medium transition-colors"><LogOut size={20}/> Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto relative">
        
        {activeTab === 'dashboard' && (
          <DashboardTab 
            bookings={bookings} loading={loading} filteredBookings={filteredBookings} 
            activeFilter={activeFilter} setActiveFilter={setActiveFilter} 
            searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
            dateFilter={dateFilter} setDateFilter={setDateFilter} 
            agentFilter={agentFilter} setAgentFilter={setAgentFilter} allAgentsList={allAgentsList} 
            clearFilters={clearFilters} exportToExcel={exportToExcel} 
            pendingCount={pendingCount} completedCount={completedCount} totalPaidAmount={totalPaidAmount} 
            setIsWalkInModalOpen={setIsWalkInModalOpen} setSelectedStudent={setSelectedStudent} 
            setDocsModalOpen={setDocsModalOpen} setUploadTarget={setUploadTarget} setIsUploadModalOpen={setIsUploadModalOpen} 
            markAsCompleted={markAsCompleted} deleteBooking={deleteBooking} openPaymentModal={openPaymentModal} 
            togglePhotoDeliveryStatus={togglePhotoDeliveryStatus} toggleConfirmationStatus={toggleConfirmationStatus} formatTime={formatTime}
          />
        )}

        {activeTab === 'team' && (
          <TeamTab 
            employees={employees} empInstituteFilter={empInstituteFilter} setEmpInstituteFilter={setEmpInstituteFilter} 
            approvedInstitutesList={approvedInstitutesList} setIsEmployeeModalOpen={setIsEmployeeModalOpen} deleteEmployee={deleteEmployee} 
          />
        )}

        {activeTab === 'missing' && (
          <MissingTab missingRequests={missingRequests} formatTime={formatTime} resolveMissingRequest={resolveMissingRequest} deleteMissingRequest={deleteMissingRequest} />
        )}

        {activeTab === 'camps' && (
          <CampTab campRequests={campRequests} formatTime={formatTime} updateCampStatus={updateCampStatus} deleteCampRequest={deleteCampRequest} />
        )}

        {activeTab === 'liveController' && (
          <SettingsTab liveExams={liveExams} toggleExam={toggleExam} />
        )}

      </main>
    </div>
  );
}
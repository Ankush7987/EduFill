import React, { useState, useEffect } from 'react';
// 🌟 FIX: Yahan 'Check' icon ko import list me add kar diya gaya hai 🌟
import { LayoutDashboard, Users, LogOut, CheckCircle, Check, Clock, Trash2, Power, Settings, Radio, Filter, Search, X, Download, MessageCircle, PlusCircle, IndianRupee, Edit, Building, MapPin, FileText, Upload, Camera, Printer, AlertTriangle, FileWarning } from 'lucide-react';

// FIREBASE REAL-TIME IMPORTS
import { collection, doc, updateDoc, deleteDoc, setDoc, addDoc, serverTimestamp, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase'; 

// IMPORT COMPONENTS
import AdminLogin from './admin/AdminLogin';
import PaymentModal from './admin/PaymentModal';
import WalkInModal from './admin/WalkInModal';
import DocumentUploader from '../components/DocumentUploader';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // STATE MANAGEMENT
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bookings, setBookings] = useState([]);
  const [campRequests, setCampRequests] = useState([]); 
  const [missingRequests, setMissingRequests] = useState([]); 
  const [liveExams, setLiveExams] = useState({ neet: true, jee: false, cuet: false });
  const [loading, setLoading] = useState(true);
  
  // FILTERS
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [dateFilter, setDateFilter] = useState(''); 

  // MODAL STATES
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: '', slotTime: '' });
  const [savingWalkIn, setSavingWalkIn] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ id: '', colName: '', amount: '', method: 'Online' });
  const [savingPayment, setSavingPayment] = useState(false);

  // DOCUMENTS VIEWER & UPLOADER MODAL STATE
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);

  // --- FIREBASE REAL-TIME LISTENERS ---
  useEffect(() => {
    if (!isAuthenticated) return;

    const docRef = doc(db, "Settings", "LiveExams");
    const unsubSettings = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) setLiveExams(docSnap.data());
      else setDoc(docRef, { neet: true, jee: false, cuet: false });
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

    return () => { unsubSettings(); unsubBookings.forEach(unsub => unsub()); unsubCamps(); unsubMissing(); };
  }, [isAuthenticated]);

  // --- ACTIONS & LOGIC ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'Ankush@7987') { setIsAuthenticated(true); setError(''); } 
    else { setError('Incorrect Password! Please enter valid credentials.'); }
  };

  const toggleExam = async (examKey) => {
    const newStatus = { ...liveExams, [examKey]: !liveExams[examKey] };
    try { await setDoc(doc(db, "Settings", "LiveExams"), newStatus); } 
    catch (error) { console.error("Error:", error); alert("Failed to update live status!"); }
  };

  const markAsCompleted = async (id, colName) => {
    const appNumber = window.prompt("Enter the Student's Application Number (Leave blank if not applicable):");
    if (appNumber !== null) {
      try { await updateDoc(doc(db, colName, id), { status: 'Completed', applicationNumber: appNumber || 'N/A' }); } 
      catch (err) { console.error("Error:", err); alert("Failed to update booking status!"); }
    }
  };

  const deleteBooking = async (id, colName) => {
    if(window.confirm("Are you sure you want to permanently delete this booking record?")) {
      try { await deleteDoc(doc(db, colName, id)); } 
      catch (err) { console.error("Error:", err); alert("Failed to delete booking!"); }
    }
  };

  const updateCampStatus = async (id, newStatus) => {
    try { await updateDoc(doc(db, "Camp_Requests", id), { status: newStatus }); } 
    catch (err) { console.error("Error:", err); alert("Failed to update camp status!"); }
  };

  const deleteCampRequest = async (id) => {
    if(window.confirm("Are you sure you want to delete this camp request?")) {
      try { await deleteDoc(doc(db, "Camp_Requests", id)); } 
      catch (err) { console.error("Error:", err); alert("Failed to delete request!"); }
    }
  };

  const resolveMissingRequest = async (id) => {
    try { await updateDoc(doc(db, "Missing_Requests", id), { status: 'Resolved', resolvedAt: new Date().toISOString() }); } 
    catch (err) { console.error("Error:", err); alert("Failed to resolve request!"); }
  };

  const deleteMissingRequest = async (id) => {
    if(window.confirm("Are you sure you want to delete this missing item request?")) {
      try { await deleteDoc(doc(db, "Missing_Requests", id)); } 
      catch (err) { console.error("Error:", err); alert("Failed to delete request!"); }
    }
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

  const openPaymentModal = (booking) => {
    setPaymentData({ id: booking.id, colName: booking.collectionName, amount: booking.paymentAmount || '', method: booking.paymentMethod || 'Online' });
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

  const handleWalkInChange = (e) => setWalkInForm({ ...walkInForm, [e.target.name]: e.target.value });
  const generateToken = () => "EDU-" + Math.floor(100000 + Math.random() * 900000);

  const submitWalkIn = async (e) => {
    e.preventDefault(); setSavingWalkIn(true);
    try {
      let collectionName = "Other_Students"; 
      if (walkInForm.institute === "Ribosome Institute") collectionName = "Ribosome_Students";
      else if (walkInForm.institute === "Unacademy") collectionName = "Unacademy_Students";

      const newDocRef = await addDoc(collection(db, collectionName), { 
        ...walkInForm, tokenNumber: generateToken(), status: 'Pending', paymentStatus: 'Due', photoDelivered: false, confirmationDelivered: false, timestamp: serverTimestamp() 
      });

      const savedStudentDetails = { id: newDocRef.id, collectionName: collectionName, fullName: walkInForm.fullName, category: walkInForm.category };
      setIsWalkInModalOpen(false); setWalkInForm({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: '', slotTime: '' });
      
      if(window.confirm(`Successfully Added: ${savedStudentDetails.fullName}\n\nDo you want to upload their documents now to save time?`)) {
        setUploadTarget(savedStudentDetails); setTimeout(() => setIsUploadModalOpen(true), 300);
      }
    } catch (err) { console.error("Error:", err); alert("Failed to add walk-in student."); } 
    finally { setSavingWalkIn(false); }
  };

  const openDocsModal = (docs, name) => { setSelectedDocs(docs); setSelectedStudentName(name); setDocsModalOpen(true); };

  const getDownloadUrl = (url) => {
    if (!url) return '';
    if (url.includes('res.cloudinary.com')) {
      const parts = url.split('/upload/');
      if (parts.length === 2) return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
    }
    return url;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Just Now";
    // Fix: Add check to prevent crashing if timestamp is broken
    if (typeof timestamp.toDate !== 'function') return "Processing...";
    const date = timestamp.toDate();
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // --- FILTERS & SEARCH ---
  const filteredBookings = bookings.filter(booking => {
    let categoryMatch = true;
    if (activeFilter === 'Ribosome') categoryMatch = booking.collectionName === 'Ribosome_Students';
    else if (activeFilter === 'Unacademy') categoryMatch = booking.collectionName === 'Unacademy_Students';
    else if (activeFilter === 'Others') categoryMatch = booking.collectionName === 'Other_Students';

    let searchMatch = true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      searchMatch = (booking.fullName && booking.fullName.toLowerCase().includes(q)) || (booking.mobile && booking.mobile.includes(q)) || (booking.tokenNumber && booking.tokenNumber.toLowerCase().includes(q)) || (booking.applicationNumber && booking.applicationNumber.toLowerCase().includes(q));
    }
    let dateMatch = true; if (dateFilter) dateMatch = booking.slotDate === dateFilter;
    return categoryMatch && searchMatch && dateMatch;
  });

  const clearFilters = () => { setSearchQuery(''); setDateFilter(''); setActiveFilter('All'); };

  const exportToExcel = () => {
    let reportHeading = "Complete Application Database";
    if (activeFilter === 'Ribosome') reportHeading = "Ribosome Institute Student Data";
    else if (activeFilter === 'Unacademy') reportHeading = "Unacademy Student Data";
    else if (activeFilter === 'Others') reportHeading = "Other External Student Data";

    const titleRow = `"${reportHeading}"`; const emptyRow = `""`; 
    const headers = ["Token No.", "Student Name", "Mobile", "Category", "Exam", "Institute", "Batch", "Slot Date", "Slot Time", "Form Status", "Payment Status", "Payment Amount", "Payment Method", "Application No.", "Photo Delivered", "Confirmation Delivered", "Applied On"];
    
    const rows = filteredBookings.map(b => [
      b.tokenNumber || 'N/A', b.fullName || 'N/A', b.mobile || 'N/A', b.category || 'N/A', b.exam || 'N/A', b.institute || 'N/A', b.batchName || 'N/A', b.slotDate || 'N/A', b.slotTime || 'N/A', b.status || 'Pending', b.paymentStatus || 'Due', b.paymentAmount ? `₹${b.paymentAmount}` : 'N/A', b.paymentMethod || 'N/A', b.applicationNumber || 'N/A', b.photoDelivered ? 'Yes' : 'No', b.confirmationDelivered ? 'Yes' : 'No', formatTime(b.timestamp)
    ]);

    const csvContent = [titleRow, emptyRow, headers.join(","), ...rows.map(e => e.map(item => `"${item}"`).join(","))].join("\n");
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", `EduFill_${activeFilter}_Export.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const pendingCount = filteredBookings.filter(b => b.status === 'Pending').length;
  const completedCount = filteredBookings.filter(b => b.status === 'Completed').length;
  const totalPaidAmount = filteredBookings.reduce((sum, b) => b.paymentStatus === 'Paid' ? sum + Number(b.paymentAmount || 0) : sum, 0);
  const pendingMissingCount = missingRequests.filter(m => m.status === 'Pending').length;

  const approvedInstitutesList = [...new Set(campRequests.filter(c => c.status === 'Completed').map(c => c.instituteName))].filter(name => name !== 'Ribosome Institute' && name !== 'Unacademy');

  if (!isAuthenticated) { return <AdminLogin password={password} setPassword={setPassword} error={error} handleLogin={handleLogin} />; }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} paymentData={paymentData} setPaymentData={setPaymentData} submitPayment={submitPayment} savingPayment={savingPayment} />
      <WalkInModal isOpen={isWalkInModalOpen} onClose={() => setIsWalkInModalOpen(false)} walkInForm={walkInForm} handleWalkInChange={handleWalkInChange} submitWalkIn={submitWalkIn} savingWalkIn={savingWalkIn} approvedInstitutes={approvedInstitutesList} />

      {/* ADMIN DOCUMENT UPLOAD MODAL */}
      {isUploadModalOpen && uploadTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative my-8">
            <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors z-10"><X size={20}/></button>
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4 flex items-center gap-2"><Upload size={22} className="text-indigo-500"/> Upload Docs: {uploadTarget.fullName}</h2>
            <DocumentUploader studentId={uploadTarget.id} collectionName={uploadTarget.collectionName} studentName={uploadTarget.fullName} category={uploadTarget.category} onComplete={() => { alert("Documents uploaded and linked successfully!"); setIsUploadModalOpen(false); setUploadTarget(null); }} />
          </div>
        </div>
      )}

      {/* DOCUMENTS VIEWER MODAL */}
      {docsModalOpen && selectedDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FileText size={24} className="text-blue-600"/> Documents Manager</h3>
              <button onClick={() => setDocsModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"><X size={20}/></button>
            </div>
            <p className="text-sm text-gray-500 mb-4 font-medium">Student: <span className="text-gray-900">{selectedStudentName}</span></p>
            
            <div className="space-y-3">
              {selectedDocs.profilePicUrl && (
                <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <span className="font-bold text-blue-800 text-sm">🖼️ Passport Photo</span>
                  <div className="flex gap-2">
                    <a href={selectedDocs.profilePicUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg text-xs font-bold transition-all">View</a>
                    <a href={getDownloadUrl(selectedDocs.profilePicUrl)} download className="px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold shadow-sm transition-all">Download</a>
                  </div>
                </div>
              )}
              {selectedDocs.signatureUrl && (<div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl"><span className="font-bold text-blue-800 text-sm">✍️ Signature</span><div className="flex gap-2"><a href={selectedDocs.signatureUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg text-xs font-bold transition-all">View</a><a href={getDownloadUrl(selectedDocs.signatureUrl)} download className="px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold shadow-sm transition-all">Download</a></div></div>)}
              {selectedDocs.tenthUrl && (<div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl"><span className="font-bold text-indigo-800 text-sm">📄 10th Marksheet</span><div className="flex gap-2"><a href={selectedDocs.tenthUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 rounded-lg text-xs font-bold transition-all">View</a><a href={getDownloadUrl(selectedDocs.tenthUrl)} download className="px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold shadow-sm transition-all">Download</a></div></div>)}
              {selectedDocs.domicileUrl && (<div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl"><span className="font-bold text-indigo-800 text-sm">📄 Niwash Praman</span><div className="flex gap-2"><a href={selectedDocs.domicileUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 rounded-lg text-xs font-bold transition-all">View</a><a href={getDownloadUrl(selectedDocs.domicileUrl)} download className="px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold shadow-sm transition-all">Download</a></div></div>)}
              {selectedDocs.casteUrl && (<div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl"><span className="font-bold text-indigo-800 text-sm">📄 Caste Cert.</span><div className="flex gap-2"><a href={selectedDocs.casteUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 rounded-lg text-xs font-bold transition-all">View</a><a href={getDownloadUrl(selectedDocs.casteUrl)} download className="px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold shadow-sm transition-all">Download</a></div></div>)}
            </div>
            <button onClick={() => setDocsModalOpen(false)} className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-all">Close</button>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-gray-900 text-white hidden md:flex flex-col flex-shrink-0 z-20">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl">EF</div>
          <span className="text-2xl font-extrabold italic">EduFill</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-3 mt-4">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><LayoutDashboard size={20}/> Dashboard</button>
          
          <button onClick={() => setActiveTab('missing')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'missing' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <div className="flex items-center gap-3"><FileWarning size={20}/> Missing Items</div>
            {pendingMissingCount > 0 && (<span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingMissingCount}</span>)}
          </button>

          <button onClick={() => setActiveTab('camps')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'camps' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <div className="flex items-center gap-3"><Building size={20}/> Camp Requests</div>
            {campRequests.filter(c => c.status === 'New Request').length > 0 && (<span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{campRequests.filter(c => c.status === 'New Request').length} New</span>)}
          </button>

          <button onClick={() => setActiveTab('liveController')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'liveController' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Settings size={20}/> Form Settings</button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-3 text-gray-400 hover:text-red-400 w-full px-4 py-3 rounded-xl font-medium transition-colors"><LogOut size={20}/> Logout</button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        
        {/* TAB 1: DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
           <div className="animate-in fade-in duration-500">
             <header className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-8">
              <div><h1 className="text-3xl font-extrabold text-gray-900">Database Overview</h1><p className="text-gray-500 mt-1">Real-time student booking records</p></div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100"><Radio size={16} className="text-emerald-500 animate-pulse" /><span className="text-sm font-bold text-emerald-700">Live Sync Active</span></div>
                <button onClick={() => setIsWalkInModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full shadow-md transition-all font-bold text-sm"><PlusCircle size={16} /> Add Walk-in</button>
                <button onClick={exportToExcel} className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-5 py-2 rounded-full shadow-md transition-all font-bold text-sm"><Download size={16} /> Export Data</button>
              </div>
            </header>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col xl:flex-row gap-4 justify-between xl:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-gray-500 font-bold mr-2 text-sm"><Filter size={16} /> Filters:</div>
                {['All', 'Ribosome', 'Unacademy', 'Others'].map(category => (
                  <button key={category} onClick={() => setActiveFilter(category)} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${activeFilter === category ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
                    {category} {category === 'All' && `(${bookings.length})`}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                <div className="relative flex-1 xl:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search Application, Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"/>
                </div>
                <div className="relative">
                  <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-600 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all cursor-pointer"/>
                </div>
                {(searchQuery || dateFilter || activeFilter !== 'All') && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-full transition-all"><X size={14} /> Clear</button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Users size={24}/></div><div><p className="text-xs text-gray-500 font-bold uppercase">Total Leads</p><p className="text-2xl font-black text-gray-900">{filteredBookings.length}</p></div></div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><div className="bg-amber-100 p-3 rounded-xl text-amber-600"><Clock size={24}/></div><div><p className="text-xs text-gray-500 font-bold uppercase">Pending</p><p className="text-2xl font-black text-gray-900">{pendingCount}</p></div></div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><CheckCircle size={24}/></div><div><p className="text-xs text-gray-500 font-bold uppercase">Completed</p><p className="text-2xl font-black text-gray-900">{completedCount}</p></div></div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"><div className="bg-purple-100 p-3 rounded-xl text-purple-600"><IndianRupee size={24}/></div><div><p className="text-xs text-gray-500 font-bold uppercase">Revenue</p><p className="text-2xl font-black text-gray-900">₹{totalPaidAmount}</p></div></div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50"><h2 className="text-xl font-bold text-gray-800">Application Records</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-gray-100">
                      <th className="p-4 font-semibold">Student Info</th>
                      <th className="p-4 font-semibold">Exam details</th>
                      <th className="p-4 font-semibold">Appointment</th>
                      <th className="p-4 font-semibold w-48">Status Tracker</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-medium">Fetching real-time records...</td></tr>
                    ) : filteredBookings.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-gray-500">No records found.</td></tr>
                    ) : (
                      filteredBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                          <td className="p-4 align-top">
                            <p className="font-bold text-gray-900">{booking.fullName}</p>
                            <p className="text-sm text-gray-500">{booking.mobile}</p>
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded mt-1 inline-block font-bold">{booking.category}</span>
                          </td>
                          <td className="p-4 align-top">
                            <p className="font-bold text-blue-900">{booking.exam}</p>
                            <p className="text-sm text-gray-600">{booking.institute}</p>
                            {booking.batchName && <p className="text-xs text-emerald-600 font-medium mt-1">Batch: {booking.batchName}</p>}
                          </td>
                          <td className="p-4 align-top">
                            <p className="font-bold text-gray-800">{booking.slotDate}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mb-1"><Clock size={14}/> {booking.slotTime}</p>
                          </td>
                          <td className="p-4 align-top">
                            <p className="font-black text-indigo-600 text-sm mb-2">{booking.tokenNumber}</p>
                            <div className="flex gap-2 items-center mb-2 flex-wrap">
                              <span className={`px-2 py-1 rounded text-[11px] font-bold ${booking.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{booking.status || 'Pending'}</span>
                              {booking.paymentStatus === 'Paid' ? (
                                <div className="flex items-center gap-1">
                                  <span className="px-2 py-1 rounded text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1"><CheckCircle size={10}/> ₹{booking.paymentAmount}</span>
                                  <button onClick={() => openPaymentModal(booking)} className="text-gray-400 hover:text-blue-500 p-1 bg-gray-100 rounded" title="Edit Payment Data"><Edit size={12} /></button>
                                </div>
                              ) : (
                                <button onClick={() => openPaymentModal(booking)} className="px-2 py-1 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">Payment Due</button>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 mt-2">
                              <button onClick={() => togglePhotoDeliveryStatus(booking.id, booking.collectionName, booking.photoDelivered)} className={`flex w-fit items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all border ${booking.photoDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                <Camera size={12}/> {booking.photoDelivered ? 'Photos Delivered ✅' : 'Give Photos 📸'}
                              </button>
                              <button onClick={() => toggleConfirmationStatus(booking.id, booking.collectionName, booking.confirmationDelivered)} className={`flex w-fit items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all border ${booking.confirmationDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                <Printer size={12}/> {booking.confirmationDelivered ? 'Confirmation Given ✅' : 'Give Confirmation 📄'}
                              </button>
                            </div>
                            {booking.applicationNumber && booking.applicationNumber !== 'N/A' && (
                              <p className="text-[11px] font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded inline-block mt-2">App No: {booking.applicationNumber}</p>
                            )}
                          </td>
                          <td className="p-4 align-top">
                            <div className="flex items-center justify-end gap-2">
                              {booking.documents ? (
                                <button onClick={() => openDocsModal(booking.documents, booking.fullName)} className="flex items-center justify-center p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors border border-blue-100"><FileText size={18}/></button>
                              ) : (
                                <button onClick={() => { setUploadTarget(booking); setIsUploadModalOpen(true); }} className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg transition-all shadow-sm"><Upload size={14}/> Upload</button>
                              )}
                              <a href={`https://wa.me/91${booking.mobile}?text=Hello ${booking.fullName}...`} target="_blank" rel="noreferrer" className="flex items-center justify-center p-2 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-lg transition-colors border border-green-100"><MessageCircle size={18}/></a>
                              {booking.status !== 'Completed' && (
                                <button onClick={() => markAsCompleted(booking.id, booking.collectionName)} className="flex items-center justify-center p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors border border-emerald-100"><CheckCircle size={18}/></button>
                              )}
                              <button onClick={() => deleteBooking(booking.id, booking.collectionName)} className="flex items-center justify-center p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100"><Trash2 size={18}/></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
           </div>
        )}

        {/* 🌟 MISSING REQUESTS TAB 🌟 */}
        {activeTab === 'missing' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="mb-10 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Missing Items Tracker</h1>
                <p className="text-gray-500 mt-1">Manage requests submitted by students for missing photos or confirmation pages</p>
              </div>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Student Reports</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-gray-100">
                      <th className="p-4 font-semibold">Student Name & Contact</th>
                      <th className="p-4 font-semibold">Reported Missing Items</th>
                      <th className="p-4 font-semibold">Date Reported</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {missingRequests.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-medium">🎉 Great! No missing item requests right now.</td></tr>
                    ) : (
                      missingRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-gray-900 text-lg">{req.studentName}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><MessageCircle size={14}/> {req.mobile}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {req.missingItems && req.missingItems.map((item, idx) => (
                                <span key={idx} className="bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-500 font-medium">
                            {formatTime(req.timestamp)}
                          </td>
                          <td className="p-4">
                            {req.status === 'Pending' ? (
                              <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse inline-block">Needs Attention</span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={14}/> Resolved</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {req.status === 'Pending' && (
                                <button onClick={() => resolveMissingRequest(req.id)} className="flex items-center gap-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
                                  <Check size={14}/> Mark Printed
                                </button>
                              )}
                              <button onClick={() => deleteMissingRequest(req.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100">
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CAMP REQUESTS */}
        {activeTab === 'camps' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <header className="mb-10"><h1 className="text-3xl font-extrabold text-gray-900">B2B Camp Inquiries</h1></header>
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50"><h2 className="text-xl font-bold text-gray-800">Institute Leads Directory</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-gray-100"><th className="p-4">Institute</th><th className="p-4">Contact</th><th className="p-4">Volume</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {campRequests.map((camp) => (
                        <tr key={camp.id} className="hover:bg-gray-50">
                          <td className="p-4"><p className="font-bold text-indigo-900 text-lg">{camp.instituteName}</p><p className="text-[10px] text-gray-400 mt-2">Date: {formatTime(camp.timestamp)}</p></td>
                          <td className="p-4"><p className="font-bold">{camp.contactPerson}</p><p className="text-sm text-gray-600">{camp.mobile}</p></td>
                          <td className="p-4"><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold border border-blue-200">{camp.studentCount} Forms</span></td>
                          <td className="p-4"><select value={camp.status || 'New Request'} onChange={(e) => updateCampStatus(camp.id, e.target.value)} className="text-sm font-bold rounded-lg px-2 py-1 outline-none border transition-colors cursor-pointer"><option value="New Request">New Lead</option><option value="Completed">Camp Executed</option></select></td>
                          <td className="p-4 text-right"><button onClick={() => deleteCampRequest(camp.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><Trash2 size={18}/></button></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LIVE CONTROLLER VIEW */}
        {activeTab === 'liveController' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <header className="mb-10"><h1 className="text-3xl font-extrabold text-gray-900">Platform Form Controls</h1></header>
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
              <div className="space-y-5">
                {['neet', 'jee', 'cuet'].map((examKey) => (
                  <div key={examKey} className="flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl border border-gray-200">
                    <div><p className="font-bold text-lg text-gray-800 uppercase tracking-wide">{examKey}</p></div>
                    <button onClick={() => toggleExam(examKey)} className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${liveExams[examKey] ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${liveExams[examKey] ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
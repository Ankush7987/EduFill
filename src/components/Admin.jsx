import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LayoutDashboard, LogOut, Settings, X, Building, FileText, Upload, AlertTriangle, FileWarning, RefreshCw, Loader2, Crop as CropIcon, RotateCw, Menu, UserPlus, Shield, Check, Headphones, Users, ShieldCheck, ShieldAlert, Trash2, Search, Sparkles, UserCog, BookOpen, Calendar } from 'lucide-react'; 
import imageCompression from 'browser-image-compression';
import { jsPDF } from 'jspdf';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { collection, doc, updateDoc, deleteDoc, setDoc, addDoc, serverTimestamp, onSnapshot, query, where, getDocs, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '../firebase'; 

import AdminLogin from './admin/AdminLogin';
import PaymentModal from './admin/PaymentModal';
import WalkInModal from './admin/WalkInModal';
import DocumentUploader from '../components/DocumentUploader';

// 🌟 ALL TAB COMPONENTS 🌟
import DashboardTab from './admin/tabs/DashboardTab';
import TeamTab from './admin/tabs/TeamTab';
import MissingTab from './admin/tabs/MissingTab';
import CampTab from './admin/tabs/CampTab';
import SettingsTab from './admin/tabs/SettingsTab';
import CounsellingLeads from '../components/CounsellingLeads'; 
import PredictorLeadsTab from './admin/tabs/PredictorLeadsTab'; 
import RegisteredUsersTab from './admin/tabs/RegisteredUsersTab'; 
import AgentTrackerTab from './admin/tabs/AgentTrackerTab'; 
import MockTestManagerTab from './admin/tabs/MockTestManagerTab'; 

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true); 
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false); 
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  const [bookings, setBookings] = useState([]);
  const [campRequests, setCampRequests] = useState([]); 
  const [missingRequests, setMissingRequests] = useState([]); 
  const [employees, setEmployees] = useState([]);
  const [liveExams, setLiveExams] = useState({ neet: true, jee: false, cuet: false });
  const [loading, setLoading] = useState(true);
  
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const [predictorLeads, setPredictorLeads] = useState([]);

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
  
  const [empForm, setEmpForm] = useState({ 
    name: '', pin: '', institute: 'Ribosome Institute', agentRole: 'Form Filling (NEET/JEE)' 
  });
  const [savingEmp, setSavingEmp] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const adminEmails = [
          'admin@edufill.com', 
          'officialankush84ya@gmail.com', 
          'ankushchaurasiya8@gmail.com'
        ];
        
        let isFirestoreAdmin = false;
        try {
          const userDoc = await getDoc(doc(db, "Users", user.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            isFirestoreAdmin = true;
          }
        } catch(err) {
          console.error("Role check failed", err);
        }

        if (adminEmails.includes(user.email) || isFirestoreAdmin) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

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

    const qUsers = query(collection(db, 'Users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = [];
      snapshot.forEach(doc => usersData.push({ id: doc.id, ...doc.data() }));
      usersData.sort((a, b) => (b.createdAt?.toMillis() || Date.now()) - (a.createdAt?.toMillis() || Date.now()));
      setRegisteredUsers(usersData);
    });

    const qPredictor = query(collection(db, 'Predictor_Requests'));
    const unsubPredictor = onSnapshot(qPredictor, (snapshot) => {
      const leadsData = [];
      snapshot.forEach(doc => leadsData.push({ id: doc.id, ...doc.data() }));
      leadsData.sort((a, b) => (b.timestamp?.toMillis() || Date.now()) - (a.timestamp?.toMillis() || Date.now()));
      setPredictorLeads(leadsData);
    });

    return () => { unsubSettings(); unsubBookings.forEach(unsub => unsub()); unsubCamps(); unsubMissing(); unsubEmp(); unsubUsers(); unsubPredictor(); };
  }, [isAuthenticated]);

  // 🚀 FIXED: PURE FIREBASE AUTHENTICATION 🚀
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(''); // Purane errors ko clear karne ke liye
    
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      localStorage.setItem('edufill_admin_auth', 'true'); 
      // Login successful hone par useEffect (onAuthStateChanged) khud role check kar lega
    } catch (err) {
      console.error("Login Error:", err);
      setError('❌ Incorrect Email or Password! Access Denied.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      localStorage.removeItem('edufill_admin_auth');
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  const toggleExam = async (examKey) => {
    const newStatus = { ...liveExams, [examKey]: !liveExams[examKey] };
    try { await setDoc(doc(db, "Settings", "LiveExams"), newStatus); } catch (error) { console.error(error); }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setSavingEmp(true);
    try {
      await addDoc(collection(db, 'Employees'), { 
        name: empForm.name, 
        pin: empForm.pin, 
        institute: empForm.institute, 
        role: empForm.agentRole,
        assignedCount: 0, 
        active: true,
        leaves: [], 
        breakMinutesToday: 0 
      });
      setIsEmployeeModalOpen(false); 
      setEmpForm({ name: '', pin: '', institute: 'Ribosome Institute', agentRole: 'Form Filling (NEET/JEE)' }); 
      alert("Employee Added Successfully!");
    } catch (err) { console.error(err); } finally { setSavingEmp(false); }
  };

  const deleteEmployee = async (id) => {
    if(window.confirm("Are you sure you want to remove this employee?")) { try { await deleteDoc(doc(db, "Employees", id)); } catch (err) { console.error(err); } }
  };

  const deleteRegisteredUser = async (id, name) => {
    if(window.confirm(`Delete ${name}'s account permanently?`)) { 
      try { await deleteDoc(doc(db, "Users", id)); } catch (err) { console.error(err); } 
    }
  };

  const toggleUserRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    try { await updateDoc(doc(db, "Users", id), { role: newRole }); } catch (error) { console.error(error); }
  };

  const deletePredictorLead = async (id) => {
    if(window.confirm("Delete this predictor lead?")) { 
      try { await deleteDoc(doc(db, "Predictor_Requests", id)); } catch (err) { console.error(err); } 
    }
  };

  const updatePredictorStatus = async (id, newStatus) => {
    try { await updateDoc(doc(db, "Predictor_Requests", id), { status: newStatus }); } 
    catch (err) { console.error(err); }
  };

  const markAsCompleted = async (id, colName) => {
    const appNumber = window.prompt("Enter Application Number:");
    if (appNumber !== null) { try { await updateDoc(doc(db, colName, id), { status: 'Completed', applicationNumber: appNumber || 'N/A' }); } catch (err) { console.error(err); } }
  };

  const deleteBooking = async (id, colName) => {
    if(window.confirm("Delete this booking?")) { try { await deleteDoc(doc(db, colName, id)); } catch (err) { console.error(err); } }
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

  const formatTime = (t) => { if (!t) return "Just Now"; if (typeof t.toDate !== 'function') return "Processing..."; return t.toDate().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }); };

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
      setSelectedStudent({ ...selectedStudent, documents: updatedDocsMap }); alert("Document Replaced Successfully!");
    } catch (err) { console.error(err); } finally { setReplacingDoc(null); }
  };

  // 🚀 PERFORMANCE UPGRADE: useMemo applied to prevent heavy re-calculations 🚀
  const allAgentsList = useMemo(() => {
    return [...new Set([...employees.map(e => e.name), ...bookings.map(b => b.assignedTo).filter(a => a && a !== 'Unassigned')])].sort();
  }, [employees, bookings]);

  const approvedInstitutesList = useMemo(() => {
    return [...new Set(campRequests.filter(c => c.status === 'Completed').map(c => c.instituteName))].filter(n => n !== 'Ribosome Institute' && n !== 'Unacademy');
  }, [campRequests]);
  
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      let catMatch = activeFilter === 'All' || (activeFilter === 'Others' ? b.collectionName === 'Other_Students' : b.collectionName.includes(activeFilter));
      let searchMatch = !searchQuery || (b.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || b.mobile?.includes(searchQuery) || b.tokenNumber?.toLowerCase().includes(searchQuery.toLowerCase()));
      let dateMatch = !dateFilter || b.slotDate === dateFilter;
      let agentMatch = agentFilter === 'All' || (b.assignedTo || 'Unassigned') === agentFilter;
      return catMatch && searchMatch && dateMatch && agentMatch;
    });
  }, [bookings, activeFilter, searchQuery, dateFilter, agentFilter]);

  const filteredRegisteredUsers = useMemo(() => {
    return registeredUsers.filter(u => 
      !userSearchTerm || 
      u.fullName?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
      u.phone?.includes(userSearchTerm) ||
      u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [registeredUsers, userSearchTerm]);

  const clearFilters = () => { setSearchQuery(''); setDateFilter(''); setActiveFilter('All'); setAgentFilter('All'); };
  
  const exportToExcel = () => {
    if (filteredBookings.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Token Number", "Full Name", "Mobile", "Category", 
      "Exam/Target", "Institute", "Batch", "Status", 
      "Application No", "Payment Status", "Assigned Agent", "Booking Date"
    ];

    const csvRows = filteredBookings.map(b => {
      return [
        b.tokenNumber || 'N/A',
        `"${b.fullName || ''}"`, 
        b.mobile || '',
        b.category || '',
        b.examTarget || b.exam || '',
        b.institute || '',
        `"${b.batchName || ''}"`,
        b.status || '',
        b.applicationNumber || '',
        b.paymentStatus || '',
        b.assignedTo || 'Unassigned',
        b.slotDate || ''
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `EduFill_Leads_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPredictorToCSV = () => {
    if (predictorLeads.length === 0) {
      alert("No predictor leads available to export.");
      return;
    }

    const headers = [
      "Student Name", "Mobile", "Exam", "Category", "State", 
      "Dream College", "Score", "AI Result", "Status", "Date"
    ];

    const csvRows = predictorLeads.map(lead => {
      let dateStr = lead.timestamp && typeof lead.timestamp.toDate === 'function' 
        ? new Date(lead.timestamp.toDate()).toLocaleDateString('en-IN') 
        : 'N/A';

      return [
        `"${lead.studentName || 'Guest User'}"`, 
        lead.mobile || '',
        lead.exam || '',
        lead.category || '',
        `"${lead.state || ''}"`,
        `"${lead.dream || ''}"`,
        lead.score || '',
        lead.result || '',
        lead.status || '',
        `"${dateStr}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Predictor_Leads_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUsersToCSV = () => {
    if (filteredRegisteredUsers.length === 0) {
      alert("No registered users available to export.");
      return;
    }

    const headers = [
      "Student Name", "Mobile", "Email", "Qualification", 
      "Signup Method", "Role", "Registration Date"
    ];

    const csvRows = filteredRegisteredUsers.map(user => {
      let dateStr = user.createdAt && typeof user.createdAt.toDate === 'function' 
        ? new Date(user.createdAt.toDate()).toLocaleDateString('en-IN') 
        : 'N/A';

      return [
        `"${user.fullName || 'No Name'}"`, 
        user.phone || 'N/A',
        user.email || 'N/A',
        `"${user.qualification || 'N/A'}"`,
        user.signupMethod || 'N/A',
        user.role || 'student',
        `"${dateStr}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Registered_Users_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const pendingCount = useMemo(() => filteredBookings.filter(b => b.status === 'Pending').length, [filteredBookings]);
  const completedCount = useMemo(() => filteredBookings.filter(b => b.status === 'Completed').length, [filteredBookings]);
  const totalPaidAmount = useMemo(() => filteredBookings.reduce((sum, b) => b.paymentStatus === 'Paid' ? sum + Number(b.paymentAmount || 0) : sum, 0), [filteredBookings]);
  const pendingMissingCount = useMemo(() => missingRequests.filter(m => m.status === 'Pending').length, [missingRequests]);
  const newPredictorLeadsCount = useMemo(() => predictorLeads.filter(p => p.status === 'New Request' || p.status === 'New Lead').length, [predictorLeads]);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  // 🌟 REDESIGNED LOGIN SCREEN 🌟
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <form onSubmit={handleLogin} className="bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl w-full max-w-md border border-gray-100 relative z-10 animate-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border-b-4 border-gray-950">
              <ShieldCheck size={36} className="text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Admin Vault</h2>
            <p className="text-gray-500 text-sm mt-2 font-medium">Secure access for authorized personnel only</p>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-bold text-gray-700 transition-all shadow-sm"
                placeholder="admin@edufill.com" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Master Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-3.5 outline-none font-black tracking-widest text-gray-700 transition-all shadow-sm"
                placeholder="••••••••" 
                required 
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-2 text-red-600 font-bold text-xs animate-in slide-in-from-top-2">
                <AlertTriangle size={16} /> {error}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2 mt-4 border border-gray-800"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : 'Authenticate'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 🌟 MAIN ADMIN DASHBOARD LAYOUT 🌟
  return (
    <div className="h-screen bg-[#F1F5F9] flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center shadow-lg z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="font-black text-white text-lg">EF</span>
          </div>
          <span className="text-xl font-black tracking-tight">Admin Vault</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"><Menu size={24} /></button>
      </div>

      {/* ALL MODALS */}
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} paymentData={paymentData} setPaymentData={setPaymentData} submitPayment={submitPayment} savingPayment={savingPayment} />
      <WalkInModal isOpen={isWalkInModalOpen} onClose={() => setIsWalkInModalOpen(false)} walkInForm={walkInForm} handleWalkInChange={handleWalkInChange} submitWalkIn={submitWalkIn} savingWalkIn={savingWalkIn} approvedInstitutes={approvedInstitutesList} />

      {/* EMPLOYEE CREATION MODAL */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300 border border-gray-100">
            <button onClick={() => setIsEmployeeModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={20}/></button>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><UserPlus size={24}/></div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Add Agent</h2>
                <p className="text-xs font-bold text-gray-500">Create a new team member access</p>
              </div>
            </div>
            
            <form onSubmit={handleAddEmployee} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Full Name</label>
                <input type="text" required value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-700" />
              </div>
              
              <div>
                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Secret PIN (4-Digits)</label>
                <input type="password" required maxLength="4" pattern="\d{4}" value={empForm.pin} onChange={e => setEmpForm({...empForm, pin: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-black tracking-widest text-gray-900" />
              </div>
              
              <div>
                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Role / Task</label>
                <select value={empForm.agentRole} onChange={e => setEmpForm({...empForm, agentRole: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-700">
                  <option value="Form Filling (NEET/JEE)">Form Filling (NEET/JEE)</option>
                  <option value="12th Counselling">12th Counselling</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Assigned Institute</label>
                <select value={empForm.institute} onChange={e => setEmpForm({...empForm, institute: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-700">
                  <option value="Ribosome Institute">Ribosome Institute</option>
                  <option value="Unacademy">Unacademy</option>
                  <option value="Others">Others</option>
                  {approvedInstitutesList.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                </select>
              </div>

              <button disabled={savingEmp} type="submit" className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-transform active:scale-95">
                {savingEmp ? <Loader2 size={20} className="animate-spin"/> : <Check size={20}/>} Create Agent
              </button>
            </form>
          </div>
        </div>
      )}

      {replaceCropModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl flex flex-col overflow-hidden max-h-[90vh] shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="font-black text-gray-900 flex items-center gap-2 text-lg"><CropIcon size={20} className="text-emerald-600"/> Adjust Image</h3>
              <button onClick={() => setReplaceCropModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-4 flex justify-center custom-scrollbar">
              <ReactCrop crop={replaceCrop} onChange={(_, c) => setReplaceCrop(c)} onComplete={c => setReplaceCompletedCrop(c)}>
                <img ref={replaceImgRef} src={replaceImgSrc} onLoad={onReplaceImageLoad} alt="Crop" className="rounded-xl shadow-sm border border-gray-200" style={{ maxHeight: '50vh' }}/>
              </ReactCrop>
            </div>
            <div className="p-5 bg-white border-t border-gray-100 flex gap-4">
              <button onClick={handleReplaceCropSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-md transition-transform active:scale-95">Confirm & Process</button>
            </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && uploadTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-3xl relative shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
              <span className="font-black text-gray-800 flex items-center gap-2"><Upload size={18} className="text-emerald-600"/> Secure Upload Gateway</span>
              <button onClick={() => setIsUploadModalOpen(false)} className="bg-white border border-gray-200 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={16}/></button>
            </div>
            <div className="p-2 md:p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <DocumentUploader studentId={uploadTarget.id} collectionName={uploadTarget.collectionName} studentName={uploadTarget.fullName} category={uploadTarget.category} onComplete={() => { alert("All Documents Uploaded Successfully!"); setIsUploadModalOpen(false); setUploadTarget(null); }} />
            </div>
          </div>
        </div>
      )}

      {/* ADMIN DOCUMENT VAULT MODAL */}
      {docsModalOpen && selectedStudent && selectedStudent.documents && (
         <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col border border-gray-100">
             <button onClick={() => setDocsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={20}/></button>
             
             <div className="mb-6 border-b border-gray-100 pb-5">
               <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full mb-3 border border-emerald-100">Vault Access</div>
               <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">{selectedStudent.fullName}</h3>
               <p className="text-gray-500 font-bold mt-1 flex items-center gap-2"><Phone size={14}/> {selectedStudent.phone || selectedStudent.mobile}</p>
             </div>

             <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar pb-4">
               {[ 
                 { key: 'profilePicUrl', label: 'Passport Photo', icon: '🖼️' }, 
                 { key: 'signatureUrl', label: 'Signature', icon: '✍️' }, 
                 { key: 'thumbUrl', label: 'Thumb Impression', icon: '👍' }, 
                 { key: 'aadharUrl', label: 'Aadhar Card', icon: '🪪' }, 
                 { key: 'tenthUrl', label: '10th Marksheet', icon: '📄' }, 
                 { key: 'twelfthUrl', label: '12th Marksheet', icon: '📄' }, 
                 { key: 'casteUrl', label: 'Caste Certificate', icon: '📜' }, 
                 { key: 'domicileUrl', label: 'Niwash Praman', icon: '🏠' } 
               ].map((item) => {
                 const url = selectedStudent.documents[item.key]; 
                 if (!url) return null; 
                 return (
                   <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl gap-4 hover:shadow-sm transition-shadow">
                     <span className="font-bold text-gray-800 flex items-center gap-2"><span className="text-lg">{item.icon}</span> {item.label}</span>
                     <div className="flex gap-2 w-full sm:w-auto">
                       <a href={url} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none text-center px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-xs hover:border-gray-300 transition-colors shadow-sm">View</a>
                       <label className="flex-1 sm:flex-none text-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 transition-colors text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm">
                         Replace File
                         <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleReplaceFileChange(e, item.key)} />
                       </label>
                     </div>
                   </div>
                 )
               })}
               {Object.keys(selectedStudent.documents).length === 0 && (
                 <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
                   <FileText size={40} className="text-gray-300 mx-auto mb-3"/>
                   <p className="text-gray-500 font-bold">Vault is Empty</p>
                   <p className="text-gray-400 text-sm mt-1">No documents have been uploaded yet.</p>
                 </div>
               )}
             </div>
          </div>
         </div>
      )}

      {/* 🌟 PREMIUM SIDEBAR (Dark Modern Theme) With Invisible Scrollbar 🌟 */}
      <aside className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-50 w-72 bg-[#0F172A] text-white flex flex-col flex-shrink-0 shadow-2xl border-r border-gray-800`}>
        <div className="p-6 border-b border-gray-800 flex items-center gap-4 bg-[#0B1120]">
          <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg border-b-2 border-emerald-700">
            <span className="font-black text-white text-xl">EF</span>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Admin Vault</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Control Center</p>
          </div>
        </div>
        
        {/* 🌟 SCROLLBAR FIXED HERE: Custom CSS classes added to hide scrollbar while keeping scroll active 🌟 */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 ml-2 mt-2">Operations</div>
          
          <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[inset_4px_0_0_0_#10B981]' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'}`}>
            <LayoutDashboard size={20}/> Dashboard
          </button>
          
          <button onClick={() => { setActiveTab('counselling'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${activeTab === 'counselling' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[inset_4px_0_0_0_#10B981]' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'}`}>
            <Headphones size={20}/> Counselling Leads
          </button>

          <button onClick={() => { setActiveTab('predictor'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${activeTab === 'predictor' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[inset_4px_0_0_0_#F97316]' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'}`}>
            <div className="flex items-center gap-3"><Sparkles size={20}/> AI Predictor Leads</div>
            {newPredictorLeadsCount > 0 && <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">{newPredictorLeadsCount} New</span>}
          </button>

          <button onClick={() => { setActiveTab('missing'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${activeTab === 'missing' ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[inset_4px_0_0_0_#EF4444]' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'}`}>
            <div className="flex items-center gap-3"><FileWarning size={20}/> Missing Docs</div>
            {pendingMissingCount > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">{pendingMissingCount}</span>}
          </button>
          
          <button onClick={() => { setActiveTab('camps'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${activeTab === 'camps' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[inset_4px_0_0_0_#6366F1]' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'}`}>
            <div className="flex items-center gap-3"><Building size={20}/> B2B Camp Requests</div>
            {campRequests.filter(c => c.status === 'New Request').length > 0 && <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">New</span>}
          </button>

          <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 ml-2 mt-8">Database & Engine</div>

          <button onClick={() => { setActiveTab('mockTests'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${activeTab === 'mockTests' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[inset_4px_0_0_0_#A855F7]' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'}`}>
            <BookOpen size={20}/> Live Mock Engine
          </button>

          <button onClick={() => { setActiveTab('registeredUsers'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${activeTab === 'registeredUsers' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[inset_4px_0_0_0_#3B82F6]' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'}`}>
            <Users size={20}/> Users Database
          </button>
          
          <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 ml-2 mt-8">Management</div>

          <button onClick={() => { setActiveTab('team'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${activeTab === 'team' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[inset_4px_0_0_0_#F59E0B]' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'}`}>
            <Shield size={20}/> Team Management
          </button>
          
          <button onClick={() => { setActiveTab('agentTracker'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${activeTab === 'agentTracker' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[inset_4px_0_0_0_#06B6D4]' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'}`}>
            <UserCog size={20}/> Agent Tracker
          </button>
          
          <button onClick={() => { setActiveTab('liveController'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${activeTab === 'liveController' ? 'bg-gray-100 text-gray-900 border border-gray-200 shadow-[inset_4px_0_0_0_#111827]' : 'text-gray-400 hover:text-gray-100 hover:bg-white/5 border border-transparent'}`}>
            <Settings size={20}/> Form Settings
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800 bg-[#0B1120]">
          <button onClick={handleLogout} className="flex justify-center items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 w-full py-3.5 rounded-xl font-black text-sm transition-colors group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/> Secure Logout
          </button>
        </div>
      </aside>

      {/* 🌟 MAIN CONTENT AREA (Premium Light Canvas) 🌟 */}
      <main className="flex-1 overflow-y-auto relative bg-[#F8FAFC]">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNFMkU4RjAiLz48L3N2Zz4=')] opacity-50 z-0 pointer-events-none"></div>
        
        <div className="relative z-10 p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto">
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

          {activeTab === 'mockTests' && <MockTestManagerTab />}

          {activeTab === 'agentTracker' && <AgentTrackerTab employees={employees} />}

          {activeTab === 'predictor' && (
            <PredictorLeadsTab 
              predictorLeads={predictorLeads} 
              formatTime={formatTime} 
              updatePredictorStatus={updatePredictorStatus} 
              deletePredictorLead={deletePredictorLead} 
              exportPredictorToCSV={exportPredictorToCSV} 
            />
          )}

          {activeTab === 'registeredUsers' && (
            <RegisteredUsersTab 
              filteredRegisteredUsers={filteredRegisteredUsers} 
              userSearchTerm={userSearchTerm} 
              setUserSearchTerm={setUserSearchTerm} 
              setSelectedStudent={setSelectedStudent} 
              setDocsModalOpen={setDocsModalOpen} 
              toggleUserRole={toggleUserRole} 
              deleteRegisteredUser={deleteRegisteredUser} 
              exportUsersToCSV={exportUsersToCSV} 
            />
          )}

          {activeTab === 'counselling' && <CounsellingLeads />}

          {activeTab === 'team' && (
            <TeamTab 
              employees={employees} empInstituteFilter={empInstituteFilter} setEmpInstituteFilter={setEmpInstituteFilter} 
              approvedInstitutesList={approvedInstitutesList} setIsEmployeeModalOpen={setIsEmployeeModalOpen} deleteEmployee={deleteEmployee} 
            />
          )}

          {activeTab === 'missing' && <MissingTab missingRequests={missingRequests} formatTime={formatTime} resolveMissingRequest={resolveMissingRequest} deleteMissingRequest={deleteMissingRequest} />}

          {activeTab === 'camps' && <CampTab campRequests={campRequests} formatTime={formatTime} updateCampStatus={updateCampStatus} deleteCampRequest={deleteCampRequest} />}

          {activeTab === 'liveController' && <SettingsTab liveExams={liveExams} toggleExam={toggleExam} />}
        </div>
      </main>
    </div>
  );
}
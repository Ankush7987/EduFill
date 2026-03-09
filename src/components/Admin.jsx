import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Users, LogOut, CheckCircle, Check, Clock, Trash2, Power, Settings, Radio, Filter, Search, X, Download, MessageCircle, PlusCircle, IndianRupee, Edit, Building, MapPin, FileText, Upload, Camera, Printer, AlertTriangle, FileWarning, RefreshCw, Loader2, Crop as CropIcon, RotateCw, Menu, Calendar, UserPlus, Shield, UserCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { jsPDF } from 'jspdf';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { collection, doc, updateDoc, deleteDoc, setDoc, addDoc, serverTimestamp, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; 

import AdminLogin from './admin/AdminLogin';
import PaymentModal from './admin/PaymentModal';
import WalkInModal from './admin/WalkInModal';
import DocumentUploader from '../components/DocumentUploader';

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
  
  // 🌟 FILTERS 🌟
  const [activeFilter, setActiveFilter] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [dateFilter, setDateFilter] = useState(''); 
  const [agentFilter, setAgentFilter] = useState('All'); // 🌟 NAYA: Agent Filter State

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
    if (password === 'Ankush@7987') { setIsAuthenticated(true); setError(''); } 
    else { setError('Incorrect Password! Please enter valid credentials.'); }
  };

  const toggleExam = async (examKey) => {
    const newStatus = { ...liveExams, [examKey]: !liveExams[examKey] };
    try { await setDoc(doc(db, "Settings", "LiveExams"), newStatus); } 
    catch (error) { console.error("Error:", error); alert("Failed to update live status!"); }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if(empForm.pin.length !== 4) {
      alert("PIN must be exactly 4 digits for easy agent login.");
      return;
    }
    setSavingEmp(true);
    try {
      await addDoc(collection(db, 'Employees'), {
        name: empForm.name,
        pin: empForm.pin,
        institute: empForm.institute,
        role: 'agent',
        assignedCount: 0,
        createdAt: serverTimestamp(),
        active: true
      });
      setIsEmployeeModalOpen(false);
      setEmpForm({ name: '', pin: '', institute: 'Ribosome Institute' });
      alert("Employee created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add employee");
    } finally {
      setSavingEmp(false);
    }
  };

  const deleteEmployee = async (id) => {
    if(window.confirm("Are you sure you want to remove this employee?")) {
      try { await deleteDoc(doc(db, "Employees", id)); } 
      catch (err) { console.error(err); alert("Failed to delete!"); }
    }
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

  const assignAgent = async (instituteName) => {
    try {
      const q = query(collection(db, "Employees"), where("institute", "==", instituteName), where("active", "==", true));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null; 

      let agents = [];
      querySnapshot.forEach((doc) => {
        agents.push({ id: doc.id, ...doc.data() });
      });

      agents.sort((a, b) => (a.assignedCount || 0) - (b.assignedCount || 0));
      const selectedAgent = agents[0];

      await updateDoc(doc(db, "Employees", selectedAgent.id), {
        assignedCount: (selectedAgent.assignedCount || 0) + 1
      });

      return selectedAgent.name; 
    } catch (error) {
      console.error("Error assigning agent:", error);
      return null;
    }
  };

  const submitWalkIn = async (e) => {
    e.preventDefault(); setSavingWalkIn(true);
    try {
      let collectionName = "Other_Students"; 
      if (walkInForm.institute === "Ribosome Institute") collectionName = "Ribosome_Students";
      else if (walkInForm.institute === "Unacademy") collectionName = "Unacademy_Students";

      const assignedAgentName = await assignAgent(walkInForm.institute);

      const newDocRef = await addDoc(collection(db, collectionName), { 
        ...walkInForm, 
        tokenNumber: generateToken(), 
        status: 'Pending', 
        paymentStatus: 'Due', 
        photoDelivered: false, 
        confirmationDelivered: false, 
        assignedTo: assignedAgentName || 'Unassigned',
        timestamp: serverTimestamp() 
      });

      const savedStudentDetails = { id: newDocRef.id, collectionName: collectionName, fullName: walkInForm.fullName, category: walkInForm.category };
      setIsWalkInModalOpen(false); setWalkInForm({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: '', slotTime: '' });
      
      if(window.confirm(`Successfully Added: ${savedStudentDetails.fullName}\nAssigned to: ${assignedAgentName || 'Admin'}\n\nDo you want to upload their documents now?`)) {
        setUploadTarget(savedStudentDetails); setTimeout(() => setIsUploadModalOpen(true), 300);
      }
    } catch (err) { console.error("Error:", err); alert("Failed to add walk-in student."); } 
    finally { setSavingWalkIn(false); }
  };

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
    if (typeof timestamp.toDate !== 'function') return "Processing...";
    const date = timestamp.toDate();
    return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const processPassportPhoto = async (croppedBlob, name) => {
    let finalBlobToProcess = croppedBlob;
    let isBgRemoved = false; 

    try {
      const apiKey = "navkJvJVi2bg4G2bTWLJDWva"; 
      if (apiKey) {
        const smallBlob = await imageCompression(croppedBlob, { maxSizeMB: 2, maxWidthOrHeight: 1000 });
        const formData = new FormData();
        formData.append('image_file', smallBlob, 'photo.jpg');
        formData.append('size', 'auto');

        const response = await fetch('https://api.remove.bg/v1.0/removebg', { method: 'POST', headers: { 'X-Api-Key': apiKey }, body: formData });
        if (response.ok) { finalBlobToProcess = await response.blob(); isBgRemoved = true; }
      }
    } catch (error) { console.warn("API Error:", error); }

    const imageBmp = await createImageBitmap(finalBlobToProcess);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const finalWidth = 413; const finalHeight = 531; const textAreaHeight = 85;
    const photoHeight = finalHeight - textAreaHeight; 
    canvas.width = finalWidth; canvas.height = finalHeight; 
    
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, finalWidth, photoHeight); ctx.clip(); 

    let scale, x, y;
    if (isBgRemoved) { scale = finalWidth / imageBmp.width; x = 0; y = 20; } 
    else { scale = Math.max(finalWidth / imageBmp.width, photoHeight / imageBmp.height); x = (finalWidth / 2) - (imageBmp.width / 2) * scale; y = (photoHeight / 2) - (imageBmp.height / 2) * scale; }
    
    ctx.filter = 'contrast(105%) brightness(102%) saturate(110%)';
    ctx.drawImage(imageBmp, x, y, imageBmp.width * scale, imageBmp.height * scale);
    ctx.restore(); ctx.filter = 'none'; 

    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, photoHeight, finalWidth, textAreaHeight);
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4); 
    ctx.beginPath(); ctx.moveTo(0, photoHeight); ctx.lineTo(finalWidth, photoHeight); ctx.stroke();

    ctx.fillStyle = '#000000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const dateStr = new Date().toLocaleDateString('en-GB'); const safeName = name.toUpperCase().trim();
    let fontSize = 26; ctx.font = `bold ${fontSize}px Arial`;
    while (ctx.measureText(safeName).width > (finalWidth - 20) && fontSize > 12) { fontSize -= 1; ctx.font = `bold ${fontSize}px Arial`; }
    ctx.fillText(safeName, finalWidth / 2, photoHeight + 35);
    ctx.font = 'bold 20px Arial'; ctx.fillText(dateStr, finalWidth / 2, photoHeight + 65);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 1.0));
    return await imageCompression(new File([blob], 'profile.jpg', { type: 'image/jpeg' }), { maxSizeMB: 0.1, maxWidthOrHeight: 800, useWebWorker: true });
  };

  const processDocumentToPDF = async (file, docName) => {
    if (file.type === 'application/pdf') return file; 
    const imageBmp = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const MAX_WIDTH = 1200;
    let width = imageBmp.width; let height = imageBmp.height;
    if (width > MAX_WIDTH) { height = height * (MAX_WIDTH / width); width = MAX_WIDTH; }
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.filter = 'contrast(102%)'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height); ctx.drawImage(imageBmp, 0, 0, width, height); ctx.filter = 'none';
    const imgData = canvas.toDataURL('image/jpeg', 0.8); 
    const pdf = new jsPDF({ orientation: width > height ? 'l' : 'p', unit: 'px', format: [width, height] });
    pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
    const pdfBlob = pdf.output('blob');
    return new File([pdfBlob], `${docName}.pdf`, { type: 'application/pdf' });
  };

  const handleReplaceFileChange = (e, docKey) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      processAndUploadReplace(file, docKey); 
      return;
    }

    setReplaceRawFile(file);
    setReplaceDocKey(docKey);
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setReplaceImgSrc(reader.result);
      setReplaceCompletedCrop(null);
      setReplaceCropModalOpen(true);
    });
    reader.readAsDataURL(file);
  };

  const onReplaceImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    let aspect = undefined;
    if (replaceDocKey === 'profilePicUrl') aspect = 413 / 446; 
    if (replaceDocKey === 'signatureUrl') aspect = 3 / 1; 

    if (aspect) {
      const newCrop = centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height);
      setReplaceCrop(newCrop); setReplaceCompletedCrop(newCrop); 
    } else {
      const fullCrop = { unit: '%', width: 100, height: 100, x: 0, y: 0 };
      setReplaceCrop(fullCrop); setReplaceCompletedCrop(fullCrop);
    }
  };

  const handleReplaceRotate = () => {
    const image = replaceImgRef.current;
    if (!image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.naturalHeight;
    canvas.height = image.naturalWidth;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    setReplaceImgSrc(canvas.toDataURL('image/jpeg', 1.0));
    setReplaceCompletedCrop(null);
  };

  const handleReplaceUseOriginal = () => {
    setReplaceCropModalOpen(false); 
    processAndUploadReplace(replaceRawFile, replaceDocKey);
  };

  const handleReplaceCropSave = async () => {
    if (!replaceCompletedCrop || !replaceCompletedCrop.width || !replaceCompletedCrop.height) {
      handleReplaceUseOriginal(); return;
    }
    const image = replaceImgRef.current;
    let cropX, cropY, cropW, cropH;
    if (replaceCompletedCrop.unit === '%') {
      cropX = (replaceCompletedCrop.x / 100) * image.width; cropY = (replaceCompletedCrop.y / 100) * image.height;
      cropW = (replaceCompletedCrop.width / 100) * image.width; cropH = (replaceCompletedCrop.height / 100) * image.height;
    } else {
      cropX = replaceCompletedCrop.x; cropY = replaceCompletedCrop.y; cropW = replaceCompletedCrop.width; cropH = replaceCompletedCrop.height;
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = cropW * scaleX; canvas.height = cropH * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, cropX * scaleX, cropY * scaleY, cropW * scaleX, cropH * scaleY, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      blob.name = `${replaceDocKey}.jpg`;
      setReplaceCropModalOpen(false);
      processAndUploadReplace(blob, replaceDocKey); 
    }, 'image/jpeg', 1.0);
  };

  const processAndUploadReplace = async (fileBlob, docKey) => {
    setReplacingDoc(docKey); 
    try {
      let finalFile;
      const safeName = selectedStudent.fullName.replace(/[^a-zA-Z0-9]/g, '_');

      if (docKey === 'profilePicUrl') {
        finalFile = await processPassportPhoto(fileBlob, selectedStudent.fullName);
      } else if (docKey === 'signatureUrl') {
        finalFile = await imageCompression(fileBlob, { maxSizeMB: 0.1, maxWidthOrHeight: 800, useWebWorker: true });
      } else {
        finalFile = await processDocumentToPDF(fileBlob, `${safeName}_${docKey}`);
      }

      const formData = new FormData();
      formData.append("file", finalFile);
      formData.append("upload_preset", "edufill_docs"); 
      const response = await fetch(`https://api.cloudinary.com/v1_1/dvocl6wvq/auto/upload`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Upload Failed");

      const newFileUrl = data.secure_url;

      const updatedDocsMap = { ...selectedStudent.documents, [docKey]: newFileUrl };
      await updateDoc(doc(db, selectedStudent.collectionName, selectedStudent.id), { documents: updatedDocsMap });

      setSelectedStudent({ ...selectedStudent, documents: updatedDocsMap });
      alert("Document successfully processed and replaced! ✨");
      
    } catch (err) {
      console.error("Error replacing document:", err);
      alert("Failed to replace document. Please check your connection.");
    } finally {
      setReplacingDoc(null); 
    }
  };

  // 🌟 NAYA: SMART AGENT LIST EXTRACTOR 🌟
  // Yeh list employee list aur past bookings dono mila kar banegi taaki deleted agent bhi filter ho sakein
  const allAgentsList = [...new Set([
    ...employees.map(e => e.name),
    ...bookings.map(b => b.assignedTo).filter(a => a && a !== 'Unassigned')
  ])].sort();

  // 🌟 UPDATE: FILTER LOGIC WITH AGENT FILTER 🌟
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
    
    let dateMatch = true; 
    if (dateFilter) dateMatch = booking.slotDate === dateFilter;

    // 🌟 NAYA: AGENT FILTER MATCH 🌟
    let agentMatch = true;
    if (agentFilter !== 'All') {
      const assigned = booking.assignedTo || 'Unassigned';
      agentMatch = assigned === agentFilter;
    }

    return categoryMatch && searchMatch && dateMatch && agentMatch;
  });

  const clearFilters = () => { 
    setSearchQuery(''); 
    setDateFilter(''); 
    setActiveFilter('All'); 
    setAgentFilter('All'); // Reset Agent filter too
  };

  const exportToExcel = () => {
    let reportHeading = "Complete Application Database";
    if (activeFilter === 'Ribosome') reportHeading = "Ribosome Institute Student Data";
    else if (activeFilter === 'Unacademy') reportHeading = "Unacademy Student Data";
    else if (activeFilter === 'Others') reportHeading = "Other External Student Data";

    const titleRow = `"${reportHeading}"`; const emptyRow = `""`; 
    const headers = ["Token No.", "Student Name", "Mobile", "Category", "Exam", "Institute", "Batch", "Slot Date", "Slot Time", "Form Status", "Payment Status", "Payment Amount", "Payment Method", "Application No.", "Photo Delivered", "Confirmation Delivered", "Applied On", "Assigned Agent"];
    
    const rows = filteredBookings.map(b => [
      b.tokenNumber || 'N/A', b.fullName || 'N/A', b.mobile || 'N/A', b.category || 'N/A', b.exam || 'N/A', b.institute || 'N/A', b.batchName || 'N/A', b.slotDate || 'N/A', b.slotTime || 'N/A', b.status || 'Pending', b.paymentStatus || 'Due', b.paymentAmount ? `₹${b.paymentAmount}` : 'N/A', b.paymentMethod || 'N/A', b.applicationNumber || 'N/A', b.photoDelivered ? 'Yes' : 'No', b.confirmationDelivered ? 'Yes' : 'No', formatTime(b.timestamp), b.assignedTo || 'Unassigned'
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
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      
      <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center shadow-md z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xs">EF</div>
          <span className="text-xl font-extrabold italic tracking-tight">EduFill Admin</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 focus:outline-none hover:bg-gray-800 rounded-md transition-colors">
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} paymentData={paymentData} setPaymentData={setPaymentData} submitPayment={submitPayment} savingPayment={savingPayment} />
      <WalkInModal isOpen={isWalkInModalOpen} onClose={() => setIsWalkInModalOpen(false)} walkInForm={walkInForm} handleWalkInChange={handleWalkInChange} submitWalkIn={submitWalkIn} savingWalkIn={savingWalkIn} approvedInstitutes={approvedInstitutesList} />

      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative my-8 animate-in zoom-in duration-300">
            <button onClick={() => setIsEmployeeModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:text-red-500 transition-colors z-10"><X size={20}/></button>
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4"><UserPlus className="text-indigo-500"/> Add New Agent</h2>
            
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Agent Full Name</label>
                <input type="text" required value={empForm.name} onChange={(e) => setEmpForm({...empForm, name: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Rahul Kumar" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Secret PIN (4-Digits)</label>
                <input type="text" required maxLength="4" pattern="\d{4}" value={empForm.pin} onChange={(e) => setEmpForm({...empForm, pin: e.target.value.replace(/\D/g, '')})} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none tracking-widest font-mono" placeholder="1234" />
                <p className="text-[10px] text-gray-500 mt-1">Agent will use this PIN to login to their portal.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Assigned Institute</label>
                <select value={empForm.institute} onChange={(e) => setEmpForm({...empForm, institute: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                  <option value="Ribosome Institute">Ribosome Institute</option>
                  <option value="Unacademy">Unacademy</option>
                  <option value="Others">Others (Center)</option>
                  {approvedInstitutesList.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                </select>
                <p className="text-[10px] text-indigo-600 font-bold mt-1">Agent will only receive forms from this institute.</p>
              </div>

              <button disabled={savingEmp} type="submit" className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md flex justify-center items-center gap-2">
                {savingEmp ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>} Save Agent
              </button>
            </form>
          </div>
        </div>
      )}

      {replaceCropModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl flex flex-col overflow-hidden max-h-[90vh] shadow-2xl">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-100 bg-white z-10 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2"><CropIcon size={20}/> Adjust Image</h3>
              </div>
              <button onClick={() => setReplaceCropModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-100 p-2 sm:p-4 flex justify-center items-start">
              <ReactCrop crop={replaceCrop} onChange={(_, percentCrop) => setReplaceCrop(percentCrop)} onComplete={(c) => setReplaceCompletedCrop(c)}>
                <img ref={replaceImgRef} src={replaceImgSrc} onLoad={onReplaceImageLoad} alt="Crop preview" className="max-w-full h-auto shadow-md" style={{ maxHeight: '50vh', objectFit: 'contain' }}/>
              </ReactCrop>
            </div>

            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white z-10 shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button onClick={handleReplaceRotate} className="flex-1 flex justify-center items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 rounded-xl transition-colors border border-blue-200">
                <RotateCw size={18}/> Rotate 90°
              </button>
              <button onClick={handleReplaceUseOriginal} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors border border-gray-200">Skip Crop</button>
              <button onClick={handleReplaceCropSave} className="flex-1 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg transition-colors"><Check size={18}/> Process</button>
            </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && uploadTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl relative my-8">
            <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:text-red-500 transition-colors z-10"><X size={20}/></button>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4 pr-8"><Upload className="inline text-indigo-500 mr-2" size={20}/>Upload Docs</h2>
            <DocumentUploader studentId={uploadTarget.id} collectionName={uploadTarget.collectionName} studentName={uploadTarget.fullName} category={uploadTarget.category} onComplete={() => { alert("Documents uploaded and linked successfully!"); setIsUploadModalOpen(false); setUploadTarget(null); }} />
          </div>
        </div>
      )}

      {docsModalOpen && selectedStudent && selectedStudent.documents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2"><FileText size={24} className="text-blue-600"/> Documents Manager</h3>
              <button onClick={() => setDocsModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"><X size={20}/></button>
            </div>
            <p className="text-sm text-gray-500 mb-4 font-medium">Student: <span className="text-gray-900 font-bold">{selectedStudent.fullName}</span></p>
            
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
                  <div key={docItem.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <span className="font-bold text-blue-800 text-sm">{docItem.label}</span>
                    <div className="flex gap-2 items-center w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex gap-2">
                        <a href={docUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg text-xs font-bold transition-all">View</a>
                        <a href={getDownloadUrl(docUrl)} download className="px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold shadow-sm transition-all">DL</a>
                      </div>
                      
                      <label className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1 ${replacingDoc === docItem.key ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
                        {replacingDoc === docItem.key ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>}
                        {replacingDoc === docItem.key ? 'Wait...' : 'Replace'}
                        <input type="file" className="hidden" disabled={replacingDoc === docItem.key} accept="image/*,application/pdf" onChange={(e) => handleReplaceFileChange(e, docItem.key)} />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setDocsModalOpen(false)} className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-all">Close</button>
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <aside className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-50 w-64 bg-gray-900 text-white flex flex-col flex-shrink-0 shadow-2xl md:shadow-none`}>
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl">EF</div>
            <span className="text-2xl font-extrabold italic">EduFill</span>
          </div>
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}><X size={24}/></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-3 mt-2 overflow-y-auto">
          <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><LayoutDashboard size={20}/> Dashboard</button>
          
          <button onClick={() => { setActiveTab('missing'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'missing' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <div className="flex items-center gap-3"><FileWarning size={20}/> Missing Items</div>
            {pendingMissingCount > 0 && (<span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingMissingCount}</span>)}
          </button>

          <button onClick={() => { setActiveTab('camps'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'camps' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <div className="flex items-center gap-3"><Building size={20}/> Camp Requests</div>
            {campRequests.filter(c => c.status === 'New Request').length > 0 && (<span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{campRequests.filter(c => c.status === 'New Request').length} New</span>)}
          </button>

          <button onClick={() => { setActiveTab('team'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'team' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Shield size={20}/> Team & Agents</button>

          <button onClick={() => { setActiveTab('liveController'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'liveController' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}><Settings size={20}/> Form Settings</button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-3 text-gray-400 hover:text-red-400 w-full px-4 py-3 rounded-xl font-medium transition-colors"><LogOut size={20}/> Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto">
        
        {activeTab === 'dashboard' && (
           <div className="animate-in fade-in duration-500">
             <header className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-6 md:mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Database Overview</h1>
                <p className="text-sm md:text-base text-gray-500 mt-1">Real-time student booking records</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-emerald-100"><Radio size={14} className="text-emerald-500 animate-pulse" /><span className="text-xs md:text-sm font-bold text-emerald-700">Live Sync</span></div>
                <button onClick={() => setIsWalkInModalOpen(true)} className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 md:px-5 md:py-2 rounded-full shadow-md transition-all font-bold text-xs md:text-sm"><PlusCircle size={14} /> Add Walk-in</button>
                <button onClick={exportToExcel} className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white px-3 py-2 md:px-5 md:py-2 rounded-full shadow-md transition-all font-bold text-xs md:text-sm"><Download size={14} /> Export</button>
              </div>
            </header>

            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 md:mb-8 flex flex-col xl:flex-row gap-4 justify-between xl:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 text-gray-500 font-bold mr-2 text-sm"><Filter size={16} /> Filters:</div>
                {['All', 'Ribosome', 'Unacademy', 'Others'].map(category => (
                  <button key={category} onClick={() => setActiveFilter(category)} className={`px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-bold transition-all ${activeFilter === category ? 'bg-blue-900 text-white shadow-md' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
                    {category} {category === 'All' && `(${bookings.length})`}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full xl:w-auto">
                <div className="relative flex-1 min-w-[150px] xl:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search Name/App No..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"/>
                </div>
                
                <div className="relative flex-1 min-w-[130px] xl:w-48">
                  <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input 
                    type={dateFilter ? "date" : "text"} 
                    placeholder="Filter Date..."
                    onFocus={(e) => e.target.type = 'date'}
                    onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 text-gray-600 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                  />
                </div>

                {/* 🌟 NAYA: AGENT FILTER DROPDOWN 🌟 */}
                <div className="relative flex-1 min-w-[140px] xl:w-48">
                  <UserCircle size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select 
                    value={agentFilter} 
                    onChange={(e) => setAgentFilter(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 text-gray-600 rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none"
                  >
                    <option value="All">All Agents</option>
                    {allAgentsList.map((agentName, idx) => (
                      <option key={idx} value={agentName}>{agentName}</option>
                    ))}
                    <option value="Unassigned">Unassigned</option>
                  </select>
                </div>

                {(searchQuery || dateFilter || activeFilter !== 'All' || agentFilter !== 'All') && (
                  <button onClick={clearFilters} className="flex items-center justify-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-full transition-all"><X size={14} /> Clear</button>
                )}
              </div>
            </div>

            {/* In 4 dabbo me stats ab filter hone ke baad dikhenge! */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                <div className="bg-blue-100 p-2 md:p-3 rounded-xl text-blue-600"><Users size={20} className="md:w-6 md:h-6"/></div>
                <div><p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Total Leads</p><p className="text-xl md:text-2xl font-black text-gray-900">{filteredBookings.length}</p></div>
              </div>
              <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                <div className="bg-amber-100 p-2 md:p-3 rounded-xl text-amber-600"><Clock size={20} className="md:w-6 md:h-6"/></div>
                <div><p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Pending</p><p className="text-xl md:text-2xl font-black text-gray-900">{pendingCount}</p></div>
              </div>
              <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                <div className="bg-emerald-100 p-2 md:p-3 rounded-xl text-emerald-600"><CheckCircle size={20} className="md:w-6 md:h-6"/></div>
                <div><p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Completed</p><p className="text-xl md:text-2xl font-black text-gray-900">{completedCount}</p></div>
              </div>
              <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                <div className="bg-purple-100 p-2 md:p-3 rounded-xl text-purple-600"><IndianRupee size={20} className="md:w-6 md:h-6"/></div>
                <div><p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Revenue</p><p className="text-xl md:text-2xl font-black text-gray-900">₹{totalPaidAmount}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50"><h2 className="text-lg md:text-xl font-bold text-gray-800">Application Records</h2></div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs md:text-sm uppercase tracking-wider border-b border-gray-100">
                      <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Student Info</th>
                      <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Exam details</th>
                      <th className="p-3 md:p-4 font-semibold whitespace-nowrap">Appointment</th>
                      <th className="p-3 md:p-4 font-semibold whitespace-nowrap w-48">Status Tracker</th>
                      <th className="p-3 md:p-4 font-semibold whitespace-nowrap text-right">Actions</th>
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
                          <td className="p-3 md:p-4 align-top">
                            <p className="font-bold text-gray-900">{booking.fullName}</p>
                            <p className="text-xs md:text-sm text-gray-500">{booking.mobile}</p>
                            <span className="text-[10px] md:text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded mt-1 mr-2 inline-block font-bold">{booking.category}</span>
                            
                            {booking.assignedTo && booking.assignedTo !== 'Unassigned' && (
                              <span className="text-[10px] md:text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1 inline-block font-bold">Agent: {booking.assignedTo}</span>
                            )}
                          </td>
                          <td className="p-3 md:p-4 align-top">
                            <p className="font-bold text-blue-900">{booking.exam}</p>
                            <p className="text-xs md:text-sm text-gray-600">{booking.institute}</p>
                            {booking.batchName && <p className="text-[10px] md:text-xs text-emerald-600 font-medium mt-1">Batch: {booking.batchName}</p>}
                          </td>
                          <td className="p-3 md:p-4 align-top">
                            <p className="font-bold text-gray-800 text-sm">{booking.slotDate}</p>
                            <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1 mb-1"><Clock size={12}/> {booking.slotTime}</p>
                          </td>
                          <td className="p-3 md:p-4 align-top">
                            <p className="font-black text-indigo-600 text-xs md:text-sm mb-2">{booking.tokenNumber}</p>
                            <div className="flex gap-2 items-center mb-2 flex-wrap">
                              <span className={`px-2 py-1 rounded text-[10px] md:text-[11px] font-bold ${booking.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{booking.status || 'Pending'}</span>
                              {booking.paymentStatus === 'Paid' ? (
                                <div className="flex items-center gap-1">
                                  <span className="px-2 py-1 rounded text-[10px] md:text-[11px] font-bold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1"><CheckCircle size={10}/> ₹{booking.paymentAmount}</span>
                                  <button onClick={() => openPaymentModal(booking)} className="text-gray-400 hover:text-blue-500 p-1 bg-gray-100 rounded" title="Edit Payment Data"><Edit size={12} /></button>
                                </div>
                              ) : (
                                <button onClick={() => openPaymentModal(booking)} className="px-2 py-1 rounded text-[10px] md:text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">Payment Due</button>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 mt-2">
                              <button onClick={() => togglePhotoDeliveryStatus(booking.id, booking.collectionName, booking.photoDelivered)} className={`flex w-fit items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all border ${booking.photoDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                <Camera size={12}/> {booking.photoDelivered ? 'Photos ✅' : 'Give Photos'}
                              </button>
                              <button onClick={() => toggleConfirmationStatus(booking.id, booking.collectionName, booking.confirmationDelivered)} className={`flex w-fit items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all border ${booking.confirmationDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                <Printer size={12}/> {booking.confirmationDelivered ? 'Confirm ✅' : 'Give Confirm'}
                              </button>
                            </div>
                            {booking.applicationNumber && booking.applicationNumber !== 'N/A' && (
                              <p className="text-[10px] md:text-[11px] font-bold text-gray-600 bg-gray-200 px-2 py-1 rounded inline-block mt-2">App No: {booking.applicationNumber}</p>
                            )}
                          </td>
                          <td className="p-3 md:p-4 align-top">
                            <div className="flex items-center justify-end gap-1 md:gap-2">
                              {booking.documents ? (
                                <button onClick={() => { setSelectedStudent(booking); setDocsModalOpen(true); }} className="flex items-center justify-center p-1.5 md:p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors border border-blue-100"><FileText size={16}/></button>
                              ) : (
                                <button onClick={() => { setUploadTarget(booking); setIsUploadModalOpen(true); }} className="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-lg transition-all shadow-sm"><Upload size={12}/> Upload</button>
                              )}
                              <a href={`https://wa.me/91${booking.mobile}?text=Hello ${booking.fullName}...`} target="_blank" rel="noreferrer" className="flex items-center justify-center p-1.5 md:p-2 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-lg transition-colors border border-green-100"><MessageCircle size={16}/></a>
                              {booking.status !== 'Completed' && (
                                <button onClick={() => markAsCompleted(booking.id, booking.collectionName)} className="flex items-center justify-center p-1.5 md:p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors border border-emerald-100"><CheckCircle size={16}/></button>
                              )}
                              <button onClick={() => deleteBooking(booking.id, booking.collectionName)} className="flex items-center justify-center p-1.5 md:p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100"><Trash2 size={16}/></button>
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

        {activeTab === 'team' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-6 md:mb-10">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Agent Management</h1>
                <p className="text-sm md:text-base text-gray-500 mt-1">Add your employees here. Forms will be auto-assigned to them.</p>
              </div>
              <button onClick={() => setIsEmployeeModalOpen(true)} className="flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full shadow-lg transition-all font-bold">
                <UserPlus size={18} /> Add New Agent
              </button>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <Shield className="text-indigo-500" size={20} />
                <h2 className="text-lg md:text-xl font-bold text-gray-800">Active Team Members</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs md:text-sm uppercase tracking-wider border-b border-gray-100">
                      <th className="p-3 md:p-4 font-semibold">Agent Info</th>
                      <th className="p-3 md:p-4 font-semibold">Login PIN</th>
                      <th className="p-3 md:p-4 font-semibold">Assigned Institute</th>
                      <th className="p-3 md:p-4 font-semibold">Forms Today</th>
                      <th className="p-3 md:p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employees.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-medium">No agents added yet. Click "Add New Agent" to start.</td></tr>
                    ) : (
                      employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 md:p-4">
                            <p className="font-bold text-gray-900 text-base">{emp.name}</p>
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block font-bold">Active</span>
                          </td>
                          <td className="p-3 md:p-4">
                            <span className="font-mono bg-gray-100 px-3 py-1 rounded text-gray-800 font-bold tracking-widest">{emp.pin}</span>
                          </td>
                          <td className="p-3 md:p-4">
                            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">
                              {emp.institute}
                            </span>
                          </td>
                          <td className="p-3 md:p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-gray-800">{emp.assignedCount || 0}</span>
                              <span className="text-xs text-gray-500">assigned</span>
                            </div>
                          </td>
                          <td className="p-3 md:p-4 text-right">
                            <button onClick={() => deleteEmployee(emp.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100">
                              <Trash2 size={16}/>
                            </button>
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

        {activeTab === 'missing' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="mb-6 md:mb-10">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Missing Items Tracker</h1>
              <p className="text-sm md:text-base text-gray-500 mt-1">Manage requests submitted by students.</p>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={20} />
                <h2 className="text-lg md:text-xl font-bold text-gray-800">Student Reports</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs md:text-sm uppercase tracking-wider border-b border-gray-100">
                      <th className="p-3 md:p-4 font-semibold">Student Name & Contact</th>
                      <th className="p-3 md:p-4 font-semibold">Reported Missing Items</th>
                      <th className="p-3 md:p-4 font-semibold">Date Reported</th>
                      <th className="p-3 md:p-4 font-semibold">Status</th>
                      <th className="p-3 md:p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {missingRequests.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-medium">🎉 Great! No missing item requests right now.</td></tr>
                    ) : (
                      missingRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 md:p-4">
                            <p className="font-bold text-gray-900 text-base md:text-lg">{req.studentName}</p>
                            <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1 mt-1"><MessageCircle size={12}/> {req.mobile}</p>
                          </td>
                          <td className="p-3 md:p-4">
                            <div className="flex flex-wrap gap-2">
                              {req.missingItems && req.missingItems.map((item, idx) => (
                                <span key={idx} className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm whitespace-nowrap">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 md:p-4 text-xs md:text-sm text-gray-500 font-medium">
                            {formatTime(req.timestamp)}
                          </td>
                          <td className="p-3 md:p-4">
                            {req.status === 'Pending' ? (
                              <span className="bg-amber-100 text-amber-700 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold animate-pulse inline-block whitespace-nowrap">Needs Attention</span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold flex items-center gap-1 w-fit whitespace-nowrap"><CheckCircle size={12}/> Resolved</span>
                            )}
                          </td>
                          <td className="p-3 md:p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {req.status === 'Pending' && (
                                <button onClick={() => resolveMissingRequest(req.id)} className="flex items-center gap-1 px-2 py-1.5 md:px-3 md:py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] md:text-xs font-bold transition-all shadow-sm whitespace-nowrap">
                                  <Check size={12}/> Mark Printed
                                </button>
                              )}
                              <button onClick={() => deleteMissingRequest(req.id)} className="p-1.5 md:p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100">
                                <Trash2 size={14}/>
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

        {activeTab === 'camps' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <header className="mb-6 md:mb-10"><h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">B2B Camp Inquiries</h1></header>
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50"><h2 className="text-lg md:text-xl font-bold text-gray-800">Institute Leads Directory</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead><tr className="bg-gray-50 text-gray-500 text-xs md:text-sm uppercase tracking-wider border-b border-gray-100"><th className="p-3 md:p-4">Institute</th><th className="p-3 md:p-4">Contact</th><th className="p-3 md:p-4">Volume</th><th className="p-3 md:p-4">Status</th><th className="p-3 md:p-4 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {campRequests.map((camp) => (
                        <tr key={camp.id} className="hover:bg-gray-50">
                          <td className="p-3 md:p-4"><p className="font-bold text-indigo-900 text-base md:text-lg">{camp.instituteName}</p><p className="text-[10px] text-gray-400 mt-1">Date: {formatTime(camp.timestamp)}</p></td>
                          <td className="p-3 md:p-4"><p className="font-bold text-sm md:text-base">{camp.contactPerson}</p><p className="text-xs md:text-sm text-gray-600">{camp.mobile}</p></td>
                          <td className="p-3 md:p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-sm font-bold border border-blue-200 whitespace-nowrap">{camp.studentCount} Forms</span></td>
                          <td className="p-3 md:p-4"><select value={camp.status || 'New Request'} onChange={(e) => updateCampStatus(camp.id, e.target.value)} className="text-[10px] md:text-sm font-bold rounded-lg px-2 py-1 outline-none border transition-colors cursor-pointer"><option value="New Request">New Lead</option><option value="Completed">Camp Executed</option></select></td>
                          <td className="p-3 md:p-4 text-right"><button onClick={() => deleteCampRequest(camp.id)} className="p-1.5 md:p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><Trash2 size={16}/></button></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'liveController' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <header className="mb-6 md:mb-10"><h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Platform Form Controls</h1></header>
             <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
              <div className="space-y-4 md:space-y-5">
                {['neet', 'jee', 'cuet'].map((examKey) => (
                  <div key={examKey} className="flex items-center justify-between p-4 md:p-5 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl border border-gray-200">
                    <div><p className="font-bold text-base md:text-lg text-gray-800 uppercase tracking-wide">{examKey}</p></div>
                    <button onClick={() => toggleExam(examKey)} className={`relative inline-flex h-7 w-12 md:h-8 md:w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${liveExams[examKey] ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <span className={`pointer-events-none inline-block h-6 w-6 md:h-7 md:w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${liveExams[examKey] ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}`} />
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
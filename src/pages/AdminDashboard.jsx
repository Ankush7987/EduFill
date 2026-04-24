import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Search, Database, FileText, Loader2, AlertCircle, RefreshCw, Filter, AlertTriangle, Sparkles, Plus, Edit, Save, X, Lock, LogOut, GraduationCap, Activity, Download, ChevronDown, MapPin } from 'lucide-react';

// 🚀 FIXED: Added custom SEO component for noindex feature
import SEO from '../components/SEO';

const API_BASE_URL = "https://edufill-server.onrender.com";

// 🌟 DYNAMIC STATE & DISTRICT DATA
const stateDistricts = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kadapa"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur", "Kamrup "],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Nalanda"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Jagdalpur", "Korba"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Rohtak", "Hisar"],
  "Himachal Pradesh": ["Shimla", "Mandi", "Dharamshala", "Solan", "Bilaspur"],
  "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Samba"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubli", "Belagavi", "Gulbarga", "Kalaburagi"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Rewa"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "khordha"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Yadadri Bhuvanagiri"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Meerut", "Gorakhpur", "Raebareli"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol", "Burdwan", "Nadia"]
};

// 🌟 PREMIUM UI COMPONENT: Custom Searchable Dropdown
const SearchableDropdown = ({ label, value, onChange, options, placeholder, required, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes((value || '').toLowerCase()));

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">{label}</label>
      <div className={`flex items-center w-full border-2 border-gray-200 focus-within:border-indigo-600 rounded-xl px-3 py-2 bg-white transition-colors ${disabled ? 'opacity-60 bg-gray-50 cursor-not-allowed' : ''}`}>
        <input
          type="text"
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full outline-none font-medium text-sm text-gray-800 bg-transparent disabled:cursor-not-allowed"
          autoComplete="off"
        />
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''} cursor-pointer`} onClick={() => !disabled && setIsOpen(!isOpen)} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[60] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] max-h-48 overflow-y-auto custom-scrollbar py-1 left-0">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <div
                key={idx}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors flex items-center gap-2"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                <MapPin size={14} className="text-gray-400 shrink-0" /> <span className="truncate">{opt}</span>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-400 italic text-center">No exact match found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const isAuth = localStorage.getItem('edufill_admin_auth');
    if (isAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_MASTER_PASSWORD || "admin7987"; 

    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('edufill_admin_auth', 'true'); 
      setLoginError('');
    } else {
      setLoginError('❌ Incorrect Password! Access Denied.');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('edufill_admin_auth');
    setPasswordInput('');
  };
  
  const [activeExamMode, setActiveExamMode] = useState('NEET'); 

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  
  const [colleges, setColleges] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [isSavingData, setIsSavingData] = useState(false); 
  
  const [formData, setFormData] = useState({
    name: '', state: '', district: '', course: 'MBBS', exam: 'NEET',
    cutoffs: { General: '', OBC: '', EWS: '', SC: '', ST: '' }
  });

  const fetchColleges = async () => {
    setLoadingData(true);
    try {
      const url = new URL(`${API_BASE_URL}/api/colleges/admin-search`);
      if (searchTerm) url.searchParams.append("search", searchTerm);
      if (activeFilter !== 'All') url.searchParams.append("filter", activeFilter);
      url.searchParams.append("exam", activeExamMode); 

      const response = await fetch(url);
      const data = await response.json();
      
      setColleges(data.colleges || []); 
      setTotalRecords(data.totalFound || 0); 
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const delaySearch = setTimeout(() => { fetchColleges(); }, 500); 
      return () => clearTimeout(delaySearch);
    }
  }, [searchTerm, activeFilter, activeExamMode, isAuthenticated]);

  const clearBackendCache = async () => {
    try { await fetch(`${API_BASE_URL}/api/colleges/clear-cache`, { method: "POST" }); } 
    catch(e) { console.error("Cache Clear Error:", e); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Pehle ek PDF file select karein!");
    setUploading(true); setUploadMessage('');
    const uploadData = new FormData();
    uploadData.append('pdf', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/colleges/upload-pdf`, {
        method: "POST", body: uploadData,
      });
      const result = await response.json();
      if (response.ok) {
        setUploadMessage(result.message);
        setFile(null);
        setTimeout(async () => {
           await clearBackendCache();
           fetchColleges(); 
        }, 1500);
      } else {
        setUploadMessage("❌ Error: " + (result.error || "Upload failed"));
      }
    } catch (error) {
      setUploadMessage("❌ Server se connect nahi ho paya.");
    } finally {
      setUploading(false);
    }
  };

  const handleCSVUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a CSV file!");
    setUploading(true); setUploadMessage('Parsing CSV Data...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        if (lines.length < 2) throw new Error("CSV is empty or missing data.");

        const collegesData = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(item => item.replace(/^"|"$/g, '').trim());
          if (row.length >= 4 && row[0] !== '') {
            collegesData.push({
              name: row[0], state: row[1] || 'India', district: row[2] || '', course: row[3],
              cutoffs: {
                General: parseFloat(row[4]) || 0, 
                OBC: parseFloat(row[5]) || 0, 
                EWS: parseFloat(row[6]) || 0, 
                SC: parseFloat(row[7]) || 0, 
                ST: parseFloat(row[8]) || 0,
              }
            });
          }
        }

        setUploadMessage(`Importing ${collegesData.length} records to Database...`);
        const response = await fetch(`${API_BASE_URL}/api/colleges/bulk-add`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exam: activeExamMode, colleges: collegesData })
        });
        
        const result = await response.json();
        if (response.ok) {
          setUploadMessage(`✅ ${result.message}`); 
          setFile(null); 
          await clearBackendCache(); 
          fetchColleges();
        } else {
          throw new Error(result.error);
        }

      } catch (err) { 
        setUploadMessage("❌ Error: " + err.message); 
      } finally { 
        setUploading(false); 
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const csvContent = "Name,State,District,Course,General (%),OBC (%),EWS (%),SC (%),ST (%)\n\"Holkar Science College, Indore\",Madhya Pradesh,Indore,B.Sc,88.5,85.0,84.0,78.5,75.0\n\"Hindu College, Delhi\",Delhi,New Delhi,B.A,98.0,96.5,96.0,92.0,90.0\nChrist University,Karnataka,Bengaluru,BBA,92.5,0,0,0,0";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "EduFill_12th_Sample_Format.csv";
    link.click();
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Kya aap sach me "${name}" ko delete karna chahte hain?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/colleges/delete/${id}`, { method: "DELETE" });
        if (response.ok) {
          await clearBackendCache();
          fetchColleges(); 
        } else {
          alert("Delete failed.");
        }
      } catch (error) {
        alert("Delete error: " + error.message);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (totalRecords === 0) return alert("Delete karne ke liye koi data nahi hai!");
    
    let warningMsg = `⚠️ DANGER ZONE ⚠️\n\nKya aap sach me in ${totalRecords} colleges ko HAMESHA ke liye delete karna chahte hain?\n\nFilters applied:\n- Exam: ${activeExamMode}\n- Course: ${activeFilter}\n- Search: ${searchTerm || 'None'}`;
    
    if (window.confirm(warningMsg)) {
      setIsDeletingBulk(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/colleges/bulk-delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filter: activeFilter, search: searchTerm, exam: activeExamMode })
        });
        if (response.ok) {
          alert(`✅ Successfully deleted ${totalRecords} records!`);
          await clearBackendCache();
          fetchColleges(); 
        }
      } catch (error) {
        alert("Bulk delete fail ho gaya: " + error.message);
      } finally {
        setIsDeletingBulk(false);
      }
    }
  };

  const handleCleanDuplicates = async () => {
    if (!window.confirm("Kya aap database scan karke saare Duplicate records delete karna chahte hain?")) return;
    setIsDeletingBulk(true); 
    try {
      const response = await fetch(`${API_BASE_URL}/api/colleges/clean-duplicates`, { method: "POST" });
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        if (result.deletedCount > 0) { await clearBackendCache(); fetchColleges(); }
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentEditId(null);
    setFormData({ 
        name: '', state: '', district: '', exam: activeExamMode, 
        course: activeExamMode === 'NEET' ? 'MBBS' : 'B.Sc', 
        cutoffs: { General: '', OBC: '', EWS: '', SC: '', ST: '' } 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (col) => {
    setIsEditing(true);
    setCurrentEditId(col.id);
    setFormData({
      name: col.name,
      state: col.state || '',
      district: col.district || '',
      exam: col.exam || 'NEET',
      course: col.course || 'MBBS',
      cutoffs: {
        General: col.cutoffs?.General || '',
        OBC: col.cutoffs?.OBC || '',
        EWS: col.cutoffs?.EWS || '',
        SC: col.cutoffs?.SC || '',
        ST: col.cutoffs?.ST || ''
      }
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setIsSavingData(true); 
    try {
      const url = isEditing ? `${API_BASE_URL}/api/colleges/edit/${currentEditId}` : `${API_BASE_URL}/api/colleges/add`;
      const method = isEditing ? "PUT" : "POST";
      
      const payload = {
        ...formData,
        cutoffs: {
            General: parseFloat(formData.cutoffs.General) || 0,
            OBC: parseFloat(formData.cutoffs.OBC) || 0,
            EWS: parseFloat(formData.cutoffs.EWS) || 0,
            SC: parseFloat(formData.cutoffs.SC) || 0,
            ST: parseFloat(formData.cutoffs.ST) || 0,
        }
      };

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload) 
      });

      if (response.ok) {
        await clearBackendCache();
        await fetchColleges();
        setIsModalOpen(false); 
      } else {
        const err = await response.json();
        alert("Operation failed: " + err.error);
      }
    } catch (error) {
      alert("Error saving data: " + error.message);
    } finally {
      setIsSavingData(false);
    }
  };

  const filterOptions = activeExamMode === 'NEET' 
    ? ["All", "MBBS", "BDS", "B.Sc. Nursing", "AIIMS"] 
    : ["All", "B.Sc", "B.A", "B.Com", "BCA", "BBA", "B.Tech"];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
        
        <SEO title="Admin Login | EduFill Secure Access" url="/admin-secret-panel" noindex={true} />
        
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <h2 className="text-3xl font-black text-center text-gray-900 mb-2">Restricted Area</h2>
          <p className="text-center text-gray-500 font-medium mb-8">Please enter the master password to access EduFill Control Room.</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input 
                type="password" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-indigo-600 rounded-xl px-4 py-3 outline-none transition-colors text-center font-bold tracking-widest text-lg" 
                placeholder="••••••••"
                required
              />
            </div>
            {loginError && (
              <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl text-center flex items-center justify-center gap-2">
                <AlertCircle size={16}/> {loginError}
              </div>
            )}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-lg">
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans relative">
      
      <SEO title="EduFill Admin Control Room" url="/admin-secret-panel" noindex={true} />

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <Database className="text-blue-600" size={32} />
              EduFill Control Room
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold border border-blue-100">
              Results: {totalRecords} 
            </div>
            <button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md transition-all">
              <Plus size={18} /> Add
            </button>
            <button onClick={handleLogout} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-red-200 transition-all">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {/* 🌟 EXAM MODE TABS */}
        <div className="flex bg-white rounded-2xl shadow-sm border p-2 mb-2">
            <button onClick={() => {setActiveExamMode('NEET'); setActiveFilter('All'); setFile(null); setUploadMessage('');}} className={`flex-1 py-3 font-black text-lg rounded-xl flex items-center justify-center gap-2 transition-all ${activeExamMode === 'NEET' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
                <Activity size={20}/> NEET (Medical) Data
            </button>
            <button onClick={() => {setActiveExamMode('12th'); setActiveFilter('All'); setFile(null); setUploadMessage('');}} className={`flex-1 py-3 font-black text-lg rounded-xl flex items-center justify-center gap-2 transition-all ${activeExamMode === '12th' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
                <GraduationCap size={20}/> 12th Board (UG) Data
            </button>
        </div>

        {/* FILTERS & BUTTONS PANEL */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
            <Filter size={18} className="text-gray-400 mr-2 shrink-0" />
            {filterOptions.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeFilter === filter ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button 
              onClick={handleCleanDuplicates} disabled={isDeletingBulk}
              className="bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white border border-purple-200 font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
            >
              {isDeletingBulk ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              <span className="hidden md:inline">Clean Duplicates</span>
            </button>

            {totalRecords > 0 && (
              <button 
                onClick={handleBulkDelete} disabled={isDeletingBulk}
                className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                title={`Delete all ${totalRecords} results currently shown in the table`}
              >
                {isDeletingBulk ? <Loader2 size={18} className="animate-spin" /> : <AlertTriangle size={18} />}
                <span>Delete All Listed ({totalRecords})</span>
              </button>
            )}
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 🌟 DYNAMIC UPLOAD PANEL */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border h-fit">
            <h2 className="text-lg font-bold mb-2">{activeExamMode === 'NEET' ? 'Upload MCC PDF' : 'Upload CSV / Excel'}</h2>
            
            {activeExamMode === '12th' && (
                <button onClick={downloadSampleCSV} className="w-full mb-4 bg-green-50 text-green-700 hover:bg-green-100 font-bold py-2 rounded-lg text-xs flex justify-center items-center gap-1 border border-green-200 transition-colors">
                    <Download size={14}/> Download Sample Format
                </button>
            )}

            <form onSubmit={activeExamMode === 'NEET' ? handleUpload : handleCSVUpload} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                <input 
                    type="file" 
                    accept={activeExamMode === 'NEET' ? ".pdf" : ".csv"} 
                    onChange={(e) => setFile(e.target.files[0])} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Upload size={32} className={file ? "text-green-500" : "text-gray-400"} />
                  <span className="font-medium text-sm">{file ? file.name : (activeExamMode === 'NEET' ? "Drop PDF here" : "Drop CSV file here")}</span>
                </div>
              </div>
              <button type="submit" disabled={!file || uploading} className={`w-full text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 disabled:bg-gray-400 ${activeExamMode === '12th' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {uploading ? <Loader2 className="animate-spin" size={20}/> : (activeExamMode === '12th' ? <Database size={20}/> : <Upload size={20}/>)}
                {uploading ? 'Processing...' : 'Upload Data'}
              </button>
            </form>
            
            {uploadMessage && (
              <div className={`mt-4 p-3 rounded-lg text-sm font-bold flex items-start gap-2 ${uploadMessage.includes('❌') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                <AlertCircle size={16} className="shrink-0" /> <p>{uploadMessage}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border h-[650px] flex flex-col">
            <div className="p-4 border-b flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder={`Search ${activeExamMode} college...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:border-blue-500 outline-none text-sm font-medium"
                />
              </div>
              <button onClick={() => { clearBackendCache(); fetchColleges(); }} className="p-2.5 border rounded-xl hover:bg-gray-50 transition-colors">
                <RefreshCw size={18} className={loadingData ? "animate-spin text-blue-500" : "text-gray-600"} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-0 custom-scrollbar">
              {loadingData ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                  <p className="font-bold">Searching Database...</p>
                </div>
              ) : colleges.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 font-bold">No data found for this search.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="py-3 px-4 text-xs font-black text-gray-500 uppercase">College</th>
                      <th className="py-3 px-2 text-xs font-black text-blue-600 text-center uppercase">Gen</th>
                      <th className="py-3 px-2 text-xs font-black text-green-600 text-center uppercase">OBC</th>
                      <th className="py-3 px-2 text-xs font-black text-purple-600 text-center uppercase">EWS</th>
                      <th className="py-3 px-2 text-xs font-black text-orange-600 text-center uppercase">SC</th>
                      <th className="py-3 px-2 text-xs font-black text-red-600 text-center uppercase">ST</th>
                      <th className="py-3 px-4 text-xs font-black text-gray-500 uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {colleges.map((col) => (
                      <tr key={col.id} className="hover:bg-blue-50/30 group transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-800 text-sm">{col.name}</p>
                          <p className="text-[11px] text-gray-500 font-medium">{col.course} • {col.state} {col.district ? `(${col.district})` : ''}</p>
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-sm text-gray-700">{col.cutoffs?.General || '-'}{activeExamMode==='12th'&&col.cutoffs?.General?'%':''}</td>
                        <td className="py-3 px-2 text-center font-bold text-sm text-gray-700">{col.cutoffs?.OBC || '-'}{activeExamMode==='12th'&&col.cutoffs?.OBC?'%':''}</td>
                        <td className="py-3 px-2 text-center font-bold text-sm text-gray-700">{col.cutoffs?.EWS || '-'}{activeExamMode==='12th'&&col.cutoffs?.EWS?'%':''}</td>
                        <td className="py-3 px-2 text-center font-bold text-sm text-gray-700">{col.cutoffs?.SC || '-'}{activeExamMode==='12th'&&col.cutoffs?.SC?'%':''}</td>
                        <td className="py-3 px-2 text-center font-bold text-sm text-gray-700">{col.cutoffs?.ST || '-'}{activeExamMode==='12th'&&col.cutoffs?.ST?'%':''}</td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button onClick={() => openEditModal(col)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg mr-1 transition-colors" title="Edit College">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(col.id, col.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete College">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 🌟 ADD / EDIT MODAL FOR BOTH EXAMS */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-5 text-white flex justify-between items-center ${formData.exam === '12th' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
              <h3 className="font-black text-xl flex items-center gap-2">
                {isEditing ? <Edit size={20}/> : <Plus size={20}/>} 
                {isEditing ? 'Edit Data' : 'Add New Data'} ({formData.exam})
              </h3>
              <button onClick={() => !isSavingData && setIsModalOpen(false)} disabled={isSavingData} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors disabled:opacity-50">
                <X size={20} />
              </button>
            </div>
            
            {/* 🚀 FIXED: Loading Overlay inside Modal during Save */}
            {isSavingData ? (
               <div className="p-16 flex flex-col items-center justify-center text-center">
                 <Loader2 size={48} className={`animate-spin mb-4 ${formData.exam === '12th' ? 'text-purple-600' : 'text-indigo-600'}`} />
                 <h3 className="text-xl font-black text-gray-800 mb-2">Saving Data...</h3>
                 <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Please do not close this window</p>
               </div>
            ) : (
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">College Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-gray-200 focus:border-indigo-600 rounded-xl px-3 py-2 outline-none font-medium text-sm text-gray-800" placeholder="e.g. AIIMS Delhi" />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 min-w-[120px]">
                  <SearchableDropdown 
                    label="State *" 
                    value={formData.state} 
                    onChange={(val) => setFormData({...formData, state: val, district: ''})} 
                    options={Object.keys(stateDistricts)} 
                    placeholder="Search State" 
                    required={true} 
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <SearchableDropdown 
                    label="District" 
                    value={formData.district} 
                    onChange={(val) => setFormData({...formData, district: val})} 
                    options={stateDistricts[formData.state] || []} 
                    placeholder="Search District" 
                    disabled={!formData.state}
                  />
                </div>
                <div className="flex-[1.5] min-w-[150px]">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Course</label>
                  <select value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} className="w-full border-2 border-gray-200 focus:border-indigo-600 rounded-xl px-3 py-2.5 outline-none font-medium text-sm text-gray-800 bg-white">
                    {formData.exam === '12th' ? (
                        <> <option>B.Sc</option><option>B.A</option><option>B.Com</option><option>BCA</option><option>BBA</option><option>B.Tech</option> </>
                    ) : (
                        <> <option>MBBS</option><option>BDS</option><option>B.Sc. Nursing</option> </>
                    )}
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                 <p className="text-xs font-bold text-gray-500 mb-3 text-center uppercase tracking-wider">CUTOFF ({formData.exam === '12th' ? 'PERCENTAGE %' : 'AIR RANK'})</p>
                 <div className="grid grid-cols-3 gap-3">
                    {['General', 'OBC', 'EWS', 'SC', 'ST'].map(cat => (
                      <div key={cat}>
                        <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">{cat}</label>
                        <input type="number" step={formData.exam === '12th' ? "0.01" : "1"} value={formData.cutoffs[cat]} onChange={e => setFormData({...formData, cutoffs: {...formData.cutoffs, [cat]: e.target.value}})} className="w-full border border-gray-300 focus:border-indigo-600 rounded-lg p-2 text-sm font-bold mt-1 outline-none" placeholder={formData.exam === '12th' ? "e.g. 85.5" : "e.g. 1500"} />
                      </div>
                    ))}
                 </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className={`flex-[2] text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md ${formData.exam === '12th' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  <Save size={18} /> Save {formData.exam} Data
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
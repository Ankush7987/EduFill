import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, serverTimestamp, onSnapshot, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase'; 
import { UploadCloud, FileJson, AlertCircle, CheckCircle, Loader2, BookOpen, List, PlusCircle, Edit3, Trash2, Clock, FileText, FolderOpen, ArrowLeft } from 'lucide-react';

export default function MockTestManagerTab() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // 🌟 NAYA: View Mode & Data States 🌟
  const [viewMode, setViewMode] = useState('upload'); // 'upload' ya 'manage'
  const [mockTestsList, setMockTestsList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // 🌟 NAYA: Admin Folder State 🌟
  const [selectedAdminYear, setSelectedAdminYear] = useState(null);

  // Form States
  const [examName, setExamName] = useState('NEET UG');
  const [year, setYear] = useState('2024');
  const [title, setTitle] = useState('NEET 2024 Official Paper (Q4)');
  const [paperPdfUrl, setPaperPdfUrl] = useState('');
  const [answerKeyPdfUrl, setAnswerKeyPdfUrl] = useState('');
  const [durationMins, setDurationMins] = useState(200);
  const [totalQuestions, setTotalQuestions] = useState(200);
  const [questionsJson, setQuestionsJson] = useState('');

  // 🌟 FETCH EXISTING MOCK TESTS 🌟
  useEffect(() => {
    const q = query(collection(db, "MockTests"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tests = [];
      snapshot.forEach((doc) => {
        tests.push({ id: doc.id, ...doc.data() });
      });
      // Sort: Latest first
      tests.sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        return yearB - yearA;
     });
      setMockTestsList(tests);
    });
    return () => unsubscribe();
  }, []);

  // 🌟 NAYA: GROUPING LOGIC FOR ADMIN 🌟
  const groupedAdminPapers = useMemo(() => {
    const groups = {};
    mockTestsList.forEach(paper => {
      const year = paper.year || 'Other';
      if (!groups[year]) groups[year] = [];
      groups[year].push(paper);
    });
    return groups;
  }, [mockTestsList]);

  const adminYearsList = Object.keys(groupedAdminPapers).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return parseInt(b) - parseInt(a);
  });

  const resetForm = () => {
    setExamName('NEET UG');
    setYear('');
    setTitle('');
    setPaperPdfUrl('');
    setAnswerKeyPdfUrl('');
    setDurationMins(180);
    setTotalQuestions(200);
    setQuestionsJson('');
    setIsEditing(false);
    setEditId(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!questionsJson.trim()) throw new Error("Questions JSON cannot be empty!");
      
      let parsedQuestions;
      try {
        parsedQuestions = JSON.parse(questionsJson);
        if (!Array.isArray(parsedQuestions)) throw new Error("JSON must be an Array of questions!");
      } catch (jsonErr) {
        throw new Error("Invalid JSON Format! Please check for missing commas or quotes.");
      }

      const testData = {
        examName,
        year,
        title,
        paperPdfUrl: paperPdfUrl || "#",
        answerKeyPdfUrl: answerKeyPdfUrl || "#",
        durationMins: Number(durationMins),
        totalQuestions: Number(totalQuestions),
        status: 'active',
        questions: parsedQuestions,
      };

      if (isEditing && editId) {
        // 🌟 UPDATE EXISTING TEST 🌟
        await updateDoc(doc(db, 'MockTests', editId), {
          ...testData,
          updatedAt: serverTimestamp()
        });
        setSuccess('Mock Test Updated Successfully!');
      } else {
        // 🌟 CREATE NEW TEST 🌟
        await addDoc(collection(db, 'MockTests'), {
          ...testData,
          createdAt: serverTimestamp()
        });
        setSuccess('New Mock Test Published Successfully!');
      }
      
      resetForm();
      setViewMode('manage'); // Upload ke baad list view me bhej do
      
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  // 🌟 EDIT FUNCTION 🌟
  const handleEdit = (test) => {
    setExamName(test.examName || 'NEET UG');
    setYear(test.year || '');
    setTitle(test.title || '');
    setPaperPdfUrl(test.paperPdfUrl === '#' ? '' : test.paperPdfUrl);
    setAnswerKeyPdfUrl(test.answerKeyPdfUrl === '#' ? '' : test.answerKeyPdfUrl);
    setDurationMins(test.durationMins || 180);
    setTotalQuestions(test.totalQuestions || test.questions?.length || 0);
    
    // JSON object ko wapas string me convert karke textarea me daalna
    setQuestionsJson(JSON.stringify(test.questions, null, 2)); 
    
    setIsEditing(true);
    setEditId(test.id);
    setViewMode('upload');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🌟 DELETE FUNCTION 🌟
  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'MockTests', id));
        alert("Mock Test Deleted!");
      } catch (err) {
        console.error(err);
        alert("Failed to delete test.");
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10 max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <BookOpen className="text-indigo-600" size={32} />
            Mock Test Manager
          </h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Upload, Edit, and Manage Live Mock Tests for students.</p>
        </div>
        
        {/* 🌟 NAYA: TOGGLE BUTTONS 🌟 */}
        <div className="flex bg-gray-200/60 p-1 rounded-xl font-bold text-sm shadow-inner w-fit">
          <button onClick={() => { setViewMode('upload'); if(!isEditing) resetForm(); setSelectedAdminYear(null); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all ${viewMode === 'upload' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            <PlusCircle size={16}/> {isEditing ? 'Edit Mode' : 'Upload New'}
          </button>
          <button onClick={() => setViewMode('manage')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all ${viewMode === 'manage' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            <List size={16}/> Manage Existing
          </button>
        </div>
      </header>

      {/* ================= UPLOAD / EDIT FORM ================= */}
      {viewMode === 'upload' && (
        <form onSubmit={handleUpload} className="space-y-6 animate-in slide-in-from-bottom-4">
          
          {isEditing && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center justify-between font-bold text-sm">
              <span className="flex items-center gap-2"><Edit3 size={18}/> You are editing an existing Mock Test.</span>
              <button type="button" onClick={() => { resetForm(); setViewMode('manage'); }} className="text-amber-600 hover:underline">Cancel Edit</button>
            </div>
          )}

          {/* TEST DETAILS CARD */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">1. Test Basic Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Exam Category</label>
                <select value={examName} onChange={e => setExamName(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-700">
                  <option value="NEET UG">NEET UG</option>
                  <option value="JEE Main">JEE Main</option>
                  <option value="CUET UG">CUET UG</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Year</label>
                <input type="text" required value={year} onChange={e => setYear(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-700" placeholder="e.g. 2024" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Duration (Mins)</label>
                <input type="number" required value={durationMins} onChange={e => setDurationMins(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-700" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Display Title</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-bold text-gray-900" placeholder="e.g. NEET 2024 Official Paper (Q4)" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Paper PDF URL (Cloudinary)</label>
                <input type="url" value={paperPdfUrl} onChange={e => setPaperPdfUrl(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-medium text-gray-700 text-sm" placeholder="https://res.cloudinary.com/..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Answer Key PDF URL</label>
                <input type="url" value={answerKeyPdfUrl} onChange={e => setAnswerKeyPdfUrl(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-xl px-4 py-3 outline-none font-medium text-gray-700 text-sm" placeholder="https://res.cloudinary.com/..." />
              </div>
            </div>
          </div>

          {/* JSON UPLOAD CARD */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FileJson className="text-amber-500" size={20}/> 2. Paste Questions (JSON Array)</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total Qs: <input type="number" value={totalQuestions} onChange={e => setTotalQuestions(e.target.value)} className="w-12 bg-transparent outline-none text-gray-800 border-b border-gray-300 text-center" />
              </div>
            </div>

            <textarea 
              required
              value={questionsJson}
              onChange={e => setQuestionsJson(e.target.value)}
              className="w-full h-[500px] bg-gray-900 text-green-400 font-mono text-sm p-5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 custom-scrollbar shadow-inner"
              placeholder={`[\n  {\n    "id": 1,\n    "subject": "Physics",\n    "text": "What is the SI unit...",\n    "options": ["Volt", "Ampere", "Ohm", "Joule"],\n    "correctOptionIndex": 1,\n    "explanation": "Ampere is the unit."\n  }\n]`}
            />
            <p className="text-xs text-gray-500 font-medium mt-3 flex items-center gap-1.5">
              <AlertCircle size={14}/> Ensure the JSON is strictly formatted as an Array of Objects.
            </p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3 font-bold text-sm"><AlertCircle size={18}/> {error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-4 rounded-xl flex items-center gap-3 font-bold text-sm"><CheckCircle size={18}/> {success}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-black py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 text-lg ${isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700'}`}
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : isEditing ? <Edit3 size={24}/> : <UploadCloud size={24}/>}
            {loading ? 'Processing...' : isEditing ? 'Update Mock Test' : 'Publish New Mock Test'}
          </button>
        </form>
      )}

      {/* ================= MANAGE TESTS VIEW (FOLDERS) ================= */}
      {viewMode === 'manage' && (
        <div className="animate-in slide-in-from-bottom-4">
          {mockTestsList.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
              <h3 className="text-xl font-bold text-gray-700">No Tests Found</h3>
              <p className="text-gray-500 mt-2">You haven't uploaded any mock tests yet.</p>
              <button onClick={() => setViewMode('upload')} className="mt-6 bg-indigo-50 text-indigo-600 font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-100 transition-colors">Upload Your First Test</button>
            </div>
          ) : (
            <>
              {/* ADMIN FOLDER VIEW: Header when inside a year */}
              {selectedAdminYear && (
                 <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                       <button onClick={() => setSelectedAdminYear(null)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                          <ArrowLeft size={20}/>
                       </button>
                       <h2 className="text-xl font-black text-gray-900">{selectedAdminYear} Papers</h2>
                    </div>
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100">
                       {groupedAdminPapers[selectedAdminYear].length} Tests
                    </span>
                 </div>
              )}

              {/* ADMIN FOLDER VIEW: Showing Years */}
              {!selectedAdminYear && (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in duration-300">
                    {adminYearsList.map(year => (
                        <button 
                            key={year} 
                            onClick={() => setSelectedAdminYear(year)}
                            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col items-center justify-center gap-3 group text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                <FolderOpen size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">{year}</h3>
                                <p className="text-sm font-bold text-gray-500 mt-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">{groupedAdminPapers[year].length} Tests</p>
                            </div>
                        </button>
                    ))}
                 </div>
              )}

              {/* ADMIN FOLDER VIEW: Showing Papers inside Year */}
              {selectedAdminYear && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-right-8 duration-300">
                    {groupedAdminPapers[selectedAdminYear].map(test => (
                    <div key={test.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex-1">
                        <div className="flex justify-between items-start mb-3">
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-indigo-100">
                            {test.examName} • {test.year}
                            </span>
                            {test.status === 'active' && <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Live</span>}
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-4">{test.title}</h3>
                        <div className="flex gap-4 text-sm font-bold text-gray-500">
                            <span className="flex items-center gap-1.5"><FileText size={16}/> {test.questions?.length || 0} Qs</span>
                            <span className="flex items-center gap-1.5"><Clock size={16}/> {test.durationMins} Mins</span>
                        </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-3">
                        <button onClick={() => handleEdit(test)} className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <Edit3 size={16}/> Edit Test
                        </button>
                        <button onClick={() => handleDelete(test.id, test.title)} className="flex-1 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-100 hover:border-red-500 font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm group">
                            <Trash2 size={16} className="group-hover:animate-bounce"/> Delete
                        </button>
                        </div>
                    </div>
                    ))}
                 </div>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
}
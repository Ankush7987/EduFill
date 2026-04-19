import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async'; 
import { Clock, ChevronRight, ChevronLeft, CheckCircle, XCircle, AlertCircle, Award, BarChart3, Target, PlayCircle, Trophy, Download, FileText, Loader2, Key, Eye, BookOpen, PanelRightClose, PanelRightOpen, Share2, Languages, FolderOpen, ArrowLeft, GraduationCap } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom'; 
import { collection, query, where, getDocs } from 'firebase/firestore'; 
import { db } from '../firebase'; 

// 🚀 NAYA: Markdown & Math Imports
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const SafeMath = ({ text }) => {
  if (!text) return null;
  
  // Clean backslashes if any exist from JSON stringification
  const cleanText = text.toString().replace(/\\\\/g, '\\');

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {cleanText}
      </ReactMarkdown>
    </div>
  );
};

const createSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

const getSafeSubject = (q, idx, totalLen) => {
    if (q.subject) return q.subject;
    if (totalLen >= 200) return `Subject_${Math.floor(idx / 50) + 1}`;
    if (totalLen >= 180) return `Subject_${Math.floor(idx / 45) + 1}`;
    return 'General';
};

export default function LiveTestPage() {
  const navigate = useNavigate();
  const { testSlug } = useParams(); 
  
  const [screenState, setScreenState] = useState(() => sessionStorage.getItem('mockScreenState') || 'library');
  const [activePaper, setActivePaper] = useState(() => JSON.parse(sessionStorage.getItem('mockActivePaper')) || null);
  const [questions, setQuestions] = useState(() => JSON.parse(sessionStorage.getItem('mockQuestions')) || []);
  const [currentIndex, setCurrentIndex] = useState(() => Number(sessionStorage.getItem('mockCurrentIndex')) || 0);
  const [selectedAnswers, setSelectedAnswers] = useState(() => JSON.parse(sessionStorage.getItem('mockSelectedAnswers')) || {}); 
  const [statusMap, setStatusMap] = useState(() => JSON.parse(sessionStorage.getItem('mockStatusMap')) || {}); 
  
  const [language, setLanguage] = useState(() => sessionStorage.getItem('mockLanguage') || 'en'); 
  const [endTime, setEndTime] = useState(() => Number(sessionStorage.getItem('mockEndTime')) || null);
  const [timeLeft, setTimeLeft] = useState(() => Number(sessionStorage.getItem('mockTimeLeft')) || 0); 
  const [scoreData, setScoreData] = useState(() => JSON.parse(sessionStorage.getItem('mockScoreData')) || { marks: 0, correct: 0, incorrect: 0, unattempted: 0 });

  const [availablePapers, setAvailablePapers] = useState([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [isPaletteOpen, setIsPaletteOpen] = useState(window.innerWidth >= 1024);
  
  const [selectedExamCategory, setSelectedExamCategory] = useState('All');
  const [selectedYear, setSelectedYear] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLocalizedText = (field) => {
    if (!field) return '';
    if (typeof field === 'object' && field !== null && !Array.isArray(field)) {
      return field[language] || field['en'] || '';
    }
    return field;
  };

  const getLocalizedOptions = (optionsField) => {
    if (!optionsField) return [];
    if (!Array.isArray(optionsField) && typeof optionsField === 'object') {
      return optionsField[language] || optionsField['en'] || [];
    }
    return optionsField;
  };

  const evaluableQuestionsCount = useMemo(() => {
      const qs = activePaper?.questions || questions || [];
      if (!qs || qs.length === 0) return 0;
      
      if (qs.length >= 180) return 180;
      
      let total = 0;
      const subjs = {};
      qs.forEach((q, idx) => {
          let s = getSafeSubject(q, idx, qs.length);
          if(!subjs[s]) subjs[s] = 0;
          subjs[s]++;
      });
      Object.values(subjs).forEach(c => {
          total += (c > 35) ? 35 + Math.min(10, c - 35) : c;
      });
      return total;
  }, [activePaper, questions]);

  useEffect(() => {
    sessionStorage.setItem('mockScreenState', screenState);
    if (activePaper) sessionStorage.setItem('mockActivePaper', JSON.stringify(activePaper));
    if (questions.length) sessionStorage.setItem('mockQuestions', JSON.stringify(questions));
    sessionStorage.setItem('mockCurrentIndex', String(currentIndex));
    sessionStorage.setItem('mockSelectedAnswers', JSON.stringify(selectedAnswers));
    sessionStorage.setItem('mockStatusMap', JSON.stringify(statusMap));
    sessionStorage.setItem('mockTimeLeft', String(timeLeft));
    if (endTime) sessionStorage.setItem('mockEndTime', String(endTime));
    sessionStorage.setItem('mockScoreData', JSON.stringify(scoreData));
    sessionStorage.setItem('mockLanguage', language);
  }, [screenState, activePaper, questions, currentIndex, selectedAnswers, statusMap, timeLeft, endTime, scoreData, language]);

  useEffect(() => {
    const fetchPapers = async () => {
      const cachedPapers = sessionStorage.getItem('eduFill_CachedPapers');
      const cacheTime = sessionStorage.getItem('eduFill_CacheTime');
      
      let fetchedPapers = [];

      if (cachedPapers && cacheTime && (Date.now() - Number(cacheTime) < 1800000)) {
        fetchedPapers = JSON.parse(cachedPapers);
        setAvailablePapers(fetchedPapers);
        setIsLoadingDB(false);
      } else {
        try {
          const q = query(collection(db, "MockTests"), where("status", "==", "active"));
          const querySnapshot = await getDocs(q);
          
          querySnapshot.forEach((doc) => {
            fetchedPapers.push({ id: doc.id, ...doc.data() });
          });
          
          fetchedPapers.sort((a, b) => {
             const yearA = parseInt(a.year) || 0;
             const yearB = parseInt(b.year) || 0;
             return yearB - yearA;
          });
          
          sessionStorage.setItem('eduFill_CachedPapers', JSON.stringify(fetchedPapers));
          sessionStorage.setItem('eduFill_CacheTime', String(Date.now()));
          
          setAvailablePapers(fetchedPapers);
        } catch (error) {
          console.error("Error fetching mock tests:", error);
        } finally {
          setIsLoadingDB(false);
        }
      }

      if (testSlug && fetchedPapers.length > 0 && screenState === 'library') {
          const targetPaper = fetchedPapers.find(p => createSlug(p.title) === testSlug);
          if (targetPaper) {
              setActivePaper(targetPaper);
              setQuestions(targetPaper.questions || []);
              setScreenState('test-landing');
          } else {
              navigate('/mock-test', { replace: true });
          }
      }
    };

    fetchPapers();
  }, [testSlug]); 

  const filteredExams = useMemo(() => {
     if (selectedExamCategory === 'All') return availablePapers;
     return availablePapers.filter(p => (p.examName || '').toUpperCase().includes(selectedExamCategory.toUpperCase()));
  }, [availablePapers, selectedExamCategory]);

  const examCategoriesList = useMemo(() => {
      const cats = new Set(availablePapers.map(p => p.examName || 'Other'));
      return ['All', ...Array.from(cats)];
  }, [availablePapers]);

  const groupedPapers = useMemo(() => {
    const groups = {};
    filteredExams.forEach(paper => {
      const year = paper.year || 'Other';
      if (!groups[year]) groups[year] = [];
      groups[year].push(paper);
    });
    return groups;
  }, [filteredExams]);

  const yearsList = Object.keys(groupedPapers).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return parseInt(b) - parseInt(a);
  });

  const calculateResult = useCallback((currentAnswers = selectedAnswers, currentQuestions = questions) => {
    let correct = 0, incorrect = 0, unattempted = 0;
    
    let subjectsMap = {};
    
    currentQuestions.forEach((q, index) => {
        let subj = getSafeSubject(q, index, currentQuestions.length);
        
        if (!subjectsMap[subj]) subjectsMap[subj] = { secA: [], secB: [] };
        
        if (subjectsMap[subj].secA.length < 35) {
            subjectsMap[subj].secA.push(q);
        } else {
            subjectsMap[subj].secB.push(q);
        }
    });

    Object.keys(subjectsMap).forEach(subj => {
        const { secA, secB } = subjectsMap[subj];

        secA.forEach(q => {
            const selected = currentAnswers[q.id];
            if (selected === undefined) unattempted++;
            else if (selected === q.correctOptionIndex) correct++;
            else incorrect++;
        });

        if (secB.length > 0) {
            let validAttemptsInB = 0;
            secB.forEach(q => {
                const selected = currentAnswers[q.id];
                if (selected !== undefined) {
                    if (validAttemptsInB < 10) {
                        if (selected === q.correctOptionIndex) correct++;
                        else incorrect++;
                        validAttemptsInB++;
                    }
                }
            });
            
            const mandatoryInB = Math.min(10, secB.length);
            const unattemptedInB = mandatoryInB - validAttemptsInB;
            if (unattemptedInB > 0) unattempted += unattemptedInB;
        }
    });

    let totalMarks = (correct * 4) - (incorrect * 1);
    if (totalMarks < 0) totalMarks = 0;

    setScoreData({ marks: totalMarks, correct, incorrect, unattempted });
  }, [selectedAnswers, questions]);

  const submitTest = useCallback(() => {
    setIsSubmitting(true);
    setTimeout(() => {
        calculateResult();
        setIsSubmitting(false);
        setScreenState('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 800); 
  }, [calculateResult]);

  useEffect(() => {
    let timer;
    if (screenState === 'exam' && endTime) {
      timer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(timer);
          submitTest();
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [screenState, endTime, submitTest]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const viewTestDetails = (paper) => {
    setActivePaper(paper);
    setQuestions(paper.questions || []);
    setScreenState('test-landing');
    navigate(`/mock-test/${createSlug(paper.title)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToInstructions = () => {
    sessionStorage.removeItem('mockSelectedAnswers');
    sessionStorage.removeItem('mockStatusMap');
    sessionStorage.removeItem('mockCurrentIndex');
    sessionStorage.removeItem('mockEndTime');
    setSelectedAnswers({});
    setStatusMap({});
    setCurrentIndex(0);
    setEndTime(null);
    setLanguage('en'); 
    setScreenState('instructions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const beginExam = () => {
    const durationSec = (activePaper?.durationMins || 180) * 60;
    const calculatedEndTime = Date.now() + durationSec * 1000;
    setEndTime(calculatedEndTime);
    setTimeLeft(durationSec);
    setScreenState('exam');
  };

  const handleOptionSelect = (optionIndex) => {
    const qId = questions[currentIndex].id;
    const currentQ = questions[currentIndex];
    
    const subj = getSafeSubject(currentQ, currentIndex, questions.length);
    let subjQuestions = questions.filter((q, idx) => getSafeSubject(q, idx, questions.length) === subj);
    
    if (subjQuestions.length > 35) {
        const sectionBQuestions = subjQuestions.slice(35);
        const isInSectionB = sectionBQuestions.some(q => q.id === qId);
        
        if (isInSectionB && selectedAnswers[qId] === undefined) {
             let attemptedB = 0;
             sectionBQuestions.forEach(q => { if(selectedAnswers[q.id] !== undefined) attemptedB++; });
             
             if (attemptedB >= 10) {
                 alert("You can only attempt a maximum of 10 questions in Section B of this subject. Please clear a previous response to attempt this one.");
                 return;
             }
        }
    }

    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIndex }));
    setStatusMap(prev => ({ ...prev, [qId]: 'answered' }));
  };

  const clearResponse = () => {
    const qId = questions[currentIndex].id;
    const newAnswers = { ...selectedAnswers };
    delete newAnswers[qId];
    setSelectedAnswers(newAnswers);
    setStatusMap(prev => ({ ...prev, [qId]: 'unanswered' }));
  };

  const markForReview = () => {
    const qId = questions[currentIndex].id;
    setStatusMap(prev => ({ ...prev, [qId]: 'marked' }));
    handleNext();
  };

  const markAsRead = () => {
    const qId = questions[currentIndex].id;
    setStatusMap(prev => ({ ...prev, [qId]: 'read' }));
    handleNext();
  };

  const handleNavigate = (idx) => {
    const currentQId = questions[idx].id;
    if (!statusMap[currentQId]) {
      setStatusMap(prev => ({ ...prev, [currentQId]: 'unanswered' }));
    }
    setCurrentIndex(idx);
    if(window.innerWidth < 1024) setIsPaletteOpen(false); 
  };

  const handleNext = () => {
    const currentQId = questions[currentIndex].id;
    if (!statusMap[currentQId]) {
      setStatusMap(prev => ({ ...prev, [currentQId]: 'unanswered' }));
    }
    if (currentIndex < questions.length - 1) {
      handleNavigate(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) handleNavigate(currentIndex - 1);
  };

  const resetEngine = () => {
    sessionStorage.removeItem('mockScreenState');
    sessionStorage.removeItem('mockActivePaper');
    sessionStorage.removeItem('mockQuestions');
    sessionStorage.removeItem('mockCurrentIndex');
    sessionStorage.removeItem('mockSelectedAnswers');
    sessionStorage.removeItem('mockStatusMap');
    sessionStorage.removeItem('mockTimeLeft');
    sessionStorage.removeItem('mockEndTime');
    sessionStorage.removeItem('mockScoreData');
    
    setActivePaper(null); 
    setQuestions([]); 
    setCurrentIndex(0); 
    setSelectedAnswers({}); 
    setStatusMap({}); 
    setScoreData({ marks: 0, correct: 0, incorrect: 0, unattempted: 0 });
    setTimeLeft(0);
    setEndTime(null);
    setLanguage('en');
    setScreenState('library');
    navigate('/mock-test', { replace: true }); 
  };

  const handleShare = async () => {
    const totalAttempted = scoreData.correct + scoreData.incorrect;
    const accuracy = totalAttempted > 0 ? Math.round((scoreData.correct / totalAttempted) * 100) : 0;
    
    const shareText = `🎯 I just scored ${scoreData.marks} Marks with ${accuracy}% accuracy in the "${activePaper?.title}" mock test on EduFill!\n\n✅ Correct: ${scoreData.correct}\n❌ Incorrect: ${scoreData.incorrect}\n\nThink you can beat my score? Try it now! 🚀`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Mock Test Result',
          text: shareText,
          url: window.location.href, 
        });
      } catch (err) {
        console.log('Share canceled or failed.', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Result copied to clipboard!');
    }
  };

  const renderScreen = () => {
    
    if (screenState === 'library') {
      return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
          <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
            
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4 border-b border-gray-200 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><GraduationCap size={24}/></div>
                   <h1 className="text-3xl md:text-4xl font-black text-gray-900">
                       {selectedYear ? `${selectedExamCategory !== 'All' ? selectedExamCategory : ''} Papers from ${selectedYear}` : 'Exam Library'}
                   </h1>
                </div>
                <p className="text-gray-500 font-medium">Practice on India's most advanced CBT engine.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                  {selectedYear && (
                      <button onClick={() => setSelectedYear(null)} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm">
                          <ArrowLeft size={18}/> Years
                      </button>
                  )}
                  <button onClick={() => navigate('/')} className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm">Home</button>
              </div>
            </div>

            {!selectedYear && (
               <div className="flex overflow-x-auto gap-2 mb-8 custom-scrollbar pb-2">
                   {examCategoriesList.map(cat => (
                       <button 
                           key={cat}
                           onClick={() => setSelectedExamCategory(cat)}
                           className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm transition-all ${selectedExamCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                       >
                           {cat}
                       </button>
                   ))}
               </div>
            )}

            {isLoadingDB ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="animate-spin text-indigo-600 w-12 h-12 mb-4"/>
                <p className="text-gray-500 font-bold text-lg">Fetching library from secure vault...</p>
              </div>
            ) : availablePapers.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700">No Mock Tests Available</h3>
                <p className="text-gray-500 mt-2">New previous year papers will be uploaded soon by the Admin.</p>
              </div>
            ) : (
                
              <>
                {!selectedYear && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in zoom-in-95 duration-300">
                        {yearsList.map(year => (
                            <button 
                                key={year} 
                                onClick={() => setSelectedYear(year)}
                                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-3 group text-left"
                            >
                                <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <FolderOpen size={32} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-gray-900">{year}</h3>
                                    <p className="text-sm font-bold text-gray-500 mt-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">{groupedPapers[year].length} Sets</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {selectedYear && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-right-8 duration-300">
                        {groupedPapers[selectedYear].map((paper) => {
                          const testUrl = `/mock-test/${createSlug(paper.title)}`;
                          
                          return (
                            <div key={paper.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col group">
                                <div className="flex justify-between items-start mb-4">
                                <div className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-indigo-100">
                                    {paper.examName || 'Mock Test'}
                                </div>
                                <span className="text-gray-500 font-black text-sm bg-gray-100 px-3 py-1 rounded-lg">{paper.year || 'N/A'}</span>
                                </div>
                                
                                <Link to={testUrl} onClick={(e) => { e.preventDefault(); viewTestDetails(paper); }} className="text-xl font-black text-gray-900 mb-4 group-hover:text-indigo-700 transition-colors line-clamp-2">
                                    {paper.title}
                                </Link>
                                
                                <div className="flex flex-wrap gap-3 mb-6">
                                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-bold bg-gray-50 px-3 py-2 rounded-xl border border-gray-100"><FileText size={16} className="text-indigo-500"/> {paper.totalQuestions || paper.questions?.length || 0} Qs</div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-700 font-bold bg-gray-50 px-3 py-2 rounded-xl border border-gray-100"><Clock size={16} className="text-amber-500"/> {formatTime((paper.durationMins || 180) * 60)}</div>
                                </div>
                                
                                <div className="mt-auto space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <a href={paper.paperPdfUrl || '#'} target="_blank" rel="noreferrer" onClick={(e) => { if(!paper.paperPdfUrl || paper.paperPdfUrl === '#') { e.preventDefault(); alert('PDF not available'); } }} className="flex justify-center items-center gap-1.5 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition-colors text-xs active:scale-95">
                                    <Download size={14}/> Paper PDF
                                    </a>
                                    <a href={paper.answerKeyPdfUrl || '#'} target="_blank" rel="noreferrer" onClick={(e) => { if(!paper.answerKeyPdfUrl || paper.answerKeyPdfUrl === '#') { e.preventDefault(); alert('Answer Key not available'); } }} className="flex justify-center items-center gap-1.5 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition-colors text-xs active:scale-95">
                                    <Key size={14}/> Ans Key
                                    </a>
                                </div>
                                
                                <Link to={testUrl} onClick={(e) => { e.preventDefault(); viewTestDetails(paper); }} className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black py-3.5 rounded-xl shadow-md transition-transform active:scale-95 text-sm">
                                    <PlayCircle size={18}/> View Mock Details
                                </Link>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    if (screenState === 'test-landing') {
        const totalMarks = evaluableQuestionsCount * 4; 
        return (
          <div className="min-h-screen bg-gray-50 py-6 md:py-12 px-4 sm:px-6 lg:px-8 font-sans animate-in fade-in zoom-in-95 duration-300">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              
              <div className="bg-gradient-to-br from-indigo-800 via-indigo-700 to-blue-800 p-8 md:p-14 text-white text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 150%, #ffffff 0%, transparent 50%), radial-gradient(circle at 80% -50%, #ffffff 0%, transparent 50%)' }}></div>
                 
                 <BookOpen size={48} className="mx-auto mb-4 text-indigo-300 drop-shadow-md" />
                 <h1 className="text-3xl md:text-5xl font-black mb-6 relative z-10 leading-tight">{activePaper?.title}</h1>
                 
                 <div className="flex flex-wrap justify-center gap-3 relative z-10">
                    <span className="bg-white/20 px-5 py-2 rounded-full font-bold text-sm backdrop-blur-sm border border-white/30 flex items-center gap-1.5"><GraduationCap size={16}/> {activePaper?.examName}</span>
                    <span className="bg-white/20 px-5 py-2 rounded-full font-bold text-sm backdrop-blur-sm border border-white/30 flex items-center gap-1.5"><Clock size={16}/> {activePaper?.year} Series</span>
                 </div>
              </div>
              
              <div className="p-6 md:p-12">
                <div className="text-center mb-10">
                    <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
                        This is the official previous year question paper for <strong>{activePaper?.examName} {activePaper?.year}</strong>. Practice this exam in a real-time Computer Based Test (CBT) environment to accurately assess your preparation.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                   <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 text-center hover:shadow-md transition-shadow">
                      <FileText className="mx-auto text-blue-500 mb-2" size={28}/>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Evaluate Qs</p>
                      <p className="text-2xl font-black text-gray-900">{evaluableQuestionsCount}</p>
                   </div>
                   <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 text-center hover:shadow-md transition-shadow">
                      <Clock className="mx-auto text-amber-500 mb-2" size={28}/>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Duration</p>
                      <p className="text-2xl font-black text-gray-900">{activePaper?.durationMins} Mins</p>
                   </div>
                   <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 text-center hover:shadow-md transition-shadow">
                      <Award className="mx-auto text-emerald-500 mb-2" size={28}/>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Max Marks</p>
                      <p className="text-2xl font-black text-gray-900">{totalMarks}</p>
                   </div>
                   <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100 text-center hover:shadow-md transition-shadow">
                      <Target className="mx-auto text-red-500 mb-2" size={28}/>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Negative</p>
                      <p className="text-2xl font-black text-gray-900">-1 Mark</p>
                   </div>
                </div>
  
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                   <button onClick={resetEngine} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg order-2 sm:order-1">
                      <ArrowLeft size={20}/> Back to Library
                   </button>
                   <button onClick={goToInstructions} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-8 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-lg order-1 sm:order-2">
                      <PlayCircle size={24}/> Read Instructions & Start
                   </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

    if (screenState === 'instructions') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-3">
                  <AlertCircle className="text-indigo-600"/> Test Instructions
                </h1>
                <p className="text-gray-500 font-bold mt-2 ml-9">{activePaper?.title}</p>
              </div>
            </div>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg mb-1">Test Pattern</h4>
                  <p className="text-gray-600 text-sm font-medium">This test contains {questions.length} questions. Maximum {evaluableQuestionsCount} questions will be evaluated. Total duration is {formatTime((activePaper?.durationMins || 180) * 60)}. Timer cannot be paused.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg mb-1">Marking Scheme</h4>
                  <ul className="text-gray-600 text-sm font-medium space-y-1">
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> +4 marks for correct answer.</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> -1 mark for incorrect answer.</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-400"></span> 0 marks for unattempted.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
              <button onClick={() => setScreenState('test-landing')} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">Go Back</button>
              <button onClick={beginExam} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2 text-lg">
                <PlayCircle size={20}/> I am Ready to Begin
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (screenState === 'exam') {
      const currentQ = questions[currentIndex];
      
      const subjects = Array.from(new Set(questions.map((q, idx) => getSafeSubject(q, idx, questions.length))));
      const activeSubject = getSafeSubject(currentQ, currentIndex, questions.length);

      const handleSubjectTabClick = (subj) => {
        const firstQuestionIndex = questions.findIndex((q, idx) => getSafeSubject(q, idx, questions.length) === subj);
        if (firstQuestionIndex !== -1) {
          handleNavigate(firstQuestionIndex);
        }
      };

      return (
        <div className="fixed inset-0 z-[100] bg-[#f8f9fa] flex flex-col font-sans overflow-hidden animate-in fade-in duration-300">
          
          {isSubmitting && (
            <div className="absolute inset-0 z-[999] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
                <Loader2 className="w-16 h-16 animate-spin text-indigo-600 mb-6 drop-shadow-md" />
                <h2 className="text-3xl font-black text-gray-900 mb-2 text-center">Analyzing Responses</h2>
                <p className="text-gray-500 font-bold tracking-widest uppercase text-center text-sm px-4">Applying Evaluator & Generating Result...</p>
            </div>
          )}

          <header className="bg-white border-b border-gray-200 p-3 md:px-6 md:py-3 flex justify-between items-center shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
              <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md hidden sm:block shrink-0"><BookOpen size={20}/></div>
              <div className="min-w-0">
                <p className="font-black text-sm md:text-xl text-gray-900 leading-tight truncate max-w-[140px] sm:max-w-xs md:max-w-md">{activePaper?.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] md:text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">{activeSubject}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <button 
                onClick={() => setLanguage(prev => prev === 'en' ? 'hi' : 'en')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gray-50 hover:bg-indigo-50 border border-gray-200 text-gray-700 rounded-xl shadow-sm font-bold text-sm transition-all active:scale-95"
              >
                <Languages size={18}/> 
                <span>{language === 'en' ? 'English' : 'हिन्दी'}</span>
              </button>

              <div className={`flex items-center gap-1.5 px-2 py-1.5 md:px-4 md:py-2 rounded-xl font-black text-sm md:text-lg shadow-sm border ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-gray-50 text-gray-800 border-gray-200'}`}>
                <Clock size={16} /> <span className="tracking-wider">{formatTime(timeLeft)}</span>
              </div>
              <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className="p-2 md:px-4 md:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm flex items-center gap-2 font-bold text-sm transition-colors">
                {isPaletteOpen ? <PanelRightClose size={18}/> : <PanelRightOpen size={18}/>}
                <span className="hidden md:inline">{isPaletteOpen ? 'Close' : 'Palette'}</span>
              </button>
            </div>
          </header>

          <div className="flex-1 flex w-full h-full min-h-0 overflow-hidden relative">
            <div className={`flex-1 bg-white flex flex-col min-h-0 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-0 ${isPaletteOpen ? 'lg:mr-[320px] xl:mr-[380px]' : ''}`}>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <span className="bg-gray-100 text-gray-800 font-black px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm border border-gray-200 shadow-inner">Question {currentIndex + 1} / {questions.length}</span>
                  
                  <button 
                    onClick={() => setLanguage(prev => prev === 'en' ? 'hi' : 'en')}
                    className="sm:hidden flex items-center gap-1 px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg font-bold text-[10px]"
                  >
                    <Languages size={12}/> {language === 'en' ? 'EN' : 'HI'}
                  </button>

                  <div className="hidden sm:flex gap-2">
                    <span className="bg-green-50 text-green-700 font-bold px-3 py-1.5 rounded-lg text-xs border border-green-100 flex items-center gap-1.5">
                      +4 Marks
                    </span>
                    <span className="bg-red-50 text-red-700 font-bold px-3 py-1.5 rounded-lg text-xs border border-red-100 flex items-center gap-1.5">
                      -1 Negative
                    </span>
                  </div>
                </div>
                
                <div className="text-base md:text-xl font-bold text-gray-800 mb-6 leading-relaxed whitespace-pre-wrap overflow-x-auto">
                  <SafeMath text={getLocalizedText(currentQ?.text)} />
                </div>
                
                {currentQ?.imageUrl && getLocalizedText(currentQ.imageUrl) && (
                  <img src={getLocalizedText(currentQ.imageUrl)} alt="Question figure" loading="lazy" className="max-w-full max-h-48 md:max-h-64 mb-6 rounded-lg border border-gray-200 shadow-sm p-1" />
                )}

                {currentQ?.imageUrls && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {getLocalizedOptions(currentQ.imageUrls).map((url, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-t-lg text-xs border border-gray-200 border-b-0 w-full text-center">Graph {String.fromCharCode(65 + i)}</span>
                        <img src={url} loading="lazy" alt={`Graph ${String.fromCharCode(65 + i)}`} className="w-full max-h-40 md:max-h-48 object-contain border border-gray-200 rounded-b-lg bg-white p-2" />
                      </div>
                    ))}
                  </div>
                )}

                {currentQ?.textBelowImage && (
                  <div className="text-base md:text-xl font-bold text-gray-800 mb-6 leading-relaxed whitespace-pre-wrap overflow-x-auto">
                    <SafeMath text={getLocalizedText(currentQ.textBelowImage)} />
                  </div>
                )}

                <div className="space-y-3 max-w-4xl">
                  {getLocalizedOptions(currentQ?.options).map((opt, idx) => {
                    const isSelected = selectedAnswers[currentQ.id] === idx;
                    return (
                      <label key={idx} className={`flex items-start p-3 md:p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 group ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}>
                        <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 shrink-0 transition-colors ${isSelected ? 'border-indigo-600 bg-white' : 'border-gray-300 group-hover:border-indigo-400'}`}>
                          {isSelected && <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-indigo-600 rounded-full" />}
                        </div>
                        <div className={`font-semibold text-sm md:text-lg overflow-x-auto w-full ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                          {opt?.startsWith?.('http') ? (
                            <img src={opt} alt="Option Graph" loading="lazy" className="max-h-24 md:max-h-32 mix-blend-multiply rounded" />
                          ) : (
                            <SafeMath text={opt} />
                          )}
                        </div>
                        <input type="radio" className="hidden" checked={isSelected} onChange={() => handleOptionSelect(idx)} />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border-t border-gray-200 p-3 md:p-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-10 flex flex-wrap justify-between items-center gap-2 md:gap-3">
                <div className="flex gap-2 w-full md:w-auto order-2 md:order-1">
                  <button onClick={markForReview} className="flex-1 bg-white text-gray-700 hover:text-orange-600 border border-gray-300 font-bold py-2 md:py-3 px-2 md:px-5 rounded-xl text-xs md:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5">
                    <Target size={14}/> <span className="hidden sm:inline">Mark for Review</span><span className="sm:hidden">Review</span>
                  </button>
                  <button onClick={clearResponse} className="flex-1 bg-white text-gray-700 hover:text-red-600 border border-gray-300 font-bold py-2 md:py-3 px-2 md:px-5 rounded-xl text-xs md:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5">
                    <XCircle size={14}/> Clear
                  </button>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto order-1 md:order-2">
                  <button onClick={handlePrev} disabled={currentIndex === 0} className="flex-1 md:flex-none bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:opacity-50 border border-transparent font-black py-2.5 md:py-3 px-4 md:px-6 rounded-xl flex items-center justify-center gap-1 transition-all text-sm">
                    <ChevronLeft size={16}/> Prev
                  </button>
                  <button onClick={handleNext} className="flex-[2] md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 md:py-3 px-6 md:px-8 rounded-xl flex items-center justify-center gap-1 transition-all shadow-md text-sm">
                    {currentIndex === questions.length - 1 ? 'Save' : 'Save & Next'} <ChevronRight size={16}/>
                  </button>
                </div>
              </div>
            </div>

            {isPaletteOpen && (
              <div className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden" onClick={() => setIsPaletteOpen(false)}></div>
            )}

            <div className={`fixed inset-y-0 right-0 lg:absolute lg:inset-y-auto lg:top-0 lg:bottom-0 w-[85vw] sm:w-[320px] xl:w-[380px] bg-white border-l border-gray-200 flex flex-col z-50 lg:z-20 transition-transform duration-300 shadow-2xl lg:shadow-none ${isPaletteOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              
              <div className="flex justify-between items-center p-3 border-b border-gray-100 lg:hidden bg-indigo-600 text-white">
                 <h3 className="font-black text-sm">Question Palette</h3>
                 <button onClick={() => setIsPaletteOpen(false)} className="p-1 bg-white/20 rounded-md"><XCircle size={18}/></button>
              </div>

              <div className="bg-gray-50 border-b border-gray-200 shrink-0 flex overflow-x-auto custom-scrollbar">
                {subjects.map(subj => (
                  <button 
                    key={subj} 
                    onClick={() => handleSubjectTabClick(subj)} 
                    className={`flex-1 py-3 px-3 font-black text-[10px] md:text-sm whitespace-nowrap transition-colors border-b-2 ${activeSubject === subj ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}>
                    {subj}
                  </button>
                ))}
              </div>

              <div className="p-3 border-b border-gray-100 shrink-0 grid grid-cols-2 gap-y-2 gap-x-1 text-[10px] sm:text-xs font-bold text-gray-600">
                <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-green-500 border border-green-600"></div> Answered</div>
                <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-red-500 border border-red-600"></div> Not Answered</div>
                <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-orange-400 border border-orange-500"></div> Marked</div>
                <div className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded bg-gray-100 border border-gray-300"></div> Not Visited</div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-gray-50/50">
                <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const subj = getSafeSubject(q, idx, questions.length);
                    if (subj !== activeSubject) return null; 
                    
                    const status = statusMap[q.id];
                    const isCurrent = currentIndex === idx;
                    let bgColor = "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"; 
                    
                    if (status === 'answered') bgColor = "bg-green-500 text-white border-green-600 shadow-sm";
                    else if (status === 'marked') bgColor = "bg-orange-400 text-white border-orange-500 shadow-sm";
                    else if (status === 'unanswered') bgColor = "bg-red-500 text-white border-red-600 shadow-sm";
                    else if (status === 'read') bgColor = "bg-purple-500 text-white border-purple-600 shadow-sm";

                    return (
                      <button 
                        key={q.id || idx} 
                        onClick={() => handleNavigate(idx)} 
                        className={`w-full aspect-square rounded-lg flex items-center justify-center font-black text-[10px] sm:text-xs border transition-all ${bgColor} ${isCurrent ? 'ring-2 ring-indigo-600 ring-offset-1 scale-105 !border-indigo-600' : ''}`}>
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 border-t border-gray-200 bg-white shrink-0">
                <button 
                  onClick={() => { if(window.confirm("Are you sure you want to submit the test?")) submitTest(); }} 
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-lg transition-transform active:scale-95 text-sm sm:text-base flex justify-center items-center gap-2"
                >
                  <CheckCircle size={18}/> {isSubmitting ? 'Calculating...' : 'Submit Test'}
                </button>
              </div>

            </div>
          </div>
        </div>
      );
    }

    if (screenState === 'result') {
      const totalAttempted = scoreData.correct + scoreData.incorrect;
      const accuracy = totalAttempted > 0 ? Math.round((scoreData.correct / totalAttempted) * 100) : 0;
      
      let remark = "Keep Practicing! 📚";
      let remarkColor = "text-blue-100";
      if (accuracy >= 80) { remark = "Outstanding Performance! 🏆"; remarkColor = "text-yellow-300"; }
      else if (accuracy >= 60) { remark = "Good Job! Keep it up. 👍"; remarkColor = "text-green-200"; }

      return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 font-sans">
          <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            
            <div className="bg-gradient-to-br from-indigo-800 via-indigo-700 to-blue-800 p-8 md:p-12 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 150%, #ffffff 0%, transparent 50%), radial-gradient(circle at 80% -50%, #ffffff 0%, transparent 50%)' }}></div>
              
              <button onClick={resetEngine} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"><XCircle size={24}/></button>
              
              <Trophy size={64} className="mx-auto mb-4 text-yellow-400 drop-shadow-lg" />
              <p className="text-xs uppercase tracking-widest text-indigo-200 font-bold mb-2">Performance Report</p>
              <h2 className="text-2xl md:text-4xl font-black mb-3 drop-shadow-md">{activePaper?.title}</h2>
              <p className={`text-lg font-bold ${remarkColor}`}>{remark}</p>
              
              <button onClick={handleShare} className="mt-8 mx-auto flex items-center justify-center gap-2 bg-white text-indigo-800 hover:bg-indigo-50 font-black py-3 px-8 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95 z-10 relative text-sm md:text-base">
                <Share2 size={18} /> Share Score
              </button>
            </div>
            
            <div className="p-4 md:p-10 bg-gray-50/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
                <div className="bg-white p-4 md:p-6 rounded-2xl border-l-4 border-l-blue-500 shadow-sm border-t border-r border-b border-gray-100 relative overflow-hidden">
                  <Award size={20} className="text-blue-100 absolute top-4 right-4 hidden sm:block" />
                  <p className="text-gray-500 text-[10px] md:text-xs font-black uppercase mb-1">Total Score</p>
                  <p className="text-2xl md:text-4xl font-black text-blue-700">{scoreData.marks}</p>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-2xl border-l-4 border-l-green-500 shadow-sm border-t border-r border-b border-gray-100 relative overflow-hidden">
                  <Target size={20} className="text-green-100 absolute top-4 right-4 hidden sm:block" />
                  <p className="text-gray-500 text-[10px] md:text-xs font-black uppercase mb-1">Accuracy</p>
                  <p className="text-2xl md:text-4xl font-black text-green-600">{accuracy}%</p>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-2xl border-l-4 border-l-red-500 shadow-sm border-t border-r border-b border-gray-100 relative overflow-hidden">
                  <AlertCircle size={20} className="text-red-100 absolute top-4 right-4 hidden sm:block" />
                  <p className="text-gray-500 text-[10px] md:text-xs font-black uppercase mb-1">Incorrect</p>
                  <p className="text-2xl md:text-4xl font-black text-red-600">{scoreData.incorrect}</p>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-2xl border-l-4 border-l-gray-400 shadow-sm border-t border-r border-b border-gray-100 relative overflow-hidden">
                  <Eye size={20} className="text-gray-200 absolute top-4 right-4 hidden sm:block" />
                  <p className="text-gray-500 text-[10px] md:text-xs font-black uppercase mb-1">Skipped</p>
                  <p className="text-2xl md:text-4xl font-black text-gray-600">{scoreData.unattempted}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
                <h3 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2"><BarChart3 size={24} className="text-indigo-600"/> Detailed Analysis</h3>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setLanguage(prev => prev === 'en' ? 'hi' : 'en')}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm transition-colors text-xs md:text-sm"
                  >
                    <Languages size={16}/> 
                    <span className="hidden sm:inline">{language === 'en' ? 'Switch to Hindi' : 'Switch to English'}</span>
                  </button>

                  <a href={activePaper?.answerKeyPdfUrl || '#'} target="_blank" rel="noreferrer" onClick={(e) => { if(!activePaper?.answerKeyPdfUrl || activePaper?.answerKeyPdfUrl === '#') { e.preventDefault(); alert('Answer Key not available'); } }} className="flex items-center justify-center gap-1.5 bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-xl font-bold shadow-sm transition-colors text-xs md:text-sm">
                    <Key size={16}/> Download Key
                  </a>
                </div>
              </div>

              <div className="space-y-6 md:space-y-8">
                {questions.map((q, idx) => {
                  const userAns = selectedAnswers[q.id];
                  const isCorrect = userAns === q.correctOptionIndex;
                  const isUnattempted = userAns === undefined;
                  
                  return (
                    <div key={q.id || idx} className={`bg-white p-4 md:p-8 rounded-3xl border-2 shadow-sm ${isCorrect ? 'border-green-200' : isUnattempted ? 'border-gray-200' : 'border-red-200'}`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                        <div className="flex gap-3 md:gap-4 w-full">
                          <div className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center font-black text-white text-sm md:text-base ${isCorrect ? 'bg-green-500' : isUnattempted ? 'bg-gray-400' : 'bg-red-500'}`}>
                            {idx + 1}
                          </div>
                          <div className="pt-0.5 md:pt-1 font-bold text-gray-900 text-sm md:text-lg leading-relaxed overflow-x-auto w-full">
                            <SafeMath text={getLocalizedText(q.text)} />
                          </div>
                        </div>
                        <span className="hidden sm:block shrink-0 text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">{getSafeSubject(q, idx, questions.length)}</span>
                      </div>
                      
                      {q.imageUrl && getLocalizedText(q.imageUrl) && (
                        <img src={getLocalizedText(q.imageUrl)} alt="Explanation figure" loading="lazy" className="max-w-full max-h-40 md:max-h-48 mb-6 border border-gray-200 rounded-xl p-1 md:p-2 bg-gray-50 mx-auto sm:mx-0" />
                      )}

                      {q.imageUrls && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                          {getLocalizedOptions(q.imageUrls).map((url, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <span className="bg-gray-100 text-gray-700 font-bold px-3 py-1 rounded-t-lg text-xs border border-gray-200 border-b-0 w-full text-center">Graph {String.fromCharCode(65 + i)}</span>
                              <img src={url} alt={`Graph ${String.fromCharCode(65 + i)}`} loading="lazy" className="w-full max-h-40 md:max-h-48 object-contain border border-gray-200 rounded-b-lg bg-gray-50 p-2" />
                            </div>
                          ))}
                        </div>
                      )}

                      {q.textBelowImage && (
                        <div className="font-bold text-gray-900 mb-6 text-sm md:text-lg pl-0 sm:pl-14 overflow-x-auto">
                          <SafeMath text={getLocalizedText(q.textBelowImage)} />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-6 pl-0 sm:pl-12 md:pl-14">
                        {getLocalizedOptions(q.options).map((opt, oIdx) => (
                          <div key={oIdx} className={`p-3 md:p-4 rounded-xl text-xs md:text-sm flex justify-between items-center font-bold transition-all border-2 overflow-x-auto ${oIdx === q.correctOptionIndex ? "bg-green-50 border-green-500 text-green-800" : (userAns === oIdx && !isCorrect) ? "bg-red-50 border-red-500 text-red-800" : "border-gray-100 bg-gray-50 text-gray-600"}`}>
                            <span>
                              {opt?.startsWith?.('http') ? (
                                <img src={opt} alt="Option Graph" loading="lazy" className="max-h-20 md:max-h-32 mix-blend-multiply rounded" />
                              ) : (
                                <SafeMath text={opt} />
                              )}
                            </span>
                            {oIdx === q.correctOptionIndex && <CheckCircle size={18} className="text-green-600 drop-shadow-sm shrink-0 ml-2"/>}
                            {(userAns === oIdx && !isCorrect) && <XCircle size={18} className="text-red-600 drop-shadow-sm shrink-0 ml-2"/>}
                          </div>
                        ))}
                      </div>

                      <div className="bg-indigo-50/50 p-4 md:p-6 rounded-2xl border border-indigo-100 text-xs md:text-sm font-medium text-gray-700 mt-6 ml-0 sm:pl-12 md:ml-14">
                        <h4 className="text-indigo-800 font-black text-sm md:text-base flex items-center gap-1.5 mb-2 md:mb-3"><FileText size={16}/> {language === 'en' ? 'Expert Explanation' : 'विशेषज्ञ व्याख्या'}</h4> 
                        <div className="text-gray-700 leading-relaxed overflow-x-auto"><SafeMath text={getLocalizedText(q.explanation) || (language === 'en' ? "Refer to the official answer key for detailed steps." : "विस्तृत चरणों के लिए आधिकारिक उत्तर कुंजी देखें।")} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-center">
                 <button onClick={resetEngine} className="bg-gray-900 hover:bg-black text-white font-black py-3.5 md:py-4 px-8 md:px-12 rounded-full text-sm md:text-lg shadow-xl transition-transform hover:scale-105 active:scale-95">Return to Dashboard</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Helmet>
        <title>{activePaper ? `${activePaper.title} | Live Mock Test` : 'Live Test Engine | Professional Mock CBT'}</title>
        <meta name="description" content={activePaper ? `Practice the ${activePaper.examName} ${activePaper.year} previous year question paper online. Free mock test with detailed solutions.` : "Central India's leading platform for error-free competitive exam form filling, live mock tests, and AI college prediction."} />
        <meta name="keywords" content={activePaper ? `${activePaper.examName} ${activePaper.year} PYQ, ${activePaper.title} online test, free mock test` : "Live Mock Test, PYQ, NEET, JEE"} />
      </Helmet>
      {renderScreen()}
    </>
  );
}
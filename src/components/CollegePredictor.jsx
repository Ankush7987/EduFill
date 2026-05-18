import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  Sparkles,
  Trophy,
  MapPin,
  Target,
  CheckCircle,
  AlertCircle,
  Calculator,
  BookOpen,
  Activity,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Zap,
  UserRound,
  Smartphone,
  GraduationCap,
  Building2,
  ChevronDown,
  Award,
  BarChart3,
  Check,
  ArrowRight,
  Home,
  Stethoscope,
  Percent,
  SlidersHorizontal,
  Database,
  Lock,
  BadgeCheck,
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from './SEO';
import Header from './home/Header';

// 🌟 ULTRA-PRECISE MARKS TO RANK DATA
const marksToRankData = [
  { score: 720, rank: 50 }, { score: 715, rank: 220 }, { score: 710, rank: 800 },
  { score: 705, rank: 1400 }, { score: 700, rank: 2200 }, { score: 695, rank: 3200 },
  { score: 690, rank: 4500 }, { score: 685, rank: 6500 }, { score: 680, rank: 9500 },
  { score: 675, rank: 11500 }, { score: 670, rank: 14000 }, { score: 660, rank: 21000 },
  { score: 650, rank: 29000 }, { score: 640, rank: 39000 }, { score: 630, rank: 50000 },
  { score: 620, rank: 62000 }, { score: 610, rank: 75000 }, { score: 600, rank: 89000 },
  { score: 590, rank: 104000 }, { score: 580, rank: 120000 }, { score: 570, rank: 138000 },
  { score: 560, rank: 157000 }, { score: 550, rank: 178000 }, { score: 540, rank: 200000 },
  { score: 530, rank: 225000 }, { score: 500, rank: 300000 }, { score: 450, rank: 480000 },
  { score: 400, rank: 680000 }, { score: 350, rank: 920000 }, { score: 300, rank: 1150000 },
  { score: 200, rank: 1650000 }, { score: 100, rank: 2200000 }, { score: 0, rank: 2500000 }
];

const calculateEstimatedRank = (score) => {
  if (score >= 720) return 50; if (score <= 0) return 2500000;
  for (let i = 0; i < marksToRankData.length - 1; i++) {
    if (score <= marksToRankData[i].score && score >= marksToRankData[i + 1].score) {
      const scoreDiff = marksToRankData[i].score - marksToRankData[i + 1].score;
      const rankDiff = marksToRankData[i + 1].rank - marksToRankData[i].rank;
      const scoreDrop = marksToRankData[i].score - score;
      return Math.round(marksToRankData[i].rank + (scoreDrop / scoreDiff) * rankDiff);
    }
  }
  return 1000000;
};

const stateDistricts = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kadapa"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Nalanda"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Jagdalpur", "Korba"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Rohtak", "Hisar"],
  "Himachal Pradesh": ["Shimla", "Mandi", "Dharamshala", "Solan"],
  "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubli", "Belagavi", "Gulbarga"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Rewa"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Meerut", "Gorakhpur"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol", "Burdwan"]
};

const CATEGORY_OPTIONS = [
  { value: 'General', label: 'General (UR)' },
  { value: 'OBC', label: 'OBC' },
  { value: 'EWS', label: 'EWS' },
  { value: 'SC', label: 'SC' },
  { value: 'ST', label: 'ST' },
];

export default function CollegePredictor({ autoFillMobile = '', autoFillName = '' }) {
  const navigate = useNavigate();
  const [admissionMode, setAdmissionMode] = useState('NEET');
  const [inputMode, setInputMode] = useState('rank');

  const [finderForm, setFinderForm] = useState({
    name: autoFillName || '',
    inputValue: '',
    category: 'General',
    state: 'All India (Any State)',
    district: 'All Districts',
    dream: 'All Colleges',
    course: 'All',
    mobile: autoFillMobile || ''
  });

  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [availableInstitutions, setAvailableInstitutions] = useState(["All Colleges"]);
  const [isFetchingColleges, setIsFetchingColleges] = useState(false);

  const dropdownCache = useRef({});

  const theme = admissionMode === '12th'
    ? {
        main: 'indigo',
        text: 'text-indigo-600',
        darkText: 'text-indigo-900',
        bg: 'bg-indigo-600',
        hover: 'hover:bg-indigo-700',
        soft: 'bg-indigo-50',
        border: 'border-indigo-100',
        ring: 'focus:ring-indigo-500/10',
        gradient: 'from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700',
        icon: <BookOpen size={18} />,
      }
    : {
        main: 'emerald',
        text: 'text-emerald-600',
        darkText: 'text-emerald-900',
        bg: 'bg-emerald-600',
        hover: 'hover:bg-emerald-700',
        soft: 'bg-emerald-50',
        border: 'border-emerald-100',
        ring: 'focus:ring-emerald-500/10',
        gradient: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
        icon: <Stethoscope size={18} />,
      };

  const handleModeSwitch = (mode) => {
    setAdmissionMode(mode);
    setInputMode(mode === 'NEET' ? 'rank' : 'percentage');
    setFinderForm({ ...finderForm, inputValue: '', course: 'All', dream: 'All Colleges' });
    setPredictionResult(null);
  };

  useEffect(() => {
    const cacheKey = `${admissionMode}-${finderForm.course}-${finderForm.state}-${finderForm.district}-${finderForm.category}`;

    const fetchDynamicColleges = async () => {
      if (dropdownCache.current[cacheKey]) {
        setAvailableInstitutions(["All Colleges", ...dropdownCache.current[cacheKey]]);
        return;
      }

      setIsFetchingColleges(true);
      try {
        const response = await fetch("https://edufill-server.onrender.com/api/colleges/dropdown", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exam: admissionMode,
            course: finderForm.course,
            state: finderForm.state,
            district: finderForm.district,
            category: finderForm.category
          })
        });
        const data = await response.json();
        if (data.success) {
          dropdownCache.current[cacheKey] = data.names;
          setAvailableInstitutions(["All Colleges", ...data.names]);

          if (finderForm.dream !== 'All Colleges' && !data.names.includes(finderForm.dream)) {
            setFinderForm(prev => ({ ...prev, dream: 'All Colleges' }));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsFetchingColleges(false);
      }
    };

    const timer = setTimeout(() => {
      fetchDynamicColleges();
    }, 300);

    return () => clearTimeout(timer);
  }, [finderForm.course, finderForm.state, finderForm.district, finderForm.category, admissionMode]);

  const uniqueStates = ["All India (Any State)", ...Object.keys(stateDistricts)];
  const currentDistricts = finderForm.state === "All India (Any State)" ? [] : stateDistricts[finderForm.state] || [];

  const handleStateChange = (e) => {
    setFinderForm({ ...finderForm, state: e.target.value, district: 'All Districts' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finderForm.name || finderForm.mobile.length !== 10) return alert("Valid Name & 10-digit WhatsApp No. is required.");

    let rawValue = parseFloat(finderForm.inputValue);
    if (isNaN(rawValue) || rawValue <= 0) return alert("Please enter a valid number.");

    let finalValueToPredict = rawValue;
    let isEstimated = false;

    if (admissionMode === 'NEET') {
      if (inputMode === 'score') {
        if (rawValue > 720) return alert("NEET score cannot exceed 720.");
        finalValueToPredict = calculateEstimatedRank(rawValue);
        isEstimated = true;
      }
    } else {
      if (rawValue > 100) return alert("12th Percentage cannot exceed 100%.");
    }

    setIsPredicting(true);

    try {
      const response = await fetch("https://edufill-server.onrender.com/api/colleges/predict", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: admissionMode,
          rank: finalValueToPredict,
          category: finderForm.category,
          course: finderForm.course,
          dream: finderForm.dream,
          state: finderForm.state,
          district: finderForm.district
        })
      });

      const data = await response.json();
      let resultData = { success: false, isFallback: false, title: "", message: "", colleges: [], userValue: finalValueToPredict, isEstimated, score: rawValue };

      if (data.success && data.colleges && data.colleges.length > 0) {
        const valText = admissionMode === '12th' ? `${finalValueToPredict}%` : `AIR ${finalValueToPredict.toLocaleString()}`;
        resultData = {
          success: true,
          isFallback: data.isFallback,
          title: data.isFallback ? "Alternatives Found ✨" : "Great News! 🎉",
          message: data.isFallback
            ? `Securing your specific choices is unlikely at ${isEstimated ? `an estimated AIR of ${valText}` : valText}. But we found ${data.colleges.length} other excellent options:`
            : `We found ${data.colleges.length} excellent options matching your profile at ${isEstimated ? `an estimated AIR of ${valText}` : valText}.`,
          colleges: data.colleges,
          userValue: finalValueToPredict, isEstimated, score: rawValue
        };
      }

      await addDoc(collection(db, "Predictor_Requests"), {
        ...finderForm, studentName: finderForm.name, admissionMode,
        predictedValue: finalValueToPredict, inputMethod: inputMode,
        result: resultData.success ? (resultData.isFallback ? 'Fallback Options' : 'Colleges Found') : 'No Options Found',
        status: 'New Request', source: 'Website', timestamp: serverTimestamp()
      });

      setPredictionResult(resultData);
    } catch (error) {
      alert("Server connection failed. Please check your internet or make sure backend is running.");
    } finally {
      setIsPredicting(false);
    }
  };

  const courses = admissionMode === 'NEET'
    ? ["All", "MBBS", "BDS", "B.Sc. Nursing", "AIIMS"]
    : ["All", "B.Sc", "B.A", "B.Com", "BBA", "BCA", "B.Tech"];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-x-hidden pb-20 lg:pb-0">
      <SEO
        title="Free NEET & 12th Board College Predictor 2026 | EduFill"
        description="Enter your expected score/rank to instantly predict your dream medical or graduation college. Accurate state quota and all India rank cutoffs for MBBS, B.Sc, B.Com."
        keywords="NEET college predictor, 12th board college predictor, MBBS predictor, B.Sc admission predictor, cutoff rank predictor 2026, AI college predictor, EduFill"
        url="/college-predictor"
      />

      {/* Fixed Header: always stays at top */}
      <div className="fixed left-0 right-0 top-0 z-[90]">
        <Header currentUser={null} onOpenFeedback={() => {}} />
      </div>

      {/* FIXED LEFT + SCROLLING FORM */}
      <main className="relative flex-1 bg-[#F8FAFC] pt-[61px] lg:pt-[65px]">
        <div className="absolute -top-28 left-10 h-72 w-72 rounded-full bg-emerald-100 blur-3xl pointer-events-none" />
        <div className="absolute top-16 right-0 h-80 w-80 rounded-full bg-blue-100/80 blur-3xl pointer-events-none" />

        <div className="relative w-full">
          {/* LEFT BRANDING - Fixed on desktop, normal on mobile */}
          <aside className="relative px-4 md:px-8 py-8 sm:py-10 lg:fixed lg:left-0 lg:top-[65px] lg:h-[calc(100vh-65px)] lg:w-[42%] lg:overflow-hidden lg:border-r lg:border-gray-100 lg:bg-gradient-to-br lg:from-white lg:via-emerald-50/70 lg:to-blue-50 lg:px-8 xl:px-12 lg:py-10">
            <div className="hidden lg:block absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl pointer-events-none" />
            <div className="hidden lg:block absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto lg:max-w-none">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 shadow-sm mb-5">
                <Sparkles size={14} className="text-emerald-500" />
                AI Powered College Matching
              </div>

              <h1 className="text-[2.35rem] sm:text-5xl lg:text-[4.1rem] font-black text-gray-950 leading-[1.05] tracking-tight mb-5">
                Find Your <br />
                <span className="text-emerald-600">Dream College</span> Faster.
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-semibold leading-relaxed max-w-2xl mb-6">
                NEET rank, score ya 12th percentage ke basis par possible colleges predict karo. EduFill algorithm cutoff, category, state aur course filters ko analyze karta hai.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3 mb-6">
                <TrustMini icon={<Database size={18} />} title="10K+ Colleges" text="Indexed database" />
                <TrustMini icon={<Target size={18} />} title="Smart Match" text="Category + quota based" />
                <TrustMini icon={<ShieldCheck size={18} />} title="Safe & Free" text="Student-friendly tool" />
              </div>

              <div className="rounded-[1.5rem] border border-emerald-100 bg-white/85 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-950">Privacy-first prediction</h3>
                    <p className="text-xs font-semibold text-gray-500 leading-relaxed mt-1">
                      Your request is saved only to help EduFill provide better counselling and support.
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block mt-6 rounded-[1.5rem] border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">EduFill Promise</p>
                    <p className="text-sm font-black text-gray-900 mt-1">Simple, secure and student-friendly prediction.</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                    <Check size={22} />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT FORM / RESULT CARD - Only this side scrolls on desktop */}
          <section className="relative w-full px-4 md:px-8 py-8 sm:py-10 lg:ml-[42%] lg:w-[58%] lg:min-h-[calc(100vh-65px)] lg:px-8 xl:px-12 lg:py-10">
            <div className="w-full max-w-3xl mx-auto">
              <div className="w-full rounded-[2rem] bg-white border border-gray-100 shadow-[0_22px_65px_rgba(15,23,42,0.10)] overflow-hidden">
                {!predictionResult ? (
                  <div className="p-4 sm:p-6 lg:p-7">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Free Tool</p>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-950">College Predictor</h2>
                        <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-1">Fill details and get instant matching colleges.</p>
                      </div>

                      <button
                        onClick={() => navigate('/')}
                        className="hidden sm:flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-600 hover:bg-gray-50"
                      >
                        <Home size={14} />
                        Home
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* ADMISSION MODE */}
                      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1.5">
                        <ModeButton
                          active={admissionMode === 'NEET'}
                          onClick={() => handleModeSwitch('NEET')}
                          icon={<Stethoscope size={17} />}
                          title="Medical"
                          subtitle="NEET"
                          color="emerald"
                        />
                        <ModeButton
                          active={admissionMode === '12th'}
                          onClick={() => handleModeSwitch('12th')}
                          icon={<BookOpen size={17} />}
                          title="UG Admission"
                          subtitle="12th Based"
                          color="indigo"
                        />
                      </div>

                      {/* BASIC DETAILS */}
                      <FormSection title="Student Details" icon={<UserRound size={16} />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <InputField
                            label="Student Name"
                            required
                            value={finderForm.name}
                            onChange={(value) => setFinderForm({ ...finderForm, name: value })}
                            placeholder="Your full name"
                            icon={<UserRound size={16} />}
                          />
                          <InputField
                            label="WhatsApp No."
                            required
                            type="tel"
                            maxLength="10"
                            value={finderForm.mobile}
                            onChange={(value) => setFinderForm({ ...finderForm, mobile: value })}
                            placeholder="10-digit number"
                            icon={<Smartphone size={16} />}
                          />
                        </div>
                      </FormSection>

                      {/* LOCATION */}
                      <FormSection title="Location Preference" icon={<MapPin size={16} />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <SelectField label="State Priority" value={finderForm.state} onChange={handleStateChange}>
                            {uniqueStates.map(st => <option key={st} value={st}>{st}</option>)}
                          </SelectField>

                          <SelectField
                            label="District"
                            value={finderForm.district}
                            onChange={e => setFinderForm({ ...finderForm, district: e.target.value })}
                            disabled={finderForm.state === "All India (Any State)"}
                          >
                            <option value="All Districts">All Districts</option>
                            {currentDistricts.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                          </SelectField>
                        </div>
                      </FormSection>

                      {/* COURSE */}
                      <FormSection title="Course Preference" icon={<GraduationCap size={16} />}>
                        <div className="flex flex-wrap gap-2">
                          {courses.map(course => (
                            <button
                              key={course}
                              type="button"
                              onClick={() => setFinderForm({ ...finderForm, course })}
                              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${
                                finderForm.course === course
                                  ? `${theme.bg} text-white border-transparent shadow-md`
                                  : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                              }`}
                            >
                              {course}
                            </button>
                          ))}
                        </div>
                      </FormSection>

                      {/* CATEGORY + COLLEGE */}
                      <FormSection title="Admission Filters" icon={<SlidersHorizontal size={16} />}>
                        <div className="grid grid-cols-1 sm:grid-cols-[0.8fr_1.2fr] gap-4">
                          <SelectField
                            label="Category"
                            value={finderForm.category}
                            onChange={e => setFinderForm({ ...finderForm, category: e.target.value })}
                          >
                            {CATEGORY_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                          </SelectField>

                          <SelectField
                            label="Specific College?"
                            value={finderForm.dream}
                            onChange={e => setFinderForm({ ...finderForm, dream: e.target.value })}
                            loading={isFetchingColleges}
                          >
                            {availableInstitutions.length === 1
                              ? <option value="All Colleges">-- No Colleges Found --</option>
                              : availableInstitutions.map((inst, idx) => <option key={idx} value={inst}>{inst}</option>)}
                          </SelectField>
                        </div>
                      </FormSection>

                      {/* SCORE/RANK */}
                      <div className={`rounded-[1.5rem] border ${theme.border} ${theme.soft} p-4 sm:p-5`}>
                        {admissionMode === 'NEET' && (
                          <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-1.5 border border-emerald-100 shadow-sm mb-4">
                            <button
                              type="button"
                              onClick={() => {
                                setInputMode('rank');
                                setFinderForm({ ...finderForm, inputValue: '' });
                              }}
                              className={`py-2.5 text-sm font-black rounded-lg transition-all ${
                                inputMode === 'rank'
                                  ? 'bg-emerald-600 text-white shadow'
                                  : 'text-gray-500 hover:text-emerald-600'
                              }`}
                            >
                              I Know My Rank
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setInputMode('score');
                                setFinderForm({ ...finderForm, inputValue: '' });
                              }}
                              className={`py-2.5 text-sm font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                inputMode === 'score'
                                  ? 'bg-emerald-600 text-white shadow'
                                  : 'text-gray-500 hover:text-emerald-600'
                              }`}
                            >
                              <Calculator size={14} /> Est. Score
                            </button>
                          </div>
                        )}

                        <label className={`block text-xs font-black mb-3 uppercase tracking-widest text-center ${theme.darkText}`}>
                          {admissionMode === '12th'
                            ? 'Enter 12th Board Percentage (%)'
                            : (inputMode === 'rank' ? 'Enter All India Rank (AIR)' : 'Enter Expected NEET Score (720)')}
                        </label>

                        <div className="relative">
                          <input
                            type="number"
                            step={admissionMode === '12th' ? "0.01" : "1"}
                            required
                            value={finderForm.inputValue}
                            onChange={e => setFinderForm({ ...finderForm, inputValue: e.target.value })}
                            className={`w-full rounded-2xl border-2 bg-white px-5 py-4 text-center text-3xl sm:text-4xl font-black tracking-widest outline-none transition-all shadow-inner ${theme.darkText} ${theme.border} focus:border-emerald-500 focus:ring-4 ${theme.ring}`}
                            placeholder={admissionMode === '12th' ? '85.50' : (inputMode === 'rank' ? '15400' : '640')}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                            {admissionMode === '12th' ? <Percent size={24} /> : <BarChart3 size={24} />}
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isPredicting || isFetchingColleges}
                        className={`w-full bg-gradient-to-r ${theme.gradient} disabled:opacity-70 text-white font-black py-4 sm:py-5 rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-95 flex justify-center items-center gap-3 text-base sm:text-lg`}
                      >
                        {isPredicting ? (
                          <>
                            <Loader2 className="animate-spin" size={22} /> Analyzing Database...
                          </>
                        ) : (
                          <>
                            <Search size={22} /> Predict My College
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  <ResultView
                    predictionResult={predictionResult}
                    admissionMode={admissionMode}
                    finderForm={finderForm}
                    setPredictionResult={setPredictionResult}
                    theme={theme}
                  />
                )}
              </div>

              {/* INFO STRIP - stays with scrolling form side */}
              <section className="py-8 sm:py-10 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InfoStrip icon={<BadgeCheck size={22} />} title="Cutoff Based Matching" text="Prediction is based on past years' cutoffs and your filters." />
                  <InfoStrip icon={<Building2 size={22} />} title="State + Category Filters" text="You can filter by state, district and course." />
                  <InfoStrip icon={<Award size={22} />} title="Counselling Ready" text="Use results for planning decisions." />
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>

    </div>
  );
}

function ModeButton({ active, onClick, icon, title, subtitle, color }) {
  const activeClass = color === 'emerald'
    ? 'bg-white text-emerald-700 shadow-sm'
    : 'bg-white text-indigo-700 shadow-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-3 text-left transition-all flex items-center justify-center sm:justify-start gap-3 ${
        active ? activeClass : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      <span className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-emerald-50' : 'bg-white/70'}`}>
        {icon}
      </span>
      <span>
        <span className="block text-xs sm:text-sm font-black">{title}</span>
        <span className="block text-[10px] font-bold opacity-70">{subtitle}</span>
      </span>
    </button>
  );
}

function TrustMini({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-black text-gray-950">{title}</h3>
      <p className="mt-1 text-xs font-semibold text-gray-500">{text}</p>
    </div>
  );
}

function FormSection({ title, icon, children }) {
  return (
    <div className="rounded-[1.35rem] border border-gray-100 bg-gray-50/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-gray-700">
        <span className="h-8 w-8 rounded-xl bg-white border border-gray-100 text-emerald-600 flex items-center justify-center">
          {icon}
        </span>
        <h3 className="text-sm font-black">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, icon, type = 'text', maxLength, required }) {
  return (
    <div>
      <label className="block text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-widest ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input
          type={type}
          maxLength={maxLength}
          required={required}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3.5 outline-none font-bold text-gray-800 transition-all bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, disabled, loading, children }) {
  return (
    <div>
      <label className="flex items-center justify-between text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-widest ml-1">
        <span>{label}</span>
        {loading && <Loader2 size={12} className="animate-spin text-emerald-600" />}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3.5 pr-9 outline-none bg-white font-bold text-sm cursor-pointer disabled:opacity-50 text-gray-800 transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          {children}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>
    </div>
  );
}

function ResultView({ predictionResult, admissionMode, finderForm, setPredictionResult, theme }) {
  return (
    <div className="p-4 sm:p-6 lg:p-7 animate-in zoom-in-95 duration-300">
      {predictionResult.success ? (
        <div className="text-center">
          <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 shadow-xl transform rotate-3 ${
            predictionResult.isFallback
              ? 'bg-amber-100 text-amber-500 border border-amber-200'
              : 'bg-emerald-100 text-emerald-500 border border-emerald-200'
          }`}>
            {predictionResult.isFallback ? <AlertTriangle size={38} className="-rotate-3" /> : <Trophy size={38} className="-rotate-3" />}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-gray-950 mb-3">{predictionResult.title}</h3>

          <div className={`text-sm font-bold mb-6 leading-relaxed p-4 rounded-2xl border text-left ${
            predictionResult.isFallback
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {predictionResult.message}
          </div>

          <div className="bg-gray-50 rounded-[1.5rem] p-4 sm:p-5 mb-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Matched Institutions</p>
              <div className="flex flex-col items-start sm:items-end">
                <span className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl mb-1 shadow-sm border ${
                  admissionMode === '12th'
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                    : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                }`}>
                  {admissionMode === '12th'
                    ? `Marks: ${predictionResult.userValue}%`
                    : (predictionResult.isEstimated ? `Est. AIR: ${predictionResult.userValue.toLocaleString()}` : `AIR: ${predictionResult.userValue.toLocaleString()}`)}
                </span>
                {predictionResult.isEstimated && (
                  <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded border">
                    Expected Score: {predictionResult.score}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 max-h-[540px] overflow-y-auto pr-1 sm:pr-2">
              {predictionResult.colleges.map((col, i) => (
                <CollegeCard key={i} col={col} admissionMode={admissionMode} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <NoOptionsView predictionResult={predictionResult} finderForm={finderForm} admissionMode={admissionMode} />
      )}

      <div className="bg-gray-50 text-gray-500 p-4 rounded-xl mb-5 flex items-center justify-center gap-3 border border-gray-200">
        <span className="relative flex h-3 w-3">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${admissionMode === '12th' ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
          <span className={`relative inline-flex rounded-full h-3 w-3 ${admissionMode === '12th' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
        </span>
        <p className="text-xs font-black uppercase tracking-widest">Smart Report for +91 {finderForm.mobile}</p>
      </div>

      <button
        onClick={() => setPredictionResult(null)}
        className="w-full bg-gray-950 hover:bg-black text-white font-black py-4 rounded-2xl transition-all active:scale-95 text-base shadow-xl flex items-center justify-center gap-3"
      >
        <RefreshCw size={18} /> {predictionResult?.success ? 'Check Another Status' : 'Modify Search Filters'}
      </button>
    </div>
  );
}

function CollegeCard({ col, admissionMode }) {
  const isSafe = col.probability?.includes('Safe');

  return (
    <div className={`bg-white border rounded-2xl p-4 text-left shadow-sm hover:shadow-lg transition-all relative overflow-hidden group ${
      admissionMode === '12th' ? 'border-gray-100 hover:border-indigo-300' : 'border-gray-100 hover:border-emerald-300'
    }`}>
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
        <h4 className={`font-black text-lg leading-tight transition-colors pr-2 ${
          admissionMode === '12th' ? 'text-gray-900 group-hover:text-indigo-700' : 'text-gray-900 group-hover:text-emerald-700'
        }`}>
          {col.name}
        </h4>
        <span className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
          isSafe ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {isSafe ? <CheckCircle size={12} /> : <Target size={12} />} {col.probability}
        </span>
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1.5 font-bold mb-4 bg-gray-50 w-fit px-3 py-1.5 rounded-md border border-gray-100">
        <MapPin size={14} className="text-gray-400" /> {col.state}
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100 gap-4">
        <div className="flex flex-wrap gap-2">
          {col.tags.map((tag, idx) => (
            <span key={idx} className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
              admissionMode === '12th'
                ? 'bg-white border-indigo-100 text-indigo-600 shadow-sm'
                : 'bg-white border-emerald-100 text-emerald-600 shadow-sm'
            }`}>
              {tag}
            </span>
          ))}
        </div>
        <div className="text-left sm:text-right shrink-0 w-full sm:w-auto border-t sm:border-0 border-gray-200 pt-3 sm:pt-0">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Closing Cutoff</p>
          <p className="text-2xl font-black text-gray-900">
            {col.currentCutoff.toLocaleString()}{admissionMode === '12th' ? '%' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

function NoOptionsView({ predictionResult, finderForm, admissionMode }) {
  return (
    <div className="text-center pb-2">
      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 transform -rotate-3 border border-red-100 shadow-lg">
        <AlertCircle size={42} />
      </div>
      <h3 className="text-2xl sm:text-3xl font-black text-gray-950 mb-4">Don't Lose Hope! ✨</h3>

      <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 text-left mb-6 shadow-sm">
        <p className="text-gray-600 text-sm font-medium leading-relaxed mb-5">
          <span className="font-black text-gray-900 text-lg block mb-2">Hi {finderForm.name.split(' ')[0]},</span>
          We checked our entire live database. Based on your <b>{finderForm.category} Category</b> and <b>{admissionMode === '12th' ? `${predictionResult.userValue}%` : (predictionResult.isEstimated ? `Estimated Rank (${predictionResult.userValue.toLocaleString()})` : `Rank (${predictionResult.userValue.toLocaleString()})`)}</b>, securing a seat in {finderForm.dream !== 'All Colleges' ? `"${finderForm.dream}"` : (finderForm.course !== 'All' ? finderForm.course : 'these specific colleges')} is highly unlikely this year.
        </p>

        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Your Best Alternative Options:</h4>
          <ul className="space-y-3 text-sm text-gray-700 font-bold">
            <li className="flex items-start gap-3"><div className="mt-1 w-2 h-2 bg-indigo-500 rounded-full shrink-0" /> <span><b>State Private Colleges:</b> Explore excellent private institutions.</span></li>
            <li className="flex items-start gap-3"><div className="mt-1 w-2 h-2 bg-emerald-500 rounded-full shrink-0" /> <span><b>Deemed Universities:</b> Direct admissions based on qualifying scores.</span></li>
            <li className="flex items-start gap-3"><div className="mt-1 w-2 h-2 bg-blue-500 rounded-full shrink-0" /> <span><b>Alternative Pathways:</b> Highly rewarding alternative careers with EduFill.</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function InfoStrip({ icon, title, text }) {
  return (
    <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm flex items-start gap-4">
      <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-black text-gray-950 mb-1">{title}</h3>
        <p className="text-xs font-semibold text-gray-500 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

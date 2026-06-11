import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  GraduationCap,
  Landmark,
  LayoutGrid,
  Loader2,
  MapPin,
  Monitor,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Train,
  TrendingUp,
  Users,
  X,
  Stethoscope, // Added Stethoscope icon for Medical
  BookOpen,    // Added BookOpen icon for Entrance Exam
} from 'lucide-react';
import axios from 'axios';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import Header from '../components/home/Header';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '')
).replace(/\/$/, '');

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://edufill.in').replace(/\/$/, '');

const JOB_CATEGORIES = [
  { id: 'All', label: 'View All', icon: LayoutGrid, color: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  { id: 'Banking', label: 'Banking', icon: Landmark, color: 'text-blue-600', iconBg: 'bg-blue-50' },
  { id: 'Government', label: 'Government', icon: Building2, color: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  { id: 'Railway', label: 'Railway', icon: Train, color: 'text-red-500', iconBg: 'bg-red-50' },
  { id: 'SSC', label: 'SSC', icon: Users, color: 'text-purple-600', iconBg: 'bg-purple-50' },
  { id: 'Teaching', label: 'Teaching', icon: GraduationCap, color: 'text-orange-500', iconBg: 'bg-orange-50' },
  { id: 'Defence', label: 'Defence', icon: Shield, color: 'text-green-700', iconBg: 'bg-green-50' },
  { id: 'IT', label: 'IT', icon: Monitor, color: 'text-indigo-600', iconBg: 'bg-indigo-50' },
  { id: 'Private', label: 'Private Jobs', icon: Briefcase, color: 'text-pink-600', iconBg: 'bg-pink-50' },
  // NAYI CATEGORIES ADD KI GAYI HAIN 👇
  { id: 'Medical', label: 'Medical', icon: Stethoscope, color: 'text-teal-600', iconBg: 'bg-teal-50' },
  { id: 'Entrance Exam', label: 'Entrance Exam', icon: BookOpen, color: 'text-yellow-600', iconBg: 'bg-yellow-50' },
];

const safeText = (value, fallback = '') => (typeof value === 'string' ? value : fallback);

const normalize = (value) => safeText(value).trim().toLowerCase();

const getUniqueOptions = (items, field, fallback) => {
  const values = items
    .map((item) => safeText(item?.[field]).trim())
    .filter(Boolean);
  return [fallback, ...Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))];
};

const getDaysLeft = (lastDate) => {
  if (!lastDate) return 0;
  const date = new Date(lastDate);
  if (Number.isNaN(date.getTime())) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const getLogoColor = (title = '') => {
  const colors = [
    'text-blue-600 bg-blue-50',
    'text-emerald-600 bg-emerald-50',
    'text-red-500 bg-red-50',
    'text-purple-600 bg-purple-50',
    'text-orange-500 bg-orange-50',
    'text-pink-600 bg-pink-50',
  ];
  return colors[title.length % colors.length];
};

const getFallbackPosts = (title) => {
  const length = title?.length || 23;
  return `${(length * 137) % 900 + 100}+`;
};

const cleanLabel = (value, fallback = 'N/A') => {
  const text = safeText(value).trim();
  return text || fallback;
};

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const getExamSlug = (exam = {}) => {
  return exam.slug || slugify(exam.seoTitle || exam.title || '') || exam._id;
};

const getExamDetailsPath = (exam = {}) => {
  return `/exam/${getExamSlug(exam)}`;
};

const normalizeExam = (exam = {}) => ({
  ...exam,
  _id: exam._id || exam.id || exam.slug || slugify(exam.title || ''),
  title: exam.title || exam.seoTitle || 'Untitled Job Update',
  slug: exam.slug || slugify(exam.seoTitle || exam.title || ''),
  category: exam.category || 'General',
  department: exam.department || 'Government',
  location: exam.location || 'All India',
  qualification: exam.qualification || '',
  jobType: exam.jobType || 'Regular',
  createdAt: exam.createdAt || exam.updatedAt || exam.postDate || null,
});


function HeroIllustration({ featuredExam, onApply }) {
  const daysLeft = featuredExam ? getDaysLeft(featuredExam.lastDate) : 0;

  return (
    <div className="relative w-full max-w-[480px] mx-auto lg:ml-auto">
      <div className="absolute -top-8 -right-4 w-32 h-32 bg-emerald-300/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-8 -left-4 w-36 h-36 bg-blue-300/25 rounded-full blur-3xl" />

      <div className="relative rounded-[2rem] bg-white/90 backdrop-blur-xl border border-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] overflow-hidden p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(16,185,129,0.12)_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={13} /> Featured Update
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl">
              <BellRing size={23} />
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-slate-950 text-white p-5 shadow-xl mb-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                <GraduationCap size={28} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-2">
                  Closing soon
                </p>
                <h3 className="text-lg sm:text-xl font-black leading-tight line-clamp-2">
                  {featuredExam?.title || 'Latest exam and job updates are live'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="rounded-2xl bg-white/8 border border-white/10 p-3">
                <p className="text-[9px] uppercase tracking-widest font-black text-slate-400">Last Date</p>
                <p className="text-sm font-black mt-1">{formatDate(featuredExam?.lastDate)}</p>
              </div>
              <div className="rounded-2xl bg-white/8 border border-white/10 p-3">
                <p className="text-[9px] uppercase tracking-widest font-black text-slate-400">Days Left</p>
                <p className={`text-sm font-black mt-1 ${daysLeft <= 7 ? 'text-red-300' : 'text-amber-300'}`}>
                  {featuredExam ? (daysLeft < 0 ? 'Closed' : `${daysLeft} Days`) : 'Active'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onApply}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
          >
            Fill Form With EduFill <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-[10px] sm:text-[11px] font-black text-gray-700 ml-1">{label}</label>
      <div className="relative min-w-0">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-white border border-gray-200 hover:border-gray-300 rounded-xl py-3 pl-3 pr-8 appearance-none outline-none text-[12px] sm:text-sm text-gray-700 font-bold cursor-pointer transition-colors truncate focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
        >
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function CategoryChip({ category, isSelected, onClick }) {
  const Icon = category.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`snap-start flex flex-col items-center justify-center min-w-[82px] sm:min-w-[98px] md:min-w-[114px] h-[86px] sm:h-24 md:h-28 rounded-2xl bg-white border transition-all duration-200 group shrink-0 active:scale-95 ${
        isSelected
          ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/10 -translate-y-0.5'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 ${category.iconBg} ${category.color} group-hover:scale-110 transition-transform`}>
        <Icon size={19} className="md:w-6 md:h-6" />
      </div>
      <span className={`text-[10px] md:text-[11px] font-black leading-tight px-1 text-center ${isSelected ? 'text-emerald-700' : 'text-gray-700'}`}>
        {category.label}
      </span>
    </button>
  );
}

function StatCard({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 bg-white md:bg-transparent p-4 rounded-2xl md:p-0 border border-gray-100 md:border-none shadow-sm md:shadow-none">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-black text-gray-900 text-xs md:text-[13px] mb-0.5">{title}</p>
        <p className="text-[10px] md:text-[11px] text-gray-500 font-semibold leading-snug">{desc}</p>
      </div>
    </div>
  );
}

function ExamCard({ exam, onViewDetails, onApply }) {
  const daysLeft = getDaysLeft(exam.lastDate);
  const isClosingSoon = daysLeft <= 15 && daysLeft >= 0;
  const isClosed = daysLeft < 0;
  const title = exam.title || 'Untitled Job Update';
  const displayQualification = exam.qualification || (title.includes('Graduate') || title.includes('CGL') ? 'Graduation' : '10th/12th Pass');
  const displayPosts = exam.posts || getFallbackPosts(title);
  const displayLocation = exam.location || 'All India';
  const displayCategory = exam.category || 'General';
  const displayDepartment = exam.department || 'Government';

  return (
    <article className="bg-white rounded-[1.35rem] border border-gray-200 p-4 md:p-5 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all duration-300 relative group flex flex-col md:flex-row gap-4 md:gap-5 min-w-0">
      <button
        type="button"
        aria-label="Bookmark job"
        className="absolute top-4 right-4 text-gray-300 hover:text-emerald-600 transition-colors z-10 p-1.5 rounded-full hover:bg-emerald-50"
      >
        <Bookmark size={18} />
      </button>

      <div className="flex items-start gap-3 min-w-0 md:w-[64px] md:block">
        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl border border-gray-100 flex items-center justify-center shrink-0 shadow-sm ${getLogoColor(title)}`}>
          <span className="font-black text-sm md:text-xl">
            {displayCategory.substring(0, 3).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 pr-8 md:hidden min-w-0">
          <Link to={getExamDetailsPath(exam)} className="block group-hover:underline decoration-emerald-600 underline-offset-4">
            <h3 className="text-base font-black text-slate-950 leading-snug line-clamp-2">{title}</h3>
          </Link>
          <p className="text-xs font-bold text-gray-500 truncate mt-1">{displayDepartment} • {displayCategory}</p>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="hidden md:block pr-8">
          <Link to={getExamDetailsPath(exam)} className="block group-hover:underline decoration-emerald-600 underline-offset-4">
            <h3 className="text-lg font-black text-slate-950 leading-snug line-clamp-2">{title}</h3>
          </Link>
          <p className="text-sm font-bold text-gray-500 mt-1 truncate">{displayDepartment} • {displayCategory}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-4 mt-4 bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-2xl border md:border-none border-gray-100">
          <InfoMini icon={<GraduationCap size={15} />} label="Qualification" value={displayQualification} />
          <InfoMini icon={<MapPin size={15} />} label="Location" value={displayLocation} />
          <InfoMini icon={<Users size={15} />} label="Posts" value={displayPosts} className="col-span-2 md:col-span-1" />
        </div>

        <div className="hidden md:flex flex-wrap items-center gap-2 text-[11px] font-bold text-gray-400 mt-4 pt-3 border-t border-gray-100">
          <span>Posted on: {formatDate(exam.createdAt)}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>Job Type: {exam.jobType || 'Regular'}</span>
        </div>
      </div>

      <div className="w-full md:w-44 flex flex-col md:justify-between shrink-0 md:border-l border-gray-100 md:pl-5">
        <div className={`flex md:flex-col justify-between items-center md:items-start gap-3 mb-3 md:mb-0 rounded-2xl p-3 md:p-0 ${isClosed ? 'bg-gray-50 md:bg-transparent' : 'bg-red-50/60 md:bg-transparent'}`}>
          <div>
            <p className="text-[9px] md:text-[10px] text-red-500 font-black uppercase tracking-widest mb-1">Exam Last Date</p>
            <p className="text-sm font-black text-gray-950 whitespace-nowrap">{formatDate(exam.lastDate)}</p>
          </div>
          <p className={`text-[11px] font-black whitespace-nowrap ${isClosed ? 'text-gray-400' : isClosingSoon ? 'text-red-600' : 'text-orange-500'}`}>
            {isClosed ? 'Closed' : `${daysLeft} Days Left`}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
          <button
            type="button"
            onClick={onViewDetails}
            className="w-full py-3 md:py-2.5 px-3 rounded-xl border-2 border-emerald-600 text-emerald-700 font-black text-xs hover:bg-emerald-50 transition-colors bg-white shadow-sm active:scale-95"
          >
            View Details
          </button>
          <button
            type="button"
            onClick={onApply}
            className="w-full py-3 md:py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-colors shadow-md active:scale-95"
          >
            Apply Now
          </button>
        </div>
      </div>
    </article>
  );
}

function InfoMini({ icon, label, value, className = '' }) {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <div className="bg-white md:bg-gray-50 p-1.5 rounded-lg shadow-sm md:shadow-none text-gray-400 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase tracking-widest">{label}</p>
        <p className="text-[11px] md:text-xs font-bold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [jobTitleFilter, setJobTitleFilter] = useState('All Job Titles');
  const [locationFilter, setLocationFilter] = useState('All India');
  const [qualificationFilter, setQualificationFilter] = useState('Any');
  const [jobTypeFilter, setJobTypeFilter] = useState('All Types');
  const [sortBy, setSortBy] = useState('Newest First');

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);

    const controller = new AbortController();

    const fetchExams = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const response = await axios.get(`${API_BASE_URL}/api/exams`, {
          signal: controller.signal,
        });

        const examsArray = Array.isArray(response.data)
          ? response.data
          : response.data?.exams || response.data?.data || response.data?.results || [];

        setExams(examsArray.map(normalizeExam));
      } catch (error) {
        if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          if (import.meta.env.DEV) {
            console.warn('Error fetching exams:', error);
          }
          setErrorMessage('Job updates load nahi ho paaye. Please API/server check karein.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExams();

    return () => controller.abort();
  }, []);

  const filterOptions = useMemo(() => {
    return {
      title: getUniqueOptions(exams, 'title', 'All Job Titles'),
      location: getUniqueOptions(exams, 'location', 'All India'),
      qualification: getUniqueOptions(exams, 'qualification', 'Any'),
      jobType: getUniqueOptions(exams, 'jobType', 'All Types'),
    };
  }, [exams]);

  const activeExams = useMemo(() => exams.filter((exam) => getDaysLeft(exam.lastDate) >= 0), [exams]);

  const upcomingDeadlines = useMemo(() => (
    [...activeExams]
      .sort((a, b) => new Date(a.lastDate || 0) - new Date(b.lastDate || 0))
      .slice(0, 5)
  ), [activeExams]);

  const featuredExam = upcomingDeadlines[0] || activeExams[0] || exams[0] || null;

  const filteredExams = useMemo(() => {
    const query = normalize(searchQuery);

    let results = exams.filter((exam) => {
      const title = normalize(exam.title);
      const department = normalize(exam.department);
      const category = normalize(exam.category);
      const location = normalize(exam.location);
      const qualification = normalize(exam.qualification);
      const jobType = normalize(exam.jobType);

      const matchesSearch =
        !query ||
        title.includes(query) ||
        department.includes(query) ||
        category.includes(query) ||
        location.includes(query) ||
        qualification.includes(query) ||
        jobType.includes(query);

      const matchesCategory =
        selectedCategory === 'All' ||
        category === normalize(selectedCategory) ||
        category.includes(normalize(selectedCategory));

      const matchesTitle = jobTitleFilter === 'All Job Titles' || exam.title === jobTitleFilter;
      const matchesLocation = locationFilter === 'All India' || exam.location === locationFilter;
      const matchesQualification = qualificationFilter === 'Any' || exam.qualification === qualificationFilter;
      const matchesJobType = jobTypeFilter === 'All Types' || exam.jobType === jobTypeFilter;

      return matchesSearch && matchesCategory && matchesTitle && matchesLocation && matchesQualification && matchesJobType;
    });

    if (sortBy === 'Closing Soon') {
      results = [...results].sort((a, b) => getDaysLeft(a.lastDate) - getDaysLeft(b.lastDate));
    } else if (sortBy === 'Last Date') {
      results = [...results].sort((a, b) => new Date(a.lastDate || 0) - new Date(b.lastDate || 0));
    } else {
      results = [...results].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return results;
  }, [exams, searchQuery, selectedCategory, jobTitleFilter, locationFilter, qualificationFilter, jobTypeFilter, sortBy]);

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== 'All' ||
    jobTitleFilter !== 'All Job Titles' ||
    locationFilter !== 'All India' ||
    qualificationFilter !== 'Any' ||
    jobTypeFilter !== 'All Types';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setJobTitleFilter('All Job Titles');
    setLocationFilter('All India');
    setQualificationFilter('Any');
    setJobTypeFilter('All Types');
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    document.getElementById('latest-jobs-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 🔥 100% SEO: DYNAMIC JSON-LD STRUCTURED DATA (ItemList Schema) 🔥
  const generateSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": filteredExams.slice(0, 10).map((exam, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "EducationEvent", // Match backend schema type
          "name": exam.title,
          "url": `${SITE_URL}${getExamDetailsPath(exam)}`
        }
      }))
    };
  }, [filteredExams]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F6F8FB] flex flex-col font-sans selection:bg-emerald-200 pb-20 lg:pb-0">
      <SEO
        title={`${selectedCategory === 'All' ? 'Latest Job Updates & Exam Forms' : `${selectedCategory} Job Updates & Forms`} | EduFill`}
        description="Find government and private jobs, application deadlines, eligibility, exam dates and verified job updates in one place. Apply online instantly."
        keywords="latest job updates, government jobs, private jobs, exam forms, admit card, result, EduFill"
        url="/exams"
      />
      
      {/* Injecting SEO Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateSchema) }} />

      <Header currentUser={null} onOpenFeedback={() => {}} />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#0b2530] to-emerald-950 pt-8 sm:pt-10 lg:pt-14 pb-16 sm:pb-20 lg:pb-28 border-b border-emerald-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.09)_1px,transparent_0)] [background-size:28px_28px] opacity-40" />
        <div className="absolute -top-24 -left-16 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-28 right-0 w-[420px] h-[420px] bg-blue-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_480px] gap-10 lg:gap-12 items-center">
          <div className="text-white max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-[11px] sm:text-xs font-black uppercase tracking-widest text-emerald-200 backdrop-blur-sm mb-5">
              <BellRing size={15} /> Verified Latest Updates
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-5">
              Latest Job Updates, <span className="text-emerald-300">Deadlines</span> & Forms
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-300 font-semibold leading-relaxed max-w-2xl mb-7">
              Find government and private job alerts, exam last dates, eligibility and form-filling support in one clean EduFill dashboard.
            </p>

            <form onSubmit={handleSearchSubmit} className="bg-white/10 border border-white/15 backdrop-blur-xl p-2 rounded-2xl max-w-2xl shadow-2xl">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                  <input
                    type="text"
                    placeholder="Search job, department, category..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full bg-white text-slate-900 placeholder:text-slate-400 rounded-xl py-3.5 pl-11 pr-4 outline-none font-bold text-sm focus:ring-4 focus:ring-emerald-400/20"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-black py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/20"
                >
                  Search Jobs <Search size={17} />
                </button>
              </div>
            </form>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-7 max-w-xl">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-3 sm:p-4 backdrop-blur-sm">
                <p className="text-2xl sm:text-3xl font-black text-white">{exams.length || 0}+</p>
                <p className="text-[10px] sm:text-xs text-slate-300 font-bold mt-1">Total Updates</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-3 sm:p-4 backdrop-blur-sm">
                <p className="text-2xl sm:text-3xl font-black text-white">{activeExams.length || 0}</p>
                <p className="text-[10px] sm:text-xs text-slate-300 font-bold mt-1">Active Forms</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-3 sm:p-4 backdrop-blur-sm">
                <p className="text-2xl sm:text-3xl font-black text-white">10L+</p>
                <p className="text-[10px] sm:text-xs text-slate-300 font-bold mt-1">Aspirants</p>
              </div>
            </div>
          </div>

          <HeroIllustration featuredExam={featuredExam} onApply={() => navigate('/live-connect')} />
        </div>
      </section>

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-9 sm:-mt-12 relative z-20">
        <div className="bg-white rounded-[1.5rem] sm:rounded-[1.75rem] shadow-[0_20px_70px_rgba(15,23,42,0.10)] p-4 md:p-5 border border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
            <FilterSelect label="Job Title" value={jobTitleFilter} onChange={setJobTitleFilter} options={filterOptions.title} />
            <FilterSelect label="Location" value={locationFilter} onChange={setLocationFilter} options={filterOptions.location} />
            <FilterSelect label="Qualification" value={qualificationFilter} onChange={setQualificationFilter} options={filterOptions.qualification} />
            <FilterSelect label="Job Type" value={jobTypeFilter} onChange={setJobTypeFilter} options={filterOptions.jobType} />
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between gap-3 mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
              <p className="text-xs sm:text-sm font-bold text-emerald-800">Filters applied. Showing focused results.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 hover:text-emerald-900 shrink-0"
              >
                <X size={14} /> Clear
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 sm:mt-6 flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 items-center [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {JOB_CATEGORIES.map((category) => (
            <CategoryChip
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            />
          ))}
        </div>
      </section>

      <main id="latest-jobs-list" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-9">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-5 md:mb-6 border-b border-gray-200 pb-4 gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-1">Latest Listings</p>
            <h2 className="text-xl sm:text-2xl font-black text-gray-950 leading-tight">
              {selectedCategory === 'All' ? 'Latest Job Updates' : `${selectedCategory} Jobs`}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 font-bold mt-1">
              Showing {filteredExams.length} {filteredExams.length === 1 ? 'job' : 'jobs'} from EduFill database
            </p>
          </div>

          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 bg-white border border-gray-200 px-3 py-2.5 rounded-xl shadow-sm">
            <span className="text-xs text-gray-500 font-bold">Sort by:</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="text-xs font-black text-gray-900 bg-transparent outline-none cursor-pointer"
            >
              <option>Newest First</option>
              <option>Closing Soon</option>
              <option>Last Date</option>
            </select>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 font-bold text-sm mb-6 flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 min-w-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
                <p className="text-sm font-bold text-gray-500">Loading latest jobs...</p>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="text-center py-16 sm:py-20 px-4 bg-white rounded-[1.5rem] border border-gray-200 shadow-sm animate-in fade-in duration-300">
                <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-black text-gray-800">No Jobs Found</h2>
                <p className="text-gray-500 font-medium mt-1 text-sm">Search ya filters change karke dobara try karein.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 bg-emerald-50 text-emerald-700 font-black py-2.5 px-6 rounded-xl hover:bg-emerald-100 transition-colors active:scale-95 text-sm"
                >
                  Show All Jobs
                </button>
              </div>
            ) : (
              filteredExams.map((exam) => (
                <ExamCard
                  key={exam._id || exam.slug || `${exam.title}-${exam.lastDate}`}
                  exam={exam}
                  onViewDetails={() => navigate(getExamDetailsPath(exam))}
                  onApply={() => navigate('/live-connect')}
                />
              ))
            )}

            {!loading && filteredExams.length > 5 && (
              <div className="flex justify-center mt-6 pt-2 pb-4">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="border-2 border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 bg-white font-black py-3 px-7 sm:px-8 rounded-full flex items-center gap-2 transition-colors text-sm shadow-sm active:scale-95"
                >
                  View All Jobs <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>

          <aside className="space-y-5 md:space-y-6 min-w-0">
            <div className="bg-slate-950 rounded-[1.5rem] p-5 sm:p-6 md:p-7 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-[-60px] right-[-60px] w-44 h-44 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest mb-3">Your Career, Our Priority</p>
                <h3 className="text-2xl md:text-3xl font-black mb-3 leading-tight">Fill Form With<br />EduFill</h3>
                <p className="text-xs md:text-sm text-slate-300 font-semibold mb-6 leading-relaxed">
                  Get latest job alerts, form support and important notifications with expert guidance.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/live-connect')}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-black py-3.5 px-4 rounded-xl flex justify-center items-center gap-2 transition-transform active:scale-95 mb-5 shadow-lg text-sm"
                >
                  Fill Form With EduFill <ArrowRight size={16} />
                </button>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                  <p className="text-[11px] text-slate-400 font-bold">Trusted by 10L+ aspirants</p>
                  <div className="flex -space-x-2">
                    {[32, 44, 62, 68].map((id, index) => (
                      <div key={id} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-gray-200 overflow-hidden">
                        <img src={`https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${id}.jpg`} alt="EduFill user" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-white text-slate-950 font-black text-[9px] flex items-center justify-center">10L+</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-5 md:p-6 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3 gap-3">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 min-w-0">
                  <Clock size={16} className="text-blue-600 shrink-0" /> Upcoming Deadlines
                </h3>
                <button type="button" onClick={() => setSortBy('Closing Soon')} className="text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase shrink-0">View All</button>
              </div>

              <div className="space-y-3">
                {upcomingDeadlines.length === 0 && (
                  <p className="text-xs font-bold text-gray-500 text-center py-5">No active deadlines right now.</p>
                )}

                {upcomingDeadlines.map((exam, index) => {
                  const title = exam.title || 'Untitled Job';
                  const daysLeft = getDaysLeft(exam.lastDate);

                  return (
                    <button
                      key={exam._id || exam.slug || index}
                      type="button"
                      onClick={() => navigate(getExamDetailsPath(exam))}
                      className="w-full flex justify-between items-center gap-3 group text-left hover:bg-gray-50 p-2 rounded-xl transition-colors min-w-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shrink-0 group-hover:border-emerald-200 transition-colors">
                          <Bookmark size={13} className="text-gray-400" />
                        </div>
                        <p className="text-xs font-bold text-gray-700 group-hover:text-emerald-700 transition-colors line-clamp-2" title={title}>
                          {title}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] font-black text-gray-900">{formatDate(exam.lastDate)}</p>
                        <p className={`text-[9px] font-black uppercase tracking-wider ${daysLeft <= 7 ? 'text-red-500' : 'text-orange-500'}`}>
                          {daysLeft} Days
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-[1.5rem] p-5 md:p-6 border border-emerald-100 relative overflow-hidden min-h-[190px]">
              <div className="absolute right-[-28px] bottom-[-24px] w-36 h-36 bg-white/70 rounded-full blur-sm" />
              <div className="relative z-10 max-w-[70%]">
                <h3 className="text-base font-black text-gray-950 mb-2">Download Our App</h3>
                <p className="text-xs text-gray-600 font-semibold mb-5 leading-relaxed">Get instant job alerts, admit cards, results and more on the go.</p>
                <div className="flex flex-col gap-2">
                  <button type="button" className="bg-black text-white h-10 rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors w-32 shadow-md text-xs font-black">
                    Google Play
                  </button>
                  <button type="button" className="bg-black text-white h-10 rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors w-32 shadow-md text-xs font-black">
                    App Store
                  </button>
                </div>
              </div>
              <div className="absolute right-3 top-6 w-24 h-40 bg-white rounded-[1.75rem] border-[6px] border-gray-900 shadow-2xl rotate-[-8deg] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full mx-auto mb-1 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  </div>
                  <p className="text-[8px] font-black text-gray-400">EduFill App</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full bg-blue-50 rounded-[1.5rem] p-4 md:p-5 border border-blue-100 flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow group text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                  <Send size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 mb-0.5 leading-tight truncate">Stay Updated</p>
                  <p className="text-[10px] text-gray-500 font-bold truncate">Join our Telegram channel</p>
                </div>
              </div>
              <ArrowRight size={18} className="text-blue-500 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          </aside>
        </div>
      </main>

      <section className="bg-white border-t border-b border-gray-100 py-6 md:py-8 mt-4 md:mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatCard icon={<BellRing size={21} className="text-yellow-500" />} title="Instant Notifications" desc="Get real-time alerts for new job updates" />
          <StatCard icon={<ShieldCheck size={21} className="text-emerald-500" />} title="100% Reliable" desc="Authentic and verified job notifications" />
          <StatCard icon={<Clock size={21} className="text-blue-500" />} title="Never Miss a Deadline" desc="Track last dates and exam schedules" />
          <StatCard icon={<TrendingUp size={21} className="text-indigo-500" />} title="10L+ Aspirants" desc="Trusted by students across India" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  BadgeIndianRupee,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  Link as LinkIcon,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import SEO from '../components/SEO';
import Footer from '../components/Footer';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '')
).replace(/\/$/, '');
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://edufills.com').replace(/\/$/, '');

const isSafeExternalUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

const safeValue = (value, fallback = 'Not specified') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const fmt = (value) => {
  if (!value) return 'Not specified';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? safeValue(value)
    : date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
};

const splitRows = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
      .map(([k, v]) => `${k}: ${v}`);
  }

  return String(value)
    .replace(/\r/g, '')
    .split(/\n|\||;|•|\u2022/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseKV = (value, fallback) =>
  splitRows(value).map((row) => {
    const parts = row.split(/:|-/);

    if (parts.length > 1) {
      const label = parts.shift().trim();
      return {
        label: label || fallback,
        value: parts.join('-').trim() || row,
      };
    }

    return { label: fallback, value: row };
  });

function Card({ icon: Icon, title, sub, children }) {
  return (
    <section className="overflow-hidden rounded-[1.45rem] border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
          <Icon size={20} />
        </div>
        <div>
          <h2 className="font-black text-gray-900">{title}</h2>
          {sub ? <p className="mt-1 text-xs font-semibold text-gray-500">{sub}</p> : null}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function KVGrid({ items }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"
        >
          <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-emerald-700">
            {item.label}
          </p>
          <p className="text-sm font-black leading-relaxed text-gray-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ListBox({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-4"
        >
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black">
            {index + 1}
          </div>
          <p className="text-sm font-bold leading-relaxed text-gray-900">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
        <p className="mt-4 text-sm font-bold text-gray-500">Loading exam details...</p>
      </div>
    </div>
  );
}

function NotFoundScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 text-center">
      <h1 className="text-2xl font-black text-gray-900">Exam Not Found</h1>
      <p className="mt-2 max-w-md text-sm font-semibold text-gray-500">
        Ye job update available nahi hai ya URL galat hai.
      </p>
      <Link
        to="/exams"
        className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
      >
        Back to Exams
      </Link>
    </div>
  );
}

export default function ExamDetails() {
  const params = useParams();
  const navigate = useNavigate();
  const examKey = params.slug || params.id || params.idOrSlug;

  const [exam, setExam] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | success | not-found
  const requestIdRef = useRef(0);

  useEffect(() => {
    window.scrollTo(0, 0);

    const controller = new AbortController();
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    const fetchExam = async () => {
      if (!examKey) {
        setStatus('not-found');
        setExam(null);
        return;
      }

      try {
        setStatus('loading');
        setExam(null);

        const response = await axios.get(`${API_BASE}/api/exams/${examKey}`, {
          signal: controller.signal,
        });

        // Important: ignore stale/aborted request results.
        if (controller.signal.aborted || requestIdRef.current !== currentRequestId) return;

        const data = response.data?.exam || response.data;

        if (data && (data._id || data.title)) {
          setExam(data);
          setStatus('success');
        } else {
          setExam(null);
          setStatus('not-found');
        }
      } catch (error) {
        // Important: do not set not-found for aborted request.
        // React StrictMode/dev mode abort can otherwise show flicker for a few milliseconds.
        if (controller.signal.aborted || requestIdRef.current !== currentRequestId) return;

        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;

        if (import.meta.env.DEV) {
          console.warn('Exam fetch error:', error);
        }
        setExam(null);
        setStatus('not-found');
      }
    };

    fetchExam();

    return () => controller.abort();
  }, [examKey]);

  const fees = useMemo(() => parseKV(exam?.applicationFee, 'Application Fee'), [exam?.applicationFee]);
  const ages = useMemo(() => parseKV(exam?.ageLimit, 'Age Limit'), [exam?.ageLimit]);
  const vacancies = useMemo(() => parseKV(exam?.totalVacancies, 'Vacancy'), [exam?.totalVacancies]);
  const qualifications = useMemo(() => splitRows(exam?.qualification), [exam?.qualification]);
  const how = useMemo(() => splitRows(exam?.howToApply), [exam?.howToApply]);
  const instructions = useMemo(() => splitRows(exam?.importantInstructions), [exam?.importantInstructions]);

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'not-found' || !exam) return <NotFoundScreen />;

  const cleanSlug = exam.slug || examKey || exam._id || '';
  const pageUrl = exam.canonicalUrl || `${SITE_URL}/exam/${cleanSlug}`;
  const seoTitle = exam.seoTitle || `${exam.title} | EduFill`;
  const description =
    exam.metaDescription ||
    exam.shortInfo ||
    `Check ${exam.title} important dates, application fee, age limit, vacancies and eligibility.`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: safeValue(exam.title, 'EduFill Exam Update'),
    description,
    hiringOrganization: {
      '@type': 'Organization',
      name: exam.department || 'EduFill',
    },
    datePosted: exam.postDate || exam.createdAt,
    validThrough: exam.lastDate,
    employmentType: 'FULL_TIME',
    url: pageUrl,
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'India',
    },
  };

  const links = [
    ['Apply Online', exam.applyOnlineLink],
    ['Download Notification', exam.notificationLink || exam.officialLink],
    ['Download Syllabus', exam.syllabusLink],
    ['Official Website', exam.officialWebsite || exam.officialLink],
  ].filter((item) => isSafeExternalUrl(item[1]));

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans">
      <SEO
        title={seoTitle}
        description={description}
        keywords={exam.keywords}
        url={`/exam/${cleanSlug}`}
        canonical={pageUrl}
        image={exam.ogImage || 'https://edufills.com/seo-banner.jpg'}
        type="article"
        robots={exam.robots || 'index, follow'}
        schema={schema}
      />

      <header className="relative overflow-hidden bg-gray-950 pb-20 pt-10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.15),transparent_25%)]" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-8">
          <Link
            to="/exams"
            className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2.5 text-sm font-bold text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Exams
          </Link>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
              <Building size={14} /> {exam.department || 'Department'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-300">
              <Sparkles size={14} /> {exam.category || 'Exam'}
            </span>
          </div>

          <h1 className="mb-4 max-w-5xl text-3xl font-black leading-tight text-white md:text-4xl lg:text-5xl">
            {exam.title}
          </h1>

          <p className="max-w-4xl text-sm font-medium leading-relaxed text-gray-300 md:text-base">
            {exam.shortInfo || description}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {[
              ['Start Date', fmt(exam.startDate)],
              ['Last Date', fmt(exam.lastDate)],
              ['Exam Date', exam.examDate || 'Notify Later'],
              ['Vacancies', exam.totalVacancies || 'Check Notice'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-gray-400">
                  {label}
                </p>
                <p className="text-sm font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="-mt-10 mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:px-8">
        <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Card icon={Calendar} title="Important Dates" sub="Application timeline and exam schedule.">
              <KVGrid
                items={[
                  { label: 'Post Date', value: fmt(exam.postDate) },
                  { label: 'Application Start', value: fmt(exam.startDate) },
                  { label: 'Last Date', value: fmt(exam.lastDate) },
                  { label: 'Fee Last Date', value: fmt(exam.payFeeLastDate) },
                  { label: 'Exam Date', value: exam.examDate || 'As per schedule' },
                  { label: 'Admit Card', value: exam.admitCardDate || 'Before exam' },
                ]}
              />
            </Card>
          </div>

          <Card icon={FileText} title="Exam Overview" sub="Basic information.">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="font-bold text-gray-500">Department</span>
                <span className="text-right font-black text-gray-900">{exam.department || 'N/A'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-bold text-gray-500">Advt No.</span>
                <span className="text-right font-black text-gray-900">{exam.notificationNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-bold text-gray-500">Category</span>
                <span className="text-right font-black text-gray-900">{exam.category || 'N/A'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-bold text-gray-500">Status</span>
                <span className="text-right font-black text-emerald-600">{exam.status || 'Active'}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card icon={BadgeIndianRupee} title="Application Fee" sub={exam.paymentMode || 'Category-wise fee details.'}>
            <KVGrid items={fees.length ? fees : [{ label: 'Application Fee', value: 'Check official notification' }]} />
          </Card>

          <Card icon={Clock3} title="Age Limit" sub="Age rules and relaxation.">
            <KVGrid items={ages.length ? ages : [{ label: 'Age Limit', value: 'Not specified' }]} />
          </Card>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card icon={Briefcase} title="Vacancies" sub="Total posts and post-wise details.">
            <KVGrid items={vacancies.length ? vacancies : [{ label: 'Total Vacancies', value: 'Not specified' }]} />
          </Card>

          <Card icon={GraduationCap} title="Educational Qualification" sub="Eligibility details.">
            <ListBox items={qualifications.length ? qualifications : ['Please check official notification for detailed eligibility.']} />
          </Card>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card icon={BookOpen} title="How to Apply" sub="Step-by-step process.">
            <ListBox
              items={
                how.length
                  ? how
                  : ['Read the notification before applying online.', 'Fill the form carefully and check all details before final submit.']
              }
            />
          </Card>

          <Card icon={ShieldCheck} title="Important Instructions" sub="Before applying.">
            <ListBox
              items={
                instructions.length
                  ? instructions
                  : ['Keep required documents ready.', 'Check preview before final submit.']
              }
            />
          </Card>
        </div>

        {links.length ? (
          <Card icon={LinkIcon} title="Important Links" sub="Official links for application and notification.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {links.map(([label, url]) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-black text-gray-900 hover:border-emerald-200 hover:bg-emerald-50"
                >
                  {label} <ExternalLink size={16} />
                </a>
              ))}
            </div>
          </Card>
        ) : null}

        <div className="my-8 rounded-[1.75rem] border border-emerald-100 bg-gradient-to-r from-emerald-50 to-blue-50 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-emerald-700">
                <CheckCircle2 size={18} /> Fill Form Safely
              </div>
              <p className="max-w-3xl text-sm font-semibold leading-relaxed text-gray-700">
                Category, fee, age, qualification and official notification verify karke hi form submit karein.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/live-connect')}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3.5 font-black text-white hover:bg-emerald-600"
            >
              Fill Form via EduFill
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

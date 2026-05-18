import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Loader2,
  LockKeyhole,
  LogOut,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '')
).replace(/\/$/, '');

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://edufills.com').replace(/\/$/, '');

const ADMIN_SESSION_KEY = 'edufill_exam_admin_token';

const CATEGORIES = [
  'Banking',
  'Government',
  'Railway',
  'SSC',
  'Teaching',
  'Defence',
  'IT',
  'Private Jobs',
  'Entrance Exam',
  'Medical',
];

const init = {
  title: '',
  department: '',
  category: ['Government'],
  shortInfo: '',
  notificationNumber: '',
  postDate: '',
  startDate: '',
  lastDate: '',
  payFeeLastDate: '',
  examDate: '',
  admitCardDate: '',
  paymentMode: '',
  officialLink: '',
  applyOnlineLink: '',
  notificationLink: '',
  syllabusLink: '',
  officialWebsite: '',
  seoTitle: '',
  metaDescription: '',
  keywords: '',
  slug: '',
  ogImage: '',
  canonicalUrl: '',
  robots: 'index, follow',
  status: 'Active',
};

const createDefaultRows = () => ({
  feeRows: [
    { label: 'UR / OBC / EWS', value: '' },
    { label: 'SC / ST', value: '' },
    { label: 'PH / PwD', value: '' },
  ],
  ageRows: [
    { label: 'Minimum Age', value: '' },
    { label: 'Maximum Age', value: '' },
    { label: 'Age Relaxation', value: 'As per official rules' },
  ],
  vacancyRows: [{ label: 'Total Posts', value: '' }],
  qualificationRows: [''],
  howRows: ['Candidate should read the official notification carefully before applying online.'],
  instructionRows: ['Before final submit, check all details carefully.'],
});

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const sanitizeText = (value, maxLength = 1000) =>
  String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const splitRows = (value) =>
  !value
    ? []
    : String(value)
        .split(/\n|\||;/)
        .map((item) => item.trim())
        .filter(Boolean);

const parseKV = (value, fallback) =>
  splitRows(value).map((row) => {
    const parts = row.split(/:|-/);

    return parts.length > 1
      ? {
          label: parts.shift().trim() || fallback,
          value: parts.join('-').trim() || row,
        }
      : {
          label: fallback,
          value: row,
        };
  });

const serializeKV = (rows, fallback) =>
  rows
    .map((row) => ({
      label: sanitizeText(row.label, 120),
      value: sanitizeText(row.value, 500),
    }))
    .filter((row) => row.label || row.value)
    .map((row) => `${row.label || fallback}: ${row.value || 'Not specified'}`)
    .join(' | ');

const serializeList = (rows) =>
  rows
    .map((row) => sanitizeText(row, 700))
    .filter(Boolean)
    .join(' | ');

const toDate = (value) => {
  const date = new Date(value);

  return value && !Number.isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
};

const parseCategory = (value) =>
  Array.isArray(value)
    ? value
    : String(value || 'Government')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

function getSavedAdminToken() {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) || '';
  } catch {
    return '';
  }
}

function saveAdminToken(token) {
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, token);
  } catch {
    // ignore
  }
}

function clearAdminToken() {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // ignore
  }
}

function getAdminConfig(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

function getErrorMessage(error, fallback = 'Something went wrong.') {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

function isAuthError(error) {
  return error?.response?.status === 401 || error?.response?.status === 403;
}

function autoSEO(form, rows) {
  const title = sanitizeText(form.title, 180);
  const total = rows.vacancyRows.find((row) => /total/i.test(row.label))?.value || '';
  const last = form.lastDate ? new Date(form.lastDate).toLocaleDateString('en-GB') : '';
  const slug = slugify(title);

  return {
    seoTitle: (title ? `${title}${total ? ` for ${total}` : ''} | EduFill` : '').slice(0, 70),
    metaDescription: (
      title
        ? `${title} notification details. Check dates, application fee, age limit, vacancies, eligibility and apply online${last ? ` before ${last}` : ''}.`
        : ''
    ).slice(0, 160),
    keywords: [
      title,
      `${form.department} recruitment`,
      `${form.department} vacancy`,
      `${title} apply online`,
      `${title} notification`,
      `${title} eligibility`,
      'EduFill',
    ]
      .filter(Boolean)
      .join(', '),
    slug,
    canonicalUrl: slug ? `${SITE_URL}/exam/${slug}` : '',
  };
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  textarea = false,
  required = false,
  placeholder = '',
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-500">
        {label}
      </label>

      {textarea ? (
        <textarea
          rows="4"
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
        />
      )}
    </div>
  );
}

function Card({ title, sub, children }) {
  return (
    <section className="rounded-[1.35rem] border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-gray-900">{title}</h3>
      {sub && <p className="mb-4 mt-1 text-xs font-semibold text-gray-500">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function KVRows({ rows, setRows, type, addText, labelPH, valuePH }) {
  const update = (index, key, value) => {
    setRows((previous) => ({
      ...previous,
      [type]: previous[type].map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row
      ),
    }));
  };

  const remove = (index) => {
    setRows((previous) => {
      const next = previous[type].filter((_, rowIndex) => rowIndex !== index);

      return {
        ...previous,
        [type]: next.length ? next : [{ label: '', value: '' }],
      };
    });
  };

  return (
    <>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={`${type}-${index}`}
            className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 md:grid-cols-12"
          >
            <input
              value={row.label}
              onChange={(event) => update(index, 'label', event.target.value)}
              placeholder={labelPH}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold outline-none md:col-span-5"
            />

            <input
              value={row.value}
              onChange={(event) => update(index, 'value', event.target.value)}
              placeholder={valuePH}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold outline-none md:col-span-6"
            />

            <button
              type="button"
              onClick={() => remove(index)}
              className="rounded-xl border border-red-100 bg-white p-2 text-red-500 md:col-span-1"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          setRows((previous) => ({
            ...previous,
            [type]: [...previous[type], { label: '', value: '' }],
          }))
        }
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-xs font-black text-white"
      >
        <Plus size={14} />
        {addText}
      </button>
    </>
  );
}

function ListRows({ rows, setRows, type, addText, placeholder }) {
  const update = (index, value) => {
    setRows((previous) => ({
      ...previous,
      [type]: previous[type].map((row, rowIndex) => (rowIndex === index ? value : row)),
    }));
  };

  const remove = (index) => {
    setRows((previous) => {
      const next = previous[type].filter((_, rowIndex) => rowIndex !== index);

      return {
        ...previous,
        [type]: next.length ? next : [''],
      };
    });
  };

  return (
    <>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={`${type}-${index}`}
            className="grid grid-cols-12 gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3"
          >
            <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-black sm:flex">
              {index + 1}
            </span>

            <input
              value={row}
              onChange={(event) => update(index, event.target.value)}
              placeholder={placeholder}
              className="col-span-10 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold outline-none sm:col-span-10"
            />

            <button
              type="button"
              onClick={() => remove(index)}
              className="col-span-2 rounded-xl border border-red-100 bg-white p-2 text-red-500 sm:col-span-1"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          setRows((previous) => ({
            ...previous,
            [type]: [...previous[type], ''],
          }))
        }
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-xs font-black text-white"
      >
        <Plus size={14} />
        {addText}
      </button>
    </>
  );
}

function AdminLoginScreen({ password, setPassword, loading, error, onSubmit }) {
  return (
    <div className="min-h-screen bg-[#071426] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-2xl border border-white/10">
        <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
          <LockKeyhole size={34} />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-gray-950">EduFill Exam Admin</h1>
          <p className="mt-2 text-sm font-semibold text-gray-500">
            Admin password enter karo to exam alert dashboard access milega.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-500">
              Admin Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              autoComplete="current-password"
              placeholder="Enter admin password"
              className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600 flex items-start gap-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-black py-3.5 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <LockKeyhole size={18} />
                Unlock Admin Panel
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] font-bold text-gray-400 leading-relaxed">
          Admin access backend token se verify hota hai. Password kisi ke saath share mat karo.
        </p>
      </div>
    </div>
  );
}

export default function AddExamAlert() {
  const [adminToken, setAdminToken] = useState(getSavedAdminToken);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');

  const [tab, setTab] = useState('table');
  const [form, setForm] = useState(init);
  const [rows, setRows] = useState(createDefaultRows);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);

  const handleAdminLogout = () => {
    clearAdminToken();
    setAdminToken('');
    setAdminPassword('');
    setAdminLoginError('');
    setExams([]);
    setForm(init);
    setRows(createDefaultRows());
    setEditId(null);
    setTab('table');
  };

  const fetchExams = async (token = adminToken) => {
    if (!token) return;

    setFetching(true);

    try {
      const response = await axios.get(`${API_BASE}/api/exams/admin`, getAdminConfig(token));
      setExams(Array.isArray(response.data) ? response.data : response.data?.exams || response.data?.data || []);
    } catch (error) {
      if (isAuthError(error)) {
        handleAdminLogout();
        setAdminLoginError('Invalid or expired admin password. Please login again.');
        return;
      }

      setMessage({
        text: getErrorMessage(error, 'Unable to fetch exam records.'),
        type: 'error',
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchExams(adminToken);
    }
  }, [adminToken]);

  const handleAdminLogin = async (event) => {
    event.preventDefault();

    const token = adminPassword.trim();

    if (!token) {
      setAdminLoginError('Please enter admin password.');
      return;
    }

    setAdminLoginLoading(true);
    setAdminLoginError('');

    try {
      const response = await axios.get(`${API_BASE}/api/exams/admin`, getAdminConfig(token));
      const examData = Array.isArray(response.data) ? response.data : response.data?.exams || response.data?.data || [];

      saveAdminToken(token);
      setAdminToken(token);
      setAdminPassword('');
      setExams(examData);
    } catch (error) {
      clearAdminToken();
      setAdminToken('');

      if (isAuthError(error)) {
        setAdminLoginError('Wrong admin password.');
      } else {
        setAdminLoginError(getErrorMessage(error, 'Admin login failed. Backend security check karo.'));
      }
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const onChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const toggleCat = (cat) => {
    setForm((previous) => {
      const current = Array.isArray(previous.category) ? previous.category : [];
      const next = current.includes(cat) ? current.filter((item) => item !== cat) : [...current, cat];

      return {
        ...previous,
        category: next.length ? next : [cat],
      };
    });
  };

  const generateSEO = () => {
    setForm((previous) => ({
      ...previous,
      ...autoSEO(previous, rows),
    }));
  };

  const payload = () => {
    const seo = autoSEO(form, rows);

    return {
      ...form,
      title: sanitizeText(form.title, 180),
      department: sanitizeText(form.department, 120),
      shortInfo: sanitizeText(form.shortInfo, 1200),
      category: Array.isArray(form.category) ? form.category.join(', ') : form.category,
      applicationFee: serializeKV(rows.feeRows, 'Fee'),
      ageLimit: serializeKV(rows.ageRows, 'Age'),
      totalVacancies: serializeKV(rows.vacancyRows, 'Vacancy'),
      qualification: serializeList(rows.qualificationRows),
      howToApply: serializeList(rows.howRows),
      importantInstructions: serializeList(rows.instructionRows),
      seoTitle: form.seoTitle || seo.seoTitle,
      metaDescription: form.metaDescription || seo.metaDescription,
      keywords: form.keywords || seo.keywords,
      slug: form.slug || slugify(form.title),
      canonicalUrl: form.canonicalUrl || seo.canonicalUrl,
    };
  };

  const validate = (currentPayload) => {
    if (!adminToken) return 'Admin session expired. Please login again.';
    if (!currentPayload.title) return 'Title required.';
    if (!currentPayload.department) return 'Department required.';
    if (!currentPayload.shortInfo) return 'Short information required.';
    if (!currentPayload.lastDate) return 'Last date required.';
    if (!currentPayload.applicationFee) return 'Application fee required.';
    if (!currentPayload.ageLimit) return 'Age limit required.';
    if (!currentPayload.totalVacancies) return 'Vacancies required.';
    if (!currentPayload.qualification) return 'Qualification required.';
    if (!currentPayload.officialLink && !currentPayload.notificationLink) return 'Official or notification link required.';
    if (!currentPayload.seoTitle || !currentPayload.metaDescription || !currentPayload.keywords || !currentPayload.slug) {
      return 'SEO fields required. Click Auto Generate SEO.';
    }

    return '';
  };

  const submit = async (event) => {
    event.preventDefault();

    const currentPayload = payload();
    const error = validate(currentPayload);

    if (error) {
      setMessage({ text: error, type: 'error' });

      if (!adminToken) handleAdminLogout();

      return;
    }

    setLoading(true);

    try {
      if (editId) {
        await axios.put(`${API_BASE}/api/exams/${editId}`, currentPayload, getAdminConfig(adminToken));
      } else {
        await axios.post(`${API_BASE}/api/exams`, currentPayload, getAdminConfig(adminToken));
      }

      setMessage({
        text: editId ? 'Exam updated.' : 'Exam published.',
        type: 'success',
      });

      cancel();
      await fetchExams(adminToken);
      setTab('table');
    } catch (errorObject) {
      if (isAuthError(errorObject)) {
        handleAdminLogout();
        setAdminLoginError('Admin session expired. Please login again.');
        return;
      }

      setMessage({
        text: getErrorMessage(errorObject, 'Save failed.'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    setForm(init);
    setRows(createDefaultRows());
    setEditId(null);
  };

  const edit = (exam) => {
    setForm({
      ...init,
      ...exam,
      category: parseCategory(exam.category),
      startDate: toDate(exam.startDate),
      lastDate: toDate(exam.lastDate),
      payFeeLastDate: toDate(exam.payFeeLastDate),
      postDate: toDate(exam.postDate),
    });

    setRows({
      feeRows: parseKV(exam.applicationFee, 'Fee').length ? parseKV(exam.applicationFee, 'Fee') : createDefaultRows().feeRows,
      ageRows: parseKV(exam.ageLimit, 'Age').length ? parseKV(exam.ageLimit, 'Age') : createDefaultRows().ageRows,
      vacancyRows: parseKV(exam.totalVacancies, 'Vacancy').length ? parseKV(exam.totalVacancies, 'Vacancy') : createDefaultRows().vacancyRows,
      qualificationRows: splitRows(exam.qualification).length ? splitRows(exam.qualification) : [''],
      howRows: splitRows(exam.howToApply).length ? splitRows(exam.howToApply) : createDefaultRows().howRows,
      instructionRows: splitRows(exam.importantInstructions).length ? splitRows(exam.importantInstructions) : createDefaultRows().instructionRows,
    });

    setEditId(exam._id || exam.id);
    setTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const del = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this exam alert?')) return;

    const previous = exams;
    setExams((current) => current.filter((item) => item._id !== id && item.id !== id));

    try {
      await axios.delete(`${API_BASE}/api/exams/${id}`, getAdminConfig(adminToken));
      setMessage({ text: 'Exam deleted.', type: 'success' });
    } catch (error) {
      if (isAuthError(error)) {
        handleAdminLogout();
        setAdminLoginError('Admin session expired. Please login again.');
        return;
      }

      setExams(previous);
      setMessage({ text: getErrorMessage(error, 'Delete failed.'), type: 'error' });
    }
  };

  const filtered = exams.filter((exam) =>
    `${exam.title || ''} ${exam.department || ''} ${exam.category || ''} ${exam.keywords || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const seoScore = useMemo(
    () =>
      (form.seoTitle ? 25 : 0) +
      (form.metaDescription ? 25 : 0) +
      (form.keywords ? 20 : 0) +
      (form.slug ? 15 : 0) +
      (form.canonicalUrl ? 15 : 0),
    [form]
  );

  if (!adminToken) {
    return (
      <>
        <Helmet>
          <title>Exam Admin Login | EduFill</title>
          <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
          <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet" />
        </Helmet>

        <AdminLoginScreen
          password={adminPassword}
          setPassword={setAdminPassword}
          loading={adminLoginLoading}
          error={adminLoginError}
          onSubmit={handleAdminLogin}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 font-sans sm:px-6 lg:px-8">
      <Helmet>
        <title>Exam Alerts Admin | EduFill</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet" />
      </Helmet>

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-700">
              <Sparkles size={14} /> EduFill Admin
            </div>
            <h1 className="text-2xl font-black text-gray-900 md:text-3xl">
              Exam Alerts Dashboard
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              SEO ready exam pages create karo jo Google me rank kar sake.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase text-gray-400">Active</p>
                <p className="text-lg font-black">
                  {exams.filter((exam) => exam.status === 'Active').length}
                </p>
              </div>
              <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase text-gray-400">Total</p>
                <p className="text-lg font-black">{exams.length}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdminLogout}
              className="rounded-2xl border bg-white px-4 py-3 text-sm font-black text-red-600 shadow-sm flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        <div className="flex max-w-md gap-1 rounded-2xl bg-gray-200/60 p-1.5">
          <button
            type="button"
            onClick={() => setTab('table')}
            className={`flex-1 rounded-xl px-6 py-3 text-sm font-bold ${
              tab === 'table' ? 'bg-white shadow-sm' : 'text-gray-500'
            }`}
          >
            Exam Details
          </button>

          <button
            type="button"
            onClick={() => {
              cancel();
              setTab('form');
            }}
            className={`flex-1 rounded-xl px-6 py-3 text-sm font-bold ${
              tab === 'form' ? 'bg-white shadow-sm' : 'text-gray-500'
            }`}
          >
            Add New Exam
          </button>
        </div>

        {message.text && (
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {tab === 'form' ? (
          <form onSubmit={submit} className="space-y-5">
            <Card
              title={editId ? 'Edit SEO Ready Exam Page' : 'Create SEO Ready Exam Page'}
              sub="Raw data ko clean fields me fill karo."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-8">
                  <Field
                    label="Exam / Job Title"
                    name="title"
                    value={form.title}
                    onChange={onChange}
                    required
                    placeholder="UP Cooperative Bank UPCISB Various Post Recruitment 2026"
                  />
                </div>
                <div className="md:col-span-4">
                  <Field
                    label="Department / Board"
                    name="department"
                    value={form.department}
                    onChange={onChange}
                    required
                    placeholder="UPCISB"
                  />
                </div>
                <div className="md:col-span-12">
                  <Field
                    label="Short Information"
                    name="shortInfo"
                    value={form.shortInfo}
                    onChange={onChange}
                    textarea
                    required
                    placeholder="Short notification summary..."
                  />
                </div>

                {[
                  ['Advt No.', 'notificationNumber'],
                  ['Post Date', 'postDate', 'date'],
                  ['Start Date', 'startDate', 'date'],
                  ['Last Date', 'lastDate', 'date'],
                  ['Fee Last Date', 'payFeeLastDate', 'date'],
                  ['Exam Date', 'examDate'],
                  ['Admit Card', 'admitCardDate'],
                ].map(([label, name, type]) => (
                  <div key={name} className="md:col-span-4">
                    <Field
                      label={label}
                      name={name}
                      type={type || 'text'}
                      value={form[name]}
                      onChange={onChange}
                      required={name === 'lastDate'}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Application Fee" sub="Category-wise fee add karo.">
              <KVRows
                rows={rows.feeRows}
                setRows={setRows}
                type="feeRows"
                addText="Add Fee Row"
                labelPH="UR / OBC / EWS"
                valuePH="₹500"
              />
              <div className="mt-4">
                <Field
                  label="Payment Mode"
                  name="paymentMode"
                  value={form.paymentMode}
                  onChange={onChange}
                  placeholder="Debit Card / Credit Card / UPI"
                />
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card title="Age Limit">
                <KVRows
                  rows={rows.ageRows}
                  setRows={setRows}
                  type="ageRows"
                  addText="Add Age Rule"
                  labelPH="Minimum Age"
                  valuePH="21 Years"
                />
              </Card>

              <Card title="Vacancies">
                <KVRows
                  rows={rows.vacancyRows}
                  setRows={setRows}
                  type="vacancyRows"
                  addText="Add Vacancy Row"
                  labelPH="Total Posts / Manager"
                  valuePH="2085 / 65"
                />
              </Card>
            </div>

            <Card title="Educational Qualification">
              <ListRows
                rows={rows.qualificationRows}
                setRows={setRows}
                type="qualificationRows"
                addText="Add Qualification"
                placeholder="Manager: B.Com with minimum 55% marks OR..."
              />
            </Card>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card title="How to Apply">
                <ListRows
                  rows={rows.howRows}
                  setRows={setRows}
                  type="howRows"
                  addText="Add Step"
                  placeholder="Candidate can apply online from..."
                />
              </Card>

              <Card title="Important Instructions">
                <ListRows
                  rows={rows.instructionRows}
                  setRows={setRows}
                  type="instructionRows"
                  addText="Add Instruction"
                  placeholder="Check all columns carefully."
                />
              </Card>
            </div>

            <Card title="Important Links">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ['Official / Main Link', 'officialLink'],
                  ['Apply Online Link', 'applyOnlineLink'],
                  ['Notification PDF Link', 'notificationLink'],
                  ['Syllabus Link', 'syllabusLink'],
                  ['Official Website', 'officialWebsite'],
                ].map(([label, name]) => (
                  <Field
                    key={name}
                    label={label}
                    name={name}
                    value={form[name]}
                    onChange={onChange}
                    placeholder="https://..."
                  />
                ))}
              </div>
            </Card>

            <Card
              title="SEO Settings"
              sub="Google ranking ke liye title, description, keywords, slug aur schema data."
            >
              <div className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-black text-emerald-800">SEO Score: {seoScore}/100</p>
                  <p className="text-xs font-bold text-emerald-700">
                    Auto Generate SEO click karo, phir manually improve karo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={generateSEO}
                  className="rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black text-white"
                >
                  Auto Generate SEO
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field
                    label={`SEO Title (${form.seoTitle.length}/70)`}
                    name="seoTitle"
                    value={form.seoTitle}
                    onChange={onChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <Field
                    label={`Meta Description (${form.metaDescription.length}/160)`}
                    name="metaDescription"
                    value={form.metaDescription}
                    onChange={onChange}
                    textarea
                  />
                </div>

                <div className="md:col-span-2">
                  <Field
                    label="Keywords"
                    name="keywords"
                    value={form.keywords}
                    onChange={onChange}
                  />
                </div>

                <Field label="Slug" name="slug" value={form.slug} onChange={onChange} />
                <Field
                  label="Canonical URL"
                  name="canonicalUrl"
                  value={form.canonicalUrl}
                  onChange={onChange}
                />
                <Field label="OG Image URL" name="ogImage" value={form.ogImage} onChange={onChange} />

                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-500">
                    Robots
                  </label>
                  <select
                    name="robots"
                    value={form.robots}
                    onChange={onChange}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none"
                  >
                    <option>index, follow</option>
                    <option>noindex, nofollow</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card title="Publish Settings">
              <div className="mb-4 flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCat(cat)}
                    className={`rounded-xl border px-4 py-2 text-[11px] font-black uppercase ${
                      form.category.includes(cat)
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <select
                name="status"
                value={form.status}
                onChange={onChange}
                className="w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold"
              >
                <option value="Active">🟢 Live / Active</option>
                <option value="Expired">⚪ Expired / Hidden</option>
              </select>
            </Card>

            <div className="sticky bottom-4 z-10 flex justify-end gap-3 rounded-2xl border bg-white/90 p-4 shadow-xl backdrop-blur-xl">
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    cancel();
                    setTab('table');
                  }}
                  className="rounded-xl bg-gray-100 px-6 py-3 text-sm font-bold"
                >
                  Cancel
                </button>
              )}

              <button
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-gray-950 px-8 py-3 text-sm font-bold text-white disabled:opacity-70"
              >
                {loading ? <RefreshCcw className="animate-spin" size={16} /> : <Send size={16} />}
                {editId ? 'Save Changes' : 'Publish SEO Page'}
              </button>
            </div>
          </form>
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col items-center justify-between gap-4 border-b bg-gray-50/50 p-4 md:flex-row md:p-6">
              <h2 className="text-lg font-black text-gray-800">Alerts Directory</h2>

              <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                <button
                  type="button"
                  onClick={() => fetchExams(adminToken)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-700 flex items-center justify-center gap-2"
                >
                  {fetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                  Refresh
                </button>

                <div className="relative w-full md:w-80">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search exams..."
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {fetching ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <RefreshCcw className="mb-3 animate-spin" size={24} />
                  <p className="text-sm font-bold uppercase">Loading Records...</p>
                </div>
              ) : (
                <table className="w-full whitespace-nowrap text-left">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black uppercase text-gray-500">Exam Details</th>
                      <th className="px-6 py-4 text-xs font-black uppercase text-gray-500">SEO</th>
                      <th className="px-6 py-4 text-xs font-black uppercase text-gray-500">Deadline</th>
                      <th className="px-6 py-4 text-xs font-black uppercase text-gray-500">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-black uppercase text-gray-500">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((exam) => (
                      <tr key={exam._id || exam.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="max-w-[360px] truncate text-sm font-bold text-gray-900">{exam.title}</p>
                          <p className="text-[11px] font-semibold text-gray-500">{exam.department}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="max-w-[260px] truncate text-xs font-bold text-emerald-700">
                            {exam.slug || 'No slug'}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400">
                            {exam.seoTitle ? 'SEO Ready' : 'SEO Missing'}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                          {exam.lastDate ? new Date(exam.lastDate).toLocaleDateString('en-GB') : 'N/A'}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              exam.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {exam.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => edit(exam)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => del(exam._id || exam.id)}
                            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!filtered.length && (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center text-sm font-bold text-gray-400">
                          No records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  Bug,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Lightbulb,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase';

/*
  File path suggestion:
  src/components/Admin/tabs/FeedbackTab.jsx

  Firestore collection used:
  EduFill_Feedback

  Expected document fields from Feedback page:
  feedbackType: "bug" | "feature" | "review"
  priority: "low" | "medium" | "high" | "critical"
  rating: number | null
  pageName: string
  subject: string
  description: string
  steps: string
  name: string
  email: string
  phone: string
  attachments: [{ name, size, type, url }]
  status: "new" | "reviewing" | "fixed" | "rejected" | "archived"
  source: "feedback_page"
  createdAt: Firestore timestamp
*/

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  { value: 'reviewing', label: 'Reviewing', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  { value: 'fixed', label: 'Fixed', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { value: 'rejected', label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-100' },
  { value: 'archived', label: 'Archived', className: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const TYPE_META = {
  bug: {
    label: 'Bug Report',
    icon: Bug,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  feature: {
    label: 'Feature Idea',
    icon: Lightbulb,
    className: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  review: {
    label: 'Review',
    icon: Star,
    className: 'bg-amber-50 text-amber-700 border-amber-100',
  },
};

const PRIORITY_META = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  medium: 'bg-blue-50 text-blue-700 border-blue-100',
  high: 'bg-amber-50 text-amber-700 border-amber-100',
  critical: 'bg-red-50 text-red-700 border-red-100',
};

function getDateFromFirestore(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = getDateFromFirestore(value);
  if (!date) return 'N/A';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusMeta(status) {
  return STATUS_OPTIONS.find((item) => item.value === status) || STATUS_OPTIONS[0];
}

function getTypeMeta(type) {
  return TYPE_META[type] || TYPE_META.bug;
}

function normalizeFeedback(docSnap) {
  const data = docSnap.data();

  return {
    id: docSnap.id,
    feedbackType: data.feedbackType || data.type || 'bug',
    priority: data.priority || 'low',
    rating: data.rating || null,
    pageName: data.pageName || data.featureName || '',
    subject: data.subject || '',
    description: data.description || data.message || '',
    steps: data.steps || '',
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || data.mobile || '',
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    status: data.status || 'new',
    source: data.source || '',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export default function FeedbackTab() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortMode, setSortMode] = useState('latest');
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    setLoading(true);

    const feedbackQuery = query(
      collection(db, 'EduFill_Feedback'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      feedbackQuery,
      (snapshot) => {
        const data = snapshot.docs.map(normalizeFeedback);
        setFeedbacks(data);
        setLoading(false);
        setLoadError('');
      },
      (error) => {
        console.error('Feedback fetch error:', error);
        setLoadError(
          'Feedback load nahi ho pa raha. Firestore rules ya createdAt orderBy index check karo.'
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const bugs = feedbacks.filter((item) => item.feedbackType === 'bug').length;
    const features = feedbacks.filter((item) => item.feedbackType === 'feature').length;
    const reviews = feedbacks.filter((item) => item.feedbackType === 'review').length;
    const critical = feedbacks.filter((item) => item.priority === 'critical').length;
    const newItems = feedbacks.filter((item) => item.status === 'new').length;
    const fixed = feedbacks.filter((item) => item.status === 'fixed').length;

    const avgRatingItems = feedbacks.filter((item) => item.feedbackType === 'review' && item.rating);
    const avgRating = avgRatingItems.length
      ? (avgRatingItems.reduce((sum, item) => sum + Number(item.rating || 0), 0) / avgRatingItems.length).toFixed(1)
      : '0.0';

    return { total, bugs, features, reviews, critical, newItems, fixed, avgRating };
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    const queryText = searchText.trim().toLowerCase();

    let list = feedbacks.filter((item) => {
      const matchesSearch =
        !queryText ||
        item.subject.toLowerCase().includes(queryText) ||
        item.pageName.toLowerCase().includes(queryText) ||
        item.description.toLowerCase().includes(queryText) ||
        item.name.toLowerCase().includes(queryText) ||
        item.email.toLowerCase().includes(queryText);

      const matchesType = typeFilter === 'all' || item.feedbackType === typeFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;

      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });

    if (sortMode === 'oldest') {
      list = [...list].sort((a, b) => {
        const aTime = getDateFromFirestore(a.createdAt)?.getTime() || 0;
        const bTime = getDateFromFirestore(b.createdAt)?.getTime() || 0;
        return aTime - bTime;
      });
    }

    if (sortMode === 'critical') {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      list = [...list].sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
    }

    if (sortMode === 'rating') {
      list = [...list].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return list;
  }, [feedbacks, searchText, typeFilter, statusFilter, priorityFilter, sortMode]);

  const updateFeedbackStatus = async (feedbackId, newStatus) => {
    if (!feedbackId) return;

    setUpdatingId(feedbackId);

    try {
      await updateDoc(doc(db, 'EduFill_Feedback', feedbackId), {
        status: newStatus,
        updatedAt: new Date(),
      });

      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback((prev) => ({ ...prev, status: newStatus, updatedAt: new Date() }));
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('Status update failed. Firestore permission check karo.');
    } finally {
      setUpdatingId('');
    }
  };

  const deleteFeedback = async (feedbackId) => {
    if (!feedbackId) return;

    const ok = window.confirm('Are you sure? Ye feedback permanently delete ho jayega.');
    if (!ok) return;

    setUpdatingId(feedbackId);

    try {
      await deleteDoc(doc(db, 'EduFill_Feedback', feedbackId));
      if (selectedFeedback?.id === feedbackId) setSelectedFeedback(null);
    } catch (error) {
      console.error('Delete feedback error:', error);
      alert('Delete failed. Firestore permission check karo.');
    } finally {
      setUpdatingId('');
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setTypeFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSortMode('latest');
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
              <MessageSquare size={13} />
              Feedback Management
            </div>
            <h2 className="text-2xl font-black text-gray-950">EduFill Feedback Center</h2>
            <p className="mt-1 text-sm font-semibold text-gray-500">
              Bug reports, feature ideas aur app reviews yahin se manage karo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-black text-gray-700 hover:bg-gray-50"
            >
              <RefreshCcw size={15} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <StatCard title="Total" value={stats.total} icon={<MessageSquare size={19} />} color="emerald" />
        <StatCard title="New" value={stats.newItems} icon={<Clock size={19} />} color="blue" />
        <StatCard title="Bugs" value={stats.bugs} icon={<Bug size={19} />} color="red" />
        <StatCard title="Features" value={stats.features} icon={<Lightbulb size={19} />} color="blue" />
        <StatCard title="Reviews" value={stats.reviews} icon={<Star size={19} />} color="amber" />
        <StatCard title="Critical" value={stats.critical} icon={<AlertCircle size={19} />} color="red" />
        <StatCard title="Avg Rating" value={stats.avgRating} icon={<Star size={19} />} color="amber" />
      </div>

      {/* Filters */}
      <div className="rounded-[1.5rem] border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_0.75fr_0.75fr_0.75fr_0.75fr_auto]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search subject, page, description, name, email..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm font-bold text-gray-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <FilterSelect value={typeFilter} onChange={setTypeFilter} label="Type">
            <option value="all">All Types</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="review">Review</option>
          </FilterSelect>

          <FilterSelect value={statusFilter} onChange={setStatusFilter} label="Status">
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </FilterSelect>

          <FilterSelect value={priorityFilter} onChange={setPriorityFilter} label="Priority">
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </FilterSelect>

          <FilterSelect value={sortMode} onChange={setSortMode} label="Sort">
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="critical">Critical First</option>
            <option value="rating">Highest Rating</option>
          </FilterSelect>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-black text-gray-700 hover:bg-gray-100"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-[1.5rem] border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-5">
          <div>
            <h3 className="text-lg font-black text-gray-950">All Feedback</h3>
            <p className="text-xs font-bold text-gray-500">
              Showing {filteredFeedbacks.length} of {feedbacks.length}
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 sm:flex">
            <ShieldCheck size={14} />
            Realtime Sync
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-emerald-600" />
            <p className="text-sm font-black text-gray-700">Loading feedback...</p>
          </div>
        ) : loadError ? (
          <div className="m-5 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-600">
            {loadError}
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <EmptyState clearFilters={clearFilters} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[980px]">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <Th>Feedback</Th>
                    <Th>Type</Th>
                    <Th>Priority</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFeedbacks.map((item) => (
                    <FeedbackRow
                      key={item.id}
                      item={item}
                      updatingId={updatingId}
                      onView={setSelectedFeedback}
                      onStatusChange={updateFeedbackStatus}
                      onDelete={deleteFeedback}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid grid-cols-1 gap-3 p-4 lg:hidden">
              {filteredFeedbacks.map((item) => (
                <FeedbackMobileCard
                  key={item.id}
                  item={item}
                  updatingId={updatingId}
                  onView={setSelectedFeedback}
                  onStatusChange={updateFeedbackStatus}
                  onDelete={deleteFeedback}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <FeedbackDetailsModal
        feedback={selectedFeedback}
        updatingId={updatingId}
        onClose={() => setSelectedFeedback(null)}
        onStatusChange={updateFeedbackStatus}
        onDelete={deleteFeedback}
      />
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClass = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  }[color];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border ${colorClass}`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-gray-950">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</p>
    </div>
  );
}

function FilterSelect({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-9 text-sm font-black text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      >
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500">
      {children}
    </th>
  );
}

function FeedbackRow({ item, updatingId, onView, onStatusChange, onDelete }) {
  const typeMeta = getTypeMeta(item.feedbackType);
  const TypeIcon = typeMeta.icon;
  const statusMeta = getStatusMeta(item.status);

  return (
    <tr className="hover:bg-gray-50">
      <td className="max-w-[360px] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${typeMeta.className}`}>
            <TypeIcon size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-gray-950">{item.subject || 'No subject'}</p>
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-gray-500">
              {item.description || 'No description'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold text-gray-400">
              {item.pageName && <span>Page: {item.pageName}</span>}
              {item.attachments.length > 0 && <span>{item.attachments.length} attachment(s)</span>}
            </div>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <Badge className={typeMeta.className}>{typeMeta.label}</Badge>
        {item.rating && (
          <div className="mt-2 flex items-center gap-1 text-amber-500">
            <Star size={13} fill="currentColor" />
            <span className="text-xs font-black">{item.rating}/5</span>
          </div>
        )}
      </td>

      <td className="px-5 py-4">
        <Badge className={PRIORITY_META[item.priority] || PRIORITY_META.low}>
          {item.priority}
        </Badge>
      </td>

      <td className="px-5 py-4">
        <StatusSelect
          value={item.status}
          disabled={updatingId === item.id}
          onChange={(status) => onStatusChange(item.id, status)}
        />
      </td>

      <td className="px-5 py-4 text-xs font-bold text-gray-500">
        {formatDate(item.createdAt)}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView(item)}
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
            title="View"
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            disabled={updatingId === item.id}
            className="rounded-xl border border-red-100 bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-60"
            title="Delete"
          >
            {updatingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      </td>
    </tr>
  );
}

function FeedbackMobileCard({ item, updatingId, onView, onStatusChange, onDelete }) {
  const typeMeta = getTypeMeta(item.feedbackType);
  const TypeIcon = typeMeta.icon;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${typeMeta.className}`}>
            <TypeIcon size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-gray-950">{item.subject || 'No subject'}</p>
            <p className="mt-1 text-xs font-semibold text-gray-500">{item.pageName || 'No page name'}</p>
          </div>
        </div>
        <Badge className={PRIORITY_META[item.priority] || PRIORITY_META.low}>{item.priority}</Badge>
      </div>

      <p className="mb-4 line-clamp-2 text-xs font-semibold leading-relaxed text-gray-500">
        {item.description || 'No description'}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Badge className={typeMeta.className}>{typeMeta.label}</Badge>
        <span className="text-right text-[11px] font-bold text-gray-400">{formatDate(item.createdAt)}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <StatusSelect
            value={item.status}
            disabled={updatingId === item.id}
            onChange={(status) => onStatusChange(item.id, status)}
          />
        </div>
        <button
          type="button"
          onClick={() => onView(item)}
          className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <Eye size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={updatingId === item.id}
          className="rounded-xl border border-red-100 bg-red-50 p-2.5 text-red-600 hover:bg-red-100 disabled:opacity-60"
        >
          {updatingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
      </div>
    </div>
  );
}

function StatusSelect({ value, onChange, disabled }) {
  const statusMeta = getStatusMeta(value);

  return (
    <div className="relative min-w-[145px]">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none rounded-xl border px-3 py-2 pr-8 text-xs font-black outline-none disabled:opacity-60 ${statusMeta.className}`}
      >
        {STATUS_OPTIONS.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
    </div>
  );
}

function Badge({ className, children }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${className}`}>
      {children}
    </span>
  );
}

function EmptyState({ clearFilters }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center text-center p-6">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
        <Filter size={30} />
      </div>
      <h3 className="text-xl font-black text-gray-950">No feedback found</h3>
      <p className="mt-2 max-w-md text-sm font-semibold text-gray-500">
        Filter/search ke according koi feedback match nahi hua.
      </p>
      <button
        type="button"
        onClick={clearFilters}
        className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
      >
        Clear Filters
      </button>
    </div>
  );
}

function FeedbackDetailsModal({ feedback, updatingId, onClose, onStatusChange, onDelete }) {
  if (!feedback) return null;

  const typeMeta = getTypeMeta(feedback.feedbackType);
  const TypeIcon = typeMeta.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] border border-white bg-white shadow-2xl sm:rounded-[2rem]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white p-5">
          <div className="flex items-start gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${typeMeta.className}`}>
              <TypeIcon size={22} />
            </div>
            <div>
              <Badge className={typeMeta.className}>{typeMeta.label}</Badge>
              <h3 className="mt-2 text-xl font-black text-gray-950">{feedback.subject || 'No subject'}</h3>
              <p className="mt-1 text-xs font-bold text-gray-400">{formatDate(feedback.createdAt)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoBox label="Page" value={feedback.pageName || 'N/A'} />
            <InfoBox label="Priority" value={feedback.priority || 'low'} />
            <InfoBox label="Status" value={getStatusMeta(feedback.status).label} />
            <InfoBox label="Rating" value={feedback.rating ? `${feedback.rating}/5` : 'N/A'} />
          </div>

          <Section title="Description">
            <p className="whitespace-pre-wrap rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-semibold leading-relaxed text-gray-700">
              {feedback.description || 'No description'}
            </p>
          </Section>

          {feedback.steps && (
            <Section title="Steps to Reproduce">
              <p className="whitespace-pre-wrap rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-semibold leading-relaxed text-gray-700">
                {feedback.steps}
              </p>
            </Section>
          )}

          <Section title="User Details">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ContactBox icon={<UserRound size={16} />} label="Name" value={feedback.name || 'Not provided'} />
              <ContactBox icon={<Mail size={16} />} label="Email" value={feedback.email || 'Not provided'} />
              <ContactBox icon={<Phone size={16} />} label="Phone" value={feedback.phone || 'Not provided'} />
            </div>
          </Section>

          <Section title={`Attachments (${feedback.attachments.length})`}>
            {feedback.attachments.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {feedback.attachments.map((file, index) => (
                  <a
                    key={`${file.url}-${index}`}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 hover:bg-white hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-gray-900">{file.name || `Attachment ${index + 1}`}</p>
                      <p className="text-[10px] font-bold text-gray-400">
                        {file.type || 'file'} {file.size ? `• ${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                      </p>
                    </div>
                    <ExternalLink size={16} className="shrink-0 text-emerald-600" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm font-semibold text-gray-500">
                No attachments uploaded.
              </p>
            )}
          </Section>

          <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-5 sm:grid-cols-[1fr_auto_auto]">
            <StatusSelect
              value={feedback.status}
              disabled={updatingId === feedback.id}
              onChange={(status) => onStatusChange(feedback.id, status)}
            />

            <button
              type="button"
              onClick={() => onStatusChange(feedback.id, 'fixed')}
              disabled={updatingId === feedback.id}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              Mark Fixed
            </button>

            <button
              type="button"
              onClick={() => onDelete(feedback.id)}
              disabled={updatingId === feedback.id}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-black text-red-600 hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black capitalize text-gray-900">{value}</p>
    </div>
  );
}

function ContactBox({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-gray-500">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
      </div>
      <p className="break-words text-sm font-bold text-gray-800">{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-black uppercase tracking-widest text-gray-500">{title}</h4>
      {children}
    </section>
  );
}

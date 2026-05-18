import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  User,
  FileText,
  BookOpen,
  TrendingUp,
  Mail,
  PlayCircle,
  Bell,
  GraduationCap,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import Header from '../components/home/Header';

const LOCAL_API_BASE_URL = 'http://localhost:5000';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? LOCAL_API_BASE_URL
    : '')
).replace(/\/$/, '');

const apiUrl = (path) => `${API_BASE_URL}${path}`;

const BLOGS_PAGE_LIMIT = 12;
const NEWSLETTER_COLLECTION = 'Newsletter_Subscribers';
const SUBSCRIBE_COOLDOWN_MS = 30 * 1000;

const fallbackImage = 'https://placehold.co/800x500/EFF6FF/0F766E?text=EduFill+Blog';

const categoriesList = [
  { name: 'All', icon: null },
  { name: 'Exam Updates', icon: <FileText size={16} /> },
  { name: 'Preparation Tips', icon: <BookOpen size={16} /> },
  { name: 'College Reviews', icon: <GraduationCap size={16} /> },
  { name: 'Career Guidance', icon: <PlayCircle size={16} /> },
  { name: 'EduFill News', icon: <Sparkles size={16} /> },
];

const recentUpdates = [
  { id: 1, text: 'Latest exam notifications and form alerts', date: 'Updated regularly' },
  { id: 2, text: 'Admit card, result, and answer key updates', date: 'Live on EduFill' },
  { id: 3, text: 'Application deadline reminders for students', date: 'Check daily' },
  { id: 4, text: 'Preparation guides and form filling tips', date: 'New posts added' },
];

const formatDate = (dateValue, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Latest';
  return date.toLocaleDateString('en-US', options);
};

const safeText = (value, fallback = '') => (typeof value === 'string' ? value : fallback);

const getAuthorFirstName = (author) => {
  if (!author || typeof author !== 'string') return 'EduFill';
  return author.trim().split(' ')[0] || 'EduFill';
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

const getBlogId = (blog) => blog?._id || blog?.id || blog?.slug;

const getBlogLink = (blog) => {
  const slug = blog?.slug || blog?._id;
  return slug ? `/blog/${slug}` : '/blogs';
};

function useDebouncedValue(value, delay = 450) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function normalizeBlog(blog = {}) {
  return {
    ...blog,
    _id: blog._id || blog.id || blog.slug,
    title: blog.title || 'Untitled Blog',
    slug: blog.slug || blog._id || '',
    excerpt: blog.excerpt || '',
    coverImage: blog.coverImage || '',
    category: blog.category || 'Exam Updates',
    author: blog.author || 'EduFill Team',
    createdAt: blog.createdAt || blog.updatedAt || null,
    updatedAt: blog.updatedAt || blog.createdAt || null,
  };
}

function normalizePaginatedResponse(data) {
  if (Array.isArray(data)) {
    const blogs = data.map(normalizeBlog);
    return {
      blogs,
      total: blogs.length,
      page: 1,
      limit: blogs.length,
      totalPages: 1,
      hasMore: false,
    };
  }

  const blogs = (data?.blogs || data?.data || data?.results || []).map(normalizeBlog);
  const total = Number(data?.total ?? data?.count ?? blogs.length);
  const page = Number(data?.page || 1);
  const limitValue = Number(data?.limit || BLOGS_PAGE_LIMIT);
  const totalPages = Number(data?.totalPages || Math.max(1, Math.ceil(total / limitValue)));
  const hasMore = Boolean(data?.hasMore ?? page < totalPages);

  return {
    blogs,
    total,
    page,
    limit: limitValue,
    totalPages,
    hasMore,
  };
}

const BlogImage = React.memo(function BlogImage({ src, alt, className }) {
  return (
    <img
      src={src || fallbackImage}
      alt={alt || 'EduFill Blog'}
      loading="lazy"
      decoding="async"
      className={className}
      onError={(event) => {
        event.currentTarget.src = fallbackImage;
      }}
    />
  );
});

const BlogCard = React.memo(function BlogCard({ blog }) {
  return (
    <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
      <Link to={getBlogLink(blog)} className="relative h-48 sm:h-44 overflow-hidden bg-gray-100 block">
        <BlogImage
          src={blog.coverImage}
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md text-[9px] font-black text-emerald-700 uppercase tracking-widest shadow-sm border border-white">
          {blog.category || 'EduFill'}
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        <h4 className="text-lg font-black text-gray-900 mb-2 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
          <Link to={getBlogLink(blog)}>{blog.title}</Link>
        </h4>

        <p className="text-xs text-gray-500 font-medium mb-4 line-clamp-2 leading-relaxed flex-1">
          {blog.excerpt || 'Read the latest EduFill update and stay informed.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-gray-400 mt-auto pt-4 border-t border-gray-50">
          <span className="flex items-center gap-1"><User size={12} /> {getAuthorFirstName(blog.author)}</span>
          <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(blog.createdAt)}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> 5 min read</span>
        </div>
      </div>
    </article>
  );
});

const BlogBannerIllustration = React.memo(function BlogBannerIllustration() {
  return (
    <div className="relative w-full max-w-[420px] aspect-[4/3] mx-auto">
      <div className="absolute inset-0 rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-blue-50 via-white to-emerald-50 shadow-[0_30px_80px_rgba(15,118,110,0.18)] border border-white/80 overflow-hidden">
        <div className="absolute -top-12 -right-10 w-40 h-40 bg-blue-200/50 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-10 w-48 h-48 bg-emerald-200/55 rounded-full blur-2xl" />
        <div className="absolute top-8 right-12 grid grid-cols-6 gap-2 opacity-50">
          {Array.from({ length: 30 }).map((_, index) => (
            <span key={index} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          ))}
        </div>

        <div className="absolute left-[28%] top-[22%] w-[58%] h-[50%] bg-slate-900 rounded-[1.4rem] p-2.5 shadow-2xl">
          <div className="w-full h-full bg-white rounded-[1rem] p-5">
            <div className="text-center text-xl sm:text-2xl font-black text-blue-950 tracking-wide">BLOG</div>
            <div className="mx-auto mt-2 w-10 h-1 rounded-full bg-blue-500" />
            <div className="mt-6 space-y-3">
              <div className="h-2.5 w-3/4 rounded-full bg-blue-300" />
              <div className="h-2.5 w-full rounded-full bg-blue-100" />
              <div className="h-2.5 w-2/3 rounded-full bg-blue-200" />
            </div>
          </div>
        </div>

        <GraduationCap size={78} className="absolute right-8 top-12 text-blue-950 rotate-12 drop-shadow-xl" strokeWidth={1.7} />

        <div className="absolute left-8 bottom-8 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-3 py-2 shadow-sm">
          <Bell size={16} className="text-emerald-600" />
          <span className="text-[10px] font-black text-emerald-700">Instant Updates</span>
        </div>
      </div>
    </div>
  );
});

const NewsletterForm = ({ variant = 'sidebar', email, setEmail, status, loading, onSubmit }) => {
  const isBanner = variant === 'banner';

  return (
    <form onSubmit={onSubmit} className={isBanner ? 'w-full' : 'flex flex-col gap-2'}>
      <input type="text" name="company" tabIndex="-1" autoComplete="off" className="hidden" aria-hidden="true" />

      <div className={isBanner ? 'flex flex-col sm:flex-row gap-3 max-w-xl' : 'flex flex-col gap-2'}>
        <div className="relative flex-1">
          {isBanner && <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700" />}
          <input
            type="email"
            value={email}
            maxLength={120}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email address"
            className={
              isBanner
                ? 'w-full pl-11 pr-4 py-3.5 rounded-full text-gray-800 font-bold text-sm outline-none ring-1 ring-white/50 focus:ring-4 focus:ring-white/30'
                : 'w-full px-4 py-3 rounded-xl border border-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white'
            }
            aria-label="Newsletter email address"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={
            isBanner
              ? 'bg-white text-emerald-700 hover:bg-emerald-50 disabled:opacity-75 font-black py-3.5 px-7 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg text-sm active:scale-95'
              : 'w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white font-bold py-3 rounded-xl transition-colors shadow-md text-sm flex items-center justify-center gap-2'
          }
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? 'Subscribing...' : 'Subscribe'}
          {!loading && isBanner ? <ArrowRight size={16} /> : null}
        </button>
      </div>

      {status.message && (
        <div
          className={`mt-3 flex items-start gap-2 text-xs font-black ${
            isBanner
              ? status.type === 'success'
                ? 'text-white'
                : 'text-amber-100'
              : status.type === 'success'
                ? 'text-emerald-700'
                : 'text-red-600'
          }`}
        >
          {status.type === 'success' ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
          <span>{status.message}</span>
        </div>
      )}
    </form>
  );
};

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [editorsPicks, setEditorsPicks] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState(() =>
    categoriesList.map((cat) => ({ ...cat, count: cat.name === 'All' ? 0 : 0 }))
  );

  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 450);
  const [activeCategory, setActiveCategory] = useState('All');

  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState({ type: '', message: '' });

  const latestSectionRef = useRef(null);

  const fetchBlogMeta = useCallback(async (signal) => {
    try {
      const response = await axios.get(apiUrl('/api/blogs/meta'), { signal });
      const countsMap = response.data?.categoryCounts || {};
      const total = Number(response.data?.total || 0);

      setCategoryCounts(
        categoriesList.map((cat) => ({
          ...cat,
          count: cat.name === 'All' ? total : Number(countsMap[cat.name] || 0),
        }))
      );
    } catch (error) {
      // Meta route may not exist in older backend. UI will still work with 0 counts.
      if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
        console.warn('Blog meta load skipped:', error);
      }
    }
  }, []);

  const fetchSideContent = useCallback(async (signal) => {
    try {
      const [trendingRes, picksRes] = await Promise.all([
        axios.get(apiUrl('/api/blogs'), {
          signal,
          params: { page: 1, limit: 5, sort: 'latest', status: 'Published' },
        }),
        axios.get(apiUrl('/api/blogs'), {
          signal,
          params: { page: 1, limit: 4, sort: 'latest', status: 'Published', skipFeatured: true },
        }),
      ]);

      setTrendingPosts(normalizePaginatedResponse(trendingRes.data).blogs.slice(0, 5));
      setEditorsPicks(normalizePaginatedResponse(picksRes.data).blogs.slice(0, 4));
    } catch (error) {
      if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
        console.warn('Sidebar blogs load skipped:', error);
      }
    }
  }, []);

  const fetchBlogsPage = useCallback(
    async ({ page = 1, append = false, signal } = {}) => {
      if (append) setPageLoading(true);
      else setLoading(true);

      try {
        setErrorMessage('');

        const response = await axios.get(apiUrl('/api/blogs'), {
          signal,
          params: {
            page,
            limit: BLOGS_PAGE_LIMIT,
            search: debouncedSearchTerm.trim() || undefined,
            category: activeCategory === 'All' ? undefined : activeCategory,
            status: 'Published',
            sort: 'latest',
          },
        });

        const result = normalizePaginatedResponse(response.data);

        setBlogs((prev) => {
          const next = append ? [...prev, ...result.blogs] : result.blogs;
          const unique = new Map(next.map((blog) => [getBlogId(blog), blog]));
          return Array.from(unique.values());
        });

        setPagination({
          page: result.page,
          total: result.total,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
        });

        if (!append) {
          setFeaturedArticle(result.blogs[0] || null);
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          console.error('Failed to fetch blogs:', err);
          setErrorMessage('Blogs load nahi ho paaye. Please server/API check karein.');
        }
      } finally {
        setLoading(false);
        setPageLoading(false);
      }
    },
    [activeCategory, debouncedSearchTerm]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    const controller = new AbortController();

    fetchBlogMeta(controller.signal);
    fetchSideContent(controller.signal);

    return () => controller.abort();
  }, [fetchBlogMeta, fetchSideContent]);

  useEffect(() => {
    const controller = new AbortController();

    setBlogs([]);
    setFeaturedArticle(null);
    setPagination({ page: 1, total: 0, totalPages: 1, hasMore: false });
    fetchBlogsPage({ page: 1, append: false, signal: controller.signal });

    return () => controller.abort();
  }, [fetchBlogsPage]);

  const loadMoreBlogs = () => {
    if (pageLoading || !pagination.hasMore) return;
    fetchBlogsPage({ page: pagination.page + 1, append: true });
  };

  const handleViewAllBlogs = () => {
    setSearchTerm('');
    setActiveCategory('All');
    window.setTimeout(() => {
      latestSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    if (formData.get('company')) return;

    const normalizedEmail = newsletterEmail.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setNewsletterStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    const lastSubscribe = Number(localStorage.getItem('edufill_newsletter_last_submit') || 0);
    if (Date.now() - lastSubscribe < SUBSCRIBE_COOLDOWN_MS) {
      setNewsletterStatus({ type: 'error', message: 'Please wait a few seconds before trying again.' });
      return;
    }

    setNewsletterLoading(true);
    setNewsletterStatus({ type: '', message: '' });

    try {
      const duplicateQuery = query(
        collection(db, NEWSLETTER_COLLECTION),
        where('email', '==', normalizedEmail),
        limit(1)
      );

      const existing = await getDocs(duplicateQuery);

      if (!existing.empty) {
        setNewsletterStatus({ type: 'success', message: 'You are already subscribed to EduFill updates.' });
        setNewsletterEmail('');
        localStorage.setItem('edufill_newsletter_last_submit', String(Date.now()));
        return;
      }

      await addDoc(collection(db, NEWSLETTER_COLLECTION), {
        email: normalizedEmail,
        source: 'Blogs Page',
        status: 'active',
        subscribedAt: serverTimestamp(),
        userAgent: navigator.userAgent || 'unknown',
      });

      localStorage.setItem('edufill_newsletter_last_submit', String(Date.now()));
      setNewsletterEmail('');
      setNewsletterStatus({ type: 'success', message: 'Subscribed successfully! You will receive EduFill updates soon.' });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Newsletter subscription failed:', error);
      }
      setNewsletterStatus({ type: 'error', message: 'Subscription failed. Please try again or contact EduFill support.' });
    } finally {
      setNewsletterLoading(false);
    }
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4 px-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-100 border-t-emerald-600" />
        <p className="text-sm font-bold text-gray-500">Loading EduFill blogs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-emerald-200 pb-20 lg:pb-0 overflow-x-hidden">
      <SEO
        title="EduFill Blog | Latest Exam Updates & Preparation Tips"
        description="Stay updated with the latest exam updates, job alerts, results, admit cards, and preparation tips."
        url="/blogs"
      />

      <Header currentUser={null} onOpenFeedback={() => {}} />

      <section className="bg-gradient-to-br from-[#F0F7FF] via-white to-emerald-50 pt-7 sm:pt-10 md:pt-12 pb-10 sm:pb-14 md:pb-16 relative overflow-hidden border-b border-blue-50">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-[8%] w-24 h-24 bg-emerald-200/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-[12%] w-40 h-40 bg-blue-300/30 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(16,185,129,0.12)_1px,transparent_0)] [background-size:26px_26px] opacity-35" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <span className="inline-flex items-center gap-2 bg-white/80 border border-emerald-100 rounded-full px-4 py-2 text-[11px] font-black text-emerald-700 shadow-sm mb-5">
              <Sparkles size={14} /> Latest Exams, Jobs & Guides
            </span>

            <h1 className="text-3xl min-[390px]:text-4xl md:text-5xl lg:text-6xl font-black text-gray-950 mb-4 tracking-tight leading-tight">
              EduFill <span className="text-emerald-600">Blog</span>
            </h1>

            <p className="text-gray-600 text-sm sm:text-base md:text-lg font-medium mb-7 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Stay updated with the latest exam updates, job alerts, results, admit cards,
              preparation tips, and important information — all in one place.
            </p>

            <div className="relative w-full max-w-xl mx-auto lg:mx-0">
              <input
                type="text"
                placeholder="Search articles, topics, exams..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-5 pr-12 py-3.5 sm:py-4 rounded-2xl sm:rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-700 font-bold text-sm bg-white"
              />
              <button
                type="button"
                aria-label="Search blogs"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-600 transition-colors"
              >
                <Search size={21} />
              </button>
            </div>
          </div>

          <div className="w-full lg:flex-1 lg:flex lg:justify-end">
            <BlogBannerIllustration />
          </div>
        </div>
      </section>

      <div className="bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 sm:top-[61px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex overflow-x-auto py-3 sm:py-4 gap-2 md:gap-3 custom-scrollbar items-center">
            {categoryCounts.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(cat.name)}
                className={`whitespace-nowrap px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-black transition-all border flex items-center gap-2 ${
                  activeCategory === cat.name
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name}
                {cat.name !== 'All' && <span className="opacity-70">({cat.count})</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-7 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10">
        <div className="lg:col-span-8 flex flex-col gap-9 sm:gap-12 min-w-0">
          {errorMessage && (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 font-bold text-sm">
              {errorMessage}
            </div>
          )}

          {featuredArticle ? (
            <article className="bg-white rounded-[1.7rem] sm:rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:shadow-xl transition-shadow">
              <Link to={getBlogLink(featuredArticle)} className="w-full md:w-[45%] h-56 sm:h-64 md:h-auto bg-gray-100 relative overflow-hidden shrink-0 block">
                <span className="absolute top-4 left-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md z-10 shadow-md">
                  Featured Article
                </span>
                <BlogImage
                  src={featuredArticle.coverImage}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </Link>

              <div className="p-5 sm:p-6 md:p-8 flex flex-col justify-center flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md w-max mb-3 border border-emerald-100">
                  {featuredArticle.category || 'EduFill'}
                </span>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-3 sm:mb-4 group-hover:text-emerald-600 transition-colors">
                  <Link to={getBlogLink(featuredArticle)}>{featuredArticle.title}</Link>
                </h2>

                <p className="text-sm text-gray-500 font-medium mb-5 sm:mb-6 line-clamp-3 leading-relaxed">
                  {featuredArticle.excerpt ||
                    'A step-by-step guide to help you plan your preparation, manage time, choose the right resources, and stay consistent.'}
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold text-gray-500 mb-5 sm:mb-6">
                  <div className="flex items-center gap-1.5">
                    <User size={14} className="text-emerald-500" />
                    <span className="text-gray-800">{featuredArticle.author || 'EduFill Team'}</span>
                  </div>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-emerald-500" />
                    {formatDate(featuredArticle.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-emerald-500" /> 8 min read
                  </span>
                </div>

                <Link
                  to={getBlogLink(featuredArticle)}
                  className="w-full sm:w-max bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-sm shadow-md"
                >
                  Read Article <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 text-center">
              <h2 className="text-2xl font-black text-gray-900 mb-2">No articles found</h2>
              <p className="text-gray-500 font-medium">Search ya category change karke dobara try karein.</p>
            </div>
          )}

          <section ref={latestSectionRef}>
            <div className="flex items-center justify-between gap-4 mb-5 sm:mb-6 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900">Latest Articles</h3>
                <p className="text-xs font-bold text-gray-400 mt-1">
                  Showing {blogs.length} of {pagination.total} articles
                </p>
              </div>
              <button
                type="button"
                onClick={handleViewAllBlogs}
                className="text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm font-bold flex items-center gap-1 shrink-0"
              >
                View all <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {blogs.length > 0 ? (
                blogs.map((blog) => <BlogCard key={getBlogId(blog)} blog={blog} />)
              ) : (
                <div className="col-span-full py-10 text-center text-gray-400 font-bold">
                  No latest articles found.
                </div>
              )}
            </div>

            {pagination.hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  onClick={loadMoreBlogs}
                  disabled={pageLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-black px-7 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95"
                >
                  {pageLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {pageLoading ? 'Loading...' : 'Load More Blogs'}
                </button>
              </div>
            )}
          </section>

          {editorsPicks.length > 0 && (
            <section>
              <div className="flex items-center justify-between gap-4 mb-5 sm:mb-6 border-b border-gray-100 pb-3">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900">Editor's Picks</h3>
                <button
                  type="button"
                  onClick={handleViewAllBlogs}
                  className="text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm font-bold flex items-center gap-1 shrink-0"
                >
                  View all <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {editorsPicks.map((pick) => (
                  <article key={getBlogId(pick)} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                    <Link to={getBlogLink(pick)} className="h-28 sm:h-32 bg-gray-50 overflow-hidden relative p-2 sm:p-3 flex items-center justify-center">
                      <BlogImage
                        src={pick.coverImage}
                        alt={pick.title}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    <div className="p-3 sm:p-4 flex-1 flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1">
                        {pick.category || 'EduFill'}
                      </span>
                      <h4 className="text-xs font-black text-gray-900 mb-2 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">
                        <Link to={getBlogLink(pick)}>{pick.title}</Link>
                      </h4>
                      <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 mt-auto gap-2">
                        <span className="flex items-center gap-1 truncate"><User size={10} /> {getAuthorFirstName(pick.author)}</span>
                        <span className="shrink-0">{formatDate(pick.createdAt, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-6 sm:gap-8 w-full min-w-0">
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-5 sm:mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
              <TrendingUp size={18} className="text-emerald-600" /> Trending Posts
            </h3>
            <div className="space-y-5">
              {trendingPosts.length > 0 ? trendingPosts.map((post, index) => (
                <div key={getBlogId(post)} className="flex gap-3 sm:gap-4 items-center group">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-100">
                    {index + 1}
                  </div>
                  <Link to={getBlogLink(post)} className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                    <BlogImage
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-gray-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2 mb-1">
                      <Link to={getBlogLink(post)}>{post.title}</Link>
                    </h4>
                    <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <Calendar size={10} /> {formatDate(post.createdAt)}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-xs font-bold text-gray-400">No trending posts yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <BookOpen size={18} className="text-emerald-600" /> Popular Categories
            </h3>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-1 gap-1">
              {categoryCounts.slice(1).map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setActiveCategory(cat.name)}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group text-left"
                >
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-700 group-hover:text-emerald-600">
                    <span className="text-gray-400 group-hover:text-emerald-500">{cat.icon}</span>
                    {cat.name}
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-5 sm:p-6 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-2 flex items-center gap-2">
              <Mail size={18} className="text-emerald-600" /> Newsletter
            </h3>
            <p className="text-xs text-gray-600 font-medium mb-4 leading-relaxed">
              Subscribe to get latest updates, exam alerts, and job notifications straight to your inbox.
            </p>
            <NewsletterForm
              email={newsletterEmail}
              setEmail={setNewsletterEmail}
              status={newsletterStatus}
              loading={newsletterLoading}
              onSubmit={handleNewsletterSubmit}
            />
            <p className="text-[9px] text-gray-400 font-bold mt-3 text-center">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-4 border-b border-gray-100 pb-3">
              Recent Updates
            </h3>
            <ul className="space-y-4 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {recentUpdates.map((update) => (
                <li key={update.id} className="relative flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 relative z-10 outline outline-4 outline-white shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 leading-snug hover:text-emerald-600 cursor-pointer transition-colors mb-1">
                      {update.text}
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                      <Calendar size={10} /> {update.date}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleViewAllBlogs}
              className="mt-5 text-emerald-600 text-xs font-bold flex items-center gap-1 hover:underline"
            >
              View All Updates <ArrowRight size={12} />
            </button>
          </div>
        </aside>
      </main>

      <section className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-12 sm:pb-16">
        <div className="relative overflow-hidden rounded-[1.7rem] sm:rounded-[2rem] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 shadow-2xl border border-emerald-400/30">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-20 w-80 h-80 bg-white/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-28 left-1/3 w-96 h-96 bg-teal-300/20 blur-3xl rounded-full" />
          </div>

          <div className="relative z-10 p-6 sm:p-7 md:p-10 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10">
            <div className="flex-1 text-white w-full text-center lg:text-left">
              <span className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 text-xs font-black mb-5 backdrop-blur-sm">
                <Sparkles size={14} /> Free Exam Alerts
              </span>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight">
                Stay Ahead with EduFill
              </h2>

              <p className="text-emerald-50/90 font-medium text-sm md:text-base max-w-xl mx-auto lg:mx-0 mb-7 leading-relaxed">
                Get the latest exam updates, job alerts, results, admit cards & preparation tips
                delivered straight to your inbox.
              </p>

              <NewsletterForm
                variant="banner"
                email={newsletterEmail}
                setEmail={setNewsletterEmail}
                status={newsletterStatus}
                loading={newsletterLoading}
                onSubmit={handleNewsletterSubmit}
              />
            </div>
          </div>
        </div>
      </section>

      <style>
        {`
          html, body { overflow-x: hidden; }
          .custom-scrollbar::-webkit-scrollbar { display: none; }
          .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      <Footer />
    </div>
  );
}

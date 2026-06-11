/**
 * Blogs.jsx — EduFill Blog Listing Page
 *
 * SEO implemented:
 *   ✅ Dynamic <title>, <meta name="description">, <link rel="canonical">
 *   ✅ Open Graph tags (og:title, og:description, og:image, og:url, og:type)
 *   ✅ Twitter Card tags (summary_large_image)
 *   ✅ JSON-LD: WebPage / CollectionPage schema
 *   ✅ JSON-LD: ItemList schema (all visible blog posts)
 *   ✅ JSON-LD: BreadcrumbList schema
 *   ✅ JSON-LD: Organization + WebSite + SearchAction schema
 *   ✅ Exactly one H1 per page (keyword-rich: "EduFill Blog")
 *   ✅ H2 for section headings (Featured, Latest, Editor's Picks, banner)
 *   ✅ H3 for sidebar widget headings
 *   ✅ Semantic HTML: <main>, <article>, <aside>, <nav>, <section>
 *   ✅ <link rel="prev" / rel="next"> for paginated content
 *   ✅ noindex on page > 1 (prevents duplicate thin pages from ranking)
 *   ✅ Image alt text from coverImageAlt field (falls back to title)
 *   ✅ fetchpriority="high" + loading="eager" on hero/featured image
 *   ✅ loading="lazy" + decoding="async" on all below-fold images
 *   ✅ Explicit width/height on all images (prevents layout shift / CLS)
 *   ✅ Breadcrumb nav rendered in DOM + mirrored in JSON-LD
 *   ✅ Category links use real <a> hrefs (crawlable by Googlebot)
 *   ✅ <time datetime="..."> on all dates
 *   ✅ itemScope / itemProp microdata on article elements
 *   ✅ aria-label, role, aria-live, aria-pressed throughout
 *   ✅ publishedAt used for datePublished (not createdAt)
 *   ✅ readingTime from backend virtual with client-side estimate fallback
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Calendar, Clock, ArrowRight, User,
  FileText, BookOpen, TrendingUp, Mail, PlayCircle,
  Bell, GraduationCap, Sparkles, Loader2,
  CheckCircle2, AlertCircle, ChevronRight,
} from 'lucide-react';
import {
  addDoc, collection, getDocs, limit,
  query, serverTimestamp, where,
} from 'firebase/firestore';
import { db } from '../firebase';
import Footer from '../components/Footer';
import Header from '../components/home/Header';

// ─── Config ───────────────────────────────────────────────────────────────────

const LOCAL_API = 'http://localhost:5000';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? LOCAL_API : '')
).replace(/\/$/, '');

const SITE_URL  = (import.meta.env.VITE_SITE_URL || 'https://edufills.com').replace(/\/$/, '');
const SITE_NAME = 'EduFill';
const BLOGS_PER_PAGE        = 12;
const NEWSLETTER_COLLECTION = 'Newsletter_Subscribers';
const SUBSCRIBE_COOLDOWN_MS = 30_000;
const DEFAULT_OG_IMAGE      = `${SITE_URL}/og-blog-listing.jpg`;
const FALLBACK_IMAGE        = 'https://placehold.co/800x500/EFF6FF/0F766E?text=EduFill+Blog';

const apiUrl = (path) => `${API_BASE_URL}${path}`;

// ─── Static data ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'All',              icon: null,                        slug: '' },
  { name: 'Exam Updates',     icon: <FileText   size={15} />,    slug: 'exam-updates' },
  { name: 'Preparation Tips', icon: <BookOpen   size={15} />,    slug: 'preparation-tips' },
  { name: 'College Reviews',  icon: <GraduationCap size={15} />, slug: 'college-reviews' },
  { name: 'Career Guidance',  icon: <PlayCircle size={15} />,    slug: 'career-guidance' },
  { name: 'EduFill News',     icon: <Sparkles   size={15} />,    slug: 'edufill-news' },
];

const RECENT_UPDATES = [
  { id: 1, text: 'Latest exam notifications and form alerts',   date: 'Updated regularly' },
  { id: 2, text: 'Admit card, result, and answer key updates',  date: 'Live on EduFill' },
  { id: 3, text: 'Application deadline reminders for students', date: 'Check daily' },
  { id: 4, text: 'Preparation guides and form filling tips',    date: 'New posts added' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (v, opts = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? 'Latest' : d.toLocaleDateString('en-US', opts);
};

const isoDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

const getAuthorFirstName = (a) =>
  (typeof a === 'string' ? a.trim().split(' ')[0] : '') || 'EduFill';

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

const getBlogId   = (b) => b?._id || b?.id || b?.slug;
const getBlogLink = (b) => { const s = b?.slug || b?._id; return s ? `/blog/${s}` : '/blogs'; };
const getBlogAbsUrl = (b) => `${SITE_URL}${getBlogLink(b)}`;

const getReadingTime = (b) => {
  if (b?.readingTime) return b.readingTime;
  const w = (b?.content || b?.excerpt || '').split(/\s+/).length;
  return Math.max(1, Math.round(w / 200));
};

const getAlt = (b) => b?.coverImageAlt || b?.title || 'EduFill Blog';

// ─── Debounce ─────────────────────────────────────────────────────────────────

function useDebounced(value, delay = 450) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

// ─── Normalise ────────────────────────────────────────────────────────────────

function normBlog(b = {}) {
  return {
    ...b,
    _id:          b._id || b.id || b.slug,
    title:        b.title       || 'Untitled Post',
    slug:         b.slug        || b._id || '',
    excerpt:      b.excerpt     || '',
    coverImage:   b.coverImage  || '',
    coverImageAlt: b.coverImageAlt || b.title || '',
    ogImage:      b.ogImage     || b.coverImage || '',
    category:     b.category    || 'Exam Updates',
    author:       b.author      || 'EduFill Team',
    authorUrl:    b.authorUrl   || '',
    publishedAt:  b.publishedAt || b.createdAt || null,
    createdAt:    b.createdAt   || b.updatedAt || null,
    updatedAt:    b.updatedAt   || b.createdAt || null,
    readingTime:  b.readingTime || null,
    noIndex:      b.noIndex     || false,
    faqItems:     b.faqItems    || [],
  };
}

function normPage(data) {
  if (Array.isArray(data)) {
    const blogs = data.map(normBlog);
    return { blogs, total: blogs.length, page: 1, limit: blogs.length, totalPages: 1, hasMore: false };
  }
  const blogs     = (data?.blogs || data?.data || data?.results || []).map(normBlog);
  const total     = Number(data?.total ?? data?.count ?? blogs.length);
  const page      = Number(data?.page || 1);
  const lim       = Number(data?.limit || BLOGS_PER_PAGE);
  const totalPages = Number(data?.totalPages || Math.max(1, Math.ceil(total / lim)));
  const hasMore   = Boolean(data?.hasMore ?? page < totalPages);
  return { blogs, total, page, limit: lim, totalPages, hasMore };
}

// ─── SEO Head ─────────────────────────────────────────────────────────────────

function BlogListingSEO({ blogs, pagination, activeCategory, searchTerm }) {
  const base = `${SITE_URL}/blogs`;

  const params = new URLSearchParams();
  if (activeCategory && activeCategory !== 'All') params.set('category', activeCategory);
  if (searchTerm.trim()) params.set('search', searchTerm.trim());
  if (pagination.page > 1) params.set('page', String(pagination.page));
  const qs        = params.toString();
  const canonical = qs ? `${base}?${qs}` : base;

  const title =
    activeCategory && activeCategory !== 'All'
      ? `${activeCategory} Articles — EduFill Blog`
      : searchTerm.trim()
      ? `"${searchTerm}" Search — EduFill Blog`
      : pagination.page > 1
      ? `EduFill Blog — Page ${pagination.page} | Exam Updates & Prep Tips`
      : 'EduFill Blog | Latest Exam Updates, Results & Preparation Tips 2025';

  const description =
    activeCategory && activeCategory !== 'All'
      ? `Read the latest ${activeCategory} articles on EduFill. Expert guides, exam alerts, and preparation tips for Indian students.`
      : 'Stay ahead with EduFill Blog — latest exam notifications, admit cards, results, job alerts, college reviews, and preparation tips for UPSC, SSC, Banking, and more.';

  // JSON-LD: CollectionPage + WebSite SearchAction
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type':    'CollectionPage',
    name:        title,
    description,
    url:         canonical,
    inLanguage:  'en-IN',
    isPartOf: {
      '@type': 'WebSite',
      url:      SITE_URL,
      name:     SITE_NAME,
      potentialAction: {
        '@type':       'SearchAction',
        target:        `${SITE_URL}/blogs?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    publisher: {
      '@type': 'Organization',
      name:     SITE_NAME,
      url:      SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png`, width: '200', height: '60' },
    },
  };

  // JSON-LD: BreadcrumbList
  const crumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blogs` },
  ];
  if (activeCategory && activeCategory !== 'All') {
    crumbItems.push({
      '@type': 'ListItem', position: 3,
      name: activeCategory,
      item: `${SITE_URL}/blogs?category=${encodeURIComponent(activeCategory)}`,
    });
  }
  const breadcrumbSchema = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbItems };

  // JSON-LD: ItemList — tells Google exactly which posts are on this page
  const itemListSchema = blogs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type':    'ItemList',
    name:        title,
    url:         canonical,
    numberOfItems: blogs.length,
    itemListElement: blogs.slice(0, 20).map((b, i) => ({
      '@type':    'ListItem',
      position:   i + 1,
      url:        getBlogAbsUrl(b),
      name:       b.title,
      image:      b.coverImage || DEFAULT_OG_IMAGE,
      description: b.excerpt || '',
    })),
  } : null;

  // JSON-LD: Organization
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type':    'Organization',
    name:        SITE_NAME,
    url:         SITE_URL,
    logo:        `${SITE_URL}/logo.png`,
    sameAs: [
      'https://www.facebook.com/edufill',
      'https://twitter.com/edufill',
      'https://www.instagram.com/edufill',
    ],
  };

  // Pagination <link> hints
  const prevUrl = pagination.page > 1 ? (() => {
    const p = new URLSearchParams(params);
    pagination.page === 2 ? p.delete('page') : p.set('page', String(pagination.page - 1));
    const s = p.toString(); return s ? `${base}?${s}` : base;
  })() : null;

  const nextUrl = pagination.hasMore ? (() => {
    const p = new URLSearchParams(params);
    p.set('page', String(pagination.page + 1));
    return `${base}?${p.toString()}`;
  })() : null;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {pagination.page > 1 && <meta name="robots" content="noindex, follow" />}
      {prevUrl && <link rel="prev" href={prevUrl} />}
      {nextUrl && <link rel="next" href={nextUrl} />}

      <meta property="og:type"         content="website" />
      <meta property="og:site_name"    content={SITE_NAME} />
      <meta property="og:title"        content={title} />
      <meta property="og:description"  content={description} />
      <meta property="og:url"          content={canonical} />
      <meta property="og:image"        content={DEFAULT_OG_IMAGE} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale"       content="en_IN" />

      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content="@edufill" />
      <meta name="twitter:title"       content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={DEFAULT_OG_IMAGE} />

      <script type="application/ld+json">{JSON.stringify(webPageSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      {itemListSchema && <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>}
      <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
    </Helmet>
  );
}

// ─── Image ────────────────────────────────────────────────────────────────────

const BlogImage = React.memo(function BlogImage({ src, alt, className, priority = false }) {
  return (
    <img
      src={src || FALLBACK_IMAGE}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchpriority={priority ? 'high' : 'auto'}
      width="800"
      height="500"
      className={className}
      onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
    />
  );
});

// ─── Blog card ────────────────────────────────────────────────────────────────

const BlogCard = React.memo(function BlogCard({ blog, isPriority = false }) {
  const pubDate  = blog.publishedAt || blog.createdAt;
  const readTime = getReadingTime(blog);
  return (
    <article
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
      itemScope itemType="https://schema.org/BlogPosting"
    >
      <meta itemProp="url"           content={getBlogAbsUrl(blog)} />
      <meta itemProp="datePublished" content={isoDate(pubDate)} />
      <meta itemProp="dateModified"  content={isoDate(blog.updatedAt)} />

      <Link
        to={getBlogLink(blog)}
        className="relative h-48 sm:h-44 overflow-hidden bg-gray-100 block"
        tabIndex="-1" aria-hidden="true"
      >
        <BlogImage
          src={blog.coverImage}
          alt={getAlt(blog)}
          priority={isPriority}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-md text-[9px] font-black text-emerald-700 uppercase tracking-widest shadow-sm border border-white">
          {blog.category}
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        <h2
          className="text-base font-black text-gray-900 mb-2 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2"
          itemProp="headline"
        >
          <Link to={getBlogLink(blog)}>{blog.title}</Link>
        </h2>

        <p
          className="text-xs text-gray-500 font-medium mb-4 line-clamp-2 leading-relaxed flex-1"
          itemProp="description"
        >
          {blog.excerpt || 'Read the latest EduFill update and stay informed.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-gray-400 mt-auto pt-4 border-t border-gray-50">
          <span className="flex items-center gap-1">
            <User size={11} aria-hidden="true" />
            <span itemProp="author">{getAuthorFirstName(blog.author)}</span>
          </span>
          <time dateTime={isoDate(pubDate)} className="flex items-center gap-1" itemProp="datePublished">
            <Calendar size={11} aria-hidden="true" />
            {formatDate(pubDate)}
          </time>
          <span className="flex items-center gap-1">
            <Clock size={11} aria-hidden="true" />
            {readTime} min read
          </span>
        </div>
      </div>
    </article>
  );
});

// ─── Banner illustration ──────────────────────────────────────────────────────

const BlogBannerIllustration = React.memo(function BlogBannerIllustration() {
  return (
    <div className="relative w-full max-w-[420px] aspect-[4/3] mx-auto" aria-hidden="true">
      <div className="absolute inset-0 rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-blue-50 via-white to-emerald-50 shadow-[0_30px_80px_rgba(15,118,110,0.18)] border border-white/80 overflow-hidden">
        <div className="absolute -top-12 -right-10 w-40 h-40 bg-blue-200/50 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-10 w-48 h-48 bg-emerald-200/55 rounded-full blur-2xl" />
        <div className="absolute top-8 right-12 grid grid-cols-6 gap-2 opacity-50">
          {Array.from({ length: 30 }).map((_, i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400" />)}
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

// ─── Newsletter form ──────────────────────────────────────────────────────────

const NewsletterForm = ({ variant = 'sidebar', email, setEmail, status, loading, onSubmit }) => {
  const isBanner = variant === 'banner';
  return (
    <form onSubmit={onSubmit} className={isBanner ? 'w-full' : 'flex flex-col gap-2'} aria-label="Newsletter subscription">
      <input type="text" name="company" tabIndex="-1" autoComplete="off" className="hidden" aria-hidden="true" />
      <div className={isBanner ? 'flex flex-col sm:flex-row gap-3 max-w-xl' : 'flex flex-col gap-2'}>
        <div className="relative flex-1">
          {isBanner && <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700" aria-hidden="true" />}
          <input
            type="email"
            value={email}
            maxLength={120}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            aria-label="Email address for newsletter"
            autoComplete="email"
            className={isBanner
              ? 'w-full pl-11 pr-4 py-3.5 rounded-full text-gray-800 font-bold text-sm outline-none ring-1 ring-white/50 focus:ring-4 focus:ring-white/30'
              : 'w-full px-4 py-3 rounded-xl border border-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white'}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={isBanner
            ? 'bg-white text-emerald-700 hover:bg-emerald-50 disabled:opacity-75 font-black py-3.5 px-7 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg text-sm active:scale-95'
            : 'w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white font-bold py-3 rounded-xl transition-colors shadow-md text-sm flex items-center justify-center gap-2'}
        >
          {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {loading ? 'Subscribing…' : 'Subscribe'}
          {!loading && isBanner && <ArrowRight size={16} aria-hidden="true" />}
        </button>
      </div>
      {status.message && (
        <p role="status" aria-live="polite"
          className={`mt-3 flex items-start gap-2 text-xs font-black ${
            isBanner
              ? status.type === 'success' ? 'text-white' : 'text-amber-100'
              : status.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}
        >
          {status.type === 'success'
            ? <CheckCircle2 size={15} className="shrink-0" aria-hidden="true" />
            : <AlertCircle  size={15} className="shrink-0" aria-hidden="true" />}
          {status.message}
        </p>
      )}
    </form>
  );
};

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ activeCategory }) {
  return (
    <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-1">
      <ol className="flex items-center flex-wrap gap-1 text-xs font-bold text-gray-400"
        itemScope itemType="https://schema.org/BreadcrumbList">
        <li itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
          <Link to="/" className="hover:text-emerald-600 transition-colors" itemProp="item">
            <span itemProp="name">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>
        <li aria-hidden="true"><ChevronRight size={12} /></li>
        <li itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
          {activeCategory && activeCategory !== 'All'
            ? <Link to="/blogs" className="hover:text-emerald-600 transition-colors" itemProp="item"><span itemProp="name">Blog</span></Link>
            : <span className="text-gray-600" itemProp="name" aria-current="page">Blog</span>}
          <meta itemProp="position" content="2" />
        </li>
        {activeCategory && activeCategory !== 'All' && (
          <>
            <li aria-hidden="true"><ChevronRight size={12} /></li>
            <li itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
              <span className="text-gray-600" itemProp="name" aria-current="page">{activeCategory}</span>
              <meta itemProp="position" content="3" />
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Blogs() {
  const [blogs,           setBlogs]           = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [trendingPosts,   setTrendingPosts]   = useState([]);
  const [editorsPicks,    setEditorsPicks]    = useState([]);
  const [categoryCounts,  setCategoryCounts]  = useState(() => CATEGORIES.map((c) => ({ ...c, count: 0 })));

  const [loading,      setLoading]      = useState(true);
  const [pageLoading,  setPageLoading]  = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchTerm,     setSearchTerm]     = useState('');
  const debouncedSearch = useDebounced(searchTerm, 450);
  const [activeCategory, setActiveCategory] = useState('All');

  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1, hasMore: false });

  const [newsletterEmail,   setNewsletterEmail]   = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterStatus,  setNewsletterStatus]  = useState({ type: '', message: '' });

  const latestRef = useRef(null);

  // fetch helpers
  const fetchMeta = useCallback(async (signal) => {
    try {
      const { data } = await axios.get(apiUrl('/api/blogs/meta'), { signal });
      const map = data?.categoryCounts || {};
      const tot = Number(data?.total || 0);
      setCategoryCounts(CATEGORIES.map((c) => ({ ...c, count: c.name === 'All' ? tot : Number(map[c.name] || 0) })));
    } catch (e) {
      if (e.name !== 'CanceledError' && e.code !== 'ERR_CANCELED') console.warn('Meta load skipped', e.message);
    }
  }, []);

  const fetchSide = useCallback(async (signal) => {
    try {
      const p = { page: 1, limit: 5, status: 'Published' };
      const [tRes, eRes] = await Promise.all([
        axios.get(apiUrl('/api/blogs'), { signal, params: p }),
        axios.get(apiUrl('/api/blogs'), { signal, params: { ...p, limit: 4 } }),
      ]);
      setTrendingPosts(normPage(tRes.data).blogs.slice(0, 5));
      setEditorsPicks( normPage(eRes.data).blogs.slice(0, 4));
    } catch (e) {
      if (e.name !== 'CanceledError' && e.code !== 'ERR_CANCELED') console.warn('Side load skipped', e.message);
    }
  }, []);

  const fetchPage = useCallback(async ({ page = 1, append = false, signal } = {}) => {
    append ? setPageLoading(true) : setLoading(true);
    setErrorMessage('');
    try {
      const { data } = await axios.get(apiUrl('/api/blogs'), {
        signal,
        params: {
          page,
          limit:    BLOGS_PER_PAGE,
          search:   debouncedSearch.trim() || undefined,
          category: activeCategory === 'All' ? undefined : activeCategory,
          status:   'Published',
        },
      });
      const result = normPage(data);
      setBlogs((prev) => {
        const next   = append ? [...prev, ...result.blogs] : result.blogs;
        const unique = new Map(next.map((b) => [getBlogId(b), b]));
        return Array.from(unique.values());
      });
      setPagination({ page: result.page, total: result.total, totalPages: result.totalPages, hasMore: result.hasMore });
      if (!append) setFeaturedArticle(result.blogs[0] || null);
    } catch (e) {
      if (e.name !== 'CanceledError' && e.code !== 'ERR_CANCELED') {
        console.error('Blog fetch failed:', e);
        setErrorMessage('Could not load articles. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  }, [activeCategory, debouncedSearch]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const ctrl = new AbortController();
    fetchMeta(ctrl.signal);
    fetchSide(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchMeta, fetchSide]);

  useEffect(() => {
    const ctrl = new AbortController();
    setBlogs([]); setFeaturedArticle(null);
    setPagination({ page: 1, total: 0, totalPages: 1, hasMore: false });
    fetchPage({ page: 1, append: false, signal: ctrl.signal });
    return () => ctrl.abort();
  }, [fetchPage]);

  const loadMore = () => {
    if (pageLoading || !pagination.hasMore) return;
    fetchPage({ page: pagination.page + 1, append: true });
  };

  const viewAll = () => {
    setSearchTerm(''); setActiveCategory('All');
    setTimeout(() => latestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (new FormData(e.currentTarget).get('company')) return;
    const email = newsletterEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setNewsletterStatus({ type: 'error', message: 'Please enter a valid email address.' }); return;
    }
    const last = Number(localStorage.getItem('edufill_nl_last') || 0);
    if (Date.now() - last < SUBSCRIBE_COOLDOWN_MS) {
      setNewsletterStatus({ type: 'error', message: 'Please wait before trying again.' }); return;
    }
    setNewsletterLoading(true);
    setNewsletterStatus({ type: '', message: '' });
    try {
      const snap = await getDocs(query(collection(db, NEWSLETTER_COLLECTION), where('email', '==', email), limit(1)));
      if (!snap.empty) {
        setNewsletterStatus({ type: 'success', message: 'You are already subscribed!' });
        setNewsletterEmail('');
        localStorage.setItem('edufill_nl_last', String(Date.now()));
        return;
      }
      await addDoc(collection(db, NEWSLETTER_COLLECTION), {
        email, source: 'Blogs Page', status: 'active',
        subscribedAt: serverTimestamp(), userAgent: navigator.userAgent || 'unknown',
      });
      localStorage.setItem('edufill_nl_last', String(Date.now()));
      setNewsletterEmail('');
      setNewsletterStatus({ type: 'success', message: 'Subscribed! Exam alerts coming soon.' });
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Newsletter error:', err);
      setNewsletterStatus({ type: 'error', message: 'Subscription failed. Please try again.' });
    } finally {
      setNewsletterLoading(false);
    }
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4 px-4 text-center"
        role="status" aria-label="Loading blog posts">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-100 border-t-emerald-600" />
        <p className="text-sm font-bold text-gray-500">Loading EduFill blogs…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-emerald-200 pb-20 lg:pb-0 overflow-x-hidden">

      <BlogListingSEO blogs={blogs} pagination={pagination} activeCategory={activeCategory} searchTerm={debouncedSearch} />

      <Header currentUser={null} onOpenFeedback={() => {}} />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#F0F7FF] via-white to-emerald-50 pt-7 sm:pt-10 md:pt-12 pb-10 sm:pb-14 md:pb-16 relative overflow-hidden border-b border-blue-50">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 left-[8%] w-24 h-24 bg-emerald-200/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-[12%] w-40 h-40 bg-blue-300/30 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(16,185,129,0.12)_1px,transparent_0)] [background-size:26px_26px] opacity-35" />
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <span className="inline-flex items-center gap-2 bg-white/80 border border-emerald-100 rounded-full px-4 py-2 text-[11px] font-black text-emerald-700 shadow-sm mb-5">
              <Sparkles size={14} aria-hidden="true" /> Latest Exams, Jobs &amp; Guides
            </span>
            {/* ONE H1 per page — do not add another H1 anywhere */}
            <h1 className="text-3xl min-[390px]:text-4xl md:text-5xl lg:text-6xl font-black text-gray-950 mb-4 tracking-tight leading-tight">
              EduFill <span className="text-emerald-600">Blog</span>
            </h1>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg font-medium mb-7 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Stay updated with the latest exam notifications, job alerts, results, admit cards,
              preparation tips, and college guides — all in one place.
            </p>
            <div className="relative w-full max-w-xl mx-auto lg:mx-0" role="search">
              <label htmlFor="blog-search" className="sr-only">Search blog articles</label>
              <input
                id="blog-search"
                type="search"
                placeholder="Search articles, exams, topics…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                className="w-full pl-5 pr-12 py-3.5 sm:py-4 rounded-2xl sm:rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-700 font-bold text-sm bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400" aria-hidden="true">
                <Search size={21} />
              </span>
            </div>
          </div>
          <div className="w-full lg:flex-1 lg:flex lg:justify-end">
            <BlogBannerIllustration />
          </div>
        </div>
      </section>

      <Breadcrumb activeCategory={activeCategory} />

      {/* ── Category nav ── */}
      <nav aria-label="Filter articles by category"
        className="bg-white/95 backdrop-blur-lg border-b border-gray-100 sticky top-0 sm:top-[61px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex overflow-x-auto py-3 sm:py-4 gap-2 md:gap-3 items-center"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {categoryCounts.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(cat.name)}
                aria-pressed={activeCategory === cat.name}
                aria-label={`${cat.name}${cat.count ? ` — ${cat.count} posts` : ''}`}
                className={`whitespace-nowrap px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-black transition-all border flex items-center gap-2 ${
                  activeCategory === cat.name
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'}`}
              >
                {cat.icon && <span aria-hidden="true">{cat.icon}</span>}
                {cat.name}
                {cat.name !== 'All' && cat.count > 0 && <span className="opacity-70">({cat.count})</span>}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main id="main-content"
        className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-7 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10">

        {/* Articles column */}
        <div className="lg:col-span-8 flex flex-col gap-9 sm:gap-12 min-w-0">

          {errorMessage && (
            <div role="alert" className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 font-bold text-sm">
              {errorMessage}
            </div>
          )}

          {/* Featured */}
          {featuredArticle ? (
            <section aria-label="Featured article">
              <h2 className="sr-only">Featured Article</h2>
              <article
                className="bg-white rounded-[1.7rem] sm:rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:shadow-xl transition-shadow"
                itemScope itemType="https://schema.org/BlogPosting"
              >
                <meta itemProp="url"           content={getBlogAbsUrl(featuredArticle)} />
                <meta itemProp="datePublished" content={isoDate(featuredArticle.publishedAt || featuredArticle.createdAt)} />
                <meta itemProp="dateModified"  content={isoDate(featuredArticle.updatedAt)} />

                <Link to={getBlogLink(featuredArticle)}
                  className="w-full md:w-[45%] h-56 sm:h-64 md:h-auto bg-gray-100 relative overflow-hidden shrink-0 block"
                  tabIndex="-1" aria-hidden="true">
                  <span className="absolute top-4 left-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md z-10 shadow-md">
                    Featured
                  </span>
                  <BlogImage src={featuredArticle.coverImage} alt={getAlt(featuredArticle)} priority={true}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </Link>

                <div className="p-5 sm:p-6 md:p-8 flex flex-col justify-center flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md w-max mb-3 border border-emerald-100">
                    {featuredArticle.category}
                  </span>
                  {/* H2 — section heading for featured article title */}
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-3 sm:mb-4 group-hover:text-emerald-600 transition-colors"
                    itemProp="headline">
                    <Link to={getBlogLink(featuredArticle)}>{featuredArticle.title}</Link>
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mb-5 sm:mb-6 line-clamp-3 leading-relaxed" itemProp="description">
                    {featuredArticle.excerpt || 'A step-by-step guide to help you plan your preparation, manage time, and choose the right resources.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold text-gray-500 mb-5 sm:mb-6">
                    <span className="flex items-center gap-1.5">
                      <User size={14} className="text-emerald-500" aria-hidden="true" />
                      <span itemProp="author">{featuredArticle.author}</span>
                    </span>
                    <time dateTime={isoDate(featuredArticle.publishedAt || featuredArticle.createdAt)} className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-emerald-500" aria-hidden="true" />
                      {formatDate(featuredArticle.publishedAt || featuredArticle.createdAt)}
                    </time>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-emerald-500" aria-hidden="true" />
                      {getReadingTime(featuredArticle)} min read
                    </span>
                  </div>
                  <Link to={getBlogLink(featuredArticle)}
                    className="w-full sm:w-max bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-sm shadow-md"
                    aria-label={`Read full article: ${featuredArticle.title}`}>
                    Read Article <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </section>
          ) : !loading && (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 text-center" role="status">
              <h2 className="text-2xl font-black text-gray-900 mb-2">No articles found</h2>
              <p className="text-gray-500 font-medium">Try a different search or category.</p>
            </div>
          )}

          {/* Latest */}
          <section ref={latestRef} aria-label="Latest articles">
            <div className="flex items-center justify-between gap-4 mb-5 sm:mb-6 border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">Latest Articles</h2>
                <p className="text-xs font-bold text-gray-400 mt-1" aria-live="polite">
                  {pagination.total > 0 ? `Showing ${blogs.length} of ${pagination.total} articles` : 'No articles found'}
                </p>
              </div>
              <button type="button" onClick={viewAll}
                className="text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm font-bold flex items-center gap-1 shrink-0">
                View all <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>

            {blogs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {blogs.map((blog, i) => <BlogCard key={getBlogId(blog)} blog={blog} isPriority={i < 3} />)}
              </div>
            ) : !loading && (
              <p className="py-10 text-center text-gray-400 font-bold" role="status">No articles found for this filter.</p>
            )}

            {pagination.hasMore && (
              <div className="flex justify-center mt-8">
                <button type="button" onClick={loadMore} disabled={pageLoading}
                  aria-label="Load more blog posts"
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-black px-7 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95">
                  {pageLoading
                    ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Loading…</>
                    : <><ArrowRight size={18} aria-hidden="true" /> Load More Blogs</>}
                </button>
              </div>
            )}
          </section>

          {/* Editor's picks */}
          {editorsPicks.length > 0 && (
            <section aria-label="Editor's picks">
              <div className="flex items-center justify-between gap-4 mb-5 sm:mb-6 border-b border-gray-100 pb-3">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">Editor's Picks</h2>
                <button type="button" onClick={viewAll}
                  className="text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm font-bold flex items-center gap-1 shrink-0">
                  View all <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {editorsPicks.map((pick) => (
                  <article key={getBlogId(pick)}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col"
                    itemScope itemType="https://schema.org/BlogPosting">
                    <meta itemProp="url"           content={getBlogAbsUrl(pick)} />
                    <meta itemProp="datePublished" content={isoDate(pick.publishedAt || pick.createdAt)} />
                    <Link to={getBlogLink(pick)}
                      className="h-28 sm:h-32 bg-gray-50 overflow-hidden relative p-2 sm:p-3 flex items-center justify-center"
                      tabIndex="-1" aria-hidden="true">
                      <BlogImage src={pick.coverImage} alt={getAlt(pick)}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500" />
                    </Link>
                    <div className="p-3 sm:p-4 flex-1 flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1">{pick.category}</span>
                      <h3 className="text-xs font-black text-gray-900 mb-2 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2"
                        itemProp="headline">
                        <Link to={getBlogLink(pick)}>{pick.title}</Link>
                      </h3>
                      <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 mt-auto gap-2">
                        <span className="flex items-center gap-1 truncate"><User size={10} aria-hidden="true" /> {getAuthorFirstName(pick.author)}</span>
                        <time dateTime={isoDate(pick.publishedAt || pick.createdAt)} className="shrink-0">
                          {formatDate(pick.publishedAt || pick.createdAt, { month: 'short', day: 'numeric' })}
                        </time>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="lg:col-span-4 flex flex-col gap-6 sm:gap-8 w-full min-w-0" aria-label="Blog sidebar">

          {/* Trending */}
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-5 sm:mb-6 flex items-center gap-2 border-b border-gray-100 pb-3">
              <TrendingUp size={18} className="text-emerald-600" aria-hidden="true" /> Trending Posts
            </h3>
            <ol className="space-y-5">
              {trendingPosts.length > 0 ? trendingPosts.map((post, i) => (
                <li key={getBlogId(post)} className="flex gap-3 sm:gap-4 items-center group">
                  <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-100" aria-hidden="true">{i + 1}</span>
                  <Link to={getBlogLink(post)} className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100" tabIndex="-1" aria-hidden="true">
                    <BlogImage src={post.coverImage} alt={getAlt(post)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-gray-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2 mb-1">
                      <Link to={getBlogLink(post)}>{post.title}</Link>
                    </h4>
                    <time dateTime={isoDate(post.publishedAt || post.createdAt)}
                      className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                      <Calendar size={10} aria-hidden="true" />
                      {formatDate(post.publishedAt || post.createdAt)}
                    </time>
                  </div>
                </li>
              )) : <li><p className="text-xs font-bold text-gray-400">No trending posts yet.</p></li>}
            </ol>
          </div>

          {/* Categories — real anchor links for Googlebot */}
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <BookOpen size={18} className="text-emerald-600" aria-hidden="true" /> Popular Categories
            </h3>
            <ul className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-1 gap-1">
              {categoryCounts.slice(1).map((cat) => (
                <li key={cat.name}>
                  <Link
                    to={`/blogs?category=${encodeURIComponent(cat.name)}`}
                    onClick={(e) => { e.preventDefault(); setActiveCategory(cat.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group text-left w-full"
                    aria-label={`Browse ${cat.name} — ${cat.count} articles`}
                  >
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-700 group-hover:text-emerald-600">
                      <span className="text-gray-400 group-hover:text-emerald-500" aria-hidden="true">{cat.icon}</span>
                      {cat.name}
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{cat.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-5 sm:p-6 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-2 flex items-center gap-2">
              <Mail size={18} className="text-emerald-600" aria-hidden="true" /> Newsletter
            </h3>
            <p className="text-xs text-gray-600 font-medium mb-4 leading-relaxed">
              Subscribe for exam alerts, job notifications, and preparation tips — free.
            </p>
            <NewsletterForm email={newsletterEmail} setEmail={setNewsletterEmail}
              status={newsletterStatus} loading={newsletterLoading} onSubmit={handleNewsletter} />
            <p className="text-[9px] text-gray-400 font-bold mt-3 text-center">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>

          {/* Recent updates */}
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-4 border-b border-gray-100 pb-3">Recent Updates</h3>
            <ul className="space-y-4 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {RECENT_UPDATES.map((u) => (
                <li key={u.id} className="relative flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 relative z-10 outline outline-4 outline-white shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-bold text-gray-800 leading-snug mb-1">{u.text}</p>
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                      <Calendar size={10} aria-hidden="true" /> {u.date}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" onClick={viewAll}
              className="mt-5 text-emerald-600 text-xs font-bold flex items-center gap-1 hover:underline">
              View All Updates <ArrowRight size={12} aria-hidden="true" />
            </button>
          </div>
        </aside>
      </main>

      {/* ── Newsletter banner ── */}
      <section className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-12 sm:pb-16" aria-label="Newsletter subscription">
        <div className="relative overflow-hidden rounded-[1.7rem] sm:rounded-[2rem] bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 shadow-2xl border border-emerald-400/30">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute -top-24 -right-20 w-80 h-80 bg-white/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-28 left-1/3 w-96 h-96 bg-teal-300/20 blur-3xl rounded-full" />
          </div>
          <div className="relative z-10 p-6 sm:p-7 md:p-10 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10">
              <div className="flex-1 text-white w-full text-center lg:text-left">
                <span className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-2 text-xs font-black mb-5 backdrop-blur-sm">
                  <Sparkles size={14} aria-hidden="true" /> Free Exam Alerts
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight">
                  Stay Ahead with EduFill
                </h2>
                <p className="text-emerald-50/90 font-medium text-sm md:text-base max-w-xl mx-auto lg:mx-0 mb-7 leading-relaxed">
                  Get the latest exam updates, job alerts, results, admit cards &amp; preparation tips
                  delivered straight to your inbox — completely free.
                </p>
                <NewsletterForm variant="banner" email={newsletterEmail} setEmail={setNewsletterEmail}
                  status={newsletterStatus} loading={newsletterLoading} onSubmit={handleNewsletter} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        html, body { overflow-x: hidden; }
        [style*="scrollbar-width: none"]::-webkit-scrollbar { display: none; }
      `}</style>

      <Footer />
    </div>
  );
}

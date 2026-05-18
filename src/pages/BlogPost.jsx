 import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  User,
  ArrowLeft,
  Tag,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import SEO from '../components/SEO';
import Footer from '../components/Footer';

const LOCAL_API_BASE_URL = 'http://localhost:5000';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? LOCAL_API_BASE_URL
    : '')
).replace(/\/$/, '');

const fallbackImage = 'https://placehold.co/1200x700/EFF6FF/0F766E?text=EduFill+Blog';

const apiUrl = (path) => `${API_BASE_URL}${path}`;

function normalizeBlog(blog = {}) {
  return {
    ...blog,
    _id: blog._id || blog.id || blog.slug,
    title: blog.title || 'EduFill Blog',
    slug: blog.slug || blog._id || '',
    excerpt: blog.excerpt || 'Read the latest EduFill update and helpful student guide.',
    content: blog.content || '',
    coverImage: blog.coverImage || '',
    category: blog.category || 'EduFill Guide',
    author: blog.author || 'EduFill Team',
    seoKeywords: blog.seoKeywords || '',
    createdAt: blog.createdAt || blog.updatedAt || null,
  };
}

function normalizeBlogListResponse(data) {
  const rawBlogs = Array.isArray(data) ? data : data?.blogs || data?.data || data?.results || [];
  return rawBlogs.map(normalizeBlog);
}

function formatDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Latest';
  }

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function sanitizeBlogHtml(html = '') {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const documentHtml = parser.parseFromString(String(html), 'text/html');

  documentHtml
    .querySelectorAll('script, style, object, embed')
    .forEach((element) => element.remove());

  documentHtml.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = String(attribute.value || '');

      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name);
      }

      if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(value)) {
        element.removeAttribute(attribute.name);
      }

      if (name === 'style' && /expression\s*\(|url\s*\(\s*javascript:/i.test(value)) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return documentHtml.body.innerHTML;
}

function BlogImage({ src, alt, className }) {
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
}

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const safeContent = useMemo(() => sanitizeBlogHtml(blog?.content || ''), [blog?.content]);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!slug) {
      setBlog(null);
      setLoading(false);
      setErrorMessage('Invalid blog URL.');
      return undefined;
    }

    const controller = new AbortController();

    const fetchBlogData = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const [blogRes, allBlogsRes] = await Promise.all([
          axios.get(apiUrl(`/api/blogs/${encodeURIComponent(slug)}`), {
            signal: controller.signal,
          }),
          axios.get(apiUrl('/api/blogs'), {
            signal: controller.signal,
            params: {
              page: 1,
              limit: 4,
              status: 'Published',
              sort: 'latest',
            },
          }),
        ]);

        const currentBlog = normalizeBlog(blogRes.data?.blog || blogRes.data?.data || blogRes.data);
        const allBlogs = normalizeBlogListResponse(allBlogsRes.data);

        setBlog(currentBlog);
        setRecentBlogs(
          allBlogs
            .filter((item) => item.slug && item.slug !== currentBlog.slug)
            .slice(0, 3)
        );
      } catch (error) {
        if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          if (import.meta.env.DEV) {
            console.warn('Blog fetch error:', error);
          }

          setBlog(null);
          setErrorMessage('Article load nahi ho paaya. Please API/server check karein.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchBlogData();

    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-sm font-bold text-gray-500">Loading EduFill article...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-5">
          <AlertCircle size={34} />
        </div>

        <h1 className="text-3xl font-black text-gray-800 mb-3">Article Not Found</h1>

        <p className="text-sm font-semibold text-gray-500 mb-6 max-w-md">
          {errorMessage || 'The article you are looking for does not exist or has been moved.'}
        </p>

        <Link to="/blogs" className="text-emerald-600 font-bold hover:underline">
          ← Back to Blogs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-emerald-200 overflow-x-hidden">
      <SEO
        title={`${blog.title} | EduFill Insights`}
        description={blog.excerpt}
        keywords={blog.seoKeywords}
        url={`/blog/${blog.slug}`}
      />

      <div className="bg-white border-b border-gray-200 pt-8 pb-12 md:pt-12 md:pb-16 w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-emerald-600 font-bold mb-6 transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back to All Articles
          </Link>

          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 font-bold text-[10px] md:text-xs uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 md:mb-6 border border-emerald-100">
              {blog.category}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-[1.2] mb-6 tracking-tight break-words">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm font-bold text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={16} className="text-emerald-500" /> {formatDate(blog.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <User size={16} className="text-emerald-500" /> {blog.author}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
        <div className="lg:col-span-2 min-w-0 w-full overflow-hidden">
          {blog.coverImage && (
            <div className="w-full h-[250px] md:h-[400px] rounded-3xl overflow-hidden mb-10 shadow-sm border border-gray-100 bg-gray-100">
              <BlogImage src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
            </div>
          )}

          {safeContent ? (
            <article
              className="w-full max-w-full break-words text-base md:text-lg text-gray-600 leading-relaxed font-medium
              [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-black [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-4
              [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-3
              [&_p]:mb-6 [&_p]:break-words
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_ol>li]:mb-3
              [&_ul]:list-none [&_ul]:pl-0 [&_ul]:mb-6 [&_ul>li]:mb-3 [&_ul>li]:pl-6 [&_ul>li]:relative [&_ul>li]:before:content-['•'] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:text-emerald-500 [&_ul>li]:before:font-bold [&_ul>li]:before:text-xl
              [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-5 [&_blockquote]:py-2 [&_blockquote]:my-6 [&_blockquote]:bg-emerald-50 [&_blockquote]:rounded-r-xl
              [&_strong]:text-gray-900 [&_a]:text-emerald-600 [&_a]:font-bold hover:[&_a]:underline [&_a]:break-words
              [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-6 [&_img]:border [&_img]:border-gray-100
              [&_iframe]:max-w-full [&_iframe]:w-full [&_iframe]:rounded-xl [&_iframe]:my-6"
              style={{ overflowWrap: 'anywhere' }}
              dangerouslySetInnerHTML={{ __html: safeContent }}
            />
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center text-gray-500 font-bold">
              Content will be available soon.
            </div>
          )}

          {blog.seoKeywords && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tag size={16} /> Related Topics
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {blog.seoKeywords
                  .split(',')
                  .map((keyword) => keyword.trim())
                  .filter(Boolean)
                  .map((keyword) => (
                    <span
                      key={keyword}
                      className="bg-white border border-gray-200 text-gray-500 text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider hover:border-emerald-200 hover:text-emerald-600 transition-colors cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-1 space-y-8 w-full max-w-full">
          <div className="bg-gray-900 rounded-[2rem] p-8 shadow-xl relative overflow-hidden group w-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-emerald-500/30 transition-colors" />

            <div className="inline-flex items-center gap-1.5 bg-gray-800 text-emerald-400 font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 border border-gray-700">
              <Sparkles size={14} /> Premium Service
            </div>

            <h3 className="text-2xl font-black text-white mb-3 leading-tight">
              Tired of long queues at the Cyber Cafe?
            </h3>
            <p className="text-gray-400 text-sm font-medium mb-6 leading-relaxed">
              Let EduFill experts fill your exam forms carefully while you focus on your studies.
            </p>

            <ul className="space-y-3 mb-8 w-full">
              <li className="flex items-center gap-2 text-sm text-gray-300 font-bold">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Careful Checking
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300 font-bold">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> WhatsApp Tracking
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-300 font-bold">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Secure Documents
              </li>
            </ul>

            <button
              type="button"
              onClick={() => navigate('/book-slot')}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
            >
              Book Your Slot <ArrowRight size={18} />
            </button>
          </div>

          {recentBlogs.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm w-full">
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                <Clock size={18} className="text-emerald-600" /> Latest Reads
              </h3>

              <div className="space-y-6 w-full">
                {recentBlogs.map((recent) => (
                  <Link
                    key={recent._id || recent.slug}
                    to={`/blog/${recent.slug}`}
                    className="group flex gap-4 items-start w-full"
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                      <BlogImage
                        src={recent.coverImage}
                        alt={recent.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 truncate">
                        {recent.category}
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {recent.title}
                      </h4>
                      <div className="text-xs text-gray-400 font-medium mt-1.5">
                        {formatDate(recent.createdAt)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>

      <Footer />
    </div>
  );
}

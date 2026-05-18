import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import axios from 'axios';
import {
  Archive,
  BarChart3,
  CheckCircle2,
  Edit3,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  LockKeyhole,
  LogOut,
  PencilLine,
  PlusCircle,
  RefreshCcw,
  Save,
  Search,
  Send,
  ShieldAlert,
  Tag,
  Trash2,
  Type,
  X,
} from 'lucide-react';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '')
).replace(/\/$/, '');

const blogApi = axios.create({
  baseURL: `${API_BASE_URL}/api/blogs`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  coverImage: '',
  category: 'Exam Updates',
  seoKeywords: '',
  status: 'Published',
};

const CATEGORIES = [
  'Exam Updates',
  'Preparation Tips',
  'College Reviews',
  'Career Guidance',
  'EduFill News',
];

const STATUS_OPTIONS = [
  { value: 'Published', label: 'Published / Live' },
  { value: 'Draft', label: 'Draft' },
];

const ADMIN_SESSION_KEY = 'edufill_blog_admin_token';

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
};

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
    // Ignore storage error
  }
}

function clearAdminToken() {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // Ignore storage error
  }
}

function getAdminConfig(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

function normalizeKeywords(value) {
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
}

function getBlogId(blog) {
  return blog?._id || blog?.id || blog?.blogId || '';
}

function normalizeBlog(blog = {}) {
  const id = getBlogId(blog);

  return {
    ...blog,
    _id: id,
    id,
    title: blog.title || '',
    slug: blog.slug || '',
    excerpt: blog.excerpt || '',
    coverImage: blog.coverImage || '',
    category: blog.category || 'Exam Updates',
    seoKeywords: normalizeKeywords(blog.seoKeywords),
    status: blog.status || 'Published',
    content: blog.content || '',
    createdAt: blog.createdAt || blog.timestamp || null,
    updatedAt: blog.updatedAt || null,
  };
}

function formatDate(value) {
  if (!value) return 'N/A';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getErrorMessage(error, fallback = 'Something went wrong.') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function buildPayload(formData, content) {
  return {
    ...formData,
    slug: formData.slug.trim().toLowerCase(),
    title: formData.title.trim(),
    excerpt: formData.excerpt.trim(),
    coverImage: formData.coverImage.trim(),
    seoKeywords: formData.seoKeywords.trim(),
    content,
  };
}

export default function WriteBlog() {
  const [formData, setFormData] = useState(() => {
    const savedDraft = localStorage.getItem('edufill_blog_draft_data');

    if (savedDraft) {
      try {
        return { ...EMPTY_FORM, ...JSON.parse(savedDraft) };
      } catch {
        return EMPTY_FORM;
      }
    }

    return EMPTY_FORM;
  });

  const [content, setContent] = useState(() => localStorage.getItem('edufill_blog_content') || '');

  const [blogs, setBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState('');
  const [editingBlogId, setEditingBlogId] = useState(null);

  const [message, setMessage] = useState({ text: '', type: '' });
  const [activePanel, setActivePanel] = useState('editor');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [adminToken, setAdminToken] = useState(getSavedAdminToken);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');

  const isEditing = Boolean(editingBlogId);

  useEffect(() => {
    if (!isEditing && adminToken) {
      localStorage.setItem('edufill_blog_draft_data', JSON.stringify(formData));
    }
  }, [formData, isEditing, adminToken]);

  useEffect(() => {
    if (!isEditing && adminToken) {
      localStorage.setItem('edufill_blog_content', content);
    }
  }, [content, isEditing, adminToken]);

  useEffect(() => {
    if (adminToken) {
      fetchBlogs(adminToken);
    }
  }, [adminToken]);

  useEffect(() => {
    if (formData.title && !isEditing) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, isEditing]);

  const stats = useMemo(() => {
    const total = blogs.length;
    const live = blogs.filter((blog) => blog.status === 'Published').length;
    const drafts = blogs.filter((blog) => blog.status === 'Draft').length;
    const categories = new Set(blogs.map((blog) => blog.category).filter(Boolean)).size;

    return { total, live, drafts, categories };
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return blogs.filter((blog) => {
      const matchesSearch =
        !query ||
        blog.title.toLowerCase().includes(query) ||
        blog.slug.toLowerCase().includes(query) ||
        blog.excerpt.toLowerCase().includes(query) ||
        blog.category.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'all' || blog.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || blog.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [blogs, searchText, statusFilter, categoryFilter]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    window.clearTimeout(showMessage._timer);
    showMessage._timer = window.setTimeout(() => setMessage({ text: '', type: '' }), 4500);
  };

  const resetEditor = () => {
    setEditingBlogId(null);
    setFormData(EMPTY_FORM);
    setContent('');
    localStorage.removeItem('edufill_blog_draft_data');
    localStorage.removeItem('edufill_blog_content');
  };

  const handleAdminLogout = () => {
    clearAdminToken();
    setAdminToken('');
    setAdminPassword('');
    setAdminLoginError('');
    setBlogs([]);
    resetEditor();
  };

  const fetchBlogs = async (token = adminToken) => {
    if (!token) return;

    setBlogsLoading(true);

    try {
      const response = await blogApi.get('/admin', getAdminConfig(token));

      const rawBlogs = Array.isArray(response.data)
        ? response.data
        : response.data?.blogs || response.data?.data || response.data?.results || [];

      setBlogs(rawBlogs.map(normalizeBlog));
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        clearAdminToken();
        setAdminToken('');
        setBlogs([]);
        setAdminLoginError('Invalid or expired admin password. Please login again.');
        return;
      }

      if (import.meta.env.DEV) {
        console.warn('Fetch blogs error:', error);
      }

      showMessage(
        `❌ Blogs load failed: ${getErrorMessage(error, 'Backend GET /api/blogs/admin check karo.')}`,
        'error'
      );
    } finally {
      setBlogsLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    const token = adminPassword.trim();

    if (!token) {
      setAdminLoginError('Please enter admin password.');
      return;
    }

    setAdminLoginLoading(true);
    setAdminLoginError('');

    try {
      const response = await blogApi.get('/admin', getAdminConfig(token));

      const rawBlogs = Array.isArray(response.data)
        ? response.data
        : response.data?.blogs || response.data?.data || response.data?.results || [];

      saveAdminToken(token);
      setAdminToken(token);
      setAdminPassword('');
      setBlogs(rawBlogs.map(normalizeBlog));
    } catch (error) {
      clearAdminToken();
      setAdminToken('');

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setAdminLoginError('Wrong admin password.');
      } else {
        setAdminLoginError(
          getErrorMessage(error, 'Admin login failed. Backend route/security check karo.')
        );
      }
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const clearDraft = () => {
    if (!window.confirm('Are you sure you want to clear the current draft?')) return;

    localStorage.removeItem('edufill_blog_draft_data');
    localStorage.removeItem('edufill_blog_content');
    setFormData(EMPTY_FORM);
    setContent('');
    setEditingBlogId(null);
    showMessage('Draft cleared!', 'success');
  };

  const validateBlog = () => {
    if (!adminToken) return 'Admin session expired. Please login again.';
    if (!formData.title.trim()) return 'Blog title is required.';
    if (!formData.slug.trim()) return 'Blog slug is required.';
    if (!formData.excerpt.trim()) return 'Short excerpt is required.';
    if (!content.trim() || content === '<p><br></p>') return 'Blog content cannot be empty.';

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateBlog();

    if (validationError) {
      alert(validationError);

      if (!adminToken) handleAdminLogout();

      return;
    }

    setSaving(true);
    setMessage({ text: '', type: '' });

    const payload = buildPayload(formData, content);

    try {
      if (isEditing) {
        await blogApi.put(`/${editingBlogId}`, payload, getAdminConfig(adminToken));
        showMessage('✅ Blog updated successfully!', 'success');
      } else {
        await blogApi.post('/', payload, getAdminConfig(adminToken));
        showMessage(
          payload.status === 'Draft'
            ? '✅ Blog saved as draft!'
            : '🎉 Blog published successfully!',
          'success'
        );
      }

      resetEditor();
      await fetchBlogs(adminToken);
      setActivePanel('manage');
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        handleAdminLogout();
        setAdminLoginError('Admin session expired. Please login again.');
        return;
      }

      if (import.meta.env.DEV) {
        console.warn('Save blog error:', error);
      }

      showMessage(
        isEditing
          ? `❌ Blog update failed: ${getErrorMessage(error, 'PUT /api/blogs/:id check karo.')}`
          : `❌ Publish failed: ${getErrorMessage(error, 'POST /api/blogs check karo.')}`,
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditBlog = (blog) => {
    const normalized = normalizeBlog(blog);
    const blogId = getBlogId(normalized);

    if (!blogId) {
      alert('Blog ID missing. Edit nahi ho payega. Backend se _id return hona chahiye.');
      return;
    }

    setEditingBlogId(blogId);
    setFormData({
      title: normalized.title,
      slug: normalized.slug,
      excerpt: normalized.excerpt,
      coverImage: normalized.coverImage,
      category: normalized.category,
      seoKeywords: normalized.seoKeywords,
      status: normalized.status,
    });
    setContent(normalized.content || '');
    setActivePanel('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBlog = async (blog) => {
    const normalized = normalizeBlog(blog);
    const blogId = getBlogId(normalized);

    if (!blogId) {
      alert('Blog ID missing. Delete nahi ho payega. Backend se _id return hona chahiye.');
      return;
    }

    const ok = window.confirm(`Delete blog: "${normalized.title}"?`);

    if (!ok) return;

    setDeletingId(blogId);

    const previousBlogs = blogs;
    setBlogs((prev) => prev.filter((item) => getBlogId(item) !== blogId));

    try {
      await blogApi.delete(`/${blogId}`, getAdminConfig(adminToken));
      showMessage('🗑️ Blog deleted successfully!', 'success');

      if (editingBlogId === blogId) resetEditor();

      await fetchBlogs(adminToken);
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        handleAdminLogout();
        setAdminLoginError('Admin session expired. Please login again.');
        return;
      }

      if (import.meta.env.DEV) {
        console.warn('Delete blog error:', error);
      }

      setBlogs(previousBlogs);
      showMessage(
        `❌ Delete failed: ${getErrorMessage(error, 'DELETE /api/blogs/:id check karo.')}`,
        'error'
      );
    } finally {
      setDeletingId('');
    }
  };

  const handleToggleStatus = async (blog) => {
    const normalized = normalizeBlog(blog);
    const blogId = getBlogId(normalized);

    if (!blogId) {
      alert('Blog ID missing. Draft/Publish nahi ho payega. Backend se _id return hona chahiye.');
      return;
    }

    const nextStatus = normalized.status === 'Published' ? 'Draft' : 'Published';
    const previousBlogs = blogs;

    setStatusUpdatingId(blogId);
    setBlogs((prev) =>
      prev.map((item) => {
        if (getBlogId(item) === blogId) return { ...item, status: nextStatus };
        return item;
      })
    );

    try {
      await blogApi.patch(
        `/${blogId}/status`,
        { status: nextStatus },
        getAdminConfig(adminToken)
      );

      showMessage(`✅ Blog moved to ${nextStatus}!`, 'success');
      await fetchBlogs(adminToken);
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        handleAdminLogout();
        setAdminLoginError('Admin session expired. Please login again.');
        return;
      }

      if (import.meta.env.DEV) {
        console.warn('Status update error:', error);
      }

      setBlogs(previousBlogs);
      showMessage(
        `❌ Status update failed: ${getErrorMessage(error, 'PATCH /api/blogs/:id/status check karo.')}`,
        'error'
      );
    } finally {
      setStatusUpdatingId('');
    }
  };

  if (!adminToken) {
    return (
      <>
        <Helmet>
          <title>Admin Login | EduFill</title>
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <Helmet>
        <title>Blog Admin | EduFill</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet" />
      </Helmet>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="rounded-[1.75rem] bg-[#071426] text-white p-5 sm:p-7 shadow-xl border border-white/10 mb-6 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 text-emerald-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
                <FileText size={13} />
                EduFill Blog Admin
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Blog Writer & Management
              </h1>
              <p className="text-sm text-gray-300 font-semibold mt-1">
                New blogs likho, live blogs edit karo, drafts update karo aur old posts delete karo.
              </p>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox icon={<BarChart3 size={18} />} label="Total" value={stats.total} />
                <StatBox icon={<CheckCircle2 size={18} />} label="Live" value={stats.live} />
                <StatBox icon={<Archive size={18} />} label="Draft" value={stats.drafts} />
                <StatBox icon={<Tag size={18} />} label="Categories" value={stats.categories} />
              </div>

              <button
                type="button"
                onClick={handleAdminLogout}
                className="rounded-full bg-white/10 hover:bg-red-500/20 border border-white/10 px-4 py-2.5 text-xs font-black text-white flex items-center justify-center gap-2"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {message.text && (
          <div
            className={`mb-5 rounded-2xl border p-4 text-sm font-black ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-red-50 text-red-700 border-red-100'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="lg:hidden grid grid-cols-2 gap-2 mb-5 rounded-2xl bg-white p-1.5 border border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={() => setActivePanel('editor')}
            className={`py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 ${
              activePanel === 'editor' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <PencilLine size={16} /> Editor
          </button>

          <button
            type="button"
            onClick={() => setActivePanel('manage')}
            className={`py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 ${
              activePanel === 'manage' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText size={16} /> Manage
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_430px] gap-6 items-start">
          <section className={`${activePanel !== 'editor' ? 'hidden lg:block' : ''}`}>
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-[1.75rem] shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-5 sm:px-7 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-950 flex items-center gap-2">
                    {isEditing ? (
                      <Edit3 className="text-emerald-600" />
                    ) : (
                      <PlusCircle className="text-emerald-600" />
                    )}
                    {isEditing ? 'Edit Blog' : 'Write New Blog'}
                  </h2>

                  <p className="text-xs font-bold text-gray-500 mt-1">
                    {isEditing ? `Editing ID: ${editingBlogId}` : 'Auto-saving enabled for new draft'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetEditor}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-full font-black flex items-center gap-2 text-xs"
                    >
                      <X size={15} /> Cancel Edit
                    </button>
                  )}

                  <button
                    onClick={clearDraft}
                    type="button"
                    className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 px-4 py-2.5 rounded-full font-black flex items-center gap-2 text-xs"
                  >
                    <RefreshCcw size={15} /> Clear
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-black flex items-center gap-2 text-xs disabled:opacity-70"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        {formData.status === 'Draft' ? <Save size={16} /> : <Send size={16} />}
                        {isEditing ? 'Update Blog' : formData.status === 'Draft' ? 'Save Draft' : 'Publish Blog'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-7 grid grid-cols-1 xl:grid-cols-3 gap-7">
                <div className="xl:col-span-2 space-y-6">
                  <InputBlock label="Blog Title" icon={<Type size={16} />}>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Top 10 Medical Colleges in India"
                      className="w-full text-lg sm:text-xl font-black px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </InputBlock>

                  <div>
                    <label className="text-sm font-black text-gray-700 mb-2 block">
                      Content Area
                    </label>

                    <div className="blog-editor rounded-2xl overflow-hidden border border-gray-200 bg-white">
                      <ReactQuill
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        modules={modules}
                        className="min-h-[420px]"
                        placeholder="Write your amazing blog here..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-5 h-fit">
                  <InputBlock label="URL Slug" icon={<LinkIcon size={14} />} small>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      required
                      className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                    />
                  </InputBlock>

                  <InputBlock label="Cover Image URL" icon={<ImageIcon size={14} />} small>
                    <input
                      type="text"
                      name="coverImage"
                      value={formData.coverImage}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                    />
                  </InputBlock>

                  {formData.coverImage && (
                    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                      <img
                        src={formData.coverImage}
                        alt="Cover preview"
                        className="w-full h-36 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2 block">
                      Category
                    </label>

                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold bg-white"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <InputBlock label="SEO Keywords" icon={<Tag size={14} />} small>
                    <input
                      type="text"
                      name="seoKeywords"
                      value={formData.seoKeywords}
                      onChange={handleChange}
                      placeholder="neet 2026, medical admission"
                      className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                    />
                  </InputBlock>

                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2 block">
                      Short Excerpt / Meta Description
                    </label>

                    <textarea
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Write a catchy 150-character summary..."
                      className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none font-bold"
                    />

                    <p
                      className={`mt-1 text-[10px] font-bold ${
                        formData.excerpt.length > 160 ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      {formData.excerpt.length} characters
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2 block">
                      Publish Status
                    </label>

                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full text-sm font-black px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-emerald-700"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </form>
          </section>

          <aside className={`${activePanel !== 'manage' ? 'hidden lg:block' : ''}`}>
            <div className="bg-white rounded-[1.75rem] border border-gray-200 shadow-sm overflow-hidden lg:sticky lg:top-6">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-gray-950">Posted Blogs</h2>
                  <p className="text-xs font-bold text-gray-500">
                    {filteredBlogs.length} showing of {blogs.length}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fetchBlogs(adminToken)}
                  className="h-10 w-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-center text-gray-600"
                  title="Refresh blogs"
                >
                  {blogsLoading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <RefreshCcw size={17} />
                  )}
                </button>
              </div>

              <div className="p-4 space-y-3 border-b border-gray-100">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search blogs..."
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-9 pr-3 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-black outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="Published">Live</option>
                    <option value="Draft">Draft</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-black outline-none"
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="max-h-[720px] overflow-y-auto p-4 space-y-3">
                {blogsLoading ? (
                  <div className="py-12 text-center">
                    <Loader2 size={34} className="animate-spin text-emerald-600 mx-auto mb-3" />
                    <p className="text-sm font-black text-gray-700">Loading blogs...</p>
                  </div>
                ) : filteredBlogs.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl bg-gray-50 border border-gray-100">
                    <Filter size={34} className="mx-auto text-gray-300 mb-3" />
                    <p className="font-black text-gray-800">No blogs found</p>
                    <p className="text-xs font-bold text-gray-500 mt-1">Try clearing filters.</p>
                  </div>
                ) : (
                  filteredBlogs.map((blog) => (
                    <BlogManageCard
                      key={getBlogId(blog)}
                      blog={blog}
                      active={editingBlogId === getBlogId(blog)}
                      deleting={deletingId === getBlogId(blog)}
                      statusUpdating={statusUpdatingId === getBlogId(blog)}
                      onEdit={() => handleEditBlog(blog)}
                      onDelete={() => handleDeleteBlog(blog)}
                      onToggleStatus={() => handleToggleStatus(blog)}
                    />
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .blog-editor .ql-toolbar {
          border: 0;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
        }
        .blog-editor .ql-container {
          border: 0;
          min-height: 420px;
          font-size: 16px;
        }
        .blog-editor .ql-editor {
          min-height: 420px;
          padding: 1.25rem;
        }
        @media (max-width: 640px) {
          .blog-editor .ql-container,
          .blog-editor .ql-editor {
            min-height: 320px;
          }
        }
      `}</style>
    </div>
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
          <h1 className="text-2xl font-black text-gray-950">
            EduFill Blog Admin
          </h1>
          <p className="mt-2 text-sm font-semibold text-gray-500">
            Admin password enter karo to blog writer access milega.
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
              onChange={(e) => setPassword(e.target.value)}
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
          Security note: Admin access is verified by backend token. Do not share this password.
        </p>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 min-w-[110px]">
      <div className="flex items-center gap-2 text-emerald-300 mb-1">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function InputBlock({ label, icon, children, small = false }) {
  return (
    <div>
      <label
        className={`flex items-center gap-2 font-black text-gray-700 mb-2 ${
          small ? 'text-xs uppercase tracking-wide text-gray-500' : 'text-sm'
        }`}
      >
        {icon}
        {label}
      </label>

      {children}
    </div>
  );
}

function BlogManageCard({
  blog,
  active,
  deleting,
  statusUpdating,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  const isLive = blog.status === 'Published';

  return (
    <article
      className={`rounded-2xl border p-4 transition-all ${
        active
          ? 'border-emerald-400 bg-emerald-50/60 shadow-sm'
          : 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-sm'
      }`}
    >
      <div className="flex gap-3">
        <div className="h-16 w-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
          {blog.coverImage ? (
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              <FileText size={24} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-black text-gray-950 leading-tight line-clamp-2">
              {blog.title || 'Untitled Blog'}
            </h3>

            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
                isLive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}
            >
              {isLive ? 'Live' : 'Draft'}
            </span>
          </div>

          <p className="text-[10px] font-bold text-gray-400 mb-1">/{blog.slug}</p>
          <p className="text-[11px] font-semibold text-gray-500 line-clamp-2">
            {blog.excerpt || 'No excerpt available.'}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px] font-black text-gray-500">
            <span className="rounded-lg bg-gray-100 px-2 py-1">{blog.category}</span>
            <span>{formatDate(blog.updatedAt || blog.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-emerald-100 bg-emerald-50 py-2.5 text-emerald-700 font-black text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100"
        >
          <Edit3 size={14} /> Edit
        </button>

        <button
          type="button"
          onClick={onToggleStatus}
          disabled={statusUpdating}
          className="rounded-xl border border-blue-100 bg-blue-50 py-2.5 text-blue-700 font-black text-xs flex items-center justify-center gap-1.5 hover:bg-blue-100 disabled:opacity-60"
        >
          {statusUpdating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isLive ? (
            <Archive size={14} />
          ) : (
            <Send size={14} />
          )}
          {isLive ? 'Draft' : 'Publish'}
        </button>

        <a
          href={`/blog/${blog.slug}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-gray-700 font-black text-xs flex items-center justify-center gap-1.5 hover:bg-gray-100"
        >
          <Eye size={14} /> View
        </a>

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded-xl border border-red-100 bg-red-50 py-2.5 text-red-600 font-black text-xs flex items-center justify-center gap-1.5 hover:bg-red-100 disabled:opacity-60"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Delete
        </button>
      </div>
    </article>
  );
}
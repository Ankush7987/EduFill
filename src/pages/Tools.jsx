import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Image as ImageIcon,
  FileText,
  ArrowRight,
  Zap,
  ShieldCheck,
  ImageUp,
  Archive,
  FileSignature,
  FilePlus,
  ChevronRight,
  Building2,
  GraduationCap,
  UploadCloud,
  SlidersHorizontal,
  Download,
  UserCheck,
  Star,
  LayoutGrid,
  Camera,
  CalendarDays,
  FileDown,
  Wand2,
} from 'lucide-react';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import Header from '../components/home/Header';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://edufills.com').replace(/\/$/, '');

const TOOLS_DATA = [
  {
    id: 'photo-date',
    title: 'Name & Date on Photo',
    shortTitle: 'Name & Date on Photo',
    category: 'Photo Tools',
    description: 'Add your name and current date to photo for exam forms.',
    points: ['Add name & date on photo', 'Custom position & font', 'Perfect for exam forms'],
    link: '/tools/photo-date',
    status: 'Live Now',
    icon: Camera,
    accent: 'emerald',
  },
  {
    id: 'resizer',
    title: 'Photo & Sign Resizer',
    shortTitle: 'Photo & Sign Resizer',
    category: 'Photo Tools',
    description: 'Resize photo & signature to official exam dimensions.',
    points: ['Resize photo & signature', 'Set custom dimensions', 'Form-ready output'],
    link: '/tools/resizer',
    status: 'Live Now',
    icon: ImageUp,
    accent: 'blue',
  },
  {
    id: 'pdf-maker',
    title: 'Image to PDF Maker',
    shortTitle: 'Image to PDF Maker',
    category: 'PDF Tools',
    description: 'Convert JPG/PNG images to a single PDF file.',
    points: ['Convert JPG/PNG to PDF', 'Multiple images to single PDF', 'Fast & high quality'],
    link: '/tools/pdf-maker',
    status: 'Live Now',
    icon: FilePlus,
    accent: 'rose',
  },
  {
    id: 'pdf-compressor',
    title: 'PDF Resizer & Compressor',
    shortTitle: 'PDF Resizer & Compressor',
    category: 'PDF Tools',
    description: 'Reduce PDF size without losing quality.',
    points: ['Reduce PDF size', 'Keep quality intact', 'Perfect for uploads'],
    link: '/tools/pdf-compressor',
    status: 'Live Now',
    icon: Archive,
    accent: 'orange',
  },
];

const QUICK_TABS = [
  { label: 'Name & Date on Photo', icon: Camera, link: '/tools/photo-date' },
  { label: 'Photo & Sign Resizer', icon: ImageUp, link: '/tools/resizer' },
  { label: 'Image to PDF Maker', icon: FileText, link: '/tools/pdf-maker' },
  { label: 'PDF Resizer & Compressor', icon: FileDown, link: '/tools/pdf-compressor' },
];

const CATEGORIES = [
  { id: 'All Tools', label: 'All Tools', icon: LayoutGrid },
  { id: 'Photo Tools', label: 'Photo Tools', icon: Camera },
  { id: 'PDF Tools', label: 'PDF Tools', icon: FileText },
  { id: 'Document Tools', label: 'Document Tools', icon: FileText },
];

const ACCENT = {
  emerald: {
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    card: 'from-emerald-50 via-white to-emerald-50/30 border-emerald-100 hover:border-emerald-200 hover:shadow-emerald-100',
    solid: 'bg-emerald-600 hover:bg-emerald-700',
    bullet: 'bg-emerald-500',
    glow: 'bg-emerald-100',
  },
  blue: {
    soft: 'bg-blue-50 text-blue-700 border-blue-100',
    card: 'from-blue-50 via-white to-blue-50/30 border-blue-100 hover:border-blue-200 hover:shadow-blue-100',
    solid: 'bg-blue-600 hover:bg-blue-700',
    bullet: 'bg-blue-500',
    glow: 'bg-blue-100',
  },
  rose: {
    soft: 'bg-rose-50 text-rose-700 border-rose-100',
    card: 'from-rose-50 via-white to-rose-50/30 border-rose-100 hover:border-rose-200 hover:shadow-rose-100',
    solid: 'bg-emerald-600 hover:bg-emerald-700',
    bullet: 'bg-rose-500',
    glow: 'bg-rose-100',
  },
  orange: {
    soft: 'bg-orange-50 text-orange-700 border-orange-100',
    card: 'from-orange-50 via-white to-orange-50/30 border-orange-100 hover:border-orange-200 hover:shadow-orange-100',
    solid: 'bg-emerald-600 hover:bg-emerald-700',
    bullet: 'bg-orange-500',
    glow: 'bg-orange-100',
  },
};

function ToolIllustration({ tool }) {
  if (tool.id === 'photo-date') {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-white">
        <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-emerald-100/70 blur-2xl" />
        <div className="absolute left-5 top-7 w-[150px] rounded-2xl bg-white p-3 shadow-xl border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-100 to-emerald-100 p-1.5">
              <div className="h-full w-full rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black">
                EF
              </div>
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-900">Rohit Kumar</p>
              <p className="text-[11px] font-bold text-gray-600">15 May 2026</p>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 h-12 w-12 rounded-2xl bg-white border border-emerald-100 shadow-lg flex items-center justify-center text-emerald-600">
            <CalendarDays size={22} />
          </div>
        </div>
        <div className="absolute bottom-5 right-6 h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
          <FileSignature size={22} />
        </div>
      </div>
    );
  }

  if (tool.id === 'resizer') {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-white">
        <div className="absolute left-8 top-6 h-36 w-28 rounded-2xl border-2 border-dashed border-blue-400 bg-white shadow-lg p-2">
          <div className="absolute -left-1.5 -top-1.5 h-3 w-3 bg-blue-500 rounded-sm" />
          <div className="absolute -right-1.5 -top-1.5 h-3 w-3 bg-blue-500 rounded-sm" />
          <div className="absolute -left-1.5 -bottom-1.5 h-3 w-3 bg-blue-500 rounded-sm" />
          <div className="absolute -right-1.5 -bottom-1.5 h-3 w-3 bg-blue-500 rounded-sm" />
          <div className="h-full w-full rounded-xl bg-gradient-to-br from-blue-100 to-emerald-50 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-white border-4 border-blue-100 flex items-center justify-center text-blue-700 font-black">EF</div>
          </div>
        </div>
        <div className="absolute right-6 bottom-7 h-20 w-32 rounded-2xl border border-blue-100 bg-white shadow-xl flex items-center justify-center font-serif italic text-2xl text-gray-800">
          Rahul
        </div>
      </div>
    );
  }

  if (tool.id === 'pdf-maker') {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-white">
        <div className="absolute left-8 top-8 space-y-3">
          <div className="h-16 w-20 rounded-xl bg-white border border-purple-100 shadow-md flex items-center justify-center text-blue-500"><ImageIcon size={30} /></div>
          <div className="h-16 w-20 rounded-xl bg-white border border-purple-100 shadow-md flex items-center justify-center text-emerald-500"><ImageIcon size={30} /></div>
        </div>
        <ArrowRight className="absolute left-[46%] top-[45%] text-purple-500" size={26} />
        <div className="absolute right-8 top-10 h-32 w-24 rounded-2xl bg-red-500 text-white shadow-xl border-4 border-white flex flex-col items-center justify-center">
          <div className="absolute right-0 top-0 h-7 w-7 bg-white/30 rounded-bl-2xl" />
          <FileText size={30} />
          <span className="text-xl font-black mt-1">PDF</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-white">
      <div className="absolute left-8 top-9 h-32 w-24 rounded-2xl bg-white border border-orange-100 shadow-lg flex flex-col items-center justify-center text-red-500">
        <FileText size={30} />
        <span className="text-xl font-black">PDF</span>
      </div>
      <div className="absolute right-5 top-11 h-28 w-28 rounded-full bg-white border border-orange-100 shadow-xl flex items-center justify-center">
        <div className="relative h-20 w-20 rounded-full border-[10px] border-gray-100 border-r-orange-500 border-t-emerald-500">
          <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-emerald-700">156 KB</span>
        </div>
      </div>
    </div>
  );
}

export default function Tools() {
  const navigate = useNavigate();
  const toolsSectionRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Tools');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toolsSchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'EduFill Tools',
        url: `${SITE_URL}/tools`,
        description: 'Free exam form tools including photo date maker, photo signature resizer, image to PDF maker, and PDF compressor.',
      },
      {
        '@type': 'ItemList',
        name: 'EduFill Free Tools',
        itemListElement: TOOLS_DATA.map((tool, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'SoftwareApplication',
            name: tool.title,
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Web',
            url: `${SITE_URL}${tool.link}`,
            description: tool.description,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'INR',
            },
          },
        })),
      },
    ],
  }), []);

  const categoryCounts = useMemo(() => {
    return CATEGORIES.reduce((acc, category) => {
      if (category.id === 'All Tools') {
        acc[category.id] = TOOLS_DATA.length;
      } else if (category.id === 'Document Tools') {
        acc[category.id] = TOOLS_DATA.filter((tool) => ['PDF Tools', 'Photo Tools'].includes(tool.category)).length;
      } else {
        acc[category.id] = TOOLS_DATA.filter((tool) => tool.category === category.id).length;
      }
      return acc;
    }, {});
  }, []);

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return TOOLS_DATA.filter((tool) => {
      const matchesSearch =
        !query ||
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query) ||
        tool.points.some((point) => point.toLowerCase().includes(query));

      const matchesCategory =
        activeCategory === 'All Tools' ||
        tool.category === activeCategory ||
        (activeCategory === 'Document Tools' && ['PDF Tools', 'Photo Tools'].includes(tool.category));

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const scrollToTools = () => {
    toolsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleHeroSearch = (event) => {
    event.preventDefault();
    scrollToTools();
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7fafc] flex flex-col font-sans selection:bg-[#00a67e]/30 pb-20 lg:pb-0">
      <SEO
        title="EduFill Tools | Free Photo Resizer, PDF Maker & Document Tools"
        description="Use free EduFill tools for exam forms: add name and date on photo, resize photo and signature, convert image to PDF, and compress PDF files online."
        keywords="EduFill tools, photo resizer, signature resizer, image to PDF, PDF compressor, name and date on photo, exam form tools"
        url="/tools"
        canonical={`${SITE_URL}/tools`}
        schema={toolsSchema}
        schemaMarkup={toolsSchema}
      />

      <Header currentUser={null} onOpenFeedback={() => {}} />

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-white to-[#f7fafc] border-b border-gray-100 overflow-hidden">
        <div className="absolute left-10 top-24 h-60 w-60 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="absolute right-16 top-20 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-14 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-8 lg:gap-10 items-center">
            <div>
              <h1 className="text-[2.35rem] sm:text-5xl lg:text-[4.2rem] font-black text-[#0f172a] leading-[1.05] tracking-tight mb-4">
                Free Tools for <br />
                Exam <span className="text-[#00a67e]">Forms & Documents</span>
              </h1>

              <p className="text-sm sm:text-base text-gray-600 font-semibold leading-relaxed max-w-xl mb-6">
                Smart, fast & secure tools to make your exam form filling journey simple and error-free.
              </p>

              <form
                onSubmit={handleHeroSearch}
                className="relative max-w-xl bg-white border border-gray-200 rounded-2xl shadow-[0_10px_35px_rgba(15,23,42,0.08)] p-2 flex gap-2"
              >
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search tools... e.g., photo, pdf, resize"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-3 py-3 rounded-xl outline-none text-sm font-bold text-gray-700 placeholder:text-gray-400"
                  aria-label="Search EduFill tools"
                />
                <button
                  type="submit"
                  className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 text-white font-black px-7 rounded-xl items-center justify-center text-sm"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[520px]">
                <div className="absolute inset-0 bg-emerald-200/30 blur-3xl rounded-full" />
                <img
                  src="/student-laptop.png"
                  alt="EduFill tools kit"
                  className="relative z-10 w-full max-h-[330px] sm:max-h-[390px] object-contain drop-shadow-[0_28px_55px_rgba(15,23,42,0.16)]"
                  loading="eager"
                  fetchPriority="high"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick horizontal tool bar */}
          <div className="mt-6 bg-white rounded-[1.4rem] border border-gray-200 shadow-[0_12px_35px_rgba(15,23,42,0.07)] overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {QUICK_TABS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.link}
                    className={`flex items-center gap-3 p-4 sm:p-5 hover:bg-gray-50 transition-colors group ${
                      index !== QUICK_TABS.length - 1 ? 'md:border-r border-gray-100' : ''
                    } ${index < 2 ? 'border-b md:border-b-0 border-gray-100' : ''}`}
                  >
                    <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-50">
                      <Icon size={24} />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-gray-900 leading-tight group-hover:text-emerald-600">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Featured Tools */}
        <section ref={toolsSectionRef} className="bg-white rounded-[1.75rem] border border-gray-200 shadow-[0_12px_40px_rgba(15,23,42,0.05)] p-4 sm:p-5 lg:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Featured Tools</h2>
                <span className="rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1">
                  Live Now
                </span>
              </div>
              <p className="text-sm text-gray-500 font-semibold">Most powerful tools used by thousands of students every day.</p>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1 sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black border whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <Icon size={15} aria-hidden="true" /> {cat.label}
                    <span className={`${isActive ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500'} rounded-full px-1.5 py-0.5 text-[10px]`}>
                      {categoryCounts[cat.id] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredTools.length === 0 ? (
            <div className="text-center py-14 bg-gray-50 rounded-2xl border border-gray-100">
              <Search size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-700 font-black">No tools found</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All Tools');
                }}
                className="mt-4 bg-emerald-600 text-white font-black px-5 py-2.5 rounded-xl"
              >
                Show All Tools
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
              {filteredTools.map((tool) => {
                const accent = ACCENT[tool.accent];
                const Icon = tool.icon;
                return (
                  <article
                    key={tool.id}
                    className={`group rounded-[1.5rem] bg-gradient-to-br ${accent.card} border p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className={`${accent.soft} border rounded-full text-[10px] font-black px-3 py-1`}>
                        {tool.category}
                      </span>
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-2.5 py-1 rounded-lg">
                        {tool.status}
                      </span>
                    </div>

                    <div className="h-52 rounded-2xl overflow-hidden border border-white/80 shadow-sm mb-5 bg-white">
                      <ToolIllustration tool={tool} />
                    </div>

                    <h3 className="text-xl font-black text-gray-950 leading-tight mb-3">
                      {tool.title}
                    </h3>

                    <ul className="space-y-2 mb-5 flex-1">
                      {tool.points.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-xs font-semibold text-gray-600">
                          <span className={`h-1.5 w-1.5 rounded-full ${accent.bullet} mt-1.5 shrink-0`} />
                          {point}
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={tool.link}
                      className={`w-full ${accent.solid} text-white font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md active:scale-95`}
                    >
                      Use Tool <ArrowRight size={16} />
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="bg-white rounded-[1.75rem] border border-gray-200 shadow-sm p-5 sm:p-6 mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-center text-gray-950 mb-6">
            How It Works — 3 Simple Steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 md:gap-3 items-center">
            <StepCard icon={<UploadCloud size={26} />} number="1" title="Upload File" text="Select or drag & drop your photo, signature or PDF." tone="emerald" />
            <ArrowRight size={25} className="hidden md:block text-gray-300" />
            <StepCard icon={<SlidersHorizontal size={26} />} number="2" title="Apply Settings" text="Choose size, format or options as per your requirement." tone="blue" />
            <ArrowRight size={25} className="hidden md:block text-gray-300" />
            <StepCard icon={<Download size={26} />} number="3" title="Download Instantly" text="Get your file ready in the perfect format." tone="purple" />
          </div>
        </section>

        {/* Benefits */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: ShieldCheck, title: 'Privacy-first Processing', text: 'Tools are designed to process files safely and quickly.', tone: 'emerald' },
            { icon: GraduationCap, title: 'Student Friendly', text: 'Designed for Indian students & exam requirements.', tone: 'blue' },
            { icon: Zap, title: 'Fast Output', text: 'Lightning fast tools with high accuracy.', tone: 'emerald' },
            { icon: Building2, title: 'Works for Government Forms', text: 'Accepted in all major exam & government forms.', tone: 'emerald' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-950 mb-1">{item.title}</h3>
                  <p className="text-xs font-semibold text-gray-500 leading-relaxed">{item.text}</p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Popular + Coming Soon */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          <div className="bg-white rounded-[1.5rem] border border-gray-200 p-5 shadow-sm">
            <h2 className="text-xl font-black text-gray-950 mb-4">Popular Tasks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Add Name on Photo', link: '/tools/photo-date', icon: UserCheck },
                { label: 'Add Date on Photo', link: '/tools/photo-date', icon: CalendarDays },
                { label: 'Resize Passport Photo', link: '/tools/resizer', icon: ImageIcon },
                { label: 'Resize Signature', link: '/tools/resizer', icon: FileSignature },
                { label: 'Image to PDF', link: '/tools/pdf-maker', icon: FileText },
                { label: 'Compress PDF', link: '/tools/pdf-compressor', icon: Archive },
              ].map((task) => {
                const Icon = task.icon;
                return (
                  <Link
                    key={task.label}
                    to={task.link}
                    className="rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-emerald-200 px-4 py-3 flex items-center justify-between gap-3 transition-all group"
                  >
                    <span className="flex items-center gap-2 text-xs font-black text-gray-700 group-hover:text-emerald-600">
                      <Icon size={15} className="text-emerald-600" />
                      {task.label}
                    </span>
                    <ChevronRight size={15} className="text-gray-400" />
                  </Link>
                );
              })}
            </div>
            <button
              onClick={scrollToTools}
              className="mt-4 mx-auto flex items-center gap-2 text-emerald-600 font-black text-sm"
            >
              View All Tools <ArrowRight size={15} />
            </button>
          </div>

          <div className="bg-white rounded-[1.5rem] border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-black text-gray-950">Coming Soon</h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2 py-1 rounded-full">
                NEW
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: 'Background Remover', text: 'Remove background in one click.', icon: Wand2 },
                { title: 'Image Converter', text: 'Convert images to multiple formats.', icon: ImageIcon },
                { title: 'Merge PDF', text: 'Merge multiple PDF files easily.', icon: FilePlus },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <Icon size={23} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900 mb-1 leading-tight">{item.title}</h3>
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-4 sm:pb-8">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-[#075a46] via-[#008c6a] to-[#00a67e] p-6 sm:p-8 lg:p-10 text-white shadow-2xl">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center">
              <img
                src="/student-laptop.png"
                alt="Student using EduFill"
                className="hidden md:block h-36 w-44 object-contain drop-shadow-xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl font-black mb-2">Need Help with Your Form?</h2>
                <p className="text-emerald-50 text-sm font-semibold leading-relaxed max-w-xl">
                  Our Live Experts are here for you. Get your doubts cleared, avoid mistakes & submit with confidence.
                </p>
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3 text-xs font-black text-emerald-50">
                  <span>Verified Experts</span>
                  <span>•</span>
                  <span>Safe & Secure</span>
                  <span>•</span>
                  <span>100% Confidential</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/live-connect')}
                className="w-full md:w-auto bg-white text-emerald-700 hover:bg-emerald-50 font-black py-3.5 px-7 rounded-full flex items-center justify-center gap-2 shadow-lg"
              >
                Chat with Live Expert <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2 text-gray-700 font-bold text-sm">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span>Trusted by 50,000+ Students Across India</span>
            <span className="hidden sm:inline mx-2">|</span>
            <span className="text-yellow-500 flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={15} fill="currentColor" />)}
            </span>
            <span>4.8/5</span>
          </div>
        </section>
      </main>

      <Footer />

      <style>
        {`
          html, body { overflow-x: hidden; }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}
      </style>
    </div>
  );
}

function StepCard({ icon, number, title, text, tone }) {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }[tone];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-4">
      <div className={`h-16 w-16 rounded-full border ${toneClass} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`h-5 w-5 rounded-full ${toneClass} flex items-center justify-center text-[10px] font-black border`}>
            {number}
          </span>
          <h3 className="text-sm font-black text-gray-900">{title}</h3>
        </div>
        <p className="text-xs text-gray-500 font-semibold leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

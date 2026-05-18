import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Camera,
  ChevronDown,
  FileText,
  HelpCircle,
  Home,
  UserRound,
  Maximize,
  Menu,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';

export default function Header({ currentUser, onOpenFeedback }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState(currentUser || null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthUser(firebaseUser || null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) setAuthUser(currentUser);
  }, [currentUser]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const studentName =
    authUser?.displayName?.split(' ')[0] ||
    authUser?.email?.split('@')[0] ||
    'Student';

  const authButtonText = authUser ? `Hi, ${studentName}` : 'Login/SignUp';

  const isActivePath = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isToolsActive = isActivePath('/tools');
  const isExpertActive = isActivePath('/live-connect');
  const isVaultActive = isActivePath('/vault');

  return (
    <>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[75] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={closeMobileMenu} />
          <aside className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2">
                <img src="/edufill-brand-logo.svg?v=2" alt="EduFill" className="h-9 w-auto" />
                <span className="text-xl font-black text-gray-900">
                  Edu<span className="text-emerald-600">Fill</span>
                </span>
              </Link>
              <button onClick={closeMobileMenu} className="p-2 rounded-full bg-gray-100" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-100 p-4 mb-5">
              <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-1">Secure Student Platform</p>
              <p className="text-sm font-bold text-gray-800 leading-relaxed">
                Fill forms online with privacy-first expert support.
              </p>
            </div>

            <div className="space-y-2.5">
              <MobileNavLink to="/" active={isActivePath('/', true)} onClick={closeMobileMenu} icon={<Home size={18} />} label="Home" />
              <MobileNavLink to="/blogs" active={isActivePath('/blogs')} onClick={closeMobileMenu} icon={<FileText size={18} />} label="Blogs" />
              <MobileNavLink to="/exams" active={isActivePath('/exams') || isActivePath('/exam')} onClick={closeMobileMenu} icon={<Sparkles size={18} />} label="Latest Exams" />
              <MobileNavLink to="/tools" active={isToolsActive} onClick={closeMobileMenu} icon={<Zap size={18} />} label="Tools" />

              <a href="https://wa.me/919752519051" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 font-bold text-gray-700">
                <HelpCircle size={18} className="text-gray-400" /> Support
              </a>

              {/* 🚀 FIXED: Feedback link to redirect to page */}
              <MobileNavLink
                to="/feedback"
                active={isActivePath('/feedback')}
                onClick={closeMobileMenu}
                icon={<MessageSquare size={18} />}
                label="Feedback"
              />
            </div>

            <button
              onClick={() => {
                closeMobileMenu();
                navigate('/vault');
              }}
              className={`mt-6 w-full text-sm font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-colors ${
                isVaultActive
                  ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-500'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {authUser ? <ShieldCheck size={16} /> : <UserRound size={16} />}
              {authButtonText}
            </button>
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 flex justify-between items-center gap-3">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img src="/edufill-brand-logo.svg?v=2" alt="EduFill Logo" className="h-9 sm:h-10 w-auto object-contain" />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
              Edu<span className="text-emerald-600">Fill</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center bg-white rounded-full border border-gray-100 shadow-sm px-3 py-2 gap-1">
            <ActiveNavLink to="/blogs" active={isActivePath('/blogs')} icon={<BookOpen size={16} />} label="Blogs" />

            <ActiveNavLink
              to="/exams"
              active={isActivePath('/exams') || isActivePath('/exam')}
              icon={<Sparkles size={16} />}
              label="Latest Exams"
              badge="New"
            />

            <div className="relative group">
              <Link
                to="/tools"
                className={`relative px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold transition-colors ${
                  isToolsActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-600'
                }`}
              >
                <Zap size={16} className={isToolsActive ? 'text-emerald-600' : 'text-amber-500'} /> Tools
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
                {isToolsActive && <span className="absolute -bottom-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-emerald-500" />}
              </Link>

              <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 origin-top-left scale-95 group-hover:scale-100 z-50 overflow-hidden">
                <div className="p-2 flex flex-col">
                  <ToolLink to="/tools/photo-date" icon={<Camera size={18} />} title="Name & Date Generator" desc="Auto white strip & text" color="blue" />
                  <ToolLink to="/tools/resizer" icon={<Maximize size={18} />} title="Photo & Sign Resizer" desc="Compress to exact KB" color="emerald" />
                  <ToolLink to="/tools/pdf-maker" icon={<FileText size={18} />} title="Image to PDF Maker" desc="Merge & compress" color="rose" />
                </div>
              </div>
            </div>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <a href="https://wa.me/919752519051" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-emerald-600 transition-colors">
              <HelpCircle size={16} className="text-gray-500" /> Support
            </a>
            {/* 🚀 FIXED: Feedback link to redirect to page */}
            <ActiveTextLink to="/feedback" active={isActivePath('/feedback')} icon={<MessageSquare size={16} />} label="Feedback" />
            <button
              onClick={() => navigate('/vault')}
              className={`text-sm font-black py-2.5 px-5 rounded-full shadow-sm transition-colors flex items-center gap-2 border ${
                isVaultActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-500 ring-2 ring-emerald-100'
                  : authUser
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/20'
              }`}
            >
              {authUser ? <ShieldCheck size={15} /> : <UserRound size={15} />}
              {authButtonText}
            </button>
          </div>

          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm" aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Mobile bottom quick actions for student-first UX */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_25px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
          <BottomTab to="/" active={isActivePath('/', true)} icon={<Home size={17} />} label="Home" />
          <BottomTab to="/exams" active={isActivePath('/exams') || isActivePath('/exam')} icon={<Sparkles size={17} />} label="Exams" />
          <button
            onClick={() => navigate('/live-connect')}
            className={`rounded-2xl py-2 flex flex-col items-center justify-center gap-1 text-[10px] font-black shadow-md transition-all ${
              isExpertActive
                ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-500'
                : 'bg-emerald-600 text-white'
            }`}
          >
            <ShieldCheck size={17} />
            Expert
          </button>
          {/* 🚀 FIXED: Feedback link for mobile bottom tab */}
          <BottomTab to="/feedback" active={isActivePath('/feedback')} icon={<MessageSquare size={17} />} label="Feedback" />
        </div>
      </div>
    </>
  );
}

function MobileNavLink({ to, onClick, icon, label, active = false }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative flex items-center gap-3 p-4 rounded-2xl font-bold transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-gray-50 text-gray-700 border border-transparent'
      }`}
    >
      <span className={active ? 'text-emerald-600' : 'text-gray-500'}>{icon}</span>
      <span>{label}</span>
      {active && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />}
    </Link>
  );
}

function BottomTab({ to, icon, label, active = false }) {
  return (
    <Link
      to={to}
      className={`rounded-2xl py-2 flex flex-col items-center justify-center gap-1 text-[10px] font-black border transition-all ${
        active
          ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm'
          : 'bg-gray-50 text-gray-700 border-gray-100'
      }`}
    >
      {icon}
      {label}
      {active && <span className="h-1 w-5 rounded-full bg-emerald-500" />}
    </Link>
  );
}

function ActiveNavLink({ to, active, icon, label, badge }) {
  return (
    <Link
      to={to}
      className={`relative px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-700 shadow-sm'
          : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-600'
      }`}
    >
      <span className={active ? 'text-emerald-600' : 'text-emerald-500'}>{icon}</span>
      {label}
      {badge && (
        <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {active && <span className="absolute -bottom-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-emerald-500" />}
    </Link>
  );
}

function ActiveTextLink({ to, active, icon, label }) {
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-2 text-sm font-bold transition-colors ${
        active ? 'text-emerald-700' : 'text-gray-700 hover:text-emerald-600'
      }`}
    >
      <span className={active ? 'text-emerald-600' : 'text-gray-500'}>{icon}</span>
      {label}
      {active && <span className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-emerald-500" />}
    </Link>
  );
}

function ToolLink({ to, icon, title, desc, color }) {
  const colorClass = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  }[color];

  return (
    <Link to={to} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
      <div className={`${colorClass} p-2.5 rounded-xl shrink-0`}>{icon}</div>
      <div>
        <p className="text-sm font-black text-gray-900">{title}</p>
        <p className="text-xs font-medium text-gray-500 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
}
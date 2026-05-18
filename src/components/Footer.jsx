import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  FileText,
  Headphones,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Twitter,
  Youtube,
  Zap,
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Blogs', to: '/blogs' },
    { label: 'Latest Exams', to: '/exams' },
    { label: 'Tools', to: '/tools' },
    { label: 'Contact Us', to: '/contact' },
  ];

  const exploreLinks = [
    { label: 'Live Form Expert', to: '/live-connect' },
    { label: 'Book Your Slot', to: '/exams' },
    { label: 'College Predictor', to: '/college-predictor' },
    { label: 'Live PYQ Mock Test', to: '/mock-test' },
    { label: 'Camp Request', to: '/campus-drive' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms & Conditions', to: '/terms-and-conditions' },
    { label: 'Refund Policy', to: '/refund-policy' },
    { label: 'Disclaimer', to: '/disclaimer' },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#061224] text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 py-12 md:px-8 md:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link to="/" className="mb-5 inline-flex items-center gap-3">
              {/* White badge makes the logo visible on dark footer */}
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white shadow-lg shadow-emerald-900/20">
                <img
                  src="/edufill-brand-logo.svg?v=2"
                  alt="EduFill Logo"
                  className="h-10 w-10 object-contain"
                  loading="lazy"
                />
              </span>
              <span className="text-3xl font-black tracking-tight text-white">
                Edu<span className="text-emerald-400">Fill</span>
              </span>
            </Link>

            <p className="max-w-sm text-sm font-medium leading-relaxed text-slate-300">
              India’s privacy-first platform for secure online form filling, exam updates,
              college prediction, live PYQ mock tests and campus form-filling support.
            </p>

            <div className="mt-6 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2 text-emerald-300">
                  <ShieldCheck size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Privacy First</span>
                </div>
                <p className="text-xs font-medium leading-relaxed text-slate-400">
                  Student number remains hidden from experts.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2 text-blue-300">
                  <MessageCircle size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Secure Chat</span>
                </div>
                <p className="text-xs font-medium leading-relaxed text-slate-400">
                  OTP and updates happen inside EduFill.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              {[
                { icon: <Instagram size={17} />, href: 'https://www.instagram.com/edufills?igsh=dDl4NHg5NTZmaG83' },
                { icon: <Youtube size={17} />, href: 'https://www.youtube.com/channel/UCJ7CAoqsawF-6fTI4Z9q1uQ' },
                { icon: <Twitter size={17} />, href: 'https://x.com/EduFills' },
                { icon: <Linkedin size={17} />, href: 'https://www.linkedin.com/company/edufills/?viewAsMember=true' },
              ].map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/15 hover:text-emerald-300"
                  aria-label="EduFill social link"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-3">
              <FooterLinkColumn title="Quick Links" icon={<BookOpen size={16} />} links={quickLinks} />
              <FooterLinkColumn title="Explore" icon={<Sparkles size={16} />} links={exploreLinks} />
              <FooterLinkColumn title="Legal" icon={<FileText size={16} />} links={legalLinks} />
            </div>
          </div>

          {/* Support Card */}
          <div className="lg:col-span-3">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/10 backdrop-blur">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                  <Headphones size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Need Support?</h3>
                  <p className="text-xs font-medium text-slate-400">We’re here for students.</p>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href="tel:+919752519051"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B1B31] p-4 transition hover:border-emerald-400/40"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                      <Phone size={17} />
                    </span>
                    <span>
                      <span className="block text-xs font-bold text-slate-400">Call Support</span>
                      <span className="block text-sm font-black text-white">+91 97525 19051</span>
                    </span>
                  </span>
                  <ChevronRight size={16} className="text-slate-500" />
                </a>

                <a
                  href="https://wa.me/919752519051"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 transition hover:bg-emerald-500/15"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                      <MessageCircle size={17} />
                    </span>
                    <span>
                      <span className="block text-xs font-bold text-emerald-200/80">WhatsApp</span>
                      <span className="block text-sm font-black text-white">Chat with EduFill</span>
                    </span>
                  </span>
                  <ChevronRight size={16} className="text-emerald-300" />
                </a>

                <a
                  href="mailto:support@edufills.com"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B1B31] p-4 transition hover:border-blue-400/40"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                      <Mail size={17} />
                    </span>
                    <span>
                      <span className="block text-xs font-bold text-slate-400">Email</span>
                      <span className="block text-sm font-black text-white">support@edufills.com</span>
                    </span>
                  </span>
                  <ChevronRight size={16} className="text-slate-500" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA mini strip */}
        <div className="mt-10 grid grid-cols-1 gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 md:grid-cols-3">
          <MiniFooterFeature icon={<ShieldCheck size={18} />} title="Secure Form Filling" desc="Privacy-first expert support" />
          <MiniFooterFeature icon={<Building2 size={18} />} title="Campus Drive" desc="For schools & institutes" />
          <MiniFooterFeature icon={<BriefcaseBusiness size={18} />} title="Student Tools" desc="Predictor, mock tests & more" />
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-center md:flex-row md:text-left">
          <p className="text-xs font-medium text-slate-500">
            © {currentYear} EduFill. All rights reserved.
          </p>

          <p className="text-xs font-medium text-slate-500">
            Built for students with <span className="text-emerald-400">privacy, trust and speed</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkColumn({ title, icon, links }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-white">
        <span className="text-emerald-300">{icon}</span>
        <h3 className="text-sm font-black uppercase tracking-widest">{title}</h3>
      </div>

      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className="group flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-emerald-300"
            >
              <ChevronRight size={14} className="opacity-0 transition group-hover:opacity-100" />
              <span className="group-hover:translate-x-1 transition">{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniFooterFeature({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-black text-white">{title}</h4>
        <p className="text-xs font-medium text-slate-400">{desc}</p>
      </div>
    </div>
  );
}
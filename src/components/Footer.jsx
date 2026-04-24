import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer id="contact" className="bg-gray-950 text-white pt-24 pb-10 px-4 mt-auto border-t border-gray-900">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 border-b border-gray-800 pb-16">
      
      {/* 🌟 BRAND SECTION 🌟 */}
      <div className="md:col-span-12 lg:col-span-4">
        <Link to="/" className="flex items-center gap-3 mb-6 group inline-flex">
          {/* 🚀 FIXED: Premium SVG Logo applied here with lazy loading for better performance */}
          <div className="relative h-10 md:h-12 w-auto">
            <img 
              src="/edufill-brand-logo.svg?v=2" 
              alt="EduFill Logo - Online Form Filling Portal" 
              width="48"
              height="48"
              loading="lazy" 
              className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <span className="text-3xl font-extrabold tracking-tight group-hover:text-emerald-400 transition-colors">
            Edu<span className="text-emerald-500">Fill</span>
          </span>
        </Link>
        <p className="text-gray-400 text-base pr-4 mb-8 leading-relaxed font-medium">
          Central India's first dedicated platform for competitive exam form filling. Making student lives easier, one form at a time.
        </p>
      </div>

      {/* 🌟 COMPANY LINKS 🌟 */}
      <div className="md:col-span-4 lg:col-span-2">
        <h4 className="font-bold text-lg mb-6 text-white tracking-widest uppercase text-[11px]">Company</h4>
        <div className="space-y-4 font-medium text-sm">
          <Link to="/" className="block text-gray-400 hover:text-emerald-400 hover:translate-x-1 transition-all">Home</Link>
          <Link to="/about" className="block text-gray-400 hover:text-emerald-400 hover:translate-x-1 transition-all">About Us</Link>
          <Link to="/contact" className="block text-gray-400 hover:text-emerald-400 hover:translate-x-1 transition-all">Contact Us</Link>
        </div>
      </div>

      {/* 🌟 LEGAL PAGES 🌟 */}
      <div className="md:col-span-4 lg:col-span-3">
        <h4 className="font-bold text-lg mb-6 text-white tracking-widest uppercase text-[11px]">Legal Info</h4>
        <div className="space-y-4 font-medium text-sm">
          <Link to="/privacy-policy" className="block text-gray-400 hover:text-emerald-400 hover:translate-x-1 transition-all">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="block text-gray-400 hover:text-emerald-400 hover:translate-x-1 transition-all">Terms & Conditions</Link>
          <Link to="/refund-policy" className="block text-gray-400 hover:text-emerald-400 hover:translate-x-1 transition-all">Refund Policy</Link>
        </div>
      </div>

      {/* 🌟 SUPPORT & CONTACT 🌟 */}
      <div className="md:col-span-4 lg:col-span-3">
        <h4 className="font-bold text-lg mb-6 text-white tracking-widest uppercase text-[11px]">Need Support?</h4>
        <div className="space-y-4">
          <a href="tel:9752519051" className="flex items-center gap-4 text-sm font-bold text-gray-300 hover:text-white transition-colors group bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5">
            <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Phone size={18}/></div>
            +91 9752519051
          </a>
          <a href="https://wa.me/919752519051" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-sm font-bold text-gray-300 hover:text-white transition-colors group bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5">
            <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><MessageCircle size={18}/></div>
            WhatsApp Support
          </a>
        </div>
      </div>

    </div>

    {/* 🌟 COPYRIGHT 🌟 */}
    <div className="max-w-7xl mx-auto pt-8 text-center flex flex-col items-center justify-center">
      <p className="text-gray-600 text-xs font-bold tracking-wider uppercase">© {new Date().getFullYear()} EduFill Solutions. All Rights Reserved.</p>
    </div>
  </footer>
);

export default Footer;
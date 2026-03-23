import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
// 🌟 NAYA IMPORT: react-router-dom se Link import kiya taaki page fast khule
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer id="contact" className="bg-gray-950 text-white pt-20 pb-10 px-4 mt-auto">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 border-b border-gray-800 pb-12">
      
      {/* 🌟 BRAND SECTION */}
      <div className="md:col-span-12 lg:col-span-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">EF</div>
          <span className="text-3xl font-extrabold italic">EduFills</span>
        </div>
        <p className="text-gray-400 text-base md:text-lg pr-4 mb-8 leading-relaxed">
          Central India's first dedicated platform for competitive exam form filling. Making student lives easier, one form at a time.
        </p>
      </div>

      {/* 🌟 COMPANY & INFO LINKS */}
      <div className="md:col-span-4 lg:col-span-2">
        <h4 className="font-bold text-xl mb-6 text-white tracking-wide">Company</h4>
        <div className="space-y-4">
          <Link to="/" className="block text-gray-400 hover:text-emerald-400 transition-colors">Home</Link>
          <Link to="/about" className="block text-gray-400 hover:text-emerald-400 transition-colors">About Us</Link>
          <Link to="/contact" className="block text-gray-400 hover:text-emerald-400 transition-colors">Contact Us</Link>
        </div>
      </div>

      {/* 🌟 LEGAL PAGES SECTION (Naya Add Kiya) */}
      <div className="md:col-span-4 lg:col-span-3">
        <h4 className="font-bold text-xl mb-6 text-white tracking-wide">Legal</h4>
        <div className="space-y-4">
          <Link to="/privacy-policy" className="block text-gray-400 hover:text-emerald-400 transition-colors">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="block text-gray-400 hover:text-emerald-400 transition-colors">Terms & Conditions</Link>
          <Link to="/refund-policy" className="block text-gray-400 hover:text-emerald-400 transition-colors">Refund Policy</Link>
        </div>
      </div>

      {/* 🌟 SUPPORT & CONTACT DETAILS */}
      <div className="md:col-span-4 lg:col-span-3">
        <h4 className="font-bold text-xl mb-6 text-white tracking-wide">Support</h4>
        <div className="space-y-5 bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <a href="tel:9752519051" className="flex items-center gap-4 text-base text-gray-300 hover:text-emerald-400 transition-colors group">
            <div className="bg-gray-800 p-3 rounded-full group-hover:bg-emerald-500/20"><Phone size={20} className="group-hover:text-emerald-400"/></div>
            +91 9752519051
          </a>
          <a href="https://wa.me/919752519051" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-base text-gray-300 hover:text-emerald-400 transition-colors group">
            <div className="bg-gray-800 p-3 rounded-full group-hover:bg-emerald-500/20"><MessageCircle size={20} className="group-hover:text-emerald-400"/></div>
            WhatsApp Support
          </a>
        </div>
      </div>

    </div>

    {/* 🌟 COPYRIGHT SECTION */}
    <div className="max-w-7xl mx-auto pt-8 text-center flex flex-col items-center justify-center">
      <p className="text-gray-500 text-sm font-medium">© {new Date().getFullYear()} EduFills Solutions. All Rights Reserved.</p>
    </div>
  </footer>
);

export default Footer;
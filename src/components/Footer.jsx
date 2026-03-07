import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';

const Footer = () => (
  <footer id="contact" className="bg-gray-950 text-white pt-20 pb-10 px-4">
    <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 border-b border-gray-800 pb-16">
      <div className="md:col-span-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">EF</div>
          <span className="text-3xl font-extrabold italic">EduFill</span>
        </div>
        <p className="text-gray-400 text-lg pr-4 mb-8 leading-relaxed">
          Central India's first dedicated platform for competitive exam form filling. Making student lives easier, one form at a time.
        </p>
      </div>

      <div className="md:col-span-3">
        <h4 className="font-bold text-xl mb-6 text-white tracking-wide">Quick Links</h4>
        <div className="space-y-4">
          <a href="#home" className="block text-gray-400 hover:text-emerald-400 transition-colors">Home</a>
          <a href="#exams" className="block text-gray-400 hover:text-emerald-400 transition-colors">Exams We Cover</a>
          <a href="#partners" className="block text-gray-400 hover:text-emerald-400 transition-colors">Partner Institutes</a>
        </div>
      </div>

      <div className="md:col-span-4">
        <h4 className="font-bold text-xl mb-6 text-white tracking-wide">Contact Us</h4>
        <div className="space-y-5 bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <a href="tel:9752519051" className="flex items-center gap-4 text-lg text-gray-300 hover:text-emerald-400 transition-colors group">
            <div className="bg-gray-800 p-3 rounded-full group-hover:bg-emerald-500/20"><Phone size={20} className="group-hover:text-emerald-400"/></div>
            +91 9752519051
          </a>
          <a href="https://wa.me/919752519051" className="flex items-center gap-4 text-lg text-gray-300 hover:text-emerald-400 transition-colors group">
            <div className="bg-gray-800 p-3 rounded-full group-hover:bg-emerald-500/20"><MessageCircle size={20} className="group-hover:text-emerald-400"/></div>
            WhatsApp Support
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
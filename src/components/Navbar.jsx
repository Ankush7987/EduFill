import React, { useState } from 'react';
import { Phone, MessageCircle, Menu, X } from 'lucide-react';

const Navbar = ({ openBooking }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <nav className="fixed w-full top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
              EF
            </div>
            <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-indigo-800 tracking-tight italic">
              EduFill
            </span>
          </div>

          <div className="hidden md:flex space-x-10 font-bold text-gray-600">
            <a href="#home" className="hover:text-emerald-500 transition-colors">Home</a>
            <a href="#exams" className="hover:text-emerald-500 transition-colors">Exams</a>
            <a href="#partners" className="hover:text-emerald-500 transition-colors">Institutes</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <a href="https://wa.me/919752519051" className="flex items-center gap-2 text-blue-900 font-bold hover:text-emerald-600 transition-colors">
              <Phone size={18} /> 9752519051
            </a>
            <button onClick={openBooking} className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all">
              Book Slot
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-blue-900 focus:outline-none">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0 z-50 p-4 space-y-3">
          <a href="#home" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-lg font-bold text-gray-800 bg-gray-50 rounded-xl">Home</a>
          <a href="#exams" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-lg font-bold text-gray-800 hover:bg-gray-50 rounded-xl">Exams</a>
          <a href="#partners" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-lg font-bold text-gray-800 hover:bg-gray-50 rounded-xl">Institutes</a>
          <button onClick={() => { setIsOpen(false); openBooking(); }} className="w-full text-left block px-4 py-3 text-lg font-bold text-gray-800 hover:bg-gray-50 rounded-xl text-blue-600">
            Book a Slot
          </button>
          <a href="https://wa.me/919752519051" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-lg font-bold text-white bg-emerald-500 rounded-xl text-center flex items-center justify-center gap-2">
            <MessageCircle size={20} /> WhatsApp Us
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
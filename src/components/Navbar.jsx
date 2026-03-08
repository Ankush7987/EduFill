import React, { useState } from 'react';
import { Phone, MessageCircle, Menu, X, Building } from 'lucide-react';

// NAYA: openCamp prop add kiya hai
const Navbar = ({ openBooking, openCamp }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <nav className="fixed w-full top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
              EF
            </div>
            <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-indigo-800 tracking-tight italic">
              EduFill
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex space-x-8 font-bold text-gray-600">
            <a href="#home" className="hover:text-emerald-500 transition-colors">Home</a>
            <a href="#exams" className="hover:text-emerald-500 transition-colors">Exams</a>
            <a href="#partners" className="hover:text-emerald-500 transition-colors">Institutes</a>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a href="https://wa.me/919752519051" className="hidden xl:flex items-center gap-2 text-blue-900 font-bold hover:text-emerald-600 transition-colors mr-2">
              <Phone size={18} /> 9752519051
            </a>
            
            {/* 🌟 NAYA: HOST A CAMP BUTTON (Desktop) 🌟 */}
            <button 
              onClick={openCamp} 
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-full font-bold transition-all"
            >
              <Building size={18} />
              Host Camp
            </button>

            <button 
              onClick={openBooking} 
              className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all"
            >
              Book Slot
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-blue-900 focus:outline-none bg-blue-50 p-2 rounded-lg">
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-2xl absolute w-full left-0 z-50 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <a href="#home" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-lg font-bold text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">Home</a>
          <a href="#exams" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-lg font-bold text-gray-800 hover:bg-gray-50 rounded-xl transition-colors">Exams</a>
          <a href="#partners" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-lg font-bold text-gray-800 hover:bg-gray-50 rounded-xl transition-colors">Institutes</a>
          
          <div className="h-px bg-gray-100 my-2"></div>
          
          {/* 🌟 NAYA: HOST A CAMP BUTTON (Mobile) 🌟 */}
          <button 
            onClick={() => { setIsOpen(false); openCamp(); }} 
            className="w-full flex items-center justify-center gap-2 text-left px-4 py-3 text-lg font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl transition-colors"
          >
            <Building size={20} /> Request a Camp
          </button>

          <button 
            onClick={() => { setIsOpen(false); openBooking(); }} 
            className="w-full text-center block px-4 py-3 text-lg font-bold text-white bg-blue-900 hover:bg-blue-800 shadow-md rounded-xl transition-all"
          >
            Book a Slot
          </button>
          
          <a href="https://wa.me/919752519051" onClick={() => setIsOpen(false)} className="block px-4 py-3 text-lg font-bold text-gray-700 bg-gray-100 rounded-xl text-center flex items-center justify-center gap-2 transition-colors">
            <MessageCircle size={20} className="text-green-500" /> WhatsApp Support
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
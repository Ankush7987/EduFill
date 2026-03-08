import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BookingModal from '../components/BookingModal';
import Hero from '../components/Hero';
import Exams from '../components/Exams';
import Partners from '../components/Partners';
import Footer from '../components/Footer';
import CampModal from '../components/CampModal';
import MissingReportForm from '../components/MissingReportForm';

import { AlertCircle, X } from 'lucide-react';

// FIREBASE SE REAL-TIME IMPORT
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCampModalOpen, setIsCampModalOpen] = useState(false);
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [liveExams, setLiveExams] = useState({ neet: false, jee: false, cuet: false });

  useEffect(() => {
    const docRef = doc(db, "Settings", "LiveExams");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setLiveExams(docSnap.data());
      }
    }, (error) => {
      console.error("Error fetching live status:", error);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="font-sans text-gray-900 scroll-smooth bg-gray-50 selection:bg-emerald-500 selection:text-white relative">
      
      {/* --- Modals --- */}
      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <CampModal isOpen={isCampModalOpen} onClose={() => setIsCampModalOpen(false)} />
      
      {/* --- MISSING ITEMS POPUP MODAL --- */}
      {isMissingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md my-8 animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setIsMissingModalOpen(false)} 
              className="absolute -top-3 -right-3 z-10 bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-full shadow-lg transition-colors"
            >
              <X size={20} />
            </button>
            <div className="mt-4">
              <MissingReportForm />
            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING BUTTON --- */}
      <button
        onClick={() => setIsMissingModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-red-500 hover:bg-red-600 text-white px-5 py-3.5 rounded-full shadow-[0_4px_20px_rgba(239,68,68,0.5)] font-bold flex items-center gap-2 transition-all transform hover:-translate-y-1 hover:scale-105 border-2 border-white"
      >
        <AlertCircle size={20} />
        <span className="hidden md:inline">Missing Print/Photo?</span>
      </button>

      {/* 🌟 NAYA: NAVBAR MEIN openCamp PROP ADD KIYA 🌟 */}
      <Navbar 
        openBooking={() => setIsModalOpen(true)} 
        openCamp={() => setIsCampModalOpen(true)} 
      />
      
      <Hero openBooking={() => setIsModalOpen(true)} liveExams={liveExams} />
      <Exams openBooking={() => setIsModalOpen(true)} liveExams={liveExams} />
      <Partners />

      {/* CTA SECTION */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-900 py-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Host an EduFill Camp at Your Institute!</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Let us handle the complexities of form-filling. EduFill's expert team will visit your campus to ensure 100% error-free registrations for all your students.
          </p>
          <button 
            onClick={() => setIsCampModalOpen(true)} 
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-1"
          >
            Request a Camp
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
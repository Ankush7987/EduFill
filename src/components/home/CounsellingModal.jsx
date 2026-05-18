import React from 'react';
import { X } from 'lucide-react';
import CounsellingSection from '../CounsellingSection';

export default function CounsellingModal({ isOpen, onClose }) {
  if (!isOpen || !CounsellingSection) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-gray-900/70 backdrop-blur-sm">
      <div className="bg-white w-full h-[95vh] md:h-auto md:max-h-[95vh] md:max-w-6xl rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        <div className="sticky top-0 z-50 flex justify-between items-center p-4 md:p-0 border-b border-gray-100 bg-white/90 backdrop-blur-md md:absolute md:top-4 md:right-4 md:border-none md:bg-transparent">
          <h2 className="text-lg font-black text-gray-800 md:hidden ml-2">Counselling Plans</h2>
          <button
            onClick={onClose}
            className="bg-red-50 hover:bg-red-100 md:bg-white md:hover:bg-red-100 text-red-600 p-2.5 rounded-full transition-colors shadow-sm"
            aria-label="Close counselling modal"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2 md:p-8 md:pt-14">
          <CounsellingSection />
        </div>
      </div>
    </div>
  );
}

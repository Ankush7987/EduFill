import React from 'react';
import { ShieldCheck, Clock, Users } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
        <div className="text-center mb-12">
          <span className="bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full">About Us</span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-4">India's Most Trusted Form Filling Portal</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">Skip the cyber cafe queue. We handle your complex admission forms so you can focus 100% on your studies.</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <p>
            Welcome to <strong>EduFills</strong>. Every year, lakhs of students face immense stress and anxiety navigating complex admission portals for NEET, JEE, CUET, and government colleges. A single mistake in document upload or category selection can lead to form rejection and cost a student their entire academic year.
          </p>
          <p>
            We started EduFills with a simple mission: <strong>To make form-filling 100% error-free, secure, and accessible from anywhere.</strong> Our team of dedicated experts understands the strict guidelines of NTA, CBSE, and State Universities, ensuring your application is flawless.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-12 pt-12 border-t border-gray-100">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><ShieldCheck size={24} /></div>
            <h3 className="font-bold text-gray-900 mb-2">100% Error Free</h3>
            <p className="text-sm text-gray-500">Triple-checked entries by experts.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Clock size={24} /></div>
            <h3 className="font-bold text-gray-900 mb-2">Save Time</h3>
            <p className="text-sm text-gray-500">No waiting in long cyber cafe lines.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users size={24} /></div>
            <h3 className="font-bold text-gray-900 mb-2">Expert Support</h3>
            <p className="text-sm text-gray-500">Dedicated agents for your queries.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
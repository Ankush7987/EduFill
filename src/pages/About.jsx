import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Clock, Users, ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <>
      <Helmet>
        <title>About EduFill | India's Most Trusted Form Filling Portal</title>
        <meta name="description" content="Learn about EduFill's mission to make NEET, JEE, and college admission form filling 100% error-free, secure, and stress-free for students across India." />
        <meta name="keywords" content="About EduFill, EduFill team, reliable form filling service, error-free admission forms, student support India" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <ArrowLeft size={18}/> Back to Home
          </Link>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="text-center mb-12">
            <span className="bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full">About Us</span>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-4">India's Most Trusted Form Filling Portal</h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Skip the cyber cafe queue. We handle your complex admission forms so you can focus 100% on your studies.</p>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed text-lg">
            <p>
              Welcome to <strong>EduFill</strong>. Every year, lakhs of students face immense stress and anxiety navigating complex admission portals for NEET, JEE, CUET, and government colleges. A single mistake in document upload or category selection can lead to form rejection and cost a student their entire academic year.
            </p>
            <p>
              We started EduFill with a simple mission: <strong>To make form-filling 100% error-free, secure, and accessible from anywhere.</strong> Our team of dedicated experts understands the strict guidelines of NTA, CBSE, and State Universities, ensuring your application is flawless.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-12 pt-12 border-t border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32} /></div>
              <h3 className="font-bold text-gray-900 mb-2 text-xl">100% Error Free</h3>
              <p className="text-sm text-gray-500">Triple-checked entries by experts.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Clock size={32} /></div>
              <h3 className="font-bold text-gray-900 mb-2 text-xl">Save Time</h3>
              <p className="text-sm text-gray-500">No waiting in long cyber cafe lines.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users size={32} /></div>
              <h3 className="font-bold text-gray-900 mb-2 text-xl">Expert Support</h3>
              <p className="text-sm text-gray-500">Dedicated agents for your queries.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
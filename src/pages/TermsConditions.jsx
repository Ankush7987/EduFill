import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsConditions() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions | EduFill Service Agreement</title>
        <meta name="description" content="Read the Terms and Conditions for using EduFill's online form filling and mock test services. Understand your rights and our service scope." />
        <meta name="keywords" content="EduFill terms and conditions, terms of service, online form filling terms, user agreement, EduFill policy" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <ArrowLeft size={18}/> Back to Home
          </Link>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Terms & Conditions</h1>
          <p className="text-gray-500 text-sm font-bold mb-8 uppercase tracking-widest">Last Updated: March 2026</p>
          
          <div className="space-y-8 text-gray-700 leading-relaxed text-lg">
            <p className="font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">By accessing and using EduFill (edufills.com), you accept and agree to be bound by the terms and provision of this agreement.</p>

            <div>
                <h3 className="text-2xl font-black text-gray-900 mb-3 text-indigo-700">1. Scope of Service</h3>
                <p>EduFill is an independent data-entry and facilitation service provider. We assist students in filling out online application forms for various examinations and admissions (e.g., NEET, JEE, CUET). <strong className="text-red-600 bg-red-50 px-2 py-0.5 rounded">We are NOT affiliated with, endorsed by, or connected to any government body, NTA, CBSE, or any university.</strong></p>
            </div>

            <div>
                <h3 className="text-2xl font-black text-gray-900 mb-3 text-indigo-700">2. User Responsibilities</h3>
                <p>The accuracy of the information provided to us rests entirely with the user. You must ensure that the documents, spellings, categories, and academic details shared with our agents are correct. EduFill will not be held liable for form rejections resulting from incorrect or fraudulent data provided by the user.</p>
            </div>

            <div>
                <h3 className="text-2xl font-black text-gray-900 mb-3 text-indigo-700">3. No Guarantee of Admission</h3>
                <p>Our service is limited to the successful submission of your application form based on your data. We do not guarantee clearing of the exam, allotment of seats, or admission into any college.</p>
            </div>

            <div>
                <h3 className="text-2xl font-black text-gray-900 mb-3 text-indigo-700">4. Service Fees</h3>
                <p>The service fee charged by EduFill is exclusively for our consultation and form-filling labor. This fee is separate from the official examination fee charged by the respective authorities.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
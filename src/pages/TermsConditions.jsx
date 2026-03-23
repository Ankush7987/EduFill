import React from 'react';

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-blue">
        <h1 className="text-3xl font-black text-gray-900 mb-6">Terms & Conditions</h1>
        <p className="text-gray-500 text-sm mb-8">Last Updated: March 2026</p>
        
        <div className="space-y-6 text-gray-700">
          <p>By accessing and using EduFills (edufills.com), you accept and agree to be bound by the terms and provision of this agreement.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8">1. Scope of Service</h3>
          <p>EduFills is an independent data-entry and facilitation service provider. We assist students in filling out online application forms for various examinations and admissions (e.g., NEET, JEE, CUET). <strong>We are NOT affiliated with, endorsed by, or connected to any government body, NTA, CBSE, or any university.</strong></p>

          <h3 className="text-xl font-bold text-gray-900 mt-8">2. User Responsibilities</h3>
          <p>The accuracy of the information provided to us rests entirely with the user. You must ensure that the documents, spellings, categories, and academic details shared with our agents are correct. EduFills will not be held liable for form rejections resulting from incorrect or fraudulent data provided by the user.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8">3. No Guarantee of Admission</h3>
          <p>Our service is limited to the successful submission of your application form based on your data. We do not guarantee clearing of the exam, allotment of seats, or admission into any college.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8">4. Service Fees</h3>
          <p>The service fee charged by EduFills is exclusively for our consultation and form-filling labor. This fee is separate from the official examination fee charged by the respective authorities.</p>
        </div>
      </div>
    </div>
  );
}
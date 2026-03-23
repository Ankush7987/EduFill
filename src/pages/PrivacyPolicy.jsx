import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-blue">
        <h1 className="text-3xl font-black text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last Updated: March 2026</p>
        
        <div className="space-y-6 text-gray-700">
          <p>At EduFills ("we", "our", or "us"), we are committed to protecting your personal information and your right to privacy. This policy explains how we collect, use, and safeguard your data when you use our website (edufills.com).</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8">1. Information We Collect</h3>
          <p>We only collect information necessary to fill out your official admission forms. This includes:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Personal identification (Name, DOB, Gender, Category).</li>
            <li>Contact details (Phone number, Email address, Residential address).</li>
            <li>Academic records (10th/12th marksheets, previous scores).</li>
            <li>Document scans (Photographs, Signatures, Thumb impressions, IDs like Aadhar).</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8">2. How We Use Your Information</h3>
          <p>Your data is strictly used for the purpose of completing and submitting online application forms on official portals (e.g., NTA for NEET/JEE, Universities) as requested by you. We do not use your academic documents for any other purpose.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8">3. Data Security & Deletion</h3>
          <p>We implement strict security measures to protect your sensitive documents. <strong>Once your form is successfully submitted and you receive the confirmation, your uploaded sensitive documents (like photos, signatures, and IDs) are routinely purged from our active processing systems</strong> to ensure your safety. We do not sell or rent your personal data to third-party marketers.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8">4. Contact Us</h3>
          <p>If you have questions about this privacy policy, please contact us at support@edufills.com or via WhatsApp at +91 9752519051.</p>
        </div>
      </div>
    </div>
  );
}
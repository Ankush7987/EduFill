import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Secure Data Handling at EduFill</title>
        <meta name="description" content="Read EduFill's Privacy Policy. Learn how we securely collect, use, and protect your personal data and admission documents. 100% data security guaranteed." />
        <meta name="keywords" content="EduFill privacy policy, data security, document safety, student data protection, admission form privacy" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <ArrowLeft size={18}/> Back to Home
          </Link>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm font-bold mb-8 uppercase tracking-widest">Last Updated: March 2026</p>
          
          <div className="space-y-8 text-gray-700 leading-relaxed text-lg">
            <p>At EduFill ("we", "our", or "us"), we are committed to protecting your personal information and your right to privacy. This policy explains how we collect, use, and safeguard your data when you use our website (edufills.com).</p>

            <div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 text-emerald-700">1. Information We Collect</h3>
                <p className="mb-3">We only collect information necessary to fill out your official admission forms. This includes:</p>
                <ul className="list-disc pl-6 space-y-2 font-medium bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <li>Personal identification (Name, DOB, Gender, Category).</li>
                <li>Contact details (Phone number, Email address, Residential address).</li>
                <li>Academic records (10th/12th marksheets, previous scores).</li>
                <li>Document scans (Photographs, Signatures, Thumb impressions, IDs).</li>
                </ul>
            </div>

            <div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 text-emerald-700">2. How We Use Your Information</h3>
                <p>Your data is strictly used for the purpose of completing and submitting online application forms on official portals (e.g., NTA for NEET/JEE, Universities) as requested by you. We do not use your academic documents for any other purpose.</p>
            </div>

            <div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 text-emerald-700">3. Data Security & Deletion</h3>
                <p>We implement strict security measures to protect your sensitive documents. <strong className="text-gray-900">Once your form is successfully submitted and you receive the confirmation, your uploaded sensitive documents are routinely purged from our active processing systems</strong> to ensure your safety. We do not sell or rent your personal data to third-party marketers.</p>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mt-10">
                <h3 className="text-xl font-black text-blue-900 mb-2">4. Contact Us</h3>
                <p className="text-blue-800 font-medium">If you have questions about this privacy policy, please contact us at support@edufills.com or via WhatsApp at +91 9752519051.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
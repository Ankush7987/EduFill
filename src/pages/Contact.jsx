import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Phone, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Contact() {
  return (
    <>
      <Helmet>
        <title>Contact EduFill Support | 24/7 Form Filling Assistance</title>
        <meta name="description" content="Need help with your NEET, JEE, or College admission form? Contact EduFill's expert support team via WhatsApp, call, or email. We are here to help." />
        <meta name="keywords" content="EduFill contact number, EduFill customer care, form filling help, NEET form support, JEE registration assistance" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-3xl mx-auto mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <ArrowLeft size={18}/> Back to Home
          </Link>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Contact Support</h1>
            <p className="text-gray-600 text-lg">Need help with your form? Our experts are here to assist you.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-5 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:shadow-md transition-shadow">
              <div className="bg-emerald-100 text-emerald-600 p-4 rounded-2xl"><Phone size={28} /></div>
              <div>
                <h3 className="font-bold text-gray-900 text-xl">WhatsApp / Call</h3>
                <p className="text-gray-600 mt-1 font-medium text-lg">+91 9752519051</p>
                <p className="text-sm text-gray-500 mt-2 font-bold">Mon - Sat, 10:00 AM to 7:00 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-5 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 hover:shadow-md transition-shadow">
              <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl"><Mail size={28} /></div>
              <div>
                <h3 className="font-bold text-gray-900 text-xl">Email Us</h3>
                <p className="text-gray-600 mt-1 font-medium text-lg">support@edufills.com</p>
                <p className="text-sm text-gray-500 mt-2 font-bold">We aim to reply within 24 hours.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
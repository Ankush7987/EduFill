import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-4">Contact Support</h1>
          <p className="text-gray-600">Need help with your form? Our experts are here to assist you.</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl"><Phone size={24} /></div>
            <div>
              <h3 className="font-bold text-gray-900">WhatsApp / Call</h3>
              <p className="text-gray-600 mt-1">+91 9752519051</p>
              <p className="text-xs text-gray-400 mt-1">Mon - Sat, 10:00 AM to 7:00 PM</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><Mail size={24} /></div>
            <div>
              <h3 className="font-bold text-gray-900">Email Us</h3>
              <p className="text-gray-600 mt-1">support@edufills.com</p>
              <p className="text-xs text-gray-400 mt-1">We aim to reply within 24 hours.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
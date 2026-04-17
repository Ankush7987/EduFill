import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RefundPolicy() {
  return (
    <>
      <Helmet>
        <title>Refund & Cancellation Policy | EduFill</title>
        <meta name="description" content="Understand EduFill's transparent Refund and Cancellation Policy for form filling services. Know when you are eligible for a 100% refund." />
        <meta name="keywords" content="EduFill refund policy, cancellation policy, online form filling refund, service money back, payment support EduFill" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
            <ArrowLeft size={18}/> Back to Home
          </Link>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Refund & Cancellation Policy</h1>
          <p className="text-gray-500 text-sm font-bold mb-8 uppercase tracking-widest">Last Updated: March 2026</p>
          
          <div className="space-y-8 text-gray-700 leading-relaxed text-lg">
            <p>We strive to provide the best and most accurate form-filling services. Please read our refund policy carefully before making a payment.</p>

            <div>
                <h3 className="text-2xl font-black text-emerald-700 mb-4 flex items-center gap-2">1. Eligible for 100% Refund</h3>
                <ul className="list-disc pl-6 space-y-3 font-medium bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                <li>If you have made the payment, but our team fails to process or submit your application form before the official deadline due to a fault on our end.</li>
                <li>If duplicate payments are accidentally deducted from your account.</li>
                </ul>
            </div>

            <div>
                <h3 className="text-2xl font-black text-red-600 mb-4">2. Non-Refundable Scenarios</h3>
                <p className="mb-4 font-bold text-gray-900">Refunds will NOT be issued under the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-3 font-medium bg-red-50/50 p-6 rounded-2xl border border-red-100">
                <li>Once the application form has been successfully submitted to the official portal and the confirmation page/receipt is generated.</li>
                <li>If the user provides incorrect information (e.g., wrong category, spelling mistakes) which leads to form rejection.</li>
                <li>If the user decides to cancel the service after our agent has already started processing the form.</li>
                <li>If the official website/server crashes near the deadline and form submission becomes impossible globally (force majeure).</li>
                </ul>
            </div>

            <div className="bg-gray-100 p-6 rounded-2xl mt-10">
                <h3 className="text-xl font-black text-gray-900 mb-2">3. Refund Process</h3>
                <p className="text-gray-700 font-medium">To request a refund, please contact us at <strong>support@edufills.com</strong> with your token number and payment receipt. Approved refunds will be processed and credited back to the original payment method within <strong className="text-gray-900">5-7 working days</strong>.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
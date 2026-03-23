
import React from 'react';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-blue">
        <h1 className="text-3xl font-black text-gray-900 mb-6">Refund & Cancellation Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last Updated: March 2026</p>
        
        <div className="space-y-6 text-gray-700">
          <p>We strive to provide the best and most accurate form-filling services. Please read our refund policy carefully before making a payment.</p>

          <h3 className="text-xl font-bold text-gray-900 mt-8">1. Eligible for 100% Refund</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>If you have made the payment, but our team fails to process or submit your application form before the official deadline due to a fault on our end.</li>
            <li>If duplicate payments are accidentally deducted from your account.</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8">2. Non-Refundable Scenarios</h3>
          <p>Refunds will <strong>NOT</strong> be issued under the following circumstances:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Once the application form has been successfully submitted to the official portal and the confirmation page/receipt is generated.</li>
            <li>If the user provides incorrect information (e.g., wrong category, spelling mistakes) which leads to form rejection.</li>
            <li>If the user decides to cancel the service after our agent has already started processing the form.</li>
            <li>If the official website/server crashes near the deadline and form submission becomes impossible globally (force majeure).</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8">3. Refund Process</h3>
          <p>To request a refund, please contact us at support@edufills.com with your token number and payment receipt. Approved refunds will be processed and credited back to the original payment method within <strong>5-7 working days</strong>.</p>
        </div>
      </div>
    </div>
  );
}
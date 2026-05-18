import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const SITE_URL = 'https://edufills.com';

export default function RefundPolicy() {
  const pageUrl = `${SITE_URL}/refund-policy`;

  return (
    <>
      <Helmet>
        <title>Refund & Cancellation Policy | EduFill</title>
        <meta
          name="description"
          content="Read EduFill's Refund and Cancellation Policy for online form filling and related student support services."
        />
        <meta
          name="keywords"
          content="EduFill refund policy, cancellation policy, online form filling refund, service refund, payment support EduFill"
        />
        <link rel="canonical" href={pageUrl} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"
          >
            <ArrowLeft size={18} aria-hidden="true" /> Back to Home
          </Link>
        </div>

        <main className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Refund & Cancellation Policy
          </h1>

          <p className="text-gray-500 text-sm font-bold mb-8 uppercase tracking-widest">
            Last Updated: March 2026
          </p>

          <div className="space-y-8 text-gray-700 leading-relaxed text-lg">
            <p>
              We try to provide accurate and timely form filling support. Please read our refund policy carefully before making a payment.
            </p>

            <section>
              <h2 className="text-2xl font-black text-emerald-700 mb-4">
                1. Eligible for Refund
              </h2>

              <ul className="list-disc pl-6 space-y-3 font-medium bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                <li>
                  If payment is completed but our team is unable to start or process your requested service due to an issue from our side.
                </li>
                <li>
                  If duplicate payment is deducted for the same service.
                </li>
                <li>
                  If we fail to process your form before the official deadline due to a confirmed fault from our side.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-red-600 mb-4">
                2. Non-Refundable Scenarios
              </h2>

              <p className="mb-4 font-bold text-gray-900">
                Refunds may not be issued under the following circumstances:
              </p>

              <ul className="list-disc pl-6 space-y-3 font-medium bg-red-50/50 p-6 rounded-2xl border border-red-100">
                <li>
                  Once the application form has been successfully submitted and confirmation/receipt is generated.
                </li>
                <li>
                  If the user provides incorrect, incomplete, or misleading information.
                </li>
                <li>
                  If the user cancels after our agent has already started processing the form.
                </li>
                <li>
                  If the official website/server is unavailable near the deadline due to reasons beyond our control.
                </li>
              </ul>
            </section>

            <section className="bg-gray-100 p-6 rounded-2xl mt-10">
              <h2 className="text-xl font-black text-gray-900 mb-2">
                3. Refund Process
              </h2>

              <p className="text-gray-700 font-medium">
                To request a refund, contact us at <strong>support@edufills.com</strong> with your token number, registered contact details, and payment receipt. Approved refunds will usually be processed to the original payment method within <strong className="text-gray-900">5-7 working days</strong>.
              </p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
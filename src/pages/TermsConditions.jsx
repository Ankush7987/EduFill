import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const SITE_URL = 'https://edufills.com';

export default function TermsConditions() {
  const pageUrl = `${SITE_URL}/terms-and-conditions`;

  return (
    <>
      <Helmet>
        <title>Terms & Conditions | EduFill</title>
        <meta
          name="description"
          content="Read EduFill's Terms and Conditions for online form filling, student support, mock tests, and related services."
        />
        <meta
          name="keywords"
          content="EduFill terms and conditions, terms of service, online form filling terms, user agreement, EduFill policy"
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
            Terms & Conditions
          </h1>

          <p className="text-gray-500 text-sm font-bold mb-8 uppercase tracking-widest">
            Last Updated: March 2026
          </p>

          <div className="space-y-8 text-gray-700 leading-relaxed text-lg">
            <p className="font-medium bg-gray-50 p-4 rounded-xl border border-gray-100">
              By accessing and using EduFill, you agree to these Terms and Conditions.
            </p>

            <section>
              <h2 className="text-2xl font-black mb-3 text-indigo-700">
                1. Scope of Service
              </h2>

              <p>
                EduFill is an independent form filling, data-entry, and student support service provider. We assist users in filling online forms for exams, admissions, and related services.
                <strong className="text-red-600 bg-red-50 px-2 py-0.5 rounded ml-1">
                  EduFill is not affiliated with, endorsed by, or officially connected to any government body, NTA, CBSE, university, or official exam authority.
                </strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black mb-3 text-indigo-700">
                2. User Responsibilities
              </h2>

              <p>
                Users are responsible for providing correct and complete information. EduFill will not be responsible for rejection, delay, or loss caused by incorrect, incomplete, misleading, or fraudulent information provided by the user.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black mb-3 text-indigo-700">
                3. No Guarantee of Admission or Selection
              </h2>

              <p>
                Our service is limited to form filling and related support based on the information provided by the user. We do not guarantee exam qualification, college allotment, job selection, scholarship approval, or admission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black mb-3 text-indigo-700">
                4. Service Fees
              </h2>

              <p>
                EduFill service fees are charged for support, consultation, data entry, and form filling work. Official exam fees, admission fees, or government portal charges are separate and must be paid by the user where applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black mb-3 text-indigo-700">
                5. Official Portal Availability
              </h2>

              <p>
                EduFill is not responsible for delays caused by official website downtime, server errors, payment gateway issues, deadline changes, or policy changes made by official authorities.
              </p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
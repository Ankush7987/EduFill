import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const SITE_URL = 'https://edufills.com';

export default function PrivacyPolicy() {
  const pageUrl = `${SITE_URL}/privacy-policy`;

  return (
    <>
      <Helmet>
        <title>Privacy Policy | EduFill</title>
        <meta
          name="description"
          content="Read EduFill's Privacy Policy to understand how we collect, use, store, and protect student information and uploaded documents."
        />
        <meta
          name="keywords"
          content="EduFill privacy policy, data security, document safety, student data protection, admission form privacy"
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
            Privacy Policy
          </h1>

          <p className="text-gray-500 text-sm font-bold mb-8 uppercase tracking-widest">
            Last Updated: March 2026
          </p>

          <div className="space-y-8 text-gray-700 leading-relaxed text-lg">
            <p>
              At EduFill, we respect your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our website and services.
            </p>

            <section>
              <h2 className="text-2xl font-black mb-4 text-emerald-700">
                1. Information We Collect
              </h2>

              <p className="mb-3">
                We collect only the information required to provide form filling and related support services. This may include:
              </p>

              <ul className="list-disc pl-6 space-y-2 font-medium bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <li>Personal details such as name, date of birth, gender, and category.</li>
                <li>Contact details such as phone number, email address, and address.</li>
                <li>Academic records such as marksheets, scores, and qualification details.</li>
                <li>Uploaded documents such as photographs, signatures, IDs, and certificates.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black mb-4 text-emerald-700">
                2. How We Use Your Information
              </h2>

              <p>
                Your information is used to provide requested services, including form filling, document preparation, application support, communication, and service improvement. We do not sell or rent your personal information to third-party marketers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black mb-4 text-emerald-700">
                3. Data Security
              </h2>

              <p>
                We use reasonable technical and organizational measures to protect your information. However, no online system can be guaranteed to be 100% secure. Users are advised to share only accurate and necessary information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black mb-4 text-emerald-700">
                4. Data Retention
              </h2>

              <p>
                We keep your information only for as long as required to provide the service, maintain records, resolve disputes, or comply with applicable requirements. Sensitive uploaded documents may be deleted from active processing systems after service completion when no longer required.
              </p>
            </section>

            <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mt-10">
              <h2 className="text-xl font-black text-blue-900 mb-2">
                5. Contact Us
              </h2>

              <p className="text-blue-800 font-medium">
                For privacy-related questions, contact us at support@edufills.com or WhatsApp us at +91 9752519051.
              </p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
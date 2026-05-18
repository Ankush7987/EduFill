import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Clock, Users, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const SITE_URL = 'https://edufills.com';

export default function About() {
  const pageUrl = `${SITE_URL}/about`;

  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About EduFill',
    url: pageUrl,
    description:
      'EduFill helps students fill exam forms, admission forms, and related documents with expert support.',
    publisher: {
      '@type': 'Organization',
      name: 'EduFill',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
  };

  return (
    <>
      <Helmet>
        <title>About EduFill | Trusted Exam Form Filling Support</title>
        <meta
          name="description"
          content="Learn about EduFill's mission to make NEET, JEE, CUET, college admission, and exam form filling simpler, safer, and less stressful for students across India."
        />
        <meta
          name="keywords"
          content="About EduFill, EduFill team, exam form filling service, admission form help, student support India"
        />
        <link rel="canonical" href={pageUrl} />
        <script type="application/ld+json">{JSON.stringify(aboutSchema)}</script>
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
          <div className="text-center mb-12">
            <span className="bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full">
              About Us
            </span>

            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-4">
              India&apos;s Trusted Form Filling Support Platform
            </h1>

            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Skip the cyber cafe queue. EduFill helps students complete complex admission and exam forms with expert guidance.
            </p>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed text-lg">
            <p>
              Welcome to <strong>EduFill</strong>. Every year, many students face stress while filling complex admission and exam forms for NEET, JEE, CUET, colleges, and other entrance exams. A small mistake in document upload, category selection, or personal details can create serious problems.
            </p>

            <p>
              We started EduFill with a simple mission:{' '}
              <strong>to make online form filling easier, safer, and more accessible for students.</strong>{' '}
              Our team helps students understand form requirements, upload documents properly, and complete applications with care.
            </p>
          </div>

          <section className="grid md:grid-cols-3 gap-8 mt-12 pt-12 border-t border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} aria-hidden="true" />
              </div>
              <h2 className="font-bold text-gray-900 mb-2 text-xl">Careful Checking</h2>
              <p className="text-sm text-gray-500">Details are reviewed carefully before submission.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock size={32} aria-hidden="true" />
              </div>
              <h2 className="font-bold text-gray-900 mb-2 text-xl">Save Time</h2>
              <p className="text-sm text-gray-500">No waiting in long cyber cafe lines.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} aria-hidden="true" />
              </div>
              <h2 className="font-bold text-gray-900 mb-2 text-xl">Expert Support</h2>
              <p className="text-sm text-gray-500">Dedicated support for student queries.</p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
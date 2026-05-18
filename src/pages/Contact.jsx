import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Phone, ArrowLeft, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SITE_URL = 'https://edufills.com';

export default function Contact() {
  const pageUrl = `${SITE_URL}/contact`;

  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact EduFill Support',
    url: pageUrl,
    description: 'Contact EduFill for exam form filling, admission form support, and student help.',
    publisher: {
      '@type': 'Organization',
      name: 'EduFill',
      url: SITE_URL,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-9752519051',
        contactType: 'customer support',
        email: 'support@edufills.com',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
    },
  };

  return (
    <>
      <Helmet>
        <title>Contact EduFill Support | Form Filling Help</title>
        <meta
          name="description"
          content="Need help with NEET, JEE, CUET, college admission, or exam form filling? Contact EduFill support via WhatsApp, call, or email."
        />
        <meta
          name="keywords"
          content="EduFill contact number, EduFill support, form filling help, NEET form support, JEE registration assistance"
        />
        <link rel="canonical" href={pageUrl} />
        <script type="application/ld+json">{JSON.stringify(contactSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-3xl mx-auto mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"
          >
            <ArrowLeft size={18} aria-hidden="true" /> Back to Home
          </Link>
        </div>

        <main className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Contact Support
            </h1>
            <p className="text-gray-600 text-lg">
              Need help with your form? Our support team is here to assist you.
            </p>
          </div>

          <div className="space-y-6">
            <a
              href="tel:+919752519051"
              className="flex items-start gap-5 p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:shadow-md transition-shadow"
            >
              <div className="bg-emerald-100 text-emerald-600 p-4 rounded-2xl">
                <Phone size={28} aria-hidden="true" />
              </div>

              <div>
                <h2 className="font-bold text-gray-900 text-xl">Call Support</h2>
                <p className="text-gray-600 mt-1 font-medium text-lg">+91 9752519051</p>
                <p className="text-sm text-gray-500 mt-2 font-bold">
                  Mon - Sat, 10:00 AM to 7:00 PM
                </p>
              </div>
            </a>

            <a
              href="https://wa.me/919752519051"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-5 p-6 bg-green-50/50 rounded-2xl border border-green-100 hover:shadow-md transition-shadow"
            >
              <div className="bg-green-100 text-green-600 p-4 rounded-2xl">
                <MessageCircle size={28} aria-hidden="true" />
              </div>

              <div>
                <h2 className="font-bold text-gray-900 text-xl">WhatsApp</h2>
                <p className="text-gray-600 mt-1 font-medium text-lg">Chat with EduFill support</p>
                <p className="text-sm text-gray-500 mt-2 font-bold">
                  Fast support for form filling queries.
                </p>
              </div>
            </a>

            <a
              href="mailto:support@edufills.com"
              className="flex items-start gap-5 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 hover:shadow-md transition-shadow"
            >
              <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl">
                <Mail size={28} aria-hidden="true" />
              </div>

              <div>
                <h2 className="font-bold text-gray-900 text-xl">Email Us</h2>
                <p className="text-gray-600 mt-1 font-medium text-lg">support@edufills.com</p>
                <p className="text-sm text-gray-500 mt-2 font-bold">
                  We aim to reply within 24 hours.
                </p>
              </div>
            </a>
          </div>
        </main>
      </div>
    </>
  );
}
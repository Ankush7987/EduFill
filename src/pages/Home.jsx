import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import { db, auth } from '../firebase';
import SEO from '../components/SEO';
import Chatbot from '../components/Chatbot';
import Footer from '../components/Footer.jsx';

import Header from '../components/home/Header';
import FeedbackModal from '../components/home/FeedbackModal';
import CounsellingModal from '../components/home/CounsellingModal';
import CounsellingPlansSection from '../components/home/CounsellingPlansSection';
import HeroSection from '../components/home/HeroSection';
import ProductCardsSection from '../components/home/ProductCardsSection';
import TrustStrip from '../components/home/TrustStrip';
import HowItWorksSection from '../components/home/HowItWorksSection';
import ExamSlotSection from '../components/home/ExamSlotSection';
import StatsSection from '../components/home/StatsSection';
import FaqFeedbackCtaSection from '../components/home/FaqFeedbackCtaSection';

import { defaultContentFallback, examLayoutConfig } from '../data/homeData';
import { sanitizeText, scrollToSelector } from '../data/homeUtils';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://edufills.com').replace(/\/$/, '');
const FEEDBACK_COLLECTION = 'EduFill_Feedback';
const FEEDBACK_COOLDOWN_MS = 20 * 1000;

const initialFeedbackForm = {
  name: '',
  mobile: '',
  email: '',
  message: '',
};

function normalizeMobile(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function createHomeSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'EduFill',
        url: SITE_URL,
        logo: `${SITE_URL}/edufill-brand-logo.svg`,
        description:
          'Privacy-first online form filling platform for students with secure expert assistance, slot booking, college predictor and PYQ mock tests.',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+91-9752519051',
          contactType: 'customer support',
          areaServed: 'IN',
          availableLanguage: ['Hindi', 'English'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'EduFill',
        url: SITE_URL,
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
      },
      {
        '@type': 'Service',
        '@id': `${SITE_URL}/#service`,
        name: 'Online Exam Form Filling Support',
        provider: {
          '@id': `${SITE_URL}/#organization`,
        },
        areaServed: 'India',
        serviceType: 'Online form filling and student support',
        description:
          'EduFill helps students fill NEET, JEE, CUET and college admission forms with expert guidance, secure slot booking and document tools.',
      },
    ],
  };
}

export default function HomePage() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [isCounsellingModalOpen, setIsCounsellingModalOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(0);
  const [activeExams, setActiveExams] = useState({});
  const [dbExamContent, setDbExamContent] = useState(defaultContentFallback);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackType, setFeedbackType] = useState('feedback');
  const [feedbackForm, setFeedbackForm] = useState(initialFeedbackForm);

  const homeSchema = useMemo(() => createHomeSchema(), []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const controlsRef = doc(db, 'PlatformSettings', 'examControls');
    const contentRef = doc(db, 'PlatformSettings', 'examContent');

    const unsubAdmin = onSnapshot(
      controlsRef,
      (docSnap) => {
        setActiveExams(docSnap.exists() ? docSnap.data() : {});
      },
      (error) => {
        if (import.meta.env.DEV) {
          console.warn('Home exam controls listener failed:', error);
        }
        setActiveExams({});
      }
    );

    const unsubContent = onSnapshot(
      contentRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setDbExamContent(defaultContentFallback);
          return;
        }

        setDbExamContent({
          ...defaultContentFallback,
          ...docSnap.data(),
        });
      },
      (error) => {
        if (import.meta.env.DEV) {
          console.warn('Home exam content listener failed:', error);
        }
        setDbExamContent(defaultContentFallback);
      }
    );

    return () => {
      unsubAdmin();
      unsubContent();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user || null);
      },
      (error) => {
        if (import.meta.env.DEV) {
          console.warn('Home auth listener failed:', error);
        }
        setCurrentUser(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const finalExamsData = useMemo(() => {
    return examLayoutConfig.map((config) => ({
      ...config,
      ...(dbExamContent?.[config.id] || defaultContentFallback[config.id] || {}),
      isActive: Boolean(activeExams?.[config.id]),
    }));
  }, [activeExams, dbExamContent]);

  const openFeedback = (type = 'feedback') => {
    setFeedbackType(sanitizeText(type, 30) || 'feedback');
    setFeedbackOpen(true);
  };

  const closeFeedback = () => {
    setFeedbackOpen(false);
    setFeedbackType('feedback');
    setFeedbackForm(initialFeedbackForm);
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();

    const normalizedMobile = normalizeMobile(feedbackForm.mobile);
    const normalizedEmail = sanitizeText(feedbackForm.email, 120).toLowerCase();

    const payload = {
      type: sanitizeText(feedbackType, 30) || 'feedback',
      name: sanitizeText(feedbackForm.name, 80),
      mobile: normalizedMobile || null,
      email: normalizedEmail || null,
      message: sanitizeText(feedbackForm.message, 1000),
      status: 'Pending',
      source: 'homepage',
      pageUrl: window.location.href,
      userAgent: navigator.userAgent || 'unknown',
      createdAt: serverTimestamp(),
    };

    if (!payload.name || payload.name.length < 2) {
      alert('Please enter your valid name.');
      return;
    }

    if (!payload.message || payload.message.length < 10) {
      alert('Please write your message in at least 10 characters.');
      return;
    }

    if (payload.mobile && !/^[6-9]\d{9}$/.test(payload.mobile)) {
      alert('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!isValidEmail(payload.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    const lastFeedbackSubmit = Number(localStorage.getItem('edufill_home_feedback_last_submit') || 0);
    if (Date.now() - lastFeedbackSubmit < FEEDBACK_COOLDOWN_MS) {
      alert('Please wait a few seconds before submitting again.');
      return;
    }

    setFeedbackLoading(true);

    try {
      await addDoc(collection(db, FEEDBACK_COLLECTION), payload);
      localStorage.setItem('edufill_home_feedback_last_submit', String(Date.now()));
      alert('Thank you! Your feedback has been submitted.');
      closeFeedback();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Homepage feedback submit failed:', error);
      }

      alert('Failed to submit. Please try again or contact EduFill support.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const goToProduct = (route) => {
    if (!route) return;

    if (route.startsWith('#')) {
      scrollToSelector(route);
      return;
    }

    navigate(route);
  };

  const handleOpenExamPage = (exam) => {
    const route = exam?.pageRoute || `/apply/${exam?.id || ''}`;
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative selection:bg-emerald-200 pb-20 lg:pb-0 overflow-x-hidden">
      <SEO
        title="EduFill | Secure Online Form Filling, College Predictor & PYQ Mock Tests"
        description="EduFill helps students fill NEET, JEE, CUET and college admission forms online with privacy-first expert support, secure in-app chat, slot booking, college predictor and live PYQ mock tests."
        url="/"
        keywords="EduFill, online form filling, NEET form filling, JEE form filling, CUET form filling, secure form filling, cyber cafe alternative, college predictor, PYQ mock test, campus drive"
        image={`${SITE_URL}/seo-banner.jpg`}
        schema={homeSchema}
        schemaMarkup={homeSchema}
      />

      <script type="application/ld+json">
        {JSON.stringify(homeSchema)}
      </script>

      <CounsellingModal
        isOpen={isCounsellingModalOpen}
        onClose={() => setIsCounsellingModalOpen(false)}
      />

      <FeedbackModal
        isOpen={feedbackOpen}
        type={feedbackType}
        form={feedbackForm}
        loading={feedbackLoading}
        onClose={closeFeedback}
        onSubmit={handleFeedbackSubmit}
        onChange={setFeedbackForm}
      />

      <Header currentUser={currentUser} onOpenFeedback={openFeedback} />

      <main className="flex-1 w-full">
        <HeroSection />
        <ProductCardsSection onGoToProduct={goToProduct} />
        <TrustStrip />
        <HowItWorksSection />
        <ExamSlotSection exams={finalExamsData} onOpenExamPage={handleOpenExamPage} />
        <CounsellingPlansSection onOpenCounselling={() => setIsCounsellingModalOpen(true)} />
        <StatsSection />
        <FaqFeedbackCtaSection
          openFAQ={openFAQ}
          setOpenFAQ={setOpenFAQ}
          onOpenFeedback={openFeedback}
        />
      </main>

      <Footer />
      {Chatbot ? <Chatbot /> : null}

      <style>{`
        html,
        body {
          overflow-x: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

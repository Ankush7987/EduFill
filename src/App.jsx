import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async'; // 🌟 SEO Engine
import { Loader2, AlertTriangle } from 'lucide-react'; 

// 🌟 MAIN PAGE (Instant Load) 🌟
import HomePage from './pages/Home';

// 🚀 CODE SPLITTING (React.lazy - 10x Faster Load) 🚀
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));

const CampusDrive = lazy(() => import('./pages/CampusDrive'));
const ExamFormPage = lazy(() => import('./pages/ExamFormPage'));

const AdminPanel = lazy(() => import('./components/Admin'));
const AgentPanel = lazy(() => import('./components/AgentPanel'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const LiveTestPage = lazy(() => import('./pages/LiveTestPage'));
const CollegePredictor = lazy(() => import('./components/CollegePredictor'));

// 🌟 CUSTOM LOADING SCREEN 🌟
const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4" />
    <p className="text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse">Loading EduFill...</p>
  </div>
);

// 🌟 404 PAGE (Agar koi galat link par aaye) 🌟
const NotFoundScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
    <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
      <AlertTriangle size={48} />
    </div>
    <h1 className="text-4xl font-black text-gray-900 mb-2">404 - Page Not Found</h1>
    <p className="text-gray-500 font-medium mb-8">The page you are looking for doesn't exist or has been moved.</p>
    <Link to="/" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform active:scale-95">
      Return to Home
    </Link>
  </div>
);

export default function App() {
  return (
    <HelmetProvider>
      {/* 🌟 GLOBAL DEFAULT SEO TAGS 🌟 */}
      <Helmet>
        <title>EduFill | India's #1 Form Filling Portal</title>
        <meta name="description" content="Central India's leading platform for error-free competitive exam form filling, live mock tests, and AI college prediction." />
        <meta name="theme-color" content="#10B981" />
      </Helmet>

      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            
            {/* 🏠 Main Website View */}
            <Route path="/" element={<HomePage />} />
            
            {/* 📄 Legal & Info Pages */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsConditions />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />

            {/* 🏢 B2B Campus Drive */}
            <Route path="/campus-drive" element={<CampusDrive />} />

            {/* 🔐 Dashboards & Panels */}
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/agent" element={<AgentPanel />} />
            <Route path="/admin-secret-panel" element={<AdminDashboard />} />

            {/* 🚀 Premium Traffic Tools */}
            <Route path="/mock-test" element={<LiveTestPage />} />
            <Route path="/college-predictor" element={<CollegePredictor />} />

            {/* 📝 Exam Form Filling */}
            <Route path="/apply/:examId" element={<ExamFormPage />} />
            
            {/* 🛑 Catch-All 404 Route */}
            <Route path="*" element={<NotFoundScreen />} />

          </Routes>
        </Suspense>
      </Router>
    </HelmetProvider>
  );
}
import React, { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useParams,
  useLocation,
} from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Loader2, AlertTriangle } from 'lucide-react';

import HomePage from './pages/Home';

const Blogs = lazy(() => import('./pages/Blogs'));
const WriteBlog = lazy(() => import('./pages/WriteBlog'));

const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));

const CampusDrive = lazy(() => import('./pages/CampusDrive'));
const ExamFormPage = lazy(() => import('./pages/ExamFormPage'));
const BookSlot = lazy(() => import('./pages/BookSlot'));

const AdminPanel = lazy(() => import('./components/Admin'));
const AgentPanel = lazy(() => import('./pages/AgentPanel'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const LiveTestPage = lazy(() => import('./pages/LiveTestPage'));
const CollegePredictor = lazy(() => import('./components/CollegePredictor'));

const BlogPost = lazy(() => import('./pages/BlogPost'));

const ExamsPage = lazy(() => import('./pages/Exams'));
const AddExamAlert = lazy(() => import('./pages/AddExamAlert'));
const ExamDetails = lazy(() => import('./pages/ExamDetails'));

const Tools = lazy(() => import('./pages/Tools'));
const PhotoDateTool = lazy(() => import('./pages/PhotoDateTool'));
const PhotoSignResizer = lazy(() => import('./pages/PhotoSignResizer'));
const ImageToPdfMaker = lazy(() => import('./pages/ImageToPdfMaker'));
const PdfCompressor = lazy(() => import('./pages/PdfCompressor'));

const LiveConnect = lazy(() => import('./pages/LiveConnect'));
const AuthVaultWeb = lazy(() => import('./pages/AuthVaultWeb'));

const Feedback = lazy(() => import('./pages/Feedback'));

// 🚀 ADDED: Offline Camp Lazy Import
const OfflineCamp = lazy(() => import('./components/OfflineCamp'));

const SITE_URL = 'https://edufills.com';

const siteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'EduFill',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'EduFill',
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/exams?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('EduFill app error:', error, info);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({
        hasError: false,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
          <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={48} aria-hidden="true" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
            Something went wrong
          </h1>

          <p className="text-gray-500 font-medium mb-8 max-w-md">
            Please refresh the page or return to the home page.
          </p>

          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform active:scale-95"
          >
            Go to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const LoadingScreen = () => (
  <div
    className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
    role="status"
    aria-live="polite"
  >
    <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mb-4" aria-hidden="true" />

    <p className="text-gray-500 font-bold tracking-widest uppercase text-sm animate-pulse">
      Loading EduFill...
    </p>
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [pathname]);

  return null;
};

const LegacyFormsRedirect = () => {
  const { examId } = useParams();

  return <Navigate to={`/apply/${examId}`} replace />;
};

const LegacyBookSlotRedirect = () => <Navigate to="/book-slot" replace />;

const NotFoundScreen = () => (
  <>
    <Helmet>
      <title>404 Page Not Found | EduFill</title>
      <meta name="robots" content="noindex, nofollow" />
      <link rel="canonical" href={`${SITE_URL}/404`} />
    </Helmet>

    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle size={48} aria-hidden="true" />
      </div>

      <h1 className="text-4xl font-black text-gray-900 mb-2">
        404 - Page Not Found
      </h1>

      <p className="text-gray-500 font-medium mb-8">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        to="/"
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform active:scale-95"
      >
        Return to Home
      </Link>
    </div>
  </>
);

const AppRoutes = () => {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />

      <AppErrorBoundary resetKey={location.pathname}>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blog/:slug" element={<BlogPost />} />

            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsConditions />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />

            <Route path="/campus-drive" element={<CampusDrive />} />

            {/* 🚀 ADDED: Offline Camp Route */}
            <Route path="/offline-camp" element={<OfflineCamp />} />

            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/agent" element={<AgentPanel />} />
            <Route path="/admin-secret-panel" element={<AdminDashboard />} />
            <Route path="/admin/marketing/write-blog" element={<WriteBlog />} />

            <Route path="/mock-test" element={<LiveTestPage />} />
            <Route path="/mock-test/:testSlug" element={<LiveTestPage />} />

            <Route path="/college-predictor" element={<CollegePredictor />} />

            <Route path="/apply/:examId" element={<ExamFormPage />} />
            <Route path="/forms/:examId" element={<LegacyFormsRedirect />} />

            <Route path="/book-slot" element={<BookSlot />} />
            <Route path="/slot-booking" element={<LegacyBookSlotRedirect />} />
            <Route path="/booking" element={<LegacyBookSlotRedirect />} />

            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/admin/add-exam" element={<AddExamAlert />} />
            <Route path="/exam/:slug" element={<ExamDetails />} />

            <Route path="/tools" element={<Tools />} />
            <Route path="/tools/photo-date" element={<PhotoDateTool />} />
            <Route path="/tools/resizer" element={<PhotoSignResizer />} />
            <Route path="/tools/pdf-maker" element={<ImageToPdfMaker />} />
            <Route path="/tools/pdf-compressor" element={<PdfCompressor />} />

            <Route path="/live-connect" element={<LiveConnect />} />
            <Route path="/vault" element={<AuthVaultWeb />} />
            <Route path="/feedback" element={<Feedback />} />

            <Route path="*" element={<NotFoundScreen />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </>
  );
};

export default function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <html lang="en-IN" />

        <title>EduFill | India&apos;s #1 Form Filling Portal</title>

        <meta
          name="description"
          content="EduFill helps students fill exam forms, book expert form-filling slots, resize documents, take live mock tests, and use AI college prediction with secure digital vault support."
        />
        <meta
          name="keywords"
          content="EduFill, exam form filling, book form filling slot, NEET form help, JEE form help, document vault, photo signature resizer, AI college predictor"
        />
        <meta name="theme-color" content="#10B981" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="canonical" href={SITE_URL} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="EduFill | India&apos;s #1 Form Filling Portal" />
        <meta
          property="og:description"
          content="Book expert form-filling slots, fill exam forms error-free, resize documents, take mock tests, and access EduFill Vault securely."
        />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content="EduFill" />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="EduFill | India&apos;s #1 Form Filling Portal" />
        <meta
          name="twitter:description"
          content="Secure exam form filling, slot booking, document tools, live mocks, AI college prediction, and EduFill Vault."
        />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

        <script type="application/ld+json">
          {JSON.stringify(siteStructuredData)}
        </script>
      </Helmet>

      <Router>
        <AppRoutes />
      </Router>
    </HelmetProvider>
  );
}
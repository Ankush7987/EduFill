import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import {
  Loader2,
  CheckCircle,
  Search,
  XCircle,
  Zap,
  ShieldCheck,
  Clock,
  ArrowLeft,
  MessageCircle,
  LogOut,
  LogIn,
  History,
  Upload,
  X,
  FileText,
  UserRound,
  Phone,
  GraduationCap,
  Lock,
  Check,
  ArrowRight,
  BadgeCheck,
  Headphones,
  CloudUpload,
  Sparkles,
  Eye,
  EyeOff,
  Home,
  Mail,
  Smartphone,
} from 'lucide-react';
import SEO from '../components/SEO';
import { io } from 'socket.io-client';

import LiveChatBox from '../components/LiveChatBox';
import DocumentUploader from '../components/DocumentUploader';

const LIVE_API_BASE = (
  import.meta.env.VITE_LIVE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:5000'
).replace(/\/$/, '');

const liveSocket = io(LIVE_API_BASE, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

const toBackendRequestId = (request = {}) =>
  String(request?._id || request?.id || request?.requestId || request?.backendRequestId || request?.firebaseRequestId || '').trim();

const getBackendStatus = (request = {}) =>
  String(request?.status || '').trim();

const isSearchingStatus = (status = '') =>
  ['Searching', 'Offered', 'QUEUED', 'OFFERED'].includes(String(status).trim());

const isAcceptedStatus = (status = '') =>
  ['Accepted', 'In Progress', 'ACCEPTED', 'IN_PROGRESS'].includes(String(status).trim());

const isCompletedStatus = (status = '') =>
  ['Completed', 'COMPLETED', 'Success', 'Done'].includes(String(status).trim());

const getFirebaseIdToken = async () => {
  if (!auth.currentUser) return '';
  try {
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error('Unable to get Firebase ID token:', error);
    return '';
  }
};

const liveApiFetch = async (path, options = {}) => {
  const token = await getFirebaseIdToken();
  const currentUser = auth.currentUser;
  const response = await fetch(`${LIVE_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(currentUser?.uid ? { 'x-user-id': currentUser.uid } : {}),
      ...(currentUser?.email ? { 'x-user-email': currentUser.email } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }
  return data;
};

const toPastFormDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value?.seconds) return new Date(value.seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};


const SERVICES = [
  { value: 'NEET UG', label: 'NEET UG Form Filling' },
  { value: 'JEE Main', label: 'JEE Main Form Filling' },
  { value: 'CUET UG', label: 'CUET UG Form Filling' },
  { value: 'College Form', label: 'Other College Form' },
];

const TRUST_POINTS = [
  {
    icon: <Clock size={22} />,
    title: 'Zero Wait Time',
    desc: 'Available expert se quick connection.',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Privacy First',
    desc: 'Chat app ke andar, data safe.',
  },
  {
    icon: <FileText size={22} />,
    title: 'Form Tracking',
    desc: 'Past forms aur status ek jagah.',
  },
];

const DOCUMENT_ITEMS = [
  { key: 'profilePicUrl', label: 'Passport Photo', icon: '🖼️' },
  { key: 'signatureUrl', label: 'Signature', icon: '✍️' },
  { key: 'aadhaarUrl', label: 'Aadhaar Card', icon: '🪪' },
  { key: 'tenthUrl', label: '10th Marksheet', icon: '📄' },
  { key: 'twelfthUrl', label: '12th Marksheet', icon: '📄' },
  { key: 'domicileUrl', label: 'Domicile / Niwas', icon: '🏠' },
  { key: 'casteUrl', label: 'Caste Certificate', icon: '📜' },
  { key: 'thumbUrl', label: 'Thumb Impression', icon: '👍' },
  { key: 'otherUrl', label: 'Other Document', icon: '📎' },
];

const normalizeDocuments = (docs = {}) => {
  if (!docs || typeof docs !== 'object') return {};

  const normalized = { ...docs };

  // Support common alternate keys so old uploads also show correctly.
  const aliases = {
    photoUrl: 'profilePicUrl',
    passportPhotoUrl: 'profilePicUrl',
    profilePhotoUrl: 'profilePicUrl',
    signUrl: 'signatureUrl',
    signature: 'signatureUrl',
    aadhaar: 'aadhaarUrl',
    aadharUrl: 'aadhaarUrl',
    class10Url: 'tenthUrl',
    tenthMarksheetUrl: 'tenthUrl',
    class12Url: 'twelfthUrl',
    twelfthMarksheetUrl: 'twelfthUrl',
    domicile: 'domicileUrl',
    niwasUrl: 'domicileUrl',
    caste: 'casteUrl',
    thumb: 'thumbUrl',
  };

  Object.entries(aliases).forEach(([oldKey, newKey]) => {
    if (!normalized[newKey] && normalized[oldKey]) normalized[newKey] = normalized[oldKey];
  });

  return normalized;
};

const getUploadedDocuments = (docs = {}) => {
  const normalized = normalizeDocuments(docs);
  return DOCUMENT_ITEMS
    .map((item) => ({ ...item, url: normalized[item.key] }))
    .filter((item) => Boolean(item.url));
};

const getStatusText = (data) =>
  String(
    data?.status ||
      data?.formStatus ||
      data?.applicationStatus ||
      data?.currentStatus ||
      ''
  )
    .trim()
    .toLowerCase();

const isCompletedLikeStatus = (data) => {
  const status = getStatusText(data);
  return (
    status === 'completed' ||
    status === 'success' ||
    status === 'done' ||
    status === 'form completed' ||
    status.includes('complete') ||
    status.includes('success') ||
    data?.completed === true ||
    data?.isCompleted === true ||
    Boolean(data?.completedAt)
  );
};

const isEmailPasswordUnverified = (currentUser) =>
  Boolean(
    currentUser &&
      currentUser.emailVerified === false &&
      currentUser.providerData?.some((provider) => provider.providerId === 'password')
  );

export default function LiveConnect() {
  const navigate = useNavigate();
  const googleProvider = new GoogleAuthProvider();

  // ==========================================
  // 🔐 AUTH & PROFILE STATES
  // ==========================================
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [userData, setUserData] = useState({});
  const [currentScreen, setCurrentScreen] = useState('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ==========================================
  // 🚀 LIVE CONNECT & MODAL STATES
  // ==========================================
  const [form, setForm] = useState({ name: '', exam: 'NEET UG', mobile: '' });
  const [step, setStep] = useState('form'); // 'form', 'searching', 'matched', 'success'
  const [requestId, setRequestId] = useState(null);
  const [agentDetails, setAgentDetails] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [pastForms, setPastForms] = useState([]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [vaultDocuments, setVaultDocuments] = useState({});

  const reqIdRef = useRef(null);
  const stepRef = useRef('form');

  useEffect(() => {
    reqIdRef.current = requestId;
  }, [requestId]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // ==========================================
  // 🧠 1. CORE AUTHENTICATION EFFECT
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'Users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          setIsProfileComplete(false);
          setFullName(currentUser.displayName || '');
          setEmail(currentUser.email || '');
          setCurrentScreen('complete_profile');
        } else {
          setIsProfileComplete(true);
          const data = userDocSnap.data();
          const docs = normalizeDocuments(data.documents || {});
          setUserData({ ...data, documents: docs });
          setVaultDocuments(docs);
          setForm((prev) => ({
            ...prev,
            name: data.fullName || '',
            mobile: data.phone || '',
          }));
        }
      } else {
        setUserData({});
        setVaultDocuments({});
      }
      setUser(currentUser);
      setAuthChecking(false);
    });

    return unsubscribe;
  }, []);

  // Keep vault documents live so Upload modal can show already uploaded docs
  // immediately after upload/replace without page refresh.
  useEffect(() => {
    if (!user?.uid || !isProfileComplete) return undefined;

    const userDocRef = doc(db, 'Users', user.uid);
    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data() || {};
      const docs = normalizeDocuments(data.documents || {});

      setUserData((prev) => ({ ...prev, ...data, documents: docs }));
      setVaultDocuments(docs);
    });

    return () => unsub();
  }, [user?.uid, isProfileComplete]);

  // ==========================================
  // 🧠 2. LIVE CONNECT DATA EFFECT (BACKEND + SOCKET)
  // ==========================================
  const applyBackendRequestState = (request, { keepSuccess = true } = {}) => {
    if (!request) {
      if (keepSuccess && stepRef.current === 'success') {
        setStep('success');
        setShowChat(false);
      } else {
        setRequestId(null);
        reqIdRef.current = null;
        setAgentDetails(null);
        setShowChat(false);
        setStep('form');
      }
      return;
    }

    const id = toBackendRequestId(request);
    const status = getBackendStatus(request);

    if (id) {
      setRequestId(id);
      reqIdRef.current = id;
    }

    setForm((prev) => ({
      ...prev,
      name: request.name || prev.name || userData.fullName || '',
      exam: request.exam || prev.exam || 'NEET UG',
      mobile: request.mobile || prev.mobile || userData.phone || '',
    }));

    if (isCompletedStatus(status) || isCompletedLikeStatus(request)) {
      setStep('success');
      setShowChat(false);
      setAgentDetails(null);
      return;
    }

    if (isAcceptedStatus(status)) {
      setAgentDetails({
        name: request.acceptedAgentName || request.agentName || request.offerAgentName || 'EduFill Expert',
        phone: request.agentPhone || '',
      });
      setStep('matched');
      return;
    }

    if (isSearchingStatus(status)) {
      setAgentDetails(null);
      setShowChat(false);
      setStep('searching');
      return;
    }

    if (status === 'Cancelled' || status === 'CANCELLED' || status === 'Failed' || status === 'FAILED') {
      setRequestId(null);
      reqIdRef.current = null;
      setAgentDetails(null);
      setShowChat(false);
      setStep('form');
    }
  };

  const loadBackendRequests = async ({ silent = false } = {}) => {
    if (!user || !isProfileComplete || isEmailPasswordUnverified(user)) return;

    try {
      const data = await liveApiFetch('/api/live/student/requests');
      const requests = Array.isArray(data?.requests) ? data.requests : [];

      const historyData = requests.filter((request) => {
        const status = getBackendStatus(request);
        return isCompletedStatus(status) || ['Cancelled', 'CANCELLED', 'Failed', 'FAILED'].includes(status);
      });

      setPastForms(historyData.sort((a, b) => {
        const aDate = toPastFormDate(a.completedAt || a.updatedAt || a.createdAt || a.timestamp);
        const bDate = toPastFormDate(b.completedAt || b.updatedAt || b.createdAt || b.timestamp);
        return (bDate?.getTime?.() || 0) - (aDate?.getTime?.() || 0);
      }));

      const active = requests.find((request) => {
        const status = getBackendStatus(request);
        return isSearchingStatus(status) || isAcceptedStatus(status);
      });

      applyBackendRequestState(active, { keepSuccess: true });
    } catch (error) {
      if (!silent) console.error('Unable to load live requests:', error);
    }
  };

  useEffect(() => {
    if (!user || !isProfileComplete || isEmailPasswordUnverified(user)) return undefined;

    loadBackendRequests({ silent: true });

    if (!liveSocket.connected) liveSocket.connect();

    liveSocket.emit('live_register_student', { userId: user.uid });

    const handleSearching = (payload = {}) => {
      const id = payload.requestId || payload.firebaseRequestId || reqIdRef.current;
      if (id) {
        setRequestId(id);
        reqIdRef.current = id;
      }
      setAgentDetails(null);
      setShowChat(false);
      setStep('searching');
    };

    const handleAccepted = (payload = {}) => {
      const id = payload.requestId || payload.firebaseRequestId || reqIdRef.current;
      if (id) {
        setRequestId(id);
        reqIdRef.current = id;
      }
      setAgentDetails({
        name: payload.agentName || 'EduFill Expert',
        phone: payload.agentPhone || '',
      });
      setShowChat(false);
      setStep('matched');
      loadBackendRequests({ silent: true });
    };

    const handleCompleted = (payload = {}) => {
      const id = payload.requestId || payload.firebaseRequestId || reqIdRef.current;
      if (id) {
        setRequestId(id);
        reqIdRef.current = id;
      }
      setShowChat(false);
      setStep('success');
      loadBackendRequests({ silent: true });
    };

    const handleCancelled = () => {
      setRequestId(null);
      reqIdRef.current = null;
      setAgentDetails(null);
      setShowChat(false);
      setStep('form');
      loadBackendRequests({ silent: true });
    };

    liveSocket.on('live:request_searching', handleSearching);
    liveSocket.on('live:request_accepted', handleAccepted);
    liveSocket.on('live:request_completed', handleCompleted);
    liveSocket.on('live:request_cancelled', handleCancelled);

    const poller = window.setInterval(() => loadBackendRequests({ silent: true }), 15000);

    return () => {
      window.clearInterval(poller);
      liveSocket.off('live:request_searching', handleSearching);
      liveSocket.off('live:request_accepted', handleAccepted);
      liveSocket.off('live:request_completed', handleCompleted);
      liveSocket.off('live:request_cancelled', handleCancelled);
    };
  }, [user?.uid, isProfileComplete]);

  // Rare case recovery:
  // Sometimes the agent/admin completes the student record in Other_Students,
  // but Live_Form_Requests remains stuck on Accepted due to network/socket delay.
  // This listener safely syncs that completed state back to the live request
  // and releases the student from the expert screen.
  useEffect(() => {
    if (!user || !isProfileComplete || !requestId || /^[0-9a-fA-F]{24}$/.test(String(requestId))) return undefined;

    const q = query(collection(db, 'Other_Students'), where('liveRequestId', '==', requestId));

    const unsub = onSnapshot(q, async (snap) => {
      let completedStudent = null;

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (isCompletedLikeStatus(data)) {
          completedStudent = { id: docSnap.id, ...data };
        }
      });

      if (!completedStudent) return;

      setStep('success');
      setShowChat(false);

      try {
        await updateDoc(doc(db, 'Live_Form_Requests', requestId), {
          status: 'Completed',
          completedAt: completedStudent.completedAt || serverTimestamp(),
          applicationNumber: completedStudent.applicationNumber || 'N/A',
          completedBy: completedStudent.assignedTo || completedStudent.agentName || null,
        });
      } catch (error) {
        console.error('Live request completion sync failed:', error);
      }
    });

    return () => unsub();
  }, [user, isProfileComplete, requestId]);

  // ==========================================
  // 📝 3. AUTH HANDLERS
  // ==========================================
  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      alert(`Google Sign-In Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !password) return alert('Enter Email and Password!');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim().toLowerCase(), password);
    } catch (error) {
      alert('Login Error: Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !qualification || !password) return alert('Fill all fields!');
    if (phone.length !== 10) return alert('Enter a valid 10-digit mobile number!');

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await updateProfile(userCred.user, { displayName: fullName });
      await setDoc(doc(db, 'Users', userCred.user.uid), {
        uid: userCred.user.uid,
        fullName,
        email: email.trim().toLowerCase(),
        phone,
        qualification,
        signupMethod: 'email',
        role: 'student',
        documents: {},
        createdAt: serverTimestamp(),
      });
      await sendEmailVerification(userCred.user);
      setIsProfileComplete(true);
      setCurrentScreen('login');
      alert('Account created successfully! Please verify your email.');
    } catch (error) {
      alert(error.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const submitGoogleExtraDetails = async (e) => {
    e.preventDefault();
    if (!phone || !qualification) return alert('Please fill all details!');
    if (phone.length !== 10) return alert('Invalid Mobile Number!');

    setLoading(true);
    try {
      await setDoc(doc(db, 'Users', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        fullName: auth.currentUser.displayName,
        email: auth.currentUser.email,
        phone,
        qualification,
        signupMethod: 'google',
        role: 'student',
        documents: {},
        createdAt: serverTimestamp(),
      });
      setIsProfileComplete(true);
      window.location.reload();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkEmailVerified = async () => {
    if (!auth.currentUser) {
      alert('Please login again to check verification.');
      return;
    }

    setLoading(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        alert('Verified!');
        setUser(auth.currentUser);
        window.location.reload();
      } else {
        alert('Not verified yet. Check your inbox.');
      }
    } catch (error) {
      alert('Unable to check verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentScreen('login');
  };

  // ==========================================
  // ⚡ 4. LIVE CONNECT HANDLERS
  // ==========================================
  const handleRequest = async (e) => {
    e.preventDefault();

    if (!form.name || !form.mobile || !form.exam) {
      alert('Please fill all details.');
      return;
    }

    if (form.mobile.length !== 10) {
      alert('Please enter valid 10-digit WhatsApp number.');
      return;
    }

    if (!user || isEmailPasswordUnverified(user)) {
      alert('Please verify your email before using Live Expert.');
      return;
    }

    setStep('searching');

    try {
      const uploadedDocs = normalizeDocuments(vaultDocuments || userData.documents || {});
      const data = await liveApiFetch('/api/live/student/request', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          mobile: form.mobile,
          exam: form.exam,
          userId: user.uid,
          userEmail: user.email,
          userPhone: userData.phone || form.mobile,
          documents: uploadedDocs,
          vaultDocuments: uploadedDocs,
        }),
      });

      const request = data.request || {};
      const id = toBackendRequestId(request);
      if (id) {
        setRequestId(id);
        reqIdRef.current = id;
      }

      applyBackendRequestState(request, { keepSuccess: false });

      if (!liveSocket.connected) liveSocket.connect();
      liveSocket.emit('live_register_student', { userId: user.uid });
      await loadBackendRequests({ silent: true });
    } catch (error) {
      console.error(error);
      setStep('form');
      alert(error.message || 'Network error! Please try again.');
    }
  };

  const cancelRequest = async () => {
    if (!requestId) return;

    try {
      await liveApiFetch(`/api/live/student/request/${requestId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ userId: user.uid, userEmail: user.email }),
      });
      setRequestId(null);
      reqIdRef.current = null;
      setAgentDetails(null);
      setShowChat(false);
      setStep('form');
      await loadBackendRequests({ silent: true });
    } catch (error) {
      console.error(error);
      alert(error.message || 'Unable to cancel request.');
    }
  };

  const handleChatCompletion = async () => {
    // Closing chat must NOT mark the form completed.
    // Success should come only after the expert/agent clicks Mark Done.
    setShowChat(false);

    if (!reqIdRef.current) {
      setStep('matched');
      return;
    }

    try {
      const requestSnap = await getDoc(doc(db, 'Live_Form_Requests', reqIdRef.current));

      if (requestSnap.exists() && isCompletedLikeStatus(requestSnap.data())) {
        setStep('success');
      } else {
        setStep('matched');
      }
    } catch (error) {
      console.error('Unable to verify completion status:', error);
      setStep('matched');
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600 w-12 h-12" />
      </div>
    );
  }

  const studentFirstName =
    userData.fullName?.split(' ')[0] ||
    user?.displayName?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Student';

  const canAccessLiveConnect = Boolean(user && isProfileComplete && !isEmailPasswordUnverified(user));

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col font-sans relative overflow-x-hidden selection:bg-emerald-200/70 pb-20 lg:pb-0">
      <SEO
        title="Live Form Expert | EduFill Secure Online Form Filling"
        description="Connect with EduFill verified live form experts for NEET, JEE, CUET and college form filling with secure in-app chat and document support."
        url="/live-connect"
      />

      {/* Upload Modal */}
      {isUploadModalOpen && user && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-t-[2rem] sm:rounded-[1.75rem] p-4 sm:p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto relative shadow-2xl animate-in zoom-in-95 border border-white">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full text-gray-600 transition-colors"
              aria-label="Close upload modal"
            >
              <X size={20} />
            </button>

            <div className="mb-4 border-b border-gray-100 pb-4 pr-10">
              <h3 className="text-xl font-black text-gray-900">Upload Documents</h3>
              <p className="text-sm text-gray-500 font-medium">
                Securely upload documents to your vault for the expert.
              </p>
            </div>

            <VaultDocumentUploadPanel
              user={user}
              form={form}
              userData={userData}
              vaultDocuments={vaultDocuments}
              setVaultDocuments={setVaultDocuments}
              setUserData={setUserData}
              onClose={() => setIsUploadModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex justify-between items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/edufill-brand-logo.svg?v=2"
              alt="EduFill Logo"
              className="h-8 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-lg sm:text-2xl font-black tracking-tight text-gray-900">
              Edu<span className="text-emerald-600">Fill</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {canAccessLiveConnect ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/vault')}
                  className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-100"
                >
                  <UserRound size={16} />
                  Hi, {studentFirstName}
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-500 flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-colors"
                >
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate(-1)}
                className="text-gray-500 hover:text-emerald-600 flex items-center gap-2 text-sm font-bold transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Background Shapes */}
      <div className="pointer-events-none hidden sm:block absolute -top-40 -left-20 h-96 w-96 rounded-full bg-emerald-100 blur-3xl" />
      <div className="pointer-events-none hidden sm:block absolute top-20 right-0 h-80 w-80 rounded-full bg-blue-100/80 blur-3xl" />
      <div className="pointer-events-none hidden sm:block absolute bottom-0 left-1/2 h-96 w-96 rounded-full bg-cyan-100/60 blur-3xl" />

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-5 sm:py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-5 sm:gap-8 lg:gap-12 items-start lg:items-center">
        {/* Left Side */}
        <section className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-xs font-black uppercase tracking-widest text-emerald-700 shadow-sm mb-4 sm:mb-5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Privacy-first live form service
          </div>

          <h1 className="text-[2rem] min-[380px]:text-[2.35rem] sm:text-5xl lg:text-[4.25rem] font-black text-gray-950 leading-[1.05] tracking-tight mb-4 sm:mb-5">
            Hire an EduFill <br />
            <span className="text-emerald-600">Live Expert</span> for your form.
          </h1>

          <p className="text-xs min-[380px]:text-sm sm:text-lg text-gray-600 font-semibold leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-5 sm:mb-7">
            Expert aapka form fill karega, aap secure in-app chat se details/OTP share kar sakte ho.
            Mobile number expert ko visible nahi hota.
          </p>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-3xl mx-auto lg:mx-0 mb-5 sm:mb-7">
            {TRUST_POINTS.map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-3 sm:p-4 shadow-sm text-left">
                <div className="mb-2 sm:mb-3 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600">
                  {item.icon}
                </div>
                <h3 className="text-[10px] sm:text-sm font-black text-gray-950 leading-tight">{item.title}</h3>
                <p className="hidden min-[430px]:block mt-1 text-[10px] sm:text-xs font-semibold leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.25rem] sm:rounded-[1.5rem] border border-emerald-100 bg-white/80 p-3 sm:p-5 shadow-sm max-w-2xl mx-auto lg:mx-0">
            <div className="grid grid-cols-1 min-[430px]:grid-cols-3 gap-2 sm:gap-3 text-left">
              <MiniInfo icon={<Lock size={17} />} title="No Number Sharing" text="Private communication" />
              <MiniInfo icon={<CloudUpload size={17} />} title="Vault Upload" text="Docs reuse anytime" />
              <MiniInfo icon={<Headphones size={17} />} title="Expert Support" text="Live assistance" />
            </div>
          </div>
        </section>

        {/* Right Side Card */}
        <section className="w-full">
          {!canAccessLiveConnect ? (
            <AuthCard
              user={user}
              currentScreen={currentScreen}
              setCurrentScreen={setCurrentScreen}
              loading={loading}
              handleGoogleAuth={handleGoogleAuth}
              handleLogin={handleLogin}
              handleEmailSignup={handleEmailSignup}
              submitGoogleExtraDetails={submitGoogleExtraDetails}
              checkEmailVerified={checkEmailVerified}
              handleLogout={handleLogout}
              loginEmail={loginEmail}
              setLoginEmail={setLoginEmail}
              password={password}
              setPassword={setPassword}
              fullName={fullName}
              setFullName={setFullName}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              qualification={qualification}
              setQualification={setQualification}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          ) : (
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-xl sm:shadow-2xl border border-gray-100 overflow-hidden relative">
              <div className="bg-gradient-to-br from-white to-emerald-50/40 p-4 sm:p-6 md:p-7 min-h-[auto] sm:min-h-[420px]">
                {step === 'form' && (
                  <RequestForm
                    form={form}
                    setForm={setForm}
                    handleRequest={handleRequest}
                    setIsUploadModalOpen={setIsUploadModalOpen}
                    pastForms={pastForms}
                    navigate={navigate}
                    vaultDocuments={vaultDocuments}
                  />
                )}

                {step === 'searching' && (
                  <SearchingState cancelRequest={cancelRequest} />
                )}

                {step === 'matched' && agentDetails && (
                  <MatchedState
                    agentDetails={agentDetails}
                    showChat={showChat}
                    setShowChat={setShowChat}
                    setIsUploadModalOpen={setIsUploadModalOpen}
                    navigate={navigate}
                    requestId={requestId}
                    user={user}
                    handleChatCompletion={handleChatCompletion}
                    vaultDocuments={vaultDocuments}
                  />
                )}

                {step === 'success' && (
                  <SuccessState
                    setStep={setStep}
                    setRequestId={setRequestId}
                    navigate={navigate}
                  />
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Mobile quick bar */}
      {canAccessLiveConnect && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_25px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 py-2 flex flex-col items-center justify-center gap-1 text-[10px] font-black"
            >
              <Upload size={17} />
              {getUploadedDocuments(vaultDocuments).length ? 'Docs ✓' : 'Docs'}
            </button>
            <button
              onClick={() => navigate('/vault')}
              className="rounded-2xl bg-gray-50 text-gray-700 border border-gray-100 py-2 flex flex-col items-center justify-center gap-1 text-[10px] font-black"
            >
              <FileText size={17} />
              Vault
            </button>
            <button
              onClick={() => step === 'matched' ? setShowChat(true) : null}
              className={`rounded-2xl py-2 flex flex-col items-center justify-center gap-1 text-[10px] font-black ${
                step === 'matched' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <MessageCircle size={17} />
              Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VaultDocumentUploadPanel({ user, form, userData, vaultDocuments, setVaultDocuments, setUserData, onClose }) {
  const uploadedDocs = getUploadedDocuments(vaultDocuments);
  const [showUploader, setShowUploader] = useState(uploadedDocs.length === 0);

  useEffect(() => {
    if (uploadedDocs.length === 0) setShowUploader(true);
  }, [uploadedDocs.length]);

  const refreshVaultDocuments = async () => {
    if (!user?.uid) return;

    try {
      const snap = await getDoc(doc(db, 'Users', user.uid));
      if (!snap.exists()) return;

      const data = snap.data() || {};
      const docs = normalizeDocuments(data.documents || {});
      setVaultDocuments(docs);
      setUserData((prev) => ({ ...prev, ...data, documents: docs }));
    } catch (error) {
      console.error('Unable to refresh vault documents:', error);
    }
  };

  return (
    <div className="space-y-5">
      {uploadedDocs.length > 0 && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h4 className="text-base font-black text-gray-900 flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-600" /> Uploaded Documents
              </h4>
              <p className="text-xs font-bold text-gray-500 mt-0.5">
                Ye documents aapke Vault me saved hain. Expert/Admin/Agent ko bhi yahi documents show honge.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUploader((prev) => !prev)}
              className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-xl text-xs font-black shadow-sm"
            >
              {showUploader ? 'Hide Upload Form' : 'Replace / Add More'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {uploadedDocs.map((item) => (
              <div key={item.key} className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-gray-900 truncate">{item.label}</p>
                    <p className="text-[10px] font-bold text-emerald-600 mt-0.5">Uploaded ✓</p>
                    <div className="flex gap-2 mt-3">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1"
                      >
                        <Eye size={14} /> View
                      </a>
                      <button
                        type="button"
                        onClick={() => setShowUploader(true)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1"
                      >
                        <Upload size={14} /> Replace
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showUploader && (
        <div className="rounded-2xl border border-gray-100 bg-white p-3 sm:p-4">
          {uploadedDocs.length > 0 && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs font-bold text-amber-700">
              Replace ke liye niche same document field me naya file upload karein. Upload complete hote hi old file update ho jayegi.
            </div>
          )}

          <DocumentUploader
            studentId={user.uid}
            collectionName="Users"
            studentName={form.name || userData.fullName}
            category="Online Student"
            existingDocuments={vaultDocuments}
            onComplete={async () => {
              await refreshVaultDocuments();
              alert('Document Saved in Vault!');
              setShowUploader(false);
            }}
          />
        </div>
      )}

      {uploadedDocs.length > 0 && (
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl shadow-lg"
        >
          Done
        </button>
      )}
    </div>
  );
}

function AuthCard({
  user,
  currentScreen,
  setCurrentScreen,
  loading,
  handleGoogleAuth,
  handleLogin,
  handleEmailSignup,
  submitGoogleExtraDetails,
  checkEmailVerified,
  handleLogout,
  loginEmail,
  setLoginEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  qualification,
  setQualification,
  showPassword,
  setShowPassword,
}) {
  return (
    <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-xl sm:shadow-2xl border border-gray-100 p-4 sm:p-7 animate-in fade-in zoom-in-95">
      {isEmailPasswordUnverified(user) ? (
        <div className="text-center py-6">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Mail size={32} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Verify your Email</h3>
          <p className="text-sm text-gray-500 font-medium mb-8">
            Please check your inbox and click the verification link.
          </p>
          <button
            onClick={checkEmailVerified}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-lg mb-3"
          >
            {loading ? 'Checking...' : 'Refresh Status'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 hover:bg-red-100 font-bold py-3.5 rounded-xl"
          >
            Logout
          </button>
        </div>
      ) : currentScreen === 'complete_profile' ? (
        <div>
          <CardHeader
            icon={<UserRound size={28} />}
            title="Complete Profile"
            text="Live Expert access ke liye basic student details complete karein."
          />

          <form onSubmit={submitGoogleExtraDetails} className="space-y-4 text-left">
            <FieldLabel label="Mobile Number" />
            <input
              type="tel"
              maxLength="10"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-ui"
              placeholder="10-digit mobile number"
            />

            <FieldLabel label="Highest Qualification" />
            <QualificationPills qualification={qualification} setQualification={setQualification} />

            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
            <button type="button" onClick={handleLogout} className="w-full text-red-500 font-bold text-sm mt-3">
              Cancel
            </button>
          </form>
        </div>
      ) : currentScreen === 'signup' ? (
        <div>
          <button
            onClick={() => setCurrentScreen('login')}
            className="text-gray-400 hover:text-gray-800 font-bold text-xs flex items-center gap-1 mb-4"
          >
            <ArrowLeft size={14} /> Back to Login
          </button>

          <CardHeader
            icon={<UserRound size={28} />}
            title="Create Account"
            text="EduFill account banao aur live expert connect karo."
          />

          <form onSubmit={handleEmailSignup} className="space-y-3">
            <input
              type="text"
              required
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-ui"
            />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-ui"
            />
            <input
              type="tel"
              maxLength="10"
              required
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-ui"
            />

            <QualificationPills qualification={qualification} setQualification={setQualification} />

            <PasswordInput
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              placeholder="Create Password"
            />

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
          </form>
        </div>
      ) : (
        <div className="text-center">
          <CardHeader
            icon={<LogIn size={30} />}
            title="Login / SignUp"
            text="Sign in securely to connect with experts and track your forms."
            centered
          />

          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-800 font-bold py-3.5 rounded-xl flex justify-center items-center gap-3 mb-5 transition-all active:scale-95"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-5 h-5"
              alt="Google"
            />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <FieldLabel label="Email" />
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="input-ui"
                placeholder="student@email.com"
              />
            </div>

            <div>
              <FieldLabel label="Password" />
              <PasswordInput
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Login / SignUp'}
            </button>
          </form>

          <p className="text-sm text-gray-500 font-bold mt-5">
            New student?{' '}
            <button
              type="button"
              onClick={() => setCurrentScreen('signup')}
              className="text-emerald-600 cursor-pointer hover:underline font-black"
            >
              Create Account
            </button>
          </p>
        </div>
      )}

      <style>{`
        html, body { overflow-x: hidden; }
        .input-ui {
          width: 100%;
          background: #f8fafc;
          border: 2px solid #e5e7eb;
          padding: 0.82rem;
          border-radius: 0.9rem;
          outline: none;
          font-weight: 700;
          color: #1f2937;
        }
        .input-ui:focus {
          background: white;
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12);
        }
        .btn-primary {
          width: 100%;
          background: #059669;
          color: white;
          font-weight: 900;
          padding: 0.95rem;
          border-radius: 1rem;
          box-shadow: 0 12px 28px rgba(5,150,105,.18);
          transition: .2s;
        }
        .btn-primary:hover {
          background: #047857;
        }
      `}</style>
    </div>
  );
}

function RequestForm({ form, setForm, handleRequest, setIsUploadModalOpen, pastForms, navigate, vaultDocuments }) {
  const uploadedDocsCount = getUploadedDocuments(vaultDocuments).length;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col min-[430px]:flex-row min-[430px]:justify-between min-[430px]:items-start gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Connect in 60s
          </div>
          <h3 className="text-xl sm:text-3xl font-black text-gray-950 leading-tight">Start Live Request</h3>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Expert ko details milte hi process start hogi.</p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          type="button"
          className="w-full min-[430px]:w-auto bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors border border-emerald-100 shadow-sm shrink-0"
        >
          <Upload size={14} /> {uploadedDocsCount ? `${uploadedDocsCount} Docs Uploaded` : 'Upload Docs'}
        </button>
      </div>

      <form onSubmit={handleRequest} className="space-y-4 mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3 sm:space-y-4">
          <InputWithIcon
            label="Student Name"
            icon={<UserRound size={17} />}
            value={form.name}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="Enter your full name"
          />

          <InputWithIcon
            label="WhatsApp Number"
            icon={<Smartphone size={17} />}
            type="tel"
            maxLength="10"
            value={form.mobile}
            onChange={(value) => setForm({ ...form, mobile: value })}
            placeholder="10-digit number"
          />

          <div>
            <FieldLabel label="Exam / Service" />
            <select
              value={form.exam}
              onChange={(e) => setForm({ ...form, exam: e.target.value })}
              className="input-ui"
            >
              {SERVICES.map((service) => (
                <option key={service.value} value={service.value}>
                  {service.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-black text-base sm:text-lg py-4 rounded-2xl shadow-[0_12px_30px_rgba(5,150,105,0.22)] active:scale-95 flex justify-center items-center gap-2"
        >
          <Zap size={22} className="text-yellow-300" fill="currentColor" /> Find Expert Live
        </button>
      </form>

      {pastForms.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-5">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <History size={14} /> Your Past Forms
            </h4>
            <button onClick={() => navigate('/vault')} className="text-xs font-black text-emerald-600 hover:underline">
              Go to My Vault ↗
            </button>
          </div>

          <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
            {pastForms.slice(0, 5).map((pf) => (
              <div
                key={pf.id}
                className="bg-white border border-gray-100 p-3 rounded-xl flex justify-between items-center shadow-sm hover:border-emerald-200 transition-colors"
              >
                <div>
                  <p className="font-black text-sm text-gray-800">{pf.exam}</p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {toPastFormDate(pf.completedAt || pf.updatedAt || pf.createdAt || pf.timestamp)?.toLocaleDateString() || 'Just now'}
                  </p>
                </div>
                <span className={`text-[10px] font-black tracking-wide px-2.5 py-1.5 rounded-lg ${
                  pf.status === 'Completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : pf.status === 'Cancelled'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-gray-100 text-gray-600'
                }`}
                >
                  {pf.status === 'Completed' ? 'SUCCESS' : pf.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchingState({ cancelRequest }) {
  return (
    <div className="text-center py-10 animate-in fade-in flex flex-col items-center">
      <div className="relative w-32 h-32 mx-auto mb-8">
        <div className="absolute inset-0 border-4 border-emerald-300 rounded-full animate-ping opacity-20" />
        <div className="absolute inset-4 border-4 border-emerald-400 rounded-full animate-ping opacity-30" />
        <div className="absolute inset-8 bg-gradient-to-tr from-emerald-100 to-blue-50 rounded-full flex items-center justify-center z-10 border-2 border-white shadow-lg">
          <Search className="text-emerald-600 animate-pulse" size={32} />
        </div>
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-2">Finding your Expert...</h3>
      <p className="text-sm text-gray-500 mb-8 font-semibold">Please don’t refresh. We are connecting you instantly.</p>
      <button onClick={cancelRequest} className="text-gray-400 hover:text-red-500 font-bold text-xs flex items-center gap-1">
        <XCircle size={14} /> Cancel Search
      </button>
    </div>
  );
}

function MatchedState({
  agentDetails,
  showChat,
  setShowChat,
  setIsUploadModalOpen,
  navigate,
  requestId,
  user,
  handleChatCompletion,
  vaultDocuments,
}) {
  const uploadedDocsCount = getUploadedDocuments(vaultDocuments).length;
  if (!showChat) {
    return (
      <div className="w-full animate-in zoom-in-95 text-center">
        <div className="flex justify-between items-center gap-2 mb-5 sm:mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 shadow-sm px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Home size={16} /> Home
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 shadow-sm px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Upload size={16} /> {uploadedDocsCount ? `${uploadedDocsCount} Docs` : 'Upload Docs'}
          </button>
        </div>

        <div className="inline-flex w-20 h-20 bg-emerald-100 text-emerald-600 border-4 border-white rounded-full mb-4 items-center justify-center shadow-md p-4">
          <CheckCircle size={36} />
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">Expert Connected!</h3>
        <p className="text-sm text-gray-500 font-medium mb-6">Your dedicated expert is ready.</p>

        <div className="bg-white border border-emerald-100 rounded-2xl p-5 text-left mb-6 flex items-center gap-4 shadow-sm">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-md">
            <span className="font-black text-xl">{agentDetails.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h4 className="font-black text-xl text-gray-900">{agentDetails.name}</h4>
            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 mt-1 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online Now
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowChat(true)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-lg"
        >
          <MessageCircle size={22} /> Enter Secure Chat
        </button>
      </div>
    );
  }

  return (
    <div className="w-full animate-in slide-in-from-bottom-4 flex flex-col min-h-[520px] sm:min-h-[580px]">
      <div className="flex w-full justify-between items-center mb-5 gap-3">
        <button
          onClick={() => setShowChat(false)}
          className="text-sm font-bold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 shadow-sm px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={16} /> Hide Chat
        </button>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="text-sm font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 shadow-sm px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <Upload size={16} /> {uploadedDocsCount ? `${uploadedDocsCount} Docs` : 'Upload Docs'}
        </button>
      </div>

      <LiveChatBox
        roomId={requestId}
        currentUserType="student"
        currentUserId={user.uid}
        otherPersonName={agentDetails.name}
        onChatClose={handleChatCompletion}
      />
    </div>
  );
}

function SuccessState({ setStep, setRequestId, navigate }) {
  return (
    <div className="text-center animate-in zoom-in-95 duration-500 py-5">
      <div className="inline-flex w-20 h-20 bg-emerald-100 text-emerald-600 border-4 border-emerald-50 rounded-full mb-5 items-center justify-center shadow-lg">
        <CheckCircle size={42} />
      </div>

      <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">Form Completed!</h3>
      <p className="text-gray-500 font-medium mb-6">
        Your application form has been successfully filled by our expert.
      </p>

      <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm shadow-sm mx-auto mb-6 w-full">
        <CheckCircle size={24} className="shrink-0" />
        <span className="text-left leading-tight">
          Confirmation PDF/status will be available in your Vault.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => {
            setStep('form');
            setRequestId(null);
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          Fill Another Form <ArrowRight size={18} />
        </button>

        <button
          onClick={() => navigate('/vault')}
          className="w-full bg-white hover:bg-gray-50 text-emerald-700 border border-emerald-100 font-black py-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          Go to Vault
        </button>
      </div>
    </div>
  );
}

function CardHeader({ icon, title, text, centered = false }) {
  return (
    <div className={`${centered ? 'text-center' : 'text-left'} mb-4 sm:mb-6`}>
      <div className={`mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ${centered ? 'mx-auto' : ''}`}>
        {icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">{text}</p>
    </div>
  );
}

function FieldLabel({ label }) {
  return (
    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1 ml-1">
      {label}
    </label>
  );
}

function QualificationPills({ qualification, setQualification }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {['10th', '12th', 'Graduate'].map((item) => (
        <button
          type="button"
          key={item}
          onClick={() => setQualification(item)}
          className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all border-2 ${
            qualification === item
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-gray-200 bg-white text-gray-500'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function PasswordInput({ password, setPassword, showPassword, setShowPassword, placeholder = '' }) {
  return (
    <div className="flex bg-gray-50 border-2 border-gray-200 focus-within:border-emerald-400 focus-within:bg-white rounded-xl pr-3 items-center">
      <input
        type={showPassword ? 'text' : 'password'}
        required
        placeholder={placeholder}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full bg-transparent p-3.5 outline-none font-bold text-gray-800"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="text-gray-400 hover:text-emerald-600"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function InputWithIcon({ label, icon, value, onChange, type = 'text', maxLength, placeholder }) {
  return (
    <div>
      <FieldLabel label={label} />
      <div className="flex items-center gap-2 rounded-xl border-2 border-transparent bg-gray-50 px-3 focus-within:border-emerald-400 focus-within:bg-white">
        <span className="text-gray-400">{icon}</span>
        <input
          type={type}
          maxLength={maxLength}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent p-3 outline-none font-bold text-gray-800 placeholder-gray-400"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function MiniInfo({ icon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-xs font-black text-gray-900">{title}</h4>
        <p className="text-[11px] font-semibold text-gray-500 mt-0.5">{text}</p>
      </div>
    </div>
  );
}

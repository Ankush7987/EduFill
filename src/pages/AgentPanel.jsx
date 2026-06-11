import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs, getDoc, updateDoc, doc, addDoc, serverTimestamp, arrayUnion, increment, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  UserCircle, Lock, Loader2, LogOut, CheckCircle, Clock, FileText, 
  MessageCircle, X, Check, Camera, Printer, IndianRupee, Upload, 
  PlusCircle, Bell, UserCheck, UserX, Coffee, Crop as CropIcon, 
  Zap, Radio, Globe, AlertCircle, MapPin, Users, LayoutDashboard, Search, ShieldCheck, RotateCw, Phone, Download, Edit
} from 'lucide-react';
import PaymentModal from '../components/admin/PaymentModal';
import WalkInModal from '../components/admin/WalkInModal';
import DocumentUploader from '../components/DocumentUploader';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import SEO from '../components/SEO';
import LiveChatBox from '../components/LiveChatBox'; 
import { liveApiFetch } from '../services/liveApi';
import {
  getLiveSocket,
  registerLiveAgent,
  subscribeAgentLiveEvents,
} from '../services/liveSocket';
import { toLiveRequestId } from '../utils/liveRequestUtils';

const normalizeLiveOffer = (offer = {}) => ({
  ...offer,
  id: toLiveRequestId(offer),
  backendRequestId: offer.requestId || offer._id || offer.backendRequestId || null,
  firebaseRequestId: offer.firebaseRequestId || null,
  name: offer.name || offer.fullName || 'Student',
  mobile: offer.mobile || offer.phone || 'N/A',
  exam: offer.exam || 'N/A',
  documents: normalizeDocuments(offer.documents, offer.vaultDocuments),
  vaultDocuments: normalizeDocuments(offer.vaultDocuments, offer.documents),
  offerExpiresAt: offer.expiresAt || offer.offerExpiresAt || null,
}); 

const MASTER_TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
];

const getSafeTime = (ts) => {
  if (!ts) return Date.now();
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts === 'number') return ts;
  if (ts.seconds) return ts.seconds * 1000;
  return Date.now();
};

const sortStudentsByTime = (items = []) =>
  [...items].sort((a, b) => getSafeTime(b?.timestamp || b?.createdAt || b?.acceptedAt) - getSafeTime(a?.timestamp || a?.createdAt || a?.acceptedAt));
const LIVE_OFFER_DURATION_MS = 10000;

const getExactMillis = (ts, fallback = 0) => {
  if (!ts) return fallback;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts === 'number') return ts;
  if (ts.seconds) return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const getOfferExpiryMs = (request = {}) =>
  getExactMillis(request.offerExpiresAt || request.offerTimeoutAt || request.offerExpireAt || request.offerExpiresAtMs, 0);

const getCurrentOfferAgentId = (request = {}) =>
  String(request.offerAgentId || request.currentOfferAgentId || request.currentAgentId || '').trim();

const getCurrentOfferAgentName = (request = {}) =>
  String(request.offerAgentName || request.currentOfferAgentName || request.currentAgentName || '').trim().toLowerCase();

const isRequestOfferedToAgent = (request = {}, agent = {}) => {
  const agentId = String(agent?.id || '').trim();
  const agentName = String(agent?.name || '').trim().toLowerCase();
  const offerAgentId = getCurrentOfferAgentId(request);
  const offerAgentName = getCurrentOfferAgentName(request);

  if (agentId && offerAgentId && offerAgentId === agentId) return true;
  if (agentName && offerAgentName && offerAgentName === agentName) return true;
  return false;
};

const isOfferExpired = (request = {}) => {
  const expiryMs = getOfferExpiryMs(request);
  return !expiryMs || Date.now() >= expiryMs;
};

const isOfferFreeOrExpired = (request = {}, agent = {}) => {
  const hasOfferOwner = Boolean(getCurrentOfferAgentId(request) || getCurrentOfferAgentName(request));
  if (!hasOfferOwner) return true;
  if (isRequestOfferedToAgent(request, agent)) return true;
  return isOfferExpired(request);
};

const buildOfferPayload = (agent = {}) => {
  const offerExpiresAt = new Date(Date.now() + LIVE_OFFER_DURATION_MS);
  return {
    offerAgentId: agent?.id || null,
    offerAgentName: agent?.name || 'Agent',
    currentOfferAgentId: agent?.id || null,
    currentOfferAgentName: agent?.name || 'Agent',
    offerStartedAt: serverTimestamp(),
    offerExpiresAt,
    offerExpiresAtMs: offerExpiresAt.getTime(),
    offerToken: `${agent?.id || 'agent'}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    lastOfferedAt: serverTimestamp(),
  };
};

const clearOfferPayload = () => ({
  offerAgentId: null,
  offerAgentName: null,
  currentOfferAgentId: null,
  currentOfferAgentName: null,
  offerStartedAt: null,
  offerExpiresAt: null,
  offerExpiresAtMs: null,
  offerToken: null,
});

const normalizeAgentId = (value = '') => String(value || '').trim();
const normalizeAgentName = (value = '') => String(value || '').trim().toLowerCase();

const isOnlineAgentEmployee = (employee = {}) => {
  const institute = normalizeAgentName(employee?.institute);
  const type = normalizeAgentName(employee?.agentType || employee?.type || employee?.role || employee?.panelType);
  const isOnlineType = institute.includes('online') || type.includes('online') || employee?.isOnlineAgent === true;
  const isLive = employee?.isLiveOnline === true || employee?.liveStatus === 'online' || employee?.onlineStatus === 'live' || employee?.online === true;
  const isNotBusy = employee?.busy !== true && employee?.isBusy !== true && employee?.currentLiveRequestId == null;
  return isOnlineType && employee?.active !== false && employee?.onBreak !== true && isLive && isNotBusy;
};

const getEligibleOnlineAgentsForRequest = (request = {}, onlineAgents = []) => {
  const skippedIds = new Set(getAgentSkipIds(request).map(normalizeAgentId));
  const skippedNames = new Set(getAgentSkipNames(request).map(normalizeAgentName));

  return (onlineAgents || [])
    .filter(isOnlineAgentEmployee)
    .filter((agent) => {
      const id = normalizeAgentId(agent?.id);
      const name = normalizeAgentName(agent?.name);
      if (id && skippedIds.has(id)) return false;
      if (name && skippedNames.has(name)) return false;
      return true;
    })
    .sort((a, b) => {
      const aCount = Number(a?.assignedCount || a?.todayAssignedCount || 0);
      const bCount = Number(b?.assignedCount || b?.todayAssignedCount || 0);
      if (aCount !== bCount) return aCount - bCount;

      const aLast = getExactMillis(a?.lastLiveOfferAt || a?.lastOfferedAt || a?.liveUpdatedAt || 0, 0);
      const bLast = getExactMillis(b?.lastLiveOfferAt || b?.lastOfferedAt || b?.liveUpdatedAt || 0, 0);
      if (aLast !== bLast) return aLast - bLast;

      return String(a?.name || '').localeCompare(String(b?.name || ''));
    });
};

const pickNextOnlineAgentForRequest = (request = {}, onlineAgents = [], fallbackAgent = null) => {
  const candidates = getEligibleOnlineAgentsForRequest(request, onlineAgents);
  if (candidates.length) return candidates[0];

  if (fallbackAgent && isOnlineAgentEmployee({ ...fallbackAgent, isLiveOnline: true, liveStatus: 'online' })) {
    const fallbackId = normalizeAgentId(fallbackAgent?.id);
    const fallbackName = normalizeAgentName(fallbackAgent?.name);
    const skippedIds = new Set(getAgentSkipIds(request).map(normalizeAgentId));
    const skippedNames = new Set(getAgentSkipNames(request).map(normalizeAgentName));
    if ((!fallbackId || !skippedIds.has(fallbackId)) && (!fallbackName || !skippedNames.has(fallbackName))) {
      return fallbackAgent;
    }
  }

  return null;
};

const shouldAgentClaimFreeRequest = (request = {}, onlineAgents = [], agent = {}) => {
  if (!agent?.id || isRequestSkippedByAgent(request, agent)) return false;
  const nextAgent = pickNextOnlineAgentForRequest(request, onlineAgents, agent);
  if (!nextAgent?.id) return false;
  return normalizeAgentId(nextAgent.id) === normalizeAgentId(agent.id);
};

const buildSkippedRequest = (request = {}, agent = {}) => {
  const id = normalizeAgentId(agent?.id);
  const name = normalizeAgentName(agent?.name);
  return {
    ...request,
    skippedAgentIds: Array.from(new Set([...getAgentSkipIds(request), id].filter(Boolean))),
    skippedAgentNames: Array.from(new Set([...getAgentSkipNames(request), name].filter(Boolean))),
  };
};

const getAgentSkipIds = (request = {}) => {
  const rawIds = [
    ...(Array.isArray(request.skippedAgentIds) ? request.skippedAgentIds : []),
    ...(Array.isArray(request.declinedAgentIds) ? request.declinedAgentIds : []),
    ...(Array.isArray(request.rejectedAgentIds) ? request.rejectedAgentIds : []),
    ...(Array.isArray(request.passedAgentIds) ? request.passedAgentIds : []),
  ];

  return rawIds.map((id) => String(id || '').trim()).filter(Boolean);
};

const getAgentSkipNames = (request = {}) => {
  const rawNames = [
    ...(Array.isArray(request.skippedAgentNames) ? request.skippedAgentNames : []),
    ...(Array.isArray(request.declinedAgentNames) ? request.declinedAgentNames : []),
    ...(Array.isArray(request.rejectedAgentNames) ? request.rejectedAgentNames : []),
    ...(Array.isArray(request.passedAgentNames) ? request.passedAgentNames : []),
  ];

  return rawNames.map((name) => String(name || '').trim().toLowerCase()).filter(Boolean);
};

const isRequestSkippedByAgent = (request = {}, agent = {}) => {
  const agentId = String(agent?.id || '').trim();
  const agentName = String(agent?.name || '').trim().toLowerCase();

  if (agentId && getAgentSkipIds(request).includes(agentId)) return true;
  if (agentName && getAgentSkipNames(request).includes(agentName)) return true;

  return false;
};

const vaultDocumentLookupCache = new Map();

const DOCUMENT_ITEMS = [
  { key: 'profilePicUrl', label: '🖼️ Passport Photo' },
  { key: 'signatureUrl', label: '✍️ Signature' },
  { key: 'aadharUrl', label: '🪪 Aadhaar Card' },
  { key: 'tenthUrl', label: '📄 10th Marksheet' },
  { key: 'twelfthUrl', label: '📄 12th Marksheet' },
  { key: 'thumbUrl', label: '👍 Thumb Impression' },
  { key: 'domicileUrl', label: '🏠 Niwash Praman' },
  { key: 'casteUrl', label: '📜 Caste Certificate' },
];

const DOCUMENT_ALIASES = {
  profilePicUrl: ['profilePicUrl', 'profilePic', 'profilePhotoUrl', 'photoUrl', 'photo', 'passportPhoto', 'passportPhotoUrl', 'passportUrl', 'imageUrl'],
  signatureUrl: ['signatureUrl', 'signature', 'signUrl', 'sign', 'studentSignatureUrl'],
  aadharUrl: ['aadharUrl', 'aadhaarUrl', 'aadhar', 'aadhaar', 'aadharCardUrl', 'aadhaarCardUrl'],
  tenthUrl: ['tenthUrl', 'tenth', 'class10Url', 'class10', 'marksheet10Url', 'tenthMarksheetUrl', 'tenMarksheetUrl'],
  twelfthUrl: ['twelfthUrl', 'twelfth', 'class12Url', 'class12', 'marksheet12Url', 'twelfthMarksheetUrl', 'twelveMarksheetUrl'],
  thumbUrl: ['thumbUrl', 'thumb', 'thumbImpressionUrl', 'leftThumbUrl', 'rightThumbUrl'],
  domicileUrl: ['domicileUrl', 'domicile', 'niwasUrl', 'niwashUrl', 'residenceCertificateUrl'],
  casteUrl: ['casteUrl', 'caste', 'casteCertificateUrl', 'categoryCertificateUrl'],
};

const normalizePhone = (value = '') => String(value || '').replace(/\D/g, '').slice(-10);
const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

const extractDocumentUrl = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    return String(
      value.url ||
      value.secure_url ||
      value.secureUrl ||
      value.downloadURL ||
      value.downloadUrl ||
      value.fileUrl ||
      value.previewUrl ||
      value.path ||
      ''
    ).trim();
  }
  return '';
};

const normalizeDocuments = (...docMaps) => {
  const normalized = {};

  docMaps.forEach((docMap) => {
    if (!docMap || typeof docMap !== 'object') return;

    Object.entries(docMap).forEach(([key, value]) => {
      const url = extractDocumentUrl(value);
      if (url && !normalized[key]) normalized[key] = url;
    });

    Object.entries(DOCUMENT_ALIASES).forEach(([targetKey, aliases]) => {
      if (normalized[targetKey]) return;
      for (const alias of aliases) {
        const url = extractDocumentUrl(docMap[alias]);
        if (url) {
          normalized[targetKey] = url;
          break;
        }
      }
    });
  });

  return normalized;
};

const hasAnyDocuments = (...docMaps) => Object.values(normalizeDocuments(...docMaps)).some(Boolean);

const buildPhoneCandidates = (...values) => {
  const candidates = new Set();

  values.forEach((value) => {
    if (!value) return;
    const raw = String(value).trim();
    const normalized = normalizePhone(raw);
    if (raw) candidates.add(raw);
    if (normalized) {
      candidates.add(normalized);
      candidates.add(`+91${normalized}`);
      candidates.add(`91${normalized}`);
      candidates.add(Number(normalized));
    }
  });

  return Array.from(candidates).filter(Boolean);
};

const getFirstUserByField = async (field, values) => {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;
    try {
      const snap = await getDocs(query(collection(db, 'Users'), where(field, '==', value)));
      if (!snap.empty) return snap.docs[0];
    } catch (error) {
      console.warn(`Users lookup failed for ${field}:`, error);
    }
  }
  return null;
};

const resolveStudentVaultDocuments = async (student) => {
  const existingDocs = normalizeDocuments(student?.documents, student?.vaultDocuments);
  if (hasAnyDocuments(existingDocs)) {
    return {
      ...student,
      documents: existingDocs,
      vaultDocuments: normalizeDocuments(student?.vaultDocuments, existingDocs),
    };
  }

  const cacheKey = [
    student?.collectionName,
    student?.id,
    student?.liveRequestId,
    student?.userId,
    student?.uid,
    student?.studentId,
    normalizePhone(student?.mobile || student?.phone || student?.contactNo || student?.whatsapp || student?.whatsappNumber),
    normalizeEmail(student?.email || student?.userEmail),
  ].filter(Boolean).join('|');

  if (cacheKey && vaultDocumentLookupCache.has(cacheKey)) {
    const cached = vaultDocumentLookupCache.get(cacheKey);
    return {
      ...student,
      ...cached,
      documents: normalizeDocuments(cached?.documents, cached?.vaultDocuments),
      vaultDocuments: normalizeDocuments(cached?.vaultDocuments, cached?.documents),
    };
  }

  let liveRequestData = {};
  if (student?.liveRequestId) {
    try {
      const liveSnap = await getDoc(doc(db, 'Live_Form_Requests', student.liveRequestId));
      if (liveSnap.exists()) liveRequestData = liveSnap.data() || {};
    } catch (error) {
      console.warn('Live request lookup failed:', error);
    }
  }

  const liveDocs = normalizeDocuments(liveRequestData.documents, liveRequestData.vaultDocuments);
  if (hasAnyDocuments(liveDocs)) {
    const enrichedFromLive = {
      ...student,
      userId: student?.userId || liveRequestData.userId || liveRequestData.uid || null,
      userEmail: student?.userEmail || liveRequestData.userEmail || liveRequestData.email || '',
      documents: liveDocs,
      vaultDocuments: liveDocs,
      vaultUserId: student?.vaultUserId || liveRequestData.userId || liveRequestData.uid || null,
      documentSource: 'live_request',
    };

    if (student?.collectionName && student?.id) {
      try {
        await updateDoc(doc(db, student.collectionName, student.id), {
          userId: enrichedFromLive.userId || null,
          userEmail: enrichedFromLive.userEmail || '',
          documents: liveDocs,
          vaultDocuments: liveDocs,
          vaultUserId: enrichedFromLive.vaultUserId || null,
          documentSource: 'live_request',
        });
      } catch (error) {
        console.warn('Queue document live sync failed:', error);
      }
    }

    if (cacheKey && hasAnyDocuments(liveDocs)) {
      vaultDocumentLookupCache.set(cacheKey, enrichedFromLive);
    }

    return enrichedFromLive;
  }

  const userIdCandidates = Array.from(new Set([
    student?.userId,
    student?.uid,
    student?.studentId,
    student?.vaultUserId,
    liveRequestData?.userId,
    liveRequestData?.uid,
    liveRequestData?.studentId,
  ].filter(Boolean)));

  let userDocSnap = null;

  for (const userId of userIdCandidates) {
    try {
      const snap = await getDoc(doc(db, 'Users', userId));
      if (snap.exists()) {
        userDocSnap = snap;
        break;
      }
    } catch (error) {
      console.warn('User ID lookup failed:', error);
    }
  }

  const emailCandidates = Array.from(new Set([
    normalizeEmail(student?.email),
    normalizeEmail(student?.userEmail),
    normalizeEmail(liveRequestData?.email),
    normalizeEmail(liveRequestData?.userEmail),
  ].filter(Boolean)));

  if (!userDocSnap && emailCandidates.length) {
    userDocSnap = await getFirstUserByField('email', emailCandidates);
  }

  if (!userDocSnap && emailCandidates.length) {
    userDocSnap = await getFirstUserByField('userEmail', emailCandidates);
  }

  const phoneCandidates = buildPhoneCandidates(
    student?.mobile,
    student?.phone,
    student?.contactNo,
    student?.whatsapp,
    student?.whatsappNumber,
    liveRequestData?.mobile,
    liveRequestData?.phone,
    liveRequestData?.contactNo,
    liveRequestData?.whatsapp,
    liveRequestData?.whatsappNumber
  );

  for (const phoneField of ['phone', 'mobile', 'contactNo', 'whatsapp', 'whatsappNumber']) {
    if (userDocSnap) break;
    userDocSnap = await getFirstUserByField(phoneField, phoneCandidates);
  }

  if (!userDocSnap || !userDocSnap.exists()) return student;

  const userData = userDocSnap.data() || {};
  const vaultDocs = normalizeDocuments(userData.documents, userData.vaultDocuments);
  if (!hasAnyDocuments(vaultDocs)) return student;

  const enrichedStudent = {
    ...student,
    userId: student?.userId || userDocSnap.id,
    userEmail: student?.userEmail || userData.email || userData.userEmail || '',
    documents: vaultDocs,
    vaultDocuments: vaultDocs,
    vaultUserId: userDocSnap.id,
    documentSource: 'vault',
  };

  if (student?.collectionName && student?.id) {
    try {
      await updateDoc(doc(db, student.collectionName, student.id), {
        userId: enrichedStudent.userId,
        userEmail: enrichedStudent.userEmail,
        documents: vaultDocs,
        vaultDocuments: vaultDocs,
        vaultUserId: userDocSnap.id,
        documentSource: 'vault',
      });
    } catch (error) {
      console.warn('Queue document vault sync failed:', error);
    }
  }

  if (cacheKey && hasAnyDocuments(vaultDocs)) {
    vaultDocumentLookupCache.set(cacheKey, enrichedStudent);
  }

  return enrichedStudent;
};


// ==========================================
// 🧩 SUB-COMPONENTS (Premium Error-Free UI)
// ==========================================

const AgentLogin = ({ agentName, setAgentName, pin, setPin, handleLogin, loggingIn, error }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#07111F] p-4 relative overflow-hidden selection:bg-emerald-500/30">
    <SEO title="Agent Login | EduFill Secure Access" url="/agent" noindex={true} />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_24%)]"></div>
    <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]"></div>

    <div className="max-w-md w-full bg-white/8 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="p-8 pb-6 text-center border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <div className="relative mx-auto mb-5 flex items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xl border border-emerald-100 overflow-hidden">
            <img src="/edufill-brand-logo.svg?v=2" alt="EduFill" className="h-9 w-auto object-contain" />
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-black text-white tracking-tight leading-none">Edu<span className="text-emerald-400">Fill</span></h2>
            <p className="text-[11px] text-slate-300 font-bold mt-1 tracking-wide">Secure Agent Terminal</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm mt-2 font-medium">Login to manage queue, payments, documents, and live requests.</p>
      </div>
      <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-2"><AlertCircle size={16}/> {error}</div>}

        <div>
          <label className="block text-xs font-black text-slate-300 uppercase tracking-widest mb-1.5 ml-1">Agent ID / Name</label>
          <div className="relative">
            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input type="text" required value={agentName} onChange={(e) => setAgentName(e.target.value)} className="w-full bg-black/20 border border-white/10 focus:border-emerald-500 focus:bg-black/35 text-white rounded-xl py-3.5 pl-11 pr-4 outline-none font-bold transition-all placeholder:text-slate-500" placeholder="Enter full name" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-300 uppercase tracking-widest mb-1.5 ml-1">Access PIN</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input type="password" required maxLength="4" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full bg-black/20 border border-white/10 focus:border-emerald-500 focus:bg-black/35 text-white rounded-xl py-3.5 pl-11 pr-4 outline-none font-black tracking-[0.5em] text-lg transition-all placeholder:text-slate-500 placeholder:tracking-normal placeholder:font-bold" placeholder="••••" />
          </div>
        </div>

        <button disabled={loggingIn} type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-all active:scale-95 mt-4">
          {loggingIn ? <Loader2 size={20} className="animate-spin"/> : 'Authenticate'}
        </button>
      </form>
    </div>
  </div>
);

const AgentHeader = ({ agentData, toggleBreakStatus, setIsWalkInModalOpen, handleLogout, isLiveOnline, setIsLiveOnline, isOnlineAgent }) => (
  <header className="bg-white/85 backdrop-blur-xl border-b border-emerald-100 sticky top-0 z-30 shadow-sm">
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div className="flex items-center gap-3 w-full lg:w-auto">
        <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-100 shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <img src="/edufill-brand-logo.svg?v=2" alt="EduFill" className="h-8 w-auto object-contain" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-none">Edu<span className="text-emerald-600">Fill</span> Agent Panel</h1>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">{isOnlineAgent ? 'Online Agent' : 'Camp Agent'}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1"><UserCheck size={12}/> {agentData?.name || 'Agent'}</span>
            {isOnlineAgent ? (
              <span className="flex items-center gap-1 text-blue-600"><Globe size={12}/> Online Expert Terminal</span>
            ) : (
              <span className="flex items-center gap-1"><MapPin size={12}/> Camp: {agentData?.institute || 'N/A'}</span>
            )}
            {isLiveOnline && isOnlineAgent && <span className="flex items-center gap-1 text-emerald-600"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span> Live Now</span>}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-auto flex flex-wrap items-center gap-2 sm:gap-3 justify-end">
        {isOnlineAgent && (
          <button onClick={() => setIsLiveOnline(!isLiveOnline)} className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all ${isLiveOnline ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-sm' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md active:scale-95'}`}>
            {isLiveOnline ? <><Radio size={14} className="animate-pulse"/> <span>Go Offline</span></> : <><Zap size={14}/> <span>Go Live</span></>}
          </button>
        )}
        {!isOnlineAgent && (
          <button onClick={toggleBreakStatus} className={`flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all border ${!agentData?.onBreak ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 shadow-sm' : 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-md'}`}>
            {!agentData?.onBreak ? <Coffee size={14} /> : <CheckCircle size={14}/>} 
            <span>{!agentData?.onBreak ? 'Take Break' : 'Resume'}</span>
          </button>
        )}
        {!isOnlineAgent && (
          <button onClick={() => setIsWalkInModalOpen(true)} className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2.5 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md active:scale-95">
            <PlusCircle size={14} /> <span>Walk-in</span>
          </button>
        )}
        <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block"></div>
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-2.5 rounded-xl hover:bg-red-50 transition-colors shrink-0 border border-transparent hover:border-red-100" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  </header>
);

const AgentStats = ({ assignedStudents, pendingCount, completedCount, totalCollection }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    <div className="bg-white p-4 sm:p-5 rounded-[1.35rem] shadow-sm border border-emerald-100/70 flex items-center gap-3 sm:gap-4 relative overflow-hidden group">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Users size={20} className="sm:w-6 sm:h-6"/></div>
      <div><p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Total Queue</p><p className="text-xl sm:text-2xl font-black text-slate-900">{assignedStudents?.length || 0}</p></div>
    </div>
    <div className="bg-white p-4 sm:p-5 rounded-[1.35rem] shadow-sm border border-amber-100/70 flex items-center gap-3 sm:gap-4 relative overflow-hidden group">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Clock size={20} className="sm:w-6 sm:h-6"/></div>
      <div><p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Pending</p><p className="text-xl sm:text-2xl font-black text-slate-900">{pendingCount || 0}</p></div>
    </div>
    <div className="bg-white p-4 sm:p-5 rounded-[1.35rem] shadow-sm border border-blue-100/70 flex items-center gap-3 sm:gap-4 relative overflow-hidden group">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><CheckCircle size={20} className="sm:w-6 sm:h-6"/></div>
      <div><p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Completed</p><p className="text-xl sm:text-2xl font-black text-slate-900">{completedCount || 0}</p></div>
    </div>
    <div className="bg-gradient-to-br from-[#081527] to-[#0f2b4f] p-4 sm:p-5 rounded-[1.35rem] shadow-md border border-slate-700/70 flex items-center gap-3 sm:gap-4 relative overflow-hidden group">
      <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 text-white rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-white/20"><IndianRupee size={20} className="sm:w-6 sm:h-6"/></div>
      <div className="relative z-10"><p className="text-[9px] sm:text-[10px] text-slate-300 font-black uppercase tracking-widest mb-0.5">Collection</p><p className="text-xl sm:text-2xl font-black text-white">₹{totalCollection || 0}</p></div>
    </div>
  </div>
);

const QueueTable = ({ loading, assignedStudents, openPaymentModal, togglePhotoDeliveryStatus, toggleConfirmationStatus, setSelectedStudent, setDocsModalOpen, setUploadTarget, setIsUploadModalOpen, sendReminder, markAsArrived, markAsAbsent, markAsCompleted, editApplicationNumber, isOnlineAgent, setChatTarget }) => (
  <div className="bg-white rounded-[2rem] shadow-sm border border-emerald-100 overflow-hidden flex flex-col">
    <div className="p-5 sm:p-6 border-b border-emerald-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white shrink-0">
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2"><LayoutDashboard size={20} className="text-emerald-600"/> Agent Queue Hub</h2>
        <p className="text-xs font-bold text-slate-500 mt-1">Manage student flow, documents, payment, and final completion.</p>
      </div>
      <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">{assignedStudents?.length || 0} Records</div>
    </div>

    <div className="p-4 sm:p-6 bg-slate-50/60 flex-1">
      {loading ? (
        <div className="py-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100"><Loader2 className="animate-spin inline mr-2"/> Syncing Queue Data...</div>
      ) : assignedStudents?.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3"><Users size={24} className="text-gray-300"/></div>
          <p className="text-gray-500 font-bold">Queue is empty</p>
          <p className="text-xs text-gray-400 mt-1">{isOnlineAgent ? 'Toggle Go Live to accept requests.' : 'Waiting for walk-ins or assigned slots.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignedStudents.map((student) => (
            <div key={student?.id} className={`bg-white border rounded-[1.25rem] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-5 lg:items-center ${student?.status === 'Absent' || student?.status === 'Cancelled' ? 'border-red-100 opacity-60 grayscale-[50%]' : student?.status === 'Completed' ? 'border-emerald-100 bg-emerald-50/10' : 'border-gray-200 hover:border-indigo-200'}`}>
              
              <div className="flex items-center gap-4 lg:w-1/4">
                <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-black text-lg shrink-0">
                  {(student?.fullName || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-gray-900 text-base leading-tight truncate">{student?.fullName || 'Unknown'}</p>
                  <p className="text-xs text-gray-500 font-bold flex items-center gap-1 mt-1 hover:text-indigo-600 cursor-pointer w-fit" onClick={() => window.open(`tel:${student?.mobile}`)}><MessageCircle size={12}/> {student?.mobile || 'N/A'}</p>
                  <div className="flex gap-1.5 mt-2">
                    <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-black uppercase tracking-widest">{student?.category || 'GEN'}</span>
                    
                    {/* 🌟 FIX: Added Edit Button functionality here 🌟 */}
                    {student?.applicationNumber && student.applicationNumber !== 'N/A' && (
                      <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded font-black uppercase tracking-widest truncate max-w-[150px] flex items-center gap-1">
                        ID: {student.applicationNumber}
                        <button onClick={() => editApplicationNumber(student)} className="text-indigo-400 hover:text-indigo-800 transition-colors ml-0.5" title="Edit Application Number">
                          <Edit size={10} />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:w-1/4 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-3 lg:pt-0 lg:pl-5">
                <p className="font-black text-gray-800 text-sm truncate" title={student?.exam}>{student?.exam || 'N/A'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100"><Clock size={12}/> {student?.slotTime || 'N/A'}</span>
                </div>
              </div>

              <div className="lg:w-1/4 flex flex-wrap lg:flex-col gap-2 border-t lg:border-t-0 lg:border-l border-gray-100 pt-3 lg:pt-0 lg:pl-5 justify-center">
                <div className="flex gap-2 w-full">
                  <span className={`flex-1 text-center px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${student?.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : student?.status === 'Arrived' ? 'bg-blue-50 text-blue-700 border-blue-200' : student?.status === 'Absent' || student?.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {student?.status || 'Pending'}
                  </span>
                  {student?.paymentStatus === 'Paid' ? (
                    <button onClick={() => openPaymentModal(student)} className="flex-1 flex justify-center items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"><CheckCircle size={12}/> Paid</button>
                  ) : (
                    <button onClick={() => openPaymentModal(student)} className="flex-1 flex justify-center items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors animate-pulse"><AlertCircle size={12}/> Due</button>
                  )}
                </div>
                <div className="flex gap-2 w-full">
                  <button onClick={() => togglePhotoDeliveryStatus(student?.id, student?.collectionName, student?.photoDelivered)} className={`flex-1 flex justify-center items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${student?.photoDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                    <Camera size={12}/> Photo
                  </button>
                  <button onClick={() => toggleConfirmationStatus(student?.id, student?.collectionName, student?.confirmationDelivered)} className={`flex-1 flex justify-center items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${student?.confirmationDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                    <Printer size={12}/> Print
                  </button>
                </div>
              </div>

              <div className="lg:w-1/4 flex flex-col justify-center gap-2 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-5">
                <div className="flex gap-2 w-full">
                  {hasAnyDocuments(student?.documents, student?.vaultDocuments) ? (
                    <button onClick={() => { setSelectedStudent({ ...student, documents: normalizeDocuments(student?.documents, student?.vaultDocuments) }); setDocsModalOpen(true); }} className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 rounded-xl text-xs font-black transition-colors shadow-sm"><Search size={14}/> Docs</button>
                  ) : (
                    <button onClick={() => { setUploadTarget(student); setIsUploadModalOpen(true); }} className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-black transition-colors shadow-sm"><Upload size={14}/> Upload</button>
                  )}
                  {student?.liveRequestId && student?.status !== 'Completed' && student?.status !== 'Cancelled' && student?.status !== 'Absent' && (
                    <button onClick={() => setChatTarget(student)} className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-indigo-700 transition-colors">
                      <MessageCircle size={14}/> Chat
                    </button>
                  )}
                </div>
                <div className="flex gap-2 w-full flex-wrap justify-end lg:justify-start">
                  {student?.status === 'Pending' && <button onClick={() => sendReminder(student?.mobile, student?.fullName, student?.reportingTime)} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-[10px] font-black uppercase transition-colors"><Bell size={12}/></button>}
                  {student?.status === 'Pending' && !isOnlineAgent && <button onClick={() => markAsArrived(student?.id, student?.collectionName)} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 rounded-lg text-[10px] font-black uppercase transition-colors">Arrive</button>}
                  {student?.status === 'Pending' && !isOnlineAgent && <button onClick={() => markAsAbsent(student?.id, student?.collectionName)} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg text-[10px] font-black uppercase transition-colors">Skip</button>}
                  {(student?.status === 'Pending' || student?.status === 'Arrived' || student?.status === 'In Progress') && (
                    <button onClick={() => markAsCompleted(student)} className="flex-1 flex justify-center items-center gap-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95"><Check size={14}/> Mark Done</button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// -------------------------------------------------------------
// 🚀 MAIN AGENT PANEL CONTROLLER 
// -------------------------------------------------------------
export default function AgentPanel() {
  const [isInitializing, setIsInitializing] = useState(true); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [agentData, setAgentData] = useState(null);

  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isLiveOnline, setIsLiveOnline] = useState(false);
  const [liveRequests, setLiveRequests] = useState([]);
  const [acceptingId, setAcceptingId] = useState(null);
  const [cancelingLiveId, setCancelingLiveId] = useState(null);
  const [offerCountdown, setOfferCountdown] = useState(LIVE_OFFER_DURATION_MS / 1000);
  const claimingOfferIdRef = useRef(null);
  const autoSkipInProgressRef = useRef(null);
  const [onlineAgents, setOnlineAgents] = useState([]);
  const onlineAgentsRef = useRef([]);
  const routingRequestRef = useRef(new Set());
  const isAgentBusyRef = useRef(false);
  const queueSnapshotVersionRef = useRef(0);
  const liveOfferIdsRef = useRef('');
  const [chatTarget, setChatTarget] = useState(null);
  const [pendingQueueTick, setPendingQueueTick] = useState(0);

  const completedOverridesRef = useRef(new Map());
  const pendingAcceptedStudentsRef = useRef(new Map());

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('edufill_completed_form_overrides') || '[]');

      const cleanEntries = (Array.isArray(saved) ? saved : []).filter(([key, value]) => {
        if (!key || String(key).startsWith('mobile:')) return false;
        if (!value || value.status !== 'Completed') return false;
        return true;
      });

      completedOverridesRef.current = new Map(cleanEntries);
      localStorage.setItem('edufill_completed_form_overrides', JSON.stringify(cleanEntries.slice(-300)));
    } catch (_) {
      completedOverridesRef.current = new Map();
    }
  }, []);

  const getStudentOverrideKeys = (student = {}) => {
    const keys = [];
    const collectionName = student?.collectionName || '';
    const id = student?.id || '';
    const liveRequestId = student?.liveRequestId || '';
    const backendRequestId = student?.backendRequestId || '';
    const firebaseRequestId = student?.firebaseRequestId || '';
    
    if (collectionName && id) keys.push(`${collectionName}:${id}`);
    if (liveRequestId) keys.push(`live:${liveRequestId}`);
    if (backendRequestId) keys.push(`backend:${backendRequestId}`);
    if (firebaseRequestId) keys.push(`firebase:${firebaseRequestId}`);

    return [...new Set(keys.filter(Boolean))];
  };

  const saveCompletedOverride = (student = {}, updates = {}) => {
    const finalUpdates = {
      status: 'Completed',
      completed: true,
      isCompleted: true,
      completedAt: updates.completedAt || new Date().toISOString(),
      applicationNumber: updates.applicationNumber || student?.applicationNumber || 'N/A',
      completedBy: updates.completedBy || agentData?.name || student?.assignedTo || null,
    };

    getStudentOverrideKeys(student).forEach((key) => {
      completedOverridesRef.current.set(key, finalUpdates);
    });

    try {
      localStorage.setItem(
        'edufill_completed_form_overrides',
        JSON.stringify(Array.from(completedOverridesRef.current.entries()).slice(-500))
      );
    } catch (_) {}

    return finalUpdates;
  };

  const clearCompletedOverride = (student = {}) => {
    getStudentOverrideKeys(student).forEach((key) => {
      completedOverridesRef.current.delete(key);
    });

    try {
      localStorage.setItem(
        'edufill_completed_form_overrides',
        JSON.stringify(Array.from(completedOverridesRef.current.entries()).slice(-300))
      );
    } catch (_) {}
  };

  const applyCompletedOverride = (student = {}) => {
    const rawStatus = String(student?.status || '').toLowerCase();
    const isActiveStudent =
      rawStatus === 'pending' ||
      rawStatus === 'accepted' ||
      rawStatus === 'arrived' ||
      rawStatus === 'in progress' ||
      rawStatus === 'in_progress';

    if (isActiveStudent && student?.completed !== true && student?.isCompleted !== true) {
      return student;
    }

    for (const key of getStudentOverrideKeys(student)) {
      const override = completedOverridesRef.current.get(key);
      if (override) return { ...student, ...override };
    }
    return student;
  };

  const getQueueIdentityKeys = (student = {}) => {
    const keys = [];
    if (student?.collectionName && student?.id) keys.push(`${student.collectionName}:${student.id}`);
    if (student?.backendRequestId) keys.push(`backend:${student.backendRequestId}`);
    if (student?.liveRequestId) keys.push(`live:${student.liveRequestId}`);
    if (student?.firebaseRequestId) keys.push(`firebase:${student.firebaseRequestId}`);
    return [...new Set(keys.filter(Boolean))];
  };

  const sameQueueStudent = (a = {}, b = {}) => {
    const aKeys = new Set(getQueueIdentityKeys(a));
    return getQueueIdentityKeys(b).some((key) => aKeys.has(key));
  };

  const storePendingAcceptedStudent = (student = {}) => {
    const key =
      student?.backendRequestId ||
      student?.liveRequestId ||
      student?.firebaseRequestId ||
      `${student?.collectionName || 'local'}:${student?.id || Date.now()}`;

    const activeStudent = {
      ...student,
      id: student?.id || key,
      collectionName: student?.collectionName || '__backend_live_queue__',
      status: student?.status === 'Completed' ? 'Completed' : (student?.status || 'Pending'),
      assignedTo: student?.assignedTo || agentData?.name || '',
      _localAccepted: true,
      _savedAt: Date.now(),
    };

    if (activeStudent.status !== 'Completed') {
      clearCompletedOverride(activeStudent);
      activeStudent.completed = false;
      activeStudent.isCompleted = false;
      activeStudent.completedAt = null;
    }

    const safeStudent = activeStudent.status === 'Completed'
      ? applyCompletedOverride(activeStudent)
      : activeStudent;

    pendingAcceptedStudentsRef.current.set(String(key), safeStudent);

    try {
      const all = JSON.parse(localStorage.getItem('edufill_pending_accepted_students') || '{}');
      const agentKey = agentData?.id || agentData?.name || 'default';
      all[agentKey] = Array.from(pendingAcceptedStudentsRef.current.entries()).slice(-50);
      localStorage.setItem('edufill_pending_accepted_students', JSON.stringify(all));
    } catch (_) {}

    setLoading(false);
    setPendingQueueTick((tick) => tick + 1);
    return safeStudent;
  };

  const clearPendingAcceptedStudent = (student = {}) => {
    const ids = [
      student?.backendRequestId,
      student?.liveRequestId,
      student?.firebaseRequestId,
      student?.id,
    ].filter(Boolean).map(String);

    ids.forEach((id) => pendingAcceptedStudentsRef.current.delete(id));

    try {
      const all = JSON.parse(localStorage.getItem('edufill_pending_accepted_students') || '{}');
      const agentKey = agentData?.id || agentData?.name || 'default';
      all[agentKey] = Array.from(pendingAcceptedStudentsRef.current.entries()).slice(-50);
      localStorage.setItem('edufill_pending_accepted_students', JSON.stringify(all));
    } catch (_) {}

    setPendingQueueTick((tick) => tick + 1);
  };

  const mergePendingAcceptedStudents = (list = []) => {
    const base = (list || []).map(applyCompletedOverride);
    const pending = Array.from(pendingAcceptedStudentsRef.current.values()).map(applyCompletedOverride);

    const merged = [...base];

    pending.forEach((pendingStudent) => {
      if (!merged.some((item) => sameQueueStudent(item, pendingStudent))) {
        merged.push(pendingStudent);
      }
    });

    return sortStudentsByTime(merged);
  };

  const normalizeBackendQueueStudent = (request = {}) => {
    const backendRequestId = toLiveRequestId(request);
    const firebaseRequestId = request.firebaseRequestId || null;
    const docs = normalizeDocuments(request.documents, request.vaultDocuments);

    return applyCompletedOverride({
      id: backendRequestId || firebaseRequestId || `backend_${Date.now()}`,
      collectionName: '__backend_live_queue__',
      fullName: request.name || request.fullName || 'Student',
      mobile: request.mobile || request.phone || 'N/A',
      exam: request.exam || 'N/A',
      institute: 'Online Student (Website)',
      category: 'General',
      tokenNumber: request.tokenNumber || `WEB-${String(backendRequestId || Date.now()).slice(-6)}`,
      status: String(request.status || '').toLowerCase() === 'completed' ? 'Completed' : 'Pending',
      completed: String(request.status || '').toLowerCase() === 'completed',
      isCompleted: String(request.status || '').toLowerCase() === 'completed',
      paymentStatus: request.paymentStatus || 'Due',
      photoDelivered: request.photoDelivered || false,
      confirmationDelivered: request.confirmationDelivered || false,
      assignedTo: request.acceptedAgentName || request.agentName || agentData?.name || '',
      slotDate: todayStr,
      slotTime: request.slotTime || 'Live',
      liveRequestId: backendRequestId || firebaseRequestId,
      backendRequestId,
      firebaseRequestId,
      userId: request.firebaseUserId || request.userId || request.vaultUserId || null,
      userEmail: request.userEmail || request.email || '',
      documents: docs,
      vaultDocuments: docs,
      vaultUserId: request.firebaseUserId || request.userId || request.vaultUserId || null,
      documentSource: hasAnyDocuments(docs) ? 'vault' : null,
      timestamp: request.acceptedAt || request.createdAt || new Date().toISOString(),
      _backendQueueOnly: true,
    });
  };

  const normalizeFirestoreLiveRequestStudent = (id, data = {}) => {
    const docs = normalizeDocuments(data.documents, data.vaultDocuments);

    return applyCompletedOverride({
      id: id || data.backendRequestId || data.liveRequestId || `live_${Date.now()}`,
      collectionName: '__backend_live_queue__',
      fullName: data.name || data.fullName || 'Student',
      mobile: data.mobile || data.phone || data.userPhone || 'N/A',
      exam: data.exam || 'N/A',
      institute: 'Online Student (Website)',
      category: data.category || 'General',
      tokenNumber: data.tokenNumber || `WEB-${String(id || data.backendRequestId || Date.now()).slice(-6)}`,
      status: String(data.status || '').toLowerCase() === 'completed' ? 'Completed' : 'Pending',
      completed: String(data.status || '').toLowerCase() === 'completed',
      isCompleted: String(data.status || '').toLowerCase() === 'completed',
      paymentStatus: data.paymentStatus || 'Due',
      photoDelivered: data.photoDelivered || false,
      confirmationDelivered: data.confirmationDelivered || false,
      assignedTo: data.agentName || data.assignedTo || agentData?.name || '',
      slotDate: todayStr,
      slotTime: data.slotTime || 'Live',
      liveRequestId: data.backendRequestId || data.liveRequestId || id,
      backendRequestId: data.backendRequestId || data.liveRequestId || null,
      firebaseRequestId: data.firebaseRequestId || id || null,
      userId: data.userId || data.firebaseUserId || data.vaultUserId || null,
      userEmail: data.userEmail || data.email || '',
      documents: docs,
      vaultDocuments: docs,
      vaultUserId: data.vaultUserId || data.userId || null,
      documentSource: hasAnyDocuments(docs) ? 'vault' : null,
      timestamp: data.acceptedAt || data.timestamp || data.createdAt || new Date().toISOString(),
      _rescuedFromLiveRequest: true,
    });
  };

  useEffect(() => {
    if (!isAuthenticated || !agentData?.id) return;

    try {
      const all = JSON.parse(localStorage.getItem('edufill_pending_accepted_students') || '{}');
      const saved = all[agentData.id] || all[agentData.name] || [];
      if (Array.isArray(saved) && saved.length) {
        const cleaned = saved.map(([key, student]) => {
          const isCompleted = String(student?.status || '').toLowerCase() === 'completed';
          return [
            key,
            isCompleted
              ? student
              : { ...student, status: 'Pending', completed: false, isCompleted: false, completedAt: null },
          ];
        });

        pendingAcceptedStudentsRef.current = new Map(cleaned);
        setAssignedStudents((prev) => mergePendingAcceptedStudents(prev));
        setLoading(false);
        setPendingQueueTick((tick) => tick + 1);
      }
    } catch (_) {}
  }, [isAuthenticated, agentData?.id, agentData?.name]);

  const isOnlineAgent = agentData?.institute?.toLowerCase()?.includes('online') || agentData?.agentType === 'online' || agentData?.isOnlineAgent === true || false;
  const visibleAssignedStudents = mergePendingAcceptedStudents(assignedStudents);
  const isAgentBusy = Boolean(agentData?.busy || agentData?.isBusy) || (
    isOnlineAgent
      ? visibleAssignedStudents?.some(s => s?.liveRequestId && (s?.status === 'Pending' || s?.status === 'Arrived' || s?.status === 'In Progress'))
      : visibleAssignedStudents?.some(s => s?.status === 'Pending' || s?.status === 'Arrived' || s?.status === 'In Progress')
  );

  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ id: '', colName: '', amount: '', method: 'Online' });
  const [savingPayment, setSavingPayment] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  
  const [replaceCropModalOpen, setReplaceCropModalOpen] = useState(false);
  const [replaceImgSrc, setReplaceImgSrc] = useState('');
  const [replaceDocKey, setReplaceDocKey] = useState('');
  const [replaceRawFile, setReplaceRawFile] = useState(null);
  const [replaceCrop, setReplaceCrop] = useState();
  const [replaceCompletedCrop, setReplaceCompletedCrop] = useState(null);
  const [replacingDoc, setReplacingDoc] = useState(null); 
  const replaceImgRef = useRef(null);

  const now = new Date();
  const offset = now.getTimezoneOffset();
  const todayStr = new Date(now.getTime() - (offset*60*1000)).toISOString().split('T')[0];

  const [walkInForm, setWalkInForm] = useState({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: todayStr, slotTime: '' });
  const [savingWalkIn, setSavingWalkIn] = useState(false);
  const [approvedInstitutes, setApprovedInstitutes] = useState([]);
  const [bookingSettings, setBookingSettings] = useState({ startTime: "10:00 AM", endTime: "06:00 PM", holidays: [] });
  const [bookedSlotsInfo, setBookedSlotsInfo] = useState({});
  const [instituteCapacity, setInstituteCapacity] = useState(0);

  useEffect(() => {
    onlineAgentsRef.current = onlineAgents;
  }, [onlineAgents]);

  useEffect(() => {
    isAgentBusyRef.current = Boolean(isAgentBusy);
  }, [isAgentBusy]);

  const setLiveRequestsIfChanged = (nextOffers = []) => {
    const nextList = (nextOffers || []).filter(Boolean).slice(0, 1);
    const nextKey = nextList.map((item) => `${item?.id || ''}:${item?.offerExpiresAt || item?.expiresAt || ''}`).join('|');

    if (liveOfferIdsRef.current === nextKey) return;

    liveOfferIdsRef.current = nextKey;
    setLiveRequests(nextList);
  };

  useEffect(() => {
    const verifyStoredSession = async () => {
      const storedAgentId = localStorage.getItem('edufill_agent_session');
      if (storedAgentId) {
        try {
          const docRef = doc(db, "Employees", storedAgentId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() || {};
            setAgentData({ id: docSnap.id, ...data });
            setIsAuthenticated(true);
            setIsLiveOnline(data?.isLiveOnline === true || data?.liveStatus === 'online' || data?.onlineStatus === 'live');
          } 
          else { localStorage.removeItem('edufill_agent_session'); }
        } catch (err) { console.error("Auto-login failed:", err); }
      }
      setIsInitializing(false); 
    };
    verifyStoredSession();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isOnlineAgent) {
      setOnlineAgents([]);
      return undefined;
    }

    const unsub = onSnapshot(collection(db, 'Employees'), (snapshot) => {
      const agents = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() || {};
        const agent = { id: docSnap.id, ...data };
        if (isOnlineAgentEmployee(agent)) agents.push(agent);
      });
      setOnlineAgents(agents);
    }, (error) => {
      console.error('Online agents listener failed:', error);
    });

    return () => unsub();
  }, [isAuthenticated, isOnlineAgent]);

  useEffect(() => {
    if (!isAuthenticated || !agentData?.name) return;
    
    const collectionsToFetch = ['Ribosome_Students', 'Unacademy_Students', 'Other_Students'];
    const unsubBookings = [];
    collectionsToFetch.forEach(colName => {
      const q = query(collection(db, colName), where("assignedTo", "==", agentData.name));
      const unsub = onSnapshot(q, async (snapshot) => {
        const docs = [];
        snapshot.forEach(docSnap => docs.push({ id: docSnap.id, collectionName: colName, ...docSnap.data() }));
        const snapshotVersion = Date.now() + Math.random();
        queueSnapshotVersionRef.current = snapshotVersion;

        setAssignedStudents(prev => {
          const previousById = new Map(prev.filter(p => p.collectionName === colName).map(p => [p.id, p]));
          const preparedDocs = docs.map(student => {
            const previous = previousById.get(student.id);
            const mergedDocs = normalizeDocuments(student.documents, student.vaultDocuments, previous?.documents, previous?.vaultDocuments);
            return applyCompletedOverride({
              ...previous,
              ...student,
              documents: mergedDocs,
              vaultDocuments: normalizeDocuments(student.vaultDocuments, previous?.vaultDocuments, mergedDocs),
              vaultUserId: student.vaultUserId || previous?.vaultUserId || null,
              documentSource: student.documentSource || previous?.documentSource || null,
            });
          });
          const others = prev.filter(p => p.collectionName !== colName);
          return mergePendingAcceptedStudents([...others, ...preparedDocs]);
        });
        setLoading(false);

        Promise.all(
          docs.map(async (student) => {
            try {
              return await resolveStudentVaultDocuments(student);
            } catch (vaultError) {
              console.warn('Vault document lookup failed:', vaultError);
              return student;
            }
          })
        ).then((enrichedDocs) => {
          if (queueSnapshotVersionRef.current !== snapshotVersion) return;
          setAssignedStudents(prev => {
            const others = prev.filter(p => p.collectionName !== colName);
            const previousById = new Map(prev.filter(p => p.collectionName === colName).map(p => [p.id, p]));
            const mergedDocs = enrichedDocs.map(student => applyCompletedOverride({
              ...(previousById.get(student.id) || {}),
              ...student,
              documents: normalizeDocuments(student.documents, student.vaultDocuments, previousById.get(student.id)?.documents, previousById.get(student.id)?.vaultDocuments),
              vaultDocuments: normalizeDocuments(student.vaultDocuments, student.documents, previousById.get(student.id)?.vaultDocuments),
            }));
            return mergePendingAcceptedStudents([...others, ...mergedDocs]);
          });
        });
      });
      unsubBookings.push(unsub);
    });

    const qCamps = query(collection(db, "Camp_Requests"), where("status", "==", "Completed"));
    const unsubCamps = onSnapshot(qCamps, (snapshot) => {
      const instList = []; snapshot.forEach(doc => { if(doc.data()?.instituteName) instList.push(doc.data().instituteName); });
      setApprovedInstitutes([...new Set(instList)].filter(name => name !== 'Ribosome Institute' && name !== 'Unacademy'));
    });

    const bookingRef = doc(db, "PlatformSettings", "bookingControls");
    const unsubBooking = onSnapshot(bookingRef, (docSnap) => { if (docSnap.exists()) setBookingSettings(docSnap.data() || {}); });

    return () => { unsubBookings.forEach(unsub => unsub()); unsubCamps(); unsubBooking(); };
  }, [isAuthenticated, agentData?.id, agentData?.name]);

  useEffect(() => {
    if (!isAuthenticated || !agentData?.id) return undefined;

    const busyLocked = Boolean(
      agentData?.busy ||
      agentData?.isBusy ||
      agentData?.currentLiveRequestId ||
      agentData?.currentStudentId
    );

    if (!busyLocked) return undefined;

    let cancelled = false;

    const addRescuedStudent = (student) => {
      if (cancelled || !student) return false;

      const normalized = storePendingAcceptedStudent({
        ...student,
        status: student.status === 'Completed' ? 'Completed' : 'Pending',
        assignedTo: student.assignedTo || agentData?.name || '',
      });

      isAgentBusyRef.current = true;
      liveOfferIdsRef.current = '';
      setLiveRequests([]);
      setLoading(false);

      setAssignedStudents((prev) => {
        const withoutSame = prev.filter((item) => !sameQueueStudent(item, normalized));
        return mergePendingAcceptedStudents([normalized, ...withoutSame]);
      });

      return true;
    };

    const fetchQueueDocById = async (studentId) => {
      if (!studentId) return false;

      for (const col of ['Other_Students', 'Ribosome_Students', 'Unacademy_Students', 'Slot_Bookings']) {
        try {
          const snap = await getDoc(doc(db, col, studentId));
          if (snap.exists()) {
            return addRescuedStudent({
              id: snap.id,
              collectionName: col,
              ...snap.data(),
            });
          }
        } catch (_) {}
      }

      return false;
    };

    const fetchQueueDocByField = async (field, value) => {
      if (!value) return false;

      for (const col of ['Other_Students', 'Ribosome_Students', 'Unacademy_Students', 'Slot_Bookings']) {
        try {
          const snap = await getDocs(query(collection(db, col), where(field, '==', value)));
          for (const docSnap of snap.docs) {
            const data = docSnap.data() || {};
            const sameAgent =
              !data.assignedTo ||
              !agentData?.name ||
              String(data.assignedTo).trim().toLowerCase() === String(agentData.name).trim().toLowerCase();

            if (sameAgent && data.status !== 'Completed' && data.status !== 'Cancelled' && data.status !== 'Absent') {
              return addRescuedStudent({
                id: docSnap.id,
                collectionName: col,
                ...data,
              });
            }
          }
        } catch (_) {}
      }

      return false;
    };

    const fetchLiveRequestById = async (requestId) => {
      if (!requestId) return false;

      try {
        const snap = await getDoc(doc(db, 'Live_Form_Requests', requestId));
        if (snap.exists()) {
          const data = snap.data() || {};
          if (data.status !== 'Completed' && data.status !== 'Cancelled') {
            return addRescuedStudent(normalizeFirestoreLiveRequestStudent(snap.id, data));
          }
        }
      } catch (_) {}

      return false;
    };

    const fetchLiveRequestByAgent = async () => {
      const checks = [];

      if (agentData?.id) checks.push(['agentId', agentData.id]);
      if (agentData?.name) checks.push(['agentName', agentData.name]);

      for (const [field, value] of checks) {
        try {
          const snap = await getDocs(query(collection(db, 'Live_Form_Requests'), where(field, '==', value)));

          for (const docSnap of snap.docs) {
            const data = docSnap.data() || {};
            const status = String(data.status || '').toLowerCase();

            if (
              (status === 'accepted' || status === 'in_progress' || status === 'in progress') &&
              data.completed !== true &&
              data.isCompleted !== true &&
              !data.completedAt
            ) {
              return addRescuedStudent(normalizeFirestoreLiveRequestStudent(docSnap.id, data));
            }
          }
        } catch (_) {}
      }

      return false;
    };

    const fetchBackendCurrentQueue = async () => {
      try {
        const data = await liveApiFetch(`/api/live/agent/${agentData.id}/queue`, { timeoutMs: 8000 });
        const queue = (data.queue || []).map(normalizeBackendQueueStudent).filter((student) => student?.id);

        if (queue.length) {
          queue.forEach(addRescuedStudent);
          return true;
        }
      } catch (_) {}

      try {
        const data = await liveApiFetch('/api/live/admin/requests', { timeoutMs: 8000 });
        const requestId = String(agentData?.currentLiveRequestId || '');
        const requests = data.requests || [];

        const matched = requests.find((req) => {
          const reqId = String(req._id || req.requestId || req.id || '');
          const firebaseId = String(req.firebaseRequestId || '');
          const acceptedAgentId = String(req.acceptedAgentEmployeeId || req.acceptedAgentId || req.agentId || '');
          const acceptedAgentName = String(req.acceptedAgentName || req.agentName || '').trim().toLowerCase();

          return (
            (requestId && (reqId === requestId || firebaseId === requestId)) ||
            acceptedAgentId === String(agentData.id) ||
            acceptedAgentName === String(agentData.name || '').trim().toLowerCase()
          );
        });

        if (matched && matched.status !== 'Completed' && matched.status !== 'Cancelled') {
          return addRescuedStudent(normalizeBackendQueueStudent(matched));
        }
      } catch (_) {}

      return false;
    };

    const rescueAssignedStudent = async () => {
      const currentStudentId = agentData?.currentStudentId;
      const currentRequestId = agentData?.currentLiveRequestId;

      if (await fetchQueueDocById(currentStudentId)) return;
      if (await fetchQueueDocByField('backendRequestId', currentRequestId)) return;
      if (await fetchQueueDocByField('liveRequestId', currentRequestId)) return;
      if (await fetchQueueDocByField('firebaseRequestId', currentRequestId)) return;
      if (await fetchLiveRequestById(currentRequestId)) return;
      if (await fetchBackendCurrentQueue()) return;
      if (await fetchLiveRequestByAgent()) return;

      addRescuedStudent({
        id: currentStudentId || currentRequestId || `busy_${agentData.id}`,
        collectionName: '__backend_live_queue__',
        fullName: 'Assigned Student',
        mobile: 'N/A',
        exam: 'Live Form',
        institute: 'Online Student (Website)',
        category: 'General',
        tokenNumber: 'LIVE',
        status: 'Pending',
        paymentStatus: 'Due',
        assignedTo: agentData?.name || '',
        slotDate: todayStr,
        slotTime: 'Live',
        liveRequestId: currentRequestId || currentStudentId || `busy_${agentData.id}`,
        backendRequestId: currentRequestId || null,
        firebaseRequestId: null,
        documents: {},
        vaultDocuments: {},
        timestamp: new Date().toISOString(),
        _lastResortBusyCard: true,
      });
    };

    rescueAssignedStudent();
    const interval = window.setInterval(rescueAssignedStudent, 3500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    isAuthenticated,
    agentData?.id,
    agentData?.name,
    agentData?.busy,
    agentData?.isBusy,
    agentData?.currentLiveRequestId,
    agentData?.currentStudentId,
  ]);

  useEffect(() => {
    if (!isOnlineAgent || !isLiveOnline || !agentData?.id) {
      liveOfferIdsRef.current = '';
      setLiveRequests([]);
      return undefined;
    }

    let mounted = true;

    const syncAndRegisterAgent = async () => {
      try {
        await liveApiFetch('/api/live/agent/sync', {
          method: 'POST',
          body: JSON.stringify({
            employeeId: agentData.id,
            name: agentData.name,
            institute: agentData.institute || 'Online',
            phone: agentData.phone || agentData.mobile || '',
            email: agentData.email || '',
            skills: Array.isArray(agentData.skills) && agentData.skills.length ? agentData.skills : ['ALL'],
            agentType: 'online',
            isOnlineAgent: true,
          }),
        });

        registerLiveAgent(agentData.id);

        await liveApiFetch(`/api/live/agent/${agentData.id}/heartbeat`, { method: 'POST' });

        const data = await liveApiFetch(`/api/live/agent/${agentData.id}/offers`);
        const offers = (data.offers || []).map(normalizeLiveOffer).filter((offer) => offer.id);
        if (mounted && !isAgentBusyRef.current) setLiveRequestsIfChanged(offers);
      } catch (error) {
        console.error('Live agent sync/listen failed:', error);
      }
    };

    const handleNewOffer = (payload = {}) => {
      if (isAgentBusyRef.current) return;
      const offer = normalizeLiveOffer(payload);
      if (!offer.id) return;
      setLiveRequestsIfChanged([offer]);
      const expiry = getExactMillis(offer.offerExpiresAt || offer.expiresAt, Date.now() + LIVE_OFFER_DURATION_MS);
      setOfferCountdown(Math.max(0, Math.ceil((expiry - Date.now()) / 1000)));
    };

    const handleAccepted = (payload = {}) => {
      const id = payload.requestId || payload.firebaseRequestId;
      if (id) removeLiveRequestLocally(id);
    };

    const handleCompleted = (payload = {}) => {
      const id = payload.requestId || payload.firebaseRequestId;
      if (!id) return;
      setLiveRequests(prev => prev.filter(item => item?.id !== id && item?.backendRequestId !== id && item?.firebaseRequestId !== id));
      setAssignedStudents(prev => prev.map(item => {
        if (item?.backendRequestId === id || item?.liveRequestId === id || item?.firebaseRequestId === id) {
          const updates = {
            status: 'Completed',
            completed: true,
            isCompleted: true,
            completedAt: new Date().toISOString(),
            applicationNumber: payload.applicationNumber || item.applicationNumber || 'N/A',
          };
          saveCompletedOverride(item, updates);
          return applyCompletedOverride({ ...item, ...updates });
        }
        return applyCompletedOverride(item);
      }));
    };

    const syncBackendQueue = async () => {
      try {
        const data = await liveApiFetch(`/api/live/agent/${agentData.id}/queue`, { timeoutMs: 8000 });
        const backendQueue = (data.queue || [])
          .map(normalizeBackendQueueStudent)
          .filter((student) => student?.id);

        if (!backendQueue.length) return;

        backendQueue.forEach(storePendingAcceptedStudent);

        if (mounted) {
          setAssignedStudents(prev => {
            const merged = [...prev];

            backendQueue.forEach((student) => {
              if (!merged.some((item) => sameQueueStudent(item, student))) {
                merged.push(student);
              }
            });

            return mergePendingAcceptedStudents(merged);
          });
        }
      } catch (error) {
        console.warn('Backend queue sync skipped:', error);
      }
    };

    syncAndRegisterAgent();
    syncBackendQueue();

    const cleanupSocket = subscribeAgentLiveEvents({
      onOfferNew: handleNewOffer,
      onAccepted: handleAccepted,
      onCompleted: handleCompleted,
    });

    const heartbeat = window.setInterval(() => {
      liveApiFetch(`/api/live/agent/${agentData.id}/heartbeat`, { method: 'POST' }).catch(() => {});
    }, 15000);

    const offerPoller = window.setInterval(async () => {
      try {
        const data = await liveApiFetch(`/api/live/agent/${agentData.id}/offers`, { timeoutMs: 8000 });
        const offers = (data.offers || []).map(normalizeLiveOffer).filter((offer) => offer.id);
        if (mounted && !isAgentBusyRef.current) setLiveRequestsIfChanged(offers);
      } catch {}
    }, 2500);

    const backendQueuePoller = window.setInterval(syncBackendQueue, 4000);

    return () => {
      mounted = false;
      window.clearInterval(heartbeat);
      window.clearInterval(offerPoller);
      window.clearInterval(backendQueuePoller);
      cleanupSocket();
    };
  }, [isOnlineAgent, isLiveOnline, agentData?.id]);

  useEffect(() => {
    if(!walkInForm.institute) return;
    let colName = walkInForm.institute === "Ribosome Institute" ? "Ribosome_Students" : walkInForm.institute === "Unacademy" ? "Unacademy_Students" : "Other_Students";
    
    const checkCapacity = async () => {
      const qAgents = query(collection(db, "Employees"), where("institute", "==", walkInForm.institute), where("active", "==", true));
      const agentSnap = await getDocs(qAgents);
      let activeAgents = 0;
      agentSnap.forEach(docSnap => { 
        const data = docSnap.data() || {};
        const isOnLeave = data.leaves?.includes(todayStr);
        if (data.onBreak !== true && !isOnLeave) activeAgents++; 
      });
      setInstituteCapacity(activeAgents);
    };
    checkCapacity();

    const qBookings = query(collection(db, colName), where("slotDate", "==", todayStr));
    const unsub = onSnapshot(qBookings, (snapshot) => {
      const slotCounts = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data() || {};
        if (data.status === 'Pending' || data.status === 'In Progress' || data.status === 'Assigned') {
          slotCounts[data.slotTime] = (slotCounts[data.slotTime] || 0) + 1;
        }
      });
      setBookedSlotsInfo(slotCounts);
    });

    return () => unsub();
  }, [walkInForm.institute, todayStr]);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoggingIn(true); setError('');
    try {
      const q = query(collection(db, "Employees"), where("pin", "==", pin));
      const snap = await getDocs(q); let found = false;
      snap.forEach(document => { 
        const data = document.data() || {}; 
        if (data.name?.trim().toLowerCase() === agentName.trim().toLowerCase()) { 
          setAgentData({ id: document.id, ...data });
          setIsAuthenticated(true);
          setIsLiveOnline(data?.isLiveOnline === true || data?.liveStatus === 'online' || data?.onlineStatus === 'live');
          found = true; 
          localStorage.setItem('edufill_agent_session', document.id);
        } 
      });
      if (!found) setError("Invalid Agent ID or PIN.");
    } catch (err) { setError("Network Error. Check connection."); } finally { setLoggingIn(false); }
  };

  const handleLiveStatusChange = async (nextStatus) => {
    const nextLiveStatus = Boolean(nextStatus);
    setIsLiveOnline(nextLiveStatus);

    if (!agentData?.id) return;

    const updates = {
      isLiveOnline: nextLiveStatus,
      liveStatus: nextLiveStatus ? 'online' : 'offline',
      onlineStatus: nextLiveStatus ? 'live' : 'offline',
      lastSeenAt: serverTimestamp(),
      liveUpdatedAt: serverTimestamp(),
    };

    try {
      await liveApiFetch('/api/live/agent/sync', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: agentData.id,
          name: agentData.name,
          institute: agentData.institute || 'Online',
          phone: agentData.phone || agentData.mobile || '',
          email: agentData.email || '',
          skills: Array.isArray(agentData.skills) && agentData.skills.length ? agentData.skills : ['ALL'],
        }),
      });

      await liveApiFetch(`/api/live/agent/${agentData.id}/live`, {
        method: 'PATCH',
        body: JSON.stringify({ isLiveOnline: nextLiveStatus }),
      });

      await updateDoc(doc(db, 'Employees', agentData.id), updates);
      setAgentData(prev => prev ? { ...prev, ...updates, lastSeenAt: new Date().toISOString(), liveUpdatedAt: new Date().toISOString() } : prev);

      if (nextLiveStatus) {
        registerLiveAgent(agentData.id);
        try {
          const offerData = await liveApiFetch(`/api/live/agent/${agentData.id}/offers`);
          const offers = (offerData.offers || []).map(normalizeLiveOffer).filter((offer) => offer.id);
          setLiveRequests(offers.slice(0, 1));
        } catch (_) {}
      } else {
        setLiveRequests([]);
      }
    } catch (error) {
      console.error('Live status update failed:', error);
      setIsLiveOnline(!nextLiveStatus);
      alert(error.message || 'Live status update failed. Please try again.');
    }
  };

  const handleLogout = () => {
    if (agentData?.id) {
      liveApiFetch(`/api/live/agent/${agentData.id}/live`, {
        method: 'PATCH',
        body: JSON.stringify({ isLiveOnline: false }),
      }).catch(console.error);

      updateDoc(doc(db, 'Employees', agentData.id), {
        isLiveOnline: false,
        liveStatus: 'offline',
        onlineStatus: 'offline',
        busy: false,
        isBusy: false,
        currentLiveRequestId: null,
        currentStudentId: null,
        lastSeenAt: serverTimestamp(),
      }).catch(console.error);
    }
    try { getLiveSocket().disconnect(); } catch(e) {}
    setIsAuthenticated(false);
    setAgentData(null);
    setIsLiveOnline(false);
    setOnlineAgents([]);
    localStorage.removeItem('edufill_agent_session');
  };
  
  const toggleBreakStatus = async () => { 
    if (!agentData?.id) return;
    const nextBreakStatus = !agentData.onBreak;

    const updates = {
      onBreak: nextBreakStatus,
      breakUpdatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(doc(db, 'Employees', agentData.id), updates);
      setAgentData(prev => prev ? { ...prev, onBreak: nextBreakStatus } : prev);
    } catch (error) {
      console.error('Break status update failed:', error);
      alert('Failed to update break status. Please try again.');
    }
  };

  const upsertAssignedStudent = (student) => {
    if (!student?.id && !student?.backendRequestId && !student?.liveRequestId) return;

    const safeStudent = storePendingAcceptedStudent(student);

    setAssignedStudents(prev => {
      const withoutSame = prev.filter(item => !sameQueueStudent(item, safeStudent));
      return mergePendingAcceptedStudents([safeStudent, ...withoutSame]);
    });
    setLoading(false);
  };

  const updateStudentInLocalState = (id, colName, updates = {}) => {
    if (!id || !colName) return;

    setAssignedStudents(prev => {
      const next = prev.map(item => {
        if (item.id === id && item.collectionName === colName) {
          const updated = applyCompletedOverride({ ...item, ...updates });
          storePendingAcceptedStudent(updated);
          return updated;
        }
        return applyCompletedOverride(item);
      });

      return mergePendingAcceptedStudents(next);
    });

    setSelectedStudent(prev =>
      prev?.id === id && prev?.collectionName === colName ? applyCompletedOverride({ ...prev, ...updates }) : prev
    );
  };

  const removeLiveRequestLocally = (requestIdToRemove) => {
    if (!requestIdToRemove) return;
    setLiveRequests(prev => prev.filter(item => item?.id !== requestIdToRemove));
  };


  const fetchAvailableOnlineAgents = async () => {
    try {
      const snap = await getDocs(collection(db, 'Employees'));
      const agents = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() || {};
        const agent = { id: docSnap.id, ...data };
        if (isOnlineAgentEmployee(agent)) agents.push(agent);
      });
      return agents;
    } catch (error) {
      console.warn('Fresh online agent lookup failed:', error);
      return onlineAgentsRef.current || [];
    }
  };

  const routeRequestToNextAgent = async (request, options = {}) => {
    if (!request?.id) return null;
    if (routingRequestRef.current.has(request.id)) return null;

    routingRequestRef.current.add(request.id);

    try {
      const freshAgents = await fetchAvailableOnlineAgents();
      const reqRef = doc(db, "Live_Form_Requests", request.id);

      const routedRequest = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(reqRef);
        if (!snap.exists()) return null;

        const latestData = snap.data() || {};
        const latestRequest = { id: snap.id, ...latestData };

        if (latestData.status !== 'Searching') return null;

        const hasOfferOwner = Boolean(getCurrentOfferAgentId(latestRequest) || getCurrentOfferAgentName(latestRequest));
        const offerStillActive = hasOfferOwner && !isOfferExpired(latestRequest);

        if (offerStillActive && !options.force) return null;

        let requestForPick = { ...latestRequest };
        let skippedByThisStep = null;

        if (hasOfferOwner && isOfferExpired(latestRequest)) {
          skippedByThisStep = {
            id: getCurrentOfferAgentId(latestRequest),
            name: latestRequest.offerAgentName || latestRequest.currentOfferAgentName || getCurrentOfferAgentName(latestRequest) || 'Previous agent',
          };
          requestForPick = buildSkippedRequest(requestForPick, skippedByThisStep);
        }

        if (options.skipAgentId || options.skipAgentName) {
          skippedByThisStep = {
            id: options.skipAgentId || agentData?.id,
            name: options.skipAgentName || agentData?.name,
          };
          requestForPick = buildSkippedRequest(requestForPick, skippedByThisStep);
        }

        const nextAgent = pickNextOnlineAgentForRequest(
          requestForPick,
          freshAgents,
          options.allowFallbackToCurrent ? { ...agentData, isLiveOnline: true, liveStatus: 'online' } : null
        );

        const updatePayload = {
          status: 'Searching',
          agentId: null,
          agentName: null,
          skippedAgentIds: requestForPick.skippedAgentIds || [],
          skippedAgentNames: requestForPick.skippedAgentNames || [],
          lastRoutingAt: serverTimestamp(),
          routingReason: options.reason || 'rapido_sequential_dispatch',
        };

        if (skippedByThisStep?.id || skippedByThisStep?.name) {
          updatePayload.lastSkippedBy = skippedByThisStep?.name || 'Agent';
          updatePayload.lastSkippedAgentId = skippedByThisStep?.id || null;
          updatePayload.lastSkippedAt = serverTimestamp();
          updatePayload.lastSkipReason = options.reason || 'skip_or_timeout';
          updatePayload.skipCount = increment(1);
        }

        if (nextAgent?.id) {
          const offerPayload = buildOfferPayload(nextAgent);
          Object.assign(updatePayload, offerPayload, {
            routingStatus: 'offered',
            noAgentAvailable: false,
            nextOfferAgentId: nextAgent.id,
            nextOfferAgentName: nextAgent.name || 'Agent',
          });

          transaction.update(reqRef, updatePayload);
          transaction.update(doc(db, 'Employees', nextAgent.id), {
            lastLiveOfferAt: serverTimestamp(),
            lastSeenAt: serverTimestamp(),
          });

          return { ...latestRequest, ...updatePayload, ...offerPayload };
        }

        transaction.update(reqRef, {
          ...updatePayload,
          ...clearOfferPayload(),
          routingStatus: 'waiting_for_online_agent',
          noAgentAvailable: true,
          nextOfferAgentId: null,
          nextOfferAgentName: null,
        });

        return null;
      });

      if (routedRequest && isRequestOfferedToAgent(routedRequest, agentData)) {
        setLiveRequests([routedRequest]);
        setOfferCountdown(Math.max(0, Math.ceil((getOfferExpiryMs(routedRequest) - Date.now()) / 1000)));
      }

      return routedRequest;
    } catch (error) {
      console.warn('Rapido-style request routing failed:', error);
      return null;
    } finally {
      routingRequestRef.current.delete(request.id);
    }
  };

  const claimLiveRequestForAgent = async (request) => {
    return routeRequestToNextAgent(request, {
      reason: 'claim_free_request',
      allowFallbackToCurrent: true,
    });
  };

  const handleWalkInChange = (e) => {
    if (e.target.name === 'slotDate' && bookingSettings?.holidays?.includes(e.target.value)) {
      alert("Center is closed today (Holiday)."); setWalkInForm({ ...walkInForm, slotDate: '' }); return;
    }
    setWalkInForm({ ...walkInForm, [e.target.name]: e.target.value });
  };
  
  const submitWalkIn = async (e) => {
    e.preventDefault(); setSavingWalkIn(true);
    try {
      if(instituteCapacity === 0) { alert("No agents available. Cannot add walk-in."); setSavingWalkIn(false); return; }
      let col = walkInForm.institute === "Ribosome Institute" ? "Ribosome_Students" : walkInForm.institute === "Unacademy" ? "Unacademy_Students" : "Other_Students";
      const walkInPayload = { 
        ...walkInForm, tokenNumber: "EDU-" + Math.floor(100000 + Math.random() * 900000), status: 'Arrived', paymentStatus: 'Due', photoDelivered: false, confirmationDelivered: false, assignedTo: agentData.name, timestamp: serverTimestamp() 
      };
      const newDocRef = await addDoc(collection(db, col), walkInPayload);
      upsertAssignedStudent({ ...walkInPayload, id: newDocRef.id, collectionName: col, timestamp: new Date().toISOString() });
      await updateDoc(doc(db, "Employees", agentData.id), { assignedCount: (agentData.assignedCount || 0) + 1 });
      setIsWalkInModalOpen(false); setWalkInForm({ exam: '', institute: '', fullName: '', mobile: '', batchName: '', category: '', slotDate: todayStr, slotTime: '' });
      if(window.confirm("Do you want to upload their documents now?")) { 
        setUploadTarget({id: newDocRef.id, collectionName: col, fullName: walkInForm.fullName, category: walkInForm.category}); setTimeout(() => setIsUploadModalOpen(true), 300); 
      }
    } catch (err) { alert("Failed to add Walk-in."); } finally { setSavingWalkIn(false); }
  };

  const handleCancelLiveRequest = async (request, options = {}) => {
    if (!request?.id || !agentData?.id) return;

    const { auto = false } = options;

    if (!auto) {
      const studentName = request?.name || 'this student';
      const examName = request?.exam || 'this form';
      const confirmed = window.confirm(`Skip ${examName} request from ${studentName}? It will be offered to the next available agent.`);
      if (!confirmed) return;
    }

    if (autoSkipInProgressRef.current === request.id) return;
    autoSkipInProgressRef.current = request.id;
    setCancelingLiveId(request.id);
    liveOfferIdsRef.current = '';
    removeLiveRequestLocally(request.id);

    try {
      await liveApiFetch(`/api/live/agent/${agentData.id}/request/${request.backendRequestId || request.id}/skip`, {
        method: 'POST',
        body: JSON.stringify({ reason: auto ? 'auto_timeout_10_seconds' : 'manual_skip_before_accept' }),
      });
    } catch (error) {
      console.error(error);
      if (!auto) {
        setLiveRequests(prev => prev.some(item => item?.id === request.id) ? prev : [request, ...prev]);
        alert(error.message || 'Request skip failed. Please try again.');
      }
    } finally {
      setCancelingLiveId(null);
      if (autoSkipInProgressRef.current === request.id) autoSkipInProgressRef.current = null;
    }
  };

  const handleAcceptLiveRequest = async (request) => {
    if (!request?.id || !agentData?.id) return;

    setAcceptingId(request.id);

    const provisionalStudent = storePendingAcceptedStudent({
      id: request.backendRequestId || request.id,
      collectionName: '__backend_live_queue__',
      fullName: request.name || 'Student',
      mobile: request.mobile || 'N/A',
      exam: request.exam || 'N/A',
      institute: 'Online Student (Website)',
      category: 'General',
      tokenNumber: 'LIVE-' + String(request.backendRequestId || request.id).slice(-6).toUpperCase(),
      status: 'Pending',
      paymentStatus: 'Due',
      assignedTo: agentData.name,
      slotDate: todayStr,
      slotTime: 'Live',
      liveRequestId: request.backendRequestId || request.id,
      backendRequestId: request.backendRequestId || request.id,
      firebaseRequestId: request.firebaseRequestId || null,
      userId: request.userId || null,
      userEmail: request.userEmail || '',
      documents: normalizeDocuments(request.documents, request.vaultDocuments),
      vaultDocuments: normalizeDocuments(request.vaultDocuments, request.documents),
      timestamp: new Date().toISOString(),
    });

    clearCompletedOverride(provisionalStudent);
    setAssignedStudents(prev => {
      const withoutSame = prev.filter(item => !sameQueueStudent(item, provisionalStudent));
      return mergePendingAcceptedStudents([{ ...provisionalStudent, status: 'Pending', completed: false, isCompleted: false, completedAt: null }, ...withoutSame]);
    });
    setLoading(false);

    try {
      const data = await liveApiFetch(`/api/live/agent/${agentData.id}/request/${request.backendRequestId || request.id}/accept`, {
        method: 'POST',
      });

      const liveData = data.request || request;
      const backendRequestId = toLiveRequestId(liveData) || request.backendRequestId || request.id;
      const firebaseRequestId = liveData.firebaseRequestId || request.firebaseRequestId || null;
      const requestDocuments = normalizeDocuments(
        request.documents,
        request.vaultDocuments,
        liveData.documents,
        liveData.vaultDocuments
      );

      const queuePayload = {
        fullName: liveData.name || request.name || 'Student',
        mobile: liveData.mobile || request.mobile || 'N/A',
        exam: liveData.exam || request.exam || 'N/A',
        institute: 'Online Student (Website)',
        category: 'General',
        tokenNumber: "WEB-" + Math.floor(100000 + Math.random() * 900000),
        status: 'Pending',
        paymentStatus: 'Due',
        photoDelivered: false,
        confirmationDelivered: false,
        assignedTo: agentData.name,
        slotDate: todayStr,
        slotTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        liveRequestId: backendRequestId,
        backendRequestId,
        firebaseRequestId,
        userId: liveData.firebaseUserId || liveData.userId || request.userId || null,
        userEmail: liveData.userEmail || request.userEmail || '',
        documents: requestDocuments,
        vaultDocuments: requestDocuments,
        vaultUserId: liveData.firebaseUserId || liveData.userId || request.userId || null,
        documentSource: hasAnyDocuments(requestDocuments) ? 'vault' : null,
        timestamp: serverTimestamp(),
      };

      const newDocRef = await addDoc(collection(db, "Other_Students"), queuePayload);
      const localStudent = {
        ...queuePayload,
        id: newDocRef.id,
        collectionName: 'Other_Students',
        timestamp: new Date().toISOString(),
      };

      upsertAssignedStudent(localStudent);
      isAgentBusyRef.current = true;
      liveOfferIdsRef.current = '';
      removeLiveRequestLocally(request.id);

      await updateDoc(doc(db, 'Employees', agentData.id), {
        busy: true,
        isBusy: true,
        currentLiveRequestId: backendRequestId,
        currentStudentId: newDocRef.id,
        lastAcceptedAt: serverTimestamp(),
      });

      setAgentData(prev => prev ? {
        ...prev,
        busy: true,
        isBusy: true,
        currentLiveRequestId: backendRequestId,
        currentStudentId: newDocRef.id,
      } : prev);
    } catch (error) {
      console.error(error);
      alert(error.message || "Error accepting request.");
    } finally {
      setAcceptingId(null);
    }
  };

  useEffect(() => {
    const currentOffer = liveRequests?.[0];

    if (!currentOffer) {
      setOfferCountdown(LIVE_OFFER_DURATION_MS / 1000);
      return undefined;
    }

    const tick = () => {
      const expiryMs = getExactMillis(currentOffer.offerExpiresAt || currentOffer.expiresAt, Date.now() + LIVE_OFFER_DURATION_MS);
      const remainingSeconds = Math.max(0, Math.ceil((expiryMs - Date.now()) / 1000));
      setOfferCountdown(remainingSeconds);

      if (remainingSeconds <= 0 && acceptingId !== currentOffer.id && cancelingLiveId !== currentOffer.id) {
        handleCancelLiveRequest(currentOffer, { auto: true });
      }
    };

    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [liveRequests, acceptingId, cancelingLiveId]);

  const handleReplaceFileChange = (e, docKey) => {
    const file = e.target.files[0];
    if (!file) return;

    setReplaceRawFile(file);
    setReplaceDocKey(docKey);
    setReplaceCompletedCrop(null);
    setReplaceCrop(undefined);

    if (!file.type.startsWith('image/')) {
      processAndUploadReplace(file, docKey);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setReplaceImgSrc(reader.result);
      setReplaceCropModalOpen(true);
    });
    reader.readAsDataURL(file);
  };
  
  const onReplaceImageLoad = (e) => { 
    const { width, height } = e.currentTarget; 
    if(!width || !height) return;
    let aspect = replaceDocKey === 'profilePicUrl' ? 413/446 : replaceDocKey === 'signatureUrl' ? 3/1 : undefined;
    const nextCrop = aspect
      ? centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height)
      : { unit: '%', width: 90, height: 90, x: 5, y: 5 };
    setReplaceCrop(nextCrop);
    setReplaceCompletedCrop(nextCrop);
  };

  const handleReplaceRotate = () => {
    if (!replaceImgSrc) return;

    const image = new Image();
    image.src = replaceImgSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.height;
      canvas.height = image.width;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(image, -image.width / 2, -image.height / 2);
      setReplaceImgSrc(canvas.toDataURL('image/jpeg', 1.0));
      setReplaceCrop(undefined);
      setReplaceCompletedCrop(null);
    };
  };

  const getReplaceProcessedFile = async () => {
    if (!replaceRawFile || !replaceRawFile.type.startsWith('image/')) return replaceRawFile;
    if (!replaceCompletedCrop || !replaceImgRef.current) return replaceRawFile;

    const image = replaceImgRef.current;
    const cropData = replaceCompletedCrop;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropX = cropData.unit === '%' ? (cropData.x / 100) * image.width : cropData.x;
    const cropY = cropData.unit === '%' ? (cropData.y / 100) * image.height : cropData.y;
    const cropW = cropData.unit === '%' ? (cropData.width / 100) * image.width : cropData.width;
    const cropH = cropData.unit === '%' ? (cropData.height / 100) * image.height : cropData.height;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, cropW * scaleX);
    canvas.height = Math.max(1, cropH * scaleY);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      cropX * scaleX,
      cropY * scaleY,
      cropW * scaleX,
      cropH * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(new File([blob], `replace_${replaceRawFile.name || 'document.jpg'}`, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.95);
    });
  };
  
  const handleReplaceCropSave = async () => {
    const processedFile = await getReplaceProcessedFile();
    setReplaceCropModalOpen(false);
    processAndUploadReplace(processedFile, replaceDocKey);
  };
  const processAndUploadReplace = async (fileBlob, docKey) => {
    if (!selectedStudent || !selectedStudent.collectionName || !selectedStudent.id) return alert('Student record not found.');

    setReplacingDoc(docKey); 
    try {
      const formData = new FormData();
      formData.append("file", fileBlob);
      formData.append("upload_preset", "edufill_docs");

      const response = await fetch(`https://api.cloudinary.com/v1_1/dvocl6wvq/auto/upload`, { method: "POST", body: formData });
      const data = await response.json();
      const newFileUrl = data.secure_url;

      if (!newFileUrl) throw new Error('Cloudinary upload failed.');

      const updatedDocsMap = normalizeDocuments(selectedStudent?.documents, selectedStudent?.vaultDocuments, { [docKey]: newFileUrl });
      const studentDocRef = doc(db, selectedStudent.collectionName, selectedStudent.id);

      await updateDoc(studentDocRef, {
        documents: updatedDocsMap,
        vaultDocuments: updatedDocsMap,
        documentSource: selectedStudent?.documentSource || 'agent',
        vaultUserId: selectedStudent?.vaultUserId || null,
      });

      if (selectedStudent?.vaultUserId) {
        await updateDoc(doc(db, 'Users', selectedStudent.vaultUserId), { documents: updatedDocsMap, vaultDocuments: updatedDocsMap });
      }

      const updatedStudent = { ...selectedStudent, documents: updatedDocsMap };
      setSelectedStudent(updatedStudent);
      setAssignedStudents(prev => prev.map(item => item.id === selectedStudent.id && item.collectionName === selectedStudent.collectionName ? updatedStudent : item));
      alert("Document Replaced Successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to replace document");
    } finally {
      setReplacingDoc(null);
      setReplaceRawFile(null);
      setReplaceImgSrc('');
      setReplaceDocKey('');
    }
  };

  const togglePhotoDeliveryStatus = async (id, colName, status) => {
    const nextStatus = !status;
    const updates = { photoDelivered: nextStatus, photoDeliveredAt: nextStatus ? new Date().toISOString() : null };
    updateStudentInLocalState(id, colName, updates);
    try {
      await updateDoc(doc(db, colName, id), updates);
    } catch (error) {
      console.error(error);
      updateStudentInLocalState(id, colName, { photoDelivered: status });
      alert('Photo status update failed.');
    }
  };

  const toggleConfirmationStatus = async (id, colName, status) => {
    const nextStatus = !status;
    const updates = { confirmationDelivered: nextStatus, confirmationDeliveredAt: nextStatus ? new Date().toISOString() : null };
    updateStudentInLocalState(id, colName, updates);
    try {
      await updateDoc(doc(db, colName, id), updates);
    } catch (error) {
      console.error(error);
      updateStudentInLocalState(id, colName, { confirmationDelivered: status });
      alert('Confirmation status update failed.');
    }
  };

  const openPaymentModal = (student) => {
    setPaymentData({ id: student.id, colName: student.collectionName, amount: student.paymentAmount || '', method: student.paymentMethod || 'Online' });
    setIsPaymentModalOpen(true);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    setSavingPayment(true);
    const updates = { paymentStatus: 'Paid', paymentAmount: paymentData.amount, paymentMethod: paymentData.method };
    updateStudentInLocalState(paymentData.id, paymentData.colName, updates);
    setIsPaymentModalOpen(false);
    try {
      await updateDoc(doc(db, paymentData.colName, paymentData.id), updates);
    } catch (error) {
      console.error(error);
      alert('Payment update failed. Please try again.');
    } finally {
      setSavingPayment(false);
    }
  };

  const markAsArrived = async (id, col) => {
    updateStudentInLocalState(id, col, { status: 'Arrived' });
    try {
      await updateDoc(doc(db, col, id), { status: 'Arrived' });
    } catch (error) {
      console.error(error);
      alert('Failed to mark arrived.');
    }
  };

  const markAsAbsent = async (id, col) => {
    if(window.confirm("Marking Absent will reopen this time slot for others. Continue?")) {
      updateStudentInLocalState(id, col, { status: 'Absent' });
      try {
        await updateDoc(doc(db, col, id), { status: 'Absent' });
        await updateDoc(doc(db, "Employees", agentData.id), { assignedCount: Math.max(0, (agentData.assignedCount || 1) - 1) });
      } catch (error) {
        console.error(error);
        alert('Failed to mark absent.');
      }
    }
  };

  // 🌟 FIX: Made Application Number Mandatory before completing 🌟
  const markAsCompleted = async (student) => {
    const appNumber = window.prompt("Enter Generated Application Number to Mark Done:");
    
    if (appNumber === null) return; // User clicked Cancel
    
    if (appNumber.trim() === '') {
      alert("❌ Application Number is mandatory to mark the form as completed.");
      return; 
    }

    const applicationNumber = appNumber.trim();

    const completePayload = {
      status: 'Completed',
      applicationNumber,
      completedAt: serverTimestamp(),
      completedBy: agentData?.name || student?.assignedTo || null,
      completed: true,
      isCompleted: true,
    };

    const localUpdates = {
      status: 'Completed',
      applicationNumber,
      completedAt: new Date().toISOString(),
      completedBy: agentData?.name || student?.assignedTo || null,
      completed: true,
      isCompleted: true,
    };

    saveCompletedOverride(student, localUpdates);
    updateStudentInLocalState(student?.id, student?.collectionName, localUpdates);

    const liveRequestIdForBackend = student?.backendRequestId || student?.liveRequestId || student?.firebaseRequestId || null;
    const firebaseRequestIdForFirestore = student?.firebaseRequestId || student?.liveRequestId || null;

    if (liveRequestIdForBackend) {
      try { getLiveSocket().emit('close_and_delete_chat', { roomId: liveRequestIdForBackend }); } catch(e){}
      setChatTarget(null);
    }

    const tryUpdateDocSafe = async (collectionName, id, data, label = 'doc') => {
      if (!collectionName || !id) return false;
      try {
        await updateDoc(doc(db, collectionName, id), data);
        console.info(`✅ ${label} completed:`, collectionName, id);
        return true;
      } catch (error) {
        console.warn(`⚠️ ${label} update skipped:`, collectionName, id, error);
        return false;
      }
    };

    const updateMatchingDocsSafe = async (collectionName, field, value, data, label = 'matching docs') => {
      if (!collectionName || !field || value === undefined || value === null || value === '') return 0;

      try {
        const snap = await getDocs(query(collection(db, collectionName), where(field, '==', value)));
        let count = 0;

        for (const docSnap of snap.docs) {
          const row = docSnap.data() || {};
          const sameAgent =
            !agentData?.name ||
            !row.assignedTo ||
            String(row.assignedTo).trim().toLowerCase() === String(agentData.name).trim().toLowerCase();

          const sameStudent =
            !student?.mobile ||
            !row.mobile ||
            String(row.mobile).replace(/\D/g, '').slice(-10) === String(student.mobile).replace(/\D/g, '').slice(-10);

          if (sameAgent || sameStudent || field.includes('RequestId')) {
            await updateDoc(doc(db, collectionName, docSnap.id), data);
            count += 1;
          }
        }

        if (count) console.info(`✅ ${label} completed:`, collectionName, field, value, count);
        return count;
      } catch (error) {
        console.warn(`⚠️ ${label} lookup skipped:`, collectionName, field, value, error);
        return 0;
      }
    };

    let firestoreWriteCount = 0;

    try {
      if (await tryUpdateDocSafe(student?.collectionName, student?.id, completePayload, 'visible queue record')) {
        firestoreWriteCount += 1;
      }

      if (!firestoreWriteCount && student?.id) {
        for (const col of ['Other_Students', 'Slot_Bookings']) {
          if (await tryUpdateDocSafe(col, student.id, completePayload, 'fallback queue record')) {
            firestoreWriteCount += 1;
            break;
          }
        }
      }

      for (const col of ['Other_Students', 'Slot_Bookings']) {
        firestoreWriteCount += await updateMatchingDocsSafe(col, 'liveRequestId', liveRequestIdForBackend, completePayload, 'liveRequestId queue record');
        firestoreWriteCount += await updateMatchingDocsSafe(col, 'backendRequestId', liveRequestIdForBackend, completePayload, 'backendRequestId queue record');
        firestoreWriteCount += await updateMatchingDocsSafe(col, 'firebaseRequestId', firebaseRequestIdForFirestore, completePayload, 'firebaseRequestId queue record');
      }

      if (!firestoreWriteCount && student?.mobile) {
        for (const col of ['Other_Students', 'Slot_Bookings']) {
          firestoreWriteCount += await updateMatchingDocsSafe(col, 'mobile', student.mobile, completePayload, 'mobile queue record');
        }
      }

      if (firebaseRequestIdForFirestore) {
        if (await tryUpdateDocSafe('Live_Form_Requests', firebaseRequestIdForFirestore, {
          status: 'Completed',
          applicationNumber,
          completedAt: serverTimestamp(),
          completedBy: agentData?.name || student?.assignedTo || null,
          completed: true,
          isCompleted: true,
        }, 'legacy Live_Form_Requests')) {
          firestoreWriteCount += 1;
        }
      }

      if (liveRequestIdForBackend && agentData?.id) {
        await liveApiFetch(`/api/live/agent/${agentData.id}/request/${liveRequestIdForBackend}/complete`, {
          method: 'POST',
          body: JSON.stringify({
            applicationNumber,
            legacySafe: true,
            forceComplete: true,
            queueStudentId: student?.id || null,
            collectionName: student?.collectionName || null,
            firebaseRequestId: firebaseRequestIdForFirestore || null,
          }),
        }).catch((backendError) => {
          console.warn('⚠️ Backend complete skipped for legacy/stuck request:', backendError);
        });
      }

      if (agentData?.id) {
        await updateDoc(doc(db, 'Employees', agentData.id), {
          busy: false,
          isBusy: false,
          currentLiveRequestId: null,
          currentStudentId: null,
          lastCompletedAt: serverTimestamp(),
        }).catch((error) => {
          console.warn('⚠️ Employee Firestore unlock skipped:', error);
        });

        await liveApiFetch(`/api/live/agent/${agentData.id}/unblock`, {
          method: 'POST',
          body: JSON.stringify({
            requestId: liveRequestIdForBackend,
            firebaseRequestId: firebaseRequestIdForFirestore,
            applicationNumber,
            keepOnline: isLiveOnline,
          }),
        }).catch(async (unblockError) => {
          console.warn('⚠️ Backend unblock endpoint failed, using live toggle fallback:', unblockError);

          await liveApiFetch(`/api/live/agent/${agentData.id}/live`, {
            method: 'PATCH',
            body: JSON.stringify({ isLiveOnline: false }),
          }).catch(() => {});

          if (isLiveOnline) {
            await liveApiFetch(`/api/live/agent/${agentData.id}/live`, {
              method: 'PATCH',
              body: JSON.stringify({ isLiveOnline: true }),
            }).catch(() => {});
          }
        });

        isAgentBusyRef.current = false;
        isAgentBusyRef.current = false;
        setAgentData(prev => prev ? {
          ...prev,
          busy: false,
          isBusy: false,
          currentLiveRequestId: null,
          currentStudentId: null,
        } : prev);
      }

      saveCompletedOverride(student, localUpdates);
      updateStudentInLocalState(student?.id, student?.collectionName, localUpdates);

      if (!firestoreWriteCount) {
        console.warn('⚠️ No Firestore queue row was matched, but agent was unlocked locally/backend.');
      }

      alert('Marked Done successfully. Agent is unlocked for next request.');
    } catch (error) {
      console.error('Emergency Mark Done fallback used:', error);

      try {
        if (agentData?.id) {
          await updateDoc(doc(db, 'Employees', agentData.id), {
            busy: false,
            isBusy: false,
            currentLiveRequestId: null,
            currentStudentId: null,
            lastCompletedAt: serverTimestamp(),
          }).catch(() => {});

          await liveApiFetch(`/api/live/agent/${agentData.id}/live`, {
            method: 'PATCH',
            body: JSON.stringify({ isLiveOnline: false }),
          }).catch(() => {});

          if (isLiveOnline) {
            await liveApiFetch(`/api/live/agent/${agentData.id}/live`, {
              method: 'PATCH',
              body: JSON.stringify({ isLiveOnline: true }),
            }).catch(() => {});
          }

          setAgentData(prev => prev ? {
            ...prev,
            busy: false,
            isBusy: false,
            currentLiveRequestId: null,
            currentStudentId: null,
          } : prev);
        }

        saveCompletedOverride(student, localUpdates);
        updateStudentInLocalState(student?.id, student?.collectionName, localUpdates);
        alert('Legacy stuck form was force-unlocked. Please refresh once and try new request.');
      } catch (fatalError) {
        console.error('Force unlock failed:', fatalError);
        alert('Force unlock failed. Send console error screenshot.');
      }
    }
  };

  // 🌟 FIX: Implemented logic to Edit Application Number 🌟
  const editApplicationNumber = async (student) => {
    const currentAppNum = student?.applicationNumber && student.applicationNumber !== 'N/A' ? student.applicationNumber : '';
    const newAppNum = window.prompt("Edit Application Number:", currentAppNum);

    if (newAppNum === null || newAppNum.trim() === '' || newAppNum.trim() === currentAppNum) {
      return; 
    }

    const applicationNumber = newAppNum.trim();
    const localUpdates = { applicationNumber };

    saveCompletedOverride(student, localUpdates);
    updateStudentInLocalState(student?.id, student?.collectionName, localUpdates);

    try {
      if (student?.collectionName && student?.id) {
        await updateDoc(doc(db, student.collectionName, student.id), { applicationNumber });
      }
      const firebaseRequestIdForFirestore = student?.firebaseRequestId || student?.liveRequestId || null;
      if (firebaseRequestIdForFirestore) {
         await updateDoc(doc(db, 'Live_Form_Requests', firebaseRequestIdForFirestore), { applicationNumber }).catch(() => {});
      }
      alert("Application Number updated successfully.");
    } catch (error) {
      console.error("Failed to edit app number:", error);
      alert("Failed to update application number in database.");
    }
  };

  const sendReminder = (mobile, name, reportingTime) => {
    window.open(`https://wa.me/91${mobile || ''}?text=${encodeURIComponent(`Hello ${name || 'Student'}, your EduFill slot is soon. Please reach by ${reportingTime || 'your slot time'}. Reply YES if coming.`)}`, '_blank');
  };

  const handleDownloadDoc = async (url, docLabel, studentName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      const cleanLabel = docLabel.replace(/[^\w\s]/gi, '').trim().replace(/\s+/g, '_');
      const cleanName = (studentName || 'Student').replace(/[^\w\s]/gi, '').trim().replace(/\s+/g, '_');
      
      let ext = url.split('.').pop().split(/#|\?/)[0];
      if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext.toLowerCase())) {
         ext = blob.type.includes('pdf') ? 'pdf' : 'jpg';
      }

      link.download = `${cleanName}_${cleanLabel}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed, opening in new tab instead', error);
      window.open(url, '_blank');
    }
  };

  const getAvailableSlots = () => {
    const sIdx = MASTER_TIME_SLOTS.indexOf(bookingSettings?.startTime) !== -1 ? MASTER_TIME_SLOTS.indexOf(bookingSettings?.startTime) : 0; 
    const eIdx = MASTER_TIME_SLOTS.indexOf(bookingSettings?.endTime) !== -1 ? MASTER_TIME_SLOTS.indexOf(bookingSettings?.endTime) : 47;
    const now = new Date();
    return MASTER_TIME_SLOTS.slice(sIdx, eIdx + 1).filter(slotTimeStr => {
      const [time, modifier] = slotTimeStr.split(' '); let [hours, minutes] = time.split(':').map(Number);
      if (hours === 12) hours = 0; if (modifier === 'PM') hours += 12;
      const slotDate = new Date(); slotDate.setHours(hours, minutes, 0, 0);
      return now <= slotDate; 
    });
  };
  const availableSlots = getAvailableSlots();

  if (isInitializing) return <div className="min-h-screen flex items-center justify-center bg-[#0B1121]"><Loader2 className="animate-spin text-indigo-500 w-12 h-12" /></div>;
  if (!isAuthenticated) return <AgentLogin agentName={agentName} setAgentName={setAgentName} pin={pin} setPin={setPin} handleLogin={handleLogin} loggingIn={loggingIn} error={error} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative font-sans selection:bg-emerald-500/25">
      <SEO title="Agent Terminal | EduFill" url="/agent" noindex={true} />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.06),transparent_20%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.06),transparent_22%)]"></div>

      {/* --- MODALS --- */}
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} paymentData={paymentData} setPaymentData={setPaymentData} submitPayment={submitPayment} savingPayment={savingPayment} />
      <WalkInModal isOpen={isWalkInModalOpen} onClose={() => setIsWalkInModalOpen(false)} walkInForm={walkInForm} handleWalkInChange={handleWalkInChange} submitWalkIn={submitWalkIn} savingWalkIn={savingWalkIn} approvedInstitutes={approvedInstitutes} availableSlots={availableSlots} bookedSlotsInfo={bookedSlotsInfo} instituteCapacity={instituteCapacity} isHolidayToday={bookingSettings?.holidays?.includes(todayStr)} todayStr={todayStr} />
      
      {chatTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md animate-in zoom-in-95">
            <button onClick={() => setChatTarget(null)} className="absolute -top-14 right-0 bg-white hover:bg-gray-100 text-gray-800 p-2.5 rounded-full transition-colors shadow-lg">
              <X size={20} />
            </button>
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100">
              <LiveChatBox 
                roomId={chatTarget?.liveRequestId} 
                currentUserType="agent" 
                currentUserId={agentData?.id} 
                otherPersonName={chatTarget?.fullName || 'Student'} 
                onChatClose={() => setChatTarget(null)}
              />
            </div>
          </div>
        </div>
      )}
      
      {isUploadModalOpen && uploadTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl relative shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h3 className="font-black text-xl text-gray-900">Upload Documents</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
            </div>
            <DocumentUploader studentId={uploadTarget?.id} collectionName={uploadTarget?.collectionName} studentName={uploadTarget?.fullName} category={uploadTarget?.category} onComplete={() => { alert("All Documents Uploaded Securely!"); setIsUploadModalOpen(false); setUploadTarget(null); }} />
          </div>
        </div>
      )}

      {replaceCropModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh] shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex justify-between bg-white items-center">
              <h3 className="font-black text-lg flex items-center gap-2 text-gray-900"><CropIcon size={20} className="text-indigo-600"/> Precision Crop Tool</h3>
              <button onClick={() => setReplaceCropModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50/50 p-4 flex justify-center items-center">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                <ReactCrop crop={replaceCrop} onChange={(_, c) => setReplaceCrop(c)} onComplete={c => setReplaceCompletedCrop(c)}>
                  <img ref={replaceImgRef} src={replaceImgSrc} onLoad={onReplaceImageLoad} alt="Crop" style={{ maxHeight: '60vh' }} className="rounded-lg"/>
                </ReactCrop>
              </div>
            </div>
            <div className="p-5 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button onClick={() => setReplaceCropModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleReplaceRotate} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <RotateCw size={18}/> Rotate
              </button>
              <button onClick={handleReplaceCropSave} disabled={!!replacingDoc} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-black py-3.5 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2">
                {replacingDoc ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>} Process & Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {docsModalOpen && selectedStudent && hasAnyDocuments(selectedStudent?.documents, selectedStudent?.vaultDocuments) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-xl shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><FileText size={24} className="text-indigo-600"/> Digital Locker</h3>
                <p className="text-xs font-bold text-gray-500 mt-1">{selectedStudent?.fullName}'s Documents {selectedStudent?.documentSource === 'vault' ? '• Synced from Vault' : ''}</p>
              </div>
              <button onClick={() => setDocsModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              {DOCUMENT_ITEMS.map(item => {
                const url = extractDocumentUrl(normalizeDocuments(selectedStudent?.documents, selectedStudent?.vaultDocuments)?.[item.key]); if (!url) return null; 
                return (
                  <div key={item.key} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 hover:bg-white border border-gray-100 hover:border-emerald-100 rounded-2xl transition-all shadow-sm group gap-3">
                    <span className="font-black text-gray-800 text-sm group-hover:text-emerald-700 transition-colors">{item.label}</span>
                    <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                      <a href={url} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-black shadow-sm transition-colors flex items-center justify-center gap-1.5">
                        <Search size={14}/> View
                      </a>
                      
                      <button onClick={() => handleDownloadDoc(url, item.label, selectedStudent?.fullName)} className="flex-1 sm:flex-none px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-black shadow-sm transition-colors flex items-center justify-center gap-1.5">
                        <Download size={14}/> Download
                      </button>

                      <label className="flex-1 sm:flex-none px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors rounded-xl font-black text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1.5">
                        <Upload size={14}/> Replace
                        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleReplaceFileChange(e, item.key)} />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN UI --- */}
      <AgentHeader 
        agentData={agentData} toggleBreakStatus={toggleBreakStatus} setIsWalkInModalOpen={setIsWalkInModalOpen} 
        handleLogout={handleLogout} isLiveOnline={isLiveOnline} setIsLiveOnline={handleLiveStatusChange} isOnlineAgent={isOnlineAgent}
      />
      
      <main className="flex-1 max-w-[1400px] mx-auto w-full p-4 sm:px-6 lg:px-8 py-8 space-y-8">

        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-r from-[#081527] via-[#0c1d34] to-[#123458] text-white shadow-xl">
          <div className="absolute inset-y-0 right-0 w-72 bg-emerald-500/10 blur-3xl"></div>
          <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center overflow-hidden shadow-lg shrink-0">
                  <img src="/edufill-brand-logo.svg?v=2" alt="EduFill" className="h-9 w-auto object-contain" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">EduFill Operations</p>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">Smart Agent Control Panel</h2>
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed max-w-2xl">
                Handle bookings, walk-ins, documents, payments, queue management, and live student requests from a single secure workspace built for EduFill agents.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[11px] font-black tracking-wide">Fast Queue Handling</span>
                <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[11px] font-black tracking-wide">Live Support Flow</span>
                <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[11px] font-black tracking-wide">Secure Document Access</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full lg:w-[360px]">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300 font-black">Mode</p>
                <p className="mt-2 text-lg font-black text-white">{isOnlineAgent ? 'Online Agent' : 'Camp Agent'}</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300 font-black">Agent Name</p>
                <p className="mt-2 text-lg font-black text-white truncate">{agentData?.name || 'Agent'}</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm col-span-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300 font-black">Workspace</p>
                <p className="mt-2 text-sm font-bold text-slate-100 leading-relaxed">{isOnlineAgent ? 'Handling online student requests and real-time assistance.' : `Assigned center: ${agentData?.institute || 'N/A'} • Manage walk-ins and on-site queue.`}</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* LIVE REQUESTS WIDGET (For Online Agents) */}
        {isOnlineAgent && isLiveOnline && (
          <div className="bg-gradient-to-r from-indigo-900 to-blue-900 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 relative z-10 gap-4">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl"><Zap size={20} className="sm:w-6 sm:h-6 text-amber-400 animate-pulse"/></div> 
                Live Form Requests
              </h2>
              {!isAgentBusy && (
                <span className="bg-white text-indigo-900 text-xs font-black px-4 py-1.5 rounded-full shadow-md flex items-center gap-2">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                  {liveRequests?.length ? '1 Offered' : '0 Waiting'}
                </span>
              )}
            </div>

            {isAgentBusy ? (
              <div className="text-center py-10 text-white relative z-10 bg-black/20 rounded-[1.5rem] border border-white/10 backdrop-blur-sm px-4">
                <AlertCircle className="mx-auto mb-3 text-amber-400" size={36}/>
                <p className="font-black text-lg sm:text-xl">Terminal is Currently Busy</p>
                <p className="text-xs sm:text-sm font-medium text-gray-300 mt-2 max-w-md mx-auto">Please finish your current student's application and mark it as 'Done' to unlock the live queue.</p>
              </div>
            ) : liveRequests?.length === 0 ? (
              <div className="text-center py-12 text-indigo-200 relative z-10 border-2 border-dashed border-white/20 rounded-[1.5rem] bg-white/5 px-4">
                <Loader2 className="animate-spin mx-auto mb-3 text-white" size={32}/>
                <p className="font-black text-base sm:text-lg text-white">Scanning Network...</p>
                <p className="text-xs sm:text-sm font-medium mt-1">Waiting for your turn to receive the next student request.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 relative z-10">
                {liveRequests.map(req => (
                  <div key={req?.id} className="bg-white p-5 rounded-[1.5rem] shadow-xl hover:shadow-2xl transition-all border border-indigo-100 animate-in slide-in-from-bottom-4 group flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <div>
                        <p className="font-black text-gray-900 text-base sm:text-lg leading-tight">{req?.name || 'Student'}</p>
                        <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mt-1.5"><MessageCircle size={14}/> {req?.mobile || 'N/A'}</p>
                      </div>
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-2 sm:px-3 py-1.5 rounded-lg border border-indigo-100 text-right shrink-0">
                        {req?.exam?.split(' ')?.[0] || 'Form'}
                      </span>
                    </div>
                    <div className="mb-4 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-black text-amber-700 uppercase tracking-widest">Accept within</span>
                      <span className="text-lg font-black text-amber-700 tabular-nums">{offerCountdown}s</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => handleCancelLiveRequest(req)}
                        disabled={acceptingId === req?.id || cancelingLiveId === req?.id}
                        className="w-full bg-amber-50 hover:bg-amber-100 disabled:opacity-60 text-amber-700 border border-amber-100 font-black py-3 sm:py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 active:scale-95 shadow-sm text-sm sm:text-base"
                      >
                        {cancelingLiveId === req?.id ? <Loader2 size={18} className="animate-spin"/> : <X size={18}/>}
                        {cancelingLiveId === req?.id ? 'Skipping...' : 'Skip'}
                      </button>

                      <button 
                        onClick={() => handleAcceptLiveRequest(req)}
                        disabled={acceptingId === req?.id || cancelingLiveId === req?.id}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-black py-3 sm:py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 active:scale-95 shadow-md text-sm sm:text-base"
                      >
                        {acceptingId === req?.id ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18}/>}
                        {acceptingId === req?.id ? 'Connecting...' : 'Accept'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🌟 METRICS DASHBOARD 🌟 */}
        <AgentStats 
          assignedStudents={visibleAssignedStudents} 
          pendingCount={visibleAssignedStudents.filter(s => s?.status === 'Pending' || s?.status === 'Arrived').length} 
          completedCount={visibleAssignedStudents.filter(s => s?.status === 'Completed').length} 
          totalCollection={visibleAssignedStudents.reduce((sum, s) => s?.paymentStatus === 'Paid' ? sum + Number(s.paymentAmount || 0) : sum, 0)} 
        />
        
        {/* 🌟 QUEUE TABLE (The Core Panel) 🌟 */}
        <QueueTable 
          loading={loading && visibleAssignedStudents.length === 0} assignedStudents={visibleAssignedStudents} openPaymentModal={openPaymentModal} 
          togglePhotoDeliveryStatus={togglePhotoDeliveryStatus} toggleConfirmationStatus={toggleConfirmationStatus} 
          setSelectedStudent={setSelectedStudent} setDocsModalOpen={setDocsModalOpen} setUploadTarget={setUploadTarget} 
          setIsUploadModalOpen={setIsUploadModalOpen} sendReminder={sendReminder} markAsArrived={markAsArrived} 
          markAsAbsent={markAsAbsent} markAsCompleted={markAsCompleted} editApplicationNumber={editApplicationNumber}
          isOnlineAgent={isOnlineAgent} 
          setChatTarget={setChatTarget}
        />
      </main>
    </div>
  );
}
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bug,
  Lightbulb,
  Star,
  ChevronDown,
  UploadCloud,
  Send,
  Lock,
  ShieldCheck,
  ArrowUpRight,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  Loader2,
  FileText,
  Image as ImageIcon,
  Mail,
  UserRound,
  Phone,
  RotateCcw,
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import SEO from '../components/SEO';
import Header from '../components/home/Header';
import Footer from '../components/Footer';
import { db, storage } from '../firebase';

const FEEDBACK_TYPES = [
  {
    id: 'bug',
    title: 'Bug Report',
    subtitle: "Something isn't working",
    icon: Bug,
    activeClass: 'border-emerald-500 bg-emerald-50 shadow-emerald-100',
    iconClass: 'bg-emerald-100 text-emerald-600',
    textClass: 'text-emerald-900',
  },
  {
    id: 'feature',
    title: 'Feature Suggestion',
    subtitle: 'Share your ideas',
    icon: Lightbulb,
    activeClass: 'border-blue-500 bg-blue-50 shadow-blue-100',
    iconClass: 'bg-blue-100 text-blue-600',
    textClass: 'text-blue-900',
  },
  {
    id: 'review',
    title: 'Review App',
    subtitle: 'Rate & review EduFill',
    icon: Star,
    activeClass: 'border-amber-400 bg-amber-50 shadow-amber-100',
    iconClass: 'bg-amber-100 text-amber-600',
    textClass: 'text-amber-900',
  },
];

const PRIORITIES = [
  {
    id: 'low',
    title: 'Low',
    desc: 'Minor issue',
    className: 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/40',
    iconBox: 'bg-emerald-100 text-emerald-600',
    icon: <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />,
  },
  {
    id: 'medium',
    title: 'Medium',
    desc: 'Affects some users',
    className: 'border-blue-500 bg-blue-50 ring-1 ring-blue-500/40',
    iconBox: 'bg-blue-100 text-blue-600',
    icon: <ArrowUpRight size={14} />,
  },
  {
    id: 'high',
    title: 'High',
    desc: 'Affects many users',
    className: 'border-amber-500 bg-amber-50 ring-1 ring-amber-500/40',
    iconBox: 'bg-amber-100 text-amber-600',
    icon: <AlertCircle size={14} />,
  },
  {
    id: 'critical',
    title: 'Critical',
    desc: 'Blocks usage',
    className: 'border-red-500 bg-red-50 ring-1 ring-red-500/40',
    iconBox: 'bg-red-100 text-red-600',
    icon: <AlertCircle size={14} />,
  },
];

const INITIAL_FORM = {
  pageName: '',
  subject: '',
  description: '',
  steps: '',
  name: '',
  email: '',
  phone: '',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 4;

const ACCEPTED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'video/mp4',
  'application/pdf',
];

function sanitizeText(value, maxLength = 1000) {
  return String(value || '').trim().slice(0, maxLength);
}

function getSelectedFeedbackType(type) {
  return FEEDBACK_TYPES.find((item) => item.id === type) || FEEDBACK_TYPES[0];
}

function createSafeFileId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Feedback() {
  const [feedbackType, setFeedbackType] = useState('bug');
  const [priority, setPriority] = useState('low');
  const [rating, setRating] = useState(5);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  const selectedType = getSelectedFeedbackType(feedbackType);
  const SelectedIcon = selectedType.icon;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const descriptionCount = formData.description.length;

  const requiredFieldLabel = useMemo(() => {
    if (feedbackType === 'bug') return 'Describe your issue';
    if (feedbackType === 'feature') return 'Describe your idea';
    return 'Write your review';
  }, [feedbackType]);

  const descriptionPlaceholder = useMemo(() => {
    if (feedbackType === 'bug') {
      return 'Please describe what happened, what you expected, and what went wrong.';
    }

    if (feedbackType === 'feature') {
      return 'Tell us what feature you want, how it should work, and how it will help students.';
    }

    return 'Share your experience with EduFill. What did you like? What can we improve?';
  }, [feedbackType]);

  const subjectPlaceholder = useMemo(() => {
    if (feedbackType === 'bug') return 'Brief summary of the issue';
    if (feedbackType === 'feature') return 'Brief title of your idea';
    return 'Short title for your review';
  }, [feedbackType]);

  const pagePlaceholder = useMemo(() => {
    if (feedbackType === 'bug') return 'e.g. Live Form Expert, Vault, Mock Test';
    if (feedbackType === 'feature') return 'e.g. Tools page, Vault, Login, Homepage';
    return 'e.g. Overall app, Live Expert, Tools';
  }, [feedbackType]);

  const resetForm = () => {
    setFeedbackType('bug');
    setPriority('low');
    setRating(5);
    setFormData(INITIAL_FORM);
    setAttachments([]);
    setSubmitSuccess(false);
    setErrorMsg('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const limits = {
      pageName: 120,
      subject: 160,
      description: 1000,
      steps: 800,
      name: 80,
      email: 120,
      phone: 15,
    };

    setFormData((prev) => ({
      ...prev,
      [name]: value.slice(0, limits[name] || 1000),
    }));
  };

  const handleFileSelect = (files) => {
    setErrorMsg('');

    const selectedFiles = Array.from(files || []);

    if (!selectedFiles.length) return;

    if (attachments.length >= MAX_ATTACHMENTS) {
      setErrorMsg(`You can upload maximum ${MAX_ATTACHMENTS} files.`);
      return;
    }

    const remainingSlots = MAX_ATTACHMENTS - attachments.length;
    const validFiles = [];

    selectedFiles.slice(0, remainingSlots).forEach((file) => {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        setErrorMsg('Only PNG, JPG, GIF, MP4 and PDF files are allowed.');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg('Each file must be under 10MB.');
        return;
      }

      validFiles.push({
        id: createSafeFileId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    });

    setAttachments((prev) => [...prev, ...validFiles]);

    if (selectedFiles.length > remainingSlots) {
      setErrorMsg(`Only ${MAX_ATTACHMENTS} files are allowed. Extra files were ignored.`);
    }
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const uploadAttachments = async () => {
    if (!attachments.length) return [];

    const uploadTasks = attachments.map(async (item) => {
      const safeName = item.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const today = new Date().toISOString().slice(0, 10);

      const fileRef = ref(
        storage,
        `feedback_uploads/${today}/${createSafeFileId()}_${safeName}`
      );

      await uploadBytes(fileRef, item.file, {
        contentType: item.type,
        customMetadata: {
          source: 'edufill_feedback_page',
        },
      });

      const url = await getDownloadURL(fileRef);

      return {
        name: item.name,
        size: item.size,
        type: item.type,
        url,
      };
    });

    return Promise.all(uploadTasks);
  };

  const validateForm = () => {
    if (!formData.pageName.trim()) return 'Please enter page or feature name.';
    if (!formData.subject.trim()) return 'Please enter subject.';

    if (!formData.description.trim()) {
      return `Please enter ${requiredFieldLabel.toLowerCase()}.`;
    }

    if (formData.description.trim().length < 15) {
      return 'Description should be at least 15 characters.';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email address.';
    }

    if (formData.phone && !/^[0-9+\-\s]{8,15}$/.test(formData.phone)) {
      return 'Please enter a valid phone number.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setErrorMsg(validationMessage);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const uploadedFiles = await uploadAttachments();

      await addDoc(collection(db, 'EduFill_Feedback'), {
        feedbackType,
        priority,
        rating: feedbackType === 'review' ? rating : null,
        pageName: sanitizeText(formData.pageName, 120),
        subject: sanitizeText(formData.subject, 160),
        description: sanitizeText(formData.description, 1000),
        steps: feedbackType === 'bug' ? sanitizeText(formData.steps, 800) : '',
        name: sanitizeText(formData.name, 80),
        email: sanitizeText(formData.email, 120).toLowerCase(),
        phone: sanitizeText(formData.phone, 15),
        attachments: uploadedFiles,
        status: 'new',
        source: 'feedback_page',
        userAgent: navigator.userAgent || '',
        pageUrl: window.location.href,
        createdAt: serverTimestamp(),
      });

      setSubmitSuccess(true);
      setFormData(INITIAL_FORM);
      setAttachments([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Feedback submit error:', error);
      }

      setErrorMsg(
        'Something went wrong while submitting feedback. Please try again or contact EduFill support.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafcfb] flex flex-col font-sans selection:bg-emerald-200 pb-20 lg:pb-0">
      <SEO
        title="Feedback | EduFill"
        description="Help us improve EduFill by sharing your feedback, reporting bugs, or suggesting new features."
        url="/feedback"
      />

      <Header currentUser={null} onOpenFeedback={() => {}} />

      <main className="flex-1 w-full">
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-[#fafcfb] px-4 pt-8 pb-8 sm:px-6 md:px-8 md:pt-12 md:pb-12 border-b border-gray-100">
          <div className="pointer-events-none absolute -top-24 right-10 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-10 h-60 w-60 rounded-full bg-blue-100/70 blur-3xl" />

          <div className="relative max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] items-center gap-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white text-emerald-800 border border-emerald-100 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-5 shadow-sm">
                <Sparkles size={14} className="text-emerald-500" aria-hidden="true" />
                Your Voice, Better EduFill
              </div>

              <h1 className="text-[2.35rem] sm:text-5xl lg:text-[3.65rem] font-black text-gray-950 leading-[1.06] tracking-tight mb-4">
                Help Us Improve <span className="text-emerald-600">EduFill</span>
              </h1>

              <p className="text-sm sm:text-base text-gray-600 font-semibold leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Found a bug, have an idea, or love using EduFill? Tell us. Your feedback helps us build a better experience for every student.
              </p>
            </div>

            <div className="hidden lg:block">
              <div className="relative rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-xl overflow-hidden">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-100 blur-2xl" />

                <div className="relative z-10 flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <MessageSquare size={30} aria-hidden="true" />
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-950">Feedback matters</p>
                    <p className="text-xs font-semibold text-gray-500 mt-1">
                      We read every response.
                    </p>

                    <div className="flex gap-1 mt-3 text-amber-400" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={15} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 relative z-10">
                  <HeroMini icon={<Bug size={16} />} label="Bugs" />
                  <HeroMini icon={<Lightbulb size={16} />} label="Ideas" />
                  <HeroMini icon={<Star size={16} />} label="Review" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {submitSuccess ? (
          <section className="max-w-[760px] mx-auto px-4 md:px-8 py-8">
            <SuccessCard resetForm={resetForm} />
          </section>
        ) : (
          <section className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-8 bg-white rounded-[1.75rem] border border-gray-200 shadow-sm p-4 sm:p-6 md:p-7">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {FEEDBACK_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isActive = feedbackType === type.id;

                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setFeedbackType(type.id);
                        setErrorMsg('');
                      }}
                      className={`flex items-center sm:items-start gap-3 sm:flex-col p-4 rounded-2xl border-2 text-left transition-all ${
                        isActive
                          ? type.activeClass
                          : 'border-gray-100 hover:border-emerald-200 bg-white'
                      }`}
                      aria-pressed={isActive}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          isActive ? type.iconClass : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        <Icon size={21} aria-hidden="true" />
                      </div>

                      <div>
                        <h3
                          className={`text-sm font-black mb-1 ${
                            isActive ? type.textClass : 'text-gray-900'
                          }`}
                        >
                          {type.title}
                        </h3>
                        <p className="text-[11px] font-bold text-gray-500">
                          {type.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-gray-800 mb-2">
                    Feedback Type
                  </label>

                  <div className="relative border border-gray-200 rounded-xl bg-white flex items-center focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                    <div className="pl-4 text-emerald-600">
                      <SelectedIcon size={18} aria-hidden="true" />
                    </div>

                    <select
                      value={feedbackType}
                      onChange={(e) => {
                        setFeedbackType(e.target.value);
                        setErrorMsg('');
                      }}
                      className="w-full bg-transparent p-3.5 appearance-none outline-none text-sm font-bold text-gray-800 cursor-pointer"
                    >
                      {FEEDBACK_TYPES.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={18}
                      className="absolute right-4 text-gray-400 pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {feedbackType === 'review' && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                    <label className="block text-xs font-black text-gray-800 mb-3">
                      Rate your experience
                    </label>

                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setRating(item)}
                          className={`transition-transform active:scale-95 ${
                            item <= rating ? 'text-amber-400' : 'text-gray-300'
                          }`}
                          aria-label={`Rate ${item} star`}
                        >
                          <Star size={26} fill="currentColor" />
                        </button>
                      ))}

                      <span className="ml-2 text-sm font-black text-amber-700">
                        {rating}/5
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField
                    label="Page / Feature Name"
                    required
                    name="pageName"
                    value={formData.pageName}
                    onChange={handleInputChange}
                    placeholder={pagePlaceholder}
                  />

                  <InputField
                    label="Subject"
                    required
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder={subjectPlaceholder}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-800 mb-2">
                    {requiredFieldLabel} <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <textarea
                      required
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      maxLength={1000}
                      placeholder={descriptionPlaceholder}
                      className="w-full bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 p-4 rounded-xl outline-none font-medium text-sm text-gray-800 transition-all min-h-[128px] resize-y"
                    />

                    <div
                      className={`absolute bottom-3 right-4 text-[10px] font-bold ${
                        descriptionCount > 900 ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      {descriptionCount} / 1000
                    </div>
                  </div>
                </div>

                {feedbackType === 'bug' && (
                  <div>
                    <label className="block text-xs font-black text-gray-800 mb-1">
                      Steps to Reproduce
                    </label>

                    <p className="text-[10px] font-bold text-gray-500 mb-2">
                      List the steps to reproduce the issue if possible.
                    </p>

                    <textarea
                      name="steps"
                      value={formData.steps}
                      onChange={handleInputChange}
                      placeholder={`1. Go to...\n2. Click on...\n3. See error...`}
                      className="w-full bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 p-4 rounded-xl outline-none font-medium text-sm text-gray-800 transition-all min-h-[105px] resize-y"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">
                    Attach Screenshot{' '}
                    <span className="text-gray-400 font-medium">(optional)</span>
                  </label>

                  <p className="text-[10px] font-bold text-gray-500 mb-2">
                    PNG, JPG, GIF, MP4 or PDF up to 10MB. Max 4 files.
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileSelect(e.dataTransfer.files);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className="w-full border-2 border-dashed border-gray-200 hover:border-emerald-400 bg-gray-50/70 hover:bg-emerald-50/40 rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group"
                  >
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud
                        size={24}
                        className="text-gray-500 group-hover:text-emerald-500"
                        aria-hidden="true"
                      />
                    </div>

                    <p className="text-sm font-black text-gray-800 mb-1">
                      Upload screenshot or recording
                    </p>

                    <p className="text-xs font-bold text-gray-500">
                      Click to browse or drag & drop
                    </p>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.gif,.mp4,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      handleFileSelect(e.target.files);
                      e.target.value = '';
                    }}
                  />

                  {attachments.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachments.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {item.type.startsWith('image/') ? (
                              <ImageIcon
                                size={16}
                                className="text-emerald-600 shrink-0"
                                aria-hidden="true"
                              />
                            ) : (
                              <FileText
                                size={16}
                                className="text-blue-600 shrink-0"
                                aria-hidden="true"
                              />
                            )}

                            <div className="min-w-0">
                              <p className="text-xs font-black text-gray-800 truncate">
                                {item.name}
                              </p>
                              <p className="text-[10px] font-bold text-gray-400">
                                {(item.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeAttachment(item.id)}
                            className="text-gray-400 hover:text-red-500"
                            aria-label={`Remove ${item.name}`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">
                    Priority / Severity
                  </label>

                  <p className="text-[10px] font-bold text-gray-500 mb-3">
                    How badly is this affecting you?
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PRIORITIES.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setPriority(item.id)}
                        className={`border rounded-xl p-3 flex flex-col gap-2 text-left transition-all ${
                          priority === item.id
                            ? item.className
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        aria-pressed={priority === item.id}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              priority === item.id
                                ? item.iconBox
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {item.icon}
                          </div>

                          <span className="text-xs font-black text-gray-900">
                            {item.title}
                          </span>
                        </div>

                        <span className="text-[9px] font-bold text-gray-500">
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-800 mb-1">
                    Your Details{' '}
                    <span className="text-gray-400 font-medium">(optional)</span>
                  </label>

                  <p className="text-[10px] font-bold text-gray-500 mb-3">
                    Help us get back to you if needed.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Prince"
                      icon={<UserRound size={15} />}
                      hideLabel
                    />

                    <InputField
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@email.com"
                      icon={<Mail size={15} />}
                      hideLabel
                    />

                    <InputField
                      label="Phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Mobile optional"
                      icon={<Phone size={15} />}
                      hideLabel
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600 flex items-start gap-2">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    {errorMsg}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#00a67e] hover:bg-emerald-700 disabled:opacity-70 text-white font-black py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Feedback <Send size={16} />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] font-bold text-gray-500 mt-4 flex items-center justify-center gap-1">
                    <Lock size={12} aria-hidden="true" />
                    We respect your privacy. Your information is safe with us.
                  </p>
                </div>
              </form>
            </div>

            <aside className="lg:col-span-4 space-y-5">
              <InfoCard title="What can you share?">
                <SideItem
                  icon={<Bug size={20} />}
                  title="Report Bugs"
                  text="Let us know what's not working so we can fix it quickly."
                  color="emerald"
                />
                <SideItem
                  icon={<Lightbulb size={20} />}
                  title="Suggest Features"
                  text="Share ideas to make EduFill even better for students."
                  color="blue"
                />
                <SideItem
                  icon={<Star size={20} />}
                  title="Review EduFill"
                  text="Rate your experience and help others make confident choices."
                  color="amber"
                />
              </InfoCard>

              <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <h3 className="text-lg font-black text-gray-900">
                    We Read Every Response
                  </h3>
                  <ShieldCheck size={28} className="text-emerald-500" />
                </div>

                <p className="text-xs font-semibold text-gray-600 mb-5 relative z-10 leading-relaxed">
                  Our team reviews feedback carefully and works hard to improve EduFill every day.
                </p>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center relative z-10">
                  <p className="text-xs font-black text-emerald-800 leading-relaxed">
                    Thank you for being a part of the EduFill community! 💚
                  </p>
                </div>

                <div className="absolute -right-6 -bottom-6 opacity-5">
                  <ShieldCheck size={120} className="text-emerald-500" />
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm p-5">
                <h3 className="text-lg font-black text-gray-900 mb-1">
                  Feedback Summary
                </h3>

                <p className="text-[10px] font-bold text-gray-500 mb-5">
                  Example community stats
                </p>

                <div className="space-y-4">
                  <SummaryRow
                    icon={<Bug size={14} />}
                    label="Bug Reports"
                    value="1,248"
                    width="40%"
                    color="bg-red-300"
                  />
                  <SummaryRow
                    icon={<Lightbulb size={14} />}
                    label="Feature Ideas"
                    value="852"
                    width="30%"
                    color="bg-blue-300"
                  />
                  <SummaryRow
                    icon={<Star size={14} />}
                    label="Reviews Received"
                    value="2,340"
                    width="60%"
                    color="bg-amber-300"
                  />
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm p-5">
                <h3 className="text-base font-black text-gray-900 mb-2">
                  Need Help?
                </h3>

                <p className="text-xs font-semibold text-gray-500 mb-5">
                  Can&apos;t find what you need? Our support team is here to help.
                </p>

                <a
                  href="https://wa.me/919752519051"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-sm"
                >
                  <MessageSquare size={16} /> Contact Support
                </a>
              </div>
            </aside>
          </section>
        )}

        <section className="max-w-[1200px] mx-auto px-4 md:px-8 pb-10">
          <div className="bg-white rounded-[1.75rem] border border-gray-100 shadow-sm p-5 md:p-7 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['25K+', 'Forms Filled'],
              ['300+', 'Institutes Served'],
              ['50K+', 'Happy Students'],
              ['99.8%', 'Success Rate'],
            ].map(([value, label]) => (
              <div key={label} className="text-center rounded-2xl bg-gray-50 md:bg-white p-4">
                <p className="text-2xl font-black text-emerald-600 mb-1">
                  {value}
                </p>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function HeroMini({ icon, label }) {
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-3 text-center">
      <div className="mx-auto mb-2 h-9 w-9 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <p className="text-[10px] font-black text-gray-700">{label}</p>
    </div>
  );
}

function InputField({
  label,
  required,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  hideLabel = false,
}) {
  return (
    <div>
      {!hideLabel && (
        <label className="block text-xs font-black text-gray-800 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          required={required}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-label={hideLabel ? label : undefined}
          className={`w-full bg-white border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 p-3.5 rounded-xl outline-none font-bold text-sm text-gray-800 transition-all ${
            icon ? 'pl-10' : ''
          }`}
        />
      </div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="bg-white rounded-[1.5rem] border border-gray-200 shadow-sm p-5">
      <h3 className="text-lg font-black text-gray-900 mb-5">{title}</h3>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function SideItem({ icon, title, text, color }) {
  const colorClass = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-500 border-blue-100',
    amber: 'bg-amber-50 text-amber-500 border-amber-100',
  }[color];

  return (
    <div className="flex gap-4">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${colorClass}`}
      >
        {icon}
      </div>

      <div>
        <h4 className="text-sm font-black text-gray-900 mb-1">{title}</h4>
        <p className="text-xs font-semibold text-gray-500 leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, value, width, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-black text-gray-800">
          <span className="text-gray-500">{icon}</span>
          {label}
        </div>

        <div className="text-right">
          <div className="text-sm font-black text-gray-900">{value}</div>
          <div className="text-[8px] font-bold text-gray-400">
            in last 30 days
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-100 h-1.5 rounded-full">
        <div className={`${color} h-full rounded-full`} style={{ width }} />
      </div>
    </div>
  );
}

function SuccessCard({ resetForm }) {
  return (
    <div className="bg-white rounded-[1.75rem] border border-emerald-100 shadow-sm px-5 py-10 sm:p-12 flex flex-col items-center justify-center text-center">
      <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 border border-emerald-100 shadow-sm">
        <CheckCircle2 size={44} />
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-gray-950 mb-2">
        Feedback Submitted!
      </h2>

      <p className="text-sm text-gray-500 font-semibold max-w-md mx-auto leading-relaxed mb-7">
        Thank you for helping us improve EduFill. Our team will review your response soon.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
        <button
          type="button"
          onClick={resetForm}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-5 rounded-xl flex items-center justify-center gap-2"
        >
          Submit Another <RotateCcw size={16} />
        </button>

        <Link
          to="/"
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-black py-3 px-5 rounded-xl flex items-center justify-center gap-2"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
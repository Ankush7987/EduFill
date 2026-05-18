import React from 'react';
import {
  BookOpen,
  Building,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Headphones,
  Lock,
  MessageCircle,
  PhoneOff,
  Stethoscope,
  Calculator,
  Tent,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';

const DEFAULT_EXAM_DESCRIPTION =
  "Select exam, choose institute, enter details and upload documents. EduFill will help you complete your form carefully.";

const DEFAULT_EXAM_PROMISE =
  'EduFill experts review your details and help you complete your form with care.';

export const examLayoutConfig = [
  {
    id: 'neet',
    tag: 'Medical Entrance',
    icon: <Stethoscope size={26} aria-hidden="true" />,
    title: 'NEET UG 2026',
    pageRoute: '/apply/neet',
    color: 'from-emerald-500 to-green-600',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-100',
  },
  {
    id: 'jee',
    tag: 'Engineering Entrance',
    icon: <Calculator size={26} aria-hidden="true" />,
    title: 'JEE Main 2026',
    pageRoute: '/apply/jee',
    color: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-100',
  },
  {
    id: 'cuet',
    tag: 'Central Universities',
    icon: <BookOpen size={26} aria-hidden="true" />,
    title: 'CUET UG 2026',
    pageRoute: '/apply/cuet',
    color: 'from-purple-500 to-fuchsia-600',
    lightBg: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-100',
  },
  {
    id: 'govt-college',
    tag: 'UG & PG Admissions',
    icon: <Building size={26} aria-hidden="true" />,
    title: 'Govt. College Admission 2026',
    pageRoute: '/apply/govt-college',
    color: 'from-teal-500 to-emerald-600',
    lightBg: 'bg-teal-50',
    textColor: 'text-teal-600',
    borderColor: 'border-teal-100',
  },
];

export const defaultContentFallback = {
  neet: {
    startDate: 'To be announced',
    lastDate: 'To be announced',
    desc: DEFAULT_EXAM_DESCRIPTION,
    requirements: [
      'Passport size photo',
      'Signature',
      'Class 10th details',
      'Class 12th details',
      'Category certificate, if applicable',
    ],
    edufillPromise: DEFAULT_EXAM_PROMISE,
  },
  jee: {
    startDate: 'To be announced',
    lastDate: 'To be announced',
    desc: DEFAULT_EXAM_DESCRIPTION,
    requirements: [
      'Passport size photo',
      'Signature',
      'Class 10th details',
      'Class 12th details',
      'Category certificate, if applicable',
    ],
    edufillPromise: DEFAULT_EXAM_PROMISE,
  },
  cuet: {
    startDate: 'To be announced',
    lastDate: 'To be announced',
    desc: DEFAULT_EXAM_DESCRIPTION,
    requirements: [
      'Passport size photo',
      'Signature',
      'Class 10th details',
      'Class 12th details',
      'Subject selection details',
    ],
    edufillPromise: DEFAULT_EXAM_PROMISE,
  },
  'govt-college': {
    startDate: 'To be announced',
    lastDate: 'To be announced',
    desc: DEFAULT_EXAM_DESCRIPTION,
    requirements: [
      'Class 10th marksheet',
      'Class 12th marksheet',
      'Transfer certificate, if required',
      'Caste/category certificate, if applicable',
      'Passport size photo',
    ],
    edufillPromise: DEFAULT_EXAM_PROMISE,
  },
};

export const productCards = [
  {
    title: 'Live Form Expert',
    tag: 'Popular',
    desc: 'Get help from verified experts for exam and admission form filling with a simple guided process.',
    icon: <Headphones size={36} aria-hidden="true" />,
    route: '/live-connect',
    tone: 'emerald',
  },
  {
    title: 'Book Your Slot',
    desc: 'Book your slot for exam form filling at institute camps and avoid long queues.',
    icon: <Calendar size={36} aria-hidden="true" />,
    route: '#slot-booking',
    tone: 'blue',
  },
  {
    title: 'College Predictor',
    tag: 'New',
    desc: 'Predict suitable colleges based on your rank, category and preferences.',
    icon: <GraduationCap size={38} aria-hidden="true" />,
    route: '/college-predictor',
    tone: 'purple',
  },
  {
    title: 'Live PYQ Mock Test',
    tag: 'New',
    desc: 'Practice with previous-year questions in a live mock environment and improve your preparation.',
    icon: <ClipboardCheck size={38} aria-hidden="true" />,
    route: '/mock-test',
    tone: 'orange',
  },
  {
    title: 'Camp Request',
    desc: 'Request a form filling camp in your college or institute. EduFill team will contact you.',
    icon: <Tent size={38} aria-hidden="true" />,
    route: '/campus-drive',
    tone: 'rose',
  },
];

export const toneMap = {
  emerald: {
    card: 'border-emerald-200 bg-emerald-50/55 hover:shadow-emerald-100',
    icon: 'bg-emerald-100 text-emerald-700',
    title: 'text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    badge: 'bg-amber-400 text-white',
  },
  blue: {
    card: 'border-blue-100 bg-white hover:shadow-blue-100',
    icon: 'bg-blue-100 text-blue-700',
    title: 'text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700',
    badge: 'bg-blue-500 text-white',
  },
  purple: {
    card: 'border-purple-100 bg-purple-50/40 hover:shadow-purple-100',
    icon: 'bg-purple-100 text-purple-700',
    title: 'text-purple-700',
    button: 'bg-purple-600 hover:bg-purple-700',
    badge: 'bg-purple-400 text-white',
  },
  orange: {
    card: 'border-orange-100 bg-orange-50/45 hover:shadow-orange-100',
    icon: 'bg-orange-100 text-orange-700',
    title: 'text-orange-700',
    button: 'bg-orange-600 hover:bg-orange-700',
    badge: 'bg-orange-400 text-white',
  },
  rose: {
    card: 'border-rose-100 bg-rose-50/45 hover:shadow-rose-100',
    icon: 'bg-rose-100 text-rose-700',
    title: 'text-rose-700',
    button: 'bg-rose-600 hover:bg-rose-700',
    badge: 'bg-rose-400 text-white',
  },
};

export const trustBenefits = [
  {
    title: 'Privacy First',
    desc: 'Your mobile number is not shown publicly to experts.',
    icon: <PhoneOff size={22} aria-hidden="true" />,
  },
  {
    title: 'Safer Workflow',
    desc: 'Documents and chats are handled through EduFill workflow.',
    icon: <Lock size={22} aria-hidden="true" />,
  },
  {
    title: 'Verified Experts',
    desc: 'Trained professionals help with form-filling steps.',
    icon: <UserCheck size={22} aria-hidden="true" />,
  },
  {
    title: 'Save Time & Effort',
    desc: 'No more long queues or confusing form steps.',
    icon: <Zap size={22} aria-hidden="true" />,
  },
  {
    title: 'Support That Cares',
    desc: 'EduFill support helps users with important queries.',
    icon: <MessageCircle size={22} aria-hidden="true" />,
  },
];

export const howItWorks = [
  {
    title: 'Submit Details',
    desc: 'Fill your basic details and upload required documents.',
    icon: <Users size={26} aria-hidden="true" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    title: 'Expert Assigned',
    desc: 'EduFill assigns a suitable expert to your request.',
    icon: <UserCheck size={26} aria-hidden="true" />,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    title: 'Secure Chat',
    desc: 'Communicate with the expert through EduFill chat.',
    icon: <MessageCircle size={26} aria-hidden="true" />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    title: 'Form Filling',
    desc: 'Expert fills the form carefully using your details.',
    icon: <ClipboardCheck size={26} aria-hidden="true" />,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
  },
  {
    title: 'Get Confirmation',
    desc: 'Receive confirmation details after form completion.',
    icon: <CheckCircle2 size={26} aria-hidden="true" />,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
];

export const faqs = [
  {
    q: 'Is my mobile number visible to the expert?',
    a: 'No. EduFill is privacy-first. The expert communicates through EduFill secure chat, so your personal mobile number does not need to be shared directly.',
  },
  {
    q: 'How does OTP sharing work safely?',
    a: 'OTP should be shared only through EduFill in-app chat when required for form submission. Avoid sharing OTPs through unknown calls or unrelated links.',
  },
  {
    q: 'Can institutes request an EduFill camp?',
    a: 'Yes. Institutes can request a campus drive so students can book slots and avoid cyber cafe queues.',
  },
  {
    q: 'Do you provide mock tests and college prediction?',
    a: 'Yes. EduFill provides College Predictor and Live PYQ Mock Test features for preparation and guidance.',
  },
];

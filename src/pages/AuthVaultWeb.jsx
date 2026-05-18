import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut, sendEmailVerification, updateProfile,
  GoogleAuthProvider, signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase'; 

import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import imageCompression from 'browser-image-compression';

// Icons
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  LogOut,
  UploadCloud,
  FileText,
  Lock,
  ShieldCheck,
  Download,
  RefreshCw,
  X,
  Eye,
  Sparkles,
  Search,
  MoreVertical,
  MapPin,
  Mail,
  Phone,
  Edit,
  User,
  ChevronDown,
  HelpCircle,
  Save,
} from 'lucide-react';
import SEO from '../components/SEO';

const REQUIRED_DOCS = [
  { id: 'profilePicUrl', label: 'Passport Photo', icon: '🖼️', desc: 'White background' },
  { id: 'signatureUrl', label: 'Signature', icon: '✍️', desc: 'Black pen on white paper' },
  { id: 'aadharUrl', label: 'Aadhaar Card', icon: '🪪', desc: 'Front and Back side' },
  { id: 'tenthUrl', label: '10th Marksheet', icon: '📄', desc: 'Original scan required' },
  { id: 'twelfthUrl', label: '12th Marksheet', icon: '📄', desc: 'Original scan required' },
  { id: 'thumbUrl', label: 'Thumb Impression', icon: '👍', desc: 'Left/Right thumb' },
  { id: 'casteUrl', label: 'Caste Certificate', icon: '📜', desc: 'If applicable (SC/ST/OBC)' },
  { id: 'domicileUrl', label: 'Domicile (Niwash)', icon: '🏠', desc: 'State level certificate' },
];

const VERIFICATION_RESEND_SECONDS = 45;
const MAX_DOCUMENT_SIZE_MB = 8;
const MAX_DOCUMENT_SIZE_BYTES = MAX_DOCUMENT_SIZE_MB * 1024 * 1024;
const CLOUDINARY_CLOUD_NAME = 'dvocl6wvq';
const CLOUDINARY_UPLOAD_PRESET = 'edufill_docs';
const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

const normalizePhoneNumber = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);

const encodeAvatarName = (name) => encodeURIComponent(name || 'Student');

const safeAlertMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  return error?.message ? error.message.replace('Firebase: ', '') : fallback;
};

const isEmailPasswordUser = (firebaseUser) => {
  return firebaseUser?.providerData?.some((provider) => provider.providerId === 'password');
};

const getEduFillVerificationSettings = () => ({
  // User will return to EduFill after clicking the verification link.
  // Add this domain in Firebase Authentication > Settings > Authorized domains.
  url: `${window.location.origin}/vault?verified=email`,
  handleCodeInApp: false,
});

const sendEduFillVerificationEmail = async (firebaseUser) => {
  if (!firebaseUser) return;

  // Firebase uses this language for Auth email action templates.
  auth.languageCode = 'en';

  await sendEmailVerification(firebaseUser, getEduFillVerificationSettings());
};

export default function AuthVaultWeb() {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState('login'); 
  const [user, setUser] = useState(null); 
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  const [userData, setUserData] = useState({});
  const [userDocs, setUserDocs] = useState({});
  const [recentForms, setRecentForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(true);
  
  // Search & Menus
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [openDocMenu, setOpenDocMenu] = useState(null); 
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);

  // Edit Profile States
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', qualification: '' });

  // Auth Inputs
  const [loginEmail, setLoginEmail] = useState(''); 
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendPassword, setResendPassword] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // Upload/Crop States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [applyScanFilter, setApplyScanFilter] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const authFlowRef = useRef('idle');

  const startResendCooldown = () => {
    setResendCooldown(VERIFICATION_RESEND_SECONDS);
  };

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'email') {
      setCurrentScreen('login');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          setUser(null);
          setAuthChecking(false);
          return;
        }

        await currentUser.reload();

        // Email/password users cannot enter Vault until email is verified.
        // This also blocks entry when the user opens this page directly in another tab.
        if (isEmailPasswordUser(currentUser) && !currentUser.emailVerified) {
          setVerificationEmail(currentUser.email || '');

          // During signup/resend/login, the handler needs the user object for a moment
          // to send the verification email, then it signs out manually.
          if (authFlowRef.current === 'signup' || authFlowRef.current === 'resend' || authFlowRef.current === 'login') {
            setUser(null);
            setAuthChecking(false);
            return;
          }

          await signOut(auth);
          setUser(null);
          setCurrentScreen('verify_email_link');
          setAuthChecking(false);
          return;
        }

        const userDocRef = doc(db, "Users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          setIsProfileComplete(false); 
          setFullName(currentUser.displayName || '');
          setEmail(currentUser.email || '');
        } else {
          setIsProfileComplete(true); 
          const data = userDocSnap.data();
          setUserData(data);
          setUserDocs(data.documents || {}); 

          // Keep Firestore status in sync after a verified email/password login.
          if (isEmailPasswordUser(currentUser) && data.emailVerified !== true) {
            await updateDoc(userDocRef, { emailVerified: true });
          }

          fetchRecentApplications(currentUser.uid);
        }

        setUser(currentUser);
      } catch (error) {
        console.error("Auth checking failed:", error);
        await signOut(auth);
        setUser(null);
      } finally {
        setAuthChecking(false);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch Recent Exam Forms from Live Connect + Applications
  // LiveConnect saves requests in "Live_Form_Requests" with fields: exam, status, timestamp.
  // Normal exam form pages may save data in "Applications" with fields: examName, status, createdAt.
  // We merge both collections and show latest 5 in Vault.
  const fetchRecentApplications = async (uid) => {
    setLoadingForms(true);

    try {
      const liveReqQuery = query(
        collection(db, "Live_Form_Requests"),
        where("userId", "==", uid)
      );

      const applicationsQuery = query(
        collection(db, "Applications"),
        where("userId", "==", uid)
      );

      const [liveReqSnapshot, applicationsSnapshot] = await Promise.all([
        getDocs(liveReqQuery),
        getDocs(applicationsQuery),
      ]);

      const liveForms = liveReqSnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: `live-${docSnap.id}`,
          requestId: docSnap.id,
          source: "Live_Form_Requests",
          examName: data.exam || data.examName || "Live Form Request",
          status: data.status || "Pending",
          createdAt: data.timestamp || data.createdAt || null,
          examLogo: data.examLogo || null,
        };
      });

      const applicationForms = applicationsSnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: `app-${docSnap.id}`,
          requestId: docSnap.id,
          source: "Applications",
          examName: data.examName || data.exam || data.serviceName || "Competitive Exam",
          status: data.status || "Pending",
          createdAt: data.createdAt || data.timestamp || null,
          examLogo: data.examLogo || null,
        };
      });

      const mergedForms = [...liveForms, ...applicationForms]
        .filter((item) => item.examName)
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const bTime = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return bTime - aTime;
        })
        .slice(0, 5);

      setRecentForms(mergedForms);
    } catch (err) {
      console.error("Error fetching recent forms:", err);
      setRecentForms([]);
    } finally {
      setLoadingForms(false);
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => { setOpenDocMenu(null); setHeaderDropdownOpen(false); };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // --------------------------------------------------------
  // AUTH & PROFILE LOGIC
  // --------------------------------------------------------
  const handleGoogleAuth = async () => {
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Google Sign-In Failed:', error);
      }

      alert('Google Sign-In Failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitGoogleExtraDetails = async () => {
    const cleanName = fullName.trim();
    const cleanPhone = normalizePhoneNumber(phone);

    if (!cleanName || !cleanPhone || !qualification) {
      return alert('Please fill all details!');
    }

    if (cleanPhone.length !== 10) {
      return alert('Invalid Mobile Number!');
    }

    if (!auth.currentUser) {
      return alert('Session expired. Please login again.');
    }

    setLoading(true);

    try {
      const currentUser = auth.currentUser;

      await updateProfile(currentUser, { displayName: cleanName });

      const profileData = {
        uid: currentUser.uid,
        fullName: cleanName,
        email: currentUser.email || '',
        phone: cleanPhone,
        qualification,
        signupMethod: isEmailPasswordUser(currentUser) ? 'email' : 'google',
        role: 'student',
        documents: {},
        emailVerified: currentUser.emailVerified || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'Users', currentUser.uid), profileData, { merge: true });

      setUserData(profileData);
      setUserDocs({});
      setIsProfileComplete(true);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Profile save failed:', error);
      }

      alert('Could not save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !password) return alert("Enter Email and Password!");
    setLoading(true);
    setResendMessage('');
    const normalizedEmail = loginEmail.trim().toLowerCase();
    authFlowRef.current = 'login';

    try {
      const userCred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      await userCred.user.reload();

      if (isEmailPasswordUser(userCred.user) && !userCred.user.emailVerified) {
        try {
          await sendEduFillVerificationEmail(userCred.user);
          startResendCooldown();
          setResendMessage('EduFill verification link sent again. Please check Inbox, Promotions, or Spam.');
        } catch (verificationError) {
          if (import.meta.env.DEV) {
            console.warn('Verification email resend failed:', verificationError);
          }
          setResendMessage('Could not resend automatically. Please use the resend button after a few seconds.');
        }

        await signOut(auth);
        setUser(null);
        setVerificationEmail(normalizedEmail);
        setCurrentScreen('verify_email_link');
        alert("Please verify your email first. EduFill verification link has been sent again.");
        return;
      }
    } catch (error) {
      alert(safeAlertMessage(error));
    } finally {
      authFlowRef.current = 'idle';
      setLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    const cleanName = fullName.trim();
    const cleanPhone = normalizePhoneNumber(phone);
    const normalizedEmail = email.trim().toLowerCase();

    if (!cleanName || !normalizedEmail || !cleanPhone || !qualification || !password || !confirmPassword) {
      return alert('Fill all fields!');
    }

    if (password !== confirmPassword) {
      return alert('Passwords mismatch!');
    }

    if (password.length < 6) {
      return alert('Password must be at least 6 characters.');
    }

    if (cleanPhone.length !== 10) {
      return alert('Enter a valid 10-digit mobile number!');
    }

    setLoading(true);
    setResendMessage('');
    authFlowRef.current = 'signup';

    try {
      const userCred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

      await updateProfile(userCred.user, { displayName: cleanName });

      await setDoc(doc(db, 'Users', userCred.user.uid), {
        uid: userCred.user.uid,
        fullName: cleanName,
        email: normalizedEmail,
        phone: cleanPhone,
        qualification,
        signupMethod: 'email',
        role: 'student',
        documents: {},
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await sendEduFillVerificationEmail(userCred.user);

      // Firebase automatically logs in a newly created user.
      // We sign out immediately so unverified users cannot access Vault.
      await signOut(auth);

      setUser(null);
      setVerificationEmail(normalizedEmail);
      setCurrentScreen('verify_email_link');
      startResendCooldown();
      setResendMessage('EduFill verification link sent. Please check Inbox, Promotions, or Spam.');
      alert('Account created. Please verify your email first, then login.');
    } catch (error) {
      alert(safeAlertMessage(error));
    } finally {
      authFlowRef.current = 'idle';
      setLoading(false);
    }
  };

  const handleResendVerificationLink = async () => {
    const targetEmail = (verificationEmail || email || loginEmail).trim().toLowerCase();
    const targetPassword = password || resendPassword;

    if (!targetEmail) return alert("Email not found. Please sign up or login again.");
    if (!targetPassword) return alert("Please enter your password once to resend verification link.");
    if (resendCooldown > 0) return;

    setResendLoading(true);
    setResendMessage('');
    authFlowRef.current = 'resend';

    try {
      const userCred = await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
      await userCred.user.reload();

      if (userCred.user.emailVerified) {
        await signOut(auth);
        setCurrentScreen('login');
        alert("Your email is already verified. Please login now.");
        return;
      }

      await sendEduFillVerificationEmail(userCred.user);
      await signOut(auth);

      setUser(null);
      setVerificationEmail(targetEmail);
      startResendCooldown();
      setResendMessage('New EduFill verification link sent successfully. Please check Inbox, Promotions, or Spam.');
    } catch (error) {
      alert(safeAlertMessage(error));
    } finally {
      authFlowRef.current = 'idle';
      setResendLoading(false);
    }
  };

  const checkEmailVerified = async () => {
    alert("After verifying your email, please login with your email and password.");
    setCurrentScreen('login');
  };

  const handleLogout = async () => { await signOut(auth); setCurrentScreen('login'); };

  // Working Edit Profile Feature
  const handleOpenEdit = () => {
    setEditForm({
      fullName: userData.fullName || '',
      phone: normalizePhoneNumber(userData.phone || ''),
      qualification: userData.qualification || '',
    });
    setEditProfileOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    const cleanName = editForm.fullName.trim();
    const cleanPhone = normalizePhoneNumber(editForm.phone);

    if (!cleanName) {
      return alert('Please enter your full name.');
    }

    if (cleanPhone.length !== 10) {
      return alert('Enter a valid 10-digit mobile number.');
    }

    if (!user?.uid || !auth.currentUser) {
      return alert('Session expired. Please login again.');
    }

    setLoading(true);

    try {
      const updatedProfile = {
        fullName: cleanName,
        phone: cleanPhone,
        qualification: editForm.qualification,
      };

      await updateProfile(auth.currentUser, { displayName: cleanName });
      await updateDoc(doc(db, 'Users', user.uid), {
        ...updatedProfile,
        updatedAt: serverTimestamp(),
      });

      setUserData((prev) => ({ ...prev, ...updatedProfile }));
      setEditProfileOpen(false);
      alert('Profile updated successfully! ✅');
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Profile update failed:', error);
      }

      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------
  // UPLOAD & CROP LOGIC
  // --------------------------------------------------------
  const openUploadModal = (docItem) => {
    setActiveDoc(docItem);
    setSelectedFile(null);
    setPreviewUrl('');
    setApplyScanFilter(false);
    setCrop(undefined);
    setCompletedCrop(null);
    setUploadModalOpen(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      alert('Only JPG, PNG, or PDF files are allowed.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      alert(`File size must be under ${MAX_DOCUMENT_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreviewUrl(String(reader.result || ''));
    };

    reader.onerror = () => {
      alert('Could not read this file. Please try another file.');
      setSelectedFile(null);
      setPreviewUrl('');
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onImageLoad = () => {
    setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
  };

  const handleRotate = () => {
    if (!previewUrl) return;

    const image = new Image();
    image.src = previewUrl;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.height;
      canvas.height = image.width;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        alert('Image rotation is not supported in this browser.');
        return;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(image, -image.width / 2, -image.height / 2);

      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.92));
      setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
      setCompletedCrop(null);
    };

    image.onerror = () => {
      alert('Could not rotate this image. Please select another file.');
    };
  };

  const getProcessedImageBlob = async () => {
    if (!selectedFile) {
      throw new Error('No file selected.');
    }

    if (!selectedFile.type.startsWith('image/')) {
      return selectedFile;
    }

    if (!completedCrop || !imgRef.current) {
      return selectedFile;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = Math.max(1, Math.round(completedCrop.width * scaleX));
    canvas.height = Math.max(1, Math.round(completedCrop.height * scaleY));

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas is not supported in this browser.');
    }

    if (applyScanFilter) {
      ctx.filter = 'grayscale(100%) contrast(1.5) brightness(1.1)';
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image processing failed.'));
            return;
          }

          resolve(
            new File([blob], `processed_${selectedFile.name.replace(/\s+/g, '_')}`, {
              type: 'image/jpeg',
            })
          );
        },
        'image/jpeg',
        0.92
      );
    });
  };

  const uploadToCloudinaryAndSave = async () => {
    if (!selectedFile) {
      return alert('Please select a file first.');
    }

    if (!user?.uid || !activeDoc?.id) {
      return alert('Session expired. Please login again.');
    }

    setIsUploading(true);

    try {
      let finalFile = await getProcessedImageBlob();

      if (finalFile.type.startsWith('image/')) {
        finalFile = await imageCompression(finalFile, {
          maxSizeMB: 0.15,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        });
      }

      const uploadFormData = new FormData();
      uploadFormData.append('file', finalFile);
      uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      uploadFormData.append('folder', `edufill_vault/${user.uid}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: 'POST',
          body: uploadFormData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.secure_url) {
        throw new Error(data?.error?.message || 'Cloudinary upload failed.');
      }

      const uploadedFileData = {
        url: data.secure_url,
        publicId: data.public_id || '',
        resourceType: data.resource_type || '',
        format: data.format || '',
        bytes: data.bytes || finalFile.size || 0,
        uploadedAt: new Date().toISOString(),
      };

      const updatedDocs = {
        ...userDocs,
        [activeDoc.id]: uploadedFileData.url,
        [`${activeDoc.id}Meta`]: uploadedFileData,
      };

      await updateDoc(doc(db, 'Users', user.uid), {
        documents: updatedDocs,
        updatedAt: serverTimestamp(),
      });

      setUserDocs(updatedDocs);
      alert(`${activeDoc.label} compressed & saved securely! ✅`);
      setUploadModalOpen(false);
      setSelectedFile(null);
      setPreviewUrl('');
      setCompletedCrop(null);
      setCrop(undefined);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Document upload failed:', error);
      }

      alert('Failed to upload document. Please check connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (url, label) => {
    if (!url) return;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Download failed.');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `EduFill_${label.replace(/\s+/g, '_')}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // UI Helpers
  const maskEmail = (em) => {
    if (!em) return '';
    const [name, domain] = em.split('@');
    if (name.length <= 3) return em;
    return `${name.substring(0, 3)}${'*'.repeat(name.length - 3)}@${domain}`;
  };

  const maskPhone = (ph) => {
    if (!ph || ph.length < 10) return ph;
    return `+91 ${ph.substring(0, 4)} ** ${ph.substring(6)}`;
  };

  const formatFormDate = (dateValue) => {
    if (!dateValue) return 'N/A';

    try {
      const date =
        typeof dateValue.toDate === 'function'
          ? dateValue.toDate()
          : dateValue.seconds
            ? new Date(dateValue.seconds * 1000)
            : new Date(dateValue);

      if (Number.isNaN(date.getTime())) return 'N/A';

      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('submit') || s.includes('success') || s.includes('done')) return 'bg-emerald-500';
    if (s.includes('pend') || s.includes('process')) return 'bg-amber-500';
    if (s.includes('cancel') || s.includes('fail') || s.includes('reject')) return 'bg-red-500';
    return 'bg-blue-500';
  };

  const getStatusTextColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('submit') || s.includes('success') || s.includes('done')) return 'text-emerald-600';
    if (s.includes('pend') || s.includes('process')) return 'text-amber-600';
    if (s.includes('cancel') || s.includes('fail') || s.includes('reject')) return 'text-red-600';
    return 'text-blue-600';
  };

  // --------------------------------------------------------
  // RENDER UI
  // --------------------------------------------------------
  if (authChecking) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-12 h-12" /></div>;
  }

  // ========================================================
  // 🌟 LOGGED IN VIEW: DIGITAL LOCKER (EXACT UI MATCH)
  // ========================================================
  if (user && isProfileComplete && (!isEmailPasswordUser(user) || user.emailVerified)) {
    
    const filteredDocs = REQUIRED_DOCS.filter(d => d.label.toLowerCase().includes(docSearchQuery.toLowerCase()));
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-emerald-200 pb-20">
        <SEO title="My Vault | EduFill" url="/vault" />

        {/* 🌟 FULLY WORKING NAVBAR HEADER 🌟 */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3">
              <img src="/edufill-brand-logo.svg?v=2" alt="EduFill" className="h-8 w-auto object-contain" />
              <span className="text-xl font-black tracking-tight text-gray-900">Edu<span className="text-emerald-600">Fill</span></span>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-8">
              <Link to="/blogs" className="text-sm font-bold text-gray-600 hover:text-gray-900">Blogs</Link>
              <Link to="/exams" className="text-sm font-bold text-gray-600 hover:text-gray-900">Latest Exams</Link>
              <Link to="/tools" className="flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-gray-900">Tools <ChevronDown size={14}/></Link>
              <Link to="/vault" className="text-sm font-bold text-emerald-600 border-b-2 border-emerald-600 pb-1">Vault</Link>
              <a href="https://wa.me/919752519051" target="_blank" rel="noreferrer" className="text-sm font-bold text-gray-600 hover:text-gray-900">Support</a>
            </nav>
            
            <div className="relative">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-100 transition-colors" onClick={(e) => { e.stopPropagation(); setHeaderDropdownOpen(!headerDropdownOpen); }}>
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex justify-center items-center text-emerald-700 font-black overflow-hidden">
                   <img src={`https://ui-avatars.com/api/?name=${encodeAvatarName(userData.fullName)}&background=10B981&color=fff`} className="w-full h-full object-cover" alt="Profile" />
                </div>
                <div className="hidden sm:block text-left mr-2">
                  <p className="text-gray-900 font-bold text-xs leading-tight">Hi, {userData.fullName?.split(' ')[0] || 'Student'}</p>
                  <p className="text-gray-500 font-medium text-[10px]">{userData.qualification || 'Student'}</p>
                </div>
                <ChevronDown size={14} className="text-gray-500"/>
              </div>

              {/* Working Header Dropdown */}
              {headerDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-xl rounded-2xl py-2 z-50">
                  <Link to="/vault" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                    <ShieldCheck size={16}/> My Vault
                  </Link>
                  <button onClick={() => { setHeaderDropdownOpen(false); handleOpenEdit(); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                    <User size={16}/> Edit Profile
                  </button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button onClick={() => {if(window.confirm('Are you sure you want to logout?')) handleLogout();}} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50">
                    <LogOut size={16}/> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
          
          {/* 🌟 HERO SECTION 🌟 */}
          <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-8">
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight mb-4">
                Your <span className="text-[#00a67e]">EduFill</span> Vault
              </h1>
              <p className="text-gray-600 text-sm md:text-base font-medium leading-relaxed mb-8">
                Store your important documents securely and reuse them anytime while filling exam or admission forms.
              </p>
              <div className="flex items-center gap-4">
                <button onClick={() => window.scrollTo({top: 400, behavior: 'smooth'})} className="bg-[#00a67e] hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-md transition-colors">
                  <UploadCloud size={18}/> Upload Documents
                </button>
                <button onClick={handleOpenEdit} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-sm">
                  <User size={18}/> Edit Profile
                </button>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
               <div className="relative w-full max-w-md h-48 md:h-64 rounded-3xl bg-emerald-50/50 flex items-center justify-center border border-emerald-100/50 overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                  <div className="relative z-10 w-48 h-36 bg-[#00a67e] rounded-xl shadow-2xl flex items-center justify-center border-4 border-emerald-800/20">
                     <div className="w-20 h-20 rounded-full border-4 border-emerald-400 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full border-2 border-emerald-300 flex items-center justify-center">
                           <div className="w-4 h-4 bg-emerald-300 rounded-full"></div>
                        </div>
                     </div>
                     <div className="absolute -bottom-6 -right-6 w-20 h-24 bg-emerald-500 rounded-bl-3xl rounded-br-3xl rounded-t shadow-lg flex items-center justify-center border-2 border-white -rotate-12">
                        <ShieldCheck size={40} className="text-white"/>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* 🌟 MAIN GRID 🌟 */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
            
            <div className="space-y-6">
              {/* MY DOCUMENTS */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-black text-gray-900">My Documents</h2>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input 
                      type="text" 
                      placeholder="Search documents..." 
                      value={docSearchQuery}
                      onChange={(e) => setDocSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDocs.map((docItem) => {
                    const isUploaded = !!userDocs[docItem.id];
                    const fileUrl = userDocs[docItem.id];
                    const isPdf = fileUrl && fileUrl.toLowerCase().includes('.pdf');
                    
                    return (
                      <div key={docItem.id} className="border border-gray-200 rounded-2xl p-3 flex flex-col hover:border-emerald-200 hover:shadow-md transition-all group relative">
                        
                        {/* Thumbnail Area */}
                        <div className="h-28 bg-gray-50 rounded-xl mb-3 flex items-center justify-center border border-gray-100 overflow-hidden relative">
                           {isUploaded ? (
                             isPdf ? (
                               <div className="flex flex-col items-center text-red-500"><FileText size={32}/><span className="text-[10px] font-black mt-1">PDF</span></div>
                             ) : (
                               <img src={fileUrl} alt={docItem.label} className="w-full h-full object-cover" />
                             )
                           ) : (
                             <div className="flex flex-col items-center text-gray-300">
                                <span className="text-2xl mb-1">{docItem.icon}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider">Missing</span>
                             </div>
                           )}
                           
                           {/* Hover Overlay for Upload if missing */}
                           {!isUploaded && (
                             <div onClick={() => openUploadModal(docItem)} className="absolute inset-0 bg-emerald-600/90 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                               <UploadCloud size={24} className="mb-1"/>
                               <span className="text-xs font-bold">Upload Now</span>
                             </div>
                           )}
                        </div>

                        {/* Document Info */}
                        <div className="flex-1">
                          <h4 className="text-xs font-black text-gray-900 leading-tight mb-2 truncate" title={docItem.label}>{docItem.label}</h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-1.5 py-0.5 rounded">
                                {isUploaded ? (isPdf ? 'PDF' : 'JPG') : '---'}
                              </span>
                              {isUploaded ? (
                                <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                                  Verified
                                </span>
                              ) : (
                                <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-100">
                                  Required
                                </span>
                              )}
                            </div>
                            
                            {/* Working 3 Dot Menu */}
                            {isUploaded && (
                              <div className="relative">
                                <button onClick={(e) => { e.stopPropagation(); setOpenDocMenu(openDocMenu === docItem.id ? null : docItem.id); }} className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors">
                                  <MoreVertical size={16}/>
                                </button>
                                {openDocMenu === docItem.id && (
                                  <div className="absolute right-0 bottom-full mb-1 w-32 bg-white border border-gray-200 shadow-xl rounded-xl py-1 z-50">
                                    <button onClick={() => { setOpenDocMenu(null); window.open(fileUrl, '_blank'); }} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Eye size={14}/> View</button>
                                    <button onClick={() => { setOpenDocMenu(null); handleDownload(fileUrl, docItem.label); }} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Download size={14}/> Download</button>
                                    <button onClick={() => { setOpenDocMenu(null); openUploadModal(docItem); }} className="w-full text-left px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2"><RefreshCw size={14}/> Replace</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 🌟 WORKING RECENT EXAM FORMS (FETCHED FROM FIRESTORE) 🌟 */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-gray-900">Recent Exam Forms (Last 5)</h2>
                  <Link to="/exams" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                    Apply Now <ArrowRight size={16}/>
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-3 text-xs font-bold text-gray-500 uppercase">Exam Name</th>
                        <th className="pb-3 text-xs font-bold text-gray-500 uppercase">Applied On</th>
                        <th className="pb-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                        <th className="pb-3 text-xs font-bold text-gray-500 uppercase text-right"></th>
                      </tr>
                    </thead>
                    {loadingForms ? (
                      <tbody><tr><td colSpan="4" className="text-center py-8 text-sm font-bold text-gray-400"><Loader2 className="animate-spin inline mr-2" size={16}/> Loading Forms...</td></tr></tbody>
                    ) : recentForms.length === 0 ? (
                      <tbody><tr><td colSpan="4" className="text-center py-10 text-sm font-bold text-gray-500">You haven't filled any forms using EduFill yet.</td></tr></tbody>
                    ) : (
                      <tbody>
                        {recentForms.map((form) => (
                          <tr key={form.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center p-1 shadow-sm overflow-hidden">
                                <img src={form.examLogo || 'https://cdn-icons-png.flaticon.com/512/2965/2965306.png'} className="w-full h-full object-contain" alt="Exam"/>
                              </div>
                              <span className="text-sm font-black text-gray-900">{form.examName || 'Competitive Exam'}</span>
                            </td>
                            <td className="py-4 text-sm font-bold text-gray-600">
                              {formatFormDate(form.createdAt)}
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-black ${getStatusTextColor(form.status)}`}>
                                <span className={`w-2 h-2 rounded-full ${getStatusColor(form.status)}`}></span>
                                {form.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => navigate(form.source === 'Live_Form_Requests' ? '/live-connect' : '/exams')}
                                className="text-xs font-black text-emerald-600 hover:text-emerald-800"
                              >
                                Track
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    )}
                  </table>
                </div>
              </div>

            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              
              {/* PROFILE CARD */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 text-center">
                <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full mb-3 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                   <img src={`https://ui-avatars.com/api/?name=${encodeAvatarName(userData.fullName)}&background=10B981&color=fff&size=128`} className="w-full h-full object-cover" alt="Profile" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1">{userData.fullName}</h3>
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-100 mb-6">
                  <ShieldCheck size={12}/> Verified Student
                </div>

                <div className="space-y-4 text-left mb-6">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail size={16} className="text-gray-400 shrink-0"/>
                    <span className="text-sm font-bold truncate">{maskEmail(userData.email)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone size={16} className="text-gray-400 shrink-0"/>
                    <span className="text-sm font-bold">{maskPhone(userData.phone)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin size={16} className="text-gray-400 shrink-0"/>
                    <span className="text-sm font-bold">India</span>
                  </div>
                </div>

                <button onClick={handleOpenEdit} className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                  <Edit size={16}/> Edit Profile
                </button>
              </div>

              {/* PRIVACY PROMISE */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-base font-black text-gray-900 mb-6">Your Privacy, Our Priority</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <ShieldCheck size={20}/>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 mb-1">Encrypted Storage</h4>
                      <p className="text-[10px] font-semibold text-gray-500">Bank-level 256-bit encryption keeps your data secure.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <RefreshCw size={20}/>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 mb-1">Quick Reuse</h4>
                      <p className="text-[10px] font-semibold text-gray-500">Use saved documents instantly in future forms.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Lock size={20}/>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 mb-1">Private & Safe</h4>
                      <p className="text-[10px] font-semibold text-gray-500">Your documents are never shared with anyone.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 🌟 FOOTER 🌟 */}
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-10">
          <div className="flex flex-col sm:flex-row items-center justify-between py-6 border-t border-gray-200 text-xs font-bold text-gray-500 gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-gray-400"/>
              EduFill Vault is your trusted partner for secure document storage and hassle-free form filling.
            </div>
            <div className="flex items-center gap-1.5">
              <HelpCircle size={16} className="text-gray-400"/> Need Help? <a href="https://wa.me/919752519051" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">Contact Support</a>
            </div>
          </div>
        </div>

        {/* 🌟 WORKING EDIT PROFILE MODAL 🌟 */}
        {editProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm relative shadow-2xl animate-in zoom-in-95">
              <button onClick={() => setEditProfileOpen(false)} className="absolute top-5 right-5 bg-gray-100 hover:bg-gray-200 p-2 rounded-full text-gray-600 transition-colors"><X size={20}/></button>
              <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2"><User size={24} className="text-emerald-500"/> Edit Profile</h3>
              
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input type="text" required value={editForm.fullName} onChange={(e) => setEditForm({...editForm, fullName: e.target.value})} className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 p-3 rounded-xl outline-none font-bold text-gray-800 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Mobile Number</label>
                  <input type="tel" maxLength="10" required value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: normalizePhoneNumber(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 p-3 rounded-xl outline-none font-bold text-gray-800 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Highest Qualification</label>
                  <select value={editForm.qualification} onChange={(e) => setEditForm({...editForm, qualification: e.target.value})} className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 p-3 rounded-xl outline-none font-bold text-gray-800 transition-all">
                    <option value="10th">10th</option>
                    <option value="12th">12th</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>
                
                <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-lg mt-4 transition-transform active:scale-95 flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={18}/> : <><Save size={18}/> Save Changes</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 🌟 UPLOAD MODAL (KEPT EXACTLY AS ORIGINAL LOGIC) 🌟 */}
        {uploadModalOpen && activeDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-lg relative shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setUploadModalOpen(false)} className="absolute top-5 right-5 bg-gray-100 hover:bg-gray-200 p-2 rounded-full text-gray-600 transition-colors"><X size={20}/></button>
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-2xl">{activeDoc.icon}</span> {activeDoc.label}
              </h3>

              {!previewUrl ? (
                <label className="border-4 border-dashed border-gray-200 hover:border-emerald-400 bg-gray-50 hover:bg-emerald-50/50 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><UploadCloud size={32} className="text-emerald-500"/></div>
                  <p className="font-black text-gray-800 text-lg">Tap to select document</p>
                  <p className="text-xs font-bold text-gray-500 mt-2">Supports JPG, PNG, or PDF</p>
                  <input type="file" accept="image/*,application/pdf" onChange={handleFileSelect} className="hidden" />
                </label>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 w-full flex justify-center mb-4 min-h-[200px]">
                    {selectedFile.type.startsWith('image/') ? (
                      <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)}>
                        <img 
                          ref={imgRef} src={previewUrl} alt="Crop" onLoad={onImageLoad}
                          className={`max-h-[300px] object-contain rounded-lg ${applyScanFilter ? 'grayscale contrast-150 brightness-110' : ''}`}
                        />
                      </ReactCrop>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-500 py-10">
                        <FileText size={48} className="mb-4 text-emerald-400"/>
                        <p className="font-black">PDF Document Selected</p>
                      </div>
                    )}
                  </div>

                  {selectedFile.type.startsWith('image/') && (
                    <div className="flex gap-3 w-full mb-6">
                      <button onClick={handleRotate} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors text-sm">
                        <RefreshCw size={16}/> Rotate
                      </button>
                      <label className="flex-[1.5] flex items-center justify-center gap-2 bg-amber-50 border-2 border-amber-200 text-amber-800 font-bold py-3 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors text-sm">
                        <input type="checkbox" checked={applyScanFilter} onChange={(e) => setApplyScanFilter(e.target.checked)} className="w-4 h-4 accent-amber-500" />
                        ✨ Magic Scan
                      </label>
                    </div>
                  )}

                  <div className="flex gap-3 w-full">
                    <button onClick={() => setPreviewUrl('')} className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 font-black py-3.5 rounded-xl transition-colors text-sm">Reset</button>
                    <button onClick={uploadToCloudinaryAndSave} disabled={isUploading} className="flex-[2] bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-black py-3.5 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
                      {isUploading ? <><Loader2 size={18} className="animate-spin"/> Saving...</> : '💾 Confirm & Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  // ========================================================
  // 🌟 ENTERPRISE SPLIT-SCREEN AUTH UI (LOGGED OUT / INCOMPLETE)
  // ========================================================
  return (
    <div className="min-h-screen flex font-sans selection:bg-indigo-500/30">
      <SEO title="EduFill Vault | Secure Login" url="/vault" />

      {/* LEFT PANEL: BRANDING (Hidden on Mobile) */}
      <div className="hidden lg:flex w-[45%] bg-[#0B1121] relative overflow-hidden flex-col justify-between p-12 border-r border-white/10 shadow-2xl z-10">
        <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[50%] bg-emerald-600/30 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[50%] bg-teal-600/20 blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/edufill-brand-logo.svg?v=2" alt="EduFill" className="h-10 w-auto object-contain" />
          <span className="text-3xl font-extrabold tracking-tight text-white">Edu<span className="text-emerald-500">Fill</span></span>
        </div>

        <div className="relative z-10 mt-10">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center mb-8 shadow-lg">
             <Lock size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
            Your Highly Secure <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Digital Locker.</span>
          </h1>
          <p className="text-lg text-gray-400 font-medium max-w-md leading-relaxed mb-10">
            Upload your documents once. We'll use them to auto-fill your exams instantly. Zero hassle, zero stress.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-300 font-bold text-sm bg-white/5 w-fit px-4 py-2.5 rounded-xl border border-white/10">
              <ShieldCheck size={18} className="text-emerald-400"/> 256-bit AES Encryption
            </div>
            <div className="flex items-center gap-3 text-gray-300 font-bold text-sm bg-white/5 w-fit px-4 py-2.5 rounded-xl border border-white/10">
              <Sparkles size={18} className="text-amber-400"/> One-Tap Form Auto-fill
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-10 border-t border-white/10 pt-6">
          <p className="text-xs text-gray-500 font-medium">© {new Date().getFullYear()} EduFill Technologies. All rights reserved.</p>
        </div>
      </div>

      {/* RIGHT PANEL: FORMS */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative bg-white">
        
        <button onClick={() => navigate('/')} className="absolute top-6 left-6 flex items-center gap-1.5 text-gray-400 hover:text-gray-900 font-bold text-sm transition-colors bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
          <ArrowLeft size={16}/> Home
        </button>

        <div className="w-full max-w-sm xl:max-w-md animate-in fade-in zoom-in-95 duration-500">
          
          {/* Missing Profile State */}
          {user && !isProfileComplete && (
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Complete Profile</h2>
              <p className="text-sm text-gray-500 font-medium mb-8">Just one more step to unlock your secure vault.</p>
              <form onSubmit={(e)=>{e.preventDefault(); submitGoogleExtraDetails();}} className="space-y-5">
                <div><label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Full Name</label><input required className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 p-3.5 rounded-xl outline-none font-bold text-gray-800 transition-all" value={fullName} onChange={(e)=>setFullName(e.target.value)} /></div>
                <div><label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Mobile Number</label><input type="tel" maxLength="10" required className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 p-3.5 rounded-xl outline-none font-bold text-gray-800 transition-all" value={phone} onChange={(e)=>setPhone(normalizePhoneNumber(e.target.value))} /></div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">Highest Qualification</label>
                  <div className="flex gap-2">
                    {['10th', '12th', 'Graduate'].map((item) => (
                      <div key={item} onClick={() => setQualification(item)} className={`flex-1 text-center py-3 rounded-xl text-sm font-bold cursor-pointer transition-all border-2 ${qualification === item ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>{item}</div>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg mt-4 transition-transform active:scale-95 flex justify-center items-center gap-2">{loading ? <Loader2 className="animate-spin"/> : 'Save & Enter Vault'}</button>
                <button type="button" onClick={handleLogout} className="w-full text-red-500 font-bold text-sm mt-3 text-center">Cancel Sign Up</button>
              </form>
            </div>
          )}

          {/* Verification State */}
          {user && isProfileComplete && !user.emailVerified && isEmailPasswordUser(user) && (
             <div className="text-center">
               <h1 className="text-6xl mb-6">📧</h1>
               <h3 className="text-3xl font-black text-gray-900 mb-3">Verify your Email</h3>
               <p className="text-base text-gray-500 font-medium mb-8 leading-relaxed">EduFill verification link has been sent to your email. Please check Inbox, Promotions, and Spam folder once.</p>
               <button onClick={checkEmailVerified} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg mb-4 transition-transform active:scale-95">I Verified — Login Now</button>
               <button onClick={handleLogout} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-xl transition-colors">Logout</button>
             </div>
          )}

          {/* Normal Auth States */}
          {!user && (
            <>
              {currentScreen === 'verify_email_link' && (
                <div className="text-center">
                  <h1 className="text-6xl mb-6">📧</h1>
                  <h3 className="text-3xl font-black text-gray-900 mb-3">Verify your Email</h3>
                  <p className="text-base text-gray-500 font-medium mb-3 leading-relaxed">
                    EduFill verification link has been sent to your email. Please check Inbox, Promotions, and Spam folder once.
                  </p>
                  {verificationEmail && (
                    <p className="text-sm font-black text-emerald-600 mb-4 break-all">{verificationEmail}</p>
                  )}

                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl px-4 py-3 mb-4 text-left">
                    <p className="text-xs font-black uppercase tracking-widest mb-1">Security Step</p>
                    <p className="text-sm font-bold leading-relaxed">
                      Email verify hone ke baad hi Vault entry milegi. Agar mail Spam me mile, to “Not spam” mark kar do.
                    </p>
                  </div>

                  {!password && (
                    <div className="mb-4 text-left">
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Password for resend</label>
                      <div className="flex bg-gray-50 border border-gray-200 focus-within:bg-white focus-within:border-emerald-400 focus-within:ring-4 focus:ring-emerald-500/10 rounded-xl pr-3 items-center transition-all">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password to resend link"
                          value={resendPassword}
                          onChange={(e) => setResendPassword(e.target.value)}
                          className="w-full bg-transparent p-3.5 outline-none font-bold text-gray-800"
                        />
                        <span onClick={() => setShowPassword(!showPassword)} className="cursor-pointer text-gray-500 hover:text-gray-800">{showPassword ? '🙈' : '👁️'}</span>
                      </div>
                    </div>
                  )}

                  {resendMessage && (
                    <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-4">
                      {resendMessage}
                    </p>
                  )}

                  <button
                    onClick={() => setCurrentScreen('login')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg mb-3 transition-transform active:scale-95"
                  >
                    I Verified — Login Now
                  </button>

                  <button
                    onClick={handleResendVerificationLink}
                    disabled={resendLoading || resendCooldown > 0}
                    className="w-full bg-white border-2 border-emerald-200 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-emerald-700 hover:bg-emerald-50 font-black py-4 rounded-xl mb-3 transition-colors flex items-center justify-center gap-2"
                  >
                    {resendLoading ? <><Loader2 className="animate-spin" size={18}/> Sending...</> : resendCooldown > 0 ? `Resend link in ${resendCooldown}s` : 'Resend Verification Link'}
                  </button>

                  <button
                    onClick={() => setCurrentScreen('signup_email')}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-4 rounded-xl transition-colors"
                  >
                    Use Another Email
                  </button>
                </div>
              )}

              {currentScreen === 'login' && (
                <div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome Back</h2>
                  <p className="text-sm text-gray-500 font-medium mb-8">Sign in to access your secure documents.</p>

                  <button onClick={handleGoogleAuth} disabled={loading} className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-3.5 rounded-xl flex justify-center items-center gap-3 mb-6 transition-all active:scale-95 shadow-sm">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" /> Continue with Google
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-gray-200"></div><span className="text-xs font-black text-gray-400 uppercase tracking-widest">OR</span><div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  <form onSubmit={(e)=>{e.preventDefault(); handleLogin();}} className="space-y-5">
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                      <input type="email" required value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 p-3.5 rounded-xl outline-none font-bold text-gray-800 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                      <div className="flex bg-gray-50 border border-gray-200 focus-within:bg-white focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10 rounded-xl pr-3 items-center transition-all">
                        <input type={showPassword ? "text" : "password"} required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full bg-transparent p-3.5 outline-none font-bold text-gray-800" />
                        <span onClick={()=>setShowPassword(!showPassword)} className="cursor-pointer text-gray-500 hover:text-gray-800">{showPassword ? '🙈' : '👁️'}</span>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg mt-2 transition-transform active:scale-95 flex items-center justify-center">{loading ? <Loader2 className="animate-spin"/> : 'Secure Login'}</button>
                  </form>
                  <p className="text-sm text-gray-500 font-bold mt-8 text-center">Don't have an account? <span onClick={() => setCurrentScreen('signup_choice')} className="text-emerald-600 cursor-pointer hover:underline">Sign up now</span></p>
                </div>
              )}

              {currentScreen === 'signup_choice' && (
                <div>
                  <button onClick={() => setCurrentScreen('login')} className="text-gray-400 hover:text-gray-900 font-bold text-xs flex items-center gap-1 mb-8 w-fit transition-colors"><ArrowLeft size={14}/> Back to Login</button>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">Create Account</h2>
                  <p className="text-sm text-gray-500 font-medium mb-8">Join EduFill and never worry about exam forms again.</p>
                  
                  <div className="space-y-4">
                    <button onClick={handleGoogleAuth} disabled={loading} className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-4 rounded-xl flex justify-center items-center gap-3 transition-all shadow-sm active:scale-95"><img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" /> Sign Up with Google</button>
                    <button onClick={() => setCurrentScreen('signup_email')} className="w-full bg-emerald-50 border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold py-4 rounded-xl transition-all shadow-sm active:scale-95">📧 Continue with Email</button>
                  </div>
                </div>
              )}

              {currentScreen === 'signup_email' && (
                <div>
                  <button onClick={() => setCurrentScreen('signup_choice')} className="text-gray-400 hover:text-gray-900 font-bold text-xs flex items-center gap-1 mb-6 w-fit transition-colors"><ArrowLeft size={14}/> Back</button>
                  <h2 className="text-3xl font-black text-gray-900 mb-8">Sign Up</h2>
                  <form onSubmit={(e)=>{e.preventDefault(); handleEmailSignup();}} className="space-y-4">
                    <input type="text" required placeholder="Full Name" value={fullName} onChange={(e)=>setFullName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 p-3.5 rounded-xl outline-none font-bold text-gray-800 transition-all" />
                    <input type="email" required placeholder="Email Address" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 p-3.5 rounded-xl outline-none font-bold text-gray-800 transition-all" />
                    <input type="tel" maxLength="10" required placeholder="Mobile Number" value={phone} onChange={(e)=>setPhone(normalizePhoneNumber(e.target.value))} className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 p-3.5 rounded-xl outline-none font-bold text-gray-800 transition-all" />
                    
                    <div className="flex gap-2 pt-1 pb-1">
                      {['10th', '12th', 'Graduate'].map((item) => (
                        <div key={item} onClick={() => setQualification(item)} className={`flex-1 text-center py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border-2 ${qualification === item ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>{item}</div>
                      ))}
                    </div>

                    <div className="flex bg-gray-50 border border-gray-200 focus-within:bg-white focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10 rounded-xl pr-3 items-center transition-all">
                      <input type={showPassword ? "text" : "password"} required placeholder="Create Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full bg-transparent p-3.5 outline-none font-bold text-gray-800" />
                      <span onClick={()=>setShowPassword(!showPassword)} className="cursor-pointer text-gray-500 hover:text-gray-800">{showPassword ? '🙈' : '👁️'}</span>
                    </div>
                    <div className="flex bg-gray-50 border border-gray-200 focus-within:bg-white focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10 rounded-xl pr-3 items-center transition-all">
                      <input type="password" required placeholder="Confirm Password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="w-full bg-transparent p-3.5 outline-none font-bold text-gray-800" />
                    </div>
                    
                    <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg mt-4 transition-transform active:scale-95 flex items-center justify-center">{loading ? <Loader2 className="animate-spin"/> : 'Create Account'}</button>
                  </form>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
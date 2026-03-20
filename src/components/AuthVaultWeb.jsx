import React, { useState, useEffect, useRef } from 'react';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut, sendEmailVerification, updateProfile,
  GoogleAuthProvider, signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; 

import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// 🌟 NAYA IMPORT: IMAGE COMPRESSION 🌟
import imageCompression from 'browser-image-compression';

const REQUIRED_DOCS = [
  { id: 'profilePicUrl', label: 'Passport Photo', icon: '🖼️', desc: 'White background' },
  { id: 'signatureUrl', label: 'Signature', icon: '✍️', desc: 'Black pen on white paper' },
  { id: 'thumbUrl', label: 'Thumb Impression', icon: '👍', desc: 'Left/Right thumb' },
  { id: 'aadharUrl', label: 'Aadhar Card', icon: '🪪', desc: 'Front and Back side' },
  { id: 'tenthUrl', label: '10th Marksheet', icon: '📄', desc: 'Original scan required' },
  { id: 'twelfthUrl', label: '12th Marksheet', icon: '📄', desc: 'Original scan required' },
  { id: 'casteUrl', label: 'Caste Certificate', icon: '📜', desc: 'If applicable (SC/ST/OBC)' },
  { id: 'domicileUrl', label: 'Domicile (Niwash)', icon: '🏠', desc: 'State level certificate' },
];

export default function AuthVaultWeb() {
  const [currentScreen, setCurrentScreen] = useState('login'); 
  const [user, setUser] = useState(null); 
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  const [userData, setUserData] = useState({});
  const [userDocs, setUserDocs] = useState({});
  const [showDocs, setShowDocs] = useState(false);

  const [loginEmail, setLoginEmail] = useState(''); 
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [applyScanFilter, setApplyScanFilter] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
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
        }
      }
      setUser(currentUser); 
      setAuthChecking(false);
    });
    return unsubscribe;
  }, []);

  const handleGoogleAuth = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } 
    catch (error) { alert("Google Sign-In Failed: " + error.message); } 
    finally { setLoading(false); }
  };

  const submitGoogleExtraDetails = async () => {
    if (!fullName || !phone || !qualification) { alert("Please fill all details!"); return; }
    if (phone.length !== 10) { alert("Invalid Mobile Number!"); return; }
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: fullName });
      await setDoc(doc(db, "Users", auth.currentUser.uid), { uid: auth.currentUser.uid, fullName, email: auth.currentUser.email, phone, qualification, signupMethod: 'google', role: 'student', documents: {}, createdAt: serverTimestamp() });
      setIsProfileComplete(true); window.location.reload();
    } catch (error) { alert(error.message); } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!loginEmail || !password) { alert("Enter Email and Password!"); return; }
    setLoading(true);
    try { await signInWithEmailAndPassword(auth, loginEmail.trim().toLowerCase(), password); } 
    catch (error) { alert(error.message.replace('Firebase: ', '')); } finally { setLoading(false); }
  };

  const handleEmailSignup = async () => {
    if (!fullName || !email || !phone || !qualification || !password || !confirmPassword) { alert("Fill all fields!"); return; }
    if (password !== confirmPassword) { alert("Passwords mismatch!"); return; }
    if (phone.length !== 10) { alert("Enter a valid 10-digit mobile number!"); return; }
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await updateProfile(userCred.user, { displayName: fullName });
      await setDoc(doc(db, "Users", userCred.user.uid), { uid: userCred.user.uid, fullName, email: email.trim().toLowerCase(), phone, qualification, signupMethod: 'email', role: 'student', documents: {}, createdAt: serverTimestamp() });
      await sendEmailVerification(userCred.user);
      setCurrentScreen('verify_email_link'); 
    } catch (error) { alert(error.message.replace('Firebase: ', '')); } finally { setLoading(false); }
  };

  const checkEmailVerified = async () => {
    setLoading(true); await auth.currentUser?.reload();
    if (auth.currentUser?.emailVerified) { alert("Verified!"); setUser({...auth.currentUser}); window.location.reload(); } 
    else { alert("Not verified yet. Check your inbox."); }
    setLoading(false);
  };

  const handleLogout = async () => { await signOut(auth); setCurrentScreen('login'); };

  const openUploadModal = (docItem) => {
    setActiveDoc(docItem); setSelectedFile(null); setPreviewUrl(''); setApplyScanFilter(false); setCrop(undefined); setCompletedCrop(null); setUploadModalOpen(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => { setPreviewUrl(reader.result); };
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e) => {
    setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
  };

  const handleRotate = () => {
    const image = new Image();
    image.src = previewUrl;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.height; 
      canvas.height = image.width;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(image, -image.width / 2, -image.height / 2);
      setPreviewUrl(canvas.toDataURL('image/jpeg')); 
      setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 }); 
    };
  };

  const getProcessedImageBlob = async () => {
    if (!selectedFile.type.startsWith('image/')) return selectedFile; 
    if (!completedCrop || !imgRef.current) return selectedFile;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');

    if (applyScanFilter) { ctx.filter = 'grayscale(100%) contrast(1.5) brightness(1.1)'; }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0, canvas.width, canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => { resolve(new File([blob], `processed_${selectedFile.name}`, { type: 'image/jpeg' })); }, 'image/jpeg', 1.0); // Maximum quality here, compress later
    });
  };

  // 🌟 NAYA: COMPRESSION + CLOUDINARY UPLOAD 🌟
  const uploadToCloudinaryAndSave = async () => {
    if (!selectedFile) return alert("Please select a file first.");
    setIsUploading(true);

    try {
      // 1. Process Crop/Rotate/Filter
      let finalFile = await getProcessedImageBlob(); 

      // 2. COMPRESS THE IMAGE (Only if it's an image, not PDF)
      if (finalFile.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 0.1, // Approx 100 KB
          maxWidthOrHeight: 1024, // Reduces resolution safely
          useWebWorker: true, // Speeds up compression using multiple threads
        };
        finalFile = await imageCompression(finalFile, options);
      }

      // 3. Upload to Cloudinary
      const formData = new FormData(); 
      formData.append("file", finalFile); 
      formData.append("upload_preset", "edufill_docs"); 
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/dvocl6wvq/auto/upload`, { method: "POST", body: formData });
      const data = await response.json(); 
      const newFileUrl = data.secure_url;

      // 4. Save to Firebase
      const updatedDocs = { ...userDocs, [activeDoc.id]: newFileUrl };
      await updateDoc(doc(db, "Users", user.uid), { documents: updatedDocs });
      
      setUserDocs(updatedDocs);
      alert(`${activeDoc.label} compressed & saved securely (~100KB)! ✅`);
      setUploadModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to compress or upload document. Please check connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (url, label) => {
    try {
      const response = await fetch(url);
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
      window.open(url, '_blank'); 
    }
  };

  if (authChecking) return <div style={styles.loader}>Loading Vault...</div>;

  if (user) {
    if (!isProfileComplete) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={styles.heading}>Just One More Step!</h2>
            <p style={styles.subText}>Complete your profile to unlock vault.</p>
            <label style={styles.label}>Full Name</label><input style={styles.input} value={fullName} onChange={(e)=>setFullName(e.target.value)} />
            <label style={styles.label}>Mobile Number *</label><input style={styles.input} type="tel" maxLength="10" value={phone} onChange={(e)=>setPhone(e.target.value)} />
            <label style={styles.label}>Highest Qualification</label>
            <div style={styles.pillContainer}>
              {['10th', '12th', 'Graduate'].map((item) => (<div key={item} onClick={() => setQualification(item)} style={{...styles.pill, ...(qualification === item ? styles.pillActive : {})}}>{item}</div>))}
            </div>
            <button type="button" style={styles.primaryBtn} onClick={submitGoogleExtraDetails} disabled={loading}>{loading ? 'Saving...' : 'Save & Enter Vault'}</button>
            <button type="button" style={styles.textBtnError} onClick={handleLogout}>Cancel Sign Up</button>
          </div>
        </div>
      );
    }

    if (!user.emailVerified) {
       return (
         <div style={styles.container}>
           <div style={styles.emptyState}>
             <h1 style={{fontSize: '50px', margin: '0 0 10px 0'}}>📧</h1>
             <h3 style={{margin: 0}}>Verify your Email</h3>
             <p style={styles.subText}>Please check your inbox and click the verification link.</p>
             <button type="button" style={styles.primaryBtn} onClick={checkEmailVerified} disabled={loading}>{loading ? 'Checking...' : 'Refresh Status'}</button>
             <button type="button" style={styles.textBtnError} onClick={handleLogout}>Logout</button>
           </div>
         </div>
       );
    }

    const uploadedCount = REQUIRED_DOCS.filter(d => userDocs[d.id]).length;
    const totalDocs = REQUIRED_DOCS.length;
    const progressPercent = Math.round((uploadedCount / totalDocs) * 100);

    return (
      <div style={styles.vaultContainer}>
        
        <div style={styles.vaultHeader}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <div style={styles.profileAvatar}>{userData.fullName?.charAt(0) || 'S'}</div>
            <div>
              <h2 style={{margin: 0, color: '#111827', fontSize: '20px', fontWeight: '900'}}>My Vault</h2>
              <p style={{margin: '2px 0 0 0', color: '#6b7280', fontSize: '13px', fontWeight:'600'}}>{userData.email}</p>
            </div>
          </div>
          <button type="button" style={styles.iconBtnError} onClick={handleLogout}>🚪 Logout</button>
        </div>

        <div style={styles.lockerBanner}>
          <div style={{flex: 1}}>
            <h3 style={{margin: '0 0 8px 0', fontSize: '22px', color: 'white', fontWeight: '900'}}>Digital Locker</h3>
            <p style={{margin: 0, color: '#d1fae5', fontSize: '14px', lineHeight: '1.4'}}>
              Store your documents securely once. Use them to auto-fill any exam form instantly.
            </p>
            <div style={{marginTop: '15px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#d1fae5', fontWeight: 'bold', marginBottom: '5px'}}>
                <span>Profile Completion</span>
                <span>{progressPercent}%</span>
              </div>
              <div style={{height: '6px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden'}}>
                <div style={{height: '100%', width: `${progressPercent}%`, backgroundColor: '#fcd34d', borderRadius: '10px', transition: 'width 0.5s'}}></div>
              </div>
            </div>
          </div>
          <button onClick={() => setShowDocs(!showDocs)} style={styles.lockerToggleBtn}>
            {showDocs ? 'Hide Documents ⬆️' : 'Open My Locker 📂'}
          </button>
        </div>

        {showDocs && (
          <div style={styles.listContainer}>
            {REQUIRED_DOCS.map((docItem) => {
              const isUploaded = !!userDocs[docItem.id];
              return (
                <div key={docItem.id} style={{...styles.listItem, borderLeft: isUploaded ? '4px solid #10b981' : '4px solid #e5e7eb'}}>
                  <div style={styles.listLeft}>
                    <div style={styles.docIconBox}>{docItem.icon}</div>
                    <div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <h4 style={{margin: 0, fontSize: '15px', color: '#1f2937', fontWeight: '800'}}>{docItem.label}</h4>
                        <span style={isUploaded ? styles.badgeSuccess : styles.badgePending}>
                          {isUploaded ? 'Uploaded' : 'Pending'}
                        </span>
                      </div>
                      <p style={{fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0', fontWeight: '500'}}>{docItem.desc}</p>
                    </div>
                  </div>
                  <div style={styles.listRight}>
                    {isUploaded ? (
                      <>
                        <button onClick={() => window.open(userDocs[docItem.id], '_blank')} style={{...styles.actionBtn, backgroundColor: '#f3f4f6', color: '#374151'}} title="View">👁️</button>
                        <button onClick={() => handleDownload(userDocs[docItem.id], docItem.label)} style={{...styles.actionBtn, backgroundColor: '#ecfdf5', color: '#059669'}} title="Download">⬇️</button>
                        <button onClick={() => openUploadModal(docItem)} style={{...styles.actionBtn, backgroundColor: '#fffbeb', color: '#d97706'}} title="Replace">🔄</button>
                      </>
                    ) : (
                      <button onClick={() => openUploadModal(docItem)} style={{...styles.actionBtn, padding: '8px 16px', backgroundColor: '#eff6ff', color: '#2563eb'}}>☁️ Upload</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {uploadModalOpen && activeDoc && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h3 style={{margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap:'8px', fontWeight: '900'}}>
                  {activeDoc.icon} {activeDoc.label}
                </h3>
                <span onClick={() => setUploadModalOpen(false)} style={{cursor: 'pointer', fontSize:'20px'}}>❌</span>
              </div>

              {!previewUrl ? (
                <div style={styles.uploadBox}>
                  <p style={{fontSize: '45px', margin: '0 0 10px 0'}}>📤</p>
                  <p style={{fontWeight: '900', fontSize: '16px', color: '#374151'}}>Tap to select document</p>
                  <p style={{fontSize: '12px', color: '#9ca3af', fontWeight: '600'}}>Supports JPG, PNG, or PDF</p>
                  <input type="file" accept="image/*,application/pdf" onChange={handleFileSelect} style={styles.hiddenInput} />
                </div>
              ) : (
                <div style={{textAlign: 'center'}}>
                  <div style={styles.cropContainer}>
                    {selectedFile.type.startsWith('image/') ? (
                      <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)}>
                        <img 
                          ref={imgRef} src={previewUrl} alt="Crop Preview" onLoad={onImageLoad}
                          style={{
                            maxHeight: '220px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px',
                            filter: applyScanFilter ? 'grayscale(100%) contrast(1.5) brightness(1.1)' : 'none'
                          }} 
                        />
                      </ReactCrop>
                    ) : (
                      <div style={{padding: '40px 0', fontSize: '16px', fontWeight: 'bold'}}>📄 PDF Document Selected</div>
                    )}
                  </div>

                  {selectedFile.type.startsWith('image/') && (
                    <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                      <button onClick={handleRotate} style={{...styles.actionBtn, flex: 1, backgroundColor: '#f3f4f6', color: '#374151', padding: '12px'}}>
                        🔄 Rotate
                      </button>
                      <label style={{...styles.scanToggleBox, flex: 1.5}}>
                        <input type="checkbox" checked={applyScanFilter} onChange={(e) => setApplyScanFilter(e.target.checked)} style={{transform: 'scale(1.2)'}} />
                        <span style={{fontWeight: '800', fontSize: '13px', color: '#1f2937'}}>✨ Magic Scan</span>
                      </label>
                    </div>
                  )}

                  <div style={{display: 'flex', gap: '10px'}}>
                    <button onClick={() => setPreviewUrl('')} style={{...styles.actionBtn, flex: 1, backgroundColor: '#fee2e2', color: '#ef4444', padding: '14px'}}>Reset</button>
                    <button onClick={uploadToCloudinaryAndSave} disabled={isUploading} style={{...styles.actionBtn, flex: 2, backgroundColor: '#10b981', color: '#ffffff', padding: '14px', fontSize: '14px'}}>
                      {isUploading ? '⏳ Compressing...' : '💾 Compress & Save'}
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

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{textAlign: 'center', marginBottom: '20px'}}>
          <div style={styles.logoBox}>🎓</div>
          <h2 style={{margin: 0, color: '#1e3a8a'}}>EduFill Vault</h2>
          <p style={styles.subText}>Login to access your secure documents</p>
        </div>

        {currentScreen === 'login' && (
          <>
            <button type="button" style={styles.socialBtn} onClick={handleGoogleAuth} disabled={loading}>🌐 Continue with Google</button>
            <div style={styles.divider}><span>OR LOGIN VIA EMAIL</span></div>
            <label style={styles.label}>Email Address</label>
            <input style={styles.input} type="email" value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} />
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input style={styles.passwordInput} type={showPassword ? "text" : "password"} value={password} onChange={(e)=>setPassword(e.target.value)} />
              <span style={{cursor: 'pointer'}} onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</span>
            </div>
            <button type="button" style={styles.primaryBtn} onClick={handleLogin} disabled={loading}>{loading ? 'Connecting...' : 'Secure Login'}</button>
            <p style={styles.switchText}>Don't have an account? <span style={styles.link} onClick={() => setCurrentScreen('signup_choice')}>Sign Up</span></p>
          </>
        )}

        {currentScreen === 'signup_choice' && (
          <>
            <p style={styles.backBtn} onClick={() => setCurrentScreen('login')}>⬅ Back to Login</p>
            <h3 style={styles.heading}>Create Account</h3>
            <button type="button" style={styles.socialBtn} onClick={handleGoogleAuth} disabled={loading}>🌐 Sign Up with Google</button>
            <button type="button" style={{...styles.socialBtn, color: '#3b82f6', borderColor: '#3b82f6'}} onClick={() => setCurrentScreen('signup_email')}>📧 Sign Up with Email</button>
          </>
        )}

        {currentScreen === 'signup_email' && (
          <>
            <p style={styles.backBtn} onClick={() => setCurrentScreen('signup_choice')}>⬅ Back</p>
            <h3 style={styles.heading}>Sign Up via Email</h3>
            <label style={styles.label}>Full Name *</label><input style={styles.input} value={fullName} onChange={(e)=>setFullName(e.target.value)} />
            <label style={styles.label}>Email *</label><input style={styles.input} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <label style={styles.label}>Mobile *</label><input style={styles.input} type="tel" maxLength="10" value={phone} onChange={(e)=>setPhone(e.target.value)} />
            <label style={styles.label}>Highest Qualification</label>
            <div style={styles.pillContainer}>
              {['10th', '12th', 'Graduate'].map((item) => (<div key={item} onClick={() => setQualification(item)} style={{...styles.pill, ...(qualification === item ? styles.pillActive : {})}}>{item}</div>))}
            </div>
            <label style={styles.label}>Create Password</label>
            <div style={styles.passwordWrapper}><input style={styles.passwordInput} type={showPassword?"text":"password"} value={password} onChange={(e)=>setPassword(e.target.value)}/><span onClick={()=>setShowPassword(!showPassword)} style={{cursor:'pointer'}}>{showPassword?'🙈':'👁️'}</span></div>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.passwordWrapper}><input style={styles.passwordInput} type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)}/></div>
            <button type="button" style={styles.primaryBtn} onClick={handleEmailSignup} disabled={loading}>{loading ? 'Processing...' : 'Send Verification Link'}</button>
          </>
        )}
      </div>
    </div>
  );
}

// 🌟 PREMIUM CSS-IN-JS STYLES 🌟
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f9fafb', padding: '15px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  vaultContainer: { maxWidth: '800px', margin: '0 auto', padding: '10px 15px 40px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#10b981', fontSize: '18px', fontWeight: 'bold' },
  
  card: { backgroundColor: 'white', maxWidth: '380px', margin: '0 auto', padding: '25px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' },
  logoBox: { backgroundColor: '#ede9fe', width: '50px', height: '50px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 10px', fontSize: '24px' },
  heading: { textAlign: 'center', color: '#1f2937', marginBottom: '15px', marginTop: 0, fontSize: '20px', fontWeight: '900' },
  subText: { color: '#6b7280', fontSize: '13px', textAlign: 'center', margin: '5px 0 20px 0', fontWeight: '500' },
  label: { display: 'block', fontSize: '12px', fontWeight: '800', color: '#4b5563', marginBottom: '6px', marginTop: '12px' },
  input: { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '14px', boxSizing: 'border-box', outline: 'none', fontWeight: '500' },
  passwordWrapper: { display: 'flex', alignItems: 'center', backgroundColor: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: '12px', paddingRight: '12px' },
  passwordInput: { flex: 1, padding: '12px 14px', border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '14px', fontWeight: '500' },
  primaryBtn: { width: '100%', backgroundColor: '#10b981', color: 'white', padding: '14px', borderRadius: '14px', border: 'none', fontWeight: '900', fontSize: '15px', marginTop: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' },
  socialBtn: { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', backgroundColor: 'white', border: '2px solid #e5e7eb', padding: '12px', borderRadius: '12px', fontWeight: '800', color: '#374151', cursor: 'pointer', marginBottom: '8px', fontSize: '14px' },
  divider: { display: 'flex', alignItems: 'center', textAlign: 'center', color: '#9ca3af', fontSize: '10px', fontWeight: '900', margin: '15px 0' },
  switchText: { textAlign: 'center', fontSize: '13px', color: '#6b7280', marginTop: '15px', fontWeight: '600' },
  link: { color: '#10b981', fontWeight: '900', cursor: 'pointer' },
  backBtn: { color: '#6b7280', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'inline-block', margin: '0 0 10px 0' },
  pillContainer: { display: 'flex', gap: '8px' },
  pill: { flex: 1, textAlign: 'center', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '11px', fontWeight: '800', color: '#6b7280', cursor: 'pointer', backgroundColor: 'white' },
  pillActive: { borderColor: '#10b981', color: '#10b981', backgroundColor: '#ecfdf5' },
  textBtnError: { color: '#ef4444', fontWeight: '800', cursor: 'pointer', background: 'none', border: 'none', padding: '10px', width: '100%', textAlign: 'center', marginTop: '5px' },

  vaultHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: 'transparent', marginBottom: '20px' },
  profileAvatar: { width: '45px', height: '45px', backgroundColor: '#10b981', color: 'white', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', fontWeight: '900', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' },
  iconBtnError: { background: '#fef2f2', color: '#ef4444', border: 'none', padding: '10px 14px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' },
  
  lockerBanner: { background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', padding: '25px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)', marginBottom: '20px' },
  lockerToggleBtn: { backgroundColor: 'white', color: '#059669', border: 'none', padding: '14px 20px', borderRadius: '14px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', alignSelf: 'flex-start' },

  listContainer: { display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.3s ease-in-out' },
  listItem: { backgroundColor: 'white', padding: '16px 20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', transition: 'transform 0.2s' },
  listLeft: { display: 'flex', alignItems: 'center', gap: '15px', flex: '1 1 250px' },
  listRight: { display: 'flex', gap: '8px', flex: '0 1 auto' },
  docIconBox: { fontSize: '24px', backgroundColor: '#f3f4f6', width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '14px' },
  
  badgePending: { backgroundColor: '#fef2f2', color: '#ef4444', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '8px' },
  badgeSuccess: { backgroundColor: '#ecfdf5', color: '#10b981', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '8px' },
  actionBtn: { padding: '10px', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'center', transition: '0.2s' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 24, 39, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, padding: '15px', backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: 'white', padding: '25px', borderRadius: '28px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' },
  uploadBox: { border: '3px dashed #e5e7eb', borderRadius: '20px', padding: '40px 15px', textAlign: 'center', backgroundColor: '#f9fafb', cursor: 'pointer', position: 'relative', transition: '0.3s hover:border-emerald-500' },
  hiddenInput: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' },
  cropContainer: { backgroundColor: '#f9fafb', padding: '10px', borderRadius: '16px', border: '2px solid #e5e7eb', marginBottom: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '180px' },
  scanToggleBox: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fffbeb', border: '2px solid #fde68a', padding: '10px 15px', borderRadius: '12px', cursor: 'pointer', justifyContent: 'center' }
};
import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut, sendEmailVerification, updateProfile,
  GoogleAuthProvider, signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; 

export default function AuthVaultWeb() {
  const [currentScreen, setCurrentScreen] = useState('login'); 
  const [user, setUser] = useState(null); 
  const [authChecking, setAuthChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  // Form Fields
  const [loginEmail, setLoginEmail] = useState(''); 
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editQualification, setEditQualification] = useState('');

  // 🌟 CHECK USER STATUS 🌟
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
        if (!userDoc.exists()) {
          setIsProfileComplete(false); 
          setFullName(currentUser.displayName || '');
          setEmail(currentUser.email || '');
        } else {
          setIsProfileComplete(true); 
        }
      }
      setUser(currentUser); 
      setAuthChecking(false);
    });
    return unsubscribe;
  }, []);

  // ==========================================
  // 💡 1. WEB GOOGLE AUTHENTICATION (WORKS FOR BOTH LOGIN & SIGNUP)
  // ==========================================
  const handleGoogleAuth = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Firebase automatically decides whether to Login or Signup here!
    } catch (error) {
      alert("Google Sign-In Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitGoogleExtraDetails = async () => {
    if (!fullName || !phone || !qualification) { alert("Please fill all details!"); return; }
    if (phone.length !== 10) { alert("Invalid Mobile Number!"); return; }
    
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: fullName });
      await setDoc(doc(db, "Users", auth.currentUser.uid), {
        uid: auth.currentUser.uid, fullName, email, phone, qualification, signupMethod: 'google', role: 'student', createdAt: serverTimestamp()
      });
      alert("Welcome to EduFill! 🎉");
      setIsProfileComplete(true); 
    } catch (error) { alert(error.message); } 
    finally { setLoading(false); }
  };

  // ==========================================
  // 💡 2. EMAIL AUTHENTICATION
  // ==========================================
  const handleLogin = async () => {
    if (!loginEmail || !password) { alert("Enter Email and Password!"); return; }
    setLoading(true);
    try { await signInWithEmailAndPassword(auth, loginEmail.trim().toLowerCase(), password); } 
    catch (error) { alert(error.message.replace('Firebase: ', '')); } 
    finally { setLoading(false); }
  };

  const handleEmailSignup = async () => {
    if (!fullName || !email || !phone || !qualification || !password || !confirmPassword) { alert("Fill all fields!"); return; }
    if (password !== confirmPassword) { alert("Passwords mismatch!"); return; }
    if (phone.length !== 10) { alert("Enter a valid 10-digit mobile number!"); return; }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await updateProfile(userCred.user, { displayName: fullName });
      
      await setDoc(doc(db, "Users", userCred.user.uid), {
        uid: userCred.user.uid, fullName, email: email.trim().toLowerCase(), phone, qualification, signupMethod: 'email', role: 'student', createdAt: serverTimestamp()
      });
      
      await sendEmailVerification(userCred.user);
      setCurrentScreen('verify_email_link'); 
    } catch (error) { alert(error.message.replace('Firebase: ', '')); } 
    finally { setLoading(false); }
  };

  const handleResendEmail = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try { await sendEmailVerification(auth.currentUser); alert("Link sent again!"); } 
    catch (error) { alert("Wait before sending another link."); } 
    finally { setLoading(false); }
  };

  const checkEmailVerified = async () => {
    setLoading(true);
    await auth.currentUser?.reload();
    if (auth.currentUser?.emailVerified) { alert("Verified!"); setUser({...auth.currentUser}); } 
    else { alert("Not verified yet."); }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentScreen('login');
  };

  const openEditProfile = async () => {
    if (!user) return;
    setLoading(true);
    setEditFullName(user.displayName || '');
    try {
      const q = query(collection(db, "Users"), where("uid", "==", user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) { setEditQualification(snap.docs[0].data().qualification || ''); }
    } catch (e) { console.log(e); }
    setIsEditingProfile(true);
    setLoading(false);
  };

  const saveProfileChanges = async () => {
    if (!editFullName || !editQualification) { alert("Fields cannot be empty!"); return; }
    setLoading(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: editFullName });
        await updateDoc(doc(db, "Users", auth.currentUser.uid), { fullName: editFullName, qualification: editQualification });
        alert("Profile Updated! ✅");
        setIsEditingProfile(false);
        setUser({ ...auth.currentUser, displayName: editFullName }); 
      }
    } catch (e) { alert(e.message); } 
    finally { setLoading(false); }
  };

  if (authChecking) return <div style={styles.loader}>Loading...</div>;

  // ==========================================
  // 🎨 RENDER VAULT (LOGGED IN)
  // ==========================================
  if (user) {
    if (!isProfileComplete) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={styles.heading}>Just One More Step!</h2>
            <p style={styles.subText}>Complete your Google Profile.</p>
            
            <label style={styles.label}>Full Name</label>
            <input style={styles.input} value={fullName} onChange={(e)=>setFullName(e.target.value)} />
            
            <label style={styles.label}>Mobile Number *</label>
            <input style={styles.input} type="tel" maxLength="10" value={phone} onChange={(e)=>setPhone(e.target.value)} />
            
            <label style={styles.label}>Highest Qualification</label>
            <div style={styles.pillContainer}>
              {['10th', '12th', 'Graduate'].map((item) => (
                <div key={item} onClick={() => setQualification(item)} style={{...styles.pill, ...(qualification === item ? styles.pillActive : {})}}>
                  {item}
                </div>
              ))}
            </div>

            <button type="button" style={styles.primaryBtn} onClick={submitGoogleExtraDetails} disabled={loading}>{loading ? 'Saving...' : 'Save & Enter Vault'}</button>
            <button type="button" style={styles.textBtnError} onClick={handleLogout}>Cancel Sign Up</button>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h2 style={{margin: 0, color: '#1e3a8a'}}>My Vault 🔐</h2>
            <p style={{margin: 0, color: '#6b7280', fontSize: '14px'}}>{user.displayName} • {user.email}</p>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            {user.emailVerified && !isEditingProfile && (
              <button type="button" style={styles.iconBtnPrimary} onClick={openEditProfile}>⚙️ Edit</button>
            )}
            <button type="button" style={styles.iconBtnError} onClick={handleLogout}>🚪 Logout</button>
          </div>
        </div>

        {!user.emailVerified ? (
          <div style={styles.emptyState}>
            <h1 style={{fontSize: '50px', margin: '0 0 10px 0'}}>📧</h1>
            <h3 style={{margin: 0}}>Verify your Email</h3>
            <p style={styles.subText}>Please check your inbox and click the verification link.</p>
            <button type="button" style={styles.primaryBtn} onClick={checkEmailVerified} disabled={loading}>{loading ? 'Checking...' : 'Refresh Status'}</button>
            <button type="button" style={styles.textBtnPrimary} onClick={handleResendEmail} disabled={loading}>Resend Verification Link</button>
          </div>
        ) : isEditingProfile ? (
          <div style={{ ...styles.card, margin: '20px auto', maxWidth: '500px' }}>
            <h2 style={styles.heading}>Edit Profile</h2>
            <label style={styles.label}>Full Name</label>
            <input style={styles.input} value={editFullName} onChange={(e)=>setEditFullName(e.target.value)} />
            
            <label style={styles.label}>Highest Qualification</label>
            <div style={styles.pillContainer}>
              {['10th', '12th', 'Graduate'].map((item) => (
                <div key={item} onClick={() => setEditQualification(item)} style={{...styles.pill, ...(editQualification === item ? styles.pillActive : {})}}>{item}</div>
              ))}
            </div>

            <button type="button" style={styles.primaryBtn} onClick={saveProfileChanges} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
            <button type="button" style={styles.textBtnError} onClick={() => setIsEditingProfile(false)}>Cancel</button>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <h1 style={{fontSize: '50px', margin: '0 0 10px 0'}}>📂</h1>
            <h3 style={{margin: 0}}>Your Vault is empty</h3>
            <p style={styles.subText}>Upload your Marksheets and Documents here.</p>
            <button type="button" style={styles.uploadBtn}>☁️ Upload Document</button>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 🎨 RENDER AUTHENTICATION (LOGGED OUT)
  // ==========================================
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{textAlign: 'center', marginBottom: '20px'}}>
          <div style={styles.logoBox}>🎓</div>
          <h2 style={{margin: 0, color: '#1e3a8a'}}>EduFill</h2>
          <p style={styles.subText}>Access your secure exam portal</p>
        </div>

        {currentScreen === 'login' && (
          <>
            <h3 style={styles.heading}>Login</h3>
            
            {/* 🌟 GOOGLE LOGIN BUTTON 🌟 */}
            <button type="button" style={styles.socialBtn} onClick={handleGoogleAuth} disabled={loading}>
              🌐 Continue with Google
            </button>
            
            <div style={styles.divider}><span>OR LOGIN VIA EMAIL</span></div>
            
            <label style={styles.label}>Email Address</label>
            <input style={styles.input} type="email" placeholder="student@example.com" value={loginEmail} onChange={(e)=>setLoginEmail(e.target.value)} />
            
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input style={styles.passwordInput} type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)} />
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
            
            {/* 🌟 GOOGLE SIGNUP BUTTON (FIXED) 🌟 */}
            <button type="button" style={styles.socialBtn} onClick={handleGoogleAuth} disabled={loading}>
              🌐 Sign Up with Google
            </button>
            
            <button type="button" style={{...styles.socialBtn, color: '#3b82f6', borderColor: '#3b82f6'}} onClick={() => setCurrentScreen('signup_email')}>
              📧 Sign Up with Email
            </button>
          </>
        )}

        {currentScreen === 'signup_email' && (
          <>
            <p style={styles.backBtn} onClick={() => setCurrentScreen('signup_choice')}>⬅ Back</p>
            <h3 style={styles.heading}>Sign Up via Email</h3>
            
            <label style={styles.label}>Full Name *</label>
            <input style={styles.input} value={fullName} onChange={(e)=>setFullName(e.target.value)} />
            <label style={styles.label}>Email Address *</label>
            <input style={styles.input} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            
            <label style={styles.label}>Mobile Number *</label>
            <input style={styles.input} type="tel" maxLength="10" value={phone} onChange={(e)=>setPhone(e.target.value)} />
            
            <label style={styles.label}>Highest Qualification</label>
            <div style={styles.pillContainer}>
              {['10th', '12th', 'Graduate'].map((item) => (
                <div key={item} onClick={() => setQualification(item)} style={{...styles.pill, ...(qualification === item ? styles.pillActive : {})}}>{item}</div>
              ))}
            </div>

            <label style={styles.label}>Create Password</label>
            <div style={styles.passwordWrapper}><input style={styles.passwordInput} type={showPassword?"text":"password"} value={password} onChange={(e)=>setPassword(e.target.value)}/><span onClick={()=>setShowPassword(!showPassword)} style={{cursor:'pointer'}}>{showPassword?'🙈':'👁️'}</span></div>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.passwordWrapper}><input style={styles.passwordInput} type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)}/></div>

            <button type="button" style={styles.primaryBtn} onClick={handleEmailSignup} disabled={loading}>{loading ? 'Processing...' : 'Send Verification Link'}</button>
          </>
        )}

        {currentScreen === 'verify_email_link' && (
          <div style={{textAlign: 'center'}}>
            <h3 style={styles.heading}>Check your Email</h3>
            <p style={styles.subText}>Link sent to <b>{email}</b>. Click to verify.</p>
            <button type="button" style={styles.primaryBtn} onClick={checkEmailVerified} disabled={loading}>{loading ? 'Checking...' : 'I have verified, Login'}</button>
            <button type="button" style={styles.textBtnPrimary} onClick={handleResendEmail} disabled={loading}>Resend Link</button>
            <p style={{...styles.backBtn, display: 'block', marginTop: '20px'}} onClick={() => setCurrentScreen('login')}>Back to Login</p>
          </div>
        )}
        
      </div>
    </div>
  );
}

// 🌟 PURE CSS-IN-JS STYLES 🌟
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#8b5cf6', fontSize: '20px', fontWeight: 'bold' },
  card: { backgroundColor: 'white', maxWidth: '400px', margin: '0 auto', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' },
  logoBox: { backgroundColor: '#ede9fe', width: '60px', height: '60px', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 10px', fontSize: '30px' },
  heading: { textAlign: 'center', color: '#1f2937', marginBottom: '20px', marginTop: 0 },
  subText: { color: '#6b7280', fontSize: '14px', textAlign: 'center', margin: '5px 0 20px 0' },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4b5563', marginBottom: '8px', marginTop: '15px' },
  input: { width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '15px', boxSizing: 'border-box', outline: 'none' },
  passwordWrapper: { display: 'flex', alignItems: 'center', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', paddingRight: '15px' },
  passwordInput: { flex: 1, padding: '12px 15px', border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '15px' },
  primaryBtn: { width: '100%', backgroundColor: '#8b5cf6', color: 'white', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', marginTop: '20px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(139, 92, 246, 0.2)' },
  socialBtn: { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '10px', fontWeight: 'bold', color: '#374151', cursor: 'pointer', marginBottom: '10px' },
  divider: { display: 'flex', alignItems: 'center', textAlign: 'center', color: '#9ca3af', fontSize: '11px', fontWeight: 'bold', margin: '20px 0' },
  switchText: { textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '20px' },
  link: { color: '#8b5cf6', fontWeight: 'bold', cursor: 'pointer' },
  backBtn: { color: '#6b7280', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'inline-block', margin: '0 0 15px 0' },
  pillContainer: { display: 'flex', gap: '10px' },
  pill: { flex: 1, textAlign: 'center', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', cursor: 'pointer', backgroundColor: '#f9fafb' },
  pillActive: { borderColor: '#8b5cf6', color: '#8b5cf6', backgroundColor: '#ede9fe' },
  textBtnPrimary: { color: '#8b5cf6', fontWeight: 'bold', cursor: 'pointer', background: 'none', border: 'none', padding: '10px', width: '100%', textAlign: 'center', marginTop: '10px' },
  textBtnError: { color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', background: 'none', border: 'none', padding: '10px', width: '100%', textAlign: 'center', marginTop: '10px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', borderRadius: '15px' },
  iconBtnPrimary: { background: '#ede9fe', color: '#8b5cf6', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  iconBtnError: { background: '#fef2f2', color: '#ef4444', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  emptyState: { textAlign: 'center', marginTop: '50px', padding: '40px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e5e7eb', maxWidth: '500px', margin: '50px auto' },
  uploadBtn: { backgroundColor: '#10b981', color: 'white', padding: '15px 30px', borderRadius: '30px', border: 'none', fontWeight: 'bold', fontSize: '16px', marginTop: '20px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }
};

import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthFormProps {
  onLogin: (user: User) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [isSeller, setIsSeller] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [shopId, setShopId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [step, setStep] = useState<'details' | 'captcha' | 'forgot_email' | 'forgot_token' | 'forgot_reset'>('details');
  const [captchaText, setCaptchaText] = useState('');
  const [userInputCaptcha, setUserInputCaptcha] = useState('');

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [sentResetToken, setSentResetToken] = useState('');
  const [userResetToken, setUserResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const IIT_MANDI_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(students\.)?iitmandi\.ac\.in$/;

  const [suggestions, setSuggestions] = useState({
    length: false,
    upper: false,
    number: false,
    special: false
  });

  useEffect(() => {
    const passToValidate = step === 'forgot_reset' ? newPassword : password;
    setSuggestions({
      length: passToValidate.length >= 8,
      upper: /[A-Z]/.test(passToValidate),
      number: /[0-9]/.test(passToValidate),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(passToValidate)
    });
  }, [password, newPassword, step]);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInputCaptcha('');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const storedUsers = localStorage.getItem('IITM_ONE_USER_REGISTRY');
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Strict Password Lock Check
    if (existing && existing.password && existing.password !== password) {
      setError('SECURITY VIOLATION: Access denied. Identity-password mismatch detected.');
      return;
    }

    if (!suggestions.length || !suggestions.upper || !suggestions.number || !suggestions.special) {
      setError('SECURITY ALERT: Password does not meet institutional complexity standards.');
      return;
    }

    if (isSeller) {
      if (!shopId) {
        setError('CRITICAL: Sector ID required.');
        return;
      }
      performLogin();
    } else {
      if (!IIT_MANDI_EMAIL_REGEX.test(email)) {
        setError('DENIED: Use @students.iitmandi.ac.in or @iitmandi.ac.in only.');
        return;
      }
      generateCaptcha();
      setStep('captcha');
    }
  };

  // Added handleCaptchaVerify function to process captcha submission
  const handleCaptchaVerify = () => {
    if (userInputCaptcha.toUpperCase() === captchaText.toUpperCase()) {
      performLogin();
    } else {
      setError('VERIFICATION FAILURE: Captcha token mismatch.');
      generateCaptcha();
    }
  };

  const performLogin = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const storedUsers = localStorage.getItem('IITM_ONE_USER_REGISTRY');
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
      const role = isSeller ? UserRole.SELLER : UserRole.USER;
      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      const mockUser: User = {
        id: existing?.id || Math.random().toString(36).substr(2, 9),
        name: existing?.name || name || (isSeller ? 'Authorized Seller' : 'Authorized User'),
        email: email.toLowerCase(),
        password: password,
        role: role,
        shopId: isSeller ? shopId : existing?.shopId
      };
      onLogin(mockUser);
    }, 1200);
  };

  const handleForgotEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const storedUsers = localStorage.getItem('IITM_ONE_USER_REGISTRY');
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    const exists = users.find(u => u.email.toLowerCase() === resetEmail.toLowerCase());

    if (!exists) {
      setError('RECOVERY DENIED: Identity not found in registry.');
      return;
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    setSentResetToken(token);
    console.log(`%c[RECOVERY HANDSHAKE] Token: ${token}`, 'color: #f59e0b; font-weight: bold;');
    setStep('forgot_token');
  };

  const handleForgotTokenVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (userResetToken === sentResetToken) {
      setStep('forgot_reset');
      setError('');
    } else {
      setError('RECOVERY ERROR: Invalid bypass token.');
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestions.length || !suggestions.upper || !suggestions.number || !suggestions.special) {
      setError('SECURITY ALERT: New passkey is too weak.');
      return;
    }
    
    const storedUsers = localStorage.getItem('IITM_ONE_USER_REGISTRY');
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    const updatedUsers = users.map(u => u.email.toLowerCase() === resetEmail.toLowerCase() ? { ...u, password: newPassword } : u);
    localStorage.setItem('IITM_ONE_USER_REGISTRY', JSON.stringify(updatedUsers));
    
    setSuccess('PROTOCOL UPDATED. Passkey synchronized.');
    setTimeout(() => {
      setStep('details');
      setSuccess('');
    }, 2000);
  };

  const renderSuggestions = () => (
    <div className="mt-3 p-3 bg-slate-900/80 rounded-lg border border-cyan-900/30">
      <p className="text-[8px] font-bold text-cyan-700 uppercase mb-2 tracking-widest">Strength Matrix:</p>
      <div className="grid grid-cols-2 gap-y-1">
        <span className={`text-[9px] flex items-center gap-2 ${suggestions.length ? 'text-green-500' : 'text-slate-600'}`}>
          <i className={`fas ${suggestions.length ? 'fa-check-circle' : 'fa-circle'}`}></i> 8+ Chars
        </span>
        <span className={`text-[9px] flex items-center gap-2 ${suggestions.upper ? 'text-green-500' : 'text-slate-600'}`}>
          <i className={`fas ${suggestions.upper ? 'fa-check-circle' : 'fa-circle'}`}></i> Caps
        </span>
        <span className={`text-[9px] flex items-center gap-2 ${suggestions.number ? 'text-green-500' : 'text-slate-600'}`}>
          <i className={`fas ${suggestions.number ? 'fa-check-circle' : 'fa-circle'}`}></i> Num
        </span>
        <span className={`text-[9px] flex items-center gap-2 ${suggestions.special ? 'text-green-500' : 'text-slate-600'}`}>
          <i className={`fas ${suggestions.special ? 'fa-check-circle' : 'fa-circle'}`}></i> Symbol
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen sci-fi-grid flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 rounded-3xl relative border-cyan-500/50 shadow-[0_0_50px_rgba(34,211,238,0.15)] overflow-hidden">
        <div className="scanner-line"></div>
        
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-2xl bg-cyan-900/30 border border-cyan-500/30 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <i className={`fas ${isSeller ? 'fa-store' : 'fa-user-shield'} text-4xl text-cyan-400`}></i>
          </div>
          <h2 className="text-3xl font-sci-fi text-white tracking-tighter neon-text-cyan uppercase">IIT MANDI ONE</h2>
          <p className="text-cyan-600 font-bold text-[10px] tracking-[0.3em] uppercase mt-1">Unified Identity Protocol</p>
        </div>

        {step === 'details' && (
          <>
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-cyan-900/50 mb-8">
              <button onClick={() => setIsSeller(false)} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${!isSeller ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'text-slate-500'}`}>User</button>
              <button onClick={() => setIsSeller(true)} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${isSeller ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'text-slate-500'}`}>Seller</button>
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Identity Tag (Username)</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950/50 border border-cyan-900/50 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-500" placeholder="Full Name" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Institutional Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950/50 border border-cyan-900/50 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-500" placeholder="id@students.iitmandi.ac.in" />
              </div>
              {isSeller && (
                <div>
                  <label className="block text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Assigned Sector</label>
                  <select required value={shopId} onChange={(e) => setShopId(e.target.value)} className="w-full bg-slate-950/50 border border-cyan-900/50 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-500">
                    <option value="" disabled>Select Establishment</option>
                    <option value="shop-1">STATIONARY UNIT</option>
                    <option value="shop-2">A2Z ELECTRONICS</option>
                    <option value="shop-3">MANDI SALON</option>
                    <option value="shop-4">LAUNDRY CORE</option>
                  </select>
                </div>
              )}
              <div>
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="block text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em]">Secure Passkey</label>
                  <button type="button" onClick={() => setStep('forgot_email')} className="text-[9px] text-cyan-700 hover:text-cyan-400 font-bold uppercase tracking-widest transition-colors">Forgot?</button>
                </div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950/50 border border-cyan-900/50 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-500" placeholder="••••••••" />
                {password.length > 0 && renderSuggestions()}
              </div>
              {error && <div className="p-3 bg-red-950/30 border border-red-500/50 rounded-lg text-red-400 text-[9px] font-bold uppercase animate-pulse">{error}</div>}
              <button type="submit" disabled={isVerifying} className="w-full py-4 bg-cyan-600 rounded-xl text-white font-sci-fi text-sm uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-3">
                {isVerifying ? <i className="fas fa-sync-alt animate-spin text-lg"></i> : 'Establish Neural Link'}
              </button>
            </form>
          </>
        )}

        {step === 'captcha' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
             <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl text-center">
              <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mb-4">Identity Verification</p>
              <div className="bg-slate-900/80 p-6 rounded-xl border border-cyan-900 mb-4 select-none">
                  <span className="text-3xl font-sci-fi tracking-[0.4em] text-cyan-400 italic line-through decoration-cyan-700/50">{captchaText}</span>
              </div>
              <input type="text" value={userInputCaptcha} onChange={(e) => setUserInputCaptcha(e.target.value)} className="w-full bg-slate-950/80 border border-cyan-900/50 rounded-xl py-3 px-4 text-center text-slate-200 font-sci-fi tracking-widest focus:outline-none transition-all uppercase" placeholder="TOKEN" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep('details')} className="flex-1 py-3 bg-slate-800 text-slate-400 font-bold uppercase text-[10px] rounded-xl">Back</button>
              <button onClick={handleCaptchaVerify} className="flex-[2] py-3 bg-cyan-600 text-white font-sci-fi text-[10px] tracking-widest uppercase rounded-xl shadow-lg">Finalize Access</button>
            </div>
          </div>
        )}

        {step === 'forgot_email' && (
          <form onSubmit={handleForgotEmailSubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
            <h3 className="text-cyan-400 font-sci-fi text-sm uppercase">Recovery Handshake</h3>
            <p className="text-[10px] text-slate-500 uppercase leading-relaxed">Enter your registered email to receive a recovery bypass token.</p>
            <input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full bg-slate-950/50 border border-cyan-900/50 rounded-xl py-3 px-4 text-slate-200 outline-none focus:border-cyan-500" placeholder="id@iitmandi.ac.in" />
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep('details')} className="flex-1 py-3 bg-slate-800 text-slate-400 font-bold uppercase text-[10px] rounded-xl">Cancel</button>
              <button type="submit" className="flex-[2] py-3 bg-cyan-600 text-white font-bold uppercase text-[10px] rounded-xl">Send Token</button>
            </div>
          </form>
        )}

        {step === 'forgot_token' && (
          <form onSubmit={handleForgotTokenVerify} className="space-y-6 animate-in slide-in-from-right duration-300">
            <h3 className="text-cyan-400 font-sci-fi text-sm uppercase">Enter Bypass Token</h3>
            <p className="text-[10px] text-slate-500 uppercase">A 6-digit token has been transmitted (Check console/log).</p>
            <input type="text" required value={userResetToken} onChange={(e) => setUserResetToken(e.target.value)} className="w-full bg-slate-950/50 border border-cyan-900/50 rounded-xl py-3 px-4 text-slate-200 text-center tracking-[1em]" placeholder="000000" />
            <button type="submit" className="w-full py-3 bg-cyan-600 text-white font-bold uppercase text-[10px] rounded-xl">Verify Token</button>
          </form>
        )}

        {step === 'forgot_reset' && (
          <form onSubmit={handlePasswordReset} className="space-y-6 animate-in slide-in-from-right duration-300">
            <h3 className="text-cyan-400 font-sci-fi text-sm uppercase">Synchronize New Passkey</h3>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-950/50 border border-cyan-900/50 rounded-xl py-3 px-4 text-slate-200 outline-none focus:border-cyan-500" placeholder="New Password" />
            {newPassword.length > 0 && renderSuggestions()}
            <button type="submit" className="w-full py-3 bg-purple-600 text-white font-bold uppercase text-[10px] rounded-xl">Reset Neural Key</button>
          </form>
        )}

        {success && <div className="mt-4 p-3 bg-green-950/30 border border-green-500/50 rounded-lg text-green-400 text-[9px] font-bold uppercase text-center">{success}</div>}
      </div>
    </div>
  );
};

export default AuthForm;

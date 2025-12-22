
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
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [step, setStep] = useState<'details' | 'captcha'>('details');
  const [captchaText, setCaptchaText] = useState('');
  const [userInputCaptcha, setUserInputCaptcha] = useState('');
  const [captchaType, setCaptchaType] = useState<'text' | 'audio'>('text');

  const IIT_MANDI_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(students\.)?iitmandi\.ac\.in$/;

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

    if (isSeller) {
      if (!shopId) {
        setError('CRITICAL: Sector ID required for store manager authentication.');
        return;
      }
      performLogin();
    } else {
      if (!IIT_MANDI_EMAIL_REGEX.test(email)) {
        setError('DENIED: Email does not match IIT Mandi directory pattern.');
        return;
      }
      generateCaptcha();
      setStep('captcha');
    }
  };

  const performLogin = () => {
    setIsVerifying(true);
    // Simulation of a database lookup / network request
    setTimeout(() => {
      setIsVerifying(false);
      
      // Attempt to retrieve existing user from registry
      const storedUsers = localStorage.getItem('IITM_ONE_USER_REGISTRY');
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === (isSeller ? UserRole.SELLER : UserRole.STUDENT));

      const mockUser: User = {
        id: existing?.id || Math.random().toString(36).substr(2, 9),
        name: name || existing?.name || (isSeller ? 'Authorized Manager' : 'Student Guest'),
        email: email.toLowerCase(),
        role: isSeller ? UserRole.SELLER : UserRole.STUDENT,
        shopId: isSeller ? shopId : existing?.shopId
      };
      
      onLogin(mockUser);
    }, 1200);
  };

  const handleCaptchaVerify = () => {
    if (userInputCaptcha.toUpperCase() === captchaText.toUpperCase()) {
      performLogin();
    } else {
      setError('CAPTCHA ERROR: Verification token rejected.');
      generateCaptcha();
    }
  };

  return (
    <div className="min-h-screen sci-fi-grid flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 rounded-3xl relative border-cyan-500/50 shadow-[0_0_50px_rgba(34,211,238,0.15)] overflow-hidden">
        <div className="scanner-line"></div>
        
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-2xl bg-cyan-900/30 border border-cyan-500/30 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <i className={`fas ${isSeller ? 'fa-store' : 'fa-user-graduate'} text-4xl text-cyan-400`}></i>
          </div>
          <h2 className="text-3xl font-sci-fi text-white tracking-tighter neon-text-cyan uppercase">IIT MANDI ONE</h2>
          <p className="text-cyan-600 font-bold text-[10px] tracking-[0.3em] uppercase mt-1">
            {step === 'details' ? (isSeller ? 'Persistent Sector Access' : 'Unified Identity Protocol') : 'Finalizing Registry Link'}
          </p>
        </div>

        {step === 'details' ? (
          <>
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-cyan-900/50 mb-8">
              <button onClick={() => { setIsSeller(false); setError(''); }} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${!isSeller ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Student</button>
              <button onClick={() => { setIsSeller(true); setError(''); }} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${isSeller ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Seller</button>
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Identity Tag (Full Name)</label>
                <div className="relative">
                  <i className="fas fa-signature absolute left-4 top-3.5 text-cyan-800"></i>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950/50 border border-cyan-900/50 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500" placeholder="e.g. Adarsh Kumar" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em] mb-1.5 ml-1">{isSeller ? 'Establishment Email' : 'Official Portal Email'}</label>
                <div className="relative">
                  <i className="fas fa-at absolute left-4 top-3.5 text-cyan-800"></i>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950/50 border border-cyan-900/50 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500" placeholder={isSeller ? "merchant@email.com" : "roll@students.iitmandi.ac.in"} />
                </div>
              </div>

              {isSeller && (
                <div>
                  <label className="block text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Assigned Establishment</label>
                  <div className="relative">
                    <i className="fas fa-key absolute left-4 top-3.5 text-cyan-800"></i>
                    <select required value={shopId} onChange={(e) => setShopId(e.target.value)} className="w-full bg-slate-950/50 border border-cyan-900/50 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500 appearance-none">
                      <option value="" disabled>Select your sector</option>
                      <option value="shop-1">STATIONARY UNIT (North)</option>
                      <option value="shop-2">A2Z ELECTRONICS</option>
                      <option value="shop-3">MANDI SALON ELITE</option>
                      <option value="shop-4">TUMBLER LAUNDRY</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-cyan-500 uppercase tracking-[0.2em] mb-1.5 ml-1">Secure Passkey</label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-3.5 text-cyan-800"></i>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950/50 border border-cyan-900/50 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-cyan-500" placeholder="••••••••" />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-950/30 border border-red-500/50 rounded-lg text-red-400 text-[10px] font-bold uppercase animate-pulse">
                  <i className="fas fa-exclamation-circle mr-2"></i>{error}
                </div>
              )}

              <button type="submit" disabled={isVerifying} className="w-full py-4 bg-cyan-600 rounded-xl text-white font-sci-fi text-sm uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-3">
                {isVerifying ? <i className="fas fa-sync-alt animate-spin"></i> : <>{isSeller ? 'Establish Terminal Link' : 'Validate Connection'}<i className="fas fa-arrow-right"></i></>}
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
             <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-2xl text-center">
              <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mb-4">Identity Verification</p>
              <div className="bg-slate-900/80 p-6 rounded-xl border border-cyan-900 select-none mb-4 relative overflow-hidden group">
                  <span className="text-3xl font-sci-fi tracking-[0.4em] text-cyan-400 italic line-through decoration-cyan-700/50">{captchaText}</span>
              </div>
              <input type="text" value={userInputCaptcha} onChange={(e) => setUserInputCaptcha(e.target.value)} className="w-full bg-slate-950/80 border border-cyan-900/50 rounded-xl py-3 px-4 text-center text-slate-200 font-sci-fi tracking-widest focus:outline-none transition-all uppercase" placeholder="TOKEN" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep('details')} className="flex-1 py-3 bg-slate-800 text-slate-400 font-bold uppercase text-xs rounded-xl hover:bg-slate-700">Reset</button>
              <button onClick={handleCaptchaVerify} disabled={isVerifying || userInputCaptcha.length < 4} className="flex-[2] py-3 bg-cyan-600 text-white font-sci-fi text-xs tracking-widest uppercase rounded-xl">Finalize Access</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthForm;

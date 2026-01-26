
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('id');
  const token = searchParams.get('token');
  const { verifyCleanerCode, resendCleanerCode, cleaners } = useAppContext();
  const navigate = useNavigate();
  
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const cleaner = cleaners.find(c => c.id === cleanerId);

  useEffect(() => {
    // If we have a legacy token (like from Express Match), just auto-verify
    if (token && !cleanerId) {
        setStatus('verifying');
        setTimeout(() => setStatus('success'), 1500);
    }
  }, [token, cleanerId]);

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanerId || code.length !== 6) return;

    setStatus('verifying');
    setTimeout(() => {
        const success = verifyCleanerCode(cleanerId, code);
        if (success) {
            setStatus('success');
        } else {
            setStatus('error');
            setErrorMessage('Invalid or expired code. Please check your email or resend a new one.');
        }
    }, 1200);
  };

  const handleResend = () => {
    if (cleanerId) {
        resendCleanerCode(cleanerId);
        alert('A new 6-digit code has been sent to your email.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
       <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center animate-scale-in">
          
          {status === 'success' ? (
              <div className="animate-fade-in">
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 mb-2">Email Verified!</h2>
                 <p className="text-gray-600 mb-8 leading-relaxed">
                    Great! Your account is now active. You can now access your dashboard and complete your professional setup.
                 </p>
                 <button onClick={() => navigate('/dashboard')} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition shadow-lg">
                    Go to Dashboard
                 </button>
              </div>
          ) : (
              <div className="animate-fade-in">
                 <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                 </div>
                 <h2 className="text-2xl font-black text-gray-900 mb-2">Confirm your Email</h2>
                 <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                    We sent a 6-digit verification code to <span className="font-bold text-slate-800">{cleaner?.email || 'your email'}</span>. 
                    Please enter it below to confirm your registration.
                 </p>

                 <form onSubmit={handleSubmitCode} className="space-y-6">
                    <div>
                        <input 
                            required
                            type="text" 
                            maxLength={6}
                            placeholder="000000"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g,''))}
                            className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl text-center text-3xl font-black tracking-widest focus:border-blue-500 outline-none transition"
                        />
                        {status === 'error' && (
                            <p className="text-red-500 text-xs font-bold mt-3">{errorMessage}</p>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={code.length !== 6 || status === 'verifying'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {status === 'verifying' ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Verifying...
                            </>
                        ) : 'Confirm Account'}
                    </button>
                 </form>

                 <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-xs text-gray-400 mb-3">Didn't receive the code?</p>
                    <button 
                        onClick={handleResend}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-4"
                    >
                        Resend verification code
                    </button>
                 </div>
              </div>
          )}
       </div>
    </div>
  );
};

export default VerifyEmail;

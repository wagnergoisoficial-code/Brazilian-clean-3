
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('id');
  const type = searchParams.get('type');
  const leadId = searchParams.get('leadId');
  
  const { verifyCleanerCode, verifyLead, pendingClientCode } = useAppContext();
  const navigate = useNavigate();
  
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setStatus('verifying');

    setTimeout(() => {
      if (type === 'client' && leadId) {
        // Simple mock OTP for client leads
        if (code === '123456' || code === '000000') {
          verifyLead(leadId);
          setStatus('success');
        } else {
          setStatus('error');
        }
      } else if (cleanerId) {
        // Simulating success for verification
        setStatus('success');
      } else {
        setStatus('error');
      }
    }, 1000);
  };

  const handleContinue = () => {
    if (type === 'client' && leadId) {
      navigate(`/lead-status?id=${leadId}`);
    } else {
      navigate(`/setup-business?id=${cleanerId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-12 text-center animate-scale-in">
        {status === 'success' ? (
          <div className="animate-fade-in">
            <div className="w-24 h-24 bg-green-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase">{type === 'client' ? 'Request Verified!' : 'Verified!'}</h2>
            <p className="text-slate-500 mb-10 font-medium">
              {type === 'client' 
                ? 'Your cleaning request has been released to the marketplace.' 
                : 'Your email has been validated. Let\'s set up your business profile.'}
            </p>
            <button onClick={handleContinue} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition">
              Continue &rarr;
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase">{type === 'client' ? 'Enter Code' : 'Verify Email'}</h2>
            <p className="text-slate-500 mb-10 text-sm font-medium">We sent a 6-digit code to your inbox. Use <strong>123456</strong> to proceed in demo mode.</p>
            <form onSubmit={handleSubmitCode} className="space-y-8">
              <input 
                required type="text" maxLength={6} placeholder="------"
                className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-3xl text-center text-5xl font-black tracking-[0.3em] focus:border-blue-600 outline-none shadow-inner"
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g,''))}
              />
              <button disabled={code.length !== 6 || status === 'verifying'} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs disabled:opacity-50 shadow-xl active:scale-95 transition">
                {status === 'verifying' ? 'Verifying...' : 'Confirm Identity'}
              </button>
            </form>
            {status === 'error' && <p className="mt-4 text-red-500 font-bold text-xs">Invalid code. Try 123456.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

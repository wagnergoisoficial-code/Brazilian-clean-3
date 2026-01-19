import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { UserRole } from '../types';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyUserEmail, setUserRole } = useAppContext();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    if (token) {
      // Simulate network delay
      setTimeout(() => {
        const success = verifyUserEmail(token);
        setStatus(success ? 'success' : 'error');
      }, 1500);
    } else {
      setStatus('error');
    }
  }, [token, verifyUserEmail]);

  const handleContinue = () => {
    // If it was a cleaner flow (heuristic), go to dashboard
    // If client, go to home
    // For safety, we default to Home but prompt login
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
       <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          {status === 'verifying' && (
              <div className="py-12">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                 <h2 className="text-xl font-bold text-gray-900">Verifying Email...</h2>
                 <p className="text-gray-500 mt-2">Please wait while we secure your account.</p>
              </div>
          )}

          {status === 'success' && (
              <div className="py-8 animate-fade-in">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                 <p className="text-gray-600 mb-8">Your account has been successfully verified. You now have full access to the platform.</p>
                 <button onClick={handleContinue} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-black transition">
                    Continue to Platform
                 </button>
              </div>
          )}

          {status === 'error' && (
              <div className="py-8 animate-fade-in">
                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                 <p className="text-gray-600 mb-8">This link is invalid or has expired. Please try registering again or contact support.</p>
                 <button onClick={() => navigate('/')} className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-300 transition">
                    Return Home
                 </button>
              </div>
          )}
       </div>
    </div>
  );
};

export default VerifyEmail;
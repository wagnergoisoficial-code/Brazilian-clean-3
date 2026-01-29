import React, { useEffect, useState } from 'react';
import { useAppContext } from './context/AppContext';
import { useNavigate } from 'react-router-dom';

const AUTO_CLOSE_TIME = 10000; // 10 segundos

const MockEmailService: React.FC = () => {
  const { lastEmail, clearLastEmail } = useAppContext();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!lastEmail) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      clearLastEmail();
    }, AUTO_CLOSE_TIME);

    return () => clearTimeout(timer);
  }, [lastEmail, clearLastEmail]);

  if (!lastEmail || !visible) return null;

  const handleAction = () => {
    setVisible(false);
    clearLastEmail();
    navigate(lastEmail.actionLink);
  };

  const handleClose = () => {
    setVisible(false);
    clearLastEmail();
  };

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-in-right ring-1 ring-black/5">
      
      {/* HEADER */}
      <div className="bg-blue-600 px-4 py-3 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="font-bold text-sm">New Email Received</span>
        </div>

        <button
          onClick={handleClose}
          className="text-white/80 hover:text-white"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* BODY */}
      <div className="p-4 space-y-2">

        {/* DEMO BADGE */}
        <div className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
          DEMO MODE – No real email sent
        </div>

        <div className="flex justify-between items-start">
          <h4 className="font-bold text-gray-900 text-sm">
            {lastEmail.subject}
          </h4>
          <span className="text-xs text-gray-400">Now</span>
        </div>

        <p className="text-xs text-gray-500">
          To: {lastEmail.to}
        </p>

        <p className="text-sm text-gray-700 leading-relaxed">
          {lastEmail.body}
        </p>

        <button
          onClick={handleAction}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg text-sm transition shadow-sm"
        >
          {lastEmail.actionText}
        </button>

        <p className="text-[11px] text-gray-400 text-center">
          This is a simulated notification for demonstration purposes.
        </p>
      </div>
    </div>
  );
};

export default MockEmailService;

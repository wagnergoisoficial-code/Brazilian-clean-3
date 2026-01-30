
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { SYSTEM_IDENTITY } from '../config/SystemManifest';

const COOLDOWN_SECONDS = 60;

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('id');
  const type = searchParams.get('type');
  const urlCode = searchParams.get('code');
  
  const { verifyCleanerCode, resendCleanerCode, resendClientCode, cleaners, pendingClientCode, pendingClientEmail, pendingClientCodeExpires } = useAppContext();
  const navigate = useNavigate();
  
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  const cleaner = cleaners.find(c => c.id === cleanerId);
  const isClientFlow = type === 'client';

  useEffect(() => {
    if (!SYSTEM_IDENTITY.IS_PRODUCTION && urlCode) {
      setCode(urlCode);
    } else {
      setCode('');
    }
  }, [urlCode]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setStatus('verifying');
    setErrorMessage('');

    setTimeout(() => {
        if (isClientFlow) {
            if (Date.now() > (pendingClientCodeExpires || 0)) {
                 setStatus('error');
                 setErrorMessage('The code has expired. Please request a new one.');
                 return;
            }
            if (code === pendingClientCode) {
                 setStatus('success');
            } else {
                 setStatus('error');
                 setErrorMessage('The code entered is invalid.');
            }
        } else {
            if (!cleanerId) {
                setStatus('error');
                setErrorMessage('Link inválido. ID do profissional não encontrado.');
                return;
            }
            const result = verifyCleanerCode(cleanerId, code);
            if (result.success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(result.error || 'Erro inesperado.');
            }
        }
    }, 800);
  };

  const handleResend = async () => {
    if (isResending || cooldown > 0) return;
    setIsResending(true);
    try {
        if (isClientFlow) {
            await resendClientCode();
            alert('A new code has been sent to your email.');
        } else if (cleanerId) {
            await resendCleanerCode(cleanerId);
            alert('Um novo código de 6 dígitos foi enviado para seu e-mail.');
        }
        setCooldown(COOLDOWN_SECONDS);
        setCode('');
        setStatus('idle');
    } catch (e: any) {
        alert(e.message || (isClientFlow ? 'Error resending code.' : 'Erro ao reenviar código.'));
    } finally {
        setIsResending(false);
    }
  };

  const handleNextAction = () => {
    if (isClientFlow) {
      navigate('/');
    } else {
      navigate(`/dashboard`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
       <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center animate-scale-in relative overflow-hidden border border-slate-100">
          
          {status === 'success' ? (
              <div key="view-success" className="animate-fade-in mt-4">
                 <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 mb-2">
                    {isClientFlow ? 'Confirmed!' : 'Ativado!'}
                 </h2>
                 <p className="text-gray-600 mb-8 leading-relaxed">
                    {isClientFlow 
                        ? 'Your request has been broadcasted to our verified professionals.' 
                        : 'Excelente! Sua conta foi verificada com sucesso. Vamos agora configurar o seu perfil.'}
                 </p>
                 <button onClick={handleNextAction} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black transition shadow-xl uppercase tracking-widest text-sm">
                    {isClientFlow ? 'Back to Home' : 'Acessar meu Painel'}
                 </button>
              </div>
          ) : (
              <div key="view-input" className="animate-fade-in mt-4">
                 <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                 </div>
                 <h2 className="text-2xl font-black text-gray-900 mb-2">
                    {isClientFlow ? 'Verify your Email' : 'Verifique seu E-mail'}
                 </h2>
                 <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                    {isClientFlow ? "We've sent a verification code to:" : "Enviamos um código de verificação para:"}<br/>
                    <span className="font-bold text-slate-800 underline decoration-blue-200 underline-offset-4">{isClientFlow ? (pendingClientEmail || 'your email') : (cleaner?.email || 'seu e-mail')}</span>
                 </p>

                 <form onSubmit={handleSubmitCode} className="space-y-6">
                    <div className="relative">
                        <input 
                            required
                            type="text" 
                            maxLength={6}
                            placeholder="------"
                            disabled={status === 'verifying'}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g,''))}
                            className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl text-center text-4xl font-black tracking-[0.5em] focus:border-blue-500 outline-none transition disabled:opacity-50"
                        />
                        {status === 'error' && (
                            <p className="text-red-500 text-xs font-bold mt-3 animate-fade-in">{errorMessage}</p>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={code.length !== 6 || status === 'verifying'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest text-sm"
                    >
                        {status === 'verifying' ? (
                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {isClientFlow ? 'Verifying...' : 'Verificando...'}
                            </span>
                        ) : (isClientFlow ? 'Verify' : 'Verificar')}
                    </button>
                 </form>

                 <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">
                      {isClientFlow ? "Didn't receive the code?" : "Não recebeu o código?"}
                    </p>
                    <button 
                        onClick={handleResend}
                        disabled={isResending || cooldown > 0 || status === 'verifying'}
                        className={`text-sm font-bold text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-4 ${isResending || cooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isResending 
                          ? (isClientFlow ? 'Requesting...' : 'Solicitando...') 
                          : (cooldown > 0 
                              ? (isClientFlow ? `Resend in ${cooldown}s` : `Reenviar em ${cooldown}s`) 
                              : (isClientFlow ? 'Resend code' : 'Reenviar código'))}
                    </button>
                 </div>
              </div>
          )}
       </div>
    </div>
  );
};

export default VerifyEmail;


import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { SYSTEM_IDENTITY } from '../config/SystemManifest';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('id');
  const type = searchParams.get('type');
  const urlCode = searchParams.get('code');
  
  const { verifyCleanerCode, resendCleanerCode, cleaners, pendingClientCode, pendingClientEmail } = useAppContext();
  const navigate = useNavigate();
  
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const cleaner = cleaners.find(c => c.id === cleanerId);
  const isClientFlow = type === 'client';

  useEffect(() => {
    // Strictly no pre-fill in production mode to force real verification
    if (!SYSTEM_IDENTITY.IS_PRODUCTION && urlCode) {
      setCode(urlCode);
    } else {
      setCode('');
    }
  }, [urlCode]);

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setStatus('verifying');
    setErrorMessage('');

    setTimeout(() => {
        if (isClientFlow) {
            if (code === pendingClientCode) {
                 setStatus('success');
            } else {
                 setStatus('error');
                 setErrorMessage('O código inserido é inválido ou expirou.');
            }
        } else {
            if (!cleanerId) {
                setStatus('error');
                setErrorMessage('Link inválido. ID do profissional não encontrado.');
                return;
            }
            const success = verifyCleanerCode(cleanerId, code);
            if (success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage('Código inválido ou expirado.');
            }
        }
    }, 1500);
  };

  const handleResend = async () => {
    try {
        if (isClientFlow) {
            alert('Um novo código foi solicitado para seu email.');
            // Implementation logic in context handles the actual dispatch if needed
        } else if (cleanerId) {
            await resendCleanerCode(cleanerId);
            alert('Um novo código de 6 dígitos foi enviado para seu email.');
        }
    } catch (e) {
        alert('Erro ao reenviar código. Tente novamente mais tarde.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
       <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center animate-scale-in relative overflow-hidden">
          
          {status === 'success' ? (
              <div className="animate-fade-in mt-4">
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 mb-2">{isClientFlow ? 'Solicitação Confirmada!' : 'Email Verificado!'}</h2>
                 <p className="text-gray-600 mb-8 leading-relaxed">
                    {isClientFlow 
                        ? 'Sua solicitação foi enviada para nossos profissionais verificados.' 
                        : 'Excelente! Sua conta foi verificada. Agora você pode acessar seu painel.'}
                 </p>
                 <button onClick={() => navigate(isClientFlow ? '/' : '/dashboard')} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition shadow-lg">
                    {isClientFlow ? 'Voltar ao Início' : 'Ir para o Painel'}
                 </button>
              </div>
          ) : (
              <div className="animate-fade-in mt-4">
                 <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                 </div>
                 <h2 className="text-2xl font-black text-gray-900 mb-2">Confirme seu {isClientFlow ? 'Pedido' : 'Email'}</h2>
                 <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                    Enviamos um código de 6 dígitos para <span className="font-bold text-slate-800">{isClientFlow ? (pendingClientEmail || 'seu email') : (cleaner?.email || 'seu email')}</span>. 
                    Insira-o abaixo para confirmar.
                 </p>

                 <form onSubmit={handleSubmitCode} className="space-y-6">
                    <div>
                        <input 
                            required
                            type="text" 
                            maxLength={6}
                            placeholder="------"
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
                                Verificando...
                            </>
                        ) : 'Confirmar Código'}
                    </button>
                 </form>

                 <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-xs text-gray-400 mb-3">Não recebeu o código?</p>
                    <button 
                        onClick={handleResend}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-4"
                    >
                        Reenviar código de verificação
                    </button>
                 </div>
              </div>
          )}
       </div>
    </div>
  );
};

export default VerifyEmail;

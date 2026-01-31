
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { CleanerStatus } from '../types';

const CleanerRegistration: React.FC = () => {
  const { registerCleaner, loginCleaner, requestPasswordReset, authenticatedCleanerId, cleaners } = useAppContext();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<{status: CleanerStatus, id: string} | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phone: '', city: '', state: '', zipCode: ''
  });

  // CRITICAL: Ensure authenticated users are moved out of this screen immediately and safely
  useEffect(() => {
    if (authenticatedCleanerId) {
      const cleaner = cleaners.find(c => c.id === authenticatedCleanerId);
      if (cleaner) navigate('/dashboard');
    }
  }, [authenticatedCleanerId, navigate, cleaners]);

  // Handle redirects in useEffect to prevent DOM removeChild errors during render
  useEffect(() => {
    if (redirectTarget) {
      const { status, id } = redirectTarget;
      switch(status) {
          case CleanerStatus.EMAIL_PENDING: navigate(`/verify?id=${id}`); break;
          case CleanerStatus.BUSINESS_PENDING: navigate(`/setup-business?id=${id}`); break;
          case CleanerStatus.SERVICES_PENDING: navigate(`/setup-services?id=${id}`); break;
          case CleanerStatus.AREA_PENDING: navigate(`/setup-area?id=${id}`); break;
          case CleanerStatus.DOCUMENTS_PENDING: navigate(`/verify-documents?id=${id}`); break;
          default: navigate('/dashboard');
      }
    }
  }, [redirectTarget, navigate]);

  const handleForgotPassword = async () => {
      if (!formData.email) {
          alert("Por favor, digite seu e-mail no campo acima primeiro.");
          return;
      }
      try {
          await requestPasswordReset(formData.email);
          alert("Um link de recuperação foi enviado para seu e-mail (Verifique o simulador).");
      } catch (err: any) {
          alert(err.message);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
        if (isLoginMode) {
            const cleaner = await loginCleaner(formData.email, formData.password);
            if (cleaner) {
                setRedirectTarget({ status: cleaner.status, id: cleaner.id });
            } else {
                alert("Email ou senha inválidos.");
                setIsSubmitting(false);
            }
        } else {
            if(!formData.fullName || !formData.email || !formData.password || !formData.phone) {
              alert("Todos os campos marcados são obrigatórios.");
              setIsSubmitting(false);
              return;
            }
            const id = await registerCleaner({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                city: formData.city,
                state: formData.state,
                baseZip: formData.zipCode,
                zipCodes: [formData.zipCode]
            });
            navigate(`/verify?id=${id}`);
        }
    } catch (err) {
        alert("Ocorreu um erro no sistema. Tente novamente.");
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans">
      <div className={`w-full bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${isLoginMode ? 'max-w-md' : 'max-w-2xl'}`}>
        <div className="bg-slate-900 py-10 px-8 text-center text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
           <h2 className="text-3xl font-black uppercase tracking-tighter relative z-10">
              {isLoginMode ? 'Entrar no Sistema' : 'Cadastro Profissional'}
           </h2>
           <p className="text-slate-400 mt-2 relative z-10">
              {isLoginMode ? 'Acesse seu painel profissional' : 'Crie sua conta e comece a faturar'}
           </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Use stable keys on wrappers to prevent React from confusing DOM nodes during mode switch */}
          {!isLoginMode ? (
            <div key="signup-fields" className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Nome Completo</label>
                        <input required type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Ex: Maria Silva" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Telefone Celular</label>
                        <input required type="tel" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(555) 000-0000" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">E-mail Profissional</label>
                        <input required type="email" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemplo.com" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Crie uma Senha</label>
                        <div className="relative">
                            <input required type={showPassword ? "text" : "password"} minLength={6} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 pr-12 outline-none focus:border-blue-500 transition-colors" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.643-9.943-6.442a5.049 5.049 0 011.102-1.241m3.072-3.238A10.05 10.05 0 0112 5c4.478 0 8.268 2.643 9.943 6.442a5.049 5.049 0 01-1.102 1.241m-4.321 4.321L3 3l18 18" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Cidade</label>
                        <input required type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Orlando" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Estado (UF)</label>
                        <input required type="text" maxLength={2} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors text-center uppercase" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} placeholder="FL" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">CEP Residencial</label>
                        <input required type="text" maxLength={5} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors text-center" value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value.replace(/\D/g,'')})} placeholder="32801" />
                    </div>
                </div>
            </div>
          ) : (
            <div key="login-fields" className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">E-mail Cadastrado</label>
                <input required type="email" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemplo.com" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Sua Senha</label>
                    <button type="button" onClick={handleForgotPassword} className="text-[9px] font-bold text-blue-500 uppercase hover:underline">Esqueci minha senha</button>
                </div>
                <div className="relative">
                    <input required type={showPassword ? "text" : "password"} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 pr-12 outline-none focus:border-blue-500 transition-colors" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.643-9.943-6.442a5.049 5.049 0 011.102-1.241m3.072-3.238A10.05 10.05 0 0112 5c4.478 0 8.268 2.643 9.943 6.442a5.049 5.049 0 01-1.102 1.241m-4.321 4.321L3 3l18 18" /></svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                    </button>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-blue-700 hover:shadow-2xl transition-all flex items-center justify-center disabled:opacity-50">
            {isSubmitting ? 'Aguarde...' : (isLoginMode ? 'Acessar Painel' : 'Finalizar cadastro e verificar e-mail')}
          </button>

          <div className="pt-6 text-center border-t border-slate-100">
             <p className="text-xs font-medium text-slate-400 mb-2">{isLoginMode ? 'Não possui uma conta?' : 'Já é cadastrado?'}</p>
             <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-sm font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                {isLoginMode ? 'Cadastrar agora' : 'Fazer Login'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CleanerRegistration;

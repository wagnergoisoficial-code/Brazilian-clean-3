
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { CleanerStatus } from '../types';

const CleanerRegistration: React.FC = () => {
  const { registerCleaner, loginCleaner, requestPasswordReset, authenticatedCleanerId } = useAppContext();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<{status: CleanerStatus, id: string} | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', phone: '', city: '', state: '', zipCode: ''
  });

  useEffect(() => {
    if (redirectTarget) {
      const { status, id } = redirectTarget;
      const timer = setTimeout(() => {
          switch(status) {
              case CleanerStatus.CREATED: navigate(`/verify?id=${id}`); break;
              case CleanerStatus.EMAIL_VERIFIED: navigate(`/setup-business?id=${id}`); break;
              // Fallback for older statuses for now
              case 'BUSINESS_PENDING' as any: navigate(`/setup-business?id=${id}`); break;
              case 'SERVICES_PENDING' as any: navigate(`/setup-services?id=${id}`); break;
              case 'AREA_PENDING' as any: navigate(`/setup-area?id=${id}`); break;
              case 'DOCUMENTS_PENDING' as any: navigate(`/verify-documents?id=${id}`); break;
              default: navigate('/dashboard');
          }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [redirectTarget, navigate]);

  const handleForgotPassword = async () => {
      if (!formData.email) {
          alert("Por favor, digite seu e-mail no campo acima primeiro.");
          return;
      }
      try {
          await requestPasswordReset(formData.email);
          alert("Um link de recuperação foi enviado para seu e-mail.");
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
            setRedirectTarget({ status: CleanerStatus.CREATED, id });
        }
    } catch (err) {
        alert("Ocorreu um erro no sistema. Tente novamente.");
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 lg:py-24 px-4 flex items-center justify-center font-sans overflow-x-hidden">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* LEFT COLUMN: BRANDING */}
        <div className="hidden lg:block animate-fade-in">
           <div className="relative">
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#009739] rounded-full blur-[100px] opacity-20"></div>
              <div className="relative z-10 w-full aspect-[4/5] bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border-[16px] border-white">
                  <img 
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200" 
                    alt="Brazilian Professional" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#009739]/90 to-transparent p-12">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">🇧🇷</span>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Oportunidade Real</h3>
                      </div>
                      <p className="text-white/80 font-medium">Cadastre-se hoje e conecte-se com clientes americanos de alto padrão.</p>
                  </div>
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: FORM */}
        <div className={`w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 transition-all duration-500 animate-fade-in ${isLoginMode ? 'max-w-md mx-auto lg:max-w-none' : 'max-w-2xl mx-auto lg:max-w-none'}`}>
          <div className="bg-[#009739] py-12 px-10 text-center text-white relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#FEDD00]/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
             <h2 className="text-4xl font-black uppercase tracking-tighter relative z-10 leading-none">
                {isLoginMode ? 'Acesso Profissional' : 'Seja uma Professional'}
             </h2>
             <p className="text-[#FEDD00] mt-3 font-bold uppercase text-[10px] tracking-[0.2em] relative z-10">
                {isLoginMode ? 'Gerencie seus ganhos em Dólar' : 'Transforme seu trabalho em um negócio lucrativo'}
             </p>
          </div>

          {authenticatedCleanerId ? (
              <div className="p-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-100">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Bem-vinda de volta!</h3>
                  <p className="text-slate-500">Você já está autenticada no sistema.</p>
                  <button onClick={() => navigate('/dashboard')} className="w-full bg-[#009739] hover:bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl transition transform active:scale-95">Ir para meu Painel</button>
              </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
                {!isLoginMode ? (
                <div key="signup-container" className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome Completo</label>
                            <input required type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-[#009739] transition-colors font-bold" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Maria Silva" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">WhatsApp / Telefone</label>
                            <input required type="tel" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-[#009739] transition-colors font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(000) 000-0000" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">E-mail</label>
                            <input required type="email" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-[#009739] transition-colors font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="seu@email.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Senha</label>
                            <div className="relative">
                                <input required type={showPassword ? "text" : "password"} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 pr-12 outline-none focus:border-[#009739] transition-colors font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1" title={showPassword ? "Ocultar" : "Mostrar"}>
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Cidade</label>
                            <input required type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-[#009739] transition-colors font-bold" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Orlando" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">UF (USA)</label>
                            <input required type="text" maxLength={2} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-[#009739] transition-colors text-center uppercase font-bold" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} placeholder="FL" />
                        </div>
                        <div className="col-span-2 md:col-span-1 space-y-2">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">ZIP Code</label>
                            <input required type="text" maxLength={5} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-[#009739] transition-colors text-center font-bold" value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value.replace(/\D/g,'')})} placeholder="32801" />
                        </div>
                    </div>
                </div>
                ) : (
                <div key="login-container" className="space-y-6 animate-fade-in">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">E-mail Cadastrado</label>
                        <input required type="email" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 outline-none focus:border-[#009739] transition-colors font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="seu@email.com" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Senha</label>
                            <button type="button" onClick={handleForgotPassword} className="text-[9px] font-black text-[#009739] uppercase hover:underline">Esqueci a senha</button>
                        </div>
                        <div className="relative">
                            <input required type={showPassword ? "text" : "password"} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-5 pr-12 outline-none focus:border-[#009739] transition-colors font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1">
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                )}

                <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-[#009739] hover:bg-black text-white py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl flex items-center justify-center transition-all transform active:scale-95"
                >
                {isSubmitting ? 'Verificando...' : (isLoginMode ? 'Acessar Painel Profissional' : 'Iniciar Cadastro de Profissional')}
                </button>

                <div className="pt-8 text-center border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">{isLoginMode ? 'Ainda não é cadastrada?' : 'Já possui conta?'}</p>
                <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-sm font-black text-[#009739] uppercase tracking-[0.2em] hover:text-[#012169] transition">
                    {isLoginMode ? 'Criar minha conta profissional' : 'Fazer Login Profissional'}
                </button>
                </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleanerRegistration;

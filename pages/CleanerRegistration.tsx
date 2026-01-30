
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { CleanerStatus } from '../types';

const CleanerRegistration: React.FC = () => {
  const { registerCleaner, loginCleaner } = useAppContext();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const handleRedirect = (status: CleanerStatus, id: string) => {
      switch(status) {
          case CleanerStatus.EMAIL_PENDING: navigate(`/verify?id=${id}`); break;
          case CleanerStatus.BUSINESS_PENDING: navigate(`/setup-business?id=${id}`); break;
          case CleanerStatus.SERVICES_PENDING: navigate(`/setup-services?id=${id}`); break;
          case CleanerStatus.AREA_PENDING: navigate(`/setup-area?id=${id}`); break;
          case CleanerStatus.DOCUMENTS_PENDING: navigate(`/verify-documents?id=${id}`); break;
          default: navigate('/dashboard');
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
        if (isLoginMode) {
            const cleaner = await loginCleaner(formData.email, formData.password);
            if (cleaner) {
                handleRedirect(cleaner.status, cleaner.id);
            } else {
                alert("Email ou senha inválidos.");
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
                zipCodes: [formData.zipCode]
            });
            navigate(`/verify?id=${id}`);
        }
    } catch (err) {
        alert("Ocorreu um erro no sistema. Tente novamente.");
    } finally {
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
          {!isLoginMode ? (
            <div className="space-y-6 animate-fade-in">
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
                        <input required type="password" minLength={6} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
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
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">E-mail Cadastrado</label>
                <input required type="email" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemplo.com" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Sua Senha</label>
                    <button type="button" className="text-[9px] font-bold text-blue-500 uppercase">Esqueci minha senha</button>
                </div>
                <input required type="password" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
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

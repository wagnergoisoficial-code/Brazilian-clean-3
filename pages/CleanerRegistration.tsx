
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const CleanerRegistration: React.FC = () => {
  const { registerCleaner, cleaners, resendCleanerCode } = useAppContext();
  const navigate = useNavigate();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
        if (isLoginMode) {
            const existingCleaner = cleaners.find(c => c.email.toLowerCase() === formData.email.toLowerCase());
            if (existingCleaner) {
                await resendCleanerCode(existingCleaner.id);
                navigate(`/verify?id=${existingCleaner.id}`);
            } else {
                alert("E-mail não encontrado. Por favor, cadastre-se primeiro.");
            }
        } else {
            if(!formData.fullName || !formData.email) {
              alert("Nome e e-mail são obrigatórios.");
              setIsSubmitting(false);
              return;
            }
            const id = await registerCleaner(formData.fullName, formData.email);
            navigate(`/verify?id=${id}`);
        }
    } catch (err) {
        alert("Ocorreu um erro. Tente novamente.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-slate-900 py-12 px-8 text-center text-white">
           <h2 className="text-3xl font-black uppercase tracking-tighter">
              {isLoginMode ? 'Acessar Painel' : 'Cadastro de Profissional'}
           </h2>
           <p className="text-slate-400 mt-2">
              {isLoginMode ? 'Insira seu e-mail para receber o código' : 'Comece agora com apenas nome e e-mail'}
           </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {!isLoginMode && (
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Nome Completo</label>
              <input required type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Ex: Maria Silva" />
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2">E-mail Profissional</label>
            <input required type="email" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemplo.com" />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl flex items-center justify-center disabled:opacity-50 transition-all">
            {isSubmitting ? 'Processando...' : (isLoginMode ? 'Receber Código' : 'Criar Perfil')}
          </button>

          <div className="pt-6 text-center border-t border-slate-100">
             <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-xs font-bold text-slate-400 hover:text-blue-600">
                {isLoginMode ? 'Novo aqui? Criar conta' : 'Já tem conta? Entrar'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CleanerRegistration;

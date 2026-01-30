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
    phone: '',
    email: '',
    city: '',
    state: '',
    zipCodes: ''
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
            if(!formData.fullName || !formData.phone || !formData.email || !formData.city || !formData.state || !formData.zipCodes) {
              alert("Todos os campos são obrigatórios.");
              setIsSubmitting(false);
              return;
            }
            const id = await registerCleaner({
                ...formData,
                zipCodes: [formData.zipCodes],
                joinedDate: new Date().toISOString(),
                isCompany: false
            });
            navigate(`/verify?id=${id}`);
        }
    } catch (err) {
        alert("Ocorreu um erro. Tente novamente mais tarde.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-slate-900 py-12 px-8 text-center text-white relative">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
           </div>
           <h2 className="text-3xl font-black uppercase tracking-tighter relative z-10">
              {isLoginMode ? 'Acessar Painel' : 'Cadastro de House Cleaner'}
           </h2>
           <p className="text-slate-400 mt-2 relative z-10">
              {isLoginMode ? 'Entre com seu e-mail cadastrado' : 'Junte-se à maior rede de limpeza brasileira'}
           </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {!isLoginMode && (
            <>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Nome Completo</label>
                <input 
                    required 
                    type="text" 
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" 
                    value={formData.fullName} 
                    onChange={e => setFormData({...formData, fullName: e.target.value})} 
                    placeholder="Ex: Maria Silva" 
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Telefone (Celular)</label>
                <input 
                    required 
                    type="tel" 
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="(555) 000-0000" 
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2">E-mail</label>
            <input 
                required 
                type="email" 
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="email@exemplo.com" 
            />
          </div>

          {!isLoginMode && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">Cidade</label>
                  <input 
                      required 
                      type="text" 
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" 
                      value={formData.city} 
                      onChange={e => setFormData({...formData, city: e.target.value})} 
                      placeholder="Ex: Orlando" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">Estado</label>
                  <input 
                      required 
                      type="text" 
                      maxLength={2}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" 
                      value={formData.state} 
                      onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} 
                      placeholder="FL" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">CEP (ZIP Code)</label>
                <input 
                    required 
                    type="text" 
                    maxLength={5}
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" 
                    value={formData.zipCodes} 
                    onChange={e => setFormData({...formData, zipCodes: e.target.value.replace(/\D/g,'')})} 
                    placeholder="32801" 
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl flex items-center justify-center disabled:opacity-50 transition-all transform active:scale-95"
          >
            {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : isLoginMode ? 'Solicitar Código de Acesso' : 'Finalizar cadastro e verificar e-mail'}
          </button>

          <div className="pt-6 text-center border-t border-slate-100">
             <button 
                type="button" 
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
             >
                {isLoginMode ? 'Novo aqui? Criar conta' : 'Já tem conta? Acessar Painel'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CleanerRegistration;
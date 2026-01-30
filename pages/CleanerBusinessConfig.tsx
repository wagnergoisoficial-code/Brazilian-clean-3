
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus } from '../types';

const CleanerBusinessConfig: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('id');
  const { cleaners, updateCleanerProfile } = useAppContext();
  const navigate = useNavigate();

  const myProfile = cleaners.find(c => c.id === cleanerId);

  const [formData, setFormData] = useState({
    companyName: '',
    isCompany: false, 
    yearsExperience: 2,
    city: '',
    state: ''
  });

  useEffect(() => {
    if (myProfile) {
        setFormData(prev => ({
            ...prev,
            companyName: myProfile.companyName || '',
            isCompany: myProfile.isCompany || false,
            yearsExperience: myProfile.yearsExperience || 2,
            city: myProfile.city || '',
            state: myProfile.state || ''
        }));
    } else {
        navigate('/join');
    }
  }, [myProfile, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanerId) return;

    if (!formData.companyName && formData.isCompany) {
        alert("Por favor, insira o nome da sua empresa.");
        return;
    }

    updateCleanerProfile(cleanerId, {
        companyName: formData.companyName || myProfile?.fullName || '',
        isCompany: formData.isCompany,
        yearsExperience: formData.yearsExperience,
        city: formData.city,
        state: formData.state,
        status: CleanerStatus.SERVICES_PENDING 
    });

    navigate(`/setup-services?id=${cleanerId}`);
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="bg-slate-900 p-10 text-center text-white">
           <div className="flex justify-center mb-4">
               <div className="w-12 h-1 bg-green-500 rounded-full"></div>
               <div className="w-12 h-1 bg-green-500 mx-2 rounded-full"></div>
               <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
           </div>
           <h2 className="text-3xl font-black uppercase tracking-tighter">Perfil Profissional</h2>
           <p className="text-slate-400 mt-2">Diga-nos como você opera para conectarmos aos clientes certos.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <label className="block text-xs font-black uppercase text-slate-400">Tipo de Atuação</label>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        type="button" 
                        onClick={() => setFormData({...formData, isCompany: false})}
                        className={`py-4 rounded-2xl font-bold border-2 transition ${!formData.isCompany ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-50 hover:border-slate-200'}`}
                    >
                        Individual
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setFormData({...formData, isCompany: true})}
                        className={`py-4 rounded-2xl font-bold border-2 transition ${formData.isCompany ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-50 hover:border-slate-200'}`}
                    >
                        Empresa (LLC)
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-xs font-black uppercase text-slate-400">Anos de Experiência</label>
                <input 
                    type="number" 
                    min="0" 
                    max="50"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors font-bold"
                    value={formData.yearsExperience}
                    onChange={e => setFormData({...formData, yearsExperience: parseInt(e.target.value) || 0})}
                />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-black uppercase text-slate-400">
                {formData.isCompany ? 'Nome da Empresa' : 'Nome Profissional (Como aparecerá para o cliente)'}
            </label>
            <input 
                required 
                type="text" 
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors"
                value={formData.companyName}
                onChange={e => setFormData({...formData, companyName: e.target.value})}
                placeholder={formData.isCompany ? "Ex: Clean & Bright LLC" : "Ex: Maria's Professional Cleaning"}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <label className="block text-xs font-black uppercase text-slate-400">Cidade e Estado</label>
                <div className="flex gap-2">
                    <input required type="text" placeholder="Cidade" className="w-3/4 bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                    <input required type="text" maxLength={2} placeholder="FL" className="w-1/4 bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors text-center uppercase" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} />
                </div>
             </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition transform active:scale-95"
          >
            Próximo Passo
          </button>
        </form>
      </div>
    </div>
  );
};

export default CleanerBusinessConfig;

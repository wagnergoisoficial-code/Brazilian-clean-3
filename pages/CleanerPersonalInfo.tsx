
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const CleanerPersonalInfo: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('id');
  const { cleaners, updateCleanerProfile } = useAppContext();
  const navigate = useNavigate();
  const myProfile = cleaners.find(c => c.id === cleanerId);

  const [formData, setFormData] = useState({
    phone: '',
    city: '',
    state: '',
    zipCode: ''
  });

  useEffect(() => {
    if (myProfile) {
        setFormData({
            phone: myProfile.phone || '',
            city: myProfile.city || '',
            state: myProfile.state || '',
            zipCode: myProfile.zipCodes?.[0] || ''
        });
    } else { navigate('/join'); }
  }, [myProfile, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanerId) return;

    updateCleanerProfile(cleanerId, {
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        zipCodes: [formData.zipCode]
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="bg-slate-900 py-12 px-8 text-center text-white">
           <h2 className="text-3xl font-black uppercase tracking-tighter">Informações Pessoais</h2>
           <p className="text-slate-400 mt-2">Como podemos te contatar?</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <label className="block text-xs font-black uppercase text-slate-400">Telefone Celular</label>
            <input required type="tel" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(555) 000-0000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
                <label className="block text-xs font-black uppercase text-slate-400">Cidade</label>
                <input required type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>
            <div className="space-y-4">
                <label className="block text-xs font-black uppercase text-slate-400">Estado</label>
                <input required type="text" maxLength={2} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition text-center uppercase" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} />
            </div>
          </div>
          <div className="space-y-4">
            <label className="block text-xs font-black uppercase text-slate-400">ZIP Code Residencial</label>
            <input required type="text" maxLength={5} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition" value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl">Salvar e Continuar</button>
        </form>
      </div>
    </div>
  );
};
export default CleanerPersonalInfo;

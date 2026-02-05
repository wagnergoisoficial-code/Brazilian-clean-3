
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const CleanerBusinessConfig: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('id');
  const { cleaners, updateCleanerProfile } = useAppContext();
  const navigate = useNavigate();

  const myProfile = cleaners.find(c => c.id === cleanerId);

  const [formData, setFormData] = useState({
    companyName: '',
    isCompany: false, 
    ein: '',
    address: '',
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
            ein: myProfile.ein || '',
            address: myProfile.address || '',
            yearsExperience: myProfile.yearsExperience || 2,
            city: myProfile.city || '',
            state: myProfile.state || ''
        }));
    } else {
        navigate('/professional');
    }
  }, [myProfile, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanerId) return;

    if (!formData.companyName) {
        alert("Por favor, insira o nome da sua empresa ou seu nome profissional.");
        return;
    }

    if (!formData.address) {
        alert("O endereço comercial/residencial é obrigatório.");
        return;
    }

    if (formData.isCompany && (!formData.ein || formData.ein.length < 9)) {
        alert("Para LLCs, um número EIN válido é obrigatório.");
        return;
    }

    updateCleanerProfile(cleanerId, {
        companyName: formData.companyName,
        isCompany: formData.isCompany,
        ein: formData.isCompany ? formData.ein : undefined,
        address: formData.address,
        yearsExperience: formData.yearsExperience,
        city: formData.city,
        state: formData.state
    });

    navigate(`/setup-services?id=${cleanerId}`);
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="bg-slate-900 p-10 text-center text-white">
           <div className="flex justify-center mb-4">
               <div className="w-12 h-1 bg-green-500 rounded-full"></div>
               <div className="w-12 h-1 bg-green-500 mx-2 rounded-full"></div>
               <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
               <div className="w-12 h-1 bg-slate-700 mx-2 rounded-full"></div>
           </div>
           <h2 className="text-3xl font-black uppercase tracking-tighter">Dados Comerciais</h2>
           <p className="text-slate-400 mt-2">Formalize seu cadastro para operarmos com segurança.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          
          <div className="space-y-4">
              <label className="block text-xs font-black uppercase text-slate-400 tracking-widest">Tipo de Operação</label>
              <div className="grid grid-cols-2 gap-4">
                  <button 
                      type="button" 
                      onClick={() => setFormData({...formData, isCompany: false})}
                      className={`py-6 rounded-2xl font-bold border-2 transition flex flex-col items-center justify-center gap-2 ${!formData.isCompany ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-50 hover:border-slate-200'}`}
                  >
                      <span className="text-2xl">👤</span>
                      <span>Individual</span>
                  </button>
                  <button 
                      type="button" 
                      onClick={() => setFormData({...formData, isCompany: true})}
                      className={`py-6 rounded-2xl font-bold border-2 transition flex flex-col items-center justify-center gap-2 ${formData.isCompany ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-50 hover:border-slate-200'}`}
                  >
                      <span className="text-2xl">🏢</span>
                      <span>Empresa (LLC)</span>
                  </button>
              </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl space-y-6 border border-slate-100">
             <div className="flex items-center gap-2 mb-2">
                 <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    {formData.isCompany ? 'Dados da Empresa (LLC)' : 'Dados Profissionais'}
                 </h3>
             </div>

             <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {formData.isCompany ? 'Razão Social (Legal Name)' : 'Nome Fantasia / Business Name'}
                </label>
                <input 
                    required 
                    type="text" 
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors font-bold"
                    value={formData.companyName}
                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                    placeholder={formData.isCompany ? "Ex: Silva Cleaning Services LLC" : "Ex: Maria Cleaning"}
                />
             </div>

             {formData.isCompany && (
                 <div className="space-y-4 animate-fade-in">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">EIN (Employer Identification Number)</label>
                    <input 
                        required={formData.isCompany}
                        type="text" 
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors font-mono tracking-widest"
                        value={formData.ein}
                        onChange={e => setFormData({...formData, ein: e.target.value})}
                        placeholder="00-0000000"
                    />
                 </div>
             )}

             <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    {formData.isCompany ? 'Endereço Comercial Completo' : 'Endereço Residencial/Comercial'}
                </label>
                <input 
                    required 
                    type="text" 
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="123 Main St, Apt 4B"
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Cidade</label>
                    <input required type="text" className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado</label>
                    <input required type="text" maxLength={2} className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors text-center uppercase" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} placeholder="FL" />
                </div>
             </div>
          </div>

          <div className="space-y-4">
              <label className="block text-xs font-black uppercase text-slate-400 tracking-widest">Anos de Experiência</label>
              <input 
                  type="number" 
                  min="0" 
                  max="50"
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition-colors font-bold"
                  value={formData.yearsExperience}
                  onChange={e => setFormData({...formData, yearsExperience: parseInt(e.target.value) || 0})}
              />
          </div>

          <button 
            type="submit" 
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition transform active:scale-95 flex items-center justify-center gap-3"
          >
            Salvar e Configurar Serviços
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CleanerBusinessConfig;

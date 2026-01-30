
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus, CleanerLevel, CleanerProfile } from '../types';
import { useNavigate } from 'react-router-dom';

const LevelBadge: React.FC<{ level: CleanerLevel; size?: 'sm' | 'lg' }> = ({ level, size = 'sm' }) => {
    const styles = {
        [CleanerLevel.BRONZE]: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Bronze' },
        [CleanerLevel.SILVER]: { bg: 'bg-slate-50', text: 'text-slate-700', label: 'Silver' },
        [CleanerLevel.GOLD]: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Gold' }
    };
    const style = styles[level];
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text}`}>
            {style.label}
        </span>
    );
};

const SERVICES_LIST = [
  { key: 'residential_cleaning', label: 'Residencial', icon: '🏠' },
  { key: 'recurring_cleaning_weekly', label: 'Semanal', icon: '📅' },
  { key: 'recurring_cleaning_biweekly', label: 'Quinzenal', icon: '🔄' },
  { key: 'recurring_cleaning_monthly', label: 'Mensal', icon: '🗓️' },
  { key: 'deep_cleaning', label: 'Deep Clean', icon: '🧽' },
  { key: 'move_in_out', label: 'Mudança', icon: '📦' },
  { key: 'office_cleaning', label: 'Escritório', icon: '🏢' },
  { key: 'commercial_cleaning', label: 'Comercial', icon: '🏪' },
  { key: 'window_cleaning', label: 'Janelas', icon: '🪟' },
  { key: 'oven_cleaning', label: 'Forno', icon: '🍳' },
  { key: 'refrigerator_cleaning', label: 'Geladeira', icon: '❄️' },
  { key: 'carpet_cleaning', label: 'Tapetes', icon: '🧹' },
  { key: 'sofa_cleaning', label: 'Sofá', icon: '🛋️' },
  { key: 'deck_cleaning', label: 'Deck', icon: '🪵' },
  { key: 'laundry_ironing', label: 'Roupa', icon: '🧺' },
  { key: 'mommy_helper', label: 'Mommy Helper', icon: '👶' },
  { key: 'elder_care', label: 'Idosos', icon: '👵' },
  { key: 'pet_care', label: 'Pets', icon: '🐕' },
  { key: 'express_cleaning', label: 'Expressa', icon: '⚡' },
  { key: 'organization_service', label: 'Organização', icon: '🗂️' },
  { key: 'babysitting', label: 'Babysitting', icon: '🍼' }
];

type DashboardTab = 'overview' | 'profile' | 'services' | 'gallery' | 'leads' | 'reviews' | 'settings' | 'documents' | 'area';

const CleanerDashboard: React.FC = () => {
  const { cleaners, authenticatedCleanerId, logout, updateCleanerProfile, leads } = useAppContext();
  const navigate = useNavigate();
  const myProfile = cleaners.find(c => c.id === authenticatedCleanerId);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [editData, setEditData] = useState<Partial<CleanerProfile>>({});

  useEffect(() => {
    if (!authenticatedCleanerId) navigate('/join');
    if (myProfile) {
        setEditData({
            fullName: myProfile.fullName,
            companyName: myProfile.companyName,
            description: myProfile.description,
            yearsExperience: myProfile.yearsExperience,
            isCompany: myProfile.isCompany,
            city: myProfile.city,
            state: myProfile.state,
            baseZip: myProfile.baseZip,
            serviceRadius: myProfile.serviceRadius,
            zipCodes: myProfile.zipCodes,
            phone: myProfile.phone,
            photoUrl: myProfile.photoUrl,
            services: myProfile.services || [],
            isListed: myProfile.isListed
        });
    }
  }, [authenticatedCleanerId, navigate, myProfile]);

  if (!myProfile) return null;

  const isVerified = myProfile.status === CleanerStatus.VERIFIED;
  const isUnderReview = myProfile.status === CleanerStatus.UNDER_REVIEW;
  
  const handleUpdate = () => {
      setSaveStatus('saving');
      updateCleanerProfile(myProfile.id, editData);
      setTimeout(() => setSaveStatus('saved'), 600);
      setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'gallery') => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = () => {
              if (field === 'photoUrl') {
                  updateCleanerProfile(myProfile.id, { photoUrl: reader.result as string });
              } else {
                  if ((myProfile.galleryUrls?.length || 0) >= 50) return alert("Limite de 50 fotos atingido.");
                  const newGallery = [reader.result as string, ...(myProfile.galleryUrls || [])];
                  updateCleanerProfile(myProfile.id, { galleryUrls: newGallery });
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const toggleService = (key: string) => {
      const current = editData.services || [];
      const updated = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
      setEditData({...editData, services: updated});
  };

  const steps = [
    { id: 'personal', label: 'Cadastro Inicial', completed: !!myProfile.phone, path: '/setup-personal' },
    { id: 'professional', label: 'Perfil de Negócio', completed: !!myProfile.yearsExperience, path: '/setup-business' },
    { id: 'services', label: 'Seleção de Serviços', completed: (myProfile.services?.length || 0) > 0, path: '/setup-services' },
    { id: 'area', label: 'Área de Atendimento', completed: !!myProfile.baseZip, path: '/setup-area' },
    { id: 'docs', label: 'Bio-Verificação', completed: !!myProfile.documentFrontUrl, path: '/verify-documents' },
  ];

  const activeStepIndex = steps.findIndex(s => !s.completed);
  const progress = Math.round((steps.filter(s => s.completed).length / steps.length) * 100);
  const myLeads = leads.filter(l => l.acceptedByCleanerId === myProfile.id);

  if (!isVerified && !isUnderReview && activeStepIndex !== -1) {
      return (
        <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
             <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 max-w-2xl w-full">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Onboarding</h2>
                        <p className="text-slate-500 font-medium">Complete as etapas para ativar seu perfil.</p>
                    </div>
                    <span className="text-3xl font-black text-blue-600">{progress}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full mb-12 overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="grid gap-4">
                    {steps.map((step, idx) => {
                        const isLocked = idx > activeStepIndex && activeStepIndex !== -1;
                        return (
                            <button 
                                key={step.id}
                                onClick={() => !isLocked && !step.completed && navigate(`${step.path}?id=${myProfile.id}`)}
                                disabled={isLocked || step.completed}
                                className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${
                                    step.completed ? 'bg-slate-50 border-slate-100 opacity-60' : isLocked ? 'bg-gray-50 border-gray-100 opacity-40' : 'bg-white border-blue-50 hover:border-blue-500 shadow-sm'
                                }`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${step.completed ? 'bg-green-500 text-white' : isLocked ? 'bg-gray-200' : 'bg-blue-100 text-blue-600'}`}>{step.completed ? '✓' : idx + 1}</div>
                                    <span className="font-black text-lg">{step.label}</span>
                                </div>
                                {!step.completed && !isLocked && <span className="text-blue-600 text-sm font-bold">Começar &rarr;</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-col sticky top-0 h-screen shrink-0 border-r border-slate-800">
          <div className="p-8 border-b border-slate-800">
              <h1 className="font-black text-xl tracking-tighter">Brazilian <span className="text-blue-500">Pro</span></h1>
          </div>
          <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
              {[
                  { id: 'overview', label: 'Dashboard', icon: '📊' },
                  { id: 'profile', label: 'Perfil Público', icon: '👤' },
                  { id: 'services', label: 'Serviços', icon: '🧹' },
                  { id: 'area', label: 'Área Atendida', icon: '📍' },
                  { id: 'gallery', label: 'Galeria (Portfólio)', icon: '📸' },
                  { id: 'leads', label: 'Leads Ativos', icon: '⚡', badge: myLeads.length },
                  { id: 'settings', label: 'Minha Conta', icon: '⚙️' },
              ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                      <span className="flex items-center gap-3"><span>{tab.icon}</span> {tab.label}</span>
                      {tab.badge ? <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span> : null}
                  </button>
              ))}
          </nav>
          <div className="p-6 border-t border-slate-800 mt-auto">
              <button onClick={logout} className="w-full text-xs font-bold text-slate-500 hover:text-red-400 transition flex items-center gap-2">Sair do Sistema</button>
          </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-slate-50 max-w-6xl">
        <header className="flex justify-between items-center mb-10">
            <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{activeTab.toUpperCase()}</h2>
                {isUnderReview && <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest mt-1 inline-block">Em Análise pela Luna AI</span>}
            </div>
            {activeTab !== 'overview' && activeTab !== 'leads' && (
                <button onClick={handleUpdate} disabled={saveStatus === 'saving'} className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                    {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo ✓' : 'Salvar Alterações'}
                </button>
            )}
        </header>

        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliação</span>
                    <div className="flex items-center gap-1 mt-1"><span className="text-4xl font-black text-slate-900">{myProfile.rating || 5.0}</span><span className="text-yellow-400 text-2xl">★</span></div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads Ativos</span>
                    <p className="text-4xl font-black text-blue-600 mt-1">{myLeads.length}</p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mérito</span>
                    <p className="text-4xl font-black text-green-600 mt-1">{myProfile.points}</p>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fotos Galeria</span>
                    <p className="text-4xl font-black text-slate-900 mt-1">{myProfile.galleryUrls?.length || 0}/50</p>
                </div>
            </div>
        )}

        {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-fade-in">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
                        <div className="relative w-40 h-40 mx-auto mb-6">
                             <img src={myProfile.photoUrl || 'https://via.placeholder.com/150'} className="w-full h-full object-cover rounded-full border-4 border-slate-100" />
                             <label className="absolute bottom-1 right-1 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                                 <span className="text-xl">+</span>
                                 <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'photoUrl')} />
                             </label>
                        </div>
                        <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Foto de Perfil</h4>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-8 bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400">Nome da Empresa / Profissional</label>
                            <input className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={editData.companyName} onChange={e => setEditData({...editData, companyName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400">Anos de Experiência</label>
                            <input type="number" className="w-full bg-slate-50 p-4 rounded-xl outline-none" value={editData.yearsExperience} onChange={e => setEditData({...editData, yearsExperience: parseInt(e.target.value)})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Descrição (Bio)</label>
                        <textarea rows={4} className="w-full bg-slate-50 p-4 rounded-xl outline-none" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'services' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 animate-fade-in">
                {SERVICES_LIST.map(s => {
                    const active = (editData.services || []).includes(s.key);
                    return (
                        <button key={s.key} onClick={() => toggleService(s.key)} className={`p-6 rounded-2xl border-2 transition text-left flex flex-col gap-3 ${active ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md ring-1 ring-blue-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                            <span className="text-2xl">{s.icon}</span>
                            <span className="text-[10px] font-black uppercase leading-tight">{s.label}</span>
                        </button>
                    );
                })}
            </div>
        )}

        {activeTab === 'area' && (
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 space-y-10 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400">ZIP Code Base</label>
                        <input 
                            className="w-full bg-slate-50 p-4 rounded-xl outline-none border-2 border-slate-50 focus:border-blue-500 font-bold text-2xl" 
                            value={editData.baseZip} 
                            maxLength={5}
                            onChange={e => setEditData({...editData, baseZip: e.target.value.replace(/\D/g,'')})} 
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400">Raio (Milhas)</label>
                        <select 
                            className="w-full bg-slate-50 p-4 rounded-xl outline-none border-2 border-slate-50 font-bold"
                            value={editData.serviceRadius}
                            onChange={e => setEditData({...editData, serviceRadius: parseInt(e.target.value)})}
                        >
                            <option value={5}>5 Milhas</option>
                            <option value={10}>10 Milhas</option>
                            <option value={15}>15 Milhas</option>
                            <option value={25}>25 Milhas</option>
                        </select>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400">Lista Manual de ZIPs</label>
                    <div className="flex flex-wrap gap-2">
                        {editData.zipCodes?.map(z => (
                            <span key={z} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2">
                                {z}
                                <button onClick={() => setEditData({...editData, zipCodes: (editData.zipCodes || []).filter(item => item !== z)})} className="hover:text-red-400">✕</button>
                            </span>
                        ))}
                        <button onClick={() => {
                            const z = prompt("Digite o ZIP Code:");
                            if(z && z.length === 5) setEditData({...editData, zipCodes: [...(editData.zipCodes || []), z]});
                        }} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold text-xs border border-blue-100 hover:bg-blue-100 transition">＋ Adicionar ZIP</button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'gallery' && (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition group">
                            <span className="text-2xl text-slate-400">+</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'gallery')} />
                        </label>
                        {myProfile.galleryUrls?.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-white shadow-md">
                                <img src={url} className="w-full h-full object-cover" />
                                <button onClick={() => {
                                    const newGal = [...myProfile.galleryUrls]; newGal.splice(idx,1); updateCleanerProfile(myProfile.id, {galleryUrls: newGal});
                                }} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg">✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 space-y-10 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">E-mail de Acesso</label>
                        <input className="w-full bg-slate-100 p-4 rounded-xl outline-none text-slate-500" value={myProfile.email} disabled />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Telefone / WhatsApp</label>
                        <input className="w-full bg-slate-50 p-4 rounded-xl outline-none" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-6 h-6" checked={editData.isListed} onChange={e => setEditData({...editData, isListed: e.target.checked})} />
                        <div>
                            <span className="text-sm font-black uppercase text-slate-900">Perfil Visível ao Público</span>
                            <p className="text-[10px] text-slate-400">Se desmarcado, você não aparecerá nas buscas de clientes.</p>
                        </div>
                    </div>
                    <button onClick={() => { if(confirm("Deseja trocar sua senha? Um link será enviado.")) alert("Link enviado!"); }} className="text-xs font-black text-blue-600 uppercase tracking-widest underline underline-offset-4">Trocar Senha</button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default CleanerDashboard;

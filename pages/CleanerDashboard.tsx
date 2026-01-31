
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus, CleanerLevel, CleanerProfile, Lead } from '../types';
import { useNavigate } from 'react-router-dom';
// Fix: Added missing normalizeZip import
import { canCleanerServeZip, normalizeZip } from '../services/locationService';

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
  { key: 'deep_cleaning', label: 'Limpeza Pesada (Deep Clean)', icon: '🧽' },
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
  const { cleaners, authenticatedCleanerId, logout, updateCleanerProfile, leads, acceptLead, requestPasswordReset } = useAppContext();
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

  const handlePasswordChange = async () => {
      if(confirm("Deseja trocar sua senha? Um link de segurança será enviado ao seu e-mail.")) {
          try {
              await requestPasswordReset(myProfile.email);
              alert("Link de redefinição enviado! Verifique o simulador de e-mail.");
          } catch (e: any) {
              alert(e.message);
          }
      }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'gallery') => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = () => {
              const base64 = reader.result as string;
              if (field === 'photoUrl') {
                  updateCleanerProfile(myProfile.id, { photoUrl: base64 });
                  setEditData(prev => ({...prev, photoUrl: base64}));
              } else {
                  const currentGallery = myProfile.galleryUrls || [];
                  if (currentGallery.length >= 50) return alert("Limite de 50 fotos atingido.");
                  const newGallery = [base64, ...currentGallery];
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

  // MARKETPLACE MATCHING LOGIC: Filter leads by professional coverage
  const leadsInArea = leads.filter(l => 
    l.status === 'OPEN' && 
    canCleanerServeZip(myProfile, l.zipCode)
  );
  
  const acceptedLeads = leads.filter(l => l.acceptedByCleanerId === myProfile.id);

  // ONBOARDING GATE
  if (!isVerified && !isUnderReview && activeStepIndex !== -1 && myProfile.status !== CleanerStatus.REJECTED) {
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
                  { id: 'leads', label: 'Leads Ativos', icon: '⚡', badge: leadsInArea.length > 0 ? leadsInArea.length : undefined, badgeColor: 'bg-red-500' },
                  { id: 'settings', label: 'Configurações', icon: '⚙️' },
              ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                      <span className="flex items-center gap-3"><span>{tab.icon}</span> {tab.label}</span>
                      {tab.badge ? <span className={`${tab.badgeColor || 'bg-blue-500'} text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse`}>{tab.badge}</span> : null}
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
                {isUnderReview && <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest mt-1 inline-block animate-pulse">Perfil em Análise</span>}
                {isVerified && <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest mt-1 inline-block">✓ Perfil Verificado</span>}
            </div>
            {activeTab !== 'overview' && activeTab !== 'leads' && (
                <button onClick={handleUpdate} disabled={saveStatus === 'saving'} className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:scale-105'}`}>
                    {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo ✓' : 'Salvar Alterações'}
                </button>
            )}
        </header>

        {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliação</span>
                        <div className="flex items-center gap-1 mt-1"><span className="text-4xl font-black text-slate-900">{myProfile.rating || 5.0}</span><span className="text-yellow-400 text-2xl">★</span></div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads em sua Área</span>
                        <p className={`text-4xl font-black mt-1 ${leadsInArea.length > 0 ? 'text-blue-600 animate-pulse' : 'text-slate-300'}`}>{leadsInArea.length}</p>
                        {leadsInArea.length > 0 && (
                            <button onClick={() => setActiveTab('leads')} className="mt-3 text-[10px] font-bold text-blue-500 hover:underline uppercase">Ver Leads Agora &rarr;</button>
                        )}
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

                <div className="bg-slate-900 p-10 rounded-3xl text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Marketplace Brazilian Clean</h3>
                        <p className="text-slate-400 text-sm max-w-lg mb-6">Sua cobertura atual inclui <strong>{myProfile.baseZip}</strong> e um raio de <strong>{myProfile.serviceRadius} milhas</strong>. Você aparecerá em buscas de clientes nessas regiões.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setActiveTab('area')} className="bg-white text-slate-900 px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition">Ajustar Área</button>
                            <button onClick={() => setActiveTab('leads')} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition">Buscar Leads Ativos</button>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                </div>
            </div>
        )}

        {activeTab === 'leads' && (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-blue-900 uppercase tracking-tight">Broadcast Real-time</h3>
                        <p className="text-blue-700 text-xs">Exibindo apenas leads que coincidem com sua área de atendimento e serviços.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-blue-600">{leadsInArea.length}</span>
                        <span className="text-[10px] font-bold text-blue-400 block uppercase">Disponíveis</span>
                    </div>
                </div>

                <div className="grid gap-6">
                    {leadsInArea.map(lead => (
                        <div key={lead.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-blue-500 transition-all">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase">{lead.serviceType}</span>
                                    <span className="text-slate-400 text-xs font-bold">{new Date(lead.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{lead.zipCode} - {lead.bedrooms} Quartos / {lead.bathrooms} Banheiros</h4>
                                <p className="text-slate-500 text-sm">Cliente aguardando contato para: {lead.date}</p>
                            </div>
                            <button 
                                onClick={() => acceptLead(lead.id, myProfile.id)}
                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl group-hover:scale-105"
                            >
                                Aceitar Lead (+10 pts)
                            </button>
                        </div>
                    ))}

                    {leadsInArea.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                             <div className="text-4xl mb-4 opacity-20">📡</div>
                             <h3 className="font-bold text-slate-400 uppercase tracking-widest">Nenhum novo lead na sua área no momento</h3>
                             <p className="text-slate-300 text-xs mt-1">Estamos expandindo o marketing na sua região para trazer novos clientes.</p>
                        </div>
                    )}
                </div>

                {acceptedLeads.length > 0 && (
                    <div className="mt-12 space-y-6">
                         <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter border-b border-slate-200 pb-2">Meus Leads Aceitos</h3>
                         <div className="grid gap-4">
                            {acceptedLeads.map(lead => (
                                <div key={lead.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex justify-between items-center opacity-80">
                                    <div>
                                        <p className="font-black text-slate-900">{lead.clientName} - {lead.zipCode}</p>
                                        <p className="text-xs text-slate-500">{lead.clientPhone} | {lead.clientEmail}</p>
                                    </div>
                                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Ativo</span>
                                </div>
                            ))}
                         </div>
                    </div>
                )}
            </div>
        )}

        {/* Existing tabs (profile, services, gallery, settings, area) remain unchanged from the full content provided in START OF FILE */}
        {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-fade-in">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
                        <div className="relative w-40 h-40 mx-auto mb-6">
                             <img src={myProfile.photoUrl || 'https://via.placeholder.com/150'} className="w-full h-full object-cover rounded-full border-4 border-slate-100" />
                             <label className="absolute bottom-1 right-1 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-700 transition">
                                 <span className="text-xl">+</span>
                                 <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'photoUrl')} />
                             </label>
                        </div>
                        <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Foto de Perfil Pública</h4>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-8 bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400">Nome da Empresa ou Profissional</label>
                            <input className="w-full bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-slate-100" value={editData.companyName} onChange={e => setEditData({...editData, companyName: e.target.value})} placeholder="Ex: Maria's Professional Cleaning" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400">Anos de Experiência</label>
                            <input type="number" className="w-full bg-slate-50 p-4 rounded-xl outline-none border border-slate-100" value={editData.yearsExperience} onChange={e => setEditData({...editData, yearsExperience: parseInt(e.target.value) || 0})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Sobre Você (Bio Pública)</label>
                        <textarea rows={6} className="w-full bg-slate-50 p-4 rounded-xl outline-none border border-slate-100 text-sm leading-relaxed" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} placeholder="Conte aos clientes sobre sua experiência..." />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'services' && (
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {SERVICES_LIST.map(s => {
                        const active = (editData.services || []).includes(s.key);
                        return (
                            <button key={s.key} onClick={() => toggleService(s.key)} className={`p-6 rounded-2xl border-2 transition text-left flex flex-col gap-3 ${active ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md ring-1 ring-blue-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                                <span className="text-2xl">{s.icon}</span>
                                <span className="text-[10px] font-black uppercase leading-tight tracking-tight">{s.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        {activeTab === 'gallery' && (
            <div className="space-y-8 animate-fade-in">
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                    <header className="mb-8">
                        <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Sua Galeria de Trabalhos</h3>
                        <p className="text-xs text-slate-400 mt-1">Adicione fotos de antes/depois ou do seu equipamento. Limite: 50 fotos.</p>
                    </header>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition group">
                            <span className="text-3xl text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition">+</span>
                            <span className="text-[9px] font-black text-slate-300 group-hover:text-blue-500 uppercase mt-2">Adicionar</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'gallery')} />
                        </label>
                        {myProfile.galleryUrls?.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-white shadow-md">
                                <img src={url} className="w-full h-full object-cover transition transform group-hover:scale-110" />
                                <button onClick={() => {
                                    const newGal = [...(myProfile.galleryUrls || [])]; 
                                    newGal.splice(idx,1); 
                                    updateCleanerProfile(myProfile.id, {galleryUrls: newGal});
                                }} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg z-10">✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'area' && (
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 space-y-10 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400">ZIP Code Base</label>
                        <input 
                            className="w-full bg-slate-50 p-4 rounded-xl outline-none border-2 border-slate-50 focus:border-blue-500 font-bold text-2xl transition" 
                            value={editData.baseZip} 
                            maxLength={5}
                            onChange={e => setEditData({...editData, baseZip: normalizeZip(e.target.value)})} 
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400">Raio de Distância (Milhas)</label>
                        <select 
                            className="w-full bg-slate-50 p-4 rounded-xl outline-none border-2 border-slate-50 font-bold focus:border-blue-500"
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
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase text-slate-400">ZIP Codes Extras (Adição Manual)</label>
                        <span className="text-[9px] text-slate-400 uppercase font-bold">Total: {editData.zipCodes?.length || 0}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {editData.zipCodes?.map(z => (
                            <span key={z} className="bg-slate-900 text-white px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-800 animate-scale-in">
                                {z}
                                <button onClick={() => setEditData({...editData, zipCodes: (editData.zipCodes || []).filter(item => item !== z)})} className="hover:text-red-400 transition">✕</button>
                            </span>
                        ))}
                        <button onClick={() => {
                            const z = prompt("Digite o ZIP Code de 5 dígitos:");
                            if(z) {
                                const n = normalizeZip(z);
                                setEditData({...editData, zipCodes: [...(editData.zipCodes || []), n]});
                            }
                        }} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-xs border border-blue-100 hover:bg-blue-100 transition">＋ Adicionar Área</button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 space-y-10 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-50 pb-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">E-mail de Acesso (Não alterável)</label>
                        <input className="w-full bg-slate-100 p-4 rounded-xl outline-none text-slate-500 cursor-not-allowed text-sm" value={myProfile.email} disabled />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Telefone de Contato / Leads</label>
                        <input className="w-full bg-slate-50 p-4 rounded-xl outline-none border border-slate-100 focus:ring-2 focus:ring-blue-500" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-blue-50/50 p-8 rounded-3xl border border-blue-100">
                    <div className="flex items-center gap-4">
                        <div className="relative inline-block w-14 h-8">
                            <input 
                                type="checkbox" 
                                className="peer appearance-none w-14 h-8 bg-slate-300 rounded-full checked:bg-green-500 transition-colors cursor-pointer" 
                                checked={editData.isListed} 
                                onChange={e => setEditData({...editData, isListed: e.target.checked})} 
                            />
                            <span className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6 pointer-events-none shadow-sm"></span>
                        </div>
                        <div>
                            <span className="text-sm font-black uppercase text-slate-900 block tracking-tight">Visibilidade Pública</span>
                            <p className="text-[10px] text-slate-500 font-medium">{editData.isListed ? 'Seu perfil está VISÍVEL para clientes.' : 'Seu perfil está OCULTO.'}</p>
                        </div>
                    </div>
                    <button onClick={handlePasswordChange} className="text-xs font-black text-blue-600 uppercase tracking-widest underline underline-offset-4 hover:text-blue-800 transition">Trocar Senha</button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default CleanerDashboard;

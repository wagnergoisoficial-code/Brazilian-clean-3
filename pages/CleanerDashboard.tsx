
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

type DashboardTab = 'overview' | 'profile' | 'gallery' | 'leads' | 'reviews' | 'settings' | 'documents';

const CleanerDashboard: React.FC = () => {
  const { cleaners, authenticatedCleanerId, logout, updateCleanerProfile, leads } = useAppContext();
  const navigate = useNavigate();
  const myProfile = cleaners.find(c => c.id === authenticatedCleanerId);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Local state for editing to prevent lag
  const [editData, setEditData] = useState<Partial<CleanerProfile>>({});

  useEffect(() => {
    if (!authenticatedCleanerId) navigate('/join');
    if (myProfile) {
        setEditData({
            companyName: myProfile.companyName,
            description: myProfile.description,
            yearsExperience: myProfile.yearsExperience,
            isCompany: myProfile.isCompany,
            city: myProfile.city,
            state: myProfile.state,
            zipCodes: myProfile.zipCodes,
            photoUrl: myProfile.photoUrl
        });
    }
  }, [authenticatedCleanerId, navigate, myProfile]);

  if (!myProfile) return null;

  const isVerified = myProfile.status === CleanerStatus.VERIFIED;
  const isUnderReview = myProfile.status === CleanerStatus.UNDER_REVIEW;
  
  const needsCorrection = isUnderReview && 
                         myProfile.aiVerificationResult && 
                         myProfile.aiVerificationResult.verification_status === 'LIKELY_FRAUD';

  const isManualReview = isUnderReview && 
                        (!myProfile.aiVerificationResult || 
                         myProfile.aiVerificationResult.verification_status === 'NEEDS_MANUAL_REVIEW');

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
                  setEditData({ ...editData, photoUrl: reader.result as string });
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

  const removeGalleryPhoto = (index: number) => {
      const newGallery = [...(myProfile.galleryUrls || [])];
      newGallery.splice(index, 1);
      updateCleanerProfile(myProfile.id, { galleryUrls: newGallery });
  };

  const steps = [
    { id: 'personal', label: 'Informações Pessoais', completed: !!myProfile.phone, path: '/setup-personal' },
    { id: 'professional', label: 'Informações Profissionais', completed: !!myProfile.yearsExperience, path: '/setup-business' },
    { id: 'area', label: 'Área de Atendimento', completed: (myProfile.zipCodes?.length || 0) > 0, path: '/setup-area' },
    { id: 'docs', label: 'Verificação de Documentos', completed: !!myProfile.documentFrontUrl, path: '/verify-documents' },
  ];

  const currentStepIndex = steps.findIndex(s => !s.completed);
  const activeStepIndex = currentStepIndex === -1 ? steps.length : currentStepIndex;
  const progress = Math.round((steps.filter(s => s.completed).length / steps.length) * 100);

  // Filter leads assigned to me
  const myLeads = leads.filter(l => l.acceptedByCleanerId === myProfile.id);

  if (!isVerified && !isUnderReview && currentStepIndex !== -1) {
      // ONBOARDING MODE
      return (
        <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
             <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 max-w-2xl w-full">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Próximos Passos</h2>
                        <p className="text-slate-500 font-medium">Complete seu cadastro para começar a receber clientes.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-black text-blue-600">{progress}%</span>
                    </div>
                </div>
                
                <div className="h-3 bg-slate-100 rounded-full mb-12 overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="grid gap-4">
                    {steps.map((step, idx) => {
                        const isLocked = idx > activeStepIndex;
                        const isActive = idx === activeStepIndex;
                        return (
                            <button 
                                key={step.id}
                                onClick={() => !isLocked && !step.completed && navigate(`${step.path}?id=${myProfile.id}`)}
                                disabled={isLocked || step.completed}
                                className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${
                                    step.completed 
                                        ? 'bg-slate-50 border-slate-100 opacity-60 cursor-default' 
                                        : isLocked 
                                            ? 'bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed' 
                                            : 'bg-white border-blue-50 hover:border-blue-500 shadow-sm hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${
                                        step.completed 
                                            ? 'bg-green-500 text-white' 
                                            : isLocked 
                                                ? 'bg-gray-200 text-gray-400' 
                                                : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        {step.completed ? (
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                        ) : idx + 1}
                                    </div>
                                    <div className="text-left">
                                        <span className={`block font-black text-lg ${step.completed ? 'text-slate-400 line-through' : isLocked ? 'text-gray-400' : 'text-slate-900'}`}>
                                            {step.label}
                                        </span>
                                        {isActive && <span className="text-blue-500 text-xs font-bold uppercase tracking-widest animate-pulse">Pendente</span>}
                                    </div>
                                </div>
                                {!step.completed && !isLocked && (
                                    <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7"/></svg>
                                    </div>
                                )}
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
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-col sticky top-0 h-screen shrink-0 border-r border-slate-800">
          <div className="p-8 border-b border-slate-800">
              <h1 className="font-black text-xl tracking-tighter">Painel Pro <span className="text-blue-500 text-[10px]">v2</span></h1>
          </div>
          <nav className="flex-1 p-6 space-y-1">
              {[
                  { id: 'overview', label: 'Visão Geral', icon: '📊' },
                  { id: 'profile', label: 'Editar Perfil', icon: '👤' },
                  { id: 'gallery', label: 'Galeria de Fotos', icon: '📸' },
                  { id: 'leads', label: 'Leads & Clientes', icon: '⚡', badge: myLeads.length },
                  { id: 'reviews', label: 'Avaliações', icon: '⭐' },
                  { id: 'documents', label: 'Documentos', icon: '🪪' },
                  { id: 'settings', label: 'Configurações', icon: '⚙️' },
              ].map(tab => (
                  <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                          activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                      <span className="flex items-center gap-3"><span>{tab.icon}</span> {tab.label}</span>
                      {tab.badge ? <span className="bg-blue-400 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span> : null}
                  </button>
              ))}
          </nav>
          <div className="p-6 border-t border-slate-800 mt-auto">
              <button onClick={logout} className="w-full text-xs font-bold text-slate-500 hover:text-red-400 transition flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sair do Sistema
              </button>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-slate-50 max-w-6xl">
        
        {/* State Banners */}
        {needsCorrection && (
            <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-3xl mb-10 flex items-center justify-between animate-fade-in shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">⚠️</div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Ação Necessária</h3>
                        <p className="text-slate-600 text-sm">{myProfile.aiVerificationResult?.user_reason_pt}</p>
                    </div>
                </div>
                <button onClick={() => navigate('/verify-documents')} className="bg-orange-600 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase">Corrigir Agora</button>
            </div>
        )}

        {isManualReview && (
            <div className="bg-blue-900 text-white p-6 rounded-3xl mb-10 flex items-center gap-4 animate-fade-in border-l-4 border-blue-500">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">📑</div>
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter">Em Análise Manual</h3>
                    <p className="text-blue-300 text-sm">Seus documentos foram recebidos e estão sendo revisados pela nossa equipe.</p>
                </div>
            </div>
        )}

        {/* Tab content rendering */}
        {activeTab === 'overview' && (
            <div className="space-y-10 animate-fade-in">
                <header>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Resumo de Atividade</h2>
                            <p className="text-slate-500">Bem-vinda, {myProfile.fullName.split(' ')[0]}. Aqui está o status do seu negócio.</p>
                        </div>
                        <LevelBadge level={myProfile.level} size="lg" />
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliação</span>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-4xl font-black text-slate-900">{myProfile.rating || 5.0}</span>
                            <span className="text-yellow-400 text-2xl">★</span>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads Ativos</span>
                        <p className="text-4xl font-black text-blue-600 mt-1">{myLeads.length}</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pontos de Mérito</span>
                        <p className="text-4xl font-black text-green-600 mt-1">{myProfile.points}</p>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviews</span>
                        <p className="text-4xl font-black text-slate-900 mt-1">{myProfile.reviewCount || 0}</p>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-xl">
                            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Sua vitrine profissional</h3>
                            <p className="text-slate-400 leading-relaxed">Seu perfil é sua principal ferramenta de vendas. Adicione fotos do seu trabalho na aba 'Galeria' para atrair mais clientes e subir de nível.</p>
                        </div>
                        <button onClick={() => setActiveTab('gallery')} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition">Adicionar Fotos</button>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                </div>
            </div>
        )}

        {activeTab === 'profile' && (
            <div className="space-y-10 animate-fade-in">
                <header className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Editar Perfil Público</h2>
                        <p className="text-slate-500">O que os clientes veem quando buscam pelo seu serviço.</p>
                    </div>
                    <button 
                        onClick={handleUpdate}
                        disabled={saveStatus === 'saving'}
                        className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${
                            saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {saveStatus === 'saving' ? 'Salvando...' : saveStatus === 'saved' ? 'Salvo! ✓' : 'Salvar Alterações'}
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="space-y-6">
                        <div className="relative group mx-auto w-56 h-56">
                            <div className="w-full h-full rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-200">
                                {editData.photoUrl ? (
                                    <img src={editData.photoUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">📸</div>
                                )}
                            </div>
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-3xl cursor-pointer transition text-white text-xs font-bold uppercase">
                                Alterar Foto
                                <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'photoUrl')} />
                            </label>
                        </div>
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recomendado: 500x500px</p>
                    </div>

                    <div className="md:col-span-2 space-y-8 bg-white p-10 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Nome Profissional</label>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl outline-none focus:border-blue-500 transition" 
                                    value={editData.companyName || ''}
                                    onChange={e => setEditData({...editData, companyName: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Tipo de Negócio</label>
                                <select 
                                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl outline-none focus:border-blue-500 transition appearance-none"
                                    value={editData.isCompany ? 'LLC' : 'IND'}
                                    onChange={e => setEditData({...editData, isCompany: e.target.value === 'LLC'})}
                                >
                                    <option value="IND">Individual</option>
                                    <option value="LLC">Empresa (LLC)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Anos de Experiência</label>
                                <input 
                                    type="number"
                                    className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl outline-none focus:border-blue-500 transition" 
                                    value={editData.yearsExperience || 0}
                                    onChange={e => setEditData({...editData, yearsExperience: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400">Bio / Descrição</label>
                            <textarea 
                                rows={5}
                                className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl outline-none focus:border-blue-500 transition" 
                                value={editData.description || ''}
                                onChange={e => setEditData({...editData, description: e.target.value})}
                                placeholder="Conte um pouco sobre sua trajetória, seu método de trabalho e o que os clientes podem esperar..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'gallery' && (
            <div className="space-y-10 animate-fade-in">
                <header className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Galeria de Trabalhos</h2>
                        <p className="text-slate-500">Adicione até 50 fotos comprovando a qualidade do seu serviço.</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacidade</span>
                        <span className="text-2xl font-black text-slate-900">{myProfile.galleryUrls?.length || 0}/50</span>
                    </div>
                </header>

                <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {/* Upload Button */}
                        <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition group">
                            <span className="text-2xl text-slate-400 group-hover:scale-110 transition">＋</span>
                            <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Adicionar</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, 'gallery')} />
                        </label>

                        {myProfile.galleryUrls?.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-white shadow-sm">
                                <img src={url} className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => removeGalleryPhoto(idx)}
                                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                                >
                                    ✕
                                </button>
                                {idx === 0 && <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded font-black uppercase">Destaque</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'leads' && (
            <div className="space-y-10 animate-fade-in">
                <header>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Seus Leads & Clientes</h2>
                    <p className="text-slate-500">Histórico de solicitações aceitas através do Express Match™.</p>
                </header>

                {myLeads.length === 0 ? (
                    <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-300 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">⚡</div>
                        <h3 className="text-xl font-bold text-slate-900">Nenhum lead aceito ainda</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm leading-relaxed">Quando você aceitar um lead no marketplace, ele aparecerá aqui com todos os detalhes de contato do cliente.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {myLeads.map(lead => (
                            <div key={lead.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold">⚡</div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{lead.serviceType} em {lead.zipCode}</h4>
                                        <p className="text-slate-500 text-sm">Cliente: {lead.clientName} • {new Date(lead.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <a href={`tel:${lead.clientPhone}`} className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-center shadow-md hover:bg-black">Ligar</a>
                                    <a href={`sms:${lead.clientPhone}`} className="flex-1 md:flex-none bg-slate-100 text-slate-700 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-center hover:bg-slate-200">Mensagem</a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'documents' && (
            <div className="space-y-10 animate-fade-in">
                <header>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Central de Verificação</h2>
                    <p className="text-slate-500">Dados biometrícos e documentos de identificação enviados.</p>
                </header>

                <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status Atual</h4>
                            <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-between border border-slate-100">
                                <span className="text-sm font-bold text-slate-700 uppercase">{myProfile.status}</span>
                                {isVerified && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Verificado</span>}
                            </div>
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <p className="text-[10px] font-black uppercase text-blue-800 tracking-widest mb-2">Resumo da Luna AI</p>
                                <p className="text-sm text-blue-700 leading-relaxed italic">"{myProfile.aiVerificationResult?.summary || 'Nenhuma análise registrada.'}"</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fotos de Verificação</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="aspect-[3/2] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
                                    {myProfile.documentFrontUrl && <img src={myProfile.documentFrontUrl} className="w-full h-full object-cover" />}
                                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase">Frente</span>
                                </div>
                                <div className="aspect-[3/2] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
                                    {myProfile.facePhotoUrl && <img src={myProfile.facePhotoUrl} className="w-full h-full object-cover" />}
                                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase">Bio-Face</span>
                                </div>
                            </div>
                            <button onClick={() => navigate('/verify-documents')} className="w-full py-4 rounded-xl border-2 border-slate-100 text-slate-400 font-bold text-xs uppercase hover:bg-slate-50 transition">Reenviar Documentos</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="space-y-10 animate-fade-in">
                <header>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Configurações da Conta</h2>
                    <p className="text-slate-500">Gerencie seus dados de acesso e segurança.</p>
                </header>

                <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-100">
                    <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h4 className="font-bold text-slate-900">E-mail Principal</h4>
                            <p className="text-sm text-slate-500">Usado para logins e notificações de leads.</p>
                        </div>
                        <div className="md:col-span-2">
                            <input className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl outline-none" value={myProfile.email} disabled />
                        </div>
                    </div>
                    <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h4 className="font-bold text-slate-900">Telefone de Contato</h4>
                            <p className="text-sm text-slate-500">Será mostrado aos clientes que você aceitar.</p>
                        </div>
                        <div className="md:col-span-2">
                             <input className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl outline-none" value={myProfile.phone} disabled />
                        </div>
                    </div>
                </div>
                <div className="pt-10">
                     <button onClick={logout} className="bg-red-50 text-red-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition">Encerrar Sessão</button>
                </div>
            </div>
        )}

        {activeTab === 'reviews' && (
            <div className="space-y-10 animate-fade-in">
                <header>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Avaliações</h2>
                    <p className="text-slate-500">O que os clientes estão dizendo sobre seu trabalho.</p>
                </header>

                <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-300 text-center">
                    <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">⭐</div>
                    <h3 className="text-xl font-bold text-slate-900">Nenhuma avaliação ainda</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm leading-relaxed">Avaliações aparecerão aqui após a conclusão dos seus primeiros serviços através da plataforma.</p>
                </div>
            </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 px-4 py-3 flex justify-around items-center z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className="text-xl">📊</span>
              <span className="text-[8px] font-black uppercase">Home</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className="text-xl">👤</span>
              <span className="text-[8px] font-black uppercase">Perfil</span>
          </button>
          <button onClick={() => setActiveTab('gallery')} className={`flex flex-col items-center gap-1 ${activeTab === 'gallery' ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className="text-xl">📸</span>
              <span className="text-[8px] font-black uppercase">Fotos</span>
          </button>
          <button onClick={() => setActiveTab('leads')} className={`flex flex-col items-center gap-1 ${activeTab === 'leads' ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className="text-xl">⚡</span>
              <span className="text-[8px] font-black uppercase">Leads</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className="text-xl">⚙️</span>
              <span className="text-[8px] font-black uppercase">Conta</span>
          </button>
      </nav>
    </div>
  );
};

export default CleanerDashboard;

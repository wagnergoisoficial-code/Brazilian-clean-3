
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus, PaymentMethodType, SubscriptionPlan, CleanerLevel } from '../types';
import { processSubscriptionPayment, calculateSubscriptionPrice } from '../services/mockPaymentService';
import { getNextLevelThreshold } from '../services/meritService';
import { useNavigate } from 'react-router-dom';

const LevelBadge: React.FC<{ level: CleanerLevel; size?: 'sm' | 'lg' }> = ({ level, size = 'sm' }) => {
    const styles = {
        [CleanerLevel.BRONZE]: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '🥉' },
        [CleanerLevel.SILVER]: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700', icon: '🥈' },
        [CleanerLevel.GOLD]: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', icon: '🥇' }
    };
    const style = styles[level];
    return (
        <span className={`inline-flex items-center justify-center font-bold rounded-full border shadow-sm ${style.bg} ${style.border} ${style.text} ${size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-[10px] uppercase tracking-wide'}`}>
            <span className="mr-1.5">{style.icon}</span>
            {level}
        </span>
    );
};

const PortfolioUploadModal: React.FC<{ onClose: () => void; onUpload: (data: any) => void }> = ({ onClose, onUpload }) => {
    const [serviceType, setServiceType] = useState('Deep Clean');
    const [beforeImg, setBeforeImg] = useState('');
    const [afterImg, setAfterImg] = useState('');
    const [desc, setDesc] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setImg: (s: string) => void) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = () => setImg(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!beforeImg || !afterImg) return alert('Please upload both photos');
        setIsUploading(true);
        // Simulate network
        await new Promise(r => setTimeout(r, 1000));
        await onUpload({ serviceType, beforeImage: beforeImg, afterImage: afterImg, description: desc });
        setIsUploading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <h3 className="font-bold">Add Portfolio Work</h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Service Type</label>
                        <select className="w-full p-3 border rounded-xl" value={serviceType} onChange={e => setServiceType(e.target.value)}>
                            <option>Deep Clean</option>
                            <option>Move In/Out</option>
                            <option>Standard Clean</option>
                            <option>Kitchen Detail</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Before Photo</label>
                            <div className="h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                                {beforeImg ? <img src={beforeImg} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">Upload</span>}
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFile(e, setBeforeImg)} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">After Photo</label>
                            <div className="h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                                {afterImg ? <img src={afterImg} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">Upload</span>}
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFile(e, setAfterImg)} />
                            </div>
                        </div>
                    </div>
                    <div>
                         <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Description (Optional)</label>
                         <textarea className="w-full p-3 border rounded-xl" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Very greasy stove, took 2 hours..."></textarea>
                    </div>
                    <button disabled={isUploading} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition">
                        {isUploading ? 'Compressing & Uploading...' : 'Submit for Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const CleanerDashboard: React.FC = () => {
  const { cleaners, leads, acceptLead, setIsChatOpen, activateSubscription, addPortfolioItem } = useAppContext();
  const navigate = useNavigate();
  const myProfile = cleaners[cleaners.length - 1]; 

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  useEffect(() => {
    if (myProfile && myProfile.status === CleanerStatus.EMAIL_PENDING) {
        navigate(`/verify?id=${myProfile.id}`);
    }
  }, [myProfile, navigate]);

  if (!myProfile) return <div className="p-20 text-center font-bold">Carregando perfil...</div>;

  if (myProfile.status === CleanerStatus.EMAIL_PENDING) return null;

  const priorityDelay = myProfile.level === CleanerLevel.GOLD ? 0 : myProfile.level === CleanerLevel.SILVER ? 5*60*1000 : 15*60*1000;
  const now = Date.now();
  const myLeads = leads.filter(l => l.status === 'OPEN' && myProfile.zipCodes.includes(l.zipCode) && (now - l.createdAt >= priorityDelay));
  const acceptedLeads = leads.filter(l => l.acceptedByCleanerId === myProfile.id);

  const plan = myProfile.subscription?.plan || SubscriptionPlan.PROMO_STARTUP;
  const basePrice = plan === SubscriptionPlan.PROMO_STARTUP ? 180 : 260;
  const finalPrice = calculateSubscriptionPrice(plan, myProfile.subscription?.activeDiscount);

  const handlePayment = async (method: PaymentMethodType) => {
      setIsProcessingPayment(true);
      try {
          const subscription = await processSubscriptionPayment(myProfile.id, method, myProfile.subscription, finalPrice);
          activateSubscription(myProfile.id, subscription);
      } catch (e) {
          alert("Erro no pagamento.");
      } finally {
          setIsProcessingPayment(false);
      }
  };

  if (myProfile.status === CleanerStatus.UNDER_REVIEW) {
      return (
        <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center">
            <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-10 text-center animate-scale-in">
                 <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 mb-2">Análise em Curso</h2>
                 <p className="text-gray-500 mb-8 leading-relaxed">
                     Sua conta foi verificada por email. Agora, nossa equipe está revisando seus documentos. 
                     Fique atento ao seu email para a aprovação final.
                 </p>
                 <button onClick={() => setIsChatOpen(true)} className="text-blue-600 font-bold underline decoration-2 underline-offset-4">Falar com Suporte (Luna)</button>
            </div>
        </div>
      );
  }

  if (myProfile.status === CleanerStatus.REJECTED) {
      return (
        <div className="min-h-screen bg-red-50 py-12 px-4 flex items-center justify-center">
            <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-10 text-center animate-scale-in border border-red-100">
                 <h2 className="text-3xl font-black text-gray-900 mb-2">Verificação Recusada</h2>
                 <button onClick={() => navigate('/join')} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition">Tentar Novamente</button>
            </div>
        </div>
      );
  }

  if (myProfile.status === CleanerStatus.VERIFIED && !myProfile.subscription?.isActive) {
      return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="bg-slate-900 p-10 text-center text-white relative">
                    <div className="inline-block bg-green-500 text-black font-black px-4 py-1.5 rounded-full text-[10px] uppercase mb-4 tracking-widest">Email & ID Verificados</div>
                    <h1 className="text-4xl font-black mb-2">Ative seu Plano</h1>
                    <p className="text-slate-400">Tudo pronto! Agora só falta escolher seu plano para começar a receber leads.</p>
                </div>
                <div className="p-10">
                    <div className="border-4 border-green-500 rounded-3xl p-8 bg-green-50 mb-10 text-center">
                        <span className="text-gray-400 text-xl line-through">${basePrice}</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-2xl font-black text-green-700">$</span>
                            <span className="text-6xl font-black text-slate-900">{finalPrice}</span>
                            <span className="text-gray-500 self-end mb-2">/mês</span>
                        </div>
                        <p className="text-sm text-green-700 font-bold mt-4 uppercase tracking-widest">Primeiros 2 Meses Promocionais</p>
                    </div>
                    <button disabled={!selectedPaymentMethod || isProcessingPayment} onClick={() => handlePayment(selectedPaymentMethod || PaymentMethodType.CREDIT_CARD)} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl transition disabled:opacity-50">
                        {isProcessingPayment ? 'Processando...' : 'Ativar Minha Conta Agora 🚀'}
                    </button>
                    <div className="mt-4 space-y-2">
                         <button onClick={() => setSelectedPaymentMethod(PaymentMethodType.CREDIT_CARD)} className={`w-full p-4 border rounded-xl font-bold text-sm ${selectedPaymentMethod === PaymentMethodType.CREDIT_CARD ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200'}`}>Cartão de Crédito</button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-teal-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-8">
                {/* HERO CARD */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter">{myProfile.fullName}</h1>
                            <p className="text-slate-400 text-sm mt-1">{myProfile.companyName || 'Profissional Independente'}</p>
                        </div>
                        <LevelBadge level={myProfile.level} size="lg" />
                    </div>
                    <div className="p-8 grid grid-cols-3 gap-6 text-center border-b">
                        <div className="bg-slate-50 p-6 rounded-2xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rating</p>
                            <p className="text-3xl font-black text-slate-900">{myProfile.rating} ⭐</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pontos</p>
                            <p className="text-3xl font-black text-slate-900">{myProfile.points}</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leads</p>
                            <p className="text-3xl font-black text-slate-900">{acceptedLeads.length}</p>
                        </div>
                    </div>
                </div>

                {/* MY PORTFOLIO SECTION */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-900">Meu Portfolio (Antes & Depois)</h3>
                        <button onClick={() => setShowPortfolioModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-200 transition">
                            + Add Work
                        </button>
                    </div>

                    {!myProfile.portfolio || myProfile.portfolio.length === 0 ? (
                        <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
                            <p className="text-slate-500 text-sm mb-2">Você ainda não postou fotos de trabalhos.</p>
                            <p className="text-xs text-slate-400">Postar fotos aumenta em 40% a chance de conseguir leads!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {myProfile.portfolio.map((item) => (
                                <div key={item.id} className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50">
                                    <div className="flex h-32">
                                        <div className="w-1/2 relative">
                                            <span className="absolute top-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">BEFORE</span>
                                            <img src={item.beforeImage} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="w-1/2 relative">
                                            <span className="absolute top-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">AFTER</span>
                                            <img src={item.afterImage} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <div className="p-3 flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-700">{item.serviceType}</span>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                                            item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            item.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>{item.status}</span>
                                    </div>
                                    {item.adminNote && <div className="px-3 pb-3 text-[10px] text-red-500 leading-tight">{item.adminNote}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN - LEADS */}
            <div className="space-y-8">
                 <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        Leads Disponíveis
                    </h3>
                    {myLeads.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <p className="text-sm font-bold">Nenhum lead novo em {myProfile.zipCodes[0]}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myLeads.map(lead => (
                                <div key={lead.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <h4 className="font-bold text-slate-900 mb-1">{lead.serviceType}</h4>
                                    <p className="text-xs text-slate-500 mb-4">{lead.bedrooms}Q / {lead.bathrooms}B ● {lead.zipCode}</p>
                                    <button onClick={() => acceptLead(lead.id, myProfile.id)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm">Aceitar</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
      </div>
      {showPortfolioModal && (
          <PortfolioUploadModal 
            onClose={() => setShowPortfolioModal(false)} 
            onUpload={async (data) => {
                await addPortfolioItem(myProfile.id, data);
            }} 
          />
      )}
    </div>
  );
};

export default CleanerDashboard;
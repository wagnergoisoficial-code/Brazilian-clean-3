
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus, PaymentMethodType, SubscriptionPlan, CleanerLevel, UserRole } from '../types';
import { processSubscriptionPayment } from '../services/mockPaymentService';
import { getNextLevelThreshold } from '../services/meritService';
import { useNavigate } from 'react-router-dom';

// Componente para renderizar o emblema baseado no nível da profissional
const LevelBadge: React.FC<{ level: CleanerLevel; size?: 'sm' | 'lg' }> = ({ level, size = 'sm' }) => {
    const styles = {
        [CleanerLevel.BRONZE]: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '🥉', label: 'Bronze' },
        [CleanerLevel.SILVER]: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700', icon: '🥈', label: 'Prata' },
        [CleanerLevel.GOLD]: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', icon: '🥇', label: 'Ouro' }
    };
    const style = styles[level];
    return (
        <span className={`inline-flex items-center justify-center font-bold rounded-full border shadow-sm ${style.bg} ${style.border} ${style.text} ${size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-[10px] uppercase tracking-wide'}`}>
            <span className="mr-1.5">{style.icon}</span>
            {style.label}
        </span>
    );
};

// Modal para upload de portfólio (fotos antes/depois)
const PortfolioUploadModal: React.FC<{ onClose: () => void; onUpload: (data: any) => void }> = ({ onClose, onUpload }) => {
    const [serviceType, setServiceType] = useState('Limpeza Pesada');
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
        if (!beforeImg || !afterImg) return alert('Por favor, envie as duas fotos (Antes e Depois)');
        setIsUploading(true);
        await new Promise(r => setTimeout(r, 1000));
        await onUpload({ serviceType, beforeImage: beforeImg, afterImage: afterImg, description: desc });
        setIsUploading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <h3 className="font-bold">Adicionar Trabalho ao Portfólio</h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tipo de Serviço</label>
                        <select className="w-full p-3 border rounded-xl" value={serviceType} onChange={e => setServiceType(e.target.value)}>
                            <option>Limpeza Pesada (Deep Clean)</option>
                            <option>Mudança (Move In/Out)</option>
                            <option>Limpeza Padrão</option>
                            <option>Limpeza de Cozinha</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Foto ANTES</label>
                            <div className="h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                                {beforeImg ? <img src={beforeImg} className="w-full h-full object-cover" alt="Antes" /> : <span className="text-xs text-gray-400">Enviar</span>}
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFile(e, setBeforeImg)} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Foto DEPOIS</label>
                            <div className="h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                                {afterImg ? <img src={afterImg} className="w-full h-full object-cover" alt="Depois" /> : <span className="text-xs text-gray-400">Enviar</span>}
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFile(e, setAfterImg)} />
                            </div>
                        </div>
                    </div>
                    <div>
                         <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Descrição (Opcional)</label>
                         <textarea className="w-full p-3 border rounded-xl" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Fogão com muita gordura, levou 2 horas..."></textarea>
                    </div>
                    <button disabled={isUploading} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition">
                        {isUploading ? 'Processando e Enviando...' : 'Enviar para Revisão'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const CleanerDashboard: React.FC = () => {
  const { cleaners, leads, acceptLead, setIsChatOpen, activateSubscription, addPortfolioItem, authenticatedCleanerId, logoutCleaner } = useAppContext();
  const navigate = useNavigate();
  
  const myProfile = cleaners.find(c => c.id === authenticatedCleanerId); 

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  useEffect(() => {
    // SECURITY & FLOW ENFORCEMENT
    if (!authenticatedCleanerId) {
        navigate('/join');
        return;
    }

    if (!myProfile) {
        logoutCleaner();
        navigate('/join');
        return;
    }

    // Step 1: Verification (Already handled by VerifyEmail logic, but safe to keep)
    if (myProfile.status === CleanerStatus.EMAIL_PENDING) {
        navigate(`/verify?id=${myProfile.id}`);
        return;
    }

    // Step 2: Business Setup
    if (myProfile.status === CleanerStatus.BUSINESS_PENDING) {
        navigate(`/setup-business?id=${myProfile.id}`);
        return;
    }

    // Step 3: Documents
    if (myProfile.status === CleanerStatus.DOCUMENTS_PENDING) {
        navigate(`/verify-documents?id=${myProfile.id}`);
        return;
    }

  }, [authenticatedCleanerId, myProfile, navigate, logoutCleaner]);

  const handleLogout = () => {
    if (window.confirm("Deseja realmente sair do painel? Você precisará de um novo código de 6 dígitos para entrar novamente.")) {
      logoutCleaner();
      navigate('/');
    }
  };

  if (!myProfile) return null;

  // Render Logic for Non-Verified states (while stay on Dashboard)
  const isPendingReview = myProfile.status === CleanerStatus.UNDER_REVIEW;
  const isVerified = myProfile.status === CleanerStatus.VERIFIED;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* PROGRESSIVE DASHBOARD OVERLAY IF NOT FULLY VERIFIED */}
        {!isVerified && (
            <div className="bg-slate-900 rounded-3xl p-10 text-white shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                </div>
                <div className="relative z-10 max-w-2xl">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Status: {isPendingReview ? 'Em Análise' : 'Cadastro em Andamento'}</h2>
                        <button onClick={handleLogout} className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[10px] font-black tracking-widest uppercase">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Sair
                        </button>
                    </div>
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                        {isPendingReview 
                           ? "Excelente! Seus documentos estão sendo revisados pela nossa IA Guardian. Você receberá uma notificação assim que for aprovado para aceitar leads."
                           : "Complete todas as etapas do seu perfil para começar a faturar. Segurança é nossa prioridade para você e seus clientes."}
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <div className={`px-5 py-3 rounded-xl border font-bold flex items-center gap-2 ${myProfile.emailVerified ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                            <span className="text-xl">{myProfile.emailVerified ? '✅' : '1️⃣'}</span> E-mail
                        </div>
                        <div className={`px-5 py-3 rounded-xl border font-bold flex items-center gap-2 ${myProfile.status !== CleanerStatus.BUSINESS_PENDING && myProfile.status !== CleanerStatus.EMAIL_PENDING ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                            <span className="text-xl">{myProfile.status !== CleanerStatus.BUSINESS_PENDING && myProfile.status !== CleanerStatus.EMAIL_PENDING ? '✅' : '2️⃣'}</span> Negócio
                        </div>
                        <div className={`px-5 py-3 rounded-xl border font-bold flex items-center gap-2 ${isPendingReview || isVerified ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                            <span className="text-xl">{isPendingReview || isVerified ? '✅' : '3️⃣'}</span> Documentos
                        </div>
                    </div>
                </div>
            </div>
        )}

        {isVerified && (
            <>
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Painel do Profissional</h1>
                    <div className="flex items-center gap-3 mt-2">
                    <LevelBadge level={myProfile.level} size="lg" />
                    <span className="text-sm font-bold text-slate-500">{myProfile.points} Pontos de Experiência</span>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => setShowPortfolioModal(true)} className="flex-1 md:flex-none bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg">
                        Adicionar ao Portfólio
                    </button>
                    <button onClick={handleLogout} className="flex-1 md:flex-none bg-white text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-100 font-bold px-6 py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sair
                    </button>
                </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Status da Conta */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Status da Conta</h3>
                    <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-600">Verificação</span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700">
                        Verificado
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-600">Total de Pontos</span>
                        <span className="text-lg font-black text-blue-600">{myProfile.points}</span>
                    </div>
                    {getNextLevelThreshold(myProfile.level) && (
                        <div className="mt-4 pt-4 border-t border-slate-50">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                            <span>Progresso para Próximo Nível</span>
                            <span>{myProfile.points} / {getNextLevelThreshold(myProfile.level)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 transition-all" 
                                style={{ width: `${(myProfile.points / getNextLevelThreshold(myProfile.level)!) * 100}%` }}
                            ></div>
                        </div>
                        </div>
                    )}
                    </div>
                </div>

                {/* Gestão de Assinatura */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Assinatura</h3>
                    {myProfile.subscription?.isActive ? (
                    <div className="space-y-4">
                        <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500">Plano:</span>
                        <span className="text-slate-900">{myProfile.subscription.plan === SubscriptionPlan.PROMO_STARTUP ? 'PROMO $180/mês' : 'PADRÃO $260/mês'}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500">Vencimento:</span>
                        <span className="text-slate-900">{new Date(myProfile.subscription.nextBillingDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="bg-green-50 text-green-700 text-[10px] font-black uppercase py-2 text-center rounded-lg border border-green-100">
                            Ativa e Verificada
                        </div>
                    </div>
                    ) : (
                    <div className="space-y-4">
                        <p className="text-xs text-slate-500 leading-relaxed">Ative sua assinatura para começar a receber leads de clientes.</p>
                        <button 
                        onClick={() => setSelectedPaymentMethod(PaymentMethodType.STRIPE)}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-black transition"
                        >
                        Ativar Agora
                        </button>
                    </div>
                    )}
                </div>

                {/* Chamada para Assistente AI */}
                <div className="bg-blue-600 p-6 rounded-3xl shadow-xl text-white">
                    <h3 className="text-sm font-black text-blue-200 uppercase tracking-widest mb-4">Concierge Luna</h3>
                    <p className="text-xs font-medium leading-relaxed mb-6">Precisa de ajuda com seu perfil ou leads? Pergunte-me qualquer coisa!</p>
                    <button onClick={() => setIsChatOpen(true)} className="w-full bg-white text-blue-600 py-3 rounded-xl text-xs font-bold hover:bg-blue-50 transition">
                    Abrir Chat
                    </button>
                </div>
                </div>

                {/* Feed de Leads de Clientes */}
                <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <h2 className="text-2xl font-black text-slate-900">Leads Express™</h2>
                    <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded">Feed ao Vivo</span>
                </div>

                <div className="grid gap-4">
                    {leads.filter(l => l.status === 'OPEN').length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl text-center border-2 border-dashed border-slate-100">
                        <p className="text-slate-400 font-bold">Nenhum novo lead disponível no momento.</p>
                    </div>
                    ) : (
                    leads.filter(l => l.status === 'OPEN').map(lead => (
                        <div key={lead.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-blue-200 transition">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">🧹</div>
                            <div>
                            <h4 className="font-bold text-lg">{lead.serviceType}</h4>
                            <div className="flex gap-4 mt-1 text-xs text-slate-400 font-bold">
                                <span>CEP: {lead.zipCode}</span>
                                <span>Quartos: {lead.bedrooms}</span>
                                <span>Banheiros: {lead.bathrooms}</span>
                            </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                            if(myProfile.subscription?.isActive) {
                                acceptLead(lead.id, myProfile.id);
                            } else {
                                alert("Por favor, ative sua assinatura para aceitar leads.");
                            }
                            }}
                            className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold px-10 py-3 rounded-xl transition shadow-lg shadow-green-100"
                        >
                            Aceitar Lead
                        </button>
                        </div>
                    ))
                    )}
                </div>
                </div>
            </>
        )}
      </div>

      {showPortfolioModal && (
        <PortfolioUploadModal 
          onClose={() => setShowPortfolioModal(false)} 
          onUpload={(data) => addPortfolioItem(myProfile.id, data)}
        />
      )}

      {/* Diálogo de Pagamento Simulado */}
      {selectedPaymentMethod && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center animate-scale-in">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Ativar Assinatura</h3>
              <p className="text-slate-500 mb-8">O acesso aos leads profissionais começa em $180/mês.</p>
              <div className="space-y-3">
                <button 
                  onClick={async () => {
                    setIsProcessingPayment(true);
                    try {
                      const sub = await processSubscriptionPayment(myProfile.id, PaymentMethodType.STRIPE);
                      activateSubscription(myProfile.id, sub);
                      setSelectedPaymentMethod(null);
                    } finally {
                      setIsProcessingPayment(false);
                    }
                  }}
                  disabled={isProcessingPayment}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition disabled:opacity-50"
                >
                  {isProcessingPayment ? 'Processando...' : 'Assinar com Segurança'}
                </button>
                <button onClick={() => setSelectedPaymentMethod(null)} className="w-full text-slate-400 font-bold py-2 hover:text-slate-600">Talvez Depois</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CleanerDashboard;

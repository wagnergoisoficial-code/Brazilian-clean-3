
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus, PaymentMethodType, SubscriptionPlan, CleanerLevel } from '../types';
import { processSubscriptionPayment, calculateSubscriptionPrice } from '../services/mockPaymentService';
import { getNextLevelThreshold } from '../services/meritService';

const LevelBadge: React.FC<{ level: CleanerLevel; size?: 'sm' | 'lg' }> = ({ level, size = 'sm' }) => {
    // Professional, Subtle Visual Design for Levels
    const styles = {
        [CleanerLevel.BRONZE]: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-700',
            icon: '🥉'
        },
        [CleanerLevel.SILVER]: {
            bg: 'bg-slate-50',
            border: 'border-slate-300',
            text: 'text-slate-700',
            icon: '🥈'
        },
        [CleanerLevel.GOLD]: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-300',
            text: 'text-yellow-700',
            icon: '🥇'
        }
    };
    
    const style = styles[level];
    const labels = {
        [CleanerLevel.BRONZE]: 'Nível Bronze',
        [CleanerLevel.SILVER]: 'Nível Prata',
        [CleanerLevel.GOLD]: 'Nível Ouro'
    };

    return (
        <span className={`inline-flex items-center justify-center font-bold rounded-full border shadow-sm ${style.bg} ${style.border} ${style.text} ${size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-[10px] uppercase tracking-wide'}`}>
            <span className="mr-1.5">{style.icon}</span>
            {labels[level]}
        </span>
    );
};

// Priority Logic: How long (in ms) a lead is hidden for each level
const getLeadPriorityDelay = (level: CleanerLevel): number => {
    switch(level) {
        case CleanerLevel.GOLD: return 0; // Immediate access
        case CleanerLevel.SILVER: return 1000 * 60 * 5; // 5 minute delay
        case CleanerLevel.BRONZE: return 1000 * 60 * 15; // 15 minute delay
        default: return 1000 * 60 * 15;
    }
};

const CleanerDashboard: React.FC = () => {
  const { cleaners, leads, acceptLead, setIsChatOpen, feedPosts, activateSubscription, bonusCampaigns } = useAppContext();
  // In a real app we'd filter by logged in user ID. Here we take the last added one or a mock.
  const myProfile = cleaners[cleaners.length - 1]; 

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType | null>(null);

  if (!myProfile) return <div>Loading...</div>;

  // PRIORITY LOGIC: Filter leads based on Level + Time Delay
  const priorityDelay = getLeadPriorityDelay(myProfile.level);
  const now = Date.now();

  // Show leads that are OPEN, in my ZIP, AND older than my priority delay
  const myLeads = leads.filter(l => 
    l.status === 'OPEN' && 
    myProfile.zipCodes.includes(l.zipCode) &&
    (now - l.createdAt >= priorityDelay)
  );
  
  const acceptedLeads = leads.filter(l => 
    l.acceptedByCleanerId === myProfile.id
  );

  // Price Calculation Logic
  const plan = myProfile.subscription?.plan || SubscriptionPlan.PROMO_STARTUP;
  const basePrice = plan === SubscriptionPlan.PROMO_STARTUP ? 180 : 260;
  const finalPrice = calculateSubscriptionPrice(plan, myProfile.subscription?.activeDiscount);
  const isFree = finalPrice === 0;

  // Merit Calculations
  const nextThreshold = getNextLevelThreshold(myProfile.level);
  const progressPercent = nextThreshold 
    ? Math.min(100, (myProfile.points / nextThreshold) * 100)
    : 100;

  const handlePayment = async (method: PaymentMethodType) => {
      setIsProcessingPayment(true);
      try {
          const subscription = await processSubscriptionPayment(
              myProfile.id, 
              method,
              myProfile.subscription,
              finalPrice // Pass the calculated price
          );
          activateSubscription(myProfile.id, subscription);
      } catch (e) {
          alert("Erro no pagamento. Tente novamente.");
      } finally {
          setIsProcessingPayment(false);
      }
  };

  // 1. BLOCKED VIEW: PENDING
  if (myProfile.status === CleanerStatus.PENDING) {
      return (
        <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in">
                 <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta em Análise</h2>
                 <p className="text-gray-600 mb-6">
                     Seus documentos estão sendo analisados pela nossa equipe. 
                     <br/>Você receberá um email assim que sua conta for aprovada.
                 </p>
                 <button onClick={() => setIsChatOpen(true)} className="text-blue-600 hover:text-blue-800 font-medium underline">
                     Falar com Suporte (Luna)
                 </button>
            </div>
        </div>
      );
  }

  // 2. BLOCKED VIEW: VERIFIED BUT UNPAID (SUBSCRIPTION WALL)
  if (myProfile.status === CleanerStatus.VERIFIED && !myProfile.subscription?.isActive) {
      return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full blur-[80px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="relative z-10">
                        <div className="inline-block bg-green-500 text-black font-bold px-3 py-1 rounded-full text-xs uppercase mb-4 tracking-wide">
                            Conta Verificada
                        </div>
                        <h1 className="text-3xl font-extrabold mb-2">Ative sua Assinatura</h1>
                        <p className="text-slate-300">Para receber leads e aparecer na busca, você precisa ativar seu plano.</p>
                    </div>
                </div>

                <div className="p-8">
                    {/* Pricing Card */}
                    <div className="border-2 border-green-500 rounded-xl p-6 bg-green-50/50 mb-8 relative">
                        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">
                            {myProfile.subscription?.activeDiscount ? 'BENEFÍCIO ATIVO' : 'OFERTA INICIAL'}
                        </div>
                        <div className="text-center mb-6">
                            {/* Original Price (Strikethrough if discounted) */}
                            {finalPrice < basePrice && (
                                <span className="text-gray-400 text-lg line-through mr-2">${basePrice}</span>
                            )}
                            
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-2xl font-bold text-green-700">$</span>
                                <span className="text-5xl font-extrabold text-slate-900">{finalPrice}</span>
                                <span className="text-gray-500 self-end mb-2">/mês</span>
                            </div>
                            
                            {myProfile.subscription?.activeDiscount && (
                                <div className="mt-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full inline-block text-xs font-bold border border-purple-200">
                                    {myProfile.subscription.activeDiscount.description || 'Desconto Aplicado'} 
                                    (Até {new Date(myProfile.subscription.activeDiscount.endDate).toLocaleDateString()})
                                </div>
                            )}
                            
                            {!myProfile.subscription?.activeDiscount && (
                                <p className="text-sm text-green-700 font-medium mt-2">Preço promocional nos primeiros 2 meses</p>
                            )}
                        </div>
                        <ul className="space-y-3 text-sm text-gray-600 mb-6">
                            <li className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Leads Ilimitados na sua região
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Perfil visível na busca (Com selo de verificação)
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Acesso ao painel administrativo
                            </li>
                        </ul>
                    </div>

                    {/* Payment Methods */}
                    {!isFree ? (
                        <>
                            <h3 className="font-bold text-gray-900 mb-4">Selecione a forma de pagamento:</h3>
                            <div className="grid grid-cols-1 gap-4 mb-8">
                                <button 
                                    onClick={() => setSelectedPaymentMethod(PaymentMethodType.CREDIT_CARD)}
                                    className={`p-4 border rounded-xl flex items-center gap-4 transition ${selectedPaymentMethod === PaymentMethodType.CREDIT_CARD ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-blue-300'}`}
                                >
                                    <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-500">CARD</div>
                                    <span className="font-bold text-gray-800">Cartão de Crédito / Débito</span>
                                </button>
                                
                                <button 
                                    onClick={() => setSelectedPaymentMethod(PaymentMethodType.PAYPAL)}
                                    className={`p-4 border rounded-xl flex items-center gap-4 transition ${selectedPaymentMethod === PaymentMethodType.PAYPAL ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-blue-300'}`}
                                >
                                    <div className="w-10 h-6 bg-blue-100 rounded flex items-center justify-center text-xs font-bold text-blue-800">Pay</div>
                                    <span className="font-bold text-gray-800">PayPal</span>
                                </button>
                            </div>
                        </>
                    ) : (
                         <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 text-center">
                            <p className="text-green-800 font-bold">🎉 Pagamento Isento Pela Administração</p>
                            <p className="text-sm text-green-600">Sua assinatura será ativada gratuitamente.</p>
                         </div>
                    )}

                    <button 
                        disabled={(!isFree && !selectedPaymentMethod) || isProcessingPayment}
                        onClick={() => handlePayment(isFree ? PaymentMethodType.ADMIN_EXEMPTION : (selectedPaymentMethod || PaymentMethodType.CREDIT_CARD))}
                        className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {isProcessingPayment ? (
                            <>
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                             Processando...
                            </>
                        ) : (
                            <>
                             {isFree ? 'Ativar Plano Gratuitamente 🚀' : 'Pagar e Ativar Conta 🚀'}
                            </>
                        )}
                    </button>
                    
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Pagamento 100% Seguro. Seus dados estão protegidos.
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // 3. FULL DASHBOARD ACCESS (VERIFIED & PAID)
  return (
    <div className="min-h-screen bg-teal-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* LEFT COLUMN: Profile & Merit */}
            <div className="lg:col-span-2 space-y-8">
                {/* PROFILE CARD */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-white">Painel do Profissional</h1>
                        <div className="flex items-center gap-2 bg-green-700/50 px-3 py-1 rounded-lg border border-green-500/30">
                            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                            <span className="text-xs text-white font-bold uppercase tracking-wider">Assinatura Ativa</span>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <img src={myProfile.photoUrl} alt="" className="w-20 h-20 rounded-full border-4 border-white shadow-sm object-cover"/>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-xl font-bold text-gray-900">{myProfile.fullName}</h2>
                                    <LevelBadge level={myProfile.level} />
                                </div>
                                <p className="text-gray-500">{myProfile.companyName}</p>
                            </div>
                            <div className="ml-auto hidden sm:block">
                                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-bold text-sm border border-green-200">
                                        CONTA VERIFICADA ✅
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-500 text-sm">Classificação</p>
                                <p className="text-2xl font-bold text-gray-900">{myProfile.rating} ⭐</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-500 text-sm">Leads Aceitos</p>
                                <p className="text-2xl font-bold text-gray-900">{acceptedLeads.length}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg relative overflow-hidden">
                                <p className="text-gray-500 text-sm">Próxima Fatura</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {new Date(myProfile.subscription?.nextBillingDate || '').toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MERIT SYSTEM CARD */}
                <div className="bg-white rounded-lg shadow overflow-hidden border border-amber-200">
                    <div className="bg-gradient-to-r from-amber-700 to-amber-900 px-6 py-4 flex justify-between items-center text-white">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <span>🏆</span>
                            Meu Nível: <span className="uppercase">{myProfile.level === 'BRONZE' ? 'Bronze' : myProfile.level === 'SILVER' ? 'Prata' : 'Ouro'}</span>
                        </h2>
                        <span className="font-mono text-xl font-bold">{myProfile.points} pts</span>
                    </div>
                    <div className="p-6">
                        <div className="mb-6">
                            <div className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-2">
                                <span>Progresso para o próximo nível</span>
                                <span>{nextThreshold ? `${myProfile.points} / ${nextThreshold}` : 'Nível Máximo'}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div 
                                    className="bg-amber-500 h-4 rounded-full transition-all duration-1000" 
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            {myProfile.level === CleanerLevel.GOLD ? (
                                <p className="text-xs text-amber-600 mt-2 font-bold">Parabéns! Você atingiu o nível máximo de excelência.</p>
                            ) : (
                                <p className="text-xs text-gray-400 mt-2">Acumule mais {nextThreshold! - myProfile.points} pontos para subir de nível.</p>
                            )}
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase">Como ganhar pontos hoje:</h3>
                            <div className="grid gap-3">
                                {bonusCampaigns.filter(c => c.isActive).map(campaign => (
                                    <div key={campaign.id} className="border border-green-100 bg-green-50 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-green-900 text-sm">{campaign.title}</p>
                                            <p className="text-xs text-green-700">{campaign.description}</p>
                                        </div>
                                        <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">+{campaign.pointsReward} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Helper Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-blue-900">Precisa de Ajuda?</h3>
                        <p className="text-blue-700 text-sm">A Luna está disponível para tirar dúvidas sobre sua conta, pagamentos e leads.</p>
                    </div>
                    <button 
                        onClick={() => setIsChatOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold shadow-md transition flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Falar com Luna
                    </button>
                </div>

            </div>

            {/* RIGHT COLUMN: Leads & Community */}
            <div className="space-y-8">
                 {/* LEADS LIST */}
                 <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                            Oportunidades
                        </h3>
                        <div className="text-right">
                             <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Área: {myProfile.zipCodes.join(', ')}</span>
                             {myProfile.level !== CleanerLevel.GOLD && (
                                 <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                     Prioridade Limitada ({Math.round(priorityDelay / 60000)}min delay)
                                 </span>
                             )}
                        </div>
                    </div>
                    
                    {myLeads.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Sem leads no momento</h3>
                            <p className="mt-1 text-sm text-gray-500">Novas oportunidades aparecerão aqui quando clientes na sua área solicitarem serviços.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myLeads.map(lead => (
                                <div key={lead.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-gray-50 flex flex-col justify-between items-start gap-4">
                                    <div className="w-full">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded uppercase">{lead.serviceType}</span>
                                            <span className="text-gray-500 text-sm">● {lead.zipCode}</span>
                                        </div>
                                        <h4 className="font-bold text-lg text-gray-900">{lead.bedrooms} Quartos, {lead.bathrooms} Banheiros</h4>
                                        <p className="text-sm text-gray-600">Data Desejada: <span className="font-semibold text-gray-800">{lead.date}</span></p>
                                    </div>
                                    <button 
                                        onClick={() => acceptLead(lead.id, myProfile.id)}
                                        className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-lg transition shadow-lg flex items-center justify-center gap-2"
                                    >
                                        Aceitar Lead
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* COMMUNITY WALL */}
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <div className="bg-purple-600 px-6 py-4 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            Mural da Comunidade
                        </h2>
                    </div>
                    <div className="p-6">
                        {feedPosts.length === 0 ? (
                            <p className="text-gray-500 text-center italic">Nenhum comunicado recente.</p>
                        ) : (
                            <div className="space-y-6">
                                {feedPosts.map(post => (
                                    <div key={post.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                post.type === 'EVENT' ? 'bg-orange-100 text-orange-800' : 
                                                post.type === 'TRAINING' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {post.type === 'EVENT' ? 'EVENTO' : post.type === 'TRAINING' ? 'TREINAMENTO' : 'COMUNICADO'}
                                            </span>
                                            <span className="text-xs text-gray-400">{post.date}</span>
                                        </div>
                                        <div className="flex gap-4">
                                            {post.imageUrl && (
                                                <img src={post.imageUrl} alt="" className="w-16 h-16 object-cover rounded-lg bg-gray-100 shrink-0 hidden sm:block"/>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-sm text-gray-900 mb-1">{post.title}</h3>
                                                <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">{post.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default CleanerDashboard;

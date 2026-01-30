
import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus, CleanerLevel } from '../types';
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

const CleanerDashboard: React.FC = () => {
  const { cleaners, authenticatedCleanerId, logout, updateCleanerProfile } = useAppContext();
  const navigate = useNavigate();
  const myProfile = cleaners.find(c => c.id === authenticatedCleanerId);

  useEffect(() => {
    if (!authenticatedCleanerId) navigate('/join');
  }, [authenticatedCleanerId, navigate]);

  if (!myProfile) return null;

  const isVerified = myProfile.status === CleanerStatus.VERIFIED;
  const isUnderReview = myProfile.status === CleanerStatus.UNDER_REVIEW;
  
  // Correction needed if explicitly flagged by AI or Admin
  const needsCorrection = isUnderReview && 
                         myProfile.aiVerificationResult && 
                         myProfile.aiVerificationResult.verification_status === 'LIKELY_FRAUD';

  // Manual review if flagged or technical issue occurred
  const isManualReview = isUnderReview && 
                        (!myProfile.aiVerificationResult || 
                         myProfile.aiVerificationResult.verification_status === 'NEEDS_MANUAL_REVIEW');

  const steps = [
    { id: 'personal', label: 'Informações Pessoais', completed: !!myProfile.phone, path: '/setup-personal' },
    { id: 'professional', label: 'Informações Profissionais', completed: !!myProfile.yearsExperience, path: '/setup-business' },
    { id: 'area', label: 'Área de Atendimento', completed: (myProfile.zipCodes?.length || 0) > 0, path: '/setup-area' },
    { id: 'docs', label: 'Verificação de Documentos', completed: !!myProfile.documentUrl || !!myProfile.documentFrontUrl, path: '/verify-documents' },
  ];

  const currentStepIndex = steps.findIndex(s => !s.completed);
  const activeStepIndex = currentStepIndex === -1 ? steps.length : currentStepIndex;
  const progress = Math.round((steps.filter(s => s.completed).length / steps.length) * 100);

  const handleCorrection = () => {
      if (!myProfile) return;
      updateCleanerProfile(myProfile.id, {
          status: CleanerStatus.DOCUMENTS_PENDING,
          documentFrontUrl: undefined,
          documentBackUrl: undefined,
          facePhotoUrl: undefined,
          selfieWithDocUrl: undefined,
          aiVerificationResult: undefined
      });
      navigate(`/verify-documents?id=${myProfile.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Olá, {myProfile.fullName.split(' ')[0]}!</h1>
                <p className="text-slate-500 font-medium">Bem-vinda ao seu painel profissional.</p>
            </div>
            <div className="flex gap-4">
                 <button onClick={logout} className="text-sm font-bold text-slate-400 hover:text-red-600 transition flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sair
                 </button>
            </div>
        </header>

        {isVerified ? (
            <div className="animate-fade-in space-y-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl">🏆</div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Perfil Verificado</h2>
                            <LevelBadge level={myProfile.level} />
                        </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed mb-6">
                        Você está pronta! Seu perfil agora está visível para clientes em sua área de atuação.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-6 rounded-2xl text-center">
                            <span className="text-3xl font-black text-blue-600">{myProfile.points}</span>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Pontos de Mérito</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl text-center">
                            <span className="text-3xl font-black text-green-600">{myProfile.rating || 0}</span>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Avaliação</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl text-center">
                            <span className="text-3xl font-black text-slate-900">{myProfile.reviewCount || 0}</span>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Reviews</p>
                        </div>
                    </div>
                </div>
            </div>
        ) : needsCorrection ? (
            <div className="bg-white border-2 border-orange-200 p-10 rounded-3xl shadow-xl animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Ação necessária</h2>
                        <p className="text-orange-600 font-bold text-sm uppercase tracking-widest">Problema na documentação</p>
                    </div>
                </div>
                
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 mb-8 space-y-2">
                    <p className="text-slate-900 font-bold">{myProfile.aiVerificationResult?.user_reason_pt}</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{myProfile.aiVerificationResult?.user_instruction_pt}</p>
                </div>

                <button 
                    onClick={handleCorrection}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition flex items-center justify-center gap-3"
                >
                    Corrigir e Reenviar
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7"/></svg>
                </button>
            </div>
        ) : isManualReview ? (
            <div className="bg-slate-900 p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden animate-fade-in border-l-4 border-blue-500">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <svg className="w-32 h-32 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                </div>
                <div className="relative z-10">
                    <span className="bg-blue-600 text-[10px] font-black uppercase px-3 py-1 rounded-full mb-4 inline-block tracking-widest">Em análise manual</span>
                    <h2 className="text-3xl font-black mb-4">Documentos Recebidos 📑</h2>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-xl mb-4">
                        Seus dados foram enviados com sucesso. Nossa equipe está revisando seu perfil manualmente para garantir a segurança da plataforma.
                    </p>
                    {myProfile.aiVerificationResult?.user_reason_pt && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-4">
                            <p className="text-blue-300 text-sm italic font-medium">"{myProfile.aiVerificationResult.user_instruction_pt}"</p>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Próximos Passos</h2>
                        <p className="text-slate-500 font-medium">Complete seu cadastro para começar.</p>
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
        )}
      </div>
    </div>
  );
};

export default CleanerDashboard;


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
  const { cleaners, authenticatedCleanerId, logout } = useAppContext();
  const navigate = useNavigate();
  const myProfile = cleaners.find(c => c.id === authenticatedCleanerId);

  useEffect(() => {
    if (!authenticatedCleanerId) navigate('/join');
  }, [authenticatedCleanerId, navigate]);

  if (!myProfile) return null;

  const isVerified = myProfile.status === CleanerStatus.VERIFIED;
  const isUnderReview = myProfile.status === CleanerStatus.UNDER_REVIEW;

  const steps = [
    { id: 'personal', label: 'Informações Pessoais', completed: !!myProfile.phone, path: '/setup-personal' },
    { id: 'professional', label: 'Informações Profissionais', completed: !!myProfile.yearsExperience, path: '/setup-business' },
    { id: 'area', label: 'Área de Atendimento', completed: (myProfile.zipCodes?.length || 0) > 0, path: '/setup-area' },
    { id: 'docs', label: 'Verificação de Documentos', completed: !!myProfile.documentUrl, path: '/verify-documents' },
  ];

  const currentStepIndex = steps.findIndex(s => !s.completed);
  const activeStepIndex = currentStepIndex === -1 ? steps.length : currentStepIndex;
  const progress = Math.round((steps.filter(s => s.completed).length / steps.length) * 100);

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
                    Sair da plataforma
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
                            <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Média de Avaliação</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl text-center">
                            <span className="text-3xl font-black text-slate-900">{myProfile.reviewCount || 0}</span>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Total de Reviews</p>
                        </div>
                    </div>
                </div>
            </div>
        ) : isUnderReview ? (
            <div className="bg-slate-900 p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <svg className="w-32 h-32 animate-spin-slow" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                </div>
                <h2 className="text-3xl font-black mb-4">Perfil em Análise ⏳</h2>
                <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                    Nossa IA Guardian está revisando sua documentação e selfie para garantir a segurança da plataforma. Você receberá um e-mail em breve.
                </p>
            </div>
        ) : (
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Próximos Passos</h2>
                        <p className="text-slate-500 font-medium">Perfil incompleto – complete os passos para começar.</p>
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

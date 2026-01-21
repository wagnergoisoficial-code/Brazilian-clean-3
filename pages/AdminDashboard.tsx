import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus, SupportStatus, SupportType, SubscriptionPlan, Discount, DiscountType, BonusCampaign, CleanerLevel } from '../types';
import { checkSystemHealth, performAutoBackup } from '../services/systemGuardianService';
import { SYSTEM_IDENTITY } from '../config/SystemManifest';

const DashboardSkeleton = () => (
  <div className="animate-pulse px-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1,2,3].map(i => (
            <div key={i} className="bg-gray-100 p-6 rounded-xl h-32"></div>
        ))}
    </div>
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-200 h-16"></div>
        <div className="p-0">
             {[1,2,3,4,5].map(i => (
                 <div key={i} className="h-20 border-b border-gray-100 bg-white"></div>
             ))}
        </div>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const { cleaners, verifyCleaner, rejectCleaner, createFeedPost, deleteFeedPost, supportRequests, applyDiscount, removeDiscount, bonusCampaigns, createBonusCampaign, toggleBonusCampaign, addCleanerPoints } = useAppContext();
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<'cleaners' | 'support' | 'merit' | 'analytics' | 'system' | 'governance'>('governance');
  const [healthStatus, setHealthStatus] = useState(checkSystemHealth());

  const pendingCleaners = cleaners.filter(c => c.status === CleanerStatus.PENDING);
  const pendingRequests = supportRequests.filter(r => r.status !== SupportStatus.RESOLVED).length;
  const verifiedCleaners = cleaners.filter(c => c.status === CleanerStatus.VERIFIED);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === 'admin123') {
      setIsLoading(true);
      setTimeout(() => {
        setAccessGranted(true);
        setError('');
        setIsLoading(false);
      }, 800);
    } else {
      setError('Acesso Negado: Código Inválido');
    }
  };

  const handleManualBackup = () => {
      const success = performAutoBackup();
      if(success) {
          alert("Backup Manual Realizado com Sucesso.");
          setHealthStatus(checkSystemHealth());
      }
  };

  if (!accessGranted && !isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-slate-900 p-6 text-center">
            <h2 className="text-2xl font-bold text-white">Área Restrita</h2>
            <p className="text-slate-400 text-sm mt-2">Somente Pessoal Autorizado</p>
          </div>
          <form onSubmit={handleLogin} className="p-8">
             <div className="mb-6">
               <label className="block text-sm font-bold text-gray-700 mb-2">Código de Segurança</label>
               <input 
                 type="password" 
                 value={accessCode}
                 onChange={(e) => setAccessCode(e.target.value)}
                 className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-900 outline-none"
                 placeholder="Digite o código..."
               />
               {error && <p className="text-red-600 text-sm mt-2 font-medium">{error}</p>}
             </div>
             <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-lg transition">
               Desbloquear Portal
             </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 font-sans">
      <div className="flex justify-between items-center mb-8 px-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centro de Controle Luna</h1>
          <p className="text-sm text-gray-500">Conexão Segura Ativa</p>
        </div>
        <button onClick={() => setAccessGranted(false)} className="text-sm text-red-600 font-medium underline">Bloquear Sessão</button>
      </div>

      <div className="flex px-4 mb-8 border-b border-gray-200 overflow-x-auto gap-4">
          <button onClick={() => setActiveView('governance')} className={`px-4 py-2 font-bold text-sm ${activeView === 'governance' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-gray-500'}`}>Visão Geral</button>
          <button onClick={() => setActiveView('cleaners')} className={`px-4 py-2 font-bold text-sm ${activeView === 'cleaners' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-gray-500'}`}>Profissionais ({pendingCleaners.length})</button>
          <button onClick={() => setActiveView('system')} className={`px-4 py-2 font-bold text-sm ${activeView === 'system' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-gray-500'}`}>Saúde do Sistema</button>
      </div>

      <div className="px-4">
        {activeView === 'governance' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
              <h3 className="text-gray-500 text-xs font-bold uppercase">Pendentes</h3>
              <p className="text-3xl font-black text-slate-900">{pendingCleaners.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
              <h3 className="text-gray-500 text-xs font-bold uppercase">Verificados</h3>
              <p className="text-3xl font-black text-green-600">{verifiedCleaners.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
              <h3 className="text-gray-500 text-xs font-bold uppercase">Tickets Suporte</h3>
              <p className="text-3xl font-black text-blue-600">{pendingRequests}</p>
            </div>
          </div>
        )}

        {activeView === 'cleaners' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Aprovações Pendentes</h2>
            {pendingCleaners.length === 0 ? (
              <p className="text-gray-500 italic">Nenhuma aplicação aguardando.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingCleaners.map(c => (
                  <div key={c.id} className="bg-white p-6 rounded-xl shadow border border-gray-200">
                    <img src={c.photoUrl} className="w-16 h-16 rounded-full mb-4 object-cover" alt="" />
                    <h4 className="font-bold">{c.fullName}</h4>
                    <p className="text-sm text-gray-500 mb-4">{c.city}, {c.state}</p>
                    <div className="flex gap-2">
                      <button onClick={() => verifyCleaner(c.id)} className="flex-1 bg-green-500 text-white py-2 rounded font-bold text-xs">Aprovar</button>
                      <button onClick={() => rejectCleaner(c.id)} className="flex-1 border border-red-200 text-red-600 py-2 rounded font-bold text-xs">Rejeitar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'system' && (
          <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
              Status do Guardião Luna
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <p className="text-slate-400 text-xs uppercase font-bold mb-1">Integridade de Dados</p>
                <p className="text-xl font-mono text-green-400">ESTÁVEL</p>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <p className="text-slate-400 text-xs uppercase font-bold mb-1">Versão do Sistema</p>
                <p className="text-xl font-mono text-blue-400">v{SYSTEM_IDENTITY.VERSION}</p>
              </div>
            </div>
            <button onClick={handleManualBackup} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition">
              Forçar Backup de Emergência
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const ProWallet: React.FC = () => {
  const { authenticatedCleanerId, cleaners, addCredits } = useAppContext();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(100);

  const myProfile = cleaners.find(c => c.id === authenticatedCleanerId);
  if (!myProfile) return null;

  const handleTopUp = () => {
    setIsProcessing(true);
    setTimeout(() => {
      addCredits(selectedAmount);
      setIsProcessing(false);
      alert('Balance updated successfully!');
    }, 1500);
  };

  const packages = [
    { amount: 50, bonus: 0, label: 'Starter', popular: false },
    { amount: 100, bonus: 10, label: 'Professional', popular: true },
    { amount: 250, bonus: 35, label: 'Elite', popular: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             Dashboard
          </button>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Minha Carteira</h1>
        </div>

        <div className="bg-slate-900 rounded-[40px] p-10 text-white mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Saldo Disponível</span>
            <h2 className="text-6xl font-black tracking-tighter mb-2">${myProfile.balance.toFixed(2)}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Créditos Brazilian Clean</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest text-center mb-6">Escolha um Pacote de Créditos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <button 
                key={pkg.amount}
                onClick={() => setSelectedAmount(pkg.amount + pkg.bonus)}
                className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center text-center ${selectedAmount === (pkg.amount + pkg.bonus) ? 'bg-white border-blue-600 shadow-xl scale-105' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'}`}
              >
                {pkg.popular && <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase mb-2">Popular</span>}
                <span className="text-[10px] font-black text-slate-400 uppercase mb-1">{pkg.label}</span>
                <span className="text-3xl font-black text-slate-900">${pkg.amount}</span>
                {pkg.bonus > 0 && <span className="text-[9px] font-black text-emerald-500 uppercase mt-1">+${pkg.bonus} Bonus</span>}
              </button>
            ))}
          </div>

          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
             <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-50">
                <p className="font-bold text-slate-500 uppercase text-xs tracking-widest">Resumo do Pedido</p>
                <p className="text-2xl font-black text-slate-900">${selectedAmount}</p>
             </div>
             
             <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                   <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg">💳</div>
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Cartão Salvo</p>
                      <p className="text-sm font-bold text-slate-800">Visa ending in 4242</p>
                   </div>
                </div>
             </div>

             <button 
               onClick={handleTopUp}
               disabled={isProcessing}
               className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black transition transform active:scale-95 disabled:opacity-50"
             >
               {isProcessing ? 'Processando Pagamento...' : 'Comprar Créditos Agora'}
             </button>
             
             <p className="text-center text-[10px] text-slate-400 mt-6 font-medium">
               Pagamento seguro processado via Stripe Connect.<br/>
               Créditos são válidos apenas para desbloqueio de leads na Brazilian Clean.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProWallet;

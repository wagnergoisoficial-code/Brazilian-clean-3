
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CleanerProfile, CleanerLevel, PortfolioItem } from '../types';

const LevelBadge: React.FC<{ level: CleanerLevel }> = ({ level }) => {
    if (level === CleanerLevel.BRONZE) return null;
    const styles = {
        [CleanerLevel.SILVER]: "bg-slate-50 border-slate-300 text-slate-700",
        [CleanerLevel.GOLD]: "bg-yellow-50 border-yellow-300 text-yellow-700"
    };
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${styles[level]} uppercase tracking-wide`}>
            {level === CleanerLevel.GOLD ? '🥇 Gold Pro' : '🥈 Silver Pro'}
        </span>
    );
};

const PortfolioViewer: React.FC<{ items: PortfolioItem[]; onClose: () => void }> = ({ items, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-slate-900">Verified Work Portfolio</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl font-bold">✕</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {items.map(item => (
                        <div key={item.id} className="space-y-2">
                             <h4 className="font-bold text-sm bg-slate-100 px-3 py-1 rounded w-fit">{item.serviceType}</h4>
                             <div className="flex h-48 rounded-xl overflow-hidden border border-slate-200">
                                 <div className="w-1/2 relative border-r border-white">
                                     <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded">BEFORE</span>
                                     <img src={item.beforeImage} className="w-full h-full object-cover" />
                                 </div>
                                 <div className="w-1/2 relative">
                                     <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded">AFTER</span>
                                     <img src={item.afterImage} className="w-full h-full object-cover" />
                                 </div>
                             </div>
                             {item.description && <p className="text-xs text-slate-500 italic">"{item.description}"</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CleanerSearch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const zip = searchParams.get('zip') || '';
  const { searchCleaners } = useAppContext();
  const [results, setResults] = useState<CleanerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItem[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (zip) setResults(searchCleaners(zip));
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [zip, searchCleaners]);

  return (
    <div className="min-h-screen bg-teal-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Profissionais em <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">{zip}</span></h2>
            <button onClick={() => navigate('/')} className="text-sm text-blue-600 font-bold hover:underline">Alterar CEP</button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1,2,3].map(i => <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-3xl"></div>)}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔍</div>
            <p className="text-gray-500 font-medium">Nenhum profissional verificado nesta área ainda.</p>
            <button onClick={() => navigate('/express')} className="mt-6 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-200 transition">Tentar Express Match™</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {results.map(cleaner => {
                const approvedPortfolio = cleaner.portfolio?.filter(p => p.status === 'APPROVED') || [];
                return (
                  <div key={cleaner.id} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 flex flex-col hover:shadow-xl transition duration-300">
                    <div className="h-56 bg-gray-200 relative">
                      <img src={cleaner.photoUrl} className="w-full h-full object-cover" alt="" />
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {cleaner.status === 'VERIFIED' && <span className="bg-white/95 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">Verified</span>}
                        {approvedPortfolio.length > 0 && (
                             <button onClick={() => setSelectedPortfolio(approvedPortfolio)} className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide shadow-sm flex items-center gap-1 hover:bg-blue-700 transition">
                                 📸 Portfolio ({approvedPortfolio.length})
                             </button>
                        )}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 leading-tight">{cleaner.companyName || cleaner.fullName}</h3>
                          <LevelBadge level={cleaner.level} />
                        </div>
                        <div className="flex flex-col items-end">
                             <span className="font-black text-slate-900 flex items-center gap-1">
                                {cleaner.rating} <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                             </span>
                             <span className="text-[10px] text-gray-400">{cleaner.reviewCount} reviews</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-6">{cleaner.description}</p>
                      
                      <div className="mt-auto grid grid-cols-2 gap-3">
                        <a href={`tel:${cleaner.phone}`} className="bg-slate-900 hover:bg-black text-white text-center py-3 rounded-xl font-bold text-sm transition shadow-lg">Ligar</a>
                        <a href={`sms:${cleaner.phone}`} className="bg-white border hover:bg-gray-50 text-slate-700 text-center py-3 rounded-xl font-bold text-sm transition">Mensagem</a>
                      </div>
                    </div>
                  </div>
                );
            })}
          </div>
        )}
      </div>
      {selectedPortfolio && <PortfolioViewer items={selectedPortfolio} onClose={() => setSelectedPortfolio(null)} />}
    </div>
  );
};
export default CleanerSearch;

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const SERVICES_LIST = [
  { key: 'residential_cleaning', label: 'Limpeza Residencial (Standard)', icon: '🏠' },
  { key: 'recurring_cleaning_weekly', label: 'Limpeza Semanal', icon: '📅' },
  { key: 'recurring_cleaning_biweekly', label: 'Limpeza Quinzenal', icon: '🔄' },
  { key: 'recurring_cleaning_monthly', label: 'Limpeza Mensal', icon: '🗓️' },
  { key: 'deep_cleaning', label: 'Limpeza Pesada (Deep Clean)', icon: '🧽' },
  { key: 'move_in_out', label: 'Mudança (Move In / Out)', icon: '📦' },
  { key: 'office_cleaning', label: 'Limpeza de Escritório', icon: '🏢' },
  { key: 'commercial_cleaning', label: 'Limpeza Comercial', icon: '🏪' },
  { key: 'window_cleaning', label: 'Limpeza de Janelas', icon: '🪟' },
  { key: 'oven_cleaning', label: 'Limpeza de Forno', icon: '🍳' },
  { key: 'refrigerator_cleaning', label: 'Limpeza de Geladeira', icon: '❄️' },
  { key: 'carpet_cleaning', label: 'Limpeza de Tapetes/Carpetes', icon: '🧹' },
  { key: 'sofa_cleaning', label: 'Limpeza de Sofá', icon: '🛋️' },
  { key: 'deck_cleaning', label: 'Limpeza de Deck/Pátio', icon: '🪵' },
  { key: 'laundry_ironing', label: 'Lavar e Passar Roupa', icon: '🧺' },
  { key: 'mommy_helper', label: 'Mommy Helper', icon: '👶' },
  { key: 'elder_care', label: 'Cuidado com Idosos', icon: '👵' },
  { key: 'pet_care', label: 'Cuidado com Pets', icon: '🐕' },
  { key: 'express_cleaning', label: 'Limpeza Expressa', icon: '⚡' },
  { key: 'organization_service', label: 'Serviço de Organização', icon: '🗂️' },
  { key: 'babysitting', label: 'Babysitting', icon: '🍼' }
];

const CleanerServices: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('id');
  const { cleaners, updateCleanerProfile } = useAppContext();
  const navigate = useNavigate();

  const myProfile = cleaners.find(c => c.id === cleanerId);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (myProfile) {
        setSelectedKeys(myProfile.services || []);
    } else {
        navigate('/professional');
    }
  }, [myProfile, navigate]);

  const toggleService = (key: string) => {
      setSelectedKeys(prev => 
          prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKeys.length === 0) {
        alert("Por favor, selecione ao menos um serviço que você oferece.");
        return;
    }
    if (!cleanerId) return;

    updateCleanerProfile(cleanerId, {
        services: selectedKeys
    });

    navigate(`/setup-area?id=${cleanerId}`);
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="bg-slate-900 p-10 text-center text-white">
           <div className="flex justify-center mb-4">
               <div className="w-12 h-1 bg-green-500 rounded-full"></div>
               <div className="w-12 h-1 bg-green-500 mx-2 rounded-full"></div>
               <div className="w-12 h-1 bg-green-500 rounded-full"></div>
               <div className="w-12 h-1 bg-slate-700 mx-2 rounded-full"></div>
           </div>
           <h2 className="text-3xl font-black uppercase tracking-tighter">Serviços Oferecidos</h2>
           <p className="text-slate-400 mt-2">Selecione todos os serviços que você está disposta a realizar.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {SERVICES_LIST.map((s) => {
                const isActive = selectedKeys.includes(s.key);
                return (
                    <button
                        key={s.key}
                        type="button"
                        onClick={() => toggleService(s.key)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                            isActive 
                            ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md ring-1 ring-blue-600' 
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                        }`}
                    >
                        <span className="text-2xl">{s.icon}</span>
                        <span className="text-xs font-bold leading-tight uppercase tracking-tight">{s.label}</span>
                    </button>
                );
            })}
          </div>

          <div className="flex items-center justify-between p-6 bg-slate-900 rounded-3xl text-white">
              <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest">Selecionados</span>
                  <span className="text-2xl font-black">{selectedKeys.length} Serviços</span>
              </div>
              <button 
                type="submit" 
                className="bg-green-500 hover:bg-green-400 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition transform active:scale-95"
              >
                Salvar e Continuar
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CleanerServices;

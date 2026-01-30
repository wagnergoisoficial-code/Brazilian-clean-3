
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus } from '../types';

const RADIUS_OPTIONS = [
  { value: 5, label: '5 milhas', desc: 'Apenas vizinhança imediata' },
  { value: 10, label: '10 milhas', desc: 'Recomendado para início' },
  { value: 15, label: '15 milhas', desc: 'Maior alcance regional' },
  { value: 25, label: '25 milhas', desc: 'Atendimento estendido' },
];

const CleanerServiceArea: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('id');
  const { cleaners, updateCleanerProfile } = useAppContext();
  const navigate = useNavigate();
  const myProfile = cleaners.find(c => c.id === cleanerId);

  const [baseZip, setBaseZip] = useState('');
  const [radius, setRadius] = useState(10);
  const [manualZipInput, setManualZipInput] = useState('');
  const [manualZips, setManualZips] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (myProfile) {
        setBaseZip(myProfile.baseZip || '');
        setRadius(myProfile.serviceRadius || 10);
        setManualZips(myProfile.zipCodes || []);
    } else { 
        navigate('/join'); 
    }
  }, [myProfile, navigate]);

  const addManualZip = () => {
      const val = manualZipInput.trim().substring(0,5);
      if (val.length === 5 && !manualZips.includes(val)) {
          setManualZips([...manualZips, val]);
          setManualZipInput('');
      }
  };

  const removeManualZip = (zip: string) => setManualZips(manualZips.filter(z => z !== zip));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanerId) return;
    
    const cleanBase = baseZip.trim().substring(0, 5);
    if (cleanBase.length < 5) return alert("Por favor, insira seu ZIP Code base.");

    setIsSaving(true);
    
    setTimeout(() => {
        updateCleanerProfile(cleanerId, { 
            baseZip: cleanBase,
            serviceRadius: radius,
            zipCodes: manualZips,
            status: CleanerStatus.DOCUMENTS_PENDING
        });
        
        setIsSaving(false);
        navigate(`/verify-documents?id=${cleanerId}`);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header Header */}
        <div className="bg-slate-900 py-10 px-8 text-center text-white">
           <div className="flex justify-center mb-4 gap-1">
               <div className="w-10 h-1 bg-green-500 rounded-full"></div>
               <div className="w-10 h-1 bg-green-500 rounded-full"></div>
               <div className="w-10 h-1 bg-green-500 rounded-full"></div>
               <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
           </div>
           <h2 className="text-3xl font-black uppercase tracking-tighter">Área de Atendimento</h2>
           <p className="text-slate-400 mt-2 text-sm">Defina onde você deseja encontrar clientes.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          
          {/* Section 1: Base ZIP */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
                 <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                 <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Localização Central</h3>
             </div>
             <p className="text-xs text-slate-500 mb-4 leading-relaxed">Qual o seu ZIP Code principal? Geralmente onde você mora ou inicia o dia.</p>
             <input 
                type="text" 
                maxLength={5} 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 outline-none focus:border-blue-500 transition text-3xl font-black tracking-widest text-center" 
                value={baseZip} 
                onChange={e => setBaseZip(e.target.value.replace(/\D/g,''))} 
                placeholder="00000" 
             />
          </div>

          {/* Section 2: Radius */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
                 <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                 <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Raio de Atendimento</h3>
             </div>
             <p className="text-xs text-slate-500 mb-6 leading-relaxed">Até que distância do seu ZIP Code base você está disposta a dirigir?</p>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 {RADIUS_OPTIONS.map(opt => (
                     <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRadius(opt.value)}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${radius === opt.value ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                     >
                         <span className="font-black text-sm">{opt.value}</span>
                         <span className="text-[10px] font-bold uppercase tracking-tighter opacity-80">Milhas</span>
                     </button>
                 ))}
             </div>
             <div className="bg-blue-50 p-4 rounded-xl mt-4">
                 <p className="text-[11px] text-blue-700 font-medium text-center italic">
                    "Você aparecerá para clientes em um círculo de {radius} milhas ao redor de {baseZip || 'seu ZIP'}."
                 </p>
             </div>
          </div>

          {/* Section 3: Manual Zips */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
             <div className="flex items-center gap-2 mb-2">
                 <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                 <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">ZIPs Específicos (Opcional)</h3>
             </div>
             <p className="text-xs text-slate-500 mb-4 leading-relaxed">Deseja adicionar áreas fora do seu raio automático? Digite o ZIP abaixo.</p>
             
             <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={5} 
                  className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-blue-500 transition font-bold" 
                  value={manualZipInput} 
                  onChange={e => setManualZipInput(e.target.value.replace(/\D/g,''))} 
                  placeholder="Ex: 32801" 
                />
                <button 
                    type="button" 
                    onClick={addManualZip} 
                    className="bg-slate-900 text-white px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition active:scale-95"
                >
                    Adicionar
                </button>
             </div>

             <div className="flex flex-wrap gap-2 mt-4">
                 {manualZips.map(z => (
                     <span key={z} className="bg-slate-900 text-white pl-4 pr-2 py-2 rounded-xl font-bold flex items-center gap-2 border border-slate-800 animate-fade-in text-xs">
                         {z}
                         <button type="button" onClick={() => removeManualZip(z)} className="text-slate-400 hover:text-red-400 w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center transition">✕</button>
                     </span>
                 ))}
                 {manualZips.length === 0 && <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest py-2">Nenhuma área extra adicionada</span>}
             </div>
          </div>

          {/* Action Button */}
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSaving ? (
                <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Salvando Configurações...
                </>
            ) : 'Salvar e Ir para Verificação'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CleanerServiceArea;

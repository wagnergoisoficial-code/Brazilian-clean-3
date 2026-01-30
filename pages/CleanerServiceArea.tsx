
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus } from '../types';

const CleanerServiceArea: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('id');
  const { cleaners, updateCleanerProfile } = useAppContext();
  const navigate = useNavigate();
  const myProfile = cleaners.find(c => c.id === cleanerId);

  const [zipInput, setZipInput] = useState('');
  const [zips, setZips] = useState<string[]>([]);

  useEffect(() => {
    if (myProfile) {
        setZips(myProfile.zipCodes || []);
    } else { navigate('/join'); }
  }, [myProfile, navigate]);

  const addZip = () => {
      const val = zipInput.trim().substring(0,5);
      if (val.length === 5 && !zips.includes(val)) {
          setZips([...zips, val]);
          setZipInput('');
      }
  };

  const removeZip = (zip: string) => setZips(zips.filter(z => z !== zip));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanerId || zips.length === 0) return alert("Selecione ao menos um CEP de atendimento.");
    
    updateCleanerProfile(cleanerId, { 
        zipCodes: zips,
        status: CleanerStatus.DOCUMENTS_PENDING
    });
    
    navigate(`/verify-documents?id=${cleanerId}`);
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="bg-slate-900 py-12 px-8 text-center text-white">
           <div className="flex justify-center mb-4">
               <div className="w-12 h-1 bg-green-500 rounded-full"></div>
               <div className="w-12 h-1 bg-green-500 mx-2 rounded-full"></div>
               <div className="w-12 h-1 bg-green-500 mx-2 rounded-full"></div>
               <div className="w-12 h-1 bg-green-500 mx-2 rounded-full"></div>
           </div>
           <h2 className="text-3xl font-black uppercase tracking-tighter">Área de Atendimento</h2>
           <p className="text-slate-400 mt-2">Em quais ZIP codes você atende?</p>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <label className="block text-xs font-black uppercase text-slate-400">Adicionar ZIP Code</label>
            <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={5} 
                  className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-500 transition" 
                  value={zipInput} 
                  onChange={e => setZipInput(e.target.value.replace(/\D/g,''))} 
                  placeholder="Ex: 32801" 
                />
                <button onClick={addZip} className="bg-slate-900 text-white px-6 rounded-2xl font-bold">Add</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
              {zips.map(z => (
                  <span key={z} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-blue-100 animate-fade-in">
                      {z}
                      <button onClick={() => removeZip(z)} className="text-blue-300 hover:text-red-500">✕</button>
                  </span>
              ))}
          </div>
          <button onClick={handleSubmit} className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-green-700 transition">Salvar e Continuar</button>
        </div>
      </div>
    </div>
  );
};
export default CleanerServiceArea;

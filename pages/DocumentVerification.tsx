
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus } from '../types';
import { performIdentityVerification } from '../services/geminiService';

const DocumentVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('id');
  const { cleaners, updateCleanerProfile } = useAppContext();
  const navigate = useNavigate();

  const myProfile = cleaners.find(c => c.id === cleanerId);

  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!myProfile) {
        navigate('/join');
    }
  }, [myProfile, navigate]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = () => setter(reader.result as string);
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleVerify = async () => {
    if (!idPhoto || !selfiePhoto || !myProfile || !cleanerId) return;

    setIsVerifying(true);
    try {
        const aiResult = await performIdentityVerification(idPhoto, selfiePhoto, { 
            fullName: myProfile.fullName, 
            email: myProfile.email 
        });

        updateCleanerProfile(cleanerId, {
            documentUrl: idPhoto,
            selfieUrl: selfiePhoto,
            aiVerificationResult: aiResult,
            status: CleanerStatus.UNDER_REVIEW // Flow complete: "Em análise"
        });

        // Small delay for UI smoothness
        setTimeout(() => {
            navigate('/dashboard');
        }, 1500);

    } catch (err) {
        alert("Erro na validação de documentos. Tente novamente.");
        setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="bg-slate-900 p-10 text-center text-white">
           <div className="flex justify-center mb-4">
               <div className="w-12 h-1 bg-green-500 rounded-full"></div>
               <div className="w-12 h-1 bg-green-500 mx-2 rounded-full"></div>
               <div className="w-12 h-1 bg-green-500 rounded-full"></div>
           </div>
           <h2 className="text-3xl font-black uppercase tracking-tighter">Verificação de Identidade</h2>
           <p className="text-slate-400 mt-2">Segurança em primeiro lugar. Precisamos validar seus documentos.</p>
        </div>

        <div className="p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ID UPLOAD */}
                <div className="space-y-4">
                    <label className="block text-xs font-black uppercase text-slate-400">Documento Oficial (Frente)</label>
                    <div className="relative group">
                        <div className={`h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 ${idPhoto ? 'border-green-500' : 'border-slate-200 group-hover:border-blue-400'}`}>
                            {idPhoto ? (
                                <img src={idPhoto} className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Anexar Documento</span>
                                </>
                            )}
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => handleFile(e, setIdPhoto)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                {/* SELFIE UPLOAD */}
                <div className="space-y-4">
                    <label className="block text-xs font-black uppercase text-slate-400">Sua Selfie</label>
                    <div className="relative group">
                        <div className={`h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 ${selfiePhoto ? 'border-green-500' : 'border-slate-200 group-hover:border-blue-400'}`}>
                            {selfiePhoto ? (
                                <img src={selfiePhoto} className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tirar uma Selfie</span>
                                </>
                            )}
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            capture="user"
                            onChange={e => handleFile(e, setSelfiePhoto)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                </div>
                <div>
                    <h4 className="text-sm font-bold">Guardian AI Security</h4>
                    <p className="text-[11px] text-slate-400">Nossa IA validará suas fotos em tempo real para garantir que seus dados estão seguros e protegidos.</p>
                </div>
            </div>

            <button 
                onClick={handleVerify}
                disabled={!idPhoto || !selfiePhoto || isVerifying}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
                {isVerifying ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processando com IA...
                    </>
                ) : 'Concluir Verificação'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentVerification;

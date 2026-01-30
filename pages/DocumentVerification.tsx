
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

  // wizard step state
  const [step, setStep] = useState(1);
  const [assets, setAssets] = useState({
      docFront: '',
      docBack: '',
      facePhoto: '',
      selfieWithDoc: ''
  });
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!myProfile) {
        navigate('/join');
    }
  }, [myProfile, navigate]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof assets) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = () => setAssets(prev => ({ ...prev, [field]: reader.result as string }));
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleNext = () => {
      if (step === 1 && (!assets.docFront || !assets.docBack)) return alert("Por favor, envie a frente e o verso do seu documento.");
      if (step === 2 && !assets.facePhoto) return alert("Por favor, tire uma foto clara do seu rosto.");
      setStep(step + 1);
  };

  const handleVerify = async () => {
    if (!assets.docFront || !assets.docBack || !assets.facePhoto || !assets.selfieWithDoc || !myProfile || !cleanerId) return;

    setIsVerifying(true);
    try {
        const aiResult = await performIdentityVerification(assets, { 
            fullName: myProfile.fullName, 
            email: myProfile.email 
        });

        updateCleanerProfile(cleanerId, {
            documentFrontUrl: assets.docFront,
            documentBackUrl: assets.docBack,
            facePhotoUrl: assets.facePhoto,
            selfieWithDocUrl: assets.selfieWithDoc,
            aiVerificationResult: aiResult,
            status: CleanerStatus.UNDER_REVIEW
        });

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
        <div className="bg-slate-900 p-8 text-center text-white">
           <div className="flex justify-center gap-1 mb-6">
               {[1, 2, 3].map(s => (
                   <div key={s} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= s ? 'bg-green-500' : 'bg-slate-700'}`}></div>
               ))}
           </div>
           <h2 className="text-2xl font-black uppercase tracking-tighter">
               {step === 1 ? 'Documento Oficial' : step === 2 ? 'Foto de Rosto' : 'Validação Final'}
           </h2>
           <p className="text-slate-400 text-sm mt-1">
               {step === 1 ? 'Frente e verso do seu documento (DL, Passaporte ou RG)' : step === 2 ? 'Foto clara e frontal do seu rosto' : 'Selfie segurando o documento ao lado do rosto'}
           </p>
        </div>

        <div className="p-10">
            {step === 1 && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Documento: Frente</label>
                            <div className="relative group">
                                <div className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 ${assets.docFront ? 'border-green-500' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.docFront ? <img src={assets.docFront} className="w-full h-full object-cover" /> : <span className="text-3xl">🪪</span>}
                                </div>
                                <input type="file" accept="image/*" onChange={e => handleFile(e, 'docFront')} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Documento: Verso</label>
                            <div className="relative group">
                                <div className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 ${assets.docBack ? 'border-green-500' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.docBack ? <img src={assets.docBack} className="w-full h-full object-cover" /> : <span className="text-3xl">🔙</span>}
                                </div>
                                <input type="file" accept="image/*" onChange={e => handleFile(e, 'docBack')} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                    <button onClick={handleNext} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl">Continuar para Passo 2</button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-8 animate-fade-in">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center block">Foto Profissional do Rosto</label>
                        <div className="relative group max-w-xs mx-auto">
                            <div className={`h-64 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 aspect-square mx-auto ${assets.facePhoto ? 'border-green-500' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                {assets.facePhoto ? <img src={assets.facePhoto} className="w-full h-full object-cover" /> : <span className="text-4xl">📸</span>}
                            </div>
                            <input type="file" accept="image/*" capture="user" onChange={e => handleFile(e, 'facePhoto')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <p className="text-center text-[11px] text-slate-400">Certifique-se de que seu rosto está bem iluminado e sem óculos de sol ou chapéus.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setStep(1)} className="flex-1 bg-slate-50 text-slate-400 py-5 rounded-2xl font-black uppercase tracking-widest text-sm">Voltar</button>
                        <button onClick={handleNext} className="flex-[2] bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl">Passo Final</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-8 animate-fade-in text-center">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Selfie Segurando o Documento</label>
                        <div className="relative group max-w-sm mx-auto">
                            <div className={`h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 ${assets.selfieWithDoc ? 'border-green-500' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                {assets.selfieWithDoc ? <img src={assets.selfieWithDoc} className="w-full h-full object-cover" /> : <span className="text-4xl">🤳</span>}
                            </div>
                            <input type="file" accept="image/*" capture="user" onChange={e => handleFile(e, 'selfieWithDoc')} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Segure seu documento ao lado do seu rosto, sem cobrir nenhuma informação importante.</p>
                    </div>

                    <div className="bg-blue-50 text-blue-800 p-6 rounded-2xl flex items-center gap-4 text-left border border-blue-100">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase">Guardian AI Bio-Check</h4>
                            <p className="text-[10px] opacity-80 mt-0.5">Nossa IA cruzará os dados biométricos das 4 imagens para autenticar sua identidade instantaneamente.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setStep(2)} className="flex-1 bg-slate-50 text-slate-400 py-5 rounded-2xl font-black uppercase tracking-widest text-sm">Voltar</button>
                        <button 
                            onClick={handleVerify}
                            disabled={!assets.selfieWithDoc || isVerifying}
                            className="flex-[2] bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isVerifying ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Autenticando...
                                </>
                            ) : 'Finalizar e Enviar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DocumentVerification;

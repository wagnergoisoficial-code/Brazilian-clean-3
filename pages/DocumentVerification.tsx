
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus, AiVerificationResult } from '../types';
import { performIdentityVerification } from '../services/geminiService';

interface ImageEditorProps {
  imageSrc: string;
  aspectRatio: number; // width / height
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
  title: string;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, aspectRatio, onConfirm, onCancel, title }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  }, [imageSrc]);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleEnd = () => setIsDragging(false);

  const handleConfirm = () => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetWidth = 1280;
    const targetHeight = targetWidth / aspectRatio;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const rect = containerRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();

    const displayedWidth = imgRect.width;
    const displayedHeight = imgRect.height;

    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;

    const scaleX = naturalWidth / displayedWidth;
    const scaleY = naturalHeight / displayedHeight;

    const sx = (rect.left - imgRect.left) * scaleX;
    const sy = (rect.top - imgRect.top) * scaleY;
    const sWidth = rect.width * scaleX;
    const sHeight = rect.height * scaleY;

    ctx.drawImage(
      imageRef.current,
      sx, sy, sWidth, sHeight,
      0, 0, targetWidth, targetHeight
    );

    onConfirm(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div key="editor-portal" className="fixed inset-0 bg-slate-900/95 z-[100] flex flex-col items-center justify-center p-4 animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-900 transition p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <p className="text-xs text-slate-500 font-medium text-center">Arraste e use o zoom para enquadrar o documento perfeitamente.</p>
          
          <div className="relative w-full aspect-[3/2] bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200">
            <div className="absolute inset-0 z-10 pointer-events-none border-[15px] border-slate-900/50">
              <div 
                ref={containerRef}
                className="w-full h-full border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(15,23,42,0.4)]"
              ></div>
            </div>

            <img
              ref={imageRef}
              src={imageSrc}
              alt="Adjustment"
              draggable={false}
              onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
              onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={handleEnd}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                cursor: isDragging ? 'grabbing' : 'grab',
                maxWidth: 'none',
                maxHeight: 'none',
                width: 'auto',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            />
          </div>

          <div className="flex gap-4 items-center justify-center">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-3 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <span className="text-xs font-black text-slate-400 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-3 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button type="button" onClick={onCancel} className="bg-slate-50 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200">Cancelar</button>
            <button type="button" onClick={handleConfirm} className="bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-green-700 transition">Salvar Enquadramento</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('id');
  const { cleaners, updateCleanerProfile, authenticatedCleanerId } = useAppContext();
  const navigate = useNavigate();

  // Use the ID from params or the authenticated one
  const targetId = cleanerId || authenticatedCleanerId;
  const myProfile = cleaners.find(c => c.id === targetId);

  const [step, setStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<AiVerificationResult | null>(null);
  
  const [editingField, setEditingField] = useState<'docFront' | 'docBack' | 'facePhoto' | 'selfieWithDoc' | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);

  // Sync assets from profile to local state to allow persistence across reloads
  const [assets, setAssets] = useState({
      docFront: myProfile?.documentFrontUrl || '',
      docBack: myProfile?.documentBackUrl || '',
      facePhoto: myProfile?.facePhotoUrl || '',
      selfieWithDoc: myProfile?.selfieWithDocUrl || ''
  });

  useEffect(() => {
    if (!myProfile && !targetId) { 
        navigate('/join'); 
    }
  }, [myProfile, targetId, navigate]);

  // Update internal assets state if profile changes (hydration)
  useEffect(() => {
      if (myProfile) {
          setAssets({
              docFront: myProfile.documentFrontUrl || '',
              docBack: myProfile.documentBackUrl || '',
              facePhoto: myProfile.facePhotoUrl || '',
              selfieWithDoc: myProfile.selfieWithDocUrl || ''
          });
      }
  }, [myProfile]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof assets) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        // Basic check for file size (e.g., 5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            alert("A imagem é muito grande. Por favor, escolha um arquivo menor que 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          setTempImage(reader.result as string);
          setEditingField(field);
        };
        reader.readAsDataURL(file);
    }
  };

  const onCropConfirm = (croppedBase64: string) => {
    if (editingField && targetId) { 
        // 1. Update local state
        const newAssets = { ...assets, [editingField]: croppedBase64 };
        setAssets(newAssets);

        // 2. Persist to AppContext/Storage IMMEDIATELY
        const profileUpdate: Partial<any> = {};
        if (editingField === 'docFront') profileUpdate.documentFrontUrl = croppedBase64;
        if (editingField === 'docBack') profileUpdate.documentBackUrl = croppedBase64;
        if (editingField === 'facePhoto') profileUpdate.facePhotoUrl = croppedBase64;
        if (editingField === 'selfieWithDoc') profileUpdate.selfieWithDocUrl = croppedBase64;
        
        updateCleanerProfile(targetId, profileUpdate);
    }
    setEditingField(null);
    setTempImage(null);
  };

  const handleNextStep = () => {
      if (step === 1) {
          if (!assets.docFront || !assets.docBack) return alert("Por favor, envie a frente e o verso do seu documento.");
          setStep(2);
      } else if (step === 2) {
          if (!assets.facePhoto) return alert("Por favor, tire uma foto clara do seu rosto.");
          setStep(3);
      }
  };

  const handleFinalSubmission = async () => {
    if (!assets.docFront || !assets.docBack || !assets.facePhoto || !assets.selfieWithDoc || !myProfile || !targetId) {
        alert("Por favor, complete todas as etapas de captura antes de enviar.");
        return;
    }

    setIsVerifying(true);
    setVerificationFeedback(null);
    
    try {
        // Mocking biometric analysis (v2.3.0 Logic)
        const aiResult = await performIdentityVerification({
            docFront: assets.docFront,
            docBack: assets.docBack,
            facePhoto: assets.facePhoto,
            selfieWithDoc: assets.selfieWithDoc
        }, { 
            fullName: myProfile.fullName, 
            email: myProfile.email 
        });

        if (aiResult.verification_status === "LIKELY_FRAUD") {
            setVerificationFeedback(aiResult);
            setIsVerifying(false);
            return;
        }

        // Final state transition
        updateCleanerProfile(targetId, {
            status: CleanerStatus.UNDER_REVIEW,
            aiVerificationResult: aiResult
        });

        // Delay navigation to ensure state is settled and prevent removeChild Node error
        setTimeout(() => navigate('/dashboard'), 500);

    } catch (err) {
        console.error("AI Guardian Exception:", err);
        // Safety fallback: Proceed to manual review if AI fails
        updateCleanerProfile(targetId, { status: CleanerStatus.UNDER_REVIEW });
        setTimeout(() => navigate('/dashboard'), 500);
    } finally {
        setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans overflow-x-hidden">
      {/* Portaled Image Editor for better Z-index handling and DOM stability */}
      {editingField && tempImage && (
        <ImageEditor 
          key={`editor-${editingField}`}
          imageSrc={tempImage}
          title={editingField.includes('doc') ? 'Enquadrar Documento' : 'Enquadrar Rosto'}
          aspectRatio={editingField === 'facePhoto' ? 1 : 3/2}
          onConfirm={onCropConfirm}
          onCancel={() => { setEditingField(null); setTempImage(null); }}
        />
      )}

      <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl overflow-hidden animate-scale-in border border-slate-100">
        <div className="bg-slate-900 p-8 text-center text-white relative">
           <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
              <div 
                className="h-full bg-green-500 transition-all duration-700" 
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
           </div>

           <div className="flex justify-center gap-2 mb-6">
               {[1, 2, 3].map(s => (
                   <div key={`dot-${s}`} className={`h-1.5 w-8 rounded-full transition-all ${step >= s ? 'bg-green-500' : 'bg-slate-700'}`}></div>
               ))}
           </div>

           <h2 className="text-3xl font-black uppercase tracking-tighter">
               {step === 1 ? 'Identidade' : step === 2 ? 'Foto de Perfil' : 'Biometria'}
           </h2>
           <p className="text-slate-400 text-sm mt-1 font-medium">
               {step === 1 ? 'Envie as fotos do seu documento oficial (DL/Passaporte)' : step === 2 ? 'Uma foto clara do seu rosto para o seu perfil' : 'Segure o documento próximo ao rosto'}
           </p>
        </div>

        <div className="p-10">
            {verificationFeedback && (
                <div key="feedback-msg" className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-3xl animate-fade-in">
                    <div className="flex items-center gap-3 mb-2">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                        <h3 className="text-red-700 font-black uppercase text-xs">Problema na Verificação Automática</h3>
                    </div>
                    <p className="text-red-600 font-bold text-sm mb-1">{verificationFeedback.user_reason_pt}</p>
                    <p className="text-red-500 text-xs italic">{verificationFeedback.user_instruction_pt}</p>
                </div>
            )}

            {step === 1 && (
                <div key="view-step-1" className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Frente do Documento</label>
                            <div className="relative group aspect-[3/2]">
                                <div className={`w-full h-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 ${assets.docFront ? 'border-green-500 shadow-lg shadow-green-100' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.docFront ? (
                                        <img src={assets.docFront} className="w-full h-full object-cover" alt="Frente" />
                                    ) : (
                                        <div className="text-center">
                                            <span className="text-4xl block mb-2">🪪</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Selecionar Foto</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" accept="image/*" onChange={e => handleFile(e, 'docFront')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Selecione a frente" />
                                {assets.docFront && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg z-30 pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Verso do Documento</label>
                            <div className="relative group aspect-[3/2]">
                                <div className={`w-full h-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 ${assets.docBack ? 'border-green-500 shadow-lg shadow-green-100' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.docBack ? (
                                        <img src={assets.docBack} className="w-full h-full object-cover" alt="Verso" />
                                    ) : (
                                        <div className="text-center">
                                            <span className="text-4xl block mb-2">🔙</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Selecionar Foto</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" accept="image/*" onChange={e => handleFile(e, 'docBack')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Selecione o verso" />
                                {assets.docBack && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg z-30 pointer-events-none">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-6">
                        <button 
                            type="button"
                            onClick={handleNextStep} 
                            disabled={!assets.docFront || !assets.docBack}
                            className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            Confirmar e Continuar
                        </button>
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase mt-4 tracking-wider">🔒 Encriptado e Seguro</p>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div key="view-step-2" className="space-y-8 animate-fade-in">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center block">Sua Melhor Foto (Rosto)</label>
                        <div className="relative group max-w-xs mx-auto">
                            <div className={`aspect-square rounded-full border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 shadow-inner ${assets.facePhoto ? 'border-green-500 ring-8 ring-green-50' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                {assets.facePhoto ? (
                                    <img src={assets.facePhoto} className="w-full h-full object-cover" alt="Rosto" />
                                ) : (
                                    <div className="text-center">
                                        <span className="text-5xl block mb-2">📸</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Tirar ou Enviar</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/*" capture="user" onChange={e => handleFile(e, 'facePhoto')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Tire uma foto" />
                            {assets.facePhoto && (
                                <div className="absolute bottom-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-2xl z-30 border-4 border-white">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                        </div>
                        <p className="text-center text-xs text-slate-400 italic">Esta foto será exibida no seu perfil público para os clientes.</p>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setStep(1)} className="flex-1 bg-slate-50 text-slate-400 py-5 rounded-[24px] font-black uppercase tracking-widest text-sm border border-slate-100">Voltar</button>
                        <button 
                            type="button"
                            onClick={handleNextStep} 
                            disabled={!assets.facePhoto}
                            className="flex-[2] bg-slate-900 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all disabled:opacity-30 transform active:scale-95"
                        >
                            Usar Esta Foto
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div key="view-step-3" className="space-y-8 animate-fade-in text-center">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Selfie de Segurança</label>
                        <div className="relative group max-w-sm mx-auto">
                            <div className={`aspect-[3/4] rounded-[40px] border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 ${assets.selfieWithDoc ? 'border-green-500 shadow-xl' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                {assets.selfieWithDoc ? (
                                    <img src={assets.selfieWithDoc} className="w-full h-full object-cover" alt="Selfie com documento" />
                                ) : (
                                    <div className="text-center p-8">
                                        <span className="text-5xl block mb-4">🤳</span>
                                        <p className="text-xs font-bold text-slate-500 mb-2">Tire uma selfie segurando o documento ao lado do seu rosto.</p>
                                        <span className="inline-block bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-md">Abrir Câmera</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/*" capture="user" onChange={e => handleFile(e, 'selfieWithDoc')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Tire a selfie" />
                            {assets.selfieWithDoc && (
                                <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full shadow-lg z-30">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button 
                            type="button"
                            onClick={handleFinalSubmission}
                            disabled={!assets.selfieWithDoc || isVerifying}
                            className="w-full bg-green-600 text-white py-6 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all transform active:scale-95"
                        >
                            {isVerifying ? (
                                <>
                                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Validando Documentos...
                                </>
                            ) : 'Finalizar e Enviar Para Análise'}
                        </button>
                        <button type="button" onClick={() => setStep(2)} className="text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition p-2">Voltar para Etapa Anterior</button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DocumentVerification;

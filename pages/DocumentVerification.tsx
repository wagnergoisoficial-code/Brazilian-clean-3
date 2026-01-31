
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
  // Fix: Initialize dragStart with default values to avoid 'clientX/clientY' not found errors at component initialization
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

    // Explicit conversion to Base64 to simulate file upload preparation
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
          <p className="text-xs text-slate-500 font-medium text-center">Arraste a foto e use o zoom para enquadrar o documento.</p>
          
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

          <div className="flex gap-6 items-center justify-center">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-3 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-sm transition">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <div className="text-center">
                <span className="text-[10px] font-black text-slate-400 uppercase block">Zoom</span>
                <span className="text-sm font-black text-slate-900">{Math.round(scale * 100)}%</span>
            </div>
            <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-3 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-sm transition">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button type="button" onClick={onCancel} className="bg-slate-50 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200 hover:bg-slate-100 transition">Cancelar</button>
            <button type="button" onClick={handleConfirm} className="bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-blue-700 transition transform active:scale-95">Salvar Enquadramento</button>
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

  const targetId = cleanerId || authenticatedCleanerId;
  const myProfile = cleaners.find(c => c.id === targetId);

  const [step, setStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<AiVerificationResult | null>(null);
  
  const [editingField, setEditingField] = useState<'docFront' | 'docBack' | 'facePhoto' | 'selfieWithDoc' | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);

  // Load existing assets from profile if available
  const [assets, setAssets] = useState({
      docFront: '',
      docBack: '',
      facePhoto: '',
      selfieWithDoc: ''
  });

  useEffect(() => {
    if (!myProfile && !targetId) { navigate('/join'); }
    if (myProfile) {
        setAssets({
            docFront: myProfile.documentFrontUrl || '',
            docBack: myProfile.documentBackUrl || '',
            facePhoto: myProfile.facePhotoUrl || '',
            selfieWithDoc: myProfile.selfieWithDocUrl || ''
        });
    }
  }, [myProfile, targetId, navigate]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof assets) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 10 * 1024 * 1024) return alert("Arquivo muito grande. Limite: 10MB");

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
        // 1. Update local state for immediate UI feedback
        const newAssets = { ...assets, [editingField]: croppedBase64 };
        setAssets(newAssets);

        // 2. Persist to profile IMMEDIATELY
        const updateObj: any = {};
        if (editingField === 'docFront') updateObj.documentFrontUrl = croppedBase64;
        if (editingField === 'docBack') updateObj.documentBackUrl = croppedBase64;
        if (editingField === 'facePhoto') updateObj.facePhotoUrl = croppedBase64;
        if (editingField === 'selfieWithDoc') updateObj.selfieWithDocUrl = croppedBase64;
        
        updateCleanerProfile(targetId, updateObj);
    }
    setEditingField(null);
    setTempImage(null);
  };

  const handleNext = () => {
      if (step === 1 && (!assets.docFront || !assets.docBack)) return alert("Por favor, envie a frente e o verso do documento.");
      if (step === 2 && !assets.facePhoto) return alert("Por favor, tire uma foto clara do seu rosto.");
      setStep(prev => prev + 1);
  };

  const handleFinalSubmission = async () => {
    if (!assets.docFront || !assets.docBack || !assets.facePhoto || !assets.selfieWithDoc || !myProfile || !targetId) {
        return alert("Por favor, preencha todos os campos obrigatórios.");
    }

    setIsVerifying(true);
    setVerificationFeedback(null);
    
    try {
        const aiResult = await performIdentityVerification(assets, { 
            fullName: myProfile.fullName, 
            email: myProfile.email 
        });

        if (aiResult.verification_status === "LIKELY_FRAUD") {
            setVerificationFeedback(aiResult);
            setIsVerifying(false);
            return;
        }

        updateCleanerProfile(targetId, {
            status: CleanerStatus.UNDER_REVIEW,
            aiVerificationResult: aiResult
        });

        // Safe transition delay to prevent removeChild Node error
        setTimeout(() => navigate('/dashboard'), 600);

    } catch (err) {
        console.error("Critical AI Processing Error:", err);
        // Fallback: Proceed to manual review if AI service fails
        updateCleanerProfile(targetId, { status: CleanerStatus.UNDER_REVIEW });
        setTimeout(() => navigate('/dashboard'), 600);
    } finally {
        setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans overflow-x-hidden">
      {editingField && tempImage && (
        <ImageEditor 
          key={`editor-overlay-${editingField}`}
          imageSrc={tempImage}
          title={editingField.includes('doc') ? 'Enquadrar Documento' : 'Enquadrar Perfil'}
          aspectRatio={editingField === 'facePhoto' ? 1 : 3/2}
          onConfirm={onCropConfirm}
          onCancel={() => { setEditingField(null); setTempImage(null); }}
        />
      )}

      <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl overflow-hidden animate-scale-in border border-slate-100">
        <div className="bg-slate-900 p-10 text-center text-white relative">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
              <div 
                className="h-full bg-green-500 transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(34,197,94,0.5)]" 
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
           </div>

           <div className="flex justify-center gap-3 mb-6">
               {[1, 2, 3].map(s => (
                   <div key={`step-dot-${s}`} className={`h-1.5 w-10 rounded-full transition-all duration-500 ${step >= s ? 'bg-green-500' : 'bg-slate-700'}`}></div>
               ))}
           </div>

           <h2 className="text-3xl font-black uppercase tracking-tighter">
               {step === 1 ? 'Sua Identidade' : step === 2 ? 'Foto Profissional' : 'Biometria Facial'}
           </h2>
           <p className="text-slate-400 text-sm mt-1 font-medium">
               {step === 1 ? 'Envie fotos legíveis do seu ID ou Driver License' : step === 2 ? 'Sua foto principal que os clientes verão' : 'Validação de segurança em tempo real'}
           </p>
        </div>

        <div className="p-10">
            {verificationFeedback && (
                <div key="error-feedback" className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-3xl animate-fade-in flex gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                        <h3 className="text-red-700 font-black uppercase text-xs mb-1">Ajuste Necessário:</h3>
                        <p className="text-red-600 font-bold text-sm mb-1">{verificationFeedback.user_reason_pt}</p>
                        <p className="text-red-500 text-xs italic opacity-80">{verificationFeedback.user_instruction_pt}</p>
                    </div>
                </div>
            )}

            {step === 1 && (
                <div key="view-identity" className="space-y-10 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Frente do ID</label>
                                {assets.docFront && <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Salva ✓</span>}
                            </div>
                            <div className="relative group aspect-[3/2]">
                                <div className={`w-full h-full rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-slate-50 ${assets.docFront ? 'border-green-500 shadow-xl shadow-green-100/50' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.docFront ? (
                                        <img src={assets.docFront} className="w-full h-full object-cover" alt="ID Frente" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm text-2xl">🪪</div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase block tracking-tighter">Clique para Tirar Foto</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" accept="image/*" onChange={e => handleFile(e, 'docFront')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Upload frente" />
                                {assets.docFront && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center z-30 rounded-[32px] pointer-events-none">
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest bg-blue-600 px-4 py-2 rounded-full">Substituir Foto</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Verso do ID</label>
                                {assets.docBack && <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Salva ✓</span>}
                            </div>
                            <div className="relative group aspect-[3/2]">
                                <div className={`w-full h-full rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-slate-50 ${assets.docBack ? 'border-green-500 shadow-xl shadow-green-100/50' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.docBack ? (
                                        <img src={assets.docBack} className="w-full h-full object-cover" alt="ID Verso" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm text-2xl">🔙</div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase block tracking-tighter">Clique para Tirar Foto</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" accept="image/*" onChange={e => handleFile(e, 'docBack')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Upload verso" />
                                {assets.docBack && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center z-30 rounded-[32px] pointer-events-none">
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest bg-blue-600 px-4 py-2 rounded-full">Substituir Foto</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-slate-50">
                        <button 
                            type="button"
                            onClick={handleNext} 
                            disabled={!assets.docFront || !assets.docBack}
                            className="w-full bg-slate-900 text-white py-6 rounded-[28px] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-black transition-all disabled:opacity-20 disabled:cursor-not-allowed transform active:scale-95 flex items-center justify-center gap-3"
                        >
                            Confirmar e Salvar Documentos
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        </button>
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase mt-4 tracking-widest flex items-center justify-center gap-2">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                            Processamento Seguro de Dados
                        </p>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div key="view-face" className="space-y-10 animate-fade-in">
                    <div className="space-y-4">
                        <div className="text-center">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">Sua Foto de Perfil</label>
                            <div className="relative group max-w-[280px] mx-auto">
                                <div className={`aspect-square rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-slate-50 ${assets.facePhoto ? 'border-green-500 ring-8 ring-green-50 shadow-2xl shadow-green-100' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.facePhoto ? (
                                        <img src={assets.facePhoto} className="w-full h-full object-cover" alt="Face" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <div className="text-5xl mb-4">📸</div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tirar Selfie</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" accept="image/*" capture="user" onChange={e => handleFile(e, 'facePhoto')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Tirar foto" />
                                {assets.facePhoto && (
                                    <div className="absolute bottom-4 right-4 bg-green-500 text-white p-2.5 rounded-full shadow-2xl z-30 border-4 border-white pointer-events-none">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-center text-xs text-slate-400 italic max-w-sm mx-auto leading-relaxed">Dica: Procure um local bem iluminado e retire acessórios como óculos de sol ou boné.</p>
                    </div>
                    
                    <div className="flex gap-4 pt-4 border-t border-slate-50">
                        <button type="button" onClick={() => setStep(1)} className="flex-1 bg-slate-50 text-slate-400 py-6 rounded-[28px] font-black uppercase tracking-widest text-xs border border-slate-100 hover:bg-slate-100 transition">Voltar</button>
                        <button 
                            type="button"
                            onClick={handleNext} 
                            disabled={!assets.facePhoto}
                            className="flex-[2] bg-slate-900 text-white py-6 rounded-[28px] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-black transition-all disabled:opacity-20 transform active:scale-95"
                        >
                            Usar Esta Foto
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div key="view-biometry" className="space-y-10 animate-fade-in text-center">
                    <div className="space-y-6">
                        <div className="text-center">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-4">Biometria de Segurança</label>
                            <div className="relative group max-w-[340px] mx-auto">
                                <div className={`aspect-[3/4] rounded-[48px] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-slate-50 ${assets.selfieWithDoc ? 'border-green-500 shadow-2xl shadow-green-100' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.selfieWithDoc ? (
                                        <img src={assets.selfieWithDoc} className="w-full h-full object-cover" alt="Selfie ID" />
                                    ) : (
                                        <div className="text-center p-8">
                                            <div className="text-6xl mb-6">🤳</div>
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Tire uma foto sua segurando o documento oficial</p>
                                            <span className="inline-block bg-blue-600 text-white text-[10px] font-black px-6 py-3 rounded-full uppercase tracking-widest shadow-lg transform group-hover:scale-105 transition">Abrir Câmera</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" accept="image/*" capture="user" onChange={e => handleFile(e, 'selfieWithDoc')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Tirar selfie biometria" />
                                {assets.selfieWithDoc && (
                                    <div className="absolute top-6 right-6 bg-green-500 text-white p-2 rounded-full shadow-lg z-30 pointer-events-none">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 pt-4 border-t border-slate-50">
                        <button 
                            type="button"
                            onClick={handleFinalSubmission}
                            disabled={!assets.selfieWithDoc || isVerifying}
                            className="w-full bg-green-600 text-white py-7 rounded-[32px] font-black uppercase tracking-widest text-sm shadow-[0_20px_50px_rgba(22,163,74,0.3)] flex items-center justify-center gap-4 disabled:opacity-50 transition-all transform active:scale-95"
                        >
                            {isVerifying ? (
                                <>
                                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Criptografando Dados...
                                </>
                            ) : 'Finalizar e Enviar para Análise'}
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

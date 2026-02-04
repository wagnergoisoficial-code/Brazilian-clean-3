
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
  const [hasInteracted, setHasInteracted] = useState(false); // Track if user has touched/moved
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
    setHasInteracted(false);
  }, [imageSrc]);

  // Unified Event Handlers for Touch and Mouse
  const getClientCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling on mobile
    setIsDragging(true);
    const coords = getClientCoords(e);
    setDragStart({ x: coords.x - position.x, y: coords.y - position.y });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault(); 
    const coords = getClientCoords(e);
    setPosition({
      x: coords.x - dragStart.x,
      y: coords.y - dragStart.y
    });
    if (!hasInteracted) setHasInteracted(true);
  };

  const handleEnd = () => setIsDragging(false);

  const handleZoom = (delta: number) => {
    setScale(s => {
        const newVal = Math.max(0.5, Math.min(4, s + delta));
        if (newVal !== s && !hasInteracted) setHasInteracted(true);
        return newVal;
    });
  };

  const handleConfirm = () => {
    if (!hasInteracted) return;
    if (!imageRef.current || !containerRef.current) return;

    // Create high-res canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Desired output resolution (HD)
    const targetWidth = 1280;
    const targetHeight = targetWidth / aspectRatio;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Calculate cropping based on visual representation
    const rect = containerRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();

    // Ratio of Natural Image Size vs Displayed Size
    const scaleX = imageRef.current.naturalWidth / imgRect.width;
    const scaleY = imageRef.current.naturalHeight / imgRect.height;

    // Calculate Source Coordinates (sx, sy, sWidth, sHeight)
    // The visual "window" (rect) relative to the image (imgRect)
    const sx = (rect.left - imgRect.left) * scaleX;
    const sy = (rect.top - imgRect.top) * scaleY;
    const sWidth = rect.width * scaleX;
    const sHeight = rect.height * scaleY;

    // Draw the cropped portion
    ctx.drawImage(
      imageRef.current,
      sx, sy, sWidth, sHeight,
      0, 0, targetWidth, targetHeight
    );

    // Compress slightly for upload
    onConfirm(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div key="editor-portal" className="fixed inset-0 bg-slate-900/98 z-[100] flex flex-col items-center justify-center p-4 animate-fade-in font-sans touch-none">
      <div className="w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-900 transition p-2 bg-white rounded-full shadow-sm hover:scale-110">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-4 md:p-8 space-y-4 md:space-y-6 flex-1 overflow-y-auto">
          <div className="bg-blue-50 p-3 rounded-2xl mb-2">
             <p className="text-[11px] text-blue-700 font-bold text-center leading-relaxed">
                Arraste e dê zoom para encaixar o documento dentro da área pontilhada.
             </p>
          </div>
          
          <div className="relative w-full aspect-[3/2] bg-slate-200 rounded-3xl overflow-hidden border-4 border-slate-100 shadow-inner group touch-none">
            {/* The "Hole" / Viewport */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div 
                ref={containerRef}
                className="w-full h-full border-4 border-dashed border-white shadow-[0_0_0_9999px_rgba(15,23,42,0.75)] box-border"
              ></div>
            </div>

            <img
              ref={imageRef}
              src={imageSrc}
              alt="Adjustment"
              draggable={false}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
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
                userSelect: 'none',
                touchAction: 'none'
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-8 items-center justify-center py-2 shrink-0">
            <button onClick={() => handleZoom(-0.2)} className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm transition flex items-center justify-center hover:border-blue-300">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <div className="text-center min-w-[90px]">
                <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest mb-1">Zoom</span>
                <span className="text-xl font-black text-slate-900 tracking-tighter">{Math.round(scale * 100)}%</span>
            </div>
            <button onClick={() => handleZoom(0.2)} className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm transition flex items-center justify-center hover:border-blue-300">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          <div className={`grid grid-cols-1 gap-4 pt-4 border-t border-slate-100 shrink-0 transition-all duration-500 ${hasInteracted ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2 pointer-events-none'}`}>
            <button 
                type="button" 
                onClick={handleConfirm} 
                disabled={!hasInteracted}
                className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-xs md:text-sm shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${hasInteracted ? 'bg-green-600 text-white shadow-green-200' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
            >
                Confirmar e Salvar Documento
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </button>
            {!hasInteracted && <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ajuste a imagem para confirmar</p>}
          </div>
          <button type="button" onClick={onCancel} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-slate-600 transition text-center py-2">
              Cancelar
          </button>
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

  const [assets, setAssets] = useState({
      docFront: '',
      docBack: '',
      facePhoto: '',
      selfieWithDoc: ''
  });

  // CRITICAL: Persistent interaction tracking for fields
  // A field is only "Confirmed" if it has been saved via the Image Editor.
  const [fieldConfirmed, setFieldConfirmed] = useState<Record<string, boolean>>({
      docFront: false,
      docBack: false,
      facePhoto: false,
      selfieWithDoc: false
  });

  useEffect(() => {
    if (!myProfile && !targetId) { navigate('/join'); }
    if (myProfile) {
        // Load existing assets if any
        setAssets({
            docFront: myProfile.documentFrontUrl || '',
            docBack: myProfile.documentBackUrl || '',
            facePhoto: myProfile.facePhotoUrl || '',
            selfieWithDoc: myProfile.selfieWithDocUrl || ''
        });
        
        // If profile already has data, treat them as confirmed
        setFieldConfirmed({
            docFront: !!myProfile.documentFrontUrl,
            docBack: !!myProfile.documentBackUrl,
            facePhoto: !!myProfile.facePhotoUrl,
            selfieWithDoc: !!myProfile.selfieWithDocUrl
        });
    }
  }, [myProfile, targetId, navigate]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof assets) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 10 * 1024 * 1024) return alert("Arquivo muito grande. Limite: 10MB");

        const reader = new FileReader();
        reader.onload = () => {
          // Immediately trigger the editor
          setTempImage(reader.result as string);
          setEditingField(field);
          // We do NOT set the asset yet. User must confirm in editor.
        };
        reader.readAsDataURL(file);
        
        // Reset input value to allow re-uploading same file if needed
        e.target.value = '';
    }
  };

  const onCropConfirm = (croppedBase64: string) => {
    if (editingField && targetId) { 
        // 1. Update State
        setAssets(prev => ({ ...prev, [editingField]: croppedBase64 }));
        setFieldConfirmed(prev => ({ ...prev, [editingField]: true }));
        
        // 2. Persist immediately to prevent data loss on crash/reload
        const updateObj: any = {};
        if (editingField === 'docFront') updateObj.documentFrontUrl = croppedBase64;
        if (editingField === 'docBack') updateObj.documentBackUrl = croppedBase64;
        if (editingField === 'facePhoto') updateObj.facePhotoUrl = croppedBase64;
        if (editingField === 'selfieWithDoc') updateObj.selfieWithDocUrl = croppedBase64;
        
        updateCleanerProfile(targetId, updateObj);
    }
    // 3. Close Editor
    setEditingField(null);
    setTempImage(null);
  };

  const handleNext = () => {
      if (step === 1 && (!assets.docFront || !assets.docBack || !fieldConfirmed.docFront || !fieldConfirmed.docBack)) {
          return alert("Por favor, envie e confirme a frente e o verso do documento.");
      }
      if (step === 2 && (!assets.facePhoto || !fieldConfirmed.facePhoto)) {
          return alert("Por favor, tire e confirme uma foto clara do seu rosto.");
      }
      setStep(prev => prev + 1);
  };

  const handleFinalSubmission = async () => {
    // 1. Validate All Fields
    const allPresent = assets.docFront && assets.docBack && assets.facePhoto && assets.selfieWithDoc;
    const allConfirmed = fieldConfirmed.docFront && fieldConfirmed.docBack && fieldConfirmed.facePhoto && fieldConfirmed.selfieWithDoc;
    
    if (!allPresent || !allConfirmed || !myProfile || !targetId) {
        return alert("Incompleto. Certifique-se de que todos os 4 documentos foram enviados e confirmados.");
    }

    setIsVerifying(true);
    setVerificationFeedback(null);
    
    try {
        // 2. Attempt AI Verification
        // Note: verifyCleaner is NOT called here. This is purely for metadata/scoring.
        // The actual status change happens if successful.
        
        const aiResult = await performIdentityVerification(assets, { 
            fullName: myProfile.fullName, 
            email: myProfile.email 
        });

        // 3. Handle Fraud Detection
        if (aiResult.verification_status === "LIKELY_FRAUD") {
            setVerificationFeedback(aiResult);
            setIsVerifying(false);
            return;
        }

        // 4. Update Profile Status
        updateCleanerProfile(targetId, {
            status: CleanerStatus.UNDER_REVIEW,
            aiVerificationResult: aiResult
        });

        // 5. Navigate
        setTimeout(() => navigate('/dashboard'), 1000);

    } catch (err) {
        console.error("Verification Service Error:", err);
        
        // FAIL-SAFE: If AI is down, do not block the user.
        // Send to manual review queue.
        updateCleanerProfile(targetId, { 
            status: CleanerStatus.UNDER_REVIEW,
            aiVerificationResult: {
                verification_status: "NEEDS_MANUAL_REVIEW",
                confidence_score: 0.0,
                summary: "AI Service Unreachable. Manual fallback."
            }
        });
        
        setTimeout(() => navigate('/dashboard'), 1000);
    } finally {
        setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans overflow-x-hidden">
      {/* OVERLAY EDITOR */}
      {editingField && tempImage && (
        <ImageEditor 
          key={`editor-overlay-${editingField}`}
          imageSrc={tempImage}
          title={
             editingField === 'docFront' ? 'Ajustar Frente do ID' :
             editingField === 'docBack' ? 'Ajustar Verso do ID' :
             editingField === 'facePhoto' ? 'Enquadrar Rosto' : 'Validar Biometria'
          }
          aspectRatio={editingField === 'facePhoto' ? 1 : 3/2}
          onConfirm={onCropConfirm}
          onCancel={() => { setEditingField(null); setTempImage(null); }}
        />
      )}

      <div className="max-w-2xl w-full bg-white rounded-[48px] shadow-2xl overflow-hidden animate-scale-in border border-slate-100">
        <div className="bg-slate-900 p-12 text-center text-white relative">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800">
              <div 
                className="h-full bg-green-500 transition-all duration-1000 ease-in-out shadow-[0_0_20px_rgba(34,197,94,0.6)]" 
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
           </div>

           <div className="flex justify-center gap-4 mb-8">
               {[1, 2, 3].map(s => (
                   <div key={`step-dot-${s}`} className={`h-2 w-12 rounded-full transition-all duration-700 ${step >= s ? 'bg-green-500' : 'bg-slate-700'}`}></div>
               ))}
           </div>

           <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 leading-none">
               {step === 1 ? 'Identidade' : step === 2 ? 'Foto de Perfil' : 'Biometria'}
           </h2>
           <p className="text-slate-400 text-sm font-medium opacity-80 tracking-wide">
               {step === 1 ? 'Fotos legíveis do seu ID (Drive License ou Passaporte)' : step === 2 ? 'Sua melhor foto para o perfil profissional' : 'Confirmação facial com documento original'}
           </p>
        </div>

        <div className="p-12">
            {verificationFeedback && (
                <div key="error-feedback" className="mb-10 p-6 bg-red-50 border-2 border-red-100 rounded-[36px] animate-fade-in flex gap-6 shadow-sm">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div>
                        <h3 className="text-red-700 font-black uppercase text-[10px] tracking-widest mb-1.5">Atenção Necessária</h3>
                        <p className="text-red-900 font-bold text-sm mb-1 leading-tight">{verificationFeedback.user_reason_pt}</p>
                        <p className="text-red-600 text-xs italic opacity-90">{verificationFeedback.user_instruction_pt}</p>
                    </div>
                </div>
            )}

            {step === 1 && (
                <div key="view-identity" className="space-y-12 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* DOC FRONT */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Frente do ID</label>
                                {assets.docFront && fieldConfirmed.docFront && <span className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100">Confirmado ✓</span>}
                            </div>
                            <div className="relative group aspect-[3/2]">
                                <div className={`w-full h-full rounded-[40px] border-4 border-dashed flex flex-col items-center justify-center transition-all duration-300 overflow-hidden bg-slate-50 ${assets.docFront && fieldConfirmed.docFront ? 'border-green-500 shadow-2xl shadow-green-100' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.docFront ? (
                                        <img src={assets.docFront} className="w-full h-full object-cover" alt="ID Frente" />
                                    ) : (
                                        <div className="text-center p-6">
                                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm text-4xl border border-slate-100">🪪</div>
                                            <span className="text-[11px] font-black text-slate-400 uppercase block tracking-[0.2em]">Upload Frente</span>
                                        </div>
                                    )}
                                </div>
                                {/* Input covers entire area until confirmed. If confirmed, user must click 'Refazer' */}
                                <input type="file" accept="image/*" onChange={e => handleFile(e, 'docFront')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Upload frente" />
                                
                                {assets.docFront && (
                                    <div className={`absolute inset-0 bg-black/40 ${fieldConfirmed.docFront ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition flex items-center justify-center z-30 rounded-[40px] pointer-events-none`}>
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest bg-blue-600 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md">
                                            {fieldConfirmed.docFront ? 'Editar / Refazer' : 'Ajustar & Salvar'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* DOC BACK */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Verso do ID</label>
                                {assets.docBack && fieldConfirmed.docBack && <span className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100">Confirmado ✓</span>}
                            </div>
                            <div className="relative group aspect-[3/2]">
                                <div className={`w-full h-full rounded-[40px] border-4 border-dashed flex flex-col items-center justify-center transition-all duration-300 overflow-hidden bg-slate-50 ${assets.docBack && fieldConfirmed.docBack ? 'border-green-500 shadow-2xl shadow-green-100' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.docBack ? (
                                        <img src={assets.docBack} className="w-full h-full object-cover" alt="ID Verso" />
                                    ) : (
                                        <div className="text-center p-6">
                                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm text-4xl border border-slate-100">🔙</div>
                                            <span className="text-[11px] font-black text-slate-400 uppercase block tracking-[0.2em]">Upload Verso</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" accept="image/*" onChange={e => handleFile(e, 'docBack')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Upload verso" />
                                
                                {assets.docBack && (
                                    <div className={`absolute inset-0 bg-black/40 ${fieldConfirmed.docBack ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition flex items-center justify-center z-30 rounded-[40px] pointer-events-none`}>
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest bg-blue-600 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md">
                                            {fieldConfirmed.docBack ? 'Editar / Refazer' : 'Ajustar & Salvar'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-50">
                        <button 
                            type="button"
                            onClick={handleNext} 
                            disabled={!assets.docFront || !assets.docBack || !fieldConfirmed.docFront || !fieldConfirmed.docBack}
                            className="w-full bg-slate-900 text-white py-8 rounded-[36px] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-black transition-all disabled:opacity-20 disabled:cursor-not-allowed transform active:scale-95 flex items-center justify-center gap-5"
                        >
                            Próxima Etapa
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        </button>
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase mt-6 tracking-[0.2em] flex items-center justify-center gap-3 opacity-60">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                            Certificação de Segurança Bancária
                        </p>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div key="view-face" className="space-y-12 animate-fade-in">
                    <div className="space-y-8">
                        <div className="text-center">
                            <div className="flex justify-between items-center max-w-[340px] mx-auto mb-6 px-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Sua Foto de Perfil</label>
                                {assets.facePhoto && fieldConfirmed.facePhoto && <span className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100 shadow-sm">Confirmada ✓</span>}
                            </div>
                            <div className="relative group max-w-[340px] mx-auto">
                                <div className={`aspect-square rounded-full border-4 border-dashed flex flex-col items-center justify-center transition-all duration-500 overflow-hidden bg-slate-50 ${assets.facePhoto && fieldConfirmed.facePhoto ? 'border-green-500 ring-[16px] ring-green-50 shadow-2xl shadow-green-100/50' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.facePhoto ? (
                                        <img src={assets.facePhoto} className="w-full h-full object-cover" alt="Face" />
                                    ) : (
                                        <div className="text-center p-6">
                                            <div className="text-7xl mb-6 drop-shadow-sm">📸</div>
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Capturar Rosto</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" accept="image/*" capture="user" onChange={e => handleFile(e, 'facePhoto')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Tirar foto" />
                                
                                {assets.facePhoto && (
                                     <div className={`absolute inset-0 bg-slate-900/40 rounded-full ${fieldConfirmed.facePhoto ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition flex items-center justify-center z-30 pointer-events-none`}>
                                         <span className="text-white text-[10px] font-black uppercase tracking-widest bg-blue-600 px-6 py-3 rounded-full shadow-2xl">
                                            {fieldConfirmed.facePhoto ? 'Trocar Foto' : 'Ajustar & Salvar'}
                                         </span>
                                     </div>
                                )}
                            </div>
                        </div>
                        <p className="text-center text-sm text-slate-400 font-medium max-w-sm mx-auto leading-relaxed italic px-6">Esta foto será visível para os clientes em seu cartão profissional. Prefira fundos claros e sem óculos escuros.</p>
                    </div>
                    
                    <div className="flex gap-6 pt-8 border-t border-slate-50">
                        <button type="button" onClick={() => setStep(1)} className="flex-1 bg-slate-50 text-slate-400 py-8 rounded-[36px] font-black uppercase tracking-widest text-[11px] border border-slate-100 hover:bg-slate-100 transition shadow-sm">Voltar</button>
                        <button 
                            type="button"
                            onClick={handleNext} 
                            disabled={!assets.facePhoto || !fieldConfirmed.facePhoto}
                            className="flex-[2] bg-slate-900 text-white py-8 rounded-[36px] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-black transition-all disabled:opacity-20 transform active:scale-95"
                        >
                            Próximo Passo
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div key="view-biometry" className="space-y-12 animate-fade-in text-center">
                    <div className="space-y-10">
                        <div className="text-center">
                            <div className="flex justify-between items-center max-w-[400px] mx-auto mb-6 px-4">
                                <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Biometria Facial</label>
                                {assets.selfieWithDoc && fieldConfirmed.selfieWithDoc && <span className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100 shadow-sm">Pronto ✓</span>}
                            </div>
                            
                            <div className="relative group max-w-[400px] mx-auto">
                                <div className={`aspect-[3/4] rounded-[64px] border-4 border-dashed flex flex-col items-center justify-center transition-all duration-500 overflow-hidden bg-slate-50 ${assets.selfieWithDoc && fieldConfirmed.selfieWithDoc ? 'border-green-500 shadow-2xl shadow-green-100' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.selfieWithDoc ? (
                                        <img src={assets.selfieWithDoc} className="w-full h-full object-cover" alt="Selfie ID" />
                                    ) : (
                                        <div className="text-center p-12">
                                            <div className="text-8xl mb-10 drop-shadow-xl animate-float">🤳</div>
                                            <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-10 leading-relaxed px-4">Segure o documento original próximo ao seu rosto para validação cruzada</p>
                                            <span className="inline-block bg-blue-600 text-white text-[11px] font-black px-12 py-5 rounded-full uppercase tracking-widest shadow-2xl transform group-hover:scale-110 transition duration-500 hover:bg-blue-700">Abrir Câmera</span>
                                        </div>
                                    )}
                                </div>
                                <input type="file" accept="image/*" capture="user" onChange={e => handleFile(e, 'selfieWithDoc')} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="Tirar selfie biometria" />
                                
                                {assets.selfieWithDoc && (
                                     <div className={`absolute inset-0 bg-slate-900/40 rounded-[64px] ${fieldConfirmed.selfieWithDoc ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition flex items-center justify-center z-30 pointer-events-none`}>
                                         <span className="text-white text-[10px] font-black uppercase tracking-widest bg-blue-600 px-6 py-3 rounded-full shadow-2xl">
                                            {fieldConfirmed.selfieWithDoc ? 'Refazer Biometria' : 'Ajustar & Salvar'}
                                         </span>
                                     </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-10 border-t border-slate-50">
                        <button 
                            type="button"
                            onClick={handleFinalSubmission}
                            disabled={!assets.selfieWithDoc || isVerifying || !fieldConfirmed.selfieWithDoc}
                            className="w-full bg-green-600 text-white py-9 rounded-[40px] font-black uppercase tracking-widest text-sm shadow-[0_30px_70px_-15px_rgba(22,163,74,0.5)] flex items-center justify-center gap-6 disabled:opacity-50 transition-all transform active:scale-95 shadow-green-100"
                        >
                            {isVerifying ? (
                                <>
                                    <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Validando Identidade...
                                </>
                            ) : 'Finalizar e Enviar para Análise'}
                        </button>
                        <button type="button" onClick={() => setStep(2)} className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] hover:text-slate-600 transition p-4">Voltar para Foto de Perfil</button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DocumentVerification;


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
    <div className="fixed inset-0 bg-slate-900/95 z-[60] flex flex-col items-center justify-center p-4 animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-900 transition">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <p className="text-xs text-slate-500 font-medium text-center">Arraste e use o zoom para enquadrar perfeitamente.</p>
          
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
            <button onClick={onCancel} className="bg-slate-50 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Cancelar</button>
            <button onClick={handleConfirm} className="bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-blue-700 transition">Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const cleanerId = searchParams.get('id');
  const { cleaners, updateCleanerProfile } = useAppContext();
  const navigate = useNavigate();

  const myProfile = cleaners.find(c => c.id === cleanerId);

  const [step, setStep] = useState(1);
  const [assets, setAssets] = useState({
      docFront: '',
      docBack: '',
      facePhoto: '',
      selfieWithDoc: ''
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [redirectToDashboard, setRedirectToDashboard] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<AiVerificationResult | null>(null);
  
  const [editingField, setEditingField] = useState<keyof typeof assets | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);

  useEffect(() => {
    if (!myProfile) { navigate('/join'); }
  }, [myProfile, navigate]);

  useEffect(() => {
    if (redirectToDashboard) {
        const timer = setTimeout(() => navigate('/dashboard'), 200);
        return () => clearTimeout(timer);
    }
  }, [redirectToDashboard, navigate]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof assets) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = () => {
          setTempImage(reader.result as string);
          setEditingField(field);
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropConfirm = (croppedBase64: string) => {
    if (editingField) { setAssets(prev => ({ ...prev, [editingField]: croppedBase64 })); }
    setEditingField(null);
    setTempImage(null);
  };

  const handleNext = () => {
      if (step === 1 && (!assets.docFront || !assets.docBack)) return alert("Envie a frente e o verso do documento.");
      if (step === 2 && !assets.facePhoto) return alert("Tire uma foto clara do seu rosto.");
      setStep(step + 1);
  };

  const handleVerify = async () => {
    if (!assets.docFront || !assets.docBack || !assets.facePhoto || !assets.selfieWithDoc || !myProfile || !cleanerId) return;

    setIsVerifying(true);
    setVerificationFeedback(null);
    
    try {
        const aiResult = await performIdentityVerification(assets, { 
            fullName: myProfile.fullName, 
            email: myProfile.email 
        });

        if (aiResult.verification_status === "LIKELY_FRAUD" || aiResult.verification_status === "NEEDS_MANUAL_REVIEW") {
            setVerificationFeedback(aiResult);
            setIsVerifying(false);
            return;
        }

        updateCleanerProfile(cleanerId, {
            documentFrontUrl: assets.docFront,
            documentBackUrl: assets.docBack,
            facePhotoUrl: assets.facePhoto,
            selfieWithDocUrl: assets.selfieWithDoc,
            status: CleanerStatus.UNDER_REVIEW,
            aiVerificationResult: aiResult
        });

        setRedirectToDashboard(true);

    } catch (err) {
        console.error("AI Guardian Exception:", err);
        updateCleanerProfile(cleanerId, { status: CleanerStatus.UNDER_REVIEW });
        setRedirectToDashboard(true);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans">
      {editingField && tempImage && (
        <ImageEditor 
          key={`editor-${editingField}`}
          imageSrc={tempImage}
          title={editingField.includes('doc') ? 'Ajustar Documento' : 'Ajustar Rosto'}
          aspectRatio={editingField === 'facePhoto' ? 1 : 3/2}
          onConfirm={onCropConfirm}
          onCancel={() => { setEditingField(null); setTempImage(null); }}
        />
      )}

      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="bg-slate-900 p-8 text-center text-white">
           <div className="flex justify-center gap-1 mb-6">
               {[1, 2, 3].map(s => (
                   <div key={`step-indicator-${s}`} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= s ? 'bg-green-500' : 'bg-slate-700'}`}></div>
               ))}
           </div>
           <h2 className="text-2xl font-black uppercase tracking-tighter">
               {step === 1 ? 'Documento Oficial' : step === 2 ? 'Verificação Facial' : 'Bio-Autenticação'}
           </h2>
           <p className="text-slate-400 text-sm mt-1">
               {step === 1 ? 'Frente e verso (DL, Passaporte ou RG)' : step === 2 ? 'Sua foto de perfil principal' : 'Segure o documento próximo ao rosto'}
           </p>
        </div>

        <div className="p-10">
            {verificationFeedback && (
                <div key="feedback-area" className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-3xl animate-fade-in">
                    <h3 className="text-red-700 font-black uppercase text-xs mb-2">Ops! Precisamos ajustar:</h3>
                    <p className="text-red-600 font-bold text-sm mb-1">{verificationFeedback.user_reason_pt}</p>
                    <p className="text-red-500 text-xs italic">{verificationFeedback.user_instruction_pt}</p>
                </div>
            )}

            {step === 1 && (
                <div key="step1-container" className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Frente</label>
                            <div className="relative group">
                                <div className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 ${assets.docFront ? 'border-green-500' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.docFront ? <img src={assets.docFront} className="w-full h-full object-cover" /> : <span className="text-3xl">🪪</span>}
                                </div>
                                <input type="file" accept="image/*" onChange={e => handleFile(e, 'docFront')} className="absolute inset-0 opacity-0 cursor-pointer" title="Selecione a frente" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Verso</label>
                            <div className="relative group">
                                <div className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 ${assets.docBack ? 'border-green-500' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.docBack ? <img src={assets.docBack} className="w-full h-full object-cover" /> : <span className="text-3xl">🔙</span>}
                                </div>
                                <input type="file" accept="image/*" onChange={e => handleFile(e, 'docBack')} className="absolute inset-0 opacity-0 cursor-pointer" title="Selecione o verso" />
                            </div>
                        </div>
                    </div>
                    <button onClick={handleNext} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl">Próximo Passo</button>
                </div>
            )}

            {step === 2 && (
                <div key="step2-container" className="space-y-8 animate-fade-in">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center block">Foto de Rosto</label>
                        <div className="relative group max-w-xs mx-auto">
                            <div className={`h-64 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 aspect-square mx-auto ${assets.facePhoto ? 'border-green-500' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                {assets.facePhoto ? <img src={assets.facePhoto} className="w-full h-full object-cover" /> : <span className="text-4xl">📸</span>}
                            </div>
                            <input type="file" accept="image/*" capture="user" onChange={e => handleFile(e, 'facePhoto')} className="absolute inset-0 opacity-0 cursor-pointer" title="Tire uma foto" />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setStep(1)} className="flex-1 bg-slate-50 text-slate-400 py-5 rounded-2xl font-black uppercase tracking-widest text-sm">Voltar</button>
                        <button onClick={handleNext} className="flex-[2] bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl">Passo Final</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div key="step3-container" className="space-y-8 animate-fade-in text-center">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Selfie com Documento</label>
                        <div className="relative group max-w-sm mx-auto">
                            <div className={`h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 ${assets.selfieWithDoc ? 'border-green-500' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                {assets.selfieWithDoc ? <img src={assets.selfieWithDoc} className="w-full h-full object-cover" /> : <span className="text-4xl">🤳</span>}
                            </div>
                            <input type="file" accept="image/*" capture="user" onChange={e => handleFile(e, 'selfieWithDoc')} className="absolute inset-0 opacity-0 cursor-pointer" title="Tire a selfie" />
                        </div>
                    </div>

                    <button 
                        onClick={handleVerify}
                        disabled={!assets.selfieWithDoc || isVerifying}
                        className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isVerifying ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Processando Biometria...
                            </>
                        ) : 'Finalizar e Enviar para Análise'}
                    </button>
                    <button onClick={() => setStep(2)} className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600">Voltar</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DocumentVerification;

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
          <p className="text-xs text-slate-500 font-medium text-center">Arraste a imagem para alinhar dentro do quadro.</p>
          
          <div className="relative w-full aspect-[3/2] bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200">
            <div className="absolute inset-0 z-10 pointer-events-none border-[20px] border-slate-900/40">
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

          <div className="flex gap-2 items-center justify-center">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <span className="text-[10px] font-bold text-slate-400 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button onClick={onCancel} className="bg-slate-50 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Tirar novamente</button>
            <button onClick={handleConfirm} className="bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-blue-700 transition">Confirmar foto</button>
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
  
  const [editingField, setEditingField] = useState<keyof typeof assets | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);

  useEffect(() => {
    if (!myProfile) {
        navigate('/join');
    }
  }, [myProfile, navigate]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof assets) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = () => {
          if (field === 'docFront' || field === 'docBack') {
            setTempImage(reader.result as string);
            setEditingField(field);
          } else {
            setAssets(prev => ({ ...prev, [field]: reader.result as string }));
          }
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropConfirm = (croppedBase64: string) => {
    if (editingField) {
      setAssets(prev => ({ ...prev, [editingField]: croppedBase64 }));
    }
    setEditingField(null);
    setTempImage(null);
  };

  const handleNext = () => {
      if (step === 1 && (!assets.docFront || !assets.docBack)) return alert("Por favor, envie a frente e o verso do seu documento.");
      if (step === 2 && !assets.facePhoto) return alert("Por favor, tire uma foto clara do seu rosto.");
      setStep(step + 1);
  };

  const handleVerify = async () => {
    if (!assets.docFront || !assets.docBack || !assets.facePhoto || !assets.selfieWithDoc || !myProfile || !cleanerId) return;

    setIsVerifying(true);
    
    // STEP 1: Persist assets immediately to the profile (in-memory)
    // This satisfies the "Don't force re-upload" requirement
    updateCleanerProfile(cleanerId, {
        documentFrontUrl: assets.docFront,
        documentBackUrl: assets.docBack,
        facePhotoUrl: assets.facePhoto,
        selfieWithDocUrl: assets.selfieWithDoc,
        status: CleanerStatus.UNDER_REVIEW
    });

    try {
        // STEP 2: Call AI Verification
        const aiResult = await performIdentityVerification(assets, { 
            fullName: myProfile.fullName, 
            email: myProfile.email 
        });

        // STEP 3: Update with AI result
        updateCleanerProfile(cleanerId, {
            aiVerificationResult: aiResult
        });

        setTimeout(() => {
            navigate('/dashboard');
        }, 800);

    } catch (err) {
        console.error("Verification logic failure:", err);
        
        // STEP 4: Fallback to Manual Review if service layer fails
        const fallback: AiVerificationResult = {
            verification_status: "NEEDS_MANUAL_REVIEW",
            confidence_score: 0,
            detected_issues: ["Unexpected Application Error"],
            summary: "Ocorreu um erro interno durante a análise automática. Seu perfil será revisado manualmente pela nossa equipe.",
            recommended_action: "Review",
            timestamp: new Date().toISOString(),
            user_reason_pt: "Erro interno no sistema de verificação.",
            user_instruction_pt: "Seus dados foram salvos com sucesso. Nossa equipe fará a revisão manual do seu perfil."
        };
        
        updateCleanerProfile(cleanerId, {
            aiVerificationResult: fallback
        });
        
        setTimeout(() => navigate('/dashboard'), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans">
      {editingField && tempImage && (
        <ImageEditor 
          imageSrc={tempImage}
          title={editingField === 'docFront' ? 'Ajustar Frente' : 'Ajustar Verso'}
          aspectRatio={3/2}
          onConfirm={onCropConfirm}
          onCancel={() => { setEditingField(null); setTempImage(null); }}
        />
      )}

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
                            {assets.docFront && (
                              <button onClick={() => { setTempImage(assets.docFront); setEditingField('docFront'); }} className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block mx-auto hover:underline">Reajustar Foto</button>
                            )}
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Documento: Verso</label>
                            <div className="relative group">
                                <div className={`h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition overflow-hidden bg-slate-50 ${assets.docBack ? 'border-green-500' : 'border-slate-200 group-hover:border-blue-400'}`}>
                                    {assets.docBack ? <img src={assets.docBack} className="w-full h-full object-cover" /> : <span className="text-3xl">🔙</span>}
                                </div>
                                <input type="file" accept="image/*" onChange={e => handleFile(e, 'docBack')} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            {assets.docBack && (
                              <button onClick={() => { setTempImage(assets.docBack); setEditingField('docBack'); }} className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block mx-auto hover:underline">Reajustar Foto</button>
                            )}
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
                                    Enviando...
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

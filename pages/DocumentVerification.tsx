
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
// FIX: Imported CleanerProfile to resolve type error.
import { CleanerStatus, AiVerificationResult, CleanerProfile } from '../types';
import { performIdentityVerification } from '../services/geminiService';
import { uploadDocument, cleanupStorageUrl } from '../services/storageService';


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

// Define types for the upload status of each field
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
type AssetField = 'docFront' | 'docBack' | 'facePhoto' | 'selfieWithDoc';

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
  
  const [editingField, setEditingField] = useState<AssetField | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);

  const [assetUrls, setAssetUrls] = useState<Record<AssetField, string>>({
      docFront: '', docBack: '', facePhoto: '', selfieWithDoc: ''
  });
  
  const [uploadStatus, setUploadStatus] = useState<Record<AssetField, UploadStatus>>({
      docFront: 'idle', docBack: 'idle', facePhoto: 'idle', selfieWithDoc: 'idle'
  });

  // PRODUCTION-FIX: Safely handle blob URL cleanup to prevent crashes.
  // This ref keeps track of the current URLs.
  const assetUrlsRef = useRef(assetUrls);
  assetUrlsRef.current = assetUrls;

  // This effect will ONLY run when the component unmounts.
  useEffect(() => {
    return () => {
      // On unmount, get the latest URLs from the ref and clean them all up.
      const urlsToClean = Object.values(assetUrlsRef.current);
      urlsToClean.forEach(url => {
        if (url && url.startsWith('blob:')) cleanupStorageUrl(url);
      });
      console.log("[System] DocumentVerification unmounted. All blob URLs revoked.", urlsToClean);
    };
  }, []); // Empty dependency array is crucial for this to run only on unmount.
  
  useEffect(() => {
    if (!myProfile && !targetId) { navigate('/professional'); }
    if (myProfile) {
        setAssetUrls({
            docFront: myProfile.documentFrontUrl || '',
            docBack: myProfile.documentBackUrl || '',
            facePhoto: myProfile.facePhotoUrl || '',
            selfieWithDoc: myProfile.selfieWithDocUrl || ''
        });
        setUploadStatus({
            docFront: myProfile.documentFrontUrl ? 'success' : 'idle',
            docBack: myProfile.documentBackUrl ? 'success' : 'idle',
            facePhoto: myProfile.facePhotoUrl ? 'success' : 'idle',
            selfieWithDoc: myProfile.selfieWithDocUrl ? 'success' : 'idle'
        });
    }
  }, [myProfile, targetId, navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: AssetField) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 10 * 1024 * 1024) return alert("Arquivo muito grande. Limite: 10MB");
        const reader = new FileReader();
        reader.onload = () => {
          setTempImage(reader.result as string);
          setEditingField(field);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    }
  };

  const onCropConfirm = async (croppedBase64: string) => {
    if (!editingField || !targetId) return;

    const fieldToUpdate = editingField;
    setEditingField(null);
    setTempImage(null);
    setUploadStatus(prev => ({ ...prev, [fieldToUpdate]: 'uploading' }));
    
    try {
        const fileUrl = await uploadDocument(croppedBase64);
        
        // CRITICAL FIX: The immediate cleanup of the old URL was removed from here.
        // It created a race condition with React's render cycle, causing the 'removeChild' crash.
        // Cleanup is now handled safely by the component's unmount effect.
        
        setAssetUrls(prev => ({ ...prev, [fieldToUpdate]: fileUrl }));
        setUploadStatus(prev => ({ ...prev, [fieldToUpdate]: 'success' }));
        
        const profileUpdate: Partial<CleanerProfile> = {};
        if (fieldToUpdate === 'docFront') profileUpdate.documentFrontUrl = fileUrl;
        if (fieldToUpdate === 'docBack') profileUpdate.documentBackUrl = fileUrl;
        if (fieldToUpdate === 'facePhoto') profileUpdate.facePhotoUrl = fileUrl;
        if (fieldToUpdate === 'selfieWithDoc') profileUpdate.selfieWithDocUrl = fileUrl;

        updateCleanerProfile(targetId, profileUpdate);

    } catch (error) {
        console.error(`[Upload Error] for ${fieldToUpdate}:`, error);
        setUploadStatus(prev => ({ ...prev, [fieldToUpdate]: 'error' }));
        alert(`O upload do documento falhou. Por favor, tente novamente.`);
    }
  };

  const handleNext = () => {
      if (step === 1 && (uploadStatus.docFront !== 'success' || uploadStatus.docBack !== 'success')) {
          return alert("Por favor, envie e confirme a frente e o verso do documento.");
      }
      if (step === 2 && uploadStatus.facePhoto !== 'success') {
          return alert("Por favor, tire e confirme uma foto clara do seu rosto.");
      }
      setStep(prev => prev + 1);
  };
  
  const handleFinalSubmission = async () => {
    const allSuccessful = Object.values(uploadStatus).every(s => s === 'success');
    
    if (!allSuccessful || !myProfile || !targetId) {
        return alert("Incompleto. Certifique-se de que todos os 4 documentos foram enviados com sucesso.");
    }
    setIsVerifying(true);
    console.log("Submitting asset URLs for verification:", assetUrls);
    updateCleanerProfile(targetId, { status: CleanerStatus.VERIFICATION_PENDING });
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  const renderUploadBox = (field: AssetField, title: string, icon: string, aspectRatio: '3/2' | '1/1' = '3/2') => {
    const status = uploadStatus[field];
    const url = assetUrls[field];
    
    const statusUI = {
        'idle': { text: `Upload ${title}`, icon: icon, color: 'border-slate-200 group-hover:border-blue-400' },
        'uploading': { text: 'Enviando...', icon: '⏳', color: 'border-blue-400 animate-pulse' },
        'success': { text: 'Confirmado ✓', icon: '✓', color: 'border-green-500 shadow-lg shadow-green-100' },
        'error': { text: 'Erro! Tente Novamente', icon: '❌', color: 'border-red-500 bg-red-50' }
    };
    
    const { text, icon: statusIcon, color } = statusUI[status];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</label>
                {status === 'success' && <span className="text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full border border-green-100">{text}</span>}
                {status === 'uploading' && <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{text}</span>}
                {status === 'error' && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{text}</span>}
            </div>
            <div className="relative group">
                <div className={`aspect-${aspectRatio} rounded-[40px] border-4 border-dashed flex flex-col items-center justify-center transition-all duration-300 overflow-hidden bg-slate-50 ${color}`}>
                    {url && status !== 'error' ? (
                        <img src={url} className="w-full h-full object-cover" alt={title} />
                    ) : (
                        <div className="text-center p-6">
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm text-4xl border border-slate-100">{status === 'uploading' ? '⏳' : icon}</div>
                            <span className="text-[11px] font-black text-slate-400 uppercase block tracking-[0.2em]">{text}</span>
                        </div>
                    )}
                </div>
                <input type="file" accept="image/*" capture={field === 'facePhoto' || field === 'selfieWithDoc' ? 'user' : undefined} onChange={e => handleFileSelect(e, field)} className="absolute inset-0 opacity-0 cursor-pointer z-20" title={`Upload ${title}`} />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans overflow-x-hidden">
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
               {[1, 2, 3].map(s => ( <div key={`step-dot-${s}`} className={`h-2 w-12 rounded-full transition-all duration-700 ${step >= s ? 'bg-green-500' : 'bg-slate-700'}`}></div> ))}
           </div>
           <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 leading-none">
               {step === 1 ? 'Identidade' : step === 2 ? 'Foto de Perfil' : 'Biometria'}
           </h2>
           <p className="text-slate-400 text-sm font-medium opacity-80 tracking-wide">
               {step === 1 ? 'Fotos legíveis do seu ID (Drive License ou Passaporte)' : step === 2 ? 'Sua melhor foto para o perfil profissional' : 'Confirmação facial com documento original'}
           </p>
        </div>

        <div className="p-12">
            {step === 1 && (
                <div key="view-identity" className="space-y-12 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {renderUploadBox('docFront', 'Frente do ID', '🪪')}
                        {renderUploadBox('docBack', 'Verso do ID', '🔙')}
                    </div>
                    <div className="pt-8 border-t border-slate-50">
                        <button 
                            type="button"
                            onClick={handleNext} 
                            disabled={uploadStatus.docFront !== 'success' || uploadStatus.docBack !== 'success'}
                            className="w-full bg-slate-900 text-white py-8 rounded-[36px] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-black transition-all disabled:opacity-20 disabled:cursor-not-allowed transform active:scale-95 flex items-center justify-center gap-5"
                        > Próxima Etapa <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg> </button>
                    </div>
                </div>
            )}
            {step === 2 && (
                 <div key="view-face" className="space-y-12 animate-fade-in">
                    {renderUploadBox('facePhoto', 'Sua Foto de Perfil', '📸', '1/1')}
                    <div className="flex gap-6 pt-8 border-t border-slate-50">
                        <button type="button" onClick={() => setStep(1)} className="flex-1 bg-slate-50 text-slate-400 py-8 rounded-[36px] font-black uppercase tracking-widest text-[11px] border border-slate-100 hover:bg-slate-100 transition shadow-sm">Voltar</button>
                        <button 
                            type="button" onClick={handleNext} disabled={uploadStatus.facePhoto !== 'success'}
                            className="flex-[2] bg-slate-900 text-white py-8 rounded-[36px] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-black transition-all disabled:opacity-20 transform active:scale-95"
                        > Próximo Passo </button>
                    </div>
                 </div>
            )}
            {step === 3 && (
                <div key="view-biometry" className="space-y-12 animate-fade-in text-center">
                    {renderUploadBox('selfieWithDoc', 'Biometria Facial', '🤳', '3/2')}
                    <div className="space-y-6 pt-10 border-t border-slate-50">
                        <button 
                            type="button" onClick={handleFinalSubmission} disabled={uploadStatus.selfieWithDoc !== 'success' || isVerifying}
                            className="w-full bg-green-600 text-white py-9 rounded-[40px] font-black uppercase tracking-widest text-sm shadow-[0_30px_70px_-15px_rgba(22,163,74,0.5)] flex items-center justify-center gap-6 disabled:opacity-50 transition-all transform active:scale-95"
                        > {isVerifying ? 'Validando...' : 'Finalizar e Enviar para Análise'} </button>
                        <button type="button" onClick={() => setStep(2)} className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] hover:text-slate-600 transition p-4">Voltar</button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DocumentVerification;

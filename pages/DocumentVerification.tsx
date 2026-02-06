
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
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
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
    setHasInteracted(false);
  }, [imageSrc]);

  const getClientCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const coords = getClientCoords(e);
    setDragStart({ x: coords.x - position.x, y: coords.y - position.y });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const coords = getClientCoords(e);
    setPosition({ x: coords.x - dragStart.x, y: coords.y - dragStart.y });
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
    const scaleX = imageRef.current.naturalWidth / imgRect.width;
    const scaleY = imageRef.current.naturalHeight / imgRect.height;

    const sx = (rect.left - imgRect.left) * scaleX;
    const sy = (rect.top - imgRect.top) * scaleY;
    const sWidth = rect.width * scaleX;
    const sHeight = rect.height * scaleY;

    ctx.drawImage(imageRef.current, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
    onConfirm(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/98 z-[100] flex flex-col items-center justify-center p-4 animate-fade-in touch-none">
      <div className="w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-900 transition p-2 bg-white rounded-full shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-8 space-y-6 flex-1 overflow-y-auto">
          <div className="relative w-full aspect-[3/2] bg-slate-200 rounded-3xl overflow-hidden border-4 border-slate-100 shadow-inner touch-none">
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div ref={containerRef} className="w-full h-full border-4 border-dashed border-white shadow-[0_0_0_9999px_rgba(15,23,42,0.75)]"></div>
            </div>

            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop"
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
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                touchAction: 'none'
              }}
            />
          </div>

          <div className="flex gap-8 items-center justify-center py-2">
            <button onClick={() => handleZoom(-0.2)} className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm transition flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <div className="text-center min-w-[90px]">
                <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest">Zoom</span>
                <span className="text-xl font-black text-slate-900">{Math.round(scale * 100)}%</span>
            </div>
            <button onClick={() => handleZoom(0.2)} className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm transition flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          <button 
              onClick={handleConfirm} 
              disabled={!hasInteracted}
              className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-sm shadow-2xl transition-all ${hasInteracted ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-400'}`}
          >
              Confirmar Documento
          </button>
          <button onClick={onCancel} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

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
  
  const [editingField, setEditingField] = useState<AssetField | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);

  const [assetUrls, setAssetUrls] = useState<Record<AssetField, string>>({
      docFront: '', docBack: '', facePhoto: '', selfieWithDoc: ''
  });
  
  const [uploadStatus, setUploadStatus] = useState<Record<AssetField, UploadStatus>>({
      docFront: 'idle', docBack: 'idle', facePhoto: 'idle', selfieWithDoc: 'idle'
  });

  const assetUrlsRef = useRef(assetUrls);
  assetUrlsRef.current = assetUrls;

  useEffect(() => {
    return () => {
      const urls = Object.values(assetUrlsRef.current);
      urls.forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) cleanupStorageUrl(url);
      });
    };
  }, []);
  
  useEffect(() => {
    if (!myProfile && !targetId) navigate('/professional');
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
        const reader = new FileReader();
        reader.onload = () => {
          setTempImage(reader.result as string);
          setEditingField(field);
        };
        reader.readAsDataURL(e.target.files[0]);
        e.target.value = '';
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
        setAssetUrls(prev => ({ ...prev, [fieldToUpdate]: fileUrl }));
        setUploadStatus(prev => ({ ...prev, [fieldToUpdate]: 'success' }));
        
        const profileUpdate: Partial<CleanerProfile> = {};
        if (fieldToUpdate === 'docFront') profileUpdate.documentFrontUrl = fileUrl;
        if (fieldToUpdate === 'docBack') profileUpdate.documentBackUrl = fileUrl;
        if (fieldToUpdate === 'facePhoto') profileUpdate.facePhotoUrl = fileUrl;
        if (fieldToUpdate === 'selfieWithDoc') profileUpdate.selfieWithDocUrl = fileUrl;
        updateCleanerProfile(targetId, profileUpdate);
    } catch (error) {
        setUploadStatus(prev => ({ ...prev, [fieldToUpdate]: 'error' }));
        alert(`O upload falhou. Tente novamente.`);
    }
  };

  const handleFinalSubmission = async () => {
    if (!targetId) return;
    setIsVerifying(true);
    updateCleanerProfile(targetId, { status: CleanerStatus.VERIFICATION_PENDING });
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  const renderUploadBox = (field: AssetField, title: string, icon: string, aspectRatio: '3/2' | '1/1' = '3/2') => {
    const status = uploadStatus[field];
    const url = assetUrls[field];
    
    return (
        <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block text-center">{title}</label>
            <div className="relative group cursor-pointer">
                <div className={`aspect-${aspectRatio} rounded-[32px] border-4 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${status === 'success' ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-slate-50 hover:border-blue-400'}`}>
                    {url && status !== 'error' ? (
                        <img src={url} className="w-full h-full object-cover" alt={title} />
                    ) : (
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-3xl">{status === 'uploading' ? '⏳' : icon}</div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{status === 'uploading' ? 'Enviando...' : 'Fazer Upload'}</span>
                        </div>
                    )}
                </div>
                <input type="file" accept="image/*" onChange={e => handleFileSelect(e, field)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 flex items-center justify-center font-sans overflow-x-hidden">
       {editingField && tempImage && (
         <ImageEditor 
           imageSrc={tempImage}
           title={editingField === 'facePhoto' ? 'Enquadrar Rosto' : 'Ajustar ID'}
           aspectRatio={editingField === 'facePhoto' ? 1 : 3/2}
           onConfirm={onCropConfirm}
           onCancel={() => { setEditingField(null); setTempImage(null); }}
         />
       )}
      
      <div className="max-w-2xl w-full bg-white rounded-[48px] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-12 text-center text-white relative">
           <div className="flex justify-center gap-4 mb-8">
               {[1, 2, 3].map(s => ( <div key={s} className={`h-1.5 w-12 rounded-full ${step >= s ? 'bg-green-500' : 'bg-slate-700'}`}></div> ))}
           </div>
           <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Verificação</h2>
           <p className="text-slate-400 text-sm font-medium">Precisamos validar sua identidade para segurança.</p>
        </div>

        <div className="p-12">
            {step === 1 && (
                <div className="space-y-12 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {renderUploadBox('docFront', 'Frente do ID', '🪪')}
                        {renderUploadBox('docBack', 'Verso do ID', '🔙')}
                    </div>
                    <button onClick={() => setStep(2)} disabled={uploadStatus.docFront !== 'success' || uploadStatus.docBack !== 'success'} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs disabled:opacity-20 transition active:scale-95">Próxima Etapa</button>
                </div>
            )}
            {step === 2 && (
                 <div className="space-y-12 animate-fade-in">
                    {renderUploadBox('facePhoto', 'Sua Foto de Perfil', '📸', '1/1')}
                    <div className="flex gap-4">
                        <button onClick={() => setStep(1)} className="flex-1 bg-slate-50 text-slate-400 py-6 rounded-3xl font-black uppercase text-xs">Voltar</button>
                        <button onClick={() => setStep(3)} disabled={uploadStatus.facePhoto !== 'success'} className="flex-[2] bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-xs disabled:opacity-20 transition active:scale-95">Próximo Passo</button>
                    </div>
                 </div>
            )}
            {step === 3 && (
                <div className="space-y-12 animate-fade-in text-center">
                    {renderUploadBox('selfieWithDoc', 'Selfie segurando ID', '🤳', '3/2')}
                    <div className="space-y-4">
                        <button onClick={handleFinalSubmission} disabled={uploadStatus.selfieWithDoc !== 'success' || isVerifying} className="w-full bg-green-600 text-white py-8 rounded-[36px] font-black uppercase text-sm shadow-xl disabled:opacity-50 transition active:scale-95">
                             {isVerifying ? 'Processando...' : 'Finalizar Cadastro'}
                        </button>
                        <button onClick={() => setStep(2)} className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Voltar</button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DocumentVerification;

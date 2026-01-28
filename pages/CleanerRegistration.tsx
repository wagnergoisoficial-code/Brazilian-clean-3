import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const CleanerRegistration: React.FC = () => {
  const { registerCleaner } = useAppContext();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'docs'>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [activeField, setActiveField] = useState<'photo' | 'document' | 'selfie' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    companyName: '',
    isCompany: false,
    yearsExperience: 0,
    services: [] as string[],
    zipCodes: '',
    description: '',
    photoUrl: '', 
    documentUrl: '',
    selfieUrl: ''
  });

  const availableServices = [
    'Faxina Padrão (Standard Cleaning)',
    'Deep Clean (Faxina Pesada)',
    'Mudança (Move-in/Move-out)',
    'Pós-Obra (Post-Construction)',
    'Limpeza Comercial (Commercial)',
    'Limpeza Residencial (Residential)',
    'Escritórios (Offices)',
    'Limpeza de Janelas (Windows)',
    'Limpeza Externa (Outdoor)',
    'Estofados e Carpetes (Upholstery & Carpets)',
    'Limpeza de Fogão (Stove)',
    'Limpeza de Forno (Oven)',
    'Limpeza de Geladeira (Refrigerator)',
    'Casas de Férias (Vacation Rentals)',
    'Lavanderia (Laundry)',
    'Organização (Organization)'
  ];

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service) 
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const startCamera = async (field: 'photo' | 'document' | 'selfie') => {
    setActiveField(field);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: field === 'selfie' || field === 'photo' ? 'user' : 'environment' } 
      });
      streamRef.current = stream;
      setTimeout(() => {
          if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      alert("Não foi possível acessar a câmera.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setCameraActive(false);
    setActiveField(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !activeField) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      if (activeField === 'photo') setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
      if (activeField === 'document') setFormData(prev => ({ ...prev, documentUrl: dataUrl }));
      if (activeField === 'selfie') setFormData(prev => ({ ...prev, selfieUrl: dataUrl }));
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photo' | 'document' | 'selfie') => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (field === 'photo') setFormData(prev => ({ ...prev, photoUrl: result }));
        if (field === 'document') setFormData(prev => ({ ...prev, documentUrl: result }));
        if (field === 'selfie') setFormData(prev => ({ ...prev, selfieUrl: result }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.fullName || !formData.phone || !formData.email) {
      alert("Preencha os dados básicos.");
      return;
    }
    
    setIsSubmitting(true);
    try {
        const id = await registerCleaner({
            ...formData,
            zipCodes: formData.zipCodes.split(',').map(z => z.trim()),
        });
        navigate(`/verify?id=${id}`);
    } catch (err) {
        alert("Erro no cadastro. Verifique sua conexão ou tente novamente mais tarde.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderUploadBox = (field: 'photo' | 'document' | 'selfie', label: string, subLabel: string, iconPath: string) => {
      let currentImage = '';
      if (field === 'photo') currentImage = formData.photoUrl;
      if (field === 'document') currentImage = formData.documentUrl;
      if (field === 'selfie') currentImage = formData.selfieUrl;

      return (
        <div className={`border-2 border-dashed rounded-xl p-4 transition relative overflow-hidden group ${currentImage ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
            <input type="file" accept="image/*" id={`file-${field}`} className="hidden" onChange={(e) => handleFileUpload(e, field)} />
            {currentImage ? (
                <div className="flex items-center gap-4">
                    <img src={currentImage} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm" />
                    <div className="flex-1">
                        <p className="font-bold text-green-700 text-sm">Arquivo Carregado!</p>
                        <p className="text-xs text-gray-500 mb-2">{label}</p>
                        <button type="button" onClick={() => {
                            if (field === 'photo') setFormData(prev => ({ ...prev, photoUrl: '' }));
                            if (field === 'document') setFormData(prev => ({ ...prev, documentUrl: '' }));
                            if (field === 'selfie') setFormData(prev => ({ ...prev, selfieUrl: '' }));
                        }} className="text-xs text-red-600 underline">Remover</button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-2">
                    <p className="font-bold text-gray-800 text-sm">{label}</p>
                    <p className="text-xs text-gray-500 mb-4">{subLabel}</p>
                    <div className="flex gap-2 justify-center">
                        <button type="button" onClick={() => document.getElementById(`file-${field}`)?.click()} className="bg-white border px-3 py-2 rounded-lg text-xs font-bold shadow-sm">Arquivo</button>
                        <button type="button" onClick={() => startCamera(field)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm">Câmera</button>
                    </div>
                </div>
            )}
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {cameraActive && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-lg aspect-[3/4] bg-black rounded-lg overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                  <div className="absolute inset-0 flex flex-col justify-between p-6">
                      <div className="flex justify-center">
                          <span className="bg-black/50 text-white px-4 py-1.5 rounded-full text-sm font-bold">{activeField}</span>
                      </div>
                      <div className="flex justify-center items-center gap-12">
                          <button onClick={stopCamera} className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">X</button>
                          <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-xl flex items-center justify-center"><div className="w-16 h-16 bg-red-500 rounded-full"></div></button>
                          <div className="w-12 h-12"></div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-slate-900 py-10 px-8 text-center text-white">
           <h2 className="text-3xl font-black uppercase tracking-tighter">Become a Professional</h2>
           <p className="text-slate-400 mt-2">Junte-se à maior rede de limpeza brasileira nos EUA.</p>
        </div>

        <div className="flex border-b border-gray-100 bg-slate-50">
           <button onClick={() => setActiveTab('personal')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition ${activeTab === 'personal' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>1. Personal</button>
           <button onClick={() => setActiveTab('business')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition ${activeTab === 'business' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>2. Business</button>
           <button onClick={() => setActiveTab('docs')} className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition ${activeTab === 'docs' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>3. Verification</button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {activeTab === 'personal' && (
            <div className="space-y-6 animate-fade-in">
               <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">Full Name</label>
                  <input required type="text" className="w-full bg-slate-50 border-0 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Ana Maria Silva" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">Phone</label>
                    <input required type="tel" className="w-full bg-slate-50 border-0 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(555) 000-0000" />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">Email</label>
                    <input required type="email" className="w-full bg-slate-50 border-0 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
                  </div>
               </div>
               <button type="button" onClick={() => setActiveTab('business')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl">Next: Business Details &rarr;</button>
            </div>
          )}

          {activeTab === 'business' && (
             <div className="space-y-6 animate-fade-in">
                <div>
                   <label className="block text-xs font-black uppercase text-slate-400 mb-2">Years of Experience</label>
                   <input required type="number" className="w-full bg-slate-50 border-0 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500" value={formData.yearsExperience} onChange={e => setFormData({...formData, yearsExperience: parseInt(e.target.value)})} />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">ZIP Codes (comma separated)</label>
                    <input required type="text" placeholder="94103, 94110" className="w-full bg-slate-50 border-0 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500" value={formData.zipCodes} onChange={e => setFormData({...formData, zipCodes: e.target.value})} />
                </div>
                <button type="button" onClick={() => setActiveTab('docs')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl">Next: Document Upload &rarr;</button>
             </div>
          )}

          {activeTab === 'docs' && (
             <div className="space-y-6 animate-fade-in">
                <div className="space-y-4">
                    {renderUploadBox('photo', 'Profile Photo', 'Professional headshot', '')}
                    {renderUploadBox('document', 'Government ID', 'Front and Back', '')}
                    {renderUploadBox('selfie', 'Selfie with ID', 'Biometric check', '')}
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying & Saving...' : 'Complete Registration 🚀'}
                </button>
             </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CleanerRegistration;
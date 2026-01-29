import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const ExpressMatch: React.FC = () => {
  const { createLead } = useAppContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    zipCode: '',
    serviceType: '',
    bedrooms: 2,
    bathrooms: 2,
    date: '',
    clientName: '',
    clientPhone: '',
    clientEmail: ''
  });

  const services = [
    { id: 'standard', name: 'Standard Clean', icon: '✨', desc: 'Dusting, mopping, general tidy up' },
    { id: 'deep', name: 'Deep Clean', icon: '🧽', desc: 'Inside cabinets, baseboards, appliances' },
    { id: 'move', name: 'Move In/Out', icon: '📦', desc: 'Empty home deep cleaning' },
    { id: 'post-construction', name: 'Post-Construction', icon: '🚧', desc: 'Removing dust and debris' },
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await createLead(formData);
      setStep(4);
    } catch (err: any) {
      console.error("Submission error:", err);
      // Extrai mensagem específica do domínio se houver
      const msg = err.message || "Falha ao enviar e-mail de verificação.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !formData.serviceType) return alert('Please select a service type');
    if (step === 2 && (!formData.zipCode || !formData.date)) return alert('Please fill in location and date');
    setStep(prev => prev + 1);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-teal-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        <div className="bg-blue-900 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-blue-800 opacity-50 transform rotate-3 scale-110"></div>
          <div className="relative z-10">
             <h1 className="text-3xl font-extrabold mb-2">Express Match™</h1>
             <p className="text-blue-100">Find a top-rated Brazilian cleaner in minutes.</p>
          </div>
        </div>

        <div className="h-2 bg-gray-100 w-full">
            <div 
              className="h-full bg-green-500 transition-all duration-500 ease-out"
              style={{ width: `${step === 4 ? 100 : (step / 3) * 100}%` }}
            ></div>
        </div>

        <div className="p-8">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    Falha no Envio
                  </p>
                  <p className="mt-1 opacity-90">{error}</p>
                </div>
                <button 
                  onClick={() => handleSubmit()} 
                  disabled={isSubmitting}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-sm shrink-0 ml-4 disabled:opacity-50"
                >
                  {isSubmitting ? 'Tentando...' : 'Tentar Novamente'}
                </button>
              </div>
              <p className="mt-3 text-[10px] opacity-60 uppercase font-bold tracking-wider">Servidor: mail.brazilianclean.org</p>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What kind of clean do you need?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setFormData({...formData, serviceType: s.name})}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      formData.serviceType === s.name 
                        ? 'border-green-500 bg-green-50 shadow-md ring-1 ring-green-500' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <div className="font-bold text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.desc}</div>
                  </button>
                ))}
              </div>
              <button onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-lg text-lg">
                Next: Location & Date &rarr;
              </button>
            </div>
          )}

          {step === 2 && (
             <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Where and When?</h2>
                <div className="space-y-6 mb-8">
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">ZIP Code</label>
                      <input 
                        type="text" 
                        maxLength={5}
                        value={formData.zipCode}
                        onChange={(e) => setFormData({...formData, zipCode: e.target.value.replace(/\D/g,'')})}
                        placeholder="e.g. 94103"
                        className="block w-full border-gray-300 rounded-lg shadow-sm border p-4 text-lg focus:ring-green-500 outline-none"
                        autoFocus
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Date</label>
                      <input 
                        type="date" 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="block w-full border-gray-300 rounded-lg shadow-sm border p-4 text-lg focus:ring-green-500 outline-none"
                      />
                   </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 text-gray-600 font-bold py-4 rounded-xl border border-gray-300 hover:bg-gray-50 transition">Back</button>
                  <button onClick={handleNext} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-lg text-lg">Next &rarr;</button>
                </div>
             </div>
          )}

          {step === 3 && (
             <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Info</h2>
                <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                   <input required type="text" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} placeholder="Full Name" className="block w-full border p-4 rounded-xl outline-none focus:border-green-500" />
                   <input required type="email" value={formData.clientEmail} onChange={(e) => setFormData({...formData, clientEmail: e.target.value})} placeholder="Email Address" className="block w-full border p-4 rounded-xl outline-none focus:border-green-500" />
                   <input required type="tel" value={formData.clientPhone} onChange={(e) => setFormData({...formData, clientPhone: e.target.value})} placeholder="Phone Number" className="block w-full border p-4 rounded-xl outline-none focus:border-green-500" />
                   
                   <div className="flex gap-4">
                    <button type="button" onClick={() => setStep(2)} className="flex-1 border p-4 rounded-xl hover:bg-gray-50 transition">Back</button>
                    <button type="submit" disabled={isSubmitting} className="flex-[2] bg-green-500 text-white font-bold py-4 rounded-xl disabled:opacity-50 shadow-lg shadow-green-100 transition-all flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                           <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                           Sending...
                        </>
                      ) : 'Broadcast Request 🚀'}
                    </button>
                  </div>
                </form>
             </div>
          )}

          {step === 4 && (
            <div className="animate-scale-in text-center py-8">
               <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               </div>
               <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Check Your Inbox</h2>
               <p className="text-lg text-gray-600 mb-8">We've sent a code to <strong>{formData.clientEmail}</strong>.</p>
               <button onClick={() => navigate('/verify?type=client')} className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:bg-black transition transform hover:scale-105 active:scale-95">Verify Now &rarr;</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpressMatch;
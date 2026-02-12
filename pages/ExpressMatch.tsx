
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const ExpressMatch: React.FC = () => {
  const { createLead } = useAppContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);

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
    
    // Simulate a price for the financial dashboard
    const basePrice = formData.serviceType === 'Deep Clean' ? 150 : 80;
    const estimatedValue = basePrice + (formData.bedrooms * 20) + (formData.bathrooms * 15);

    try {
      const id = await createLead({
        ...formData,
        estimatedValue,
        context: { origin: 'Express Match' }
      });
      setCreatedLeadId(id);
      setStep(4);
    } catch (err: any) {
      console.error("Submission error:", err);
      const msg = err.message || "Failed to send verification email.";
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
      <div className="max-w-2xl mx-auto bg-white rounded-[40px] shadow-2xl overflow-hidden">
        
        <div className="bg-slate-900 p-10 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
             <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter">Express Match™</h1>
             <p className="text-slate-400 font-medium">The high-discipline engine to find your perfect pro.</p>
          </div>
        </div>

        <div className="h-2 bg-slate-100 w-full">
            <div 
              className="h-full bg-green-500 transition-all duration-500 ease-out"
              style={{ width: `${step === 4 ? 100 : (step / 3) * 100}%` }}
            ></div>
        </div>

        <div className="p-10">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in">
              <p className="font-bold flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                Submission Failed
              </p>
              <p className="mt-1 opacity-90">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight uppercase">Select Cleaning Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setFormData({...formData, serviceType: s.name})}
                    className={`text-left p-6 rounded-3xl border-2 transition-all ${
                      formData.serviceType === s.name 
                        ? 'border-blue-600 bg-blue-50 shadow-lg ring-1 ring-blue-600' 
                        : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className="text-3xl mb-3">{s.icon}</div>
                    <div className="font-black text-slate-900 text-sm uppercase mb-1">{s.name}</div>
                    <div className="text-xs text-slate-500 font-medium">{s.desc}</div>
                  </button>
                ))}
              </div>
              <button onClick={handleNext} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition shadow-xl text-xs uppercase tracking-widest">
                Next Step &rarr;
              </button>
            </div>
          )}

          {step === 2 && (
             <div className="animate-fade-in">
                <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight uppercase">Location & Date</h2>
                <div className="space-y-6 mb-8">
                   <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">ZIP Code</label>
                      <input 
                        type="text" 
                        maxLength={5}
                        value={formData.zipCode}
                        onChange={(e) => setFormData({...formData, zipCode: e.target.value.replace(/\D/g,'')})}
                        placeholder="e.g. 32801"
                        className="block w-full border-slate-100 rounded-2xl bg-slate-50 border p-6 text-3xl font-black tracking-widest focus:ring-2 focus:ring-slate-900 outline-none transition text-center"
                        autoFocus
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Service Date</label>
                      <input 
                        type="date" 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="block w-full border-slate-100 rounded-2xl bg-slate-50 border p-5 text-lg font-bold focus:ring-2 focus:ring-slate-900 outline-none transition"
                      />
                   </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 text-slate-400 font-black py-5 rounded-2xl border-2 border-slate-50 hover:bg-slate-50 transition uppercase text-[10px] tracking-widest">Back</button>
                  <button onClick={handleNext} className="flex-[2] bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition shadow-xl uppercase text-xs tracking-widest">Continue &rarr;</button>
                </div>
             </div>
          )}

          {step === 3 && (
             <div className="animate-fade-in">
                <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight uppercase">Verify Information</h2>
                <form onSubmit={handleSubmit} className="space-y-5 mb-8">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Name</label>
                      <input required type="text" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} placeholder="Jane Doe" className="block w-full border p-5 rounded-2xl bg-slate-50 border-slate-50 focus:bg-white focus:border-slate-900 outline-none font-bold" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
                      <input required type="email" value={formData.clientEmail} onChange={(e) => setFormData({...formData, clientEmail: e.target.value})} placeholder="jane@example.com" className="block w-full border p-5 rounded-2xl bg-slate-50 border-slate-50 focus:bg-white focus:border-slate-900 outline-none font-bold" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone</label>
                      <input required type="tel" value={formData.clientPhone} onChange={(e) => setFormData({...formData, clientPhone: e.target.value})} placeholder="(407) 000-0000" className="block w-full border p-5 rounded-2xl bg-slate-50 border-slate-50 focus:bg-white focus:border-slate-900 outline-none font-bold" />
                   </div>
                   
                   <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setStep(2)} className="flex-1 border-2 border-slate-50 p-5 rounded-2xl hover:bg-slate-50 transition font-black text-slate-400 uppercase text-[10px] tracking-widest">Back</button>
                    <button type="submit" disabled={isSubmitting} className="flex-[2] bg-green-600 text-white font-black py-5 rounded-2xl disabled:opacity-50 shadow-2xl shadow-green-100 transition-all uppercase tracking-widest text-xs">
                      {isSubmitting ? 'Dispatching...' : 'Dispatch Request 🚀'}
                    </button>
                  </div>
                </form>
             </div>
          )}

          {step === 4 && (
            <div className="animate-scale-in text-center py-12">
               <div className="w-24 h-24 bg-green-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
               </div>
               <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Request Sent!</h2>
               <p className="text-lg text-slate-500 mb-10 font-medium">Verify your email to release this request to our verified Brazilian professionals.</p>
               <button onClick={() => navigate(`/verify?type=client&leadId=${createdLeadId}`)} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition transform active:scale-95">Verify & Start Matching &rarr;</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpressMatch;

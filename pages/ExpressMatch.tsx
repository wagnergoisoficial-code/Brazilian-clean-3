
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const ExpressMatch: React.FC = () => {
  const { createLead } = useAppContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    zipCode: '',
    serviceType: '',
    bedrooms: 2,
    bathrooms: 2,
    date: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '' // Added Email
  });

  const services = [
    { id: 'standard', name: 'Standard Clean', icon: '✨', desc: 'Dusting, mopping, general tidy up' },
    { id: 'deep', name: 'Deep Clean', icon: '🧽', desc: 'Inside cabinets, baseboards, appliances' },
    { id: 'move', name: 'Move In/Out', icon: '📦', desc: 'Empty home deep cleaning' },
    { id: 'post-construction', name: 'Post-Construction', icon: '🚧', desc: 'Removing dust and debris' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API delay for effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    createLead(formData);
    
    setIsSubmitting(false);
    setStep(4); // Success Step
  };

  const handleNext = () => {
    if (step === 1 && !formData.serviceType) return alert('Please select a service type');
    if (step === 2 && (!formData.zipCode || !formData.date)) return alert('Please fill in location and date');
    setStep(prev => prev + 1);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-teal-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-900 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-blue-800 opacity-50 transform rotate-3 scale-110"></div>
          <div className="relative z-10">
             <h1 className="text-3xl font-extrabold mb-2">Express Match™</h1>
             <p className="text-blue-100">Find a top-rated Brazilian cleaner in minutes.</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 w-full">
            <div 
              className="h-full bg-green-500 transition-all duration-500 ease-out"
              style={{ width: `${step === 4 ? 100 : (step / 3) * 100}%` }}
            ></div>
        </div>

        <div className="p-8">
          
          {/* STEP 1: SERVICE DETAILS */}
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
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                    <select 
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({...formData, bedrooms: parseInt(e.target.value)})}
                      className="block w-full border-gray-300 rounded-lg shadow-sm border p-3"
                    >
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                    <select 
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({...formData, bathrooms: parseInt(e.target.value)})}
                      className="block w-full border-gray-300 rounded-lg shadow-sm border p-3"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                 </div>
              </div>

              <button onClick={handleNext} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-lg text-lg">
                Next: Location & Date &rarr;
              </button>
            </div>
          )}

          {/* STEP 2: LOCATION & TIME */}
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
                        className="block w-full border-gray-300 rounded-lg shadow-sm border p-4 text-lg focus:ring-green-500 focus:border-green-500"
                        autoFocus
                      />
                   </div>
                   
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Date</label>
                      <input 
                        type="date" 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="block w-full border-gray-300 rounded-lg shadow-sm border p-4 text-lg focus:ring-green-500 focus:border-green-500"
                      />
                   </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 text-gray-600 font-bold py-4 rounded-xl border border-gray-300 hover:bg-gray-50 transition">
                    Back
                  </button>
                  <button onClick={handleNext} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition shadow-lg text-lg">
                    Next: Contact Info &rarr;
                  </button>
                </div>
             </div>
          )}

          {/* STEP 3: CONTACT INFO */}
          {step === 3 && (
             <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Who should we contact?</h2>
                <p className="text-gray-500 mb-6">Cleaners will see your request and contact you directly to confirm.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.clientName}
                        onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                        placeholder="John Doe"
                        disabled={isSubmitting}
                        className="block w-full border-gray-300 rounded-lg shadow-sm border p-4 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-400"
                      />
                   </div>
                   
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                      <input 
                        required
                        type="email" 
                        value={formData.clientEmail}
                        onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                        placeholder="john@example.com"
                        disabled={isSubmitting}
                        className="block w-full border-gray-300 rounded-lg shadow-sm border p-4 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-400"
                      />
                   </div>
                   
                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                      <input 
                        required
                        type="tel" 
                        value={formData.clientPhone}
                        onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                        placeholder="(555) 123-4567"
                        disabled={isSubmitting}
                        className="block w-full border-gray-300 rounded-lg shadow-sm border p-4 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-400"
                      />
                   </div>
                   
                   <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500 flex gap-3">
                      <svg className="w-5 h-5 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                      Your information is secure. A verification email will be sent to confirm your request.
                   </div>

                   <div className="flex gap-4">
                    <button type="button" disabled={isSubmitting} onClick={() => setStep(2)} className="flex-1 text-gray-600 font-bold py-4 rounded-xl border border-gray-300 hover:bg-gray-50 transition disabled:opacity-50">
                      Back
                    </button>
                    <button type="submit" disabled={isSubmitting} className="flex-[2] bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition shadow-lg text-lg flex justify-center items-center disabled:opacity-80 disabled:cursor-not-allowed">
                      {isSubmitting ? (
                         <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                         </>
                      ) : 'Broadcast Request 🚀'}
                    </button>
                  </div>
                </form>
             </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <div className="animate-scale-in text-center py-8">
               <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               </div>
               <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Request Received!</h2>
               <p className="text-lg text-gray-600 mb-8">
                 We've sent a simulated email to <strong>{formData.clientEmail}</strong>.
                 <br/><span className="text-sm bg-yellow-100 px-2 py-1 rounded text-yellow-800 font-bold">DEMO MODE: Check the top-right notification or simply verify on the next screen.</span>
               </p>
               <button onClick={() => navigate('/')} className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 transition">
                 Return Home
               </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ExpressMatch;

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus, PaymentMethodType, SubscriptionPlan, CleanerLevel } from '../types';
import { processSubscriptionPayment } from '../services/mockPaymentService';
import { getNextLevelThreshold } from '../services/meritService';
import { useNavigate } from 'react-router-dom';

// Component for rendering a badge based on the cleaner's level
const LevelBadge: React.FC<{ level: CleanerLevel; size?: 'sm' | 'lg' }> = ({ level, size = 'sm' }) => {
    const styles = {
        [CleanerLevel.BRONZE]: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '🥉' },
        [CleanerLevel.SILVER]: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700', icon: '🥈' },
        [CleanerLevel.GOLD]: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', icon: '🥇' }
    };
    const style = styles[level];
    return (
        <span className={`inline-flex items-center justify-center font-bold rounded-full border shadow-sm ${style.bg} ${style.border} ${style.text} ${size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-[10px] uppercase tracking-wide'}`}>
            <span className="mr-1.5">{style.icon}</span>
            {level}
        </span>
    );
};

// Modal component for uploading portfolio work (before/after photos)
const PortfolioUploadModal: React.FC<{ onClose: () => void; onUpload: (data: any) => void }> = ({ onClose, onUpload }) => {
    const [serviceType, setServiceType] = useState('Deep Clean');
    const [beforeImg, setBeforeImg] = useState('');
    const [afterImg, setAfterImg] = useState('');
    const [desc, setDesc] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>, setImg: (s: string) => void) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = () => setImg(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!beforeImg || !afterImg) return alert('Please upload both photos');
        setIsUploading(true);
        // Simulate network delay and compression
        await new Promise(r => setTimeout(r, 1000));
        await onUpload({ serviceType, beforeImage: beforeImg, afterImage: afterImg, description: desc });
        setIsUploading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <h3 className="font-bold">Add Portfolio Work</h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Service Type</label>
                        <select className="w-full p-3 border rounded-xl" value={serviceType} onChange={e => setServiceType(e.target.value)}>
                            <option>Deep Clean</option>
                            <option>Move In/Out</option>
                            <option>Standard Clean</option>
                            <option>Kitchen Detail</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Before Photo</label>
                            <div className="h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                                {beforeImg ? <img src={beforeImg} className="w-full h-full object-cover" alt="Before" /> : <span className="text-xs text-gray-400">Upload</span>}
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFile(e, setBeforeImg)} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">After Photo</label>
                            <div className="h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                                {afterImg ? <img src={afterImg} className="w-full h-full object-cover" alt="After" /> : <span className="text-xs text-gray-400">Upload</span>}
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFile(e, setAfterImg)} />
                            </div>
                        </div>
                    </div>
                    <div>
                         <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Description (Optional)</label>
                         <textarea className="w-full p-3 border rounded-xl" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Very greasy stove, took 2 hours..."></textarea>
                    </div>
                    <button disabled={isUploading} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition">
                        {isUploading ? 'Compressing & Uploading...' : 'Submit for Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Main dashboard component for cleaners to manage their profile and leads
const CleanerDashboard: React.FC = () => {
  const { cleaners, leads, acceptLead, setIsChatOpen, activateSubscription, addPortfolioItem } = useAppContext();
  const navigate = useNavigate();
  
  // Robust check for profile existence; uses the last registered cleaner as "current user" for demo purposes
  const myProfile = cleaners.length > 0 ? cleaners[cleaners.length - 1] : null; 

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  useEffect(() => {
    // Flow 1 Rule: If no profile exists, immediately redirect to Registration
    if (!myProfile) {
        navigate('/join');
        return;
    }

    if (myProfile.status === CleanerStatus.EMAIL_PENDING) {
        navigate(`/verify?id=${myProfile.id}`);
    }
  }, [myProfile, navigate]);

  // Fallback loading state while navigating
  if (!myProfile) {
    return (
      <div className="min-h-screen bg-teal-50 flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Professional Panel</h1>
            <div className="flex items-center gap-3 mt-2">
              <LevelBadge level={myProfile.level} size="lg" />
              <span className="text-sm font-bold text-slate-500">{myProfile.points} Experience Points</span>
            </div>
          </div>
          <button onClick={() => setShowPortfolioModal(true)} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg">
            Add Portfolio Work
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Account Metrics Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Account Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">Verification</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${myProfile.status === CleanerStatus.VERIFIED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {myProfile.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">Total Points</span>
                <span className="text-lg font-black text-blue-600">{myProfile.points}</span>
              </div>
              {getNextLevelThreshold(myProfile.level) && (
                <div className="mt-4 pt-4 border-t border-slate-50">
                   <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                     <span>Progress to Next Level</span>
                     <span>{myProfile.points} / {getNextLevelThreshold(myProfile.level)}</span>
                   </div>
                   <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all" 
                        style={{ width: `${(myProfile.points / getNextLevelThreshold(myProfile.level)!) * 100}%` }}
                      ></div>
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Management Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Subscription</h3>
             {myProfile.subscription?.isActive ? (
               <div className="space-y-4">
                 <div className="flex justify-between text-xs font-bold">
                   <span className="text-slate-500">Plan:</span>
                   <span className="text-slate-900">{myProfile.subscription.plan === SubscriptionPlan.PROMO_STARTUP ? 'PROMO $180/mo' : 'STANDARD $260/mo'}</span>
                 </div>
                 <div className="flex justify-between text-xs font-bold">
                   <span className="text-slate-500">Next Billing:</span>
                   <span className="text-slate-900">{new Date(myProfile.subscription.nextBillingDate).toLocaleDateString()}</span>
                 </div>
                 <div className="bg-green-50 text-green-700 text-[10px] font-black uppercase py-2 text-center rounded-lg border border-green-100">
                    Active & Verified
                 </div>
               </div>
             ) : (
               <div className="space-y-4">
                 <p className="text-xs text-slate-500 leading-relaxed">Activate your subscription to receive new customer leads.</p>
                 <button 
                   onClick={() => setSelectedPaymentMethod(PaymentMethodType.STRIPE)}
                   className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-black transition"
                 >
                   Activate Now
                 </button>
               </div>
             )}
          </div>

          {/* AI Assistant Call-to-Action */}
          <div className="bg-blue-600 p-6 rounded-3xl shadow-xl text-white">
             <h3 className="text-sm font-black text-blue-200 uppercase tracking-widest mb-4">Concierge Luna</h3>
             <p className="text-xs font-medium leading-relaxed mb-6">Need help with your profile or leads? Ask me anything!</p>
             <button onClick={() => setIsChatOpen(true)} className="w-full bg-white text-blue-600 py-3 rounded-xl text-xs font-bold hover:bg-blue-50 transition">
               Open Chat
             </button>
          </div>
        </div>

        {/* Available Customer Leads Feed */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
             <h2 className="text-2xl font-black text-slate-900">Leads Express™</h2>
             <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded">Live Feed</span>
          </div>

          <div className="grid gap-4">
            {leads.filter(l => l.status === 'OPEN').length === 0 ? (
               <div className="bg-white p-12 rounded-3xl text-center border-2 border-dashed border-slate-100">
                  <p className="text-slate-400 font-bold">No new leads available at this time.</p>
               </div>
            ) : (
              leads.filter(l => l.status === 'OPEN').map(lead => (
                <div key={lead.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-blue-200 transition">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">🧹</div>
                    <div>
                      <h4 className="font-bold text-lg">{lead.serviceType}</h4>
                      <div className="flex gap-4 mt-1 text-xs text-slate-400 font-bold">
                        <span>ZIP: {lead.zipCode}</span>
                        <span>Rooms: {lead.bedrooms}</span>
                        <span>Baths: {lead.bathrooms}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if(myProfile.subscription?.isActive) {
                        acceptLead(lead.id, myProfile.id);
                      } else {
                        alert("Please activate your subscription to accept leads.");
                      }
                    }}
                    className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold px-10 py-3 rounded-xl transition shadow-lg shadow-green-100"
                  >
                    Accept Lead
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showPortfolioModal && (
        <PortfolioUploadModal 
          onClose={() => setShowPortfolioModal(false)} 
          onUpload={(data) => addPortfolioItem(myProfile.id, data)}
        />
      )}

      {/* Mock Payment Processing Dialog */}
      {selectedPaymentMethod && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center animate-scale-in">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Activate Subscription</h3>
              <p className="text-slate-500 mb-8">Professional leads access starts at $180/month.</p>
              <div className="space-y-3">
                <button 
                  onClick={async () => {
                    setIsProcessingPayment(true);
                    try {
                      const sub = await processSubscriptionPayment(myProfile.id, PaymentMethodType.STRIPE);
                      activateSubscription(myProfile.id, sub);
                      setSelectedPaymentMethod(null);
                    } finally {
                      setIsProcessingPayment(false);
                    }
                  }}
                  disabled={isProcessingPayment}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition disabled:opacity-50"
                >
                  {isProcessingPayment ? 'Processing...' : 'Subscribe Securely'}
                </button>
                <button onClick={() => setSelectedPaymentMethod(null)} className="w-full text-slate-400 font-bold py-2 hover:text-slate-600">Maybe Later</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CleanerDashboard;
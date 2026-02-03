
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SupportType, UserRole } from '../types';

const Support: React.FC = () => {
  const { userRole, createSupportRequest } = useAppContext();
  const [activeTab, setActiveTab] = useState<SupportType>(SupportType.CLIENT);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (userRole === UserRole.CLEANER) {
        setActiveTab(SupportType.CLEANER);
    } else {
        setActiveTab(SupportType.CLIENT);
    }
  }, [userRole]);

  const [formData, setFormData] = useState({
      fullName: '',
      email: '',
      phone: '',
      whatsapp: '',
      message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createSupportRequest({
          type: activeTab,
          fullName: formData.fullName,
          contactEmail: activeTab === SupportType.CLIENT ? formData.email : undefined,
          contactPhone: formData.phone,
          whatsapp: activeTab === SupportType.CLEANER ? formData.whatsapp : undefined,
          message: formData.message
      });
      setSubmitted(true);
      window.scrollTo(0,0);
  };

  const resetForm = () => {
      setSubmitted(false);
      setFormData({ fullName: '', email: '', phone: '', whatsapp: '', message: '' });
  };

  if (submitted) {
      return (
          <div className="min-h-[calc(100vh-64px)] bg-teal-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full p-12 text-center animate-scale-in border border-slate-100">
                  <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <svg className="w-12 h-12 text-[#009739]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  {activeTab === SupportType.CLIENT ? (
                      <>
                        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter uppercase">Request Received</h2>
                        <p className="text-slate-500 mb-8 font-medium">
                            Our team will review your inquiry and reach out within <strong>24 business hours</strong>.
                        </p>
                      </>
                  ) : (
                      <>
                        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter uppercase">Solicitação Recebida</h2>
                        <p className="text-slate-500 mb-8 font-medium">
                            Sua mensagem foi entregue. Nossa equipe entrará em contato via <strong>WhatsApp</strong> em breve.
                        </p>
                      </>
                  )}
                  <button onClick={resetForm} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition shadow-lg uppercase text-xs tracking-widest">
                      {activeTab === SupportType.CLIENT ? 'Send New Message' : 'Nova Mensagem'}
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-teal-50 py-12 lg:py-24 px-4 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        {/* LEFT COLUMN: FORM */}
        <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100 animate-fade-in order-2 lg:order-1">
          <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${activeTab === SupportType.CLIENT ? 'bg-[#002868]' : 'bg-[#009739]'}`}></div>
              <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">Support Center</h1>
              <p className="text-slate-400 font-medium">Our dedicated team is here to help you.</p>
          </div>

          <div className="flex border-b border-gray-100 bg-slate-50/50">
              <button 
                  onClick={() => setActiveTab(SupportType.CLIENT)}
                  className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-center transition-all ${activeTab === SupportType.CLIENT ? 'bg-white text-[#002868] border-b-4 border-[#002868]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  🇺🇸 Client Support
              </button>
              <button 
                  onClick={() => setActiveTab(SupportType.CLEANER)}
                  className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-center transition-all ${activeTab === SupportType.CLEANER ? 'bg-white text-[#009739] border-b-4 border-[#009739]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  🇧🇷 Suporte Profissional
              </button>
          </div>

          <div className="p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name / Nome</label>
                          <input required type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-900 outline-none transition font-bold" placeholder="Your Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone / Telefone</label>
                          <input required type="tel" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-900 outline-none transition font-bold" placeholder="(000) 000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                  </div>

                  <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">{activeTab === SupportType.CLIENT ? 'Email Address' : 'WhatsApp de Contato'}</label>
                      <input 
                        required 
                        type={activeTab === SupportType.CLIENT ? 'email' : 'tel'} 
                        className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-900 outline-none transition font-bold" 
                        placeholder={activeTab === SupportType.CLIENT ? "email@example.com" : "(000) 000-0000"} 
                        value={activeTab === SupportType.CLIENT ? formData.email : formData.whatsapp} 
                        onChange={e => activeTab === SupportType.CLIENT ? setFormData({...formData, email: e.target.value}) : setFormData({...formData, whatsapp: e.target.value})} 
                      />
                  </div>

                  <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest">Message / Mensagem</label>
                      <textarea required rows={4} className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-slate-900 outline-none transition font-bold resize-none" placeholder="How can we assist you?" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                  </div>

                  <button 
                    type="submit" 
                    className={`w-full text-white font-black py-5 rounded-2xl shadow-xl transition transform active:scale-95 uppercase tracking-widest text-xs ${activeTab === SupportType.CLIENT ? 'bg-[#002868] hover:bg-black' : 'bg-[#009739] hover:bg-black'}`}
                  >
                      {activeTab === SupportType.CLIENT ? 'Submit Support Request' : 'Enviar Solicitação de Ajuda'}
                  </button>
              </form>
          </div>
        </div>

        {/* RIGHT COLUMN: SUPPORT AGENT IMAGE */}
        <div className="w-full order-1 lg:order-2 animate-fade-in">
           <div className="relative">
              <div className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] opacity-40 ${activeTab === SupportType.CLIENT ? 'bg-[#002868]' : 'bg-[#009739]'}`}></div>
              
              <div className="relative z-10 w-full aspect-[5/6] bg-white rounded-[3.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] border-[16px] border-white group">
                  <img 
                    src="https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=1200" 
                    alt="Professional Support" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  
                  <div className="absolute bottom-10 left-10 right-10 bg-white/95 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl border border-white/50 animate-slide-in-up">
                      <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg ${activeTab === SupportType.CLIENT ? 'bg-[#002868]' : 'bg-[#009739]'}`}>
                                {activeTab === SupportType.CLIENT ? '🇺🇸' : '🇧🇷'}
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
                          </div>
                          <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Human Service</p>
                              <p className="text-xl font-bold text-slate-900 tracking-tight">Atendimento Humanizado</p>
                              <p className="text-[11px] text-slate-500 font-medium mt-1">Nós falamos a sua língua.</p>
                          </div>
                      </div>
                  </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Support;

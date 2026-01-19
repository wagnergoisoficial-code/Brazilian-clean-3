import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SupportType, UserRole } from '../types';

const Support: React.FC = () => {
  const { userRole, createSupportRequest } = useAppContext();
  const [activeTab, setActiveTab] = useState<SupportType>(SupportType.CLIENT);
  const [submitted, setSubmitted] = useState(false);

  // Auto-select tab based on role context
  useEffect(() => {
    if (userRole === UserRole.CLEANER) {
        setActiveTab(SupportType.CLEANER);
    } else {
        setActiveTab(SupportType.CLIENT);
    }
  }, [userRole]);

  // Form States
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
          <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center animate-fade-in">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  {activeTab === SupportType.CLIENT ? (
                      <>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Received</h2>
                        <p className="text-gray-600 mb-6">
                            Thank you for contacting us. We have sent a confirmation to your email.
                            <br/><br/>
                            Our team will review your request and contact you within <strong>24 hours</strong>.
                        </p>
                      </>
                  ) : (
                      <>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Recebida</h2>
                        <p className="text-gray-600 mb-6">
                            Obrigado pelo contato. Enviamos uma confirmação.
                            <br/><br/>
                            Nossa equipe entrará em contato com você pelo <strong>WhatsApp</strong> em até 24 horas.
                        </p>
                      </>
                  )}
                  <button onClick={resetForm} className="text-blue-600 hover:text-blue-800 font-medium text-sm underline">
                      {activeTab === SupportType.CLIENT ? 'Send another request' : 'Enviar outra solicitação'}
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        
        {/* Header Section */}
        <div className="bg-slate-900 p-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Support Center</h1>
            <p className="text-slate-400">We are here to help. Select your profile below.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 bg-gray-50">
            <button 
                onClick={() => setActiveTab(SupportType.CLIENT)}
                className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${activeTab === SupportType.CLIENT ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                I am a Client (Homeowner)
            </button>
            <button 
                onClick={() => setActiveTab(SupportType.CLEANER)}
                className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${activeTab === SupportType.CLEANER ? 'bg-white text-green-600 border-t-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Sou Profissional (Limpeza)
            </button>
        </div>

        {/* Forms */}
        <div className="p-8">
            {activeTab === SupportType.CLIENT ? (
                // CLIENT FORM (ENGLISH)
                <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                        <h3 className="text-blue-800 font-bold mb-1">How can we help?</h3>
                        <p className="text-blue-600 text-sm">Please provide details about your inquiry. We respond to all requests within 24 hours.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                            <input 
                                required 
                                type="email" 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                            <input 
                                required 
                                type="tel" 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="(555) 123-4567"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                        <textarea 
                            required 
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            placeholder="Describe your issue or question..."
                            value={formData.message}
                            onChange={e => setFormData({...formData, message: e.target.value})}
                        />
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-lg">
                        Submit Request
                    </button>
                </form>
            ) : (
                // CLEANER FORM (PORTUGUESE)
                <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
                     <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6">
                        <h3 className="text-green-800 font-bold mb-1">Como podemos ajudar?</h3>
                        <p className="text-green-600 text-sm">Preencha os dados abaixo. Nossa equipe entrará em contato via WhatsApp para agilizar seu atendimento.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome Completo</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                            placeholder="Maria Silva"
                            value={formData.fullName}
                            onChange={e => setFormData({...formData, fullName: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Celular</label>
                            <input 
                                required 
                                type="tel" 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                placeholder="(00) 00000-0000"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp (para contato)</label>
                            <input 
                                required 
                                type="tel" 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                placeholder="(00) 00000-0000"
                                value={formData.whatsapp}
                                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Mensagem</label>
                        <textarea 
                            required 
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                            placeholder="Descreva sua dúvida ou problema..."
                            value={formData.message}
                            onChange={e => setFormData({...formData, message: e.target.value})}
                        />
                    </div>

                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition shadow-lg">
                        Enviar Solicitação
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default Support;
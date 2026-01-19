import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

const CleanerRegistration: React.FC = () => {
  const { registerCleaner, setUserRole } = useAppContext();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'docs'>('personal');
  const [isSuccess, setIsSuccess] = useState(false); // New Success State
  
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
    photoUrl: 'https://via.placeholder.com/200',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.fullName || !formData.phone || !formData.email || !formData.city) {
      alert("Por favor, preencha todos os dados pessoais.");
      return;
    }
    
    registerCleaner({
        ...formData,
        zipCodes: formData.zipCodes.split(',').map(z => z.trim()),
    });
    
    // Do NOT set user role or navigate immediately. Show success message.
    setIsSuccess(true);
    window.scrollTo(0,0);
  };

  if (isSuccess) {
      return (
          <div className="min-h-screen bg-teal-50 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-scale-in">
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifique seu Email</h2>
                 <p className="text-gray-600 mb-6">
                     Enviamos um link de confirmação para <strong>{formData.email}</strong>.
                     <br/><br/>
                     Por favor, clique no link para ativar sua conta. Seu perfil será analisado após a confirmação.
                 </p>
                 <button onClick={() => navigate('/')} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition">
                     Voltar para Home
                 </button>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 py-8 px-8 text-center">
           <h2 className="text-3xl font-extrabold text-white">Cadastro de Profissional</h2>
           <p className="text-green-100 mt-2">Junte-se à plataforma número 1 de limpeza brasileira nos EUA.</p>
        </div>

        {/* Steps */}
        <div className="flex border-b border-gray-200">
           <button 
             onClick={() => setActiveTab('personal')}
             className={`flex-1 py-4 text-sm font-medium text-center transition ${activeTab === 'personal' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'}`}
           >
             1. Dados Pessoais
           </button>
           <button 
             onClick={() => setActiveTab('business')}
             className={`flex-1 py-4 text-sm font-medium text-center transition ${activeTab === 'business' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'}`}
           >
             2. Dados Profissionais
           </button>
           <button 
             onClick={() => setActiveTab('docs')}
             className={`flex-1 py-4 text-sm font-medium text-center transition ${activeTab === 'docs' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'}`}
           >
             3. Verificação
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* PERSONAL DATA */}
          {activeTab === 'personal' && (
            <div className="space-y-4 animate-fade-in">
               <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Quem é você?</h3>
               <div>
                  <label className="block text-sm font-medium text-gray-700">Nome Completo (como no documento)</label>
                  <input required type="text" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm border p-3 focus:ring-green-500 focus:border-green-500" 
                    value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Ex: Ana Maria Silva" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Celular (com DDD)</label>
                    <input required type="tel" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm border p-3 focus:ring-green-500 focus:border-green-500"
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(555) 000-0000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input required type="email" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm border p-3 focus:ring-green-500 focus:border-green-500"
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemplo.com" />
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cidade</label>
                    <input required type="text" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm border p-3 focus:ring-green-500 focus:border-green-500"
                      value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <input required type="text" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm border p-3 focus:ring-green-500 focus:border-green-500"
                      value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="Ex: CA, FL, MA" />
                  </div>
               </div>
               <button type="button" onClick={() => setActiveTab('business')} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                 Próximo: Dados Profissionais &rarr;
               </button>
            </div>
          )}

          {/* BUSINESS DATA */}
          {activeTab === 'business' && (
             <div className="space-y-4 animate-fade-in">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Seu Negócio</h3>
                
                <div className="flex items-center gap-4 mb-4">
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="companyType" checked={!formData.isCompany} onChange={() => setFormData({...formData, isCompany: false})} className="text-green-600 focus:ring-green-500"/>
                      <span>Sou Autônoma(o)</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="companyType" checked={formData.isCompany} onChange={() => setFormData({...formData, isCompany: true})} className="text-green-600 focus:ring-green-500"/>
                      <span>Tenho Empresa (LLC/Corp)</span>
                   </label>
                </div>

                {formData.isCompany && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
                    <input type="text" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm border p-3 focus:ring-green-500 focus:border-green-500"
                      value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Ex: Best Cleaning LLC" />
                  </div>
                )}

                <div>
                   <label className="block text-sm font-medium text-gray-700">Anos de Experiência</label>
                   <input required type="number" min="0" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm border p-3 focus:ring-green-500 focus:border-green-500"
                      value={formData.yearsExperience} onChange={e => setFormData({...formData, yearsExperience: parseInt(e.target.value)})} />
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Serviços Oferecidos</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableServices.map(service => (
                         <div key={service} 
                              onClick={() => handleServiceToggle(service)}
                              className={`cursor-pointer p-3 rounded-lg border text-sm flex items-center gap-2 transition ${formData.services.includes(service) ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.services.includes(service) ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}>
                                 {formData.services.includes(service) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                              </div>
                              {service}
                         </div>
                      ))}
                   </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">ZIP Codes Atendidos (separados por vírgula)</label>
                    <input required type="text" placeholder="94103, 94110, 94015" className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm border p-3 focus:ring-green-500 focus:border-green-500"
                    value={formData.zipCodes} onChange={e => setFormData({...formData, zipCodes: e.target.value})} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição / Bio (Português)</label>
                    <textarea required rows={3} className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm border p-3 focus:ring-green-500 focus:border-green-500"
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Conte um pouco sobre seu trabalho..." />
                </div>

                <div className="flex gap-4">
                   <button type="button" onClick={() => setActiveTab('personal')} className="flex-1 text-gray-600 py-3 rounded-lg font-bold border border-gray-300 hover:bg-gray-50 transition">
                      &larr; Voltar
                   </button>
                   <button type="button" onClick={() => setActiveTab('docs')} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                      Próximo: Verificação &rarr;
                   </button>
                </div>
             </div>
          )}

          {/* DOCUMENTS / VERIFICATION */}
          {activeTab === 'docs' && (
             <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Verificação de Segurança</h3>
                
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex gap-3">
                   <div className="text-yellow-600 mt-1">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                   </div>
                   <div className="text-sm text-yellow-800">
                      <p className="font-bold">Obrigatório</p>
                      <p>Para aparecer na busca e receber leads, você deve enviar seus documentos. Seus dados estão seguros.</p>
                   </div>
                </div>

                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition cursor-pointer bg-gray-50">
                       <p className="font-medium text-gray-700">Foto de Perfil (Rosto)</p>
                       <p className="text-xs text-gray-500 mt-1">Clique para enviar (Simulado)</p>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition cursor-pointer bg-gray-50">
                       <p className="font-medium text-gray-700">Documento de Identidade (Frente e Verso)</p>
                       <p className="text-xs text-gray-500 mt-1">Passaporte, Driver License ou RG</p>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition cursor-pointer bg-gray-50">
                       <p className="font-medium text-gray-700">Selfie segurando o Documento</p>
                       <p className="text-xs text-gray-500 mt-1">Para provar que é você</p>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setActiveTab('business')} className="flex-1 text-gray-600 py-3 rounded-lg font-bold border border-gray-300 hover:bg-gray-50 transition">
                      &larr; Voltar
                   </button>
                   <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-lg">
                      Finalizar Cadastro
                   </button>
                </div>
             </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default CleanerRegistration;
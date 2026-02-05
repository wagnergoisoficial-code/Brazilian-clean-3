
import React, { useState } from 'react';
import { CleanerProfile, CleanerStatus } from '../../types';
import { useAppContext } from '../../context/AppContext';

const SERVICES_LIST = {
  'residential_cleaning': 'Limpeza Residencial (Standard)',
  'recurring_cleaning_weekly': 'Limpeza Semanal',
  'recurring_cleaning_biweekly': 'Limpeza Quinzenal',
  'recurring_cleaning_monthly': 'Limpeza Mensal',
  'deep_cleaning': 'Limpeza Pesada (Deep Clean)',
  'move_in_out': 'Mudança (Move In / Out)',
  'office_cleaning': 'Limpeza de Escritório',
  'commercial_cleaning': 'Limpeza Comercial',
  'window_cleaning': 'Limpeza de Janelas',
  'oven_cleaning': 'Limpeza de Forno',
  'refrigerator_cleaning': 'Limpeza de Geladeira',
  'carpet_cleaning': 'Limpeza de Tapetes/Carpetes',
  'sofa_cleaning': 'Limpeza de Sofá',
  'deck_cleaning': 'Limpeza de Deck/Pátio',
  'laundry_ironing': 'Lavar e Passar Roupa',
  'mommy_helper': 'Mommy Helper',
  'elder_care': 'Cuidado com Idosos',
  'pet_care': 'Cuidado com Pets',
  'express_cleaning': 'Limpeza Expressa',
  'organization_service': 'Serviço de Organização',
  'babysitting': 'Babysitting'
};

const ProfileStatusBadge: React.FC<{ status: CleanerStatus }> = ({ status }) => {
    const statusMap = {
        [CleanerStatus.ACTIVE]: { text: 'Ativo e Verificado', color: 'bg-emerald-100 text-emerald-800' },
        [CleanerStatus.VERIFICATION_PENDING]: { text: 'Verificação Pendente', color: 'bg-yellow-100 text-yellow-800' },
        [CleanerStatus.LIMITED]: { text: 'Limitado', color: 'bg-orange-100 text-orange-800' },
        [CleanerStatus.REJECTED]: { text: 'Rejeitado', color: 'bg-red-100 text-red-800' },
        [CleanerStatus.EMAIL_VERIFIED]: { text: 'Perfil Incompleto', color: 'bg-blue-100 text-blue-800' },
        [CleanerStatus.CREATED]: { text: 'E-mail não verificado', color: 'bg-slate-100 text-slate-800' }
    };
    const { text, color } = statusMap[status] || statusMap[CleanerStatus.CREATED];
    return <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${color}`}>{text}</span>;
}

const CleanerProfileTab: React.FC<{ profile: CleanerProfile }> = ({ profile }) => {
    const { updateCleanerProfile } = useAppContext();
    const [editSection, setEditSection] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<CleanerProfile>>(profile);

    const handleSave = (section: string) => {
        updateCleanerProfile(profile.id, formData);
        setEditSection(null);
    }
    
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <img src={profile.photoUrl || `https://ui-avatars.com/api/?name=${profile.fullName}&background=0D8ABC&color=fff`} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                <div>
                    <h3 className="text-xl font-bold">{profile.fullName}</h3>
                    <ProfileStatusBadge status={profile.status} />
                </div>
            </div>

            {/* Business Details Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-bold">Dados Comerciais</h4>
                    {editSection !== 'business' ? 
                        <button onClick={() => setEditSection('business')} className="text-sm font-bold text-blue-600">Editar</button> :
                        <button onClick={() => handleSave('business')} className="text-sm font-bold text-emerald-600">Salvar</button>
                    }
                </div>
                {editSection === 'business' ? (
                     <div className="space-y-4">
                        <input value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full p-2 border rounded" />
                        <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 border rounded" />
                        {profile.isCompany && <input value={formData.ein} onChange={e => setFormData({...formData, ein: e.target.value})} className="w-full p-2 border rounded" />}
                     </div>
                ) : (
                    <div className="space-y-2 text-sm text-slate-600">
                        <p><strong>Nome Comercial:</strong> {profile.companyName}</p>
                        <p><strong>Endereço:</strong> {profile.address}</p>
                        <p><strong>Tipo:</strong> {profile.isCompany ? 'Empresa (LLC)' : 'Individual'}</p>
                        {profile.isCompany && <p><strong>EIN:</strong> {profile.ein}</p>}
                    </div>
                )}
            </div>

            {/* Services Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                 <h4 className="text-lg font-bold mb-4">Serviços Oferecidos</h4>
                 <div className="flex flex-wrap gap-2">
                    {profile.services.map(key => (
                       <span key={key} className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full">{SERVICES_LIST[key as keyof typeof SERVICES_LIST] || key}</span>
                    ))}
                 </div>
            </div>
        </div>
    );
};

export default CleanerProfileTab;

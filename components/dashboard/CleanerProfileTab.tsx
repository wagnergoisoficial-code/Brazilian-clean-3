
import React, { useState } from 'react';
import { CleanerProfile, CleanerStatus } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

const SERVICES_LIST: Record<string, string> = {
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

const ProfileSection: React.FC<{title: string, onEdit?: () => void, onSave?: () => void, isEditing?: boolean, children: React.ReactNode}> = 
({title, onEdit, onSave, isEditing, children}) => (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-slate-900">{title}</h4>
            {isEditing ? (
                 <button onClick={onSave} className="text-sm font-bold text-emerald-600 hover:text-emerald-800">Salvar</button>
            ) : (
                 <button onClick={onEdit} className="text-sm font-bold text-blue-600 hover:text-blue-800">Editar</button>
            )}
        </div>
        {children}
    </div>
);


const CleanerProfileTab: React.FC<{ profile: CleanerProfile }> = ({ profile }) => {
    const { updateCleanerProfile } = useAppContext();
    const navigate = useNavigate();
    const [editSection, setEditSection] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<CleanerProfile>>(profile);

    const handleSave = (section: string) => {
        updateCleanerProfile(profile.id, formData);
        setEditSection(null);
    }

    const handleInputChange = (field: keyof CleanerProfile, value: any) => {
      setFormData(prev => ({...prev, [field]: value}));
    }
    
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-6 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                <img src={profile.photoUrl || `https://ui-avatars.com/api/?name=${profile.fullName}&background=0D8ABC&color=fff`} alt="Profile" className="w-20 h-20 rounded-full object-cover shadow-md" />
                <div>
                    <h3 className="text-2xl font-black">{profile.fullName}</h3>
                    <p className="text-sm text-slate-500 font-medium">{profile.email}</p>
                    <div className="mt-3"><ProfileStatusBadge status={profile.status} /></div>
                </div>
            </div>

            {/* Business Details Section */}
            <ProfileSection 
                title="Dados Comerciais" 
                isEditing={editSection === 'business'} 
                onEdit={() => setEditSection('business')}
                onSave={() => handleSave('business')}
            >
                {editSection === 'business' ? (
                     <div className="space-y-4 text-sm">
                        <input value={formData.companyName} onChange={e => handleInputChange('companyName', e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Nome Comercial" />
                        <input value={formData.address} onChange={e => handleInputChange('address', e.target.value)} className="w-full p-3 border rounded-lg" placeholder="Endereço Completo"/>
                        {profile.isCompany && <input value={formData.ein} onChange={e => handleInputChange('ein', e.target.value)} className="w-full p-3 border rounded-lg" placeholder="EIN"/>}
                     </div>
                ) : (
                    <div className="space-y-3 text-sm text-slate-600 font-medium">
                        <p><strong>Nome Comercial:</strong> {profile.companyName || 'Não informado'}</p>
                        <p><strong>Endereço:</strong> {profile.address || 'Não informado'}</p>
                        <p><strong>Tipo:</strong> {profile.isCompany ? 'Empresa (LLC)' : 'Individual'}</p>
                        {profile.isCompany && <p><strong>EIN:</strong> {profile.ein || 'Não informado'}</p>}
                    </div>
                )}
            </ProfileSection>

             {/* Public Profile Section */}
            <ProfileSection 
                title="Perfil Público" 
                isEditing={editSection === 'public'} 
                onEdit={() => setEditSection('public')}
                onSave={() => handleSave('public')}
            >
                {editSection === 'public' ? (
                     <div className="space-y-4 text-sm">
                        <textarea value={formData.description} onChange={e => handleInputChange('description', e.target.value)} className="w-full p-3 border rounded-lg" rows={4} placeholder="Sua descrição para clientes..."></textarea>
                     </div>
                ) : (
                    <div className="space-y-3 text-sm text-slate-600 font-medium">
                        <p><strong>Descrição:</strong> <span className="italic">"{profile.description || 'Nenhuma descrição fornecida.'}"</span></p>
                    </div>
                )}
            </ProfileSection>

            {/* Services & Area Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                 <h4 className="text-lg font-bold mb-4">Serviços e Área de Atuação</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h5 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Serviços Oferecidos</h5>
                        <div className="flex flex-wrap gap-2">
                            {profile.services.map(key => (
                            <span key={key} className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full">{SERVICES_LIST[key] || key}</span>
                            ))}
                        </div>
                        <button onClick={() => navigate(`/setup-services?id=${profile.id}`)} className="text-blue-600 text-xs font-bold mt-4">Editar Serviços</button>
                    </div>
                     <div>
                        <h5 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Área de Atendimento</h5>
                        <p className="text-sm text-slate-600 font-medium"><strong>ZIP Base:</strong> {profile.baseZip}</p>
                        <p className="text-sm text-slate-600 font-medium"><strong>Raio:</strong> {profile.serviceRadius} milhas</p>
                        <button onClick={() => navigate(`/setup-area?id=${profile.id}`)} className="text-blue-600 text-xs font-bold mt-4">Editar Área</button>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default CleanerProfileTab;

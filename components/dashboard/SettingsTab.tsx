
import React, { useState } from 'react';
import { CleanerProfile } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

const SettingsTab: React.FC<{ profile: CleanerProfile }> = ({ profile }) => {
    const { updateCleanerProfile, deleteMyAccount } = useAppContext();
    const navigate = useNavigate();
    const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
    const [notifications, setNotifications] = useState(profile.notificationSettings || { newLeads: true, newMessages: true });
    
    const handleSavePassword = () => {
        if (password.new !== password.confirm) {
            alert("As novas senhas não coincidem.");
            return;
        }
        if (password.new.length < 6) {
            alert("A nova senha deve ter pelo menos 6 caracteres.");
            return;
        }
        // In a real app, we'd verify the current password on the backend
        updateCleanerProfile(profile.id, { password: password.new });
        alert("Senha atualizada com sucesso!");
        setPassword({ current: '', new: '', confirm: '' });
    };

    const handleNotificationChange = (key: 'newLeads' | 'newMessages') => {
        const newSettings = { ...notifications, [key]: !notifications[key] };
        setNotifications(newSettings);
        updateCleanerProfile(profile.id, { notificationSettings: newSettings });
    };

    const handleDeleteAccount = () => {
        const confirmation = prompt("Esta ação é irreversível. Para confirmar, digite 'DELETAR MINHA CONTA' abaixo:");
        if (confirmation === "DELETAR MINHA CONTA") {
            deleteMyAccount();
            navigate('/');
        } else {
            alert("A confirmação não corresponde. A conta não foi deletada.");
        }
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Security Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-lg font-bold mb-6">Segurança</h4>
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="text-xs font-bold text-slate-500">Senha Atual</label>
                        <input type="password" value={password.current} onChange={e => setPassword({...password, current: e.target.value})} className="w-full p-2 mt-1 border rounded" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Nova Senha</label>
                        <input type="password" value={password.new} onChange={e => setPassword({...password, new: e.target.value})} className="w-full p-2 mt-1 border rounded" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">Confirmar Nova Senha</label>
                        <input type="password" value={password.confirm} onChange={e => setPassword({...password, confirm: e.target.value})} className="w-full p-2 mt-1 border rounded" />
                    </div>
                    <button onClick={handleSavePassword} className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-bold">Atualizar Senha</button>
                </div>
            </div>

            {/* Notifications Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-lg font-bold mb-6">Notificações</h4>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p>Receber e-mail sobre novos leads</p>
                        <button onClick={() => handleNotificationChange('newLeads')} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${notifications.newLeads ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${notifications.newLeads ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <div className="flex justify-between items-center">
                        <p>Receber e-mail sobre novas mensagens</p>
                         <button onClick={() => handleNotificationChange('newMessages')} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${notifications.newMessages ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${notifications.newMessages ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Language Section Placeholder */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-lg font-bold mb-4">Idioma / Language</h4>
                <p className="text-sm text-slate-500">A configuração de idioma será disponibilizada em breve.</p>
            </div>

            {/* Privacy Section Placeholder */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-lg font-bold mb-4">Privacidade</h4>
                <p className="text-sm text-slate-500">Opções de gerenciamento de dados estarão disponíveis aqui.</p>
            </div>

            {/* Danger Zone */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-200">
                <h4 className="text-lg font-bold text-red-600">Zona de Perigo</h4>
                <div className="mt-4 flex justify-between items-center">
                    <div>
                        <p className="font-bold">Deletar minha conta</p>
                        <p className="text-sm text-slate-500">Esta ação é permanente e não pode ser desfeita.</p>
                    </div>
                    <button onClick={handleDeleteAccount} className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-red-700">Deletar Conta</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;

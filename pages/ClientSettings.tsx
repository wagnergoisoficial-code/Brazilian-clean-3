
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const ClientSettings: React.FC = () => {
  const { clients, authenticatedClientId, updateClientProfile } = useAppContext();
  const client = clients.find(c => c.id === authenticatedClientId);
  
  const [formData, setFormData] = useState({
      fullName: client?.fullName || '',
      email: client?.email || '',
      phone: client?.phone || '',
      notifications: true
  });
  const [isSaved, setIsSaved] = useState(false);

  if (!client) return <div className="p-20 text-center">Carregando...</div>;

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      updateClientProfile(client.id, formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-teal-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Settings</h1>
            <p className="text-slate-500">Manage your Brazilian Clean account preferences.</p>
        </header>

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100">
                <button className="flex-1 py-6 font-bold text-blue-600 border-b-2 border-blue-600">Account</button>
                <button className="flex-1 py-6 font-bold text-slate-400 hover:text-slate-600 transition">Security</button>
                <button className="flex-1 py-6 font-bold text-slate-400 hover:text-slate-600 transition">Notifications</button>
            </div>

            <form onSubmit={handleSave} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-xs font-black uppercase text-slate-400">Full Name</label>
                        <input className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl outline-none focus:border-blue-500 transition" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    </div>
                    <div className="space-y-4">
                        <label className="block text-xs font-black uppercase text-slate-400">Email</label>
                        <input className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl outline-none focus:border-blue-500 transition" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="space-y-4">
                        <label className="block text-xs font-black uppercase text-slate-400">Phone</label>
                        <input className="w-full bg-slate-50 border-2 border-slate-50 p-4 rounded-xl outline-none focus:border-blue-500 transition" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                    {isSaved && <span className="text-green-600 font-bold animate-fade-in">Changes saved! ✓</span>}
                    <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold hover:bg-black transition ml-auto">Save Changes</button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ClientSettings;

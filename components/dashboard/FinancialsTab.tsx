
import React, { useState, useMemo } from 'react';
import { Lead } from '../../types';

const FinancialsTab: React.FC<{ leads: Lead[], cleanerId: string }> = ({ leads, cleanerId }) => {
    const [filter, setFilter] = useState<'month' | 'last_month' | 'all'>('month');

    const completedJobs = useMemo(() => {
        return leads
            .filter(l => l.acceptedByCleanerId === cleanerId && l.status === 'COMPLETED')
            .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    }, [leads, cleanerId]);

    const filteredJobs = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        if (filter === 'month') {
            return completedJobs.filter(j => {
                const completedDate = new Date(j.completedAt || 0);
                return completedDate.getMonth() === thisMonth && completedDate.getFullYear() === thisYear;
            });
        }
        if (filter === 'last_month') {
            const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
            const yearOfLastMonth = lastMonth === 11 ? thisYear - 1 : thisYear;
            return completedJobs.filter(j => {
                const completedDate = new Date(j.completedAt || 0);
                return completedDate.getMonth() === lastMonth && completedDate.getFullYear() === yearOfLastMonth;
            });
        }
        return completedJobs;
    }, [completedJobs, filter]);

    const totalEarnings = filteredJobs.reduce((sum, job) => sum + (job.estimatedValue || 0), 0);
    const averageJobValue = filteredJobs.length > 0 ? totalEarnings / filteredJobs.length : 0;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">Ganhos ({filter === 'month' ? 'este mês' : filter === 'last_month' ? 'mês passado' : 'total'})</span>
                    <p className="text-3xl font-black text-emerald-600 mt-1">${totalEarnings.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">Serviços Completos</span>
                    <p className="text-3xl font-black text-blue-600 mt-1">{filteredJobs.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">Valor Médio / Serviço</span>
                    <p className="text-3xl font-black text-slate-800 mt-1">${averageJobValue.toFixed(2)}</p>
                </div>
            </div>

            {/* Stripe Placeholder */}
            <div className="bg-slate-800 text-white p-6 rounded-2xl flex items-center justify-between">
                <div>
                    <h4 className="font-bold">Receba pagamentos via Stripe</h4>
                    <p className="text-xs text-slate-300">Conecte sua conta para receber pagamentos diretos e seguros.</p>
                </div>
                <button className="bg-blue-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-500">Configurar Stripe</button>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b border-slate-100">
                    <h4 className="text-lg font-bold">Histórico de Ganhos</h4>
                    <div className="flex gap-2">
                        <button onClick={() => setFilter('month')} className={`px-3 py-1 text-xs font-bold rounded-lg ${filter === 'month' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>Este Mês</button>
                        <button onClick={() => setFilter('last_month')} className={`px-3 py-1 text-xs font-bold rounded-lg ${filter === 'last_month' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>Mês Passado</button>
                        <button onClick={() => setFilter('all')} className={`px-3 py-1 text-xs font-bold rounded-lg ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>Tudo</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Data Conclusão</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Serviço</th>
                                <th className="px-6 py-3 text-right">Valor (USD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredJobs.map(job => (
                                <tr key={job.id} className="border-b border-slate-100">
                                    <td className="px-6 py-4">{new Date(job.completedAt || 0).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{job.clientName}</td>
                                    <td className="px-6 py-4">{job.serviceType}</td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-700">${(job.estimatedValue || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {filteredJobs.length === 0 && <p className="p-10 text-center text-slate-400 text-sm font-bold">Nenhum serviço completo neste período.</p>}
            </div>
        </div>
    );
};

export default FinancialsTab;

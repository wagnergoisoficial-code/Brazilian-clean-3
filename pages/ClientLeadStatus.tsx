
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LeadStatus } from '../types';

const ClientLeadStatus: React.FC = () => {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('id');
  const { leads, quotes, cleaners, acceptQuote } = useAppContext();
  const navigate = useNavigate();

  const lead = leads.find(l => l.id === leadId);
  const leadQuotes = quotes.filter(q => q.leadId === leadId);

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-black mb-4">Request Not Found</h1>
          <button onClick={() => navigate('/')} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">Request Status</span>
              <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">{lead.serviceType} in {lead.zipCode}</h1>
              <p className="text-slate-500 font-medium">Requested on {new Date(lead.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-slate-900 text-white px-6 py-4 rounded-3xl text-center min-w-[160px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
              <p className="font-bold uppercase tracking-tighter">{lead.status.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center text-sm">✓</span>
              Pros Interested ({lead.unlockedBy.length}/4)
            </h2>
            
            {lead.unlockedBy.length === 0 && (
              <div className="bg-white p-12 text-center rounded-[32px] border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Waiting for responses...</p>
                <p className="text-xs text-slate-400 mt-2">Top professionals are reviewing your request.</p>
              </div>
            )}

            {lead.unlockedBy.map(proId => {
              const pro = cleaners.find(c => c.id === proId);
              const proQuote = leadQuotes.find(q => q.cleanerId === proId);
              if (!pro) return null;

              return (
                <div key={proId} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition group">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={pro.photoUrl} className="w-14 h-14 rounded-2xl object-cover shadow-sm" alt={pro.fullName} />
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 leading-none mb-1">{pro.companyName || pro.fullName}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400 text-sm">★</span>
                        <span className="text-xs font-bold text-slate-500">{pro.rating} ({pro.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  {proQuote ? (
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mb-4 animate-scale-in">
                       <div className="flex justify-between items-center mb-1">
                         <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Formal Quote</span>
                         <span className="text-xl font-black text-emerald-700">${proQuote.price}</span>
                       </div>
                       <p className="text-xs text-emerald-600 font-medium italic">"{proQuote.message}"</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                       <p className="text-xs text-slate-500 font-medium">Professional is preparing a quote...</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {proQuote && proQuote.status !== 'ACCEPTED' && (
                      <button 
                        onClick={() => acceptQuote(proQuote.id)}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition"
                      >
                        Accept Quote
                      </button>
                    )}
                    {proQuote?.status === 'ACCEPTED' ? (
                       <div className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-center">
                         Chosen Professional
                       </div>
                    ) : (
                      <button className="flex-1 bg-white border-2 border-slate-100 text-slate-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-blue-400 transition">
                        Chat
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Request Details</h2>
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
               <div className="grid grid-cols-2 gap-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Type</p>
                    <p className="font-bold text-slate-800">{lead.serviceType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                    <p className="font-bold text-slate-800">{lead.date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bedrooms</p>
                    <p className="font-bold text-slate-800">{lead.bedrooms}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bathrooms</p>
                    <p className="font-bold text-slate-800">{lead.bathrooms}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zip Code</p>
                    <p className="font-bold text-slate-800">{lead.zipCode}</p>
                  </div>
               </div>
               
               <div className="mt-8 pt-8 border-t border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Market Rules</p>
                  <ul className="space-y-2">
                    <li className="flex gap-2 text-[11px] text-slate-500 font-medium">
                      <span className="text-green-500">✓</span> Verified professionals only.
                    </li>
                    <li className="flex gap-2 text-[11px] text-slate-500 font-medium">
                      <span className="text-green-500">✓</span> Max 4 quotes per request.
                    </li>
                    <li className="flex gap-2 text-[11px] text-slate-500 font-medium">
                      <span className="text-green-500">✓</span> Direct payment to the pro.
                    </li>
                  </ul>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientLeadStatus;

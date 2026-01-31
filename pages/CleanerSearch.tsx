
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CleanerProfile, CleanerLevel, CleanerStatus } from '../types';
import { normalizeZip } from '../services/locationService';

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex text-yellow-400">
    {[...Array(5)].map((_, i) => (
      <svg key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

// Canonical Service Map for Search UI (Unified Keys)
const SERVICE_UI_MAP_EN: Record<string, string> = {
  'residential_cleaning': 'Standard Clean',
  'recurring_cleaning_weekly': 'Weekly Clean',
  'recurring_cleaning_biweekly': 'Bi-Weekly Clean',
  'recurring_cleaning_monthly': 'Monthly Clean',
  'deep_cleaning': 'Deep Cleaning',
  'move_in_out': 'Move In/Out',
  'office_cleaning': 'Office Cleaning',
  'commercial_cleaning': 'Commercial Clean',
  'window_cleaning': 'Window Cleaning',
  'oven_cleaning': 'Oven Cleaning',
  'refrigerator_cleaning': 'Fridge Cleaning',
  'carpet_cleaning': 'Carpet Cleaning',
  'sofa_cleaning': 'Sofa Cleaning',
  'deck_cleaning': 'Deck & Patio',
  'laundry_ironing': 'Laundry & Ironing',
  'mommy_helper': 'Mommy Helper',
  'elder_care': 'Elderly Care',
  'pet_care': 'Pet Care',
  'express_cleaning': 'Express Clean',
  'organization_service': 'Organization',
  'babysitting': 'Babysitting'
};

const LevelBadge: React.FC<{ level: CleanerLevel }> = ({ level }) => {
    if (level === CleanerLevel.BRONZE) return null;
    const styles = {
        [CleanerLevel.SILVER]: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700', icon: '🥈', label: 'Silver' },
        [CleanerLevel.GOLD]: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', icon: '🥇', label: 'Gold' }
    };
    const style = styles[level] || styles[CleanerLevel.SILVER];
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${style.bg} ${style.border} ${style.text} uppercase tracking-wide`}>
            <span>{style.icon}</span> {style.label}
        </span>
    );
};

const CleanerSearch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const rawZip = searchParams.get('zip') || '';
  const zip = normalizeZip(rawZip);
  
  const { searchCleaners } = useAppContext();
  const [results, setResults] = useState<CleanerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [filterService, setFilterService] = useState('All');
  const [filterExperience, setFilterExperience] = useState('Any');

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        if (zip) {
            // Unified Matching Logic from AppContext (Normalized)
            const baseResults = searchCleaners(zip, filterService === 'All' ? undefined : filterService);
            
            // Client-side Experience Filtering
            const filtered = baseResults.filter(cleaner => {
                if (filterExperience !== 'Any' && cleaner.yearsExperience < parseInt(filterExperience)) return false;
                return true;
            });
            
            setResults(filtered);
        }
        setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [zip, searchCleaners, filterService, filterExperience]);

  return (
    <div className="min-h-screen bg-teal-50 font-sans">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        Professionals in <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{zip}</span>
                    </h2>
                    {!isLoading && <p className="text-xs text-gray-500 mt-1">Showing {results.length} verified and listed professionals</p>}
                </div>
                <button onClick={() => navigate('/')} className="text-sm font-medium text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-4">Change Location</button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                <select 
                    value={filterService} 
                    onChange={e => setFilterService(e.target.value)} 
                    className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="All">All Service Types</option>
                    {Object.entries(SERVICE_UI_MAP_EN).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <select 
                    value={filterExperience} 
                    onChange={e => setFilterExperience(e.target.value)} 
                    className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="Any">Any Experience</option>
                    <option value="3">3+ Years</option>
                    <option value="5">5+ Years</option>
                    <option value="10">10+ Years</option>
                </select>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-[450px] bg-white rounded-3xl animate-pulse border border-slate-100"></div>
              ))}
           </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-16 text-center border border-gray-100 max-w-2xl mx-auto mt-8 animate-fade-in">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">No active professionals here yet</h3>
            <p className="text-gray-500 mb-10 text-sm leading-relaxed">We are strictly verifying new professionals in this area. In the meantime, try <strong>Express Match™</strong> to reach our network immediately.</p>
            <button onClick={() => navigate('/express')} className="bg-green-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm shadow-xl hover:bg-green-600 transition transform hover:scale-105">Request via Express Match™</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {results.map((cleaner) => (
              <div key={cleaner.id} className="bg-white rounded-[32px] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col overflow-hidden group transform hover:-translate-y-1">
                <div className="h-64 bg-gray-200 relative overflow-hidden">
                  <img src={cleaner.photoUrl || 'https://via.placeholder.com/400x300'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={cleaner.fullName} />
                  <div className="absolute top-4 left-4">
                     <span className="bg-white/95 backdrop-blur-sm text-green-700 text-[10px] font-black px-3 py-1.5 rounded-full shadow-md border border-white flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                        VERIFIED PRO
                      </span>
                  </div>
                  {cleaner.level !== CleanerLevel.BRONZE && (
                      <div className="absolute top-4 right-4">
                          <LevelBadge level={cleaner.level} />
                      </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{cleaner.companyName || cleaner.fullName}</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{cleaner.city}, {cleaner.state} • {cleaner.yearsExperience}+ Years Exp</p>
                        </div>
                        <div className="text-right">
                             <div className="flex items-center gap-1 justify-end"><span className="font-black text-slate-900">{cleaner.rating || 5.0}</span><span className="text-yellow-400 text-lg">★</span></div>
                             <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">{cleaner.reviewCount} Reviews</span>
                        </div>
                    </div>
                    
                    <p className="text-slate-600 text-sm line-clamp-3 mb-6 leading-relaxed font-medium italic">"{cleaner.description || 'Dedicated to providing a spotless and comfortable environment for your family.'}"</p>

                    <div className="flex flex-wrap gap-1.5 mb-8">
                        {cleaner.services.slice(0, 4).map(s => (
                            <span key={s} className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase px-2 py-1 rounded-lg border border-slate-100 tracking-tighter">
                                {SERVICE_UI_MAP_EN[s] || 'Standard Clean'}
                            </span>
                        ))}
                        {cleaner.services.length > 4 && <span className="text-[9px] text-slate-400 font-black self-center">+{cleaner.services.length - 4}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <a href={`tel:${cleaner.phone}`} className="flex items-center justify-center bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition shadow-lg">Call Now</a>
                        <a href={`sms:${cleaner.phone}`} className="flex items-center justify-center bg-white border-2 border-slate-100 text-slate-900 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:border-green-500 hover:text-green-600 transition">Text</a>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CleanerSearch;

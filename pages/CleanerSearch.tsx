
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CleanerProfile, CleanerLevel, PortfolioItem, CleanerStatus } from '../types';

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex text-yellow-400">
    {[...Array(5)].map((_, i) => (
      <svg key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

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

const CleanerSearch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const zip = searchParams.get('zip') || '';
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
            const baseResults = searchCleaners(zip, filterService === 'All' ? undefined : filterService);
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
                    {!isLoading && <p className="text-xs text-gray-500 mt-1">Showing {results.length} verified cleaners</p>}
                </div>
                <button onClick={() => navigate('/')} className="text-sm font-medium text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-4">Change ZIP</button>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                <select value={filterService} onChange={e => setFilterService(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium">
                    <option value="All">All Services</option>
                    {Object.entries(SERVICE_UI_MAP_EN).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <select value={filterExperience} onChange={e => setFilterExperience(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium">
                    <option value="Any">Any Experience</option><option value="3">3+ Years</option><option value="5">5+ Years</option>
                </select>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-white rounded-3xl animate-pulse"></div>
              ))}
           </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200 max-w-lg mx-auto mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">No cleaners found here yet</h3>
            <p className="text-gray-500 mb-8">We are expanding our network. Try Express Match™ to reach available cleaners nearby immediately.</p>
            <button onClick={() => navigate('/express')} className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold">Try Express Match™</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {results.map((cleaner) => (
              <div key={cleaner.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden group">
                <div className="h-56 bg-gray-200 relative overflow-hidden">
                  <img src={cleaner.photoUrl || 'https://via.placeholder.com/400x300'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={cleaner.fullName} />
                  <div className="absolute top-4 left-4">
                     <span className={`bg-white/95 backdrop-blur-sm text-xs font-black px-3 py-1.5 rounded-full shadow-md border border-white flex items-center gap-1.5 ${cleaner.status === CleanerStatus.VERIFIED ? 'text-green-700' : 'text-blue-700'}`}>
                        {cleaner.status === CleanerStatus.VERIFIED ? 'VERIFIED' : 'UNDER REVIEW'}
                      </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{cleaner.companyName || cleaner.fullName}</h3>
                            <p className="text-sm text-gray-500">{cleaner.city}, {cleaner.state} • {cleaner.yearsExperience}+ yrs exp</p>
                        </div>
                        <div className="text-right">
                             <div className="flex items-center gap-1"><span className="font-black">{cleaner.rating || 5.0}</span><span className="text-yellow-400">★</span></div>
                             <span className="text-[10px] text-gray-400 uppercase font-black">{cleaner.reviewCount} reviews</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {cleaner.services.slice(0, 3).map(s => (
                            <span key={s} className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase px-2 py-1 rounded border border-slate-100">{SERVICE_UI_MAP_EN[s] || 'Clean'}</span>
                        ))}
                        {cleaner.services.length > 3 && <span className="text-[9px] text-slate-400 font-black">+{cleaner.services.length - 3} MORE</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <a href={`tel:${cleaner.phone}`} className="flex items-center justify-center bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition">Call</a>
                        <a href={`sms:${cleaner.phone}`} className="flex items-center justify-center bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:border-green-500 hover:text-green-600 transition">Text</a>
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


import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CleanerProfile, CleanerLevel } from '../types';

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex text-yellow-400">
    {[...Array(5)].map((_, i) => (
      <svg key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const LevelBadge: React.FC<{ level: CleanerLevel }> = ({ level }) => {
    // Only show Silver and Gold badges to clients
    if (level === CleanerLevel.BRONZE) return null;

    const styles = {
        [CleanerLevel.SILVER]: {
            bg: 'bg-slate-50',
            border: 'border-slate-300',
            text: 'text-slate-700',
            icon: '🥈',
            label: 'Silver Pro'
        },
        [CleanerLevel.GOLD]: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-300',
            text: 'text-yellow-700',
            icon: '🥇',
            label: 'Gold Pro'
        }
    };

    const style = styles[level] || styles[CleanerLevel.SILVER];

    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${style.bg} ${style.border} ${style.text} uppercase tracking-wide`}>
            <span>{style.icon}</span>
            {style.label}
        </span>
    );
};

// Skeleton Card Component for Loading State
const CleanerSkeletonCard: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full animate-pulse">
    <div className="h-56 bg-gray-200 w-full relative">
       <div className="absolute top-4 left-4 h-6 w-24 bg-gray-300 rounded-full"></div>
    </div>
    <div className="p-6 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2 w-2/3">
           <div className="h-6 bg-gray-200 rounded w-3/4"></div>
           <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="space-y-2 mb-6">
         <div className="h-3 bg-gray-200 rounded w-full"></div>
         <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
      <div className="flex gap-2 mb-6">
         <div className="h-6 bg-gray-200 rounded w-16"></div>
         <div className="h-6 bg-gray-200 rounded w-20"></div>
         <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-auto">
         <div className="h-10 bg-gray-200 rounded-xl"></div>
         <div className="h-10 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  </div>
);

// Helper to get icon based on service name
const getServiceIcon = (serviceName: string) => {
  const lower = serviceName.toLowerCase();
  
  // Deep Cleaning
  if (lower.includes('deep') || lower.includes('pesada')) return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
  ); 
  
  // Move in/out
  if (lower.includes('mudança') || lower.includes('move')) return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
  ); 
  
  // Commercial
  if (lower.includes('commercial') || lower.includes('office') || lower.includes('escritório') || lower.includes('comercial')) return (
     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
  ); 
  
  // Windows
  if (lower.includes('window') || lower.includes('janela')) return (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
  );

  // Laundry
  if (lower.includes('laundry') || lower.includes('lavanderia') || lower.includes('clothes')) return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
  );
  
  // Default House/Sparkle for Standard
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  );
}

const CleanerSearch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const zip = searchParams.get('zip') || '';
  const { searchCleaners } = useAppContext();
  const [results, setResults] = useState<CleanerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Filter States
  const [filterService, setFilterService] = useState('All');
  const [filterExperience, setFilterExperience] = useState('Any');
  const [filterRating, setFilterRating] = useState('Any');

  useEffect(() => {
    // START LOADING
    setIsLoading(true);

    const timer = setTimeout(() => {
        if (zip) {
            // Get base results for ZIP (Verified Only)
            const baseResults = searchCleaners(zip);
            
            // Apply Client-Side Filters
            const filtered = baseResults.filter(cleaner => {
                // Service Filter
                if (filterService !== 'All') {
                    const hasService = cleaner.services.some(s => s.toLowerCase().includes(filterService.toLowerCase()));
                    if (!hasService) return false;
                }

                // Experience Filter
                if (filterExperience !== 'Any') {
                    const minYears = parseInt(filterExperience);
                    if (cleaner.yearsExperience < minYears) return false;
                }

                // Rating Filter
                if (filterRating !== 'Any') {
                    const minRating = parseFloat(filterRating);
                    if (cleaner.rating < minRating) return false;
                }

                return true;
            });

            setResults(filtered);
        }
        // STOP LOADING
        setIsLoading(false);
    }, 800); // Simulate network delay

    return () => clearTimeout(timer);
  }, [zip, searchCleaners, filterService, filterExperience, filterRating]);

  return (
    <div className="min-h-screen bg-teal-50 font-sans">
      
      {/* Header / Search Bar Update */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        Cleaners serving <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">{zip}</span>
                    </h2>
                    {isLoading ? (
                         <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-1"></div>
                    ) : (
                        <p className="text-xs text-gray-500 mt-1">Verified professionals found: {results.length}</p>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => navigate('/')} 
                     className="text-sm font-medium text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-4"
                   >
                     Change ZIP Code
                   </button>
                </div>
            </div>
            
            {/* FILTERS BAR */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                {/* Service Filter */}
                <div className="relative">
                    <select 
                        value={filterService}
                        onChange={(e) => setFilterService(e.target.value)}
                        className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-gray-100 transition cursor-pointer"
                    >
                        <option value="All">All Services</option>
                        <option value="Standard">Standard Clean</option>
                        <option value="Deep">Deep Clean</option>
                        <option value="Move">Move In/Out</option>
                        <option value="Post">Post-Construction</option>
                        <option value="Commercial">Commercial/Office</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>

                {/* Experience Filter */}
                <div className="relative">
                    <select 
                        value={filterExperience}
                        onChange={(e) => setFilterExperience(e.target.value)}
                        className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-gray-100 transition cursor-pointer"
                    >
                        <option value="Any">Any Experience</option>
                        <option value="1">1+ Years</option>
                        <option value="3">3+ Years</option>
                        <option value="5">5+ Years</option>
                        <option value="10">10+ Years</option>
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>

                {/* Rating Filter */}
                <div className="relative">
                    <select 
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value)}
                        className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-gray-100 transition cursor-pointer"
                    >
                        <option value="Any">Any Rating</option>
                        <option value="4">4.0+ Stars</option>
                        <option value="4.5">4.5+ Stars</option>
                        <option value="4.8">4.8+ Stars</option>
                    </select>
                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* LOADING STATE - SKELETON GRID */}
        {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                  <CleanerSkeletonCard key={i} />
              ))}
           </div>
        ) : results.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200 max-w-lg mx-auto mt-8 animate-fade-in">
            <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No cleaners match your filters</h3>
            <p className="text-gray-500 mb-8">Try adjusting your filters or search a different ZIP code. We are expanding our verified network daily.</p>
            <div className="flex flex-col gap-3">
                <button onClick={() => { setFilterService('All'); setFilterExperience('Any'); setFilterRating('Any'); }} className="text-blue-600 font-medium hover:text-blue-800">
                    Clear all filters
                </button>
                <button onClick={() => navigate('/express')} className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-green-200">
                  Try Express Match™
                </button>
            </div>
          </div>
        ) : (
          /* RESULTS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {results.map((cleaner) => (
              <div key={cleaner.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden group">
                
                {/* Card Image Area */}
                <div className="h-56 bg-gray-200 relative overflow-hidden">
                  <img 
                    src={cleaner.photoUrl} 
                    alt={cleaner.fullName} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  
                  {/* Verified Badge Overlay */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                     <span className="bg-white/95 backdrop-blur-sm text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md border border-white w-fit">
                        <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                        VERIFIED
                      </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                    {cleaner.companyName || cleaner.fullName}
                                </h3>
                                <LevelBadge level={cleaner.level} />
                            </div>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {cleaner.city}, {cleaner.state}
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                             <div className="flex items-center gap-1">
                                <span className="font-bold text-slate-900">{cleaner.rating || 5.0}</span>
                                <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                             </div>
                             <span className="text-xs text-gray-400">{cleaner.reviewCount} reviews</span>
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">
                        {cleaner.description || "Experienced professional dedicated to providing top-quality cleaning services for your home."}
                    </p>
                    
                    {/* Services Tags */}
                    <div className="mb-6 flex-1">
                        <div className="flex flex-wrap gap-2">
                            {cleaner.services.slice(0, 3).map((s, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 bg-gray-50 text-gray-600 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-gray-100 uppercase tracking-wide">
                                    {getServiceIcon(s)}
                                    <span>{s.split('(')[0].trim()}</span>
                                </div>
                            ))}
                            {cleaner.services.length > 3 && (
                                <span className="text-xs text-gray-400 self-center font-medium pl-1">+{cleaner.services.length - 3} more</span>
                            )}
                        </div>
                    </div>
                  
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <a href={`tel:${cleaner.phone}`} className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold text-sm transition shadow hover:shadow-lg">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                           Call
                        </a>
                        <a href={`sms:${cleaner.phone}`} className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-green-500 hover:text-green-600 text-gray-700 py-3 rounded-xl font-bold text-sm transition shadow-sm hover:shadow">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                           Text
                        </a>
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

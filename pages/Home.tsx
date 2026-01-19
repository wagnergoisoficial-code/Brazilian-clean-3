import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [zip, setZip] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (zip.length >= 5) {
      navigate(`/search?zip=${zip}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex flex-col font-sans">
      {/* Hero Section */}
      <div className="relative h-[650px] w-full flex items-center justify-center overflow-hidden">
        {/* Background Image - High Quality Suburban */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 scale-105"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop')",
          }}
        ></div>
        
        {/* Premium Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-800/40 z-10 backdrop-blur-[1px]"></div>

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-[-40px]">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-green-300 font-semibold text-sm tracking-wide uppercase animate-fade-in-down">
            The #1 Marketplace for Brazilian Cleaners
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight drop-shadow-xl mb-6 leading-tight">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Gold Standard</span> <br/>
            of Home Cleaning.
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-200 mb-12 font-light max-w-3xl mx-auto leading-relaxed drop-shadow-md">
            Connecting American homes with the legendary detail, work ethic, and care of verified Brazilian professionals.
          </p>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto relative group">
            {/* Input Container with Glassmorphism */}
            <div className="relative flex items-center bg-white/95 backdrop-blur-xl rounded-full p-2 shadow-2xl transition-all duration-300 group-hover:shadow-[0_0_40px_rgba(74,222,128,0.3)] border border-white/50">
                <div className="pl-6 text-gray-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g,''))}
                  maxLength={5}
                  className="w-full py-4 pl-4 pr-36 bg-transparent text-xl font-medium outline-none text-slate-800 placeholder-slate-400"
                  placeholder="Enter ZIP Code"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white font-bold px-8 rounded-full shadow-lg transition-all transform group-hover:scale-105 border border-slate-700"
                >
                  Search
                </button>
            </div>
          </form>
          
          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/90 text-sm font-semibold tracking-wide">
            <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                <span>Gov. Verified IDs</span>
            </div>
            <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> 
                <span>Background Checked</span>
            </div>
            <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> 
                <span>Top Rated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Why Brazilian Clean?</h2>
            <div className="w-24 h-1.5 bg-green-500 mx-auto mt-4 rounded-full"></div>
            <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                We connect you with professionals who treat your home with the care, dedication, and precision it deserves.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {/* Card 1 */}
            <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 overflow-hidden transform hover:-translate-y-2">
              <div className="relative h-64 overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600" alt="Detail" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                 <h3 className="absolute bottom-6 left-6 text-2xl font-bold text-white">Attention to Detail</h3>
              </div>
              <div className="p-8">
                <p className="text-slate-600 text-lg leading-relaxed">Brazilian cleaning standards are world-renowned. Expect corners, baseboards, and hidden spots to be absolutely spotless.</p>
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 overflow-hidden transform hover:-translate-y-2">
               <div className="relative h-64 overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600" alt="Trust" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                 <h3 className="absolute bottom-6 left-6 text-2xl font-bold text-white">Verified Trust</h3>
               </div>
              <div className="p-8">
                <p className="text-slate-600 text-lg leading-relaxed">Safety is our top priority. Every cleaner on our platform submits a government ID and a real-time selfie for biometric verification.</p>
              </div>
            </div>

            {/* Card 3 */}
             <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 overflow-hidden transform hover:-translate-y-2">
               <div className="relative h-64 overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600" alt="Convenience" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                 <h3 className="absolute bottom-6 left-6 text-2xl font-bold text-white">Express Match™</h3>
               </div>
              <div className="p-8">
                <p className="text-slate-600 text-lg leading-relaxed">Life is busy. Our proprietary technology broadcasts your request to verified local cleaners instantly. Book in under 60 seconds.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Express Match CTA */}
      <div className="bg-slate-900 py-24 px-4 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
             <div className="flex flex-col md:flex-row items-center justify-between gap-12 bg-white/5 backdrop-blur-lg border border-white/10 p-12 rounded-3xl">
                <div className="text-left max-w-2xl">
                    <h2 className="text-4xl font-bold text-white mb-4">In a hurry? Don't wait.</h2>
                    <p className="text-slate-300 text-xl leading-relaxed">
                        Skip the browsing. Use <span className="text-green-400 font-bold">Express Match™</span> to broadcast your job to top-rated cleaners in your area immediately.
                    </p>
                </div>
                <div className="shrink-0">
                    <button onClick={() => navigate('/express')} className="bg-green-500 hover:bg-green-400 text-white font-bold py-5 px-10 rounded-full text-xl transition-all shadow-[0_0_30px_rgba(74,222,128,0.3)] hover:shadow-[0_0_50px_rgba(74,222,128,0.5)] transform hover:scale-105 active:scale-95 border border-green-400">
                        Find Cleaner Now &rarr;
                    </button>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
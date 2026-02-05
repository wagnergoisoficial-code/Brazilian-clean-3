
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SYSTEM_IDENTITY } from '../config/SystemManifest';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=2000" alt="Home" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <div className="mb-8 animate-fade-in-down flex justify-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <span className="flex items-center gap-1.5">
                <div className="w-5 h-3.5 bg-[#009739] rounded-sm"></div>
                <div className="w-5 h-3.5 bg-[#002868] rounded-sm"></div>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">We connect Brazilian care with American standards.</span>
            </div>
          </div>
          <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter mb-4 leading-none drop-shadow-2xl">Brazilian Clean</h1>
          <p className="text-xl md:text-3xl font-bold text-[#FEDD00] tracking-tight mb-12 max-w-3xl mx-auto drop-shadow-lg">High Quality Professional Home Care</p>
          <div className="max-w-md mx-auto animate-scale-in">
            <button 
              onClick={() => navigate('/express-match')} 
              className="w-full bg-[#002868] text-white font-black px-10 py-6 rounded-full transition-all shadow-2xl hover:bg-[#BF0A30] active:scale-95 uppercase tracking-widest text-sm"
            >
              Request a Professional
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-16 text-center border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
           <div className="flex gap-4 mb-6">
              <div className="w-10 h-10 rounded-full border-2 border-[#009739] flex items-center justify-center font-black text-[#009739] text-[10px]">BR</div>
              <div className="w-10 h-10 rounded-full border-2 border-[#002868] flex items-center justify-center font-black text-[#002868] text-[10px]">US</div>
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-4">Brazilian Clean Professional Home Care</p>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Marketplace v{SYSTEM_IDENTITY.VERSION} • Cultural Bridge Established</p>
        </div>
      </footer>
    </div>
  );
};
export default Home;


import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const Navbar: React.FC = () => {
  const { authenticatedCleanerId, logout } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      {/* CULTURAL BRIDGE RIBBON */}
      <div className="h-1 w-full bg-us-br-bridge opacity-80"></div>
      
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20 gap-2">
          
          {/* BRAND IDENTITY & LOGO */}
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                {/* PROFESSIONAL BRAZILIAN CLEANER LOGO */}
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                  <svg viewBox="0 0 100 100" className="w-8 h-8 md:w-10 md:h-10">
                    {/* Abstract House Shape */}
                    <path d="M20 45 L50 20 L80 45 V80 H20 Z" fill="#009739" />
                    {/* Sparkle representing 'Clean' */}
                    <path d="M70 15 L72 22 L79 24 L72 26 L70 33 L68 26 L61 24 L68 22 Z" fill="#FEDD00" className="animate-pulse" />
                    {/* US Detail */}
                    <rect x="40" y="55" width="20" height="25" fill="#002868" />
                    <path d="M50 60 L52 65 L57 65 L53 68 L54 73 L50 70 L46 73 L47 68 L43 65 L48 65 Z" fill="white" />
                  </svg>
                </div>
                {/* Status indicator on logo */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FEDD00] rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                   <div className="w-1.5 h-1.5 bg-[#009739] rounded-full"></div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm md:text-base text-slate-900 tracking-tighter leading-none uppercase">Brazilian</span>
                <span className="font-bold text-[10px] md:text-xs text-[#009739] tracking-widest uppercase leading-none mt-0.5">Cleaner</span>
              </div>
            </Link>
          </div>

          {/* NORMALIZED NAVIGATION LINKS (1-4) - DESKTOP ONLY */}
          <div className="hidden lg:flex items-center gap-x-8">
            <Link to="/" className={`text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/') ? 'text-[#002868]' : 'text-slate-500 hover:text-[#002868]'}`}>Home</Link>
            <Link to="/who-we-are" className={`text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/who-we-are') ? 'text-[#002868]' : 'text-slate-500 hover:text-[#002868]'}`}>Who We Are</Link>
            <Link to="/find-a-cleaner" className={`text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/find-a-cleaner') ? 'text-[#002868]' : 'text-slate-500 hover:text-[#002868]'}`}>Find a Cleaner</Link>
            <Link to="/support" className={`text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/support') ? 'text-[#002868]' : 'text-slate-500 hover:text-[#002868]'}`}>Support</Link>
          </div>

          {/* ACTION AREA (5-6) */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* PARA PROFISSIONAIS (BR) - Always leads to Landing */}
            <button 
              onClick={() => navigate('/professional')}
              className={`px-3 py-2 md:px-5 md:py-2.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border-2 ${isActive('/professional') ? 'bg-[#009739] text-white border-[#009739]' : 'text-[#009739] border-[#009739] hover:bg-[#009739] hover:text-white'}`}
            >
              <span className="hidden sm:inline">Para Profissionais (BR)</span>
              <span className="sm:hidden">Pro (BR)</span>
            </button>

            {/* EXPRESS MATCH */}
            <button 
              onClick={() => navigate('/express-match')}
              className="bg-[#002868] hover:bg-black text-white px-3 py-2 md:px-5 md:py-2.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
            >
              <span className="hidden sm:inline">Express Match</span>
              <span className="sm:hidden">Match</span>
            </button>
            
            {/* Subtle Login/Painel context for authenticated users */}
            {authenticatedCleanerId && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-100">
                    <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-400 hover:text-emerald-600 transition" title="Dashboard">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </button>
                    <button onClick={logout} className="p-2 text-slate-300 hover:text-red-500 transition" title="Logout">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE NAVIGATION CONTAINER - BELOW HEADER */}
      <div className="lg:hidden border-t border-slate-50 bg-white/80 backdrop-blur-md px-4 py-3 overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-between gap-6 min-w-max mx-auto max-w-lg">
          <Link 
            to="/" 
            className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all px-2 py-1 rounded-md ${isActive('/') ? 'text-[#002868] bg-blue-50' : 'text-slate-400'}`}
          >
            Home
          </Link>
          <Link 
            to="/who-we-are" 
            className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all px-2 py-1 rounded-md ${isActive('/who-we-are') ? 'text-[#002868] bg-blue-50' : 'text-slate-400'}`}
          >
            Who We Are
          </Link>
          <Link 
            to="/find-a-cleaner" 
            className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all px-2 py-1 rounded-md ${isActive('/find-a-cleaner') ? 'text-[#002868] bg-blue-50' : 'text-slate-400'}`}
          >
            Find a Cleaner
          </Link>
          <Link 
            to="/support" 
            className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all px-2 py-1 rounded-md ${isActive('/support') ? 'text-[#002868] bg-blue-50' : 'text-slate-400'}`}
          >
            Support
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;


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
          
          {/* BRAND IDENTITY */}
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex -space-x-1">
                <div className="w-8 h-8 bg-[#009739] rounded-lg flex items-center justify-center text-white shadow-sm transition-transform group-hover:-translate-x-1">
                  <span className="text-[10px] font-black">BR</span>
                </div>
                <div className="w-8 h-8 bg-[#002868] rounded-lg flex items-center justify-center text-white shadow-sm transition-transform group-hover:translate-x-1">
                  <span className="text-[10px] font-black">US</span>
                </div>
              </div>
              <span className="font-bold text-base md:text-lg text-slate-900 tracking-tight hidden xs:block">Brazilian Clean</span>
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

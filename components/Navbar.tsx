import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { UserRole } from '../types';

const Navbar: React.FC = () => {
  const { setUserRole } = useAppContext();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigateToPanel = (role: UserRole, path: string) => {
    setUserRole(role);
    setIsDropdownOpen(false);
    navigate(path);
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 h-16 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-full">
          {/* LEFT SIDE: Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform">
                B
              </div>
              <span className="font-bold text-xl tracking-tight">
                <span className="text-green-600">Brazilian</span>
                <span className="text-blue-600">Clean</span>
              </span>
            </Link>
          </div>
          
          {/* CENTER: Empty */}
          <div className="hidden md:flex flex-1"></div>

          {/* RIGHT SIDE: Navigation Actions */}
          <div className="flex items-center gap-6">
            
            {/* Dropdown: Painéis */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"
              >
                Painéis ▾
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 animate-scale-in origin-top-right z-50">
                  <button 
                    onClick={() => handleNavigateToPanel(UserRole.CLEANER, '/dashboard')}
                    className="w-full text-left px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-green-600 transition-colors flex items-center gap-3"
                  >
                    <span className="text-lg">🧹</span>
                    Painel das House Cleaners
                  </button>
                  <button 
                    onClick={() => handleNavigateToPanel(UserRole.ADMIN, '/admin')}
                    className="w-full text-left px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center gap-3"
                  >
                    <span className="text-lg">⚙️</span>
                    Painel Administrativo
                  </button>
                </div>
              )}
            </div>

            {/* Support Link */}
            <Link 
              to="/support" 
              className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors border-l border-slate-200 pl-6"
            >
              Help
            </Link>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { UserRole } from '../types';

const Navbar: React.FC = () => {
  const { userRole, setUserRole } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    setUserRole(newRole);

    switch (newRole) {
      case UserRole.CLIENT:
        navigate('/');
        break;
      case UserRole.CLEANER:
        navigate('/dashboard');
        break;
      case UserRole.ADMIN:
        navigate('/admin');
        break;
      default:
        navigate('/');
        break;
    }
  };

  const isClient = userRole === UserRole.CLIENT;

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center text-white font-bold text-xl">
                B
              </div>
              <span className="font-bold text-xl tracking-tight">
                <span className="text-green-600">Brazilian</span>
                <span className="text-blue-600">Clean</span>
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Role Switcher for Demo Purpose */}
            <select 
              value={userRole}
              onChange={handleRoleChange}
              className="hidden sm:block text-xs border rounded px-2 py-1 bg-gray-50 text-gray-500 hover:bg-gray-100 transition"
            >
              <option value={UserRole.CLIENT}>View as Client (USA)</option>
              <option value={UserRole.CLEANER}>View as Cleaner (BR)</option>
              <option value={UserRole.ADMIN}>View as Admin</option>
            </select>

            <div className="flex gap-4 text-sm font-medium">
              {isClient ? (
                <>
                  <Link to="/" className="text-gray-600 hover:text-blue-600 transition">Find a Cleaner</Link>
                  <Link to="/join" className="text-gray-600 hover:text-green-600 transition">For Cleaners</Link>
                  <Link to="/support" className="text-gray-600 hover:text-slate-800 transition">Help</Link>
                </>
              ) : userRole === UserRole.CLEANER ? (
                <>
                   <Link to="/dashboard" className="text-gray-600 hover:text-green-600">Meu Painel</Link>
                   <Link to="/support" className="text-gray-600 hover:text-green-600">Suporte</Link>
                </>
              ) : (
                <Link to="/admin" className="text-blue-600">Admin Dashboard</Link>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Role Switcher */}
      <div className="sm:hidden px-4 pb-2">
         <select 
              value={userRole}
              onChange={handleRoleChange}
              className="w-full text-xs border rounded px-2 py-1 bg-gray-50 text-gray-500"
            >
              <option value={UserRole.CLIENT}>View: Client</option>
              <option value={UserRole.CLEANER}>View: Cleaner</option>
              <option value={UserRole.ADMIN}>View: Admin</option>
            </select>
      </div>
    </nav>
  );
};

export default Navbar;
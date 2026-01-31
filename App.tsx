
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CleanerSearch from './pages/CleanerSearch';
import CleanerRegistration from './pages/CleanerRegistration';
import AdminDashboard from './pages/AdminDashboard';
import CleanerDashboard from './pages/CleanerDashboard';
import ExpressMatch from './pages/ExpressMatch';
import VerifyEmail from './pages/VerifyEmail';
import Support from './pages/Support';
import BrianAI from './components/BrianAI';
import MockEmailService from './components/MockEmailService';
import CleanerPersonalInfo from './pages/CleanerPersonalInfo';
import CleanerBusinessConfig from './pages/CleanerBusinessConfig';
import CleanerServices from './pages/CleanerServices';
import CleanerServiceArea from './pages/CleanerServiceArea';
import DocumentVerification from './pages/DocumentVerification';
import ClientSettings from './pages/ClientSettings';
import { UserRole } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactElement, allowedRole: UserRole }> = ({ children, allowedRole }) => {
    const { userRole, authenticatedCleanerId, authenticatedClientId, isHydrated } = useAppContext();
    
    // While hydrating, show a subtle loading screen to prevent DOM unmount races
    if (!isHydrated) {
        return (
            <div className="min-h-screen bg-teal-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (allowedRole === UserRole.CLEANER && !authenticatedCleanerId) return <Navigate to="/join" replace />;
    if (allowedRole === UserRole.CLIENT && !authenticatedClientId && window.location.hash.includes('settings')) return <Navigate to="/" replace />;

    return userRole === allowedRole ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<CleanerSearch />} />
            <Route path="/join" element={<CleanerRegistration />} />
            <Route path="/express" element={<ExpressMatch />} />
            <Route path="/verify" element={<VerifyEmail />} />
            <Route path="/support" element={<Support />} />
            
            <Route path="/setup-personal" element={<ProtectedRoute allowedRole={UserRole.CLEANER}><CleanerPersonalInfo /></ProtectedRoute>} />
            <Route path="/setup-business" element={<ProtectedRoute allowedRole={UserRole.CLEANER}><CleanerBusinessConfig /></ProtectedRoute>} />
            <Route path="/setup-services" element={<ProtectedRoute allowedRole={UserRole.CLEANER}><CleanerServices /></ProtectedRoute>} />
            <Route path="/setup-area" element={<ProtectedRoute allowedRole={UserRole.CLEANER}><CleanerServiceArea /></ProtectedRoute>} />
            <Route path="/verify-documents" element={<ProtectedRoute allowedRole={UserRole.CLEANER}><DocumentVerification /></ProtectedRoute>} />
            
            <Route path="/settings" element={<ProtectedRoute allowedRole={UserRole.CLIENT}><ClientSettings /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute allowedRole={UserRole.ADMIN}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRole={UserRole.CLEANER}><CleanerDashboard /></ProtectedRoute>} />
        </Routes>
    );
}

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-teal-50 font-sans text-slate-900">
          <Navbar />
          <AppRoutes />
          <MockEmailService />
          <BrianAI />
        </div>
      </Router>
    </AppProvider>
  );
};
export default App;

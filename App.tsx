
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import WhoWeAre from './pages/WhoWeAre';
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
import ClientLeadStatus from './pages/ClientLeadStatus';
import ProWallet from './pages/ProWallet';
import { UserRole } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactElement, allowedRole: UserRole }> = ({ children, allowedRole }) => {
    const { userRole, authenticatedCleanerId, isHydrated } = useAppContext();
    if (!isHydrated) return null;
    if (allowedRole === UserRole.CLEANER && !authenticatedCleanerId) return <Navigate to="/professional" replace />;
    if (userRole !== allowedRole) return <Navigate to="/" replace />;
    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/who-we-are" element={<WhoWeAre />} />
            <Route path="/express-match" element={<ExpressMatch />} />
            <Route path="/professional" element={<CleanerRegistration />} />
            <Route path="/support" element={<Support />} />
            <Route path="/verify" element={<VerifyEmail />} />
            <Route path="/lead-status" element={<ClientLeadStatus />} />
            
            <Route path="/setup-personal" element={<ProtectedRoute allowedRole={UserRole.CLEANER}><CleanerPersonalInfo /></ProtectedRoute>} />
            <Route path="/setup-business" element={<ProtectedRoute allowedRole={UserRole.CLEANER}><CleanerBusinessConfig /></ProtectedRoute>} />
            <Route path="/setup-services" element={<ProtectedRoute allowedRole={UserRole.CLEANER}><CleanerServices /></ProtectedRoute>} />
            <Route path="/setup-area" element={<ProtectedRoute allowedRole={UserRole.CLEANER}><CleanerServiceArea /></ProtectedRoute>} />
            <Route path="/verify-documents" element={<ProtectedRoute allowedRole={UserRole.CLEANER}><DocumentVerification /></ProtectedRoute>} />
            
            <Route path="/wallet" element={<ProtectedRoute allowedRole={UserRole.CLEANER}><ProWallet /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRole={UserRole.CLEANER}><CleanerDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRole={UserRole.ADMIN}><AdminDashboard /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
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

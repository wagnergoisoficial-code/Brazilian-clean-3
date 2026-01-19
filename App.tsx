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
import { UserRole } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactElement, allowedRole: UserRole }> = ({ children, allowedRole }) => {
    const { userRole } = useAppContext();
    if (userRole !== allowedRole) {
        return <Navigate to="/" replace />;
    }
    return children;
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
            
            <Route path="/admin" element={
                <ProtectedRoute allowedRole={UserRole.ADMIN}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
                 <ProtectedRoute allowedRole={UserRole.CLEANER}>
                    <CleanerDashboard />
                </ProtectedRoute>
            } />
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
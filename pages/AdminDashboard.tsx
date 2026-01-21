import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { CleanerStatus, SupportStatus, SupportType, SubscriptionPlan, Discount, DiscountType, BonusCampaign, CleanerLevel } from '../types';
import { checkSystemHealth, restoreFromBackup, performAutoBackup } from '../services/systemGuardianService';
import { SYSTEM_IDENTITY } from '../config/SystemManifest';

const DashboardSkeleton = () => (
  <div className="animate-pulse px-4">
    {/* Metric Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1,2,3].map(i => (
            <div key={i} className="bg-gray-100 p-6 rounded-xl h-32"></div>
        ))}
    </div>
    {/* Table Skeleton */}
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-200 h-16"></div>
        <div className="p-0">
             {[1,2,3,4,5].map(i => (
                 <div key={i} className="h-20 border-b border-gray-100 bg-white"></div>
             ))}
        </div>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const { cleaners, verifyCleaner, rejectCleaner, feedPosts, createFeedPost, deleteFeedPost, supportRequests, updateSupportStatus, applyDiscount, removeDiscount, bonusCampaigns, createBonusCampaign, toggleBonusCampaign, addCleanerPoints } = useAppContext();
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // View Toggle: 'cleaners' | 'support' | 'merit' | 'analytics' | 'system' | 'governance'
  const [activeView, setActiveView] = useState<'cleaners' | 'support' | 'merit' | 'analytics' | 'system' | 'governance'>('governance');

  // System Health State
  const [healthStatus, setHealthStatus] = useState(checkSystemHealth());

  // Modal State for Discount
  const [discountModal, setDiscountModal] = useState<{ isOpen: boolean; cleanerId: string | null }>({ isOpen: false, cleanerId: null });
  const [discountForm, setDiscountForm] = useState({
      type: DiscountType.PERCENTAGE,
      value: 0,
      description: '',
      monthsDuration: 1
  });

  // Modal State for Merit Points
  const [meritModal, setMeritModal] = useState<{ isOpen: boolean; cleanerId: string | null }>({ isOpen: false, cleanerId: null });
  const [meritForm, setMeritForm] = useState({
      amount: 10,
      reason: ''
  });

  // Checklist State
  const [dailyChecklist, setDailyChecklist] = useState({
      approvals: false,
      support: false,
      system: false,
      leads: false
  });
  
  const [weeklyChecklist, setWeeklyChecklist] = useState({
      levels: false,
      topPerformers: false,
      campaigns: false,
      inactive: false,
      growth: false
  });

  // Form State for new campaign
  const [newCampaign, setNewCampaign] = useState<Partial<BonusCampaign>>({
      title: '',
      description: '',
      pointsReward: 10,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      type: 'MANUAL'
  });

  // Form State for new post
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'ANNOUNCEMENT' as 'ANNOUNCEMENT' | 'EVENT' | 'TRAINING',
    imageUrl: ''
  });

  const pendingCleaners = cleaners.filter(c => c.status === CleanerStatus.PENDING);
  
  // Support Metrics
  const totalRequests = supportRequests.length;
  const pendingRequests = supportRequests.filter(r => r.status !== SupportStatus.RESOLVED).length;
  const resolvedRequests = supportRequests.filter(r => r.status === SupportStatus.RESOLVED).length;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === 'admin123') {
      setIsLoading(true);
      setTimeout(() => {
        setAccessGranted(true);
        setError('');
        setIsLoading(false);
      }, 800);
    } else {
      setError('Access Denied: Invalid Security Code');
    }
  };

  const handleViewChange = (view: typeof activeView) => {
    if (view === activeView) return;
    setIsLoading(true);
    setActiveView(view);
    setTimeout(() => {
        setIsLoading(false);
    }, 500);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) return;
    createFeedPost(newPost);
    setNewPost({ title: '', content: '', type: 'ANNOUNCEMENT', imageUrl: '' });
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCampaign.title || !newCampaign.description) return;
      
      createBonusCampaign({
          id: Math.random().toString(36).substr(2, 9),
          title: newCampaign.title,
          description: newCampaign.description,
          pointsReward: newCampaign.pointsReward || 10,
          startDate: new Date(newCampaign.startDate!).toISOString(),
          endDate: newCampaign.endDate ? new Date(newCampaign.endDate).toISOString() : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          isActive: true,
          type: newCampaign.type || 'MANUAL'
      } as BonusCampaign);
      
      setNewCampaign({
          title: '', description: '', pointsReward: 10, startDate: new Date().toISOString().split('T')[0], endDate: '', type: 'MANUAL'
      });
  };

  const handleManualBackup = () => {
      const success = performAutoBackup();
      if(success) {
          alert("Manual Backup Completed Successfully.");
          setHealthStatus(checkSystemHealth());
      } else {
          alert("Backup Failed.");
      }
  };

  const openDiscountModal = (cleanerId: string) => {
      setDiscountModal({ isOpen: true, cleanerId });
      setDiscountForm({ type: DiscountType.PERCENTAGE, value: 0, description: '', monthsDuration: 1 });
  };
  const closeDiscountModal = () => setDiscountModal({ isOpen: false, cleanerId: null });
  const submitDiscount = () => {
      if (!discountModal.cleanerId) return;
      const now = new Date();
      const end = new Date(now);
      end.setMonth(now.getMonth() + discountForm.monthsDuration);
      const newDiscount: Discount = {
          id: Math.random().toString(36).substr(2, 9),
          type: discountForm.type,
          value: discountForm.type === DiscountType.FULL_EXEMPTION ? 100 : discountForm.value,
          description: discountForm.description,
          startDate: now.toISOString(),
          endDate: end.toISOString(),
          createdAt: now.toISOString()
      };
      applyDiscount(discountModal.cleanerId, newDiscount);
      closeDiscountModal();
      alert("Discount applied successfully.");
  };

  const openMeritModal = (cleanerId: string) => {
      setMeritModal({ isOpen: true, cleanerId });
      setMeritForm({ amount: 10, reason: '' });
  };
  const closeMeritModal = () => setMeritModal({ isOpen: false, cleanerId: null });
  const submitMerit = () => {
      if (!meritModal.cleanerId) return;
      addCleanerPoints(meritModal.cleanerId, meritForm.amount, meritForm.reason || 'Admin Adjustment');
      closeMeritModal();
  };

  const verifiedCleaners = cleaners.filter(c => c.status === CleanerStatus.VERIFIED);
  const bronzeCount = verifiedCleaners.filter(c => c.level === CleanerLevel.BRONZE).length;
  const silverCount = verifiedCleaners.filter(c => c.level === CleanerLevel.SILVER).length;
  const goldCount = verifiedCleaners.filter(c => c.level === CleanerLevel.GOLD).length;
  const topCleaners = [...verifiedCleaners].sort((a,b) => b.points - a.points).slice(0, 5);


  if (!accessGranted && !isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-slate-900 p-6 text-center">
            <h2 className="text-2xl font-bold text-white">Restricted Area</h2>
            <p className="text-slate-400 text-sm mt-2">Authorized Personnel Only</p>
          </div>
          <form onSubmit={handleLogin} className="p-8">
             <div className="mb-6">
               <label className="block text-sm font-bold text-gray-700 mb-2">Security Access Code</label>
               <input 
                 type="password" 
                 value={accessCode}
                 onChange={(e) => setAccessCode(e.target.value)}
                 className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                 placeholder="Enter code..."
                 autoFocus
               />
               {error && <p className="text-red-600 text-sm mt-2 font-medium animate-pulse">{error}</p>}
             </div>
             <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-lg transition transform hover:scale-[1.02]">
               Unlock Dashboard
             </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading && !accessGranted) {
      return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-100">
             <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 font-medium">Authenticating...</p>
             </div>
        </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 font-sans">
      <div className="flex justify-between items-center mb-8 px-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Secure Connection Active
          </p>
        </div>
        <button onClick={() => setAccessGranted(false)} className="text-sm text-red-600 hover:text-red-800 font-medium underline">
          Lock Session
        </button>
      </div>

      <div className="flex px-4 mb-8 border-b border-gray-200 overflow-x-auto">
          <button 
            onClick={() => handleViewChange('governance')}
            className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeView === 'governance' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Governance & Ops 📋
          </button>
          <button 
            onClick={() => handleViewChange('cleaners')}
            className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeView === 'cleaners' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Cleaners & Verification
          </button>
          <button 
            onClick={() => handleViewChange('merit')}
            className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeView === 'merit' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Merit Management
          </button>
          <button 
            onClick={() => handleViewChange('analytics')}
            className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeView === 'analytics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Analytics & Reports 📈
          </button>
          <button 
            onClick={() => handleViewChange('support')}
            className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeView === 'support' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Support Center ({pendingRequests})
          </button>
          <button 
            onClick={() => handleViewChange('system')}
            className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeView === 'system' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            System Health 🛡️
          </button>
      </div>
      
      {isLoading ? (
          <DashboardSkeleton />
      ) : (
        <>
            {activeView === 'governance' && (
                <div className="px-4 animate-fade-in-up">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
                        <span>🧭</span> Operational Governance Center
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className={`bg-white p-5 rounded-xl shadow-sm border ${pendingCleaners.length > 0 ? 'border-red-300 ring-2 ring-red-100' : 'border-green-200'}`}>
                             <p className="text-xs font-bold text-gray-400 uppercase">Pending Approvals</p>
                             <div className="flex justify-between items-end">
                                <p className={`text-3xl font-extrabold ${pendingCleaners.length > 0 ? 'text-red-600' : 'text-green-600'}`}>{pendingCleaners.length}</p>
                                <span className="text-xs text-gray-500">Action Req.</span>
                             </div>
                        </div>
                        <div className={`bg-white p-5 rounded-xl shadow-sm border ${pendingRequests > 0 ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                             <p className="text-xs font-bold text-gray-400 uppercase">Open Support Tickets</p>
                             <div className="flex justify-between items-end">
                                <p className="text-3xl font-extrabold text-blue-900">{pendingRequests}</p>
                                <span className="text-xs text-gray-500">Wait Time: Low</span>
                             </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                             <p className="text-xs font-bold text-gray-400 uppercase">Active Pros (Verified)</p>
                             <div className="flex justify-between items-end">
                                <p className="text-3xl font-extrabold text-slate-900">{verifiedCleaners.length}</p>
                                <span className="text-xs text-gray-500">Growth: Stable</span>
                             </div>
                        </div>
                        <div className={`bg-white p-5 rounded-xl shadow-sm border ${healthStatus.status === 'HEALTHY' ? 'border-green-200' : 'border-red-500'}`}>
                             <p className="text-xs font-bold text-gray-400 uppercase">System Status</p>
                             <div className="flex justify-between items-end">
                                <p className={`text-xl font-extrabold ${healthStatus.status === 'HEALTHY' ? 'text-green-600' : 'text-red-600'}`}>{healthStatus.status}</p>
                                <span className="text-[10px] text-gray-400">v{SYSTEM_IDENTITY.VERSION}</span>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Daily Operations Checklist
                                    </h3>
                                    <span className="text-xs text-slate-400">Reset at 00:00 PST</span>
                                </div>
                                <div className="p-6 space-y-4">
                                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${dailyChecklist.approvals ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                                        <input type="checkbox" border-radius="4px" checked={dailyChecklist.approvals} onChange={() => setDailyChecklist(p => ({...p, approvals: !p.approvals}))} className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                                        <div>
                                            <span className="font-bold text-gray-900 block">Review Pending Approvals</span>
                                            <span className="text-xs text-gray-500">Check "Cleaners" tab for new documents. ({pendingCleaners.length} pending)</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${dailyChecklist.support ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                                        <input type="checkbox" checked={dailyChecklist.support} onChange={() => setDailyChecklist(p => ({...p, support: !p.support}))} className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                                        <div>
                                            <span className="font-bold text-gray-900 block">Check Support Queue</span>
                                            <span className="text-xs text-gray-500">Ensure no ticket is older than 24h. ({pendingRequests} open)</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${dailyChecklist.system ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                                        <input type="checkbox" checked={dailyChecklist.system} onChange={() => setDailyChecklist(p => ({...p, system: !p.system}))} className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                                        <div>
                                            <span className="font-bold text-gray-900 block">Confirm System Health</span>
                                            <span className="text-xs text-gray-500">Check "System Health" tab for backup status.</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${dailyChecklist.leads ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                                        <input type="checkbox" checked={dailyChecklist.leads} onChange={() => setDailyChecklist(p => ({...p, leads: !p.leads}))} className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                                        <div>
                                            <span className="font-bold text-gray-900 block">Monitor Express Match</span>
                                            <span className="text-xs text-gray-500">Ensure leads are being picked up by Pros.</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                        Weekly Strategy Review
                                    </h3>
                                    <span className="text-xs text-slate-400">Due: Fridays</span>
                                </div>
                                <div className="p-6 space-y-4">
                                     <label className="flex items-center gap-3">
                                        <input type="checkbox" checked={weeklyChecklist.levels} onChange={() => setWeeklyChecklist(p => ({...p, levels: !p.levels}))} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                        <span className="text-sm text-gray-700">Review Cleaner Level Distribution (Gold/Silver/Bronze)</span>
                                     </label>
                                     <label className="flex items-center gap-3">
                                        <input type="checkbox" checked={weeklyChecklist.topPerformers} onChange={() => setWeeklyChecklist(p => ({...p, topPerformers: !p.topPerformers}))} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                        <span className="text-sm text-gray-700">Identify & Reward Top Performers (Analytics Tab)</span>
                                     </label>
                                     <label className="flex items-center gap-3">
                                        <input type="checkbox" checked={weeklyChecklist.campaigns} onChange={() => setWeeklyChecklist(p => ({...p, campaigns: !p.campaigns}))} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                        <span className="text-sm text-gray-700">Rotate Bonus Campaigns (Merit Tab)</span>
                                     </label>
                                     <label className="flex items-center gap-3">
                                        <input type="checkbox" checked={weeklyChecklist.inactive} onChange={() => setWeeklyChecklist(p => ({...p, inactive: !p.inactive}))} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                        <span className="text-sm text-gray-700">Audit Inactive Accounts (Master DB)</span>
                                     </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-100 p-6">
                            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Operational Action Guide
                            </h3>
                            <p className="text-sm text-blue-700 mb-6">Use these protocols to make decisions when specific situations arise.</p>
                            
                            <div className="space-y-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        If Pending Approvals &gt; 5
                                    </h4>
                                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 ml-1">
                                        <li>Immediately go to <strong>"Cleaners & Verification"</strong> tab.</li>
                                        <li>Review ID and Selfie for each applicant.</li>
                                        <li>Approve valid profiles to increase workforce availability.</li>
                                    </ul>
                                </div>

                                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                        If Support Tickets &gt; 24h Old
                                    </h4>
                                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 ml-1">
                                        <li>Go to <strong>"Support Center"</strong>.</li>
                                        <li>Sort by oldest tickets.</li>
                                        <li>Respond with a standardized apology for delay.</li>
                                        <li>Resolve client issues first to protect reputation.</li>
                                    </ul>
                                </div>

                                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                        If Cleaner Level Drops detected
                                    </h4>
                                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 ml-1">
                                        <li>Go to <strong>"Analytics"</strong> to identify affected pros.</li>
                                        <li>Check if they are missing leads or getting bad ratings.</li>
                                        <li>Consider launching a "Recovery Bonus Campaign" in Merit tab.</li>
                                    </ul>
                                </div>
                                
                                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        If Subscription Cancellations Rise
                                    </h4>
                                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 ml-1">
                                        <li>Review pricing value proposition.</li>
                                        <li>Go to <strong>"Cleaners"</strong> tab and offer a temporary Discount/Exemption to key professionals to retain them.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'cleaners' && (
                <>
                    <div className="mb-12 px-4 animate-fade-in-up">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                            <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
                            Pending Approvals ({pendingCleaners.length})
                        </h2>
                        {pendingCleaners.length === 0 ? (
                        <div className="bg-green-50 border border-green-100 rounded-lg p-6 text-center">
                            <p className="text-green-700 font-medium">All tasks completed. No pending applications.</p>
                        </div>
                        ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {pendingCleaners.map(cleaner => (
                            <div key={cleaner.id} className="bg-white rounded-xl shadow-lg border border-yellow-200 overflow-hidden flex flex-col">
                                <div className="p-6 flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <img src={cleaner.photoUrl} alt="" className="w-16 h-16 rounded-full bg-gray-200 object-cover ring-2 ring-white shadow-sm"/>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 leading-tight">{cleaner.fullName}</h3>
                                        <p className="text-xs text-gray-500">{cleaner.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <p><span className="font-semibold">Type:</span> {cleaner.isCompany ? `Company (${cleaner.companyName})` : 'Individual'}</p>
                                    <p><span className="font-semibold">Loc:</span> {cleaner.city}, {cleaner.state}</p>
                                    <p><span className="font-semibold">Exp:</span> {cleaner.yearsExperience} years</p>
                                </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex gap-3">
                                    <button onClick={() => verifyCleaner(cleaner.id)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold text-sm transition shadow-sm">
                                        Approve
                                    </button>
                                    <button onClick={() => rejectCleaner(cleaner.id)} className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg font-bold text-sm transition">
                                        Reject
                                    </button>
                                </div>
                            </div>
                            ))}
                        </div>
                        )}
                    </div>

                    <div className="mb-12 px-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                            Internal Communications (Cleaner Feed)
                        </h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1">
                                <h3 className="font-bold text-gray-900 mb-4">Create New Post</h3>
                                <form onSubmit={handleCreatePost} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                        <select 
                                        className="w-full border border-gray-300 rounded p-2 text-sm"
                                        value={newPost.type}
                                        onChange={e => setNewPost({...newPost, type: e.target.value as any})}
                                        >
                                            <option value="ANNOUNCEMENT">Announcement</option>
                                            <option value="EVENT">Event</option>
                                            <option value="TRAINING">Training</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                        <input 
                                        type="text" 
                                        className="w-full border border-gray-300 rounded p-2 text-sm"
                                        placeholder="Workshop Title..."
                                        value={newPost.title}
                                        onChange={e => setNewPost({...newPost, title: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Content</label>
                                        <textarea 
                                        className="w-full border border-gray-300 rounded p-2 text-sm"
                                        rows={4}
                                        placeholder="Message details..."
                                        value={newPost.content}
                                        onChange={e => setNewPost({...newPost, content: e.target.value})}
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition">
                                        Post to Feed
                                    </button>
                                </form>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 lg:col-span-2 max-h-[500px] overflow-y-auto">
                                <h3 className="font-bold text-gray-900 mb-4">Active Posts ({feedPosts.length})</h3>
                                <div className="space-y-4">
                                    {feedPosts.map(post => (
                                        <div key={post.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-start">
                                            <div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                    post.type === 'EVENT' ? 'bg-orange-100 text-orange-800' : 
                                                    post.type === 'TRAINING' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                }`}>{post.type}</span>
                                                <h4 className="font-bold text-gray-900 mt-1">{post.title}</h4>
                                                <p className="text-xs text-gray-500">{post.date}</p>
                                            </div>
                                            <button 
                                                onClick={() => deleteFeedPost(post.id)}
                                                className="text-red-500 hover:text-red-700 text-xs font-bold"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                    {feedPosts.length === 0 && <p className="text-gray-500 text-sm italic">No active posts.</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-4 mb-12 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                            Master Database (All House Cleans)
                        </h2>
                        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-50">
                                <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Professional</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subscription</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Merit</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Discount</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {cleaners.map((cleaner) => (
                                <tr key={cleaner.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                        <img className="h-10 w-10 rounded-full object-cover" src={cleaner.photoUrl} alt="" />
                                        </div>
                                        <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{cleaner.fullName}</div>
                                        <div className="text-xs text-gray-500">{cleaner.isCompany ? cleaner.companyName : 'Individual'}</div>
                                        </div>
                                    </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        cleaner.status === 'VERIFIED' ? 'bg-green-100 text-green-800' : 
                                        cleaner.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {cleaner.status}
                                    </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                     {cleaner.subscription?.isActive ? (
                                         <div className="flex flex-col">
                                             <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">ACTIVE</span>
                                             <span className="text-[10px] text-gray-500 mt-0.5">
                                                 {cleaner.subscription.plan === SubscriptionPlan.PROMO_STARTUP ? '$180 (Promo)' : '$260 (Pro)'}
                                             </span>
                                         </div>
                                     ) : (
                                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">INACTIVE</span>
                                     )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900">{cleaner.points} pts</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                                                cleaner.level === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                                                cleaner.level === 'SILVER' ? 'bg-gray-100 text-gray-800' :
                                                'bg-amber-100 text-amber-800'
                                            }`}>
                                                {cleaner.level}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {cleaner.subscription?.activeDiscount ? (
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full w-fit mb-1">
                                                    {cleaner.subscription.activeDiscount.type === DiscountType.FULL_EXEMPTION ? 'EXEMPTION' : 
                                                     cleaner.subscription.activeDiscount.type === DiscountType.PERCENTAGE ? `-${cleaner.subscription.activeDiscount.value}%` : 
                                                     `-$${cleaner.subscription.activeDiscount.value}`}
                                                </span>
                                                <span className="text-[10px] text-gray-400">Ends: {cleaner.subscription.activeDiscount.endDate.split('T')[0]}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openMeritModal(cleaner.id)} className="text-amber-600 hover:text-amber-900 text-xs font-bold border border-amber-200 px-2 py-1 rounded">
                                                Points
                                            </button>
                                            {cleaner.subscription?.activeDiscount ? (
                                                <button onClick={() => removeDiscount(cleaner.id)} className="text-red-600 hover:text-red-900 text-xs border border-red-200 px-2 py-1 rounded">Discount</button>
                                            ) : (
                                                <button onClick={() => openDiscountModal(cleaner.id)} className="text-blue-600 hover:text-blue-900 text-xs border border-blue-200 px-2 py-1 rounded">Discount</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
                            Showing all {cleaners.length} records in database.
                        </div>
                        </div>
                    </div>
                </>
            )}

            {activeView === 'merit' && (
                <div className="px-4 animate-fade-in-up">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
                        <span>🏆</span> Merit System & Campaigns
                    </h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                             <h3 className="font-bold text-gray-900 mb-4">Launch Bonus Campaign</h3>
                             <form onSubmit={handleCreateCampaign} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Campaign Title (PT-BR)</label>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded text-sm"
                                        placeholder="e.g. Bônus de Natal"
                                        value={newCampaign.title}
                                        onChange={e => setNewCampaign({...newCampaign, title: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                    <textarea 
                                        className="w-full border p-2 rounded text-sm"
                                        rows={3}
                                        placeholder="Explain how to earn points..."
                                        value={newCampaign.description}
                                        onChange={e => setNewCampaign({...newCampaign, description: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Points Reward</label>
                                        <input 
                                            type="number" 
                                            className="w-full border p-2 rounded text-sm"
                                            value={newCampaign.pointsReward}
                                            onChange={e => setNewCampaign({...newCampaign, pointsReward: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                        <select 
                                            className="w-full border p-2 rounded text-sm"
                                            value={newCampaign.type}
                                            onChange={e => setNewCampaign({...newCampaign, type: e.target.value as any})}
                                        >
                                            <option value="MANUAL">Manual</option>
                                            <option value="LEAD_ACCEPT">Lead Accept</option>
                                            <option value="JOB_COMPLETE">Job Complete</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded transition">
                                    Launch Campaign
                                </button>
                             </form>
                        </div>

                        <div className="lg:col-span-2 space-y-4">
                             <h3 className="font-bold text-gray-900">Active Campaigns</h3>
                             {bonusCampaigns.map(campaign => (
                                 <div key={campaign.id} className={`border rounded-xl p-4 flex justify-between items-center transition ${campaign.isActive ? 'bg-white border-green-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
                                     <div>
                                         <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                             {campaign.title}
                                             {campaign.isActive && <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full uppercase">Active</span>}
                                         </h4>
                                         <p className="text-sm text-gray-600">{campaign.description}</p>
                                         <p className="text-xs text-gray-400 mt-1">Reward: {campaign.pointsReward} pts • Type: {campaign.type}</p>
                                     </div>
                                     <button 
                                        onClick={() => toggleBonusCampaign(campaign.id)}
                                        className={`px-4 py-2 rounded text-xs font-bold border ${campaign.isActive ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                                     >
                                         {campaign.isActive ? 'Deactivate' : 'Activate'}
                                     </button>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
            )}
            
            {activeView === 'analytics' && (
                <div className="px-4 animate-fade-in-up">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
                        <span>📈</span> Performance & Level Reports
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                             <p className="text-xs font-bold text-gray-400 uppercase">Verified Database</p>
                             <p className="text-3xl font-extrabold text-slate-900">{verifiedCleaners.length}</p>
                         </div>
                         <div className="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-200">
                             <p className="text-xs font-bold text-yellow-700 uppercase">Gold Pros 🥇</p>
                             <p className="text-3xl font-extrabold text-yellow-900">{goldCount}</p>
                         </div>
                         <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200">
                             <p className="text-xs font-bold text-slate-600 uppercase">Silver Pros 🥈</p>
                             <p className="text-3xl font-extrabold text-slate-800">{silverCount}</p>
                         </div>
                         <div className="bg-amber-50 p-6 rounded-xl shadow-sm border border-amber-200">
                             <p className="text-xs font-bold text-amber-700 uppercase">Bronze Pros 🥉</p>
                             <p className="text-3xl font-extrabold text-amber-900">{bronzeCount}</p>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                             <h3 className="font-bold text-gray-900 mb-4">Top Performing Cleaners (by Merit)</h3>
                             <div className="space-y-4">
                                 {topCleaners.map((cleaner, index) => (
                                     <div key={cleaner.id} className="flex items-center gap-4 border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                                         <span className="font-mono font-bold text-gray-300 text-lg w-6">#{index + 1}</span>
                                         <img src={cleaner.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200"/>
                                         <div className="flex-1">
                                             <div className="flex justify-between">
                                                 <p className="font-bold text-gray-900 text-sm">{cleaner.fullName}</p>
                                                 <span className="text-xs font-bold text-amber-600">{cleaner.points} pts</span>
                                             </div>
                                             <p className="text-xs text-gray-500">{cleaner.level} • {cleaner.city}</p>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                         
                         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                             <h3 className="font-bold text-gray-900 mb-4">Platform Health Indicators</h3>
                             <div className="space-y-6">
                                 <div>
                                     <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                         <span>Gold Tier Saturation</span>
                                         <span>{Math.round((goldCount / verifiedCleaners.length) * 100) || 0}%</span>
                                     </div>
                                     <div className="w-full bg-gray-100 rounded-full h-2">
                                         <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${(goldCount / verifiedCleaners.length) * 100}%` }}></div>
                                     </div>
                                     <p className="text-xs text-gray-400 mt-1">Target: 20% of active workforce</p>
                                 </div>
                                 
                                 <div>
                                     <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                         <span>Silver Tier Saturation</span>
                                         <span>{Math.round((silverCount / verifiedCleaners.length) * 100) || 0}%</span>
                                     </div>
                                     <div className="w-full bg-gray-100 rounded-full h-2">
                                         <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${(silverCount / verifiedCleaners.length) * 100}%` }}></div>
                                     </div>
                                     <p className="text-xs text-gray-400 mt-1">Target: 40% of active workforce</p>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            )}
            
            {discountModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
                        <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold">Apply Benefit / Discount</h3>
                            <button onClick={closeDiscountModal} className="text-gray-400 hover:text-white">&times;</button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Benefit Type</label>
                                    <select 
                                        className="w-full border p-2 rounded text-sm"
                                        value={discountForm.type}
                                        onChange={e => setDiscountForm({...discountForm, type: e.target.value as DiscountType})}
                                    >
                                        <option value={DiscountType.PERCENTAGE}>Percentage Discount (%)</option>
                                        <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount Off ($)</option>
                                        <option value={DiscountType.FULL_EXEMPTION}>Full Payment Exemption</option>
                                    </select>
                                </div>
                                
                                {discountForm.type !== DiscountType.FULL_EXEMPTION && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                            {discountForm.type === DiscountType.PERCENTAGE ? 'Percentage Value' : 'Amount Value ($)'}
                                        </label>
                                        <input 
                                            type="number"
                                            className="w-full border p-2 rounded text-sm"
                                            value={discountForm.value}
                                            onChange={e => setDiscountForm({...discountForm, value: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Duration (Months)</label>
                                    <select 
                                        className="w-full border p-2 rounded text-sm"
                                        value={discountForm.monthsDuration}
                                        onChange={e => setDiscountForm({...discountForm, monthsDuration: parseInt(e.target.value)})}
                                    >
                                        <option value={1}>1 Month</option>
                                        <option value={2}>2 Months</option>
                                        <option value={3}>3 Months</option>
                                        <option value={6}>6 Months</option>
                                        <option value={12}>1 Year</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Internal Note / Description</label>
                                    <input 
                                        type="text"
                                        className="w-full border p-2 rounded text-sm"
                                        placeholder="e.g., Hardship Exemption, Promo"
                                        value={discountForm.description}
                                        onChange={e => setDiscountForm({...discountForm, description: e.target.value})}
                                    />
                                </div>
                                
                                <div className="pt-4 flex gap-3">
                                    <button onClick={closeDiscountModal} className="flex-1 border border-gray-300 text-gray-700 font-bold py-2 rounded text-sm hover:bg-gray-50">Cancel</button>
                                    <button onClick={submitDiscount} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded text-sm hover:bg-blue-700">Apply to Cleaner</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {meritModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in">
                        <div className="bg-amber-600 p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold">Manage Merit Points</h3>
                            <button onClick={closeMeritModal} className="text-white/80 hover:text-white">&times;</button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Points Amount</label>
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 rounded text-sm font-mono font-bold"
                                        value={meritForm.amount}
                                        onChange={e => setMeritForm({...meritForm, amount: parseInt(e.target.value)})}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Use negative values to deduct points.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Reason</label>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded text-sm"
                                        placeholder="e.g. Complaint, Extra Service, Refund"
                                        value={meritForm.reason}
                                        onChange={e => setMeritForm({...meritForm, reason: e.target.value})}
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button onClick={closeMeritModal} className="flex-1 border border-gray-300 text-gray-700 font-bold py-2 rounded text-sm hover:bg-gray-50">Cancel</button>
                                    <button onClick={submitMerit} className="flex-1 bg-amber-600 text-white font-bold py-2 rounded text-sm hover:bg-amber-700">Update Points</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'support' && (
                <div className="px-4 animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <p className="text-xs font-bold text-gray-500 uppercase">Total Tickets</p>
                            <p className="text-3xl font-extrabold text-slate-900">{totalRequests}</p>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
                            <p className="text-xs font-bold text-blue-600 uppercase">Pending Review</p>
                            <p className="text-3xl font-extrabold text-blue-900">{pendingRequests}</p>
                        </div>
                        <div className="bg-green-50 p-6 rounded-xl shadow-sm border border-green-100">
                            <p className="text-xs font-bold text-green-600 uppercase">Resolved</p>
                            <p className="text-3xl font-extrabold text-green-900">{resolvedRequests}</p>
                        </div>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        Support Tickets
                    </h2>

                    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Message</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {supportRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                                                No support requests found.
                                            </td>
                                        </tr>
                                    ) : (
                                        supportRequests.map(req => (
                                            <tr key={req.id} className="hover:bg-slate-50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                        req.type === SupportType.CLIENT ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {req.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {req.fullName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {req.type === SupportType.CLIENT ? (
                                                        <>
                                                            <div>{req.contactEmail}</div>
                                                            <div className="text-xs">{req.contactPhone}</div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="font-bold text-green-600 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                                                                {req.whatsapp}
                                                            </div>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {req.message}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        req.status === SupportStatus.RESOLVED ? 'bg-gray-100 text-gray-800' :
                                                        req.status === SupportStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {req.status !== SupportStatus.RESOLVED ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={() => updateSupportStatus(req.id, SupportStatus.IN_PROGRESS)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                Mark Active
                                                            </button>
                                                            <button 
                                                                onClick={() => updateSupportStatus(req.id, SupportStatus.RESOLVED)}
                                                                className="text-green-600 hover:text-green-900"
                                                            >
                                                                Resolve
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Closed on {req.resolvedAt?.split('T')[0]}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {activeView === 'system' && (
                <div className="px-4 animate-fade-in-up">
                    <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-700 overflow-hidden mb-8">
                         <div className="px-8 py-6 border-b border-slate-700 flex justify-between items-center">
                             <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    System Guardian™ Status
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">Platform Identity: {SYSTEM_IDENTITY.NAME} v{SYSTEM_IDENTITY.VERSION}</p>
                             </div>
                             <div className="flex items-center gap-2 bg-green-900/30 px-3 py-1 rounded-full border border-green-500/30">
                                 <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                 <span className="text-green-400 text-xs font-bold uppercase">PROTECTED</span>
                             </div>
                         </div>
                         <div className="p-8">
                             <div className="grid md:grid-cols-2 gap-8">
                                 <div className="space-y-6">
                                     <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                                         <p className="text-xs font-bold text-slate-400 uppercase mb-2">Operational Status</p>
                                         <p className={`text-2xl font-extrabold ${healthStatus.status === 'HEALTHY' ? 'text-green-400' : 'text-red-400'}`}>
                                             {healthStatus.status}
                                         </p>
                                         <p className="text-xs text-slate-500 mt-1">
                                             {healthStatus.dataIntegrity ? 'All databases are verified and intact.' : 'Data corruption detected.'}
                                         </p>
                                     </div>
                                     <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
                                         <p className="text-xs font-bold text-slate-400 uppercase mb-2">Last Automated Backup</p>
                                         <p className="text-lg font-mono text-blue-300">
                                             {healthStatus.lastBackup ? new Date(healthStatus.lastBackup).toLocaleString() : 'N/A'}
                                         </p>
                                         <p className="text-xs text-slate-500 mt-1">Backups run automatically on every system boot.</p>
                                     </div>
                                 </div>
                                 
                                 <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                                     <h3 className="font-bold text-white mb-4">Manual Overrides</h3>
                                     <div className="space-y-3">
                                         <button 
                                            onClick={handleManualBackup}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition text-sm flex items-center justify-center gap-2"
                                         >
                                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                             Force Manual Backup
                                         </button>
                                         <p className="text-xs text-slate-500 text-center">
                                             Use this before performing any major manual updates or data changes.
                                         </p>
                                     </div>
                                 </div>
                             </div>

                             {healthStatus.issues.length > 0 && (
                                 <div className="mt-8 bg-red-900/20 border border-red-900/50 p-4 rounded-lg">
                                     <h4 className="text-red-400 font-bold mb-2">Detected Issues</h4>
                                     <ul className="list-disc list-inside text-sm text-red-300">
                                         {healthStatus.issues.map((issue, idx) => (
                                             <li key={idx}>{issue}</li>
                                         ))}
                                     </ul>
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
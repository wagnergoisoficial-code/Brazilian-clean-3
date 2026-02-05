
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  CleanerProfile, CleanerStatus, UserRole, Lead, ChatRoom, ChatMessage, CleanerLevel,
  SupportRequest, SupportStatus, SupportType, TeamMember, AuditLog, EmailNotification
} from '../types';
import { translateChatMessage } from '../services/geminiService';
import { canCleanerServeZip } from '../services/locationService';

interface AppContextType {
  cleaners: CleanerProfile[];
  leads: Lead[];
  chatRooms: ChatRoom[];
  chatMessages: ChatMessage[];
  supportRequests: SupportRequest[];
  teamMembers: TeamMember[];
  auditLogs: AuditLog[];
  userRole: UserRole;
  authenticatedCleanerId: string | null;
  isHydrated: boolean;
  isChatOpen: boolean;
  lastEmail: EmailNotification | null;
  pendingClientCode: string | null;
  pendingClientEmail: string | null;
  pendingClientCodeExpires: number | null;
  
  setIsChatOpen: (open: boolean) => void;
  clearLastEmail: () => void;
  loginCleaner: (email: string, password: string) => Promise<CleanerProfile | null>;
  registerCleaner: (data: Partial<CleanerProfile>) => Promise<string>;
  logout: () => void;
  createLead: (lead: Partial<Lead>) => Promise<void>;
  acceptLead: (leadId: string, cleanerId: string) => void;
  toggleAvailability: (cleanerId: string) => void;
  sendChatMessage: (roomId: string, message: string, senderRole: 'client' | 'cleaner') => Promise<void>;
  getRoomForLead: (leadId: string) => ChatRoom | undefined;
  getMessagesForRoom: (roomId: string) => ChatMessage[];
  updateCleanerProfile: (id: string, data: Partial<CleanerProfile>) => void;
  verifyCleanerCode: (id: string, code: string) => { success: boolean; error?: string };
  resendCleanerCode: (id: string) => Promise<void>;
  resendClientCode: () => Promise<void>;
  createSupportRequest: (req: Partial<SupportRequest>) => void;
  verifyCleaner: (id: string, adminId: string) => void;
  rejectCleaner: (id: string, adminId: string) => void;
  deleteCleaner: (id: string, adminId: string) => void;
  updateSupportStatus: (id: string, status: SupportStatus) => void;
  requestPasswordReset: (email: string) => Promise<void>;
  updateLead: (leadId: string, data: Partial<Lead>) => void;
  updateLeadOutcome: (leadId: string, outcome: 'COMPLETED' | 'LOST') => void;
  searchCleaners: (zip: string, service?: string) => CleanerProfile[];
  deleteMyAccount: () => void;
  [key: string]: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Fix: Exporting useAppContext to resolve multi-file import errors.
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cleaners, setCleaners] = useState<CleanerProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [userRole, setUserRole] = useState<UserRole>(UserRole.CLIENT);
  const [authenticatedCleanerId, setAuthenticatedCleanerId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastEmail, setLastEmail] = useState<EmailNotification | null>(null);

  const [pendingClientCode, setPendingClientCode] = useState<string | null>(null);
  const [pendingClientEmail, setPendingClientEmail] = useState<string | null>(null);
  const [pendingClientCodeExpires, setPendingClientCodeExpires] = useState<number | null>(null);

  const sanitizeStorageData = (data: any[]): any[] => {
    if (!Array.isArray(data)) return [];
    return data.map(item => {
      const sanitized = { ...item };
      const blobFields = ['documentFrontUrl', 'documentBackUrl', 'facePhotoUrl', 'selfieWithDocUrl', 'photoUrl'];
      blobFields.forEach(field => {
        const value = sanitized[field];
        if (typeof value === 'string' && (value.startsWith('data:') || value.length > 2000)) {
          sanitized[field] = '';
        }
      });
      return sanitized;
    });
  };

  useEffect(() => {
    const hydrate = () => {
      const safeParse = (key: string, fallback: any) => {
        try {
          const item = localStorage.getItem(key);
          if (!item) return fallback;
          let parsed = JSON.parse(item);
          if (key === 'bc_cleaners') return sanitizeStorageData(parsed);
          return parsed;
        } catch (e) { 
          return fallback; 
        }
      };

      setCleaners(safeParse('bc_cleaners', []));
      setLeads(safeParse('bc_leads', []));
      setChatRooms(safeParse('bc_chat_rooms', []));
      setChatMessages(safeParse('bc_chat_messages', []));
      setSupportRequests(safeParse('bc_support', []));
      setTeamMembers(safeParse('bc_team', []));
      setAuditLogs(safeParse('bc_logs', []));
      
      const cleanerId = localStorage.getItem('bc_auth_cleaner_id');
      if (cleanerId) { 
        setAuthenticatedCleanerId(cleanerId); 
        setUserRole(UserRole.CLEANER); 
      }
      setIsHydrated(true);
    };
    hydrate();
  }, []);

  useEffect(() => { 
    if(isHydrated) {
      const dataToPersist = {
        'bc_cleaners': cleaners,
        'bc_leads': leads,
        'bc_chat_rooms': chatRooms,
        'bc_chat_messages': chatMessages,
        'bc_support': supportRequests,
        'bc_team': teamMembers,
        'bc_logs': auditLogs
      };

      Object.entries(dataToPersist).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e: any) {
          if (e.name === 'QuotaExceededError' && key === 'bc_logs') {
            localStorage.removeItem('bc_logs');
          }
        }
      });
    }
  }, [cleaners, leads, chatRooms, chatMessages, supportRequests, teamMembers, auditLogs, isHydrated]);

  const dispatchEmail = async (to: string, language: 'en' | 'pt'): Promise<string | null> => {
    try {
      const response = await fetch('/.netlify/functions/sendVerificationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, language })
      });
      const data = await response.json();
      if (data.success && data.code) return data.code;
      return null;
    } catch (err) {
      return null;
    }
  };

  const loginCleaner = async (email: string, password: string): Promise<CleanerProfile | null> => {
    const cleaner = cleaners.find(c => c.email.toLowerCase() === email.toLowerCase() && c.password === password);
    if (cleaner) {
      setAuthenticatedCleanerId(cleaner.id);
      setUserRole(UserRole.CLEANER);
      localStorage.setItem('bc_auth_cleaner_id', cleaner.id);
      return cleaner;
    }
    return null;
  };

  const registerCleaner = async (data: Partial<CleanerProfile>): Promise<string> => {
    const id = Math.random().toString(36).substr(2, 9);
    let code = await dispatchEmail(data.email || '', 'pt');
    if (!code) code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const newCleaner: CleanerProfile = {
      id,
      fullName: data.fullName || '',
      email: data.email || '',
      password: data.password || '',
      phone: data.phone || '',
      city: data.city || '',
      state: data.state || '',
      baseZip: data.baseZip || '',
      serviceRadius: 10,
      zipCodes: data.zipCodes || [],
      status: CleanerStatus.CREATED,
      isAvailable: true,
      rating: 5,
      reviewCount: 0,
      joinedDate: new Date().toISOString(),
      emailVerified: false,
      verificationCode: code,
      verificationCodeExpires: Date.now() + 600000,
      photoUrl: '',
      galleryUrls: [],
      portfolio: [],
      isListed: false,
      profileCompleted: false,
      points: 0,
      level: CleanerLevel.BRONZE,
      pointHistory: [],
      companyName: data.companyName || '',
      isCompany: data.isCompany || false,
      yearsExperience: data.yearsExperience || 0,
      services: [],
      description: ''
    };

    setCleaners(prev => [...prev, newCleaner]);
    // Fix: Added missing return id to resolve type error on line 185.
    return id;
  };

  const logout = () => {
    setAuthenticatedCleanerId(null);
    setUserRole(UserRole.CLIENT);
    localStorage.removeItem('bc_auth_cleaner_id');
  };

  const createLead = async (leadData: Partial<Lead>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newLead: Lead = {
      id,
      clientName: leadData.clientName || '',
      clientPhone: leadData.clientPhone || '',
      clientEmail: leadData.clientEmail || '',
      zipCode: leadData.zipCode || '',
      serviceType: leadData.serviceType || '',
      bedrooms: leadData.bedrooms || 0,
      bathrooms: leadData.bathrooms || 0,
      date: leadData.date || '',
      status: 'NEW',
      createdAt: Date.now(),
      ...leadData
    };
    
    const matchingCleaners = cleaners.filter(c => canCleanerServeZip(c, newLead.zipCode));
    newLead.broadcastToIds = matchingCleaners.map(c => c.id);
    
    setLeads(prev => [...prev, newLead]);
    
    const code = await dispatchEmail(newLead.clientEmail || '', 'en');
    setPendingClientCode(code);
    setPendingClientEmail(newLead.clientEmail || null);
    setPendingClientCodeExpires(Date.now() + 600000);
  };

  const acceptLead = (leadId: string, cleanerId: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? {
      ...l,
      status: 'ASSIGNED' as const,
      acceptedByCleanerId: cleanerId,
      history: [...(l.history || []), { timestamp: Date.now(), event: 'Lead accepted by cleaner' }]
    } : l));

    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      const roomId = Math.random().toString(36).substr(2, 9);
      setChatRooms(prev => [...prev, {
        id: roomId,
        leadId,
        clientId: lead.clientEmail || 'unknown',
        cleanerId,
        createdAt: Date.now()
      }]);
    }
  };

  const toggleAvailability = (id: string) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, isAvailable: !c.isAvailable } : c));
  };

  const sendChatMessage = async (roomId: string, message: string, senderRole: 'client' | 'cleaner') => {
    const translation = await translateChatMessage(message, senderRole);
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      chatRoomId: roomId,
      senderRole,
      messageOriginal: message,
      languageOriginal: translation.sourceLang,
      messageTranslated: translation.translatedText,
      languageTarget: translation.targetLang,
      createdAt: Date.now()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const getRoomForLead = (leadId: string) => chatRooms.find(r => r.leadId === leadId);
  const getMessagesForRoom = (roomId: string) => chatMessages.filter(m => m.chatRoomId === roomId);

  const updateCleanerProfile = (id: string, data: Partial<CleanerProfile>) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const verifyCleanerCode = (id: string, code: string) => {
    const cleaner = cleaners.find(c => c.id === id);
    if (cleaner && cleaner.verificationCode === code) {
      updateCleanerProfile(id, { status: CleanerStatus.EMAIL_VERIFIED, emailVerified: true });
      return { success: true };
    }
    return { success: false, error: 'Código inválido' };
  };

  const resendCleanerCode = async (id: string) => {
    const cleaner = cleaners.find(c => c.id === id);
    if (cleaner) {
      const code = await dispatchEmail(cleaner.email, 'pt');
      updateCleanerProfile(id, { verificationCode: code || undefined, verificationCodeExpires: Date.now() + 600000 });
    }
  };

  const resendClientCode = async () => {
    if (pendingClientEmail) {
      const code = await dispatchEmail(pendingClientEmail, 'en');
      setPendingClientCode(code);
      setPendingClientCodeExpires(Date.now() + 600000);
    }
  };

  const createSupportRequest = (req: Partial<SupportRequest>) => {
    const newReq: SupportRequest = {
      id: Math.random().toString(36).substr(2, 9),
      type: req.type || SupportType.CLIENT,
      fullName: req.fullName || '',
      contactPhone: req.contactPhone || '',
      message: req.message || '',
      status: SupportStatus.NEW,
      createdAt: new Date().toISOString(),
      ...req
    };
    setSupportRequests(prev => [...prev, newReq]);
  };

  const verifyCleaner = (id: string, adminId: string) => updateCleanerProfile(id, { status: CleanerStatus.ACTIVE });
  const rejectCleaner = (id: string, adminId: string) => updateCleanerProfile(id, { status: CleanerStatus.REJECTED });
  const deleteCleaner = (id: string, adminId: string) => setCleaners(prev => prev.filter(c => c.id !== id));
  const updateSupportStatus = (id: string, status: SupportStatus) => setSupportRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  const requestPasswordReset = async (email: string) => { /* Mock */ };
  const updateLead = (leadId: string, data: Partial<Lead>) => setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...data } : l));
  const updateLeadOutcome = (leadId: string, outcome: 'COMPLETED' | 'LOST') => updateLead(leadId, { status: outcome, completedAt: outcome === 'COMPLETED' ? Date.now() : undefined });
  const searchCleaners = (zip: string, service?: string) => cleaners.filter(c => canCleanerServeZip(c, zip) && (!service || c.services.includes(service)));
  const deleteMyAccount = () => { if (authenticatedCleanerId) setCleaners(prev => prev.filter(c => c.id !== authenticatedCleanerId)); logout(); };

  const value: AppContextType = {
    cleaners, leads, chatRooms, chatMessages, supportRequests, teamMembers, auditLogs,
    userRole, authenticatedCleanerId, isHydrated, isChatOpen, lastEmail,
    pendingClientCode, pendingClientEmail, pendingClientCodeExpires,
    setIsChatOpen, clearLastEmail: () => setLastEmail(null), loginCleaner, registerCleaner, logout,
    createLead, acceptLead, toggleAvailability, sendChatMessage, getRoomForLead, getMessagesForRoom,
    updateCleanerProfile, verifyCleanerCode, resendCleanerCode, resendClientCode,
    createSupportRequest, verifyCleaner, rejectCleaner, deleteCleaner, updateSupportStatus,
    requestPasswordReset, updateLead, updateLeadOutcome, searchCleaners, deleteMyAccount
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

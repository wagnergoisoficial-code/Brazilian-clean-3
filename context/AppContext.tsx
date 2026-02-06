
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
  SERVICE_UI_MAP_EN: Record<string, string>;
  
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

const SERVICE_UI_MAP_EN: Record<string, string> = {
  'residential_cleaning': 'Standard Clean',
  'recurring_cleaning_weekly': 'Weekly Clean',
  'recurring_cleaning_biweekly': 'Bi-Weekly Clean',
  'recurring_cleaning_monthly': 'Monthly Clean',
  'deep_cleaning': 'Deep Cleaning',
  'move_in_out': 'Move In/Out',
  'office_cleaning': 'Office Cleaning',
  'commercial_cleaning': 'Commercial Clean',
  'window_cleaning': 'Window Cleaning',
  'oven_cleaning': 'Oven Cleaning',
  'refrigerator_cleaning': 'Fridge Cleaning',
  'carpet_cleaning': 'Carpet Cleaning',
  'sofa_cleaning': 'Sofa Cleaning',
  'deck_cleaning': 'Deck & Patio',
  'laundry_ironing': 'Laundry & Ironing',
  'mommy_helper': 'Mommy Helper',
  'elder_care': 'Elderly Care',
  'pet_care': 'Pet Care',
  'express_cleaning': 'Express Clean',
  'organization_service': 'Organization',
  'babysitting': 'Babysitting'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
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
        if (typeof value === 'string' && (value.startsWith('data:') || value.length > 5000)) {
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
        } catch (e) { return fallback; }
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
      const persist = (key: string, val: any) => {
        try { localStorage.setItem(key, JSON.stringify(val)); } 
        catch (e: any) { if (e.name === 'QuotaExceededError') localStorage.removeItem('bc_logs'); }
      };
      persist('bc_cleaners', cleaners);
      persist('bc_leads', leads);
      persist('bc_chat_rooms', chatRooms);
      persist('bc_chat_messages', chatMessages);
      persist('bc_support', supportRequests);
      persist('bc_team', teamMembers);
      persist('bc_logs', auditLogs);
    }
  }, [cleaners, leads, chatRooms, chatMessages, supportRequests, teamMembers, auditLogs, isHydrated]);

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
      verificationCode: Math.floor(100000 + Math.random() * 900000).toString(),
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
    setAuthenticatedCleanerId(id);
    setUserRole(UserRole.CLEANER);
    localStorage.setItem('bc_auth_cleaner_id', id);
    
    setLastEmail({
      to: newCleaner.email,
      subject: "Seu código de verificação",
      body: `Olá! Seu código é: ${newCleaner.verificationCode}`,
      actionLink: `/verify?id=${id}&code=${newCleaner.verificationCode}`,
      actionText: "Verificar Conta"
    });
    return id;
  };

  const verifyCleanerCode = (id: string, code: string) => {
    const cleaner = cleaners.find(c => c.id === id);
    if (!cleaner) return { success: false, error: "Profissional não encontrado." };
    if (cleaner.verificationCode === code) {
      updateCleanerProfile(id, { emailVerified: true, status: CleanerStatus.EMAIL_VERIFIED });
      return { success: true };
    }
    return { success: false, error: "Código incorreto." };
  };

  const logout = () => {
    setAuthenticatedCleanerId(null);
    setUserRole(UserRole.CLIENT);
    localStorage.removeItem('bc_auth_cleaner_id');
  };

  const updateCleanerProfile = (id: string, data: Partial<CleanerProfile>) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const createLead = async (l: Partial<Lead>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newLead: Lead = { ...l, id, status: 'NEW', createdAt: Date.now() } as Lead;
    setLeads(prev => [newLead, ...prev]);
  };

  const acceptLead = (leadId: string, cleanerId: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'ASSIGNED', acceptedByCleanerId: cleanerId } : l));
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
  const createSupportRequest = (req: Partial<SupportRequest>) => setSupportRequests(prev => [...prev, { ...req, id: Math.random().toString(36).substr(2, 9), status: SupportStatus.NEW, createdAt: new Date().toISOString() } as SupportRequest]);
  const verifyCleaner = (id: string) => updateCleanerProfile(id, { status: CleanerStatus.ACTIVE, isListed: true });
  const rejectCleaner = (id: string) => updateCleanerProfile(id, { status: CleanerStatus.REJECTED });
  const deleteCleaner = (id: string) => setCleaners(prev => prev.filter(c => c.id !== id));
  const updateSupportStatus = (id: string, status: SupportStatus) => setSupportRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  const requestPasswordReset = async (email: string) => console.log("Reset for", email);
  const updateLead = (leadId: string, data: Partial<Lead>) => setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...data } : l));
  const updateLeadOutcome = (leadId: string, outcome: 'COMPLETED' | 'LOST') => updateLead(leadId, { status: outcome, completedAt: outcome === 'COMPLETED' ? Date.now() : undefined });
  const searchCleaners = (zip: string) => cleaners.filter(c => c.status === CleanerStatus.ACTIVE && c.isListed);
  const deleteMyAccount = () => { if (authenticatedCleanerId) setCleaners(prev => prev.filter(c => c.id !== authenticatedCleanerId)); logout(); };

  return (
    <AppContext.Provider value={{ 
      cleaners, leads, chatRooms, chatMessages, supportRequests, teamMembers, auditLogs,
      userRole, authenticatedCleanerId, isHydrated, isChatOpen, lastEmail,
      pendingClientCode, pendingClientEmail, pendingClientCodeExpires, SERVICE_UI_MAP_EN,
      setIsChatOpen, clearLastEmail: () => setLastEmail(null), loginCleaner, registerCleaner, logout,
      createLead, acceptLead, toggleAvailability, sendChatMessage, getRoomForLead, getMessagesForRoom,
      updateCleanerProfile, verifyCleanerCode, resendCleanerCode: async () => {}, resendClientCode: async () => {},
      createSupportRequest, verifyCleaner, rejectCleaner, deleteCleaner, updateSupportStatus,
      requestPasswordReset, updateLead, updateLeadOutcome, searchCleaners, deleteMyAccount
    }}>
      {children}
    </AppContext.Provider>
  );
};

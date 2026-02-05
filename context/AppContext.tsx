
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  CleanerProfile, CleanerStatus, UserRole, Lead, ChatRoom, ChatMessage, CleanerLevel,
  SupportRequest, SupportStatus, SupportType, TeamMember, AuditLog, EmailNotification
} from '../types';
import { translateChatMessage } from '../services/geminiService';
import { canCleanerServeZip, normalizeZip } from '../services/locationService';
import { sortCleanersByMerit } from '../services/meritService';

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

  useEffect(() => {
    const hydrate = () => {
      const safeParse = (key: string, fallback: any) => {
        try {
          const item = localStorage.getItem(key);
          // CRITICAL: If an item is corrupted (e.g., contains unserializable data like old image base64),
          // this will catch the JSON.parse error and return the fallback, preventing a hydration crash.
          return item ? JSON.parse(item) : fallback;
        } catch (e) { 
          console.warn(`[Hydration Guard] Corrupted data in localStorage for key: ${key}. Falling back to default.`);
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
      try {
        // PRODUCTION-FIX: Added specific try/catch for QuotaExceededError.
        // The primary fix is to NOT store large payloads, but this acts as a critical safety net.
        localStorage.setItem('bc_cleaners', JSON.stringify(cleaners));
        localStorage.setItem('bc_leads', JSON.stringify(leads));
        localStorage.setItem('bc_chat_rooms', JSON.stringify(chatRooms));
        localStorage.setItem('bc_chat_messages', JSON.stringify(chatMessages));
        localStorage.setItem('bc_support', JSON.stringify(supportRequests));
        localStorage.setItem('bc_team', JSON.stringify(teamMembers));
        localStorage.setItem('bc_logs', JSON.stringify(auditLogs));
      } catch(e: any) {
         if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            console.error("[CRITICAL] QuotaExceededError: LocalStorage is full. The application state could not be persisted. This may lead to data loss on refresh.");
            // In a real app, we might trigger a notification to the user or a logging service.
         } else {
            console.error("[CRITICAL] Failed to write to LocalStorage:", e);
         }
      }
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
      console.error("Mail Dispatch Error:", err);
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
    setAuthenticatedCleanerId(id);
    setUserRole(UserRole.CLEANER);
    localStorage.setItem('bc_auth_cleaner_id', id);

    setLastEmail({
      to: newCleaner.email,
      subject: "Seu código de verificação",
      body: `Olá! Seu código é: ${code}`,
      actionLink: `/verify?id=${id}&code=${code}`,
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

  const distributeLead = (lead: Lead) => {
    const serviceKey = lead.serviceType.toLowerCase().replace(/ /g, '_');

    const availableCleaners = cleaners.filter(c => 
        c.status === CleanerStatus.ACTIVE &&
        c.isAvailable === true &&
        c.isListed === true &&
        canCleanerServeZip(c, lead.zipCode) &&
        c.services.includes(serviceKey)
    );

    const sortedCleaners = sortCleanersByMerit(availableCleaners);
    const selectedCleaners = sortedCleaners.slice(0, 4);
    const selectedIds = selectedCleaners.map(c => c.id);

    setLeads(prev => prev.map(l => 
        l.id === lead.id ? { ...l, status: 'OPEN', broadcastToIds: selectedIds } : l
    ));

    console.log(`Lead ${lead.id} for ${lead.serviceType} distributed to cleaners:`, selectedIds);
  };

  const createLead = async (l: Partial<Lead>) => {
    const id = Math.random().toString(36).substr(2, 9);
    let code = await dispatchEmail(l.clientEmail || '', 'en');
    if (!code) code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const newLead: Lead = { ...l, id, status: 'NEW', createdAt: Date.now(), history: [{timestamp: Date.now(), event: 'Lead Created'}] } as Lead;
    setLeads(prev => [newLead, ...prev]);

    distributeLead(newLead);

    setPendingClientCode(code);
    setPendingClientEmail(l.clientEmail || '');
    setPendingClientCodeExpires(Date.now() + 600000);

    const roomId = `room_${id}`;
    const newRoom: ChatRoom = { id: roomId, leadId: id, clientId: 'anonymous_client', cleanerId: '', createdAt: Date.now() };
    setChatRooms(prev => [...prev, newRoom]);

    setLastEmail({
      to: l.clientEmail || '',
      subject: "Verify your cleaning request",
      body: `Your verification code is: ${code}`,
      actionLink: `/verify?type=client&code=${code}`,
      actionText: "Verify Request"
    });
  };

  const acceptLead = (leadId: string, cleanerId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.status === 'OPEN') {
      setLeads(prev => prev.map(l => l.id === leadId ? {
        ...l, 
        status: 'ASSIGNED', 
        acceptedByCleanerId: cleanerId,
        history: [...(l.history || []), { timestamp: Date.now(), event: 'Lead Accepted by Professional' }]
      } : l));
      setChatRooms(prev => prev.map(r => r.leadId === leadId ? {...r, cleanerId} : r));
    }
  };

  const updateLead = (leadId: string, data: Partial<Lead>) => {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...data } : l));
  };
  
  const updateLeadOutcome = (leadId: string, outcome: 'COMPLETED' | 'LOST') => {
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        const eventText = outcome === 'COMPLETED' ? 'Job Marked as Won' : 'Job Marked as Lost';
        return {
          ...l,
          status: outcome,
          completedAt: outcome === 'COMPLETED' ? Date.now() : l.completedAt,
          history: [...(l.history || []), { timestamp: Date.now(), event: eventText }]
        };
      }
      return l;
    }));
  };
  
  const toggleAvailability = (cleanerId: string) => {
    setCleaners(prev => prev.map(c => 
      c.id === cleanerId ? { ...c, isAvailable: !c.isAvailable } : c
    ));
  };

  const sendChatMessage = async (roomId: string, message: string, senderRole: 'client' | 'cleaner') => {
    const { translatedText, sourceLang, targetLang } = await translateChatMessage(message, senderRole);
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      chatRoomId: roomId,
      senderRole,
      messageOriginal: message,
      languageOriginal: sourceLang,
      messageTranslated: translatedText,
      languageTarget: targetLang,
      createdAt: Date.now()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const createSupportRequest = (req: Partial<SupportRequest>) => {
    const newReq = { ...req, id: Math.random().toString(36).substr(2, 9), status: SupportStatus.NEW, createdAt: new Date().toISOString() } as SupportRequest;
    setSupportRequests(prev => [newReq, ...prev]);
  };

  const updateSupportStatus = (id: string, status: SupportStatus) => {
    setSupportRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const updateCleanerProfile = (id: string, data: Partial<CleanerProfile>) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const searchCleaners = (zip: string, service?: string): CleanerProfile[] => {
    const normalizedTargetZip = normalizeZip(zip);
    return cleaners.filter(c => 
        c.status === CleanerStatus.ACTIVE &&
        c.isListed &&
        canCleanerServeZip(c, normalizedTargetZip) &&
        (!service || c.services.includes(service))
    );
  };
  
  const verifyCleaner = (id: string, adminId: string) => {
    updateCleanerProfile(id, { status: CleanerStatus.ACTIVE, isListed: true });
    setAuditLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), adminId, adminName: "Admin", action: "VERIFY_CLEANER", targetId: id, targetType: 'CLEANER', timestamp: new Date().toISOString(), details: "Documents verified manually" }, ...prev]);
  };

  const rejectCleaner = (id: string, adminId: string) => updateCleanerProfile(id, { status: CleanerStatus.REJECTED });
  const deleteCleaner = (id: string, adminId: string) => setCleaners(prev => prev.filter(c => c.id !== id));
  
  const requestPasswordReset = async (email: string) => console.log("Password reset requested for", email);

  const deleteMyAccount = () => {
    if (authenticatedCleanerId) {
      setCleaners(prev => prev.filter(c => c.id !== authenticatedCleanerId));
      logout();
    }
  };

  const resendCleanerCode = async (id: string) => {
    const cleaner = cleaners.find(c => c.id === id);
    if (cleaner) {
      const code = await dispatchEmail(cleaner.email, 'pt');
      if (code) updateCleanerProfile(id, { verificationCode: code });
      setLastEmail({ to: cleaner.email, subject: "Seu novo código", body: `Seu novo código é: ${code || cleaner.verificationCode}`, actionLink: `/verify?id=${id}`, actionText: "Verificar" });
    }
  };

  const resendClientCode = async () => {
    if (pendingClientEmail) {
      const code = await dispatchEmail(pendingClientEmail, 'en');
      if (code) setPendingClientCode(code);
      setLastEmail({ to: pendingClientEmail, subject: "New verification code", body: `Your new code is: ${code || pendingClientCode}`, actionLink: `/verify?type=client`, actionText: "Verify" });
    }
  };

  const getRoomForLead = (leadId: string) => chatRooms.find(r => r.leadId === leadId);
  const getMessagesForRoom = (roomId: string) => chatMessages.filter(m => m.chatRoomId === roomId);
  const clearLastEmail = () => setLastEmail(null);

  return (
    <AppContext.Provider value={{ 
      cleaners, leads, chatRooms, chatMessages, supportRequests, teamMembers, auditLogs,
      userRole, authenticatedCleanerId, isHydrated, isChatOpen, lastEmail,
      pendingClientCode, pendingClientEmail, pendingClientCodeExpires,
      setIsChatOpen, clearLastEmail, loginCleaner, registerCleaner, logout, createLead, 
      acceptLead, sendChatMessage, getRoomForLead, getMessagesForRoom, updateCleanerProfile,
      verifyCleanerCode, resendCleanerCode, resendClientCode, createSupportRequest,
      verifyCleaner, rejectCleaner, deleteCleaner, updateSupportStatus, requestPasswordReset,
      toggleAvailability, updateLead, updateLeadOutcome, searchCleaners, deleteMyAccount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

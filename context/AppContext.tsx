
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  CleanerProfile, CleanerStatus, UserRole, Lead, LeadStatus, Quote, ChatRoom, ChatMessage, CleanerLevel,
  SupportRequest, SupportStatus, TeamMember, AdminRole
} from '../types';
import { canCleanerServeZip } from '../services/locationService';
import { leadLifecycleEngine } from '../services/leadLifecycleEngine';

interface AppContextType {
  cleaners: CleanerProfile[];
  leads: Lead[];
  quotes: Quote[];
  chatRooms: ChatRoom[];
  chatMessages: ChatMessage[];
  supportRequests: SupportRequest[];
  teamMembers: TeamMember[];
  userRole: UserRole;
  authenticatedCleanerId: string | null;
  isHydrated: boolean;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  
  // Marketplace Actions
  registerCleaner: (data: Partial<CleanerProfile>) => Promise<string>;
  loginCleaner: (email: string, password: string) => Promise<CleanerProfile | null>;
  logout: () => void;
  createLead: (lead: Partial<Lead>) => Promise<string>;
  verifyLead: (leadId: string) => void;
  unlockLead: (leadId: string, cleanerId: string) => { success: boolean, error?: string };
  sendQuote: (quote: Partial<Quote>) => void;
  acceptQuote: (quoteId: string) => void;
  updateCleanerProfile: (id: string, data: Partial<CleanerProfile>) => void;
  addCredits: (amount: number) => void;
  
  // Helpers
  searchCleaners: (zip: string, service?: string) => CleanerProfile[];
  getRoomForLead: (leadId: string, cleanerId?: string) => ChatRoom | undefined;
  getMessagesForRoom: (roomId: string) => ChatMessage[];
  sendChatMessage: (roomId: string, text: string, role: 'client' | 'cleaner') => Promise<void>;
  [key: string]: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cleaners, setCleaners] = useState<CleanerProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [teamMembers] = useState<TeamMember[]>([
    { id: 'master-1', fullName: 'Wagner Gois', role: AdminRole.ADMIN_MASTER }
  ]);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.CLIENT);
  const [authenticatedCleanerId, setAuthenticatedCleanerId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Sync state from storage
  const syncFromStorage = () => {
    const safeParse = (key: string, fb: any) => {
      try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : fb; } catch (e) { return fb; }
    };
    setCleaners(safeParse('bc_cleaners', []));
    setLeads(safeParse('bc_leads', []));
    setQuotes(safeParse('bc_quotes', []));
    setChatRooms(safeParse('bc_chat_rooms', []));
    setChatMessages(safeParse('bc_chat_messages', []));
    const authId = localStorage.getItem('bc_auth_cleaner_id');
    if (authId) { setAuthenticatedCleanerId(authId); setUserRole(UserRole.CLEANER); }
  };

  // Persistence
  useEffect(() => {
    syncFromStorage();
    setIsHydrated(true);

    const handleStorageUpdate = (e: any) => {
      syncFromStorage();
    };
    window.addEventListener('bc_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('bc_storage_update', handleStorageUpdate);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('bc_cleaners', JSON.stringify(cleaners));
      localStorage.setItem('bc_leads', JSON.stringify(leads));
      localStorage.setItem('bc_quotes', JSON.stringify(quotes));
      localStorage.setItem('bc_chat_rooms', JSON.stringify(chatRooms));
      localStorage.setItem('bc_chat_messages', JSON.stringify(chatMessages));
    }
  }, [cleaners, leads, quotes, chatRooms, chatMessages, isHydrated]);

  const calculateLeadCost = (service: string, beds: number): number => {
    let base = 16;
    if (service.includes('Deep')) base = 32;
    if (service.includes('Move')) base = 48;
    return Math.min(55, base + (beds * 2));
  };

  const registerCleaner = async (data: Partial<CleanerProfile>): Promise<string> => {
    const id = Math.random().toString(36).substr(2, 9);
    const newCleaner: CleanerProfile = {
      id,
      balance: 100,
      status: CleanerStatus.ACTIVE,
      fullName: data.fullName || '',
      email: data.email || '',
      phone: data.phone || '',
      password: data.password || '',
      city: data.city || '',
      state: data.state || '',
      baseZip: data.baseZip || '',
      zipCodes: data.zipCodes || [data.baseZip || ''],
      serviceRadius: 25,
      services: data.services || ['residential_cleaning'],
      description: data.description || 'Professional cleaner with focus on quality.',
      isAvailable: true,
      rating: 5,
      reviewCount: 0,
      joinedDate: new Date().toISOString(),
      emailVerified: true,
      photoUrl: data.photoUrl || `https://ui-avatars.com/api/?name=${data.fullName}&background=random`,
      galleryUrls: [],
      portfolio: [],
      isListed: true,
      profileCompleted: true,
      points: 100,
      level: CleanerLevel.BRONZE,
      pointHistory: [],
    } as CleanerProfile;
    
    const updated = [...cleaners, newCleaner];
    setCleaners(updated);
    setAuthenticatedCleanerId(id);
    setUserRole(UserRole.CLEANER);
    localStorage.setItem('bc_auth_cleaner_id', id);
    localStorage.setItem('bc_cleaners', JSON.stringify(updated));
    return id;
  };

  const loginCleaner = async (email: string, password: string): Promise<CleanerProfile | null> => {
    const cleaner = cleaners.find(c => c.email === email && c.password === password);
    if (cleaner) {
      setAuthenticatedCleanerId(cleaner.id);
      setUserRole(UserRole.CLEANER);
      localStorage.setItem('bc_auth_cleaner_id', cleaner.id);
      return cleaner;
    }
    return null;
  };

  const createLead = async (l: Partial<Lead>): Promise<string> => {
    const id = Math.random().toString(36).substr(2, 9);
    const cost = calculateLeadCost(l.serviceType || '', l.bedrooms || 0);
    const newLead: Lead = {
      id,
      status: LeadStatus.DRAFT, // AUTHORITY FIX: Start as DRAFT
      leadCost: cost,
      unlockedBy: [],
      createdAt: Date.now(),
      clientName: l.clientName || '',
      clientPhone: l.clientPhone || '',
      clientEmail: l.clientEmail || '',
      zipCode: l.zipCode || '',
      serviceType: l.serviceType || '',
      bedrooms: l.bedrooms || 0,
      bathrooms: l.bathrooms || 0,
      date: l.date || '',
      ...l
    } as Lead;
    
    const updatedLeads = [newLead, ...leads];
    setLeads(updatedLeads);
    localStorage.setItem('bc_leads', JSON.stringify(updatedLeads));
    
    // AUTHORITY FIX: Pass through Engine for initial status move
    await leadLifecycleEngine.transition(id, 'CREATE');
    
    return id;
  };

  const verifyLead = async (leadId: string) => {
    try {
      await leadLifecycleEngine.transition(leadId, 'VERIFY_EMAIL');
      syncFromStorage();
    } catch (err) {
      console.error("Transition failed", err);
    }
  };

  const unlockLead = (leadId: string, cleanerId: string) => {
    try {
       // AUTHORITY FIX: All logic (payment validation, status, chatroom) moved to Engine.
       leadLifecycleEngine.transition(leadId, 'UNLOCK', { proId: cleanerId });
       syncFromStorage();
       return { success: true };
    } catch (err: any) {
       return { success: false, error: err.message };
    }
  };

  const addCredits = (amount: number) => {
    if (!authenticatedCleanerId) return;
    const updated = cleaners.map(c => c.id === authenticatedCleanerId ? { ...c, balance: c.balance + amount } : c);
    setCleaners(updated);
    localStorage.setItem('bc_cleaners', JSON.stringify(updated));
  };

  const sendQuote = async (q: Partial<Quote>) => {
    const quote: Quote = {
      id: Math.random().toString(36).substr(2, 9),
      leadId: q.leadId!,
      cleanerId: q.cleanerId!,
      price: q.price!,
      message: q.message!,
      status: 'PENDING',
      createdAt: Date.now()
    };
    const updatedQuotes = [...quotes, quote];
    setQuotes(updatedQuotes);
    localStorage.setItem('bc_quotes', JSON.stringify(updatedQuotes));
    
    try {
      await leadLifecycleEngine.transition(q.leadId!, 'SEND_QUOTE');
      syncFromStorage();
    } catch (err) {
      console.error(err);
    }
  };

  const acceptQuote = async (quoteId: string) => {
    const q = quotes.find(quote => quote.id === quoteId);
    if (!q) return;

    const updatedQuotes = quotes.map(quote => quote.id === quoteId ? { ...quote, status: 'ACCEPTED' as const } : quote);
    setQuotes(updatedQuotes);
    localStorage.setItem('bc_quotes', JSON.stringify(updatedQuotes));

    try {
      await leadLifecycleEngine.transition(q.leadId, 'ACCEPT_QUOTE');
      syncFromStorage();
    } catch (err) {
      console.error(err);
    }
  };

  const updateCleanerProfile = (id: string, data: Partial<CleanerProfile>) => {
    const updated = cleaners.map(c => c.id === id ? { ...c, ...data } : c);
    setCleaners(updated);
    localStorage.setItem('bc_cleaners', JSON.stringify(updated));
  };

  const getRoomForLead = (leadId: string, cleanerId?: string) => {
     const targetCleanerId = cleanerId || authenticatedCleanerId;
     return chatRooms.find(r => r.leadId === leadId && r.cleanerId === targetCleanerId);
  };

  const getMessagesForRoom = (roomId: string) => chatMessages.filter(m => m.chatRoomId === roomId);

  const sendChatMessage = async (roomId: string, text: string, role: 'client' | 'cleaner') => {
    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      chatRoomId: roomId,
      senderRole: role,
      messageOriginal: text,
      messageTranslated: text,
      createdAt: Date.now()
    };
    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    localStorage.setItem('bc_chat_messages', JSON.stringify(updated));
  };

  return (
    <AppContext.Provider value={{
      cleaners, leads, quotes, chatRooms, chatMessages, supportRequests, teamMembers,
      userRole, authenticatedCleanerId, isHydrated, isChatOpen, setIsChatOpen,
      registerCleaner, loginCleaner, logout: () => { setAuthenticatedCleanerId(null); localStorage.removeItem('bc_auth_cleaner_id'); },
      createLead, verifyLead, unlockLead, sendQuote, acceptQuote, updateCleanerProfile, addCredits,
      searchCleaners: (zip, service) => cleaners.filter(c => c.isListed && canCleanerServeZip(c, zip)),
      getRoomForLead, getMessagesForRoom, sendChatMessage
    }}>
      {children}
    </AppContext.Provider>
  );
};

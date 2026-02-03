
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  CleanerProfile, CleanerStatus, UserRole, Lead, ChatRoom, ChatMessage, CleanerLevel 
} from '../types';
import { translateChatMessage } from '../services/geminiService';

interface AppContextType {
  cleaners: CleanerProfile[];
  leads: Lead[];
  chatRooms: ChatRoom[];
  chatMessages: ChatMessage[];
  userRole: UserRole;
  authenticatedCleanerId: string | null;
  isHydrated: boolean;
  loginCleaner: (email: string, password: string) => Promise<CleanerProfile | null>;
  registerCleaner: (data: Partial<CleanerProfile>) => Promise<string>;
  logout: () => void;
  createLead: (lead: Partial<Lead>) => Promise<void>;
  acceptLead: (leadId: string, cleanerId: string) => void;
  sendChatMessage: (roomId: string, message: string, senderRole: 'client' | 'cleaner') => Promise<void>;
  getRoomForLead: (leadId: string) => ChatRoom | undefined;
  getMessagesForRoom: (roomId: string) => ChatMessage[];
  updateCleanerProfile: (id: string, data: Partial<CleanerProfile>) => void;
  [key: string]: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cleaners, setCleaners] = useState<CleanerProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.CLIENT);
  const [authenticatedCleanerId, setAuthenticatedCleanerId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrate = () => {
      const safeParse = (key: string, fallback: any) => {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : fallback;
        } catch (e) { return fallback; }
      };

      setCleaners(safeParse('bc_cleaners', []));
      setLeads(safeParse('bc_leads', []));
      setChatRooms(safeParse('bc_chat_rooms', []));
      setChatMessages(safeParse('bc_chat_messages', []));
      
      const cleanerId = localStorage.getItem('bc_auth_cleaner_id');
      if (cleanerId) { setAuthenticatedCleanerId(cleanerId); setUserRole(UserRole.CLEANER); }
      setIsHydrated(true);
    };
    hydrate();
  }, []);

  useEffect(() => { 
    if(isHydrated) {
      localStorage.setItem('bc_cleaners', JSON.stringify(cleaners));
      localStorage.setItem('bc_leads', JSON.stringify(leads));
      localStorage.setItem('bc_chat_rooms', JSON.stringify(chatRooms));
      localStorage.setItem('bc_chat_messages', JSON.stringify(chatMessages));
    }
  }, [cleaners, leads, chatRooms, chatMessages, isHydrated]);

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
    const firstName = data.fullName ? data.fullName.split(' ')[0] : 'Profissional';
    
    // Fix: Adding missing serviceRadius property to satisfy the CleanerProfile interface.
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
      status: CleanerStatus.EMAIL_PENDING,
      rating: 5,
      reviewCount: 0,
      joinedDate: new Date().toISOString(),
      emailVerified: false,
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

    // Trigger Welcome Email (Server-side)
    try {
      fetch('/.netlify/functions/sendWelcomeEmail', {
        method: 'POST',
        body: JSON.stringify({
          to: newCleaner.email,
          firstName: firstName
        })
      });
    } catch (e) {
      console.error("Welcome email trigger failed", e);
    }

    return id;
  };

  const logout = () => {
    setAuthenticatedCleanerId(null);
    setUserRole(UserRole.CLIENT);
    localStorage.removeItem('bc_auth_cleaner_id');
  };

  const createLead = async (l: Partial<Lead>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newLead: Lead = { ...l, id, status: 'OPEN', createdAt: Date.now() } as Lead;
    setLeads(prev => [newLead, ...prev]);

    const roomId = `room_${id}`;
    const newRoom: ChatRoom = {
      id: roomId,
      leadId: id,
      clientId: 'anonymous_client',
      cleanerId: '',
      createdAt: Date.now()
    };
    setChatRooms(prev => [...prev, newRoom]);
  };

  const acceptLead = (leadId: string, cleanerId: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? {...l, status: 'ACCEPTED', acceptedByCleanerId: cleanerId} : l));
    setChatRooms(prev => prev.map(r => r.leadId === leadId ? {...r, cleanerId} : r));
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

  const getRoomForLead = (leadId: string) => chatRooms.find(r => r.leadId === leadId);
  const getMessagesForRoom = (roomId: string) => chatMessages.filter(m => m.chatRoomId === roomId);

  const updateCleanerProfile = (id: string, data: Partial<CleanerProfile>) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  return (
    <AppContext.Provider value={{ 
      cleaners, leads, chatRooms, chatMessages, userRole, authenticatedCleanerId, isHydrated,
      loginCleaner, registerCleaner, logout, createLead, acceptLead, sendChatMessage, 
      getRoomForLead, getMessagesForRoom, updateCleanerProfile
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

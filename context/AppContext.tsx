import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CleanerProfile, CleanerStatus, UserRole, Lead, FeedPost, ClientProfile, SupportRequest, SupportStatus, SupportType, Subscription, SubscriptionPlan, PaymentMethodType, Discount, CleanerLevel, BonusCampaign } from '../types';
import { sortCleanersByMerit, addPoints as serviceAddPoints } from '../services/meritService';

// Mock Initial Data
const INITIAL_CLEANERS: CleanerProfile[] = [
  {
    id: 'c1',
    fullName: 'Maria Silva',
    companyName: 'Maria\'s Magic Touch',
    isCompany: true,
    yearsExperience: 10,
    services: ['Deep Clean (Faxina Pesada)', 'Mudança (Move-in/Move-out)', 'Faxina Padrão (Standard Cleaning)'],
    email: 'maria@example.com',
    phone: '(415) 555-0101',
    city: 'San Francisco',
    state: 'CA',
    zipCodes: ['94103', '94105', '94110'],
    status: CleanerStatus.VERIFIED,
    emailVerified: true,
    rating: 4.9,
    reviewCount: 124,
    joinedDate: '2023-05-12',
    description: 'Specialized in deep cleaning and move-in/move-out services. 10 years of experience providing high quality service.',
    photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200',
    galleryUrls: [],
    // MERIT DATA
    points: 1250,
    level: CleanerLevel.GOLD,
    pointHistory: [],
    // EXISTING CLEANERS ARE GRANDFATHERED IN OR HAVE PAID FOR DEMO PURPOSES
    subscription: {
        isActive: true,
        plan: SubscriptionPlan.STANDARD_PRO,
        startDate: '2023-05-12T00:00:00Z',
        nextBillingDate: '2024-05-12T00:00:00Z',
        paymentMethod: PaymentMethodType.CREDIT_CARD,
        lastPaymentAmount: 260.00,
        billingHistory: []
    }
  },
  {
    id: 'c2',
    fullName: 'Joana Santos',
    companyName: 'JS Cleaning Pro',
    isCompany: true,
    yearsExperience: 5,
    services: ['Faxina Padrão (Standard Cleaning)', 'Escritórios (Offices)'],
    email: 'joana@example.com',
    phone: '(415) 555-0102',
    city: 'Daly City',
    state: 'CA',
    zipCodes: ['94015', '94112'],
    status: CleanerStatus.VERIFIED,
    emailVerified: true,
    rating: 4.7,
    reviewCount: 89,
    joinedDate: '2023-08-20',
    description: 'Reliable, efficient, and pet-friendly. Weekly and bi-weekly maintenance.',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    galleryUrls: [],
    // MERIT DATA
    points: 450,
    level: CleanerLevel.SILVER,
    pointHistory: [],
    subscription: {
        isActive: true,
        plan: SubscriptionPlan.PROMO_STARTUP,
        startDate: '2023-08-20T00:00:00Z',
        nextBillingDate: '2024-05-20T00:00:00Z',
        paymentMethod: PaymentMethodType.PAYPAL,
        lastPaymentAmount: 180.00,
        billingHistory: []
    }
  },
  {
    id: 'c3',
    fullName: 'Fernanda Oliveira',
    companyName: 'Nanda Cleans',
    isCompany: false,
    yearsExperience: 2,
    services: ['Faxina Padrão (Standard Cleaning)'],
    email: 'nanda@example.com',
    phone: '(650) 555-0199',
    city: 'San Mateo',
    state: 'CA',
    zipCodes: ['94401', '94402', '94403'],
    status: CleanerStatus.PENDING,
    emailVerified: false,
    rating: 0,
    reviewCount: 0,
    joinedDate: '2023-10-25',
    description: 'New to the platform. Committed to excellence.',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    galleryUrls: [],
    // MERIT DATA
    points: 50,
    level: CleanerLevel.BRONZE,
    pointHistory: [],
    // NO SUBSCRIPTION YET
  }
];

const INITIAL_CAMPAIGNS: BonusCampaign[] = [
    {
        id: 'camp1',
        title: 'Complete Perfil (Complete Profile)',
        description: 'Ganhe pontos completando todos os dados do seu perfil.',
        pointsReward: 50,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
        isActive: true,
        type: 'MANUAL'
    },
    {
        id: 'camp2',
        title: 'Resposta Rápida (Fast Response)',
        description: 'Aceite leads em menos de 10 minutos.',
        pointsReward: 20,
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        isActive: true,
        type: 'LEAD_ACCEPT'
    }
];

const INITIAL_POSTS: FeedPost[] = [
  {
    id: 'p1',
    title: 'Bem-vindo ao Brazilian Clean!',
    content: 'Estamos felizes em ter você aqui. Complete seu perfil para começar a receber leads.',
    date: new Date().toISOString().split('T')[0],
    type: 'ANNOUNCEMENT',
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=400'
  }
];

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  actionLink: string;
  actionText: string;
}

interface AppContextType {
  cleaners: CleanerProfile[];
  clients: ClientProfile[];
  leads: Lead[];
  feedPosts: FeedPost[];
  supportRequests: SupportRequest[];
  bonusCampaigns: BonusCampaign[]; // NEW
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  registerCleaner: (cleaner: Partial<CleanerProfile>) => void;
  registerClient: (client: Partial<ClientProfile>) => void;
  verifyUserEmail: (token: string) => boolean;
  verifyCleaner: (id: string) => void;
  rejectCleaner: (id: string) => void;
  activateSubscription: (id: string, subscription: Subscription) => void;
  applyDiscount: (cleanerId: string, discount: Discount) => void;
  removeDiscount: (cleanerId: string) => void;
  addCleanerPoints: (cleanerId: string, amount: number, reason: string) => void; // NEW
  createBonusCampaign: (campaign: BonusCampaign) => void; // NEW
  toggleBonusCampaign: (id: string) => void; // NEW
  searchCleaners: (zip: string) => CleanerProfile[];
  createLead: (lead: Partial<Lead>) => void;
  acceptLead: (leadId: string, cleanerId: string) => void;
  createFeedPost: (post: Partial<FeedPost>) => void;
  deleteFeedPost: (id: string) => void;
  createSupportRequest: (request: Partial<SupportRequest>) => void;
  updateSupportStatus: (id: string, status: SupportStatus) => void;
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
  lastEmail: EmailNotification | null;
  clearLastEmail: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cleaners, setCleaners] = useState<CleanerProfile[]>(INITIAL_CLEANERS);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(INITIAL_POSTS);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [bonusCampaigns, setBonusCampaigns] = useState<BonusCampaign[]>(INITIAL_CAMPAIGNS);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.CLIENT);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // EMAIL SIMULATION STATE
  const [lastEmail, setLastEmail] = useState<EmailNotification | null>(null);

  // Persistence (Simulated)
  useEffect(() => {
    const storedCleaners = localStorage.getItem('bc_cleaners');
    const storedClients = localStorage.getItem('bc_clients');
    const storedLeads = localStorage.getItem('bc_leads');
    const storedPosts = localStorage.getItem('bc_posts');
    const storedSupport = localStorage.getItem('bc_support');
    const storedCampaigns = localStorage.getItem('bc_campaigns');
    
    if (storedCleaners) { try { setCleaners(JSON.parse(storedCleaners)); } catch (e) { console.error(e); } }
    if (storedClients) { try { setClients(JSON.parse(storedClients)); } catch (e) { console.error(e); } }
    if (storedLeads) { try { setLeads(JSON.parse(storedLeads)); } catch (e) { console.error(e); } }
    if (storedPosts) { try { setFeedPosts(JSON.parse(storedPosts)); } catch (e) { console.error(e); } }
    if (storedSupport) { try { setSupportRequests(JSON.parse(storedSupport)); } catch (e) { console.error(e); } }
    if (storedCampaigns) { try { setBonusCampaigns(JSON.parse(storedCampaigns)); } catch (e) { console.error(e); } }
  }, []);

  useEffect(() => { localStorage.setItem('bc_cleaners', JSON.stringify(cleaners)); }, [cleaners]);
  useEffect(() => { localStorage.setItem('bc_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('bc_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('bc_posts', JSON.stringify(feedPosts)); }, [feedPosts]);
  useEffect(() => { localStorage.setItem('bc_support', JSON.stringify(supportRequests)); }, [supportRequests]);
  useEffect(() => { localStorage.setItem('bc_campaigns', JSON.stringify(bonusCampaigns)); }, [bonusCampaigns]);

  // --- AUTOMATED EMAIL SYSTEM ---
  const sendVerificationEmail = (email: string, name: string, token: string, role: UserRole) => {
    const verifyLink = `/verify?token=${token}`;
    
    if (role === UserRole.CLEANER) {
      setLastEmail({
        to: email,
        subject: 'Confirmação de Email - Brazilian Clean',
        body: `Olá ${name}, bem-vindo(a) ao Brazilian Clean! Para ativar sua conta e começar a receber leads, por favor confirme seu email. Seu perfil ficará pendente de aprovação após a confirmação.`,
        actionLink: verifyLink,
        actionText: 'Confirmar Meu Email'
      });
    } else {
      setLastEmail({
        to: email,
        subject: 'Verify your email - Brazilian Clean',
        body: `Hi ${name}, welcome to Brazilian Clean! We connect you with trusted professionals. Please verify your email to secure your account.`,
        actionLink: verifyLink,
        actionText: 'Verify Email'
      });
    }
  };

  const sendLevelChangeNotification = (cleaner: CleanerProfile, oldLevel: CleanerLevel, newLevel: CleanerLevel, isUpgrade: boolean) => {
    const title = isUpgrade 
        ? `Parabéns! Você subiu para o nível ${newLevel} 🏆`
        : `Atenção: Seu nível mudou para ${newLevel}`;
    
    const body = isUpgrade
        ? `Olá ${cleaner.fullName},\n\nSeu excelente trabalho foi recompensado! Você atingiu o nível ${newLevel}.\n\nIsso significa que você agora tem prioridade no recebimento de leads Express Match.\n\nContinue assim!`
        : `Olá ${cleaner.fullName},\n\nNotamos uma mudança na sua pontuação recente. Seu nível atual é ${newLevel}.\n\nPara recuperar seu status anterior, continue aceitando leads e recebendo boas avaliações.`;

    setLastEmail({
        to: cleaner.email,
        subject: title,
        body: body,
        actionLink: '/dashboard',
        actionText: 'Ver Meu Painel'
    });
  };

  const sendSupportConfirmationEmail = (request: SupportRequest) => {
    if (request.type === SupportType.CLIENT) {
        setLastEmail({
            to: request.contactEmail || 'No Email Provided',
            subject: 'We received your support request',
            body: `Hello,\n\nThank you for contacting Brazilian Clean.\n\nWe have received your support request and our team is already reviewing it.\n\nOne of our team members will contact you within 24 hours using the information you provided.\n\nAt Brazilian Clean, we work only with verified house cleaners and we are committed to trust, honesty, and quality service.\n\nThank you for trusting our platform.\n\nBrazilian Clean Support Team`,
            actionLink: '/',
            actionText: 'Return to Home'
        });
    } else {
        // Cleaner Support Email - Uses default mock email if whatsapp is primary
        setLastEmail({
            to: request.whatsapp || request.contactPhone,
            subject: 'Recebemos sua solicitação de suporte',
            body: `Olá,\n\nRecebemos sua solicitação de suporte na plataforma Brazilian Clean.\n\nNossa equipe já foi notificada e irá entrar em contato com você pelo WhatsApp informado.\n\nO prazo de retorno é de até 24 horas.\n\nEstamos à disposição para te orientar e ajudar no que for necessário.\n\nEquipe de Suporte\nBrazilian Clean`,
            actionLink: '/dashboard',
            actionText: 'Voltar ao Painel'
        });
    }
  };

  const registerCleaner = (data: Partial<CleanerProfile>) => {
    const token = Math.random().toString(36).substr(2) + Date.now().toString(36);
    const newCleaner: CleanerProfile = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: data.fullName || '',
      phone: data.phone || '',
      email: data.email || '',
      city: data.city || '',
      state: data.state || '',
      companyName: data.companyName || '',
      isCompany: !!data.isCompany,
      yearsExperience: data.yearsExperience || 0,
      services: data.services || [],
      zipCodes: data.zipCodes || [],
      description: data.description || '',
      status: CleanerStatus.PENDING,
      emailVerified: false,
      verificationToken: token,
      rating: 0,
      reviewCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      photoUrl: data.photoUrl || 'https://via.placeholder.com/200',
      galleryUrls: data.galleryUrls || [],
      documentUrl: data.documentUrl,
      selfieUrl: data.selfieUrl,
      // Default Merit
      points: 0,
      level: CleanerLevel.BRONZE,
      pointHistory: []
    };
    setCleaners(prev => [...prev, newCleaner]);
    sendVerificationEmail(newCleaner.email, newCleaner.fullName, token, UserRole.CLEANER);
  };

  const registerClient = (data: Partial<ClientProfile>) => {
    // Check if exists
    const existing = clients.find(c => c.email === data.email);
    if (existing) return;

    const token = Math.random().toString(36).substr(2) + Date.now().toString(36);
    const newClient: ClientProfile = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: data.fullName || 'Client',
      email: data.email || '',
      phone: data.phone || '',
      emailVerified: false,
      verificationToken: token,
      joinedDate: new Date().toISOString().split('T')[0]
    };
    setClients(prev => [...prev, newClient]);
    sendVerificationEmail(newClient.email, newClient.fullName, token, UserRole.CLIENT);
  };

  const verifyUserEmail = (token: string): boolean => {
    let verified = false;

    // Check Cleaners
    const cleanerIndex = cleaners.findIndex(c => c.verificationToken === token);
    if (cleanerIndex !== -1) {
      const updatedCleaners = [...cleaners];
      updatedCleaners[cleanerIndex].emailVerified = true;
      updatedCleaners[cleanerIndex].verificationToken = undefined; // consume token
      setCleaners(updatedCleaners);
      verified = true;
    }

    // Check Clients
    const clientIndex = clients.findIndex(c => c.verificationToken === token);
    if (clientIndex !== -1) {
      const updatedClients = [...clients];
      updatedClients[clientIndex].emailVerified = true;
      updatedClients[clientIndex].verificationToken = undefined; // consume token
      setClients(updatedClients);
      verified = true;
    }

    return verified;
  };

  const verifyCleaner = (id: string) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, status: CleanerStatus.VERIFIED } : c));
  };

  const rejectCleaner = (id: string) => {
    setCleaners(prev => prev.map(c => c.id === id ? { ...c, status: CleanerStatus.REJECTED } : c));
  };

  const activateSubscription = (id: string, subscription: Subscription) => {
      setCleaners(prev => prev.map(c => 
          c.id === id 
            ? { ...c, subscription: subscription } 
            : c
      ));
  };
  
  const applyDiscount = (cleanerId: string, discount: Discount) => {
      setCleaners(prev => prev.map(c => {
          if (c.id !== cleanerId) return c;
          
          // If no existing subscription, create a placeholder one to attach the discount
          if (!c.subscription) {
              return {
                  ...c,
                  subscription: {
                      isActive: false, // Still inactive until paid/activated, but discount is ready
                      plan: SubscriptionPlan.PROMO_STARTUP,
                      startDate: '',
                      nextBillingDate: '',
                      paymentMethod: PaymentMethodType.CREDIT_CARD, // Placeholder
                      lastPaymentAmount: 0,
                      activeDiscount: discount,
                      billingHistory: []
                  }
              };
          }

          return {
              ...c,
              subscription: {
                  ...c.subscription,
                  activeDiscount: discount
              }
          };
      }));
  };

  const removeDiscount = (cleanerId: string) => {
      setCleaners(prev => prev.map(c => 
          c.id === cleanerId && c.subscription
            ? { ...c, subscription: { ...c.subscription, activeDiscount: undefined } } 
            : c
      ));
  };

  // MERIT SYSTEM FUNCTIONS
  const addCleanerPoints = (cleanerId: string, amount: number, reason: string) => {
      setCleaners(prev => prev.map(c => {
          if(c.id !== cleanerId) return c;
          const updated = serviceAddPoints(c, amount, reason);
          
          // CHECK FOR LEVEL CHANGE & ALERT
          if (updated.level !== c.level) {
             const levelValue = { [CleanerLevel.BRONZE]: 1, [CleanerLevel.SILVER]: 2, [CleanerLevel.GOLD]: 3 };
             const isUpgrade = levelValue[updated.level] > levelValue[c.level];
             sendLevelChangeNotification(updated, c.level, updated.level, isUpgrade);
          }
          
          return updated;
      }));
  };

  const createBonusCampaign = (campaign: BonusCampaign) => {
      setBonusCampaigns(prev => [campaign, ...prev]);
  };

  const toggleBonusCampaign = (id: string) => {
      setBonusCampaigns(prev => prev.map(c => c.id === id ? {...c, isActive: !c.isActive} : c));
  };

  // UPDATED SEARCH: Returns cleaners who are VERIFIED AND have an ACTIVE SUBSCRIPTION, SORTED BY MERIT
  const searchCleaners = (zip: string) => {
    const verifiedAndPaid = cleaners.filter(c => 
        c.status === CleanerStatus.VERIFIED && 
        c.subscription?.isActive && // MUST BE PAID
        c.zipCodes.includes(zip)
    );
    // Sort logic from meritService
    return sortCleanersByMerit(verifiedAndPaid);
  };

  const createLead = (leadData: Partial<Lead>) => {
    const newLead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      clientName: leadData.clientName || 'Anonymous',
      clientPhone: leadData.clientPhone || '',
      clientEmail: leadData.clientEmail || '',
      zipCode: leadData.zipCode || '',
      serviceType: leadData.serviceType || 'Standard',
      bedrooms: leadData.bedrooms || 1,
      bathrooms: leadData.bathrooms || 1,
      date: leadData.date || new Date().toISOString(),
      status: 'OPEN',
      createdAt: Date.now()
    };
    setLeads(prev => [newLead, ...prev]);
    
    // Register client if email is provided
    if (leadData.clientEmail) {
        registerClient({
            fullName: leadData.clientName,
            email: leadData.clientEmail,
            phone: leadData.clientPhone
        });
    }
  };

  const acceptLead = (leadId: string, cleanerId: string) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { ...lead, status: 'ACCEPTED', acceptedByCleanerId: cleanerId } 
        : lead
    ));
    
    // Award Merit Points for Accepting Lead
    addCleanerPoints(cleanerId, 5, 'Accepted Express Match Lead');
  };

  const createFeedPost = (postData: Partial<FeedPost>) => {
    const newPost: FeedPost = {
      id: Math.random().toString(36).substr(2, 9),
      title: postData.title || 'Announcement',
      content: postData.content || '',
      date: new Date().toISOString().split('T')[0],
      type: postData.type || 'ANNOUNCEMENT',
      imageUrl: postData.imageUrl
    };
    setFeedPosts(prev => [newPost, ...prev]);
  };

  const deleteFeedPost = (id: string) => {
    setFeedPosts(prev => prev.filter(p => p.id !== id));
  };

  const createSupportRequest = (requestData: Partial<SupportRequest>) => {
      const newRequest: SupportRequest = {
          id: Math.random().toString(36).substr(2, 9),
          type: requestData.type || SupportType.CLIENT,
          fullName: requestData.fullName || 'User',
          contactEmail: requestData.contactEmail,
          contactPhone: requestData.contactPhone || '',
          whatsapp: requestData.whatsapp,
          message: requestData.message || '',
          status: SupportStatus.NEW,
          createdAt: new Date().toISOString()
      };
      setSupportRequests(prev => [newRequest, ...prev]);
      sendSupportConfirmationEmail(newRequest);
  };

  const updateSupportStatus = (id: string, status: SupportStatus) => {
      setSupportRequests(prev => prev.map(req => 
          req.id === id 
            ? { ...req, status: status, resolvedAt: status === SupportStatus.RESOLVED ? new Date().toISOString() : undefined } 
            : req
      ));
  };

  const clearLastEmail = () => setLastEmail(null);

  return (
    <AppContext.Provider value={{ 
      cleaners, 
      clients,
      leads,
      feedPosts,
      supportRequests,
      bonusCampaigns,
      userRole, 
      setUserRole, 
      registerCleaner,
      registerClient,
      verifyUserEmail,
      verifyCleaner, 
      rejectCleaner,
      activateSubscription,
      applyDiscount,
      removeDiscount,
      addCleanerPoints,
      createBonusCampaign,
      toggleBonusCampaign,
      searchCleaners,
      createLead,
      acceptLead,
      createFeedPost,
      deleteFeedPost,
      createSupportRequest,
      updateSupportStatus,
      isChatOpen,
      setIsChatOpen,
      lastEmail,
      clearLastEmail
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
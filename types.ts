
export enum UserRole {
  CLIENT = 'CLIENT',
  CLEANER = 'CLEANER',
  ADMIN = 'ADMIN'
}

export enum AdminRole {
  ADMIN_MASTER = 'ADMIN_MASTER',
  ADMIN = 'ADMIN',
  SUPPORT = 'SUPPORT',
  AUDITOR = 'AUDITOR'
}

export enum CleanerStatus {
  CREATED = 'CREATED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING',
  ACTIVE = 'ACTIVE',
  LIMITED = 'LIMITED',
  REJECTED = 'REJECTED'
}

export enum LeadStatus {
  DRAFT = 'DRAFT',
  VERIFYING = 'VERIFYING',
  VERIFIED = 'VERIFIED',
  MATCHING = 'MATCHING', // New
  WAVE_1 = 'WAVE_1',
  WAVE_2 = 'WAVE_2',
  OPEN = 'OPEN',
  UNLOCKED = 'UNLOCKED',
  QUOTED = 'QUOTED',
  ACCEPTED = 'ACCEPTED',
  CONFIRMED = 'CONFIRMED', // New
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED', // New
  REFUNDED = 'REFUNDED', // New
  LOST = 'LOST',
  CANCELLED = 'CANCELLED'
}

// Added Support Status for Admin tracking
export enum SupportStatus {
  NEW = 'NEW',
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

// Added Support Type for routing
export enum SupportType {
  CLIENT = 'CLIENT',
  CLEANER = 'CLEANER'
}

export interface Quote {
  id: string;
  leadId: string;
  cleanerId: string;
  price: number;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: number;
}

export interface Lead {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  zipCode: string;
  serviceType: string;
  bedrooms: number;
  bathrooms: number;
  date: string;
  status: LeadStatus;
  leadCost: number; // What the pro pays to unlock
  unlockedBy: string[]; // List of cleaner IDs who paid
  acceptedByCleanerId?: string;
  createdAt: number;
  completedAt?: number;
  broadcastToIds?: string[];
  context?: {
    origin?: 'Express Match' | 'Direct Search';
  };
  estimatedValue?: number;
  internalNotes?: string;
}

// Verification result type for Identity checks
export interface AiVerificationResult {
  verification_status: 'LIKELY_VALID' | 'NEEDS_MANUAL_REVIEW' | 'LIKELY_FRAUD';
  confidence_score: number;
  summary: string;
  user_reason_pt?: string;
  user_instruction_pt?: string;
}

// Point transaction for merit system
export interface PointTransaction {
  id: string;
  amount: number;
  reason: string;
  date: string;
  campaignId?: string;
}

export interface CleanerProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  password?: string;
  
  // Wallet
  balance: number; // Credits/Dollars available to buy leads
  
  city: string;
  state: string;
  address?: string;
  companyName: string;
  isCompany: boolean;
  yearsExperience: number;
  baseZip: string;
  serviceRadius: number;
  zipCodes: string[];
  
  services: string[];
  description: string;
  
  status: CleanerStatus;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  joinedDate: string;
  emailVerified: boolean;
  
  photoUrl: string;
  logoUrl?: string; // NOVO CAMPO
  galleryUrls: string[];
  portfolio: PortfolioItem[];
  
  isListed: boolean;
  profileCompleted: boolean;
  
  documentFrontUrl?: string;
  documentBackUrl?: string;
  facePhotoUrl?: string;
  selfieWithDocUrl?: string;
  
  points: number;
  level: CleanerLevel;

  // Added missing fields for enterprise and merit features
  ein?: string;
  pointHistory: PointTransaction[];
  notificationSettings?: {
    newLeads: boolean;
    newMessages: boolean;
  };
  aiVerificationResult?: AiVerificationResult;
}

export enum CleanerLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD'
}

export interface PortfolioItem {
  id: string;
  serviceType: string;
  beforeImage: string;
  afterImage: string;
  description?: string;
  createdAt: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
}

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  actionLink: string;
  actionText: string;
}

export interface ChatRoom {
  id: string;
  leadId: string;
  clientId: string;
  cleanerId: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderRole: 'client' | 'cleaner';
  messageOriginal: string;
  messageTranslated: string;
  createdAt: number;
}

// Support Request type for institutional assistance
export interface SupportRequest {
  id: string;
  type: SupportType;
  fullName: string;
  contactEmail?: string;
  contactPhone: string;
  whatsapp?: string;
  message: string;
  status: SupportStatus;
  createdAt: number;
}

// Team Member type for Governance
export interface TeamMember {
  id: string;
  fullName: string;
  role: AdminRole;
}

// Payment and Subscription types for Pro plans
export enum SubscriptionPlan {
  PROMO_STARTUP = 'PROMO_STARTUP',
  STANDARD_PRO = 'STANDARD_PRO'
}

export enum PaymentMethodType {
  STRIPE = 'STRIPE',
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD'
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FULL_EXEMPTION = 'FULL_EXEMPTION'
}

export interface Discount {
  type: DiscountType;
  value: number;
  startDate: string;
  endDate: string;
}

export interface Subscription {
  isActive: boolean;
  plan: SubscriptionPlan;
  startDate: string;
  nextBillingDate: string;
  paymentMethod: PaymentMethodType;
  lastPaymentAmount: number;
  activeDiscount?: Discount;
  billingHistory: {
    date: string;
    amount: number;
    status: 'PAID' | 'EXEMPTED' | 'FAILED';
  }[];
}

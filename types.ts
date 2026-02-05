
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
  // Onboarding Flow
  CREATED = 'CREATED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING',

  // Operational Statuses
  ACTIVE = 'ACTIVE',
  LIMITED = 'LIMITED',
  REJECTED = 'REJECTED'
}

export enum SupportStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED'
}

export enum SupportType {
  CLIENT = 'CLIENT',
  CLEANER = 'CLEANER'
}

export interface AiVerificationResult {
  verification_status: "LIKELY_VALID" | "NEEDS_MANUAL_REVIEW" | "LIKELY_FRAUD";
  confidence_score: number;
  summary?: string;
  user_reason_pt?: string;
  user_instruction_pt?: string;
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
  languageOriginal: 'en' | 'pt';
  messageTranslated: string;
  languageTarget: 'en' | 'pt';
  createdAt: number;
}

export interface Lead {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  zipCode: string;
  serviceType: string;
  bedrooms: number;
  bathrooms: number;
  date: string;
  status: 'NEW' | 'OPEN' | 'ASSIGNED' | 'COMPLETED' | 'UNASSIGNED' | 'LOST' | 'CANCELLED';
  acceptedByCleanerId?: string;
  createdAt: number;
  completedAt?: number;
  broadcastToIds?: string[];
  context?: {
    viewedPortfolio?: boolean;
    portfolioCount?: number;
    origin?: 'Express Match' | 'Direct Search';
  };
  estimatedValue?: number;
  internalNotes?: string;
  review?: { rating: number; comment: string; };
  history?: { timestamp: number; event: string; note?: string }[];
}

export interface CleanerProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  password?: string;
  
  // Location & Business
  city: string;
  state: string;
  address?: string; // Added per schema
  companyName: string;
  isCompany: boolean; // Individual vs LLC
  ein?: string; // Added per schema (LLC only)
  yearsExperience: number;
  baseZip: string;
  serviceRadius: number;
  zipCodes: string[];
  
  // Service Details
  services: string[];
  description: string;
  
  // System Status
  status: CleanerStatus;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  joinedDate: string;
  emailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: number;
  
  // Media / Assets
  photoUrl: string;
  galleryUrls: string[];
  portfolio: PortfolioItem[];
  
  // Flags
  isListed: boolean;
  profileCompleted: boolean;
  
  // KYC
  documentFrontUrl?: string;
  documentBackUrl?: string;
  facePhotoUrl?: string;
  selfieWithDocUrl?: string;
  aiVerificationResult?: AiVerificationResult;
  
  // Gamification & Billing
  subscription?: Subscription;
  points: number;
  level: CleanerLevel;
  pointHistory: PointTransaction[];
  notificationCount?: number;
  notificationSettings?: {
    newLeads: boolean;
    newMessages: boolean;
  };
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
  adminNote?: string;
}

export interface ClientProfile {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  phone: string;
  emailVerified: boolean;
  verificationCode?: string;
  joinedDate: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  actionLink: string;
  actionText: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetId?: string;
  targetType?: 'CLEANER' | 'CLIENT' | 'TEAM_MEMBER';
  timestamp: string;
  details: string;
}

export interface SupportRequest {
  id: string;
  type: SupportType;
  fullName: string;
  contactEmail?: string;
  contactPhone: string;
  whatsapp?: string;
  message: string;
  status: SupportStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  status: 'ACTIVE' | 'SUSPENDED';
  lastLogin?: string;
  permissions: any;
}

export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  PIX = 'PIX',
  STRIPE = 'STRIPE'
}

export enum SubscriptionPlan {
  PROMO_STARTUP = 'PROMO_STARTUP',
  STANDARD_PRO = 'STANDARD_PRO'
}

export enum DiscountType {
  FULL_EXEMPTION = 'FULL_EXEMPTION',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENTAGE = 'PERCENTAGE'
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
  billingHistory: any[];
}

export interface PointTransaction {
  id: string;
  amount: number;
  reason: string;
  date: string;
  campaignId?: string;
}

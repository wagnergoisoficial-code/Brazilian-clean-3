
export enum UserRole {
  CLIENT = 'CLIENT',
  CLEANER = 'CLEANER',
  ADMIN = 'ADMIN'
}

export enum CleanerStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
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

// Payment & Subscription Types
export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  ADMIN_EXEMPTION = 'ADMIN_EXEMPTION' // For full exemptions
}

export enum SubscriptionPlan {
  PROMO_STARTUP = 'PROMO_STARTUP', // First 2 months ($180)
  STANDARD_PRO = 'STANDARD_PRO'   // Month 3+ ($260)
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FULL_EXEMPTION = 'FULL_EXEMPTION'
}

// MERIT SYSTEM TYPES
export enum CleanerLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD'
}

export interface PointTransaction {
  id: string;
  amount: number;
  reason: string; // e.g., "Review 5 stars", "Complete Profile", "Admin Bonus"
  date: string;
  campaignId?: string;
  adminId?: string;
}

export interface BonusCampaign {
  id: string;
  title: string;
  description: string;
  pointsReward: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  type: 'MANUAL' | 'LEAD_ACCEPT' | 'JOB_COMPLETE' | 'REVIEW_5_STAR';
}

export interface Discount {
  id: string;
  type: DiscountType;
  value: number; // 0-100 for PERCENTAGE, amount for FIXED_AMOUNT
  description: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Subscription {
  isActive: boolean;
  plan: SubscriptionPlan;
  startDate: string;
  nextBillingDate: string;
  paymentMethod: PaymentMethodType;
  lastPaymentAmount: number;
  activeDiscount?: Discount; // New field for active discount
  billingHistory: {
    date: string;
    amount: number;
    status: 'PAID' | 'FAILED' | 'EXEMPTED';
  }[];
}

export interface SupportRequest {
  id: string;
  type: SupportType;
  fullName: string;
  contactEmail?: string; // For Clients
  contactPhone: string;
  whatsapp?: string; // For Cleaners
  message: string;
  status: SupportStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface CleanerProfile {
  id: string;
  fullName: string;
  // Personal
  phone: string;
  email: string;
  city: string;
  state: string;
  
  // Business
  companyName: string;
  isCompany: boolean;
  yearsExperience: number;
  services: string[];
  zipCodes: string[];
  description: string;
  
  // System
  status: CleanerStatus;
  rating: number;
  reviewCount: number;
  joinedDate: string;
  
  // Security & Verification
  emailVerified: boolean;
  verificationToken?: string;
  
  // Media / Docs
  photoUrl: string;
  galleryUrls: string[];
  documentUrl?: string; 
  selfieUrl?: string; 
  
  // Billing
  subscription?: Subscription;

  // Merit System
  points: number;
  level: CleanerLevel;
  pointHistory: PointTransaction[];
}

export interface ClientProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  verificationToken?: string;
  joinedDate: string;
}

export interface Lead {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string; // Added email to lead
  zipCode: string;
  serviceType: string;
  bedrooms: number;
  bathrooms: number;
  date: string;
  status: 'OPEN' | 'ACCEPTED' | 'COMPLETED';
  acceptedByCleanerId?: string;
  createdAt: number;
}

export interface FeedPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  date: string;
  type: 'EVENT' | 'ANNOUNCEMENT' | 'TRAINING';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

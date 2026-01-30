
export enum UserRole {
  CLIENT = 'CLIENT',
  CLEANER = 'CLEANER',
  ADMIN = 'ADMIN'
}

export enum CleanerStatus {
  EMAIL_PENDING = 'EMAIL_PENDING',
  BUSINESS_PENDING = 'BUSINESS_PENDING',
  DOCUMENTS_PENDING = 'DOCUMENTS_PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
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

export enum PaymentMethodType {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  ADMIN_EXEMPTION = 'ADMIN_EXEMPTION'
}

export enum SubscriptionPlan {
  PROMO_STARTUP = 'PROMO_STARTUP',
  STANDARD_PRO = 'STANDARD_PRO'
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FULL_EXEMPTION = 'FULL_EXEMPTION'
}

export enum CleanerLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD'
}

export interface PointTransaction {
  id: string;
  amount: number;
  reason: string;
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
  value: number;
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
  activeDiscount?: Discount;
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
  contactEmail?: string;
  contactPhone: string;
  whatsapp?: string;
  message: string;
  status: SupportStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface AiVerificationResult {
  verification_status: "LIKELY_VALID" | "NEEDS_MANUAL_REVIEW" | "LIKELY_FRAUD";
  confidence_score: number;
  detected_issues: string[];
  summary: string;
  recommended_action: "Approve" | "Review" | "Reject";
  timestamp: string;
  // User-friendly feedback fields
  user_reason_pt?: string;
  user_instruction_pt?: string;
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

export interface CleanerProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  companyName: string;
  isCompany: boolean;
  yearsExperience: number;
  services: string[];
  zipCodes: string[];
  description: string;
  status: CleanerStatus;
  rating: number;
  reviewCount: number;
  joinedDate: string;
  emailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: number;
  photoUrl: string;
  galleryUrls: string[];
  portfolio: PortfolioItem[];
  // Extended Verification Assets
  documentFrontUrl?: string;
  documentBackUrl?: string;
  facePhotoUrl?: string;
  selfieWithDocUrl?: string;
  aiVerificationResult?: AiVerificationResult;
  subscription?: Subscription;
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
  verificationCode?: string;
  joinedDate: string;
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
  status: 'OPEN' | 'ACCEPTED' | 'COMPLETED';
  acceptedByCleanerId?: string;
  createdAt: number;
  context?: {
    viewedPortfolio?: boolean;
    portfolioCount?: number;
  };
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

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  actionLink: string;
  actionText: string;
}

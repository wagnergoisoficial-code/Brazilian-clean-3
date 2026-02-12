
import { PaymentMethodType, Subscription, SubscriptionPlan, Discount, DiscountType, CleanerProfile } from "../types";

export const calculateSubscriptionPrice = (plan: SubscriptionPlan, discount?: Discount): number => {
  let basePrice = plan === SubscriptionPlan.PROMO_STARTUP ? 180 : 260;
  if (!discount) return basePrice;
  const now = new Date();
  const start = new Date(discount.startDate);
  const end = new Date(discount.endDate);
  if (now < start || now > end) return basePrice;
  if (discount.type === DiscountType.FULL_EXEMPTION) return 0;
  if (discount.type === DiscountType.FIXED_AMOUNT) return Math.max(0, basePrice - discount.value);
  if (discount.type === DiscountType.PERCENTAGE) return Math.max(0, basePrice * (1 - discount.value / 100));
  return basePrice;
};

export const processSubscriptionPayment = async (
  cleanerId: string,
  method: PaymentMethodType,
  currentSubscription?: Subscription,
  forceAmount?: number
): Promise<Subscription> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const plan = currentSubscription?.plan || SubscriptionPlan.PROMO_STARTUP;
  let amount = forceAmount !== undefined ? forceAmount : calculateSubscriptionPrice(plan, currentSubscription?.activeDiscount);
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);
  return {
    isActive: true,
    plan: plan,
    startDate: currentSubscription?.startDate || now.toISOString(),
    nextBillingDate: nextMonth.toISOString(),
    paymentMethod: method,
    lastPaymentAmount: amount,
    activeDiscount: currentSubscription?.activeDiscount,
    billingHistory: [
      ...(currentSubscription?.billingHistory || []),
      { date: now.toISOString(), amount: amount, status: amount === 0 ? 'EXEMPTED' : 'PAID' }
    ]
  };
};

export const checkSubscriptionStatus = (currentSub: Subscription): Subscription => {
  if (!currentSub.isActive) return currentSub;
  const start = new Date(currentSub.startDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  if (diffDays > 60 && currentSub.plan === SubscriptionPlan.PROMO_STARTUP) {
    return { ...currentSub, plan: SubscriptionPlan.STANDARD_PRO, lastPaymentAmount: 260.00 };
  }
  if (currentSub.activeDiscount) {
    const end = new Date(currentSub.activeDiscount.endDate);
    if (now > end) return { ...currentSub, activeDiscount: undefined };
  }
  return currentSub;
};

export const mockPaymentService = {
  calculateSubscriptionPrice,
  processSubscriptionPayment,
  checkSubscriptionStatus,
  charge: async (proId: string, amount: number): Promise<boolean> => {
    const cleanersRaw = localStorage.getItem('bc_cleaners');
    if (!cleanersRaw) return false;
    const cleaners = JSON.parse(cleanersRaw);
    const index = cleaners.findIndex((c: CleanerProfile) => c.id === proId);
    if (index === -1) return false;
    if (cleaners[index].balance < amount) throw new Error("Insufficient funds");
    
    cleaners[index].balance -= amount;
    localStorage.setItem('bc_cleaners', JSON.stringify(cleaners));
    window.dispatchEvent(new CustomEvent('bc_storage_update', { detail: { type: 'cleaners' } }));
    return true;
  },
  refund: async (proId: string, amount: number): Promise<boolean> => {
    const cleanersRaw = localStorage.getItem('bc_cleaners');
    if (!cleanersRaw) return false;
    const cleaners = JSON.parse(cleanersRaw);
    const index = cleaners.findIndex((c: CleanerProfile) => c.id === proId);
    if (index === -1) return false;
    
    cleaners[index].balance += amount;
    localStorage.setItem('bc_cleaners', JSON.stringify(cleaners));
    window.dispatchEvent(new CustomEvent('bc_storage_update', { detail: { type: 'cleaners' } }));
    return true;
  }
};

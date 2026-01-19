
import { PaymentMethodType, Subscription, SubscriptionPlan, Discount, DiscountType } from "../types";

// Helper to calculate price based on plan and active discount
export const calculateSubscriptionPrice = (plan: SubscriptionPlan, discount?: Discount): number => {
  let basePrice = plan === SubscriptionPlan.PROMO_STARTUP ? 180 : 260;

  if (!discount) return basePrice;

  // Check Expiration
  const now = new Date();
  const start = new Date(discount.startDate);
  const end = new Date(discount.endDate);

  if (now < start || now > end) {
    return basePrice; // Discount expired or not started
  }

  if (discount.type === DiscountType.FULL_EXEMPTION) {
    return 0;
  }

  if (discount.type === DiscountType.FIXED_AMOUNT) {
    return Math.max(0, basePrice - discount.value);
  }

  if (discount.type === DiscountType.PERCENTAGE) {
    return Math.max(0, basePrice * (1 - discount.value / 100));
  }

  return basePrice;
};

// Simulates a secure payment gateway processing
// Returns a Promise that resolves to a Subscription object or throws an error
export const processSubscriptionPayment = async (
  cleanerId: string,
  method: PaymentMethodType,
  currentSubscription?: Subscription, // Optional existing sub to check for discounts
  forceAmount?: number // Optional override amount
): Promise<Subscription> => {
  
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Determine Plan
  const plan = currentSubscription?.plan || SubscriptionPlan.PROMO_STARTUP;
  
  // Calculate Amount
  let amount = forceAmount !== undefined 
    ? forceAmount 
    : calculateSubscriptionPrice(plan, currentSubscription?.activeDiscount);

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);

  // Return formatted subscription object
  return {
    isActive: true,
    plan: plan,
    startDate: currentSubscription?.startDate || now.toISOString(),
    nextBillingDate: nextMonth.toISOString(),
    paymentMethod: method,
    lastPaymentAmount: amount,
    activeDiscount: currentSubscription?.activeDiscount, // Persist discount if active
    billingHistory: [
      ...(currentSubscription?.billingHistory || []),
      {
        date: now.toISOString(),
        amount: amount,
        status: amount === 0 ? 'EXEMPTED' : 'PAID'
      }
    ]
  };
};

// Logic to check if price should increase to $260
export const checkSubscriptionStatus = (currentSub: Subscription): Subscription => {
  if (!currentSub.isActive) return currentSub;

  const start = new Date(currentSub.startDate);
  const now = new Date();
  
  // Calculate difference in months
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  // If active for more than 60 days (2 months), upgrade plan
  if (diffDays > 60 && currentSub.plan === SubscriptionPlan.PROMO_STARTUP) {
    return {
      ...currentSub,
      plan: SubscriptionPlan.STANDARD_PRO,
      lastPaymentAmount: 260.00
    };
  }
  
  // Auto-remove expired discount from the object (cleanup)
  if (currentSub.activeDiscount) {
    const end = new Date(currentSub.activeDiscount.endDate);
    if (now > end) {
      return {
        ...currentSub,
        activeDiscount: undefined
      };
    }
  }

  return currentSub;
};

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  discountApplied: number;
  finalTotal: number;
  couponUsed?: string;
  timestamp: Date;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  isUsed: boolean;
  expiresAt: Date;
  orderIndexTriggered: number; // The order number that triggered this coupon
}

export interface Stats {
  itemsPurchased: number; // Total units purchased
  revenue: number; // Total revenue (after discounts)
  discountCodes: string[]; // List of all generated coupon codes
  totalDiscountsGiven: number; // Sum of all discounts applied
  totalOrdersCount: number; // Total number of completed orders
  isCouponGenerationEligible: boolean; // Can the admin generate a coupon now?
  eligibleCouponsCount: number; // How many coupons are eligible to be generated
  ordersNeededForNextCoupon: number; // Orders needed to reach the next coupon milestone
}

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  
  // Every N-th order triggers coupon eligibility
  DISCOUNT_N: process.env.DISCOUNT_N ? parseInt(process.env.DISCOUNT_N, 10) : 5,
  
  // Discount percentage applied by generated coupons
  DISCOUNT_PERCENT: process.env.DISCOUNT_PERCENT ? parseInt(process.env.DISCOUNT_PERCENT, 10) : 10,
  
  // Expiration of coupon in days (Jersey number 7)
  COUPON_EXPIRY_DAYS: process.env.COUPON_EXPIRY_DAYS ? parseInt(process.env.COUPON_EXPIRY_DAYS, 10) : 7,
  
  // Admin token required in "x-admin-token" header
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || 'super-secret-admin-token',
};

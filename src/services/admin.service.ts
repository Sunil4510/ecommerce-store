import crypto from 'crypto';
import { config } from '../config.js';
import { StoreRepository } from '../repository.js';
import { Coupon, Stats } from '../types.js';

export class AdminService {
  private repo = StoreRepository.getInstance();

  /**
   * Generates a new unique milestone discount coupon code if eligible.
   * Sets a 7-day expiration time and randomizes the suffix.
   */
  public generateCoupon(): Coupon {
    const orders = this.repo.getOrders();
    const totalOrders = orders.length;
    const n = config.DISCOUNT_N;

    // 1. Calculate unlocked milestones
    const totalUnlockedMilestonesCount = Math.floor(totalOrders / n);
    const generatedMilestones = this.repo.getMilestones();

    // 2. Identify the lowest milestone index (e.g. 5, 10, 15) that needs a coupon generated
    let targetMilestone = 0;
    for (let i = 1; i <= totalUnlockedMilestonesCount; i++) {
      const milestoneIndex = i * n;
      if (!generatedMilestones.has(milestoneIndex)) {
        targetMilestone = milestoneIndex;
        break;
      }
    }

    // 3. Throw error if not eligible
    if (targetMilestone === 0) {
      throw new Error(
        `Coupon generation not eligible. Current orders: ${totalOrders}. Next milestone is at ${
          (totalUnlockedMilestonesCount + 1) * n
        } orders.`
      );
    }

    // 4. Mark milestone as generated in the repository
    this.repo.addMilestone(targetMilestone);

    // 5. Generate unique code with random suffix
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `DISCOUNT-ORD${targetMilestone}-${randomSuffix}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.COUPON_EXPIRY_DAYS); // Jersey #7 days

    const newCoupon: Coupon = {
      code,
      discountPercent: config.DISCOUNT_PERCENT,
      isUsed: false,
      expiresAt,
      orderIndexTriggered: targetMilestone,
    };

    // 6. Save and return
    this.repo.saveCoupon(newCoupon);
    return newCoupon;
  }

  /**
   * Compiles current e-commerce performance statistics and coupon eligibility indicators.
   */
  public getStats(): Stats {
    const orders = this.repo.getOrders();
    const coupons = this.repo.getCoupons();
    const generatedMilestones = this.repo.getMilestones();

    const totalOrdersCount = orders.length;
    const n = config.DISCOUNT_N;

    // Total units purchased (sum of item quantities)
    const itemsPurchased = orders.reduce((sum, order) => {
      const orderQuantity = order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      return sum + orderQuantity;
    }, 0);

    // Total revenue (sum of final order totals after discounts)
    const revenue = parseFloat(orders.reduce((sum, order) => sum + order.finalTotal, 0).toFixed(2));

    // List of generated coupons
    const discountCodes = coupons.map(c => c.code);

    // Total discounts given
    const totalDiscountsGiven = parseFloat(
      orders.reduce((sum, order) => sum + order.discountApplied, 0).toFixed(2)
    );

    // Dynamic checks for the dashboard:
    const totalUnlockedMilestonesCount = Math.floor(totalOrdersCount / n);
    const generatedCount = generatedMilestones.size;

    const eligibleCouponsCount = totalUnlockedMilestonesCount - generatedCount;
    const isCouponGenerationEligible = eligibleCouponsCount > 0;

    // Calculate orders needed for the next milestone
    const nextMilestone = (totalUnlockedMilestonesCount + 1) * n;
    const ordersNeededForNextCoupon = nextMilestone - totalOrdersCount;

    return {
      itemsPurchased,
      revenue,
      discountCodes,
      totalDiscountsGiven,
      totalOrdersCount,
      isCouponGenerationEligible,
      eligibleCouponsCount,
      ordersNeededForNextCoupon,
    };
  }
}

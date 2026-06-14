import crypto from 'crypto';
import { StoreRepository } from '../repository.js';
import { Order, Coupon, Cart } from '../types.js';

export class CheckoutService {
  private repo = StoreRepository.getInstance();

  /**
   * Processes cart checkout. Applies coupon discounts, validates limits,
   * creates an Order, consumes the coupon, and clears the cart.
   */
  public checkout(cartId: string, couponCode?: string): Order {
    // 1. Fetch Cart
    const cart = this.repo.getCart(cartId);
    if (!cart) {
      throw new Error(`Cart with ID '${cartId}' not found.`);
    }

    if (cart.items.length === 0) {
      throw new Error('Cannot checkout an empty cart.');
    }

    // 2. Recalculate subtotal using live catalog prices to prevent price tampering
    this.recalculateCartSubtotal(cart);

    let discountApplied = 0;
    let couponToUpdate: Coupon | undefined;

    // 3. Process Coupon Code if supplied
    if (couponCode) {
      const formattedCode = couponCode.toUpperCase();
      const coupon = this.repo.getCoupon(formattedCode);
      if (!coupon) {
        throw new Error(`Invalid discount code: '${couponCode}' does not exist.`);
      }

      if (coupon.isUsed) {
        throw new Error(`Invalid discount code: '${couponCode}' has already been used.`);
      }

      if (coupon.expiresAt.getTime() < Date.now()) {
        throw new Error(`Invalid discount code: '${couponCode}' has expired.`);
      }

      // Calculate discount value based on subtotal
      discountApplied = parseFloat(((cart.subtotal * coupon.discountPercent) / 100).toFixed(2));
      couponToUpdate = coupon;
    }

    const finalTotal = parseFloat((cart.subtotal - discountApplied).toFixed(2));

    // 4. Create and Save Order
    const orderId = `ord_${crypto.randomUUID()}`;
    const order: Order = {
      id: orderId,
      items: JSON.parse(JSON.stringify(cart.items)), // Deep clone items to isolate order state
      subtotal: cart.subtotal,
      discountApplied,
      finalTotal,
      couponUsed: couponToUpdate?.code,
      timestamp: new Date(),
    };

    // 5. Commit state changes
    this.repo.saveOrder(order);
    if (couponToUpdate) {
      couponToUpdate.isUsed = true;
      this.repo.saveCoupon(couponToUpdate);
    }
    this.repo.deleteCart(cartId);

    return order;
  }

  /**
   * Recalculates cart subtotal using live product catalog data
   */
  private recalculateCartSubtotal(cart: Cart): void {
    cart.subtotal = cart.items.reduce((sum, item) => {
      const liveProduct = this.repo.getProduct(item.product.id);
      const price = liveProduct ? liveProduct.price : item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }
}

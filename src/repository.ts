import crypto from 'crypto';
import { config } from './config.js';
import { Product, Cart, CartItem, Order, Coupon, Stats } from './types.js';

export class StoreRepository {
  private static instance: StoreRepository;

  private products = new Map<string, Product>();
  private carts = new Map<string, Cart>();
  private orders: Order[] = [];
  private coupons = new Map<string, Coupon>();

  // Tracks the order index milestones for which coupons have already been generated
  private generatedMilestones = new Set<number>();

  private constructor() {
    this.seedProducts();
  }

  public static getInstance(): StoreRepository {
    if (!StoreRepository.instance) {
      StoreRepository.instance = new StoreRepository();
    }
    return StoreRepository.instance;
  }

  /**
   * Reset the store repository state (useful for automated testing)
   */
  public reset() {
    this.products.clear();
    this.carts.clear();
    this.orders = [];
    this.coupons.clear();
    this.generatedMilestones.clear();
    this.seedProducts();
  }

  private seedProducts() {
    const defaultProducts: Product[] = [
      { id: 'prod_1', name: 'Premium Wireless Headphones', price: 150 },
      { id: 'prod_2', name: 'Mechanical Gaming Keyboard', price: 100 },
      { id: 'prod_3', name: 'Ergonomic Wireless Mouse', price: 60 },
      { id: 'prod_4', name: '4K UltraHD Monitor 27"', price: 350 },
      { id: 'prod_5', name: 'USB-C Multiport Adapter Hub', price: 40 },
    ];
    for (const prod of defaultProducts) {
      this.products.set(prod.id, prod);
    }
  }

  // --- Product Operations ---
  public getProducts(): Product[] {
    return Array.from(this.products.values());
  }

  public getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  // --- Cart Operations ---
  public getCart(id: string): Cart | undefined {
    return this.carts.get(id);
  }

  public createCart(): Cart {
    const cartId = `cart_${crypto.randomUUID()}`;
    const newCart: Cart = {
      id: cartId,
      items: [],
      subtotal: 0,
    };
    this.carts.set(cartId, newCart);
    return newCart;
  }

  public addToCart(cartId: string | undefined, productId: string, quantity: number): Cart {
    // 1. Validate quantity
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error('Quantity must be a positive integer greater than or equal to 1.');
    }

    // 2. Fetch/Create cart
    let cart: Cart;
    if (cartId) {
      const existing = this.carts.get(cartId);
      if (!existing) {
        throw new Error(`Cart with ID '${cartId}' not found.`);
      }
      cart = existing;
    } else {
      cart = this.createCart();
    }

    // 3. Verify product
    const product = this.products.get(productId);
    if (!product) {
      throw new Error(`Product with ID '${productId}' not found in catalog.`);
    }

    // 4. Update cart items
    const existingItem = cart.items.find(item => item.product.id === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product, quantity });
    }

    // 5. Recalculate subtotal
    this.recalculateCartSubtotal(cart);
    return cart;
  }

  private recalculateCartSubtotal(cart: Cart) {
    cart.subtotal = cart.items.reduce((sum, item) => {
      // Always look up the live price from catalog to prevent client tampering
      const liveProduct = this.products.get(item.product.id);
      const price = liveProduct ? liveProduct.price : item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }

  // --- Coupon Operations ---
  public getCoupon(code: string): Coupon | undefined {
    return this.coupons.get(code.toUpperCase());
  }

  public getCoupons(): Coupon[] {
    return Array.from(this.coupons.values());
  }

  /**
   * Generates a new single-use discount coupon code if there is an eligible milestone order
   * that hasn't had a coupon generated yet.
   */
  public generateCoupon(): Coupon {
    const totalOrders = this.orders.length;
    const n = config.DISCOUNT_N;

    // 1. Calculate how many milestones have been unlocked based on order count
    const totalUnlockedMilestonesCount = Math.floor(totalOrders / n);

    // 2. Find the lowest milestone index (e.g., 5, 10, 15) that hasn't been generated yet
    let targetMilestone = 0;
    for (let i = 1; i <= totalUnlockedMilestonesCount; i++) {
      const milestoneIndex = i * n;
      if (!this.generatedMilestones.has(milestoneIndex)) {
        targetMilestone = milestoneIndex;
        break;
      }
    }

    if (targetMilestone === 0) {
      throw new Error(
        `Coupon generation not eligible. Current orders: ${totalOrders}. Next milestone is at ${
          (totalUnlockedMilestonesCount + 1) * n
        } orders.`
      );
    }

    // 3. Mark milestone as generated
    this.generatedMilestones.add(targetMilestone);

    // 4. Create new coupon code (e.g., DISCOUNT-ORD5-8F3A)
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

    this.coupons.set(code, newCoupon);
    return newCoupon;
  }

  // --- Checkout / Order Operations ---
  public checkout(cartId: string, couponCode?: string): Order {
    // 1. Fetch Cart
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new Error(`Cart with ID '${cartId}' not found.`);
    }

    if (cart.items.length === 0) {
      throw new Error('Cannot checkout an empty cart.');
    }

    // 2. Recalculate to ensure prices are fresh
    this.recalculateCartSubtotal(cart);

    let discountApplied = 0;
    let couponToUpdate: Coupon | undefined;

    // 3. Process Coupon Code if provided
    if (couponCode) {
      const formattedCode = couponCode.toUpperCase();
      const coupon = this.coupons.get(formattedCode);
      if (!coupon) {
        throw new Error(`Invalid discount code: '${couponCode}' does not exist.`);
      }

      if (coupon.isUsed) {
        throw new Error(`Invalid discount code: '${couponCode}' has already been used.`);
      }

      if (coupon.expiresAt.getTime() < Date.now()) {
        throw new Error(`Invalid discount code: '${couponCode}' has expired.`);
      }

      // Compute discount (discountPercent is config value, e.g. 10 for 10%)
      discountApplied = parseFloat(((cart.subtotal * coupon.discountPercent) / 100).toFixed(2));
      couponToUpdate = coupon;
    }

    const finalTotal = parseFloat((cart.subtotal - discountApplied).toFixed(2));

    // 4. Create and Save Order
    const orderId = `ord_${crypto.randomUUID()}`;
    const order: Order = {
      id: orderId,
      items: JSON.parse(JSON.stringify(cart.items)), // Deep copy items
      subtotal: cart.subtotal,
      discountApplied,
      finalTotal,
      couponUsed: couponToUpdate?.code,
      timestamp: new Date(),
    };

    // Commit changes: Save order, Consume coupon (if used), Delete cart
    this.orders.push(order);
    if (couponToUpdate) {
      couponToUpdate.isUsed = true;
      this.coupons.set(couponToUpdate.code, couponToUpdate);
    }
    this.carts.delete(cartId);

    return order;
  }

  // --- Stats Operations ---
  public getStats(): Stats {
    const totalOrdersCount = this.orders.length;
    const n = config.DISCOUNT_N;

    // Total units purchased
    const itemsPurchased = this.orders.reduce((sum, order) => {
      const orderItemsCount = order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      return sum + orderItemsCount;
    }, 0);

    // Total revenue (after discounts)
    const revenue = parseFloat(this.orders.reduce((sum, order) => sum + order.finalTotal, 0).toFixed(2));

    // List of generated coupons
    const discountCodes = Array.from(this.coupons.keys());

    // Total discounts given
    const totalDiscountsGiven = parseFloat(
      this.orders.reduce((sum, order) => sum + order.discountApplied, 0).toFixed(2)
    );

    // Dynamic checks for the dashboard:
    const totalUnlockedMilestonesCount = Math.floor(totalOrdersCount / n);
    const generatedCount = this.generatedMilestones.size;

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
